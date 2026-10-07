## Path choice

300 paired runs per row on seeds 1..300, fights played by the smart bot. Path styles differ only in how the bot scores the next stop (the same map and the same fights offered). "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| random path (the baseline) | 55.0% [49.3%, 60.5%] | base | 11.4 [11.2, 11.6] | 7.1 [6.7, 7.4] | base | 16.9 | 15 | base |
| smart (rest when hurt, shop with gold, elites when strong) | 54.0% [48.3%, 59.6%] | -1.0 [-8.1, +6.1] pts | 11.3 [11.0, 11.6] | 6.9 [6.6, 7.3] | -0.1 [-0.4, +0.2] | 17.3 | 10 | INCONCLUSIVE |
| safe (never elites, rest more) | 54.0% [48.3%, 59.6%] | -1.0 [-8.1, +6.1] pts | 11.3 [11.0, 11.6] | 7.0 [6.7, 7.3] | -0.0 [-0.4, +0.3] | 17.3 | 10 | INCONCLUSIVE |
| elite-seeking | 62.3% [56.7%, 67.6%] | +7.3 [+0.5, +14.2] pts | 11.6 [11.4, 11.9] | 6.8 [6.5, 7.2] | -0.2 [-0.6, +0.1] | 17.0 | 12 | better |
| fight-seeking | 53.7% [48.0%, 59.2%] | -1.3 [-8.3, +5.7] pts | 11.3 [11.0, 11.5] | 7.0 [6.7, 7.3] | -0.0 [-0.4, +0.3] | 17.2 | 10 | INCONCLUSIVE |
| shop-seeking (with gold taken) | 50.7% [45.0%, 56.3%] | -4.3 [-11.6, +3.0] pts | 11.4 [11.1, 11.6] | 8.6 [8.1, 9.0] | +1.5 [+1.0, +2.0] | 14.7 | 47 | INCONCLUSIVE |

### Random-path runs grouped by what their path held

Observational: the path was random, so groups differ by luck of the map as well as by the stops, but no policy selected into them.

| group | runs | win rate [CI] | floor reached |
| --- | --- | --- | --- |
| 0 elite | 185 | 52.4% [45.3%, 59.5%] | 11.2 [10.9, 11.6] |
| 1 elite | 101 | 57.4% [47.7%, 66.6%] | 11.6 [11.2, 12.0] |
| 2 elite | 14 | 71.4% [45.4%, 88.3%] | 12.2 [11.4, 13.0] |
| 0 rest | 105 | 0.0% [0.0%, 3.5%] | 8.9 [8.6, 9.2] |
| 1 rest | 98 | 75.5% [66.1%, 83.0%] | 12.5 [12.3, 12.7] |
| 2 rest | 71 | 93.0% [84.6%, 97.0%] | 13.0 [13.0, 13.0] |
| 3 rest | 25 | 96.0% [80.5%, 99.3%] | 13.0 [13.0, 13.0] |
| 0 shop | 211 | 51.2% [44.5%, 57.8%] | 11.1 [10.7, 11.4] |
| 1 shop | 78 | 60.3% [49.2%, 70.4%] | 12.1 [11.8, 12.4] |
| 2+ shop | 11 | 90.9% [62.3%, 98.4%] | 12.8 [12.4, 13.2] |

