/** Import non destructif des médias fournis pour la maquette, dans les brouillons locaux. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {db,dataRoot} from '../src/lib/local-db';

const root=path.resolve(process.cwd(),'../03-MES-TRAVAUX/Projet réaliser');
const mediaRoot=path.join(dataRoot,'media');fs.mkdirSync(mediaRoot,{recursive:true});
const groups:{slug:string;folder:string;files:string[]}[]=[
 {slug:'pmuc',folder:'page communication digital/PMUC sport/visuel',files:['classico.jpg','JJ - 1.jpg','teleconseiler.jpg','monday motivation.jpg','bon weekend.jpg','jour fr match.jpg']},
 {slug:'homay',folder:'page communication digital/communication digital',files:['flyers 1.jpg','flyers 2.jpg','flyers 3.jpg','flyers 4.jpg','flyers 5.jpg','flyers 6.jpg']},
 {slug:'machibel-santarde',folder:'page communication digital/Marichel/flyers',files:['1.jpg','7.jpg','photo produit.png']},
 {slug:'u-fresh',folder:'page communication digital/ufresh',files:['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg','9.jpg']},
 {slug:'services-publics',folder:'page UX/service public',files:['Accueil 3.jpg','Accueil 4.jpg','Toutes les administrations.jpg','Création de compte.jpg','Gestion des Procédures.jpg']},
 {slug:'equip4safety',folder:'page UX/equip4safety',files:['Accueil 2 pc.jpg','Dashboard.jpg','Dashboard user.jpg','page utilisateurs.jpg','page offre.jpg','Page  produit.jpg']},
 {slug:'touristique-express',folder:'page UX/touristique/liste des ecrans',files:['splashscreem animation (1).jpg','Aucun voyage trouvé.png','Liste de departs.png','Paiement réussi.png','Mes billets achetés.png','4.jpg']},
];
const d=db();const now=new Date().toISOString();let count=0;
d.exec('BEGIN IMMEDIATE');
try{for(const group of groups){let row=d.prepare("SELECT id,draft FROM content_items WHERE kind='projects' AND slug=?").get(group.slug) as {id:string;draft:string}|undefined;
 if(!row&&group.slug!=='u-fresh')continue;
 const draft=row?JSON.parse(row.draft):{title:'U-FRESH',category:'Campagnes',categories:['Campagnes'],summary:'Une sélection de créations pour la communication de Lait Lumière.',context:'Créations visuelles pour la communication digitale de U-FRESH.',deliverables:'Visuels et déclinaisons pour les réseaux sociaux.',featured:true,editorialApproved:false,rightsApproved:false,translationApproved:false,gallery:[]};
 const existing=Array.isArray(draft.gallery)?draft.gallery:[];let gallery=[...existing];
 for(const file of group.files){const source=path.join(root,group.folder,file);if(!fs.existsSync(source))continue;const bytes=fs.readFileSync(source);const id=createHash('sha256').update(bytes).digest('hex').slice(0,32);const ext=path.extname(file).toLowerCase();const stored=id+ext;const mime=ext==='.png'?'image/png':'image/jpeg';if(!fs.existsSync(path.join(mediaRoot,stored)))fs.writeFileSync(path.join(mediaRoot,stored),bytes);const alt=`${draft.title} — ${path.parse(file).name}`;d.prepare('INSERT OR IGNORE INTO media_library VALUES(?,?,?,?,?,?,?)').run(id,file,alt,mime,bytes.length,stored,now);const sameName=gallery.some((item:{image:string;alt:string})=>item.image!==`/media/${id}`&&item.alt?.toLocaleLowerCase('fr')===alt.toLocaleLowerCase('fr'));if(sameName)gallery=gallery.filter((item:{image:string})=>item.image!==`/media/${id}`);else if(!gallery.some((item:{image:string})=>item.image===`/media/${id}`))gallery.push({image:`/media/${id}`,alt});count++;}
 if(!row){draft.cover=gallery[0]?.image||'';draft.gallery=gallery;row={id:randomUUID(),draft:''};d.prepare('INSERT INTO content_items(id,kind,slug,draft,published,archived,position,updated_at) VALUES(?,?,?,?,NULL,0,?,?)').run(row.id,'projects',group.slug,JSON.stringify(draft),8,now);}
 else if(JSON.stringify(gallery)!==JSON.stringify(existing)){d.prepare('INSERT INTO page_versions VALUES(?,?,?,?)').run(randomUUID(),row.id,row.draft,now);draft.gallery=gallery;d.prepare('UPDATE content_items SET draft=?,updated_at=? WHERE id=?').run(JSON.stringify(draft),now,row.id);}
 }
 d.exec('COMMIT');console.log(`${count} médias vérifiés et associés aux brouillons locaux.`);
}catch(error){d.exec('ROLLBACK');throw error;}
