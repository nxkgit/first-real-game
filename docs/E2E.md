# Browser end-to-end tests

Headless-Chromium smoke tests (Playwright) that play the real game: scenes, buttons, the card-aiming mouse flow and the animation queue. They catch scene and UI breakage that unit tests cannot see. They are **not** part of `npm run verify` (which stays fast and browser-free), and the pull-request CI job is **blocking** (see "CI" below).

They do not replace a human playing for *feel*; they check that the screens come up, stay wired to the game state, and that nothing throws.

## Running

```
npm run e2e:install   # once: downloads Chromium (with OS deps on Linux)
npm run e2e           # whole suite; starts `vite` on port 5199 itself (E2E_PORT to change)
npx playwright test --grep-invert "whole seeded act"   # the fast subset CI runs on pull requests (everything but the whole-act test; about 2 minutes locally)
npx playwright test devpanel          # one file
npx playwright test -g "Cull"         # one test by name
npm run e2e:typecheck # type-checks e2e/ (verify only checks src/)
npx playwright show-trace test-results/<test>/trace.zip   # after a failure (traces are kept on failure)
```

The suite runs against the Vite **dev** server, not a build, because tests reach into game modules with `import('/src/...')` (same module instances the page uses). `npm run build` in CI separately proves the bundle builds.

The whole suite takes about 5 minutes locally: the other tests are quick (5 to 25 s each, run in parallel, about 2 minutes in all, apart from the 1.5-minute combat test) and the whole-act test (g) is the long pole at roughly 3 to 5 minutes. That is why CI runs the fast subset on pull requests and the whole suite nightly (see "CI").

## The `?e2e` hook and the frame stepper

`src/main.ts` adds, only when the address has `?e2e`:

- `window.__game`: the Phaser game.
- `window.__step(frames, dtMs)`: runs `frames` calls of `game.step(clock, dtMs)` on a virtual clock, yielding to the event loop between frames (a `MessageChannel` task) so the combat scene's promise-based animation queue can advance. Returns the clock.

Without `?e2e` nothing is added (a test checks this). The hook changes no gameplay.

Why a stepper: an automated browser tab can count as hidden, and a hidden tab's `requestAnimationFrame` is throttled almost to nothing (see HANDOFF "Browser testing"). So the harness (`e2e/harness.ts`) stops the real loop (`game.loop.stop()`) right after boot and the game only moves when a test steps it. That makes runs deterministic: a tween takes the same number of frames every time, regardless of machine speed. It also lets tests use large steps (33 to 100 ms of game time per frame) to wait out animations quickly.

Input is real: `page.mouse` moves and clicks and `page.keyboard` presses go to the browser, and Phaser reads them as it would from a player. Phaser only reacts to queued pointer/key events when a frame runs, so every click is hover, step, press, step, release, step (`Harness.click`).

### What the harness gives a test

| Helper | What it does |
| --- | --- |
| `open(query)` / `reload()` | load `/?query&e2e`, wait for boot, **wait for the art to load** (the files download in real time, which stepped frames cannot speed up; `afterLoad` in `e2e/harness.ts` waits for the `ui-border` texture; note `preloadArt` queues the backdrops after it, so a screen could in principle draw its fallback instead of a backdrop if they are still arriving; waiting for every key would close that), stop the loop |
| `step(n, dt)` | run frames; fails if the active scene's clock did not advance ("scene stopped advancing"), and on any browser error |
| `waitForScene(key)` | step until that scene is running; fails (naming the scene it is stuck in) after a frame budget |
| `settle()` | step until the fight's animation queue has drained: enemy turn over, input unlocked, no finite tween or timer pending |
| `labels()`, `hasText()` | every visible Phaser Text with its position: the "DOM check" for a canvas game |
| `combatReadout()` / `combatTruth()` | what the screen shows (energy, HP, block, enemy HP/block, found by their on-screen position) versus `CombatState` read directly |
| `expectReadoutsMatchTruth()` | asserts the two agree |
| `click(x, y)`, `clickText(text)`, `key(k)` | real mouse and keyboard input (x, y are on the 800x600 layout) |
| `playCard(name, enemyIndex)` / `endTurn()` | the card-aiming flow with the real mouse, then `settle()` |
| `startFightWith(deckIds, enemyIds)` | replace the deck and enter a fight (what the dev panel's "Fight these here" does) |
| `run()` | the run as plain data; `page.evaluate` + `window.__imp('/src/...')` reads or sets anything else |

`e2e/flows.ts` holds multi-step moves (choose a map stop, dev-panel jump, win a fight and leave a stop).

**Every test fails on a browser error:** the `game` fixture records `console.error`, uncaught exceptions (`pageerror`; Phaser exceptions land here) and unhandled promise rejections, and checks them after every step and at the end of the test.

## Adding a test

1. Create `e2e/<topic>.e2e.ts` (the `.e2e.ts` suffix keeps vitest from picking it up).
2. `import { expect, test } from './harness';` and use the `game` fixture:

```ts
test('shop: buying a card spends gold', async ({ game }) => {
  await game.open('seed=1&dev');          // a seed whose map has the stop you need (seed 1 has every kind)
  await game.waitForScene('MapScene');
  await devJump(game, 'shop');             // from ./flows
  await game.waitForScene('ShopScene');
  // ...click, then assert on game.run() and game.labels()
});
```

3. Prefer asserting on game state (`game.run()`, `game.combatTruth()`) plus a few text checks. No pixel comparisons.
4. For fights with exact numbers, build a deck of 5 cards or fewer with `startFightWith`: the whole deck is then the opening hand and no shuffle matters (see `synergy.e2e.ts`).
5. Work out expected numbers from the card data by hand and say so in a comment; the numbers are provisional like the cards.

Notes:

- With `?dev` the dev panel covers the bottom-left of the screen and eats real clicks there (floor-0 map stops sit under it). Tests that click map stops on the first floor should not load `?dev`; use `winFightQuickly()` or page-side calls instead of the panel.
- Readout lookups use on-screen positions from `PlayerView.ts`, `EnemyView.ts` and `layout.ts`. If those layouts move, update `combatReadout()` in the harness.

## What is covered

| File | Brief item |
| --- | --- |
| `boot.e2e.ts` | (a) boot, seeded new run, map, enter a fight; hook is inert without `?e2e`; same seed same map |
| `combat.e2e.ts` | (b) a whole fight with the real mouse, readouts versus `CombatState` after every action, enemy acts, reward, back to the map |
| `devpanel.e2e.ts` | (c) dev panel jump to fight, elite, rest, shop, event, boss and leave each |
| `stops.e2e.ts` | (d) rest upgrade, rest heal, reward card pick, event choice outcomes |
| `synergy.e2e.ts` | (e) scaling attack, empowered doubling, trigger powers (card played, end of turn, kill), exhaust, energy gain, self-damage |
| `save.e2e.ts` | (f) reload mid-fight / on the reward screen / on the map, then Continue; New Run discards the save |
| `act.e2e.ts` | (g) a whole seeded act (`seed=1`) played by a simple policy through the real UI to the run-end screen |
| `draft.e2e.ts` | (h) the starter-deck draft: intro screen, 10 forced 1-of-3 picks, no gold/skip, lands on the map with the drafted deck (2026-10-08) |
| `report.e2e.ts` | (i) the Report window (QA_PLAN.md): a report from the map and from a fight, tester id and name kept, a refused send keeps the text, empty report stopped, typing does not trigger hotkeys, sending does not click through to the game, and the dev panel's snapshot loader restores a fight exactly. The report proxy is never called: the network is stubbed with `page.route`, and the test server runs with a fake `VITE_REPORT_SECRET` (`playwright.config.ts`). A 401 or 429 makes the browser itself log "Failed to load resource", which `expectNetworkErrorLog` removes in the tests that cause one on purpose. If you reuse a dev server started without that variable, the Report window refuses to send and these tests fail: stop the old server. |
| `heropower.e2e.ts` | (k) issue #7: the hero power button (real drawn bounds) covers no enemy's intent readout with 1, 2 and 3 enemies and sits left of End Turn; a mouse click on it works |
| `backdrop.e2e.ts` | (m) the default combat backdrop: every fight tier draws the animated ashlands sprite and its frames really advance |
| `content.e2e.ts` | (l) the content site (`content.html`): the Patch notes section comes first and shows the newest entry, no console errors |

The act policy is deliberately dumb (it only has to keep the game moving) and, because the map offers few rests, heals the run to full on the map when under half HP (a stand-in for the dev panel's "Heal full"). It reports win or loss rather than asserting it.

## Known flakiness and how it is handled

- **Time.** Game time is virtual, so animation length is not machine-dependent. What does vary is wall-clock time: software WebGL rendering makes each frame cost real milliseconds (the act test is the slow one). Test timeouts are generous (90 s per test, 15 min for the act).
- **Click timing.** Phaser needs a frame after each mouse event; `click()` steps after hover, press and release. A click that appears to do nothing usually means a missing step, or the dev panel covering the canvas.
- **"Settled" detection.** `settle()` reads private scene fields (`inputLocked`, `sequencer`, `handCards`) and Phaser's tween and timer lists, and needs two calm polls in a row. If the combat scene is refactored, update it first when many tests start timing out.
- **Layout-dependent positions.** Readouts and map clicks use the 800x600 layout at device scale factor 1 (set in `playwright.config.ts`). A different viewport scale is handled (`canvasBox`) but is untested.
- **Seeds.** Tests that need every stop kind use `seed=1`; if map generation changes, `devpanel` will say which kind is missing. Pick another seed (any seed whose map has combat, elite, rest, shop, event and boss).
- No retries are configured, on purpose: a flaky test should be fixed or documented, not hidden.
- Known-failing tests are marked `test.fail` with a comment saying what the bug is (none at the time of writing).

## CI

`.github/workflows/e2e.yml` has two kinds of job that share their setup (install Chromium, `npm run build`):

| Job | Runs on | Runs | Failure artifact |
|---|---|---|---|
| `e2e-shard` (3 in parallel) plus the `e2e` gate | pull requests, and pushes to `auto/**` and `integration/**` | `npx playwright test --grep-invert "whole seeded act" --shard=N/3`: everything except `act.e2e.ts`, split over three runners. The `e2e` gate job passes only if all three shards do, so "e2e" stays the one check name to require. | `playwright-traces-shard-N` |
| `e2e-full` | nightly at 03:17 UTC (`schedule`, on the default branch) and by hand (**Actions > E2E > Run workflow**) | `npm run e2e`: the whole suite including the whole-act test | `playwright-traces-full` |

**Speed (measured 2026-10-09).** The unsharded pull-request job took 5 min 13 s on GitHub with 2 workers: about 35 s of setup and 4.6 min of tests, and the tests were bound by total work (44 tests, about 9 minutes of work) divided by 2 workers, not by one slow test. The config now uses 4 workers on CI (public-repo runners have 4 vCPUs) and the job is split three ways. Locally, 2 workers took 169 s and 4 workers took 122 s. Each test spends about 2 s locally (about 4 to 5 s on CI) just booting the page: about 1 s loading roughly 130 modules from the dev server and about 1 s on the first frames in software WebGL. Chromium flags (`--use-angle=swiftshader`, `--disable-gpu`, no vsync) did not help the suite as a whole (the swiftshader one made it slower and flaky), so none are set. After sharding, the combat test (about 1.5 min) is the longest single piece, so shortening that fight is the next lever if it is needed. `E2E_WORKERS=n` overrides the worker count for a local run.

On failure each job uploads `test-results/` (traces) and `playwright-report/` for 14 days (download it and open a trace with `npx playwright show-trace`).

The `e2e` gate job is **blocking** for pull requests and for pushes to `auto/**` and `integration/**` (the whole suite passed on GitHub's Linux runner on 2026-10-07 before being promoted). To make it a required check, mark "e2e" required in the repository's branch protection. The whole-act test is therefore **not** part of the pull-request gate: a change that breaks only the full-act path is caught by the next nightly run, or run `npm run e2e` yourself before merging anything that touches the map, rewards, rests, events or run flow. If the nightly run fails, the commit that broke it is among those since the last green nightly.

Notes on the schedule: GitHub runs scheduled workflows only from the default branch, and switches them off after 60 days without repository activity (re-enable it under Actions). The split was written without being able to run GitHub Actions (`gh` is not installed here): the YAML was parsed and the fast command run locally, but the workflow itself had not yet run on GitHub when this was written.
