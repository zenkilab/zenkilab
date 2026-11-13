"use client";
import { useState, useRef, type RefObject } from 'react';
import { generateAutomotive, type AutomotiveConfig } from '@/lib/cad/automotive';
import { readSubmissionReceipt } from '@/lib/submission-response';
async function capture(element: HTMLElement | null) { if (!element)
    throw Error('Preview unavailable'); const existing = element.querySelector('canvas'); if (existing)
    return new Promise<Blob>((resolve, reject) => existing.toBlob(b => b ? resolve(b) : reject(Error('Preview unavailable')), 'image/jpeg', .9)); const source = element.querySelector('svg'); if (!source)
    throw Error('Preview unavailable'); const svg = source.cloneNode(true) as SVGElement; for (const object of svg.querySelectorAll('foreignObject')) {
    const art = object.querySelector('svg');
    if (!art)
        throw Error('Logo not loaded');
    const clone = art.cloneNode(true) as SVGElement;
    for (const key of ['x', 'y', 'width', 'height'])
        clone.setAttribute(key, object.getAttribute(key)!);
    const wrapper = object.querySelector<HTMLElement>('.automotive-emblem');
    clone.setAttribute('style', `color:${wrapper?.style.color};--body:${wrapper?.style.getPropertyValue('--body')}`);
    object.replaceWith(clone);
} svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.setAttribute('width', '1024'); svg.setAttribute('height', '544'); const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })); try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 544;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error('Preview failed')), 'image/jpeg', .9));
}
finally {
    URL.revokeObjectURL(url);
} }
export default function SubmissionPanel({ config, preview, enabled }: {
    config: AutomotiveConfig;
    preview: RefObject<HTMLButtonElement | null>;
    enabled: boolean;
}) {
    const [name, setName] = useState(''), [phone, setPhone] = useState(''), [review, setReview] = useState(false), [busy, setBusy] = useState(false), [status, setStatus] = useState(''), [error, setError] = useState('');
    const reference = useRef('AK-' + crypto.randomUUID().toUpperCase());
    const [accepted, setAccepted] = useState(false);
    const [persisted,setPersisted]=useState(false);
    const [copied, setCopied] = useState(false);
    const [packageData, setPackage] = useState<{
        preview: Blob;
        model?: Blob;
        stl?: Blob;
    } | null>(null);
    async function prepare() { setBusy(true); setError(''); try {
        setStatus('Preparing actual geometry and preview…');
        const cad = await generateAutomotive(config);
        const image = await capture(preview.current);
        setPackage({ preview: image, ...(cad ? { model: cad.model, stl: cad.stl } : {}) });
        setStatus(cad ? 'Client CAD generated. Structural server checks and manufacturing review still required.' : 'Inquiry package prepared. No production CAD generated for this brand.');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Could not prepare package');
    }
    finally {
        setBusy(false);
    } }
    async function submit() { if (!packageData)
        return; setBusy(true); setError(''); try {
        setStatus('Uploading and waiting for private storage and email-provider acceptance…');
        const form = new FormData();
        form.append('product', 'automotive');
        form.append('reference', reference.current);
        form.append('submission', JSON.stringify({ config, contact: { name, phone } }));
        form.append('preview', packageData.preview, 'preview.jpg');
        if (packageData.model)
            form.append('model', packageData.model, 'model.3mf');
        if (packageData.stl)
            form.append('stl', packageData.stl, 'model.stl');
        const r = await fetch('/api/submissions', { method: 'POST', body: form });
        const result = await readSubmissionReceipt(r);
        if(result.persisted&&result.reference)setPersisted(true);
        if (!r.ok)
            throw Error((result.reference ? `Reference ${result.reference}: ` : '') + (result.error || 'Submission failed'));
        if (!result.persisted || result.state !== 'email_accepted' || !result.providerId)
            throw Error((result.reference?`Reference ${result.reference}: `:'')+(result.error||'Incomplete server receipt'));
        setAccepted(true);
        setStatus(`Saved privately. Reference ${result.reference}. Email accepted by provider; inbox delivery is not confirmed.`);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Submission failed');
        setStatus('Your selections and prepared attachments are retained. Retry uses the same reference.');
    }
    finally {
        setBusy(false);
    } }
    return <section aria-label="Submit design" style={{ marginTop: 24, borderTop: '1px solid #414a57', paddingTop: 20 }}><h3>Send your design to Zenki Lab</h3><label htmlFor="submission-name">Your name</label><input id="submission-name" autoComplete="name" maxLength={80} disabled={accepted} value={name} onChange={e => setName(e.target.value)}/><label htmlFor="submission-phone">WhatsApp / phone</label><input id="submission-phone" autoComplete="tel" type="tel" maxLength={30} disabled={accepted} value={phone} onChange={e => setPhone(e.target.value)}/><button disabled={busy || !enabled || accepted} onClick={prepare}>Prepare package for review</button>{packageData && <><label><input type="checkbox" checked={review} onChange={e => setReview(e.target.checked)} style={{ width: 'auto' }}/> I reviewed the preview and choices; final manufacturing approval is required.</label><button disabled={busy || accepted || !review || name.trim().length < 2 || phone.replace(/\D/g, '').length < 9} onClick={submit}>Submit design package</button></>}<p role="status">{status}</p>{persisted && <button onClick={async()=>{try{await navigator.clipboard.writeText(reference.current);setCopied(true)}catch{setError(`Copy this reference: ${reference.current}`)}}}>{copied?'Reference Copied':'Copy Reference'}</button>}{error && <p role="alert">{error}</p>}<small>No print authorization or checkout. Retry retains your package; no delivery claim without confirmation.</small></section>;
}
