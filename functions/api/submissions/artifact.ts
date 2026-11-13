import {fileStore,storageHealthy} from '../../_lib/submissions/storage';
import { scopeMatches, type Env } from '../../_lib/submissions/service';

/** Operator-only retrieval. References alone never authorize access to files. */
export const onRequestGet = async ({request, env}: {request: Request; env: Env}) => {
  const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(!env.SUBMISSIONS_ADMIN_TOKEN || request.headers.get('Authorization')!==`Bearer ${env.SUBMISSIONS_ADMIN_TOKEN}`)
    return new Response('Unauthorized',{status:401,headers});
  if(!env.SUBMISSIONS_DB || !await storageHealthy(env) || !await scopeMatches(env))
    return new Response('Private storage unavailable',{status:503,headers});
  const query=new URL(request.url).searchParams, reference=query.get('reference')||'', name=query.get('name')||'';
  if(!/^(KT-|AK-)[A-Z0-9-]{4,60}$/.test(reference) || !/^(model\.(3mf|stl)|preview\.(png|jpg))$/.test(name))
    return new Response('Invalid request',{status:400,headers});
  const row=await env.SUBMISSIONS_DB.prepare('SELECT artifacts,expires,state FROM submissions WHERE ref=?').bind(reference).first<{artifacts:string;expires:number;state:string}>();
  if(!row || row.state==='expired' || row.expires<Date.now())return new Response('Not found',{status:404,headers});
  const artifact=(JSON.parse(row.artifacts) as {name:string;key:string;sha:string;type:string}[]).find(v=>v.name===name);
  if(!artifact)return new Response('Not found',{status:404,headers});
  let object;try{object=await fileStore(env).get(artifact.key)}catch{return new Response('Stored file failed integrity check',{status:503,headers})}
  if(!object)return new Response('Stored file unavailable',{status:503,headers});
  const bytes=await object.arrayBuffer();
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
  if(sha!==artifact.sha)return new Response('Stored file failed integrity check',{status:503,headers});
  return new Response(bytes,{headers:{...headers,'Content-Type':artifact.type,'Content-Disposition':`attachment; filename="${reference}-${name}"`}});
};
