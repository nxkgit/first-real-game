# Progress: docs catch-up and nightly e2e (branch `auto/docs-ci`)

Written 2026-10-07 by a background agent. Documentation and CI only; no game code changed.

## What was built
- `docs/ART.md` (new): the art pipeline, mapping, fallbacks, tricks (white fill tint, 9-slice border, cropped and dimmed backdrops), how to swap a picture, licence and credit rules.
- `docs/CONTENT_GUIDE.md`: map section (route themes, `MAP_MIN_ELITES`, the every-route-crosses-an-elite rule), synergy cards now in the reward pool, `lateEncounters`, "what the player sees on a card" (live damage numbers), art pointer, corrected content-check note.
- `docs/E2E.md`: harness waits for art, the fast subset command, the CI split, corrected "non-blocking" wording.
- `docs/design/EVIDENCE.md`, `docs/BALANCE.md`: dated banners saying the whole-act/map measurements describe the old map and 11-card pool (not regenerated, on purpose); the per-fight baseline is current.
- `docs/README.md`: index brought up to date (ART, EFFECTS, E2E, synergy findings, progress files; the stale "Expected" list removed; a row for `SCENARIOS.md` saying to check the file exists).
- `.github/workflows/e2e.yml`: job `e2e` (pull requests, `auto/**`/`integration/**` pushes) runs everything except the whole-act test; new job `e2e-full` (nightly cron 03:17 UTC and `workflow_dispatch`) runs everything.
- `HANDOFF.md`: everything done on 2026-10-07 recorded; "Queued by the user" replaced by "In progress on branches" (to be corrected at merge) and "Waiting on the user".
- `DESIGN_LOG.md`: entry for the CI change.

## Verified
- All three workflow files parsed with the `yaml` npm package; `e2e.yml` jobs, conditions and steps printed and read back.
- `npx playwright test --list` shows 20 tests, 19 with `--grep-invert "whole seeded act"`; the 19 were then run: 19 passed (2.1 min).
- Every file path and command written into the docs was opened or run (`npm run content:check -- --info`, `npm run balance:check`, `npx vitest run src/content`).

## NOT executed
- **The workflow on GitHub.** `gh` is not installed and Actions cannot be run here. The nightly job, the `workflow_dispatch` trigger and the job `if:` conditions are only parsed and read, not run. Check the first Actions run after merging (and that scheduled runs appear after the next 03:17 UTC).
- `tools/prepareAssets.py` was not re-run (the raw packs are in the user's main checkout, not this worktree); `docs/ART.md` describes it from reading the script and from the earlier run recorded in the session.

## Decisions I made
- Kept the job id `e2e` for the pull-request job so a branch-protection rule naming it keeps working; the nightly job is `e2e-full`.
- Used `--grep-invert` in the workflow and the docs rather than adding an npm script, to avoid touching `package.json` (other agents may edit it).
- Left `docs/design/EVIDENCE.md` numbers alone and put a banner on top instead of editing the history.

## Follow-ups
- `e2e/harness.ts` waits only for the `ui-border` texture; backdrops queue after it. Waiting for every art key would close a small race (documented in `docs/E2E.md`).
- `HANDOFF.md`'s "In progress on branches" section names work by other agents without their branch names; the orchestrator should correct it at merge.
- Scheduled workflows are switched off by GitHub after 60 days without repository activity.
