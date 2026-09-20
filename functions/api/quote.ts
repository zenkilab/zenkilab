// Cloudflare Pages Function — handles POST /api/quote
// Sends quote submissions via Resend API with file attachments.
//
// Requires:
//   Cloudflare Pages env var: RESEND_API_KEY

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

  const fields = [
    { label: "Name", value: name },
    { label: "Email", value: email },
    { label: "Phone", value: phone || "—" },
    { label: "Country", value: country || "—" },
    { label: "Material", value: material },
    { label: "Color", value: color || "—" },
    { label: "Quantity", value: quantity || "—" },
    { label: "Layer Height", value: layerHeight || "—" },
    { label: "Desired Date", value: desiredDate || "—" },
    { label: "Files Uploaded", value: fileCount || String(uploadedFiles.length) },
    { label: "Notes", value: notes || "—" },
  ];

  const rows = fields
    .map(
      (f) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #1E232B;color:#8B919E;font-size:13px;white-space:nowrap">${f.label}</td><td style="padding:8px 12px;border-bottom:1px solid #1E232B;color:#fafafa;font-size:13px">${sanitize(f.value)}</td></tr>`
    )
    .join("");

  const fileNames = uploadedFiles.map((f) => f.name).join(", ") || "None";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0F1115;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" style="max-width:600px;margin:0 auto;background:#0F1115">
<tr><td style="padding:32px 24px 20px">
<span style="font-size:18px;font-weight:700;color:#fafafa;letter-spacing:-0.02em">ZENKI<span style="color:#38C8F5">LAB</span></span>
</td></tr>
<tr><td style="padding:0 24px 8px">
<h1 style="font-size:20px;font-weight:700;color:#fafafa;margin:0 0 4px">New Quote Request</h1>
<p style="font-size:14px;color:#8B919E;margin:0">${sanitize(name)} submitted a project enquiry.</p>
</td></tr>
<tr><td style="padding:20px 24px">
<table width="100%" style="background:#161A20;border-radius:12px;border:1px solid rgba(255,255,255,0.06);overflow:hidden">
${rows}
</table>
</td></tr>
<tr><td style="padding:24px">
<p style="font-size:12px;color:#4B5260;margin:0">Sent via Zenki Lab quoting system · Reply directly to this email to respond to ${sanitize(name)}</p>
</td></tr>
</table>
</body>
</html>`;

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

function sanitize(str: string): string {
  return str
    .replaceAll("&", "\u0026")
    .replaceAll("<", "\u003C")
    .replaceAll(">", "\u003E")
    .replaceAll('"', "\u0022");
}
