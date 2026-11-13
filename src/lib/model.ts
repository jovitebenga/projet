import { z } from 'zod';
export const kinds = ['projects','services','packages','pages','profile','settings'] as const;
export type Kind = typeof kinds[number];
export type Json = null | boolean | number | string | Json[] | { [key:string]: Json };
export type Content = { id:string; kind:Kind; slug:string; draft:Record<string,any>; published:Record<string,any>|null; archived:boolean; position:number; updated_at:string };
export type Media = {id:string;name:string;alt:string;mime:string;bytes:number;path:string;created_at:string};
export type Inquiry = {id:string;name:string;email:string;phone:string;company:string;intent:string;service:string;budget:string;message:string;status:string;notes:string;history:any[];created_at:string};
export const safeLink = (value: string) => /^(\/(?!\/)|https:\/\/|mailto:|tel:)/.test(value);
const forbidden = new Set(['__proto__','prototype','constructor']);
export function checkDocument(value: unknown, depth=0): void {
  if(depth>18) throw new Error('Document trop imbriqué.');
  if(typeof value==='string' && value.length>50000) throw new Error('Texte trop long.');
  if(Array.isArray(value)){if(value.length>500) throw new Error('Trop d’éléments.');value.forEach(v=>checkDocument(v,depth+1));}
  else if(value && typeof value==='object') for(const [key,v] of Object.entries(value)) {
    if(forbidden.has(key)) throw new Error('Champ interdit.');
    if(/^(href|url|image|cover|cv|portrait|emailLink|video|whatsapp|linkedin)$/i.test(key) && typeof v==='string' && v && !safeLink(v)) throw new Error('Lien non autorisé : '+key);
    checkDocument(v,depth+1);
  }
}
export const contentSchema = z.object({id:z.string().uuid().optional(),kind:z.enum(kinds),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),draft:z.record(z.string(),z.any()),position:z.number().int().min(0).max(10000).default(0),expectedUpdatedAt:z.string().optional()});
export const inquirySchema=z.object({name:z.string().trim().min(2).max(120),email:z.email().max(254),phone:z.string().max(40).default(''),company:z.string().max(150).default(''),intent:z.enum(['projet','recrutement','collaboration']),service:z.string().max(150).default(''),budget:z.string().max(100).default(''),message:z.string().trim().min(20).max(6000),consent:z.literal(true),website:z.string().max(0),startedAt:z.number(),token:z.string().max(3000).optional()});
export function publicationError(item:Content):string|null {
  if(item.kind==='projects' && (!item.draft.editorialApproved || !item.draft.rightsApproved)) return 'Validez le contenu éditorial et les droits du projet avant publication.';
  if(item.draft.locale==='en' && !item.draft.translationApproved) return 'La traduction anglaise doit être relue et approuvée.';
  if(!item.draft.title && !['profile','settings'].includes(item.kind)) return 'Le titre est requis.';
  return null;
}
export function formatPrice(data:Record<string,any>) {
  if(data.priceMode==='quote' || data.amount===null || data.amount===undefined || data.amount==='') return 'Sur devis';
  const n=Number(data.amount); if(!Number.isFinite(n)||n<0) return 'Sur devis';
  return (data.priceMode==='from'?'À partir de ':'')+new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(n)+' '+(data.currency==='EUR'?'€':'FCFA')+(data.unit?' / '+data.unit:'');
}
