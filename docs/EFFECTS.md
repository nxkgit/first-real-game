# Effects: how to add an effect kind

Every effect kind (`damage`, `block`, `draw`, `applyStatus`, `gainEnergy`, `loseHp`, `multiplyStatus`, `exhaustRandom`) has **one entry** in the registry, `EFFECTS` in `src/game/effects.ts`. The entry bundles everything the game knows about the kind:

| Part | What it is |
| --- | --- |
| `resolvePlayer(effect, host, target, fromAttackCard)` | What happens when a card, power, relic or trigger of the player's fires it. |
| `resolveEnemy(effect, host, enemy, out)` | What happens in an enemy move. **Leave it out and the kind is player-only**: an enemy move containing it does nothing for that effect. |
| `describe(effect, n, opts)` | The card text, with `n` as the number (the value, or the scaling step). |
| `intent` | `icon` (attack/defend/buff/debuff, or nothing), and `damage` / `block` (the base numbers the intent readout sums). Only kinds an enemy can perform need it. |
| `scales` | The scaling sources the kind's `scaling` field accepts (`ALL_SCALE_SOURCES`, or `[]` if it can't scale). |
| `preview(effect, host, target, fromAttackCard)` | **Optional.** The number the effect would produce if played right now (scaling, Strength, Weak, Vulnerable and so on), for the live numbers on card faces. Leave it out and the face keeps the printed text for that effect. It gets a read-only `PreviewHost` (`player`, `calcDamage`, `scaledValue`, `previewDraw`), so it cannot change the fight. |
| `lowerIsBetter` | **Optional.** `true` if a bigger previewed number hurts the player (self-damage), so the face shows a bigger one in red instead of green. |

`CombatState` does the dispatch and hands each entry an `EffectHost` (the few things an effect may do to the fight: emit events, deal damage, add a status, gain energy, exhaust, fire triggers). Effects touch nothing else, so an entry reads as a self-contained rule.

## Adding a ninth kind

1. Add its member to the `Effect` union in `src/game/types.ts` (and a doc comment saying who may use it).
2. Add its entry to `EFFECTS` in `src/game/effects.ts`. `EFFECTS` is typed `{ [K in EffectKind]: ... }`, so the build fails until you do. If it needs a new capability on the fight, add it to `EffectHost` and implement it in `CombatState`'s constructor.
   If the effect has a number a player would want to see change (anything that scales or meets a status), give it a `preview` that goes through `host.scaledValue` / `host.calcDamage` (never a copy of the formula). `src/game/preview.test.ts` plays each previewing kind under every scaling source and checks the preview equals what the play does; add your kind to its `KINDS` table.
3. Add a sample of it to `SAMPLES` in `src/game/effects.test.ts` (also compile-checked), and tests for what it does.
4. If an effect should emit a new event, add it to `CombatEventMap`; the golden test's `EVENT_NAMES` record then fails to compile until you list it.
5. Check `src/sim` (the bots' heuristics, `bot.ts`/`skills.ts`) and `src/content` (the content browser) for anything that should treat the new kind specially; those are not part of the registry. Bots fall back to lookahead for kinds they don't recognise.

Nothing else should need touching: no switch in `CombatState`, `describe.ts` or `intent.ts` mentions individual kinds any more.

## Live numbers on card faces

`CombatState.previewCardEffect(card, effect, target)` runs an effect's `preview` against the live fight. The combat scene calls it for every card in the hand whenever animations have finished playing (never while they replay, since the rules have already moved on by then), and again while a card is picked up for aiming and the pointer moves to a different enemy. Two details that came from testing it against real plays: the card being played has already left the hand when its effects resolve, so "per card in hand" does not count it; and a draw previews the cards that would really reach the hand (a full hand and empty piles limit it), not the printed or scaled amount.

## The golden test

`src/game/effects.golden.test.ts` runs 320 seeded fights over self-contained synthetic content (every effect kind, scaling source, trigger and enemy-move shape), hashes each fight's full event log, message log, final state and intent readouts, and compares against `src/game/fixtures/effectsGolden.json`. The fixture was generated **before** the registry refactor, so passing proves the refactor changed nothing. It pins the tunables the engine reads, so editing real content or balance numbers does not disturb it.

If you change an engine rule **on purpose** (a new rule, not a new kind), regenerate with `UPDATE_GOLDEN=1 npx vitest run src/game/effects.golden.test.ts` and review the fixture diff. Adding a new kind does not change any existing hash, so it should not need regenerating.
