## Card removal as a shop service

300 paired runs per row on seeds 1..300, fights played by the smart bot. The removal is bought after the shop's cards, so it competes for the same gold. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| gold + shops, no removal service | 26.0% [21.4%, 31.2%] | base | 11.0 [10.7, 11.3] | 12.8 [12.4, 13.3] | base | 10.8 | 136 | base |
| removal at 25 gold, removes the best card | 28.3% [23.5%, 33.7%] | +2.3 [-0.8, +5.5] pts | 11.0 [10.7, 11.3] | 12.5 [12.0, 13.0] | -0.3 [-0.5, -0.2] | 10.5 | 132 | INCONCLUSIVE |
| removal at 25 gold, removes a Strike-like starter card | 28.0% [23.2%, 33.3%] | +2.0 [-0.9, +4.9] pts | 11.0 [10.7, 11.3] | 12.3 [11.8, 12.8] | -0.5 [-0.7, -0.4] | 10.5 | 130 | INCONCLUSIVE |
| removal at 50 gold, removes the best card | 26.7% [22.0%, 31.9%] | +0.7 [-1.4, +2.7] pts | 11.0 [10.7, 11.3] | 12.7 [12.3, 13.2] | -0.1 [-0.2, -0.0] | 10.7 | 131 | negligible |
| removal at 50 gold, removes a Strike-like starter card | 27.3% [22.6%, 32.6%] | +1.3 [-0.7, +3.4] pts | 11.0 [10.7, 11.3] | 12.6 [12.1, 13.0] | -0.3 [-0.4, -0.2] | 10.6 | 129 | INCONCLUSIVE |
| removal at 75 gold, removes the best card | 27.3% [22.6%, 32.6%] | +1.3 [+0.0, +2.6] pts | 11.0 [10.7, 11.3] | 12.7 [12.3, 13.2] | -0.1 [-0.2, -0.0] | 10.7 | 130 | better |
| removal at 75 gold, removes a Strike-like starter card | 27.0% [22.3%, 32.3%] | +1.0 [-0.7, +2.7] pts | 11.0 [10.7, 11.3] | 12.6 [12.2, 13.1] | -0.2 [-0.3, -0.1] | 10.7 | 130 | negligible |

