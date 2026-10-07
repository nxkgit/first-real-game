# Docs index

One line per document and when to read it. The root documents (`CLAUDE.md`, `HANDOFF.md`, `implementationplan.md`, `DESIGN_LOG.md`) are not repeated here: `CLAUDE.md` first, then `HANDOFF.md`, then the plan and the log.

Written 2026-10-07; index brought up to date the same day after the art pass, map variety work and test layers. Rows for documents that were still being written on another branch say so: check that the file exists before relying on them.

## Guides (read when you do the thing)

| Document | One line | Read it when |
|---|---|---|
| [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md) | How to define cards, enemies, relics, events and statuses; every effect kind, scaling source, trigger event and field; where each number lives; the add-a-card checklist; common mistakes. A test keeps its lists in step with the code. | You are authoring or changing content. |
| [`BALANCE.md`](BALANCE.md) | The simulation method: paired fights, confidence intervals, bot skill levels, metrics, the provisional target bands, and the card/enemy workflows. | You changed a number, added a card or enemy, or are reading a balance report. |
| [`SYNERGY_ENGINE.md`](SYNERGY_ENGINE.md) | The mechanics behind card interactions: scaling, triggers, tags, exhaust, Empowered, play order and recursion limits. | You write a card with scaling or triggers, or need to know what resolves in which order. |
| [`design/EVIDENCE.md`](design/EVIDENCE.md) | Decision menu and one evidence section per open design decision (shop and gold, relics, events, map shape, rests and upgrades, difficulty curve, deck size), each with the question, what the simulator measured (with the command to reproduce it), the knobs, what it cannot tell you, and the mechanical consequences of each choice. | You are about to decide shop prices, relics, events, the map, upgrades or difficulty. |
| [`ART.md`](ART.md) | The art pipeline: raw packs in the ignored `assets/` folder, `tools/prepareAssets.py` to `public/assets/`, the pairings in `src/data/art.ts`, how pictures are drawn and fall back, how to swap one, and the licence and credit rules. | You change or add pictures, or a picture is missing on screen. |
| [`EFFECTS.md`](EFFECTS.md) | The effect registry: one entry per effect kind (resolve, enemy resolve, text, intent, scaling) and how to add a kind. | You add a new kind of effect. The effect table in `CONTENT_GUIDE.md` and `src/content/vocabulary.ts` need the new kind too (the guide test tells you). |
| [`E2E.md`](E2E.md) | The browser tests: the `?e2e` hook and frame stepper, the harness helpers, how to add a test, and CI (a fast subset on pull requests, the whole suite nightly). | You change scenes or the map, or CI shows an end-to-end failure. |
| [`SCENARIOS.md`](SCENARIOS.md) | Saving a fight state and loading it back: capture, load, tests. | You want to reproduce an exact fight situation. |
| [`AUTOMATION.md`](AUTOMATION.md) | Rules for unattended sessions: branch naming, no questions, placeholders, scope, reports, merging. | You are briefing or running an unattended session. |

## Tools (commands you will use)

| Command | What it does | Details |
|---|---|---|
| `npm run content:check` | Validates all content; each problem comes with the fix (`--info` adds notes, `--strict` fails on warnings). | `CONTENT_GUIDE.md` |
| `content.html` (`npm run dev`, `/content.html`) | Content browser: search, sort, filter, card upgrade side by side, simulation stats, Markdown/CSV copy. | `CONTENT_GUIDE.md` |
| `npm run balance`, `balance:report`, `balance:check`, `balance:baseline` | Simulation experiments and baselines (`balance/`). | `BALANCE.md` |
| `npm run balance -- <gold, rests, events, relics, maps, paths, pressure, picks, decksize, upgrades, synergy, runs>`, `npm run balance:evidence` | Design-evidence experiments: whole acts with shop price, removal, gold, rest and map-shape parameters changed in memory. Reports in `balance/reports/design-evidence/`. | `BALANCE.md` ("Design-evidence commands"), `design/EVIDENCE.md` |
| `npm run verify` | Typecheck, all tests, build. Must pass before anything merges. | `AUTOMATION.md` |
| `npm run e2e` (once: `npm run e2e:install`) | Browser tests that play the real game (about 5 minutes). Pull-request CI runs everything except the whole-act test; the nightly run has all of it. | `E2E.md` |
| `python tools/prepareAssets.py` | Rebuilds `public/assets/` from the raw packs in `assets/` (needs Pillow). | `ART.md` |

## Audits and reports (read for background, not to do work)

| Document | One line | Read it when |
|---|---|---|
| [`balance/synergy-findings-2026-10.md`](balance/synergy-findings-2026-10.md) | What the simulator found about the placeholder synergy content and which numbers it suggests looking at; only the Tag A Echo fix was applied. Placeholder numbers, evidence not a decision. | Before you replace placeholder numbers with real ones. |
| [`audits/2026-10-code-audit.md`](audits/2026-10-code-audit.md) | A read-only audit of `src/`: findings ranked by severity, each marked confirmed by execution or by reading only, plus things checked and not substantiated. | Before refactoring, or when a bug looks familiar. |
| `progress-<topic>.md` (`progress-synergy-engine.md`, `progress-balance-process.md`, `progress-balance-synergy.md`, `progress-coverage-tests.md`, `progress-invariant-tests.md`, `progress-content-tools.md`, `progress-design-evidence.md`, `progress-e2e-smoke.md`, `progress-effect-registry.md`, `progress-audit-fixes.md`) | Each unattended session's report: what it built, how it was verified, decisions it made, follow-ups. | You want the reasoning or the open follow-ups of one piece of work. They describe a moment; the code and the guides above win when they disagree. |
