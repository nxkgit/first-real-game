import { handleRequest } from './handler';
import type { Env } from './types';

// Cloudflare Worker entry point. All behaviour lives in handler.ts so it can be tested without the runtime.
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
