# Report proxy (Cloudflare Worker)

Receives bug reports from the game, stores the state snapshot in Cloudflare KV, and files a labelled GitHub Issue. Design and reasoning: `../QA_PLAN.md`.

- `POST /report` (header `X-Report-Secret`): validates, rate-limits (20 an hour per tester ID, 60 an hour per address), stores the snapshot, files the issue with the `needs-triage` label. Returns `{ ok, issue, snapshotId }`.
- `GET /snapshot/<id>` (header `X-Maintainer-Key`): returns a stored snapshot. For the maintainer's `?dev` load flow.
- Browser calls are only accepted from the origins in `wrangler.toml`'s `ALLOWED_ORIGINS`.

Code is in `src/`: `handler.ts` (all behaviour, tested), `report.ts` (validation and issue text), `config.ts` (every limit), `index.ts` (the thin Worker entry). Tests: `npm test` from the repo root; typecheck: `npm run worker:check` (both are part of `npm run verify`).

## Deploying (maintainer, from the repo root)

1. Once: `npx wrangler login` (opens a browser to approve access to the Cloudflare account).
2. Once, from `worker/`: set the three secrets. Each command prompts for the value; nothing is stored in the repo.
   - `npx wrangler secret put GITHUB_TOKEN` — a fine-grained GitHub token for this repo only, Issues read and write.
   - `npx wrangler secret put REPORT_SECRET` — a long random string. The game build sends it too (it is visible in the page source, so it only stops casual abuse).
   - `npx wrangler secret put MAINTAINER_KEY` — a different long random string, kept private. Reads snapshots.
3. `npm run worker:deploy`.

The KV namespace (`bug-report-limits`) and the `workers.dev` subdomain already exist; the namespace id is in `wrangler.toml`.

## Notes
- Rate-limit counters live in the same KV namespace as snapshots (`rl:` and `snap:` key prefixes). KV is not atomic, so two simultaneous requests can both slip under a limit; fine for a friends-only playtest.
- Snapshots expire after 90 days (`LIMITS.snapshotTtlSeconds`, provisional).
- The GitHub token expires (a year at most). Note the date when it is created.
