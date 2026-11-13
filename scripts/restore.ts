import fs from 'node:fs';import path from 'node:path';
const source=process.argv[2];if(!source)throw new Error('Indiquez le dossier d’une sauvegarde. Arrêtez le serveur avant restauration.');
const backup=path.resolve(source);if(!fs.existsSync(path.join(backup,'studio.sqlite'))||!fs.existsSync(path.join(backup,'media')))throw new Error('Sauvegarde incomplète.');
const current=path.resolve('.local');const recovery=path.join(current,'avant-restauration-'+Date.now());fs.mkdirSync(recovery,{recursive:true});
for(const name of ['studio.sqlite','studio.sqlite-wal','studio.sqlite-shm']){const file=path.join(current,name);if(fs.existsSync(file))fs.renameSync(file,path.join(recovery,name));}
fs.copyFileSync(path.join(backup,'studio.sqlite'),path.join(current,'studio.sqlite'));fs.cpSync(path.join(backup,'media'),path.join(current,'media'),{recursive:true});console.log('Restauration effectuée. Ancienne base conservée : '+recovery);
