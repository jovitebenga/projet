import { notFound } from 'next/navigation';
import Link from 'next/link';
import { publicContent } from '@/lib/content';
import { Button,LightboxGallery,ArrowLeft,ArrowUpRight } from '@/components/ui';
import { FilmStrip } from '@/components/cinema';
import { CaseSlides } from '@/components/project-showcase';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const p=(await publicContent('projects')).find(p=>p.slug===slug);return{title:p?.title||'Projet introuvable',description:p?.summary,openGraph:{title:p?.title,description:p?.summary}};}
export default async function Project({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const projects=await publicContent('projects');const p=projects.find(p=>p.slug===slug);if(!p)notFound();
 const isUx=(p.categories||[]).some((c:string)=>/ux|ui|web/i.test(c));const gallery=Array.isArray(p.gallery)?p.gallery:[];
 const services=[['01','Brief et découverte','Comprendre votre projet et vos besoins.'],['02','Stratégie et direction','Définir une direction adaptée à vos objectifs.'],['03','Création des supports','Donner forme à votre identité et à vos expériences.'],['04','Suivi et évolution','Faire vivre votre projet dans la durée.']];
 return <article className={'case-study case-redesign '+(isUx?'case-ux':'case-communication')}>
  <section className="case-banner"><img src={p.cover} alt="" fetchPriority="high"/><div className="case-banner-shade"/><div className="container case-banner-content"><Link href="/projets" className="case-back"><ArrowLeft size={18}/> Mes projets / <span>{p.title}</span></Link><div><p className="eyebrow">{(p.categories||[]).join(' · ')||'Projet créatif'}</p><h1>{p.title}</h1><p>{p.summary}</p>{p.demo&&<span className="case-demo-note">Concept à personnaliser</span>}</div></div></section>
  <section className="container case-overview"><div><p className="case-small">Description du projet</p><h2>{isUx?p.title:'Communication digitale'}</h2><p>{p.context||p.summary||'Présentation du projet à compléter.'}</p>{p.objectives&&<p>{p.objectives}</p>}{p.approach&&<p className="preserve-lines">{p.approach}</p>}</div><aside><p className="case-work-label">Travail fait</p>{p.deliverables?<p className="case-work-text">{p.deliverables}</p>:<p className="case-work-text">Les détails de cette réalisation seront bientôt disponibles.</p>}{p.role&&<p className="case-work-text">{p.role}</p>}</aside></section>
  {isUx&&gallery.length>0&&<section className="container case-ux-slides" aria-label="Écrans du projet"><CaseSlides images={gallery}/></section>}
  {gallery.length>0&&<section className="case-project-gallery" aria-label="Galerie du projet"><LightboxGallery images={gallery}/></section>}
  {p.video&&<section className="container case-film"><video src={p.video} controls preload="metadata" className="case-video"/></section>}
  {(p.results||p.year||p.client)&&<section className="container case-details"><p>{p.results}</p><p>{[p.client,p.year].filter(Boolean).join(' · ')}</p></section>}
  <section className="container section case-process"><div className="section-heading"><div><p className="eyebrow">Construisons ensemble</p><h2>Comment puis-je vous accompagner ?</h2></div><Link className="text-link" href="/services">Tous les services <ArrowUpRight size={18}/></Link></div><div>{services.map(([number,title,description])=><Link href="/services" className="case-process-row" key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div><ArrowUpRight size={20}/></Link>)}</div></section>
  {projects.length>1&&<section className="case-related"><div className="container section-heading"><h2>Mes autres projets</h2><Button href="/contact" secondary>Parlons de votre projet</Button></div><FilmStrip projects={projects.filter(x=>x.id!==p.id)}/></section>}
 </article>;
}
