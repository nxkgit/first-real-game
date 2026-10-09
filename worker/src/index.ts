import { handleRequest } from './handler.ts';
import type { Env } from './types.ts';

// Cloudflare Worker entry point. All behaviour lives in handler.ts so it can be tested without the runtime.
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
