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
