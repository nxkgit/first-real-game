## Relics at fight level

9 act fights x 30 seeds, greedy bot, every deck of the group with and without the relic (paired). Cell = change in HP lost per fight [95% CI] (negative = the relic saves HP); win-rate change in points. Fights start at full HP (a +max-HP relic starts at its higher max, and a lost fight then counts that many HP, so read its win-rate cell, not its HP cell). Relics that act between fights (heal after a win, max HP once) are shown in the last two columns instead of in the fight.

| relic | starter | mid | late | synergy decks | between fights | on pickup |
| --- | --- | --- | --- | --- | --- | --- |
| strength-token | -2.07 [-2.52, -1.63] HP; +0.0 [+0.0, +0.0] pts | -1.08 [-1.28, -0.88] HP; +0.0 [+0.0, +0.0] pts | -0.88 [-1.06, -0.70] HP; +0.0 [+0.0, +0.0] pts | -1.66 [-1.82, -1.50] HP; +0.5 [+0.2, +0.8] pts | - | - |
| vitality-token | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.09 [+0.05, +0.12] HP; +0.9 [+0.5, +1.3] pts | - | +10 max HP once |
| guard-token | -2.37 [-2.72, -2.03] HP; +0.0 [+0.0, +0.0] pts | -2.76 [-3.01, -2.51] HP; +0.0 [+0.0, +0.0] pts | -3.42 [-3.63, -3.20] HP; +0.0 [+0.0, +0.0] pts | -3.25 [-3.37, -3.12] HP; +0.4 [+0.1, +0.7] pts | - | - |
| recovery-token | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +4 HP per fight won | - |
| draw-token | -3.76 [-4.40, -3.12] HP; +0.0 [+0.0, +0.0] pts | -2.46 [-2.93, -1.99] HP; +0.0 [+0.0, +0.0] pts | +0.37 [-0.09, +0.84] HP; +0.0 [+0.0, +0.0] pts | -2.29 [-2.54, -2.04] HP; +0.8 [+0.4, +1.2] pts | - | - |
| exhaust-token | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | -0.61 [-0.67, -0.55] HP; +0.2 [+0.0, +0.4] pts | - | - |
| kill-token | +0.01 [-0.09, +0.12] HP; +0.0 [+0.0, +0.0] pts | -0.02 [-0.11, +0.06] HP; +0.0 [+0.0, +0.0] pts | -0.10 [-0.25, +0.05] HP; +0.0 [+0.0, +0.0] pts | -0.17 [-0.24, -0.10] HP; +0.0 [+0.0, +0.0] pts | - | - |

## Relics: whole-run effect of starting the act with one

300 paired runs per row on seeds 1..300, fights played by the greedy bot. Starting with a relic is the upper bound on its value (a relic found at an elite is held for fewer fights). The two synergy relics need decks that exhaust cards / kill enemies to do anything. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| no relic | 92.3% [88.8%, 94.8%] | base | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | base | 18.3 | 11 | base |
| starts with strength-token | 95.3% [92.3%, 97.2%] | +3.0 [+0.3, +5.7] pts | 12.9 [12.8, 13.0] | 5.8 [5.5, 6.1] | -0.7 [-0.9, -0.5] | 18.4 | 11 | better |
| starts with vitality-token | 98.3% [96.2%, 99.3%] | +6.0 [+3.2, +8.8] pts | 13.0 [12.9, 13.0] | 6.2 [5.9, 6.5] | -0.3 [-0.4, -0.1] | 18.5 | 11 | better |
| starts with guard-token | 99.7% [98.1%, 99.9%] | +7.3 [+4.2, +10.4] pts | 13.0 [13.0, 13.0] | 5.1 [4.9, 5.3] | -1.4 [-1.6, -1.2] | 18.5 | 12 | better |
| starts with recovery-token | 99.3% [97.6%, 99.8%] | +7.0 [+4.0, +10.0] pts | 13.0 [13.0, 13.0] | 6.0 [5.7, 6.3] | -0.5 [-0.7, -0.4] | 18.5 | 12 | better |
| starts with draw-token | 98.3% [96.2%, 99.3%] | +6.0 [+2.9, +9.1] pts | 13.0 [12.9, 13.0] | 5.0 [4.7, 5.3] | -1.5 [-1.7, -1.3] | 18.4 | 11 | better |
| starts with exhaust-token | 92.3% [88.8%, 94.8%] | +0.0 [+0.0, +0.0] pts | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | +0.0 [+0.0, +0.0] | 18.3 | 11 | negligible |
| starts with kill-token | 93.7% [90.3%, 95.9%] | +1.3 [+0.0, +2.6] pts | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | -0.0 [-0.1, +0.1] | 18.4 | 11 | better |

### Into the boss fight

| variant | runs that reached the boss | mean HP carried in | boss win rate (of those) |
| --- | --- | --- | --- |
| no relic | 281 | 49.4 | 98.6% |
| starts with strength-token | 290 | 50.0 | 98.6% |
| starts with vitality-token | 296 | 56.8 | 99.7% |
| starts with guard-token | 299 | 53.2 | 100.0% |
| starts with recovery-token | 299 | 56.7 | 99.7% |
| starts with draw-token | 295 | 52.7 | 100.0% |
| starts with exhaust-token | 281 | 49.4 | 98.6% |
| starts with kill-token | 284 | 49.1 | 98.9% |

