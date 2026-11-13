import { notify, type Env } from '../../_lib/submissions/service';
export const onRequestPost = async ({ request, env }: {
    request: Request;
    env: Env;
}) => { if (!env.SUBMISSIONS_ADMIN_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.SUBMISSIONS_ADMIN_TOKEN}`)
    return new Response('Unauthorized', { status: 401 }); const { reference } = await request.json() as {
    reference: string;
}; if (!/^(KT-|AK-)[A-Z0-9-]{4,60}$/.test(reference))
    return new Response('Invalid reference', { status: 400 }); return notify(reference, env); };
