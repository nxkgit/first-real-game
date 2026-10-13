# Docs index

One line per document and when to read it. The root documents (`CLAUDE.md`, `HANDOFF.md`, `implementationplan.md`, `DESIGN_LOG.md`, `REFLECTION_LOG.md`) are not repeated here: `CLAUDE.md` first, then `HANDOFF.md`, then the plan and the log.

Written 2026-10-07; index brought up to date the same day after the art pass, map variety work and test layers. Rows for documents that were still being written on another branch say so: check that the file exists before relying on them.

## Guides (read when you do the thing)

| Document | One line | Read it when |
|---|---|---|
| [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md) | How to define cards, enemies, relics, events and statuses; every effect kind, scaling source, trigger event and field; where each number lives; the add-a-card checklist; common mistakes. A test keeps its lists in step with the code. | You are authoring or changing content. |
| [`BALANCE.md`](BALANCE.md) | The simulation method: paired fights, confidence intervals, bot skill levels, metrics, the provisional target bands, and the card/enemy workflows. | You changed a number, added a card or enemy, or are reading a balance report. |
| [`SYNERGY_ENGINE.md`](SYNERGY_ENGINE.md) | The mechanics behind card interactions: scaling, triggers, tags, exhaust, Empowered, play order and recursion limits. | You write a card with scaling or triggers, or need to know what resolves in which order. |
| [`design/EVIDENCE.md`](design/EVIDENCE.md) | Decision menu and one evidence section per open design decision (shop and gold, relics, events, map shape, rests and upgrades, difficulty curve, deck size), each with the question, what the simulator measured (with the command to reproduce it), the knobs, what it cannot tell you, and the mechanical consequences of each choice. | You are about to decide shop prices, relics, events, the map, upgrades or difficulty. |
| [`ART.md`](ART.md) | The art pipeline: raw packs in the ignored `assets/` folder, `tools/prepareAssets.py` to `public/assets/`, the pairings in `src/data/art.ts`, how pictures are drawn and fall back, how to swap one, and the licence and credit rules. | You change or add pictures, or a picture is missing on screen. |
| [`DB.md`](DB.md) | The local Postgres cards table (Docker): where card designs are written down for Claude to build from; what is in git and what is not, how to run it on a second machine, the columns, the commands. | You add or read a card design in the database, or set it up on a new machine. |
| [`CARD_WORKFLOW.md`](CARD_WORKFLOW.md) | **Draft.** The process for turning a card you design into a tested card: hand-off template, engine check, testing tiers, wrap-up. | You hand Claude a card to implement. |
| [`EFFECTS.md`](EFFECTS.md) | The effect registry: one entry per effect kind (resolve, enemy resolve, text, intent, scaling) and how to add a kind. | You add a new kind of effect. The effect table in `CONTENT_GUIDE.md` and `src/content/vocabulary.ts` need the new kind too (the guide test tells you). |
| [`E2E.md`](E2E.md) | The browser tests: the `?e2e` hook and frame stepper, the harness helpers, how to add a test, and CI (a fast subset on pull requests, the whole suite nightly). | You change scenes or the map, or CI shows an end-to-end failure. |
| [`SCENARIOS.md`](SCENARIOS.md) | Saving a fight state and loading it back: capture, load, tests. | You want to reproduce an exact fight situation. |
| [`QA_FIX_WORKFLOW.md`](QA_FIX_WORKFLOW.md) | The procedure for fixing a list of tester-reported bugs (reproduce, fix, regression test, one branch and draft PR per bug, a patch-notes entry per batch) and how the maintainer loads a report's snapshot. The reasoning is in `../QA_PLAN.md`. | The maintainer hands you bug reports to fix, or wants to look at one. |
| [`REFLECTING_MODE.md`](REFLECTING_MODE.md) | The procedure for reflecting mode: how it starts and ends, the files it may edit, the evidence and audit rules for new guidance, the no-loss check for restructuring, and how entries in `../REFLECTION_LOG.md` are written. | The maintainer says "reflecting mode", or asks to change `CLAUDE.md`, memory, skills or subagents. |

## Tools (commands you will use)

| Command | What it does | Details |
|---|---|---|
| `npm run content:check` | Validates all content; each problem comes with the fix (`--info` adds notes, `--strict` fails on warnings). | `CONTENT_GUIDE.md` |
| `content.html` (`npm run dev`, `/content.html`) | Content browser: search, sort, filter, card upgrade side by side, simulation stats, Markdown/CSV copy. | `CONTENT_GUIDE.md` |
| `npm run balance`, `balance:report`, `balance:check`, `balance:baseline` | Simulation experiments and baselines (`balance/`). | `BALANCE.md` |
| `npm run balance -- <gold, rests, events, relics, maps, paths, pressure, picks, decksize, upgrades, synergy, runs>`, `npm run balance:evidence` | Design-evidence experiments: whole acts with shop price, removal, gold, rest and map-shape parameters changed in memory. Reports in `balance/reports/design-evidence/`. | `BALANCE.md` ("Design-evidence commands"), `design/EVIDENCE.md` |
| `npm run patchnotes:sync` (`patchnotes:check`) | Copies the newest `PATCHNOTES.md` entry into the README's "Latest changes" block (GitHub's front page). `--check` only reports. A test fails if the README is behind. The content site's Patch notes section needs no command. | `QA_FIX_WORKFLOW.md` |
| `npm run db:up`, `db:psql`, `db:status`, `db:export`, `db:seed`, `db:down` | The local cards database (needs Docker Desktop running and a password in `.env`). | `DB.md` |
| `npm run verify` | Typecheck, all tests, build. Must pass before anything merges. | `CLAUDE.md` (Git and pull requests) |
| `npm run e2e` (once: `npm run e2e:install`) | Browser tests that play the real game (about 5 minutes). Pull-request CI runs everything except the whole-act test; the nightly run has all of it. | `E2E.md` |
| `python tools/prepareAssets.py` | Rebuilds `public/assets/` from the raw packs in `assets/` (needs Pillow). | `ART.md` |

## Audits and reports (read for background, not to do work)

| Document | One line | Read it when |
|---|---|---|
| [`balance/synergy-findings-2026-10.md`](balance/synergy-findings-2026-10.md) | What the simulator found about the placeholder synergy content and which numbers it suggests looking at; only the Tag A Echo fix was applied. Placeholder numbers, evidence not a decision. | Before you replace placeholder numbers with real ones. |
| [`audits/2026-10-code-audit.md`](audits/2026-10-code-audit.md) | A read-only audit of `src/`: findings ranked by severity, each marked confirmed by execution or by reading only, plus things checked and not substantiated. | Before refactoring, or when a bug looks familiar. |
| [`audits/2026-10-13-merge-conflict-incidents.md`](audits/2026-10-13-merge-conflict-incidents.md) | What went wrong with merge conflicts, a dropped change and a stacked PR that never reached `main` (2026-10-13): timeline, shared causes, what was already fixed, and the options for preventing it. Input for a reflecting-mode session; changes no rule itself. | You are deciding how to avoid merge conflicts and lost changes. |
| [`audits/2026-10-structure-audit.md`](audits/2026-10-structure-audit.md) | A read-only audit of the whole repository's structure, architecture and data model against clean-code principles and a relational view of the data, with findings, strengths, a proposed by-hero layout and the plan for the restructuring PR. Scripts: `tools/audit/`. | Before the restructure, or to learn the principles with examples from this code. |
| [`archive/progress-<topic>.md`](archive/) (12 files, e.g. `progress-synergy-engine.md`, `progress-effect-registry.md`, `progress-scenarios.md`) | Each unattended session's report (that workflow was retired 2026-10-13; `archive/AUTOMATION.md` is kept as history): what it built, how it was verified, decisions it made, follow-ups. Archived 2026-10-13 out of `docs/` so the folder shows only living guides. | You want the reasoning or the open follow-ups of one piece of work. They describe a moment; the code and the guides above win when they disagree. |
