# Session Handoff

Context for picking this project up in a fresh Claude Code session. Last updated **2026-10-07**.

Read order for a new session: `CLAUDE.md` (rules) → this file (where things stand) → `implementationplan.md` (scope) → `DESIGN_LOG.md` (why). This file is a snapshot. When it disagrees with those documents or the code, they win. Update this file at the end of each session.

---

## Where things stand

- **Live:** https://nxkgit.github.io/first-real-game/ (GitHub Pages; redeploys automatically on every push to `main`)
- **Repo:** https://github.com/nxkgit/first-real-game. Everything is merged and pushed, and `main` is the only branch.
- **Stage:** MVP 1 (a single fight) is **done**. MVP 2 (chained fights) has its **first build done**; see "Open decisions" for what's left.
- **Health:** `npm test` passes 35 tests, `npm run build` is clean, and the latest Pages deploy succeeded.

### What the game does today
- **The run:** a fixed path of fight → fight → rest stop → final fight. HP, deck and gold carry between stops. Losing ends the run; winning the last fight wins it. The end screen has a **New Run** button.
- **Combat** (Slay the Spire style):
  - draw 5 cards; 4 energy per turn
  - attack cards are **aimed** (drag them onto the enemy, or click the card and then the enemy); skills and powers play on click
  - the enemy's intent shows as an icon (sword/shield plus a number)
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
- **Content:** all placeholder (Enemy A/B/C, 7 reward-pool cards, every number). Real content is the user's to design.

---

## Code map (`src/`)

| Path | Role |
|---|---|
| `game/` | **Plain game logic, no Phaser.** `CombatState` (fight rules plus a typed event emitter), `Deck` (draw/discard/reshuffle), `RunState` (run progress, rewards, rest), `types.ts`. Unit-tested (`*.test.ts`). |
| `data/` | `tunables.ts` (**every balance number**), `cards.ts` (starter deck plus `REWARD_POOL`), `enemies.ts`, `run.ts` (the path, and `newRun()`) |
| `scenes/` | `BootScene` → `CombatScene` / `RewardScene` / `RestScene` / `RunEndScene`. `ui.ts` holds the shared pieces: card face, buttons, the floor/gold status line, deck viewer, `onKeyPress`, and `enterCurrentNode()` (**every screen change goes through it**). |
| `display.ts` | Fits the 800×600 layout to the window. **Every scene calls `useLayoutCamera(this)` first in `create()`.** |
| `audio/Sfx.ts` | Generated sound effects (Web Audio). |
| `.github/workflows/deploy-pages.yml` | Tests, builds with the `/first-real-game/` base path, and deploys to Pages. |

### Patterns to keep (each one fixed a real bug)
- **Logic emits events; the scene replays them as a queue.** `CombatScene.sequencer` buffers the events from one action and plays their animations in order. When the scene finally plays an animation, the game logic has already moved on, so **animations must use the event's own data, not live state**. Hand changes carry a snapshot for exactly this reason. Breaking this rule made the next hand appear before the enemy attacked.
- **Phaser reuses scene objects across restarts.** Reset every per-fight field in `init()`, not in field initializers.
- **Keys:** use `onKeyPress()` from `ui.ts`, never `this.input.keyboard`. Phaser's keyboard plugin re-sends earlier keys when several arrive in one frame.
- **Touch:** Phaser fires "over" when a finger lands and "out" when it lifts. Tooltips handle this (see `buildTooltips`).
- **TypeScript config:** `erasableSyntaxOnly` is on, so no constructor parameter properties (`constructor(private x)`).

---

## Open decisions (the user's to make)

These are gameplay and creative calls. Per `CLAUDE.md`, ask rather than pick.

1. **The shop.** Contents, prices, and how much gold is worth against a card. Until it exists, taking gold is strictly worse than a card.
2. **Events** beyond the rest stop: narrative events, other stop types.
3. **More status effects** (Weak / Vulnerable / Strength; the plan says MVP 2).
4. **A branching map** instead of the fixed linear path.
5. **Real content:** hero identity, cards, enemies, art, and the balance numbers (all placeholders now).
6. **Saving a run across a page refresh** (affects how losing a run feels).
7. **A real phone-upright layout**, instead of the "turn sideways" message.

## Next steps that don't need decisions

- **Split up `CombatScene.ts`** (~1,100 lines): move targeting, tooltips and the status displays into their own files. Changes nothing in the game.
- **Faster first load:** split Phaser into its own bundle chunk (the build warns about one 1.4 MB file).
- **Test on a real phone.** Touch was only tested with simulated events.

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
