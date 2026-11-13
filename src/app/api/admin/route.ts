import { requireAdmin,verifyOrigin } from '@/lib/auth';
import { allContent,byId,saveContent,mutateContent,versions,listMedia,listInquiries,updateInquiry } from '@/lib/content';
export async function GET(request:Request){try{await requireAdmin();const url=new URL(request.url);const versionId=url.searchParams.get('versions');if(versionId)return Response.json(await versions(versionId));return Response.json({content:await allContent(),media:await listMedia(),inquiries:await listInquiries()},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Accès non autorisé.'},{status:401});}}
export async function POST(request:Request){try{
 await verifyOrigin(request);await requireAdmin();if(Number(request.headers.get('content-length')||0)>700000)throw new Error('Requête trop volumineuse.');const body=await request.json();let result;
 if(body.action==='save')result=await saveContent(body.content);
 else if(body.action==='restore-version'){const row=await byId(body.id);const version=(await versions(body.id)).find((v:any)=>v.id===body.versionId);if(!row||!version)throw new Error('Version introuvable.');result=await saveContent({...row,draft:version.data,expectedUpdatedAt:row.updated_at});}
 else if(body.action==='inquiry'){await updateInquiry(body.id,body.status,body.notes);result={ok:true};}
 else result=await mutateContent(body.id,body.action);
 return Response.json(result);
 }catch(e){const message=e instanceof Error?e.message:'Enregistrement impossible.';return Response.json({error:message},{status:message==='UNAUTHORIZED'?401:400});}}
