# Card workflow

How a card you design becomes a tested card in the game. Rewritten 2026-10-13 around the cards table (`DB.md`) and **card build mode**.

**What is built and what is planned.** Parts marked *(planned)* do not exist yet and arrive in the next two steps; this document describes the process they make possible. Until then, card build mode is not usable.

| Piece | State |
|---|---|
| The `cards` table, `db:*` commands, seed file | built (`DB.md`) |
| `status` column with `draft / ready / built / blocked` | *(planned)* next step |
| `db:backfill` (fill the table from the existing cards) and `db:compare` (table versus built cards, plus the patch-notes card table) | *(planned)* next step |
| Loading the 81 existing cards into the table | *(planned)* the step after |
| The phrase "card build mode" as a mode in `CLAUDE.md` | *(planned)* a reflecting-mode session, after the above |

The *what* (fields, effects, scaling, triggers, statuses) is in `CONTENT_GUIDE.md`; this file is the *how we work*.

## The idea

You write card designs as rows in the cards table. When you say **"card build mode"**, Claude builds every row marked `ready` into TypeScript, proves it works, marks the row `built`, and opens a draft PR. **The TypeScript is the source of truth for the game** (the browser loads it); the table is the input and the record of what you asked for.

## Who does what

- **You decide** the name, cost, numbers, what the card does, what it is for, and when a row is final (`ready`). Names, flavour and art are yours (`CLAUDE.md`, "Creative boundary"); flavour and art are not part of this process yet.
- **Claude** translates `ready` rows into `CardDefinition`s, registers and tests them, reports what was and was not verified, and sets only the `status` column (`built` or `blocked`). It never edits your other columns.
- **Claude never invents** a name, a number, a rule or an effect. A row that leaves something out is skipped and reported (see "Skipped rows").

## Writing a row

See `DB.md` for the columns. The ones you always fill in: `name`, `type`, `cost`, `owner`, `effects_words`, `upgrade_words`, and `status`. Everything else has a default (not in a pool, no keywords, no tags, energy cost, plays on click).

- `effects_words`: what the card does, **in order, with the numbers**, in plain words. Example: "Enter Tortoise form. Gain 8 block. If already in Tortoise form, gain 10 block instead."
- `upgrade_words`: what the upgrade changes. Write `none` for no upgrade. A cost-only upgrade says so ("costs 0 instead of 1").
- `target`: `enemy` if you aim it at one enemy; leave empty for cards that play on click or hit every enemy ("all enemies" in your words is enough).
- `notes`: edge cases you care about ("a second attack in the same turn counts the first").
- `slug` is created from the name when you insert the row and never changes (it is the game's id).

### Status

| Status | Meaning | Who sets it |
|---|---|---|
| `draft` | still being designed; Claude ignores it | you |
| `ready` | final: build it | you |
| `built` | the TypeScript card exists and matches the row | Claude, after the build passes |
| `blocked` | Claude could not build it; the run report says why | Claude |

To change an existing card, edit its row (name, numbers, words) and set it back to `ready`. To retry a `blocked` row after fixing the cause, set it back to `ready`.

## Card build mode *(planned trigger)*

Runs like QA mode: **autonomous, no questions mid-run.** Anything unclear is skipped, marked `blocked`, and listed at the end.

1. Fetch and branch from `origin/main` (`cards/<date>`). Read the table (`npm run db:status`, then the `ready` rows). If the database is not running, say so and stop (Claude cannot start Docker Desktop; you run `npm run db:up`).
2. No `ready` rows: report that and stop.
3. For each row, check it can be built (see "Skipped rows"). Build what can be built.
4. Write or update the card (next section), add it to a deck preset, and test it (tiers below).
5. Run `npm run verify`. A row whose card passes is set to `built`; one that does not stays `ready` and is reported.
6. Export the seed (`npm run db:export`), commit, push, and open a draft PR with the report. You merge.

### Skipped rows (set to `blocked`, listed in the report)

- **No precedent.** The card needs a mechanic the game does not have (an effect kind, scaling source, trigger, status or keyword that does not exist). It is **not implemented**; the report says the row contains a card with no precedent. Settle the mechanic in planning mode first (as with Temperature, Freeze, Heating Up and forms), then set the row back to `ready`. No near-match in the card data, no hand-written `description`.
- **The owner has no hero.** The row's `owner` is not `neutral` and not a hero that exists (`mage`, `paladin`, `druid`). Adding a hero is its own piece of work. Keep cards for a future hero as `draft` until the hero exists.
- **Missing or contradictory information.** A number, cost, type or rule the words do not settle, or words that disagree with the other columns. The report lists the question for each.

## Writing the card

1. Put it in the owner's file: a hero's cards in `src/data/heroes/<hero>/cards.ts` (add to that hero's array, e.g. `MAGE_CARDS`), designed neutral cards in `src/data/neutral/basics.ts` (`BASIC_CARDS`). `neutral/synergy.ts` and `neutral/keyword.ts` hold engine test cards, not designs. The card's `id` is the row's `slug` and never changes afterwards.
2. Never write `description`; text is generated.
3. Give it an `upgrade` block (it replaces the **whole** effect list: repeat unchanged effects). A cost-only upgrade changes only `cost`.
4. Mark any value you were not given with a comment `// PLACEHOLDER: not specified`. (In card build mode a missing value is a skipped row, so this is for cases the row left open on purpose.)
5. Pools: set `inRewardPool` and `inStarterPool` from the row. Check the pool counts a test pins (`synergy.test.ts` keeps a `REMOVED_FROM_POOL` list for cards deliberately out of the pool).
6. Presets (`CLAUDE.md`, "Dev-panel presets"): add the card to a deck preset in `src/dev/deckPresets.ts` that exercises it.
7. A rename: only the card's `name` changes in TypeScript; the id never does.

## Testing, in tiers

Every card gets **Tier 1**. A card also gets **Tier 2** if it has any of: scaling, triggers, a status, randomness, a hero's own resource or mechanic (Temperature, Freeze, Radiant Light, forms), a keyword, or an effect that depends on turn order.

**Tier 1 (all cards):**
- `npm run content:check`: no errors, and read each warning about the new card.
- Read the generated text of the base and upgraded card (`content.html`, or the summary table from `db:compare` *(planned)*). Is the sentence what the row says?
- `npm run verify`.
- A simple card (a plain number of damage or block) needs no test of its own: the smoke fight that plays every card in the registry and the fuzz tests already cover it.

**Tier 2 (cards with moving parts), in addition:**
- Unit tests for the interactions it claims (the exact sequence; a threshold crossing; a trigger firing once) using the `fight(deck)` pattern in `src/game/synergy.test.ts`; assert the numbers on the base and the `+` version, including the cost.
- **Played in a real browser** through a scenario (`SCENARIOS.md`: hand-write the hand, piles, statuses and resource, load it from the `?dev` panel) or an e2e test (`e2e/synergy.e2e.ts` is the pattern). Check the live number on the card face, the readouts and the log.
- A scenario is committed to `scenarios/` **only when you ask**. Otherwise the browser check is described in the PR.

The report always says which tier ran and separates **played in a browser** from **only unit-tested** (`CLAUDE.md`, "Testing discipline").

## The report and the PR

The draft PR description holds:
- **What was built:** each card, with its tier.
- **What was skipped, and why** (`blocked` rows, with the question or the missing mechanic or hero).
- **Checked:** what was played in a browser and what was only tested.
- **A `## Patch notes` section** (the rule in `CLAUDE.md`, "Patch notes") with a **card table showing only what a player sees**, from `db:compare --table` *(planned)*:

| Card | Hero | Type | Cost | Effect | Upgraded | Keywords |
|---|---|---|---|---|---|---|
| Tortoise Form | Keeper of the Wild | Skill | 1 | (the generated card text) | (the generated upgraded text) | |

The PR does not edit `PATCHNOTES.md` or the root `README.md`. It does include the exported seed (`db/seed/cards.csv`): the seed is exported only in card-build PRs and when you ask, so two PRs rarely touch it.

## Changing an existing card

Preferred: edit the row's columns (and words) and set it back to `ready`; card build mode applies it. You may also edit the TypeScript directly; then `npm run db:compare` *(planned)* shows the difference between the table and the code, and the row is corrected afterwards. Either way:

1. Check the `upgrade` block: it replaces the whole list, so it may restate the number you changed.
2. Expect some tests to need a deliberate refresh, not a bug fix: golden hashes (`effects.golden.test.ts`), e2e tests with hardcoded numbers, unit tests that pin that card's values, and the balance baseline (`npm run balance:baseline`).

## Not covered yet

- **Flavour text and card art** (yours; no columns, no steps). A card without art shows the default picture; your own art goes in `public/assets/cards/<card-id>.png` (2:1, 320x160) with its id added to `CARD_ART_IDS`; the rules are in `ART.md`, "Card pictures".
- **New heroes** (stats, power, art, the select screen, the registry).
- **Structured effect columns**, and a generator from the table to TypeScript (`DB.md`, "Later"). Today the table holds words and Claude does the translation.
