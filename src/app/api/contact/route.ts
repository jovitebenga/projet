import { randomUUID,createHash } from 'node:crypto';
import { inquirySchema } from '@/lib/model';
import { verifyOrigin } from '@/lib/auth';
import { db,localRateLimit } from '@/lib/local-db';
import { isLocal,secretClient } from '@/lib/supabase';
export async function POST(request:Request){try{
 await verifyOrigin(request);if(Number(request.headers.get('content-length')||0)>15000)throw new Error('Message trop volumineux.');
 const result=inquirySchema.safeParse(await request.json());if(!result.success)return Response.json({error:'Vérifiez vos coordonnées, le message (20 caractères minimum) et votre consentement.'},{status:400});
 const data=result.data;if(Date.now()-data.startedAt<2500||Date.now()-data.startedAt>86400000)throw new Error('Veuillez réessayer après quelques secondes.');
 const id=randomUUID();const now=new Date().toISOString();
 if(isLocal()) {if(!localRateLimit('contact',5,3600000))return Response.json({error:'Trop de demandes. Réessayez plus tard.'},{status:429});
 db().prepare('INSERT INTO quote_requests VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,data.name,data.email,data.phone,data.company,data.intent,data.service,data.budget,data.message,'nouveau','',JSON.stringify([{at:now,status:'nouveau',note:'Demande reçue'}]),now);
 }else{
 if(!process.env.TURNSTILE_SECRET_KEY||!process.env.CONTACT_IP_SALT||!process.env.SUPABASE_SECRET_KEY)return Response.json({error:'Le formulaire est temporairement indisponible. Vous pouvez écrire directement par email.'},{status:503});
 const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY,response:data.token||''})});const verified=await verification.json();if(!verified.success)throw new Error('La vérification antispam a échoué.');
 const ip=request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for')||'unknown';const key=createHash('sha256').update(process.env.CONTACT_IP_SALT+ip.split(',')[0].trim()).digest('hex');
 const {error}=await secretClient().rpc('receive_inquiry',{p_id:id,p_data:data,p_rate_key:key});if(error)throw new Error('Votre demande n’a pas pu être enregistrée. Réessayez plus tard.');
 }
 return Response.json({ok:true,id,local:isLocal()});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Envoi impossible.'},{status:400});}}

