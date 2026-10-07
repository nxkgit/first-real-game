## Path choice

600 paired runs per row on seeds 1..600, fights played by the smart bot. Path styles differ only in how the bot scores the next stop (the same map and the same fights offered). "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| random path (the baseline) | 55.5% [51.5%, 59.4%] | base | 11.4 [11.3, 11.6] | 7.2 [7.0, 7.4] | base | 16.9 | 15 | base |
| smart (rest when hurt, shop with gold, elites when strong) | 56.7% [52.7%, 60.6%] | +1.2 [-3.6, +6.0] pts | 11.4 [11.2, 11.6] | 7.0 [6.8, 7.2] | -0.2 [-0.4, +0.1] | 17.3 | 12 | INCONCLUSIVE |
| safe (never elites, rest more) | 56.8% [52.8%, 60.7%] | +1.3 [-3.5, +6.2] pts | 11.4 [11.2, 11.6] | 7.0 [6.8, 7.3] | -0.1 [-0.4, +0.1] | 17.3 | 12 | INCONCLUSIVE |
| elite-seeking | 62.7% [58.7%, 66.4%] | +7.2 [+2.3, +12.0] pts | 11.7 [11.5, 11.8] | 6.9 [6.7, 7.1] | -0.3 [-0.5, -0.0] | 17.1 | 14 | better |
| fight-seeking | 56.7% [52.7%, 60.6%] | +1.2 [-3.6, +6.0] pts | 11.4 [11.2, 11.6] | 7.1 [6.9, 7.3] | -0.1 [-0.3, +0.1] | 17.3 | 12 | INCONCLUSIVE |
| shop-seeking (with gold taken) | 54.5% [50.5%, 58.4%] | -1.0 [-6.1, +4.1] pts | 11.5 [11.3, 11.7] | 8.3 [8.0, 8.5] | +1.1 [+0.7, +1.4] | 14.9 | 47 | INCONCLUSIVE |

### Random-path runs grouped by what their path held

Observational: the path was random, so groups differ by luck of the map as well as by the stops, but no policy selected into them. Only the first 7 floors are counted (nearly every run gets that far); counting the whole path would credit rests to runs that simply lived long enough to meet them.

| group | runs | win rate [CI] | floor reached |
| --- | --- | --- | --- |
| 0 elite | 481 | 56.5% [52.1%, 60.9%] | 11.6 [11.4, 11.7] |
| 1 elite | 116 | 50.9% [41.9%, 59.8%] | 11.0 [10.5, 11.4] |
| 0 rest | 453 | 47.5% [42.9%, 52.1%] | 11.1 [10.8, 11.3] |
| 1 rest | 142 | 79.6% [72.2%, 85.4%] | 12.6 [12.5, 12.8] |
| 2 rest | 5 | 100.0% [56.6%, 100.0%] | 13.0 [13.0, 13.0] |
| 0 shop | 485 | 55.3% [50.8%, 59.6%] | 11.4 [11.2, 11.6] |
| 1 shop | 111 | 55.9% [46.6%, 64.7%] | 11.7 [11.4, 12.1] |

