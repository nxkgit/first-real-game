# Progress: auto/coverage-tests

Baseline coverage (npm run coverage, before): src/game 93.6% stmts; src/storage.ts, settings.ts, session.ts 0%; data/statuses.ts 60%; runReport 85.7%; save.ts 78.9%; describe.ts 93.5%.

## Done
- @vitest/coverage-v8 + `npm run coverage` script
- RunState.coverage.test.ts (shop, rest, events, rewards, relic hooks, run end)
- CombatState.coverage.test.ts (Deck, statuses, countdown, intents vs damage, multi-enemy, powers, relics)
- describe.coverage.test.ts (describe, intent, runReport)

## In progress / next
- save.coverage.test.ts, storage/settings/session coverage tests (fake localStorage)
- data.coverage.test.ts (tunables sanity, upgrades registry, statuses, run.ts)
- PR description with before/after table, findings, decisions

## Findings so far
- Guard Token style onCombatStart block is wiped by startPlayerTurn (it.fails in CombatState.coverage.test.ts)
- Event hp/gold loss fully absorbed by floor is reported as "Healed 0 HP." / "Gained 0 gold." (it.fails in RunState.coverage.test.ts)
