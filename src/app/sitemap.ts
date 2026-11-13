import type {MetadataRoute} from 'next';import { publicContent } from '@/lib/content';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=process.env.SITE_URL||'http://localhost:3000';const p=await publicContent('projects');return['','/projets','/services','/expertises','/a-propos','/contact',...p.map(i=>'/projets/'+i.slug)].map(route=>({url:base+route}));}
