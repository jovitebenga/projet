import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
export const isLocal=()=>process.env.DATA_BACKEND!=='supabase'&&!process.env.VERCEL;
export const isPreview=()=>isLocal()&&process.env.LOCAL_PREVIEW==='true';
export async function supabase(){
 const jar=await cookies();
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>jar.getAll(),setAll:items=>{try{items.forEach(({name,value,options})=>jar.set(name,value,options));}catch{/* Server components cannot write cookies; proxy refreshes them. */}}}});
}
export function secretClient(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});}
