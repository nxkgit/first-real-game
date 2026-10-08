# Balance report

Generated 2026-10-08 by `npm run balance -- report` from the current registries. **The content measured here is all placeholder** (see implementationplan.md): treat the numbers as an example of the process, not as findings about the real game. Bot skills: random, greedy, smart. Target bands are provisional placeholders (src/sim/targets.ts). How to read this: docs/BALANCE.md.


## Fight difficulty ladder

Win rate (Wilson 95% interval), HP lost in fights that were won (mean with 95% CI) and turns (mean with 95% CI), at full starting HP, for each reference deck set: starter (the starter deck, 1 deck); mid (starter + 5 sampled cards, 3 decks); late (starter + 10 sampled cards, 3 upgraded, 3 decks); syn-tag (tag-a deck: enablers, payoff, draw power, 1 deck); syn-exhaust (exhaust deck: Cull, one-shot attacks, exhaust payoff and engine, 1 deck); syn-trigger (trigger / block deck: block triggers, Block Slam, 1 deck); syn-mult (empowered / strength multiplier deck, 1 deck); syn-combo (combo-count deck: cheap plays into count scaling, 1 deck); syn-mixed (starter + 8 sampled synergy cards, 3 decks). 15 fights x 100 seeds = 1500 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.
Flags compare the mid deck set to the PROVISIONAL target bands in src/sim/targets.ts (LOW / HIGH = outside the band; "ok" = inside). Per-fight numbers vary in how hard the individual fight is; the tier rollup is the better first read.

### random bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 12 | 89.8% | 23.3 | 7.1 |
| starter | elite | 2 | 100.0% | 28.0 | 7.7 |
| starter | boss | 1 | 6.0% | 50.7 | 12.2 |
| mid | normal | 12 | 94.3% | 21.2 | 6.4 |
| mid | elite | 2 | 100.0% | 24.4 | 6.6 |
| mid | boss | 1 | 56.3% | 48.5 | 11.2 |
| late | normal | 12 | 97.9% | 17.9 | 6.2 |
| late | elite | 2 | 100.0% | 17.3 | 6.1 |
| late | boss | 1 | 94.0% | 35.6 | 10.7 |
| syn-tag | normal | 12 | 97.6% | 16.8 | 6.2 |
| syn-tag | elite | 2 | 100.0% | 18.8 | 6.5 |
| syn-tag | boss | 1 | 84.0% | 45.6 | 12.1 |
| syn-exhaust | normal | 12 | 97.8% | 19.9 | 4.3 |
| syn-exhaust | elite | 2 | 100.0% | 19.4 | 4.4 |
| syn-exhaust | boss | 1 | 67.0% | 41.2 | 7.8 |
| syn-trigger | normal | 12 | 100.0% | 9.1 | 7.0 |
| syn-trigger | elite | 2 | 100.0% | 8.1 | 6.9 |
| syn-trigger | boss | 1 | 100.0% | 19.0 | 12.3 |
| syn-mult | normal | 12 | 99.4% | 23.4 | 3.7 |
| syn-mult | elite | 2 | 100.0% | 24.1 | 3.8 |
| syn-mult | boss | 1 | 99.0% | 40.7 | 5.9 |
| syn-combo | normal | 12 | 95.5% | 20.2 | 4.2 |
| syn-combo | elite | 2 | 100.0% | 18.5 | 4.0 |
| syn-combo | boss | 1 | 82.0% | 38.8 | 7.1 |
| syn-mixed | normal | 12 | 98.1% | 20.6 | 6.3 |
| syn-mixed | elite | 2 | 100.0% | 23.2 | 6.7 |
| syn-mixed | boss | 1 | 78.0% | 42.6 | 11.3 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 4.7 [4.1, 5.3] | 3.6 [3.5, 3.8] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 5.5 [4.8, 6.1] | 4.3 [4.2, 4.5] |  |
| enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 6.0 [5.2, 6.8] | 5.1 [4.9, 5.2] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 14.5 [13.2, 15.9] | 7.3 [7.1, 7.6] |  |
| enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 13.5 [12.2, 14.7] | 6.5 [6.3, 6.6] |  |
| enemy-a+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 19.5 [18.3, 20.7] | 5.8 [5.6, 6.0] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 19.0 [18.0, 20.0] | 6.6 [6.4, 6.8] |  |
| enemy-a+enemy-b | normal | starter | 100 | 94.0% [87.5%, 97.2%] | 39.4 [37.2, 41.6] | 8.9 [8.7, 9.1] |  |
| enemy-c+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 26.5 [25.1, 27.9] | 8.4 [8.1, 8.6] |  |
| enemy-b+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 30.9 [29.5, 32.3] | 9.3 [9.1, 9.5] |  |
| enemy-a+enemy-b+enemy-d | normal | starter | 100 | 22.0% [15.0%, 31.1%] | 51.1 [47.9, 54.4] | 8.4 [8.0, 8.7] |  |
| enemy-b+enemy-c | normal | starter | 100 | 61.0% [51.2%, 70.0%] | 49.1 [46.8, 51.3] | 10.7 [10.5, 11.0] |  |
| elite-a | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 29.5 [28.0, 31.1] | 7.0 [6.9, 7.2] |  |
| elite-b | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 26.5 [25.3, 27.7] | 8.4 [8.1, 8.6] |  |
| boss-a | boss | starter | 100 | 6.0% [2.8%, 12.5%] | 50.7 [43.6, 57.8] | 12.2 [11.8, 12.5] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 5.2 [4.8, 5.6] | 3.4 [3.3, 3.5] | win HIGH, HP ok, turns ok |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 5.8 [5.3, 6.2] | 3.8 [3.7, 3.9] | win HIGH, HP ok, turns ok |
| enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 5.6 [5.1, 6.0] | 4.6 [4.5, 4.7] | win HIGH, HP ok, turns ok |
| enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 13.5 [12.7, 14.2] | 6.4 [6.3, 6.6] | win HIGH, HP ok, turns HIGH |
| enemy-c | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 13.6 [12.9, 14.3] | 5.8 [5.7, 5.9] | win HIGH, HP ok, turns ok |
| enemy-a+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 18.1 [17.2, 19.0] | 5.3 [5.2, 5.4] | win HIGH, HP HIGH, turns ok |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 17.6 [16.8, 18.4] | 5.7 [5.6, 5.8] | win HIGH, HP HIGH, turns ok |
| enemy-a+enemy-b | normal | mid | 300 | 98.3% [96.2%, 99.3%] | 33.6 [32.4, 34.8] | 7.8 [7.7, 8.0] | win HIGH, HP HIGH, turns HIGH |
| enemy-c+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 24.0 [23.0, 24.9] | 7.3 [7.2, 7.4] | win HIGH, HP HIGH, turns HIGH |
| enemy-b+enemy-d+enemy-d | normal | mid | 300 | 99.7% [98.1%, 99.9%] | 28.4 [27.2, 29.7] | 8.3 [8.1, 8.4] | win HIGH, HP HIGH, turns HIGH |
| enemy-a+enemy-b+enemy-d | normal | mid | 300 | 53.3% [47.7%, 58.9%] | 46.9 [45.5, 48.3] | 8.2 [8.0, 8.4] | win ok, HP HIGH, turns HIGH |
| enemy-b+enemy-c | normal | mid | 300 | 80.0% [75.1%, 84.1%] | 41.6 [40.3, 43.0] | 9.8 [9.7, 10.0] | win ok, HP HIGH, turns HIGH |
| elite-a | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 26.3 [25.3, 27.2] | 6.1 [6.0, 6.2] | win HIGH, HP ok, turns ok |
| elite-b | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 22.6 [21.7, 23.4] | 7.0 [6.9, 7.1] | win HIGH, HP ok, turns ok |
| boss-a | boss | mid | 300 | 56.3% [50.7%, 61.8%] | 48.5 [47.4, 49.7] | 11.2 [11.0, 11.5] | win HIGH, HP HIGH, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 4.7 [4.2, 5.1] | 3.3 [3.2, 3.5] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 5.7 [5.2, 6.2] | 3.9 [3.7, 4.0] |  |
| enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 5.2 [4.7, 5.7] | 4.3 [4.1, 4.4] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 12.2 [11.4, 13.0] | 6.2 [6.0, 6.4] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 10.1 [9.4, 10.8] | 5.3 [5.1, 5.5] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 14.1 [13.4, 14.8] | 5.1 [4.9, 5.3] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 15.9 [15.1, 16.7] | 5.7 [5.5, 5.8] |  |
| enemy-a+enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 26.8 [25.6, 28.0] | 7.4 [7.2, 7.7] |  |
| enemy-c+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 19.8 [18.9, 20.7] | 7.0 [6.7, 7.2] |  |
| enemy-b+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 23.4 [22.4, 24.3] | 8.0 [7.7, 8.3] |  |
| enemy-a+enemy-b+enemy-d | normal | late | 300 | 80.0% [75.1%, 84.1%] | 42.4 [41.0, 43.7] | 8.6 [8.2, 8.9] |  |
| enemy-b+enemy-c | normal | late | 300 | 94.3% [91.1%, 96.4%] | 34.7 [33.4, 36.0] | 9.4 [9.0, 9.8] |  |
| elite-a | elite | late | 300 | 100.0% [98.7%, 100.0%] | 18.7 [17.8, 19.6] | 5.7 [5.5, 5.9] |  |
| elite-b | elite | late | 300 | 100.0% [98.7%, 100.0%] | 15.9 [15.0, 16.7] | 6.5 [6.2, 6.7] |  |
| boss-a | boss | late | 300 | 94.0% [90.7%, 96.2%] | 35.6 [34.3, 36.9] | 10.7 [10.2, 11.1] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 2.4 [1.9, 2.9] | 3.1 [3.0, 3.2] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 4.2 [3.6, 4.9] | 3.6 [3.5, 3.8] |  |
| enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 4.5 [3.8, 5.2] | 4.5 [4.3, 4.6] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 10.4 [9.3, 11.6] | 6.2 [6.0, 6.4] |  |
| enemy-c | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 9.7 [8.7, 10.7] | 5.4 [5.2, 5.6] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 12.6 [11.3, 13.8] | 5.2 [5.0, 5.3] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 12.9 [11.8, 13.9] | 5.4 [5.2, 5.5] |  |
| enemy-a+enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 28.0 [26.1, 29.9] | 7.6 [7.4, 7.8] |  |
| enemy-c+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 17.8 [16.4, 19.2] | 7.2 [7.0, 7.4] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 20.3 [18.8, 21.8] | 7.9 [7.7, 8.1] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-tag | 100 | 80.0% [71.1%, 86.7%] | 43.4 [41.5, 45.4] | 8.9 [8.7, 9.2] |  |
| enemy-b+enemy-c | normal | syn-tag | 100 | 91.0% [83.8%, 95.2%] | 35.9 [33.6, 38.2] | 9.9 [9.7, 10.2] |  |
| elite-a | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 20.0 [18.3, 21.6] | 5.9 [5.8, 6.1] |  |
| elite-b | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 17.6 [16.1, 19.0] | 7.1 [6.8, 7.3] |  |
| boss-a | boss | syn-tag | 100 | 84.0% [75.6%, 89.9%] | 45.6 [44.0, 47.2] | 12.1 [11.8, 12.3] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 6.0 [5.3, 6.6] | 2.4 [2.3, 2.5] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 6.8 [6.0, 7.6] | 2.7 [2.6, 2.9] |  |
| enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 6.4 [5.5, 7.3] | 3.1 [2.9, 3.3] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 13.1 [12.0, 14.1] | 4.2 [4.0, 4.4] |  |
| enemy-c | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 11.7 [10.5, 12.9] | 3.6 [3.5, 3.8] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 16.2 [15.0, 17.3] | 3.5 [3.4, 3.7] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 18.1 [17.0, 19.2] | 3.9 [3.7, 4.0] |  |
| enemy-a+enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 28.6 [26.6, 30.6] | 5.2 [5.0, 5.4] |  |
| enemy-c+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 24.0 [22.2, 25.7] | 5.0 [4.7, 5.2] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-exhaust | 100 | 99.0% [94.6%, 99.8%] | 26.5 [24.8, 28.3] | 5.5 [5.3, 5.8] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-exhaust | 100 | 78.0% [68.9%, 85.0%] | 44.8 [42.6, 47.0] | 6.3 [6.0, 6.5] |  |
| enemy-b+enemy-c | normal | syn-exhaust | 100 | 96.0% [90.2%, 98.4%] | 36.8 [34.9, 38.8] | 6.5 [6.3, 6.8] |  |
| elite-a | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 20.3 [19.1, 21.5] | 4.3 [4.1, 4.4] |  |
| elite-b | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 18.5 [17.1, 19.9] | 4.5 [4.3, 4.7] |  |
| boss-a | boss | syn-exhaust | 100 | 67.0% [57.3%, 75.4%] | 41.2 [38.4, 43.9] | 7.8 [7.5, 8.0] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.1 [1.6, 2.7] | 4.3 [4.1, 4.4] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 3.6 [3.0, 4.3] | 4.6 [4.5, 4.8] |  |
| enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.1 [1.6, 2.7] | 5.2 [5.0, 5.3] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 6.5 [5.6, 7.3] | 7.0 [6.8, 7.2] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 3.7 [2.9, 4.5] | 6.2 [6.1, 6.4] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.8 [6.9, 8.8] | 5.8 [5.6, 6.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 11.1 [10.1, 12.0] | 6.3 [6.2, 6.5] |  |
| enemy-a+enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 14.4 [13.0, 15.8] | 8.1 [7.9, 8.2] |  |
| enemy-c+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.9 [6.9, 8.8] | 7.6 [7.5, 7.8] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 12.2 [11.1, 13.3] | 8.7 [8.5, 8.9] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 26.9 [25.0, 28.9] | 9.9 [9.7, 10.2] |  |
| enemy-b+enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 10.7 [9.4, 11.9] | 10.0 [9.8, 10.3] |  |
| elite-a | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 10.1 [9.0, 11.2] | 6.6 [6.4, 6.7] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 6.2 [5.3, 7.1] | 7.2 [7.0, 7.5] |  |
| boss-a | boss | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 19.0 [17.4, 20.7] | 12.3 [12.1, 12.6] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 9.6 [9.0, 10.3] | 2.2 [2.1, 2.3] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 10.6 [9.8, 11.3] | 2.5 [2.4, 2.6] |  |
| enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 11.3 [10.4, 12.3] | 2.9 [2.8, 3.0] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 19.9 [18.9, 20.8] | 3.8 [3.6, 3.9] |  |
| enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 15.6 [14.4, 16.7] | 3.2 [3.1, 3.3] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 19.9 [18.8, 21.0] | 3.3 [3.1, 3.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 21.4 [20.3, 22.5] | 3.5 [3.4, 3.6] |  |
| enemy-a+enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 29.9 [28.1, 31.6] | 4.3 [4.2, 4.5] |  |
| enemy-c+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 28.6 [27.4, 29.9] | 4.1 [4.0, 4.2] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 31.1 [29.7, 32.5] | 4.6 [4.5, 4.8] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mult | 100 | 93.0% [86.3%, 96.6%] | 43.3 [41.6, 45.0] | 5.0 [4.9, 5.1] |  |
| enemy-b+enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 39.2 [37.7, 40.7] | 5.2 [5.1, 5.4] |  |
| elite-a | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 25.2 [23.7, 26.8] | 3.7 [3.6, 3.8] |  |
| elite-b | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 23.0 [21.7, 24.4] | 3.9 [3.8, 4.0] |  |
| boss-a | boss | syn-mult | 100 | 99.0% [94.6%, 99.8%] | 40.7 [39.6, 41.9] | 5.9 [5.7, 6.0] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 5.3 [4.7, 5.9] | 2.1 [2.0, 2.2] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 6.3 [5.6, 7.1] | 2.5 [2.4, 2.6] |  |
| enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 6.4 [5.5, 7.2] | 2.9 [2.7, 3.0] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 13.0 [11.9, 14.1] | 4.1 [4.0, 4.3] |  |
| enemy-c | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 10.7 [9.6, 11.9] | 3.4 [3.2, 3.5] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 14.7 [13.9, 15.5] | 3.3 [3.2, 3.5] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 18.4 [17.4, 19.3] | 3.7 [3.6, 3.8] |  |
| enemy-a+enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 30.0 [28.1, 31.9] | 5.1 [5.0, 5.3] |  |
| enemy-c+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 24.0 [22.7, 25.2] | 4.9 [4.7, 5.1] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 27.6 [26.1, 29.2] | 5.3 [5.2, 5.5] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-combo | 100 | 51.0% [41.3%, 60.6%] | 44.7 [41.8, 47.7] | 5.9 [5.7, 6.1] |  |
| enemy-b+enemy-c | normal | syn-combo | 100 | 95.0% [88.8%, 97.8%] | 41.5 [39.7, 43.4] | 6.7 [6.5, 6.9] |  |
| elite-a | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 18.6 [17.2, 20.1] | 3.9 [3.8, 4.0] |  |
| elite-b | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 18.3 [17.1, 19.6] | 4.1 [4.0, 4.2] |  |
| boss-a | boss | syn-combo | 100 | 82.0% [73.3%, 88.3%] | 38.8 [36.7, 40.9] | 7.1 [6.9, 7.2] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 6.6 [6.1, 7.1] | 3.7 [3.6, 3.8] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 7.2 [6.7, 7.7] | 4.0 [3.9, 4.1] |  |
| enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 6.2 [5.7, 6.7] | 4.9 [4.8, 5.0] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 13.8 [13.0, 14.6] | 6.2 [6.1, 6.4] |  |
| enemy-c | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 14.0 [13.2, 14.8] | 5.9 [5.8, 6.0] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 18.7 [17.9, 19.6] | 5.3 [5.2, 5.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 19.4 [18.8, 20.1] | 5.5 [5.3, 5.6] |  |
| enemy-a+enemy-b | normal | syn-mixed | 300 | 99.3% [97.6%, 99.8%] | 30.4 [29.2, 31.5] | 7.4 [7.2, 7.5] |  |
| enemy-c+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 22.9 [21.9, 24.0] | 7.2 [7.0, 7.3] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 26.6 [25.6, 27.6] | 7.6 [7.5, 7.8] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mixed | 300 | 82.0% [77.3%, 85.9%] | 45.5 [44.4, 46.6] | 8.4 [8.1, 8.6] |  |
| enemy-b+enemy-c | normal | syn-mixed | 300 | 96.0% [93.1%, 97.7%] | 36.0 [34.6, 37.4] | 9.3 [9.1, 9.5] |  |
| elite-a | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 26.0 [24.9, 27.1] | 6.2 [6.1, 6.3] |  |
| elite-b | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 20.5 [19.5, 21.5] | 7.2 [7.0, 7.3] |  |
| boss-a | boss | syn-mixed | 300 | 78.0% [73.0%, 82.3%] | 42.6 [41.6, 43.7] | 11.3 [11.0, 11.6] |  |

### greedy bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 12 | 100.0% | 10.3 | 7.1 |
| starter | elite | 2 | 100.0% | 14.4 | 7.4 |
| starter | boss | 1 | 100.0% | 38.3 | 12.9 |
| mid | normal | 12 | 100.0% | 10.8 | 5.6 |
| mid | elite | 2 | 100.0% | 14.4 | 5.6 |
| mid | boss | 1 | 98.3% | 36.8 | 9.8 |
| late | normal | 12 | 100.0% | 11.4 | 5.6 |
| late | elite | 2 | 100.0% | 12.0 | 5.4 |
| late | boss | 1 | 100.0% | 22.3 | 8.9 |
| syn-tag | normal | 12 | 100.0% | 9.2 | 5.8 |
| syn-tag | elite | 2 | 100.0% | 15.3 | 6.2 |
| syn-tag | boss | 1 | 92.0% | 42.3 | 11.5 |
| syn-exhaust | normal | 12 | 99.6% | 19.4 | 5.9 |
| syn-exhaust | elite | 2 | 100.0% | 28.3 | 6.4 |
| syn-exhaust | boss | 1 | 17.0% | 55.6 | 10.0 |
| syn-trigger | normal | 12 | 100.0% | 6.0 | 8.2 |
| syn-trigger | elite | 2 | 100.0% | 5.9 | 8.7 |
| syn-trigger | boss | 1 | 100.0% | 18.0 | 16.3 |
| syn-mult | normal | 12 | 100.0% | 17.1 | 3.3 |
| syn-mult | elite | 2 | 100.0% | 16.6 | 3.3 |
| syn-mult | boss | 1 | 100.0% | 36.3 | 5.0 |
| syn-combo | normal | 12 | 100.0% | 14.0 | 4.1 |
| syn-combo | elite | 2 | 100.0% | 17.1 | 3.9 |
| syn-combo | boss | 1 | 94.0% | 37.7 | 7.1 |
| syn-mixed | normal | 12 | 100.0% | 12.1 | 6.0 |
| syn-mixed | elite | 2 | 100.0% | 16.6 | 6.4 |
| syn-mixed | boss | 1 | 97.7% | 35.9 | 10.6 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 1.9 [1.5, 2.3] | 3.3 [3.1, 3.4] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 1.5 [1.0, 2.0] | 3.8 [3.6, 3.9] |  |
| enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 2.7 [2.2, 3.3] | 4.2 [4.1, 4.3] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 3.8 [3.3, 4.3] | 6.0 [5.8, 6.2] |  |
| enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 3.7 [2.9, 4.5] | 6.7 [6.5, 6.8] |  |
| enemy-a+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 8.2 [7.6, 8.7] | 6.7 [6.6, 6.8] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 9.4 [8.9, 9.9] | 6.2 [6.1, 6.2] |  |
| enemy-a+enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 13.8 [12.8, 14.7] | 7.8 [7.6, 8.0] |  |
| enemy-c+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 9.6 [8.7, 10.6] | 8.4 [8.3, 8.5] |  |
| enemy-b+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 13.0 [12.4, 13.6] | 8.6 [8.4, 8.7] |  |
| enemy-a+enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 31.2 [30.1, 32.3] | 10.7 [10.5, 10.8] |  |
| enemy-b+enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 24.5 [23.3, 25.7] | 12.5 [12.4, 12.7] |  |
| elite-a | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 16.7 [15.3, 18.2] | 6.8 [6.6, 6.9] |  |
| elite-b | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 12.1 [11.1, 13.1] | 8.0 [7.9, 8.1] |  |
| boss-a | boss | starter | 100 | 100.0% [96.3%, 100.0%] | 38.3 [36.8, 39.8] | 12.9 [12.6, 13.1] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 3.5 [3.2, 3.8] | 3.0 [3.0, 3.1] | win ok, HP LOW, turns ok |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 2.6 [2.2, 2.9] | 3.4 [3.3, 3.5] | win ok, HP LOW, turns ok |
| enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 4.3 [3.8, 4.7] | 3.8 [3.7, 3.9] | win ok, HP LOW, turns ok |
| enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 5.3 [4.8, 5.8] | 5.2 [5.1, 5.3] | win ok, HP ok, turns ok |
| enemy-c | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 8.8 [8.2, 9.4] | 4.8 [4.7, 4.9] | win ok, HP ok, turns ok |
| enemy-a+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 8.9 [8.3, 9.5] | 5.0 [4.9, 5.1] | win ok, HP ok, turns ok |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 9.2 [8.8, 9.6] | 5.0 [4.9, 5.1] | win ok, HP ok, turns ok |
| enemy-a+enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 13.3 [12.7, 14.0] | 6.3 [6.2, 6.4] | win ok, HP ok, turns HIGH |
| enemy-c+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 14.1 [13.3, 14.8] | 6.5 [6.4, 6.6] | win ok, HP ok, turns HIGH |
| enemy-b+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 13.7 [13.0, 14.4] | 6.8 [6.7, 7.0] | win ok, HP ok, turns HIGH |
| enemy-a+enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 26.9 [25.9, 28.0] | 8.2 [8.1, 8.4] | win ok, HP HIGH, turns HIGH |
| enemy-b+enemy-c | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 19.5 [18.5, 20.5] | 8.8 [8.7, 8.9] | win ok, HP HIGH, turns HIGH |
| elite-a | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 15.9 [15.1, 16.6] | 5.3 [5.2, 5.4] | win HIGH, HP ok, turns ok |
| elite-b | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 12.9 [12.3, 13.6] | 5.9 [5.8, 6.1] | win HIGH, HP ok, turns ok |
| boss-a | boss | mid | 300 | 98.3% [96.2%, 99.3%] | 36.8 [35.7, 37.9] | 9.8 [9.6, 9.9] | win HIGH, HP ok, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 3.8 [3.4, 4.2] | 3.1 [3.0, 3.2] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 4.4 [3.9, 4.8] | 3.7 [3.6, 3.8] |  |
| enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 3.6 [3.2, 4.1] | 3.8 [3.7, 3.9] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 7.7 [7.2, 8.3] | 5.3 [5.1, 5.4] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 7.5 [6.9, 8.1] | 4.7 [4.5, 4.9] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 10.2 [9.6, 10.8] | 5.0 [4.8, 5.2] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 11.7 [11.0, 12.4] | 5.4 [5.3, 5.6] |  |
| enemy-a+enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 14.6 [13.9, 15.3] | 6.2 [6.0, 6.4] |  |
| enemy-c+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 14.2 [13.4, 15.0] | 6.3 [6.1, 6.5] |  |
| enemy-b+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 15.2 [14.4, 16.0] | 6.9 [6.7, 7.1] |  |
| enemy-a+enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 24.9 [24.0, 25.9] | 7.9 [7.7, 8.2] |  |
| enemy-b+enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 18.7 [17.8, 19.6] | 8.3 [8.0, 8.6] |  |
| elite-a | elite | late | 300 | 100.0% [98.7%, 100.0%] | 13.3 [12.5, 14.1] | 5.1 [4.9, 5.3] |  |
| elite-b | elite | late | 300 | 100.0% [98.7%, 100.0%] | 10.6 [9.8, 11.4] | 5.7 [5.5, 6.0] |  |
| boss-a | boss | late | 300 | 100.0% [98.7%, 100.0%] | 22.3 [21.3, 23.3] | 8.9 [8.6, 9.3] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 2.1 [1.6, 2.5] | 3.0 [2.9, 3.2] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 1.8 [1.3, 2.3] | 3.5 [3.3, 3.6] |  |
| enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 4.0 [3.2, 4.7] | 4.4 [4.3, 4.6] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 4.5 [3.7, 5.3] | 5.8 [5.6, 5.9] |  |
| enemy-c | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 7.2 [6.4, 8.0] | 5.0 [4.8, 5.2] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 6.4 [5.5, 7.4] | 4.8 [4.7, 4.9] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 6.7 [6.1, 7.4] | 5.1 [4.9, 5.2] |  |
| enemy-a+enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 11.8 [10.8, 12.9] | 6.7 [6.5, 6.9] |  |
| enemy-c+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 12.8 [11.7, 13.8] | 6.7 [6.5, 6.8] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 10.3 [9.4, 11.2] | 6.9 [6.8, 7.1] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 24.4 [23.0, 25.9] | 8.7 [8.5, 8.9] |  |
| enemy-b+enemy-c | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 17.9 [16.7, 19.2] | 8.6 [8.4, 8.8] |  |
| elite-a | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 16.5 [14.9, 18.0] | 5.7 [5.5, 5.9] |  |
| elite-b | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 14.0 [12.7, 15.4] | 6.6 [6.4, 6.8] |  |
| boss-a | boss | syn-tag | 100 | 92.0% [85.0%, 95.9%] | 42.3 [40.6, 44.0] | 11.5 [11.3, 11.8] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 7.2 [6.8, 7.7] | 3.1 [3.0, 3.2] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 4.7 [4.2, 5.2] | 3.1 [3.0, 3.2] |  |
| enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 6.7 [6.1, 7.4] | 3.6 [3.4, 3.7] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 8.8 [7.9, 9.7] | 5.3 [5.2, 5.5] |  |
| enemy-c | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 15.7 [14.8, 16.6] | 4.9 [4.7, 5.1] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 15.0 [14.0, 16.0] | 4.8 [4.6, 5.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 13.4 [12.7, 14.2] | 5.0 [4.8, 5.1] |  |
| enemy-a+enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 23.3 [22.5, 24.0] | 7.0 [6.9, 7.1] |  |
| enemy-c+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 27.8 [26.7, 28.9] | 7.1 [7.0, 7.3] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 21.6 [20.6, 22.6] | 7.2 [7.1, 7.4] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-exhaust | 100 | 99.0% [94.6%, 99.8%] | 42.5 [40.9, 44.0] | 9.2 [9.0, 9.4] |  |
| enemy-b+enemy-c | normal | syn-exhaust | 100 | 96.0% [90.2%, 98.4%] | 46.2 [45.1, 47.3] | 10.5 [10.3, 10.7] |  |
| elite-a | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 28.6 [27.3, 29.8] | 5.7 [5.5, 5.8] |  |
| elite-b | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 27.9 [26.9, 29.0] | 7.2 [7.0, 7.4] |  |
| boss-a | boss | syn-exhaust | 100 | 17.0% [10.9%, 25.5%] | 55.6 [54.5, 56.7] | 10.0 [9.7, 10.3] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.2 [0.9, 1.6] | 5.0 [4.9, 5.1] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.2 [1.6, 2.8] | 5.0 [4.9, 5.1] |  |
| enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.4 [0.9, 1.8] | 5.9 [5.7, 6.0] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.5 [3.7, 5.3] | 7.9 [7.8, 8.1] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.9 [1.4, 2.4] | 7.3 [7.2, 7.4] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.2 [4.4, 5.9] | 6.8 [6.7, 7.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.6 [6.8, 8.3] | 6.8 [6.6, 6.9] |  |
| enemy-a+enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 8.9 [7.7, 10.1] | 9.8 [9.7, 10.0] |  |
| enemy-c+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.5 [4.6, 6.3] | 9.4 [9.2, 9.5] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 9.3 [8.4, 10.3] | 10.6 [10.4, 10.7] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 19.2 [17.8, 20.6] | 11.6 [11.4, 11.8] |  |
| enemy-b+enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.8 [4.0, 5.6] | 12.2 [12.0, 12.3] |  |
| elite-a | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.4 [6.4, 8.5] | 7.8 [7.7, 7.9] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.3 [3.5, 5.1] | 9.5 [9.3, 9.7] |  |
| boss-a | boss | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 18.0 [16.2, 19.8] | 16.3 [16.1, 16.5] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 7.7 [6.9, 8.4] | 1.9 [1.8, 2.1] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 8.6 [7.9, 9.4] | 2.4 [2.3, 2.5] |  |
| enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 7.9 [6.9, 8.9] | 2.4 [2.2, 2.5] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 14.7 [13.9, 15.5] | 3.3 [3.2, 3.4] |  |
| enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 11.9 [11.2, 12.7] | 2.8 [2.7, 2.8] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 15.4 [14.6, 16.2] | 3.0 [2.9, 3.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 18.1 [17.2, 19.0] | 3.4 [3.2, 3.5] |  |
| enemy-a+enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 19.4 [18.2, 20.6] | 3.8 [3.7, 3.9] |  |
| enemy-c+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 21.1 [19.9, 22.3] | 3.7 [3.6, 3.8] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 21.5 [20.5, 22.4] | 4.2 [4.0, 4.3] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 30.2 [29.1, 31.2] | 4.6 [4.5, 4.7] |  |
| enemy-b+enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 28.6 [27.3, 29.8] | 4.4 [4.3, 4.5] |  |
| elite-a | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 18.5 [17.3, 19.7] | 3.2 [3.1, 3.3] |  |
| elite-b | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 14.6 [13.2, 16.0] | 3.3 [3.2, 3.4] |  |
| boss-a | boss | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 36.3 [35.4, 37.3] | 5.0 [5.0, 5.1] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 4.8 [4.2, 5.4] | 2.2 [2.1, 2.3] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 4.0 [3.4, 4.7] | 2.6 [2.5, 2.7] |  |
| enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 4.8 [3.9, 5.7] | 2.7 [2.6, 2.8] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 7.9 [7.2, 8.7] | 4.0 [3.9, 4.1] |  |
| enemy-c | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 9.5 [8.4, 10.6] | 3.3 [3.2, 3.4] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 10.7 [10.1, 11.4] | 3.4 [3.3, 3.6] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 12.4 [11.6, 13.3] | 3.8 [3.7, 4.0] |  |
| enemy-a+enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 16.3 [15.3, 17.4] | 4.9 [4.8, 5.1] |  |
| enemy-c+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 19.5 [18.3, 20.7] | 4.7 [4.5, 4.9] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 16.2 [15.0, 17.4] | 5.0 [4.9, 5.2] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 28.9 [27.3, 30.6] | 6.1 [5.9, 6.3] |  |
| enemy-b+enemy-c | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 32.7 [30.9, 34.5] | 6.4 [6.2, 6.6] |  |
| elite-a | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 17.3 [15.8, 18.7] | 3.8 [3.7, 3.9] |  |
| elite-b | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 16.9 [15.6, 18.1] | 4.0 [3.9, 4.1] |  |
| boss-a | boss | syn-combo | 100 | 94.0% [87.5%, 97.2%] | 37.7 [35.6, 39.8] | 7.1 [7.0, 7.3] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 4.6 [4.2, 5.0] | 3.6 [3.5, 3.7] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 4.0 [3.6, 4.4] | 3.9 [3.8, 4.0] |  |
| enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 4.3 [3.8, 4.7] | 4.5 [4.4, 4.6] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 6.8 [6.3, 7.3] | 5.7 [5.6, 5.8] |  |
| enemy-c | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 9.1 [8.5, 9.6] | 5.6 [5.5, 5.7] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 11.0 [10.3, 11.6] | 5.3 [5.2, 5.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 12.1 [11.6, 12.6] | 5.3 [5.2, 5.4] |  |
| enemy-a+enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 16.8 [16.1, 17.4] | 6.9 [6.7, 7.0] |  |
| enemy-c+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 14.7 [13.9, 15.5] | 7.0 [6.8, 7.1] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 15.5 [14.8, 16.2] | 7.1 [7.0, 7.3] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 28.4 [27.4, 29.3] | 8.4 [8.2, 8.6] |  |
| enemy-b+enemy-c | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 18.2 [17.2, 19.2] | 9.1 [8.9, 9.3] |  |
| elite-a | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 19.3 [18.5, 20.2] | 5.9 [5.8, 6.0] |  |
| elite-b | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 14.0 [13.2, 14.8] | 6.8 [6.7, 7.0] |  |
| boss-a | boss | syn-mixed | 300 | 97.7% [95.3%, 98.9%] | 35.9 [34.9, 36.9] | 10.6 [10.4, 10.8] |  |

### smart bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 12 | 100.0% | 16.9 | 5.4 |
| starter | elite | 2 | 100.0% | 21.8 | 5.7 |
| starter | boss | 1 | 92.0% | 46.7 | 11.1 |
| mid | normal | 12 | 100.0% | 13.0 | 4.9 |
| mid | elite | 2 | 100.0% | 16.5 | 5.0 |
| mid | boss | 1 | 96.7% | 39.4 | 9.2 |
| late | normal | 12 | 100.0% | 11.7 | 4.5 |
| late | elite | 2 | 100.0% | 12.4 | 4.6 |
| late | boss | 1 | 100.0% | 26.9 | 7.9 |
| syn-tag | normal | 12 | 100.0% | 9.5 | 4.9 |
| syn-tag | elite | 2 | 100.0% | 13.9 | 5.2 |
| syn-tag | boss | 1 | 99.0% | 40.0 | 9.8 |
| syn-exhaust | normal | 12 | 100.0% | 11.7 | 3.2 |
| syn-exhaust | elite | 2 | 100.0% | 12.5 | 3.4 |
| syn-exhaust | boss | 1 | 98.0% | 28.4 | 6.0 |
| syn-trigger | normal | 12 | 100.0% | 5.0 | 5.3 |
| syn-trigger | elite | 2 | 100.0% | 3.5 | 5.3 |
| syn-trigger | boss | 1 | 100.0% | 9.9 | 9.1 |
| syn-mult | normal | 12 | 100.0% | 17.3 | 2.9 |
| syn-mult | elite | 2 | 100.0% | 15.2 | 3.0 |
| syn-mult | boss | 1 | 100.0% | 40.6 | 4.7 |
| syn-combo | normal | 12 | 100.0% | 10.5 | 3.1 |
| syn-combo | elite | 2 | 100.0% | 8.3 | 2.9 |
| syn-combo | boss | 1 | 100.0% | 28.1 | 5.4 |
| syn-mixed | normal | 12 | 100.0% | 12.9 | 5.0 |
| syn-mixed | elite | 2 | 100.0% | 16.3 | 5.3 |
| syn-mixed | boss | 1 | 100.0% | 35.4 | 9.0 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 7.0 [6.5, 7.5] | 3.0 [3.0, 3.0] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 5.3 [4.7, 6.0] | 3.2 [3.1, 3.3] |  |
| enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 7.0 [6.4, 7.7] | 3.9 [3.8, 4.0] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 9.0 [8.2, 9.7] | 5.0 [5.0, 5.1] |  |
| enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 11.9 [10.8, 13.0] | 4.6 [4.5, 4.7] |  |
| enemy-a+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 14.7 [14.0, 15.3] | 4.5 [4.4, 4.7] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 13.8 [13.1, 14.6] | 4.9 [4.8, 5.0] |  |
| enemy-a+enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 20.0 [19.2, 20.8] | 5.9 [5.8, 6.1] |  |
| enemy-c+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 23.2 [22.0, 24.3] | 6.6 [6.5, 6.7] |  |
| enemy-b+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 20.0 [19.1, 20.8] | 6.7 [6.5, 6.8] |  |
| enemy-a+enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 33.3 [32.2, 34.3] | 8.2 [8.1, 8.3] |  |
| enemy-b+enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 37.5 [36.5, 38.5] | 8.8 [8.7, 8.9] |  |
| elite-a | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 22.5 [21.0, 23.9] | 5.4 [5.3, 5.5] |  |
| elite-b | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 21.1 [20.1, 22.1] | 5.9 [5.8, 6.1] |  |
| boss-a | boss | starter | 100 | 92.0% [85.0%, 95.9%] | 46.7 [45.3, 48.1] | 11.1 [10.9, 11.3] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 4.8 [4.4, 5.2] | 2.7 [2.7, 2.8] | win ok, HP LOW, turns LOW |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 3.6 [3.2, 4.0] | 3.0 [2.9, 3.0] | win ok, HP LOW, turns LOW |
| enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 5.1 [4.6, 5.5] | 3.5 [3.5, 3.6] | win ok, HP ok, turns ok |
| enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 7.2 [6.6, 7.8] | 4.8 [4.8, 4.9] | win ok, HP ok, turns ok |
| enemy-c | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 10.9 [10.2, 11.6] | 4.3 [4.2, 4.4] | win ok, HP ok, turns ok |
| enemy-a+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 11.4 [10.8, 12.0] | 4.2 [4.1, 4.2] | win ok, HP ok, turns ok |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 11.5 [10.9, 12.0] | 4.4 [4.4, 4.5] | win ok, HP ok, turns ok |
| enemy-a+enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 15.3 [14.6, 16.0] | 5.6 [5.6, 5.7] | win ok, HP HIGH, turns ok |
| enemy-c+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 16.4 [15.6, 17.3] | 5.7 [5.6, 5.8] | win ok, HP HIGH, turns ok |
| enemy-b+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 15.6 [14.8, 16.4] | 6.0 [5.9, 6.1] | win ok, HP HIGH, turns ok |
| enemy-a+enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 28.3 [27.2, 29.3] | 7.2 [7.1, 7.3] | win ok, HP HIGH, turns HIGH |
| enemy-b+enemy-c | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 25.9 [24.7, 27.1] | 7.7 [7.6, 7.8] | win ok, HP HIGH, turns HIGH |
| elite-a | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 17.4 [16.7, 18.1] | 4.8 [4.7, 4.9] | win HIGH, HP ok, turns LOW |
| elite-b | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 15.6 [14.9, 16.3] | 5.1 [5.0, 5.2] | win HIGH, HP ok, turns ok |
| boss-a | boss | mid | 300 | 96.7% [94.0%, 98.2%] | 39.4 [38.2, 40.6] | 9.2 [9.1, 9.4] | win HIGH, HP ok, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 4.4 [3.9, 4.8] | 2.4 [2.3, 2.5] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 4.5 [4.1, 4.9] | 2.8 [2.7, 2.8] |  |
| enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 3.9 [3.4, 4.4] | 3.2 [3.1, 3.3] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 8.4 [7.8, 9.0] | 4.4 [4.3, 4.5] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 8.8 [8.1, 9.4] | 3.9 [3.8, 4.1] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 10.5 [9.9, 11.1] | 3.8 [3.7, 4.0] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 11.6 [11.0, 12.2] | 4.2 [4.1, 4.3] |  |
| enemy-a+enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 14.6 [13.8, 15.3] | 5.2 [5.0, 5.4] |  |
| enemy-c+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 13.9 [13.1, 14.7] | 5.1 [5.0, 5.3] |  |
| enemy-b+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 13.9 [13.2, 14.5] | 5.5 [5.3, 5.7] |  |
| enemy-a+enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 24.5 [23.6, 25.5] | 6.4 [6.2, 6.6] |  |
| enemy-b+enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 21.2 [20.2, 22.2] | 6.6 [6.4, 6.9] |  |
| elite-a | elite | late | 300 | 100.0% [98.7%, 100.0%] | 13.2 [12.4, 14.0] | 4.4 [4.3, 4.6] |  |
| elite-b | elite | late | 300 | 100.0% [98.7%, 100.0%] | 11.6 [10.8, 12.4] | 4.7 [4.6, 4.9] |  |
| boss-a | boss | late | 300 | 100.0% [98.7%, 100.0%] | 26.9 [25.8, 28.1] | 7.9 [7.6, 8.2] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 2.5 [1.9, 3.0] | 2.8 [2.6, 2.9] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 1.8 [1.4, 2.2] | 3.0 [2.9, 3.1] |  |
| enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 4.5 [3.8, 5.3] | 3.6 [3.5, 3.8] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 5.0 [4.3, 5.8] | 4.9 [4.8, 5.0] |  |
| enemy-c | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 8.1 [7.2, 8.9] | 4.3 [4.1, 4.4] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 8.4 [7.7, 9.2] | 4.1 [4.0, 4.3] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 7.2 [6.5, 7.9] | 4.3 [4.1, 4.4] |  |
| enemy-a+enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 11.7 [10.7, 12.6] | 5.7 [5.5, 5.8] |  |
| enemy-c+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 11.9 [11.0, 12.8] | 5.9 [5.7, 6.0] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 9.7 [8.8, 10.6] | 5.7 [5.5, 5.9] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 23.5 [22.2, 24.7] | 7.2 [7.1, 7.4] |  |
| enemy-b+enemy-c | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 19.2 [17.9, 20.5] | 7.6 [7.5, 7.8] |  |
| elite-a | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 14.9 [13.7, 16.1] | 4.9 [4.8, 5.1] |  |
| elite-b | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 13.0 [11.8, 14.2] | 5.5 [5.3, 5.6] |  |
| boss-a | boss | syn-tag | 100 | 99.0% [94.6%, 99.8%] | 40.0 [38.3, 41.7] | 9.8 [9.6, 9.9] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 5.3 [4.7, 5.9] | 2.1 [2.0, 2.2] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 3.6 [3.0, 4.3] | 2.1 [2.0, 2.1] |  |
| enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 4.4 [3.4, 5.5] | 2.5 [2.4, 2.6] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 8.0 [7.1, 8.9] | 3.1 [3.0, 3.3] |  |
| enemy-c | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 8.8 [8.0, 9.7] | 3.0 [2.9, 3.2] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 12.1 [11.1, 13.0] | 2.8 [2.7, 2.9] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 11.2 [10.3, 12.0] | 3.0 [2.8, 3.1] |  |
| enemy-a+enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 14.1 [13.1, 15.0] | 3.7 [3.6, 3.9] |  |
| enemy-c+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 14.6 [13.3, 16.0] | 3.6 [3.4, 3.8] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 13.5 [12.5, 14.5] | 3.9 [3.7, 4.1] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 22.6 [21.4, 23.8] | 4.4 [4.2, 4.6] |  |
| enemy-b+enemy-c | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 22.2 [20.6, 23.8] | 4.5 [4.4, 4.7] |  |
| elite-a | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 13.7 [12.5, 15.0] | 3.4 [3.2, 3.5] |  |
| elite-b | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 11.3 [9.9, 12.7] | 3.5 [3.3, 3.6] |  |
| boss-a | boss | syn-exhaust | 100 | 98.0% [93.0%, 99.4%] | 28.4 [26.8, 30.0] | 6.0 [5.8, 6.2] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.4 [1.1, 1.8] | 3.3 [3.2, 3.4] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.9 [1.3, 2.4] | 3.6 [3.5, 3.8] |  |
| enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.1 [0.7, 1.6] | 4.3 [4.1, 4.4] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 3.5 [2.8, 4.2] | 5.1 [5.0, 5.2] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.5 [1.1, 1.9] | 4.7 [4.5, 4.8] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.4 [3.7, 5.1] | 4.5 [4.4, 4.6] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 6.3 [5.6, 7.1] | 4.7 [4.6, 4.8] |  |
| enemy-a+enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.9 [6.9, 8.9] | 5.9 [5.7, 6.0] |  |
| enemy-c+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.0 [4.1, 5.8] | 6.0 [5.9, 6.0] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.9 [7.0, 8.7] | 6.5 [6.3, 6.6] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 15.0 [14.0, 16.0] | 7.2 [7.1, 7.3] |  |
| enemy-b+enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 3.7 [3.1, 4.3] | 7.5 [7.4, 7.6] |  |
| elite-a | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.6 [3.9, 5.3] | 5.2 [5.1, 5.2] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.4 [1.8, 3.0] | 5.5 [5.4, 5.6] |  |
| boss-a | boss | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 9.9 [9.0, 10.8] | 9.1 [8.9, 9.3] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 7.5 [6.7, 8.3] | 1.7 [1.6, 1.8] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 8.2 [7.6, 8.9] | 2.0 [2.0, 2.1] |  |
| enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 5.8 [4.9, 6.8] | 2.1 [2.0, 2.2] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 15.6 [14.8, 16.4] | 3.1 [3.0, 3.1] |  |
| enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 13.4 [12.9, 13.9] | 2.6 [2.5, 2.7] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 16.3 [15.4, 17.2] | 2.6 [2.5, 2.7] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 18.0 [17.3, 18.8] | 2.8 [2.8, 2.9] |  |
| enemy-a+enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 21.7 [20.7, 22.7] | 3.4 [3.3, 3.5] |  |
| enemy-c+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 18.9 [17.7, 20.1] | 3.3 [3.2, 3.4] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 21.7 [21.0, 22.5] | 3.6 [3.5, 3.7] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 31.3 [30.4, 32.3] | 4.0 [3.9, 4.1] |  |
| enemy-b+enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 29.4 [28.2, 30.7] | 4.0 [3.9, 4.0] |  |
| elite-a | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 16.8 [15.9, 17.7] | 3.0 [2.9, 3.0] |  |
| elite-b | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 13.6 [12.5, 14.7] | 3.0 [3.0, 3.1] |  |
| boss-a | boss | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 40.6 [39.7, 41.4] | 4.7 [4.6, 4.8] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 3.3 [2.7, 3.9] | 1.8 [1.7, 1.9] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 2.4 [1.9, 2.9] | 2.0 [2.0, 2.1] |  |
| enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 1.3 [0.7, 1.9] | 2.1 [2.1, 2.2] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 8.2 [7.5, 9.0] | 3.1 [3.0, 3.2] |  |
| enemy-c | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 7.1 [6.4, 7.8] | 2.6 [2.6, 2.7] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 9.3 [8.6, 10.0] | 2.7 [2.6, 2.8] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 9.6 [8.9, 10.3] | 3.0 [2.9, 3.1] |  |
| enemy-a+enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 13.3 [12.5, 14.0] | 3.7 [3.6, 3.8] |  |
| enemy-c+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 12.8 [11.6, 14.0] | 3.4 [3.3, 3.5] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 13.2 [12.3, 14.1] | 3.9 [3.7, 4.0] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 22.1 [20.8, 23.3] | 4.5 [4.4, 4.7] |  |
| enemy-b+enemy-c | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 23.7 [22.4, 25.1] | 4.9 [4.8, 5.1] |  |
| elite-a | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 9.9 [8.8, 10.9] | 2.9 [2.8, 3.0] |  |
| elite-b | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 6.7 [5.7, 7.7] | 2.9 [2.8, 3.0] |  |
| boss-a | boss | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 28.1 [27.2, 28.9] | 5.4 [5.2, 5.5] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 5.4 [5.0, 5.8] | 3.0 [2.9, 3.1] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 4.7 [4.3, 5.1] | 3.3 [3.2, 3.3] |  |
| enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 5.0 [4.6, 5.4] | 3.9 [3.8, 4.0] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 7.0 [6.5, 7.6] | 5.1 [5.0, 5.1] |  |
| enemy-c | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 10.8 [10.2, 11.4] | 4.6 [4.5, 4.7] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 12.6 [11.9, 13.2] | 4.3 [4.3, 4.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 13.0 [12.4, 13.6] | 4.5 [4.4, 4.6] |  |
| enemy-a+enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 16.8 [16.1, 17.5] | 5.8 [5.7, 5.9] |  |
| enemy-c+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 15.7 [15.0, 16.4] | 5.8 [5.7, 5.9] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 15.1 [14.4, 15.7] | 5.9 [5.8, 6.0] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 28.1 [27.3, 28.9] | 7.0 [6.8, 7.1] |  |
| enemy-b+enemy-c | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 21.1 [20.0, 22.2] | 7.3 [7.2, 7.5] |  |
| elite-a | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 17.5 [16.9, 18.2] | 5.1 [5.0, 5.2] |  |
| elite-b | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 15.1 [14.4, 15.8] | 5.6 [5.5, 5.7] |  |
| boss-a | boss | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 35.4 [34.3, 36.5] | 9.0 [8.9, 9.2] |  |


## Fight length distribution

Turns per fight with the mid deck set (starter + 5 sampled cards). Mean has a 95% CI; p10/median/p90 show spread (a fight that is usually 4 turns but sometimes 12 is a pacing problem the mean hides). Histogram buckets are turn counts (last bucket = 15+). 15 fights x 100 seeds = 1500 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.

### random bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 3.36 [3.26, 3.46] | 2 | 3 | 4 | 3-6 | ok |
| enemy-d+enemy-d | normal | 3.80 [3.71, 3.89] | 3 | 4 | 5 | 3-6 | ok |
| enemy-b | normal | 4.60 [4.50, 4.70] | 3 | 5 | 5 | 3-6 | ok |
| enemy-b+enemy-d | normal | 6.43 [6.32, 6.55] | 5 | 7 | 8 | 3-6 | HIGH |
| enemy-c | normal | 5.77 [5.66, 5.88] | 4 | 6 | 7 | 3-6 | ok |
| enemy-a+enemy-d | normal | 5.32 [5.22, 5.41] | 4 | 5 | 6 | 3-6 | ok |
| enemy-d+enemy-d+enemy-d | normal | 5.68 [5.60, 5.77] | 5 | 6 | 6 | 3-6 | ok |
| enemy-a+enemy-b | normal | 7.83 [7.70, 7.96] | 6 | 8 | 9 | 3-6 | HIGH |
| enemy-c+enemy-d | normal | 7.32 [7.21, 7.42] | 6 | 7 | 8 | 3-6 | HIGH |
| enemy-b+enemy-d+enemy-d | normal | 8.26 [8.12, 8.40] | 7 | 8 | 9 | 3-6 | HIGH |
| enemy-a+enemy-b+enemy-d | normal | 8.19 [7.97, 8.42] | 6 | 8 | 11 | 3-6 | HIGH |
| enemy-b+enemy-c | normal | 9.83 [9.68, 9.98] | 8 | 10 | 12 | 3-6 | HIGH |
| elite-a | elite | 6.11 [6.00, 6.21] | 5 | 6 | 7 | 5-9 | ok |
| elite-b | elite | 7.03 [6.90, 7.15] | 5.900000000000002 | 7 | 8 | 5-9 | ok |
| boss-a | boss | 11.24 [11.01, 11.46] | 9 | 12 | 13 | 8-14 | ok |

```
enemy-a (normal)
 1     2 
 2    36 ######
 3   142 ########################
 4    94 ################
 5    24 ####
 6     2 
```

```
enemy-d+enemy-d (normal)
 2     6 #
 3   107 ###################
 4   134 ########################
 5    47 ########
 6     6 #
```

```
enemy-b (normal)
 2     1 
 3    34 #####
 4    81 ############
 5   161 ########################
 6    16 ##
 7     6 #
 8     1 
```

```
enemy-b+enemy-d (normal)
 4     6 #
 5    53 ###########
 6    90 ##################
 7   117 ########################
 8    24 #####
 9    10 ##
```

```
enemy-c (normal)
 4    40 ######
 5    56 #########
 6   150 ########################
 7    42 #######
 8    11 ##
 9     1 
```

```
enemy-a+enemy-d (normal)
 3     7 #
 4    34 ######
 5   139 ########################
 6    99 #################
 7    19 ###
 8     2 
```

```
enemy-d+enemy-d+enemy-d (normal)
 4     8 #
 5   111 #################
 6   155 ########################
 7    20 ###
 8     6 #
```

```
enemy-a+enemy-b (normal)
 5     6 ##
 6    28 #######
 7    83 #####################
 8    95 ########################
 9    73 ##################
10    12 ###
11     3 #
```

```
enemy-c+enemy-d (normal)
 4     1 
 5     3 #
 6    45 ########
 7   131 ########################
 8    95 #################
 9    23 ####
11     2 
```

```
enemy-b+enemy-d+enemy-d (normal)
 5     7 ##
 6    11 ###
 7    53 ############
 8   103 ########################
 9    98 #######################
10    13 ###
11    10 ##
12     4 #
13     1 
```

```
enemy-a+enemy-b+enemy-d (normal)
 5    18 ######
 6    78 ########################
 7    11 ###
 8    54 #################
 9    51 ################
10    45 ##############
11    36 ###########
12     5 ##
13     2 #
```

```
enemy-b+enemy-c (normal)
 7     4 #
 8    60 ###################
 9    62 ####################
10    67 #####################
11    76 ########################
12    26 ########
13     5 ##
```

```
elite-a (elite)
 4    13 ##
 5    49 ########
 6   149 ########################
 7    75 ############
 8    10 ##
 9     4 #
```

```
elite-b (elite)
 4     2 
 5    28 ####
 6    37 ######
 7   154 ########################
 8    60 #########
 9    11 ##
10     7 #
11     1 
```

```
boss-a (boss)
 7     8 ##
 8     5 #
 9    87 ######################
10     6 ##
11    43 ###########
12    32 ########
13    96 ########################
14    18 #####
15+    5 #
```

### greedy bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 3.03 [2.96, 3.10] | 2 | 3 | 4 | 3-6 | ok |
| enemy-d+enemy-d | normal | 3.40 [3.33, 3.47] | 3 | 3 | 4 | 3-6 | ok |
| enemy-b | normal | 3.82 [3.74, 3.90] | 3 | 4 | 5 | 3-6 | ok |
| enemy-b+enemy-d | normal | 5.22 [5.14, 5.29] | 5 | 5 | 6 | 3-6 | ok |
| enemy-c | normal | 4.78 [4.67, 4.88] | 4 | 4 | 6 | 3-6 | ok |
| enemy-a+enemy-d | normal | 4.99 [4.91, 5.08] | 4 | 5 | 6 | 3-6 | ok |
| enemy-d+enemy-d+enemy-d | normal | 4.99 [4.90, 5.07] | 4 | 5 | 6 | 3-6 | ok |
| enemy-a+enemy-b | normal | 6.30 [6.18, 6.42] | 5 | 6 | 7 | 3-6 | HIGH |
| enemy-c+enemy-d | normal | 6.54 [6.44, 6.64] | 5 | 7 | 8 | 3-6 | HIGH |
| enemy-b+enemy-d+enemy-d | normal | 6.84 [6.72, 6.96] | 5 | 7 | 8 | 3-6 | HIGH |
| enemy-a+enemy-b+enemy-d | normal | 8.24 [8.13, 8.36] | 7 | 9 | 9 | 3-6 | HIGH |
| enemy-b+enemy-c | normal | 8.80 [8.66, 8.95] | 7 | 9 | 11 | 3-6 | HIGH |
| elite-a | elite | 5.30 [5.21, 5.38] | 4 | 5 | 6 | 5-9 | ok |
| elite-b | elite | 5.95 [5.82, 6.08] | 5 | 6 | 7 | 5-9 | ok |
| boss-a | boss | 9.79 [9.62, 9.95] | 8 | 10 | 11 | 8-14 | ok |

```
enemy-a (normal)
 2    42 #####
 3   214 ########################
 4    36 ####
 5     8 #
```

```
enemy-d+enemy-d (normal)
 2    10 #
 3   168 ########################
 4   113 ################
 5     9 #
```

```
enemy-b (normal)
 2     1 
 3   104 ##################
 4   142 ########################
 5    53 #########
```

```
enemy-b+enemy-d (normal)
 3     1 
 4    16 ##
 5   216 ########################
 6    51 ######
 7    16 ##
```

```
enemy-c (normal)
 3     6 #
 4   150 ########################
 5    55 #########
 6    83 #############
 7     6 #
```

```
enemy-a+enemy-d (normal)
 3     6 #
 4    66 ##########
 5   155 ########################
 6    70 ###########
 7     3 
```

```
enemy-d+enemy-d+enemy-d (normal)
 4    79 #############
 5   150 ########################
 6    67 ###########
 7     4 #
```

```
enemy-a+enemy-b (normal)
 4     2 
 5    89 ##################
 6    64 #############
 7   120 ########################
 8    12 ##
 9    13 ###
```

```
enemy-c+enemy-d (normal)
 4     4 #
 5    33 ######
 6    94 ################
 7   137 ########################
 8    29 #####
 9     3 #
```

```
enemy-b+enemy-d+enemy-d (normal)
 5    47 ########
 6    42 #######
 7   142 ########################
 8    51 #########
 9    18 ###
```

```
enemy-a+enemy-b+enemy-d (normal)
 5     1 
 6    10 ##
 7    71 ############
 8    67 ###########
 9   140 ########################
10     6 #
11     5 #
```

```
enemy-b+enemy-c (normal)
 6     5 #
 7    36 ########
 8    85 ###################
 9   110 ########################
10    22 #####
11    35 ########
12     7 ##
```

```
elite-a (elite)
 4    48 #########
 5   120 #######################
 6   127 ########################
 7     5 #
```

```
elite-b (elite)
 4    27 ######
 5   105 ########################
 6    47 ###########
 7    99 #######################
 8    22 #####
```

```
boss-a (boss)
 7     1 
 8    68 ###################
 9    74 ####################
10    49 ##############
11    87 ########################
12     6 ##
13    10 ###
14     5 #
```

### smart bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 2.73 [2.67, 2.79] | 2 | 3 | 3 | 3-6 | LOW |
| enemy-d+enemy-d | normal | 2.99 [2.94, 3.04] | 2.900000000000002 | 3 | 3 | 3-6 | LOW |
| enemy-b | normal | 3.52 [3.45, 3.60] | 3 | 4 | 4 | 3-6 | ok |
| enemy-b+enemy-d | normal | 4.82 [4.75, 4.88] | 4 | 5 | 5 | 3-6 | ok |
| enemy-c | normal | 4.29 [4.22, 4.36] | 4 | 4 | 5 | 3-6 | ok |
| enemy-a+enemy-d | normal | 4.16 [4.10, 4.23] | 4 | 4 | 5 | 3-6 | ok |
| enemy-d+enemy-d+enemy-d | normal | 4.41 [4.35, 4.47] | 4 | 4 | 5 | 3-6 | ok |
| enemy-a+enemy-b | normal | 5.64 [5.55, 5.73] | 5 | 6 | 7 | 3-6 | ok |
| enemy-c+enemy-d | normal | 5.73 [5.64, 5.82] | 5 | 6 | 7 | 3-6 | ok |
| enemy-b+enemy-d+enemy-d | normal | 5.97 [5.88, 6.06] | 5 | 6 | 7 | 3-6 | ok |
| enemy-a+enemy-b+enemy-d | normal | 7.24 [7.14, 7.34] | 6 | 7 | 8 | 3-6 | HIGH |
| enemy-b+enemy-c | normal | 7.70 [7.58, 7.82] | 6 | 8 | 9 | 3-6 | HIGH |
| elite-a | elite | 4.83 [4.75, 4.90] | 4 | 5 | 6 | 5-9 | LOW |
| elite-b | elite | 5.13 [5.03, 5.23] | 4 | 5 | 6 | 5-9 | ok |
| boss-a | boss | 9.25 [9.07, 9.42] | 8 | 9 | 11 | 8-14 | ok |

```
enemy-a (normal)
 1     1 
 2    91 ###########
 3   197 ########################
 4    11 #
```

```
enemy-d+enemy-d (normal)
 2    30 ###
 3   244 ########################
 4    26 ###
```

```
enemy-b (normal)
 2    13 ##
 3   128 #####################
 4   148 ########################
 5    11 ##
```

```
enemy-b+enemy-d (normal)
 3     8 #
 4    57 ######
 5   218 ########################
 6    16 ##
 7     1 
```

```
enemy-c (normal)
 3    16 ##
 4   192 ########################
 5    82 ##########
 6    10 #
```

```
enemy-a+enemy-d (normal)
 3    29 ####
 4   193 ########################
 5    78 ##########
```

```
enemy-d+enemy-d+enemy-d (normal)
 3     4 #
 4   169 ########################
 5   127 ##################
```

```
enemy-a+enemy-b (normal)
 4     9 ##
 5   137 ########################
 6   107 ###################
 7    46 ########
 8     1 
```

```
enemy-c+enemy-d (normal)
 4    22 ###
 5    81 #############
 6   153 ########################
 7    44 #######
```

```
enemy-b+enemy-d+enemy-d (normal)
 4     3 #
 5    91 ##################
 6   119 ########################
 7    85 #################
 8     2 
```

```
enemy-a+enemy-b+enemy-d (normal)
 4     1 
 5     7 #
 6    48 #########
 7   129 ########################
 8    93 #################
 9    22 ####
```

```
enemy-b+enemy-c (normal)
 5     8 ##
 6    35 #######
 7    72 ###############
 8   113 ########################
 9    70 ###############
10     1 
11     1 
```

```
elite-a (elite)
 3     2 
 4    92 #############
 5   166 ########################
 6    36 #####
 7     4 #
```

```
elite-b (elite)
 3     3 
 4    64 ##########
 5   147 ########################
 6    62 ##########
 7    24 ####
```

```
boss-a (boss)
 7    24 #####
 8   112 ########################
 9    45 ##########
10    23 #####
11    84 ##################
12     6 #
13     5 #
14     1 
```


## Card effect: ablation and addition

Each row compares the starter deck WITH the card against the same deck WITHOUT it, on identical seeds (paired). Changes are "with minus without"; a negative HP-lost change is good for the player. Brackets are 95% confidence intervals. 15 fights x 60 seeds = 900 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.
Verdict reads the headline metric (HP lost, negligible if within +-1): INCONCLUSIVE means the interval spans zero and is too wide to call the card negligible. Add seeds before concluding anything.
A card added to the starter deck shows its stand-alone value. Cards that need partners (synergy) will look weak here; see the pair experiment.

### random bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| heating-up | skill | 1 | yes | +12.8 [+10.6, +15.0] pts | -7.2 [-7.8, -6.5] | -1.93 [-2.05, -1.82] | better |
| end-guard | power | 1 | yes | +10.0 [+7.9, +12.1] pts | -6.5 [-7.1, -5.9] | +0.61 [+0.49, +0.72] | better |
| heat-flash | attack | 0 | yes | +11.0 [+8.8, +13.2] pts | -6.5 [-7.1, -5.9] | -0.49 [-0.60, -0.39] | better |
| attack-echo | power | 1 | yes | +9.1 [+7.1, +11.1] pts | -5.6 [-6.3, -5.0] | +0.58 [+0.47, +0.69] | better |
| prime-a | skill | 0 | yes | +5.8 [+3.9, +7.6] pts | -3.8 [-4.4, -3.2] | +0.30 [+0.19, +0.41] | better |
| guarded-strike | attack | 1 | yes | +5.4 [+3.5, +7.4] pts | -3.7 [-4.3, -3.1] | -0.09 [-0.19, +0.01] | better |
| cryofreeze | power | 2 | yes | +7.9 [+5.9, +9.9] pts | -3.5 [-4.1, -2.9] | +0.78 [+0.67, +0.89] | better |
| apocalyptic-flame | attack | 3 | yes | +7.4 [+5.4, +9.5] pts | -3.3 [-3.9, -2.7] | -1.19 [-1.31, -1.08] | better |
| strengthen | power | 1 | yes | +9.2 [+7.2, +11.3] pts | -3.0 [-3.6, -2.4] | -0.88 [-0.99, -0.78] | better |
| ice-barrier | skill | 1 | yes | +4.4 [+2.5, +6.4] pts | -2.8 [-3.5, -2.2] | +1.21 [+1.09, +1.34] | better |
| pain-engine | power | 1 | yes | +10.9 [+8.8, +13.0] pts | -2.8 [-3.4, -2.1] | -0.81 [-0.92, -0.70] | better |
| jab | attack | 0 | yes | +5.6 [+3.6, +7.5] pts | -2.6 [-3.1, -2.0] | -0.63 [-0.73, -0.54] | better |
| fortify | power | 2 | yes | +5.7 [+3.8, +7.5] pts | -2.2 [-2.8, -1.6] | +0.73 [+0.62, +0.84] | better |
| heat-warning | attack | 1 | yes | +5.2 [+3.2, +7.2] pts | -2.0 [-2.6, -1.4] | -0.89 [-0.99, -0.79] | better |
| scorching-wind | attack | 0 | yes | +4.0 [+2.2, +5.8] pts | -2.0 [-2.5, -1.4] | -0.49 [-0.59, -0.39] | better |
| heavy-hit | attack | 3 | yes | +4.4 [+2.5, +6.4] pts | -1.7 [-2.2, -1.1] | -0.96 [-1.07, -0.85] | better |
| big-block | skill | 2 | yes | +2.2 [+0.4, +4.1] pts | -1.6 [-2.3, -1.0] | +1.41 [+1.28, +1.54] | better |
| hand-strike | attack | 1 | yes | +3.7 [+1.8, +5.5] pts | -1.5 [-2.0, -0.9] | -0.81 [-0.91, -0.71] | better |
| frozen-shield | skill | 1 | yes | +0.4 [-1.3, +2.2] pts | -1.4 [-2.0, -0.8] | +0.88 [+0.76, +0.99] | better |
| crippling-heat | attack | 1 | yes | +1.8 [-0.1, +3.7] pts | -1.3 [-1.9, -0.7] | -0.08 [-0.18, +0.03] | better |
| cauterize | skill | 1 | yes | -0.2 [-1.9, +1.5] pts | -1.2 [-1.8, -0.7] | +0.76 [+0.65, +0.87] | better |
| single-use-strike | attack | 1 | yes | +1.9 [+0.1, +3.6] pts | -1.2 [-1.7, -0.6] | -0.49 [-0.59, -0.38] | better |
| combo-strike | attack | 1 | yes | +3.1 [+1.4, +4.9] pts | -1.1 [-1.6, -0.5] | -0.74 [-0.84, -0.64] | better |
| block-spark | power | 1 | yes | +6.7 [+4.7, +8.6] pts | -1.0 [-1.6, -0.4] | -0.51 [-0.61, -0.41] | better |
| opening-spark | power | 1 | yes | +6.9 [+4.9, +8.8] pts | -1.0 [-1.6, -0.4] | -0.49 [-0.59, -0.39] | better |
| defend | skill | 1 | no | -1.7 [-3.4, +0.0] pts | -0.5 [-1.0, +0.1] | +0.70 [+0.59, +0.82] | INCONCLUSIVE |
| weaken | skill | 1 | yes | -0.1 [-1.9, +1.7] pts | -0.3 [-0.9, +0.3] | +0.83 [+0.72, +0.95] | negligible |
| ice-block | skill | 3 | yes | +0.6 [-1.5, +2.6] pts | -0.2 [-0.9, +0.4] | +1.40 [+1.26, +1.54] | negligible |
| meteor-shower | attack | 2 | yes | +3.1 [+1.4, +4.9] pts | -0.2 [-0.7, +0.4] | -0.75 [-0.86, -0.64] | negligible |
| endless-winter | power | 1 | yes | +5.7 [+3.7, +7.7] pts | +0.2 [-0.4, +0.9] | +0.38 [+0.27, +0.49] | negligible |
| sunder | attack | 2 | yes | +2.8 [+1.0, +4.6] pts | +0.3 [-0.3, +0.8] | -0.72 [-0.83, -0.61] | negligible |
| power-up | skill | 1 | yes | +1.9 [+0.2, +3.6] pts | +0.3 [-0.3, +0.9] | -0.46 [-0.56, -0.36] | negligible |
| blood-strike | attack | 1 | yes | +3.4 [+1.7, +5.2] pts | +0.7 [+0.1, +1.2] | -1.60 [-1.70, -1.50] | worse |
| strike | attack | 1 | no | -1.1 [-2.8, +0.6] pts | +0.7 [+0.1, +1.2] | -0.43 [-0.53, -0.34] | worse |
| expose | skill | 1 | yes | -1.0 [-2.8, +0.8] pts | +0.7 [+0.1, +1.2] | -0.38 [-0.48, -0.27] | worse |
| bolt | attack | 2 | yes | +1.8 [-0.0, +3.6] pts | +1.0 [+0.5, +1.6] | -0.60 [-0.70, -0.49] | worse |
| cull | skill | 0 | yes | -1.6 [-3.3, +0.2] pts | +1.2 [+0.6, +1.7] | +0.21 [+0.09, +0.33] | worse |
| opportunist | attack | 1 | yes | -2.8 [-4.5, -1.0] pts | +1.4 [+0.8, +1.9] | -0.26 [-0.36, -0.16] | worse |
| kill-reward | power | 1 | yes | -0.6 [-2.3, +1.1] pts | +1.4 [+0.8, +2.0] | +0.07 [-0.03, +0.18] | worse |
| focus | power | 1 | no | -2.1 [-3.7, -0.5] pts | +2.0 [+1.5, +2.5] | +0.19 [+0.08, +0.29] | worse |
| tag-a-echo | power | 1 | yes | -1.8 [-3.5, -0.1] pts | +2.0 [+1.5, +2.6] | +0.19 [+0.08, +0.29] | worse |
| double-strength | skill | 1 | yes | -1.8 [-3.5, -0.1] pts | +2.0 [+1.5, +2.6] | +0.19 [+0.08, +0.29] | worse |
| exhaust-engine | power | 1 | yes | -1.8 [-3.5, -0.1] pts | +2.0 [+1.5, +2.6] | +0.19 [+0.08, +0.29] | worse |
| hungering-cold | power | 1 | yes | -1.8 [-3.5, -0.1] pts | +2.0 [+1.5, +2.6] | +0.19 [+0.08, +0.29] | worse |
| tag-a-payoff | attack | 1 | yes | -4.1 [-5.8, -2.5] pts | +2.1 [+1.5, +2.6] | -0.06 [-0.17, +0.04] | worse |
| block-slam | attack | 1 | yes | -3.1 [-4.8, -1.5] pts | +2.1 [+1.6, +2.7] | -0.04 [-0.14, +0.07] | worse |
| glaciate | attack | 2 | yes | -1.7 [-3.3, -0.0] pts | +2.5 [+1.9, +3.0] | -0.32 [-0.42, -0.21] | worse |
| exhaust-payoff | attack | 1 | yes | -4.7 [-6.3, -3.0] pts | +2.6 [+2.1, +3.2] | +0.06 [-0.04, +0.17] | worse |
| arctic-strike | attack | 1 | yes | -4.7 [-6.3, -3.0] pts | +2.6 [+2.1, +3.2] | +0.06 [-0.04, +0.17] | worse |
| hypothermia | skill | 1 | yes | -5.7 [-7.4, -3.9] pts | +4.4 [+3.8, +4.9] | +0.47 [+0.36, +0.58] | worse |
| glacial-spike | skill | 1 | yes | -5.7 [-7.4, -3.9] pts | +4.4 [+3.8, +4.9] | +0.47 [+0.36, +0.58] | worse |
| quick-draw | skill | 1 | yes | -6.1 [-8.0, -4.2] pts | +4.9 [+4.3, +5.5] | +0.51 [+0.39, +0.63] | worse |
| molten-core | skill | 2 | yes | -7.9 [-9.8, -5.9] pts | +7.0 [+6.3, +7.7] | +0.73 [+0.60, +0.86] | worse |
| absolute-zero | skill | 3 | yes | -9.8 [-11.9, -7.7] pts | +7.6 [+6.8, +8.3] | +0.68 [+0.55, +0.82] | worse |

### random bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| heating-up | skill | 1 | yes | +13.0 [+10.7, +15.3] pts | -7.9 [-8.5, -7.2] | -1.62 [-1.72, -1.51] | better |
| heat-flash | attack | 0 | yes | +11.7 [+9.5, +13.8] pts | -7.9 [-8.5, -7.3] | -0.08 [-0.18, +0.02] | better |
| end-guard | power | 1 | yes | +10.4 [+8.4, +12.5] pts | -7.2 [-7.8, -6.7] | +1.39 [+1.27, +1.52] | better |
| attack-echo | power | 1 | yes | +8.1 [+6.2, +10.0] pts | -5.6 [-6.1, -5.0] | +1.32 [+1.21, +1.44] | better |
| prime-a | skill | 0 | yes | +5.3 [+3.4, +7.3] pts | -4.7 [-5.2, -4.1] | +0.98 [+0.87, +1.09] | better |
| cryofreeze | power | 2 | yes | +9.8 [+7.8, +11.8] pts | -4.6 [-5.2, -4.0] | +1.57 [+1.44, +1.69] | better |
| guarded-strike | attack | 1 | yes | +4.4 [+3.0, +5.9] pts | -4.5 [-4.8, -4.2] | +0.37 [+0.31, +0.43] | better |
| apocalyptic-flame | attack | 3 | yes | +8.9 [+6.9, +10.9] pts | -4.0 [-4.6, -3.5] | -0.85 [-0.97, -0.73] | better |
| ice-barrier | skill | 1 | yes | +2.9 [+1.1, +4.7] pts | -3.5 [-4.1, -2.9] | +1.96 [+1.82, +2.10] | better |
| jab | attack | 0 | yes | +5.2 [+3.4, +7.1] pts | -3.3 [-3.8, -2.8] | -0.21 [-0.31, -0.11] | better |
| pain-engine | power | 1 | yes | +10.9 [+8.7, +13.0] pts | -3.2 [-3.7, -2.6] | -0.26 [-0.36, -0.15] | better |
| fortify | power | 2 | yes | +7.1 [+5.1, +9.1] pts | -3.1 [-3.7, -2.5] | +1.51 [+1.39, +1.63] | better |
| strengthen | power | 1 | yes | +7.7 [+5.7, +9.6] pts | -3.1 [-3.6, -2.6] | -0.30 [-0.40, -0.20] | better |
| scorching-wind | attack | 0 | yes | +3.6 [+1.8, +5.3] pts | -2.7 [-3.2, -2.2] | -0.02 [-0.12, +0.08] | better |
| heat-warning | attack | 1 | yes | +6.1 [+4.5, +7.7] pts | -2.6 [-2.9, -2.3] | -0.48 [-0.53, -0.43] | better |
| heavy-hit | attack | 3 | yes | +6.2 [+4.4, +8.1] pts | -2.3 [-2.9, -1.8] | -0.55 [-0.66, -0.44] | better |
| hand-strike | attack | 1 | yes | +4.9 [+3.5, +6.3] pts | -2.2 [-2.5, -1.9] | -0.44 [-0.49, -0.39] | better |
| big-block | skill | 2 | yes | +1.3 [-0.4, +3.1] pts | -2.0 [-2.6, -1.5] | +2.31 [+2.16, +2.45] | better |
| block-spark | power | 1 | yes | +5.9 [+4.0, +7.7] pts | -1.9 [-2.5, -1.4] | -0.06 [-0.15, +0.03] | better |
| combo-strike | attack | 1 | yes | +3.6 [+2.3, +4.8] pts | -1.9 [-2.2, -1.6] | -0.37 [-0.42, -0.32] | better |
| opening-spark | power | 1 | yes | +6.2 [+4.4, +8.1] pts | -1.8 [-2.4, -1.3] | +0.00 [-0.09, +0.09] | better |
| frozen-shield | skill | 1 | yes | +1.2 [-0.1, +2.5] pts | -1.8 [-2.2, -1.4] | +1.66 [+1.56, +1.75] | better |
| single-use-strike | attack | 1 | yes | +0.4 [-1.2, +2.1] pts | -1.8 [-2.3, -1.3] | -0.00 [-0.10, +0.10] | better |
| crippling-heat | attack | 1 | yes | +0.8 [-0.5, +2.0] pts | -1.8 [-2.0, -1.5] | +0.43 [+0.38, +0.48] | better |
| cauterize | skill | 1 | yes | +0.4 [-1.2, +2.1] pts | -1.4 [-2.0, -0.9] | +1.71 [+1.59, +1.83] | better |
| weaken | skill | 1 | yes | -0.3 [-1.7, +1.0] pts | -0.8 [-1.2, -0.5] | +1.62 [+1.53, +1.71] | better |
| power-up | skill | 1 | yes | +3.2 [+1.5, +5.0] pts | -0.7 [-1.2, -0.2] | -0.01 [-0.11, +0.08] | better |
| meteor-shower | attack | 2 | yes | +3.1 [+1.5, +4.7] pts | -0.7 [-1.2, -0.2] | -0.31 [-0.42, -0.21] | better |
| endless-winter | power | 1 | yes | +4.0 [+2.2, +5.8] pts | -0.6 [-1.1, -0.1] | +1.08 [+0.97, +1.20] | better |
| defend | skill | 1 | no | -0.7 [-2.2, +0.9] pts | -0.6 [-1.1, -0.1] | +1.65 [+1.53, +1.77] | better |
| ice-block | skill | 3 | yes | +0.6 [-1.3, +2.4] pts | -0.5 [-1.1, +0.0] | +2.34 [+2.18, +2.50] | INCONCLUSIVE |
| sunder | attack | 2 | yes | +1.4 [-0.3, +3.1] pts | -0.4 [-0.9, +0.1] | -0.29 [-0.39, -0.19] | negligible |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| bolt | attack | 2 | yes | +1.4 [-0.0, +2.9] pts | +0.1 [-0.4, +0.6] | -0.19 [-0.29, -0.10] | negligible |
| blood-strike | attack | 1 | yes | +3.9 [+2.4, +5.3] pts | +0.4 [+0.1, +0.8] | -1.36 [-1.43, -1.29] | worse |
| expose | skill | 1 | yes | -0.4 [-1.6, +0.7] pts | +0.7 [+0.4, +0.9] | +0.18 [+0.12, +0.23] | worse |
| cull | skill | 0 | yes | -1.2 [-2.8, +0.4] pts | +0.7 [+0.1, +1.2] | +0.82 [+0.69, +0.95] | worse |
| opportunist | attack | 1 | yes | -2.1 [-3.1, -1.2] pts | +1.0 [+0.8, +1.2] | +0.24 [+0.20, +0.28] | worse |
| kill-reward | power | 1 | yes | -1.3 [-2.9, +0.2] pts | +1.1 [+0.6, +1.6] | +0.77 [+0.67, +0.88] | worse |
| tag-a-echo | power | 1 | yes | -2.2 [-3.7, -0.8] pts | +1.7 [+1.2, +2.2] | +0.88 [+0.78, +0.98] | worse |
| double-strength | skill | 1 | yes | -2.2 [-3.7, -0.8] pts | +1.7 [+1.2, +2.2] | +0.88 [+0.78, +0.98] | worse |
| exhaust-engine | power | 1 | yes | -2.2 [-3.7, -0.8] pts | +1.7 [+1.2, +2.2] | +0.88 [+0.78, +0.98] | worse |
| hungering-cold | power | 1 | yes | -2.2 [-3.7, -0.8] pts | +1.7 [+1.2, +2.2] | +0.88 [+0.78, +0.98] | worse |
| focus | power | 1 | no | -2.8 [-4.4, -1.1] pts | +1.8 [+1.3, +2.3] | +0.88 [+0.77, +0.99] | worse |
| glaciate | attack | 2 | yes | -2.7 [-4.2, -1.2] pts | +1.8 [+1.3, +2.3] | +0.13 [+0.03, +0.23] | worse |
| block-slam | attack | 1 | yes | -2.7 [-3.8, -1.5] pts | +2.0 [+1.7, +2.3] | +0.46 [+0.40, +0.52] | worse |
| tag-a-payoff | attack | 1 | yes | -3.7 [-4.9, -2.4] pts | +2.1 [+1.8, +2.3] | +0.46 [+0.41, +0.51] | worse |
| exhaust-payoff | attack | 1 | yes | -4.1 [-5.4, -2.8] pts | +2.6 [+2.3, +2.9] | +0.63 [+0.57, +0.69] | worse |
| arctic-strike | attack | 1 | yes | -4.1 [-5.4, -2.8] pts | +2.6 [+2.3, +2.9] | +0.63 [+0.57, +0.69] | worse |
| hypothermia | skill | 1 | yes | -4.7 [-6.0, -3.3] pts | +4.4 [+4.0, +4.8] | +1.20 [+1.11, +1.28] | worse |
| glacial-spike | skill | 1 | yes | -4.7 [-6.0, -3.3] pts | +4.4 [+4.0, +4.8] | +1.20 [+1.11, +1.28] | worse |
| quick-draw | skill | 1 | yes | -5.6 [-7.2, -3.9] pts | +5.3 [+4.7, +5.8] | +1.26 [+1.13, +1.38] | worse |
| molten-core | skill | 2 | yes | -9.2 [-11.2, -7.2] pts | +7.4 [+6.7, +8.0] | +1.48 [+1.34, +1.62] | worse |
| absolute-zero | skill | 3 | yes | -11.7 [-13.9, -9.4] pts | +8.7 [+8.0, +9.4] | +1.32 [+1.17, +1.47] | worse |

### greedy bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ice-block | skill | 3 | yes | +0.0 [+0.0, +0.0] pts | -6.1 [-6.7, -5.5] | +1.14 [+1.05, +1.22] | better |
| big-block | skill | 2 | yes | +0.0 [+0.0, +0.0] pts | -5.6 [-6.1, -5.0] | +0.72 [+0.64, +0.81] | better |
| end-guard | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -4.9 [-5.4, -4.5] | +0.38 [+0.32, +0.44] | better |
| guarded-strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -4.1 [-4.6, -3.7] | -0.57 [-0.64, -0.51] | better |
| heat-flash | attack | 0 | yes | +0.0 [+0.0, +0.0] pts | -3.7 [-4.2, -3.2] | -1.02 [-1.09, -0.95] | better |
| heating-up | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.9 [-3.3, -2.4] | -2.42 [-2.52, -2.31] | better |
| cryofreeze | power | 2 | yes | +0.0 [+0.0, +0.0] pts | -2.9 [-3.4, -2.3] | +0.11 [+0.04, +0.18] | better |
| ice-barrier | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.8 [-3.2, -2.3] | +0.43 [+0.36, +0.51] | better |
| cauterize | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.5 [-3.0, -2.1] | +0.53 [+0.46, +0.61] | better |
| frozen-shield | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.3 [-2.7, -1.8] | +0.83 [+0.75, +0.91] | better |
| attack-echo | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.2 [-2.5, -1.8] | +0.38 [+0.32, +0.44] | better |
| fortify | power | 2 | yes | +0.0 [+0.0, +0.0] pts | -2.0 [-2.5, -1.5] | +0.24 [+0.16, +0.31] | better |
| prime-a | skill | 0 | yes | +0.0 [+0.0, +0.0] pts | -1.8 [-2.2, -1.4] | -0.17 [-0.24, -0.10] | better |
| heat-warning | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -1.8 [-2.2, -1.3] | -1.69 [-1.78, -1.61] | better |
| crippling-heat | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -1.6 [-2.1, -1.2] | -0.18 [-0.25, -0.11] | better |
| defend | skill | 1 | no | +0.0 [+0.0, +0.0] pts | -1.6 [-2.1, -1.2] | +0.62 [+0.55, +0.70] | better |
| strengthen | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -1.0 [-1.4, -0.6] | -1.16 [-1.23, -1.08] | better |
| focus | power | 1 | no | +0.0 [+0.0, +0.0] pts | -0.9 [-1.3, -0.5] | +0.40 [+0.33, +0.46] | better |
| weaken | skill | 1 | yes | -0.1 [-0.3, +0.1] pts | -0.9 [-1.3, -0.5] | +1.24 [+1.16, +1.32] | better |
| single-use-strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.8 [-1.2, -0.4] | -0.59 [-0.65, -0.52] | better |
| jab | attack | 0 | yes | +0.0 [+0.0, +0.0] pts | -0.7 [-1.1, -0.2] | -0.93 [-1.00, -0.86] | better |
| heavy-hit | attack | 3 | yes | +0.0 [+0.0, +0.0] pts | -0.2 [-0.6, +0.3] | -1.21 [-1.30, -1.13] | negligible |
| scorching-wind | attack | 0 | yes | -0.1 [-0.3, +0.1] pts | -0.1 [-0.6, +0.3] | -0.78 [-0.85, -0.71] | negligible |
| opening-spark | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.0 [-0.4, +0.4] | -0.72 [-0.78, -0.65] | negligible |
| block-spark | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.0 [-0.4, +0.4] | -0.58 [-0.65, -0.52] | negligible |
| pain-engine | power | 1 | yes | +0.0 [+0.0, +0.0] pts | +0.1 [-0.3, +0.5] | -0.74 [-0.83, -0.66] | negligible |
| apocalyptic-flame | attack | 3 | yes | +0.0 [+0.0, +0.0] pts | +0.4 [-0.1, +0.8] | -2.70 [-2.81, -2.59] | negligible |
| endless-winter | power | 1 | yes | +0.0 [+0.0, +0.0] pts | +0.4 [+0.0, +0.9] | +0.35 [+0.28, +0.41] | worse |
| power-up | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | +0.5 [+0.1, +0.9] | -0.85 [-0.93, -0.77] | worse |
| combo-strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | +0.9 [+0.5, +1.3] | -0.73 [-0.80, -0.66] | worse |
| expose | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | +1.1 [+0.7, +1.5] | -0.75 [-0.83, -0.67] | worse |
| sunder | attack | 2 | yes | +0.0 [+0.0, +0.0] pts | +1.2 [+0.7, +1.6] | -1.32 [-1.40, -1.24] | worse |
| hand-strike | attack | 1 | yes | -0.1 [-0.3, +0.1] pts | +1.2 [+0.8, +1.6] | -0.53 [-0.59, -0.46] | worse |
| bolt | attack | 2 | yes | +0.0 [+0.0, +0.0] pts | +1.2 [+0.8, +1.6] | -0.53 [-0.59, -0.46] | worse |
| strike | attack | 1 | no | -0.1 [-0.3, +0.1] pts | +1.4 [+1.0, +1.8] | -0.44 [-0.51, -0.37] | worse |
| opportunist | attack | 1 | yes | -0.1 [-0.3, +0.1] pts | +1.6 [+1.2, +2.0] | -0.35 [-0.41, -0.28] | worse |
| tag-a-payoff | attack | 1 | yes | -0.1 [-0.3, +0.1] pts | +1.7 [+1.3, +2.1] | -0.24 [-0.31, -0.18] | worse |
| exhaust-payoff | attack | 1 | yes | -0.2 [-0.5, +0.1] pts | +1.8 [+1.4, +2.2] | -0.20 [-0.27, -0.13] | worse |
| arctic-strike | attack | 1 | yes | -0.2 [-0.5, +0.1] pts | +1.8 [+1.4, +2.2] | -0.20 [-0.27, -0.13] | worse |
| kill-reward | power | 1 | yes | +0.0 [+0.0, +0.0] pts | +2.0 [+1.6, +2.3] | +0.24 [+0.17, +0.30] | worse |
| tag-a-echo | power | 1 | yes | +0.0 [+0.0, +0.0] pts | +2.1 [+1.7, +2.5] | +0.38 [+0.32, +0.44] | worse |
| exhaust-engine | power | 1 | yes | +0.0 [+0.0, +0.0] pts | +2.1 [+1.7, +2.5] | +0.38 [+0.32, +0.44] | worse |
| hungering-cold | power | 1 | yes | +0.0 [+0.0, +0.0] pts | +2.1 [+1.7, +2.5] | +0.38 [+0.32, +0.44] | worse |
| block-slam | attack | 1 | yes | -0.3 [-0.7, +0.0] pts | +2.3 [+1.8, +2.7] | -0.00 [-0.08, +0.07] | worse |
| double-strength | skill | 1 | yes | -0.3 [-0.7, +0.0] pts | +2.3 [+1.8, +2.7] | -0.00 [-0.08, +0.07] | worse |
| cull | skill | 0 | yes | -0.3 [-0.7, +0.0] pts | +2.3 [+1.8, +2.7] | -0.00 [-0.08, +0.07] | worse |
| meteor-shower | attack | 2 | yes | -0.3 [-0.7, +0.0] pts | +2.3 [+1.8, +2.7] | -0.00 [-0.08, +0.07] | worse |
| molten-core | skill | 2 | yes | -0.3 [-0.7, +0.0] pts | +2.3 [+1.8, +2.7] | -0.00 [-0.08, +0.07] | worse |
| absolute-zero | skill | 3 | yes | -0.3 [-0.7, +0.0] pts | +2.3 [+1.8, +2.7] | -0.00 [-0.08, +0.07] | worse |
| glaciate | attack | 2 | yes | -0.1 [-0.3, +0.1] pts | +2.4 [+2.0, +2.8] | -0.04 [-0.11, +0.03] | worse |
| quick-draw | skill | 1 | yes | -0.7 [-1.2, -0.1] pts | +3.1 [+2.6, +3.6] | +2.41 [+2.30, +2.52] | worse |
| hypothermia | skill | 1 | yes | -1.6 [-2.4, -0.7] pts | +5.8 [+5.3, +6.3] | +1.44 [+1.36, +1.53] | worse |
| glacial-spike | skill | 1 | yes | -1.6 [-2.4, -0.7] pts | +5.8 [+5.3, +6.3] | +1.44 [+1.36, +1.53] | worse |
| blood-strike | attack | 1 | yes | -0.4 [-0.9, -0.0] pts | +6.2 [+5.7, +6.6] | -2.02 [-2.10, -1.94] | worse |

### greedy bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ice-block | skill | 3 | yes | +0.0 [+0.0, +0.0] pts | -7.6 [-8.2, -7.1] | +1.74 [+1.65, +1.84] | better |
| big-block | skill | 2 | yes | +0.0 [+0.0, +0.0] pts | -7.0 [-7.5, -6.6] | +1.32 [+1.22, +1.42] | better |
| end-guard | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -7.0 [-7.4, -6.5] | +0.82 [+0.75, +0.89] | better |
| guarded-strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -5.7 [-6.1, -5.3] | -0.24 [-0.30, -0.18] | better |
| heat-flash | attack | 0 | yes | +0.0 [+0.0, +0.0] pts | -5.4 [-5.8, -5.0] | -0.68 [-0.75, -0.62] | better |
| cryofreeze | power | 2 | yes | +0.0 [+0.0, +0.0] pts | -4.8 [-5.3, -4.2] | +0.41 [+0.34, +0.48] | better |
| frozen-shield | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -4.7 [-5.1, -4.3] | +1.56 [+1.46, +1.65] | better |
| ice-barrier | skill | 1 | yes | -0.1 [-0.3, +0.1] pts | -4.6 [-5.0, -4.1] | +0.96 [+0.87, +1.05] | better |
| cauterize | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -4.3 [-4.7, -4.0] | +1.14 [+1.06, +1.23] | better |
| focus | power | 1 | no | +0.0 [+0.0, +0.0] pts | -4.0 [-4.4, -3.6] | +0.72 [+0.65, +0.78] | better |
| fortify | power | 2 | yes | +0.0 [+0.0, +0.0] pts | -4.0 [-4.5, -3.5] | +0.54 [+0.47, +0.61] | better |
| attack-echo | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -3.8 [-4.1, -3.4] | +0.82 [+0.75, +0.89] | better |
| defend | skill | 1 | no | +0.0 [+0.0, +0.0] pts | -3.5 [-3.8, -3.2] | +1.27 [+1.18, +1.35] | better |
| heating-up | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -3.4 [-3.8, -3.1] | -1.90 [-1.99, -1.81] | better |
| crippling-heat | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -3.4 [-3.7, -3.0] | +0.29 [+0.23, +0.35] | better |
| prime-a | skill | 0 | yes | +0.0 [+0.0, +0.0] pts | -3.2 [-3.5, -2.9] | +0.34 [+0.27, +0.40] | better |
| weaken | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.9 [-3.3, -2.6] | +2.10 [+2.00, +2.20] | better |
| single-use-strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.8 [-3.1, -2.4] | -0.19 [-0.25, -0.13] | better |
| heat-warning | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.7 [-3.0, -2.3] | -1.31 [-1.38, -1.23] | better |
| strengthen | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.7 [-3.0, -2.3] | -0.70 [-0.77, -0.64] | better |
| block-spark | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.2 [-2.5, -1.9] | -0.20 [-0.25, -0.14] | better |
| endless-winter | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.2 [-2.6, -1.8] | +0.88 [+0.81, +0.96] | better |
| opening-spark | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.2 [-2.5, -1.8] | -0.34 [-0.40, -0.28] | better |
| pain-engine | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.2 [-2.5, -1.8] | -0.25 [-0.33, -0.17] | better |
| jab | attack | 0 | yes | -0.1 [-0.3, +0.1] pts | -2.0 [-2.3, -1.7] | -0.60 [-0.65, -0.54] | better |
| scorching-wind | attack | 0 | yes | -0.2 [-0.5, +0.1] pts | -1.5 [-1.8, -1.2] | -0.40 [-0.46, -0.34] | better |
| heavy-hit | attack | 3 | yes | +0.0 [+0.0, +0.0] pts | -1.2 [-1.5, -0.9] | -0.95 [-1.02, -0.87] | better |
| power-up | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -1.0 [-1.3, -0.7] | -0.52 [-0.59, -0.45] | better |
| combo-strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.7 [-0.9, -0.5] | -0.40 [-0.45, -0.36] | better |
| kill-reward | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.5 [-0.8, -0.2] | +0.67 [+0.60, +0.73] | better |
| tag-a-echo | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.5 [-0.8, -0.1] | +0.82 [+0.75, +0.89] | better |
| exhaust-engine | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.5 [-0.8, -0.1] | +0.82 [+0.75, +0.89] | better |
| hungering-cold | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.5 [-0.8, -0.1] | +0.82 [+0.75, +0.89] | better |
| apocalyptic-flame | attack | 3 | yes | +0.0 [+0.0, +0.0] pts | -0.4 [-0.9, +0.0] | -2.83 [-2.94, -2.71] | negligible |
| hand-strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.3 [-0.4, -0.1] | -0.13 [-0.16, -0.10] | better |
| bolt | attack | 2 | yes | +0.0 [+0.0, +0.0] pts | -0.3 [-0.4, -0.1] | -0.19 [-0.23, -0.14] | better |
| expose | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.0 [-0.3, +0.2] | -0.12 [-0.20, -0.05] | negligible |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| opportunist | attack | 1 | yes | -0.2 [-0.5, +0.1] pts | +0.3 [+0.2, +0.5] | +0.13 [+0.10, +0.15] | worse |
| tag-a-payoff | attack | 1 | yes | -0.2 [-0.5, +0.1] pts | +0.6 [+0.4, +0.7] | +0.26 [+0.22, +0.29] | worse |
| exhaust-payoff | attack | 1 | yes | -0.2 [-0.5, +0.1] pts | +0.8 [+0.6, +0.9] | +0.33 [+0.29, +0.37] | worse |
| arctic-strike | attack | 1 | yes | -0.2 [-0.5, +0.1] pts | +0.8 [+0.6, +0.9] | +0.33 [+0.29, +0.37] | worse |
| quick-draw | skill | 1 | yes | -0.3 [-0.7, +0.0] pts | +0.8 [+0.3, +1.2] | +3.11 [+2.99, +3.24] | worse |
| sunder | attack | 2 | yes | +0.0 [+0.0, +0.0] pts | +0.8 [+0.4, +1.1] | -1.04 [-1.12, -0.96] | worse |
| glaciate | attack | 2 | yes | +0.0 [+0.0, +0.0] pts | +0.9 [+0.7, +1.2] | +0.34 [+0.29, +0.39] | worse |
| block-slam | attack | 1 | yes | -0.6 [-1.0, -0.1] pts | +1.3 [+1.0, +1.5] | +0.56 [+0.51, +0.62] | worse |
| double-strength | skill | 1 | yes | -0.6 [-1.0, -0.1] pts | +1.3 [+1.0, +1.5] | +0.56 [+0.51, +0.62] | worse |
| cull | skill | 0 | yes | -0.6 [-1.0, -0.1] pts | +1.3 [+1.0, +1.5] | +0.56 [+0.51, +0.62] | worse |
| meteor-shower | attack | 2 | yes | -0.6 [-1.0, -0.1] pts | +1.3 [+1.0, +1.5] | +0.56 [+0.51, +0.62] | worse |
| molten-core | skill | 2 | yes | -0.6 [-1.0, -0.1] pts | +1.3 [+1.0, +1.5] | +0.56 [+0.51, +0.62] | worse |
| absolute-zero | skill | 3 | yes | -0.6 [-1.0, -0.1] pts | +1.3 [+1.0, +1.5] | +0.56 [+0.51, +0.62] | worse |
| hypothermia | skill | 1 | yes | -0.8 [-1.4, -0.2] pts | +4.5 [+4.0, +4.9] | +2.56 [+2.45, +2.67] | worse |
| glacial-spike | skill | 1 | yes | -0.8 [-1.4, -0.2] pts | +4.5 [+4.0, +4.9] | +2.56 [+2.45, +2.67] | worse |
| blood-strike | attack | 1 | yes | -0.2 [-0.5, +0.1] pts | +5.4 [+5.1, +5.7] | -1.98 [-2.06, -1.90] | worse |

### smart bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| end-guard | power | 1 | yes | +0.6 [+0.1, +1.0] pts | -5.7 [-6.2, -5.2] | +0.28 [+0.23, +0.34] | better |
| big-block | skill | 2 | yes | +0.6 [+0.1, +1.0] pts | -5.5 [-6.1, -5.0] | +0.75 [+0.68, +0.82] | better |
| heating-up | skill | 1 | yes | +0.6 [+0.1, +1.0] pts | -5.1 [-5.7, -4.6] | -2.14 [-2.23, -2.05] | better |
| ice-barrier | skill | 1 | yes | +0.4 [-0.1, +1.0] pts | -5.1 [-5.7, -4.6] | +0.90 [+0.82, +0.97] | better |
| heat-flash | attack | 0 | yes | +0.6 [+0.1, +1.0] pts | -5.0 [-5.5, -4.5] | -0.27 [-0.32, -0.21] | better |
| attack-echo | power | 1 | yes | +0.6 [+0.1, +1.0] pts | -4.9 [-5.4, -4.4] | +0.24 [+0.19, +0.29] | better |
| ice-block | skill | 3 | yes | +0.4 [-0.1, +1.0] pts | -4.7 [-5.4, -4.1] | +0.78 [+0.71, +0.85] | better |
| guarded-strike | attack | 1 | yes | +0.6 [+0.1, +1.0] pts | -4.5 [-4.9, -4.0] | -0.27 [-0.32, -0.22] | better |
| apocalyptic-flame | attack | 3 | yes | +0.6 [+0.1, +1.0] pts | -3.8 [-4.3, -3.3] | -1.64 [-1.72, -1.57] | better |
| block-slam | attack | 1 | yes | +0.4 [-0.1, +1.0] pts | -3.2 [-3.7, -2.7] | +0.12 [+0.06, +0.17] | better |
| frozen-shield | skill | 1 | yes | +0.4 [-0.1, +1.0] pts | -2.8 [-3.3, -2.3] | +0.57 [+0.51, +0.63] | better |
| prime-a | skill | 0 | yes | +0.4 [-0.1, +1.0] pts | -2.8 [-3.3, -2.3] | +0.27 [+0.21, +0.32] | better |
| cauterize | skill | 1 | yes | +0.2 [-0.4, +0.8] pts | -2.6 [-3.1, -2.1] | +0.57 [+0.51, +0.63] | better |
| jab | attack | 0 | yes | +0.0 [-0.7, +0.7] pts | -1.9 [-2.3, -1.5] | -0.27 [-0.33, -0.22] | better |
| hand-strike | attack | 1 | yes | +0.3 [-0.2, +0.9] pts | -1.7 [-2.2, -1.3] | -0.99 [-1.05, -0.94] | better |
| combo-strike | attack | 1 | yes | +0.6 [+0.1, +1.0] pts | -1.7 [-2.1, -1.3] | -0.97 [-1.03, -0.91] | better |
| heat-warning | attack | 1 | yes | +0.6 [+0.1, +1.0] pts | -1.6 [-2.1, -1.1] | -1.48 [-1.56, -1.41] | better |
| crippling-heat | attack | 1 | yes | +0.6 [+0.1, +1.0] pts | -1.5 [-1.9, -1.0] | -0.03 [-0.08, +0.03] | better |
| cryofreeze | power | 2 | yes | +0.6 [+0.1, +1.0] pts | -1.5 [-2.0, -1.0] | +0.32 [+0.27, +0.37] | better |
| scorching-wind | attack | 0 | yes | -0.1 [-0.8, +0.5] pts | -1.4 [-1.9, -1.0] | -0.18 [-0.23, -0.13] | better |
| heavy-hit | attack | 3 | yes | +0.6 [+0.1, +1.0] pts | -1.3 [-1.7, -0.9] | -1.30 [-1.36, -1.24] | better |
| single-use-strike | attack | 1 | yes | +0.3 [-0.2, +0.9] pts | -1.0 [-1.4, -0.6] | -0.48 [-0.53, -0.43] | better |
| power-up | skill | 1 | yes | +0.1 [-0.5, +0.8] pts | -0.4 [-0.9, +0.0] | -0.70 [-0.76, -0.64] | negligible |
| defend | skill | 1 | no | +0.0 [-0.7, +0.7] pts | -0.3 [-0.8, +0.1] | +0.48 [+0.42, +0.54] | negligible |
| cull | skill | 0 | yes | -0.6 [-1.3, +0.2] pts | -0.2 [-0.6, +0.2] | +0.26 [+0.19, +0.32] | negligible |
| opportunist | attack | 1 | yes | -0.1 [-0.7, +0.5] pts | -0.1 [-0.5, +0.3] | +0.02 [-0.03, +0.07] | negligible |
| glaciate | attack | 2 | yes | +0.2 [-0.2, +0.7] pts | -0.1 [-0.5, +0.4] | +0.02 [-0.03, +0.07] | negligible |
| tag-a-payoff | attack | 1 | yes | -0.3 [-1.0, +0.3] pts | -0.0 [-0.4, +0.4] | +0.12 [+0.07, +0.17] | negligible |
| exhaust-payoff | attack | 1 | yes | -0.4 [-1.1, +0.2] pts | -0.0 [-0.4, +0.4] | +0.13 [+0.08, +0.19] | negligible |
| arctic-strike | attack | 1 | yes | -0.4 [-1.1, +0.2] pts | -0.0 [-0.4, +0.4] | +0.13 [+0.08, +0.19] | negligible |
| weaken | skill | 1 | yes | +0.6 [+0.1, +1.0] pts | -0.0 [-0.5, +0.4] | +0.83 [+0.77, +0.90] | negligible |
| fortify | power | 2 | yes | +0.6 [+0.1, +1.0] pts | +0.0 [-0.4, +0.5] | +0.35 [+0.29, +0.40] | negligible |
| opening-spark | power | 1 | yes | +0.4 [-0.1, +1.0] pts | +0.1 [-0.3, +0.5] | -0.37 [-0.42, -0.32] | negligible |
| quick-draw | skill | 1 | yes | +0.1 [-0.5, +0.8] pts | +0.1 [-0.3, +0.6] | +0.18 [+0.13, +0.24] | negligible |
| block-spark | power | 1 | yes | +0.2 [-0.4, +0.8] pts | +0.3 [-0.1, +0.7] | -0.25 [-0.30, -0.20] | negligible |
| tag-a-echo | power | 1 | yes | +0.2 [-0.3, +0.8] pts | +0.3 [-0.1, +0.7] | +0.23 [+0.18, +0.28] | negligible |
| exhaust-engine | power | 1 | yes | +0.2 [-0.3, +0.8] pts | +0.3 [-0.1, +0.7] | +0.23 [+0.18, +0.28] | negligible |
| strike | attack | 1 | no | -0.3 [-1.0, +0.3] pts | +0.6 [+0.2, +1.0] | -0.16 [-0.21, -0.11] | worse |
| double-strength | skill | 1 | yes | -0.2 [-0.8, +0.4] pts | +0.8 [+0.3, +1.3] | +0.32 [+0.26, +0.37] | worse |
| kill-reward | power | 1 | yes | +0.2 [-0.3, +0.8] pts | +1.1 [+0.7, +1.5] | +0.16 [+0.10, +0.21] | worse |
| pain-engine | power | 1 | yes | +0.1 [-0.5, +0.8] pts | +1.3 [+0.9, +1.7] | -0.86 [-0.93, -0.78] | worse |
| endless-winter | power | 1 | yes | +0.6 [+0.1, +1.0] pts | +1.5 [+1.1, +2.0] | +0.29 [+0.24, +0.35] | worse |
| focus | power | 1 | no | +0.4 [-0.1, +1.0] pts | +1.7 [+1.2, +2.1] | +0.06 [+0.01, +0.11] | worse |
| sunder | attack | 2 | yes | +0.3 [-0.2, +0.9] pts | +1.9 [+1.4, +2.3] | -1.28 [-1.36, -1.21] | worse |
| strengthen | power | 1 | yes | +0.6 [+0.1, +1.0] pts | +2.0 [+1.6, +2.4] | -1.24 [-1.31, -1.18] | worse |
| expose | skill | 1 | yes | +0.2 [-0.4, +0.8] pts | +2.2 [+1.8, +2.7] | -0.93 [-1.00, -0.86] | worse |
| hungering-cold | power | 1 | yes | +0.2 [-0.4, +0.8] pts | +2.5 [+2.1, +3.0] | +0.28 [+0.23, +0.34] | worse |
| bolt | attack | 2 | yes | -1.3 [-2.3, -0.4] pts | +2.6 [+2.2, +3.0] | -0.56 [-0.61, -0.50] | worse |
| meteor-shower | attack | 2 | yes | -3.1 [-4.4, -1.9] pts | +2.9 [+2.5, +3.4] | -0.52 [-0.59, -0.45] | worse |
| blood-strike | attack | 1 | yes | -0.1 [-0.8, +0.6] pts | +4.1 [+3.7, +4.5] | -1.32 [-1.38, -1.26] | worse |
| hypothermia | skill | 1 | yes | -1.4 [-2.4, -0.5] pts | +5.3 [+4.8, +5.8] | +0.86 [+0.79, +0.93] | worse |
| glacial-spike | skill | 1 | yes | -1.4 [-2.4, -0.5] pts | +5.3 [+4.8, +5.8] | +0.86 [+0.79, +0.93] | worse |
| molten-core | skill | 2 | yes | -11.0 [-13.0, -9.0] pts | +12.7 [+12.0, +13.3] | +1.64 [+1.55, +1.74] | worse |
| absolute-zero | skill | 3 | yes | -24.8 [-27.6, -22.0] pts | +19.2 [+18.4, +20.0] | +2.35 [+2.20, +2.50] | worse |

### smart bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| end-guard | power | 1 | yes | +0.6 [+0.1, +1.0] pts | -6.8 [-7.3, -6.4] | +0.44 [+0.39, +0.49] | better |
| ice-barrier | skill | 1 | yes | +0.4 [-0.1, +1.0] pts | -6.5 [-7.0, -6.0] | +1.32 [+1.24, +1.40] | better |
| big-block | skill | 2 | yes | +0.4 [-0.1, +1.0] pts | -6.4 [-6.9, -5.9] | +1.09 [+1.02, +1.16] | better |
| heat-flash | attack | 0 | yes | +0.6 [+0.1, +1.0] pts | -5.8 [-6.3, -5.3] | -0.13 [-0.18, -0.08] | better |
| heating-up | skill | 1 | yes | +0.6 [+0.1, +1.0] pts | -5.6 [-6.1, -5.1] | -2.16 [-2.25, -2.07] | better |
| guarded-strike | attack | 1 | yes | +0.6 [+0.1, +1.0] pts | -5.4 [-5.8, -5.0] | -0.17 [-0.22, -0.13] | better |
| attack-echo | power | 1 | yes | +0.6 [+0.1, +1.0] pts | -5.4 [-5.8, -4.9] | +0.41 [+0.36, +0.46] | better |
| ice-block | skill | 3 | yes | +0.4 [-0.1, +1.0] pts | -5.3 [-5.9, -4.8] | +1.01 [+0.94, +1.08] | better |
| block-slam | attack | 1 | yes | +0.6 [+0.1, +1.0] pts | -4.8 [-5.3, -4.4] | +0.35 [+0.30, +0.40] | better |
| apocalyptic-flame | attack | 3 | yes | +0.6 [+0.1, +1.0] pts | -4.6 [-5.1, -4.2] | -1.75 [-1.83, -1.68] | better |
| prime-a | skill | 0 | yes | +0.2 [-0.4, +0.8] pts | -3.6 [-4.0, -3.2] | +0.52 [+0.47, +0.57] | better |
| frozen-shield | skill | 1 | yes | +0.4 [+0.0, +0.9] pts | -3.4 [-3.8, -2.9] | +0.83 [+0.77, +0.89] | better |
| cauterize | skill | 1 | yes | +0.1 [-0.5, +0.7] pts | -2.8 [-3.3, -2.4] | +0.85 [+0.79, +0.91] | better |
| jab | attack | 0 | yes | +0.3 [-0.2, +0.8] pts | -2.6 [-3.0, -2.3] | -0.14 [-0.19, -0.10] | better |
| cryofreeze | power | 2 | yes | +0.6 [+0.1, +1.0] pts | -2.3 [-2.8, -1.8] | +0.49 [+0.44, +0.55] | better |
| scorching-wind | attack | 0 | yes | +0.2 [-0.2, +0.7] pts | -2.2 [-2.5, -1.9] | +0.01 [-0.04, +0.06] | better |
| hand-strike | attack | 1 | yes | +0.4 [+0.0, +0.9] pts | -2.1 [-2.5, -1.8] | -1.00 [-1.05, -0.94] | better |
| heat-warning | attack | 1 | yes | +0.6 [+0.1, +1.0] pts | -2.0 [-2.5, -1.6] | -1.50 [-1.57, -1.42] | better |
| combo-strike | attack | 1 | yes | +0.6 [+0.1, +1.0] pts | -2.0 [-2.3, -1.7] | -0.95 [-1.01, -0.90] | better |
| heavy-hit | attack | 3 | yes | +0.6 [+0.1, +1.0] pts | -1.8 [-2.1, -1.4] | -1.34 [-1.41, -1.28] | better |
| crippling-heat | attack | 1 | yes | +0.4 [-0.1, +1.0] pts | -1.7 [-2.1, -1.4] | +0.14 [+0.09, +0.19] | better |
| single-use-strike | attack | 1 | yes | +0.1 [-0.5, +0.8] pts | -1.5 [-1.9, -1.2] | -0.36 [-0.40, -0.31] | better |
| cull | skill | 0 | yes | -1.1 [-2.0, -0.2] pts | -1.2 [-1.5, -0.8] | +0.55 [+0.48, +0.62] | better |
| power-up | skill | 1 | yes | +0.3 [-0.2, +0.8] pts | -1.2 [-1.5, -0.8] | -0.69 [-0.74, -0.64] | better |
| glaciate | attack | 2 | yes | +0.2 [-0.3, +0.8] pts | -1.0 [-1.3, -0.7] | +0.17 [+0.13, +0.22] | better |
| opportunist | attack | 1 | yes | +0.4 [+0.0, +0.9] pts | -0.9 [-1.1, -0.7] | +0.23 [+0.19, +0.26] | better |
| quick-draw | skill | 1 | yes | +0.2 [-0.4, +0.8] pts | -0.8 [-1.1, -0.4] | +0.47 [+0.42, +0.52] | better |
| fortify | power | 2 | yes | +0.6 [+0.1, +1.0] pts | -0.7 [-1.2, -0.2] | +0.52 [+0.47, +0.57] | better |
| tag-a-payoff | attack | 1 | yes | +0.1 [-0.5, +0.7] pts | -0.6 [-0.9, -0.4] | +0.36 [+0.32, +0.40] | better |
| exhaust-payoff | attack | 1 | yes | -0.2 [-0.8, +0.4] pts | -0.6 [-0.9, -0.3] | +0.40 [+0.36, +0.44] | better |
| arctic-strike | attack | 1 | yes | -0.2 [-0.8, +0.4] pts | -0.6 [-0.9, -0.3] | +0.40 [+0.36, +0.44] | better |
| opening-spark | power | 1 | yes | +0.3 [-0.2, +0.9] pts | -0.6 [-0.9, -0.3] | -0.28 [-0.32, -0.23] | better |
| defend | skill | 1 | no | -0.6 [-1.2, +0.1] pts | -0.5 [-0.8, -0.1] | +0.77 [+0.71, +0.82] | better |
| weaken | skill | 1 | yes | +0.4 [-0.1, +1.0] pts | -0.4 [-0.8, -0.0] | +1.14 [+1.07, +1.20] | better |
| block-spark | power | 1 | yes | +0.2 [-0.4, +0.8] pts | -0.3 [-0.7, -0.0] | -0.15 [-0.19, -0.10] | better |
| tag-a-echo | power | 1 | yes | +0.0 [-0.6, +0.6] pts | -0.2 [-0.5, +0.1] | +0.49 [+0.44, +0.54] | negligible |
| exhaust-engine | power | 1 | yes | +0.0 [-0.6, +0.6] pts | -0.2 [-0.5, +0.1] | +0.49 [+0.44, +0.54] | negligible |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| double-strength | skill | 1 | yes | -0.8 [-1.5, -0.1] pts | +0.1 [-0.2, +0.5] | +0.61 [+0.56, +0.66] | negligible |
| kill-reward | power | 1 | yes | +0.0 [-0.6, +0.6] pts | +0.6 [+0.3, +0.9] | +0.37 [+0.33, +0.42] | worse |
| endless-winter | power | 1 | yes | +0.6 [+0.1, +1.0] pts | +1.0 [+0.7, +1.4] | +0.41 [+0.37, +0.46] | worse |
| focus | power | 1 | no | +0.6 [+0.1, +1.0] pts | +1.2 [+0.8, +1.6] | +0.12 [+0.08, +0.17] | worse |
| pain-engine | power | 1 | yes | +0.4 [-0.1, +1.0] pts | +1.2 [+0.8, +1.5] | -0.81 [-0.88, -0.74] | worse |
| sunder | attack | 2 | yes | +0.1 [-0.5, +0.7] pts | +1.6 [+1.2, +2.0] | -1.33 [-1.41, -1.26] | worse |
| strengthen | power | 1 | yes | +0.6 [+0.1, +1.0] pts | +1.9 [+1.5, +2.2] | -1.13 [-1.20, -1.06] | worse |
| hungering-cold | power | 1 | yes | -0.2 [-1.0, +0.5] pts | +2.1 [+1.8, +2.4] | +0.44 [+0.40, +0.49] | worse |
| bolt | attack | 2 | yes | -0.8 [-1.6, +0.0] pts | +2.3 [+1.9, +2.6] | -0.50 [-0.54, -0.46] | worse |
| expose | skill | 1 | yes | +0.3 [-0.2, +0.8] pts | +2.5 [+2.1, +2.8] | -0.83 [-0.90, -0.76] | worse |
| meteor-shower | attack | 2 | yes | -2.2 [-3.3, -1.2] pts | +3.1 [+2.7, +3.5] | -0.44 [-0.50, -0.37] | worse |
| blood-strike | attack | 1 | yes | -0.1 [-0.7, +0.5] pts | +4.2 [+3.9, +4.6] | -1.35 [-1.41, -1.29] | worse |
| hypothermia | skill | 1 | yes | -1.7 [-2.6, -0.7] pts | +5.4 [+5.0, +5.9] | +1.15 [+1.09, +1.22] | worse |
| glacial-spike | skill | 1 | yes | -1.7 [-2.6, -0.7] pts | +5.4 [+5.0, +5.9] | +1.15 [+1.09, +1.22] | worse |
| molten-core | skill | 2 | yes | -13.9 [-16.1, -11.6] pts | +14.7 [+14.0, +15.4] | +1.99 [+1.88, +2.09] | worse |
| absolute-zero | skill | 3 | yes | -33.1 [-36.2, -30.0] pts | +21.4 [+20.6, +22.2] | +2.87 [+2.70, +3.04] | worse |


## Pair synergy

Synergy score = (benefit of A and B together) minus (benefit of A alone + benefit of B alone), all measured against the starter deck on identical seeds, in HP lost (benefit = HP/turns saved, so positive is good). Positive means the cards help each other more than the sum of their parts; negative means they overlap or fight for the same energy and draws. Brackets are 95% CIs. Skill: smart. 15 fights x 40 seeds = 600 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.
120 of 1225 possible pairs evaluated (a deterministic random sample, --max-pairs 120); a strong pair outside the sample is not seen. Candidate cards: jab, guarded-strike, heavy-hit, big-block, quick-draw, fortify, weaken, expose, sunder, strengthen, combo-strike, block-slam, opportunist, hand-strike, prime-a, tag-a-payoff, tag-a-echo, power-up, double-strength, attack-echo, block-spark, kill-reward, pain-engine, end-guard, opening-spark, exhaust-engine, cull, single-use-strike, exhaust-payoff, blood-strike, scorching-wind, heating-up, meteor-shower, molten-core, apocalyptic-flame, crippling-heat, heat-flash, cauterize, heat-warning, ice-block, ice-barrier, hypothermia, frozen-shield, cryofreeze, endless-winter, glaciate, glacial-spike, absolute-zero, hungering-cold, arctic-strike.
Of 120 pairs: 26 clearly synergistic, 18 clearly anti-synergistic, 17 negligible, 59 inconclusive. Each pair is a 4-way difference, so its interval is wide: with 100+ pairs tested, expect about 5% to look significant by chance. Verdicts compare each pair with the TYPICAL pair (the median score, -0.15 HP lost): cards that do not interact still score off zero because benefits are not additive, so zero is not the right reference when many pairs are tested (with fewer than 20 pairs the reference is zero). Treat single hits as leads and confirm a lead by re-running just that pair with more seeds (--pairs a+b --seeds 200).

### Strongest synergies
| pair | synergy score | vs typical pair |
| --- | --- | --- |
| molten-core + crippling-heat | +4.40 [+3.51, +5.29] | better |
| combo-strike + absolute-zero | +3.89 [+2.99, +4.79] | better |
| sunder + molten-core | +3.88 [+3.05, +4.70] | better |
| strengthen + heat-warning | +2.59 [+1.75, +3.42] | better |
| expose + molten-core | +2.30 [+1.41, +3.19] | better |
| blood-strike + glacial-spike | +2.19 [+1.33, +3.06] | better |
| strengthen + double-strength | +2.12 [+1.32, +2.91] | better |
| endless-winter + absolute-zero | +2.07 [+1.10, +3.04] | better |
| expose + heating-up | +1.95 [+1.15, +2.76] | better |
| quick-draw + absolute-zero | +1.92 [+1.02, +2.82] | better |

### Negative (anti-synergistic) pairs
| pair | synergy score | vs typical pair |
| --- | --- | --- |
| guarded-strike + heating-up | -2.88 [-3.69, -2.06] | worse |
| end-guard + apocalyptic-flame | -2.75 [-3.54, -1.96] | worse |
| big-block + expose | -2.22 [-3.13, -1.31] | worse |
| heat-warning + ice-block | -2.10 [-3.07, -1.14] | worse |
| molten-core + ice-block | -1.91 [-3.00, -0.82] | worse |
| heavy-hit + end-guard | -1.82 [-2.57, -1.07] | worse |
| big-block + cryofreeze | -1.81 [-2.68, -0.94] | worse |
| guarded-strike + hand-strike | -1.65 [-2.43, -0.87] | worse |
| sunder + block-spark | -1.51 [-2.24, -0.79] | worse |
| hand-strike + end-guard | -1.46 [-2.24, -0.68] | worse |


## Outlier report

Outlier method: within a cohort of 4 or more values, a value is flagged when its modified z-score (0.6745 * (x - median) / MAD, Iglewicz-Hoaglin) exceeds 3.5 in magnitude OR it lies outside the Tukey fences (Q1 - 1.5 IQR, Q3 + 1.5 IQR). Median/MAD/IQR are used because the cohort itself may contain the outlier. A flag means "look at this", not "this is wrong".

Cards: value = how much adding the card helps on HP lost (positive = helps), compared within all cards and within each energy-cost group. Enemies: fights are compared inside their tier (normal/elite/boss) on the mid deck set. Cohorts smaller than 4 are skipped, so small content lists produce no flags; the tier bands in the ladder report cover that case.

| kind | skill | cohort | id | metric | value | modified z | z | IQR rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| card | random | cost 0 | cull | HP lost change when added | -1.18 | -2.09 | -1.40 | outside |
| card | random | cost 1 | heating-up | HP lost change when added | 7.15 | 2.77 | 2.47 | outside |
| card | random | cost 2 | molten-core | HP lost change when added | -6.99 | -2.39 | -2.02 | outside |
| card | random | cost 3 | absolute-zero | HP lost change when added | -7.56 | -3.72 | -1.45 | outside |
| card | greedy | cost 2 | big-block | HP lost change when added | 5.56 | 3.93 | 1.82 | inside |
| card | greedy | cost 3 | ice-block | HP lost change when added | 6.11 | 3.45 | 1.44 | outside |
| card | smart | all cards | molten-core | HP lost change when added | -12.66 | -5.11 | -3.04 | outside |
| card | smart | all cards | absolute-zero | HP lost change when added | -19.19 | -7.73 | -4.61 | outside |
| card | smart | cost 0 | heat-flash | HP lost change when added | 4.98 | 2.27 | 1.52 | outside |
| card | smart | cost 2 | big-block | HP lost change when added | 5.55 | 2.41 | 1.37 | outside |
| card | smart | cost 2 | molten-core | HP lost change when added | -12.66 | -4.35 | -2.11 | outside |
| card | smart | cost 3 | absolute-zero | HP lost change when added | -19.19 | -8.52 | -1.49 | outside |

### Cards worse than adding nothing
Adding the card to the deck measurably HURTS the headline metric (paired 95% CI excludes zero). Possible dead picks, or cards that need a partner; check the pair report before judging.

| skill | card | cost | change [95% CI] |
| --- | --- | --- | --- |
| random | strike | 1 | +0.7 [+0.1, +1.2] |
| random | bolt | 2 | +1.0 [+0.5, +1.6] |
| random | focus | 1 | +2.0 [+1.5, +2.5] |
| random | quick-draw | 1 | +4.9 [+4.3, +5.5] |
| random | expose | 1 | +0.7 [+0.1, +1.2] |
| random | block-slam | 1 | +2.1 [+1.6, +2.7] |
| random | opportunist | 1 | +1.4 [+0.8, +1.9] |
| random | tag-a-payoff | 1 | +2.1 [+1.5, +2.6] |
| random | tag-a-echo | 1 | +2.0 [+1.5, +2.6] |
| random | double-strength | 1 | +2.0 [+1.5, +2.6] |
| random | kill-reward | 1 | +1.4 [+0.8, +2.0] |
| random | exhaust-engine | 1 | +2.0 [+1.5, +2.6] |
| random | cull | 0 | +1.2 [+0.6, +1.7] |
| random | exhaust-payoff | 1 | +2.6 [+2.1, +3.2] |
| random | blood-strike | 1 | +0.7 [+0.1, +1.2] |
| random | molten-core | 2 | +7.0 [+6.3, +7.7] |
| random | hypothermia | 1 | +4.4 [+3.8, +4.9] |
| random | glaciate | 2 | +2.5 [+1.9, +3.0] |
| random | glacial-spike | 1 | +4.4 [+3.8, +4.9] |
| random | absolute-zero | 3 | +7.6 [+6.8, +8.3] |
| random | hungering-cold | 1 | +2.0 [+1.5, +2.6] |
| random | arctic-strike | 1 | +2.6 [+2.1, +3.2] |
| greedy | strike | 1 | +1.4 [+1.0, +1.8] |
| greedy | bolt | 2 | +1.2 [+0.8, +1.6] |
| greedy | quick-draw | 1 | +3.1 [+2.6, +3.6] |
| greedy | expose | 1 | +1.1 [+0.7, +1.5] |
| greedy | sunder | 2 | +1.2 [+0.7, +1.6] |
| greedy | combo-strike | 1 | +0.9 [+0.5, +1.3] |
| greedy | block-slam | 1 | +2.3 [+1.8, +2.7] |
| greedy | opportunist | 1 | +1.6 [+1.2, +2.0] |
| greedy | hand-strike | 1 | +1.2 [+0.8, +1.6] |
| greedy | tag-a-payoff | 1 | +1.7 [+1.3, +2.1] |
| greedy | tag-a-echo | 1 | +2.1 [+1.7, +2.5] |
| greedy | power-up | 1 | +0.5 [+0.1, +0.9] |
| greedy | double-strength | 1 | +2.3 [+1.8, +2.7] |
| greedy | kill-reward | 1 | +2.0 [+1.6, +2.3] |
| greedy | exhaust-engine | 1 | +2.1 [+1.7, +2.5] |
| greedy | cull | 0 | +2.3 [+1.8, +2.7] |
| greedy | exhaust-payoff | 1 | +1.8 [+1.4, +2.2] |
| greedy | blood-strike | 1 | +6.2 [+5.7, +6.6] |
| greedy | meteor-shower | 2 | +2.3 [+1.8, +2.7] |
| greedy | molten-core | 2 | +2.3 [+1.8, +2.7] |
| greedy | hypothermia | 1 | +5.8 [+5.3, +6.3] |
| greedy | endless-winter | 1 | +0.4 [+0.0, +0.9] |
| greedy | glaciate | 2 | +2.4 [+2.0, +2.8] |
| greedy | glacial-spike | 1 | +5.8 [+5.3, +6.3] |
| greedy | absolute-zero | 3 | +2.3 [+1.8, +2.7] |
| greedy | hungering-cold | 1 | +2.1 [+1.7, +2.5] |
| greedy | arctic-strike | 1 | +1.8 [+1.4, +2.2] |
| smart | strike | 1 | +0.6 [+0.2, +1.0] |
| smart | bolt | 2 | +2.6 [+2.2, +3.0] |
| smart | focus | 1 | +1.7 [+1.2, +2.1] |
| smart | expose | 1 | +2.2 [+1.8, +2.7] |
| smart | sunder | 2 | +1.9 [+1.4, +2.3] |
| smart | strengthen | 1 | +2.0 [+1.6, +2.4] |
| smart | double-strength | 1 | +0.8 [+0.3, +1.3] |
| smart | kill-reward | 1 | +1.1 [+0.7, +1.5] |
| smart | pain-engine | 1 | +1.3 [+0.9, +1.7] |
| smart | blood-strike | 1 | +4.1 [+3.7, +4.5] |
| smart | meteor-shower | 2 | +2.9 [+2.5, +3.4] |
| smart | molten-core | 2 | +12.7 [+12.0, +13.3] |
| smart | hypothermia | 1 | +5.3 [+4.8, +5.8] |
| smart | endless-winter | 1 | +1.5 [+1.1, +2.0] |
| smart | glacial-spike | 1 | +5.3 [+4.8, +5.8] |
| smart | absolute-zero | 3 | +19.2 [+18.4, +20.0] |
| smart | hungering-cold | 1 | +2.5 [+2.1, +3.0] |


## Draft policy comparison (whole runs)

100 runs per policy on seeds 1..100, fights played by the greedy bot. All policies share seeds; differences are against the first policy, run by run (paired). Win rate has a Wilson 95% interval; differences have paired 95% CIs. Verdict margin: +-5 points.
Run-level results are noisy (a run is ~12 fights; one bad fight ends it). Resolving a 5-point win-rate difference takes several hundred runs per policy. For judging individual cards or fights, prefer the fight-level experiments.

| policy | run win rate [95% CI] | avg floor [95% CI] | win change vs first | floor change vs first | verdict |
| --- | --- | --- | --- | --- | --- |
| reward=card (random pick) | 49.0% [39.4%, 58.7%] | 11.3 [10.8, 11.7] | - | - | baseline |
| reward=gold (always gold) | 55.0% [45.2%, 64.4%] | 11.8 [11.5, 12.2] | +6.0 [-4.5, +16.5] pts | +0.6 [+0.2, +1.0] | INCONCLUSIVE |
| reward=best (trial-fight pick) | 69.0% [59.4%, 77.2%] | 12.1 [11.8, 12.4] | +20.0 [+9.5, +30.5] pts | +0.9 [+0.4, +1.3] | better |
| rest=heal (never upgrade) | 50.0% [40.4%, 59.6%] | 11.3 [10.9, 11.8] | +1.0 [-1.0, +3.0] pts | +0.1 [-0.0, +0.1] | negligible |
| path=random | 53.0% [43.3%, 62.5%] | 11.6 [11.2, 12.0] | +4.0 [-9.2, +17.2] pts | +0.3 [-0.2, +0.8] | INCONCLUSIVE |

### Pick rates under reward=card (random pick)
Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.

| card | offered | picked | pick rate [95% CI] |
| --- | --- | --- | --- |
| scorching-wind | 43 | 23 | 53.5% [38.9%, 67.5%] |
| arctic-strike | 38 | 19 | 50.0% [34.8%, 65.2%] |
| cull | 36 | 17 | 47.2% [32.0%, 63.0%] |
| bolt | 43 | 20 | 46.5% [32.5%, 61.1%] |
| opening-spark | 41 | 19 | 46.3% [32.1%, 61.3%] |
| molten-core | 37 | 17 | 45.9% [31.0%, 61.6%] |
| single-use-strike | 46 | 21 | 45.7% [32.2%, 59.8%] |
| block-spark | 38 | 17 | 44.7% [30.1%, 60.3%] |
| prime-a | 37 | 16 | 43.2% [28.7%, 59.1%] |
| guarded-strike | 36 | 15 | 41.7% [27.1%, 57.8%] |
| meteor-shower | 49 | 20 | 40.8% [28.2%, 54.8%] |
| block-slam | 47 | 19 | 40.4% [27.6%, 54.7%] |
| endless-winter | 35 | 14 | 40.0% [25.6%, 56.4%] |
| power-up | 40 | 16 | 40.0% [26.3%, 55.4%] |
| end-guard | 42 | 16 | 38.1% [25.0%, 53.2%] |
| opportunist | 40 | 15 | 37.5% [24.2%, 53.0%] |
| heavy-hit | 36 | 13 | 36.1% [22.5%, 52.4%] |
| double-strength | 39 | 14 | 35.9% [22.7%, 51.6%] |
| hand-strike | 42 | 15 | 35.7% [23.0%, 50.8%] |
| heating-up | 31 | 11 | 35.5% [21.1%, 53.1%] |
| jab | 51 | 18 | 35.3% [23.6%, 49.0%] |
| weaken | 34 | 12 | 35.3% [21.5%, 52.1%] |
| strengthen | 40 | 14 | 35.0% [22.1%, 50.5%] |
| frozen-shield | 46 | 16 | 34.8% [22.7%, 49.2%] |
| glacial-spike | 32 | 11 | 34.4% [20.4%, 51.7%] |
| apocalyptic-flame | 43 | 14 | 32.6% [20.5%, 47.5%] |
| pain-engine | 37 | 12 | 32.4% [19.6%, 48.5%] |
| attack-echo | 34 | 11 | 32.4% [19.1%, 49.2%] |
| expose | 35 | 11 | 31.4% [18.6%, 48.0%] |
| sunder | 43 | 13 | 30.2% [18.6%, 45.1%] |
| crippling-heat | 40 | 12 | 30.0% [18.1%, 45.4%] |
| hypothermia | 37 | 11 | 29.7% [17.5%, 45.8%] |
| hungering-cold | 44 | 13 | 29.5% [18.2%, 44.2%] |
| ice-barrier | 34 | 10 | 29.4% [16.8%, 46.2%] |
| tag-a-echo | 34 | 10 | 29.4% [16.8%, 46.2%] |
| glaciate | 38 | 11 | 28.9% [17.0%, 44.8%] |
| absolute-zero | 39 | 11 | 28.2% [16.5%, 43.8%] |
| tag-a-payoff | 30 | 8 | 26.7% [14.2%, 44.4%] |
| kill-reward | 42 | 11 | 26.2% [15.3%, 41.1%] |
| combo-strike | 51 | 13 | 25.5% [15.5%, 38.9%] |
| exhaust-payoff | 41 | 10 | 24.4% [13.8%, 39.3%] |
| heat-warning | 37 | 9 | 24.3% [13.4%, 40.1%] |
| heat-flash | 38 | 9 | 23.7% [13.0%, 39.2%] |
| fortify | 34 | 8 | 23.5% [12.4%, 40.0%] |
| quick-draw | 47 | 11 | 23.4% [13.6%, 37.2%] |
| blood-strike | 43 | 10 | 23.3% [13.2%, 37.7%] |
| ice-block | 36 | 8 | 22.2% [11.7%, 38.1%] |
| big-block | 47 | 9 | 19.1% [10.4%, 32.5%] |
| cauterize | 40 | 7 | 17.5% [8.7%, 31.9%] |
| exhaust-engine | 35 | 6 | 17.1% [8.1%, 32.7%] |
| cryofreeze | 41 | 7 | 17.1% [8.5%, 31.3%] |

### Pick rates under reward=best (trial-fight pick)
Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.

| card | offered | picked | pick rate [95% CI] |
| --- | --- | --- | --- |
| big-block | 53 | 40 | 75.5% [62.4%, 85.1%] |
| end-guard | 39 | 28 | 71.8% [56.2%, 83.5%] |
| ice-block | 46 | 33 | 71.7% [57.5%, 82.7%] |
| frozen-shield | 51 | 36 | 70.6% [57.0%, 81.3%] |
| cauterize | 41 | 28 | 68.3% [53.0%, 80.4%] |
| guarded-strike | 40 | 24 | 60.0% [44.6%, 73.7%] |
| heat-flash | 38 | 22 | 57.9% [42.2%, 72.1%] |
| attack-echo | 31 | 17 | 54.8% [37.8%, 70.8%] |
| prime-a | 41 | 22 | 53.7% [38.7%, 67.9%] |
| ice-barrier | 41 | 20 | 48.8% [34.3%, 63.5%] |
| heat-warning | 48 | 23 | 47.9% [34.5%, 61.7%] |
| heating-up | 41 | 17 | 41.5% [27.8%, 56.6%] |
| jab | 41 | 17 | 41.5% [27.8%, 56.6%] |
| scorching-wind | 44 | 17 | 38.6% [25.7%, 53.4%] |
| arctic-strike | 45 | 17 | 37.8% [25.1%, 52.4%] |
| crippling-heat | 40 | 15 | 37.5% [24.2%, 53.0%] |
| weaken | 38 | 14 | 36.8% [23.4%, 52.7%] |
| opportunist | 34 | 12 | 35.3% [21.5%, 52.1%] |
| strengthen | 37 | 13 | 35.1% [21.8%, 51.2%] |
| single-use-strike | 47 | 16 | 34.0% [22.2%, 48.3%] |
| opening-spark | 49 | 16 | 32.7% [21.2%, 46.6%] |
| meteor-shower | 50 | 16 | 32.0% [20.8%, 45.8%] |
| bolt | 44 | 14 | 31.8% [20.0%, 46.6%] |
| sunder | 49 | 15 | 30.6% [19.5%, 44.5%] |
| hand-strike | 51 | 15 | 29.4% [18.7%, 43.0%] |
| block-spark | 49 | 14 | 28.6% [17.8%, 42.4%] |
| double-strength | 35 | 10 | 28.6% [16.3%, 45.1%] |
| tag-a-echo | 32 | 9 | 28.1% [15.6%, 45.4%] |
| quick-draw | 50 | 13 | 26.0% [15.9%, 39.6%] |
| expose | 35 | 9 | 25.7% [14.2%, 42.1%] |
| tag-a-payoff | 39 | 10 | 25.6% [14.6%, 41.1%] |
| exhaust-engine | 36 | 9 | 25.0% [13.8%, 41.1%] |
| exhaust-payoff | 48 | 12 | 25.0% [14.9%, 38.8%] |
| molten-core | 40 | 10 | 25.0% [14.2%, 40.2%] |
| heavy-hit | 45 | 11 | 24.4% [14.2%, 38.7%] |
| fortify | 37 | 9 | 24.3% [13.4%, 40.1%] |
| pain-engine | 42 | 10 | 23.8% [13.5%, 38.5%] |
| cryofreeze | 44 | 10 | 22.7% [12.8%, 37.0%] |
| block-slam | 56 | 12 | 21.4% [12.7%, 33.8%] |
| kill-reward | 56 | 11 | 19.6% [11.3%, 31.8%] |
| endless-winter | 41 | 8 | 19.5% [10.2%, 34.0%] |
| cull | 38 | 7 | 18.4% [9.2%, 33.4%] |
| combo-strike | 58 | 10 | 17.2% [9.6%, 28.9%] |
| absolute-zero | 37 | 6 | 16.2% [7.7%, 31.1%] |
| glaciate | 42 | 6 | 14.3% [6.7%, 27.8%] |
| apocalyptic-flame | 43 | 6 | 14.0% [6.6%, 27.3%] |
| hungering-cold | 51 | 7 | 13.7% [6.8%, 25.7%] |
| glacial-spike | 37 | 5 | 13.5% [5.9%, 28.0%] |
| hypothermia | 39 | 5 | 12.8% [5.6%, 26.7%] |
| power-up | 47 | 6 | 12.8% [6.0%, 25.2%] |
| blood-strike | 40 | 0 | 0.0% [0.0%, 8.8%] |

