import { handle, readiness, type Env } from '../../_lib/submissions/service';
export const onRequestPost = ({ request, env }: {
    request: Request;
    env: Env;
}) => handle(request, env);
export const onRequestGet = ({ env }: {
    env: Env;
}) => readiness(env);
