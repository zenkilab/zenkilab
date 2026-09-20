// Cloudflare Pages Function: POST /api/hub/keytag-order
// Zenki Hub key tag orders. Deliberately isolated from /api/quote and any ERPNext
// quotation logic. Emails the order spec (and the 3MF on the "quote" stage) to the business.
//
// stage "quote":   multipart { stage, orderId, spec, model (.3mf) }
// stage "confirm": multipart { stage, orderId, spec }   (customer confirmed, add to queue)
//
// Requires Cloudflare Pages env var: RESEND_API_KEY

interface Env {
  RESEND_API_KEY: string;
}

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
  const orderId = String(form.get("orderId") ?? "");
  const spec = String(form.get("spec") ?? "");
  if ((stage !== "quote" && stage !== "confirm") || !/^KT-[A-Z0-9]{4,16}$/.test(orderId) || !spec || spec.length > 4000)
    return json({ error: "Invalid order" }, 400);

  const attachments: { filename: string; content: string }[] = [
    { filename: `${orderId}-spec.txt`, content: toBase64(new TextEncoder().encode(spec)) },
  ];

  if (stage === "quote") {
    const model = form.get("model");
    if (!(model instanceof File) || model.size === 0 || model.size > 5 * 1024 * 1024)
      return json({ error: "Missing or oversized 3MF" }, 400);
    attachments.push({ filename: `${orderId}.3mf`, content: toBase64(new Uint8Array(await model.arrayBuffer())) });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: "Zenki Lab <quote@zenkilab.com>",
      to: ["quote@zenkilab.com"],
      subject: stage === "quote" ? `[Key Tag] New quote ${orderId}` : `[Key Tag] CONFIRMED ${orderId}`,
      text: spec,
      attachments,
    }),
  });

  if (!res.ok) {
    console.error("Resend error:", await res.text());
    return json({ error: "Failed to send email" }, 500);
  }
  return json({ success: true });
};
