## Relics at fight level

9 act fights x 30 seeds, smart bot, every deck of the group with and without the relic (paired). Cell = change in HP lost per fight [95% CI] (negative = the relic saves HP); win-rate change in points. Fights start at full HP (a +max-HP relic starts at its higher max, and a lost fight then counts that many HP, so read its win-rate cell, not its HP cell). Relics that act between fights (heal after a win, max HP once) are shown in the last two columns instead of in the fight.

| relic | starter | mid | late | synergy decks | between fights | on pickup |
| --- | --- | --- | --- | --- | --- | --- |
| strength-token | +1.09 [+0.42, +1.76] HP; +0.7 [-0.7, +2.2] pts | -0.75 [-1.06, -0.45] HP; +0.0 [+0.0, +0.0] pts | -0.60 [-0.85, -0.35] HP; +0.0 [+0.0, +0.0] pts | -0.79 [-0.95, -0.64] HP; +0.0 [-0.0, +0.1] pts | - | - |
| vitality-token | +0.03 [+0.00, +0.06] HP; +1.5 [+0.0, +2.9] pts | -0.04 [-0.10, +0.02] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.01 [-0.00, +0.01] HP; +0.0 [-0.0, +0.1] pts | - | +10 max HP once |
| guard-token | -3.27 [-3.70, -2.85] HP; +1.5 [+0.0, +2.9] pts | -3.67 [-3.92, -3.42] HP; +0.0 [+0.0, +0.0] pts | -3.83 [-4.04, -3.61] HP; +0.0 [+0.0, +0.0] pts | -3.45 [-3.57, -3.33] HP; +0.0 [-0.0, +0.1] pts | - | - |
| recovery-token | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +4 HP per fight won | - |
| draw-token | -0.23 [-0.90, +0.44] HP; +0.7 [-0.7, +2.2] pts | -0.09 [-0.54, +0.36] HP; +0.0 [+0.0, +0.0] pts | -0.31 [-0.71, +0.09] HP; +0.0 [+0.0, +0.0] pts | -1.50 [-1.72, -1.27] HP; +0.0 [-0.1, +0.1] pts | - | - |
| exhaust-token | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] HP; +0.0 [+0.0, +0.0] pts | -1.15 [-1.25, -1.04] HP; +0.0 [-0.0, +0.1] pts | - | - |
| kill-token | +0.11 [-0.05, +0.27] HP; +0.0 [+0.0, +0.0] pts | +0.20 [+0.10, +0.31] HP; +0.0 [+0.0, +0.0] pts | -0.01 [-0.14, +0.12] HP; +0.0 [+0.0, +0.0] pts | -0.11 [-0.17, -0.04] HP; +0.0 [+0.0, +0.0] pts | - | - |

## Relics: whole-run effect of starting the act with one

300 paired runs per row on seeds 1..300, fights played by the smart bot. Starting with a relic is the upper bound on its value (a relic found at an elite is held for fewer fights). The two synergy relics need decks that exhaust cards / kill enemies to do anything. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| no relic | 54.0% [48.3%, 59.6%] | base | 11.3 [11.0, 11.6] | 6.9 [6.6, 7.3] | base | 17.3 | 10 | base |
| starts with strength-token | 58.7% [53.0%, 64.1%] | +4.7 [+0.7, +8.7] pts | 11.5 [11.3, 11.8] | 6.4 [6.2, 6.7] | -0.5 [-0.7, -0.3] | 17.4 | 10 | better |
| starts with vitality-token | 69.3% [63.9%, 74.3%] | +15.3 [+11.1, +19.5] pts | 12.0 [11.8, 12.2] | 6.7 [6.4, 7.0] | -0.2 [-0.4, -0.1] | 17.7 | 10 | better |
| starts with guard-token | 85.0% [80.5%, 88.6%] | +31.0 [+25.6, +36.4] pts | 12.5 [12.4, 12.7] | 5.4 [5.1, 5.6] | -1.6 [-1.8, -1.3] | 18.1 | 12 | better |
| starts with recovery-token | 88.7% [84.6%, 91.8%] | +34.7 [+29.1, +40.2] pts | 12.7 [12.5, 12.8] | 6.5 [6.2, 6.8] | -0.5 [-0.7, -0.3] | 18.3 | 11 | better |
| starts with draw-token | 58.0% [52.3%, 63.4%] | +4.0 [-1.0, +9.0] pts | 11.3 [11.1, 11.6] | 5.0 [4.8, 5.3] | -1.9 [-2.2, -1.7] | 17.2 | 10 | INCONCLUSIVE |
| starts with exhaust-token | 54.0% [48.3%, 59.6%] | +0.0 [+0.0, +0.0] pts | 11.3 [11.0, 11.6] | 6.9 [6.6, 7.3] | +0.0 [+0.0, +0.0] | 17.3 | 10 | negligible |
| starts with kill-token | 51.7% [46.0%, 57.3%] | -2.3 [-5.6, +0.9] pts | 11.3 [11.0, 11.5] | 6.9 [6.6, 7.2] | -0.1 [-0.2, +0.0] | 17.2 | 10 | INCONCLUSIVE |

### Into the boss fight

| variant | runs that reached the boss | mean HP carried in | boss win rate (of those) |
| --- | --- | --- | --- |
| no relic | 179 | 41.9 | 90.5% |
| starts with strength-token | 189 | 41.5 | 93.1% |
| starts with vitality-token | 216 | 47.5 | 96.3% |
| starts with guard-token | 256 | 43.8 | 99.6% |
| starts with recovery-token | 270 | 47.6 | 98.5% |
| starts with draw-token | 186 | 41.5 | 93.5% |
| starts with exhaust-token | 179 | 41.9 | 90.5% |
| starts with kill-token | 177 | 40.7 | 87.6% |

## HP budget: win rate against starting max HP

300 paired runs per row on seeds 1..300, smart bot. Starting max HP (and HP) changed in memory; the rest of the run is the same. Differences are paired by seed against the first row, 95% intervals.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| max HP 60 (current) | 54.0% [48.3%, 59.6%] | base | 11.3 [11.0, 11.6] | 6.9 [6.6, 7.3] | base | 17.3 | 10 | base |
| max HP 40 (-20) | 26.0% [21.4%, 31.2%] | -28.0 [-33.3, -22.7] pts | 9.3 [9.0, 9.6] | 7.3 [7.0, 7.6] | +0.3 [+0.1, +0.5] | 15.9 | 9 | worse |
| max HP 50 (-10) | 40.3% [34.9%, 46.0%] | -13.7 [-17.9, -9.5] pts | 10.4 [10.1, 10.7] | 7.1 [6.8, 7.5] | +0.2 [+0.0, +0.4] | 16.6 | 10 | worse |
| max HP 55 (-5) | 48.3% [42.7%, 54.0%] | -5.7 [-8.9, -2.5] pts | 11.0 [10.7, 11.3] | 7.0 [6.7, 7.3] | +0.1 [-0.0, +0.2] | 17.0 | 10 | worse |
| max HP 65 (+5) | 63.0% [57.4%, 68.3%] | +9.0 [+5.5, +12.5] pts | 11.6 [11.4, 11.9] | 6.9 [6.6, 7.3] | -0.0 [-0.1, +0.1] | 17.5 | 10 | better |
| max HP 70 (+10) | 68.7% [63.2%, 73.7%] | +14.7 [+10.7, +18.7] pts | 12.0 [11.7, 12.2] | 6.8 [6.5, 7.2] | -0.1 [-0.2, +0.0] | 17.7 | 10 | better |
| max HP 80 (+20) | 80.3% [75.5%, 84.4%] | +26.3 [+21.3, +31.4] pts | 12.4 [12.3, 12.6] | 6.8 [6.5, 7.1] | -0.2 [-0.3, -0.0] | 18.0 | 10 | better |
| max HP 90 (+30) | 87.7% [83.5%, 90.9%] | +33.7 [+28.2, +39.1] pts | 12.7 [12.5, 12.8] | 6.7 [6.4, 7.0] | -0.3 [-0.4, -0.1] | 18.2 | 10 | better |

