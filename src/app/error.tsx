'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="container empty section"><h1>La page n’a pas pu se charger.</h1><p>Réessayez dans quelques instants.</p><button className="button" onClick={reset}>Réessayer</button></div>;}
