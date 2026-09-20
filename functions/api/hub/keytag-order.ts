// Cloudflare Pages Function: POST /api/hub/keytag-order
// Zenki Hub key tag orders. Deliberately isolated from /api/quote and any ERPNext
// quotation logic. Emails the order to the business (styled HTML, plain text fallback,
// spec .txt, and the 3MF on the "quote" stage).
//
// stage "quote":   multipart { stage, order (JSON), preview (jpeg), model (.3mf) }
// stage "confirm": multipart { stage, order (JSON), preview (jpeg) }   (customer confirmed, add to queue)
//
// Requires Cloudflare Pages env var: RESEND_API_KEY

import { keyTagEmail, parseOrder } from "../../_lib/keytag-email";

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

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!env.RESEND_API_KEY) return json({ error: "Server not configured" }, 500);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid form data" }, 400);
  }

  const stage = form.get("stage");
  const rawOrder = String(form.get("order") ?? "");
  const order = rawOrder.length <= 4000 ? parseOrder(rawOrder) : null;
  if ((stage !== "quote" && stage !== "confirm") || !order) return json({ error: "Invalid order" }, 400);

  // Render of the customer's tag, shown at the top of the email. Optional: skipped if missing or not a small JPEG.
  const preview = form.get("preview");
  const hasPreview = preview instanceof File && preview.type === "image/jpeg" && preview.size > 0 && preview.size <= 1024 * 1024;

  const attachments: Attachment[] = [
    { filename: `${order.orderId}-spec.txt`, content: toBase64(new TextEncoder().encode(keyTagEmail(order, stage, false).text)) },
  ];

  if (stage === "quote") {
    const model = form.get("model");
    if (!(model instanceof File) || model.size === 0 || model.size > 5 * 1024 * 1024)
      return json({ error: "Missing or oversized 3MF" }, 400);
    attachments.push({ filename: `${order.orderId}.3mf`, content: toBase64(new Uint8Array(await model.arrayBuffer())) });
  }

  const previewFile: Attachment[] = hasPreview
    ? [{ filename: `${order.orderId}.jpg`, content: toBase64(new Uint8Array(await preview.arrayBuffer())), content_type: "image/jpeg", content_id: "tag-preview" }]
    : [];

  const send = (withPreview: boolean) => {
    const mail = keyTagEmail(order, stage, withPreview);
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
