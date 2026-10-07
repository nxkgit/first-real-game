# Docs index

One line per document and when to read it. The root documents (`CLAUDE.md`, `HANDOFF.md`, `implementationplan.md`, `DESIGN_LOG.md`) are not repeated here: `CLAUDE.md` first, then `HANDOFF.md`, then the plan and the log.

Written 2026-10-07. Documents from sessions that were still in flight are listed under "Expected" with the name they are planned to have; check that the file exists before relying on the row, and add real rows as they land.

## Guides (read when you do the thing)

| Document | One line | Read it when |
|---|---|---|
| [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md) | How to define cards, enemies, relics, events and statuses; every effect kind, scaling source, trigger event and field; where each number lives; the add-a-card checklist; common mistakes. A test keeps its lists in step with the code. | You are authoring or changing content. |
| [`BALANCE.md`](BALANCE.md) | The simulation method: paired fights, confidence intervals, bot skill levels, metrics, the provisional target bands, and the card/enemy workflows. | You changed a number, added a card or enemy, or are reading a balance report. |
| [`SYNERGY_ENGINE.md`](SYNERGY_ENGINE.md) | The mechanics behind card interactions: scaling, triggers, tags, exhaust, Empowered, play order and recursion limits. | You write a card with scaling or triggers, or need to know what resolves in which order. |
| [`design/EVIDENCE.md`](design/EVIDENCE.md) | Decision menu and one evidence section per open design decision (shop and gold, relics, events, map shape, rests and upgrades, difficulty curve, deck size), each with the question, what the simulator measured (with the command to reproduce it), the knobs, what it cannot tell you, and the mechanical consequences of each choice. | You are about to decide shop prices, relics, events, the map, upgrades or difficulty. |
| [`AUTOMATION.md`](AUTOMATION.md) | Rules for unattended sessions: branch naming, no questions, placeholders, scope, reports, merging. | You are briefing or running an unattended session. |

## Tools (commands you will use)

| Command | What it does | Details |
|---|---|---|
| `npm run content:check` | Validates all content; each problem comes with the fix (`--info` adds notes, `--strict` fails on warnings). | `CONTENT_GUIDE.md` |
| `content.html` (`npm run dev`, `/content.html`) | Content browser: search, sort, filter, card upgrade side by side, simulation stats, Markdown/CSV copy. | `CONTENT_GUIDE.md` |
| `npm run balance`, `balance:report`, `balance:check`, `balance:baseline` | Simulation experiments and baselines (`balance/`). | `BALANCE.md` |
| `npm run balance -- <gold, rests, events, relics, maps, paths, pressure, picks, decksize, upgrades, synergy, runs>`, `npm run balance:evidence` | Design-evidence experiments: whole acts with shop price, removal, gold, rest and map-shape parameters changed in memory. Reports in `balance/reports/design-evidence/`. | `BALANCE.md` ("Design-evidence commands"), `design/EVIDENCE.md` |
| `npm run verify` | Typecheck, all tests, build. Must pass before anything merges. | `AUTOMATION.md` |

## Audits and reports (read for background, not to do work)

| Document | One line | Read it when |
|---|---|---|
| [`audits/2026-10-code-audit.md`](audits/2026-10-code-audit.md) | A read-only audit of `src/`: findings ranked by severity, each marked confirmed by execution or by reading only, plus things checked and not substantiated. | Before refactoring, or when a bug looks familiar. |
| `progress-<topic>.md` (`progress-synergy-engine.md`, `progress-balance-process.md`, `progress-coverage-tests.md`, `progress-invariant-tests.md`, `progress-content-tools.md`, `progress-design-evidence.md`) | Each unattended session's report: what it built, how it was verified, decisions it made, follow-ups. | You want the reasoning or the open follow-ups of one piece of work. They describe a moment; the code and the guides above win when they disagree. |

## Expected (planned by other sessions; verify the file exists)

| Document | One line | Read it when |
|---|---|---|
| E2E test guide (from the end-to-end test session) | How the browser-level tests are run and what they cover. | You change scenes, or CI shows an end-to-end failure. |
| Balance findings (from the balance analysis session) | What the simulator found about the placeholder content and which numbers it suggests looking at. | Before you replace placeholder numbers with real ones: it is evidence, not a decision. |
| Effect registry notes (from the effect refactor session) | How effect kinds are registered once the refactor lands. | You add a new kind of effect. The effect table in `CONTENT_GUIDE.md` and `src/content/vocabulary.ts` will need the new kind too (the guide test tells you). |
