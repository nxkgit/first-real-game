# Content guide

How to add and change cards, enemies, relics, events and statuses. Written for the person authoring the content, not for a programmer: you edit data files, you do not write game logic. Every name and number in the examples below is a **placeholder**.

The lists marked `names:` are checked by a test (`src/content/guide.test.ts`) against the real types in `src/game/types.ts`. If the code gains or loses an effect kind, status, trigger event, scaling source or field and this guide is not updated, `npm test` fails. The test is also the quickest way to see what changed.

## The one-minute version

1. Content is **data** in `src/data/`. Text on cards and relics is **generated** from the data; never write it by hand (`description` exists but turns the text off from the numbers).
2. After any change: `npm run content:check` (errors and warnings, each with the fix), open `content.html` (`npm run dev`, then `/content.html`) to read the generated text and the numbers side by side, then `npm test`.
3. For cards also run the balance tools and read the bands in `docs/BALANCE.md`.
4. Anything you need that is not in the lists below (a new kind of effect, trigger event, scaling source, status behaviour) needs a code change. Ask for it; do not work around it with hand-written text.

## Where things live

| What | File | Note |
|---|---|---|
| Cards, upgrades, starter deck | `src/data/cards.ts` | Define the card, then add it to `ALL_CARDS` at the bottom. Upgrades are generated from the card's `upgrade` block. |
| Engine test cards | `src/data/synergyCards.ts` | 20 placeholders that exercise the engine. **They are in the reward pool** (as of 2026-10-07 the user wants every placeholder offered to testers); flip `inRewardPool` in the file's `base` object to take them out. Real cards go in `cards.ts`. |
| Enemies | `src/data/enemies.ts` | Add to `ALL_ENEMIES`. |
| Which fights fill the act | `src/data/run.ts` (`ACT_CONTENT`) | Lists of enemy ids per fight: `earlyEncounters` (floors 1-3), `encounters` (the middle), `lateEncounters` (floor 9 up), `elites`, `bosses`. An enemy that is in no list never appears. |
| Relics | `src/data/relics.ts` | Add to `ALL_RELICS` (then it is in the relic pool and elites can drop it). |
| Events | `src/data/events.ts` | Add to `ALL_EVENTS`. All events are automatically in the act. |
| Art: which picture stands in for which enemy, relic, stop or screen | `src/data/art.ts` | Placeholder pairings. How pictures get into the game: `docs/ART.md`. |
| Statuses | `src/data/statuses.ts` and the `StatusId` type in `src/game/types.ts` | New statuses with new behaviour need code. |
| **Every balance number that is not one card/enemy value** | `src/data/tunables.ts` | Energy, hand size, player HP, Weak/Vulnerable/Empowered multipliers, rest heal, reward counts and gold, shop, map shape. |
| Numbers on a specific card, enemy, relic, event | with that item | Damage, block, cost, HP, move values, gold in an event. |
| The simulator's target bands | `src/sim/targets.ts` | What "healthy" fights look like (`docs/BALANCE.md`). |

Rule of thumb: **if the number describes one thing, it is next to that thing; if it describes how the game works for everything, it is in `tunables.ts`.** For example `Weak` hits for 25% less because of `WEAK_DAMAGE_MULT`, not because of any card.

## Cards

```ts
export const EXAMPLE_STRIKE: CardDefinition = {
  id: 'example-strike',      // unique, lowercase, never changes once players have saves
  name: 'Example Strike',
  type: 'attack',
  target: 'enemy',           // needed whenever the card hits a chosen enemy
  cost: 1,
  owner: MAGE,               // the hero's id, or 'neutral' for any hero
  inRewardPool: true,        // can be offered after fights and in shops
  effects: [{ kind: 'damage', value: 6 }],
  upgrade: { effects: [{ kind: 'damage', value: 9 }] },
};
```

### Card fields

<!-- names:card -->
| Field | Meaning |
|---|---|
| `id` | Unique key. Saves and reports use it. Do not rename a card that exists in saves. |
| `name` | Shown on the card. Upgrades get `+` added automatically. |
| `type` | `attack`, `skill` or `power` (see below). |
| `cost` | Energy to play. Must be a whole number from 0 to `MAX_ENERGY`. |
| `owner` | A hero id, or `neutral`. |
| `inRewardPool` | `true` to be offered as a reward or in the shop. |
| `inStarterPool` | `true` to be offered during the pre-run starter-deck draft (see DESIGN_LOG.md "Starter deck draft"). |
| `archetype` | A hero-scoped sub-class label (e.g. the Mage's `frost`/`fire`; see `docs/classbrainstorming.md`). Scaffolding only — nothing reads it yet. |
| `rarity` | `'common'`, `'uncommon'` or `'rare'`. Scaffolding only — no reward-odds weighting reads it yet. |
| `description` | **Avoid.** Replaces the generated text; it will not follow the numbers when they change. |
| `target` | `'enemy'` makes the card aimed. Required if any effect is `damage`, or applies/multiplies a status `to: 'target'`. |
| `effects` | Things that happen when the card is played, in order. |
| `onTurnStartEffect` | Powers only: one effect that happens at the start of every later turn. |
| `triggers` | Powers only: "whenever X happens, do Y" for the rest of the fight. |
| `tags` | Neutral labels other cards can scale from or trigger on. They have no meaning of their own. |
| `exhaust` | `true`: the card leaves the deck for the rest of this fight after being played. |
| `innate` | `true`: always starts in the opening hand of combat, never subject to the shuffle. |
| `retain` | `true`: survives the end-of-turn discard, staying in hand into the next turn. |
| `ethereal` | `true`: if still in hand at end of turn, exhausts instead of discarding (wins over `retain`). |
| `unplayable` | `true`: can never be played, even with energy and (if aimed) a legal target. |
| `upgrade` | What changes at a rest stop (see Upgrades). Leave it out and the card cannot be upgraded. |
| `upgradeOf` | Set by the game on generated upgrades. Never write it yourself. |
<!-- /names -->

### Card types

<!-- names:cardTypes -->
| Type | Behaviour |
|---|---|
| `attack` | Usually aimed at an enemy (`target: 'enemy'`). Empowered counts attacks. |
| `skill` | Plays on click. |
| `power` | Once played it stays in play for the fight. The only type that can have `triggers` and `onTurnStartEffect`. |
<!-- /names -->

### Effects: everything a card can do

An effect is `{ kind: '...', ... }`. Cards, relics and enemy moves all use the same effects.

<!-- names:effectKinds -->
| Kind | Fields | What it does | Can scale | Enemies can use it |
|---|---|---|---|---|
| `damage` | `value` | Deal damage to the target. Goes through Strength, Weak, Empowered, Vulnerable, then block. | yes | yes |
| `block` | `value` | Gain block. | yes | yes |
| `draw` | `value` | Draw cards (a full hand discards the extra). | yes | no |
| `applyStatus` | `status`, `value`, `to` | Add stacks of a status to `'target'` or `'self'`. | yes | yes |
| `gainEnergy` | `value` | Gain energy this turn. | yes | no |
| `loseHp` | `value` | The player loses HP directly. Block does not help; it can kill. | yes | no |
| `multiplyStatus` | `status`, `factor`, `to` | Multiply the stacks already there (`factor: 2` doubles). Does nothing at 0 stacks. | no | no |
| `exhaustRandom` | `value` | Exhaust that many random cards from your hand. | no | no |
| `discardRandom` | `value` | Discard that many random cards from your hand (can be reshuffled, unlike exhaust). | no | no |
| `damageAll` | `value` | Deal damage to every living enemy; no `target: 'enemy'` needed on the card. | yes | no |
| `adjustTemperature` | `value` | Mage only: shift Temperature (negative cools down), clamped to its range. | no | no |
| `addCardToHand` | `cardId`, `value` | Put that many copies of a specific card straight into the hand (overflow discards, like a draw into a full hand). | yes | no |
| `gainEnergizedTurns` | `value` | Gain 1 extra energy at the start of your turn for that many of your next turns (this turn not counted). | no | no |
<!-- /names -->

"Target" is the enemy the card was aimed at (for a trigger: the first living enemy). "Self" is whoever plays it. Triggered effects are not card plays: they do not count towards "cards played this turn".

### Scaling: a value that grows

Add `scaling` to a damage, block, draw, applyStatus, gainEnergy or loseHp effect. The result is `value + scaling.value x (how many of the source)`.

```ts
// 4 damage, +3 for every other card already played this turn
{ kind: 'damage', value: 4, scaling: { per: 'cardsPlayedThisTurn', value: 3 } }
// damage equal to your block (value 0 + 1 per block)
{ kind: 'damage', value: 0, scaling: { per: 'block', value: 1 } }
// scale from cards carrying a tag
{ kind: 'damage', value: 3, scaling: { per: 'taggedPlayedThisTurn', tag: 'tag-a', value: 5 } }
```

<!-- names:scaling -->
| Field | Meaning |
|---|---|
| `per` | The thing being counted (list below). |
| `tag` | Required only when `per` is `taggedPlayedThisTurn`. |
| `value` | How much is added for each one counted. Use a positive number. |
<!-- /names -->

<!-- names:scaleSources -->
| Source | Counts |
|---|---|
| `cardsPlayedThisTurn` | Cards played earlier this turn (not the card being played). |
| `attacksPlayedThisTurn` | Attack cards played earlier this turn. |
| `taggedPlayedThisTurn` | Cards with the given `tag` played earlier this turn. |
| `block` | Your current block. |
| `strength` | Your current Strength. |
| `handSize` | Cards in your hand when the effect resolves (the played card has left it). |
| `exhaustedThisCombat` | Cards exhausted so far this fight. |
| `targetVulnerable` | Vulnerable stacks on the target. |
| `targetFreeze` | Mage only: Freeze stacks on the target. |
| `temperature` | Mage only: the current Temperature. |
<!-- /names -->

Scaling is part of the base number: Strength, Weak and the rest apply after it. Scaling on `multiplyStatus`, `exhaustRandom` or on an enemy move does nothing; the content check reports it.

### Triggers: "whenever X, do Y" (powers and relics)

```ts
triggers: [{ on: 'cardPlayed', cardType: 'attack', effects: [{ kind: 'block', value: 2 }] }]
```

<!-- names:trigger -->
| Field | Meaning |
|---|---|
| `on` | The event (list below). |
| `cardType` | Only for `cardPlayed`: the played card must be this type. |
| `tag` | Only for `cardPlayed`: the played card must carry this tag. |
| `effects` | What happens. Must not be empty. |
| `oncePerTurn` | `true`: fires at most once per player turn. |
<!-- /names -->

<!-- names:triggerEvents -->
| Event | Fires when |
|---|---|
| `cardPlayed` | A card was played (filter with `cardType` and/or `tag`). |
| `cardExhausted` | A card was exhausted. |
| `blockGained` | You gained block from an effect. |
| `enemyDied` | An enemy died. |
| `hpLost` | You lost HP (a hit past your block, or `loseHp`). |
| `turnStart` | Your turn started, after the draw. |
| `turnEnd` | Your turn is ending, before the hand is discarded. |
<!-- /names -->

A power never triggers on its own play. Triggers firing triggers is cut off after `MAX_TRIGGER_DEPTH` levels, so a loop cannot hang the game. Relics fire before powers. Full rules: `docs/SYNERGY_ENGINE.md`.

### Tags and exhaust

A tag is just a word on a card, such as `'tag-a'`. It does nothing alone; it matters only when another card scales per `taggedPlayedThisTurn` with that tag or a trigger filters on it. Spell a tag the same way everywhere (the check warns about a filter nothing carries, and notes a tag nothing reads). `exhaust: true` removes the card after it is played; `exhaustRandom` removes cards from the hand; `cardExhausted` triggers react to both.

### Upgrades

`upgrade` lists only the fields that change. The upgraded card is generated as `<id>+` and is never offered as a reward.

<!-- names:cardUpgrade -->
| Field | Meaning |
|---|---|
| `cost` | New cost. |
| `effects` | The **whole** replacement list of effects (repeat unchanged ones). |
| `onTurnStartEffect` | Replacement turn-start effect. |
| `triggers` | The whole replacement list of triggers. |
| `tags` | Replacement tags. |
| `exhaust` | `false` to remove Exhaust, `true` to add it. |
| `innate` | `false` to remove Innate, `true` to add it. |
| `retain` | `false` to remove Retain, `true` to add it. |
| `ethereal` | `false` to remove Ethereal, `true` to add it. |
| `unplayable` | `false` to remove Unplayable, `true` to add it. |
| `description` | Avoid, as above. |
<!-- /names -->

An upgrade that changes nothing is an error in the check; one that makes the card weaker or dearer is a warning. A card with no `upgrade` block cannot be upgraded at a rest stop (also a warning, in case that was forgotten).

### Checklist: adding a card

1. **Define it** in `src/data/cards.ts` (copy a neighbour), add it to `ALL_CARDS`, give it an `upgrade` block.
2. **Check its text** in the content browser (`content.html`, search for it): is the sentence what you meant? Click the row to see the base and upgraded versions side by side.
3. **Run the registry tests and the content check:** `npm test` and `npm run content:check`. Fix every error; read every warning.
4. **Run the balance tools:** `npm run balance -- cards --skills all --seeds 100`, then `npm run balance -- pairs --skill smart` (and `--pairs yourcard+other --seeds 300` to confirm a lead).
5. **Read the bands in `docs/BALANCE.md`**: is the card a dead pick for every bot, or far above cards of its cost? Those tools measure; the verdict on whether the card is right is yours.
6. `npm run balance:check`, and `npm run balance:baseline` if you accept what moved. After `balance:report`, the content browser's card panel shows these numbers.

## Enemies and moves

```ts
export const EXAMPLE_ENEMY: EnemyDefinition = {
  id: 'example-enemy',
  name: 'Example Enemy',
  maxHp: 40,
  movePattern: [
    { name: 'Hit', effects: [{ kind: 'damage', value: 8 }] },
    { name: 'Guard', effects: [{ kind: 'block', value: 6 }] },
    { name: 'Sap', effects: [{ kind: 'damage', value: 5 }, { kind: 'applyStatus', status: 'weak', value: 1, to: 'target' }] },
  ],
};
```

<!-- names:enemy -->
| Field | Meaning |
|---|---|
| `id` | Unique key. |
| `name` | Shown in fights. |
| `maxHp` | Starting and maximum HP. |
| `placeholderColor` | Colour of the shared placeholder drawing (until enemies have real visuals). |
| `placeholderScale` | Size of the placeholder drawing (1 is normal). |
| `movePattern` | The moves, in order; it repeats from the start. The enemy cannot choose or react. |
<!-- /names -->

<!-- names:enemyMove -->
| Field | Meaning |
|---|---|
| `name` | Shown in the combat log. |
| `effects` | What the move does, in order. |
<!-- /names -->

- Enemies can only use `damage`, `block` and `applyStatus` (see the effect table). Anything else is ignored in a fight, and the check says so.
- In a move, `to: 'target'` means **the player** and `to: 'self'` means the enemy.
- The intent shown above the enemy is derived from the effects: damage shows a sword and the damage, block a shield, `applyStatus` to self a buff arrow, to target a debuff arrow. It never says which status. A move none of whose effects produce an icon is an error ("intent shows nothing").
- To make an enemy appear: add it to `ALL_ENEMIES`, then put its id in a fight in `ACT_CONTENT` (`src/data/run.ts`): `earlyEncounters`, `encounters`, `elites`, `bosses`. (`lateEncounters` is used from floor 9 up: `MAP_LATE_FLOORS_FROM`.) A fight is a list of ids (up to 3). Test one alone first: `npm run balance -- ladder --fights your-enemy+enemy-d`.
- Checklist: `npm run content:check`, look at it in the browser, `npm run balance -- ladder --skills all`, compare to the tier bands in `docs/BALANCE.md`.

## Relics

```ts
export const EXAMPLE_RELIC: RelicDefinition = {
  id: 'example-relic',
  name: 'Example Relic',
  onCombatStart: [{ kind: 'block', value: 6 }],
};
```

<!-- names:relic -->
| Field | Meaning |
|---|---|
| `id` | Unique key. |
| `name` | Shown in the relic bar. |
| `description` | Avoid, as with cards. |
| `onPickup` | Run effects when found (`maxHp`, `heal`, `gold`). |
| `onVictory` | Run effects after every fight you win. |
| `onCombatStart` | Ordinary effects on you as each fight starts (block, a status on self, a draw). |
| `onTurnStart` | Ordinary effects on you at the start of each of your turns. |
| `triggers` | Same triggers as on powers, active for the whole fight. |
<!-- /names -->

Run effects (for `onPickup` and `onVictory`):

<!-- names:runEffects -->
| Kind | Does |
|---|---|
| `maxHp` | Raise max HP (and heal that much). |
| `heal` | Heal HP. |
| `gold` | Gain gold. |
<!-- /names -->

Add it to `ALL_RELICS` in `src/data/relics.ts` to put it in the pool. A relic left out of the pool is reported (it can never be found). Relics should not aim at enemies directly: use `to: 'self'` or put the effect in a trigger.

## Events

```ts
export const EXAMPLE_EVENT: EventDefinition = {
  id: 'example-event',
  title: 'Example Event',
  text: 'Placeholder text.',
  choices: [
    { label: 'Take it', outcomes: [{ kind: 'gold', value: 40 }, { kind: 'hp', value: -6 }] },
    { label: 'Leave', outcomes: [] },
  ],
};
```

<!-- names:event -->
| Field | Meaning |
|---|---|
| `id` | Unique key. |
| `title` | Shown as the heading. |
| `text` | The scene text (the one place text is written by hand). |
| `choices` | The options. At least one; keep one that costs nothing. |
<!-- /names -->

<!-- names:eventChoice -->
| Field | Meaning |
|---|---|
| `label` | The button text. |
| `outcomes` | Everything that happens when chosen, in order. The buttons also show the generated outcome text. |
<!-- /names -->

<!-- names:eventOutcomes -->
| Kind | Fields | Does |
|---|---|---|
| `gold` | `value` | Gain gold; negative loses it (never below 0). |
| `hp` | `value` | Heal; negative loses HP (never below 1). |
| `maxHp` | `value` | Change max HP. |
| `card` | `cardId` | Add that specific card (use a real id). |
| `randomCard` | none | A random card from the reward pool. |
| `relic` | none | A random relic the player does not have yet. |
| `fight` | `enemies` | Fight these enemy ids now; the usual reward follows a win. |
<!-- /names -->

Add it to `ALL_EVENTS`; it then appears in the act automatically. Open question for you (not decided in code): whether an event fight should give the normal reward.

## Statuses

A status is stacks on a fighter. Each has a `kind`: `duration` stacks drop by 1 at the end of the round; `intensity` stacks stay. The hooks add or multiply damage (see the comment on `StatusDefinition` in `src/game/types.ts` for the exact order).

<!-- names:status -->
| Field | Meaning |
|---|---|
| `id` | The key used by `applyStatus` and friends. |
| `name` | Shown in tooltips. |
| `kind` | `'duration'` or `'intensity'`. |
| `describe` | A function that writes the tooltip from the stack count. Use the tunable for any percentage so text and rule cannot drift. |
| `outgoingDamageAdd` | Flat damage the holder adds (Strength). |
| `outgoingDamageMult` | Multiplier on damage the holder deals (Weak, Empowered). |
| `incomingDamageMult` | Multiplier on damage the holder takes (Vulnerable). |
| `blockMult` | Multiplier on block the holder gains (Frail). |
| `incomingDamageCap` | Caps all damage the holder takes at this amount, applied last (Intangible). |
| `consumedByAttack` | Loses one stack after each attack card the holder plays (Empowered). |
| `clearAtTurnEnd` | Removed entirely (not decremented) at the next end-of-round tick, regardless of `kind` (Ignite). |
| `badge` | Placeholder symbol and colour for the status icon. |
<!-- /names -->

The existing statuses (a status id must be one of these; adding one needs a code change to the `StatusId` type, so the check can validate the ids you use):

<!-- names:statusIds -->
| Id | Behaviour |
|---|---|
| `weak` | Duration. The holder deals less attack damage. |
| `vulnerable` | Duration. The holder takes more attack damage. |
| `strength` | Intensity. The holder's attacks deal N more damage for the whole fight. |
| `empowered` | Intensity. The next attack card(s) deal a damage multiple; one stack per attack card. |
| `freeze` | Intensity, Mage only. Never counts down on its own; every `FREEZE_STUN_THRESHOLD` stacks stuns the holder for one move and removes those stacks. |
| `frail` | Duration, StS-style keyword (engine-only, see "Keyword mechanics" below). The holder gains less block. |
| `intangible` | Duration, StS-style keyword (engine-only). All damage the holder takes is capped at a fixed amount. |
| `buffer` | Intensity, StS-style keyword (engine-only). Prevents the next instance of HP loss entirely, one stack at a time. |
| `ignite` | Intensity, Mage only, placeholder name, `clearAtTurnEnd`. Each attack played this turn deals double the damage of the one before it (Heating Up). |
<!-- /names -->

## Keyword mechanics (StS-style, engine-only as of 2026-10-08)

Built at the user's request, mirroring Slay the Spire's own keyword vocabulary. Not applied to any
real card yet — demonstrated only by `src/data/keywordCards.ts`'s "Test: ..." cards, reachable via
the `?dev` panel's "Add card" dropdown, never offered as rewards. Adding one to a real card is just
setting the field (`innate`/`retain`/`ethereal`/`unplayable` on the card; `frail`/`intangible`/`buffer`
via `applyStatus`) — no further plumbing needed.

- **Innate** (`CardDefinition.innate`) — always in the opening hand, never shuffled. If more Innate
  cards exist than the hand size, only as many as fit land in the opening hand.
- **Retain** (`CardDefinition.retain`) — survives the end-of-turn discard into the next turn.
- **Ethereal** (`CardDefinition.ethereal`) — exhausts instead of discarding if still in hand at end
  of turn. Wins over Retain if a card somehow has both.
- **Unplayable** (`CardDefinition.unplayable`) — can never be played, by energy or by targeting.
- **Frail** (status) — the defensive counterpart to Weak: less block gained.
- **Intangible** (status) — caps all damage taken at a fixed amount, applied after every other
  damage modifier.
- **Buffer** (status) — prevents the next instance of HP loss outright, independent of block;
  consumed one stack at a time.

`ignite` is not part of this engine-only batch — it is live on a real card (Heating Up) as of
2026-10-08; see "Mage — Core Mechanics" in `implementationplan.md` and `DESIGN_LOG.md`.

## The act's map

The map is generated from the run's seed (`src/game/actMap.ts`); its dials are in `src/data/tunables.ts` (all provisional). Authoring content does not require touching the generator, but these rules decide where your fights, elites, events and shops can appear.

- **Shape:** `MAP_FLOORS` floors plus the boss, `MAP_LANES` columns, `MAP_PATHS` climbs from the bottom that share stops where they overlap. Floor 1 is all fights, the floor before the boss is all rests. `MAP_FIRST_FLOOR` says from which floor events, shops, elites and rests may appear (elites and rests from the fifth floor). Rests and shops never come twice in a row on a path.
- **Stop-kind mix:** `MAP_KIND_WEIGHTS` is the base chance of each kind.
- **Route themes (`MAP_ROUTE_THEMES`):** each climb gets one theme (`risky`, `events`, `safe`, `fights`), shuffled by the seed, which multiplies the chance of each kind of stop on that climb, so choosing a path is choosing an experience. A stop shared by several climbs takes one of their themes at random. The theme is not stored on the saved map (the saved shape did not change) and is not shown on screen: the player sees it only through the stops. Adding a theme is one entry in `MAP_ROUTE_THEMES`; the multipliers are map-feel dials, not balance.
- **Elites:** `MAP_MIN_ELITES` (3) elites always exist, and **every route from a first-floor stop to the boss crosses at least one elite**: while some route avoids them, the generator turns a stop on it into an elite (a fight first, then a shop or event; never a rest, never before the first elite floor; the risky route preferred). If every legal stop on a route already sits beside an elite it accepts two elites in a row (about 4 maps in 3000). The result is roughly 4.6 elites per map. A test checks all of this across 3000 seeds (`src/game/actMap.invariants.test.ts`); if you change the rules, update the test on purpose. Elites and the boss need at least one entry in `elites` / `bosses` in `ACT_CONTENT`.
- **Events:** every event in `ALL_EVENTS` is in the act; with fewer events than event stops the same event repeats (a bag shuffled by the seed). Events are placeholders; reuse is expected.
- **Randomness:** the map uses the run's seeded stream in a fixed order. Changing how many random numbers the generator draws changes every seed's map (saved runs keep theirs, because a save stores the whole map).

## What the player sees on a card

- **Text is generated** from the effects (`describeEffect`, `cardText` in `src/game/describe.ts`).
- **In a fight, a damage effect shows its live number**, not the printed one: Strength, Weak, Vulnerable, scaling and Empowered are included, computed by `CombatState.previewCardDamage` (the same formula as playing the card), against the first living enemy. The card text turns green when the card's total damage is above its printed total and red when below. Cards with a hand-written `description` keep their printed text, which is one more reason not to write one. Other screens (rewards, shop, deck viewer) show printed numbers.
- **Pictures** (hero, enemies, icons, backdrops, borders) are separate from content data: `docs/ART.md`.

## What `npm run content:check` looks at

Errors (the command exits non-zero) mean broken or inert content. Warnings mean "probably a mistake". Notes (`--info`) are facts that are often intended.

- **Ids and references:** unknown status ids, enemy ids, card ids or event ids; ids missing from the registry; upgrades that did not register.
- **Text and intent:** empty card, relic, event or status text; a power that does nothing; an enemy move whose intent shows nothing; hand-written `description`.
- **Effects:** scaling on an effect that cannot scale; scaling per tag with no tag; negative, zero or fractional values; effects an enemy ignores; an aimed effect on a card without `target: 'enemy'`; costs the player can never pay.
- **Triggers:** a trigger with no effects, an unknown event, filters that only work for `cardPlayed`, a tag filter nothing carries, triggers on a card that is not a power.
- **Reachability:** a card in no reward pool, starter deck or event; a relic outside the pool; an enemy or event in no fight list; empty act lists.
- **Duplicates and extremes:** duplicate names, shared status badges; a damage or block per energy more than 3x (or under 1/3 of) the middle card's, an enemy HP or hit far from the others. These are typo catchers, not balance verdicts.

`--strict` also fails on warnings. The two synergy test relics (`exhaust-token`, `kill-token`) are known to be outside the relic pool and show up only as notes; the synergy cards are in the reward pool and need no exemption.

## Common mistakes

- **Hand-writing `description`.** The text then stops following the numbers. Delete it.
- **Forgetting `target: 'enemy'`** on a card that hits an enemy: the check calls it an error, the player could not aim it.
- **Forgetting `upgrade`**, or an upgrade that repeats the base numbers.
- **Writing only the changed effect in `upgrade.effects`.** It replaces the whole list; repeat the unchanged effects.
- **Adding a card but not to `ALL_CARDS`** (or an enemy to `ALL_ENEMIES`, a relic to `ALL_RELICS`): it silently does not exist.
- **A card with `inRewardPool: false`** that is also not in the starter deck or an event: nobody can ever get it.
- **A tag spelled two ways** (`'tag-a'` vs `'taga'`): the scaling or filter finds nothing.
- **`scaling` on an enemy move or on `multiplyStatus`:** ignored.
- **An enemy move with `draw`, `gainEnergy`, `loseHp`:** ignored by enemies, and shows no intent.
- **Changing a number in the wrong place:** a Weak percentage is in `tunables.ts`, not on cards.
- **Renaming an id** that players have saved runs with: the old save is discarded. Change `name`, not `id`.
- **Judging from one balance run.** Read the confidence intervals; `INCONCLUSIVE` means add seeds, not "fine".

## Reading the browser's simulation panel

In `content.html`, click a card. If `balance/reports/sample.json` (from `npm run balance:report`) or `balance/baselines/baseline.json` (from `npm run balance:baseline`) existed when the page was built, the panel shows the card's effect on win rate, HP lost and turns with 95% intervals, and its best synergy partners. Without those files it says so. The page reads them at build time, so regenerate and rebuild (or restart `npm run dev`) after a balance run.
