import type { StoredDogTagOrder } from "./dogtag";

/**
 * Sends the order to the business (POST /api/hub/dog-tag-order). The server builds the email,
 * spec and price from the order data, so only the raw order, the render and the 3MF go up.
 */
export async function sendOrder(order: StoredDogTagOrder, stage: "quote" | "confirm", model?: Blob) {
  const { thumbnail, ...data } = order;
  const form = new FormData();
  form.append("stage", stage);
  form.append("order", JSON.stringify(data));
  if (thumbnail.startsWith("data:image/jpeg")) form.append("preview", await (await fetch(thumbnail)).blob(), `${order.orderId}.jpg`);
  if (model) form.append("model", new File([model], `${order.orderId}.3mf`, { type: "model/3mf" }));
  try {
    const res = await fetch("/api/hub/dog-tag-order", { method: "POST", body: form });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `HTTP ${res.status}`);
  } catch (e) {
    if (process.env.NODE_ENV !== "development") throw e;
    console.warn(`dog tag ${stage} not sent (dev only):`, e);
  }
}
