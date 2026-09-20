// Cloudflare Pages Function — handles POST /api/quote
// Sends quote submissions via Resend API with file attachments.
//
// Requires:
//   Cloudflare Pages env var: RESEND_API_KEY

import { C, button, esc, rows, section, shell, whatsappUrl } from "../_lib/email";

interface Env {
  RESEND_API_KEY: string;
}

export const onRequestPost = async ({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  const RESEND_API_KEY = env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY environment variable is not set");
    return new Response(
      JSON.stringify({ error: "Server not configured — missing Resend API key" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const country = formData.get("country") as string;
  const material = formData.get("material") as string;
  const color = formData.get("color") as string;
  const quantity = formData.get("quantity") as string;
  const layerHeight = formData.get("layerHeight") as string;
  const notes = formData.get("notes") as string | null;
  const desiredDate = formData.get("desiredDate") as string | null;
  const fileCount = formData.get("fileCount") as string;

  if (!name || !email || !material) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Collect uploaded files as base64 attachments
  const attachments: Array<{ filename: string; content: string; content_type: string }> = [];
  const uploadedFiles = formData.getAll("files") as File[];

  for (const file of uploadedFiles) {
    if (file && file.size > 0 && file.size < 250 * 1024 * 1024) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);
      attachments.push({
        filename: file.name,
        content: base64,
        content_type: file.type || "application/octet-stream",
      });
    }
  }

  const fileNames = uploadedFiles.map((f) => f.name).join(", ") || "None";

  const dash = (v: string | null | undefined) => v || "-";
  const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  const wa = phone ? whatsappUrl(phone) : null;
  const sentFiles = uploadedFiles.filter((f) => f && f.size > 0);

  const html = shell({
    kind: "Project Quote",
    banner: "NEW PROJECT QUOTE REQUEST · REPLY TO THE CUSTOMER",
    tone: "info",
    headline: esc(name),
    sub: `${esc(material)}${quantity ? ` &middot; qty ${esc(quantity)}` : ""}${desiredDate ? ` &middot; needed by ${esc(desiredDate)}` : ""}`,
    preheader: `${name}: ${material}${quantity ? `, qty ${quantity}` : ""}`,
    body: [
      section(
        "Customer",
        rows([
          ["Name", name],
          ["Email", { html: `<a href="mailto:${esc(email)}" style="color:${C.cyanInk}">${esc(email)}</a>` }],
          ["Phone", dash(phone)],
          ["Country", dash(country)],
        ]) +
          `<div style="padding-top:14px">${button(`mailto:${email}`, "Reply by email")}${wa ? ` &nbsp; ${button(wa, "WhatsApp")}` : ""}</div>`,
      ),
      section(
        "Job",
        rows([
          ["Material", material],
          ["Colour", dash(color)],
          ["Quantity", dash(quantity)],
          ["Layer height", dash(layerHeight)],
          ["Needed by", dash(desiredDate)],
        ]),
      ),
      notes
        ? section("Notes", `<div style="font-size:14px;line-height:1.55;color:${C.ink};white-space:pre-wrap;background:#F6F7F9;border-radius:8px;padding:12px 14px">${esc(notes)}</div>`)
        : "",
      section(
        `Files (${sentFiles.length}${fileCount && Number(fileCount) !== sentFiles.length ? ` of ${esc(fileCount)} sent` : ""})`,
        sentFiles.length
          ? rows(sentFiles.map((f): [string, string] => [f.name, kb(f.size)]))
          : `<div style="font-size:14px;color:${C.muted}">No files attached.</div>`,
      ),
    ].join(""),
    footer: "Sent by the Zenki Lab quoting form. Replying to this email goes straight to the customer.",
  });

  const text = `New quote request from ${name} (${email}).\nPhone: ${phone}\nMaterial: ${material}\nQuantity: ${quantity}\nColor: ${color}\nNotes: ${notes || "None"}\nFiles: ${fileNames}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Zenki Lab <quote@zenkilab.com>",
        to: ["quote@zenkilab.com"],
        subject: `New Quote Request from ${name}`,
        html,
        text,
        reply_to: email,
        attachments: attachments.length > 0 ? attachments : undefined,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend error:", errText);
      let errMsg = "Failed to send email";
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.message || errJson.error || errText.substring(0, 200);
      } catch {
        errMsg = errText.substring(0, 200) || "Failed to send email";
      }
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Email send error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

/** Chunked base64 encoder — avoids stack overflow on Cloudflare Workers */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const len = bytes.length;
  let result = "";
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    if (i + 1 < len) {
      result += chars[((b2 & 15) << 2) | (b3 >> 6)];
      result += i + 2 < len ? chars[b3 & 63] : "=";
    } else {
      result += "==";
    }
  }
  return result;
}
