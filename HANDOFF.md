# Session Handoff

Context for picking this project up in a fresh Claude Code session. Last updated **2026-10-07** (end of session 2).

Read order for a new session: `CLAUDE.md` (rules) → this file (where things stand) → `implementationplan.md` (scope) → `DESIGN_LOG.md` (why). This file is a snapshot. When it disagrees with those documents or the code, they win. Update this file at the end of each session.

---

## Where things stand

- **Live:** https://nxkgit.github.io/first-real-game/ (GitHub Pages; redeploys automatically on every push to `main`)
- **Repo:** https://github.com/nxkgit/first-real-game. Everything is merged and pushed, and `main` is the only branch.
- **Stage:** MVP 1 (a single fight) is **done**. MVP 2 (chained fights) has its **first build done**; see "Open decisions" for what's left.
- **Health:** `npm test` passes 72 tests and `npm run build` is clean (on the `architecture` branch).
- **Unmerged local work (session 2), three stacked branches, nothing pushed:** `status-effects` (Weak/Vulnerable/Strength) -> `shop-draft` (a rough shop screen and a shop stop on the path; a visual only, drop it if unwanted) -> `architecture` (multiple enemies per fight, shared effects for cards and enemy moves, generated card text, card registry, `CombatScene` split). `main` still has none of this, so the live site is the old build. To publish all of it: merge `architecture` (it contains the other two).

### What the game does today
- **The run:** a fixed path of fight → fight → rest stop → final fight. HP, deck and gold carry between stops. Losing ends the run; winning the last fight wins it. The end screen has a **New Run** button.
- **Statuses:** Weak (-25% damage dealt), Vulnerable (+50% damage taken), Strength (+N per hit). Timed ones count down at the end of each round, and one an enemy puts on you skips that round's countdown. Shown as lettered badges with tooltips.
- **Combat** (Slay the Spire style):
  - draw 5 cards; 4 energy per turn
  - attack cards are **aimed** (drag them onto the enemy, or click the card and then the enemy); skills and powers play on click
  - fights can have several enemies; each shows an intent: sword plus total damage, shield plus block, and generic buff/debuff arrows (it does not say which status)
  - **turn order on screen:** discard → enemy acts → draw
- **Rewards:** after each win except the last, pick 1 of 3 cards **or** take 25 gold. Gold is saved but has nothing to buy yet.
- **Rest stop:** heals 30% of max HP (capped at max).
- **Interface:**
  - hover tooltips (tap on touch screens)
  - draw/discard pile counts
  - a **Deck (N)** viewer button
  - keys: `1`–`9` play a card, `E` ends the turn, `D` opens the deck, `Esc` cancels; `1`–`3`/`G` on the reward screen
- **Display:** fits any window size at full device resolution (the user's PC runs at 175% scaling). Phones held upright see a "turn sideways" message.
- **Sound:** fantasy-styled sound effects (bells, harp, whooshes, hall reverb), generated in code with no audio files.
- **Content:** all placeholder (Enemies A/B/C/D, 11 reward-pool cards, every number). Fight 2 is Enemy B plus Enemy D to exercise multi-enemy fights. Real content is the user's to design.

---

## Code map (`src/`)

| Path | Role |
|---|---|
| `game/` | **Plain game logic, no Phaser.** `CombatState` (fight rules plus a typed event emitter; holds `player` and `enemies[]` as `Combatant`s with ids `'player'`, `'enemy-0'`, ...), `Deck`, `RunState` (run progress, rewards, rest, draft shop), `types.ts` (the shared `Effect` type used by cards **and** enemy moves), `describe.ts` (card text generated from effects), `intent.ts` (intent icons derived from a move's effects). Unit-tested (`*.test.ts`). |
| `data/` | `tunables.ts` (**every balance number**), `cards.ts` (cards, the `CARDS` registry, `getCard(id)`, `rewardPoolFor(heroId)`, starter deck), `enemies.ts`, `statuses.ts` (status definitions with damage-modifier hooks), `run.ts` (the path, and `newRun()`) |
| `scenes/` | `BootScene` → `CombatScene` / `RewardScene` / `RestScene` / `ShopScene` (draft) / `RunEndScene`. `ui.ts` holds the shared pieces: card face, buttons, the floor/gold status line, deck viewer, `onKeyPress`, and `enterCurrentNode()` (**every screen change goes through it**). |
| `scenes/combat/` | Pieces of the fight screen: `EnemyView` (one per enemy), `PlayerView`, `Targeting` (card aiming), `Tooltips`, `StatusRow`, `drawings.ts` (placeholder art), `layout.ts` (positions; `enemySlots(n)`). `CombatScene` itself is just wiring, the hand, and the animation queue. |
| `display.ts` | Fits the 800×600 layout to the window. **Every scene calls `useLayoutCamera(this)` first in `create()`.** |
| `audio/Sfx.ts` | Generated sound effects (Web Audio). |
| `.github/workflows/deploy-pages.yml` | Tests, builds with the `/first-real-game/` base path, and deploys to Pages. |

### Patterns to keep (each one fixed a real bug)
- **Cards and enemy moves are lists of `Effect`s.** To add an effect kind, extend the `Effect` union in `types.ts`, handle it in `CombatState` (card path `applyCardEffect`, enemy path `runEnemyMove`), and add its text in `describe.ts`. Card text and intent icons are derived; don't hand-write them. Each card needs `owner` and `inRewardPool`; a test checks that aimed cards are declared `target: 'enemy'`.
- **Logic emits events; the scene replays them as a queue.** `CombatScene.sequencer` buffers the events from one action and plays their animations in order. When the scene finally plays an animation, the game logic has already moved on, so **animations must use the event's own data, not live state**. Hand changes carry a snapshot for exactly this reason. Breaking this rule made the next hand appear before the enemy attacked.
- **Phaser reuses scene objects across restarts.** Reset every per-fight field in `init()`, not in field initializers.
- **Keys:** use `onKeyPress()` from `ui.ts`, never `this.input.keyboard`. Phaser's keyboard plugin re-sends earlier keys when several arrive in one frame.
- **Touch:** Phaser fires "over" when a finger lands and "out" when it lifts. Tooltips handle this (see `buildTooltips`).
- **TypeScript config:** `erasableSyntaxOnly` is on, so no constructor parameter properties (`constructor(private x)`).

---

## Open decisions (the user's to make)

These are gameplay and creative calls. Per `CLAUDE.md`, ask rather than pick.

1. **The shop.** A draft screen exists (flat 40-gold cards). Contents, prices, and how much gold is worth against a card are undecided. Until it is real, taking gold is strictly worse than a card.
2. **Events** beyond the rest stop: narrative events, other stop types.
3. **Hero abilities:** the user wants each hero to have one ability usable once per turn. Not built; wait for the second hero or a design.
4. **Status cards** that enemies put into the player's deck (user's idea, later).
5. **A branching map** instead of the fixed linear path.
6. **Real content:** hero identity, cards, enemies, art, and the balance numbers (all placeholders now).
7. **Saving a run across a page refresh.** Easier now that cards have ids (`getCard`), but `RunState` still holds card objects.
8. **A real phone-upright layout**, instead of the "turn sideways" message.
9. **Keyboard play with several enemies:** number keys aim at the first living enemy. Fine for now; revisit if keyboard play matters.

## Next steps that don't need decisions

- **Deferred on purpose (do when needed, not before):** an effect registry (once there are ~8 effect kinds), a `HeroDefinition` record (when the second hero starts), rarity tiers.
- **Faster first load:** split Phaser into its own bundle chunk (the build warns about one 1.4 MB file).
- **Test on a real phone.** Touch was only tested with simulated events. Not re-checked after the `CombatScene` split (tooltips and targeting were moved, not changed).

---

## Working notes for Claude

- **Git:** the user pushes. Auto mode blocks Claude from pushing to the public repo, so commit locally and give the user the `git push` command. Branch first; never commit straight to `main`, and check the current branch before committing, since the user switches branches between turns.
- **Commit messages:** PowerShell 5.1 mangles double quotes inside here-strings passed to `git commit -m`. Write the message to a file in the scratchpad and use `git commit -F <file>` (the scratchpad folder may need `mkdir -p` first).
- **Node in PowerShell:** if `npm` isn't found, the shell's PATH is stale. Prefix commands with `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User');`
- **Dev server:** `npx vite` (run it in the background) → http://localhost:5173/
- **Browser testing** (claude-in-chrome; the user picked **"Browser 2" (Windows)**):
  - The automated tab counts as *hidden*, so Chrome throttles it almost completely. Temporarily add `(window as unknown as { __game: Phaser.Game }).__game = game;` to `main.ts`, then step frames by hand from the page with `__game.step(t, 16)` in a loop. Yield between steps with a `MessageChannel`, because `setTimeout` is throttled too. **Remove the hook before committing.**
  - The first click or key press after loading a page is used up by browser focus; click an empty spot first.
  - Touch: temporarily set `input: { touch: true }` in the game config, then send synthetic `TouchEvent`s to the canvas.
  - Phone layouts: resizing the window doesn't work. Load the game in phone-sized `<iframe>`s instead.
  - Audio: Claude can't listen. Swap in `OfflineAudioContext`, render a sound, and measure its peak, loudness and length.
- **Testing rule (`CLAUDE.md`):** after any change to combat flow, actually play it in the browser, and say plainly what was played versus only unit-tested.
- **Design log:** append an entry to `DESIGN_LOG.md` for each real gameplay decision, under a `## Session N — date` heading.
- **`notes.md`** in the root is the user's (empty, untracked). Leave it alone.
