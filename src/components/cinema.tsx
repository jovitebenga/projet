'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react';

const ease = [.22, 1, .36, 1] as const;
export function Magnetic({children,className=''}:{children:ReactNode;className?:string}) {
  const reduced=useReducedMotion();const x=useSpring(0,{stiffness:180,damping:18});const y=useSpring(0,{stiffness:180,damping:18});
  function move(e:PointerEvent<HTMLDivElement>){if(reduced||e.pointerType!=='mouse')return;const r=e.currentTarget.getBoundingClientRect();x.set((e.clientX-r.left-r.width/2)*.12);y.set((e.clientY-r.top-r.height/2)*.15);}
  return <motion.div className={'magnetic '+className} style={{x,y}} onPointerMove={move} onPointerLeave={()=>{x.set(0);y.set(0)}}>{children}</motion.div>;
}
export function PortraitScene({image,alt,className='',children}:{image:string;alt:string;className?:string;children?:ReactNode}) {
  const reduced=useReducedMotion();const x=useSpring(0,{stiffness:55,damping:20});const y=useSpring(0,{stiffness:55,damping:20});
  return <div className={'portrait-scene '+className} onPointerMove={e=>{if(reduced||e.pointerType!=='mouse')return;const r=e.currentTarget.getBoundingClientRect();x.set((e.clientX-r.left-r.width/2)*.014);y.set((e.clientY-r.top-r.height/2)*.014)}} onPointerLeave={()=>{x.set(0);y.set(0)}}><motion.img style={{x,y,scale:reduced?1:1.035}} src={image} alt={alt} loading="lazy"/>{children}</div>;
}
export function CinemaHero({greeting,title,role,description,image,foregroundImage}:any) {
  const ref=useRef<HTMLElement>(null);const reduced=useReducedMotion();const {scrollYProgress}=useScroll({target:ref,offset:['start start','end start']});const y=useTransform(scrollYProgress,[0,1],[0,100]);
  return <section ref={ref} className="cinema-hero">
    <motion.img className="cinema-hero-image" style={{y:reduced?0:y}} src={image} alt="" aria-hidden="true"/>
    <motion.img className="cinema-hero-portrait" src={foregroundImage} alt="Portrait de Jovite Benga" fetchPriority="high" initial={reduced?false:{opacity:0,scale:1.025}} animate={{opacity:1,scale:1}} transition={{duration:1.1}}/>
    <div className="cinema-hero-shade"/>
    <div className="container cinema-hero-content"><motion.div initial={reduced?false:{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.9,ease}} className="cinema-hero-copy">
      <p className="hero-greeting">{greeting}</p><h1>{String(title).split(' ').map((part:string,i:number)=><span key={i}>{part}</span>)}</h1><p className="cinema-role">{role}</p>{description&&<p className="cinema-description">{description}</p>}
      <div className="button-row"><Magnetic><Link className="button" href="/projets">Explorer mes projets<ArrowUpRight size={18}/></Link></Magnetic><Link className="cinema-secondary" href="/a-propos">Faisons connaissance<ArrowUpRight size={16}/></Link></div>
    </motion.div><div className="hero-footnote"><span>Direction artistique · Design · Digital</span><a href="#selection">Défiler pour explorer <span aria-hidden>↓</span></a></div></div>
  </section>;
}

export function CinemaGallery({projects}:{projects:any[]}) {
  const router=useRouter();const [index,setIndex]=useState(0);const reduced=useReducedMotion();const drag=useRef<{x:number;y:number}|null>(null);const moved=useRef(false);const [width,setWidth]=useState(0);const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const el=ref.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setWidth(entry.contentRect.width));observer.observe(el);return()=>observer.disconnect()},[]);
  const count=projects.length;const active=projects[Math.min(index,Math.max(0,count-1))];
  function select(n:number){setIndex((n+count)%count)}
  function end(e:PointerEvent){if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;moved.current=Math.abs(dx)>15;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))select(index+(dx<0?1:-1));drag.current=null;}
  if(!count)return <p className="empty">Les projets seront bientôt présentés ici.</p>;
  const spacing=(width||900)<600?148:255;
  return <div className="cinema-gallery" ref={ref} role="region" aria-roledescription="carrousel" aria-label="Galerie des projets" tabIndex={0} onFocus={()=>setWidth(ref.current?.clientWidth||900)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select(index+(e.key==='ArrowRight'?1:-1))}}}>
    <div className="cinema-ambient" aria-hidden><AnimatePresence initial={false}><motion.img key={active.id} src={active.cover} alt="" initial={{opacity:0}} animate={{opacity:.24}} exit={{opacity:0}} transition={{duration:reduced?0:.6}}/></AnimatePresence></div>
    <div className="cinema-stage" onPointerDown={e=>{setWidth(e.currentTarget.clientWidth);drag.current={x:e.clientX,y:e.clientY};moved.current=false}} onPointerUp={end} onPointerCancel={()=>{drag.current=null}}>
      {projects.map((p,i)=>{let distance=(i-index+count)%count;if(distance>count/2)distance-=count;const a=Math.abs(distance);return <motion.button key={p.id} className={'cinema-poster '+(a===0?'is-active':'')} aria-label={(a===0?'Découvrir ':'Sélectionner ')+p.title} aria-pressed={a===0} tabIndex={a>2?-1:0} initial={false} animate={{x:distance*spacing,rotateY:reduced?0:distance===0?0:distance>0?-32:32,scale:a===0?1:a===1?.84:.68,opacity:a>2?0:a===0?1:a===1?.68:.3,z:a===0?50:-a*80}} transition={{duration:reduced?0:.75,ease}} style={{zIndex:10-a,pointerEvents:a>2?'none':'auto'}} onClick={()=>{if(moved.current)return;if(i===index)router.push('/projets/'+p.slug);else select(i)}}>
        <img src={p.cover} alt="" draggable={false}/><span className="cinema-poster-shade"/><span className="poster-topline"><span>{p.demo?'Exploration':(p.categories||[])[0]}</span><span>{String(i+1).padStart(2,'0')}</span></span><span className="poster-title">{p.title}</span><span className="poster-bottomline">{p.demo?'Concept à personnaliser':'Voir le projet'} <ArrowUpRight size={20}/></span>
      </motion.button>})}
    </div>
    <div className="cinema-gallery-bottom"><button className="icon-button" aria-label="Projets précédents" disabled={count<2} onClick={()=>select(index-1)}><ArrowLeft size={20}/></button><div className="cinema-caption" aria-live="polite" aria-atomic="true"><span className="cinema-count">{String(index+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</span><Link href={'/projets/'+active.slug}>{active.title}<ArrowUpRight size={17}/></Link><p>{active.demo?'Exploration visuelle · À personnaliser':(active.categories||[]).join(' · ')}</p></div><button className="icon-button" aria-label="Projets suivants" disabled={count<2} onClick={()=>select(index+1)}><ArrowRight size={20}/></button></div>
    <div className="cinema-dots" aria-label="Choisir un projet">{projects.map((p,i)=><button key={p.id} aria-label={'Afficher '+p.title} aria-current={index===i?'true':undefined} onClick={()=>select(i)}/>)}</div><p className="cinema-hint">Glissez ou utilisez les flèches pour explorer</p>
  </div>;
}
function Word({children,progress,start,end}:{children:string;progress:MotionValue<number>;start:number;end:number}){const opacity=useTransform(progress,[start,end],[.3,1]);return <motion.span style={{opacity}}>{children} </motion.span>}
export function ScrollStatement({text}:{text:string}){const ref=useRef<HTMLParagraphElement>(null);const reduced=useReducedMotion();const{scrollYProgress}=useScroll({target:ref,offset:['start .9','end .5']});const words=text.split(' ');return <p className="scroll-statement" ref={ref} aria-label={text}><span aria-hidden>{words.map((word,i)=>reduced?<span key={i}>{word} </span>:<Word key={i} progress={scrollYProgress} start={i/words.length} end={(i+1)/words.length}>{word}</Word>)}</span></p>}
export function FilmStrip({projects}:{projects:any[]}){const ref=useRef<HTMLDivElement>(null);const reduced=useReducedMotion();const{scrollYProgress}=useScroll({target:ref,offset:['start end','end start']});const x=useTransform(scrollYProgress,[0,1],['0%','-18%']);return <div ref={ref} className="filmstrip"><motion.div style={{x:reduced?0:x}}>{projects.slice(0,6).map((p,i)=><Link href={'/projets/'+p.slug} key={p.id}><img src={p.cover} alt={p.title} loading="lazy"/><span>{String(i+1).padStart(2,'0')} / {p.title}</span></Link>)}</motion.div></div>}
export function StackedProject({project,index,children}:{project:any;index:number;children?:ReactNode}){const ref=useRef<HTMLElement>(null);const reduced=useReducedMotion();const {scrollYProgress}=useScroll({target:ref,offset:['start start','end start']});const scale=useTransform(scrollYProgress,[0,1],[1,.94]);return <motion.article ref={ref} className="stacked-project" style={{top:90+index*16,scale:reduced?1:scale}}><div className="stacked-project-top"><span className="small-index">0{index+1}</span><div><p className="eyebrow">{project.demo?'Exploration à personnaliser':(project.categories||[]).join(' · ')}</p><h3>{project.title}</h3></div><Link className="icon-button" href={'/projets/'+project.slug} aria-label={'Découvrir '+project.title}><ArrowUpRight size={20}/></Link></div><Link href={'/projets/'+project.slug}><img className="stacked-project-image" src={project.cover} alt={project.title} loading="lazy"/></Link>{children}</motion.article>}
