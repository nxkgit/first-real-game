# Progress: audit fixes (branch `auto/audit-fixes`)

Fixes the non-combat findings from `docs/audits/2026-10-code-audit.md` (C5, C-event-text, A2) and the test-session bug markers.

## What was built

1. **Save/restore hardening** (`src/game/save.ts`, `RunState.fromSaved`). `parseSavedRun` now also refuses:
   - `phase: 'reward'` without `pendingReward`, and a `pendingReward` outside the reward phase;
   - `hp > maxHp` (negative was already refused);
   - map nodes with `floor >= map.floors` or `lane >= map.lanes`, duplicate node ids, no floor-0 node, links that do not go to a higher floor;
   - fight stops (combat/elite/boss) with missing/empty `enemies`, event stops without an `eventId`;
   - a `position` that is not in `visited`;
   - `eventFight` with no enemies, outside the `inNode` phase, or with `after` entries that are not real outcomes (checked per kind: gold/hp/maxHp need an integer `value`, card needs `cardId`, randomCard/relic ok; `fight` and unknown kinds refused);
   - `history` entries that are not valid log entries (checked per kind and fields).
   `fromSaved` also checks that `card` outcomes in `eventFight.after` name a card that exists (so a bad save fails at load, not mid-game).
   Tests: `it.fails` flipped to `it` in `save.invariants.test.ts` and `save.coverage.test.ts`; the `it.skip` catch-all fuzz is a normal `it` and now runs 30000 mutations (was 6000) with a 120 s timeout (runs in a few seconds); new `src/game/save.rules.test.ts` covers each rule explicitly.
2. **Event outcome text** (`RunState.applyOutcome`). A loss absorbed by the floor now reads `Lost no HP (already at the minimum).` / `Lost no gold (you had none).` instead of `Healed 0 HP.` / `Gained 0 gold.`; a zero gain reads `Healed no HP.` / `Gained no gold.`. The two `it.fails` in `RunState.coverage.test.ts` are now `it`.
3. **Markdown export** (`src/content/tableExport.ts`): pipes were "escaped" with `'\|'` (which in JS is just `|`), so nothing was escaped. Now `|` becomes `\|`, backslashes are doubled so `\|` in source stays a literal, and `\r\n`, `\r`, `\n` all become a space. The existing test encoded the bug (its expectation had the same `'\|'` mistake); fixed and extended.
4. **Input**: `onKeyPress` ignores Ctrl/Meta/Alt chords via the pure helper `gameKeyFrom` (`src/scenes/keyFilter.ts`, tested in `keyFilter.test.ts`).
5. **Map layout** (A2): new pure `src/scenes/mapLayout.ts`; `MapScene` derives x/y from `map.floors` / `map.lanes` instead of the literals. The map fills y 548 (floor 0) to 128 (top floor) and x 200..600. Test asserts it equals `548 - floor*35` and `200 + lane*100` at the current 12+boss floors and 5 lanes, and stays in bounds for other counts.
6. **CI**: `ci.yml` runs on `pull_request` and pushes to `auto/**` and `integration/**` only. `deploy-pages.yml` now runs `npx tsc` then `npm test` before the `--base` build (it already ran both; the typecheck was folded into the build step, now a separate explicit step before the build).

## Verified

`npm run verify` (typecheck, all tests, build) passes; no `it.fails`/`it.skip` remain in the save or event tests. **Scene/UI changes (`MapScene`, `ui.ts` key handling) were type-checked and unit-tested via pure helpers only; NOT played in a browser.** A human should open the map (stops should look identical to before), try Ctrl+D / Ctrl+E / Alt+1 in a fight and on the map (nothing should happen), and plain D / E / digits (should still work).

## Decisions I made

- Did NOT add "hp 0 on the map is refused" (audit C5 lists it): the existing test `accepts 0 HP (a lost run)` mutates a map-phase save to hp 0, so refusing it would mean changing that test. Reverse by adding `hp === 0 && phase !== 'lost'` to `parseSavedRun`.
- Did not require a boss node or non-empty `next` on non-boss nodes: hand-built test maps (`chainMap`) have neither. Real maps do; a stricter check is possible if wanted.
- Message wording for absorbed losses is plain placeholder text; change in `applyOutcome`.
- Event-fight `after` forbids `fight` outcomes (the engine only stores outcomes after a fight; applying one throws).
- Newlines in Markdown cells become spaces (as before) rather than `<br>`.
- Gave `gameKeyFrom` only Ctrl/Meta/Alt filtering (Shift is left alone: Shift+digit yields symbols that no handler uses).
- CI: a PR from an `auto/**` branch still runs twice (push and pull_request), as the brief specified; non-`auto`/`integration` branches run once, on the PR.

## Follow-ups

- Audit A2's second half (save validation bounds derived from tunables, e.g. node count 2000, floors 100) not done; the new map checks use `map.floors`/`map.lanes` from the save itself, which avoids the dependency on tunables for floors/lanes.
- C6 (event outcomes before a fight dropping their lines) and C7 (notice re-shown after refresh) were not in scope.
