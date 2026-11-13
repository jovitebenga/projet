import { publicContent,siteData } from '@/lib/content';
import { PageBlocks } from '@/components/blocks';
export async function generateMetadata(){const p=(await publicContent('pages')).find(p=>p.slug==='accueil');return{title:{absolute:p?.seoTitle||'Jovite Benga — Portfolio'},description:p?.seoDescription};}
export default async function Home(){const [pages,projects,services,{profile}]=await Promise.all([publicContent('pages'),publicContent('projects'),publicContent('services'),siteData()]);const home=pages.find(p=>p.slug==='accueil');return home?<PageBlocks content={home.content} data={{projects,services,profile}}/>:<section className="container section"><h1>Le portfolio se prépare.</h1><p>La sélection sera bientôt disponible.</p></section>;}
