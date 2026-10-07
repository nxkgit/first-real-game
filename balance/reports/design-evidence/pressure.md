## Pressure curve: HP lost per fight by floor

300 runs per policy on seeds 1..300. Bands are the provisional ones in src/sim/targets.ts (HP bands assume 60 max HP and the mid reference deck at full HP; here HP on entering varies, so a floor can read LOW simply because the player was healthy).

### smart bot, best-card drafting

Run win rate 54.0% [48.3%, 59.6%]. HP lost is over fights that were WON (what the target bands use); the loss column is the share of fights at that floor that were lost. "Reached" is the share of runs that played that kind of fight on that floor.

| floor | tier | fights | reached | HP on entering | HP lost when won [CI] | lost | band (HP) | vs band |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | normal | 300 | 100.0% | 60.0 | 5.8 [5.5, 6.1] | 0.0% | 5-15 | ok |
| 2 | normal | 235 | 78.3% | 54.2 | 5.7 [5.3, 6.2] | 0.0% | 5-15 | ok |
| 3 | normal | 247 | 82.3% | 49.7 | 5.7 [5.3, 6.1] | 0.0% | 5-15 | ok |
| 4 | normal | 225 | 75.0% | 45.8 | 9.9 [9.2, 10.6] | 0.0% | 5-15 | ok |
| 5 | normal | 175 | 58.3% | 37.9 | 9.7 [8.9, 10.5] | 0.0% | 5-15 | ok |
| 5 | elite | 19 | 6.3% | 41.8 | 15.0 [12.2, 17.8] | 0.0% | 12-27 | ok |
| 6 | normal | 192 | 64.0% | 34.6 | 9.4 [8.5, 10.2] | 2.6% | 5-15 | ok |
| 6 | elite | 26 | 8.7% | 36.6 | 13.9 [11.3, 16.5] | 0.0% | 12-27 | ok |
| 7 | normal | 201 | 67.0% | 28.5 | 8.6 [7.8, 9.4] | 12.9% | 5-15 | ok |
| 7 | elite | 14 | 4.7% | 33.1 | 15.6 [11.8, 19.4] | 14.3% | 12-27 | ok |
| 8 | normal | 162 | 54.0% | 26.3 | 7.7 [6.8, 8.5] | 12.3% | 5-15 | ok |
| 8 | elite | 15 | 5.0% | 30.1 | 13.5 [8.3, 18.8] | 13.3% | 12-27 | ok |
| 9 | normal | 174 | 58.0% | 26.2 | 7.1 [6.3, 8.0] | 10.9% | 5-15 | ok |
| 9 | elite | 12 | 4.0% | 22.8 | 10.6 [6.5, 14.7] | 8.3% | 12-27 | LOW |
| 10 | normal | 138 | 46.0% | 25.8 | 7.7 [6.8, 8.6] | 14.5% | 5-15 | ok |
| 10 | elite | 15 | 5.0% | 23.9 | 7.4 [3.3, 11.6] | 20.0% | 12-27 | LOW |
| 11 | normal | 139 | 46.3% | 26.0 | 7.9 [6.9, 8.9] | 15.8% | 5-15 | ok |
| 11 | elite | 7 | 2.3% | 25.7 | 9.3 [3.3, 15.3] | 14.3% | 12-27 | LOW |
| 13 | boss | 179 | 59.7% | 41.9 | 21.3 [19.9, 22.6] | 9.5% | 21-42 | ok |

| tier | fights | won | HP lost when won [CI] | band (HP) | vs band | turns (band) |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 2188 | 94.9% | 7.6 [7.3, 7.8] | 5-15 | ok | 4.2 (3-6) ok |
| elite | 108 | 91.7% | 12.8 [11.5, 14.2] | 12-27 | ok | 5.9 (5-9) ok |
| boss | 179 | 90.5% | 21.3 [19.9, 22.6] | 21-42 | ok | 9.9 (8-14) ok |

### smart bot, random-card drafting

Run win rate 29.0% [24.2%, 34.4%]. HP lost is over fights that were WON (what the target bands use); the loss column is the share of fights at that floor that were lost. "Reached" is the share of runs that played that kind of fight on that floor.

| floor | tier | fights | reached | HP on entering | HP lost when won [CI] | lost | band (HP) | vs band |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | normal | 300 | 100.0% | 60.0 | 5.8 [5.5, 6.1] | 0.0% | 5-15 | ok |
| 2 | normal | 235 | 78.3% | 54.2 | 6.0 [5.6, 6.4] | 0.0% | 5-15 | ok |
| 3 | normal | 247 | 82.3% | 49.4 | 6.5 [6.1, 6.9] | 0.0% | 5-15 | ok |
| 4 | normal | 225 | 75.0% | 44.9 | 11.8 [11.1, 12.5] | 0.0% | 5-15 | ok |
| 5 | normal | 171 | 57.0% | 35.3 | 12.1 [11.3, 12.9] | 2.9% | 5-15 | ok |
| 5 | elite | 18 | 6.0% | 40.6 | 18.4 [14.5, 22.3] | 5.6% | 12-27 | ok |
| 6 | normal | 189 | 63.0% | 32.1 | 11.3 [10.5, 12.1] | 10.1% | 5-15 | ok |
| 6 | elite | 25 | 8.3% | 34.2 | 17.4 [14.8, 19.9] | 20.0% | 12-27 | ok |
| 7 | normal | 184 | 61.3% | 26.3 | 10.5 [9.7, 11.4] | 13.6% | 5-15 | ok |
| 7 | elite | 16 | 5.3% | 29.0 | 19.3 [14.2, 24.4] | 37.5% | 12-27 | ok |
| 8 | normal | 140 | 46.7% | 22.8 | 10.3 [9.1, 11.4] | 27.9% | 5-15 | ok |
| 8 | elite | 17 | 5.7% | 27.1 | 18.8 [14.8, 22.7] | 29.4% | 12-27 | ok |
| 9 | normal | 137 | 45.7% | 24.4 | 9.7 [8.6, 10.8] | 18.2% | 5-15 | ok |
| 9 | elite | 6 | 2.0% | 25.8 | 15.8 [9.8, 21.8] | 16.7% | 12-27 | ok |
| 10 | normal | 102 | 34.0% | 23.2 | 9.9 [8.5, 11.3] | 26.5% | 5-15 | ok |
| 10 | elite | 8 | 2.7% | 26.8 | 11.8 [6.6, 17.1] | 25.0% | 12-27 | LOW |
| 11 | normal | 94 | 31.3% | 24.6 | 9.9 [8.8, 11.0] | 16.0% | 5-15 | ok |
| 11 | elite | 8 | 2.7% | 21.5 | 16.6 [10.8, 22.4] | 37.5% | 12-27 | ok |
| 13 | boss | 122 | 40.7% | 39.4 | 26.9 [25.0, 28.8] | 28.7% | 21-42 | ok |

| tier | fights | won | HP lost when won [CI] | band (HP) | vs band | turns (band) |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 2024 | 92.3% | 8.9 [8.7, 9.1] | 5-15 | ok | 3.8 (3-6) ok |
| elite | 98 | 76.5% | 17.5 [16.0, 18.9] | 12-27 | ok | 5.1 (5-9) ok |
| boss | 122 | 71.3% | 26.9 [25.0, 28.8] | 21-42 | ok | 8.6 (8-14) ok |

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

