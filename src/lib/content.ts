import { randomUUID } from 'node:crypto';
import { db } from './local-db';
import { isLocal,isPreview,supabase } from './supabase';
import { checkDocument,contentSchema,publicationError,type Content,type Kind,type Media,type Inquiry } from './model';
function unpack(row:any):Content{return {...row,draft:typeof row.draft==='string'?JSON.parse(row.draft):row.draft,published:typeof row.published==='string'?JSON.parse(row.published):row.published,archived:!!row.archived};}
export async function allContent(kind?:Kind):Promise<Content[]>{
 if(isLocal()){const rows=kind?db().prepare('SELECT * FROM content_items WHERE kind=? ORDER BY position,updated_at DESC').all(kind):db().prepare('SELECT * FROM content_items ORDER BY position,updated_at DESC').all();return rows.map(unpack);}
 let query=(await supabase()).from('content_items').select('*').order('position');if(kind)query=query.eq('kind',kind);const {data,error}=await query;if(error)throw error;return (data||[]).map(unpack);
}
export async function publicContent(kind:Kind):Promise<any[]>{
 if(isLocal())return(await allContent(kind)).filter(i=>!i.archived&&(i.published||isPreview())).map(i=>({...((i.published||i.draft)),id:i.id,slug:i.slug,kind:i.kind}));
 const {data,error}=await(await supabase()).from('published_content').select('*').eq('kind',kind).order('position');if(error)throw error;return(data||[]).map((i:any)=>({...i,...i.published,id:i.id,slug:i.slug,kind:i.kind}));
}
export async function byId(id:string){if(isLocal()){const row=db().prepare('SELECT * FROM content_items WHERE id=?').get(id);return row?unpack(row):null;}const {data,error}=await(await supabase()).from('content_items').select('*').eq('id',id).maybeSingle();if(error)throw error;return data?unpack(data):null;}
export async function saveContent(input:unknown){
 const data=contentSchema.parse(input);checkDocument(data.draft);if(JSON.stringify(data.draft).length>500000)throw new Error('Contenu trop volumineux.');
 const current=data.id?await byId(data.id):null;
 if(current&&data.expectedUpdatedAt&&current.updated_at!==data.expectedUpdatedAt)throw new Error('Ce contenu a été modifié ailleurs. Rechargez avant d’enregistrer.');
 const row={id:data.id||randomUUID(),kind:data.kind,slug:data.slug,draft:data.draft,position:data.position,updated_at:new Date().toISOString()};
 if(isLocal()) {const d=db();d.exec('BEGIN IMMEDIATE');try{if(current){d.prepare('INSERT INTO page_versions VALUES(?,?,?,?)').run(randomUUID(),current.id,JSON.stringify(current.draft),new Date().toISOString());d.prepare('UPDATE content_items SET kind=?,slug=?,draft=?,position=?,updated_at=? WHERE id=?').run(row.kind,row.slug,JSON.stringify(row.draft),row.position,row.updated_at,row.id);}else d.prepare('INSERT INTO content_items(id,kind,slug,draft,position,updated_at) VALUES(?,?,?,?,?,?)').run(row.id,row.kind,row.slug,JSON.stringify(row.draft),row.position,row.updated_at);d.exec('COMMIT');}catch(e){d.exec('ROLLBACK');throw e;}}
 else {const c=await supabase();const {error}=await c.rpc('save_content',{p_id:row.id,p_kind:row.kind,p_slug:row.slug,p_draft:row.draft,p_position:row.position,p_expected:data.expectedUpdatedAt||null});if(error)throw error;}
 return await byId(row.id);
}
export async function mutateContent(id:string,action:string){
 const row=await byId(id);if(!row)throw new Error('Contenu introuvable.');
 if(action==='duplicate')return saveContent({kind:row.kind,slug:row.slug+'-copie-'+randomUUID().slice(0,6),draft:{...row.draft,title:(row.draft.title||row.slug)+' — copie',editorialApproved:false,rightsApproved:false},position:row.position+1});
 if(action==='publish'){const error=publicationError(row);if(error)throw new Error(error);}
 if(!['publish','unpublish','archive','restore','delete'].includes(action))throw new Error('Action inconnue.');
 if(action==='delete'&&row.published)throw new Error('Dépubliez le contenu avant de le supprimer.');
 if(isLocal()){
 const d=db();if(action==='delete'){d.exec('BEGIN');try{d.prepare('DELETE FROM page_versions WHERE content_id=?').run(id);d.prepare('DELETE FROM content_items WHERE id=?').run(id);d.exec('COMMIT');}catch(e){d.exec('ROLLBACK');throw e;}}
 else if(action==='publish')d.prepare('UPDATE content_items SET published=draft,archived=0,updated_at=? WHERE id=?').run(new Date().toISOString(),id);
 else if(action==='unpublish')d.prepare('UPDATE content_items SET published=NULL,updated_at=? WHERE id=?').run(new Date().toISOString(),id);
 else d.prepare('UPDATE content_items SET archived=?,updated_at=? WHERE id=?').run(action==='archive'?1:0,new Date().toISOString(),id);
 }else{const c=await supabase();const query=action==='delete'?c.from('content_items').delete().eq('id',id):c.from('content_items').update({...action==='publish'?{published:row.draft,archived:false}:action==='unpublish'?{published:null}:{archived:action==='archive'},updated_at:new Date().toISOString()}).eq('id',id);const {error}=await query;if(error)throw error;}
 return action==='delete'?{ok:true}:byId(id);
}
export async function versions(id:string){if(isLocal())return db().prepare('SELECT * FROM page_versions WHERE content_id=? ORDER BY created_at DESC LIMIT 50').all(id).map((r:any)=>({...r,data:JSON.parse(r.data)}));const{data,error}=await(await supabase()).from('page_versions').select('*').eq('content_id',id).order('created_at',{ascending:false}).limit(50);if(error)throw error;return data||[];}
export async function listMedia():Promise<Media[]>{if(isLocal())return db().prepare('SELECT * FROM media_library ORDER BY created_at DESC').all().map(row=>({...row})) as unknown as Media[];const {data,error}=await(await supabase()).from('media_library').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[];}
export async function listInquiries():Promise<Inquiry[]>{if(isLocal())return db().prepare('SELECT * FROM quote_requests ORDER BY created_at DESC').all().map((i:any)=>({...i,history:JSON.parse(i.history)}));const {data,error}=await(await supabase()).from('quote_requests').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[];}
export async function updateInquiry(id:string,status:string,notes:string){
 if(!['nouveau','en-cours','devis-envoye','gagne','perdu','archive'].includes(status)||notes.length>20000)throw new Error('Valeur invalide.');
 if(isLocal()){const d=db();const row=d.prepare('SELECT history,status FROM quote_requests WHERE id=?').get(id) as any;if(!row)throw new Error('Demande introuvable.');const history=JSON.parse(row.history);history.push({at:new Date().toISOString(),status,note:'Mise à jour administrateur'});d.prepare('UPDATE quote_requests SET status=?,notes=?,history=? WHERE id=?').run(status,notes,JSON.stringify(history),id);}
 else {const {error}=await(await supabase()).rpc('update_inquiry',{p_id:id,p_status:status,p_notes:notes});if(error)throw error;}
}
export async function siteData(){const [profile,settings]=await Promise.all([publicContent('profile'),publicContent('settings')]);return {profile:profile[0]||{},settings:settings[0]||{}};}
