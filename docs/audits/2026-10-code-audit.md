# Code audit, 2026-10-07

Audit of `main` at `ca76074`. Read-only: no source, config or test file was changed. Findings are ranked by severity inside each section.

**Method.** I read every file under `src/` plus `index.html`, `content.html`, `vite.config.ts`, `tsconfig.json`, `package.json`, `Dockerfile` and the two workflows. `npm run verify` passes (132 tests, build clean). For correctness findings I wrote throwaway Vitest scripts (kept outside the repo, not committed) and marked each finding:

- **confirmed by execution**: a script produced the wrong behaviour.
- **by reading only**: reasoned from the code; not run (scene/Phaser code cannot be run headless here).

Things I looked for and could **not** substantiate (so they are not findings): map generator invariants over 3000 seeds (no dead ends, no enemy-less nodes, rule violations, or non-rest pre-boss floor); save/restore lockstep over 60 seeds / 1183 steps (a restored run stays byte-identical to an uninterrupted one); 300 simulated runs all finish; float-order dependence in `calcDamage` for the current multipliers; hidden `Math.random`/`Date.now` in game logic (only the defaults noted below, plus cosmetic uses in `Sfx.ts` and `drawings.ts`); `this.input.keyboard` use; constructor parameter properties (the compiler forbids them).

Severity: **high** = wrong behaviour players hit now; **medium** = wrong in reachable cases or will bite soon; **low** = edge case or tamper-only; **nit** = polish.

---

## 1. Correctness bugs in game logic

### C1. [medium, confirmed by execution] Combat-start block relics are wiped before the first turn
`src/game/CombatState.ts:108-114` and `:211-216`.
`start()` applies each relic's `onCombatStart` effects, then calls `startPlayerTurn(true)`, which does `this.player.block = 0` (line 214). The Guard Token ("At the start of each fight, gain 6 block") therefore emits `blockGained` (the player sees "+6" and the shield) and then the block is zeroed before any enemy acts.
Scenario: deck of 10 cards, `relics: [guard-token]`, call `start()`. Event total = 6, `player.block` after start = 0. The existing test (`relicsAndUpgrades.test.ts:31-36`) only checks the event order, so it passes.
Note the readout stays wrong until the first `refreshStatusBars`, so the player may see block that is not real.
Fix sketch: apply `onCombatStart` effects after the block reset (move the reset into the constructor/`start()` and drop it from the first `startPlayerTurn`), or have `startPlayerTurn(true)` skip the reset. Add a test that asserts `player.block === 6` after `start()`.
Synergy-engine conflict: **yes** (CombatState, relics).

### C2. [medium, confirmed by execution; design question] Power cards recycle and stack
`src/game/CombatState.ts:183-185`, `src/game/Deck.ts:43-49`.
A played power goes to the discard pile like any card, and pushes onto `activePowers` each time it is played. After a reshuffle it can be drawn and played again, so its effect doubles.
Scenario: one-card deck holding a Strength +2 power at cost 0. Four turns of "play it, end turn" gives Strength 8 (and a per-turn `onTurnStartEffect` power would fire once per copy played). In StS a power leaves the deck for the rest of the combat. `implementationplan.md` says exhaust is deferred and `DESIGN_LOG.md` never decides what happens to powers, so this is a **question for the user**, not a plain bug. The simulator bot (`sim/bot.ts:20`, score 100 for every power) plays them every time they appear, so sim numbers include this.
Fix sketch (if the answer is "once per fight"): do not push a played power to the discard pile (or add an `exhaust` flag on card data and handle it in `Deck.playCard`), which is also the hook the synergy engine will want.
Synergy-engine conflict: **yes**.

### C3. [medium, confirmed by execution] The hand has no size cap, and the layout overflows past 7 cards
`src/game/Deck.ts:30-41` (no cap) and `src/scenes/CombatScene.ts:406-411`.
A deck of 40 "draw 3" cards reaches a 15-card hand. `syncHand` lays cards out at `CARD_WIDTH + 10` = 120 px each centered on x=400, so 7 cards already reach beyond the 800 px screen, and 8+ cards put card centers off screen and over the draw/discard piles (x=40 and x=760). The `1`-`9` keys cannot reach cards 10+. Reachable today with the Draw Token relic (6 cards) plus Focus and Quick Draw. StS caps the hand at 10 and discards the overflow.
Fix sketch: add a `MAX_HAND_SIZE` tunable; in `Deck.draw` stop (or discard) at the cap; in `syncHand` compress the step (`min(CARD_WIDTH + 10, 640 / hand.length)`).
Synergy-engine conflict: **yes** (CombatState/Deck/tunables), and draw-heavy synergies make it far more likely.

### C4. [low, confirmed by execution; semantics to confirm] An enemy re-applying a status you already have skips the whole stack's countdown
`src/game/CombatState.ts:269-273` and `:329-341`.
`freshStatuses` is keyed on `combatant:status`, so adding 1 Weak to a player who already has Weak 2 gives Weak 3 and no tick this round (confirmed: 3, where a "only the new application is fresh" reading gives 2). Effect: overlapping debuffs last a round longer than expected. Current enemy patterns rarely overlap (Elite B applies Weak 1 every 3 moves), so it is dormant. Decide the intended rule; if only new stacks are fresh, track fresh *amounts* rather than a flag.
Synergy-engine conflict: **yes** (statuses).

### C5. [low, confirmed by execution] `restoreRun` accepts saves that crash or break the game later
`src/game/save.ts:12-60`, `src/game/RunState.ts:453-483`.
`parseSavedRun` validates shapes but not the cross-field rules. These all restore successfully (confirmed):
- `phase: 'reward'` with `pendingReward: null` -> `RewardScene` throws "no pending reward".
- a combat/elite/boss node with `enemies: []` or missing `enemies` -> entering it throws `a fight needs at least one enemy` (confirmed) or builds an empty fight.
- `hp` above `maxHp`, `hp: 0` while on the map, a node `lane` outside the map's `lanes`.
- `history` entries of any shape (they are later re-serialised into the run report), and `eventFight.after` entries of any shape (applied later via `applyOutcome`).
Only reachable by editing localStorage by hand, or by a future version bump that forgets to reject old shapes, so low. Fix sketch: after `fromSaved`, run a `validateRun(run)` that checks `hp <= maxHp`, reward/phase consistency, non-empty enemies for fight nodes, event ids present on event nodes, and `history[i].kind` in the known set; return null on failure. Also drop the whole save (not just this field) on failure, which it already does.
Synergy-engine conflict: **maybe** (`SavedRun` shape if cards/relics gain fields; bump `version`).

### C6. [low, by reading only] An event with outcomes before a `fight` drops its message lines and notice
`src/game/RunState.ts:364-373`, `src/scenes/EventScene.ts:391-394`.
`chooseEventOption` applies outcomes before a `fight` outcome and returns their `lines`, but `EventScene` goes straight to the fight when `fighting` is true and never shows them. None of the four placeholder events puts an outcome before a fight, so it is latent. Fix sketch: push those lines onto `this.notice` (shown on the map after the fight) or show them first.

### C7. [low, by reading only] A notice is shown again after a refresh
`src/scenes/MapScene.ts:122-123`, `src/game/RunState.ts:393-397`.
`takeNotice()` clears the in-memory list, but the save written by `enterCurrentNode` just before the scene started still contains it. Refresh on the map and the "Gained X" banner reappears. Cosmetic. Fix sketch: `saveRun` again after `takeNotice` (or make `takeNotice` the saver).

### C8. [low, by reading only] Loss-then-refresh retries the same fight with the same shuffle
`src/scenes/ui.ts:328-347`, `src/scenes/CombatScene.ts:623-626`.
The save is written when a node is entered and only replaced at the next `enterCurrentNode`. After "DEFEAT" appears (before pressing Continue), refreshing and choosing Continue restores the pre-fight state with the identical shuffle (the fight's seed comes from the run's stream at the saved position). HANDOFF documents that refreshing "can't reroll", but it also means a loss can be retried knowing the opponent's pattern and your draws. Low, a design call: if unwanted, write a `lost` marker/save immediately in `combatEnded`.

### C9. [low, by reading only] `finishCombat`'s `floor` and event-fight tier
`src/game/RunState.ts:150-153`. An event fight is always reported as tier `normal` even if it is against elite or boss enemies, so run reports and the sim's `byTier` stats will mislabel it. Fix: let `EventFight` carry an optional tier.

### C10. [low, by reading only] Unseeded defaults in the logic layer
`src/game/CombatState.ts:94`, `src/game/Deck.ts:17`, `src/game/RunState.ts:127`.
`random` defaults to `Math.random` in `CombatState`/`Deck`, and `RunState` defaults its rng to `randomSeed()`. All production callers pass a seeded stream, so there is no leak today, but a future caller that forgets `random` silently breaks determinism (CLAUDE/AUTOMATION rule 8). Fix sketch: make `random` required in `CombatOptions` (tests already pass one or can use a helper), or default to a fixed-seed `Rng` rather than `Math.random`.
Synergy-engine conflict: **yes** (CombatState/Deck).

### C11. [nit, by reading only] Other small logic points
- `CombatState.nextMove` (`:126-129`) divides by `pattern.length`; an enemy with an empty `movePattern` makes `NaN` indexing and a crash. A data test ("every enemy has at least one move") would catch it.
- `CombatState.start()` is not guarded against a second call (it would run relic start effects and the first turn twice).
- `applyRunEffects` `maxHp` branch (`RunState.ts:504-506`): the heal-on-gain uses `Math.max(0, value)` but the event outcome text says "Lost N max HP" with the unclamped value when `maxHp` was already at the floor of 1. Trivial.
- Event outcomes `hp` with a positive value say "Healed 0 HP." at full HP (`RunState.ts:527-528`).
- `Deck` card instance ids come from a module-level counter (`Deck.ts:3-6`), so ids differ between a fresh page and a long session. Only matters if ids are ever saved or compared across fights; today they are not.
- `EventEmitter` has no `off` and one throwing listener aborts the game action mid-way (e.g. inside `playCard`, after energy is spent). Scenes currently throw only on programmer error.
- `playRun`'s shop shuffle (`sim/simulate.ts:186`) uses `sort(() => rng.next() - 0.5)`: biased and implementation-defined ordering, so a Node upgrade could change seeded sim output. Use a Fisher-Yates with `botRng`.
- `sim/cli.ts:111-112`: `--runs abc` or `--seed abc` becomes `NaN` and silently produces an empty/NaN summary; validate with `Number.isInteger`.

---

## 2. Violations of HANDOFF "Patterns to keep"

Overall the patterns are followed well. Verified clean: no `this.input.keyboard` (all scenes use `onKeyPress`, which removes its listener on SHUTDOWN); no constructor parameter properties; every scene resets its per-run/per-fight fields in `init()` (CombatScene, MapScene, RewardScene, RestScene, ShopScene, EventScene); every scene calls `useLayoutCamera` first in `create()`; `Math.random` is not used for gameplay. Violations:

### P1. [low, by reading only] Animations read live combat state
The rule is "animations use the event's own data". Three places still read live state:
- `src/scenes/CombatScene.ts:576` `animateEnemyImpact` sets the enemy's block from `this.combat.combatant(target).block`. For a card with two damage effects (or any future multi-hit), the first impact replays after both hits resolved and shows the final block. `damageDealt` has `absorbed` but no resulting block. Fix: add `blockAfter` to `DamageResult`/`damageDealt` and use it.
- `src/scenes/CombatScene.ts:420` `syncHand` calls `this.combat.canPlay(card)` for each card of an *old* snapshot, using live energy and phase. Harmless today (energy changes only on card play and turn start, and each action's snapshots share the energy at replay time), but an "add energy" or "cost reduction" effect would grey out or enable cards wrongly. Fix: put `energy` in the `handChanged` snapshot.
- `src/scenes/CombatScene.ts:565` `animateEnemyMove` ends with `this.combat.phase === 'playerTurn'` (live) and `showIntent` reads the live next move. Correct by accident today.
Synergy-engine conflict: **yes** (events and CombatState shape).

### P2. [low, by reading only] `ShopScene` bypasses `enterCurrentNode`
`src/scenes/ShopScene.ts:111-114`: after a purchase it calls `saveRun` then `this.scene.restart(...)` directly. It is the same scene and it does save, so no bug, but it is the one transition outside the "every screen change goes through `enterCurrentNode()`" rule. Cleaner: redraw in place, or route through `enterCurrentNode`.

### P3. [low, by reading only] Ctrl/Alt/Cmd plus a letter or digit triggers game keys
`src/scenes/ui.ts:89-98` `onKeyPress` ignores typing in form fields and held keys but not modifier chords. Ctrl+1..9 (switch browser tab) also plays that card; Ctrl+D (bookmark) opens the deck; Ctrl+E ends the turn. Fix: `if (event.ctrlKey || event.metaKey || event.altKey) return;`.

---

## 3. Scene-layer robustness

Checked: listener and timer cleanup on restart. `onKeyPress`, `useLayoutCamera`, the settings listener and `setCurrentCombat` all remove themselves on SHUTDOWN. Scene `input.on(...)` handlers (Targeting, Tooltips, relic bar) are not removed by hand; Phaser's input plugin clears its listeners on shutdown, so I found no leak (by reading, not by running a browser). Pending tween/delay promises from a shut-down scene never resolve, so nothing keeps running in a dead scene.

### R1. [medium, by reading only] Player damage and non-enemy events are silently dropped by the scene
`src/scenes/CombatScene.ts:294-296`, `:298-300`.
`damageDealt` is ignored when `target === PLAYER_ID`, and `blockGained` is ignored for enemies. Today the player is only hurt via `enemyMoveResolved`, so nothing is missed. Synergy work is likely to add self-damage, retaliation, or damage to the player from a card. Those will change HP with no animation, sound or floating number until the next `refreshStatusBars`. Fix sketch: handle the player branch (flash, shake, `-N` text) and make event handling exhaustive so a new event cannot be forgotten.
Synergy-engine conflict: **yes**.

### R2. [medium, by reading only] Status badges are limited to three and must be updated by hand
`src/data/statuses.ts:37`, `src/scenes/combat/EnemyView.ts:98`, `src/scenes/combat/PlayerView.ts:64`.
`STATUS_ORDER` is a hand-maintained list; a status added to `STATUSES` and the `StatusId` union but not to `STATUS_ORDER` is applied by the rules but never drawn. The tooltip zones are hard-coded to 3 slots, so a fourth badge draws with no tooltip and the row can overlap the neighbouring enemy. Fix sketch: derive the order from `Object.keys(STATUSES)` (or add a test that every id is in the order), and size the tooltip zones from the number of visible badges.
Synergy-engine conflict: **yes** (statuses).

### R3. [low, by reading only] An exception in an animation step leaves input locked forever
`src/scenes/CombatScene.ts:326-332`, `:370-402`. `runSteps` and `resolveCardPlay` have no try/finally, so a throw (for example `viewFor` for an unknown id) leaves `inputLocked` true and End Turn disabled until reload. Fix sketch: try/finally that unlocks, and log the error.

### R4. [low, by reading only] Hover-tween vs sync race on the enemy HP bar
`src/scenes/combat/EnemyView.ts:110-135`. `setHp` starts a 300 ms width tween; `syncFrom` (end of each batch) sets `hpFill.width` directly while it may still run, so the tween can overwrite the correct value briefly. Cosmetic; kill the tween in `syncFrom`.

### R5. [low, by reading only] Touch
Tooltips and the relic bar handle Phaser's over-on-touch quirk. Not verified on a device (HANDOFF already says so). `Targeting.onPointerDown` identifies the picking-up press by `pointer.downTime` (`Targeting.ts:432-438`); two presses in the same millisecond would be confused. Theoretical.

### R6. [nit] `New Run` on the end screen ignores `?seed`
`src/scenes/RunEndScene.ts:50` calls `newRun()` (random seed) while `BootScene` calls `newRun(seedFromUrl())`. They should agree.

---

## 4. Architecture drift against CLAUDE.md

### A1. [low, confirmed by execution] The `game/` layer imports from `data/` registries
`src/game/describe.ts:2-4` imports `getCard` and `getEnemy` from the data files, and `CombatState.ts:17-18` imports `STATUSES` and tunables. `describeOutcome({kind:'card', cardId})` therefore only works for ids in the global registry: a test-world card id throws `unknown card id` (confirmed). Passing a lookup (`describeOutcome(outcome, world)`) would keep it testable. Importing statuses/tunables is acceptable. Synergy-engine conflict: **yes** (describe.ts).

### A2. [low] Numeric literals that arguably belong in tunables
Game-rule numbers are in `tunables.ts`, `cards.ts`, `enemies.ts` and `relics.ts` as their header comments say. Remaining literals:
- `src/scenes/MapScene.ts:26-27`: `FLOOR_Y = 548 - floor * 35` and `LANE_X = 200 + lane * 100`. This is the one literal that breaks when a tunable changes: with `MAP_FLOORS` above about 15 the top floors leave the screen. Derive spacing from `map.floors` and `map.lanes`.
- `src/game/save.ts:12-60`: validation bounds (lanes 50, floors 100, 2000 nodes, hp/gold ranges). Fine, but they silently invalidate every save if the map tunables ever exceed them; derive them from the tunables with headroom.
- `src/sim/simulate.ts` and `bot.ts` thresholds and scores: bot-only; leave.
- `CombatScene.ts` / `layout.ts` pixel positions are layout, not balance.
- Stale text: `src/data/enemies.ts` "Final fight of the run" on ENEMY_C; `README.md:3` still says the project is building MVP 2 with "three fights and a rest stop"; `index.html` title "Deckbuilder MVP".

### A3. [nit] Naming overlap in ids
Combatant ids are `enemy-0`, `enemy-1` (position in the fight) while enemy definition ids are `enemy-a`...; they look alike in logs. A different prefix for positions (`slot-0`) would avoid confusion.

---

## 5. Simplification, dead code, duplication (all optional)

- `src/scenes/RestScene.ts:88-116` and `src/scenes/ui.ts:119-156` build almost the same card grid (cols/rows/scale/step math duplicated). One `layoutCardGrid` helper would remove it.
- Every non-combat scene repeats the same preamble (`useLayoutCamera`, background rect, `addRunHud`, `addDeckButton`, `addSettingsButton`, deck/escape keys). A `buildRunScreen(scene, run)` helper in `ui.ts` would remove about 40 lines across five scenes and make "forgot the keys in one scene" impossible.
- `src/scenes/EventScene.ts:389-392` saves, then `enterCurrentNode` saves again on the fight path (double write).
- `ShopScene` prints the `[n]` key hint for sold items too (`:266`).
- `describe.ts` repeats `charAt(0).toLowerCase()` inline at `:251` although `lowerFirst` exists below it.
- `RunState.node()` / `mapNode` do linear `find` over nodes; fine at about 60 nodes.

---

## 6. Security and robustness: browser storage, clipboard, URL params, content/dev pages

No XSS surface found: the content page and dev panel build DOM with `textContent` / `Option` and never put data into `innerHTML` (the one `jump.innerHTML = ''` is a clear). No third-party scripts, network calls or cookies.

### S1. [medium, confirmed by execution] `tableExport` does not escape pipes, and its test encodes the bug
`src/content/tableExport.ts:10`: `text.replace(/\|/g, '\|')`. In a JS string `'\|'` is just `|`, so nothing is escaped. `src/content/tableExport.test.ts:17` expects `'Odd \| one'`, which is also just `Odd | one`, so the test passes while asserting nothing. Real impact: the Enemies table joins moves with `'  |  '` (`contentPage.ts:240`), so "Copy as Markdown" for that table produces extra columns. Confirmed: a row `['x','m1  |  m2']` exports as `| x | m1  |  m2 |`.
Fix: `text.replace(/\|/g, '\\|')` and change the test's expectation to `'Odd \\| one'`. This is a test whose expectation is wrong; fix both together. Not in the synergy-engine path.

### S2. [low, by reading only] Stored data is trusted more than the types say
`storage.loadReportHistory` casts parsed JSON to `RunReport[]` unvalidated (`storage.ts:64`). Harmless (it is only copied to the clipboard). See C5 for the save validator gaps.

### S3. [low, by reading only] Storage failures and old saves are silent
`storage.ts` `write` swallows quota/blocked errors by design. A private-window player loses the run on refresh with no warning; consider one small notice if `saveRun` fails. The save key is `deckbuilder.run.v1` while the payload has `version: 2`, and an incompatible save is discarded without telling the player. A one-line "your saved run was from an older version" message on the boot screen would help at the next breaking change.

### S4. [low, by reading only] URL parameters
`?seed` is strictly validated (`session.ts:117-123`: digits only, range-checked; invalid values are silently ignored). `?dev` is a presence check and the public site serves the dev panel to anyone (it can grant gold, cards, relics and skip fights). That is deliberate for playtesting, but treat any future reports or leaderboards as untrusted. The panel is a separate chunk loaded only with the flag (confirmed in the build output).

### S5. [nit] Clipboard and display
`copyToClipboard` tries the async API then a hidden textarea with `execCommand`; both are in try/catch and the textarea is removed. Fine. `display.ts:231` reads `devicePixelRatio` once at load, so moving the window to another monitor or changing browser zoom keeps the old canvas resolution until reload (phone/DPR work is skipped per HANDOFF).

---

## 7. Build, CI and deploy config

### B1. [low] CI runs twice for branches with a PR
`.github/workflows/ci.yml` triggers on `pull_request` and on `push` to every non-main branch, so a PR branch runs the same job twice per push. Fix: drop the `push` trigger or add `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`.

### B2. [low] Deploy does not run the same gate as CI
`deploy-pages.yml` runs `npm test` then `tsc && vite build --base=...` rather than `npm run verify`. They are equivalent today but can drift. Fix: have both workflows call one script (for example `verify` then a base-path build).

### B3. [low] No `engines` field
`package.json` has no `engines`, while CI and the Dockerfile pin Node 24. Add `"engines": {"node": ">=24"}` (and an `.nvmrc`).

### B4. [nit] Other config notes
- `vite.config.ts` sets no `base`; the Pages base is only passed on the CLI. Deliberate, but `npm run build` output cannot be served from a subpath. I checked that favicon and asset URLs are rewritten correctly when `--base` is given (both pages).
- The build prints a >500 kB chunk warning for Phaser every time. Setting `build.chunkSizeWarningLimit` would make a new, genuine warning visible.
- The Dockerfile `COPY . .` is safe because `.dockerignore` excludes `node_modules` and `dist` (checked). It also excludes `*.md`, which the build does not need.
- Workflow action versions (`checkout@v7`, `setup-node@v7`, `upload-pages-artifact@v5`, `deploy-pages@v5`) could not be verified from here; this PR's CI run is the check.

---

## 8. Prioritized fix plan

Each group is one safe PR. "Conflicts" means it touches files the in-flight synergy-engine work is changing (CombatState, Deck, types, describe, cards, statuses, relics, tunables); do those after the synergy PR merges, or fold them into it.

| # | PR | Findings | Touches | Conflicts with synergy engine? |
|---|----|----------|---------|-------------------------------|
| 1 | **Fix content export escaping** (do first, tiny) | S1 | `content/tableExport.ts`, its test | No |
| 2 | **Input and scene hardening** | P3, R3, R4, R6, B-nits in scenes | `scenes/ui.ts`, `CombatScene.ts` (try/finally), `EnemyView.ts`, `RunEndScene.ts` | Low: `CombatScene.ts` is touched by R1/P1 in group 5, so do these together after the synergy PR if that PR edits the scene |
| 3 | **CI and build config** | B1, B2, B3, B4 | `.github/workflows/*`, `package.json`, `vite.config.ts`, README/title text | No |
| 4 | **Save validation and save UX** | C5, C6, C7, S2, S3 | `game/save.ts`, `RunState.ts` (`fromSaved`, `chooseEventOption`), `storage.ts`, `BootScene.ts`, `MapScene.ts` | Partly: `SavedRun` shape if cards/relics gain fields. Land before or bump `version` together |
| 5 | **Scene reads event data only; handle every event** | P1, R1, R2 | `CombatState.ts` event payloads, `CombatScene.ts`, `StatusRow.ts`, `EnemyView.ts`, `PlayerView.ts`, `data/statuses.ts` | **Yes**: do after (or inside) the synergy PR |
| 6 | **Combat rule fixes** | C1 (block relic), C3 (hand cap), C2 (powers, needs a user decision first), C4 (fresh stack rule, needs a decision), C10 (require seeded rng) | `CombatState.ts`, `Deck.ts`, `tunables.ts` + tests | **Yes**: highest conflict. C1 is a one-line move and a test; strongly recommend doing C1 now as its own tiny PR if the synergy branch has not touched `start()`/`startPlayerTurn()`, otherwise fold it in |
| 7 | **Layering and describe** | A1, A2 (map layout from `map.floors`), C9 | `game/describe.ts`, `MapScene.ts`, `RunState.ts` | Yes for describe.ts |
| 8 | **Optional cleanup** | Section 5, ShopScene redraw (P2), sim cleanups in C11 | scenes, `sim/` | Mostly no |

Order I would use: 1, 3, then 2 and 4 in parallel, then wait for synergy, then 6, 5, 7, 8.

### Questions that need the user (not decided here)
1. Do power cards leave the deck for the rest of the fight (StS) or recycle and stack (current behaviour)? (C2.)
2. Is the whole status stack "fresh" when an enemy adds to a debuff you already have, or only the new stacks? (C4.)
3. Is retrying a lost fight by refreshing before pressing Continue acceptable? (C8.)
4. Hand-size cap: 10 as in StS? (C3.)

### Decisions I made in this audit
- Kept the audit strictly read-only: only this file is added. Throwaway test scripts lived outside the repo (scratch space) and were not committed.
- Treated "powers recycle" and "stack skips the whole countdown" as design questions rather than bugs, because no document decides them.
- Dropped findings I could not substantiate (listed at the top, for example a possible float-ordering problem in `calcDamage`, which showed no difference for the current multipliers).
- I could not open the PR with `gh` (not installed in this environment); the branch is pushed and the PR must be opened from the GitHub link for `auto/code-audit`.

### What was executed versus read
- **Executed** (throwaway Vitest scripts, run against `main`): C1, C2, C3, C4, C5, A1, S1, plus the clean-bill checks listed at the top (map invariants over 3000 seeds, simulator over 300 runs, save/restore lockstep over 60 seeds, a second `finishCombat` throws). `npm run verify` passes before and after (this PR changes no code).
- **Read only**: everything labelled "by reading only", including all Phaser scene findings (no browser was available).
