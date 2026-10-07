## Card removal as a shop service

300 paired runs per row on seeds 1..300, fights played by the greedy bot. The removal is bought after the shop's cards, so it competes for the same gold. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| gold + shops, no removal service | 81.0% [76.2%, 85.0%] | base | 12.8 [12.8, 12.9] | 11.5 [11.1, 12.0] | base | 10.9 | 169 | base |
| removal at 25 gold, removes the best card | 82.0% [77.3%, 85.9%] | +1.0 [-0.5, +2.5] pts | 12.8 [12.8, 12.9] | 10.9 [10.4, 11.4] | -0.6 [-0.8, -0.4] | 10.6 | 161 | negligible |
| removal at 25 gold, removes a Strike-like starter card | 82.3% [77.6%, 86.2%] | +1.3 [-0.3, +2.9] pts | 12.9 [12.8, 12.9] | 10.9 [10.4, 11.4] | -0.6 [-0.8, -0.5] | 10.6 | 160 | negligible |
| removal at 50 gold, removes the best card | 81.7% [76.9%, 85.6%] | +0.7 [-0.6, +2.0] pts | 12.8 [12.8, 12.9] | 11.2 [10.7, 11.7] | -0.3 [-0.4, -0.2] | 10.7 | 160 | negligible |
| removal at 50 gold, removes a Strike-like starter card | 81.7% [76.9%, 85.6%] | +0.7 [-0.6, +2.0] pts | 12.8 [12.8, 12.9] | 11.1 [10.6, 11.6] | -0.4 [-0.5, -0.3] | 10.7 | 159 | negligible |
| removal at 75 gold, removes the best card | 82.0% [77.3%, 85.9%] | +1.0 [-0.1, +2.1] pts | 12.8 [12.8, 12.9] | 11.3 [10.8, 11.7] | -0.3 [-0.4, -0.1] | 10.8 | 158 | negligible |
| removal at 75 gold, removes a Strike-like starter card | 81.7% [76.9%, 85.6%] | +0.7 [-0.6, +2.0] pts | 12.8 [12.8, 12.9] | 11.2 [10.7, 11.7] | -0.3 [-0.4, -0.2] | 10.8 | 158 | negligible |

