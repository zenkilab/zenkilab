// Cloudflare Pages Function: POST /api/hub/name-tag-order
// Zenki Hub name tag orders, isolated like keytag-order.ts. Emails the order to the business:
// styled HTML, plain text fallback, spec .txt, the printable 3MF per plate, and the customer's logo.
//
// multipart { order (JSON), preview (jpeg), logo (png/webp/svg), model (.3mf, one per plate) }
//
// Requires Cloudflare Pages env var: RESEND_API_KEY

import { nameTagEmail, nameTagSpec, parseOrder } from "../../_lib/name-tag-email";

interface Env {
  RESEND_API_KEY: string;
}

type Attachment = { filename: string; content: string; content_type?: string; content_id?: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const MAX_PLATES = 5; // 60 badges at 12 per plate
const MAX_MODEL = 8 * 1024 * 1024;
const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/webp": "webp", "image/svg+xml": "svg" };

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!env.RESEND_API_KEY) return json({ error: "Server not configured" }, 500);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid form data" }, 400);
  }

  const rawOrder = String(form.get("order") ?? "");
  const order = rawOrder.length <= 12000 ? parseOrder(rawOrder) : null;
  if (!order) return json({ error: "Invalid order" }, 400);

  const models = form.getAll("model").filter((m): m is File => m instanceof File);
  if (models.length === 0 || models.length > MAX_PLATES || models.length !== Math.ceil(order.config.staff.length / 12) || models.some((m) => m.size === 0 || m.size > MAX_MODEL))
    return json({ error: "Missing or oversized 3MF" }, 400);

  const preview = form.get("preview");
  const hasPreview = preview instanceof File && preview.type === "image/jpeg" && preview.size > 0 && preview.size <= 1024 * 1024;
  const logo = form.get("logo");
  const hasLogo = logo instanceof File && logo.type in LOGO_TYPES && logo.size > 0 && logo.size <= 2 * 1024 * 1024;

  const attachments: Attachment[] = [
    { filename: `${order.orderId}-spec.txt`, content: toBase64(new TextEncoder().encode(nameTagSpec(order, models.length))) },
  ];
  for (const [i, m] of models.entries())
    attachments.push({ filename: `${order.orderId}-plate${i + 1}.3mf`, content: toBase64(new Uint8Array(await m.arrayBuffer())) });
  if (hasLogo) attachments.push({ filename: `${order.orderId}-logo.${LOGO_TYPES[logo.type]}`, content: toBase64(new Uint8Array(await logo.arrayBuffer())) });

  const previewFile: Attachment[] = hasPreview
    ? [{ filename: `${order.orderId}.jpg`, content: toBase64(new Uint8Array(await preview.arrayBuffer())), content_type: "image/jpeg", content_id: "tag-preview" }]
    : [];

  const send = (withPreview: boolean) => {
    const mail = nameTagEmail(order, models.length, withPreview);
    return fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Zenki Lab <quote@zenkilab.com>",
        to: ["quote@zenkilab.com"],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        attachments: withPreview ? [...attachments, ...previewFile] : attachments,
      }),
    });
  };

  let res = await send(hasPreview);
  if (!res.ok && hasPreview) {
    // The inline image is cosmetic. If the mail is rejected with it, send again without so the order is never lost.
    console.error("Resend error with preview, retrying without:", await res.text());
    res = await send(false);
  }
  if (!res.ok) {
    console.error("Resend error:", await res.text());
    return json({ error: "Failed to send email" }, 500);
  }
  return json({ success: true });
};
