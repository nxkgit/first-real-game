# Session Handoff

Context for picking this project up in a fresh Claude Code session. Last updated **2026-10-07** (end of session 2).

Read order for a new session: `CLAUDE.md` (rules) → this file (where things stand) → `implementationplan.md` (scope) → `DESIGN_LOG.md` (why). This file is a snapshot. When it disagrees with those documents or the code, they win. Update this file at the end of each session.

---

## Where things stand

- **Live:** https://nxkgit.github.io/first-real-game/ (GitHub Pages; redeploys automatically on every push to `main`). Add `?dev` for the dev panel, `?seed=123` to pick a seed. The content browser is at `/content.html` on the same site.
- **Repo:** https://github.com/nxkgit/first-real-game. `main` is the live branch. The older feature branches (`status-effects`, `shop-draft`, `architecture`, `playtest-tooling`) are all merged into it and can be deleted.
- **Stage:** MVP 1 (one fight) and MVP 2 (chained fights) are done. Session 2 went on to build a **one-act demo**: a branching map of fights, elites, rests, shops and events leading to a boss. See "What the game does today".
- **Health:** `npm test` passes 132 tests and `npm run build` is clean.

### What the game does today
- **The run is one act.**
  - A seeded, branching map (13 floors: 12, then the boss). Pick one of the glowing stops to go there; the map tracks where you've been.
  - Stop kinds: fight (F), elite (E), rest (R), shop ($, still the draft), event (?), boss (B). Floor rules: floor 1 is always fights, the floor before the boss is always a rest, elites and rests appear from floor 5, shops from floor 4, and elites/rests/shops never come twice in a row on a path.
  - Losing ends the run. Beating the boss wins the act ("ACT COMPLETE").
- **Fights** (Slay the Spire style):
  - draw 5 cards; 4 energy per turn
  - attack cards are **aimed** (drag them onto an enemy, or click the card and then the enemy); skills and powers play on click
  - fights can have several enemies (up to 3 laid out); each shows an intent: sword plus total damage, shield plus block, and generic buff/debuff arrows (it does not say which status)
  - elites and the boss are drawn larger and announce themselves with a banner
  - **turn order on screen:** discard → enemy acts → draw
  - click the draw or discard pile to see what's in it
- **Statuses:** Weak (-25% damage dealt), Vulnerable (+50% damage taken), Strength (+N per hit). Timed ones count down at the end of each round, and one an enemy puts on you skips that round's countdown.
- **Rewards:** after a normal win, pick 1 of 3 cards **or** take 25 gold. An elite gives 40 gold instead and also drops a **relic** (it comes with either choice). The boss gives nothing: the act is won.
- **Rest stop:** heal 30% of max HP, **or upgrade one card** (you see the card next to its upgraded version first). Upgraded cards are named `<card>+` with a green name.
- **Relics:** permanent, shown as small lettered badges under the top status line (hover or tap for the text). Five placeholders: +1 Strength at combat start, +10 max HP, 6 block at combat start, heal 4 after each win, draw 1 extra card each turn.
- **Events:** text plus choices; each choice shows what it will do. Outcomes: gain/lose gold or HP, max HP, a card, a random card, a relic, or a fight. Four placeholders.
- **Shop (draft):** four cards at a flat 40 gold. Labelled DRAFT; contents and pricing are undecided.
- **Run persistence:** the run saves at every stop (and after an event choice is made); the next visit offers Continue or New Run. A fight in progress restarts from its start (same shuffle, so refreshing can't reroll it). The end screen shows the seed and a "Copy run report" button.
- **Settings** (bottom-right button, remembered): volume, sound on/off, animation speed (1x/1.5x/2x), screen shake on/off.
- **Interface:** hover tooltips (tap on touch screens), a **Deck (N)** viewer, keys `1`–`9` play a card, `E` ends the turn, `D` opens the deck, `Esc` cancels/closes. The user said keyboard targeting with several enemies can stay as is (number keys aim at the first living enemy).
- **Display:** fits any window size at full device resolution. Phones held upright see a "turn sideways" message.
- **Sound:** fantasy-styled sound effects, generated in code with no audio files.
- **Content:** all placeholder (enemies A–D, two elites, a boss, 11 reward cards each with an upgrade, 5 relics, 4 events, every number). Real content is the user's to design.

---

## Code map (`src/`)

| Path | Role |
|---|---|
| `game/` | **Plain game logic, no Phaser.** `CombatState` (fight rules plus a typed event emitter; `player` and `enemies[]` are `Combatant`s with ids `'player'`, `'enemy-0'`, ...; options for seeded shuffles and relics), `Deck`, `RunState` (the act: map position, HP/deck/relics/gold, rewards, rest, shop, events), `actMap.ts` (seeded map generator), `types.ts` (the shared `Effect` type used by cards **and** enemy moves, relic and event types), `describe.ts` (card, relic and event-outcome text generated from the data), `intent.ts`, `rng.ts`, `save.ts`, `runReport.ts`. Unit-tested (`*.test.ts`; `testHelpers.ts` builds small test worlds). |
| `data/` | `tunables.ts` (**every balance number**, including the map rules), `cards.ts` (cards, upgrades, the `CARDS` registry, `getCard`, `upgradedVersion`, `rewardPoolFor`, starter deck), `enemies.ts`, `relics.ts`, `events.ts`, `statuses.ts`, `run.ts` (the act's content lists, `RUN_WORLD`, `newRun()`) |
| `scenes/` | `BootScene` → `MapScene` → `CombatScene` / `RewardScene` / `RestScene` / `ShopScene` / `EventScene` → … → `RunEndScene`. `ui.ts` holds the shared pieces: card face, buttons, the status line and relic bar, the card-list viewer (deck and piles), the settings panel, and `enterCurrentNode()` (**every screen change goes through it**; it also saves the run). |
| `scenes/combat/` | Pieces of the fight screen: `EnemyView` (one per enemy), `PlayerView`, `Targeting`, `Tooltips`, `StatusRow`, `drawings.ts`, `layout.ts`. `CombatScene` itself is wiring, the hand, and the animation queue. |
| `storage.ts`, `session.ts`, `settings.ts` | Guarded browser storage (save, report history, clipboard), the current-run holder, and player settings. |
| synergy engine (`game/` + `data/`) | Scaling, triggers, Empowered, exhaust and the new effects live in `CombatState` (`fireTriggers`, `scaledValue`), `Deck.exhaustPile` and `describe.ts`. Placeholder cards: `data/synergyCards.ts` (not in the reward pool); helper `allDraftableCards()` in `data/cards.ts`. Guide: `docs/SYNERGY_ENGINE.md`. Built unattended: **not played in a browser**. |
| `dev/devPanel.ts` | The `?dev` panel (a separate chunk, loaded only with that flag): jump to any stop, custom fights, **kill all enemies instantly**, add cards/relics, gold/HP, seeded new run, copy reports. |
| `content/` | The content browser page (`content.html` at the project root): every card, relic, enemy, status, event, and the act's settings, with Markdown/CSV copy. |
| `sim/` | Headless simulator: `bot.ts` (greedy player), `simulate.ts`, `cli.ts`. |
| `display.ts` | Fits the 800×600 layout to the window. **Every scene calls `useLayoutCamera(this)` first in `create()`.** |
| `audio/Sfx.ts` | Generated sound effects (Web Audio); follows the volume/mute settings. |
| `vite.config.ts` | Two pages: the game and the content browser. |
| `.github/workflows/deploy-pages.yml` | Tests, builds with the `/first-real-game/` base path, and deploys to Pages. |

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
- **TypeScript config:** `erasableSyntaxOnly` is on, so no constructor parameter properties (`constructor(private x)`).

---

## Decisions already made (don't re-ask)

- **No server or database for now.** The game is a static site: content is in `src/data/`, a player's run lives in their browser. If cloud saves, accounts, leaderboards or central playtest reports are ever wanted, look at the most cost-effective option then (the user's words). The smallest step up would be a way for playtest reports to arrive without being copied by hand.
- **Keyboard targeting with several enemies stays as is** (number keys aim at the first living enemy; mouse picks any).
- **Git flow is relaxed for now:** commit to `main` and push.
- **Phone layout and load-speed work are skipped for now.**

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

## Next steps that don't need decisions

- **Faster first load:** Phaser is now its own chunk (`vite.config.ts`, `rolldownOptions.output.codeSplitting`), so game updates don't bust its cache. First-load size is unchanged (~357 KB gzip for Phaser); the build still warns because Phaser alone is over 500 KB. Note: Vite 8 ignores `rollupOptions` when `rolldownOptions` is set, so the two-page `input` lives in `rolldownOptions` too. Only build-, test- and curl-checked (chunks and `content.html` serve), not played in a browser.
- **Test on a real phone.** Touch was only tested with simulated events, and not at all since the act, map and settings were added.
- **Use the simulator** (below) when numbers change, to see what they did.
- **Deferred on purpose (do when needed, not before):** an effect registry (once there are ~8 effect kinds), a `HeroDefinition` record (when the second hero starts).

---

## Working notes for Claude

- **Git:** the user said, for now, not to worry about gitflow: committing straight to `main` and pushing is fine (a push to `main` deploys the live site). If that changes, go back to branching and giving the user the push command. Check the current branch before committing.
- **Commit messages:** shell quoting is fragile here (a heredoc with apostrophes or several in one command has failed repeatedly in Git Bash, and PowerShell 5.1 mangles double quotes). Write the message to a file in the scratchpad (Write tool) and use `git commit -F <file>`. For multi-line file edits, prefer the Write/Edit tools over shell heredocs; if a Python script is needed, save it as a file and run it, and open files as UTF-8 (`encoding='utf-8'`).
- **Node in PowerShell:** if `npm` isn't found, the shell's PATH is stale. Prefix commands with `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User');`
- **Dev server:** `npx vite` (run it in the background) → http://localhost:5173/ (`?dev` for the panel, `?seed=123` for a seed). Stop it afterwards (find the process on port 5173).
- **Simulator:** `npm run sim -- --runs 400` plays whole acts with a simple bot. Options: `--reward card|gold|best` (random card / always gold / the card that does best in trial fights), `--rest heal|smart`, `--path random|smart`, `--out file.json`, and `--compare a.json b.json` to see what changed between two results. `--fight enemy-b,enemy-d` runs the starter deck against given enemies. It builds with Vite's server build into `.sim/` (git-ignored). Read results as comparisons, not as how players would do. The per-card "win rate with it" is biased (longer runs collect more cards). First numbers on the placeholder act: the bot wins about a third of runs picking random cards, about 38% always taking gold, and about 76% picking cards by trial fights; the boss is the hardest fight.
- **Browser testing** (claude-in-chrome; whichever browser is connected):
  - The automated tab counts as *hidden*, so Chrome throttles it almost completely. Temporarily add `(window as unknown as { __game: Phaser.Game }).__game = game;` to `main.ts`, then step frames by hand from the page with `__game.step(t, 16)` in a loop (yield between steps with a `MessageChannel`). **Remove the hook before committing.** Real mouse clicks work, but the game only reacts after you step frames afterwards. The page layout (and so click coordinates) can shift between screenshots; re-check coordinates from a fresh screenshot.
  - The `?dev` panel's "Go to stop" is the fastest way to reach any screen. A HMR reload (editing a file while the page is open) loses the page's state and helpers.
  - Touch: temporarily set `input: { touch: true }` in the game config, then send synthetic `TouchEvent`s to the canvas.
  - Phone layouts: resizing the window doesn't work. Load the game in phone-sized `<iframe>`s instead.
  - Audio: Claude can't listen. Swap in `OfflineAudioContext`, render a sound, and measure its peak, loudness and length.
- **Testing rule (`CLAUDE.md`):** after any change to combat flow, actually play it in the browser, and say plainly what was played versus only unit-tested.
- **Design log:** append an entry to `DESIGN_LOG.md` for each real gameplay decision, under a `## Session N — date` heading.
- **`notes.md`** in the root is the user's (untracked). Leave it alone.
