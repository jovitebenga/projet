import Link from 'next/link';
import { Header,ArrowUpRight } from '@/components/ui';
import { siteData } from '@/lib/content';
import { isPreview } from '@/lib/supabase';
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:React.ReactNode}){const{profile,settings}=await siteData();return <><a href="#main" className="skip-link">Aller au contenu</a>{isPreview()&&<div className="preview-notice">Aperçu privé · Contenus en cours de validation<Link href="/admin">Espace studio</Link></div>}<Header navigation={settings.navigation||[]}/><main id="main">{children}</main><footer className="container footer"><div className="footer-main"><Link className="signature" href="/">Jovite Benga</Link><p>{settings.footer}</p><Link href="/contact" className="text-link">Une idée en tête ? Parlons-en.<ArrowUpRight size={18}/></Link></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Jovite Benga · {profile.location}</span><div><Link href="/mentions-legales">Mentions légales</Link><Link href="/confidentialite">Confidentialité</Link></div></div></footer></>;}
