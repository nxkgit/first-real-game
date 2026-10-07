## Rest stops: heal or upgrade

### What each option is worth, by floor

Observed at the rest stops of 300 smart-policy runs. Heal = HP the rest restores (30% of max HP, capped at the HP missing). Upgrade = HP per fight the BEST single upgrade saves for the deck held at that moment (paired fights), and the mean over upgradable cards; times the fights still to come (from the map) gives its worth for the rest of the act. HP healed and HP saved are both in HP, so compare them directly; but HP only matters if it would run out, so the heal is worth less when HP is high.

| floor | rest stops | HP missing [CI] | HP a heal restores | best upgrade, HP/fight [CI] | avg upgrade, HP/fight | fights left | best upgrade over the rest of the act (HP) | avg upgrade over the rest of the act |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | 29 | 12.4 [9.8, 14.9] | 11.8 | 1.90 [1.59, 2.20] | 0.96 | 4.9 | 9.3 | 4.7 |
| 6 | 23 | 14.3 [10.9, 17.8] | 13.0 | 1.63 [1.42, 1.83] | 0.81 | 4.3 | 7.0 | 3.5 |
| 7 | 17 | 16.0 [10.5, 21.5] | 12.4 | 1.39 [1.21, 1.58] | 0.54 | 3.6 | 5.0 | 2.0 |
| 8 | 32 | 22.5 [18.0, 27.0] | 14.9 | 1.17 [1.02, 1.31] | 0.44 | 3.0 | 3.5 | 1.3 |
| 9 | 20 | 27.7 [21.3, 34.1] | 16.1 | 1.30 [1.03, 1.58] | 0.48 | 2.3 | 3.0 | 1.1 |
| 10 | 30 | 23.5 [18.3, 28.7] | 15.3 | 1.13 [1.00, 1.25] | 0.39 | 1.7 | 1.9 | 0.7 |
| 12 | 283 | 27.1 [25.2, 28.9] | 16.0 | 1.03 [0.98, 1.08] | 0.33 | 1.0 | 1.0 | 0.3 |

### Rest policies compared (whole runs)

300 paired runs per row on seeds 1..300, fights played by the greedy bot. Heal fraction rows change the 30% heal in memory. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| smart (heal under 70% HP, else upgrade a random card) | 92.3% [88.8%, 94.8%] | base | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | base | 18.3 | 11 | base |
| always heal | 92.3% [88.8%, 94.8%] | +0.0 [+0.0, +0.0] pts | 12.8 [12.7, 12.9] | 6.8 [6.5, 7.0] | +0.2 [+0.2, +0.3] | 18.3 | 11 | negligible |
| always upgrade a random card | 78.0% [73.0%, 82.3%] | -14.3 [-18.3, -10.4] pts | 12.7 [12.6, 12.8] | 6.2 [5.9, 6.5] | -0.3 [-0.4, -0.2] | 18.3 | 12 | worse |
| always upgrade the best card | 80.7% [75.8%, 84.7%] | -11.7 [-15.3, -8.0] pts | 12.7 [12.6, 12.8] | 5.9 [5.7, 6.2] | -0.6 [-0.7, -0.4] | 18.3 | 12 | worse |
| heal under 50% HP, else upgrade the best card | 91.7% [88.0%, 94.3%] | -0.7 [-1.6, +0.3] pts | 12.8 [12.7, 12.9] | 6.2 [5.9, 6.5] | -0.3 [-0.4, -0.2] | 18.3 | 13 | negligible |
| heal under 80% HP, else upgrade the best card | 92.3% [88.8%, 94.8%] | +0.0 [+0.0, +0.0] pts | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | +0.0 [-0.1, +0.1] | 18.3 | 11 | negligible |
| smart rest with heal fraction 0.2 | 90.7% [86.8%, 93.5%] | -1.7 [-3.1, -0.2] pts | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | +0.0 [-0.0, +0.0] | 18.3 | 11 | worse |
| smart rest with heal fraction 0.3 | 92.3% [88.8%, 94.8%] | +0.0 [+0.0, +0.0] pts | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | +0.0 [+0.0, +0.0] | 18.3 | 11 | negligible |
| smart rest with heal fraction 0.4 | 93.7% [90.3%, 95.9%] | +1.3 [+0.0, +2.6] pts | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | -0.0 [-0.0, +0.0] | 18.3 | 11 | better |
| smart rest with heal fraction 0.5 | 94.0% [90.7%, 96.2%] | +1.7 [+0.2, +3.1] pts | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | -0.0 [-0.0, +0.0] | 18.3 | 11 | better |

