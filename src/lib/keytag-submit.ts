import type { StoredOrder } from './keytag';
type Receipt = {
    reference: string;
    state: string;
    persisted: boolean;
    providerId: string;
    delivered: boolean;
};
const pending = new Map<string, {
    order: StoredOrder;
    model?: Blob;
}>();
export async function sendOrder(order: StoredOrder, stage: 'quote' | 'confirm', model?: Blob): Promise<Receipt> {
    const signature = JSON.stringify({ stage, configs: order.configs || [order.config], contact: order.contact });
    let item = pending.get(signature);
    if (!item) {
        item = { order: { ...order }, model };
        pending.set(signature, item);
    }
    if (stage === 'quote')
        order.orderId = item.order.orderId;
    const data = { ...item.order, thumbnail: undefined, thumbnails: undefined };
    const form = new FormData();
    form.append('stage', stage);
    form.append('order', JSON.stringify(data));
    if (item.order.thumbnail.startsWith('data:image/jpeg'))
        form.append('preview', await (await fetch(item.order.thumbnail)).blob(), 'preview.jpg');
    if (item.model)
        form.append('model', item.model, 'model.3mf');
    const response = await fetch('/api/hub/keytag-order', { method: 'POST', body: form });
    const receipt = await response.json();
    if (!response.ok)
        throw Error(receipt.error || 'Submission failed');
    if (!receipt.persisted || receipt.state !== 'email_accepted' || !receipt.providerId)
        throw Error((receipt.reference?`Reference ${receipt.reference}: `:'')+(receipt.error||'Server did not confirm storage and provider acceptance'));
    return receipt;
}
