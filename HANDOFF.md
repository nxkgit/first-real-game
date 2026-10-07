# Session Handoff

Context for picking this project up in a fresh Claude Code session. Last updated **2026-10-07** (session 3: unattended-work process, synergy engine, balance tooling, test layers; then, the same day with the user back at their PC: live card numbers, map variety, every-route-has-an-elite, all synergy cards in the pool, a first art pass and backdrops; three more pieces of work were still in progress on branches, see "In progress on branches").

Read order for a new session: `CLAUDE.md` (rules) → this file (where things stand) → `implementationplan.md` (scope) → `DESIGN_LOG.md` (why). This file is a snapshot. When it disagrees with those documents or the code, they win. Update this file at the end of each session.

---

## Where things stand

- **Live:** https://nxkgit.github.io/first-real-game/ (GitHub Pages; redeploys automatically on every push to `main`). Add `?dev` for the dev panel, `?seed=123` to pick a seed. The content browser is at `/content.html` on the same site.
- **Repo:** https://github.com/nxkgit/first-real-game. `main` is the live branch. The older feature branches (`status-effects`, `shop-draft`, `architecture`, `playtest-tooling`) are all merged into it and can be deleted.
- **Stage:** MVP 1 (one fight) and MVP 2 (chained fights) are done. Session 2 went on to build a **one-act demo**: a branching map of fights, elites, rests, shops and events leading to a boss. See "What the game does today".
- **Health:** `npm run verify` (typecheck, tests, build) is green: 677 tests on `main` at `71e4500`. `npm run e2e` (real-browser suite, 20 tests, about 5 minutes, separate from verify) passed on the same build. CI: `verify` on pull requests and `auto/**`/`integration/**` pushes; browser tests there run as a fast subset (everything but the whole-act test), with the whole suite nightly (see `docs/E2E.md`; that split was written on branch `auto/docs-ci` and could not be run on GitHub when written).
- **Session 3 added** (decisions in `DESIGN_LOG.md` Session 3; the document index is `docs/README.md`):
  - **Synergy engine** (`docs/SYNERGY_ENGINE.md`): scaling values, Empowered multiplier, triggers on powers/relics, tags, exhaust, energy, self-damage. 20 placeholder cards in `src/data/synergyCards.ts`, **now in the reward pool** (since 2026-10-07, the user wants every placeholder offered to testers; flip `base.inRewardPool` in that file to take them out).
  - **Effect registry** (`src/game/effects.ts`, `docs/EFFECTS.md`): one entry per effect kind (resolve, enemy resolve, text, intent, scaling). Adding a kind = one entry. Proven behaviour-identical by golden hashes and byte-identical sim reports.
  - **Balance toolkit** (`docs/BALANCE.md`, `balance/`): `npm run balance:report|baseline|check`, bots at four skill levels, paired-seed experiments, loop/combo/dominance search. First analysis: `docs/balance/synergy-findings-2026-10.md`. Targets are provisional.
  - **Design evidence** (`docs/design/EVIDENCE.md`, read its decision menu first): simulator measurements for each open decision (shop and gold vs card, card removal, relics, events, map shape, rest heal vs upgrade, pressure curve, deck size). Headline on placeholder content: always taking gold loses 26-33 win points at any shop price because a path meets only about 0.4 shops; healing beats upgrading at every floor; floors and rests per path are the map dials (lanes, climbs and thresholds do nothing measurable); the act is attritional, with deaths in ordinary fights on floors 7-11. Reproduce with `npm run balance:evidence` and the commands in `docs/BALANCE.md`. Two bots disagree by tens of win points, so judge against both.
  - **Content tools:** `docs/CONTENT_GUIDE.md` (for whoever writes real content), `npm run content:check`, an upgraded `/content.html` (search, sort, filters, upgrade side-by-side, sim stats).
  - **Tests:** invariant/fuzz (`*.invariants.test.ts`), coverage (`*.coverage.test.ts`), and a Playwright end-to-end suite (`e2e/`, `docs/E2E.md`; `npm run e2e:install` once, then `npm run e2e`).
  - **Process:** unattended-session playbook `docs/AUTOMATION.md`; CI on PRs and `auto/**`/`integration/**`; the audit at `docs/audits/2026-10-code-audit.md` (its non-combat findings are fixed).
  - **Rule changes that affect play:** a played power stays in play for the rest of the fight (Powers readout above the draw pile); hand capped at 10 (overlaps on screen, key `0` plays the 10th); combat-start block survives turn 1; an exhaust readout above the discard pile opens the exhausted cards; Tag A Echo is once per turn (it was the one infinite loop).
- **Added after that, the same day (user-directed; decisions in `DESIGN_LOG.md`):**
  - **Live damage numbers on cards:** a fight card shows what it will really deal (Strength, Weak, Vulnerable, scaling, Empowered), green above the printed number and red below, from `CombatState.previewCardDamage` (same formula as playing the card), against the first living enemy. Whole description changes colour. (`a68d313`)
  - **Map variety:** each climb gets a route theme (`MAP_ROUTE_THEMES`: risky, events, safe, fights) that multiplies stop-kind chances on it; a `lateEncounters` fight list from floor 9; the same placeholder events reused. Not shown on the map: the player sees themes only through the stops. (agent branch `auto/map-variety-and-pool`, merged)
  - **Elites:** at least `MAP_MIN_ELITES` = 3 on every map **and every route from a first-floor stop to the boss crosses at least one elite** (about 4.6 elites per map; two elites in a row in about 4 maps of 3000, only where that is the sole way to satisfy the rule). (`4b48789`)
  - **All 20 synergy cards in the reward pool** (31 cards). The balance baseline was regenerated; `docs/design/EVIDENCE.md` and `balance/reports/design-evidence/` were NOT (the user: "we should not be worried about balance right now"), and now carry a stale banner.
  - **Art pass:** the hero (vector chibi, animated: idle, attack when an attack card is played, death on defeat), four painted enemies, Cartography map icons, Ravenmore relic and heart icons, Kenney pixel borders on cards and buttons, and five landscape backdrops (fights by tier and floor; map, rest, shop, event and reward screens). Placeholder pairings in `src/data/art.ts`; files built by `tools/prepareAssets.py` from the git-ignored `assets/` folder; credits in `public/assets/CREDITS.md`; pipeline in `docs/ART.md`. The styles clash on purpose ("that may be funny to see"). (`8ed83d5`, `6cdf490`, `71e4500`)
- **Played in a browser in session 3:** map, fights with real clicks, enemy turns, a synergy combo, powers/exhaust readouts and viewers, a 10-card hand, the content browser, and (via `npm run e2e`) a whole seeded act plus every stop kind. Not played by a human: touch/phone, sound, feel of the new synergy cards. Seen in screenshots from the real-browser harness after the art pass: a fight with the hero attacking, the map, the shop, the event screen, grass/desert/castles fight backdrops, a card in aiming mode. Not seen: forest and fall fight backdrops, the rest and reward screens with backdrops, the defeat animation, touch.

### What the game does today
- **The run is one act.**
  - A seeded, branching map (13 floors: 12, then the boss). Pick one of the glowing stops to go there; the map tracks where you've been.
  - Stop kinds: fight (F), elite (E), rest (R), shop ($, still the draft), event (?), boss (B). Floor rules: floor 1 is always fights, the floor before the boss is always a rest, elites and rests appear from floor 5, shops from floor 4, and rests/shops never come twice in a row on a path (elites almost never; see the elite rule below). Each climb has a route theme (risky, events, safe, fights) that shifts which stops it offers; every route to the boss crosses at least one elite; fights from floor 9 up use a harder list.
  - Losing ends the run. Beating the boss wins the act ("ACT COMPLETE").
- **Fights** (Slay the Spire style):
  - draw 5 cards; 4 energy per turn
  - attack cards are **aimed** (drag them onto an enemy, or click the card and then the enemy); skills and powers play on click
  - fights can have several enemies (up to 3 laid out); each shows an intent: sword plus total damage, shield plus block, and generic buff/debuff arrows (it does not say which status)
  - elites and the boss are drawn larger and announce themselves with a banner
  - the fight area has a landscape backdrop (boss: castles, elite: desert, ordinary: grass, forest, fall by floor); the hero is an animated picture; enemies are painted pictures
  - a damage card shows its live damage (green above the printed number, red below)
  - **turn order on screen:** discard → enemy acts → draw
  - click the draw or discard pile to see what's in it
- **Statuses:** Weak (-25% damage dealt), Vulnerable (+50% damage taken), Strength (+N per hit). Timed ones count down at the end of each round, and one an enemy puts on you skips that round's countdown.
- **Rewards:** after a normal win, pick 1 of 3 cards (from a pool of 31: the 11 original plus the 20 synergy placeholders) **or** take 25 gold. An elite gives 40 gold instead and also drops a **relic** (it comes with either choice). The boss gives nothing: the act is won.
- **Rest stop:** heal 30% of max HP, **or upgrade one card** (you see the card next to its upgraded version first). Upgraded cards are named `<card>+` with a green name.
- **Relics:** permanent, shown as small icon badges under the top status line (a lettered badge if a relic has no icon; hover or tap for the text). Five placeholders: +1 Strength at combat start, +10 max HP, 6 block at combat start, heal 4 after each win, draw 1 extra card each turn.
- **Events:** text plus choices; each choice shows what it will do. Outcomes: gain/lose gold or HP, max HP, a card, a random card, a relic, or a fight. Four placeholders.
- **Shop (draft):** four cards at a flat 40 gold. Labelled DRAFT; contents and pricing are undecided.
- **Run persistence:** the run saves at every stop (and after an event choice is made); the next visit offers Continue or New Run. A fight in progress restarts from its start (same shuffle, so refreshing can't reroll it). The end screen shows the seed and a "Copy run report" button.
- **Settings** (bottom-right button, remembered): volume, sound on/off, animation speed (1x/1.5x/2x), screen shake on/off.
- **Interface:** hover tooltips (tap on touch screens), a **Deck (N)** viewer, keys `1`–`9` and `0` play cards 1–10, `E` ends the turn, `D` opens the deck, `Esc` cancels/closes. The user said keyboard targeting with several enemies can stay as is (number keys aim at the first living enemy).
- **Display:** fits any window size at full device resolution. Phones held upright see a "turn sideways" message.
- **Sound:** fantasy-styled sound effects, generated in code with no audio files.
- **Art (first pass, 2026-10-07):** hero, enemy, map-icon, relic-icon and card/button-border pictures and five backdrops from free packs; mapping in `src/data/art.ts`, files in `public/assets/` built by `tools/prepareAssets.py` from `assets/` (git-ignored raw packs), credits in `public/assets/CREDITS.md`, guide `docs/ART.md`. The pairings are placeholders and the styles deliberately clash. Every picture falls back to the old drawn shape if its file is missing. Unused so far: `spritesheets.zip` (animated pixel enemies), the pixel UI pack, the Background pack's parallax layers. Art loads in `BootScene.preload`; the e2e harness waits for it.
- **Content:** all placeholder (enemies A–D, two elites, a boss, 31 reward cards each with an upgrade (11 original, 20 synergy), 5 relics (2 more synergy relics outside the pool), 4 events, every number). Real content is the user's to design.

---

## Code map (`src/`)

| Path | Role |
|---|---|
| `game/` | **Plain game logic, no Phaser.** `CombatState` (fight rules plus a typed event emitter; `player` and `enemies[]` are `Combatant`s with ids `'player'`, `'enemy-0'`, ...; options for seeded shuffles and relics), `Deck`, `RunState` (the act: map position, HP/deck/relics/gold, rewards, rest, shop, events), `actMap.ts` (seeded map generator), `types.ts` (the shared `Effect` type used by cards **and** enemy moves, relic and event types), `effects.ts` (the effect registry), `describe.ts` (card, relic and event-outcome text generated from the data), `intent.ts`, `rng.ts`, `save.ts`, `runReport.ts`. Unit-tested (`*.test.ts`; `testHelpers.ts` builds small test worlds). |
| `data/` | `tunables.ts` (**every balance number**, including the map rules), `cards.ts` (cards, upgrades, the `CARDS` registry, `getCard`, `upgradedVersion`, `rewardPoolFor`, starter deck), `enemies.ts`, `relics.ts`, `events.ts`, `statuses.ts`, `run.ts` (the act's content lists, `RUN_WORLD`, `newRun()`) |
| `scenes/` | `BootScene` → `MapScene` → `CombatScene` / `RewardScene` / `RestScene` / `ShopScene` / `EventScene` → … → `RunEndScene`. `ui.ts` holds the shared pieces: card face, buttons, the status line and relic bar, the card-list viewer (deck and piles), the settings panel, and `enterCurrentNode()` (**every screen change goes through it**; it also saves the run). |
| `scenes/art.ts`, `data/art.ts` | Picture loading and drawing (`preloadArt`, `buildHeroSprite`, `buildEnemySprite`, `addMapIcon`, `addIcon`, `addBorder`, `addBackdrop`, `addScreenBackdrop`; each returns null/false so the caller falls back to the drawn shape) and the placeholder pairings (enemy to picture, relic to icon, tier and floor to backdrop). Guide: `docs/ART.md`. |
| `tools/prepareAssets.py`, `public/assets/` | Builds the shipped art from the raw packs in `assets/` (needs Pillow); the files the site serves, with `CREDITS.md`. |
| `scenes/combat/` | Pieces of the fight screen: `EnemyView` (one per enemy), `PlayerView`, `Targeting`, `Tooltips`, `StatusRow`, `drawings.ts`, `layout.ts`. `CombatScene` itself is wiring, the hand, and the animation queue. |
| `storage.ts`, `session.ts`, `settings.ts` | Guarded browser storage (save, report history, clipboard), the current-run holder, and player settings. |
| synergy engine (`game/` + `data/`) | Scaling, triggers, Empowered, exhaust and the new effects live in `CombatState` (`fireTriggers`, `scaledValue`), `Deck.exhaustPile` and `describe.ts`. Placeholder cards: `data/synergyCards.ts` (in the reward pool since 2026-10-07); helper `allDraftableCards()` in `data/cards.ts`. Guide: `docs/SYNERGY_ENGINE.md`. Built unattended: **not played in a browser**. |
| `dev/devPanel.ts` | The `?dev` panel (a separate chunk, loaded only with that flag): jump to any stop, custom fights, **kill all enemies instantly**, add cards/relics, gold/HP, seeded new run, copy reports. |
| `content/` | The content browser page (`content.html` at the project root): every card, relic, enemy, status, event, and the act's settings, with Markdown/CSV copy. |
| `sim/` | Headless simulator and balance toolkit: `bot.ts`/`skills.ts`/`smart.ts` (bots), `simulate.ts`/`cli.ts` (whole acts), `balanceCli.ts`/`commands.ts`/`experiments.ts` etc. (paired-seed experiments, baselines, loop finder; see `docs/BALANCE.md`). |
| `display.ts` | Fits the 800×600 layout to the window. **Every scene calls `useLayoutCamera(this)` first in `create()`.** |
| `audio/Sfx.ts` | Generated sound effects (Web Audio); follows the volume/mute settings. |
| `vite.config.ts` | Two pages: the game and the content browser. |
| `.github/workflows/deploy-pages.yml` | Tests, builds with the `/first-real-game/` base path, and deploys to Pages. |
| `.github/workflows/ci.yml`, `e2e.yml` | `verify` on pull requests and `auto/**`/`integration/**` pushes; browser tests (fast subset there, whole suite nightly and on demand). |

### Patterns to keep (each one fixed a real bug)
- **Synergy rules:** triggered effects are not card plays; trigger nesting is capped by `MAX_TRIGGER_DEPTH`; new events carry snapshot data. Details in `docs/SYNERGY_ENGINE.md`. Effect kinds are now 8, the plan's threshold for considering an effect registry.
- **Cards, enemy moves, relics and events are data.** Cards and enemy moves are lists of `Effect`s (relics reuse them). To add an effect kind, extend the `Effect` union in `types.ts`, handle it in `CombatState` (`applyCardEffect` for cards, `runEnemyMove` for enemies), and add its text in `describe.ts`. Card/relic text and intent icons are generated; don't hand-write them. Each card needs `owner` and `inRewardPool`, and an `upgrade` block (or it can't be upgraded). A test checks that aimed cards are declared `target: 'enemy'`.
- **Upgrades are registered cards.** `getCard('strike+')` is the upgraded Strike, generated from Strike's `upgrade` block. The deck is still a list of card definitions, so saves, reports and tests need nothing special.
- **All randomness is one seeded stream per run** (`RunState.rng`). The map, rewards, shop stock, events, relic rolls and each fight's shuffle seed (`newCombatRng()`) all come from it, in a fixed order, so a seed replays exactly and a saved run resumes identically. Don't call `Math.random()` for gameplay.
- **Saves are by id.** `SavedRun` (version 2) stores card/relic/enemy/event ids and the whole map. `parseSavedRun` validates it; a bad or old save is discarded, never a crash. Bump `version` if the shape changes.
- **Logic emits events; the scene replays them as a queue.** `CombatScene.sequencer` buffers the events from one action and plays their animations in order. When the scene finally plays an animation, the game logic has already moved on, so **animations must use the event's own data, not live state**. Breaking this rule made the next hand appear before the enemy attacked.
- **Phaser reuses scene objects across restarts.** Reset every per-fight field in `init()`, not in field initializers.
- **Keys:** use `onKeyPress()` from `ui.ts`, never `this.input.keyboard`. It also ignores keys typed into the dev panel's boxes.
- **Touch:** Phaser fires "over" when a finger lands and "out" when it lifts. Tooltips (`Tooltips`, and the relic bar) handle this.
- **Art always falls back.** A missing or misnamed picture must never break a screen: helpers in `scenes/art.ts` return null/false and the caller draws the old shape. Art loads once, in `BootScene.preload`. In Phaser 4 a white "fill" tint is `setTint(c).setTintMode(Phaser.TintModes.FILL)` (`setTintFill` is gone).
- **Map rules are tested over 3000 seeds** (`actMap.invariants.test.ts`): every route crosses an elite, rests/shops never repeat, floors and kinds obey `MAP_FIRST_FLOOR`. Change the generator and these on purpose, together. A move-the-neighbouring-elite-aside approach to the elite rule flip-flopped forever; placing an elite even beside another one always terminates.
- **TypeScript config:** `erasableSyntaxOnly` is on, so no constructor parameter properties (`constructor(private x)`).

---

## Decisions already made (don't re-ask)

- **No server or database for now.** The game is a static site: content is in `src/data/`, a player's run lives in their browser. If cloud saves, accounts, leaderboards or central playtest reports are ever wanted, look at the most cost-effective option then (the user's words). The smallest step up would be a way for playtest reports to arrive without being copied by hand.
- **Keyboard targeting with several enemies stays as is** (number keys aim at the first living enemy; mouse picks any).
- **Git flow is relaxed for now:** commit to `main` and push.
- **Phone layout and load-speed work are skipped for now.**
- **Balance is not a concern right now** (user, 2026-10-07): do not tune numbers; the bots and `docs/design/EVIDENCE.md` wait for the real class, builds, enemies, abilities, status cards and combat patterns. Regenerate baselines/fixtures only to keep checks meaningful.
- **Art styles may clash for now** (user): no style unification yet; asset pairings are placeholders.
- **Hosting:** GitHub Pages is fine for playtesting (no cap on simultaneous players; soft limits about 100 GB bandwidth a month and 1 GB site; a player's save lives in their own browser). No leaderboards or central reports without a server, which is deferred.
- **Puzzle idea (no randomness):** the user wants a possible future "lethal puzzle" game mode (load a saved state, find the winning line) and **no randomness in puzzles**. Not built; it would sit on the scenario system below.

## Open decisions (the user's to make)

These are gameplay and creative calls. Per `CLAUDE.md`, ask rather than pick. Everything the act demo uses is a **provisional placeholder** (logged in `DESIGN_LOG.md`).

1. **The shop.** Contents, prices, and how much gold is worth against a card. Taking gold is still worse than a card unless you plan to shop.
2. **Relics:** where they come from (elites and events for now), how many, what they do, whether bosses or shops give them.
3. **Events:** real events, and whether event fights should give a normal reward.
4. **Map shape and rules:** how many floors/paths, the mix of stop kinds, where elites appear, whether to add treasure stops or multiple acts.
5. **Upgrades:** the numbers (all placeholders), and whether rest stops should offer more than heal-or-upgrade.
6. **Hero abilities:** the user wants each hero to have one ability usable once per turn. Not built; wait for the second hero or a design.
7. **Status cards** that enemies put into the player's deck (user's idea, later).
8. **Real content:** hero identity, cards, enemies, art, names, and the balance numbers.
9. **Rarity tiers and reward weighting.** Still deferred.
10. **A real phone-upright layout**, instead of the "turn sideways" message.

## In progress on branches (launched 2026-10-07; this section is to be corrected by the orchestrator at merge)

The user's three original queued requests (live damage numbers, map variety, elites and synergy cards in the pool) are **done and on `main`** (see "Added after that, the same day"). The user then approved this next wave, run as background agents in local worktrees (rules: `docs/AUTOMATION.md`; they never push or touch `main`):

- **Scenario system** (an `auto/...` branch; doc `docs/SCENARIOS.md` once it exists): capture a fight's exact state (enemies with HP/statuses/next move, the player's HP/block/energy/statuses, relics, draw/hand/discard/exhaust piles and powers, turn, and the random stream position) and load it back from the dev panel; usable as test scenarios. The engine's random generator is one 32-bit number with a position getter and `Rng.restore`, so a fight replays exactly; the order you play cards in does matter for random effects because each takes the next number.
- **Credits screen, start/end-screen backdrops, animated pixel enemies** (from `spritesheets.zip`).
- **Card faces:** live numbers for block/draw scaling and for the enemy under the aiming arrow, and tags shown on cards (`docs/EFFECTS.md` may be touched).
- **Docs and CI** (branch `auto/docs-ci`, this handoff's author): `docs/ART.md`, the content guide, E2E doc and index brought up to date, stale banners on the old balance evidence, and the nightly e2e split.

Check `git branch --list "auto/*"` and each branch's `docs/progress-<topic>.md` for the real state; then merge through `integration/<wave>` and update this file.

**Waiting on the user (ask before acting on any):**
- The map agent's three open questions: should the map show a route's theme (a label or tint) or are the stop icons enough; is a minimum of 3 elites right (the every-route rule already gives about 4.6); should elites drop better rewards now that they are common (rewards were left unchanged).
- **Targeting arrow bug:** they reported the aiming arrow drawn "way off screen" while targeting still works. **Not reproduced** in the real-browser harness (click-then-click and drag, 800x600, 1366x768 at 125%, 1920x1080, 2560x1300 at 150%, after a window resize, and on a second card after an enemy turn). Ask for window size, browser zoom, touch or mouse, click-or-drag, and a screenshot; try a hard refresh (cached old build) first.
- They said they do not see the synergy cards in rewards: the pool in code and in the deployed bundle does include all 20 (with 20 of 31 cards a 3-card reward has one about 95% of the time), so a cached older page is the likely cause; unconfirmed.

## Next steps that don't need decisions

- **Faster first load:** Phaser is now its own chunk (`vite.config.ts`, `rolldownOptions.output.codeSplitting`), so game updates don't bust its cache. First-load size is unchanged (~357 KB gzip for Phaser); the build still warns because Phaser alone is over 500 KB. Note: Vite 8 ignores `rollupOptions` when `rolldownOptions` is set, so the two-page `input` lives in `rolldownOptions` too. Only build-, test- and curl-checked (chunks and `content.html` serve), not played in a browser.
- **Art leftovers:** no pictures yet for statuses and enemy intents (still drawn shapes); the in-game credits screen (CC-BY packs need credit; today only `public/assets/CREDITS.md`); `docs/design/EVIDENCE.md` measurements describe the old map and 11-card pool.
- **Test on a real phone.** Touch was only tested with simulated events, and not at all since the act, map and settings were added.
- **Use the simulator** (below) when numbers change, to see what they did.
- **The e2e workflow** runs a fast subset (all but the whole-act test) on PRs and `auto/**`/`integration/**` pushes and the whole suite nightly and on demand (written on `auto/docs-ci`, not yet run on GitHub: check the first Actions run after merging). The e2e harness waits only for the `ui-border` texture; waiting for every art key would close a small race.
- **Toolkit follow-ups** (from the balance session): give the `expert` bot a stored-value term (Strength, Empowered, counters) so it can bound synergy decks; a synergy-seeking draft policy; card removal and shops in the run simulator; re-set the win-rate bands once real enemies exist.
- **UI follow-ups:** tags are not shown on card faces and live numbers cover damage only (both in progress on a branch, see above); the scene's event handling for `blockGained` on enemies / `damageDealt` on the player (audit R1) is untested by eye; touch/phone layouts are unchecked.
- **Proposed number tweaks** from the synergy analysis (`docs/balance/synergy-findings-2026-10.md` section 10) are waiting on real content; only the Tag A Echo once-per-turn fix was applied.
- **Deferred on purpose (do when needed, not before):** a `HeroDefinition` record (when the second hero starts).

---

## Working notes for Claude

- **Git and process:** the user relaxed gitflow ("commit to `main` and push" is fine; a push to `main` deploys the live site), and for session 3 told the orchestrating session to use its own judgement on everything except security, their computer's health and their data. Unattended work runs as subagents in local git worktrees under `.claude/worktrees/` (they are NOT cloud sessions and don't use the cloud credit; `gh` is not installed). Their rules are `docs/AUTOMATION.md`. Each works on `auto/<topic>`; the orchestrator merges through `integration/<wave>`, runs `npm run verify`, fixes interaction breakage (usually generic tests that assume old effect shapes), plays changed behaviour in a browser, then merges to `main`. `git worktree remove --force` finished agents' folders. Don't chain `verify && push` with `;` (a failed verify must stop the push).
- **Commit messages:** shell quoting is fragile here (a heredoc with apostrophes or several in one command has failed repeatedly in Git Bash, and PowerShell 5.1 mangles double quotes). Write the message to a file in the scratchpad (Write tool) and use `git commit -F <file>`. For multi-line file edits, prefer the Write/Edit tools over shell heredocs; if a Python script is needed, save it as a file and run it, and open files as UTF-8 (`encoding='utf-8'`).
- **Slow or flaky runs right after adding files:** OneDrive syncing the project folder made a `verify` and a browser test time out once (both passed on rerun). If a failure looks like a timeout and passes alone, rerun before digging.
- **Pushes:** a push to GitHub failed twice with an "Internal Server Error" once, then worked later; it was their side, not the commits.
- **Art tooling:** `python tools/prepareAssets.py` needs Pillow (`pip install pillow`); raw packs go in the git-ignored `assets/` folder at the repo root, not `public/`.
- **Node in PowerShell:** if `npm` isn't found, the shell's PATH is stale. Prefix commands with `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User');`
- **Dev server:** `npx vite` (run it in the background) → http://localhost:5173/ (`?dev` for the panel, `?seed=123` for a seed). Stop it afterwards (find the process on port 5173).
- **Simulator:** `npm run sim -- --runs 400` plays whole acts with a simple bot. Options: `--reward card|gold|best` (random card / always gold / the card that does best in trial fights), `--rest heal|smart`, `--path random|smart`, `--out file.json`, and `--compare a.json b.json` to see what changed between two results. `--fight enemy-b,enemy-d` runs the starter deck against given enemies. It builds with Vite's server build into `.sim/` (git-ignored). Read results as comparisons, not as how players would do. The per-card "win rate with it" is biased (longer runs collect more cards). First numbers on the placeholder act: the bot wins about a third of runs picking random cards, about 38% always taking gold, and about 76% picking cards by trial fights; the boss is the hardest fight.
- **Browser testing, easy way:** `npm run e2e` (Playwright, see `docs/E2E.md`) drives the real game with a virtual clock and fails on any console error. For interactive poking (claude-in-chrome) the notes below apply, plus: the first click on a fresh page only registers after a hover and a few stepped frames; editing a source file while the page is open hot-reloads and loses the page's state and helpers.
- **Browser testing by hand** (claude-in-chrome; whichever browser is connected):
  - The automated tab counts as *hidden*, so Chrome throttles it almost completely. Temporarily add `(window as unknown as { __game: Phaser.Game }).__game = game;` to `main.ts`, then step frames by hand from the page with `__game.step(t, 16)` in a loop (yield between steps with a `MessageChannel`). **Remove the hook before committing.** Real mouse clicks work, but the game only reacts after you step frames afterwards. The page layout (and so click coordinates) can shift between screenshots; re-check coordinates from a fresh screenshot.
  - The `?dev` panel's "Go to stop" is the fastest way to reach any screen. A HMR reload (editing a file while the page is open) loses the page's state and helpers.
  - Touch: temporarily set `input: { touch: true }` in the game config, then send synthetic `TouchEvent`s to the canvas.
  - Phone layouts: resizing the window doesn't work. Load the game in phone-sized `<iframe>`s instead.
  - Audio: Claude can't listen. Swap in `OfflineAudioContext`, render a sound, and measure its peak, loudness and length.
- **Testing rule (`CLAUDE.md`):** after any change to combat flow, actually play it in the browser, and say plainly what was played versus only unit-tested.
- **Design log:** append an entry to `DESIGN_LOG.md` for each real gameplay decision, under a `## Session N — date` heading.
- **`notes.md`** in the root is the user's (untracked). Leave it alone.
