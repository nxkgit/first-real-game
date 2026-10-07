# Progress: auto/balance-process

Running status so another session can pick this up. Updated with each push.

## Done
- src/sim/stats.ts, fightCore.ts (replay reconstruction), skills.ts (random/greedy/smart/expert), fight.ts, engine.ts (paired evaluator), suites.ts, targets.ts
- experiments.ts (cards, pairs, ladder, lengths, outliers), drafts.ts, snapshot.ts (baseline + check), commands.ts, balanceCli.ts
- package.json scripts: balance, balance:baseline, balance:check, balance:report
- balance/baselines/baseline.json and balance/reports/sample.{md,json} generated
- tests: src/sim/balance.test.ts (npm run verify passes)

## In progress
- docs/BALANCE.md

## Next
- final report in the PR description (gh CLI is not installed in this environment, so the PR may need opening by hand)
