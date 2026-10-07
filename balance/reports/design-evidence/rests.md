## Rest stops: heal or upgrade

### What each option is worth, by floor

Observed at the rest stops of 300 smart-policy runs. Heal = HP the rest restores (30% of max HP, capped at the HP missing). Upgrade = HP per fight the BEST single upgrade saves for the deck held at that moment (paired fights), and the mean over upgradable cards; times the fights still to come (from the map) gives its worth for the rest of the act. HP healed and HP saved are both in HP, so compare them directly; but HP only matters if it would run out, so the heal is worth less when HP is high.

| floor | rest stops | HP missing [CI] | HP a heal restores | best upgrade, HP/fight [CI] | avg upgrade, HP/fight | fights left | best upgrade over the rest of the act (HP) | avg upgrade over the rest of the act |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | 35 | 24.8 [22.1, 27.5] | 17.3 | 1.91 [1.65, 2.16] | 0.92 | 4.9 | 9.4 | 4.5 |
| 6 | 27 | 31.9 [27.0, 36.7] | 17.4 | 1.64 [1.46, 1.82] | 0.83 | 4.3 | 7.0 | 3.6 |
| 7 | 24 | 36.4 [31.1, 41.7] | 17.8 | 1.40 [1.22, 1.58] | 0.58 | 3.6 | 5.1 | 2.1 |
| 8 | 36 | 39.6 [36.1, 43.0] | 18.7 | 1.32 [1.16, 1.48] | 0.56 | 3.0 | 3.9 | 1.7 |
| 9 | 21 | 40.4 [34.7, 46.1] | 17.8 | 1.30 [1.08, 1.52] | 0.49 | 2.3 | 3.0 | 1.1 |
| 10 | 29 | 42.8 [37.3, 48.2] | 18.6 | 1.17 [1.01, 1.33] | 0.39 | 1.7 | 2.0 | 0.7 |
| 12 | 184 | 38.9 [37.0, 40.9] | 18.6 | 1.07 [1.01, 1.14] | 0.38 | 1.0 | 1.1 | 0.4 |

### Rest policies compared (whole runs)

300 paired runs per row on seeds 1..300, fights played by the smart bot. Heal fraction rows change the 30% heal in memory. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| smart (heal under 70% HP, else upgrade a random card) | 54.0% [48.3%, 59.6%] | base | 11.3 [11.0, 11.6] | 6.9 [6.6, 7.3] | base | 17.3 | 10 | base |
| always heal | 54.3% [48.7%, 59.9%] | +0.3 [-0.3, +1.0] pts | 11.3 [11.0, 11.6] | 7.0 [6.7, 7.3] | +0.0 [+0.0, +0.1] | 17.3 | 10 | negligible |
| always upgrade a random card | 28.0% [23.2%, 33.3%] | -26.0 [-31.0, -21.0] pts | 10.9 [10.6, 11.1] | 6.6 [6.3, 6.9] | -0.3 [-0.5, -0.2] | 17.0 | 11 | worse |
| always upgrade the best card | 30.7% [25.7%, 36.1%] | -23.3 [-28.4, -18.3] pts | 10.9 [10.7, 11.2] | 6.4 [6.1, 6.7] | -0.5 [-0.7, -0.4] | 17.0 | 11 | worse |
| heal under 50% HP, else upgrade the best card | 52.3% [46.7%, 57.9%] | -1.7 [-3.4, +0.1] pts | 11.2 [11.0, 11.5] | 6.8 [6.5, 7.1] | -0.1 [-0.2, -0.0] | 17.2 | 11 | INCONCLUSIVE |
| heal under 80% HP, else upgrade the best card | 54.3% [48.7%, 59.9%] | +0.3 [-0.3, +1.0] pts | 11.3 [11.0, 11.6] | 7.0 [6.7, 7.3] | +0.0 [-0.0, +0.1] | 17.3 | 10 | negligible |
| smart rest with heal fraction 0.2 | 47.3% [41.8%, 53.0%] | -6.7 [-9.8, -3.6] pts | 11.2 [11.0, 11.5] | 7.0 [6.7, 7.3] | +0.0 [-0.0, +0.1] | 17.2 | 10 | worse |
| smart rest with heal fraction 0.3 | 54.0% [48.3%, 59.6%] | +0.0 [+0.0, +0.0] pts | 11.3 [11.0, 11.6] | 6.9 [6.6, 7.3] | +0.0 [+0.0, +0.0] | 17.3 | 10 | negligible |
| smart rest with heal fraction 0.4 | 60.7% [55.0%, 66.0%] | +6.7 [+3.8, +9.5] pts | 11.4 [11.1, 11.7] | 6.9 [6.6, 7.2] | -0.1 [-0.2, -0.0] | 17.3 | 10 | better |
| smart rest with heal fraction 0.5 | 63.3% [57.7%, 68.6%] | +9.3 [+6.0, +12.6] pts | 11.4 [11.2, 11.7] | 6.8 [6.5, 7.1] | -0.1 [-0.2, -0.0] | 17.3 | 10 | better |

