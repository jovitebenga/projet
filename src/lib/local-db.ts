import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
export const dataRoot=path.join(process.cwd(),'.local');
let database:DatabaseSync;
export function db(){
  if(process.env.VERCEL || process.env.DATA_BACKEND==='supabase') throw new Error('Stockage local indisponible sur cet environnement.');
  if(database) return database;
  mkdirSync(dataRoot,{recursive:true});
  database=new DatabaseSync(path.join(dataRoot,'studio.sqlite'));
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS content_items(id TEXT PRIMARY KEY,kind TEXT NOT NULL,slug TEXT NOT NULL,draft TEXT NOT NULL,published TEXT,archived INTEGER NOT NULL DEFAULT 0,position INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL,UNIQUE(kind,slug));
    CREATE TABLE IF NOT EXISTS page_versions(id TEXT PRIMARY KEY,content_id TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS media_library(id TEXT PRIMARY KEY,name TEXT NOT NULL,alt TEXT NOT NULL,mime TEXT NOT NULL,bytes INTEGER NOT NULL,path TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS quote_requests(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,company TEXT NOT NULL,intent TEXT NOT NULL,service TEXT NOT NULL,budget TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL,notes TEXT NOT NULL,history TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS administrators(email TEXT PRIMARY KEY,salt TEXT NOT NULL,password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,email TEXT NOT NULL,expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset INTEGER NOT NULL);
  `);return database;
}
export function localRateLimit(key:string,max:number,windowMs:number):boolean {
 const d=db();const now=Date.now();d.exec('BEGIN IMMEDIATE');
 try {const row=d.prepare('SELECT count,reset FROM rate_limits WHERE key=?').get(key) as {count:number;reset:number}|undefined;
 if(!row||row.reset<=now){d.prepare('INSERT OR REPLACE INTO rate_limits VALUES(?,?,?)').run(key,1,now+windowMs);d.exec('COMMIT');return true;}
 if(row.count>=max){d.exec('COMMIT');return false;}
 d.prepare('UPDATE rate_limits SET count=count+1 WHERE key=?').run(key);d.exec('COMMIT');return true;
 }catch(e){d.exec('ROLLBACK');throw e;}
}
