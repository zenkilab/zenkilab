// D1 Free default. All customer file operations stay behind Pages Functions.
export interface Statement {
 bind(...args: unknown[]): Statement;
 run(): Promise<{meta:{changes:number}}>;
 first<T=Record<string,unknown>>(): Promise<T|null>;
 all<T=Record<string,unknown>>(): Promise<{results:T[]}>;
}
export interface Database {
 prepare(sql:string): Statement;
 batch(statements: Statement[]): Promise<unknown[]>;
}
export interface FileStore {
 put(key:string,value:Uint8Array): Promise<unknown>;
 get(key:string): Promise<{arrayBuffer():Promise<ArrayBuffer>}|null>;
 delete(key:string):Promise<void>;
}
export interface StorageEnv {
 SUBMISSIONS_DB?: Database;
 SUBMISSIONS_FILES?: FileStore;
 SUBMISSION_STORAGE_BACKEND?: string;
 SUBMISSION_R2_AUTHORIZED?: string;
 SUBMISSION_STORAGE_MAX_BYTES?: string;
}
export interface Artifact {name:string;key:string;sha:string;type:string;size:number}
export const CHUNK_BYTES=256*1024;
export const MAX_FILE_BYTES=3*1024*1024;
export const MAX_PACKAGE_BYTES=4*1024*1024;
export const sha256=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as BufferSource))).map(v=>v.toString(16).padStart(2,'0')).join('');
export function backend(env:StorageEnv){
 const selected=env.SUBMISSION_STORAGE_BACKEND||'d1';
 if(selected==='d1')return 'd1';
 if(selected==='r2'&&env.SUBMISSION_R2_AUTHORIZED==='true'&&env.SUBMISSIONS_FILES)return 'r2';
 throw Error('Storage backend is not authorized/configured');
}
export async function storageHealthy(env:StorageEnv){
 try{if(!env.SUBMISSIONS_DB)return false;if(backend(env)==='r2')return true;
 const row=await env.SUBMISSIONS_DB.prepare('SELECT used_bytes,limit_bytes FROM submission_storage_budget WHERE id=1').first();return !!row;
 }catch{return false}
}
export function fileStore(env:StorageEnv):FileStore{
 if(backend(env)==='r2')return env.SUBMISSIONS_FILES!;
 return {
  async put(){throw Error('D1 files must be persisted with submission metadata in one transaction')},
  async get(key){
   const db=env.SUBMISSIONS_DB!;
   const file=await db.prepare('SELECT size,sha,chunks,expires FROM submission_files WHERE key=?').bind(key).first<{size:number;sha:string;chunks:number;expires:number}>();
   if(!file||file.expires<Date.now())return null;
   if(file.size>MAX_FILE_BYTES||file.chunks>12)throw Error('Invalid stored file bounds');
   const rows=await db.prepare('SELECT part,data FROM submission_file_chunks WHERE file_key=? ORDER BY part').bind(key).all<{part:number;data:number[]|ArrayBuffer|Uint8Array}>();
   if(rows.results.length!==file.chunks)throw Error('Incomplete stored file');
   const output=new Uint8Array(file.size);let offset=0;
   for(let i=0;i<rows.results.length;i++){
    const row=rows.results[i],data=row.data instanceof ArrayBuffer?new Uint8Array(row.data):Uint8Array.from(row.data as ArrayLike<number>);
    if(row.part!==i||data.length>CHUNK_BYTES||offset+data.length>output.length)throw Error('Invalid stored chunk');
    output.set(data,offset);offset+=data.length;
   }
   if(offset!==file.size||await sha256(output)!==file.sha)throw Error('Stored file integrity mismatch');
   return {arrayBuffer:async()=>output.buffer};
  },
  async delete(key){await env.SUBMISSIONS_DB!.prepare('DELETE FROM submission_files WHERE key=?').bind(key).run()}
 };
}
export interface SubmissionRecord {ref:string;digest:string;product:string;stage:string;payload:string;artifacts:string;validation:string;created:number;expires:number}
export async function persistD1(env:StorageEnv,record:SubmissionRecord,artifacts:Artifact[],bytes:Uint8Array[]){
 const db=env.SUBMISSIONS_DB!;
 if(artifacts.reduce((n,a)=>n+a.size,0)>MAX_PACKAGE_BYTES||artifacts.some(a=>a.size>MAX_FILE_BYTES))throw Error('Package exceeds free storage limits');
 const cap=Math.min(128*1024*1024,Math.max(1024*1024,Number(env.SUBMISSION_STORAGE_MAX_BYTES)||64*1024*1024));
 // Each statement and BLOB is bounded; no interpolated SQL or upload-provided paths.
 const statements:Statement[]=[
  db.prepare('UPDATE submission_storage_budget SET limit_bytes=? WHERE id=1').bind(cap),
  db.prepare('INSERT OR IGNORE INTO submissions(ref,digest,product,stage,state,payload,artifacts,validation,created,updated,expires,lease) VALUES(?,?,?,?,?,?,?,?,?,?,?,0)').bind(record.ref,record.digest,record.product,record.stage,'received',record.payload,record.artifacts,record.validation,record.created,record.created,record.expires),
  db.prepare("DELETE FROM submission_files WHERE ref=? AND EXISTS(SELECT 1 FROM submissions WHERE ref=? AND digest=? AND provider_id IS NULL AND state IN ('received','validated','stored','failed'))").bind(record.ref,record.ref,record.digest)
 ];
 const eligible="EXISTS(SELECT 1 FROM submissions WHERE ref=? AND digest=? AND provider_id IS NULL AND state IN ('received','validated','stored','failed'))";
 for(let i=0;i<artifacts.length;i++){
  const a=artifacts[i],count=Math.ceil(a.size/CHUNK_BYTES);
  statements.push(db.prepare(`INSERT INTO submission_files(key,ref,name,size,sha,chunks,type,expires) SELECT ?,?,?,?,?,?,?,? WHERE ${eligible}`).bind(a.key,record.ref,a.name,a.size,a.sha,count,a.type,record.expires,record.ref,record.digest));
  for(let part=0;part<count;part++)statements.push(db.prepare(`INSERT INTO submission_file_chunks(file_key,part,data) SELECT ?,?,? WHERE ${eligible}`).bind(a.key,part,bytes[i].slice(part*CHUNK_BYTES,(part+1)*CHUNK_BYTES),record.ref,record.digest));
 }
 statements.push(db.prepare("UPDATE submissions SET state='stored',failure=NULL,updated=? WHERE ref=? AND digest=? AND provider_id IS NULL AND state IN ('received','validated','stored','failed')").bind(Date.now(),record.ref,record.digest));
 await db.batch(statements); // D1 rolls back the ENTIRE batch on quota/constraint/upload failure.
 const saved=await db.prepare('SELECT digest,state FROM submissions WHERE ref=?').bind(record.ref).first<{digest:string;state:string}>();
 if(saved?.digest!==record.digest)throw Error('Concurrent reference conflict');
}
