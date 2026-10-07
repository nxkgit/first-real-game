# Progress: effect registry (branch `auto/effect-registry`)

## Report

**What was built.** A behaviour-preserving refactor: the 8 effect kinds now live in one registry, `EFFECTS` in `src/game/effects.ts`, one plain-object entry per kind. Each entry bundles: how it resolves for the player's side (cards, powers, relics, triggers), how it resolves in an enemy move (or that it is player-only: no `resolveEnemy`), its card text, how intent/preview treats it (icon, base damage/block for the readout), and which scaling sources it accepts. `CombatState.applyCardEffect` and `runEnemyMove`, `describe.ts`'s `plainEffect` and `intent.ts`'s icon logic, and `intentDamage`/`intentBlock` no longer switch on kinds. Details and the "add a ninth kind" checklist: `docs/EFFECTS.md`.

Adding a ninth kind = its member in the `Effect` union + ONE entry in `EFFECTS` (the registry is typed `{ [K in EffectKind]: ... }`, so the build fails without it) + a sample in `effects.test.ts` (also compile-checked) + tests.

**NOTHING WAS PLAYED IN A BROWSER.** The refactor is proven equivalent by unit tests, a golden event-log test and the balance simulator only (see below). A human should still play one fight with a few card types (attack, block, draw, a debuff, a power) before trusting it.

## Proof of equivalence

All "before" artifacts were generated on a clean checkout of `main` (6e96a1e) before any refactor code existed.

1. **Existing tests pass unmodified.** No existing test file was touched. `npm run verify` passes.
2. **Balance report and baseline are byte-for-byte identical.** `npm run balance -- report --out <scratch>` and `npm run balance -- baseline --out <scratch>` (549 metrics, content fingerprint ef2efd31) were generated before and after; `cmp` on `report.json`, `report.md` and `baseline.json` reported identical. (Scratch location `.sim/before` and `.sim/after`, gitignored, not committed.)
3. **Golden event-log test (committed).** `src/game/effects.golden.test.ts` plays 320 seeded fights over self-contained synthetic content covering every effect kind, every scaling source, every trigger type, power turn-start effects, relics (combat start, turn start, triggers), enemy moves containing player-only kinds, multi-enemy fights, and low-HP starts (so both wins and losses occur). For each fight it hashes every emitted event, the message log, the final state and the intent readouts (`intentDamage`, `intentBlock`, `intentIcons`). The hashes in `src/game/fixtures/effectsGolden.json` were generated BEFORE the refactor (commit "Golden event-log test for effect behaviour") and compared after. A second digest covers all card, relic and enemy-move text. A mutation check (changing one `blockGained` trigger condition) makes the test fail, so it is not vacuous. The test also asserts every event kind fired and fights ended both won and lost.
4. **Live-content fights (one-off, not committed).** The same driver pointed at the real registry (all cards incl. synergy cards, all relics, all enemies), 400 seeded fights, event logs hashed before and after: identical (`cmp` of the hash files). Not committed because real content is being edited by other sessions and would make the fixture fail for unrelated reasons.

## Files

- New: `src/game/effects.ts`, `src/game/effects.test.ts`, `src/game/effects.golden.test.ts`, `src/game/fixtures/effectsGolden.json`, `docs/EFFECTS.md`, this file.
- Changed: `src/game/CombatState.ts`, `src/game/describe.ts`, `src/game/intent.ts`, `src/game/types.ts` (added `EffectKind`, doc comment).
- Public API unchanged: `CombatState` public methods and events, `describeEffect`/`describeTrigger`/`cardText`/`relicText`, `intentIcons`/`IntentIcon`, `Effect`/`Card` types. No test imported a moved internal.

## Decisions I made

- **Host interface instead of passing CombatState.** Entries receive an `EffectHost` (a small object built in CombatState's constructor from its private helpers), so effects can't reach into CombatState and `effects.ts` has no runtime import of it. Reverse: not needed; it only adds one object.
- **Unknown kinds are ignored, as before.** An existing sim test feeds a made-up kind; the old switches did nothing for it. `EFFECTS` is looked up via a tolerant helper (no entry = no-op, empty text, no icon).
- **`describeEffect` reads `scaling` only for kinds whose registry entry `scales` is non-empty.** Identical for all well-typed data (multiplyStatus/exhaustRandom have no `scaling` field); differs only for malformed data.
- **Scaling sources are per kind in the registry, but the count itself (`scaleCount`) and the "for each ..." wording (`SCALE_UNIT`) stay where they were**, since they are per scaling source, not per effect kind.
- **Golden fixture uses synthetic content and pins tunables with `vi.mock`**, so balance/content edits elsewhere cannot break it.
- **Intent preview numbers are registry parts** (`intent.damage` / `intent.block`), so `CombatState.intentDamage/intentBlock` no longer mention `damage`/`block`.
- Left `src/sim`, `src/content`, `src/scenes` alone (out of scope), even though they still have their own kind-specific handling.

## Follow-ups

- `src/sim/bot.ts` / `skills.ts` and `src/content/contentPage.ts` have their own per-kind logic (bot heuristics, the content browser); a registry part for "how a bot ranks this effect" could be considered, but only with a second need.
- The scenes' intent drawing could use `intentIcons` only (already the case); no action needed.
- When another session adds a kind, they must add an entry; the compiler and `effects.test.ts` will tell them.
