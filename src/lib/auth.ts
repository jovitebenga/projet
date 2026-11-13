import { cookies,headers } from 'next/headers';
import { createHash,randomBytes,scryptSync,timingSafeEqual } from 'node:crypto';
import { db,localRateLimit } from './local-db';
import { isLocal,supabase } from './supabase';
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export async function administrator(){
 if(isLocal()) {const token=(await cookies()).get('studio_session')?.value;if(!token)return null; const row=db().prepare('SELECT email FROM sessions WHERE token_hash=? AND expires>?').get(hash(token),Date.now()) as {email:string}|undefined;return row?.email||null;}
 const client=await supabase();const {data:{user}}=await client.auth.getUser();if(!user)return null;
 const {data}=await client.from('authorized_admins').select('user_id').eq('user_id',user.id).maybeSingle();return data?user.email||user.id:null;
}
export async function requireAdmin(){const user=await administrator();if(!user)throw new Error('UNAUTHORIZED');return user;}
export async function verifyOrigin(request:Request){
 const origin=request.headers.get('origin');const url=new URL(request.url);
 const allowed=process.env.SITE_URL?new URL(process.env.SITE_URL).origin:url.origin;
 const local=isLocal() && origin && ['http://localhost:3000','http://127.0.0.1:3000'].includes(origin);
 if(!origin || (origin!==allowed&&origin!==url.origin&&!local))throw new Error('Origine non autorisée.');
}
export async function login(email:string,password:string){
 if(!isLocal()){const c=await supabase();const {error}=await c.auth.signInWithPassword({email,password});if(error)throw new Error('Identifiants incorrects.');if(!await administrator()){await c.auth.signOut();throw new Error('Accès administrateur requis.');}return;}
 if(!localRateLimit('login-global',15,15*60_000))throw new Error('Trop de tentatives. Réessayez dans 15 minutes.');
 const row=db().prepare('SELECT salt,password_hash FROM administrators WHERE email=?').get(email.toLowerCase()) as {salt:string;password_hash:string}|undefined;
 const candidate=scryptSync(password,row?.salt||'missing-admin',64);const expected=Buffer.from(row?.password_hash||'00'.repeat(64),'hex');
 if(!row||!timingSafeEqual(candidate,expected))throw new Error('Identifiants incorrects.');
 const token=randomBytes(32).toString('hex');db().prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());db().prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),email,Date.now()+8*3600_000);
 (await cookies()).set('studio_session',token,{httpOnly:true,sameSite:'strict',secure:false,path:'/',maxAge:8*3600});
}
export async function logout(){if(!isLocal()){await(await supabase()).auth.signOut();return;}const jar=await cookies();const token=jar.get('studio_session')?.value;if(token)db().prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));jar.delete('studio_session');}
