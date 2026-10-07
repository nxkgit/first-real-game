# Balance process

How to find out whether a number, a card or an enemy is balanced, with simulation, and how to read the answer. Written 2026-10-07 while all content was placeholder: this is the **method**, not a tuning of the numbers. The tooling reads whatever the registries contain (`CARDS` via `baseCards()`, `ENEMIES`, the act lists in `src/data/run.ts`), so new content is picked up without code changes.

The simulator **measures; it does not decide**. Every threshold below is a provisional placeholder (see "Target bands") for the designer to replace.

## Quick start

```
npm run balance                              # list commands and flags
npm run balance -- ladder                    # how hard is each fight?
npm run balance -- cards --skills smart      # what does each card do for a deck?
npm run balance -- pairs --skill smart       # which pairs help or hurt each other?
npm run balance -- drafts --runs 300         # whole-run policy comparison
npm run balance -- ladder --sets synergy     # the hand-built synergy decks (also: --sets all | name,name)
npm run balance -- cards --cardset synergy --context syn-mult   # card effect in a synergy deck
npm run balance -- ablate --sets synergy     # each card's contribution inside the deck it was built for
npm run balance -- deck --cards "strike*4,defend*4,bolt" --with starter   # one exact deck (or --set syn-tag)
npm run balance -- loops --max-size 5        # exhaustive: which tiny decks play forever? (minimal loops)
npm run balance -- combos --goal speed --fights boss-a   # adversarial search (damage | speed | stall)
npm run balance -- tweak --card blood-strike --set effects.0.value=2   # what-if: before/after, paired
npm run balance -- loops --tweak "tag-a-echo:triggers.0.oncePerTurn=true"   # any command, with in-memory card changes
npm run balance -- dominance                 # strictly dominated plain cards (static)
npm run balance:report                       # everything, written to balance/reports/sample.{md,json}
npm run balance:check                        # did my change move anything? (vs the committed baseline)
npm run balance:baseline                     # accept the current numbers as the new baseline
npm run balance -- bench                     # throughput
```

Every experiment takes `--out base` (writes `base.md` and `base.json`) or `--json`. The older `npm run sim` (whole runs, `--compare`) still works.

## Concepts

**Fight-level experiments are the main tool.** A *unit* is one fight against one fixed enemy group from a fixed starting HP with a given deck and seed. Run-level win rates are a poor instrument: a run is about a dozen fights chained, one bad fight ends it, and the deck is a product of earlier luck and the bot's draft policy. Fight-level results isolate the thing you changed.

**Common random numbers (pairing).** Unit *i* of every deck being compared uses the same seed (`unitSeed(base, fight, i)` in `engine.ts`; it depends only on the fight's id, so adding fights never changes other fights' seeds). Differences are computed per unit and the confidence interval comes from the spread of those differences. Shared shuffle luck cancels, so a difference that would need thousands of unpaired fights shows up in hundreds. A deck with a card *swapped for itself* must give exactly zero change; there is a test for that control.

**Confidence intervals everywhere.** All intervals are 95%. Rates use the Wilson interval; means and paired differences use a t interval over units. Verdict words:

| verdict | meaning |
|---|---|
| better / worse | the interval excludes zero (in the good / bad direction for the player) |
| negligible | the whole interval is inside +-margin (win rate 2 points, HP lost 1, turns 0.25; `METRICS` in `engine.ts`) |
| INCONCLUSIVE | the interval spans zero and is too wide to call the effect negligible. **Do not act on it: add seeds.** |

**Bot skill levels.** A real player sits somewhere between them, so judge content against the range, not one bot. All are deterministic given the seed and none peeks at hidden information.

| skill | what it does | use it for |
|---|---|---|
| `random` | plays random legal cards until nothing is playable | the floor: a fight it wins most of the time tests nothing |
| `greedy` | the original bot: scores each card alone (`bot.ts`) | a careless but not random player. Known weakness: it spends energy on status cards over and over and can drag fights out (see Observations) |
| `smart` | sequences a turn (`smart.ts`): takes lethal; gains energy before spending it; plays setup (powers, draw when there is energy to use it, self-buffs, Empowered when there is a hit to put it on, Strength doublers when there is Strength, any effect kind it does not recognise) and enablers (tagged cards, exhausters, Vulnerable, block givers) before the payoffs that scale with them, keeping energy back for the payoff; puts Empowered on the biggest hit; does not waste one-shot (exhaust) attacks on overkill; never takes self-damage into lethal; debuffs before hits; blocks when incoming damage matters (hard when it would be lethal); aims at the killable or most dangerous enemy | an attentive player; fast. It trades HP for speed (on the plain starter deck `greedy` loses less HP) |
| `expert` | smart plus lookahead: for each candidate play it rebuilds the fight by replaying the action history on a fresh `CombatState`, finishes the turn and plays the next with `smart`, and keeps the play with the best resulting position (HP minus what the surviving enemies will still cost). Another play (or ending the turn) must beat `smart`'s own pick by `EXPERT_MARGIN` (0.75) to replace it. Judges plays by what actually happens, so it copes with card interactions its heuristics know nothing about | the careful player: saves HP over `smart` on ordinary decks. NOT an upper bound on synergy decks: its position value sees only HP and enemy HP, not stored value (Strength, counters). About 20x slower |

Lookahead reshuffles the draw pile with a hypothetical seed before simulating, so it cannot see the true order of the draw pile. `CombatState` has no clone; state is reconstructed by replay (`fightCore.ts`).

`random,greedy,smart` is the default set; add `--skills all` for `expert`.

**Throughput** (this machine, 2026-10-07, `npm run balance -- bench`): random ~15,000 fights/s, greedy ~10,000, smart ~7,000, expert ~500. A full `balance:report` (about 20k paired fights plus 100 whole runs) takes about 10 seconds; `balance:check` about 4 seconds.

## Metrics

| metric | definition | pitfalls |
|---|---|---|
| **win rate** | share of fights ended with the enemies dead. A fight that hits the 60-turn cap counts as a loss. | saturates: against easy fights every deck wins ~100% and cannot show differences. Prefer HP lost for ordinary fights; use win rate for elites and bosses. |
| **HP lost per fight** | start HP minus end HP; **a lost fight counts as all the HP the player brought** (so it mixes "how hard" and "how often lost"). The ladder also reports *HP lost when won*, which is what the target bands use. | HP lost when won is conditioned on winning, so it can fall when a fight gets harder and only strong decks win (survivorship). Read it next to win rate. |
| **turns per fight** | player turns until the fight ends. | Not a quality measure by itself: a card that makes fights longer is not worse, it changes pacing. Use it to find fights outside the length target and decks that stall. |
| **pick rate** | at fight rewards, `times a card was taken / times it was offered` (`drafts`). A random picker takes any given offer about 1/3 of the time (3 choices). | Depends on the policy that picks. Under `reward=best` (picks by trial fights) it shows what a thoughtful picker prefers; a card near 70% is a dominant choice, near 5% a dominated one. Shop buys are not counted. |
| **card effect** | paired `deck with card minus deck without`, per metric. "Added" puts the card in the deck; "replace" swaps it for the deck's most common card (the Strike). | Measured in a fixed context (default the starter deck). It is stand-alone value: cards that need partners look weak, and cards whose value depends on the deck's size or energy curve look different in `--context mid`/`late`. |
| **synergy score** | `benefit(A+B) - benefit(A) - benefit(B)`, where benefit is measured against the same deck without them, per unit, on identical seeds. Positive: the pair is worth more than the sum. Negative: they overlap (compete for energy, draw, targets) or are redundant. | A four-way difference: roughly twice the noise of a single-card effect, so it needs ~4x the units. Among 100+ pairs, ~5% look significant by chance. Treat each hit as a lead and re-run it (`--pairs a+b --seeds 300`). Sampled when there are more pairs than `--max-pairs`. Redundant cards (two big blocks) score negative without being a defect. **The scores have a non-zero centre** (benefits are not additive even for cards that do not interact; the mid deck's median pair is about +0.7 HP), so with 20 or more pairs the verdict compares each pair with the median pair, and with fewer with zero. Controls help: include a pair that cannot interact (`strike+defend`). Payoff cards belong in `ablate` (a card inside its own built deck), not in pairs. |

**Run-level win rates per card are biased** (the old `npm run sim` table, and any "win rate with card X" computed from whole runs): a run that survives longer collects more cards, and good cards are picked by runs that are already doing well, so cards that appear in longer runs look better regardless of their power. Do not use them to judge cards; use `cards` / `pairs`. The `drafts` experiment is for comparing *policies*, with paired seeds, and says so in its output.

## How to read results

1. Look at the header: how many paired units, which fights, which skills.
2. Read intervals before point estimates. If the interval is wide, the number is not a finding.
3. Look across skills. A card that is `better` for `smart` and `worse` for `greedy` rewards skill; one that is `better` only for `random` is probably just "free stats" that does not matter to a player who plays well; a card that is `worse` for every skill is a candidate dead pick.
4. Tier rollup first, single fights second. One fight's numbers vary with how the enemy happens to match the deck.
5. A flag (LOW/HIGH, an outlier row) means "look at this", never "this is wrong".

## Target bands (PROVISIONAL, for the designer to set)

Chosen by the tooling session from Slay the Spire conventions and the plan's "avoid dominant or dominated choices" principle. They live in `src/sim/targets.ts`; change them there. They apply to the **mid** reference deck (starter + 5 sampled cards) at full HP, 60 max HP.

| tier | turns per fight | HP lost when won (of max HP) |
|---|---|---|
| normal | 3 to 6 | 8% to 25% (5 to 15 HP) |
| elite | 5 to 9 | 20% to 45% (12 to 27 HP) |
| boss | 8 to 14 | 35% to 70% (21 to 42 HP) |

Win-rate bands per bot (the player-like bots should land inside; `random` should be clearly worse):

| skill | normal | elite | boss |
|---|---|---|---|
| random | 30 to 95% | 5 to 60% | 0 to 30% |
| greedy | 90 to 100% | 60 to 90% | 35 to 80% |
| smart | 95 to 100% | 75 to 97% | 55 to 90% |
| expert | 95 to 100% | 80 to 98% | 60 to 92% |

Reasoning: normal fights are short and cheap, and almost never kill (a death there is a content bug); elites are a real risk that costs a visible chunk of HP; the boss is the exam: the player should win it most of the time with a decent deck but rarely unscathed. Cards: no card should be *clearly worse than adding nothing* for every skill (dead pick), and none should be a far outlier above its cost cohort (dominant pick). Fights: a fight whose p10 to p90 turn range is very wide has a pacing problem the mean hides.

## Workflows

### "I changed a number"
1. `npm run balance:check`. It re-runs the committed baseline's configuration on the current content and lists what moved, by how much, with significance. If nothing in your area is listed, the change was small or noisy: re-run the relevant experiment with more seeds.
2. Read the **Moved** table (clear and at least the tolerance: win 3 points, HP lost 1.5, turns 0.4, |z| >= 3) and **Possible** (large but not statistically clear: needs more seeds). Keys read `ladder/<skill>/<deck set>/<fight>/<metric>` or `card-add/<skill>/<card>/<metric>`.
3. Zoom in with the specific experiment (`ladder --fights enemy-c`, `cards --seeds 200`).
4. If you like the new numbers, `npm run balance:baseline` and commit `balance/baselines/baseline.json` with the change. `balance:check` exits 0 even when numbers moved; it fails only if the tool breaks.

### "I added a card"
Run the checklist below. The card is picked up automatically from `baseCards()`.

### Checklist: new card
1. `npm run balance -- cards --skills all --seeds 100` and find the card. Compare it with cards of the same cost. Is it `worse` for every skill (dead) or far above its cost cohort (check `outliers`)?
2. Try it in later decks too: `--context mid`, `--context late`.
3. `npm run balance -- pairs --skill smart` (and `--pairs yourcard+other --seeds 300` for leads). Is it supposed to synergise with something? Does the pair show a clear positive score? Are there strongly negative pairs you did not intend (energy clogging, wasted draw)?
4. Is it an unintended combo that makes some fight trivial? Check `ladder` and `lengths` with a deck built around it (`--context` only covers sampled decks; for a bespoke deck add a deck set in `suites.ts`).
5. If the card is in the reward pool, `drafts --reward best` shows its pick rate.
6. `balance:check`, then `balance:baseline` if you accept the movement.

### Checklist: new enemy or encounter
1. Add it to the act lists in `src/data/run.ts` (or test it alone with `ladder --fights new-enemy+enemy-d`). Fights not in the act can be named directly.
2. `ladder --skills all`: win rate, HP lost when won and turns by deck set, against its tier's bands.
3. `lengths`: is the turn distribution tight? A long right tail means some decks stall against it.
4. Does it make some card strictly better or worse? `outliers` (enemy fights are compared inside their tier).
5. `balance:check`, `balance:baseline`.

### Run-level questions
`npm run balance -- drafts --runs 300 --reward best --rest heal` compares a custom policy with random picks on the same seeds. Resolving a 5-point win-rate difference takes a few hundred runs per policy. Gold versus card (the plan's "gold must be a genuine toss-up") is the `reward=gold` row against `reward=best`.

### Checklist: a synergy card or mechanic (added with the first synergy analysis)
1. `loops --max-size 5` after adding a card: does it create a minimal loop (free plays that refill themselves)? The only loop found so far is a 0-cost tagged card plus a draw-per-tagged-play trigger. A new 0-cost draw or energy card is the usual suspect.
2. `ablate --sets synergy` (add a deck for the family to `synergyDeckSets` in `suites.ts`): does the card help the deck built for it? `cards --context syn-<family>` shows the single-card effect there. Pairs are the wrong tool for payoff cards.
3. `combos --goal speed --fights boss-a --cardset all` and `--goal damage`: how fast can a search-built deck win, and which cards are in every top deck? An engine-sized result (a 12-card deck killing the boss in 4 turns against 9 for a normal deck) is a design question, not a bug; a deck that never needs to stop is a bug. Read the confirmed column (fresh seeds), not the search score.
4. Before proposing a number change, measure it: `tweak --card <id> --set path=value`, or `--tweak "card:path=value;card2:path=value"` on any command (nothing on disk changes). Re-run `loops` under the tweak when it touches cost, draw or energy.
5. The `smart` bot treats any effect kind it has no rule for as setup. If a card's value depends on sequencing, add the rule to `smart.ts` (see "Extending the tooling") and a constructed-deck test like those in `src/sim/smart.test.ts` (a hand that is exactly the deck: a 5-card deck is the opening hand, so the turn is deterministic).

## How many runs?

Units needed for a 95% half-width `h` is about `(1.96 * sd / h)^2`. Rough sd of a per-unit paired difference seen in the placeholder content: HP lost ~8, turns ~1.7, win ~0.2. A fight-suite of N fights times S seeds gives N*S units.

| to resolve | units | e.g. for 9 fights |
|---|---|---|
| HP lost +-1.0 | ~250 | 30 seeds |
| HP lost +-0.5 | ~1,000 | 110 seeds |
| turns +-0.2 | ~280 | 32 seeds |
| win rate +-3 points | ~170 | 20 seeds |
| a synergy score (4-way) at +-1 HP | ~1,000 | 110 seeds |
| run-level win rate +-5 points | ~400 runs per policy | |

Defaults: cards 40 seeds per fight, ladder 60-100, pairs 40, baseline 100, runs 100. Raise `--seeds` until the intervals are narrow enough to answer your question. If an interval still spans zero at a size you care about, the answer is "not distinguishable at this effect size", which is a result.

## What the simulator cannot tell you

- **Feel and fun.** Whether a hand is satisfying, whether a turn is interesting, whether a card is exciting.
- **Human skill and misplay.** Real players are better at some things (planning around the next intent, saving a card) and worse at others (arithmetic) than any bot. The range random..expert brackets this but does not model it.
- **Information the bots do not use.** Relics, upgrades at rests, gold, shop and event choices are only exercised by the whole-run experiments, with crude policies.
- **Readability and clarity** of cards and intents.
- **Tilt, variance tolerance, the fantasy of a build.** A card can be statistically fine and no fun.

Playtest instead (or after) when: a change is about how something feels, a card's whole point is a combo the bots may not find (expert helps but does not prove anything), a number is near its band edge and you cannot tell which side is right, or after any new effect kind lands (test that it does what the card says first, in a browser).

## Extending the tooling when a new effect kind lands

The tooling drives combat only through `CombatState`'s public API (`playCard`, `canPlay`, `endPlayerTurn`, `phase`, `energy`, `deck.hand`, `enemies`, `player`, `calcDamage`, `intentDamage`, ...), so a new `Effect` kind, pile or event does not break it. Unknown effect kinds are treated as "setup" by `smart` and are judged by outcomes by `expert`. What to do for a new mechanic:

1. Nothing for it to *run*: cards using it appear automatically in `cards` and `pairs`.
2. To make `smart` handle it well, add a branch in `profileOf` / `smartChoices` in `smart.ts` (what it is worth, when to play it; enablers and payoffs are matched by `enables()` and `GROWING`). `expert` needs no change, except that `evaluate()` (the position value) may need a term if the mechanic stores value the player cannot see in HP and enemy HP (for example a persistent counter): add it there.
3. If a new mechanic makes replay-based reconstruction diverge (anything random that is not the shuffle stream), `reconstruct` throws "replay diverged"; route the new randomness through the same seeded stream.
4. If the mechanic needs a new tunable band, put it in `targets.ts`.
5. Add a case to `balance.test.ts` (the "effect kind it has never heard of" test is the model).
6. Regenerate the baseline: `npm run balance:baseline`.

Other places content shapes are assumed: `suites.ts` (reference decks sample from the reward pool, `--pool all` samples every non-starter card; the starter deck is `buildStarterDeck()`; reference decks upgrade via `upgradedVersion`), `engine.ts` (fights start at full HP).

## Outliers

Within a cohort of 4 or more, a value is flagged when its modified z-score (0.6745 * (x - median) / MAD, Iglewicz-Hoaglin) exceeds 3.5 or it lies outside Q1 - 1.5 IQR .. Q3 + 1.5 IQR. Cohorts for cards: all cards, and each energy cost. For enemies: fights within a tier. Small cohorts produce no flags; the tier bands cover that case. A zero-spread cohort cannot flag (nothing is far from the rest).

## Observations on the placeholder content (2026-10-07)

Not findings about the real game; examples of the kind of thing the tools surface:

- (Resolved by the engine: powers now stay in play after being played and no longer recycle and stack. The first version of this document recorded the old behaviour as an observation.)
- The greedy bot can stall against decks with several status cards and little damage (it keeps spending energy on Weaken/Expose). Greedy therefore reads below `random` on some mid-sized decks: a property of that bot, which is why several skills are reported.
- The Boss and the heavy normal fights are far outside the provisional bands for the placeholder numbers; the report lists them as LOW/HIGH.

## Files

| path | role |
|---|---|
| `src/sim/stats.ts` | CIs, Wilson, paired and Welch differences, verdicts, outlier flags |
| `src/sim/fightCore.ts` | `FightSpec`, replay-based reconstruction |
| `src/sim/skills.ts` | the four bot skill levels (random, greedy, smart's driver, expert) |
| `src/sim/smart.ts` | the `smart` bot's per-step ranking (`smartChoices`), including the synergy mechanics |
| `src/sim/combos.ts` | `deck` (fixed deck), `combos` (adversarial search), the Dummy enemy |
| `src/sim/loops.ts` | `loops`: exhaustive search of tiny decks for free-play loops |
| `src/sim/ablate.ts` | `ablate`: a card's contribution inside a built deck |
| `src/sim/tweak.ts` | `tweak` and the global `--tweak` flag: in-memory card changes |
| `src/sim/dominance.ts` | `dominance`: static strict-dominance check |
| `src/sim/engine.ts` | paired `Evaluator`, metrics, seeds |
| `src/sim/suites.ts` | fight suites and reference decks (core: starter, mid, late; synergy: syn-tag, syn-exhaust, syn-trigger, syn-mult, syn-combo, syn-mixed), derived from the registries or hand-listed by card id |
| `src/sim/targets.ts` | PROVISIONAL bands and check tolerances |
| `src/sim/experiments.ts`, `drafts.ts` | the experiments |
| `src/sim/snapshot.ts` | baseline and `check` |
| `src/sim/commands.ts`, `balanceCli.ts` | command line |
| `balance/baselines/baseline.json` | committed baseline (regenerate with `npm run balance:baseline`; the stored `note` says date, commit and that the content is placeholder: pass `-- --note "..."` to the CLI to set it) |
| `balance/reports/sample.md`, `.json` | sample report from the placeholder content (ladder includes the synergy decks) |
| `docs/balance/synergy-findings-2026-10.md` | the first real analysis (synergy content): findings, adversarial search, proposed tweaks |

## Optional CI step (suggestion only; workflows were not edited)

A non-blocking step in the PR workflow could post what moved:

```
- run: npm run balance:check -- --out balance-check.md
  continue-on-error: true
- uses: actions/upload-artifact@v4
  with: { name: balance-check, path: balance-check.md }
```

`balance:check` exits non-zero only if the tool itself fails (unreadable baseline, bad flags, a crash), never because numbers moved.
