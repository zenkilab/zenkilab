// Platform failures can be HTML (for example, a Worker resource limit).
// Never render that body or mistake it for a durable submission receipt.
export async function readSubmissionReceipt(response: Response) {
    try {
        const receipt = await response.json();
        if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) throw Error();
        return receipt;
    } catch {
        throw Error('The submission service is unavailable. Keep your prepared files and retry with the same reference, or use WhatsApp for design review. Submission is not confirmed.');
    }
}
