import { handle, type Env } from '../../_lib/submissions/service';
export const onRequestPost = ({ request, env }: {
    request: Request;
    env: Env;
}) => handle(request, env, true);
