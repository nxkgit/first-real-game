## Card versus gold, by shop price

300 paired runs per row on seeds 1..300, fights played by the greedy bot. Gold reward 25 (as in the game), shop of 4 cards, the shop is the only place gold is spent. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| always take the card (gold never taken) | 92.3% [88.8%, 94.8%] | base | 12.8 [12.7, 12.9] | 6.5 [6.2, 6.8] | base | 18.3 | 11 | base |
| price 20: always gold, route to shops | 82.0% [77.3%, 85.9%] | -10.3 [-15.3, -5.4] pts | 12.8 [12.8, 12.9] | 11.3 [10.8, 11.7] | +4.8 [+4.2, +5.3] | 11.1 | 179 | worse |
| price 20: gold only if a shop is ahead | 92.7% [89.1%, 95.1%] | +0.3 [-2.9, +3.6] pts | 12.8 [12.8, 12.9] | 7.2 [6.9, 7.6] | +0.7 [+0.3, +1.1] | 15.8 | 61 | INCONCLUSIVE |
| price 20: gold when no card adds 1+ HP/fight | 96.3% [93.6%, 97.9%] | +4.0 [+1.1, +6.9] pts | 12.9 [12.8, 13.0] | 5.5 [5.1, 5.8] | -1.1 [-1.4, -0.7] | 14.8 | 90 | better |
| price 30: always gold, route to shops | 81.3% [76.5%, 85.3%] | -11.0 [-16.0, -6.0] pts | 12.8 [12.8, 12.9] | 11.3 [10.9, 11.8] | +4.8 [+4.3, +5.3] | 11.0 | 172 | worse |
| price 30: gold only if a shop is ahead | 92.3% [88.8%, 94.8%] | +0.0 [-3.2, +3.2] pts | 12.8 [12.8, 12.9] | 7.2 [6.9, 7.6] | +0.7 [+0.4, +1.1] | 15.8 | 53 | INCONCLUSIVE |
| price 30: gold when no card adds 1+ HP/fight | 95.7% [92.7%, 97.5%] | +3.3 [+0.3, +6.4] pts | 12.9 [12.8, 13.0] | 5.5 [5.2, 5.8] | -1.0 [-1.4, -0.7] | 14.6 | 91 | better |
| price 40: always gold, route to shops | 81.0% [76.2%, 85.0%] | -11.3 [-16.3, -6.3] pts | 12.8 [12.8, 12.9] | 11.5 [11.1, 12.0] | +5.0 [+4.5, +5.5] | 10.9 | 169 | worse |
| price 40: gold only if a shop is ahead | 93.0% [89.5%, 95.4%] | +0.7 [-2.4, +3.7] pts | 12.8 [12.8, 12.9] | 7.3 [6.9, 7.7] | +0.8 [+0.4, +1.2] | 15.7 | 50 | INCONCLUSIVE |
| price 40: gold when no card adds 1+ HP/fight | 95.7% [92.7%, 97.5%] | +3.3 [+0.3, +6.4] pts | 12.9 [12.8, 13.0] | 5.5 [5.2, 5.8] | -1.0 [-1.3, -0.7] | 14.6 | 90 | better |
| price 50: always gold, route to shops | 81.0% [76.2%, 85.0%] | -11.3 [-16.3, -6.3] pts | 12.8 [12.8, 12.9] | 11.6 [11.1, 12.0] | +5.1 [+4.6, +5.6] | 10.9 | 162 | worse |
| price 50: gold only if a shop is ahead | 93.0% [89.5%, 95.4%] | +0.7 [-2.4, +3.7] pts | 12.8 [12.8, 12.9] | 7.3 [7.0, 7.7] | +0.8 [+0.5, +1.2] | 15.7 | 44 | INCONCLUSIVE |
| price 50: gold when no card adds 1+ HP/fight | 95.7% [92.7%, 97.5%] | +3.3 [+0.3, +6.4] pts | 12.9 [12.8, 13.0] | 5.5 [5.2, 5.8] | -1.0 [-1.3, -0.7] | 14.6 | 89 | better |
| price 60: always gold, route to shops | 81.3% [76.5%, 85.3%] | -11.0 [-16.0, -6.0] pts | 12.8 [12.8, 12.9] | 11.7 [11.3, 12.1] | +5.2 [+4.7, +5.7] | 10.8 | 162 | worse |
| price 60: gold only if a shop is ahead | 93.0% [89.5%, 95.4%] | +0.7 [-2.4, +3.7] pts | 12.8 [12.8, 12.9] | 7.3 [7.0, 7.7] | +0.8 [+0.5, +1.2] | 15.6 | 43 | INCONCLUSIVE |
| price 60: gold when no card adds 1+ HP/fight | 95.7% [92.7%, 97.5%] | +3.3 [+0.3, +6.4] pts | 12.9 [12.8, 13.0] | 5.5 [5.2, 5.8] | -1.0 [-1.3, -0.6] | 14.6 | 89 | better |
| price 80: always gold, route to shops | 81.3% [76.5%, 85.3%] | -11.0 [-16.0, -6.0] pts | 12.8 [12.8, 12.9] | 11.9 [11.4, 12.3] | +5.4 [+4.9, +5.8] | 10.6 | 164 | worse |
| price 80: gold only if a shop is ahead | 93.0% [89.5%, 95.4%] | +0.7 [-2.5, +3.9] pts | 12.8 [12.8, 12.9] | 7.2 [6.9, 7.6] | +0.7 [+0.4, +1.1] | 15.4 | 45 | INCONCLUSIVE |
| price 80: gold when no card adds 1+ HP/fight | 96.0% [93.1%, 97.7%] | +3.7 [+0.6, +6.8] pts | 12.9 [12.8, 13.0] | 5.6 [5.3, 5.9] | -0.9 [-1.2, -0.6] | 14.5 | 92 | better |

## Gold amount x shop price: change in final deck cost when always taking gold

300 paired runs per row on seeds 1..300, fights played by the greedy bot. Cell = final deck cost with the "always gold, route to shops" policy minus the "always card" policy (HP lost per fight; POSITIVE = the gold policy ends with a WORSE deck, so the card was the better pick). "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| reward gold \ shop price | 20 | 30 | 40 | 60 |
| --- | --- | --- | --- | --- |
| 15 | +4.8 [+4.3, +5.4] (card wins) | +5.1 [+4.6, +5.6] (card wins) | +5.2 [+4.8, +5.7] (card wins) | +5.4 [+4.9, +5.9] (card wins) |
| 25 | +4.8 [+4.2, +5.3] (card wins) | +4.8 [+4.3, +5.3] (card wins) | +5.0 [+4.5, +5.5] (card wins) | +5.2 [+4.7, +5.7] (card wins) |
| 40 | +4.7 [+4.2, +5.2] (card wins) | +4.6 [+4.1, +5.1] (card wins) | +4.7 [+4.2, +5.3] (card wins) | +4.9 [+4.4, +5.4] (card wins) |
| 60 | +4.7 [+4.2, +5.2] (card wins) | +4.7 [+4.2, +5.2] (card wins) | +4.7 [+4.2, +5.2] (card wins) | +4.7 [+4.2, +5.2] (card wins) |

