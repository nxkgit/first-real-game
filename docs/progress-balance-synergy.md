# Progress: balance process on the synergy content (branch `auto/balance-synergy`)

Unattended session, 2026-10-07. This file is the PR description. Status: finished; see "Verified" (one slow test outside my files exceeds the default timeout here). **Nothing was played in a browser.** All of this is simulator, tests and docs.

## What was built

1. **The smart bot understands the synergy mechanics** (`src/sim/smart.ts`, new; `skills.ts` re-exports `smartChoices`). Gains energy before spending; plays enablers (tagged cards, exhausters, Vulnerable, block givers) and setup (powers, Empowered, Strength doublers when there is Strength) before payoffs, keeping energy back for the payoff; puts Empowered on the biggest hit; does not waste exhaust attacks on overkill; never takes self-damage into lethal; plays Cull-style cards only when the energy is needed. Deterministic; greedy and random untouched; `expert` keeps working (one change, below). It beats `greedy` on the combo and tag decks by 15-20% damage on a Dummy, and the starter deck's results are identical to the old bot. It also fixed an old stall (draw cards played forever).
2. **Synergy reference decks** in `suites.ts`: `syn-tag`, `syn-exhaust`, `syn-trigger`, `syn-mult`, `syn-combo`, `syn-mixed` (hand-listed by card id, 13-15 cards each; mixed samples 8 synergy cards onto the starter deck). `referenceDeckSets({ synergy: true })` appends them; the three existing sets and their seeds are unchanged (a test pins this). `ladder --sets core|synergy|all|a,b`, `cards`/`pairs` `--context syn-...`, `--cardset all|synergy|reward`, `--pool all` (already existed) all work.
3. **Baseline and report regenerated** (`balance/baselines/baseline.json`, `balance/reports/sample.{md,json}`): date 2026-10-07, code at commit `fdde0fa`, content placeholder (stated in the stored note and the report header). The baseline now also covers the synergy decks (1035 metrics, content fingerprint `ef2efd31`). `npm run balance:check` right after: 0 moved, 0 possible, 1035 unchanged.
4. **Findings doc:** `docs/balance/synergy-findings-2026-10.md` (CIs and the paired method throughout; strongest/weakest cards, pairs with a centred reference, ablation inside built decks, adversarial search, dominated cards, band flags, 7 proposed tweaks each with its experiment, what the toolkit could not answer). Headline: one real infinite loop (Prime A + Tag A Echo, fixable with once-per-turn); no other stall; Strength engines kill the boss in about 4 turns; every fight is easy for every bot.
5. **Tooling added** (documented in `docs/BALANCE.md`): `deck` (exact deck, Dummy output), `combos` (random search with hill climbing, goals damage/speed/stall, fresh-seed confirmation), `loops` (exhaustive search of tiny decks, minimal loops only), `ablate` (card contribution inside a built deck), `tweak` and the global `--tweak "card:path=value;..."` flag (in-memory what-if, always restored), `dominance` (static), `--note` for baseline and report, and pair scores judged against the median pair.

## Verified

- Typecheck and build pass, and all 553 tests pass **with `--testTimeout=30000`**. With the default 5 s timeout one test outside my files fails on this machine, alone and in the full run: `src/game/save.invariants.test.ts` "never throws on mutated genuine saves" takes 7-9 s here (it is slow, not wrong; I did not touch it or `src/game`). So `npm run verify` as written reports that one timeout; the orchestrator should check whether it also does on its machine. New tests: `src/sim/smart.test.ts` (smart bot behaviours with constructed 5-card hands, smart vs greedy on constructed decks, every bot finishes on every synergy deck deterministically, expert still wins, reference-deck stability, commands) and `src/sim/whatif.test.ts` (tweak restores, loop disappears under a tweak, ablate, dominance, pair centring). No existing test was weakened or removed.
- `npm run balance:check` clean right after the baseline.
- Not played in a browser. The session touched only `src/sim`, `balance/`, `docs/`.

## Decisions I made

- **Split the smart bot into `smart.ts`** and re-exported from `skills.ts` so imports keep working. Reverse by moving the code back.
- **The draw rule changed for old cards too:** pure draw cards (Quick Draw) are played first only when there is spare energy for what they draw, otherwise last. Needed to stop a stall found on the exhaust deck (smart won 72% there before, 99.7% now); it also improved ordinary mid decks by about 3 HP. Reverse: delete the `othersCost` test in `smart.ts`.
- **`expert` margin:** a deviation from `smart`'s pick must beat it by `EXPERT_MARGIN` = 0.75 HP-equivalents. Without it expert was worse than smart on synergy decks. It still does not beat smart there (documented); I did not give `evaluate()` stored value (follow-up).
- **Payoff deferral stops after 30 plays in a turn** (`DEFER_PLAY_LIMIT`), otherwise a free loop kept the bot enabling forever and it measured loops as 0 damage.
- **Loop definition:** a turn with 20 or more plays (`loops --threshold`). The bots' own caps (50-60 plays) mean damage at the cap is a lower bound.
- **Pair verdicts use the median pair as the reference when 20+ pairs are tested** (zero otherwise), because the raw score has a non-zero centre (+0.68 HP in the mid deck). The raw score is still printed and stored. This changes the "strongest / negative pairs" lists of `pairs`.
- **Baseline config gains `synergySets` (default true for new baselines; absent in older ones = false).** Skills in the baseline stay random/greedy/smart (expert excluded: too slow).
- **Dummy output excludes `expert`** (its lookahead values positions by enemy HP, meaningless for a never-dying enemy).
- **Synergy deck lists are mine** (functional placeholders, not creative content): ids and counts in `suites.ts`; the families follow the card tags and triggers in `synergyCards.ts`.
- **Proposed tweaks are for cards only.** Enemy numbers are flagged in the findings (every fight is too easy) but not proposed.
- **Line endings:** the `src/sim` files and `docs/BALANCE.md` were checked out CRLF here; I normalised them to LF while editing (git's autocrlf stores LF, so the diff is content only).
- **The findings doc's tables were assembled from `.sim/out` experiment output** by a throwaway script that is not in the repo; the numbers are static text in the doc. Each section names the command that reproduces it.

## Follow-ups (not done: out of scope or needs a decision)

1. Give `expert`'s `evaluate()` a term for stored value (Strength, Empowered, counters) so it can be the upper bound on synergy decks.
2. A synergy-seeking draft policy for `drafts`, to estimate how often a run reaches an engine; card removal and shops in the run simulator (the thin-deck cliff for the loop needs them).
3. Decide the proposals in section 10 of the findings. **A human should read section 10 and section 7 first**, then play Prime A + Tag A Echo + Tag A Payoff in a thin deck in the browser to see whether the loop feels like a bug or a feature (the sim only says it never ends).
4. `tweak --sweep` (a range of values per run).
5. Re-set the win-rate bands in `src/sim/targets.ts` once real enemies exist; with the placeholder enemies every bot exceeds the elite and boss bands.
6. `smart` trades HP for speed (on the plain starter deck `greedy` loses less HP). A more defensive variant could be a fifth skill level if the range needs it.

## Things for a human to look at before merging

- The only files outside `src/sim`, `balance/`, `docs/` that changed: none. `package.json` was not changed (the `balance` scripts already pass flags through).
- If the other session's effect-handling refactor lands first: the sim uses only `CombatState`'s public API (`deck.powerPile`, `stats`, `canPlay`, `calcDamage`, `playCard`, ...); `smart.ts` reads `combat.stats.*`, `combat.deck.powerPile` and `combat.player.statuses`. Re-run `npm test` and `npm run balance:check` after merging: any movement in the baseline then points at the refactor, not at this branch.
