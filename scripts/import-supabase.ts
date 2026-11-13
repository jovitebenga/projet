import fs from 'node:fs';import path from 'node:path';import {createClient} from '@supabase/supabase-js';
if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SECRET_KEY)throw new Error('Configurez le projet Supabase dédié.');
const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
const seed=JSON.parse(fs.readFileSync('src/data/seed.json','utf8'));
for(const m of seed.media){const{error}=await client.storage.from('portfolio-media').upload(m.path,fs.readFileSync(path.join('.local/media',m.path)),{contentType:m.mime,upsert:false});if(error&&!error.message.includes('already exists'))throw error;const record=await client.from('media_library').upsert(m);if(record.error)throw record.error;}
for(const c of seed.content){const{error}=await client.from('content_items').upsert({...c,published:null},{onConflict:'id',ignoreDuplicates:true});if(error)throw error;}
console.log('Médias privés et brouillons importés. Aucun contenu publié.');
