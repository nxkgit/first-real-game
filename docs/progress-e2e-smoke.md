# Progress: E2E smoke tests (branch auto/e2e-smoke)

## Report

Built a headless-Chromium (Playwright) end-to-end suite that plays the real game. Docs: `docs/E2E.md`.

- `playwright.config.ts`, `e2e/` (harness, flows, 7 spec files, tsconfig), npm scripts `e2e`, `e2e:install`, `e2e:typecheck`. Config starts `vite` itself (port 5199). `npm run verify` is unchanged and browser-free.
- `?e2e` hook in `src/main.ts` (about 20 lines): exposes `window.__game` and `window.__step(frames, dtMs)`. Inert without `?e2e` (tested).
- `.github/workflows/e2e.yml`: PRs and pushes to `auto/**`, `integration/**`; installs Chromium, builds, runs the suite, uploads traces on failure. Non-blocking (`continue-on-error: true`).
- Added devDependencies `@playwright/test` and `@types/node` (the latter only for typechecking `e2e/`).

## What was verified

Chromium downloaded and ran here (Windows). `npm run verify` passes, `npm run e2e:typecheck` passes. Suite: 20 tests, **20/20 passed in each of 5 consecutive full runs** (about 5.0 min each, the whole-act test being the long pole at 3 to 5 min); 0 failures, 0 flaky. The act test gave the identical result every run (won, with 2 heal-to-full assists). Not run: the GitHub Actions workflow itself (no push-triggered result available to this session), and Linux.

Coverage by brief item: (a) boot.e2e, (b) combat.e2e, (c) devpanel.e2e, (d) stops.e2e, (e) synergy.e2e (7 fights: scaling by cards played and by block, empowered doubling, exhaust, exhaust payoff, Cull energy gain, triggers on card played / end of turn / kill, Blood Strike self-damage + Pain Engine), (f) save.e2e, (g) act.e2e (seed 1, real UI, ends on ACT COMPLETE).

Real bugs found in game code: none. No `test.fail` marks needed.

This is the first time scenes were exercised by an automated browser; every test also fails on any console error, uncaught exception or unhandled rejection, and none occurred.

## Decisions I made

- **Dev server, not preview.** Tests import game modules via `/src/...` to read run/combat state and set up fights. Reverse: build a preview target and expose state through the hook instead (a bigger hook).
- **`.e2e.ts` file suffix** so vitest does not collect the specs (avoids editing `vite.config.ts`).
- **Real loop stopped, virtual clock stepping.** The hook only exposes the game and a stepper; `game.loop.stop()` is done by the test harness, so the hook stays tiny.
- **Readouts found by on-screen position** (text objects at the PlayerView/EnemyView coordinates) and compared with `CombatState`. Brittle if layout moves; documented in E2E.md.
- **Synergy fights use decks of at most 5 cards** so the opening hand is the whole deck (no shuffle dependence). Expected numbers hand-derived from card data and provisional like the cards.
- **Seed 1** for dev-panel and act tests because seed 123's map has no shop; seed 1 has every stop kind.
- **Act policy** uses the keyboard in fights (number keys, E) for speed and mouse everywhere else; heals to full via a page-side call when under 50% HP on the map (stand-in for the dev panel's Heal full), since the map offers few rests and the dumb policy otherwise dies around floor 8. Win/loss is reported, not asserted.
- **No retries** in the Playwright config.
- Non-blocking CI via `continue-on-error: true` on the job.
- Added `@types/node` devDependency for `e2e/` typechecking.

## Follow-ups

- Promote the CI job once it has run green on GitHub a few times (remove `continue-on-error`).
- The act test takes 3 to 5 minutes (software WebGL); could be split or moved to a nightly job if CI time matters.
- Possible UI issue to check by eye (not tested): with a full 10-card hand the hand layout in `CombatScene.syncHand` is `hand.length * 120` px wide, which exceeds the 800 px screen.
- Phone layouts and touch input are not covered.

## What a human should look at

- That the E2E workflow runs green on GitHub (Linux, `--with-deps`).
- `src/main.ts` hook (the only game-code change).
