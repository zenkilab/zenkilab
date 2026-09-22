import type { StoredOrder } from "./keytag";

/**
 * Sends the order to the business (POST /api/hub/keytag-order). The server builds the email,
 * spec and prices from the order data, so only the raw order, the render and the 3MF go up.
 */
export async function sendOrder(order: StoredOrder, stage: "quote" | "confirm", model?: Blob) {
  const { thumbnail, ...data } = order;
  const form = new FormData();
  form.append("stage", stage);
  form.append("order", JSON.stringify(data));
  if (thumbnail.startsWith("data:image/jpeg")) form.append("preview", await (await fetch(thumbnail)).blob(), `${order.orderId}.jpg`);
  if (model) form.append("model", new File([model], `${order.orderId}.3mf`, { type: "model/3mf" }));
  try {
    const res = await fetch("/api/hub/keytag-order", { method: "POST", body: form });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `HTTP ${res.status}`);
  } catch (e) {
    // The Pages Function does not run under `next dev`, so let local runs continue.
    if (process.env.NODE_ENV !== "development") throw e;
    console.warn(`keytag ${stage} not sent (dev only):`, e);
  }
}
