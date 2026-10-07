## Pressure curve: HP lost per fight by floor

300 runs per policy on seeds 1..300. Bands are the provisional ones in src/sim/targets.ts (HP bands assume 60 max HP and the mid reference deck at full HP; here HP on entering varies, so a floor can read LOW simply because the player was healthy).

### greedy bot, best-card drafting

Run win rate 92.3% [88.8%, 94.8%]. HP lost is over fights that were WON (what the target bands use); the loss column is the share of fights at that floor that were lost. "Reached" is the share of runs that played that kind of fight on that floor.

| floor | tier | fights | reached | HP on entering | HP lost when won [CI] | lost | band (HP) | vs band |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | normal | 300 | 100.0% | 60.0 | 1.6 [1.3, 1.8] | 0.0% | 5-15 | LOW |
| 2 | normal | 235 | 78.3% | 58.5 | 1.6 [1.3, 1.9] | 0.0% | 5-15 | LOW |
| 3 | normal | 247 | 82.3% | 57.2 | 1.9 [1.5, 2.2] | 0.0% | 5-15 | LOW |
| 4 | normal | 225 | 75.0% | 56.4 | 5.4 [4.8, 6.0] | 0.0% | 5-15 | ok |
| 5 | normal | 175 | 58.3% | 51.7 | 4.7 [4.1, 5.4] | 0.0% | 5-15 | LOW |
| 5 | elite | 26 | 8.7% | 52.5 | 7.2 [4.8, 9.6] | 0.0% | 12-27 | LOW |
| 6 | normal | 191 | 63.7% | 49.9 | 5.0 [4.3, 5.7] | 0.0% | 5-15 | ok |
| 6 | elite | 32 | 10.7% | 50.6 | 5.7 [3.7, 7.8] | 0.0% | 12-27 | LOW |
| 7 | normal | 205 | 68.3% | 45.9 | 5.3 [4.6, 6.0] | 0.0% | 5-15 | ok |
| 7 | elite | 18 | 6.0% | 45.9 | 7.1 [4.2, 10.0] | 0.0% | 12-27 | LOW |
| 8 | normal | 184 | 61.3% | 42.8 | 4.6 [3.9, 5.2] | 1.6% | 5-15 | LOW |
| 8 | elite | 24 | 8.0% | 48.9 | 8.3 [5.5, 11.0] | 0.0% | 12-27 | LOW |
| 9 | normal | 212 | 70.7% | 42.1 | 4.9 [4.3, 5.5] | 1.4% | 5-15 | ok |
| 9 | elite | 17 | 5.7% | 44.4 | 5.8 [2.8, 8.7] | 0.0% | 12-27 | LOW |
| 10 | normal | 191 | 63.7% | 39.0 | 4.4 [3.8, 5.1] | 3.1% | 5-15 | LOW |
| 10 | elite | 20 | 6.7% | 41.9 | 7.1 [4.2, 10.0] | 5.0% | 12-27 | LOW |
| 11 | normal | 202 | 67.3% | 38.2 | 5.0 [4.3, 5.7] | 3.0% | 5-15 | ok |
| 11 | elite | 18 | 6.0% | 42.2 | 5.7 [2.6, 8.8] | 0.0% | 12-27 | LOW |
| 13 | boss | 281 | 93.7% | 49.4 | 11.1 [10.2, 12.0] | 1.4% | 21-42 | LOW |

| tier | fights | won | HP lost when won [CI] | band (HP) | vs band | turns (band) |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 2367 | 99.2% | 3.9 [3.7, 4.0] | 5-15 | LOW | 5.2 (3-6) ok |
| elite | 155 | 99.4% | 6.7 [5.8, 7.6] | 12-27 | LOW | 6.9 (5-9) ok |
| boss | 281 | 98.6% | 11.1 [10.2, 12.0] | 21-42 | LOW | 11.5 (8-14) ok |

### greedy bot, random-card drafting

Run win rate 49.7% [44.0%, 55.3%]. HP lost is over fights that were WON (what the target bands use); the loss column is the share of fights at that floor that were lost. "Reached" is the share of runs that played that kind of fight on that floor.

| floor | tier | fights | reached | HP on entering | HP lost when won [CI] | lost | band (HP) | vs band |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | normal | 300 | 100.0% | 60.0 | 1.6 [1.3, 1.8] | 0.0% | 5-15 | LOW |
| 2 | normal | 235 | 78.3% | 58.5 | 2.0 [1.6, 2.3] | 0.0% | 5-15 | LOW |
| 3 | normal | 247 | 82.3% | 56.8 | 2.4 [2.1, 2.8] | 0.0% | 5-15 | LOW |
| 4 | normal | 225 | 75.0% | 55.7 | 7.9 [7.1, 8.7] | 0.0% | 5-15 | ok |
| 5 | normal | 175 | 58.3% | 48.9 | 7.6 [6.8, 8.5] | 1.1% | 5-15 | ok |
| 5 | elite | 24 | 8.0% | 50.7 | 11.7 [8.2, 15.1] | 0.0% | 12-27 | LOW |
| 6 | normal | 194 | 64.7% | 45.6 | 8.2 [7.4, 9.0] | 0.5% | 5-15 | ok |
| 6 | elite | 29 | 9.7% | 48.1 | 11.8 [8.4, 15.2] | 3.4% | 12-27 | LOW |
| 7 | normal | 199 | 66.3% | 39.6 | 8.5 [7.6, 9.4] | 5.0% | 5-15 | ok |
| 7 | elite | 21 | 7.0% | 41.4 | 12.9 [9.9, 15.9] | 9.5% | 12-27 | ok |
| 8 | normal | 171 | 57.0% | 35.4 | 8.9 [7.9, 9.9] | 8.8% | 5-15 | ok |
| 8 | elite | 23 | 7.7% | 44.3 | 12.5 [8.9, 16.2] | 4.3% | 12-27 | ok |
| 9 | normal | 191 | 63.7% | 32.9 | 8.5 [7.6, 9.3] | 15.2% | 5-15 | ok |
| 9 | elite | 12 | 4.0% | 32.5 | 11.9 [9.1, 14.7] | 16.7% | 12-27 | LOW |
| 10 | normal | 149 | 49.7% | 32.5 | 8.2 [7.1, 9.2] | 12.8% | 5-15 | ok |
| 10 | elite | 21 | 7.0% | 35.1 | 10.2 [6.1, 14.4] | 14.3% | 12-27 | LOW |
| 11 | normal | 154 | 51.3% | 31.7 | 7.7 [6.8, 8.7] | 16.2% | 5-15 | ok |
| 11 | elite | 11 | 3.7% | 34.9 | 8.8 [2.4, 15.2] | 9.1% | 12-27 | LOW |
| 13 | boss | 189 | 63.0% | 45.7 | 21.3 [19.6, 22.9] | 21.2% | 21-42 | ok |

| tier | fights | won | HP lost when won [CI] | band (HP) | vs band | turns (band) |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 2240 | 95.5% | 5.9 [5.7, 6.2] | 5-15 | ok | 5.1 (3-6) ok |
| elite | 141 | 92.9% | 11.6 [10.3, 13.0] | 12-27 | LOW | 6.5 (5-9) ok |
| boss | 189 | 78.8% | 21.3 [19.6, 22.9] | 21-42 | ok | 10.3 (8-14) ok |

### greedy bot, best-card drafting

Run win rate 92.3% [88.8%, 94.8%]. HP lost is over fights that were WON (what the target bands use); the loss column is the share of fights at that floor that were lost. "Reached" is the share of runs that played that kind of fight on that floor.

| floor | tier | fights | reached | HP on entering | HP lost when won [CI] | lost | band (HP) | vs band |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | normal | 300 | 100.0% | 60.0 | 1.6 [1.3, 1.8] | 0.0% | 5-15 | LOW |
| 2 | normal | 235 | 78.3% | 58.5 | 1.6 [1.3, 1.9] | 0.0% | 5-15 | LOW |
| 3 | normal | 247 | 82.3% | 57.2 | 1.9 [1.5, 2.2] | 0.0% | 5-15 | LOW |
| 4 | normal | 225 | 75.0% | 56.4 | 5.4 [4.8, 6.0] | 0.0% | 5-15 | ok |
| 5 | normal | 175 | 58.3% | 51.7 | 4.7 [4.1, 5.4] | 0.0% | 5-15 | LOW |
| 5 | elite | 26 | 8.7% | 52.5 | 7.2 [4.8, 9.6] | 0.0% | 12-27 | LOW |
| 6 | normal | 191 | 63.7% | 49.9 | 5.0 [4.3, 5.7] | 0.0% | 5-15 | ok |
| 6 | elite | 32 | 10.7% | 50.6 | 5.7 [3.7, 7.8] | 0.0% | 12-27 | LOW |
| 7 | normal | 205 | 68.3% | 45.9 | 5.3 [4.6, 6.0] | 0.0% | 5-15 | ok |
| 7 | elite | 18 | 6.0% | 45.9 | 7.1 [4.2, 10.0] | 0.0% | 12-27 | LOW |
| 8 | normal | 184 | 61.3% | 42.8 | 4.6 [3.9, 5.2] | 1.6% | 5-15 | LOW |
| 8 | elite | 24 | 8.0% | 48.9 | 8.3 [5.5, 11.0] | 0.0% | 12-27 | LOW |
| 9 | normal | 212 | 70.7% | 42.1 | 4.9 [4.3, 5.5] | 1.4% | 5-15 | ok |
| 9 | elite | 17 | 5.7% | 44.4 | 5.8 [2.8, 8.7] | 0.0% | 12-27 | LOW |
| 10 | normal | 191 | 63.7% | 39.0 | 4.4 [3.8, 5.1] | 3.1% | 5-15 | LOW |
| 10 | elite | 20 | 6.7% | 41.9 | 7.1 [4.2, 10.0] | 5.0% | 12-27 | LOW |
| 11 | normal | 202 | 67.3% | 38.2 | 5.0 [4.3, 5.7] | 3.0% | 5-15 | ok |
| 11 | elite | 18 | 6.0% | 42.2 | 5.7 [2.6, 8.8] | 0.0% | 12-27 | LOW |
| 13 | boss | 281 | 93.7% | 49.4 | 11.1 [10.2, 12.0] | 1.4% | 21-42 | LOW |

| tier | fights | won | HP lost when won [CI] | band (HP) | vs band | turns (band) |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 2367 | 99.2% | 3.9 [3.7, 4.0] | 5-15 | LOW | 5.2 (3-6) ok |
| elite | 155 | 99.4% | 6.7 [5.8, 7.6] | 12-27 | LOW | 6.9 (5-9) ok |
| boss | 281 | 98.6% | 11.1 [10.2, 12.0] | 21-42 | LOW | 11.5 (8-14) ok |

