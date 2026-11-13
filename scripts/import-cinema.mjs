import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {DatabaseSync} from 'node:sqlite';
const source='C:/Users/jovite benga/.codex/generated_images/01a17547-0447-7e51-84af-0eeaf34ca556';
const assets=[
 ['atelier','exec-5151e654-2e7a-494d-a228-bcb9c667c408.png','Jovite — atelier créatif'],
 ['silhouette','exec-c7067cf3-9a7c-441d-bbc3-f483a18ed02f.png','Jovite — lumière cinéma'],
 ['studio','exec-0b00c7cf-5492-4d4f-b477-dcf24491ec6e.png','Jovite — scène en fauteuil'],
 ['regard','exec-2873079b-d01b-4fa2-8caf-29bbd17da78b.png','Jovite — portrait noir et blanc'],
 ['orbit','exec-49e4a0f3-2aab-4e11-bfae-74818e0534ff.png','Orbite — concept visuel généré'],
 ['sillage','exec-654e5996-d01d-4149-8bb4-263d6579555e.png','Sillage — concept visuel généré'],
 ['echo','exec-a0ec7c1c-8b52-4fa7-861b-895047011508.png','Écho — concept visuel généré']
];
fs.mkdirSync('design/portraits-cinema',{recursive:true});
const db=new DatabaseSync('.local/studio.sqlite');db.exec('PRAGMA busy_timeout=5000');const urls={};const now=new Date().toISOString();
for(const[name,file,title]of assets){
 const original=path.join(source,file);fs.copyFileSync(original,'design/portraits-cinema/'+name+'.png');
 const id=crypto.createHash('sha256').update('cinema-v2-'+name).digest('hex').slice(0,32);const target='.local/media/'+id+'.webp';
 await sharp(original).resize({width:1800,withoutEnlargement:true}).webp({quality:88}).toFile(target);
 db.prepare('INSERT OR IGNORE INTO media_library VALUES(?,?,?,?,?,?,?)').run(id,title,title+' · Image générée', 'image/webp',fs.statSync(target).size,id+'.webp',now);urls[name]='/media/'+id;
}
function update(row,draft){db.prepare('INSERT INTO page_versions VALUES(?,?,?,?)').run(crypto.randomUUID(),row.id,row.draft,now);db.prepare('UPDATE content_items SET draft=?,updated_at=? WHERE id=?').run(JSON.stringify(draft),now,row.id);}
const profile=db.prepare("SELECT * FROM content_items WHERE kind='profile'").get();const p=JSON.parse(profile.draft);
update(profile,{...p,portraits:{atelier:urls.atelier,silhouette:urls.silhouette,studio:urls.studio,regard:urls.regard}});
const demos=[['orbit','Orbite','Identité','Une exploration de la matière, de la lumière et du signe.'],['sillage','Sillage','UX/UI','Un univers digital inspiré par le voyage et les espaces ouverts.'],['echo','Écho','Motion','Une étude de rythme, de reflets et de mouvement.']];
for(const[name,title,category,summary]of demos){const slug='exploration-'+name;if(db.prepare('SELECT id FROM content_items WHERE slug=?').get(slug))continue;
 const draft={title,category,categories:[category],summary,cover:urls[name],gallery:[],context:'',approach:'',objectives:'',deliverables:'',results:'',role:'',client:'',year:'',projectType:'concept',tools:[],featured:true,demo:true,editorialApproved:false,rightsApproved:false,translationApproved:false,english:{title:'',summary:'',context:''}};
 db.prepare('INSERT INTO content_items VALUES(?,?,?,?,NULL,0,?,?)').run(crypto.randomUUID(),'projects',slug,JSON.stringify(draft),-3+demos.findIndex(x=>x[0]===name),now);
}
const home=db.prepare("SELECT * FROM content_items WHERE kind='pages' AND slug='accueil'").get();const h=JSON.parse(home.draft);const order=['Hero','Projects','Introduction','Expertises','Experience','Services','Contact'];h.content.content.sort((a,b)=>order.indexOf(a.type)-order.indexOf(b.type));
update(home,h);db.close();fs.writeFileSync('design/portraits-cinema/manifest.json',JSON.stringify({generated:now,assets:assets.map(([name,,title])=>({name,title,url:urls[name]}))},null,2));console.log('7 visuels importés. 3 projets conceptuels créés. Portrait du hero conservé.');
