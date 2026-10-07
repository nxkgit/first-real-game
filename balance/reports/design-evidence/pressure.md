## Pressure curve: HP lost per fight by floor

300 runs per policy on seeds 1..300. Bands are the provisional ones in src/sim/targets.ts (HP bands assume 60 max HP and the mid reference deck at full HP; here HP on entering varies, so a floor can read LOW simply because the player was healthy).

### smart bot, best-card drafting

Run win rate 54.0% [48.3%, 59.6%]. HP lost is over fights that were WON (what the target bands use); the loss column is the share of fights at that floor that were lost. "Reached" is the share of runs that played a fight on that floor.

| floor | tier | fights | reached | HP on entering | HP lost when won [CI] | lost | band (HP) | vs band |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | normal | 300 | 100.0% | 60.0 | 5.8 [5.5, 6.1] | 0.0% | 5-15 | ok |
| 2 | normal | 235 | 78.3% | 54.2 | 5.7 [5.3, 6.2] | 0.0% | 5-15 | ok |
| 3 | normal | 247 | 82.3% | 49.7 | 5.7 [5.3, 6.1] | 0.0% | 5-15 | ok |
| 4 | normal | 225 | 75.0% | 45.8 | 9.9 [9.2, 10.6] | 0.0% | 5-15 | ok |
| 5 | mixed | 194 | 64.7% | 38.3 | 10.2 [9.4, 11.0] | 0.0% | - | - |
| 6 | mixed | 218 | 72.7% | 34.9 | 9.9 [9.1, 10.7] | 2.3% | - | - |
| 7 | mixed | 215 | 71.7% | 28.8 | 9.1 [8.3, 9.9] | 13.0% | - | - |
| 8 | mixed | 177 | 59.0% | 26.7 | 8.2 [7.3, 9.1] | 12.4% | - | - |
| 9 | mixed | 186 | 62.0% | 25.9 | 7.4 [6.5, 8.2] | 10.8% | - | - |
| 10 | mixed | 153 | 51.0% | 25.7 | 7.7 [6.8, 8.5] | 15.0% | - | - |
| 11 | mixed | 146 | 48.7% | 26.0 | 8.0 [7.0, 8.9] | 15.8% | - | - |
| 13 | boss | 179 | 59.7% | 41.9 | 21.3 [19.9, 22.6] | 9.5% | 21-42 | ok |

| tier | fights | won | HP lost when won [CI] | band (HP) | vs band | turns (band) |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 2188 | 94.9% | 7.6 [7.3, 7.8] | 5-15 | ok | 4.2 (3-6) ok |
| elite | 108 | 91.7% | 12.8 [11.5, 14.2] | 12-27 | ok | 5.9 (5-9) ok |
| boss | 179 | 90.5% | 21.3 [19.9, 22.6] | 21-42 | ok | 9.9 (8-14) ok |

### smart bot, random-card drafting

Run win rate 29.0% [24.2%, 34.4%]. HP lost is over fights that were WON (what the target bands use); the loss column is the share of fights at that floor that were lost. "Reached" is the share of runs that played a fight on that floor.

| floor | tier | fights | reached | HP on entering | HP lost when won [CI] | lost | band (HP) | vs band |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | normal | 300 | 100.0% | 60.0 | 5.8 [5.5, 6.1] | 0.0% | 5-15 | ok |
| 2 | normal | 235 | 78.3% | 54.2 | 6.0 [5.6, 6.4] | 0.0% | 5-15 | ok |
| 3 | normal | 247 | 82.3% | 49.4 | 6.5 [6.1, 6.9] | 0.0% | 5-15 | ok |
| 4 | normal | 225 | 75.0% | 44.9 | 11.8 [11.1, 12.5] | 0.0% | 5-15 | ok |
| 5 | mixed | 189 | 63.0% | 35.8 | 12.7 [11.8, 13.5] | 3.2% | - | - |
| 6 | mixed | 214 | 71.3% | 32.4 | 11.9 [11.1, 12.7] | 11.2% | - | - |
| 7 | mixed | 200 | 66.7% | 26.5 | 11.0 [10.1, 11.9] | 15.5% | - | - |
| 8 | mixed | 157 | 52.3% | 23.2 | 11.2 [10.0, 12.4] | 28.0% | - | - |
| 9 | mixed | 143 | 47.7% | 24.5 | 9.9 [8.9, 11.0] | 18.2% | - | - |
| 10 | mixed | 110 | 36.7% | 23.4 | 10.0 [8.7, 11.4] | 26.4% | - | - |
| 11 | mixed | 102 | 34.0% | 24.4 | 10.3 [9.2, 11.4] | 17.6% | - | - |
| 13 | boss | 122 | 40.7% | 39.4 | 26.9 [25.0, 28.8] | 28.7% | 21-42 | ok |

| tier | fights | won | HP lost when won [CI] | band (HP) | vs band | turns (band) |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 2024 | 92.3% | 8.9 [8.7, 9.1] | 5-15 | ok | 3.8 (3-6) ok |
| elite | 98 | 76.5% | 17.5 [16.0, 18.9] | 12-27 | ok | 5.1 (5-9) ok |
| boss | 122 | 71.3% | 26.9 [25.0, 28.8] | 21-42 | ok | 8.6 (8-14) ok |

### greedy bot, best-card drafting

Run win rate 92.3% [88.8%, 94.8%]. HP lost is over fights that were WON (what the target bands use); the loss column is the share of fights at that floor that were lost. "Reached" is the share of runs that played a fight on that floor.

| floor | tier | fights | reached | HP on entering | HP lost when won [CI] | lost | band (HP) | vs band |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | normal | 300 | 100.0% | 60.0 | 1.6 [1.3, 1.8] | 0.0% | 5-15 | LOW |
| 2 | normal | 235 | 78.3% | 58.5 | 1.6 [1.3, 1.9] | 0.0% | 5-15 | LOW |
| 3 | normal | 247 | 82.3% | 57.2 | 1.9 [1.5, 2.2] | 0.0% | 5-15 | LOW |
| 4 | normal | 225 | 75.0% | 56.4 | 5.4 [4.8, 6.0] | 0.0% | 5-15 | ok |
| 5 | mixed | 201 | 67.0% | 51.8 | 5.1 [4.4, 5.7] | 0.0% | - | - |
| 6 | mixed | 223 | 74.3% | 50.0 | 5.1 [4.4, 5.8] | 0.0% | - | - |
| 7 | mixed | 223 | 74.3% | 45.9 | 5.4 [4.7, 6.2] | 0.0% | - | - |
| 8 | mixed | 208 | 69.3% | 43.5 | 5.0 [4.4, 5.7] | 1.4% | - | - |
| 9 | mixed | 229 | 76.3% | 42.3 | 5.0 [4.4, 5.6] | 1.3% | - | - |
| 10 | mixed | 211 | 70.3% | 39.3 | 4.7 [4.0, 5.4] | 3.3% | - | - |
| 11 | mixed | 220 | 73.3% | 38.6 | 5.0 [4.4, 5.7] | 2.7% | - | - |
| 13 | boss | 281 | 93.7% | 49.4 | 11.1 [10.2, 12.0] | 1.4% | 21-42 | LOW |

| tier | fights | won | HP lost when won [CI] | band (HP) | vs band | turns (band) |
| --- | --- | --- | --- | --- | --- | --- |
| normal | 2367 | 99.2% | 3.9 [3.7, 4.0] | 5-15 | LOW | 5.2 (3-6) ok |
| elite | 155 | 99.4% | 6.7 [5.8, 7.6] | 12-27 | LOW | 6.9 (5-9) ok |
| boss | 281 | 98.6% | 11.1 [10.2, 12.0] | 21-42 | LOW | 11.5 (8-14) ok |

