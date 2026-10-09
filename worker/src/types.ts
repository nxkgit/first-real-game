// The small slice of the Cloudflare runtime this Worker uses, declared here so the project needs no
// extra type package. `KV` matches the real KVNamespace's get/put for strings.
export interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  /** KV namespace holding rate-limit counters (`rl:...`) and stored snapshots (`snap:...`). */
  STORE: KV;
  /** Secrets (set with `wrangler secret put`, never in the repo). */
  GITHUB_TOKEN: string;
  REPORT_SECRET: string;
  MAINTAINER_KEY: string;
  /** Plain variables from wrangler.toml. */
  GITHUB_REPO: string;
  /** Comma-separated list of origins allowed to call this Worker from a browser. */
  ALLOWED_ORIGINS: string;
}

export interface Deps {
  fetch: typeof fetch;
  now: () => number;
  newId: () => string;
}
