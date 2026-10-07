## Card versus gold, by shop price

300 paired runs per row on seeds 1..300, fights played by the smart bot. Gold reward 25 (as in the game), shop of 4 cards, the shop is the only place gold is spent. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| always take the card (gold never taken) | 54.0% [48.3%, 59.6%] | base | 11.3 [11.0, 11.6] | 6.9 [6.6, 7.3] | base | 17.3 | 10 | base |
| price 20: always gold, route to shops | 27.3% [22.6%, 32.6%] | -26.7 [-32.8, -20.5] pts | 11.0 [10.7, 11.3] | 12.7 [12.2, 13.1] | +5.7 [+5.2, +6.2] | 11.0 | 145 | worse |
| price 20: gold only if a shop is ahead | 50.0% [44.4%, 55.6%] | -4.0 [-9.9, +1.9] pts | 11.3 [11.1, 11.6] | 8.5 [8.1, 9.0] | +1.6 [+1.2, +2.0] | 14.9 | 57 | INCONCLUSIVE |
| price 20: gold when no card adds 1+ HP/fight | 68.3% [62.9%, 73.3%] | +14.3 [+8.6, +20.1] pts | 11.9 [11.7, 12.1] | 6.1 [5.8, 6.4] | -0.8 [-1.1, -0.5] | 14.5 | 74 | better |
| price 30: always gold, route to shops | 27.0% [22.3%, 32.3%] | -27.0 [-32.9, -21.1] pts | 11.0 [10.7, 11.3] | 12.7 [12.3, 13.2] | +5.8 [+5.3, +6.3] | 10.9 | 139 | worse |
| price 30: gold only if a shop is ahead | 50.3% [44.7%, 56.0%] | -3.7 [-9.5, +2.1] pts | 11.4 [11.1, 11.6] | 8.5 [8.1, 9.0] | +1.6 [+1.2, +2.0] | 14.8 | 50 | INCONCLUSIVE |
| price 30: gold when no card adds 1+ HP/fight | 68.0% [62.5%, 73.0%] | +14.0 [+8.3, +19.7] pts | 11.9 [11.6, 12.1] | 6.1 [5.8, 6.4] | -0.8 [-1.1, -0.5] | 14.4 | 75 | better |
| price 40: always gold, route to shops | 26.0% [21.4%, 31.2%] | -28.0 [-34.0, -22.0] pts | 11.0 [10.7, 11.3] | 12.8 [12.4, 13.3] | +5.9 [+5.4, +6.4] | 10.8 | 136 | worse |
| price 40: gold only if a shop is ahead | 50.7% [45.0%, 56.3%] | -3.3 [-9.0, +2.4] pts | 11.4 [11.1, 11.6] | 8.6 [8.1, 9.0] | +1.6 [+1.2, +2.0] | 14.7 | 47 | INCONCLUSIVE |
| price 40: gold when no card adds 1+ HP/fight | 68.7% [63.2%, 73.7%] | +14.7 [+9.0, +20.4] pts | 11.9 [11.7, 12.1] | 6.2 [5.9, 6.5] | -0.8 [-1.1, -0.5] | 14.4 | 74 | better |
| price 50: always gold, route to shops | 25.3% [20.7%, 30.5%] | -28.7 [-34.7, -22.6] pts | 11.0 [10.7, 11.3] | 12.9 [12.5, 13.4] | +6.0 [+5.5, +6.5] | 10.8 | 132 | worse |
| price 50: gold only if a shop is ahead | 51.0% [45.4%, 56.6%] | -3.0 [-8.7, +2.7] pts | 11.4 [11.1, 11.6] | 8.5 [8.1, 9.0] | +1.6 [+1.2, +2.0] | 14.7 | 42 | INCONCLUSIVE |
| price 50: gold when no card adds 1+ HP/fight | 68.7% [63.2%, 73.7%] | +14.7 [+9.0, +20.4] pts | 11.9 [11.6, 12.1] | 6.2 [5.9, 6.5] | -0.8 [-1.1, -0.4] | 14.4 | 73 | better |
| price 60: always gold, route to shops | 23.3% [18.9%, 28.4%] | -30.7 [-36.7, -24.7] pts | 11.0 [10.7, 11.3] | 13.1 [12.6, 13.5] | +6.1 [+5.6, +6.6] | 10.7 | 132 | worse |
| price 60: gold only if a shop is ahead | 49.7% [44.0%, 55.3%] | -4.3 [-10.1, +1.4] pts | 11.3 [11.1, 11.6] | 8.6 [8.1, 9.0] | +1.6 [+1.2, +2.0] | 14.6 | 43 | INCONCLUSIVE |
| price 60: gold when no card adds 1+ HP/fight | 68.3% [62.9%, 73.3%] | +14.3 [+8.7, +20.0] pts | 11.9 [11.6, 12.1] | 6.2 [5.9, 6.5] | -0.7 [-1.0, -0.4] | 14.3 | 74 | better |
| price 80: always gold, route to shops | 21.3% [17.1%, 26.3%] | -32.7 [-38.5, -26.8] pts | 11.0 [10.7, 11.3] | 13.5 [13.1, 13.9] | +6.6 [+6.1, +7.0] | 10.5 | 135 | worse |
| price 80: gold only if a shop is ahead | 48.3% [42.7%, 54.0%] | -5.7 [-11.4, +0.0] pts | 11.3 [11.1, 11.6] | 8.7 [8.3, 9.1] | +1.7 [+1.3, +2.2] | 14.4 | 47 | INCONCLUSIVE |
| price 80: gold when no card adds 1+ HP/fight | 67.0% [61.5%, 72.1%] | +13.0 [+7.3, +18.7] pts | 11.8 [11.6, 12.1] | 6.3 [6.0, 6.6] | -0.7 [-1.0, -0.4] | 14.2 | 76 | better |

## Gold amount x shop price: change in final deck cost when always taking gold

300 paired runs per row on seeds 1..300, fights played by the smart bot. Cell = final deck cost with the "always gold, route to shops" policy minus the "always card" policy (HP lost per fight; POSITIVE = the gold policy ends with a WORSE deck, so the card was the better pick). "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| reward gold \ shop price | 20 | 30 | 40 | 60 |
| --- | --- | --- | --- | --- |
| 15 | +5.8 [+5.3, +6.3] (card wins) | +6.0 [+5.5, +6.5] (card wins) | +6.2 [+5.7, +6.7] (card wins) | +6.6 [+6.2, +7.1] (card wins) |
| 25 | +5.7 [+5.2, +6.2] (card wins) | +5.8 [+5.3, +6.3] (card wins) | +5.9 [+5.4, +6.4] (card wins) | +6.1 [+5.6, +6.6] (card wins) |
| 40 | +5.6 [+5.1, +6.0] (card wins) | +5.6 [+5.1, +6.1] (card wins) | +5.7 [+5.2, +6.2] (card wins) | +5.8 [+5.3, +6.3] (card wins) |
| 60 | +5.6 [+5.1, +6.1] (card wins) | +5.6 [+5.1, +6.1] (card wins) | +5.6 [+5.1, +6.1] (card wins) | +5.6 [+5.1, +6.1] (card wins) |

