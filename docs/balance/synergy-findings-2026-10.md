# Synergy content: balance findings (October 2026)

First real analysis of the synergy engine's placeholder content with the balance toolkit. **Everything measured here is placeholder** (the cards in `src/data/synergyCards.ts`, the enemies, the reward pool, every number). These are findings about the numbers as they stand and about the engine's mechanics, meant to show where the process points. Nothing here is a design decision; the proposals in section 10 are for the designer to accept, change or reject, and nothing in `src/data` was changed.

- Date: 2026-10-07. Code: branch `auto/balance-synergy` at commit `fdde0fa`. Content fingerprint `ef2efd31` (`balance/baselines/baseline.json`).
- Rules in force: powers stay in play after being played, hand capped at 10, combat-start block survives turn 1 (the three rule changes since the toolkit was first written).
- Method: paired fights (the same seed for every deck being compared, see `docs/BALANCE.md`), 95% intervals everywhere, bots `random` / `greedy` / `smart` (and `expert` where stated). Metrics: HP lost per fight (a lost fight counts as all 60 HP), turns, win rate. Fight set: the 9 act encounters. Every number is reproducible with the command given in its section (all deterministic).
- Nothing was played in a browser. Everything below is simulator output.

## 1. Summary

1. **There is one genuine infinite loop in the content: Prime A + Tag A Echo.** An exhaustive search of every deck of up to 5 cards (34 cards, up to 2 copies each, 546,635 decks) finds exactly one minimal loop, and it is these two cards: Prime A costs 0 and carries the tag, Tag A Echo draws a card per tagged play, so the deck feeds itself and never runs out of plays. Add Tag A Payoff (3 + 5 per tag played) and an 8-card deck deals about 480 damage per turn (the bots stop at 60 plays; a human would not). It disappears at 10+ cards (section 7), so it is a thin-deck problem rather than something every deck hits. Proposed fix: Tag A Echo fires once per turn; measured to remove every loop found, at a cost of about 1.2 HP of the card's value (section 10).
2. **No other loop, stall or non-terminating combination was found** (loop search, random search with hill climbing for damage and for speed, a stall search). The "stall" search only finds decks of payoff cards with nothing to enable them, which cannot win and are not an engine problem.
3. **Strength engines kill fast.** The best 12-card Strength decks the search found beat the 150 HP boss in about 4 turns against about 9 for the reference mid deck, and 8-card versions in 3. Not infinite, not a bug; flagged because Strength has no cap and no single number moves it (section 7).
4. **Every fight is easy against the placeholder content.** The `random` bot beats both elites 100% of the time with the plain starter deck, and `greedy` and `smart` win the boss 100% with a mid deck. The provisional elite and boss win-rate bands are exceeded by every bot. Enemy numbers (not touched here) are the biggest lever; card numbers matter less until that is settled.
5. **Cards.** Strongest across bots and deck contexts: End Guard (-2.2 HP in the mid deck for `smart`), Guarded Strike, Attack Echo, Big Block, Prime A. Fortify is dominated by End Guard (same block, costs 2 instead of 1, and End Guard works the turn it is played). Weakest: Blood Strike (costs more HP than the tempo it buys), Kill Reward (no number tweak found that rescues it), Block Spark, Opening Spark, and a second Focus. Quick Draw stalls the `greedy` bot (+5.7 HP lost) and is mildly negative for `smart`.
6. **Pair synergy is hard to see at the pair level.** Cards that do not interact still score off zero (median pair +0.68 HP in the mid deck), and against that centre only 7 of 435 pairs are clearly synergistic. The designed pairs sit 0.1 to 0.8 HP above the control pairs. The ablation inside built decks (section 6) shows the families do work (Tag A Echo and Prime A are worth +2.3 and +2.2 HP in the tag deck), so the signal is in decks, not in pairs.
7. **The bot is a measuring instrument too.** The smart bot was taught the new mechanics and now beats `greedy` on the decks where sequencing matters (section 2). Its previous version drew itself into a stall with Quick Draw-heavy decks (it won 72% of fights on the exhaust deck where it now wins 99.7%). `smart` still trades HP for speed: on the plain starter deck `greedy` loses less HP (10.7 vs 16.6 when it wins), so judge cards against the bot range, not one bot.
8. Section 11 lists what the toolkit could not answer, and the improvements made and still wanted.

## 2. The smart bot and the synergy mechanics

What it does now (`src/sim/smart.ts`; heuristics over `CombatState`'s public API only, deterministic):

- energy gain before spending (Cull-style cards only when the energy is needed, since they exhaust a random card);
- Empowered only when there is a hit to put it on, and then on the biggest hit, not a cheap one;
- Strength doublers only when there is Strength to double;
- tag enablers, exhausters, Vulnerable appliers and block givers before the payoffs that count them, with energy kept back for the payoff (a payoff stops waiting after 30 cards in a turn, so a free loop cannot keep the bot from cashing in);
- Hand Strike-style cards early, before the hand shrinks;
- one-shot (exhaust) attacks not spent on overkill; self-damage never taken into lethal;
- draw cards only when there is spare energy for what they draw (a deck full of Quick Draw used to spin forever).

Evidence, per synergy deck: damage dealt to a never-dying Dummy in 5 turns (100 seeds, mean [95% CI]). The Dummy isolates sequencing from the fight:

| deck | random | greedy | smart |
| --- | --- | --- | --- |
| syn-tag | 86 [84, 89] | 86 [84, 89] | 109 [106, 112] |
| syn-exhaust | 118 [112, 123] | 96 [95, 98] | 170 [163, 177] |
| syn-trigger | 54 [52, 56] | 47 [46, 48] | 87 [85, 89] |
| syn-mult | 151 [147, 156] | 205 [200, 210] | 218 [213, 223] |
| syn-combo | 129 [125, 134] | 141 [137, 144] | 185 [180, 189] |
| syn-mixed (first sample) | 78 [76, 81] | 101 [99, 103] | 111 [110, 113] |

(`npm run balance -- deck --set syn-tag --fights enemy-d --seeds 100 --skills random,greedy,smart --turns 5`.) Tests in `src/sim/smart.test.ts` pin the behaviours: a hand of two Prime A, Tag A Payoff, Strike and Defend deals 19 with `smart` and less with `greedy`; Empowered lands on the Bolt (27 total); Cull is played only when the hand needs the energy; Blood Strike is refused at 6 HP facing 8 damage and played at 40 HP; `smart` out-damages `greedy` by 20% on the combo deck and 15% on the tag deck, and wins the exhaust deck at least as often.

Against the previous `smart` (measured during development, paired, 9 fights x 30 seeds per deck; the old bot is not kept in the repo): identical on the starter deck by construction; HP lost -3.0 [-3.5, -2.6] in the mid decks and -1.5 [-1.9, -1.1] in the late ones; -2.1 [-2.8, -1.4] on syn-combo and -0.8 on syn-tag; and -18.0 [-20.4, -15.6] HP with +27.8 points of win rate on syn-exhaust (the Quick Draw stall).

`expert` is unchanged except one rule: another play (or ending the turn) must beat `smart`'s own pick by 0.75 HP-equivalents, because without it the noisy rollouts talked the lookahead out of good plays. Pooled over the 9 fights (40 seeds), `expert` wins as often as `smart` and loses less HP on the ordinary decks (starter 14.3 vs 16.6 HP lost when won, mid 12.1 vs 14.6, late 8.2 vs 12.2) and about the same on the synergy decks. It is not an upper bound there: its position value only sees HP and enemy HP, not stored value such as Strength or counters (section 11).

## 3. Where the fights fall against the provisional bands

Mid reference deck (reward-pool cards only; the bands apply to this set), 3 sampled decks x 100 seeds per fight. "ok / LOW / HIGH" are the toolkit's flags against `src/sim/targets.ts`; the win flag is for the bot named in the column.

| fight | tier | smart: win | HP lost (won) | turns | random: win | greedy: win |
| --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 100% (in) | 6.7 (in) | 2.9 (below) | 100% (above) | 100% (in) |
| enemy-d+enemy-d | normal | 100% (in) | 5.6 (in) | 3.2 (in) | 100% (above) | 100% (in) |
| enemy-b+enemy-d | normal | 100% (in) | 9.3 (in) | 4.9 (in) | 100% (above) | 100% (in) |
| enemy-c | normal | 100% (in) | 11.7 (in) | 4.3 (in) | 100% (above) | 100% (in) |
| enemy-a+enemy-d | normal | 100% (in) | 13.4 (in) | 4.2 (in) | 100% (above) | 100% (in) |
| enemy-d+enemy-d+enemy-d | normal | 100% (in) | 13.1 (in) | 4.6 (in) | 100% (above) | 100% (in) |
| elite-a | elite | 100% (above) | 19.7 (in) | 4.8 (below) | 100% (above) | 100% (above) |
| elite-b | elite | 100% (above) | 18.1 (in) | 5.0 (in) | 100% (above) | 100% (above) |
| boss-a | boss | 100% (above) | 34.7 (in) | 8.9 (in) | 58% (above) | 100% (above) |

Reading: normal fights are inside the bands for `smart` except enemy-a, which is a little short (2.9 turns). **Every elite and boss win rate is HIGH for all three bots**, including `random` (100% on both elites, 58% on the boss with a mid deck, 6% with the starter deck). HP lost when won is inside its band for `smart` everywhere. The honest summary is that the elites are not elites yet: a random player beats them.

How the synergy decks do against the same tiers (`smart`; win / HP lost when won / turns; all 9 fights x 100 seeds; one deck each except syn-mixed, which pools three):

| deck set | normal: win / HP lost (won) / turns | elite | boss |
| --- | --- | --- | --- |
| starter | 100% / 10.3 / 4.2 | 100% / 21.8 / 5.7 | 92% / 46.7 / 11.1 |
| mid | 100% / 10.0 / 4.0 | 100% / 18.9 / 4.9 | 100% / 34.7 / 8.9 |
| late | 100% / 8.7 / 3.5 | 100% / 15.0 / 4.2 | 100% / 26.2 / 7.1 |
| syn-tag | 100% / 5.2 / 3.6 | 100% / 12.4 / 4.7 | 100% / 31.9 / 8.8 |
| syn-exhaust | 100% / 8.2 / 2.7 | 100% / 12.5 / 3.4 | 98% / 28.4 / 6.0 |
| syn-trigger | 100% / 3.2 / 4.3 | 100% / 3.5 / 5.3 | 100% / 9.9 / 9.1 |
| syn-mult | 100% / 13.2 / 2.5 | 100% / 15.2 / 3.0 | 100% / 40.6 / 4.7 |
| syn-combo | 100% / 6.7 / 2.5 | 100% / 8.3 / 2.9 | 100% / 28.1 / 5.4 |
| syn-mixed | 100% / 8.9 / 4.1 | 100% / 16.3 / 5.3 | 100% / 35.4 / 9.0 |

- **syn-trigger** (block/trigger deck) is far too safe: elites cost 3.5 HP and the boss 9.9 (bands 12-27 and 21-42), at 9 turns for the boss; it also drags: `greedy` needs 16 turns for the boss.
- **syn-mult** and **syn-combo** end fights in 2.5-3 turns (normal and elite) and about 5 for the boss (band 8-14): roughly half the reference deck's turns. They are hand-built decks, so "faster than the reference deck" is expected; the point is how much.
- **syn-exhaust** is the only family that is not trivially safe, and only for `greedy` and `random` (boss win rate 17% and 67%); `smart` wins it 98%.
- `--pool all` (mid and late decks sampled from every non-starter card, synergy cards included) behaves like the reward-only decks: `smart` mid deck 99.3% wins, 16.9 HP lost when won, 4.3 turns. The synergy cards sampled into random decks mostly do not assemble into anything.

## 4. Card by card (single-card effect)

Effect of adding one card to a deck: HP lost per fight, `smart`, paired, 9 fights x 100 seeds, with 95% CI (negative = the card helps). Verdict letters are B(etter) / W(orse) / n(egligible) / ? (inconclusive) for random, greedy, smart in that order. Sorted by the mid column. Reproduce: `npm run balance -- cards --skills random,greedy,smart --context mid --seeds 100 --modes add` (and `--context starter|late|syn-mixed`).

| card | cost | starter | mid | late | syn-mixed | verdicts r/g/s: starter, mid, late, syn-mixed |
| --- | --- | --- | --- | --- | --- | --- |
| end-guard | 1 | -5.0 [-5.5, -4.5] | -2.2 [-2.6, -1.8] | -2.5 [-3.0, -2.0] | -2.6 [-3.1, -2.2] | BBB BBB BBB BBB |
| guarded-strike | 1 | -3.9 [-4.4, -3.5] | -1.9 [-2.3, -1.4] | -1.3 [-1.8, -0.8] | -1.9 [-2.3, -1.5] | BBB BBB BBB BBB |
| attack-echo | 1 | -3.9 [-4.4, -3.5] | -1.8 [-2.3, -1.4] | -1.5 [-1.9, -1.0] | -1.9 [-2.4, -1.5] | BBB BBB BBB BBB |
| expose | 1 | +2.1 [+1.6, +2.5] | -1.7 [-2.2, -1.2] | +1.1 [+0.6, +1.6] | -0.3 [-0.7, +0.2] | nWW nnB WWW nnn |
| sunder | 2 | +1.8 [+1.4, +2.3] | -1.4 [-1.8, -0.9] | +0.9 [+0.4, +1.3] | +0.2 [-0.2, +0.6] | nWW nWB ?WW nWn |
| big-block | 2 | -4.5 [-5.0, -3.9] | -1.3 [-1.8, -0.8] | -0.4 [-0.9, +0.1] | -1.8 [-2.2, -1.4] | BBB BBB BBn BBB |
| power-up | 1 | -0.0 [-0.5, +0.4] | -1.3 [-1.7, -0.8] | -0.6 [-1.0, -0.1] | +0.5 [+0.2, +0.9] | nWn nnB nWB WWW |
| prime-a | 0 | -2.5 [-3.0, -2.0] | -1.0 [-1.4, -0.5] | -1.2 [-1.6, -0.7] | -1.4 [-1.7, -1.0] | BBB BBB BBB BBB |
| combo-strike | 1 | -1.1 [-1.5, -0.7] | -0.9 [-1.3, -0.5] | -0.5 [-1.0, -0.1] | -0.2 [-0.6, +0.2] | BWB nnB nnB nnn |
| jab | 0 | -1.3 [-1.7, -0.8] | -0.7 [-1.1, -0.3] | -0.7 [-1.1, -0.2] | -0.7 [-1.1, -0.3] | BnB BBB BnB BBB |
| hand-strike | 1 | -1.1 [-1.5, -0.7] | -0.4 [-0.8, +0.0] | -0.4 [-0.9, +0.0] | -0.0 [-0.4, +0.4] | BWB nnn nnn nWn |
| heavy-hit | 3 | -0.7 [-1.1, -0.3] | -0.3 [-0.7, +0.1] | -0.5 [-0.9, -0.0] | +1.2 [+0.8, +1.5] | BnB nnn nnB nnW |
| block-slam | 1 | -2.5 [-2.9, -2.1] | -0.3 [-0.7, +0.2] | -0.8 [-1.2, -0.3] | -0.3 [-0.6, +0.1] | WWB WWn WnB WWn |
| single-use-strike | 1 | -0.8 [-1.2, -0.4] | -0.2 [-0.7, +0.2] | -0.3 [-0.8, +0.1] | +0.1 [-0.2, +0.5] | BnB Bnn ?nn Bnn |
| strengthen | 1 | +2.6 [+2.2, +3.0] | -0.1 [-0.5, +0.3] | -0.3 [-0.7, +0.2] | +0.3 [-0.1, +0.7] | BBW Bnn ?Wn Bnn |
| weaken | 1 | -0.1 [-0.6, +0.3] | +0.1 [-0.4, +0.5] | -0.1 [-0.6, +0.3] | -1.3 [-1.7, -0.9] | BBn nBn nWn BBB |
| double-strength | 1 | +0.7 [+0.3, +1.2] | +0.1 [-0.4, +0.5] | +0.0 [-0.4, +0.5] | +0.6 [+0.2, +1.0] | WWW WWn Wnn WWW |
| defend | 1 | -0.2 [-0.7, +0.2] | +0.3 [-0.2, +0.7] | -0.3 [-0.8, +0.1] | -0.5 [-0.9, -0.1] | BBn nBn ?nn BBB |
| cull | 0 | -0.0 [-0.5, +0.4] | +0.3 [-0.1, +0.8] | -0.7 [-1.2, -0.2] | -0.3 [-0.7, +0.1] | WWn nWn BnB nWn |
| opening-spark | 1 | +0.3 [-0.1, +0.7] | +0.6 [+0.1, +1.0] | +0.2 [-0.2, +0.7] | +1.0 [+0.7, +1.4] | Bnn nnW nWn WWW |
| opportunist | 1 | -0.2 [-0.6, +0.2] | +0.6 [+0.2, +1.0] | -1.4 [-1.8, -0.9] | +0.2 [-0.2, +0.5] | WWn WnW nnB WWn |
| tag-a-payoff | 1 | -0.0 [-0.5, +0.4] | +0.6 [+0.2, +1.1] | +0.0 [-0.5, +0.5] | +0.1 [-0.2, +0.5] | WWn WnW Wnn WWn |
| exhaust-payoff | 1 | +0.0 [-0.4, +0.4] | +0.7 [+0.3, +1.1] | +0.0 [-0.4, +0.5] | +0.2 [-0.2, +0.5] | WWn WnW Wnn WWn |
| strike | 1 | +0.5 [+0.1, +0.9] | +0.7 [+0.3, +1.1] | +0.1 [-0.4, +0.5] | +0.3 [-0.1, +0.7] | nWW nnW ?nn nWn |
| bolt | 2 | +2.4 [+2.0, +2.8] | +0.8 [+0.4, +1.2] | +0.4 [-0.1, +0.8] | +1.3 [+0.9, +1.7] | WWW WWW nnn WWW |
| quick-draw | 1 | +0.3 [-0.1, +0.7] | +0.8 [+0.3, +1.2] | +0.1 [-0.4, +0.6] | +0.3 [-0.1, +0.7] | WWn WWW WWn WWn |
| tag-a-echo | 1 | +0.1 [-0.3, +0.5] | +0.8 [+0.4, +1.2] | +0.0 [-0.5, +0.5] | +1.4 [+1.0, +1.8] | WWn WWW WWn WWW |
| exhaust-engine | 1 | +0.1 [-0.3, +0.5] | +0.8 [+0.4, +1.2] | +0.0 [-0.5, +0.5] | +0.9 [+0.5, +1.3] | WWn WWW WWn WWW |
| fortify | 2 | +0.2 [-0.3, +0.7] | +0.9 [+0.5, +1.4] | +0.3 [-0.2, +0.8] | +0.6 [+0.2, +1.1] | BBn nnW nnn nnW |
| kill-reward | 1 | +0.6 [+0.2, +1.0] | +1.0 [+0.5, +1.4] | +0.2 [-0.3, +0.6] | +0.5 [+0.1, +0.9] | WWW WWW WWn WWW |
| pain-engine | 1 | +1.8 [+1.4, +2.2] | +1.1 [+0.7, +1.6] | +0.5 [+0.1, +1.0] | +1.0 [+0.6, +1.4] | BnW nWW nWW nWW |
| blood-strike | 1 | +4.0 [+3.6, +4.4] | +1.5 [+1.0, +1.9] | +1.5 [+1.1, +2.0] | +3.1 [+2.7, +3.5] | nWW WWW WWW WWW |
| block-spark | 1 | +0.4 [-0.0, +0.7] | +1.6 [+1.1, +2.0] | +0.3 [-0.1, +0.8] | +1.0 [+0.6, +1.3] | Bnn nWW nWn nWW |
| focus | 1 | +1.2 [+0.8, +1.6] | +1.8 [+1.3, +2.2] | +1.1 [+0.7, +1.6] | +1.4 [+1.0, +1.7] | WBW WWW WWW WWW |

How to read this honestly:

- **HP lost here tracks fight length.** Enemies deal roughly the same damage each turn, so a card that ends fights a turn sooner saves about as much HP as a block card. Removing a plain Strike from a built deck usually makes it better (section 6), because it thins the deck toward the cards that matter. Adding any card to the starter or mid deck has a small dilution cost (a Strike costs +0.5 to +0.7 HP for `smart`), which is why dead-weight cards read as "worse".
- **Better for every bot in every context: End Guard, Guarded Strike, Attack Echo, Prime A** (and Big Block in all but one cell). All defensive or cheap value cards. The outlier report flags End Guard in its cost cohort for `smart` (`npm run balance -- outliers --skills greedy,smart --context mid`).
- **Block Slam is skill-dependent**: worse for `random` and `greedy`, better for `smart` (starter context W W B), because it needs block played first. Likewise Combo Strike and Hand Strike (B W B). That is the intended shape: skill is rewarded.
- **Cards that need a partner look weak alone** (Tag A Payoff, Exhaust Payoff, Exhaust Engine, Tag A Echo, Opportunist, Kill Reward): section 6 shows what they do in their own decks.
- **Greedy's Quick Draw is a stall**, not a measurement of Quick Draw: `greedy` keeps drawing instead of attacking (+5.7 HP lost [+5.2, +6.2], +1.4 turns, mid deck).
- Bolt (cost 2, 12 damage) reads worse than adding nothing for `smart` in the starter deck (+2.4 HP [+2.0, +2.8], win rate -2.2 points): it deals Strike's damage per energy but is clumsier. Heavy Hit (24 for 3) does not show the problem.

## 5. Pairs

Experiment: `npm run balance -- pairs --skill smart --context mid --cardset all --max-pairs 500 --seeds 80` (all 435 pairs of the non-starter cards; 720 paired units per deck). A pair's score is `benefit(A+B) - benefit(A) - benefit(B)`, in HP.

**The score has a non-zero centre.** Benefits are not additive even for cards that do not interact (each added card dilutes the deck, and HP lost is bounded and lumpy), so the cloud of scores sits off zero: median +0.68 HP in the mid deck (p10 +0.17, p90 +1.02), -0.15 in the starter deck. Reading raw scores against zero would call 188 of 435 mid-deck pairs "clearly synergistic". This session changed the pair experiment to judge each pair against the median pair when there are 20 or more (the raw score is still printed). Against the median, mid deck, `smart`: **7 clearly synergistic, 22 clearly anti-synergistic, 266 negligible, 140 inconclusive.** With 435 tests about 20 would look significant by chance, so single hits are leads, not findings.

Strongest (above the typical pair): Block Spark with End Guard (+1.99 [+1.25, +2.72]), Attack Echo (+1.92), Prime A (+1.80), Fortify (+1.71) and Guarded Strike (+1.45): Block Spark pays whenever any block lands, so it likes every block card, which is its design. Expose + Opportunist (+1.44 [+0.69, +2.19]) and Fortify + Weaken (+1.37) complete the list. Anti-synergy: **Expose + Sunder (-1.40 [-2.14, -0.65])**, the two Vulnerable appliers overlapping; then Fortify + Sunder, Fortify + Expose and Expose + Attack Echo. These are redundancy, not defects.

The designed pairs, with control pairs at the bottom (cards that should not interact: Strike + Defend, Jab + Strike, Defend + Big Block, Bolt + Jab, which show the centre, +0.45 to +0.68 for `smart`). 200 seeds, mid deck:

| pair | smart: synergy score (HP) [95% CI] | greedy | smart: turns |
| --- | --- | --- | --- |
| opportunist + sunder | +1.37 [+0.91, +1.83] | +0.37 [-0.06, +0.81] | +0.08 [+0.03, +0.13] |
| expose + opportunist | +1.00 [+0.52, +1.48] | +0.28 [-0.15, +0.71] | +0.11 [+0.06, +0.16] |
| big-block + block-slam | +0.98 [+0.45, +1.51] | -0.22 [-0.68, +0.25] | +0.03 [-0.03, +0.08] |
| block-slam + defend | +0.82 [+0.31, +1.32] | -0.48 [-0.93, -0.04] | +0.02 [-0.03, +0.07] |
| cull + exhaust-payoff | +0.78 [+0.30, +1.26] | -0.40 [-0.86, +0.07] | +0.07 [+0.02, +0.12] |
| double-strength + strengthen | +0.78 [+0.33, +1.23] | +0.01 [-0.40, +0.43] | +0.06 [+0.01, +0.11] |
| prime-a + tag-a-payoff | +0.73 [+0.25, +1.22] | -0.44 [-0.88, +0.00] | +0.05 [+0.00, +0.10] |
| attack-echo + jab | +0.73 [+0.29, +1.17] | +0.72 [+0.32, +1.11] | -0.01 [-0.05, +0.04] |
| bolt + power-up | +0.70 [+0.22, +1.18] | +0.11 [-0.33, +0.55] | +0.03 [-0.02, +0.08] |
| heavy-hit + power-up | +0.69 [+0.20, +1.18] | -0.13 [-0.57, +0.31] | +0.05 [-0.00, +0.10] |
| exhaust-payoff + single-use-strike | +0.69 [+0.22, +1.15] | +0.01 [-0.42, +0.44] | +0.04 [-0.01, +0.09] |
| big-block + defend | +0.68 [+0.15, +1.22] | -0.55 [-1.03, -0.07] | +0.00 [-0.06, +0.06] |
| combo-strike + quick-draw | +0.66 [+0.20, +1.12] | +0.24 [-0.19, +0.66] | +0.04 [-0.01, +0.08] |
| hand-strike + quick-draw | +0.63 [+0.17, +1.09] | +0.21 [-0.22, +0.64] | +0.04 [-0.00, +0.09] |
| blood-strike + pain-engine | +0.63 [+0.18, +1.07] | +0.64 [+0.22, +1.06] | +0.06 [+0.02, +0.11] |
| defend + strike | +0.61 [+0.13, +1.09] | -0.44 [-0.87, -0.02] | +0.00 [-0.05, +0.05] |
| block-spark + defend | +0.52 [+0.04, +1.01] | +0.12 [-0.30, +0.54] | +0.03 [-0.02, +0.08] |
| tag-a-echo + tag-a-payoff | +0.47 [-0.03, +0.96] | -0.05 [-0.47, +0.38] | -0.00 [-0.05, +0.05] |
| combo-strike + jab | +0.46 [-0.00, +0.93] | -0.43 [-0.86, -0.01] | +0.00 [-0.04, +0.05] |
| bolt + jab | +0.46 [-0.01, +0.93] | -0.24 [-0.67, +0.18] | -0.01 [-0.05, +0.04] |
| jab + strike | +0.45 [-0.01, +0.91] | -0.46 [-0.89, -0.04] | -0.00 [-0.05, +0.04] |
| jab + kill-reward | +0.42 [-0.05, +0.90] | +0.19 [-0.23, +0.60] | +0.01 [-0.04, +0.06] |
| power-up + tag-a-payoff | +0.41 [-0.08, +0.89] | -0.30 [-0.74, +0.14] | +0.01 [-0.05, +0.06] |
| block-slam + end-guard | +0.25 [-0.19, +0.70] | -0.26 [-0.67, +0.15] | -0.02 [-0.07, +0.03] |
| blood-strike + strengthen | +0.20 [-0.25, +0.64] | -0.11 [-0.53, +0.31] | -0.03 [-0.08, +0.01] |
| cull + exhaust-engine | +0.19 [-0.30, +0.69] | -0.06 [-0.50, +0.38] | +0.06 [+0.01, +0.11] |
| prime-a + tag-a-echo | -0.38 [-0.88, +0.11] | +0.92 [+0.49, +1.35] | -0.03 [-0.08, +0.03] |
| exhaust-engine + single-use-strike | -0.52 [-0.99, -0.05] | +0.14 [-0.29, +0.57] | -0.03 [-0.08, +0.02] |

Reading: for `smart`, only Opportunist + Sunder (+1.37), Expose + Opportunist (+1.00), Big Block + Block Slam (+0.98) and Block Slam + Defend (+0.82) clearly clear the control pairs. The rest are within noise of "two cards that do not interact". `greedy` mostly cannot use the pairs at all. Pair-level testing is the wrong tool for payoff cards: a particular 2-card combination shows up in a 15-card deck about once a fight. Use the ablation below.

## 6. Cards inside the decks they were built for (ablation)

Each card's contribution inside its own family deck: the deck minus one copy of the card against the full deck, paired (`npm run balance -- ablate --sets synergy --skills greedy,smart --seeds 100`). The table is *without minus with*: positive HP lost means the deck gets worse without the card, so the card helps; "HURTS" means the deck is measurably better without it. `smart` is shown; the `greedy` sections are in the same command's output.

#### syn-tag, smart bot
| card | copies | HP lost (without - with) | turns (without - with) | win rate (without - with) | verdict |
| --- | --- | --- | --- | --- | --- |
| tag-a-echo | 1 | +2.3 [+1.8, +2.8] | +0.80 [+0.73, +0.88] | -1.2 [-1.9, -0.5] pts | helps |
| prime-a | 3 | +2.2 [+1.7, +2.6] | +0.25 [+0.20, +0.31] | -0.4 [-0.9, -0.0] pts | helps |
| defend | 3 | -0.6 [-1.0, -0.2] | -0.52 [-0.57, -0.47] | +0.0 [+0.0, +0.0] pts | HURTS |
| tag-a-payoff | 2 | -1.3 [-1.7, -0.9] | +0.24 [+0.18, +0.29] | +0.0 [+0.0, +0.0] pts | HURTS |
| jab | 2 | -1.8 [-2.3, -1.4] | -0.29 [-0.35, -0.23] | +0.0 [+0.0, +0.0] pts | HURTS |
| strike | 2 | -2.0 [-2.4, -1.6] | -0.17 [-0.23, -0.12] | +0.0 [+0.0, +0.0] pts | HURTS |
| bolt | 1 | -2.7 [-3.1, -2.3] | +0.27 [+0.21, +0.33] | +0.0 [+0.0, +0.0] pts | HURTS |

#### syn-exhaust, smart bot
| card | copies | HP lost (without - with) | turns (without - with) | win rate (without - with) | verdict |
| --- | --- | --- | --- | --- | --- |
| exhaust-engine | 1 | +2.2 [+1.7, +2.8] | +0.41 [+0.35, +0.47] | -0.6 [-1.2, +0.1] pts | helps |
| single-use-strike | 2 | +1.4 [+0.9, +1.9] | +0.28 [+0.22, +0.34] | -0.1 [-0.6, +0.4] pts | helps |
| exhaust-payoff | 2 | +1.4 [+0.8, +2.0] | +0.35 [+0.28, +0.42] | -1.1 [-1.9, -0.3] pts | helps |
| cull | 2 | +1.1 [+0.6, +1.5] | +0.15 [+0.10, +0.20] | +0.1 [-0.3, +0.5] pts | helps |
| defend | 2 | +0.3 [-0.1, +0.8] | -0.28 [-0.34, -0.23] | +0.1 [-0.3, +0.5] pts | negligible |
| quick-draw | 1 | -0.0 [-0.5, +0.5] | -0.09 [-0.15, -0.02] | +0.0 [-0.4, +0.4] pts | negligible |
| bolt | 1 | -0.9 [-1.4, -0.4] | +0.04 [-0.03, +0.11] | +0.1 [-0.3, +0.5] pts | HURTS |
| strike | 2 | -1.1 [-1.6, -0.7] | -0.15 [-0.21, -0.09] | +0.1 [-0.3, +0.5] pts | HURTS |

#### syn-trigger, smart bot
| card | copies | HP lost (without - with) | turns (without - with) | win rate (without - with) | verdict |
| --- | --- | --- | --- | --- | --- |
| big-block | 1 | +1.4 [+1.1, +1.7] | -0.25 [-0.30, -0.20] | +0.0 [+0.0, +0.0] pts | helps |
| attack-echo | 1 | +1.2 [+0.9, +1.5] | -0.06 [-0.11, -0.01] | +0.0 [+0.0, +0.0] pts | helps |
| end-guard | 1 | +1.1 [+0.8, +1.4] | -0.29 [-0.34, -0.24] | +0.0 [+0.0, +0.0] pts | helps |
| defend | 3 | +0.4 [+0.1, +0.6] | -0.26 [-0.31, -0.21] | +0.0 [+0.0, +0.0] pts | helps |
| jab | 1 | -0.0 [-0.3, +0.3] | +0.29 [+0.23, +0.34] | +0.0 [+0.0, +0.0] pts | negligible |
| block-slam | 2 | -0.5 [-0.8, -0.3] | +0.38 [+0.33, +0.44] | +0.0 [+0.0, +0.0] pts | HURTS |
| strike | 2 | -0.9 [-1.1, -0.6] | +0.01 [-0.04, +0.06] | +0.0 [+0.0, +0.0] pts | HURTS |
| block-spark | 1 | -1.3 [-1.5, -1.1] | +0.26 [+0.20, +0.31] | +0.0 [+0.0, +0.0] pts | HURTS |
| opening-spark | 1 | -1.5 [-1.8, -1.3] | +0.15 [+0.10, +0.21] | +0.0 [+0.0, +0.0] pts | HURTS |

#### syn-mult, smart bot
| card | copies | HP lost (without - with) | turns (without - with) | win rate (without - with) | verdict |
| --- | --- | --- | --- | --- | --- |
| heavy-hit | 1 | +1.3 [+0.9, +1.7] | +0.02 [-0.02, +0.06] | +0.0 [+0.0, +0.0] pts | helps |
| power-up | 2 | +0.7 [+0.4, +1.1] | +0.04 [+0.01, +0.08] | +0.0 [+0.0, +0.0] pts | helps |
| defend | 2 | +0.7 [+0.4, +1.0] | -0.09 [-0.12, -0.05] | +0.0 [+0.0, +0.0] pts | helps |
| strike | 3 | +0.2 [-0.2, +0.5] | -0.01 [-0.05, +0.02] | +0.0 [+0.0, +0.0] pts | negligible |
| bolt | 1 | +0.2 [-0.2, +0.5] | -0.03 [-0.07, +0.01] | +0.0 [+0.0, +0.0] pts | negligible |
| double-strength | 1 | +0.0 [-0.3, +0.4] | -0.06 [-0.09, -0.03] | +0.0 [+0.0, +0.0] pts | negligible |
| strengthen | 1 | -0.4 [-0.8, -0.1] | -0.06 [-0.09, -0.02] | +0.0 [+0.0, +0.0] pts | HURTS |
| pain-engine | 1 | -0.7 [-1.0, -0.3] | -0.11 [-0.15, -0.07] | +0.0 [+0.0, +0.0] pts | HURTS |
| blood-strike | 2 | -0.9 [-1.3, -0.5] | +0.18 [+0.15, +0.22] | +0.0 [+0.0, +0.0] pts | HURTS |

#### syn-combo, smart bot
| card | copies | HP lost (without - with) | turns (without - with) | win rate (without - with) | verdict |
| --- | --- | --- | --- | --- | --- |
| expose | 1 | +1.3 [+0.9, +1.7] | +0.31 [+0.26, +0.36] | -0.3 [-0.7, +0.0] pts | helps |
| combo-strike | 2 | +1.2 [+0.8, +1.5] | +0.23 [+0.19, +0.27] | -0.1 [-0.3, +0.1] pts | helps |
| defend | 2 | +1.1 [+0.8, +1.4] | -0.17 [-0.21, -0.13] | +0.0 [+0.0, +0.0] pts | helps |
| hand-strike | 2 | -0.1 [-0.4, +0.2] | +0.00 [-0.04, +0.04] | +0.0 [+0.0, +0.0] pts | negligible |
| jab | 3 | -0.1 [-0.4, +0.1] | -0.00 [-0.04, +0.03] | +0.0 [+0.0, +0.0] pts | negligible |
| opportunist | 1 | -0.2 [-0.5, +0.1] | -0.01 [-0.06, +0.03] | +0.0 [+0.0, +0.0] pts | negligible |
| quick-draw | 1 | -0.3 [-0.6, -0.0] | -0.08 [-0.12, -0.03] | +0.0 [+0.0, +0.0] pts | HURTS |
| strike | 2 | -0.4 [-0.7, -0.0] | -0.02 [-0.06, +0.02] | +0.0 [+0.0, +0.0] pts | HURTS |

#### syn-mixed, smart bot
| card | copies | HP lost (without - with) | turns (without - with) | win rate (without - with) | verdict |
| --- | --- | --- | --- | --- | --- |
| attack-echo | 1 | +2.2 [+1.9, +2.4] | -0.10 [-0.14, -0.07] | -0.0 [-0.1, +0.0] pts | helps |
| prime-a | 1 | +1.3 [+1.0, +1.5] | +0.00 [-0.03, +0.03] | -0.0 [-0.1, +0.0] pts | helps |
| defend | 4 | +0.9 [+0.7, +1.1] | -0.24 [-0.27, -0.22] | -0.2 [-0.3, -0.0] pts | helps |
| combo-strike | 1 | +0.2 [-0.1, +0.4] | +0.33 [+0.29, +0.36] | -0.0 [-0.1, +0.0] pts | negligible |
| opportunist | 1 | -0.2 [-0.4, +0.1] | +0.12 [+0.09, +0.16] | -0.0 [-0.1, +0.0] pts | negligible |
| tag-a-payoff | 1 | -0.3 [-0.5, -0.1] | -0.01 [-0.04, +0.02] | -0.0 [-0.1, +0.0] pts | HURTS |
| strike | 4 | -0.4 [-0.6, -0.2] | +0.04 [+0.01, +0.07] | +0.0 [+0.0, +0.0] pts | HURTS |
| block-spark | 1 | -0.4 [-0.7, -0.1] | +0.20 [+0.17, +0.24] | -0.0 [-0.1, +0.0] pts | HURTS |
| exhaust-engine | 1 | -0.4 [-0.7, -0.1] | +0.10 [+0.06, +0.13] | -0.0 [-0.1, +0.0] pts | HURTS |
| single-use-strike | 1 | -0.7 [-0.9, -0.4] | +0.22 [+0.19, +0.25] | -0.1 [-0.2, +0.0] pts | HURTS |
| focus | 1 | -0.8 [-1.1, -0.6] | +0.07 [+0.04, +0.10] | -0.2 [-0.3, -0.0] pts | HURTS |
| bolt | 1 | -1.5 [-1.7, -1.3] | +0.37 [+0.33, +0.40] | +0.0 [+0.0, +0.0] pts | HURTS |


Reading:

- **The families do carry value:** Tag A Echo (+2.3 HP, +0.8 turns) and Prime A (+2.2) in syn-tag; Exhaust Engine (+2.2), Single Use Strike (+1.4), Exhaust Payoff (+1.4) and Cull (+1.1) in syn-exhaust; Big Block, Attack Echo and End Guard in syn-trigger; Expose and Combo Strike in syn-combo; Heavy Hit and Power Up in syn-mult.
- **Cards that cost their own deck HP (`smart`, CI excludes zero):** Block Spark (-1.3 [-1.5, -1.1], meaning the deck loses less HP without it) and Opening Spark (-1.5) in syn-trigger; Pain Engine, Blood Strike and Strengthen in syn-mult (-0.7, -0.9, -0.4); Quick Draw in syn-combo (-0.3); Tag A Payoff in syn-tag (-1.3). Read them with the turns column: Pain Engine and Strengthen are worse on both HP and turns (the deck is also faster without them), while Tag A Payoff, Blood Strike, Block Spark and Opening Spark do speed fights up (+0.24, +0.18, +0.26, +0.15 turns without them) for more HP than the speed saves. Tag A Payoff costing the deck built for it HP is the clearest "payoff is not worth its slot" signal: 3 + 5 per tag played, with 3 enablers.
- Basic Strikes, Jabs and Bolt read as HURTS in nearly every deck because removing them thins the deck toward the engine. Not a defect.
- Defend helps in syn-trigger and syn-exhaust and hurts in syn-tag (-0.6): block is worth its slot only where the deck takes real damage over a longer fight.

## 7. Degenerate combinations (adversarial search)

Tools: `npm run balance -- loops` (exhaustive over small decks), `combos --goal damage|speed|stall` (random search with hill climbing, confirmed on fresh seeds), `deck --cards ...` (a fixed deck, with Dummy output and loop-cap counts). Loops are measured with the `smart` bot against a Dummy that never dies and never attacks; a "loop" is a turn with 20 or more plays (an honest turn tops out near 10; the bots' own safety cap is 60 plays, so damage measured at the cap is a lower bound).

**Loop finder** (every deck of 2 to 5 cards, up to 2 copies each, 34 cards; 546,635 decks tried, decks containing a known loop skipped):

| loop core | plays in a turn (max) | damage turn 1 | damage in 2 turns |
| --- | --- | --- | --- |
| prime-a, tag-a-echo | 60 | 0 | 0 |

Prime A and Tag A Echo are the only minimal loop up to size 5. (For decks of up to 5 cards the whole deck is the opening hand, so this does not depend on the shuffle.) With Quick Draw at cost 0 the finder reports a loop with *every* card (free draw 2 redraws itself after a reshuffle), which is why "make Quick Draw free" is not proposed without exhaust (section 10).

**How thin must the deck be?** `prime-a*3, tag-a-echo, tag-a-payoff*2` plus N Defends, `smart`, damage per turn on the Dummy (100 seeds; none hit the 60-play cap, because the payoff cashes in after 30 plays):

| deck size | turn 1 / 2 / 3 / 4 damage | 4-turn total [95% CI] |
| --- | --- | --- |
| 8 | 26 / 291 / 479 / 479 | 1275 [1230, 1319] |
| 10 | 14 / 21 / 26 / 22 | 82 [79, 86] |
| 12 | 10 / 12 / 19 / 17 | 58 [54, 61] |
| 14 | 6 / 7 / 9 / 10 | 32 [30, 33] |
| 16 | 5 / 6 / 7 / 10 | 28 [25, 30] |
| 20 | 3 / 4 / 4 / 4 | 15 [14, 16] |

A cliff between 8 and 10 cards: with 3 enablers in an 8-card deck nearly every draw finds another Prime A. Starter + two Prime A + Echo + Payoff (14 cards) kills the boss in 10.2 turns, no faster than a normal deck. A thinning card (Cull exhausts) or a card-removal shop could move a deck across the cliff mid-fight, so the loop should still be fixed.

**Fastest and strongest decks** (8-20 cards, up to 3 copies of a card, confirmed on 40 fresh seeds). Damage to the Dummy in 5 turns, all cards, search seed 1 (`combos --goal damage --cardset all --trials 600 --climb 400 --seed 1`). All five contain the Prime A + Echo loop, with Tag A Payoff, Combo Strike or Block Slam as the payoff (any attack that scales with plays or block works, not only the tagged one); the loop-capped column is 0 for most because the bot cashes in after 30 plays:

| rank | cards | size | damage [95% CI] | best / worst seed | loop-capped runs |
| --- | --- | --- | --- | --- | --- |
| 1 | exhaust-engine, prime-a*3, single-use-strike, tag-a-payoff, tag-a-echo, big-block | 8 | 2694 [2637, 2751] | 2871 / 2345 | 0/40 |
| 2 | block-spark, cull, tag-a-payoff, prime-a*3, strengthen, tag-a-echo | 8 | 2666 [2615, 2717] | 2808 / 2380 | 0/40 |
| 3 | prime-a*3, tag-a-echo, attack-echo, kill-reward, tag-a-payoff, block-spark | 8 | 2629 [2579, 2680] | 2776 / 2189 | 0/40 |
| 4 | cull, tag-a-payoff*3, prime-a*2, tag-a-echo, exhaust-engine | 8 | 2416 [2160, 2671] | 2967 / 180 | 0/40 |
| 5 | jab, tag-a-echo*2, prime-a*2, combo-strike, strengthen*3 | 9 | 2570 [2533, 2607] | 2711 / 2102 | 40/40 |

Search seed 2. Its first row is the loop again with Strength doublers on top (14 cards, play cap hit in 40 of 40 runs); the other four are Strength builds with no loop (Pain Engine, Blood Strike, Double Strength, 0-cost cards), 600-800 damage in 5 turns:

| rank | cards | size | damage [95% CI] | best / worst seed | loop-capped runs |
| --- | --- | --- | --- | --- | --- |
| 1 | double-strength*3, prime-a*2, tag-a-echo*3, strengthen*3, jab, sunder, focus | 14 | 4591 [4145, 5038] | 7011 / 1808 | 40/40 |
| 2 | blood-strike*3, exhaust-payoff, strengthen*3, double-strength*3, pain-engine*2, expose, jab | 14 | 823 [759, 887] | 1216 / 449 | 0/40 |
| 3 | jab, strengthen*3, blood-strike, sunder, double-strength*3, attack-echo, block-spark, opportunist, pain-engine | 13 | 761 [703, 820] | 1145 / 334 | 0/40 |
| 4 | pain-engine*3, blood-strike*3, tag-a-echo, prime-a, jab, double-strength | 10 | 633 [617, 649] | 778 / 540 | 0/40 |
| 5 | expose*3, power-up, strengthen*2, jab, opportunist*2 | 9 | 594 [570, 618] | 760 / 422 | 0/40 |

Turns to kill the boss, deck size 8-20, all cards (`combos --goal speed --fights boss-a --cardset all`). Rows 1-3 are 8-9 card decks that kill it in 2 turns by looping Prime A and Tag A Echo into Combo Strike, Block Slam or Tag A Payoff; rows 4-5 are 15-17 card decks that still contain the pair and need about 4:

| rank | cards | size | turns [95% CI] | best / worst seed | wins all fights [95% CI] |
| --- | --- | --- | --- | --- | --- |
| 1 | opening-spark, pain-engine, combo-strike, power-up, tag-a-echo*2, end-guard, prime-a | 8 | 2.05 [1.98, 2.12] | 2.0 / 3.0 | 100.0% [91.2%, 100.0%] |
| 2 | prime-a, block-slam*2, tag-a-echo*2, opening-spark*2, guarded-strike | 8 | 2.23 [2.09, 2.36] | 2.0 / 3.0 | 100.0% [91.2%, 100.0%] |
| 3 | pain-engine, prime-a, opening-spark, tag-a-payoff, quick-draw, single-use-strike, focus*2, tag-a-echo | 9 | 2.10 [2.00, 2.20] | 2.0 / 3.0 | 100.0% [91.2%, 100.0%] |
| 4 | jab, hand-strike, tag-a-echo*3, single-use-strike*2, prime-a*2, big-block, combo-strike, end-guard, opening-spark*2, cull, pain-engine, block-spark | 17 | 3.98 [3.79, 4.16] | 3.0 / 5.0 | 100.0% [91.2%, 100.0%] |
| 5 | expose, big-block*2, jab, pain-engine, prime-a, guarded-strike, sunder, opportunist*2, blood-strike*3, strengthen, opening-spark | 15 | 4.22 [4.07, 4.38] | 3.0 / 5.0 | 100.0% [91.2%, 100.0%] |

Same, deck size 12-20 with at most 2 copies (a more realistic deck): the fastest needs about 4 turns.

| rank | cards | size | turns [95% CI] | best / worst seed | wins all fights [95% CI] |
| --- | --- | --- | --- | --- | --- |
| 1 | strengthen, block-spark*2, opportunist, double-strength, pain-engine*2, attack-echo, hand-strike, blood-strike*2, end-guard | 12 | 4.05 [3.98, 4.12] | 4.0 / 5.0 | 100.0% [91.2%, 100.0%] |
| 2 | strengthen*2, defend, double-strength, hand-strike*2, pain-engine*2, focus, tag-a-echo, blood-strike, combo-strike, opportunist | 13 | 4.33 [4.17, 4.48] | 4.0 / 5.0 | 100.0% [91.2%, 100.0%] |
| 3 | opportunist, sunder, pain-engine, strengthen*2, blood-strike, jab*2, tag-a-echo, end-guard, opening-spark, bolt | 12 | 4.30 [4.15, 4.45] | 4.0 / 5.0 | 100.0% [91.2%, 100.0%] |
| 4 | prime-a, guarded-strike, sunder, opportunist, blood-strike, combo-strike, heavy-hit, strengthen, opening-spark, block-spark, hand-strike, power-up, big-block | 13 | 4.90 [4.78, 5.02] | 4.0 / 6.0 | 100.0% [91.2%, 100.0%] |
| 5 | opportunist, sunder, expose, tag-a-echo, prime-a*2, bolt, strengthen, block-spark, power-up, end-guard, blood-strike*2, tag-a-payoff, hand-strike, jab | 16 | 4.72 [4.58, 4.87] | 4.0 / 5.0 | 100.0% [91.2%, 100.0%] |

Ablating the best 8-card speed deck once the loop is gone (`blood-strike*2, pain-engine*2, opportunist, strengthen, jab, expose`, `smart`, boss, 100 seeds, in-memory tweaks via `deck --tweak`): 3.01 turns; Strengthen 2 to 1: 3.03; Blood Strike damage 14 to 10: 3.07; Expose 2 to 1: 3.04; Opportunist scaling 4 to 2: 3.04. No single number moves it, because the deck deals 130+ per turn from turn 3 on through stacked Strength: the lever is the shape (Strength with no cap, a 0-cost attack, free draw), not a value.

**Stall search** (goal "stall": decks with at least 4 damage cards that take the longest to win the boss; a loss counts as 60 turns):

| rank | cards | size | turns [95% CI] | best / worst seed | wins all fights [95% CI] |
| --- | --- | --- | --- | --- | --- |
| 1 | exhaust-payoff, tag-a-payoff, kill-reward, block-slam, tag-a-echo, weaken, cull, single-use-strike | 8 | 60.00 [60.00, 60.00] | 60.0 / 60.0 | 0.0% [0.0%, 8.8%] |
| 2 | power-up, defend, tag-a-echo, double-strength, expose, opening-spark, exhaust-payoff*2, combo-strike, tag-a-payoff*2, strike, block-slam | 13 | 57.42 [53.79, 61.06] | 60.0 / 8.0 | 5.0% [1.4%, 16.5%] |
| 3 | expose, strike, tag-a-payoff, quick-draw, block-slam, focus, exhaust-payoff, cull | 8 | 60.00 [60.00, 60.00] | 60.0 / 60.0 | 0.0% [0.0%, 8.8%] |
| 4 | tag-a-payoff, weaken*2, attack-echo, hand-strike, kill-reward, opportunist*2, power-up, cull*2, prime-a | 12 | 58.88 [56.60, 61.15] | 60.0 / 15.0 | 2.5% [0.4%, 12.9%] |
| 5 | cull, bolt, quick-draw*3, opportunist, block-slam, hand-strike, double-strength, single-use-strike, prime-a | 11 | 56.17 [51.83, 60.52] | 60.0 / 9.0 | 7.5% [2.6%, 19.9%] |

These decks are 8-13 cards of payoff cards (Exhaust Payoff, Tag A Payoff, Block Slam) without their enablers, plus weak support: they cannot win, not because of the engine but because the payoffs' base values (0, 2, 3) are tiny. Not a bug. No deck was found that the engine cannot finish.

## 8. Strictly dominated cards and cards below "adding nothing"

- Static check on plain cards (`npm run balance -- dominance`): **none**. The check skips cards with triggers, scaling, tags, exhaust or self-damage, which is where the interesting ones are.
- By hand: **Fortify is dominated by End Guard.** Both give 4 block each turn; End Guard costs 1 and triggers at the end of the turn it is played, Fortify costs 2 and starts next turn. Consistent with section 4: End Guard -2.2 HP, Fortify +0.9 HP [+0.5, +1.4] (worse than adding nothing) in the mid deck for `smart`.
- Below "adding nothing" on HP lost for both `greedy` and `smart` in the mid deck: Blood Strike, Kill Reward, Tag A Echo, Exhaust Engine, Quick Draw, Bolt, Focus (a second copy of a starter card). For most of these the reason is "needs a partner" (section 6 shows them working in their decks), but two are not rescued by their own decks: **Block Spark and Opening Spark cost syn-trigger HP** (they do speed its fights up a little), and **Kill Reward** has no deck in which it was measured to help.
- Kill Reward specifically, tested on the four multi-enemy fights only (250 seeds): still worse than nothing with its base effect (+0.6 HP for `smart`, +1.8 for `greedy`), with 2 energy instead of 1 (+0.4, +1.7) and with an added draw (+0.7, +1.6). A trigger on "an enemy died" cannot be worth much when the fight ends as the last enemy dies and the others are small; this is a design question, not a number.

## 9. Pacing

Fight length (turns) for the mid deck with `smart`: 2.9 to 8.9 depending on the fight, p10-p90 within about 2 turns (enemy-a 2-4, boss 7-12); `random` is much more variable (boss p10-p90 9-19). No fight has a long right tail for `smart`. The pacing risk is on the other side: the strength-engine and combo decks end fights in 2-3 turns, which is one or two hands.

## 10. Proposed number tweaks (NOT applied)

Each proposal was measured with `npm run balance -- tweak ...` or the global `--tweak` flag: the card is changed in memory, both versions run on the same seeds, and the change is a paired difference. HP lost per fight, 9 fights x 150 seeds; effect = deck with the card minus without (negative = the card helps); change = after minus before (negative = better for the player). Contexts are as named.

| proposal | context | skill | effect before (HP lost) | effect after | change from the tweak |
| --- | --- | --- | --- | --- | --- |
| tag-a-echo: once per turn | syn-tag | smart | -1.5 [-1.9, -1.0] | -0.2 [-0.6, +0.1] | +1.2 [+0.9, +1.6] |
| tag-a-echo: once per turn | syn-tag | greedy | -3.0 [-3.4, -2.5] | -1.0 [-1.4, -0.6] | +2.0 [+1.6, +2.4] |
| prime-a: cost 0 to 1 (alternative) | syn-tag | smart | -1.7 [-2.1, -1.4] | +0.1 [-0.2, +0.5] | +1.8 [+1.4, +2.3] |
| prime-a: cost 0 to 1 (alternative) | syn-tag | greedy | -1.6 [-2.0, -1.2] | +0.0 [-0.3, +0.4] | +1.7 [+1.2, +2.1] |
| end-guard: 4 to 3 block | mid | smart | -2.5 [-2.8, -2.1] | -1.4 [-1.8, -1.1] | +1.0 [+1.0, +1.1] |
| end-guard: 4 to 3 block | mid | greedy | -3.8 [-4.1, -3.4] | -2.5 [-2.9, -2.2] | +1.2 [+1.2, +1.3] |
| end-guard: 4 to 2 block (too far) | mid | smart | -2.5 [-2.8, -2.1] | -0.3 [-0.6, +0.1] | +2.2 [+2.1, +2.3] |
| end-guard: 4 to 2 block (too far) | mid | greedy | -3.8 [-4.1, -3.4] | -1.1 [-1.4, -0.7] | +2.7 [+2.6, +2.9] |
| fortify: cost 2 to 1 | mid | smart | +0.8 [+0.4, +1.1] | -0.4 [-0.8, -0.1] | -1.2 [-1.4, -1.0] |
| fortify: cost 2 to 1 | mid | greedy | -0.0 [-0.4, +0.4] | -1.8 [-2.1, -1.4] | -1.8 [-1.9, -1.6] |
| fortify: 4 to 6 block | mid | smart | +0.8 [+0.4, +1.1] | -0.4 [-0.8, -0.0] | -1.2 [-1.3, -1.1] |
| fortify: 4 to 6 block | mid | greedy | -0.0 [-0.4, +0.4] | -1.5 [-1.9, -1.0] | -1.4 [-1.6, -1.3] |
| blood-strike: lose 3 to 2 HP | mid | smart | +1.4 [+1.0, +1.7] | +0.2 [-0.1, +0.6] | -1.1 [-1.2, -1.1] |
| blood-strike: lose 3 to 2 HP | mid | greedy | +2.6 [+2.3, +3.0] | +1.2 [+0.8, +1.5] | -1.5 [-1.5, -1.4] |
| opening-spark: 3 to 6 damage | mid | smart | +0.5 [+0.1, +0.8] | -0.5 [-0.9, -0.1] | -0.9 [-1.1, -0.8] |
| opening-spark: 3 to 6 damage | mid | greedy | +0.1 [-0.2, +0.5] | -0.7 [-1.0, -0.3] | -0.8 [-0.9, -0.6] |
| block-spark: 3 to 6 damage | mid | smart | +1.3 [+0.9, +1.6] | +0.8 [+0.4, +1.1] | -0.5 [-0.7, -0.4] |
| block-spark: 3 to 6 damage | mid | greedy | +0.6 [+0.3, +0.9] | -0.4 [-0.7, -0.1] | -1.0 [-1.2, -0.8] |
| block-spark: 3 to 9 damage | mid | smart | +1.3 [+0.9, +1.6] | +0.4 [+0.0, +0.7] | -0.9 [-1.1, -0.7] |
| block-spark: 3 to 9 damage | mid | greedy | +0.6 [+0.3, +0.9] | -1.0 [-1.4, -0.7] | -1.6 [-1.8, -1.4] |
| block-spark: not once per turn | mid | smart | +1.3 [+0.9, +1.6] | +1.0 [+0.7, +1.4] | -0.3 [-0.4, -0.1] |
| block-spark: not once per turn | mid | greedy | +0.6 [+0.3, +0.9] | -0.5 [-0.9, -0.2] | -1.1 [-1.3, -1.0] |
| quick-draw: cost 1 to 0 and exhaust | mid | smart | +0.7 [+0.3, +1.0] | -0.2 [-0.6, +0.2] | -0.9 [-1.2, -0.5] |
| quick-draw: cost 1 to 0 and exhaust | mid | greedy | +5.7 [+5.3, +6.1] | -0.5 [-0.8, -0.2] | -6.2 [-6.7, -5.8] |
| quick-draw: draw 2 to 3 | mid | smart | +0.7 [+0.3, +1.0] | +0.4 [+0.0, +0.8] | -0.3 [-0.5, -0.1] |
| quick-draw: draw 2 to 3 | mid | greedy | +5.7 [+5.3, +6.1] | +5.9 [+5.5, +6.3] | +0.2 [-0.2, +0.5] |

| # | proposal | why (finding) | expected effect (measured) |
| --- | --- | --- | --- |
| 1 | **Tag A Echo fires once per turn** (`triggers[0].oncePerTurn = true`) | The only loop in the content (section 7) | `loops --max-size 5 --tweak "tag-a-echo:triggers.0.oncePerTurn=true"` finds no loop; the damage search's best deck falls from 2694 [2637, 2751] to 846 [780, 911] per 5 turns, and the fastest boss kill goes from 2.05 to 3.13 turns. Cost: the card helps the tag deck less (effect -1.5 to -0.2, i.e. +1.2 [+0.9, +1.6] HP for `smart`). The alternative (Prime A cost 0 to 1) also removes the loop but costs more (+1.8 HP) |
| 2 | **End Guard 4 to 3 block, and Fortify cost 2 to 1** | End Guard is the strongest card in every context and dominates Fortify (section 8) | Together in one `cards --tweak` run (mid deck, 100 seeds): End Guard effect -2.2 to -1.2 [-1.6, -0.8] (`smart`), -3.7 to -2.4 (`greedy`), in line with Guarded Strike (-1.9) and Attack Echo (-1.8); Fortify +0.9 to -0.2 [-0.6, +0.3] (`smart`), +0.1 to -1.7 (`greedy`), no longer dominated. Block 2 is too far (End Guard -0.3). Cards not tweaked in the same run give identical numbers before and after |
| 3 | **Blood Strike loses 2 HP instead of 3** | It buys about 1.2 turns for more HP than it saves (+1.5 in the mid deck, +4.0 in the starter deck) | effect +1.5 to +0.3 [-0.1, +0.8] (`smart`), +2.7 to +1.2 (`greedy`); turns unchanged (-0.31). Roughly neutral on HP while staying a tempo card |
| 4 | **Opening Spark 3 to 6 damage** | Below nothing in the mid deck and in its own deck | effect +0.6 to -0.3 [-0.8, +0.1] (`smart`), +0.2 to -0.6 (`greedy`) |
| 5 | **Block Spark: not fixable by a number alone** | 3 to 6 and 3 to 9 damage still leave it at +0.8 and +0.4 HP (`smart`); removing "once per turn" gives +1.0 | none of the three variants makes it clearly useful alone. Its pair scores say it wants block cards (top rows with End Guard, Attack Echo, Prime A): leave it until the block card pool is settled |
| 6 | **Quick Draw cost 0 and exhaust** (design-shaped, not only a number) | `greedy` stalls on it; mildly negative for `smart` | effect +0.7 to -0.2 [-0.6, +0.2] (`smart`), +5.7 to -0.5 (`greedy`); `loops --tweak "quick-draw:cost=0,exhaust=true"` adds no loop. Without exhaust a free Quick Draw is a loop with every card. Draw 2 to 3 only changes `smart` by -0.3 and does nothing for `greedy` |
| 7 | **Kill Reward: no number found** | Section 8 | 2 energy and an added draw both stay worse than nothing |

Not proposed, though the data points at them: Strength has no cap and Pain Engine + Blood Strike snowball (section 7); the tool can say that decks built on them kill the boss in 3-4 turns but not what a cap should be. Tag A Payoff hurts its own deck (section 6), but raising its base also changes the loop's damage: re-run `ablate` with proposal 1 applied (`--tweak`) before touching it. Enemy numbers: section 3 says elites and the boss are far too easy, but picking enemy numbers is outside this brief.

## 11. What the toolkit could not answer, and improvements

Could not answer:

- **Whether the engine is fun, readable or satisfying**, and whether a 2-3 turn kill with an engine is a reward or a bore. Needs a player.
- **A human's behaviour near loops.** The bots stop at 50-60 plays; a human may stop earlier or never. The `smart` bot also never *chooses* to build a loop (it plays whatever its heuristic ranks next), so loops are lower bounds on what a determined player does.
- **Relics, upgrades, shops and card removal in a run.** All measurements are fights at full HP with a fixed deck. The thin-deck cliff in section 7 matters most with card removal, which fight-level tests cannot see.
- **How likely a run is to assemble a Strength engine.** The adversarial search builds decks the draft would rarely produce; the run-level `drafts` experiment has no synergy-seeking policy.
- **Expert's blind spot.** `expert` values positions by HP and enemy HP only, so it undervalues stored value (Strength, counters, Empowered); it is not an upper bound on the synergy decks.
- **Which metric to trust.** HP lost mixes damage race and defence in this regime (section 4); a card can look good or bad depending on the headline metric. The tools report all three, and verdicts should be read across them.

Added this session (see `docs/BALANCE.md`): `deck` (an exact deck, with Dummy output), `combos` (damage / speed / stall search), `loops` (exhaustive small-deck loop finder), `ablate` (a card's contribution inside a built deck), `tweak` and the global `--tweak` flag (in-memory what-if with paired before/after), `dominance` (static), `--cardset`, `--sets`, the synergy reference decks, and pair-score centring.

Still worth doing:

1. **Give `expert` the stored value** (Strength, Empowered, counters) in `evaluate()`, so it can be the upper bound on synergy decks.
2. **A synergy-seeking draft policy** for `drafts` (take the card that does most with the current deck), to estimate how often a run reaches an engine.
3. **Card removal and shops** in the whole-run simulator, to measure the thin-deck cliff.
4. **Re-set the win-rate bands** once real enemies exist: with the placeholder enemies every bot exceeds them.
5. **A sweep mode for `tweak`** (`--sweep effects.0.value=1..6`): one effect curve per card instead of one value per run.
6. **A play-by-play trace for `smart`**, to debug its heuristics against a card without writing a scratch test.
