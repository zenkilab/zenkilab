import { registrationLayout, contrast, filamentColors } from '../../../src/lib/automotive';
import { validateModel } from './validate';
import { businessMail } from './business';
import { parseOrder, keyTagEmail } from '../keytag-email';
import definitions from '../../../src/lib/automotive-logo-definitions.json';
import { esc, shell, rows, section } from '../email';
interface Statement {
    bind(...args: unknown[]): Statement;
    run(): Promise<{
        meta: {
            changes: number;
        };
    }>;
    first<T = Record<string, unknown>>(): Promise<T | null>;
    all<T = Record<string, unknown>>(): Promise<{
        results: T[];
    }>;
}
export interface Env {
    RESEND_API_KEY?: string;
    SUBMISSIONS_DB?: {
        prepare(sql: string): Statement;
    };
    SUBMISSIONS_FILES?: {
        put(key: string, value: Uint8Array): Promise<unknown>;
        get(key: string): Promise<{
            arrayBuffer(): Promise<ArrayBuffer>;
        } | null>;
        delete(key: string): Promise<void>;
    };
    SUBMISSION_NAMESPACE?: string;
    SUBMISSION_ALLOWED_HOSTS?: string;
    SUBMISSION_RETENTION_DAYS?: string;
    SUBMISSIONS_ADMIN_TOKEN?: string;
}
type Artifact = {
    name: string;
    key: string;
    sha: string;
    type: string;
    size: number;
};
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
function ready(env: Env) { return !!(env.RESEND_API_KEY && env.SUBMISSIONS_DB && env.SUBMISSIONS_FILES && env.SUBMISSION_NAMESPACE && env.SUBMISSION_ALLOWED_HOSTS); }
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
    if (!ready(env))
        return json({ error: 'Submissions are temporarily unavailable. Your design has not been sent. Keep your prepared package or use WhatsApp.', readiness: false }, 503);
    const host = new URL(request.url).hostname;
    if (!env.SUBMISSION_ALLOWED_HOSTS!.split(',').includes(host) || request.headers.get('Origin') && new URL(request.headers.get('Origin')!).host !== new URL(request.url).host)
        return json({ error: 'Origin not allowed' }, 403);
    let ref = '', phase = 'validation', prior: Row | null = null;
    try {
        const f = await limited(request);
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
                validation={...(validation as Record<string,unknown>),stlCoordinateDimensionScreen:true,stlIndependentlyMatched:false};
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
                const object = await env.SUBMISSIONS_FILES!.get(a.key);
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
        if (!row) {
            const days = Math.min(180, Math.max(7, Number(env.SUBMISSION_RETENTION_DAYS) || 30));
            await db.prepare('INSERT OR IGNORE INTO submissions(ref,digest,product,stage,state,payload,artifacts,validation,created,updated,expires,lease) VALUES(?,?,?,?,?,?,?,?,?,?,?,0)').bind(ref, digest, product, stage, 'received', JSON.stringify(payload), JSON.stringify(artifacts), JSON.stringify(validation), now, now, now + days * 86400000).run();
            row = await db.prepare('SELECT * FROM submissions WHERE ref=?').bind(ref).first<Row>();
            if (!row || row.digest !== digest)
                return json({ error: 'Concurrent reference conflict' }, 409);
        }
        await db.prepare("UPDATE submissions SET state='validated',updated=? WHERE ref=? AND state IN ('received','failed')").bind(now, ref).run();
        for (let i = 0; i < artifacts.length; i++)
            await env.SUBMISSIONS_FILES!.put(artifacts[i].key, bytes[i]);
        await db.prepare("UPDATE submissions SET state='stored',updated=? WHERE ref=? AND state='validated'").bind(now, ref).run();
        return await notify(ref, env);
    }
    catch (e) {
        if (ref && env.SUBMISSIONS_DB)
            await env.SUBMISSIONS_DB.prepare("UPDATE submissions SET state='failed',failure='validation-or-storage',updated=? WHERE ref=? AND state NOT IN ('email_pending','email_accepted')").bind(Date.now(), ref).run().catch(() => { });
        return json({ error: phase === 'validation' ? (e instanceof Error ? e.message : 'Invalid submission') : 'Private storage unavailable; retry with the same reference', reference: ref || undefined, retryable: phase !== 'validation' }, phase === 'validation' ? 400 : 503);
    }
}
export async function notify(ref: string, env: Env) {
    const db = env.SUBMISSIONS_DB!, now = Date.now();
    let row = await db.prepare('SELECT * FROM submissions WHERE ref=?').bind(ref).first<Row>();
    if (!row)
        return json({ error: 'Submission not found' }, 404);
    if (row.state === 'expired' || row.expires < now)
        return json({ error: 'Submission expired' }, 410);
    if (row.provider_id)
        return json({ reference: ref, state: 'email_accepted', providerId: row.provider_id, persisted: true, delivered: false });
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
            const obj = await env.SUBMISSIONS_FILES!.get(a.key);
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
    catch {
        await db.prepare("UPDATE submissions SET state='failed',failure='notification',lease=0,updated=? WHERE ref=?").bind(Date.now(), ref).run();
        return json({ reference: ref, state: 'failed', persisted: true, error: 'Saved privately, but notification failed. Retry with the same reference.', retryable: true }, 502);
    }
}
export const readiness = (env: Env) => json({ ready: ready(env), missing: ['RESEND_API_KEY', 'SUBMISSIONS_DB', 'SUBMISSIONS_FILES', 'SUBMISSION_NAMESPACE', 'SUBMISSION_ALLOWED_HOSTS'].filter(k => !env[k as keyof Env]), deliveryConfirmed: false }, ready(env) ? 200 : 503);
