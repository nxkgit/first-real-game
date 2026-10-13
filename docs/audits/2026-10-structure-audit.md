# Structure and clean-code audit (2026-10-13)

A read-only analysis of the whole repository: file structure, architecture, and the data model, judged against clean-code principles and a relational ("database") way of thinking about the game's data. It is written to be **learned from**: every finding names the principle in plain words, shows the evidence from this repo, says why it matters, and proposes a fix. Nothing in the code was changed to write it.

Written for the restructuring PR that follows. Decisions already made with the maintainer: the restructure changes **structure only, never behaviour**; ids stay unchanged (saves store ids); content is organised **by hero** with a folder for classless (`neutral`) cards; the `public/assets/` layout stays; the old `docs/progress-*.md` files get archived. Where `sim/` should end up was left for this report to recommend.

## How to read this

- **Severity** is about how much the problem costs *you*, not how wrong it is in the abstract: **High** (it taxes every change), **Medium** (it will hurt as content grows), **Low** (tidiness, learning value).
- **Principle** lines are the lesson. **Evidence** lines are measured, with numbers. **Fix** lines say what the restructure PR would do, or why it should wait.
- "Strength" sections matter as much as the problems: they are what to keep.
- The numbers come from two small scripts kept in `tools/audit/` (`importGraph.mjs`, `codeShape.mjs`; run them from the repo root with `node tools/audit/importGraph.mjs`). They are rough tools (regex import scanning, a complexity count of branches), good for finding things to look at, not for proving anything alone.

## The repository in numbers

| | |
|---|---|
| Production TypeScript in `src/` | 108 files, about 19,600 lines (15,567 lines of code, 2,280 of comments: 13% comments) |
| Unit test files in `src/` | 52 (the whole game rules folder `src/game/` is 15 production files and **30 test files**) |
| Browser tests (`e2e/`) | 21 test files |
| Lines by folder (production only) | `sim` 5,832 (30%), `game` 4,199, `scenes` 3,840, `data` 2,450, `content` 1,723, `dev` 450, `qa` 463, `audio` 282, loose files in `src/` 342 |
| Type safety | 0 uses of `any`, 0 `@ts-ignore`, 0 TODO/FIXME, 137 `as` casts, 46 non-null `!` |
| Tracked files | 355 (161 in `src/`, 54 in `public/`, 51 in `balance/`, 28 in `docs/`) |

## Strengths (keep these)

1. **The rules layer really is independent of Phaser.** Only `scenes/`, `audio/`, `dev/devPanel.ts`, `display.ts` and `main.ts` import Phaser; nothing in `game/`, `data/`, `content/`, `sim/` or `qa/` does. The import graph confirms the central architecture rule in `CLAUDE.md`. This is what makes the simulator and the fast tests possible.
2. **Content is data, behaviour is in a registry.** Cards, enemies, relics, events and statuses are plain objects; each kind of effect is one entry in `game/effects.ts`. Adding content rarely means touching engine code.
3. **Ids are used as foreign keys consistently.** Saves, scenarios, the art manifest and `card.owner` all refer to things by string id. This is exactly the habit relational design asks for.
4. **Very low "type escape" use.** No `any`, no suppressions, no TODO comments. The code type-checks cleanly under `--strict` (the tsconfig does not say `"strict": true` out loud; it should, so a compiler upgrade can never quietly change it).
5. **Only one runtime import cycle** in 108 files (`scenes/credits.ts` and `scenes/ui.ts`).
6. **Heavy, layered testing**: unit, invariant/fuzz, golden-hash, coverage, and browser tests. This is what makes a restructure safe.
7. **Documentation is unusually thorough**, with a decision log, guides and a how-to per recurring change.

## Part 1: the conceptual data model

Think of the game's data as tables. This is what the code says today, written as a relational model, with the places where the code and the model disagree.

```
                        ┌───────────────┐
                        │     Hero      │ id (PK), name, maxHp, energy, resource, blurb, placeholderColor
                        └──────┬────────┘
              1 ── 1           │            1 ── many                 1 ── many
   ┌───────────────┴──┐   ┌────┴────────────┐              ┌───────────────┴───┐
   │   HeroPower      │   │      Card       │              │  Form (Druid)     │
   │ id, name, cost,  │   │ id (PK), name,  │              │ id (PK), name,    │
   │ effects, owner   │   │ type, cost,     │              │ stats, drawBonus  │
   └──────────────────┘   │ owner (FK→Hero  │              └───────────────────┘
                          │  or 'neutral'), │
                          │ effects[], ...  │ 1 ── 0..1 ──► upgraded Card ("<id>+")
                          └────────┬────────┘
                                   │ many ── many (by effect.cardId, trigger.tag, ...)
        ┌──────────┐      ┌────────┴───────┐       ┌──────────────┐
        │  Enemy   │      │     Status     │       │    Relic     │
        │ id, name,│      │ id, kind, hooks│       │ id, name,    │
        │ hp, moves│      └────────────────┘       │ triggers ... │
        └──────────┘                                └──────────────┘
        Event (id, choices → outcomes)     Art / Credits (attached by string maps, see F9)
```

### What matches the model well
- Every table has a primary key (`id`) and a registry keyed by it (`CARDS`, `ENEMIES`, `RELICS`, `EVENTS`, `STATUSES`, `FORMS`, `HEROES`).
- `Card.owner` is a real foreign key to a hero (or the special value `'neutral'`).
- Upgraded cards are *derived rows*: `getCard('strike+')` is generated from Strike's `upgrade` block, not stored twice. That is a good normalisation.

### Where the code and the model disagree
1. **No single place declares the tables.** The shape of every "table" lives in `game/types.ts` (a 375-line file holding 29 exported types for combat, run, hero, relic and event concerns all together). A relational design has one schema; this has one dumping ground. *(F4)*
2. **A hero is an aggregate scattered across seven files** that are joined only by matching strings: `heroes.ts`, `heroPowers.ts`, `<hero>Cards.ts`, `forms.ts`, `art.ts` (`HERO_ART`), `credits.ts`. In database terms, the child tables have no foreign-key relationship you can follow in code; you have to know to look. *(F1)*
3. **Redundant column:** `HeroPowerDefinition.owner` repeats the hero that already references the power through `hero.heroPower`. Nothing reads `owner` on a hero power. That is denormalisation with no benefit. *(F6)*
4. **Dead columns:** `CardDefinition.archetype` and `rarity` are written by content but read by nothing in the program. *(F6)*
5. **Pool membership stored on the card.** `inRewardPool` and `inStarterPool` are flags on each card. In a relational design, "which cards can be offered where" is a relation (a join table or a query), not two columns on the entity. It works fine at this size; it is worth knowing it is a different shape. *(Low, left alone.)*
6. **Art and credits are side tables with string keys and no integrity check at the type level**: `ENEMY_ART` (enemy id to manifest name), `RELIC_ICON` (relic id to icon), `HERO_ART` (hero id to sheet), and a free-text credits list. Tests catch a missing file, but the compiler cannot catch a misspelled key. *(F9)*
7. **The hero id has no home.** `'mage'` is defined twice (`cards.ts` exports `MAGE`, `mageCards.ts` defines its own private `MAGE`), and three card files carry a comment explaining that they cannot import the id because of a circular import. A primary key that three modules each re-declare is a sign it belongs in its own tiny module. *(F2)*

### The target model (what the restructure would make visible)
- `model/` (the **schema**): one small file per entity (`hero.ts`, `card.ts`, `effect.ts`, `status.ts`, `enemy.ts`, `relic.ts`, `event.ts`, `form.ts`), each a type and nothing else. Depends on nothing.
- `data/` (the **rows**): organised by hero (`data/heroes/mage/`, `paladin/`, `druid/`) with `data/neutral/` for classless cards, plus the shared tables (`enemies`, `relics`, `events`, `statuses`, `tunables`). A hero's folder holds its cards, its power, its forms, and the pairing of its art.
- `game/` (the **rules**): reads the model and the rows; never the other way round.

## Part 2: findings

### F1. Everything about one hero is spread across the repo (cohesion) — High
**Principle:** *Package by feature, not by file type.* Things that change together should live together (high cohesion); things that don't should be apart (low coupling). Adding a hero should be "add a folder", not "edit seven files in four directories".
**Evidence:** The Druid, added this week, touched `heroes.ts`, `heroPowers.ts`, a new `druidCards.ts`, a new `forms.ts`, `cards.ts` (registration), `art.ts` (`HERO_ART`), `credits.ts`, `deckPresets.ts`, `validate.ts` and `vocabulary.ts`. `src/data/` is a flat folder of 22 files where hero content sits among unrelated tables.
**Fix:** hero folders (Part 3). The registry (`HEROES`, `ALL_CARDS`) becomes the single list that imports each hero's folder, so adding a hero means one new folder and one line.

### F2. The hero id has no single home (a circular-import workaround) — Medium
**Principle:** *Don't Repeat Yourself*, and *a name should be defined once and imported*. A workaround that needs an explanatory comment in three places is a design smell.
**Evidence:** `MAGE` defined in `data/cards.ts` and again in `data/mageCards.ts`; `PALADIN` and `DRUID` defined in their card files, then imported by `heroes.ts` and `heroPowers.ts`. Comments in `mageCards.ts`, `paladinCards.ts` and `druidCards.ts` say "not imported from cards.ts (circular import)".
**Fix:** a tiny `data/heroes/ids.ts` (or in `model/`) exporting `HeroId` constants. Every file imports from it; the cycle disappears because it depends on nothing.

### F3. Dependencies run in both directions between `data/` and `game/` (layering) — High
**Principle:** *Dependency direction.* A layered design has arrows that point one way. When `A` imports `B` and `B` imports `A`, neither can be understood, tested or moved alone.
**Evidence:** `game/` imports `data/` in 22 places (the rules read `STATUSES`, `getCard`, `FORMS`, tunables). `data/` imports `game/` in 4 places, **all in `data/run.ts`**, which imports `RunState`, `generateActMap`, `Rng` and the save code. `run.ts` is not data: it is the factory that assembles a run out of content and rules, i.e. a *composition root*. It lives in `data/` only for historical reasons. Separately, `data/` imports the *types* from `game/types.ts`, so even the pure data layer reaches into the rules folder for its schema.
**Fix:** (1) move `data/run.ts` into `game/` (or `app/`): the four runtime back-edges to `game/` vanish and the arrow is one-way (`game` reads `data`). (2) Move the types to `model/` so `data/` and `game/` both depend on the schema and not on each other. Pure move; no behaviour change.
**Not fixed here (a deeper step):** `game/` still imports the concrete `STATUSES` and `getCard` registries instead of being handed them. Passing the content in (dependency injection) would let the rules be tested with any content and is the cleanest long-term answer, but it changes how the engine is constructed, so it is outside a no-behaviour-change PR.

### F4. `game/types.ts` is the schema, but it is a 375-line dumping ground — Medium
**Principle:** *Single responsibility* applied to a module, and *the schema is a first-class thing*. A file should have one reason to change.
**Evidence:** 29 exported types: effects, triggers, statuses, cards, enemies, heroes, hero powers, relics, events, run effects, forms. A change to forms (this week) and a change to events edit the same file.
**Fix:** split into `model/<entity>.ts`, re-exported from `model/index.ts` so imports stay short. Pure move of text; the compiler proves nothing was lost.

### F5. A few very large classes and functions do too many things — High
**Principle:** *Single responsibility; small functions.* A class with 40+ methods is several classes sharing one name; a 200-line function with a complexity score of 100+ cannot be read in one go.
**Evidence:**
- `CombatState` (game/): 755 lines, 43 methods, 25 fields. Responsibilities you can see in its method list: turn flow, damage and block maths, status handling, trigger firing, hero power, three hero-specific mechanics (`adjustTemperature`, `gainRadiantLight`, `enterForm`), snapshots (`exportState`/`applySnapshot`), previews (`previewCardEffect`, `intentDamage`), and a dev cheat (`devKillAllEnemies`).
- `CombatScene` (scenes/): 790 lines, 39 methods. `RunState` (game/): 553 lines, 29 methods (map, rewards, rest, shop, events, drafting, saving).
- Longest functions (lines / branch count): `installDevPanel` 266/46, `smartChoices` 211/145, `generateActMap` 195/79, `playRunEx` 167/49, `runCommandInner` 151/39, `checkCards` 146/91, `readScenario` 129/58, `fuzzFight` 118/58.
**Fix:** **Not in the structure-only PR.** Splitting these changes how code is organised inside files and carries real risk; it is the top candidate for a follow-up with the golden hashes as the safety net. Recommended first cuts: pull snapshots and previews out of `CombatState`; split `RunState` by stop kind (shop, rest, event) into helpers; split `installDevPanel` into one function per panel row.

### F6. Fields that nothing reads, and a redundant link (YAGNI) — Low
**Principle:** *You Aren't Gonna Need It.* Unused fields are noise that readers must learn to ignore, and they can silently drift.
**Evidence:** `archetype` and `rarity` on cards are "scaffolding only" by their own comments, and no production code reads either (searched for `.archetype`/`.rarity`). `HeroPowerDefinition.owner` is never read.
**Fix:** do **not** remove in the structure-only PR (removing a field is a data change, and the maintainer added the scaffolding on purpose for later). Record them as a decision for you: keep with a note, or delete.

### F7. The same registry boilerplate is written five times — Medium
**Principle:** *DRY (rule of three).* The third time you write the same code, extract it.
**Evidence:** `cards.ts`, `enemies.ts`, `events.ts`, `relics.ts`, `heroes.ts` each hand-write "build a record from a list with `Object.fromEntries`, throw on a duplicate id, export a `getX(id)` that throws if missing". Four of the card files also repeat the `const base = { owner: …, inRewardPool: …, inStarterPool: … }` shorthand.
**Fix:** one `createRegistry(items, label)` helper in `data/registry.ts` returning `{ all, byId, get, find }`, used by each table. The error messages stay identical (tests assert some of them). Behaviour-preserving.

### F8. The schema vocabulary exists in three copies — Low
**Principle:** *Single source of truth.* Every extra copy is a place to forget.
**Evidence:** effect kinds, statuses, scaling sources and trigger events are listed in `game/types.ts` (the real thing), again in `content/vocabulary.ts`, and again in `docs/CONTENT_GUIDE.md`. Tests (`guide.test.ts`) fail when they drift, which is a good guard.
**Fix:** none needed now. The guard works; the cost is small. Noted because it is the pattern to avoid copying elsewhere.

### F9. Art and credits are string-keyed side tables — Medium
**Principle:** *Make illegal states unrepresentable* and *keep related data together* (foreign keys should be checkable).
**Evidence:** `ENEMY_ART`, `RELIC_ICON`, `HERO_ART`, the enemy art manifest, and the credits list are separate string maps in `data/art.ts`, `data/enemyArt.ts`, `data/credits.ts`; a misspelled key fails only at test or run time. `data/art.ts` and `scenes/art.ts` share a name but are different layers (a table of pairings vs the Phaser drawing code).
**Fix:** with hero folders, each hero's art pairing moves into its folder (decided). The published file layout stays. Rename `scenes/art.ts` to `scenes/artLoader.ts` or similar so the two are never confused (a rename; imports updated).

### F10. Loose files at the root of `src/` and a few "grab-bag" modules — Medium
**Principle:** *Names and locations should tell you what a thing is.*
**Evidence:** `display.ts`, `session.ts`, `settings.ts`, `storage.ts`, `main.ts` sit loose beside the folders; `scenes/ui.ts` is 565 lines holding the card face, buttons, status line, relic bar, card-list viewer, settings panel and `enterCurrentNode()` (highest fan-out in `scenes/`: 13 imports); the only runtime cycle is `scenes/credits.ts` and `scenes/ui.ts` importing each other.
**Fix:** group the shell files (`main`, `display`, `session`, `settings`, `storage`) in `src/app/`. Splitting `ui.ts` into focused modules (`ui/cards.ts`, `ui/buttons.ts`, `ui/settings.ts`, …) is a mechanical move and fits this PR; it also removes the cycle if `enterCurrentNode` moves out of it. Note the e2e tests import `/src/session.ts` 27 times, so those paths must be updated in the same commit.

### F11. The simulator is a third of the production code and nothing in the game depends on it — Medium
**Principle:** *Separate what ships from what doesn't.* Tooling in the product folder blurs what the product is.
**Evidence:** `src/sim/` is 28 production files and 5,832 lines (30% of all production code). The import graph shows **no production file outside `sim/` imports it**; `sim/` imports `data/` 44 times and `game/` 15 times. It is built by separate `vite build --ssr` scripts, never bundled into the game.
**Fix (my recommendation):** move it to a top-level `sim/` next to `balance/`, since it is balance tooling. Cost: the four package scripts (`sim`, `balance`, …), a few docs, and `tsconfig`'s `include`. Benefit: `src/` becomes "the shipped game plus its content tools", and the import rule "the game never imports `sim/`" becomes a folder boundary instead of a habit. Treat this as your call; it is the only finding where I am recommending something you did not decide.

### F12. Repository root and `docs/` clutter — Low
**Principle:** *Make the first screen of the repo self-explanatory.*
**Evidence:** nine markdown files at the top level; 12 `docs/progress-*.md` files that describe past unattended sessions (the docs index already says "they describe a moment; the code and the guides win"); build output `dist/`, `test-results/` and local `.claude/worktrees/` sit in the working folder (git-ignored, so not committed; they only add noise locally). `Dockerfile` and `docker-compose.yml` exist while deploys go through GitHub Pages: unclear if they are still used.
**Fix:** archive the progress docs into `docs/archive/` (decided); keep root docs that the working rules name. **Question for you:** is the Docker setup still used? If not, it is a candidate for deletion in a later cleanup, not this PR.

### F13. Test layout and naming — Low
**Principle:** *Consistent naming conventions.*
**Evidence:** tests sit beside the code they test, which is a fine convention. There are five suffix styles in use (`.test.ts`, `.coverage.test.ts`, `.invariants.test.ts`, `.golden.test.ts`, `.rules.test.ts`). Two thirds of the files in `src/game/` are tests, so the folder is hard to scan.
**Fix:** keep tests beside code (hero tests move with their hero folder). Optionally separate game tests into `src/game/__tests__/`. I would leave this alone: the cost of moving ~30 test files with relative imports is real and the benefit is only scanning.

### F14. Unused and over-exported symbols — Low
**Principle:** *Keep the public surface small.* Exports are promises to other modules.
**Evidence:** of 809 exports, 321 are not imported by another production file; almost all are used inside their own file or by tests. Only **eight** are used nowhere: `effectsText` (`content/browse.ts`), `FORM_IDS` (`data/forms.ts`), `installDevPanel` (`dev/devPanel.ts`, probably loaded by name), `isReportDialogOpen` (`qa/reportDialog.ts`), `Command` (`sim/commands.ts`), `fightSeed` (`sim/fight.ts`), `unitsNeededForRate` (`sim/stats.ts`), and the Node stubs in `sim/node.d.ts`.
**Fix:** delete the genuinely unused ones in the restructure after checking each by hand (the scanner reads text, not semantics). Do not mass-unexport the other 313.

### F15. Hero-specific mechanics leak into the shared core — High (deferred)
**Principle:** *Open/closed.* Adding a feature should mean adding code, not editing the core in many places.
**Evidence:** Temperature, Radiant Light and forms each appear as fields or branches in `game/CombatState.ts`, `game/types.ts`, `game/effects.ts`, `game/scenario.ts`, `scenes/CombatScene.ts`, `scenes/combat/PlayerView.ts`, `content/validate.ts`, `content/vocabulary.ts`, `data/heroes.ts` and more: 10 to 14 files each. Three heroes means the same change has now been made three times; the earlier rule "no abstraction before a second hero" has been passed.
**Fix:** **Not in this PR** (it changes how the engine is built). The idea for a follow-up: a "hero state" interface that each hero implements (resource, what it adds to a snapshot, what the fight screen shows), so a hero's mechanic lives in its own folder. The by-hero folders this PR creates are the prerequisite: the code has somewhere to move to.

## Part 3: the proposed structure (what the restructuring PR would do)

```
src/
  app/                  main.ts, display.ts, session.ts, settings.ts, storage.ts   (the shell around the game)
  model/                the schema: hero.ts, card.ts, effect.ts, status.ts, enemy.ts, relic.ts, event.ts, form.ts, index.ts
  data/
    registry.ts         createRegistry() (F7)
    tunables.ts, statuses.ts, enemies.ts, enemyArt.ts, relics.ts, events.ts, credits.ts, art.ts
    heroes/
      ids.ts            HeroId constants (F2)
      index.ts          HEROES registry
      mage/             hero.ts, power.ts, cards.ts, art.ts (pairing only)
      paladin/          hero.ts, power.ts, cards.ts, art.ts
      druid/            hero.ts, power.ts, cards.ts, forms.ts, art.ts
    neutral/            basics.ts (Strike, Defend, ...), synergy.ts, keyword.ts   (owner stays 'neutral')
    cards.ts            ALL_CARDS built from the folders above; getCard, pools
  game/                 rules only: CombatState, Deck, RunState, newRun.ts (moved from data/run.ts), actMap, effects, ...
  scenes/               Phaser screens; ui.ts split into ui/*.ts
  content/              the content browser and validator (the tools for data/)
  audio/, dev/, qa/
sim/                    (recommended: moved out of src/ to the repo top level, beside balance/)
docs/
  archive/              the 12 progress-*.md files
  audits/               this report
```

### Order of commits inside the one PR (each leaves the repo green)
1. Archive `docs/progress-*.md`; fix links in `docs/README.md`.
2. `model/`: split `game/types.ts` by entity; re-export; no logic changes.
3. `data/registry.ts` and use it in the five tables; messages unchanged.
4. Hero ids module; hero folders; `neutral/` folder; each hero's art pairing moves with it.
5. Move `data/run.ts` to `game/newRun.ts`.
6. `app/` for the shell files; split `scenes/ui.ts`; rename `scenes/art.ts`.
7. Move `sim/` (if you agree), and update scripts and docs.
8. Delete the eight verified-unused exports; set `"strict": true` in `tsconfig.json`.

Each step uses `git mv` so file history survives.

### How "no behaviour change" is proved
- `npm run verify` (typecheck, 977 tests, build) green after every commit.
- The golden event-log hashes (`effects.golden.test.ts`) unchanged. They pin the engine's exact behaviour across hundreds of seeded fights.
- Simulator and balance reports byte-identical before and after (`npm run balance:check`, `npm run sim -- --runs 100` compared with the saved output).
- `npm run content:check` and `npm run patchnotes:check` unchanged.
- The full browser suite (`npm run e2e`), which loads game files by path, rerun once at the end.
- A diff of the built bundle's exported card, enemy and relic ids to show no id changed.

### Blast radius to plan for
- 37 dynamic imports in `e2e/` point at six `src/` paths (`session.ts` 27 times, `data/cards.ts`, `data/enemies.ts`, `scenes/ui.ts`, `scenes/combat/layout.ts`, `scenes/credits.ts`).
- Five scripts in `package.json` point at `src/sim/…` and `src/content/…`.
- 30 documents mention `src/` paths and need their links updated.
- Open worktrees under `.claude/worktrees/` (git-ignored) will go stale; delete them first.
- Any other open branch will conflict heavily; merge or close them before this PR.

### Explicitly **not** in the structure-only PR
- Splitting `CombatState`, `RunState`, `CombatScene` or the long functions (F5).
- A pluggable hero-state interface (F15).
- Dependency-injecting the content into the rules (F3, second half).
- Removing `archetype`/`rarity`/`HeroPower.owner` (F6).
- Renaming the `neutral` owner value (decided: it stays `neutral`).

## Decisions this report leaves to you
1. **`sim/` placement (F11):** top-level `sim/` (my recommendation), `tools/sim/`, or stay in `src/`.
2. **`content/` naming:** the folder holds the content browser and validator, not the content itself, which is easy to misread next to `data/`. Rename it (`contentTools/`, `catalog/`) or leave it?
3. **Dead fields (F6):** keep `archetype`, `rarity` and `HeroPower.owner` with a note, or delete them in a later PR?
4. **Docker files (F12):** still used?
5. **`__tests__` folders (F13):** leave tests beside code (my recommendation)?

## Appendix: method
- **Import graph** (`tools/audit/importGraph.mjs`): a regex scan of every `import`/`export … from` in `src/`, type-only imports excluded from runtime edges; strongly connected components for cycles; exports not imported by another file by name.
- **Code shape** (`tools/audit/codeShape.mjs`): the TypeScript compiler API walks each production file for function length, a branch-count complexity, class sizes, casts and escape hatches.
- **Limits:** the scanners read text, so a re-export or a dynamic `import()` can hide a use (the dev panel and e2e load files by path); every "unused" result was cross-checked by hand in the table above. Branch counts are a rough proxy for complexity, not a formal measure.

## Outcome: what the restructuring PR did (2026-10-13)

Built from this report, structure only. The layout above was followed with these notes:

| Finding | Result |
|---|---|
| F1 hero content scattered | Done. `src/data/heroes/<hero>/` holds `hero.ts`, `power.ts`, `cards.ts`, `art.ts` (the Druid also `forms.ts`); `src/data/neutral/` holds `basics.ts`, `synergy.ts`, `keyword.ts`; `heroes/index.ts` is the `HEROES` registry. Steps to add a hero are in `docs/CONTENT_GUIDE.md`. |
| F2 hero id has no home | Done. `src/data/heroes/ids.ts`; the circular-import comments and the duplicate `MAGE` are gone. |
| F3 data and game import each other | Done for the runtime edges: `data/run.ts` moved to `game/newRun.ts`, so `data/` no longer imports `game/` at runtime. The types moved to `model/`. Handing the content to the rules by injection was **not** done (a behaviour-level change). |
| F4 `types.ts` dumping ground | Done. `src/model/` has one type-only file per entity (`card`, `effect`, `status`, `trigger`, `hero`, `enemy`, `relic`, `event`, `form`, `combat`) and an `index.ts`. |
| F5 large classes and functions | Not done on purpose (behaviour-adjacent). Still the top follow-up. |
| F6 unread fields | Not touched: `archetype`, `rarity` and `HeroPowerDefinition.owner` stay (decision for you). |
| F7 repeated registry code | Done. `src/data/registry.ts` (`createRegistry`) is used by cards, enemies, events, relics and heroes. The `const base = {…}` shorthand in four card files stays. |
| F8 vocabulary in three copies | Unchanged (guarded by tests). `guide.test.ts` now reads the schema from all of `src/model/`. |
| F9 art side tables | Partly done: each hero's picture pairing moved into its folder; `HERO_ART` collects them. `ENEMY_ART`, `RELIC_ICON` and credits stay as they were. `scenes/art.ts` is now `scenes/artLoader.ts`. |
| F10 loose `src/` files, `ui.ts` | Done. `src/app/` holds `main`, `display`, `session`, `settings`, `storage`. `scenes/ui.ts` became `scenes/ui/` (`cardFace`, `widgets`, `cardViews`, `hud`, `settingsPanel`, `navigation`, `index`); the runtime import cycle is gone (the graph script reports none). |
| F11 simulator in `src/` | Done as recommended: top-level `sim/`; scripts, `tsconfig` and the coverage command updated. |
| F12 root and docs clutter | The 12 progress reports are in `docs/archive/`. The Docker files were left alone (question still open). |
| F13 test layout | Left as is; tests moved with their code. |
| F14 unused exports | Deleted six after checking each by hand (`effectsText`, `FORM_IDS`, `isReportDialogOpen`, `unitsNeededForRate`, `fightSeed`, `Command`). `installDevPanel` stays (it is loaded by name from `main.ts`); the Node stubs in `sim/node.d.ts` stay. `tsconfig.json` now says `"strict": true`. |
| F15 hero mechanics in the core | Not done on purpose; the hero folders are the prerequisite. |

Decisions I took because the report left them open (reverse any with a follow-up): `sim/` to the top level; `content/` keeps its name; the dead fields stay; the Docker files stay; tests stay beside the code.

### Evidence that behaviour did not change
- `npm run verify` (typecheck, 977 tests, build) green; the golden event-log hashes unchanged.
- `npm run sim -- --runs 120` output **byte-identical** before and after; `npm run balance:report` JSON and Markdown **byte-identical**; `npm run balance:check` and `npm run content:check` output identical apart from the command line that echoes the new script path.
- No card, enemy, relic, event, status or hero id was renamed (saves store ids).
- The browser suite was run against the restructured tree (see the PR for the result).
