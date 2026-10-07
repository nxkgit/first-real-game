# Progress: design evidence (branch `auto/design-evidence`)

Unattended session, 2026-10-07 (cut off once by a usage limit and resumed). This file is the PR description. Status: finished (see "Verified" and "Not run / limits").

**Nothing was played in a browser.** Everything is simulator, tests and docs. `src/game`, `src/data`, `src/scenes`, `src/content`, `e2e/`, workflows, `HANDOFF.md` and `DESIGN_LOG.md` are untouched. No game number or rule changed; every "what if" is an in-memory parameter of the simulator.

## What was built

1. **`docs/design/EVIDENCE.md`**: a decision menu on top and one section per open decision (shop and card-vs-gold with the shop-price equilibrium, card removal, relics in HP and win-rate units with an HP-budget conversion, events, map shape and path choice, rest heal vs upgrade by floor plus per-card upgrade value, the pressure curve against the provisional bands, deck size, a synergy-seeking draft). Each section: finding first, the question, what was measured with the command and 95% intervals, the knobs, what the simulator cannot tell, and the mechanical consequences. Reports behind it: `balance/reports/design-evidence/*.md|json` (smart bot) and `*-greedy.*` (second bot).
2. **Simulator extensions (`src/sim` only):**
   - `runsim.ts`: configurable whole-act simulator (`RunPolicy`, `playRunEx`) over `RunState`'s public API. Parameters: shop price (and per-cost price), shelf size, buy policy, card-removal service, gold per reward, rest heal fraction, map-shape overrides, start relics/gold/max HP, draft pool (live pool or every draftable card), card pick rules (`random`, `best`, `synergy`), gold rules, rest rules, path styles, event rules. Deterministic; the bot's own choices use a separate stream.
   - `mapstats.ts`: static map analysis (routes, kinds per path, best/worst-path counts) and `mergeMapParams`.
   - `evidenceRuns.ts`, `evidenceFights.ts`, `evidenceBudget.ts`, `evidenceCommands.ts`: the experiments; new `npm run balance -- <gold|removal|rests|events|relics|maps|paths|pressure|picks|decksize|upgrades|synergy|runs|evidence>` commands and `npm run balance:evidence`.
   - Toolkit follow-ups done: **`expert` stored-value term** (`storedValue` in `skills.ts`; measured within noise on the placeholder decks, `expert` is still not an upper bound on the exhaust and block-trigger decks); **synergy-seeking draft policy** (`pick: 'synergy'`); **card removal and shops in the run simulator**. Skipped: `tweak --sweep` and a smart-bot trace (they do not serve this work).
3. `docs/BALANCE.md` (new section "Design-evidence commands"), `docs/README.md` (index rows), `package.json` (`balance:evidence`).
4. Tests: `src/sim/evidence.test.ts` (29 tests: determinism, defaults reproduce the game's map exactly, parameters bite, nothing leaks into game data, paired self-comparison is exactly zero, map statistics, every evidence command runs on tiny sizes).

## Headline findings (all placeholder content; details and CIs in EVIDENCE.md)

- Always taking gold loses 26-33 win points at every shop price 20-80 (smart bot): a path meets only ~0.4 shops. Taking gold only when the best offered card adds under 1 HP/fight *wins* ~14 points. Price is a weak knob next to shop frequency.
- Heal dominates upgrade at every floor (heal ~18 HP; best upgrade 1-9 HP over the rest of the act).
- Relics span ~0 to ~30 HP per act; Guard and Recovery Tokens alone are worth +31/+35 win points. One HP of budget is ~1.3-1.8 win points.
- Events: Rest here and Pay for strength are strong, Take it is a bad trade, Study here is slightly negative; gold is priced at ~0 by the current economy and a gold cost is free when you hold none.
- Map: floors and rests per path are the dials (each +2 floors about -8 to -12 points; +0.2 rests per path about +8); lanes, climbs and elite/shop thresholds show no effect.
- The act is attritional: deaths happen in ordinary fights on floors 7-11 at ~26 HP; the smart bot is inside the provisional bands except late elites (LOW); the greedy bot is LOW everywhere (92% wins).
- Deck size: the two bots disagree in sign (smart likes fat decks, greedy likes thin), so the bots cannot settle it.

## Verified

- `npm run verify` passes (typecheck, all tests, build).
- `npm run balance:check`: **0 moved, 0 possible, 1035 unchanged** (the committed baseline and `balance/reports/sample.*` were not regenerated; the old `playRun` and `drafts` are untouched, and `expert` is not in the baseline).
- Not played in a browser; no scene or game code changed, so there is nothing for a human to try in the game. A human should read the decision menu and sections 1, 5 and 8 of EVIDENCE.md.

## Decisions I made

- **The primary bot is `smart`, with `greedy` as the second** (tables repeated in `*-greedy` reports) because the two disagree by tens of win points. Reverse: re-run with `--skill`.
- **"Final deck cost"** (HP lost per fight of the end-of-run deck against four reference fights) as the low-noise outcome next to win rate. It is defined in `runsim.ts` (`trialFights`, `deckCost`).
- **Map-shape sweeps via `mergeMapParams`** (weights and first-floor tables merge key by key). To switch a kind off use weight 0 or a first floor beyond the map.
- **Shop price and reward gold are set by mutating `ShopItem.price` and `RewardOffer.gold`**, public fields RunState hands out; removal is `run.deck.splice` and `run.gold -=`. No RunState change. Removal is a simulator-only service.
- **Valuation bot for card picks is `greedy` by default (`valueSkill`)** for speed; `smart` for the synergy draft.
- **The "expert" stored-value term is on by default** (weight 1, `STORED_VALUE_WEIGHT`); measured effect within noise, so it is kept as a harmless improvement. Reverse: set the weight to 0.
- **Provisional run sizes**: 300 runs per row (600 for paths), 20-40 seeds per fight. Intervals are reported so the reader can judge.
- Report files for the second bot and the first-pass reports are committed under `balance/reports/design-evidence/` (new directory only).

## Not run / limits

- A look-ahead path-planning bot (reads the whole map) was not built; the measured value of path choice is probably a lower bound (EVIDENCE section 4).
- Relics were measured as "start with it" (an upper bound) and at fight level, not as found at an elite mid-act.
- Gold from events as a first-class resource, enemy scaling by floor, and a second hero were not modelled.
- Some run-level cells have wide intervals (marked INCONCLUSIVE in the reports); none are used as findings in EVIDENCE.md.

## Follow-ups

1. A path-planning bot, and `rests`/`maps` re-run with it.
2. When shops are designed, re-run `gold` with real prices and the real shelf; the price x shop-frequency grid is already parameterised (`--shop-weights`, `--grid-prices`).
3. When real content exists, re-set `src/sim/targets.ts` and re-run `pressure`.
4. A human playtest of thin vs fat decks (the bots disagree).
5. `expert` is still not an upper bound on exhaust and block-trigger decks; a "counters" term for those mechanics would be the next step.
