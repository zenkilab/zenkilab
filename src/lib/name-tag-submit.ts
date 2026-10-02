import type { NameTagOrder } from "./name-tag";

/**
 * Sends the order to the business (POST /api/hub/name-tag-order): the order data, a render of the
 * badge, the customer's logo file and one printable 3MF per plate. The server builds the email.
 */
export async function sendOrder(order: NameTagOrder, parts: { models: Blob[]; preview?: string; logo?: Blob }) {
  const form = new FormData();
  form.append("order", JSON.stringify(order));
  parts.models.forEach((m, i) => form.append("model", new File([m], `${order.orderId}-plate${i + 1}.3mf`, { type: "model/3mf" })));
  if (parts.preview?.startsWith("data:image/jpeg")) form.append("preview", await (await fetch(parts.preview)).blob(), `${order.orderId}.jpg`);
  if (parts.logo) form.append("logo", parts.logo);
  try {
    const res = await fetch("/api/hub/name-tag-order", { method: "POST", body: form });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `HTTP ${res.status}`);
  } catch (e) {
    // The Pages Function does not run under `next dev`, so let local runs continue.
    if (process.env.NODE_ENV !== "development") throw e;
    console.warn("name tag order not sent (dev only):", e);
  }
}
