import Link from 'next/link';
export default function NotFound(){return <main className="container empty section"><p className="eyebrow">404</p><h1>Cette page n’est pas ici.</h1><p>Revenons à la sélection de projets.</p><Link className="button" href="/projets">Découvrir les projets</Link></main>;}
