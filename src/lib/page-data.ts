import { publicContent } from './content';
export async function pageData(slug:string){return(await publicContent('pages')).find(p=>p.slug===slug)||{title:slug,description:''};}
export async function pageMetadata(slug:string){const p=await pageData(slug);return{title:{absolute:p.seoTitle||p.title+' — Jovite Benga'},description:p.seoDescription||p.description};}
