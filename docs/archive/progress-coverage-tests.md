# Coverage tests (auto/coverage-tests): progress and PR report

Status: DONE (all deliverables). `gh` is not installed in the cloud session, so no PR could be opened; this file is the PR description to paste. Branch is pushed. `npm run verify` passes (395 passed, 5 expected-fail findings).

Type-checked and unit-tested only. Nothing was played in a browser. No source files were changed; only new `*.coverage.test.ts` files, `package.json` (coverage script + `@vitest/coverage-v8`), `.gitignore` (`coverage`), and this doc. Note: an early commit accidentally included the generated `coverage/` folder; a later commit removes it from tracking.

## What was built
- `npm run coverage` (vitest v8 coverage over `src/`, excluding scenes, dev panel, audio, tests).
- New tests: `src/game/RunState.coverage.test.ts`, `CombatState.coverage.test.ts` (incl. Deck), `describe.coverage.test.ts` (describe, intent, runReport), `save.coverage.test.ts`, `src/storage.coverage.test.ts` (storage, settings, session with a fake localStorage), `src/data/data.coverage.test.ts` (tunables, upgrades registry, content integrity, act map across 60 seeds).

## Coverage before -> after (statements / branches)
| File | Before | After |
|---|---|---|
| storage.ts, settings.ts, session.ts | 0 / 0 | ~100 (all lines exercised; see report) |
| game/RunState.ts | 94.3 / 87.8 | 98.9 / 96.2 |
| game/CombatState.ts | 93.8 / 88.9 | 99.4 / 97.2 |
| game/save.ts | 78.9 / 84.9 | ~100 |
| game/runReport.ts | 85.7 / 83.3 | 100 |
| game/describe.ts | 93.5 / 88.9 | 100 |
| game/intent.ts | 100 / 87.5 | 100 |
| data/statuses.ts | 60 / 100 | 100 |
| data/run.ts | 83.3 / 100 | 100 |
| src/game (dir) | 93.6 / 88.7 | 99.2 / 97.5 |
| All files (excluding scenes etc.) | 75.3 / 74.5 | 84.5 / 86.0 |
Remaining uncovered: display.ts, main.ts, content/contentPage.ts, sim/cli.ts (all browser/CLI glue), a few defensive branches.

## Findings (each is an `it.fails` test, source untouched)
1. **Combat-start block is wiped.** `CombatState.start()` applies `onCombatStart` effects, then `startPlayerTurn(true)` sets `player.block = 0`. HANDOFF says Guard Token gives "6 block at combat start": it currently gives nothing for turn 1. Repro: relic `{onCombatStart:[{kind:'block',value:6}]}`, `start()`, read `player.block` (0, expected 6). Test: "block from an onCombatStart relic is still there on the first player turn".
2. **Misleading event text.** An hp/gold loss fully absorbed by the floor (already 1 HP / 0 gold) reports "Healed 0 HP." / "Gained 0 gold." because the sign is taken from the actual change, not the outcome. Two tests in RunState.coverage.test.ts.
3. **Low severity, corrupt saves only:** `parseSavedRun` accepts `phase: 'reward'` with `pendingReward: null` (reward screen with nothing to take) and `hp > maxHp`. Two tests in save.coverage.test.ts.

## Decisions I made
- Tests that go through `window` stub it with a fake via `vi.stubGlobal` and re-import modules (`vi.resetModules`) instead of switching vitest to jsdom (no config change; reversible by deleting the file).
- Coverage script passes include/exclude as CLI flags rather than adding a vitest config file.
- Elite relic / event-fight outcomes asserted as currently implemented (event fights give no card reward, relic-after-fight yields one notice line), per HANDOFF "open decision 3".
- Avoided brittle assertions (no card/enemy counts, no "every move has an icon", etc.) so new effect kinds and cards from the synergy-engine branch don't break them. The intent-vs-damage test iterates all data enemies and compares `intentDamage` to real damage under Strength/Weak/Vulnerable combos; it will flag any new damage-affecting mechanic that the intent readout ignores, which is intended.
- Used the existing `testHelpers.ts` (not edited).

## Follow-ups
- Fix the three findings (then flip the `it.fails` to `it`).
- A human should confirm Guard Token behavior in the browser (finding 1) since it changes what a player sees.
- Scenes, dev panel, audio untested (need Phaser/browser).
