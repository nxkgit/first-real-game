# Synergy engine

The card-to-card interaction machinery (Slay the Spire style builds). It is all data: cards and relics declare what they do; `CombatState` carries it out; `describe.ts` writes the text. Every number here is PROVISIONAL. The placeholder cards in `src/data/synergyCards.ts` are not in the reward pool, so the live game is unchanged.

## What exists

| Mechanic | Where it is declared | Notes |
|---|---|---|
| Scaling values | `scaling: { per, value, tag? }` on damage, block, draw, applyStatus, gainEnergy, loseHp | value becomes `value + scaling.value * count`. Sources: `cardsPlayedThisTurn`, `attacksPlayedThisTurn`, `taggedPlayedThisTurn` (+`tag`), `block`, `strength`, `handSize`, `exhaustedThisCombat`, `targetVulnerable`. "Played" counts exclude the card being played. |
| Empowered | status `empowered` (applyStatus to self) | Your next attack card deals `EMPOWERED_DAMAGE_MULT`x; one stack is used per attack card played; lasts until used (even across turns). Skills/triggers never use it up and are not doubled. |
| Status multiplier | effect `multiplyStatus { status, factor, to }` | Does nothing at 0 stacks. |
| Triggers | `triggers: Trigger[]` on power cards and relics | `on`: `cardPlayed` (filter `cardType`, `tag`), `cardExhausted`, `blockGained`, `enemyDied`, `hpLost`, `turnStart`, `turnEnd`; optional `oncePerTurn`. |
| Tags | `tags: string[]` on cards | Neutral labels; only filters and scaling read them. |
| Exhaust | `exhaust: true` on a card; effect `exhaustRandom { value }` | `Deck.exhaustPile`; gone for the rest of that combat only. |
| New effects | `gainEnergy`, `loseHp` (direct, ignores block, can kill) | |

Effect kinds are now 8 (`damage, block, draw, applyStatus, gainEnergy, loseHp, multiplyStatus, exhaustRandom`), which hits the "~8 effects" threshold at which the plan said to consider an effect registry. Not done here; worth doing before many more kinds are added.

## Rules (decided, provisional)

- **Damage order:** scaled base (part of the base), then add (Strength), then multiply (Weak 0.75, Empowered 2 together), then the defender's multiplier (Vulnerable 1.5), rounded down once.
- **Play order:** pay cost, card goes to discard, `cardPlayed` event, effects resolve, Empowered is spent (attacks), counters increment, exhaust (if the card exhausts), then `cardPlayed` triggers, then (power cards) the power's own triggers start. A power therefore never triggers on its own play.
- **Triggered effects are not card plays:** no counters, no `cardPlayed`. "Target" for a triggered effect is the first living enemy.
- **Trigger order:** relics (in relic order), then powers in the order played.
- **Recursion guard:** events caused by triggered effects may fire further triggers up to `MAX_TRIGGER_DEPTH` (3) levels; deeper ones are ignored.
- **Once per turn** resets as the next player turn starts (so enemy-phase firings count against the turn before).
- `turnEnd` fires before the hand is discarded; `turnStart` fires after the draw, power turn-start effects and relic turn-start effects. `onTurnStartEffect` is unchanged.
- `hpLost` fires for each enemy hit that gets past block and for `loseHp`.
- Counters live on `combat.stats`: per-turn ones reset at turn start, `exhaustedThisCombat` per fight.

New events: `cardExhausted`, `energyChanged`, `hpLost` (direct loss only); `handChanged` now also carries `exhaustPile`. All carry snapshot data (replay-later rule).

## How to add a synergy card

1. Add a `CardDefinition` in `src/data/synergyCards.ts` (copy a neighbour; `...base` sets `owner: 'neutral'`, `inRewardPool: false`) and list it in `SYNERGY_CARDS`. For a real card, put it in `cards.ts` instead and set `owner` / `inRewardPool` as usual.
2. Write behaviour as data only:
   - scaled: `effects: [{ kind: 'damage', value: 4, scaling: { per: 'cardsPlayedThisTurn', value: 3 } }]`
   - reactive: `type: 'power'`, `triggers: [{ on: 'cardPlayed', cardType: 'attack', effects: [{ kind: 'block', value: 2 }] }]`
   - tagged pair: `tags: ['tag-a']` on the enabler; payoff scales `per: 'taggedPlayedThisTurn', tag: 'tag-a'` or a trigger filters `tag: 'tag-a'`.
   - exhaust: `exhaust: true`, or `{ kind: 'exhaustRandom', value: 1 }`.
3. Any card with a `damage` effect (or `applyStatus` `to: 'target'`) needs `target: 'enemy'`; `triggers` are only valid on power cards (a test checks both).
4. Add an `upgrade` block (it may change `cost`, `effects`, `triggers`, `tags`, `exhaust`). Never hand-write `description`.
5. Run `npm test`. The registry-wide tests check text and upgrades for every card; add a behaviour test in `src/game/synergy.test.ts` for anything new.
6. To add a new effect kind or trigger event: extend the unions in `types.ts`, handle it in `CombatState.applyCardEffect` / `fireTriggers` call sites, add text in `describe.ts`.

## For the simulator

`allDraftableCards(heroId = 'mage')` (in `src/data/cards.ts`) returns every base card a deck could contain: the reward pool plus the synergy cards, regardless of `inRewardPool`, without starter-only basics or upgrades. `upgradedVersion(card)` gives the `+` version. `RELICS` (in `relics.ts`) holds every relic including the synergy ones; `RELIC_POOL` is only what the live game hands out.

## Not played

This was built without a browser. See the PR for what to try first.
