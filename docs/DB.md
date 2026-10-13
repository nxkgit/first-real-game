# The cards database

A local Postgres table where card designs are written down before they are built. Added 2026-10-13. It is the **input** side of the card workflow: you write cards here, Claude reads the rows and builds the TypeScript cards from them. It is **not** wired into the game: the browser loads TypeScript (`src/data/`), and that stays the source of truth. A card exists in the game only when it exists there.

## What lives where

| | Where | In git? |
|---|---|---|
| The table definition | `db/init/01-cards.sql` | yes |
| The Docker service | `docker-compose.yml` (`db`, behind a profile so `docker compose up` for the game never starts it) | yes |
| The card rows (a snapshot) | `db/seed/cards.csv` | yes, once exported |
| The password | `.env` (copy of `.env.example`) | **no**, git ignores it |
| The live data | a Docker volume on **this** machine | **no** |

Git carries the recipe and the snapshot, not the running database. To move between machines: **export, commit, push, then pull and reload** on the other one.

## First time on a machine

1. Start Docker Desktop.
2. Copy `.env.example` to `.env` and put a password after `POSTGRES_PASSWORD=` (stays on this machine; never paste it into chat).
3. `npm run db:up` (creates the table the first time).
4. If a `db/seed/cards.csv` exists: `npm run db:seed` loads it.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run db:up` / `db:down` | Start / stop the database (the data stays in the volume). |
| `npm run db:psql` | A SQL prompt. One-off query: `npm run db:psql -- -c "SELECT name, cost FROM cards"`. |
| `npm run db:status` | Whether it is running, and how many rows. |
| `npm run db:export` | Write every row to `db/seed/cards.csv` (sorted by slug, so it diffs cleanly). |
| `npm run db:seed` | Replace the table's rows with `db/seed/cards.csv`. Refuses if the table already has rows unless you add `-- --replace` (anything not exported is lost). |

You can also connect any SQL client (DBeaver, pgAdmin, TablePlus) to host `127.0.0.1`, port `5433` (or `POSTGRES_PORT`), with the user, database and password from `.env`.

To wipe the live data and start over: `docker compose down -v` (deletes the volume; export first).

## The table

One row per card. Columns mirror the simple fields of `CardDefinition` (`src/model/card.ts`); `db/schema.test.ts` fails if a new simple field is added there without a column here.

| Column | Meaning |
|---|---|
| `id` | Auto-incrementing key, database only. Query by `name` or `slug`. |
| `slug` | The card's **permanent game id** (`CardDefinition.id`): lowercase words joined by hyphens (`tortoise-form`). Set from the name when the row is created and **never changes**, even if the card is renamed (the database refuses to change it): saves, scenarios and presets store it. |
| `name` | The display name; edit freely. Unique. |
| `type`, `cost`, `cost_resource`, `owner`, `target`, `in_reward_pool`, `in_starter_pool`, `exhaust`, `innate`, `retain`, `ethereal`, `unplayable`, `tags`, `archetype`, `rarity` | The same fields as `CardDefinition`. `owner` is a hero id (`mage`, `paladin`, `druid`) or `neutral`; an empty `cost_resource` means energy; an empty `target` means the card plays on click or hits every enemy. |
| `effects_words` | What the card does, in order, with the numbers, in plain words ("deal 6 damage, then gain 1 Temperature"). Required. |
| `upgrade_words` | What the upgrade changes. Required; write `none` if it has no upgrade. |
| `notes` | Anything unusual: edge cases, doubts. |

Not in the table, and why: the structured `effects`, `onTurnStartEffect`, `triggers` and `upgrade` (they are built into TypeScript from the words), `description` (card text is generated, never written by hand) and `upgradeOf` (set on the generated upgraded card). Structured columns are a later step (see "Later").

Adding a card: `INSERT INTO cards (name, type, cost, owner, effects_words, upgrade_words) VALUES (...)` is enough; the rest has defaults. Postgres rejects a bad type, a negative cost, a malformed slug or owner, or a duplicate name.

## Later

- **Structured effect columns** (the card's effects as data) are the natural next step and would let a generator write the TypeScript from the table (the "intake parser" option in `docs/CARD_WORKFLOW.md`). Not built: the schema work is planned for once there is more experience with Postgres.
- A command that prints the built cards in these same columns, to compare a row with what was built, and a patch-notes card table from it, are the next planned pieces.
