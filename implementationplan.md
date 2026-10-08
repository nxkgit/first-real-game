# Implementation Plan

## Project Overview

A browser-based, turn-based deckbuilder roguelike in the spirit of Slay the Spire (StS), built with **TypeScript + Phaser**. Purpose: a learning exercise in building a real project with Claude Code, and a portfolio/resume piece shareable with friends via a link (no install).

Source of truth for *current* decisions is this document. For *why* a decision was made, or if it changed over time, see `DESIGN_LOG.md`.

Creative/aesthetic/narrative content (hero identity, art, flavor, names) is authored by the user, not by Claude Code. Placeholder values and placeholder visuals (simple shapes/colors) are expected and correct until the user supplies real ones.

## Build Staging

### MVP 1 — Single Combat (done)

**Status (2026-10-06):** complete. First playtest verdict: the core loop "seems fine"; it led to two changes — attack cards are now aimed at the enemy (drag, or click card then enemy) instead of click-to-play, and the enemy's intent/block readouts are icons instead of words. Followed by playtest-friendly polish: scale-to-window (phones included) at full device resolution, draw/discard pile counts, and hover tooltips on icon readouts. Unit tests (Vitest, `npm test`) cover the logic layer.

**Goal:** prove out the core combat loop's feel and visuals. Nothing beyond one fight.

**In scope:**
- One hero ("Mage" — final identity/visuals TBD by user, placeholder visuals for now)
- One enemy (placeholder visuals; final look TBD by user)
- Draw a hand, play cards, spend energy, end turn, enemy acts on its telegraphed intent, repeat until win (enemy HP to 0) or loss (player HP to 0)
- StS-style face-off layout: enemy area top/center, player area bottom, hand of cards at bottom of screen, energy and HP indicators visible

**Explicitly out of scope for MVP 1** (do not build yet, see "Deferred" section below): shop, gold, relics, non-combat events, map/run structure, multiple heroes, card rarity tiers, full status-effect roster, balance pass, meta progression.

**Definition of done:** the full loop (draw → play → end turn → enemy turn → win/loss) runs in a browser, is playable with mouse/click, and feels responsive enough to evaluate "does this feel good" before building anything further.

### MVP 2 — Chained Combats + Non-Combat Events (done)

A short linear sequence of a few fights plus non-combat nodes, deployed somewhere shareable for friend playtesting.

**Decided and built (2026-10-06), all numbers provisional:**
- **Run skeleton:** a fixed linear path — fight, fight, rest, fight (`src/data/run.ts`). HP, deck, and gold carry between fights. Losing any fight ends the run; winning the last one wins it. Run-end screen offers a new run.
- **Reward after each won fight (except the last):** pick 1 of 3 cards from a reward pool, *or* take gold. Gold is banked and shown but has nothing to spend on yet — the shop is still deferred, and gold's value vs. a card is still an open question.
- **Rest stop:** heals 30% of max HP (capped at max), then moves on.
- **Placeholder content:** Enemies A/B/C with rising difficulty (same placeholder drawing, different colors) and a 7-card reward pool built only from the existing damage/block/draw effects. Final cards/enemies are the user's to design.
- **Starting/MVP 1 numbers kept as provisional placeholders** (user's call, 2026-10-06): enemy HP/damage/patterns, starter deck, Block as the only status effect.
- **Deployment:** GitHub Actions workflow publishes to GitHub Pages on every push to `main` (needs Pages source set to "GitHub Actions" in repo settings).

**Built since (2026-10-07):** Weak, Vulnerable and Strength (StS rules; see DESIGN_LOG.md); fights with several enemies (fight 2 is two placeholder enemies); enemy moves made of the same effects as cards, with StS-style generic buff/debuff intent icons; card text generated from effects; a card registry with hero ownership. A rough shop screen exists on its own branch as a visual draft only.

**Superseded by the one-act demo below.** The fixed fight-fight-rest-fight path became a branching map, events and a boss were added, and the rest stop gained an upgrade option. Still open from this stage: shop contents and gold's value (a draft screen exists, nothing decided).

### One-Act Demo (current target, built 2026-10-07)

At the user's direction (2026-10-07), the run became essentially one Slay the Spire act: a branching map of stops leading to a boss. Everything is **placeholder content with provisional numbers** (logged in DESIGN_LOG.md); the point is the shape and the systems, so design can land into them later.

- **Map.** A seeded, branching map: 12 floors plus the boss, 5 columns, 4 climbs drawn from the bottom that share stops where they overlap. Stop kinds: fight, elite, rest, shop, event, boss. Rules: floor 1 is all fights; the floor before the boss is all rests; elites and rests from floor 5, shops from floor 4, events from floor 2; elites/rests/shops never twice in a row on a path. All numbers in `src/data/tunables.ts`.
- **Elites and boss.** Fights have a tier. Elites and the boss are drawn larger and announce themselves. An elite gives more gold and drops a relic (with either reward choice). Beating the boss wins the act and ends the run.
- **Relics.** A relic is data: effects on pickup, after each win, at the start of each fight, or at the start of each turn, reusing the same effects cards use. Five basic placeholder relics (+1 Strength at fight start, +10 max HP, block at fight start, heal after each win, an extra card each turn). Relics come from elites and events.
- **Events.** A stop with text and choices; each choice's outcomes are shown up front. Outcome kinds: gold, HP, max HP, a card, a random card, a relic, a fight. Four placeholder events.
- **Card upgrades.** Every card can define an upgraded version (registered as `<id>+`). At a rest stop the player chooses: heal, or upgrade a card (shown next to its upgraded version before confirming), like StS. Upgrade numbers are placeholders.
- **Shop.** Still the draft screen as a stop kind (flat price, four cards). Not a decision.
- **Quality of life.** Draw/discard pile viewers, a settings panel (volume, mute, animation speed, screen shake), and a content browser page listing everything with Markdown/CSV export. Keyboard targeting for multi-enemy fights was explicitly left as is (mouse is the way to choose a target).

**Still open:** shop contents and gold's value; real relics, events, encounters and map rules; upgrade numbers; rest-stop options beyond heal/upgrade; multiple acts; hero abilities; real content of every kind.

### Tooling and playtest readiness (built 2026-10-07)

Work that makes the MVP 2 build ready for friend playtesting and gives the later design and balance conversations evidence. None of it makes a gameplay or balance decision; all content stays placeholder.

- **Seeded randomness.** A run has a seed; shuffles, rewards and shop stock all come from it, so a run replays exactly. A seed can be given in the page address (`?seed=123`).
- **Save and resume.** The run is saved at every stop in the browser's local storage. On the next visit the player can continue or start over. A fight in progress restarts from its beginning (with the same shuffle, so refreshing cannot reroll it). Unusable saves are discarded, never a crash.
- **Playtest report.** Each run keeps a stop-by-stop log (fights, turns, HP, card picks, rests, shop buys). The end screen has a "Copy run report" button; the last 20 finished runs are kept in the browser. No personal information is recorded.
- **Dev panel.** Add `?dev` to the address: jump to any stop, start a fight with chosen enemies, add cards, change gold or HP, start a seeded run, copy reports. Loaded only with that flag.
- **Balance simulator.** `npm run sim` plays whole runs (or one fight) headlessly with a simple greedy bot and reports win rates, fight lengths, HP lost and card picks. It measures; it does not decide. Its results are only meaningful as comparisons between versions of the content or tunables, since a real player is not this bot. This is a tool for the deferred "combat math/balance pass", not the pass itself.
- **Synergy engine.** Data-driven card-to-card interactions: scaling values, Empowered and status-multiplying, triggers on power cards and relics, tags, exhaust, energy gain and self-damage, with 20 placeholder cards and 2 relics kept out of the reward pools. This partly lifts the "full status-effect roster" deferral for the mechanics synergies need; the tribe/school system stays deferred. See `docs/SYNERGY_ENGINE.md`.

## Architecture Principles

(Engineering/structure guidance — not creative decisions. This is Claude Code's lane.)

- **Data-driven content.** Cards, status effects, and enemy move patterns should be defined as data (objects/config), not as hardcoded branching logic, so adding/changing content later doesn't require restructuring code.
- **Separate game logic from rendering.** Core game state and rules (deck/hand/discard, energy, turn resolution, win/loss) should be plain TypeScript, independent of Phaser, so it's easy to reason about and unit-test. Phaser scenes should read from and dispatch actions into that logic layer, not own game state themselves.
- **Centralize tunable numbers.** HP, damage, energy, costs, hand size, etc. belong in one obvious place (constants/config), since balance will be iterated on repeatedly once playtesting starts.
- **Build to current scope only.** Don't implement anything in the "Deferred" list below ahead of when it's actually scheduled, even if it seems easy to add while touching related code.

## Core Systems — Decided

### Energy & Hand

- Energy per turn: **4** (static default, explicitly expected to be tuned later)
- Draw: **5 cards** per turn
- Draw/discard model: copy StS directly — draw pile, hand, discard pile. Draw up to hand size at the start of each turn; if the draw pile empties mid-draw, shuffle the discard pile into the draw pile and continue. Unplayed cards in hand discard at end of turn; played cards go to the discard pile. (Exhaust pile not needed for MVP 1; can be added later without restructuring if data-driven.)

### Card Types

Reusing StS's **Attack / Skill / Power** split for now. This is generic, non-proprietary game-mechanic plumbing common across the genre, not a creative identity element — fine to reuse. Treat as a placeholder categorization; real mechanical differentiation should come later from the hero's own signature systems, not from renaming this split.

### Status Effects

Decision: **mirror StS closely.** Same reasoning as card types — this is proven, generic plumbing. Exact roster for MVP 1 is minimal (see Open Questions — likely just Block to start; broader roster like Weak/Vulnerable/Strength arrives in MVP 2).

### Enemy Intent Telegraphing

Decision: **very similar to StS** — an icon above the enemy showing its next move (damage number for attacks, icon for buff/debuff/defend-style effects), visible to the player before they act.

### Run Structure (future, not needed for MVP 1)

- One life per run (permadeath), like StS — no meta progression/persistent currency between runs, at least for now.
- The eventual full run includes elites and a boss at the end.

## Mage — Core Mechanics (built 2026-10-07)

The user's first real design pass for the Mage (hero identity, card names and mechanics are theirs;
see CLAUDE.md's creative boundary). This is the run's first **real** content — everything before it
in the act was clearly-placeholder scaffolding. All numbers below are explicitly provisional
(flagged "X" by the user where undecided) and chosen only to be reasonable relative to the existing
cards in `cards.ts` (Strike 6 dmg/1 cost, Bolt 12/2, Heavy Hit 24/3, Defend 5/1, Big Block 13/2).
Decided-without-asking calls the user didn't specify are logged in `DESIGN_LOG.md` with their reasoning.

### Hero power (new system)

Each hero can have one **hero power**: a fixed ability outside the hand (never drawn, discarded or
exhausted), usable once per the player's turn for its energy cost, from its own button. This is new
engine surface (`HeroPowerDefinition` in `game/types.ts`, `CombatState.useHeroPower` /
`canUseHeroPower`), separate from Power *cards* (which stay in play and act every turn once played).
It answers the open item from HANDOFF.md ("each hero gets one ability usable once per turn").

The Mage's power (`src/data/heroPowers.ts`; display name "Hero Power" — a real name is the user's to
give it): **1 cost, for the next 2 turns gain 1 extra energy at the start of your turn.** Built as a
new generic effect, `gainEnergizedTurns`, so the mechanic is available to any future card or power,
not special-cased to this one button.

### Temperature (name, range and thresholds all PROVISIONAL)

A second resource alongside energy, unique to the Mage: a number from **-5 to +5**, starting at 0
each fight (`CombatState.temperature`, clamped). Fire-tagged cards push it up, frost-tagged cards
pull it down, by an amount each card sets explicitly (a new `adjustTemperature` effect; not an
automatic per-tag rule, so a card like Absolute Zero can shift it by a lot more than a Scorching
Wind). A new scaling source, `temperature`, lets a card's number key off the current value (Molten
Core).

The user's stated intent — "fire cards gain an extra effect at high temperature, frost cards at
low temperature" — is not built yet: no card in this first batch calls for it, and building the
threshold-bonus plumbing before a card needs it would be exactly the premature abstraction
CLAUDE.md warns against. Add it (most likely a `temperatureBonus` block on `CardDefinition`, gated
by the card's `fire`/`frost` tag and a threshold constant) once a real card needs it.

### Freeze (new status, Mage-only)

A new `StatusId`, `freeze`: stacks never count down on their own (unlike Weak/Vulnerable), and every
`FREEZE_STUN_THRESHOLD` (5, provisional) stacks **stuns the enemy for one move** and removes those
stacks (`CombatState.checkFreezeStun`; a single large application can cross the threshold more than
once). A stunned enemy skips its next move without its intent advancing, so it still telegraphs —
and then performs — the same move once the stun wears off. The enemy's intent icon does not yet show
that a stun is pending (a known UI gap; the player only learns from the combat log when it happens).

### The 20 cards (`src/data/mageCards.ts`)

All in the Mage's reward pool. Where the user wrote "X" for a value, or left a cost or effect
unspecified, a placeholder was chosen and is flagged in the file's comments; two answers came from
direct questions (Cauterize = plain block; the freeze-stun threshold = every 5 stacks).

| Card | Type/cost | What it does |
|---|---|---|
| Scorching Wind | Attack, 0 | Light fire damage; heats up. |
| Heating Up | Skill, 1 | Each attack played this turn deals double the damage of the one before it (1st normal, 2nd x2, 3rd x4, ...), uncapped. Corrected 2026-10-08 — see "Heating Up: the real mechanic" below; was briefly built as a flat Empowered grant, which was wrong. |
| Meteor Shower | Attack, 2 | Fire damage to **all** enemies (new `damageAll` effect); heats up. |
| Molten Core | Skill, 2 | Adds Scorching Winds to hand, scaling with current Temperature (new `addCardToHand` effect). |
| Apocalyptic Flame | Attack, 3 (cost wasn't given) | The Mage's biggest single hit. |
| Crippling Heat | Attack, 1 (cost was "0 or 1") | Damage + Weak; heats up. |
| Heat Flash | Attack, 0 (the other half of the "0 or 1" pair) | Smaller damage + Weak; heats up. |
| Cauterize | Skill, 1 | Plain block (user's answer to "some kind of defensive card"); heats up. |
| Heat Warning | Attack, 1 | Damage + Vulnerable; heats up. |
| Ice Block | Skill, 3 (cost was "high", no number) | "Immune to damage until your next turn" (placeholder: a block value well above any hit a current fight deals, not a true immunity flag); cools down. |
| Ice Barrier | Skill, 1 | Discards cards from hand, gains block; cools down. |
| Hypothermia | Skill, 1 | Applies a Freeze stack; cools down. |
| Frozen Shield | Skill, 1 | Block + a Freeze stack; cools down. |
| Cryofreeze | Power, 2 | "Gain X plating" (placeholder: reuses the existing turn-start-block pattern, like Fortify, rather than inventing a separate "plating" mechanic); cools down on cast. |
| Endless Winter | Power, 1 | Applies 1 Freeze every turn (powers' turn-start effects can now target the first living enemy automatically, a small engine change this card needed). |
| Glaciate | Attack, 2 | Triple damage against a target with any Freeze (new `vsFreezeMult` field on the damage effect). |
| Glacial Spike | Skill, 1 | Applies Freeze; cools down. |
| Absolute Zero | Skill, 3 | Large, pure Temperature drop, no other effect. |
| Hungering Cold | Power, 1 | Cools down by 1 every turn. |
| Arctic Strike | Attack, 1 | Damage that scales with the target's Freeze stacks (new `targetFreeze` scaling source). |

### Engine additions this took

New `Effect` kinds (`game/effects.ts`): `damageAll`, `discardRandom`, `adjustTemperature`,
`addCardToHand`, `gainEnergizedTurns`; a new optional `vsFreezeMult` on `damage`. New scaling
sources: `temperature`, `targetFreeze`. A power's `onTurnStartEffect` now targets the first living
enemy (previously always `undefined`, so a target-needing effect there was silently a no-op).
`CombatStats.cardsAddedThisCombat` tracks cards materialized by `addCardToHand`, since the deck's
total card count is no longer fixed for a fight that uses it (the fuzz-test harness now accounts for
it). Scenario capture/restore (`game/scenario.ts`) carries Temperature, the hero-power-used flag and
the energized-turns counter, so a captured mid-fight Mage state reloads exactly.

Played in a real browser (not just unit-tested): the hero power (button state, the once-per-turn
lock, the energy bonus landing on turns 2 and 3 and not turn 1), the Temperature readout and its
colour, Freeze stacking via a loaded dev-panel scenario (a Freeze badge appears, stacking to 5 logs
"Enemy A is frozen solid!", the enemy then skips its move without its intent changing, and Glaciate's
live-damage number drops from 24 back to 8 the instant the stun consumes the stacks), and Meteor
Shower hitting every enemy in a two-enemy fight.

## Keyword mechanics (StS-style, built 2026-10-08)

The user asked to "examine all the keywords from StS like retain and innate and the rest" and
implement them. Before building, three questions were asked and answered (full reasoning in
`DESIGN_LOG.md`): which card-property keywords to build (Innate, Retain, Ethereal, Unplayable — all
four, out of the option list offered); which status-effect keywords, since `implementationplan.md`
had deferred "the full status-effect roster" as a group (Frail, Intangible, Buffer — chosen, out of
that same deferral); and whether to put any of them on a real card yet (no — **engine only** for now,
same treatment as Temperature's unused threshold-bonus half: built and demonstrated, not applied to
a balance/design decision on the user's behalf).

**Card-property keywords** (`CardDefinition`, mirroring how `exhaust` already works):
- **Innate** — always starts in the opening hand, never subject to the shuffle (`Deck`'s constructor
  only; a later mid-fight reshuffle of the discard pile does not re-apply it). More Innate cards than
  the hand size: only as many as fit land in the opening hand.
- **Retain** — survives the end-of-turn discard into the next turn.
- **Ethereal** — exhausts instead of discarding if still in hand at end of turn (wins over Retain if
  a card somehow has both).
- **Unplayable** — can never be played, by energy or by targeting.

**Status-effect keywords** (`StatusDefinition`, alongside Weak/Vulnerable/Strength/Empowered):
- **Frail** — the defensive counterpart to Weak: less block gained (`FRAIL_BLOCK_MULT`, mirrors
  `WEAK_DAMAGE_MULT`'s value). New `blockMult` status hook, applied in a new `CombatState.calcBlock`.
- **Intangible** — caps all damage taken at a fixed amount (`INTANGIBLE_DAMAGE_CAP`), applied last in
  `calcDamage`, after every other modifier (Vulnerable included). New `incomingDamageCap` status hook.
- **Buffer** — prevents the next instance of HP loss entirely, independent of block (block still
  absorbs normally first); consumed one stack at a time. Wired into both `dealDamage` (enemy hits and
  player-dealt damage) and the `loseHp` effect (self-damage cards), which previously had no shared path.

**Demo cards:** `src/data/keywordCards.ts`, one "Test: ..." card per keyword (7 total), same pattern
as `synergyCards.ts` — `owner: 'neutral'`, `inRewardPool: false`, reachable via the `?dev` panel's
"Add card" dropdown and the scenario system, registered as known test cards (`testCardIds` in
`content/world.ts`) so the content checker treats them as intentionally unreachable rather than a
content bug.

Played in a real browser, confirmed via the live `CombatState` (not just visuals): Test: Unplayable
could not be played (`canPlay` false, `playCard` false) even with 10 energy; Test: Innate landed in
the opening hand of a normal (non-scenario) fight; a Retain card survived `endPlayerTurn` into the
next hand while an Ethereal card left unplayed was exhausted instead of discarded, in the same turn;
Frail cut a 13-block card down to 9 (13 × 0.75, floored); Intangible capped a 500-damage hit to 1
(with no block in the way, HP dropped by exactly 1); Buffer absorbed two full hits (14 and 500
damage, HP unchanged both times, stacks ticking 2 → 1 → gone) and then a third hit (8 damage) went
through normally once the stacks ran out.

## Heating Up: the real mechanic (corrected 2026-10-08)

The first build of Heating Up (above, in "Mage — Core Mechanics") approximated "this turn, attacks
deal double damage" with a flat 5-stack grant of the existing Empowered status, flagged as a
placeholder in its own code comments. The user's actual intent, given directly: "I want the first
wind to do x damage, the second wind to do 2x dam, the third to do 4x and so on exponentially 2^n so
that you can play apocalyptic flame at big dam * 2^n" — an uncapped exponential chain, not a flat
double, and the *first* attack after playing it is normal (nothing has triggered the bonus yet).

Built as a new status, **Ignite** (`StatusId: 'ignite'`, placeholder name — same treatment as
"Temperature"): its `outgoingDamageMult` hook reads `CombatState.stats.attacksPlayedThisTurn`
(already tracked, already excludes the attack currently resolving, already resets each turn) and
returns `2 ** attacksPlayedThisTurn`, so the multiplier escalates on its own as attacks are played —
no new trigger or per-attack bookkeeping needed. One real new, reusable engine piece: a
`clearAtTurnEnd` flag on `StatusDefinition`, wiped entirely (not decremented) at the same
end-of-round point `duration` stacks tick, regardless of `kind` — neither existing `kind` fit
"lasts only until the end of the turn it was granted" (`duration` ticks by 1/round; `intensity`
never clears on its own).

**Provisional call, flagged rather than hidden:** `attacksPlayedThisTurn` counts the whole turn, not
attacks since Heating Up was played — so an attack played *before* Heating Up this turn already
counts toward the multiplier for whatever comes after it (e.g. Strike, then Heating Up, then
Scorching Wind: the Wind is already at 2x, as if two attacks had been played after Heating Up).
Easy to change (gate the count to "since this status was applied") if that turns out to matter once
real decks are built around it.

Played in a real browser, confirmed via `CombatState`: Heating Up → Scorching Wind → Scorching Wind
→ Scorching Wind → Apocalyptic Flame dealt the exact 1x/2x/4x/8x sequence; Ignite's badge disappeared
after ending the turn, and an attack played fresh the next turn (nothing chained yet) hit for
normal, unmultiplied damage.

## Starter deck draft (built 2026-10-08)

Planned in an explicit planning-mode session, then built the same day (full back-and-forth:
`DESIGN_LOG.md` "Starter deck draft"). Replaces the old fixed, hardcoded `buildStarterDeck()` with a
player-drafted starting deck, on top of a small generalized card-typing addition that also sets up
future heroes/archetypes. `buildStarterDeck()` itself is unchanged and still lives in `data/cards.ts`
as the simulator/balance toolkit's reference starter deck (and as a test convenience, `newPlayableRun`
in `data/run.ts`) — the live game simply no longer calls it directly.

**Mechanic:** the **New Run** button (and a fresh boot with no save) no longer jumps straight to the
map. `RunState` gets a new `'draft'` phase: an intro screen (`DraftIntroScene`, styled like the
reward screen) explains it's time to build a deck, with a single "Proceed" button. The existing
1-of-3 reward-screen component (`RewardScene`) is then **reused ten times in a row** (a `draft: true`
init flag switches its data source, title text, and hides the gold button/HUD/deck button — no new
screen class for the picks themselves), each round offering 3 **distinct** cards drawn uniformly at
random from the new **starter pool** (`starterPoolFor(MAGE)`, archetype-agnostic — no weighting
toward any sub-class). Each of the 10 picks is mandatory: there is no gold option and no cancel path
at all in `RewardScene` (draft or not), so nothing needed removing to make a round unskippable.
Picking the same offered card across different rounds is allowed and stacks a copy, the same way the
old starter deck had 4 copies of Strike — `RunState.pickDraftCard` just pushes the chosen card and,
if the deck isn't yet at `STARTER_DECK_SIZE` (10, `tunables.ts`), rolls the next round's offer
internally; once it is, `phase` becomes `'map'` and the run proceeds exactly as before this feature
existed. The whole draft draws from the run's own seeded `Rng` stream (`RunState.rollDraftOffer`),
the same way reward rolls already do, so a seed still replays deterministically and a save mid-draft
resumes exactly (new `SavedRun.pendingDraftOffer` field; **save version bumped to 3**, so an old v2
save is discarded like any other outdated save — never a crash).

**Pools expanded** per the user's explicit "test everything" request: every card currently in
`ALL_CARDS` (`data/cards.ts`) is now `inStarterPool: true`, and the three basics that were
starter-only before (Strike, Defend, Focus — Bolt was already in the reward pool) are now
`inRewardPool: true` as well, so the reward pool grew from 51 to **54** cards. **Judgment call,
documented rather than asked:** the 7 engine-only "Test: ..." cards in `keywordCards.ts` are
deliberately left out of both pools — they are demonstration fixtures for Innate/Retain/Ethereal/
Buffer/etc. (see "Keyword mechanics" below), never meant to be real player-facing content, and
including them would silently promote test fixtures to shipped content. `buildUpgraded` (which
generates every `<id>+` card) now forces `inStarterPool: false` the same way it already forced
`inRewardPool: false`, so an upgraded card can never be offered by either pool.

**New `CardDefinition` fields (data model only — scaffolding, see "Deferred" for what still is):**
- `archetype?: string` — a hero-scoped sub-class label (e.g. the Mage's `'frost'`/`'fire'`). Purely
  descriptive for now; per the user's own design notes (`docs/classbrainstorming.md`), most future
  heroes get one offense-leaning and one defense-leaning archetype, but that is a design convention
  for content authoring, not an engine rule, and it is **not a player-facing choice** — nothing
  reads this field yet except the future loot-table idea below. No card has one set yet.
- `rarity?: RarityTier`, a new type `'common' | 'uncommon' | 'rare'` (placeholder tier names) — field
  only; no reward-odds weighting logic reads it yet. No card has one set yet.
- `inStarterPool?: boolean` — mirrors `inRewardPool`; see "Pools expanded" above for who has it.

**Not decided/built here, deliberately:** the actual reward-odds weighting that `rarity` would drive;
a second hero's real content (the `archetype` field is generic and ready whenever that happens);
creature-specific loot tables that would bias starter/reward sampling toward an archetype (raised by
the user as a future idea, not scheduled — see Open Questions).

Played in a real browser (Playwright, `e2e/draft.e2e.ts`, plus by hand): New Run opens "Build your
deck", Proceed rolls the first of 10 rounds, each round shows 3 distinct cards and no gold option,
all 10 picks land in the resulting deck in order, and the run then proceeds to the map exactly as
before. Also confirmed a normal post-fight reward screen now offers cards that used to be
starter-only (Strike/Defend/Focus can come up as rewards). Every other existing e2e test keeps
reaching the map through the old fixed starter deck, via a new `Harness.completeDraftIfPending()`
(`RunState.skipDraftWith`, a dev/tooling bypass next to `jumpTo`/`startFight`) that `game.open()`
calls by default — it does not touch the rng stream, so nothing about existing tests' seeded
behaviour moved. `npm run verify` is green (831 tests, several rewritten where they asserted the old
pool composition or fixed starter-deck phase); balance baseline and sample report regenerated for the
grown reward pool (`npm run balance:baseline`/`balance:report`), no numbers tuned.

## Deferred (explicitly not MVP 1 — do not build yet)

- Shop system (shop contents, prices, exchange rate between a card reward and gold) — a draft screen exists as a stop kind; nothing about it is decided
- Relics — a basic placeholder system exists (see "One-Act Demo"); real relic design (what they do, where they come from) is deferred
- Non-combat events — a placeholder system exists; real event writing and design is deferred
- Map/run structure — one act with a branching map exists; real encounter design, multiple acts, treasure stops and other stop kinds are deferred
- Card rarity tiers and reward-pool weighting — 2026-10-08: a `rarity` field and placeholder tier names are now built as data-model scaffolding (see "Starter deck draft"), but the weighting/odds logic itself is still deferred
- Multiple heroes/archetypes (ranger, fighter, etc.) — MVP 1 is Mage only. 2026-10-08: a generic `archetype` field is now built, scoped per hero (see "Starter deck draft"), as scaffolding only — Mage remains the only hero with real content
- Magic-school/tribe synergy system — deprioritized in favor of single-hero depth for now
- Full status-effect roster beyond MVP 1's minimal set — partially lifted 2026-10-08 for the mechanics only: Frail, Intangible and Buffer are built (engine-only, no real card uses them; see "Keyword mechanics"), the same way the synergy engine partially lifted this for its own mechanics earlier. Real statuses beyond that, and applying any of these to real content, are still deferred.
- Combat math/balance pass (HP/damage scale, target fight length in turns). A simulator now exists to support it (see "Tooling and playtest readiness"); the pass itself is still deferred
- Enemy roster beyond the placeholder enemies (four normal, two elites, one boss), enemy AI variety

## Open Questions

<!-- OPEN QUESTION: exact status-effect roster needed for MVP 1 beyond Block (if any) — needs a decision before/during MVP 1 build. -->
<!-- OPEN QUESTION: MVP 1 enemy's move pattern, HP, and damage numbers — not yet specified. A simple fixed or lightly-repeating pattern is enough to test telegraphing; exact numbers TBD. -->
<!-- OPEN QUESTION: MVP 1 starter card count/list — exact cards TBD (hero design is the user's). Needs enough variety to exercise the draw/play/discard loop meaningfully, likely fewer than the eventual full ~20-25 card target. -->
<!-- OPEN QUESTION: non-combat event design (narrative-choice style like StS, or simpler?) — deferred to MVP 2 planning. -->
<!-- OPEN QUESTION: card rarity tiers and reward odds — deferred to MVP 2 planning. -->
<!-- OPEN QUESTION: shop contents and the gold-value tuning for the card-vs-gold reward choice — deferred to MVP 2 planning; must avoid gold becoming a strictly dominant or strictly inferior choice. -->
<!-- OPEN QUESTION: combat math (HP/damage scale, target turns per fight) — deferred. -->
<!-- OPEN QUESTION (future, raised 2026-10-08): creature-specific loot tables that bias starter/reward sampling toward an archetype based on which enemies were fought. Not scheduled; noted so it isn't lost. -->

## MVP 1 Build Order

1. Scaffold TS + Phaser project (Vite + Phaser template), basic repo structure (`src/game` for logic, `src/scenes` for Phaser rendering, `src/data` for card/status definitions).
2. Static scene: render enemy area, player area, hand area using placeholder shapes — no logic yet, just layout.
3. Data model: `Card`, `Deck/Hand/DiscardPile`, `Player`, `Enemy`, `GameState`, as plain TypeScript, decoupled from Phaser.
4. Draw/discard/shuffle logic per the decided model.
5. Energy system and card-playing (cost check, effect resolution, targeting).
6. Single enemy: intent telegraph + simple move pattern.
7. Turn loop: player turn → enemy turn → win/loss check.
8. Win/loss screen (placeholder).
9. Manual playtest pass in-browser; iterate on feel before moving to MVP 2.
