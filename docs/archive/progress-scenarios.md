# Progress: scenario system (branch `auto/scenarios`)

Written 2026-10-07. Report of the background session that built it.

## What was built

Capture and restore of an exact fight state as JSON, plus a dev-panel UI for it. Guide: `docs/SCENARIOS.md`.

- `src/game/scenario.ts`: the `Scenario` shape (versioned), `parseScenario` / `parseScenarioText` (validation with plain messages, never throws), `captureScenario`, `restoreScenario`, `formatScenario`, and test helpers `runScenario`, `performPlays`, `recordEvents`.
- `src/game/CombatState.ts`: `exportState()` (a plain snapshot, only on the player's turn and only for a fight with a seeded `Rng`), a `restore` option on the constructor, an `rng` option (an `Rng` instead of a `random` function), and a `start()` that for a restored fight draws nothing and runs no combat-start effects but announces the hand and turn.
- `src/game/Deck.ts`: `loadPiles` (new instances, draw pile given in drawing order).
- `src/scenes/CombatScene.ts`: takes a pending scenario once; normal fights now pass their `Rng` (same numbers as before) so they can be captured; the powers readout counts powers already in play.
- `src/session.ts`: the pending-scenario holder. `src/dev/devPanel.ts`: **Capture this fight** and **Load scenario** with a JSON box.
- `scenarios/`: four hand-written examples (boss opening, tag combo, random exhaust, exact lethal), also used by the tests.
- Tests: `src/game/scenario.test.ts` (55 tests), `e2e/scenario.e2e.ts` (3 browser tests).

## Verified

- `npm run verify` passes when run on a quiet machine. (Under load, heavy existing tests such as the 2500-fight fuzz and the simulator tests hit their timeouts and failed; every one of them passes when its file is run alone. This also happened to the orchestrator earlier.)
- The normal fight path is unchanged: the simulator sample report (`npm run balance:report`) is byte-identical when generated with the old and the new `CombatState`/`Deck`, and `npm run balance:check` reports 0 moved of 1521 metrics. (The committed `balance/reports/sample.*` already differs from a fresh run because of the elite-guarantee map change that landed after it was generated; that is not from this branch and the files were left alone.)
- A deliberate-breakage check: making the restore use the wrong stream position fails three of the scenario tests (and one of them is built so the "original" fight starts with a real shuffle, not from a scenario, so it cannot pass by both sides sharing the bug).
- Played in a real browser through the Playwright harness: capture mid-fight and load it back (hand, energy, enemy HP and turn match), a hand-written lethal scenario won with real mouse clicks, a power already in play showing "Powers: 1" and reacting, and bad input refused with a message while the fight stays as it was. Seen in a screenshot: the loaded Tag A combo, Elite A at 59/85 after the combo (the 26 damage the scenario's note predicts).
- Not seen by a human: how the taller dev panel feels on a small window (it can be folded with the backtick key).

## Decisions I made

1. **Loading uses the "Fight these here" stand-in.** The run is not used during the fight; no reward; Continue gives the fight's ending HP to the run; a refresh restarts the stop as an ordinary fight. Reverse: persist the scenario in the run save (would need a save version bump).
2. **A loaded state is literal.** No draw, no combat-start relic effects; the state you give is the state you get. A relic's combat-start result (like Strength Token's +1) is written into the state by hand or comes from the capture.
3. **Draw pile is written in drawing order** (first entry drawn next), the reverse of the engine's array, because that is how a person thinks about it. Hand is left to right; discard, exhaust, powers in the order they got there.
4. **Strict reader:** unknown fields are errors (typos), all fields but `enemies` optional with documented defaults, near-miss suggestions for ids.
5. **A capture requires a seeded stream** and the player's turn, otherwise it throws with a message (a fight built with only a `random` function cannot be captured exactly). Every fight the game starts has a stream.
6. **Plays are by card id** (first copy in hand) because card copies get new internal ids on restore.
7. **The `rng` option** was added to `CombatOptions`; `random` still works as before.

## Follow-ups (not done)

- The puzzle mode (goal, undo/reset, hints) is a design decision for the user; the groundwork is this.
- A solver that searches every order of plays for a scenario (for checking that a puzzle is solvable) could be built on `performPlays`/`restoreScenario`; not built.
- A scenario could be shared as a link (`?scenario=`); not built (explicitly out of scope).
- The balance sample report and `docs/design/EVIDENCE.md` are stale since the elite-guarantee change (not from this branch).
- `HANDOFF.md` and `docs/README.md` need a line each (left to the other agent): the scenario tools, `docs/SCENARIOS.md`, `scenarios/`, `e2e/scenario.e2e.ts`; the dev panel now has two more controls; `CombatState` has `exportState`/`restore`/`rng`.

## What a human should try first

Open the game with `?dev`, start a fight, play a card, click **Capture this fight**, then click **Load scenario** and check the fight looks the same; paste `scenarios/exact-lethal.json` and win it with Expose, Opportunist, Bolt; then try Bolt first and see it leave 6 HP.
