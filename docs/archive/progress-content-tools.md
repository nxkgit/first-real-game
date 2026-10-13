# Content tools (auto/content-tools): progress and PR report

Status: DONE (all four deliverables). No `gh` in the session, so no PR: this file is the PR description. Branch `auto/content-tools` is pushed.

Type-checked and unit-tested only. **The content browser was never viewed in a browser** (built with `vite build`, logic unit-tested in `browse.test.ts`; the DOM drawing in `contentPage.ts` is untested). Nothing in the game was touched, so nothing needs playing.

## What was built
1. **`docs/CONTENT_GUIDE.md`**: author-facing guide (where things live, every card field / effect kind / scaling source / trigger event / status / enemy / relic / event field, worked placeholder examples, add-a-card checklist, common mistakes, which numbers are tunables vs data). `src/content/guide.test.ts` reads `src/game/types.ts` as text and fails if the guide's marked `names:` lists (effect kinds, scale sources, trigger events, status ids, card types, run effects, event outcomes, and the field lists of cards, upgrades, scaling, triggers, enemies, moves, relics, events, choices, statuses) differ from the code, or if the vocabulary tables differ. Verified it fails when a row is deleted.
2. **`npm run content:check`** (`src/content/checkCli.ts`, `validate.ts`, `world.ts`, `vocabulary.ts`): loads all registries, prints errors / warnings / notes each with a "Fix:" line. `--info` lists notes, `--strict` also fails on warnings; exit code 1 on errors. Checks: unknown status/enemy/card/event ids, unregistered cards, missing/no-op/weaker/dearer upgrades, empty card/relic/event/status text, power with nothing to do, triggers with no effects / unknown events / stray filters / unknown tags / on non-powers, scaling on non-scalable effects, scaling errors, aimed effects without `target: 'enemy'`, unplayable costs, enemy moves with ignored effects or no intent icon, one-shot hits, unreachable cards, relics outside the pool, enemies/events outside the act, duplicate names, shared badges, hand-written text, and typo-catcher extremes vs the cohort median. Real content currently: 0 errors, 0 warnings (only notes about the engine test cards). 23 tests in `validate.test.ts` (clean fixture world, then one deliberately broken thing per check).
3. **Content browser** (`contentPage.ts`, `browse.ts`, `content.html`): search box and click-to-sort headers on every table; card filters (type, cost, owner, tag, in reward pool); new Scaling column (trigger text was already there); click a card for base vs upgraded side by side (changed lines highlighted), its content-check findings, and a **simulation stats panel** (win rate / HP lost / turns change with 95% intervals and verdict, synergy partners and overlaps) read from `balance/reports/sample.json`, falling back to `balance/baselines/baseline.json` (interval rebuilt from mean/sd/n, no verdict), and a friendly message when neither exists. New "Content check" table. Copy as Markdown/CSV copies the rows as currently filtered and sorted, via the unmodified `toMarkdown`/`toCsv`.
4. **`docs/README.md`**: index of every document with when to read it.

## Verification
- `tsc`, `vite build` clean; `npm run content:check` runs (exit 0).
- New tests: 59 (validate 23, browse 14, guide 22; plus the 2 existing tableExport tests). Full `npm run verify`: everything passes **except** `src/game/save.invariants.test.ts > never throws on mutated genuine saves`, which times out at the 5 s default (7.3 s on this machine, also when run alone). It is outside my files, does not touch content, and looks like a slow-machine timeout in an invariant test (a parallel session owns save code); not weakened or edited.

## Decisions I made
- **Baseline vs report priority:** the report wins; the baseline fills only cards the report lacks. A baseline interval is a normal approximation (mean +- 1.96 sd/sqrt(n)) and is shown without a verdict. Reverse by swapping the order in `parseSimStats`.
- **Sim data is bundled at build time** with lazy `import.meta.glob` of the two JSON files (about 170 KB + 40 KB as separate chunks, loaded only by `content.html`). If the files do not exist at build, the page degrades gracefully. Alternative (fetch at runtime) would fail on the deployed site because `balance/` is not served.
- **Severities:** error = broken or inert (CLI fails), warning = probably a mistake, info = often intended. Engine test cards/relics (`synergyCards.ts`, `SYNERGY_RELICS`) get notes instead of "unreachable" warnings. Zero-value effects, hand-written text, no `upgrade` block and fractional values are warnings.
- **"Extreme" thresholds:** damage or block per energy more than 3x or under 1/3 of the median card's (cohort of at least 4); enemy HP > 4.5x or < 1/6 of the median; an enemy's biggest hit > 3x the median enemy's biggest hit; a single move dealing at least the player's max HP. Constants `EXTREME_HIGH`, `EXTREME_LOW`, `MIN_COHORT` at the top of `validate.ts`. They only catch typos; they are not balance statements.
- **Vocabulary as compile-time tables** (`vocabulary.ts`, `Record<UnionType, ...>`): adding an effect kind / status / trigger event / scale source now fails `tsc` until the table (and then the guide, via the test) is updated.
- **Guide test parses `types.ts` as text** (regex over the interface bodies) rather than adding runtime lists to game code, since I may not touch `src/game`. It normalises CRLF. If `types.ts` is restructured heavily the extractor may need adjusting; the error says which type it could not read.
- **Events table** in the browser now repeats the event title on every choice row (was only on the first), so search and sort keep rows meaningful.
- The CLI is built with Vite SSR into `.sim/content` like the balance CLI (no new dependency).

## Follow-ups (not done, out of scope)
- If the effect-registry refactor changes how effects are declared, `validate.ts` (reads `EFFECT_KINDS` in `vocabulary.ts` for what scales / what enemies can do) should read that registry instead; `vocabulary.ts` is the one place to change.
- The check cannot verify things the engine decides at runtime (for example that a given enemy move text reads well); it only checks data shape and reachability.
- Rarity, shop contents and relic sources are undecided in the plan, so reachability treats "reward pool + starter + event cards" and "RELIC_POOL" as the only ways to obtain content; revisit when the shop or relic sources gain content rules.
- `HANDOFF.md` should mention `npm run content:check`, `docs/CONTENT_GUIDE.md` and `docs/README.md` (not edited, per the brief).
- The slow `save.invariants.test.ts` case (see Verification) should get a longer timeout or a smaller sample.

## What a human should try first
1. `npm run dev`, open `/content.html`: check the cards table renders, sorting by clicking headers (try Cost and Name, click twice), the filters, search, and that clicking a card opens the panel with base vs upgrade side by side and the simulation stats (they come from `balance/reports/sample.json`; regenerate with `npm run balance:report`, then restart the dev server).
2. Copy as Markdown on a filtered, sorted cards table and paste it somewhere: it should be exactly the rows shown.
3. Break something on purpose (an unknown status id on a card, scaling on `exhaustRandom`) and run `npm run content:check`.
4. Read `docs/CONTENT_GUIDE.md` as the person who will write the content: is anything missing or unclear?
