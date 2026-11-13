import {backend,fileStore,storageHealthy,persistD1,MAX_FILE_BYTES,MAX_PACKAGE_BYTES,type StorageEnv,type Artifact} from './storage';
import { registrationLayout, contrast, filamentColors } from '../../../src/lib/automotive-config';
import { validateModel, validateAutomotiveStl } from './validate';
import { businessMail } from './business';
import { parseOrder, keyTagEmail } from '../keytag-email';
import definitions from '../../../src/lib/automotive-logo-definitions.json';
import { esc, shell, rows, section } from '../email';
export interface Env extends StorageEnv {
 RESEND_API_KEY?:string;
 SUBMISSION_NAMESPACE?:string;
 SUBMISSION_ALLOWED_HOSTS?:string;
 SUBMISSION_RETENTION_DAYS?:string;
 SUBMISSIONS_ADMIN_TOKEN?:string;
}
type Row = {
    ref: string;
    digest: string;
    product: string;
    stage: string;
    state: string;
    payload: string;
    artifacts: string;
    validation: string;
    created: number;
    updated: number;
    expires: number;
    provider_id?: string;
    failure?: string;
    lease: number;
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const hash = async (b: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', b as BufferSource))).map(x => x.toString(16).padStart(2, '0')).join('');
const encode = (v: unknown) => new TextEncoder().encode(JSON.stringify(v));
function ready(env: Env) { return !!(env.SUBMISSIONS_DB && env.SUBMISSION_NAMESPACE && env.SUBMISSION_ALLOWED_HOSTS); }
export async function scopeMatches(env:Env){try{if(!env.SUBMISSIONS_DB||!env.SUBMISSION_NAMESPACE)return false;const row=await env.SUBMISSIONS_DB.prepare('SELECT namespace FROM submission_scope WHERE id=1').first<{namespace:string}>();return row?.namespace===env.SUBMISSION_NAMESPACE}catch{return false}}
function base64(bytes: Uint8Array) { let s = ''; for (let i = 0; i < bytes.length; i += 8192)
    s += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(s); }
async function limited(request: Request) { const reader = request.body?.getReader(); if (!reader)
    throw Error('Missing body'); const parts: Uint8Array[] = []; let n = 0; for (;;) {
    const { done, value } = await reader.read();
    if (done)
        break;
    n += value.length;
    if (n > 9 * 1024 * 1024) {
        await reader.cancel();
        throw Error('Submission too large');
    }
    parts.push(value);
} const bytes = new Uint8Array(n); let i = 0; for (const p of parts) {
    bytes.set(p, i);
    i += p.length;
} return new Request(request.url, { method: 'POST', headers: request.headers, body: bytes }).formData(); }
function automotive(raw: string) { const o = JSON.parse(raw), c = o.config; const brand = definitions.find(b => b.id === c?.brand); if (!brand && c?.brand !== 'other')
    throw Error('Unknown brand'); if (!['capsule', 'rounded-rectangle'].includes(c.shape) || !['none', 'thin', 'bold', 'double'].includes(c.border) || !['white', 'navy', 'black', 'silver', 'red'].includes(c.body) || !['white', 'navy', 'black', 'silver', 'red'].includes(c.accent) || c.body === c.accent || typeof c.branding !== 'boolean' || !(/^[A-Z0-9 -]{2,12}$/.test(c.registration)) || !/[A-Z0-9]/.test(c.registration))
    throw Error('Invalid customization'); if(c.notes!==undefined&&typeof c.notes!=='string'||c.customBrand!==undefined&&typeof c.customBrand!=='string')throw Error('Notes and brand/model must be text');
    if (c.notes && String(c.notes).length > 500 || c.customBrand && String(c.customBrand).length > 80)
    throw Error('Notes too long'); if (c.brand === 'other' && (!c.customBrand || String(c.customBrand).trim().length < 2))
    throw Error('Brand/model required'); if (!registrationLayout(c.registration).valid || contrast(filamentColors.find(v => v.id === c.body)!.hex, filamentColors.find(v => v.id === c.accent)!.hex) < 3)
    throw Error('Lettering size or color contrast unsuitable'); return { contact: o.contact, config: { brand: c.brand, registration: c.registration, shape: c.shape, border: c.border, body: c.body, accent: c.accent, branding: c.branding, ...(c.notes ? { notes: c.notes } : {}), ...(c.customBrand ? { customBrand: c.customBrand } : {}) } }; }
export async function handle(request: Request, env: Env, legacy = false) {
    if (!ready(env)||!await scopeMatches(env)||!await storageHealthy(env))
        return json({ error: 'Submissions are temporarily unavailable. Your design has not been sent. Keep your prepared package or use WhatsApp.', readiness: false }, 503);
    const host = new URL(request.url).hostname;
    let originAllowed = true;
    try { if(request.headers.get('Origin'))originAllowed=new URL(request.headers.get('Origin')!).origin===new URL(request.url).origin; }
    catch { originAllowed=false; }
    if (!env.SUBMISSION_ALLOWED_HOSTS!.split(',').map(v=>v.trim()).includes(host) || !originAllowed)
        return json({ error: 'Origin not allowed' }, 403);
    // Authenticated preview verification persists REAL files but cannot send mail.
    // Never exposed by the customer UI, never supported on production namespaces.
    const storageOnly=request.headers.get('X-Zenki-Storage-Only')==='1';
    if(storageOnly&&(!env.SUBMISSION_NAMESPACE!.startsWith('preview/')||!env.SUBMISSIONS_ADMIN_TOKEN||request.headers.get('Authorization')!==`Bearer ${env.SUBMISSIONS_ADMIN_TOKEN}`))
        return json({error:'Storage-only verification is not authorized'},403);
    let ref = '', phase = 'validation', prior: Row | null = null;
    try {
        if(backend(env)==='d1'){
            const daily=await env.SUBMISSIONS_DB!.prepare('INSERT INTO submission_daily_budget(day,hits) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET hits=hits+1 WHERE hits<200').bind(new Date().toISOString().slice(0,10)).run();
            if(!daily.meta.changes)return json({error:'Daily free submission capacity reached. Use the WhatsApp design-review option.'},429);
        }
        const f = await limited(request);
        let packageBytes=0;
        for(const [name,value] of f){
            if(!(value instanceof File))continue;
            if(!['preview','model','stl'].includes(name)||f.getAll(name).length!==1)throw Error('Unsupported or duplicate attachment. No files were accepted.');
            packageBytes+=value.size;
            if(backend(env)==='d1'&&(value.size>MAX_FILE_BYTES||packageBytes>MAX_PACKAGE_BYTES))throw Error('Free private storage limit: 3 MiB per file, 4 MiB per package. No files discarded. Use the WhatsApp design-review option to arrange manual attachments.');
        }
        const raw = String(f.get(legacy ? 'order' : 'submission') || '');
        if (raw.length > 20000)
            throw Error('Configuration too large');
        const product = legacy ? 'custom-keytag' : String(f.get('product'));
        if (!['custom-keytag', 'automotive'].includes(product))
            throw Error('Invalid product');
        const stage = legacy ? String(f.get('stage')) : 'quote';
        if (!['quote', 'confirm'].includes(stage))
            throw Error('Invalid stage');
        let payload: any;
        if (product === 'custom-keytag') {
            const source = JSON.parse(raw);
            const configs = Array.isArray(source.configs) && source.configs.length ? source.configs : [source.config];
            if (configs.length > 12 || configs.some((c: any) => !c || !['name', 'car-number'].includes(c.content) || !['capsule', 'ring'].includes(c.style) || !['heritage', 'precision'].includes(c.combo) || !['sharp', 'soft', 'round'].includes(c.corner) || typeof c.text !== 'string' || !c.text.trim() || c.text.length > 40 || typeof c.branding !== 'boolean' || typeof c.nfc !== 'boolean'))
                throw Error('Invalid keytag customization');
            payload = parseOrder(raw);
            if (!payload || payload.configs.length > 12)
                throw Error('Invalid keytag order');
        }
        else
            payload = automotive(raw);
        const contact = payload.contact;
        if (!contact || typeof contact.name !== 'string' || contact.name.trim().length < 2 || contact.name.length > 80 || typeof contact.phone !== 'string' || !(/^[+\d ()-]{9,30}$/.test(contact.phone)) || contact.phone.replace(/\D/g, '').length < 9)
            throw Error('Name and valid phone required');
        ref = legacy ? payload.orderId : String(f.get('reference') || '');
        if (!/^(KT-[A-Z0-9]{4,16}|AK-[A-Z0-9-]{16,48})$/.test(ref))
            throw Error('Invalid reference');
        if (stage === 'confirm') {
            const quote = await env.SUBMISSIONS_DB!.prepare('SELECT * FROM submissions WHERE ref=?').bind(ref).first<Row>();
            prior = quote;
            if (!quote?.provider_id || JSON.stringify(JSON.parse(quote.payload).contact) !== JSON.stringify(payload.contact) || JSON.stringify(JSON.parse(quote.payload).configs) !== JSON.stringify(payload.configs))
                return json({ error: 'Accepted quote required before confirmation' }, 409);
        }
        ref += stage === 'confirm' ? '-CONFIRM' : '';
        phase = 'storage';
        const known = await env.SUBMISSIONS_DB!.prepare('SELECT * FROM submissions WHERE ref=?').bind(ref).first<Row>();
        if (known && (known.state === 'expired' || known.expires < Date.now()))
            return json({ error: 'Submission expired; prepare a new reference' }, 410);
        if (!known) {
            const db = env.SUBMISSIONS_DB!, now = Date.now();
            const bucket = await hash(encode([env.SUBMISSION_NAMESPACE, request.headers.get('CF-Connecting-IP') || 'unknown', Math.floor(now / 900000)]));
            const rate = await db.prepare('INSERT INTO submission_rate(bucket,hits,expires) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 WHERE hits<5').bind(bucket, now + 900000).run();
            if (!rate.meta.changes)
                return json({ error: 'Too many submissions; retry later' }, 429);
        }
        phase = 'validation';
        const bytes: Uint8Array[] = [];
        const artifacts: Artifact[] = [];
        const requiresModel = product === 'custom-keytag' || payload.config.brand === 'mercedes';
        let validation: unknown = { status: 'design-review-required', origin: 'no-generated-cad', logoAsset: definitions.find(d => d.id === payload.config?.brand)?.asset || null, logoAssetHash: definitions.find(d => d.id === payload.config?.brand)?.sanitized_sha256 || null };
        for (const [field, max, type] of [['preview', 1024 * 1024, 'image'], ['model', 5 * 1024 * 1024, '3mf'], ['stl', 5 * 1024 * 1024, 'stl']] as const) {
            const file = f.get(field);
            if (!(file instanceof File)) {
                if (field === 'preview' && stage === 'quote' || field === 'model' && requiresModel && stage === 'quote' || field === 'stl' && product === 'automotive' && requiresModel && stage === 'quote')
                    throw Error('Missing required ' + field);
                continue;
            }
            if (file.size === 0 || file.size > max)
                throw Error('Oversized ' + field);
            const b = new Uint8Array(await file.arrayBuffer());
            if (field === 'preview' && !((b[0] === 255 && b[1] === 216) || (b[0] === 137 && b[1] === 80 && b[2] === 78)))
                throw Error('Preview must be PNG/JPEG');
            if (field === 'model') {
                if (!requiresModel)
                    throw Error('CAD-pending brand must be inquiry only');
                validation = await validateModel(b, product === 'automotive' ? payload.config : undefined);
            }
            if(field==='stl'&&!requiresModel)throw Error('CAD-pending brand must be inquiry only');
            if (field === 'stl' && (b.length < 84 || new DataView(b.buffer).getUint32(80,true)===0 || 84 + new DataView(b.buffer).getUint32(80, true) * 50 !== b.length))
                throw Error('Invalid binary STL');
            if(field==='stl'){
                const view=new DataView(b.buffer,b.byteOffset,b.byteLength);let lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
                for(let face=0;face<view.getUint32(80,true);face++)for(let v=0;v<3;v++)for(let axis=0;axis<3;axis++){const n=view.getFloat32(84+face*50+12+v*12+axis*4,true);if(!Number.isFinite(n)||Math.abs(n)>2000)throw Error('Invalid STL coordinates');lo[axis]=Math.min(lo[axis],n);hi[axis]=Math.max(hi[axis],n)}
                if(product==='automotive'&&hi.some((v,i)=>Math.abs(v-lo[i]-[58,28,3.92][i])>.03))throw Error('STL dimensions mismatch');
                validation={...(validation as Record<string,unknown>),stlCoordinateDimensionScreen:true,stlIndependentlyMatched:false,...(product==='automotive'?validateAutomotiveStl(b,(validation as {volumeMm3:number}).volumeMm3):{})};
            }
            const name = field === 'preview' ? (b[0] === 137 ? 'preview.png' : 'preview.jpg') : field === 'model' ? 'model.3mf' : 'model.stl';
            artifacts.push({ name, key: `${env.SUBMISSION_NAMESPACE}/${ref}/${name}`, sha: await hash(b), type: type === 'image' ? (b[0] === 137 ? 'image/png' : 'image/jpeg') : type === '3mf' ? 'model/3mf' : 'model/stl', size: b.length });
            bytes.push(b);
        }
        if (prior) {
            validation = JSON.parse(prior.validation);
            for (const a of JSON.parse(prior.artifacts) as Artifact[]) {
                if (a.name.startsWith('preview'))
                    continue;
                const object = await fileStore(env).get(a.key);
                if (!object)
                    throw Error('Quote attachment unavailable');
                const b = new Uint8Array(await object.arrayBuffer());
                if (await hash(b) !== a.sha)
                    throw Error('Quote attachment integrity mismatch');
                artifacts.push({ ...a, key: `${env.SUBMISSION_NAMESPACE}/${ref}/${a.name}` });
                bytes.push(b);
            }
        }
        phase = 'storage';
        const digest = await hash(encode({ product, stage, payload, artifacts: artifacts.map(a => ({ name: a.name, sha: a.sha })) }));
        const db = env.SUBMISSIONS_DB!, now = Date.now();
        let row = await db.prepare('SELECT * FROM submissions WHERE ref=?').bind(ref).first<Row>();
        if (row && row.digest !== digest)
            return json({ error: 'Reference already used for different content', reference: ref }, 409);
        if (row?.provider_id)
            return json({ reference: ref, state: 'email_accepted', providerId: row.provider_id, delivered: false, persisted: true });
        const days = Math.min(180, Math.max(7, Number(env.SUBMISSION_RETENTION_DAYS)||30));
        if(backend(env)==='d1'){
          await persistD1(env,{ref,digest,product,stage,payload:JSON.stringify(payload),artifacts:JSON.stringify(artifacts),validation:JSON.stringify(validation),created:now,expires:row?.expires||now+days*86400000},artifacts,bytes);
        } else {
        if (!row) {
            const days = Math.min(180, Math.max(7, Number(env.SUBMISSION_RETENTION_DAYS) || 30));
            await db.prepare('INSERT OR IGNORE INTO submissions(ref,digest,product,stage,state,payload,artifacts,validation,created,updated,expires,lease) VALUES(?,?,?,?,?,?,?,?,?,?,?,0)').bind(ref, digest, product, stage, 'received', JSON.stringify(payload), JSON.stringify(artifacts), JSON.stringify(validation), now, now, now + days * 86400000).run();
            row = await db.prepare('SELECT * FROM submissions WHERE ref=?').bind(ref).first<Row>();
            if (!row || row.digest !== digest)
                return json({ error: 'Concurrent reference conflict' }, 409);
        }
        await db.prepare("UPDATE submissions SET state='validated',updated=? WHERE ref=? AND state IN ('received','failed')").bind(now, ref).run();
        for (let i = 0; i < artifacts.length; i++)
            await fileStore(env).put(artifacts[i].key, bytes[i]);
        await db.prepare("UPDATE submissions SET state='stored',updated=? WHERE ref=? AND state='validated'").bind(now, ref).run();
        }
        if(storageOnly)return json({reference:ref,state:'stored',persisted:true,delivered:false,notification:'held-for-preview-storage-verification',error:'Stored privately for storage verification. No email was requested or sent.'},202);
        return await notify(ref, env);
    }
    catch (e) {
        if (ref && env.SUBMISSIONS_DB)
            await env.SUBMISSIONS_DB.prepare("UPDATE submissions SET state='failed',failure='validation-or-storage',updated=? WHERE ref=? AND state NOT IN ('email_pending','email_accepted')").bind(Date.now(), ref).run().catch(() => { });
        // D1 can wrap a SQLite trigger failure in Error.cause.
        let cause:unknown=e, capacity=false;
        for(let depth=0;depth<4&&cause instanceof Error;depth++,cause=cause.cause){
            if(/capacity reached/i.test(cause.message))capacity=true;
        }
        const bounds=e instanceof Error&&e.message.startsWith('Free private storage limit');
        return json({ error: capacity?'Private storage is full. No files were accepted. Use the WhatsApp design-review option for manual attachments.':phase === 'validation' ? (e instanceof Error ? e.message : 'Invalid submission') : 'Private storage unavailable; retry with the same reference', reference: ref || undefined, retryable: phase !== 'validation' }, capacity?507:bounds?413:phase === 'validation' ? 400 : 503);
    }
}
export async function notify(ref: string, env: Env) {
    if(!ready(env)||!await scopeMatches(env)||!await storageHealthy(env))return json({error:"Submission bindings/scope unavailable"},503);
    const db = env.SUBMISSIONS_DB!, now = Date.now();
    let row = await db.prepare('SELECT * FROM submissions WHERE ref=?').bind(ref).first<Row>();
    if (!row)
        return json({ error: 'Submission not found' }, 404);
    if (row.state === 'expired' || row.expires < now)
        return json({ error: 'Submission expired' }, 410);
    if (row.provider_id)
        return json({ reference: ref, state: 'email_accepted', providerId: row.provider_id, persisted: true, delivered: false });
    if(!env.RESEND_API_KEY){
        await db.prepare("UPDATE submissions SET failure='email-configuration' WHERE ref=? AND provider_id IS NULL").bind(ref).run();
        return json({reference:ref,state:row.state,persisted:true,delivered:false,notification:'configuration-required',error:'Saved privately. Email is not configured; no email was sent. Retain this reference and retry after configuration.'},202);
    }
    if (now - row.created > 23 * 3600000) {
        await db.prepare("UPDATE submissions SET state='requires_attention',failure='retry-window-expired' WHERE ref=?").bind(ref).run();
        return json({ reference: ref, state: 'requires_attention', error: 'Retry window expired; operator review required' }, 409);
    }
    await db.prepare("UPDATE submissions SET state='stored' WHERE ref=? AND state='email_pending' AND lease<?").bind(ref, now).run();
    const claim = await db.prepare("UPDATE submissions SET state='email_pending',lease=?,updated=? WHERE ref=? AND state IN ('stored','failed')").bind(now + 120000, now, ref).run();
    if (!claim.meta.changes)
        return json({ reference: ref, state: 'email_pending', persisted: true, error: 'Delivery attempt in progress; retry with same reference' }, 409);
    try {
        row = (await db.prepare('SELECT * FROM submissions WHERE ref=?').bind(ref).first<Row>())!;
        const payload = JSON.parse(row.payload), artifacts: Artifact[] = JSON.parse(row.artifacts);
        const attachments = [];
        for (const a of artifacts) {
            const obj = await fileStore(env).get(a.key);
            if (!obj)
                throw Error('Stored attachment missing');
            const b = new Uint8Array(await obj.arrayBuffer());
            if (await hash(b) !== a.sha)
                throw Error('Stored attachment integrity mismatch');
            attachments.push({ filename: `${ref}-${a.name}`, content: base64(b), ...(a.name.startsWith('preview')?{content_id:'tag-preview',content_type:a.type}:{}) });
        }
        const text = JSON.stringify({ reference: ref, product: row.product, stage: row.stage, submission: payload, cadValidation: JSON.parse(row.validation), status: 'REVIEW REQUIRED. Do not print automatically.' }, null, 2);
        attachments.push({ filename: `${ref}-spec.json`, content: base64(encode(JSON.parse(text))) });
        const mail = row.product === 'custom-keytag' ? keyTagEmail(payload, row.stage as 'quote' | 'confirm', artifacts.some(a=>a.name.startsWith('preview'))) : { subject: `[Automotive design review] ${ref}`, text, html: shell({ kind: 'Automotive inquiry', banner: 'DESIGN / MANUFACTURING REVIEW REQUIRED', tone: 'info', headline: esc(payload.config.registration), sub: esc(payload.contact.name), preheader: ref, body: (artifacts.some(a=>a.name.startsWith('preview'))?'<tr><td><img src="cid:tag-preview" alt="Submitted preview" width="544" style="max-width:100%;height:auto"/></td></tr>':'')+section('Submitted configuration', rows(Object.entries(payload.config).map(([k, v]) => [k, String(v)]))), footer: 'CAD and commercial rights require review. No print authorization.' }) };
        if(backend(env)==='d1'){
            const periods=[['day:'+new Date().toISOString().slice(0,10),80],['month:'+new Date().toISOString().slice(0,7),2000]] as const;
            for(const [period,limit] of periods){const budget=await db.prepare('INSERT INTO submission_email_budget(period,hits) VALUES(?,1) ON CONFLICT(period) DO UPDATE SET hits=hits+1 WHERE hits<?').bind(period,limit).run();if(!budget.meta.changes)throw Error('Free notification budget exhausted');}
        }
        const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Idempotency-Key': `zenki-${ref}` }, body: JSON.stringify({ ...businessMail, subject: mail.subject, html: mail.html, text: mail.text + '\n\n' + text, attachments }) });
        if (!res.ok)
            throw Error('Email provider did not accept notification');
        const receipt = await res.json() as {
            id?: string;
        };
        if (typeof receipt.id!=='string'||receipt.id.length<4)
            throw Error('Missing provider receipt');
        await db.prepare("UPDATE submissions SET state='email_accepted',provider_id=?,failure=NULL,updated=? WHERE ref=?").bind(receipt.id, Date.now(), ref).run();
        return json({ reference: ref, state: 'email_accepted', persisted: true, providerId: receipt.id, delivered: false, validation: JSON.parse(row.validation) });
    }
    catch (error) {
        const budget=error instanceof Error&&error.message==='Free notification budget exhausted';
        await db.prepare("UPDATE submissions SET state='failed',failure=?,lease=0,updated=? WHERE ref=?").bind(budget?'free-email-budget':'notification',Date.now(), ref).run();
        return json({ reference: ref, state: 'failed', persisted: true, error: budget?'Saved privately. Email is paused at the free notification limit; retry later with the same reference.':'Saved privately, but notification failed. Retry with the same reference.', retryable: true }, budget?429:502);
    }
}
export const readiness=async(env:Env)=>{
 const scoped=await scopeMatches(env),healthy=await storageHealthy(env);
 const missing=['SUBMISSIONS_DB','SUBMISSION_NAMESPACE','SUBMISSION_ALLOWED_HOSTS'].filter(k=>!env[k as keyof Env]);
 if(env.SUBMISSIONS_DB&&env.SUBMISSION_NAMESPACE&&!scoped)missing.push('SUBMISSION_SCOPE_GUARD');
 if(!healthy)missing.push('SUBMISSION_STORAGE_SCHEMA_OR_BACKEND');
 const storageReady=ready(env)&&scoped&&healthy;
 if(!env.RESEND_API_KEY)missing.push('RESEND_API_KEY');
 if(!env.SUBMISSIONS_ADMIN_TOKEN)missing.push('SUBMISSIONS_ADMIN_TOKEN');
 let selected='invalid';try{selected=backend(env)}catch{}
 return json({ready:storageReady&&!!env.RESEND_API_KEY&&!!env.SUBMISSIONS_ADMIN_TOKEN,storageReady,notificationReady:!!env.RESEND_API_KEY,privateAccessReady:!!env.SUBMISSIONS_ADMIN_TOKEN,storageBackend:selected,missing,deliveryConfirmed:false,maxFileBytes:MAX_FILE_BYTES,maxPackageBytes:MAX_PACKAGE_BYTES},storageReady?200:503);
};
