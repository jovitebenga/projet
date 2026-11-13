import type { Metadata } from 'next';
import './globals.css';
import './cinema.css';
export const metadata:Metadata={title:{default:'Jovite Benga — Portfolio',template:'%s — Jovite Benga'},description:'Direction artistique, identité visuelle et expériences digitales.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr" data-scroll-behavior="smooth"><body>{children}</body></html>;}
