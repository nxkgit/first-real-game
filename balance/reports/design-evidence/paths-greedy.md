## Path choice

300 paired runs per row on seeds 1..300, fights played by the greedy bot. Path styles differ only in how the bot scores the next stop (the same map and the same fights offered). "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| random path (the baseline) | 94.7% [91.5%, 96.7%] | base | 12.9 [12.8, 12.9] | 6.9 [6.5, 7.2] | base | 17.7 | 16 | base |
| smart (rest when hurt, shop with gold, elites when strong) | 92.3% [88.8%, 94.8%] | -2.3 [-6.1, +1.4] pts | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | -0.3 [-0.7, +0.0] | 18.3 | 11 | INCONCLUSIVE |
| safe (never elites, rest more) | 92.0% [88.4%, 94.6%] | -2.7 [-6.5, +1.1] pts | 12.8 [12.7, 12.9] | 6.6 [6.3, 6.9] | -0.2 [-0.6, +0.1] | 18.3 | 11 | INCONCLUSIVE |
| elite-seeking | 94.3% [91.1%, 96.4%] | -0.3 [-3.9, +3.2] pts | 12.9 [12.8, 12.9] | 6.4 [6.1, 6.7] | -0.5 [-0.8, -0.1] | 17.9 | 15 | INCONCLUSIVE |
| fight-seeking | 92.0% [88.4%, 94.6%] | -2.7 [-6.5, +1.1] pts | 12.8 [12.7, 12.9] | 6.6 [6.3, 6.9] | -0.3 [-0.6, +0.1] | 18.3 | 11 | INCONCLUSIVE |
| shop-seeking (with gold taken) | 93.0% [89.5%, 95.4%] | -1.7 [-5.3, +2.0] pts | 12.8 [12.8, 12.9] | 7.3 [6.9, 7.7] | +0.5 [+0.0, +0.9] | 15.7 | 50 | INCONCLUSIVE |

### Random-path runs grouped by what their path held

Observational: the path was random, so groups differ by luck of the map as well as by the stops, but no policy selected into them. Only the first 7 floors are counted (nearly every run gets that far); counting the whole path would credit rests to runs that simply lived long enough to meet them.

| group | runs | win rate [CI] | floor reached |
| --- | --- | --- | --- |
| 0 elite | 245 | 94.7% [91.1%, 96.9%] | 12.9 [12.8, 12.9] |
| 1 elite | 54 | 94.4% [84.9%, 98.1%] | 12.9 [12.7, 13.1] |
| 0 rest | 230 | 93.5% [89.5%, 96.0%] | 12.8 [12.7, 12.9] |
| 1 rest | 67 | 98.5% [92.0%, 99.7%] | 12.9 [12.8, 13.1] |
| 0 shop | 245 | 93.9% [90.1%, 96.3%] | 12.8 [12.7, 12.9] |
| 1 shop | 52 | 98.1% [89.9%, 99.7%] | 13.0 [13.0, 13.0] |

