import {backend,fileStore,storageHealthy} from '../../_lib/submissions/storage';
import {scopeMatches,type Env } from '../../_lib/submissions/service';
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
 if (!env.SUBMISSIONS_ADMIN_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.SUBMISSIONS_ADMIN_TOKEN}`) return new Response('Unauthorized', { status: 401 });
 if (!env.SUBMISSIONS_DB || !await storageHealthy(env) || !await scopeMatches(env)) return new Response('Storage unavailable', { status: 503 });
 const now = Date.now();
 const expired = await env.SUBMISSIONS_DB.prepare("SELECT ref,artifacts FROM submissions WHERE expires<? AND state!='expired' LIMIT 50").bind(now).all<{ref:string;artifacts:string}>();
 let removed = 0;
 if(backend(env)==='d1'){
  const statements=[];
  for(const row of expired.results){statements.push(env.SUBMISSIONS_DB.prepare('DELETE FROM submission_files WHERE ref=?').bind(row.ref));statements.push(env.SUBMISSIONS_DB.prepare("UPDATE submissions SET state='expired',payload='{}',artifacts='[]',validation='{}',provider_id=NULL,failure='expired',lease=0 WHERE ref=?").bind(row.ref));}
  if(statements.length)await env.SUBMISSIONS_DB.batch(statements);
  removed=expired.results.length;
 }else for (const row of expired.results) {
  for (const a of JSON.parse(row.artifacts)) await fileStore(env).delete(a.key);
  await env.SUBMISSIONS_DB.prepare("UPDATE submissions SET state='expired',payload='{}',artifacts='[]',validation='{}',provider_id=NULL,failure='expired',lease=0 WHERE ref=?").bind(row.ref).run();
  removed++;
 }
 await env.SUBMISSIONS_DB.prepare('DELETE FROM submission_rate WHERE expires<?').bind(now).run();
 return Response.json({removed});
};
