# Balance report

Generated 2026-10-08 by `npm run balance -- report` from the current registries. **The content measured here is all placeholder** (see implementationplan.md): treat the numbers as an example of the process, not as findings about the real game. Bot skills: random, greedy, smart. Target bands are provisional placeholders (src/sim/targets.ts). How to read this: docs/BALANCE.md.


## Fight difficulty ladder

Win rate (Wilson 95% interval), HP lost in fights that were won (mean with 95% CI) and turns (mean with 95% CI), at full starting HP, for each reference deck set: starter (the starter deck, 1 deck); mid (starter + 5 sampled cards, 3 decks); late (starter + 10 sampled cards, 3 upgraded, 3 decks); syn-tag (tag-a deck: enablers, payoff, draw power, 1 deck); syn-exhaust (exhaust deck: Cull, one-shot attacks, exhaust payoff and engine, 1 deck); syn-trigger (trigger / block deck: block triggers, Block Slam, 1 deck); syn-mult (empowered / strength multiplier deck, 1 deck); syn-combo (combo-count deck: cheap plays into count scaling, 1 deck); syn-mixed (starter + 8 sampled synergy cards, 3 decks). 15 fights x 100 seeds = 1500 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.
Flags compare the mid deck set to the PROVISIONAL target bands in src/sim/targets.ts (LOW / HIGH = outside the band; "ok" = inside). Per-fight numbers vary in how hard the individual fight is; the tier rollup is the better first read.

### random bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 12 | 29.5% | 41.3 | 8.4 |
| starter | elite | 2 | 0.0% | n/a | 8.9 |
| starter | boss | 1 | 0.0% | n/a | 7.5 |
| mid | normal | 12 | 41.0% | 44.2 | 7.8 |
| mid | elite | 2 | 12.3% | 52.9 | 8.8 |
| mid | boss | 1 | 0.0% | n/a | 7.9 |
| late | normal | 12 | 51.4% | 39.1 | 9.5 |
| late | elite | 2 | 28.3% | 48.5 | 11.9 |
| late | boss | 1 | 0.0% | n/a | 10.1 |
| syn-tag | normal | 12 | 46.6% | 35.8 | 8.7 |
| syn-tag | elite | 2 | 3.0% | 54.7 | 9.8 |
| syn-tag | boss | 1 | 0.0% | n/a | 8.0 |
| syn-exhaust | normal | 12 | 45.7% | 40.8 | 5.9 |
| syn-exhaust | elite | 2 | 17.0% | 54.3 | 7.1 |
| syn-exhaust | boss | 1 | 0.0% | n/a | 7.0 |
| syn-trigger | normal | 12 | 81.0% | 26.9 | 11.8 |
| syn-trigger | elite | 2 | 84.5% | 37.6 | 13.6 |
| syn-trigger | boss | 1 | 0.0% | n/a | 13.6 |
| syn-mult | normal | 12 | 51.4% | 44.2 | 4.9 |
| syn-mult | elite | 2 | 25.0% | 49.6 | 5.5 |
| syn-mult | boss | 1 | 0.0% | n/a | 6.0 |
| syn-combo | normal | 12 | 41.7% | 39.1 | 5.6 |
| syn-combo | elite | 2 | 16.5% | 56.6 | 6.6 |
| syn-combo | boss | 1 | 0.0% | n/a | 6.9 |
| syn-mixed | normal | 12 | 50.6% | 40.3 | 8.4 |
| syn-mixed | elite | 2 | 14.7% | 52.7 | 10.0 |
| syn-mixed | boss | 1 | 0.0% | n/a | 8.3 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 30.6 [29.4, 31.9] | 8.0 [7.8, 8.2] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 28.0 [26.7, 29.2] | 8.5 [8.3, 8.7] |  |
| enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 28.9 [27.3, 30.5] | 11.4 [11.2, 11.7] |  |
| enemy-b+enemy-d | normal | starter | 100 | 43.0% [33.7%, 52.8%] | 50.4 [48.1, 52.6] | 13.8 [13.3, 14.4] |  |
| enemy-c | normal | starter | 100 | 8.0% [4.1%, 15.0%] | 53.4 [48.4, 58.4] | 11.4 [11.1, 11.7] |  |
| enemy-a+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.8 [7.5, 8.2] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 3.0% [1.0%, 8.5%] | 56.3 [54.9, 57.8] | 7.6 [7.3, 7.8] |  |
| enemy-a+enemy-b | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.2 [6.1, 6.3] |  |
| enemy-c+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.3 [8.0, 8.6] |  |
| enemy-b+enemy-d+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.7 [6.5, 6.9] |  |
| enemy-a+enemy-b+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.2 [4.1, 4.3] |  |
| enemy-b+enemy-c | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.9 [6.7, 7.1] |  |
| elite-a | elite | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.6 [7.4, 7.8] |  |
| elite-b | elite | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.2 [9.9, 10.6] |  |
| boss-a | boss | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.5 [7.3, 7.6] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 30.6 [29.6, 31.7] | 7.1 [7.0, 7.2] | win HIGH, HP HIGH, turns HIGH |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 29.7 [28.8, 30.6] | 7.5 [7.4, 7.6] | win HIGH, HP HIGH, turns HIGH |
| enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 25.7 [24.8, 26.6] | 9.3 [9.2, 9.5] | win HIGH, HP HIGH, turns HIGH |
| enemy-b+enemy-d | normal | mid | 300 | 72.3% [67.0%, 77.1%] | 45.0 [43.7, 46.3] | 11.3 [11.1, 11.5] | win ok, HP HIGH, turns HIGH |
| enemy-c | normal | mid | 300 | 49.0% [43.4%, 54.6%] | 43.3 [41.6, 45.1] | 10.4 [10.2, 10.5] | win ok, HP HIGH, turns HIGH |
| enemy-a+enemy-d | normal | mid | 300 | 27.7% [22.9%, 33.0%] | 50.0 [48.5, 51.4] | 7.6 [7.4, 7.8] | win LOW, HP HIGH, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 24.3% [19.8%, 29.5%] | 52.0 [50.5, 53.5] | 7.2 [7.0, 7.4] | win LOW, HP HIGH, turns HIGH |
| enemy-a+enemy-b | normal | mid | 300 | 0.7% [0.2%, 2.4%] | 58.5 [39.4, 77.6] | 6.3 [6.1, 6.4] | win LOW, HP HIGH, turns HIGH |
| enemy-c+enemy-d | normal | mid | 300 | 14.3% [10.8%, 18.8%] | 52.7 [51.0, 54.3] | 8.8 [8.5, 9.0] | win LOW, HP HIGH, turns HIGH |
| enemy-b+enemy-d+enemy-d | normal | mid | 300 | 4.0% [2.3%, 6.9%] | 54.3 [51.2, 57.3] | 7.0 [6.7, 7.2] | win LOW, HP HIGH, turns HIGH |
| enemy-a+enemy-b+enemy-d | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 4.2 [4.1, 4.2] | win LOW, HP n/a, turns ok |
| enemy-b+enemy-c | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 6.8 [6.6, 6.9] | win LOW, HP n/a, turns HIGH |
| elite-a | elite | mid | 300 | 3.3% [1.8%, 6.0%] | 56.3 [53.9, 58.7] | 7.6 [7.4, 7.8] | win LOW, HP HIGH, turns ok |
| elite-b | elite | mid | 300 | 21.3% [17.1%, 26.3%] | 49.5 [47.7, 51.2] | 10.1 [9.8, 10.3] | win ok, HP HIGH, turns HIGH |
| boss-a | boss | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 7.9 [7.7, 8.1] | win ok, HP n/a, turns LOW |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 23.1 [22.2, 24.1] | 8.1 [7.9, 8.3] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 22.2 [21.4, 23.1] | 8.7 [8.5, 8.9] |  |
| enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 17.0 [16.1, 17.9] | 10.7 [10.5, 11.0] |  |
| enemy-b+enemy-d | normal | late | 300 | 90.7% [86.8%, 93.5%] | 38.3 [37.1, 39.5] | 13.9 [13.5, 14.3] |  |
| enemy-c | normal | late | 300 | 88.7% [84.6%, 91.8%] | 40.8 [39.5, 42.0] | 12.8 [12.4, 13.1] |  |
| enemy-a+enemy-d | normal | late | 300 | 56.3% [50.7%, 61.8%] | 48.6 [47.4, 49.7] | 10.0 [9.6, 10.3] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 49.0% [43.4%, 54.6%] | 49.6 [48.5, 50.8] | 9.5 [9.2, 9.9] |  |
| enemy-a+enemy-b | normal | late | 300 | 0.7% [0.2%, 2.4%] | 48.0 [9.9, 86.1] | 7.4 [7.2, 7.6] |  |
| enemy-c+enemy-d | normal | late | 300 | 20.3% [16.2%, 25.2%] | 50.6 [48.9, 52.3] | 11.1 [10.7, 11.5] |  |
| enemy-b+enemy-d+enemy-d | normal | late | 300 | 11.3% [8.2%, 15.4%] | 52.7 [50.8, 54.7] | 9.0 [8.7, 9.4] |  |
| enemy-a+enemy-b+enemy-d | normal | late | 300 | 0.0% [0.0%, 1.3%] | n/a | 4.7 [4.6, 4.9] |  |
| enemy-b+enemy-c | normal | late | 300 | 0.0% [0.0%, 1.3%] | n/a | 8.3 [8.0, 8.5] |  |
| elite-a | elite | late | 300 | 13.0% [9.7%, 17.3%] | 50.7 [48.2, 53.2] | 9.9 [9.6, 10.1] |  |
| elite-b | elite | late | 300 | 43.7% [38.2%, 49.3%] | 46.2 [44.7, 47.8] | 13.9 [13.4, 14.4] |  |
| boss-a | boss | late | 300 | 0.0% [0.0%, 1.3%] | n/a | 10.1 [9.8, 10.4] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 20.3 [19.1, 21.4] | 7.0 [6.8, 7.1] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 20.9 [19.3, 22.5] | 7.8 [7.6, 8.0] |  |
| enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 18.8 [17.3, 20.3] | 9.4 [9.2, 9.6] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 91.0% [83.8%, 95.2%] | 40.8 [38.9, 42.7] | 13.1 [12.8, 13.3] |  |
| enemy-c | normal | syn-tag | 100 | 72.0% [62.5%, 79.9%] | 47.6 [45.9, 49.4] | 11.7 [11.4, 11.9] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 50.0% [40.4%, 59.6%] | 51.7 [50.1, 53.4] | 9.4 [9.1, 9.7] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 45.0% [35.6%, 54.8%] | 50.6 [48.9, 52.3] | 8.9 [8.6, 9.3] |  |
| enemy-a+enemy-b | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.9 [6.6, 7.1] |  |
| enemy-c+enemy-d | normal | syn-tag | 100 | 1.0% [0.2%, 5.4%] | n/a | 9.9 [9.6, 10.2] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.3 [7.9, 8.6] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.6 [4.5, 4.7] |  |
| enemy-b+enemy-c | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.8 [7.6, 8.0] |  |
| elite-a | elite | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.2 [8.0, 8.4] |  |
| elite-b | elite | syn-tag | 100 | 6.0% [2.8%, 12.5%] | 54.7 [51.5, 57.8] | 11.4 [11.0, 11.7] |  |
| boss-a | boss | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.0 [7.8, 8.2] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 25.4 [23.4, 27.3] | 4.8 [4.6, 5.0] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 26.2 [24.6, 27.8] | 5.4 [5.1, 5.7] |  |
| enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 22.5 [20.9, 24.1] | 6.5 [6.1, 6.8] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 82.0% [73.3%, 88.3%] | 45.3 [43.5, 47.2] | 8.4 [8.1, 8.7] |  |
| enemy-c | normal | syn-exhaust | 100 | 72.0% [62.5%, 79.9%] | 45.5 [43.8, 47.1] | 7.6 [7.4, 7.9] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 45.0% [35.6%, 54.8%] | 52.3 [50.7, 53.9] | 5.9 [5.6, 6.1] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 36.0% [27.3%, 45.8%] | 48.3 [45.7, 50.9] | 5.8 [5.5, 6.0] |  |
| enemy-a+enemy-b | normal | syn-exhaust | 100 | 2.0% [0.6%, 7.0%] | 50.5 [-57.5, 158.5] | 5.2 [5.0, 5.4] |  |
| enemy-c+enemy-d | normal | syn-exhaust | 100 | 10.0% [5.5%, 17.4%] | 51.6 [49.3, 53.9] | 6.6 [6.4, 6.8] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-exhaust | 100 | 1.0% [0.2%, 5.4%] | n/a | 5.4 [5.1, 5.6] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.0 [4.0, 4.0] |  |
| enemy-b+enemy-c | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.8 [5.7, 5.9] |  |
| elite-a | elite | syn-exhaust | 100 | 12.0% [7.0%, 19.8%] | 56.5 [54.4, 58.6] | 6.7 [6.5, 6.8] |  |
| elite-b | elite | syn-exhaust | 100 | 22.0% [15.0%, 31.1%] | 52.0 [48.8, 55.2] | 7.4 [7.2, 7.7] |  |
| boss-a | boss | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.0 [6.9, 7.0] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.6 [6.6, 8.6] | 7.7 [7.6, 7.9] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 9.5 [8.5, 10.5] | 8.0 [7.9, 8.2] |  |
| enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 6.3 [5.4, 7.3] | 9.7 [9.5, 9.9] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 17.4 [16.0, 18.8] | 13.5 [13.2, 13.8] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 13.1 [11.8, 14.4] | 11.8 [11.6, 12.1] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 29.4 [27.6, 31.2] | 10.9 [10.6, 11.1] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 30.3 [28.7, 31.9] | 11.6 [11.3, 11.8] |  |
| enemy-a+enemy-b | normal | syn-trigger | 100 | 65.0% [55.3%, 73.6%] | 48.5 [46.7, 50.4] | 14.1 [13.5, 14.7] |  |
| enemy-c+enemy-d | normal | syn-trigger | 100 | 96.0% [90.2%, 98.4%] | 37.6 [35.7, 39.5] | 15.3 [15.0, 15.6] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-trigger | 100 | 90.0% [82.6%, 94.5%] | 44.9 [43.3, 46.6] | 16.9 [16.5, 17.3] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-trigger | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.1 [6.7, 7.5] |  |
| enemy-b+enemy-c | normal | syn-trigger | 100 | 21.0% [14.2%, 30.0%] | 51.1 [48.4, 53.8] | 15.3 [14.4, 16.1] |  |
| elite-a | elite | syn-trigger | 100 | 69.0% [59.4%, 77.2%] | 45.4 [43.1, 47.7] | 12.4 [12.2, 12.7] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 29.8 [28.0, 31.7] | 14.8 [14.5, 15.1] |  |
| boss-a | boss | syn-trigger | 100 | 0.0% [0.0%, 3.7%] | n/a | 13.6 [13.1, 14.1] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 27.2 [25.6, 28.7] | 4.2 [4.0, 4.3] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 29.7 [28.6, 30.9] | 4.3 [4.2, 4.5] |  |
| enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 26.6 [25.7, 27.6] | 5.0 [4.9, 5.1] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 88.0% [80.2%, 93.0%] | 45.4 [44.0, 46.8] | 6.1 [6.0, 6.2] |  |
| enemy-c | normal | syn-mult | 100 | 90.0% [82.6%, 94.5%] | 46.8 [45.1, 48.5] | 5.8 [5.7, 5.9] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 59.0% [49.2%, 68.1%] | 50.9 [48.9, 52.8] | 4.9 [4.8, 5.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 62.0% [52.2%, 70.9%] | 51.6 [50.2, 53.1] | 5.0 [4.9, 5.2] |  |
| enemy-a+enemy-b | normal | syn-mult | 100 | 5.0% [2.2%, 11.2%] | 54.0 [49.1, 58.9] | 4.3 [4.2, 4.4] |  |
| enemy-c+enemy-d | normal | syn-mult | 100 | 9.0% [4.8%, 16.2%] | 54.7 [51.1, 58.2] | 5.3 [5.2, 5.4] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mult | 100 | 4.0% [1.6%, 9.8%] | 55.3 [48.5, 62.0] | 4.6 [4.5, 4.8] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.0 [4.0, 4.0] |  |
| enemy-b+enemy-c | normal | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.9 [4.8, 5.0] |  |
| elite-a | elite | syn-mult | 100 | 8.0% [4.1%, 15.0%] | 48.1 [45.1, 51.1] | 5.0 [5.0, 5.1] |  |
| elite-b | elite | syn-mult | 100 | 42.0% [32.8%, 51.8%] | 51.1 [49.5, 52.8] | 6.0 [5.9, 6.1] |  |
| boss-a | boss | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.0 [6.0, 6.1] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 22.5 [20.7, 24.2] | 4.3 [4.2, 4.5] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 26.4 [24.9, 27.9] | 5.1 [4.9, 5.2] |  |
| enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 20.0 [18.7, 21.4] | 5.6 [5.4, 5.8] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 73.0% [63.6%, 80.7%] | 48.5 [46.8, 50.2] | 8.2 [8.0, 8.5] |  |
| enemy-c | normal | syn-combo | 100 | 85.0% [76.7%, 90.7%] | 48.7 [47.3, 50.1] | 7.0 [6.9, 7.2] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 26.0% [18.4%, 35.4%] | 53.8 [52.0, 55.6] | 5.6 [5.5, 5.8] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 14.0% [8.5%, 22.1%] | 53.9 [50.3, 57.4] | 5.5 [5.3, 5.6] |  |
| enemy-a+enemy-b | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.0 [4.9, 5.1] |  |
| enemy-c+enemy-d | normal | syn-combo | 100 | 1.0% [0.2%, 5.4%] | n/a | 6.0 [5.9, 6.2] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-combo | 100 | 1.0% [0.2%, 5.4%] | n/a | 5.1 [4.9, 5.2] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.0 [4.0, 4.0] |  |
| enemy-b+enemy-c | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.9 [5.8, 5.9] |  |
| elite-a | elite | syn-combo | 100 | 14.0% [8.5%, 22.1%] | 56.5 [54.6, 58.4] | 6.3 [6.1, 6.5] |  |
| elite-b | elite | syn-combo | 100 | 19.0% [12.5%, 27.8%] | 56.8 [55.0, 58.6] | 7.0 [6.7, 7.2] |  |
| boss-a | boss | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.9 [6.9, 7.0] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 25.5 [24.4, 26.6] | 7.1 [7.0, 7.3] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 23.4 [22.4, 24.4] | 7.4 [7.2, 7.5] |  |
| enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 19.4 [18.4, 20.4] | 9.4 [9.2, 9.5] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 90.0% [86.1%, 92.9%] | 38.5 [37.1, 39.8] | 11.8 [11.5, 12.1] |  |
| enemy-c | normal | syn-mixed | 300 | 81.3% [76.5%, 85.3%] | 41.3 [40.1, 42.6] | 10.9 [10.7, 11.2] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 51.7% [46.0%, 57.3%] | 49.2 [48.0, 50.5] | 8.6 [8.3, 8.9] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 57.0% [51.3%, 62.5%] | 50.6 [49.5, 51.6] | 8.6 [8.2, 8.9] |  |
| enemy-a+enemy-b | normal | syn-mixed | 300 | 1.0% [0.3%, 2.9%] | 51.0 [40.2, 61.8] | 6.8 [6.6, 7.0] |  |
| enemy-c+enemy-d | normal | syn-mixed | 300 | 14.0% [10.5%, 18.4%] | 52.7 [50.9, 54.5] | 9.8 [9.3, 10.2] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mixed | 300 | 12.3% [9.1%, 16.5%] | 51.3 [49.5, 53.2] | 8.8 [8.3, 9.3] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 4.3 [4.3, 4.4] |  |
| enemy-b+enemy-c | normal | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 7.4 [7.2, 7.6] |  |
| elite-a | elite | syn-mixed | 300 | 0.3% [0.1%, 1.9%] | n/a | 8.1 [7.9, 8.3] |  |
| elite-b | elite | syn-mixed | 300 | 29.0% [24.2%, 34.4%] | 52.7 [51.5, 53.9] | 11.9 [11.5, 12.3] |  |
| boss-a | boss | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 8.3 [8.1, 8.5] |  |

### greedy bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 12 | 63.7% | 32.9 | 11.7 |
| starter | elite | 2 | 1.0% | 56.5 | 12.5 |
| starter | boss | 1 | 0.0% | n/a | 10.0 |
| mid | normal | 12 | 69.7% | 36.5 | 9.5 |
| mid | elite | 2 | 30.8% | 51.9 | 10.9 |
| mid | boss | 1 | 0.0% | n/a | 9.0 |
| late | normal | 12 | 83.6% | 30.8 | 11.6 |
| late | elite | 2 | 81.5% | 39.4 | 13.8 |
| late | boss | 1 | 3.7% | 51.1 | 15.5 |
| syn-tag | normal | 12 | 67.8% | 34.6 | 9.8 |
| syn-tag | elite | 2 | 13.0% | 53.3 | 10.4 |
| syn-tag | boss | 1 | 0.0% | n/a | 8.4 |
| syn-exhaust | normal | 12 | 37.1% | 37.7 | 8.0 |
| syn-exhaust | elite | 2 | 0.0% | n/a | 7.9 |
| syn-exhaust | boss | 1 | 0.0% | n/a | 7.0 |
| syn-trigger | normal | 12 | 86.3% | 24.5 | 15.8 |
| syn-trigger | elite | 2 | 78.5% | 37.6 | 17.9 |
| syn-trigger | boss | 1 | 0.0% | n/a | 16.8 |
| syn-mult | normal | 12 | 73.8% | 39.3 | 5.0 |
| syn-mult | elite | 2 | 64.5% | 47.6 | 5.4 |
| syn-mult | boss | 1 | 0.0% | n/a | 6.2 |
| syn-combo | normal | 12 | 60.8% | 39.6 | 6.4 |
| syn-combo | elite | 2 | 19.5% | 55.3 | 6.9 |
| syn-combo | boss | 1 | 0.0% | n/a | 7.0 |
| syn-mixed | normal | 12 | 75.4% | 32.2 | 9.7 |
| syn-mixed | elite | 2 | 37.5% | 52.9 | 11.2 |
| syn-mixed | boss | 1 | 0.0% | n/a | 9.0 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 19.3 [18.2, 20.4] | 9.5 [9.4, 9.7] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 9.2 [8.7, 9.7] | 8.7 [8.6, 8.8] |  |
| enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 12.3 [11.3, 13.4] | 9.1 [9.0, 9.3] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 25.9 [24.6, 27.2] | 14.0 [13.8, 14.3] |  |
| enemy-c | normal | starter | 100 | 99.0% [94.6%, 99.8%] | 41.1 [39.4, 42.8] | 14.2 [14.0, 14.4] |  |
| enemy-a+enemy-d | normal | starter | 100 | 97.0% [91.5%, 99.0%] | 44.3 [43.0, 45.5] | 14.4 [14.2, 14.6] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 34.6 [33.7, 35.6] | 12.7 [12.5, 12.9] |  |
| enemy-a+enemy-b | normal | starter | 100 | 4.0% [1.6%, 9.8%] | 58.8 [58.0, 59.5] | 9.3 [8.8, 9.9] |  |
| enemy-c+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 15.6 [15.2, 15.9] |  |
| enemy-b+enemy-d+enemy-d | normal | starter | 100 | 65.0% [55.3%, 73.6%] | 50.8 [49.2, 52.3] | 17.9 [17.4, 18.5] |  |
| enemy-a+enemy-b+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.0 [5.9, 6.1] |  |
| enemy-b+enemy-c | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 9.4 [9.3, 9.6] |  |
| elite-a | elite | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 9.6 [9.3, 9.9] |  |
| elite-b | elite | starter | 100 | 2.0% [0.6%, 7.0%] | 56.5 [24.7, 88.3] | 15.4 [15.0, 15.7] |  |
| boss-a | boss | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.0 [9.7, 10.3] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 19.9 [19.1, 20.6] | 7.5 [7.4, 7.7] | win ok, HP HIGH, turns HIGH |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 18.0 [17.3, 18.6] | 7.3 [7.1, 7.4] | win ok, HP HIGH, turns HIGH |
| enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 17.2 [16.4, 18.1] | 8.0 [7.9, 8.1] | win ok, HP HIGH, turns HIGH |
| enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 32.8 [31.8, 33.8] | 11.1 [10.9, 11.3] | win ok, HP HIGH, turns HIGH |
| enemy-c | normal | mid | 300 | 99.3% [97.6%, 99.8%] | 38.1 [37.1, 39.2] | 10.9 [10.8, 11.1] | win ok, HP HIGH, turns HIGH |
| enemy-a+enemy-d | normal | mid | 300 | 96.0% [93.1%, 97.7%] | 44.3 [43.3, 45.3] | 10.3 [10.2, 10.5] | win ok, HP HIGH, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 39.8 [39.0, 40.6] | 10.0 [9.9, 10.2] | win ok, HP HIGH, turns HIGH |
| enemy-a+enemy-b | normal | mid | 300 | 30.0% [25.1%, 35.4%] | 53.7 [52.7, 54.6] | 9.6 [9.2, 9.9] | win LOW, HP HIGH, turns HIGH |
| enemy-c+enemy-d | normal | mid | 300 | 45.7% [40.1%, 51.3%] | 52.1 [51.2, 53.0] | 12.7 [12.5, 12.9] | win LOW, HP HIGH, turns HIGH |
| enemy-b+enemy-d+enemy-d | normal | mid | 300 | 65.0% [59.4%, 70.2%] | 48.7 [47.6, 49.8] | 13.1 [12.9, 13.4] | win LOW, HP HIGH, turns HIGH |
| enemy-a+enemy-b+enemy-d | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 5.3 [5.2, 5.4] | win LOW, HP n/a, turns ok |
| enemy-b+enemy-c | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 8.7 [8.5, 8.8] | win LOW, HP n/a, turns HIGH |
| elite-a | elite | mid | 300 | 12.3% [9.1%, 16.5%] | 52.7 [50.8, 54.6] | 9.0 [8.8, 9.2] | win LOW, HP HIGH, turns ok |
| elite-b | elite | mid | 300 | 49.3% [43.7%, 55.0%] | 51.0 [49.9, 52.1] | 12.8 [12.6, 13.1] | win LOW, HP HIGH, turns HIGH |
| boss-a | boss | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 9.0 [8.8, 9.2] | win LOW, HP n/a, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 13.5 [12.9, 14.2] | 8.0 [7.9, 8.2] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 12.6 [12.1, 13.2] | 7.8 [7.7, 7.9] |  |
| enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 9.0 [8.3, 9.7] | 9.1 [8.9, 9.3] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 20.2 [19.4, 21.1] | 12.2 [11.9, 12.5] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 22.5 [21.5, 23.4] | 12.7 [12.3, 13.0] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 32.0 [31.0, 32.9] | 11.3 [11.0, 11.6] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 31.6 [30.7, 32.5] | 11.1 [10.8, 11.3] |  |
| enemy-a+enemy-b | normal | late | 300 | 82.7% [78.0%, 86.5%] | 44.5 [43.3, 45.7] | 14.2 [13.7, 14.6] |  |
| enemy-c+enemy-d | normal | late | 300 | 94.3% [91.1%, 96.4%] | 38.7 [37.6, 39.7] | 16.2 [15.8, 16.7] |  |
| enemy-b+enemy-d+enemy-d | normal | late | 300 | 98.3% [96.2%, 99.3%] | 39.9 [38.9, 40.9] | 15.6 [15.2, 16.0] |  |
| enemy-a+enemy-b+enemy-d | normal | late | 300 | 7.3% [4.9%, 10.9%] | 55.4 [53.9, 56.8] | 7.7 [7.3, 8.1] |  |
| enemy-b+enemy-c | normal | late | 300 | 20.3% [16.2%, 25.2%] | 50.1 [48.3, 51.9] | 13.6 [13.0, 14.2] |  |
| elite-a | elite | late | 300 | 66.3% [60.8%, 71.4%] | 44.5 [43.1, 46.0] | 12.4 [12.0, 12.7] |  |
| elite-b | elite | late | 300 | 96.7% [94.0%, 98.2%] | 34.3 [33.0, 35.7] | 15.3 [14.9, 15.7] |  |
| boss-a | boss | late | 300 | 3.7% [2.1%, 6.4%] | 51.1 [46.9, 55.3] | 15.5 [14.9, 16.2] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 16.6 [15.2, 17.9] | 6.5 [6.3, 6.6] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 11.2 [10.5, 12.0] | 7.0 [6.8, 7.2] |  |
| enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 17.0 [15.6, 18.4] | 9.2 [9.0, 9.4] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 31.5 [29.8, 33.2] | 12.1 [11.9, 12.4] |  |
| enemy-c | normal | syn-tag | 100 | 94.0% [87.5%, 97.2%] | 43.0 [41.1, 44.9] | 11.1 [10.9, 11.4] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 98.0% [93.0%, 99.4%] | 40.8 [39.2, 42.5] | 9.8 [9.6, 10.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 32.9 [31.4, 34.3] | 10.1 [9.9, 10.4] |  |
| enemy-a+enemy-b | normal | syn-tag | 100 | 30.0% [21.9%, 39.6%] | 52.0 [49.5, 54.4] | 11.0 [10.3, 11.6] |  |
| enemy-c+enemy-d | normal | syn-tag | 100 | 20.0% [13.3%, 28.9%] | 52.5 [49.6, 55.4] | 12.4 [12.1, 12.7] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-tag | 100 | 72.0% [62.5%, 79.9%] | 48.8 [47.3, 50.2] | 14.7 [14.4, 15.1] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.6 [5.5, 5.8] |  |
| enemy-b+enemy-c | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.5 [8.3, 8.7] |  |
| elite-a | elite | syn-tag | 100 | 2.0% [0.6%, 7.0%] | 54.0 [54.0, 54.0] | 8.7 [8.5, 8.9] |  |
| elite-b | elite | syn-tag | 100 | 24.0% [16.7%, 33.2%] | 52.7 [50.4, 55.0] | 12.0 [11.7, 12.3] |  |
| boss-a | boss | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.4 [8.2, 8.6] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 36.5 [35.5, 37.5] | 7.3 [7.2, 7.5] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 23.1 [22.5, 23.7] | 7.8 [7.6, 8.0] |  |
| enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 27.1 [25.8, 28.4] | 9.1 [8.9, 9.2] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 85.0% [76.7%, 90.7%] | 47.2 [45.9, 48.5] | 12.5 [12.2, 12.7] |  |
| enemy-c | normal | syn-exhaust | 100 | 1.0% [0.2%, 5.4%] | n/a | 9.4 [9.2, 9.7] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.4 [8.2, 8.6] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 59.0% [49.2%, 68.1%] | 54.6 [53.8, 55.4] | 10.4 [10.1, 10.8] |  |
| enemy-a+enemy-b | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.9 [5.8, 5.9] |  |
| enemy-c+enemy-d | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.0 [7.8, 8.1] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.6 [7.3, 7.9] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.0 [4.0, 4.0] |  |
| enemy-b+enemy-c | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.0 [6.0, 6.0] |  |
| elite-a | elite | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.9 [6.7, 7.0] |  |
| elite-b | elite | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.9 [8.8, 9.0] |  |
| boss-a | boss | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.0 [7.0, 7.0] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.5 [4.5, 6.4] | 9.3 [9.2, 9.4] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 6.2 [5.4, 7.1] | 9.4 [9.3, 9.5] |  |
| enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.2 [4.2, 6.1] | 12.0 [11.8, 12.2] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 12.6 [11.2, 13.9] | 17.3 [17.1, 17.5] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 13.7 [12.3, 15.2] | 16.1 [15.9, 16.3] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 22.4 [20.6, 24.1] | 14.3 [14.1, 14.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 20.5 [19.3, 21.7] | 13.8 [13.6, 13.9] |  |
| enemy-a+enemy-b | normal | syn-trigger | 100 | 91.0% [83.8%, 95.2%] | 36.9 [34.4, 39.4] | 19.9 [19.3, 20.5] |  |
| enemy-c+enemy-d | normal | syn-trigger | 100 | 99.0% [94.6%, 99.8%] | 32.7 [30.6, 34.8] | 20.9 [20.6, 21.2] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-trigger | 100 | 99.0% [94.6%, 99.8%] | 33.1 [31.1, 35.2] | 23.0 [22.6, 23.3] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-trigger | 100 | 13.0% [7.8%, 21.0%] | 54.2 [52.1, 56.3] | 11.0 [9.7, 12.2] |  |
| enemy-b+enemy-c | normal | syn-trigger | 100 | 34.0% [25.5%, 43.7%] | 51.3 [49.0, 53.6] | 22.4 [21.1, 23.6] |  |
| elite-a | elite | syn-trigger | 100 | 57.0% [47.2%, 66.3%] | 45.1 [42.5, 47.7] | 15.2 [14.7, 15.8] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 30.1 [28.5, 31.7] | 20.6 [20.4, 20.9] |  |
| boss-a | boss | syn-trigger | 100 | 0.0% [0.0%, 3.7%] | n/a | 16.8 [16.2, 17.4] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 21.3 [20.5, 22.1] | 3.5 [3.4, 3.6] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 21.8 [20.9, 22.6] | 3.8 [3.7, 3.9] |  |
| enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 22.1 [21.3, 22.9] | 4.3 [4.2, 4.4] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 33.9 [32.6, 35.1] | 5.4 [5.3, 5.6] |  |
| enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 37.9 [36.7, 39.0] | 5.1 [5.0, 5.2] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 98.0% [93.0%, 99.4%] | 45.3 [43.5, 47.1] | 5.0 [4.9, 5.1] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 41.8 [40.4, 43.1] | 5.1 [5.0, 5.3] |  |
| enemy-a+enemy-b | normal | syn-mult | 100 | 76.0% [66.8%, 83.3%] | 49.8 [48.3, 51.3] | 6.0 [5.9, 6.2] |  |
| enemy-c+enemy-d | normal | syn-mult | 100 | 43.0% [33.7%, 52.8%] | 53.7 [52.2, 55.2] | 5.8 [5.8, 5.9] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mult | 100 | 64.0% [54.2%, 72.7%] | 49.9 [48.4, 51.5] | 6.1 [6.0, 6.2] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mult | 100 | 5.0% [2.2%, 11.2%] | 55.0 [51.2, 58.8] | 4.3 [4.1, 4.4] |  |
| enemy-b+enemy-c | normal | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.3 [5.2, 5.4] |  |
| elite-a | elite | syn-mult | 100 | 37.0% [28.2%, 46.8%] | 47.7 [45.6, 49.9] | 5.1 [5.0, 5.2] |  |
| elite-b | elite | syn-mult | 100 | 92.0% [85.0%, 95.9%] | 47.4 [46.3, 48.4] | 5.8 [5.6, 5.9] |  |
| boss-a | boss | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.2 [6.1, 6.2] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 20.7 [19.2, 22.2] | 4.5 [4.3, 4.6] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 19.2 [18.1, 20.2] | 5.0 [4.9, 5.1] |  |
| enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 17.2 [16.2, 18.1] | 5.4 [5.2, 5.5] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 38.0 [36.4, 39.6] | 7.8 [7.6, 8.0] |  |
| enemy-c | normal | syn-combo | 100 | 91.0% [83.8%, 95.2%] | 47.5 [46.2, 48.7] | 7.3 [7.1, 7.4] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 89.0% [81.4%, 93.7%] | 51.2 [50.1, 52.3] | 6.8 [6.6, 6.9] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 92.0% [85.0%, 95.9%] | 44.8 [43.2, 46.5] | 7.3 [7.2, 7.5] |  |
| enemy-a+enemy-b | normal | syn-combo | 100 | 23.0% [15.8%, 32.2%] | 51.2 [49.0, 53.5] | 7.0 [6.7, 7.4] |  |
| enemy-c+enemy-d | normal | syn-combo | 100 | 9.0% [4.8%, 16.2%] | 54.2 [52.2, 56.2] | 7.6 [7.5, 7.8] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-combo | 100 | 26.0% [18.4%, 35.4%] | 52.0 [50.0, 53.9] | 8.1 [7.7, 8.4] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.2 [4.1, 4.3] |  |
| enemy-b+enemy-c | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.0 [6.0, 6.0] |  |
| elite-a | elite | syn-combo | 100 | 16.0% [10.1%, 24.4%] | 56.2 [54.8, 57.6] | 6.6 [6.4, 6.8] |  |
| elite-b | elite | syn-combo | 100 | 23.0% [15.8%, 32.2%] | 54.3 [52.8, 55.9] | 7.2 [7.0, 7.5] |  |
| boss-a | boss | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.0 [6.9, 7.0] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 18.4 [17.4, 19.3] | 7.1 [7.0, 7.2] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 13.9 [13.2, 14.5] | 7.0 [6.9, 7.2] |  |
| enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 13.8 [13.0, 14.6] | 8.3 [8.1, 8.4] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 25.8 [24.8, 26.8] | 11.0 [10.8, 11.3] |  |
| enemy-c | normal | syn-mixed | 300 | 99.7% [98.1%, 99.9%] | 32.7 [31.5, 33.8] | 10.9 [10.6, 11.1] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 97.7% [95.3%, 98.9%] | 39.0 [38.0, 40.0] | 9.8 [9.6, 10.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 99.3% [97.6%, 99.8%] | 34.7 [33.9, 35.6] | 9.5 [9.3, 9.8] |  |
| enemy-a+enemy-b | normal | syn-mixed | 300 | 49.7% [44.0%, 55.3%] | 51.7 [50.8, 52.6] | 11.0 [10.5, 11.4] |  |
| enemy-c+enemy-d | normal | syn-mixed | 300 | 72.0% [66.7%, 76.8%] | 47.5 [46.4, 48.5] | 13.2 [12.8, 13.5] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mixed | 300 | 86.0% [81.6%, 89.5%] | 44.3 [43.3, 45.3] | 13.5 [13.1, 13.9] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 5.2 [5.1, 5.4] |  |
| enemy-b+enemy-c | normal | syn-mixed | 300 | 0.3% [0.1%, 1.9%] | n/a | 9.3 [8.9, 9.6] |  |
| elite-a | elite | syn-mixed | 300 | 8.7% [6.0%, 12.4%] | 55.2 [53.6, 56.7] | 9.0 [8.8, 9.2] |  |
| elite-b | elite | syn-mixed | 300 | 66.3% [60.8%, 71.4%] | 50.6 [49.7, 51.5] | 13.3 [13.0, 13.7] |  |
| boss-a | boss | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 9.0 [8.8, 9.3] |  |

### smart bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 12 | 54.9% | 43.3 | 8.5 |
| starter | elite | 2 | 0.0% | n/a | 8.9 |
| starter | boss | 1 | 0.0% | n/a | 8.2 |
| mid | normal | 12 | 70.0% | 42.5 | 7.7 |
| mid | elite | 2 | 23.5% | 52.9 | 8.9 |
| mid | boss | 1 | 0.0% | n/a | 8.2 |
| late | normal | 12 | 81.1% | 36.2 | 9.2 |
| late | elite | 2 | 73.8% | 45.1 | 10.9 |
| late | boss | 1 | 2.0% | 56.5 | 12.6 |
| syn-tag | normal | 12 | 71.1% | 34.8 | 8.5 |
| syn-tag | elite | 2 | 19.5% | 53.2 | 9.6 |
| syn-tag | boss | 1 | 0.0% | n/a | 8.3 |
| syn-exhaust | normal | 12 | 77.3% | 36.7 | 5.8 |
| syn-exhaust | elite | 2 | 70.0% | 48.7 | 6.5 |
| syn-exhaust | boss | 1 | 0.0% | n/a | 7.0 |
| syn-trigger | normal | 12 | 99.7% | 16.3 | 9.9 |
| syn-trigger | elite | 2 | 100.0% | 21.9 | 10.4 |
| syn-trigger | boss | 1 | 23.0% | 54.1 | 17.0 |
| syn-mult | normal | 12 | 79.3% | 41.8 | 4.5 |
| syn-mult | elite | 2 | 85.0% | 49.7 | 5.0 |
| syn-mult | boss | 1 | 0.0% | n/a | 6.0 |
| syn-combo | normal | 12 | 71.1% | 33.6 | 5.4 |
| syn-combo | elite | 2 | 81.5% | 49.1 | 6.1 |
| syn-combo | boss | 1 | 0.0% | n/a | 6.9 |
| syn-mixed | normal | 12 | 78.1% | 37.5 | 8.1 |
| syn-mixed | elite | 2 | 53.8% | 51.8 | 9.5 |
| syn-mixed | boss | 1 | 0.0% | n/a | 8.7 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 30.1 [29.3, 31.0] | 6.4 [6.3, 6.5] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 22.5 [21.7, 23.3] | 6.1 [6.0, 6.2] |  |
| enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 25.5 [24.2, 26.8] | 8.1 [7.9, 8.2] |  |
| enemy-b+enemy-d | normal | starter | 100 | 99.0% [94.6%, 99.8%] | 43.9 [42.5, 45.3] | 10.7 [10.6, 10.9] |  |
| enemy-c | normal | starter | 100 | 39.0% [30.0%, 48.8%] | 57.5 [56.9, 58.1] | 10.8 [10.7, 11.0] |  |
| enemy-a+enemy-d | normal | starter | 100 | 92.0% [85.0%, 95.9%] | 58.4 [58.1, 58.8] | 10.1 [9.9, 10.4] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 50.1 [49.1, 51.1] | 9.3 [9.2, 9.4] |  |
| enemy-a+enemy-b | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.2 [6.7, 7.6] |  |
| enemy-c+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 9.7 [9.4, 10.0] |  |
| enemy-b+enemy-d+enemy-d | normal | starter | 100 | 29.0% [21.0%, 38.5%] | 58.3 [57.7, 58.8] | 13.0 [12.5, 13.5] |  |
| enemy-a+enemy-b+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.4 [4.3, 4.6] |  |
| enemy-b+enemy-c | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.5 [6.4, 6.7] |  |
| elite-a | elite | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.8 [7.6, 8.0] |  |
| elite-b | elite | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.1 [9.8, 10.4] |  |
| boss-a | boss | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.2 [8.0, 8.4] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 29.2 [28.4, 30.0] | 5.6 [5.5, 5.7] | win ok, HP HIGH, turns ok |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 24.0 [23.4, 24.6] | 5.7 [5.6, 5.7] | win ok, HP HIGH, turns ok |
| enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 22.9 [22.1, 23.7] | 6.9 [6.8, 6.9] | win ok, HP HIGH, turns HIGH |
| enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 39.0 [38.2, 39.7] | 8.8 [8.6, 8.9] | win ok, HP HIGH, turns HIGH |
| enemy-c | normal | mid | 300 | 97.3% [94.8%, 98.6%] | 46.0 [45.0, 47.0] | 8.5 [8.4, 8.6] | win ok, HP HIGH, turns HIGH |
| enemy-a+enemy-d | normal | mid | 300 | 91.7% [88.0%, 94.3%] | 52.0 [51.2, 52.8] | 7.7 [7.6, 7.9] | win LOW, HP HIGH, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 99.7% [98.1%, 99.9%] | 47.8 [47.1, 48.5] | 7.7 [7.6, 7.9] | win ok, HP HIGH, turns HIGH |
| enemy-a+enemy-b | normal | mid | 300 | 44.0% [38.5%, 49.7%] | 56.2 [55.4, 56.9] | 9.2 [8.8, 9.5] | win LOW, HP HIGH, turns HIGH |
| enemy-c+enemy-d | normal | mid | 300 | 38.0% [32.7%, 43.6%] | 52.7 [51.6, 53.7] | 9.8 [9.5, 10.0] | win LOW, HP HIGH, turns HIGH |
| enemy-b+enemy-d+enemy-d | normal | mid | 300 | 68.7% [63.2%, 73.7%] | 54.9 [54.3, 55.5] | 10.9 [10.6, 11.1] | win LOW, HP HIGH, turns HIGH |
| enemy-a+enemy-b+enemy-d | normal | mid | 300 | 0.3% [0.1%, 1.9%] | n/a | 4.5 [4.4, 4.6] | win LOW, HP HIGH, turns ok |
| enemy-b+enemy-c | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 6.7 [6.6, 6.9] | win LOW, HP n/a, turns HIGH |
| elite-a | elite | mid | 300 | 9.3% [6.5%, 13.2%] | 55.4 [53.9, 56.9] | 7.9 [7.7, 8.0] | win LOW, HP HIGH, turns ok |
| elite-b | elite | mid | 300 | 37.7% [32.4%, 43.3%] | 50.4 [48.9, 51.9] | 9.9 [9.7, 10.1] | win LOW, HP HIGH, turns HIGH |
| boss-a | boss | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 8.2 [8.0, 8.4] | win LOW, HP n/a, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 19.7 [18.9, 20.5] | 6.4 [6.3, 6.5] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 17.0 [16.4, 17.6] | 6.5 [6.3, 6.6] |  |
| enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 13.8 [12.9, 14.6] | 7.9 [7.8, 8.0] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 27.3 [26.4, 28.3] | 10.1 [9.8, 10.3] |  |
| enemy-c | normal | late | 300 | 99.3% [97.6%, 99.8%] | 31.2 [30.0, 32.3] | 9.9 [9.6, 10.1] |  |
| enemy-a+enemy-d | normal | late | 300 | 98.7% [96.6%, 99.5%] | 39.8 [38.8, 40.9] | 8.6 [8.4, 8.8] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 99.3% [97.6%, 99.8%] | 37.9 [37.0, 38.9] | 8.8 [8.6, 9.0] |  |
| enemy-a+enemy-b | normal | late | 300 | 78.0% [73.0%, 82.3%] | 48.3 [47.1, 49.4] | 11.4 [11.0, 11.8] |  |
| enemy-c+enemy-d | normal | late | 300 | 85.0% [80.5%, 88.6%] | 46.7 [45.6, 47.8] | 11.9 [11.6, 12.2] |  |
| enemy-b+enemy-d+enemy-d | normal | late | 300 | 92.7% [89.1%, 95.1%] | 46.3 [45.2, 47.3] | 12.1 [11.7, 12.4] |  |
| enemy-a+enemy-b+enemy-d | normal | late | 300 | 7.7% [5.2%, 11.2%] | 52.6 [49.8, 55.4] | 7.0 [6.5, 7.5] |  |
| enemy-b+enemy-c | normal | late | 300 | 12.7% [9.4%, 16.9%] | 53.5 [51.7, 55.3] | 10.4 [10.0, 10.9] |  |
| elite-a | elite | late | 300 | 56.3% [50.7%, 61.8%] | 46.9 [45.3, 48.5] | 10.2 [9.9, 10.4] |  |
| elite-b | elite | late | 300 | 91.3% [87.6%, 94.0%] | 43.2 [41.9, 44.5] | 11.7 [11.4, 12.0] |  |
| boss-a | boss | late | 300 | 2.0% [0.9%, 4.3%] | 56.5 [54.9, 58.1] | 12.6 [12.0, 13.1] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 17.9 [16.6, 19.2] | 5.7 [5.5, 5.8] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 12.8 [12.0, 13.6] | 6.0 [5.9, 6.2] |  |
| enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 16.7 [15.3, 18.0] | 7.5 [7.4, 7.7] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 28.6 [27.1, 30.1] | 10.1 [9.9, 10.2] |  |
| enemy-c | normal | syn-tag | 100 | 97.0% [91.5%, 99.0%] | 40.7 [38.9, 42.4] | 9.6 [9.4, 9.8] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 99.0% [94.6%, 99.8%] | 43.7 [42.2, 45.3] | 8.4 [8.2, 8.6] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 34.3 [32.8, 35.7] | 8.5 [8.3, 8.7] |  |
| enemy-a+enemy-b | normal | syn-tag | 100 | 40.0% [30.9%, 49.8%] | 51.7 [49.9, 53.5] | 10.2 [9.6, 10.8] |  |
| enemy-c+enemy-d | normal | syn-tag | 100 | 33.0% [24.6%, 42.7%] | 53.4 [51.8, 55.0] | 11.1 [10.8, 11.3] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-tag | 100 | 83.0% [74.5%, 89.1%] | 48.3 [46.9, 49.6] | 12.4 [12.1, 12.6] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.7 [4.5, 4.8] |  |
| enemy-b+enemy-c | normal | syn-tag | 100 | 1.0% [0.2%, 5.4%] | n/a | 8.5 [8.2, 8.8] |  |
| elite-a | elite | syn-tag | 100 | 5.0% [2.2%, 11.2%] | 52.8 [46.3, 59.3] | 8.3 [8.1, 8.5] |  |
| elite-b | elite | syn-tag | 100 | 34.0% [25.5%, 43.7%] | 53.6 [52.3, 54.9] | 10.9 [10.7, 11.2] |  |
| boss-a | boss | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.3 [8.1, 8.5] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 17.1 [16.0, 18.1] | 3.7 [3.6, 3.9] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 17.3 [16.3, 18.2] | 3.8 [3.6, 4.0] |  |
| enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 15.9 [14.9, 16.9] | 4.7 [4.5, 4.9] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 28.6 [26.8, 30.5] | 6.3 [6.0, 6.6] |  |
| enemy-c | normal | syn-exhaust | 100 | 95.0% [88.8%, 97.8%] | 37.9 [36.0, 39.7] | 6.2 [5.9, 6.4] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 98.0% [93.0%, 99.4%] | 36.1 [34.4, 37.7] | 5.5 [5.3, 5.6] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 38.4 [36.8, 40.0] | 5.7 [5.5, 5.9] |  |
| enemy-a+enemy-b | normal | syn-exhaust | 100 | 83.0% [74.5%, 89.1%] | 45.9 [43.7, 48.1] | 7.1 [6.9, 7.4] |  |
| enemy-c+enemy-d | normal | syn-exhaust | 100 | 55.0% [45.2%, 64.4%] | 50.4 [48.4, 52.5] | 6.9 [6.7, 7.1] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-exhaust | 100 | 82.0% [73.3%, 88.3%] | 47.0 [45.1, 48.9] | 7.6 [7.3, 7.9] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-exhaust | 100 | 12.0% [7.0%, 19.8%] | 54.3 [49.9, 58.6] | 5.4 [5.2, 5.7] |  |
| enemy-b+enemy-c | normal | syn-exhaust | 100 | 3.0% [1.0%, 8.5%] | 52.0 [30.5, 73.5] | 6.2 [6.0, 6.4] |  |
| elite-a | elite | syn-exhaust | 100 | 61.0% [51.2%, 70.0%] | 51.0 [48.6, 53.4] | 6.2 [6.0, 6.4] |  |
| elite-b | elite | syn-exhaust | 100 | 79.0% [70.0%, 85.8%] | 46.5 [44.1, 48.8] | 6.9 [6.6, 7.1] |  |
| boss-a | boss | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.0 [6.9, 7.0] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 3.4 [2.8, 4.0] | 5.8 [5.7, 5.9] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 6.4 [5.5, 7.2] | 6.1 [6.0, 6.2] |  |
| enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.0 [3.2, 4.7] | 7.2 [7.1, 7.3] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 11.1 [10.1, 12.1] | 9.7 [9.5, 9.8] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.9 [5.1, 6.8] | 8.9 [8.8, 9.0] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 16.2 [14.9, 17.5] | 8.2 [8.1, 8.3] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 18.0 [17.1, 19.0] | 8.2 [8.0, 8.3] |  |
| enemy-a+enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 24.3 [22.8, 25.8] | 11.5 [11.4, 11.7] |  |
| enemy-c+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 13.5 [12.4, 14.6] | 11.6 [11.5, 11.8] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 22.0 [20.9, 23.2] | 12.3 [12.1, 12.5] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-trigger | 100 | 97.0% [91.5%, 99.0%] | 42.8 [41.4, 44.2] | 14.0 [13.7, 14.3] |  |
| enemy-b+enemy-c | normal | syn-trigger | 100 | 99.0% [94.6%, 99.8%] | 28.4 [26.5, 30.2] | 15.0 [14.8, 15.3] |  |
| elite-a | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 28.5 [26.5, 30.4] | 9.9 [9.8, 10.0] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 15.3 [14.1, 16.5] | 10.8 [10.7, 11.0] |  |
| boss-a | boss | syn-trigger | 100 | 23.0% [15.8%, 32.2%] | 54.1 [51.4, 56.8] | 17.0 [16.5, 17.5] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 25.1 [24.4, 25.8] | 3.2 [3.2, 3.3] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 22.7 [21.8, 23.6] | 3.3 [3.2, 3.3] |  |
| enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 24.9 [24.1, 25.7] | 3.9 [3.8, 4.0] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 36.3 [35.1, 37.4] | 4.8 [4.8, 4.9] |  |
| enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 38.6 [37.7, 39.6] | 4.5 [4.4, 4.7] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 41.0 [39.8, 42.3] | 4.3 [4.2, 4.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 41.6 [40.4, 42.9] | 4.3 [4.2, 4.5] |  |
| enemy-a+enemy-b | normal | syn-mult | 100 | 86.0% [77.9%, 91.5%] | 54.1 [53.2, 54.9] | 5.4 [5.3, 5.5] |  |
| enemy-c+enemy-d | normal | syn-mult | 100 | 65.0% [55.3%, 73.6%] | 50.6 [49.2, 51.9] | 5.3 [5.2, 5.4] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mult | 100 | 93.0% [86.3%, 96.6%] | 52.4 [51.4, 53.5] | 5.6 [5.4, 5.7] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mult | 100 | 6.0% [2.8%, 12.5%] | 56.8 [54.7, 59.0] | 4.3 [4.1, 4.4] |  |
| enemy-b+enemy-c | normal | syn-mult | 100 | 2.0% [0.6%, 7.0%] | 58.0 [45.3, 70.7] | 5.1 [5.0, 5.2] |  |
| elite-a | elite | syn-mult | 100 | 70.0% [60.4%, 78.1%] | 48.5 [47.7, 49.4] | 4.9 [4.9, 5.0] |  |
| elite-b | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 51.0 [49.9, 52.0] | 5.1 [5.0, 5.2] |  |
| boss-a | boss | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.0 [6.0, 6.1] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 15.4 [14.7, 16.1] | 3.3 [3.2, 3.4] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 15.2 [14.4, 16.1] | 3.6 [3.4, 3.7] |  |
| enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 14.3 [13.6, 14.9] | 4.1 [4.0, 4.2] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 28.1 [26.7, 29.6] | 6.1 [6.0, 6.2] |  |
| enemy-c | normal | syn-combo | 100 | 99.0% [94.6%, 99.8%] | 35.0 [33.4, 36.6] | 5.6 [5.4, 5.7] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 33.7 [32.4, 34.9] | 5.3 [5.2, 5.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 36.9 [35.6, 38.2] | 5.7 [5.5, 5.8] |  |
| enemy-a+enemy-b | normal | syn-combo | 100 | 48.0% [38.5%, 57.7%] | 49.0 [46.9, 51.1] | 6.4 [6.2, 6.7] |  |
| enemy-c+enemy-d | normal | syn-combo | 100 | 61.0% [51.2%, 70.0%] | 54.7 [53.5, 55.9] | 6.8 [6.7, 7.0] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-combo | 100 | 45.0% [35.6%, 54.8%] | 53.7 [52.4, 55.0] | 7.2 [6.9, 7.4] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.7 [4.5, 4.9] |  |
| enemy-b+enemy-c | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.9 [5.9, 6.0] |  |
| elite-a | elite | syn-combo | 100 | 81.0% [72.2%, 87.5%] | 53.0 [51.0, 55.0] | 6.0 [5.8, 6.1] |  |
| elite-b | elite | syn-combo | 100 | 82.0% [73.3%, 88.3%] | 45.2 [43.2, 47.1] | 6.3 [6.1, 6.5] |  |
| boss-a | boss | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.9 [6.9, 7.0] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 21.2 [20.2, 22.2] | 5.9 [5.8, 6.0] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 16.5 [15.8, 17.3] | 5.8 [5.7, 5.9] |  |
| enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 14.5 [13.7, 15.3] | 7.3 [7.1, 7.4] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 27.5 [26.6, 28.5] | 9.0 [8.8, 9.2] |  |
| enemy-c | normal | syn-mixed | 300 | 98.3% [96.2%, 99.3%] | 34.4 [33.2, 35.6] | 8.9 [8.7, 9.1] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 93.3% [89.9%, 95.6%] | 41.8 [40.8, 42.7] | 7.6 [7.4, 7.8] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 36.2 [35.3, 37.1] | 7.7 [7.5, 7.9] |  |
| enemy-a+enemy-b | normal | syn-mixed | 300 | 72.0% [66.7%, 76.8%] | 51.6 [50.8, 52.4] | 10.3 [9.9, 10.6] |  |
| enemy-c+enemy-d | normal | syn-mixed | 300 | 78.7% [73.7%, 82.9%] | 48.7 [47.7, 49.7] | 10.6 [10.3, 10.9] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mixed | 300 | 90.7% [86.8%, 93.5%] | 45.3 [44.3, 46.3] | 10.7 [10.4, 11.1] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mixed | 300 | 0.7% [0.2%, 2.4%] | 56.0 [43.3, 68.7] | 4.7 [4.6, 4.8] |  |
| enemy-b+enemy-c | normal | syn-mixed | 300 | 3.0% [1.6%, 5.6%] | 56.9 [55.4, 58.3] | 8.9 [8.6, 9.3] |  |
| elite-a | elite | syn-mixed | 300 | 22.7% [18.3%, 27.7%] | 54.4 [53.4, 55.4] | 8.5 [8.3, 8.7] |  |
| elite-b | elite | syn-mixed | 300 | 85.0% [80.5%, 88.6%] | 49.2 [48.4, 50.1] | 10.5 [10.2, 10.7] |  |
| boss-a | boss | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 8.7 [8.5, 8.9] |  |


## Fight length distribution

Turns per fight with the mid deck set (starter + 5 sampled cards). Mean has a 95% CI; p10/median/p90 show spread (a fight that is usually 4 turns but sometimes 12 is a pacing problem the mean hides). Histogram buckets are turn counts (last bucket = 15+). 15 fights x 100 seeds = 1500 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.

### random bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 7.08 [6.98, 7.18] | 6 | 7 | 8 | 3-6 | HIGH |
| enemy-d+enemy-d | normal | 7.47 [7.36, 7.59] | 6 | 8 | 9 | 3-6 | HIGH |
| enemy-b | normal | 9.35 [9.22, 9.48] | 8 | 9 | 11 | 3-6 | HIGH |
| enemy-b+enemy-d | normal | 11.31 [11.12, 11.50] | 10 | 11 | 13 | 3-6 | HIGH |
| enemy-c | normal | 10.37 [10.20, 10.54] | 8 | 11 | 12 | 3-6 | HIGH |
| enemy-a+enemy-d | normal | 7.56 [7.35, 7.77] | 5 | 8 | 10 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 7.22 [7.00, 7.45] | 5 | 7 | 10 | 3-6 | HIGH |
| enemy-a+enemy-b | normal | 6.26 [6.10, 6.41] | 4.900000000000002 | 6 | 8 | 3-6 | HIGH |
| enemy-c+enemy-d | normal | 8.76 [8.47, 9.05] | 6 | 8 | 13 | 3-6 | HIGH |
| enemy-b+enemy-d+enemy-d | normal | 6.97 [6.70, 7.24] | 5 | 6 | 10 | 3-6 | HIGH |
| enemy-a+enemy-b+enemy-d | normal | 4.17 [4.12, 4.22] | 4 | 4 | 5 | 3-6 | ok |
| enemy-b+enemy-c | normal | 6.75 [6.61, 6.89] | 6 | 6 | 8 | 3-6 | HIGH |
| elite-a | elite | 7.62 [7.44, 7.80] | 5 | 7 | 9 | 5-9 | ok |
| elite-b | elite | 10.06 [9.79, 10.33] | 7 | 9 | 14 | 5-9 | HIGH |
| boss-a | boss | 7.88 [7.70, 8.06] | 7 | 7 | 9 | 8-14 | LOW |

```
enemy-a (normal)
 5     2 
 6    73 ############
 7   148 ########################
 8    56 #########
 9    18 ###
10     3 
```

```
enemy-d+enemy-d (normal)
 5     8 ##
 6    46 #########
 7    86 #################
 8   120 ########################
 9    36 #######
10     4 #
```

```
enemy-b (normal)
 7    10 ##
 8    48 ########
 9   136 ########################
10    55 ##########
11    39 #######
12     9 ##
13     2 
14     1 
```

```
enemy-b+enemy-d (normal)
 6     1 
 8    17 #####
 9    10 ###
10    80 ########################
11    58 #################
12    52 ################
13    54 ################
14    24 #######
15+    4 #
```

```
enemy-c (normal)
 6     2 #
 8    52 #############
 9    11 ###
10    80 ####################
11    96 ########################
12    40 ##########
13    18 #####
14     1 
```

```
enemy-a+enemy-d (normal)
 4     4 #
 5    56 ############
 6    43 #########
 7    10 ##
 8   109 ########################
 9    24 #####
10    37 ########
11    17 ####
```

```
enemy-d+enemy-d+enemy-d (normal)
 4     4 #
 5    81 ##################
 6    10 ##
 7   106 ########################
 8    31 #######
 9    19 ####
10    21 #####
11    22 #####
12     5 #
13     1 
```

```
enemy-a+enemy-b (normal)
 4    30 ####
 5    15 ##
 6   189 ########################
 7     9 #
 8    47 ######
 9     1 
10     6 #
12     1 
14     2 
```

```
enemy-c+enemy-d (normal)
 5     9 ##
 6    54 ##########
 7    14 ###
 8   130 ########################
 9     4 #
10    24 ####
11    13 ##
12     4 #
13    28 #####
14    11 ##
15+    9 ##
```

```
enemy-b+enemy-d+enemy-d (normal)
 4    16 ####
 5    62 ################
 6    92 ########################
 7    36 #########
 8    49 #############
10    29 ########
12     2 #
13     2 #
14     4 #
15+    8 ##
```

```
enemy-a+enemy-b+enemy-d (normal)
 4   256 ########################
 5    37 ###
 6     7 #
```

```
enemy-b+enemy-c (normal)
 5    11 #
 6   189 ########################
 7     2 
 8    78 ##########
 9     2 
10    18 ##
```

```
elite-a (elite)
 5    31 #####
 6     5 #
 7   165 ########################
 8     6 #
 9    64 #########
10     3 
11    21 ###
12     4 #
13     1 
```

```
elite-b (elite)
 6    14 ##
 7    25 ####
 8     3 
 9   148 ########################
10    10 ##
11     5 #
12    38 ######
13    25 ####
14    16 ###
15+   16 ###
```

```
boss-a (boss)
 6     7 #
 7   195 ########################
 8     6 #
 9    69 ########
10     2 
12     6 #
13    15 ##
```

### greedy bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 7.54 [7.38, 7.70] | 6 | 7 | 10 | 3-6 | HIGH |
| enemy-d+enemy-d | normal | 7.30 [7.15, 7.45] | 6 | 7 | 9 | 3-6 | HIGH |
| enemy-b | normal | 8.02 [7.91, 8.14] | 7 | 8 | 9 | 3-6 | HIGH |
| enemy-b+enemy-d | normal | 11.09 [10.93, 11.25] | 9 | 11 | 13 | 3-6 | HIGH |
| enemy-c | normal | 10.94 [10.80, 11.09] | 9 | 11 | 12 | 3-6 | HIGH |
| enemy-a+enemy-d | normal | 10.31 [10.15, 10.46] | 9 | 10 | 11 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 10.03 [9.90, 10.16] | 9 | 10 | 12 | 3-6 | HIGH |
| enemy-a+enemy-b | normal | 9.57 [9.22, 9.92] | 6 | 10 | 13 | 3-6 | HIGH |
| enemy-c+enemy-d | normal | 12.69 [12.47, 12.91] | 10 | 13 | 14 | 3-6 | HIGH |
| enemy-b+enemy-d+enemy-d | normal | 13.12 [12.86, 13.39] | 10 | 13 | 15 | 3-6 | HIGH |
| enemy-a+enemy-b+enemy-d | normal | 5.27 [5.15, 5.39] | 4 | 6 | 6 | 3-6 | ok |
| enemy-b+enemy-c | normal | 8.66 [8.47, 8.85] | 6.900000000000002 | 8 | 11 | 3-6 | HIGH |
| elite-a | elite | 8.98 [8.81, 9.15] | 7 | 9 | 11 | 5-9 | ok |
| elite-b | elite | 12.83 [12.59, 13.07] | 9 | 13 | 16 | 5-9 | HIGH |
| boss-a | boss | 9.02 [8.81, 9.22] | 7 | 9 | 12 | 8-14 | ok |

```
enemy-a (normal)
 6    60 #########
 7   155 ########################
 8    10 ##
 9    33 #####
10    22 ###
11    20 ###
```

```
enemy-d+enemy-d (normal)
 5     2 
 6   105 ########################
 7    84 ###################
 8    42 ##########
 9    52 ############
10     8 ##
11     7 ##
```

```
enemy-b (normal)
 7   114 ########################
 8    92 ###################
 9    79 #################
10     3 #
11    12 ###
```

```
enemy-b+enemy-d (normal)
 9    38 #######
10    54 ##########
11   126 ########################
12    39 #######
13    30 ######
14     2 
15+   11 ##
```

```
enemy-c (normal)
 8     1 
 9    54 ##############
10    50 #############
11    82 #####################
12    92 ########################
13    11 ###
14    10 ###
```

```
enemy-a+enemy-d (normal)
 7     2 
 8     9 ##
 9    69 ###############
10   107 ########################
11    84 ###################
12     5 #
13    12 ###
14     5 #
15+    7 ##
```

```
enemy-d+enemy-d+enemy-d (normal)
 8     4 #
 9   122 ########################
10    88 #################
11    37 #######
12    45 #########
13     3 #
14     1 
```

```
enemy-a+enemy-b (normal)
 4     3 #
 5     2 #
 6    85 ########################
 7    12 ###
 8    27 ########
 9    16 #####
10    41 ############
11    10 ###
12    20 ######
13    59 #################
14    12 ###
15+   13 ####
```

```
enemy-c+enemy-d (normal)
 8    10 ##
 9     3 #
10    40 ##########
11    27 ######
12    20 #####
13   101 ########################
14    70 #################
15+   29 #######
```

```
enemy-b+enemy-d+enemy-d (normal)
 6     9 ##
 7     2 
 8     3 #
 9     3 #
10    28 #######
11     8 ##
12    21 #####
13    98 ########################
14    49 ############
15+   79 ###################
```

```
enemy-a+enemy-b+enemy-d (normal)
 4   101 ################
 5    34 #####
 6   156 ########################
 7     1 
 8     8 #
```

```
enemy-b+enemy-c (normal)
 6    30 #####
 7    12 ##
 8   153 ########################
 9     8 #
10    61 ##########
11    21 ###
12     4 #
13     8 #
14     1 
15+    2 
```

```
elite-a (elite)
 5     3 
 6     2 
 7    66 ###########
 8     5 #
 9   150 ########################
10    17 ###
11    44 #######
12     7 #
13     6 #
```

```
elite-b (elite)
 8     1 
 9    37 ###########
10     7 ##
11    11 ###
12    79 ########################
13    49 ###############
14    54 ################
15+   62 ###################
```

```
boss-a (boss)
 6     2 
 7    80 ##############
 8    18 ###
 9   141 ########################
10     2 
11     8 #
12    25 ####
13    24 ####
```

### smart bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 5.62 [5.55, 5.68] | 5 | 6 | 6 | 3-6 | ok |
| enemy-d+enemy-d | normal | 5.67 [5.59, 5.75] | 5 | 6 | 6 | 3-6 | ok |
| enemy-b | normal | 6.88 [6.80, 6.95] | 6 | 7 | 8 | 3-6 | HIGH |
| enemy-b+enemy-d | normal | 8.78 [8.64, 8.93] | 7 | 9 | 11 | 3-6 | HIGH |
| enemy-c | normal | 8.49 [8.39, 8.60] | 7 | 8 | 10 | 3-6 | HIGH |
| enemy-a+enemy-d | normal | 7.73 [7.58, 7.89] | 6 | 8 | 9 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 7.71 [7.57, 7.85] | 6 | 8 | 9 | 3-6 | HIGH |
| enemy-a+enemy-b | normal | 9.19 [8.84, 9.53] | 6 | 9 | 13 | 3-6 | HIGH |
| enemy-c+enemy-d | normal | 9.77 [9.52, 10.01] | 8 | 9 | 13 | 3-6 | HIGH |
| enemy-b+enemy-d+enemy-d | normal | 10.85 [10.59, 11.11] | 8 | 10 | 14 | 3-6 | HIGH |
| enemy-a+enemy-b+enemy-d | normal | 4.49 [4.39, 4.58] | 4 | 4 | 6 | 3-6 | ok |
| enemy-b+enemy-c | normal | 6.72 [6.58, 6.86] | 6 | 6 | 8 | 3-6 | HIGH |
| elite-a | elite | 7.85 [7.70, 8.01] | 7 | 7 | 10 | 5-9 | ok |
| elite-b | elite | 9.90 [9.72, 10.09] | 9 | 9 | 12 | 5-9 | HIGH |
| boss-a | boss | 8.19 [7.99, 8.40] | 7 | 7 | 12 | 8-14 | ok |

```
enemy-a (normal)
 4     1 
 5   129 ####################
 6   155 ########################
 7    14 ##
 8     1 
```

```
enemy-d+enemy-d (normal)
 4     8 #
 5   114 ##################
 6   149 ########################
 7    28 #####
 8     1 
```

```
enemy-b (normal)
 6    77 ##########
 7   188 ########################
 8    30 ####
 9     5 #
```

```
enemy-b+enemy-d (normal)
 6     2 #
 7    52 ##############
 8    76 #####################
 9    88 ########################
10    45 ############
11    35 ##########
12     2 #
```

```
enemy-c (normal)
 7    34 ######
 8   130 ########################
 9   100 ##################
10    26 #####
11    10 ##
```

```
enemy-a+enemy-d (normal)
 4     1 
 5    20 #####
 6    41 ##########
 7    48 ############
 8    98 ########################
 9    75 ##################
10    12 ###
11     5 #
```

```
enemy-d+enemy-d+enemy-d (normal)
 5    16 ###
 6    37 ########
 7    55 ###########
 8   118 ########################
 9    60 ############
10    11 ##
11     3 #
```

```
enemy-a+enemy-b (normal)
 4     9 ##
 5     2 
 6   100 ########################
 8     5 #
 9    46 ###########
10    52 ############
11     4 #
12    15 ####
13    39 #########
14    19 #####
15+    9 ##
```

```
enemy-c+enemy-d (normal)
 6    12 ##
 7     1 
 8   134 ########################
 9     5 #
10    39 #######
11    22 ####
12    37 #######
13    43 ########
14     6 #
15+    1 
```

```
enemy-b+enemy-d+enemy-d (normal)
 4     1 
 6    14 ####
 7     6 ##
 8    18 #####
 9    41 ############
10    79 ########################
11    15 #####
12    27 ########
13    64 ###################
14    24 #######
15+   11 ###
```

```
enemy-a+enemy-b+enemy-d (normal)
 4   212 ########################
 5    37 ####
 6    48 #####
 8     2 
 9     1 
```

```
enemy-b+enemy-c (normal)
 6   211 ########################
 8    73 ########
10    15 ##
15+    1 
```

```
elite-a (elite)
 5     5 #
 7   189 ########################
 9    74 #########
10    12 ##
11    18 ##
12     2 
```

```
elite-b (elite)
 6     5 #
 7     9 #
 8     7 #
 9   167 ########################
10    10 #
11    33 #####
12    42 ######
13    26 ####
14     1 
```

```
boss-a (boss)
 6     3 
 7   178 ########################
 9    86 ############
12     9 #
13    24 ###
```


## Card effect: ablation and addition

Each row compares the starter deck WITH the card against the same deck WITHOUT it, on identical seeds (paired). Changes are "with minus without"; a negative HP-lost change is good for the player. Brackets are 95% confidence intervals. 15 fights x 60 seeds = 900 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.
Verdict reads the headline metric (HP lost, negligible if within +-1): INCONCLUSIVE means the interval spans zero and is too wide to call the card negligible. Add seeds before concluding anything.
A card added to the starter deck shows its stand-alone value. Cards that need partners (synergy) will look weak here; see the pair experiment.

### random bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| test-buffer | skill | 1 | no | +51.7 [+48.4, +54.9] pts | -23.0 [-24.4, -21.7] | +7.93 [+7.40, +8.47] | better |
| end-guard | power | 1 | yes | +13.6 [+11.3, +15.9] pts | -4.1 [-4.6, -3.6] | +1.85 [+1.69, +2.01] | better |
| test-intangible | skill | 1 | no | +16.8 [+14.3, +19.3] pts | -4.0 [-4.5, -3.4] | +3.51 [+3.28, +3.75] | better |
| attack-echo | power | 1 | yes | +13.7 [+11.4, +16.0] pts | -3.9 [-4.3, -3.4] | +1.70 [+1.54, +1.85] | better |
| heat-flash | attack | 0 | yes | +12.2 [+10.0, +14.5] pts | -3.6 [-4.1, -3.1] | +0.79 [+0.63, +0.94] | better |
| cryofreeze | power | 2 | yes | +12.8 [+10.5, +15.0] pts | -3.0 [-3.4, -2.5] | +1.63 [+1.46, +1.80] | better |
| pain-engine | power | 1 | yes | +15.2 [+12.8, +17.6] pts | -2.1 [-2.5, -1.7] | -0.49 [-0.62, -0.37] | better |
| fortify | power | 2 | yes | +8.3 [+6.4, +10.3] pts | -1.9 [-2.4, -1.5] | +1.26 [+1.10, +1.41] | better |
| test-innate | skill | 0 | no | +6.7 [+4.8, +8.6] pts | -1.8 [-2.2, -1.4] | +0.88 [+0.74, +1.01] | better |
| prime-a | skill | 0 | yes | +5.6 [+3.7, +7.4] pts | -1.8 [-2.2, -1.4] | +0.98 [+0.84, +1.12] | better |
| guarded-strike | attack | 1 | yes | +6.2 [+4.5, +7.9] pts | -1.7 [-2.1, -1.3] | +0.61 [+0.48, +0.74] | better |
| ice-barrier | skill | 1 | yes | +5.0 [+3.3, +6.7] pts | -1.5 [-1.9, -1.1] | +1.72 [+1.56, +1.88] | better |
| strengthen | power | 1 | yes | +6.6 [+4.8, +8.3] pts | -1.3 [-1.7, -1.0] | -0.46 [-0.58, -0.34] | better |
| apocalyptic-flame | attack | 3 | yes | +6.8 [+4.8, +8.7] pts | -1.3 [-1.7, -1.0] | -0.84 [-0.97, -0.71] | better |
| jab | attack | 0 | yes | +3.9 [+2.3, +5.5] pts | -1.1 [-1.5, -0.7] | -0.20 [-0.31, -0.08] | better |
| big-block | skill | 2 | yes | +2.2 [+0.8, +3.7] pts | -1.1 [-1.5, -0.7] | +1.67 [+1.51, +1.82] | better |
| frozen-shield | skill | 1 | yes | +3.1 [+1.6, +4.7] pts | -0.9 [-1.3, -0.6] | +1.19 [+1.05, +1.34] | better |
| heat-warning | attack | 1 | yes | +5.1 [+3.4, +6.8] pts | -0.9 [-1.2, -0.5] | -0.59 [-0.71, -0.46] | better |
| weaken | skill | 1 | yes | +2.7 [+1.3, +4.1] pts | -0.7 [-1.1, -0.4] | +1.26 [+1.11, +1.40] | better |
| opening-spark | power | 1 | yes | +3.1 [+1.5, +4.7] pts | -0.7 [-1.0, -0.3] | -0.42 [-0.54, -0.30] | better |
| block-spark | power | 1 | yes | +2.9 [+1.3, +4.5] pts | -0.7 [-1.0, -0.3] | -0.41 [-0.53, -0.29] | better |
| heavy-hit | attack | 3 | yes | +3.0 [+1.4, +4.6] pts | -0.6 [-0.9, -0.3] | -0.75 [-0.87, -0.63] | better |
| crippling-heat | attack | 1 | yes | +3.3 [+1.8, +4.9] pts | -0.6 [-0.9, -0.3] | +0.34 [+0.21, +0.47] | better |
| cauterize | skill | 1 | yes | +1.0 [-0.3, +2.3] pts | -0.6 [-0.9, -0.2] | +1.00 [+0.86, +1.13] | better |
| scorching-wind | attack | 0 | yes | +2.7 [+1.1, +4.2] pts | -0.5 [-0.9, -0.2] | -0.11 [-0.23, +0.00] | better |
| hand-strike | attack | 1 | yes | +2.3 [+0.9, +3.7] pts | -0.4 [-0.8, -0.1] | -0.48 [-0.60, -0.36] | better |
| combo-strike | attack | 1 | yes | +2.3 [+0.9, +3.7] pts | -0.4 [-0.7, -0.0] | -0.48 [-0.60, -0.37] | better |
| endless-winter | power | 1 | yes | +3.3 [+1.7, +4.9] pts | -0.4 [-0.7, -0.0] | +0.46 [+0.32, +0.60] | better |
| test-retain | skill | 1 | no | +0.8 [-0.5, +2.0] pts | -0.3 [-0.6, +0.0] | +0.91 [+0.76, +1.05] | negligible |
| ice-block | skill | 3 | yes | +1.8 [+0.4, +3.1] pts | -0.2 [-0.6, +0.2] | +1.78 [+1.60, +1.96] | negligible |
| defend | skill | 1 | yes | +0.6 [-0.7, +1.8] pts | -0.2 [-0.5, +0.1] | +0.80 [+0.67, +0.93] | negligible |
| single-use-strike | attack | 1 | yes | +0.3 [-1.0, +1.6] pts | -0.1 [-0.5, +0.2] | -0.23 [-0.35, -0.12] | negligible |
| cull | skill | 0 | yes | -0.3 [-1.5, +0.8] pts | -0.1 [-0.4, +0.2] | -0.00 [-0.13, +0.13] | negligible |
| test-ethereal | attack | 1 | no | +1.1 [-0.1, +2.3] pts | -0.0 [-0.3, +0.3] | -0.31 [-0.43, -0.20] | negligible |
| power-up | skill | 1 | yes | +0.6 [-0.7, +1.8] pts | +0.0 [-0.3, +0.3] | -0.44 [-0.56, -0.32] | negligible |
| strike | attack | 1 | yes | +0.4 [-0.8, +1.7] pts | +0.1 [-0.2, +0.4] | -0.40 [-0.52, -0.29] | negligible |
| sunder | attack | 2 | yes | +0.7 [-0.7, +2.1] pts | +0.1 [-0.2, +0.4] | -0.75 [-0.87, -0.63] | negligible |
| expose | skill | 1 | yes | +1.1 [-0.2, +2.4] pts | +0.1 [-0.2, +0.5] | -0.44 [-0.56, -0.32] | negligible |
| test-unplayable | skill | 0 | no | +0.8 [-0.5, +2.1] pts | +0.1 [-0.2, +0.5] | +0.09 [-0.03, +0.20] | negligible |
| bolt | attack | 2 | yes | -0.4 [-1.6, +0.7] pts | +0.2 [-0.1, +0.6] | -0.70 [-0.81, -0.58] | negligible |
| kill-reward | power | 1 | yes | +0.0 [-1.4, +1.4] pts | +0.4 [+0.1, +0.7] | -0.13 [-0.25, -0.00] | worse |
| meteor-shower | attack | 2 | yes | +0.3 [-1.0, +1.6] pts | +0.5 [+0.2, +0.8] | -0.56 [-0.68, -0.44] | worse |
| tag-a-echo | power | 1 | yes | -0.3 [-1.5, +0.9] pts | +0.5 [+0.2, +0.8] | -0.13 [-0.25, -0.01] | worse |
| double-strength | skill | 1 | yes | -0.3 [-1.5, +0.9] pts | +0.5 [+0.2, +0.8] | -0.13 [-0.25, -0.01] | worse |
| exhaust-engine | power | 1 | yes | -0.3 [-1.5, +0.9] pts | +0.5 [+0.2, +0.8] | -0.13 [-0.25, -0.01] | worse |
| hungering-cold | power | 1 | yes | -0.3 [-1.5, +0.9] pts | +0.5 [+0.2, +0.8] | -0.13 [-0.25, -0.01] | worse |
| focus | power | 1 | yes | -0.8 [-2.0, +0.4] pts | +0.6 [+0.3, +0.9] | -0.10 [-0.22, +0.02] | worse |
| opportunist | attack | 1 | yes | -0.2 [-1.5, +1.0] pts | +0.7 [+0.4, +1.1] | -0.30 [-0.42, -0.19] | worse |
| blood-strike | attack | 1 | yes | +0.0 [-1.1, +1.1] pts | +0.8 [+0.5, +1.1] | -1.39 [-1.51, -1.27] | worse |
| block-slam | attack | 1 | yes | -0.9 [-2.0, +0.2] pts | +1.0 [+0.7, +1.4] | -0.26 [-0.38, -0.15] | worse |
| tag-a-payoff | attack | 1 | yes | -0.7 [-1.9, +0.5] pts | +1.0 [+0.7, +1.4] | -0.25 [-0.37, -0.13] | worse |
| heating-up | skill | 1 | yes | -1.1 [-2.3, +0.0] pts | +1.1 [+0.7, +1.4] | -0.28 [-0.41, -0.16] | worse |
| glaciate | attack | 2 | yes | -1.4 [-2.6, -0.3] pts | +1.1 [+0.8, +1.5] | -0.56 [-0.68, -0.44] | worse |
| exhaust-payoff | attack | 1 | yes | -1.0 [-2.1, +0.1] pts | +1.3 [+1.0, +1.7] | -0.21 [-0.33, -0.09] | worse |
| arctic-strike | attack | 1 | yes | -1.0 [-2.1, +0.1] pts | +1.3 [+1.0, +1.7] | -0.21 [-0.33, -0.09] | worse |
| hypothermia | skill | 1 | yes | -1.7 [-2.7, -0.7] pts | +1.6 [+1.2, +2.0] | -0.07 [-0.20, +0.05] | worse |
| glacial-spike | skill | 1 | yes | -1.7 [-2.7, -0.7] pts | +1.6 [+1.2, +2.0] | -0.07 [-0.20, +0.05] | worse |
| test-frail | skill | 1 | no | -1.7 [-2.7, -0.6] pts | +1.8 [+1.4, +2.2] | -0.11 [-0.23, +0.02] | worse |
| quick-draw | skill | 1 | yes | -2.1 [-3.2, -1.0] pts | +1.9 [+1.5, +2.3] | -0.10 [-0.23, +0.04] | worse |
| molten-core | skill | 2 | yes | -3.4 [-4.7, -2.2] pts | +2.4 [+2.0, +2.9] | -0.27 [-0.41, -0.13] | worse |
| absolute-zero | skill | 3 | yes | -4.0 [-5.4, -2.6] pts | +2.8 [+2.3, +3.3] | -0.19 [-0.33, -0.05] | worse |

### random bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| test-buffer | skill | 1 | no | +55.1 [+51.9, +58.4] pts | -26.6 [-28.0, -25.3] | +9.91 [+9.32, +10.50] | better |
| heat-flash | attack | 0 | yes | +15.6 [+13.1, +18.0] pts | -4.8 [-5.3, -4.2] | +1.67 [+1.50, +1.83] | better |
| test-intangible | skill | 1 | no | +16.1 [+13.6, +18.6] pts | -4.5 [-5.1, -3.9] | +5.01 [+4.73, +5.28] | better |
| end-guard | power | 1 | yes | +14.4 [+12.1, +16.8] pts | -4.4 [-4.9, -3.9] | +2.76 [+2.59, +2.94] | better |
| cryofreeze | power | 2 | yes | +14.4 [+12.1, +16.8] pts | -3.8 [-4.3, -3.3] | +2.66 [+2.47, +2.85] | better |
| attack-echo | power | 1 | yes | +11.2 [+9.0, +13.4] pts | -3.6 [-4.1, -3.2] | +2.33 [+2.18, +2.49] | better |
| fortify | power | 2 | yes | +10.6 [+8.4, +12.7] pts | -2.6 [-3.1, -2.2] | +2.20 [+2.03, +2.37] | better |
| prime-a | skill | 0 | yes | +7.9 [+6.0, +9.8] pts | -2.6 [-3.0, -2.2] | +1.73 [+1.59, +1.87] | better |
| pain-engine | power | 1 | yes | +15.7 [+13.3, +18.1] pts | -2.6 [-3.0, -2.2] | +0.07 [-0.06, +0.19] | better |
| test-innate | skill | 0 | no | +6.6 [+4.7, +8.4] pts | -2.4 [-2.8, -2.0] | +1.80 [+1.65, +1.94] | better |
| ice-barrier | skill | 1 | yes | +5.7 [+3.9, +7.5] pts | -2.2 [-2.6, -1.7] | +2.64 [+2.46, +2.81] | better |
| apocalyptic-flame | attack | 3 | yes | +8.7 [+6.7, +10.7] pts | -1.9 [-2.3, -1.5] | -0.43 [-0.57, -0.30] | better |
| guarded-strike | attack | 1 | yes | +5.3 [+3.9, +6.8] pts | -1.9 [-2.2, -1.6] | +1.23 [+1.14, +1.31] | better |
| strengthen | power | 1 | yes | +6.4 [+4.6, +8.3] pts | -1.6 [-1.9, -1.3] | +0.15 [+0.03, +0.28] | better |
| jab | attack | 0 | yes | +4.6 [+2.9, +6.2] pts | -1.5 [-1.8, -1.2] | +0.37 [+0.25, +0.49] | better |
| frozen-shield | skill | 1 | yes | +2.2 [+1.1, +3.4] pts | -1.2 [-1.4, -0.9] | +1.87 [+1.76, +1.98] | better |
| heat-warning | attack | 1 | yes | +4.9 [+3.4, +6.3] pts | -1.1 [-1.4, -0.9] | -0.23 [-0.28, -0.18] | better |
| scorching-wind | attack | 0 | yes | +2.9 [+1.5, +4.3] pts | -1.1 [-1.4, -0.8] | +0.47 [+0.35, +0.60] | better |
| big-block | skill | 2 | yes | +3.2 [+1.7, +4.7] pts | -1.1 [-1.5, -0.7] | +2.70 [+2.52, +2.88] | better |
| weaken | skill | 1 | yes | +2.3 [+1.1, +3.6] pts | -1.0 [-1.3, -0.8] | +2.03 [+1.91, +2.15] | better |
| cauterize | skill | 1 | yes | +1.8 [+0.4, +3.1] pts | -1.0 [-1.3, -0.6] | +1.91 [+1.75, +2.06] | better |
| block-spark | power | 1 | yes | +3.8 [+2.2, +5.4] pts | -0.9 [-1.2, -0.6] | +0.13 [+0.01, +0.25] | better |
| opening-spark | power | 1 | yes | +3.6 [+2.0, +5.1] pts | -0.9 [-1.2, -0.6] | +0.14 [+0.02, +0.26] | better |
| endless-winter | power | 1 | yes | +3.7 [+2.1, +5.2] pts | -0.9 [-1.2, -0.6] | +1.27 [+1.12, +1.41] | better |
| heavy-hit | attack | 3 | yes | +3.8 [+2.2, +5.3] pts | -0.8 [-1.2, -0.5] | -0.34 [-0.47, -0.22] | better |
| crippling-heat | attack | 1 | yes | +2.3 [+1.2, +3.5] pts | -0.8 [-1.0, -0.6] | +0.87 [+0.79, +0.95] | better |
| test-retain | skill | 1 | no | +1.0 [-0.3, +2.3] pts | -0.6 [-1.0, -0.3] | +1.63 [+1.49, +1.78] | better |
| hand-strike | attack | 1 | yes | +2.9 [+1.8, +4.0] pts | -0.6 [-0.8, -0.5] | -0.11 [-0.15, -0.06] | better |
| defend | skill | 1 | yes | +0.9 [-0.4, +2.2] pts | -0.6 [-0.9, -0.2] | +1.61 [+1.46, +1.76] | better |
| power-up | skill | 1 | yes | +1.6 [+0.2, +2.9] pts | -0.5 [-0.8, -0.2] | +0.00 [-0.11, +0.12] | better |
| combo-strike | attack | 1 | yes | +2.0 [+1.0, +3.0] pts | -0.5 [-0.6, -0.3] | -0.10 [-0.14, -0.06] | better |
| ice-block | skill | 3 | yes | +1.0 [-0.5, +2.5] pts | -0.5 [-0.8, -0.1] | +2.72 [+2.53, +2.92] | better |
| sunder | attack | 2 | yes | +1.8 [+0.4, +3.2] pts | -0.3 [-0.6, -0.0] | -0.29 [-0.41, -0.18] | better |
| single-use-strike | attack | 1 | yes | +0.7 [-0.5, +1.9] pts | -0.2 [-0.5, +0.1] | +0.41 [+0.29, +0.54] | negligible |
| test-unplayable | skill | 0 | no | +0.8 [-0.5, +2.0] pts | -0.2 [-0.5, +0.1] | +0.69 [+0.57, +0.81] | negligible |
| cull | skill | 0 | yes | +0.4 [-0.8, +1.7] pts | -0.1 [-0.4, +0.2] | +0.62 [+0.47, +0.78] | negligible |
| test-ethereal | attack | 1 | no | +1.4 [+0.2, +2.7] pts | -0.1 [-0.3, +0.1] | +0.29 [+0.19, +0.38] | negligible |
| bolt | attack | 2 | yes | -0.1 [-1.2, +1.0] pts | -0.1 [-0.4, +0.2] | -0.23 [-0.34, -0.11] | negligible |
| expose | skill | 1 | yes | +0.8 [-0.0, +1.6] pts | -0.0 [-0.2, +0.1] | -0.05 [-0.09, -0.01] | negligible |
| strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| kill-reward | power | 1 | yes | -0.1 [-1.2, +1.0] pts | +0.3 [-0.0, +0.5] | +0.51 [+0.38, +0.64] | negligible |
| focus | power | 1 | yes | -0.3 [-1.6, +0.9] pts | +0.3 [-0.0, +0.6] | +0.64 [+0.51, +0.76] | negligible |
| tag-a-echo | power | 1 | yes | -0.9 [-1.9, +0.1] pts | +0.4 [+0.1, +0.7] | +0.51 [+0.39, +0.64] | worse |
| double-strength | skill | 1 | yes | -0.9 [-1.9, +0.1] pts | +0.4 [+0.1, +0.7] | +0.51 [+0.39, +0.64] | worse |
| exhaust-engine | power | 1 | yes | -0.9 [-1.9, +0.1] pts | +0.4 [+0.1, +0.7] | +0.51 [+0.39, +0.64] | worse |
| hungering-cold | power | 1 | yes | -0.9 [-1.9, +0.1] pts | +0.4 [+0.1, +0.7] | +0.51 [+0.39, +0.64] | worse |
| opportunist | attack | 1 | yes | -0.8 [-1.4, -0.2] pts | +0.6 [+0.5, +0.8] | +0.11 [+0.07, +0.15] | worse |
| meteor-shower | attack | 2 | yes | +1.0 [-0.4, +2.4] pts | +0.6 [+0.3, +1.0] | -0.01 [-0.12, +0.11] | worse |
| blood-strike | attack | 1 | yes | +0.7 [-0.3, +1.6] pts | +0.8 [+0.6, +0.9] | -1.13 [-1.21, -1.05] | worse |
| glaciate | attack | 2 | yes | -0.8 [-1.8, +0.3] pts | +0.8 [+0.5, +1.1] | -0.05 [-0.17, +0.07] | worse |
| block-slam | attack | 1 | yes | -0.9 [-1.5, -0.3] pts | +0.8 [+0.6, +1.0] | +0.16 [+0.11, +0.20] | worse |
| tag-a-payoff | attack | 1 | yes | -1.2 [-1.9, -0.5] pts | +1.0 [+0.8, +1.2] | +0.17 [+0.13, +0.22] | worse |
| heating-up | skill | 1 | yes | -1.3 [-2.5, -0.2] pts | +1.0 [+0.7, +1.4] | +0.26 [+0.13, +0.39] | worse |
| exhaust-payoff | attack | 1 | yes | -1.6 [-2.4, -0.7] pts | +1.3 [+1.1, +1.6] | +0.25 [+0.19, +0.31] | worse |
| arctic-strike | attack | 1 | yes | -1.6 [-2.4, -0.7] pts | +1.3 [+1.1, +1.6] | +0.25 [+0.19, +0.31] | worse |
| hypothermia | skill | 1 | yes | -1.3 [-2.2, -0.5] pts | +1.3 [+1.1, +1.6] | +0.43 [+0.34, +0.51] | worse |
| glacial-spike | skill | 1 | yes | -1.3 [-2.2, -0.5] pts | +1.3 [+1.1, +1.6] | +0.43 [+0.34, +0.51] | worse |
| test-frail | skill | 1 | no | -2.1 [-3.1, -1.2] pts | +1.7 [+1.4, +2.0] | +0.34 [+0.26, +0.42] | worse |
| quick-draw | skill | 1 | yes | -2.2 [-3.2, -1.2] pts | +1.7 [+1.3, +2.1] | +0.35 [+0.21, +0.49] | worse |
| molten-core | skill | 2 | yes | -3.7 [-4.9, -2.4] pts | +2.8 [+2.3, +3.3] | +0.37 [+0.22, +0.52] | worse |
| absolute-zero | skill | 3 | yes | -4.7 [-6.1, -3.2] pts | +2.9 [+2.3, +3.4] | +0.24 [+0.08, +0.40] | worse |

### greedy bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| test-buffer | skill | 1 | no | +48.4 [+45.2, +51.7] pts | -36.8 [-38.0, -35.5] | +9.51 [+8.94, +10.08] | better |
| test-intangible | skill | 1 | no | +32.3 [+29.2, +35.4] pts | -16.2 [-17.2, -15.2] | +4.32 [+3.92, +4.71] | better |
| ice-block | skill | 3 | yes | +27.4 [+24.5, +30.4] pts | -13.3 [-14.2, -12.3] | +6.09 [+5.69, +6.50] | better |
| cryofreeze | power | 2 | yes | +20.3 [+17.7, +23.0] pts | -8.2 [-8.9, -7.6] | +1.64 [+1.44, +1.85] | better |
| end-guard | power | 1 | yes | +17.1 [+14.6, +19.6] pts | -8.1 [-8.7, -7.6] | +2.09 [+1.90, +2.29] | better |
| big-block | skill | 2 | yes | +14.6 [+12.2, +16.9] pts | -8.1 [-8.7, -7.4] | +3.44 [+3.20, +3.67] | better |
| fortify | power | 2 | yes | +17.1 [+14.6, +19.6] pts | -6.0 [-6.5, -5.4] | +1.27 [+1.09, +1.45] | better |
| heat-flash | attack | 0 | yes | +16.9 [+14.4, +19.4] pts | -5.6 [-6.2, -5.1] | -0.18 [-0.35, +0.00] | better |
| guarded-strike | attack | 1 | yes | +8.0 [+6.1, +9.9] pts | -4.4 [-4.9, -4.0] | +0.44 [+0.29, +0.59] | better |
| pain-engine | power | 1 | yes | +16.6 [+14.1, +19.0] pts | -4.0 [-4.5, -3.5] | -1.50 [-1.66, -1.34] | better |
| ice-barrier | skill | 1 | yes | +6.4 [+4.7, +8.2] pts | -4.0 [-4.5, -3.4] | +1.21 [+1.03, +1.39] | better |
| attack-echo | power | 1 | yes | +6.0 [+4.3, +7.7] pts | -3.4 [-3.8, -3.0] | +1.11 [+0.97, +1.25] | better |
| frozen-shield | skill | 1 | yes | +6.3 [+4.4, +8.3] pts | -3.3 [-3.8, -2.8] | +2.28 [+2.10, +2.46] | better |
| test-retain | skill | 1 | no | +2.8 [+1.3, +4.2] pts | -3.3 [-3.8, -2.8] | +2.02 [+1.86, +2.18] | better |
| cauterize | skill | 1 | yes | +4.0 [+2.4, +5.6] pts | -3.1 [-3.5, -2.6] | +1.65 [+1.48, +1.82] | better |
| heat-warning | attack | 1 | yes | +10.1 [+8.0, +12.2] pts | -2.6 [-3.1, -2.2] | -2.08 [-2.24, -1.92] | better |
| strengthen | power | 1 | yes | +7.4 [+5.6, +9.3] pts | -2.2 [-2.6, -1.8] | -1.03 [-1.17, -0.89] | better |
| focus | power | 1 | yes | +2.8 [+1.6, +4.0] pts | -2.0 [-2.4, -1.6] | +1.17 [+1.02, +1.32] | better |
| weaken | skill | 1 | yes | +5.0 [+2.9, +7.1] pts | -2.0 [-2.5, -1.5] | +2.35 [+2.14, +2.56] | better |
| test-innate | skill | 0 | no | +3.6 [+2.1, +5.0] pts | -2.0 [-2.4, -1.6] | +0.05 [-0.08, +0.19] | better |
| prime-a | skill | 0 | yes | +2.6 [+1.0, +4.1] pts | -1.9 [-2.3, -1.5] | -0.00 [-0.15, +0.15] | better |
| defend | skill | 1 | yes | +0.4 [-0.8, +1.7] pts | -1.5 [-2.0, -1.1] | +1.39 [+1.24, +1.54] | better |
| crippling-heat | attack | 1 | yes | +4.8 [+3.0, +6.5] pts | -1.5 [-1.9, -1.1] | +0.62 [+0.46, +0.78] | better |
| heavy-hit | attack | 3 | yes | +3.2 [+1.7, +4.8] pts | -0.8 [-1.2, -0.4] | -1.74 [-1.89, -1.59] | better |
| opening-spark | power | 1 | yes | +1.6 [-0.1, +3.2] pts | -0.8 [-1.2, -0.4] | -0.94 [-1.07, -0.80] | better |
| block-spark | power | 1 | yes | +0.3 [-1.2, +1.8] pts | -0.7 [-1.0, -0.3] | -0.79 [-0.92, -0.66] | better |
| power-up | skill | 1 | yes | +1.6 [+0.1, +3.0] pts | -0.6 [-1.0, -0.2] | -1.50 [-1.64, -1.36] | better |
| endless-winter | power | 1 | yes | +3.3 [+1.7, +5.0] pts | -0.5 [-0.9, -0.0] | +0.80 [+0.64, +0.96] | better |
| jab | attack | 0 | yes | +0.4 [-0.9, +1.8] pts | -0.4 [-0.8, -0.0] | -1.28 [-1.42, -1.13] | better |
| single-use-strike | attack | 1 | yes | +0.1 [-1.1, +1.4] pts | +0.0 [-0.3, +0.4] | -0.26 [-0.38, -0.14] | negligible |
| apocalyptic-flame | attack | 3 | yes | +7.4 [+5.3, +9.6] pts | +0.0 [-0.4, +0.5] | -4.15 [-4.33, -3.97] | negligible |
| expose | skill | 1 | yes | +0.4 [-0.8, +1.7] pts | +0.1 [-0.3, +0.4] | -1.47 [-1.61, -1.33] | negligible |
| test-ethereal | attack | 1 | no | +0.0 [-1.2, +1.2] pts | +0.1 [-0.3, +0.4] | -0.71 [-0.83, -0.58] | negligible |
| sunder | attack | 2 | yes | +0.2 [-1.1, +1.5] pts | +0.5 [+0.1, +0.8] | -2.18 [-2.32, -2.04] | worse |
| combo-strike | attack | 1 | yes | -0.9 [-2.2, +0.4] pts | +0.7 [+0.4, +1.1] | -1.14 [-1.28, -1.00] | worse |
| bolt | attack | 2 | yes | -0.9 [-2.3, +0.6] pts | +0.8 [+0.4, +1.2] | -1.04 [-1.18, -0.90] | worse |
| scorching-wind | attack | 0 | yes | -1.0 [-2.4, +0.4] pts | +0.9 [+0.5, +1.3] | -1.02 [-1.16, -0.88] | worse |
| kill-reward | power | 1 | yes | -1.9 [-3.1, -0.6] pts | +1.1 [+0.8, +1.5] | -0.22 [-0.34, -0.10] | worse |
| hand-strike | attack | 1 | yes | -1.8 [-3.2, -0.4] pts | +1.2 [+0.8, +1.6] | -1.07 [-1.21, -0.93] | worse |
| strike | attack | 1 | yes | -2.1 [-3.5, -0.8] pts | +1.2 [+0.8, +1.6] | -1.06 [-1.20, -0.91] | worse |
| tag-a-echo | power | 1 | yes | -2.6 [-3.9, -1.2] pts | +1.4 [+1.0, +1.7] | -0.10 [-0.22, +0.02] | worse |
| exhaust-engine | power | 1 | yes | -2.6 [-3.9, -1.2] pts | +1.4 [+1.0, +1.7] | -0.10 [-0.22, +0.02] | worse |
| hungering-cold | power | 1 | yes | -2.6 [-3.9, -1.2] pts | +1.4 [+1.0, +1.7] | -0.10 [-0.22, +0.02] | worse |
| opportunist | attack | 1 | yes | -2.9 [-4.4, -1.4] pts | +1.8 [+1.4, +2.2] | -0.92 [-1.06, -0.77] | worse |
| tag-a-payoff | attack | 1 | yes | -3.1 [-4.6, -1.6] pts | +1.9 [+1.5, +2.3] | -0.90 [-1.04, -0.76] | worse |
| exhaust-payoff | attack | 1 | yes | -3.1 [-4.6, -1.6] pts | +2.0 [+1.6, +2.4] | -0.87 [-1.01, -0.72] | worse |
| arctic-strike | attack | 1 | yes | -3.1 [-4.6, -1.6] pts | +2.0 [+1.6, +2.4] | -0.87 [-1.01, -0.72] | worse |
| block-slam | attack | 1 | yes | -4.4 [-6.1, -2.8] pts | +2.4 [+2.0, +2.8] | -0.84 [-0.99, -0.69] | worse |
| double-strength | skill | 1 | yes | -4.4 [-6.1, -2.8] pts | +2.4 [+2.0, +2.8] | -0.84 [-0.99, -0.69] | worse |
| cull | skill | 0 | yes | -4.4 [-6.1, -2.8] pts | +2.4 [+2.0, +2.8] | -0.84 [-0.99, -0.69] | worse |
| meteor-shower | attack | 2 | yes | -4.4 [-6.1, -2.8] pts | +2.4 [+2.0, +2.8] | -0.84 [-0.99, -0.69] | worse |
| molten-core | skill | 2 | yes | -4.4 [-6.1, -2.8] pts | +2.4 [+2.0, +2.8] | -0.84 [-0.99, -0.69] | worse |
| absolute-zero | skill | 3 | yes | -4.4 [-6.1, -2.8] pts | +2.4 [+2.0, +2.8] | -0.84 [-0.99, -0.69] | worse |
| test-unplayable | skill | 0 | no | -4.4 [-6.1, -2.8] pts | +2.4 [+2.0, +2.8] | -0.84 [-0.99, -0.69] | worse |
| glaciate | attack | 2 | yes | -4.3 [-5.9, -2.7] pts | +2.9 [+2.5, +3.3] | -0.63 [-0.79, -0.48] | worse |
| quick-draw | skill | 1 | yes | -14.7 [-17.0, -12.4] pts | +3.2 [+2.7, +3.7] | +1.34 [+1.12, +1.57] | worse |
| heating-up | skill | 1 | yes | -6.6 [-8.4, -4.7] pts | +3.4 [+2.9, +3.8] | -0.85 [-1.03, -0.68] | worse |
| hypothermia | skill | 1 | yes | -13.4 [-15.7, -11.2] pts | +4.8 [+4.3, +5.3] | +0.17 [-0.05, +0.39] | worse |
| glacial-spike | skill | 1 | yes | -13.4 [-15.7, -11.2] pts | +4.8 [+4.3, +5.3] | +0.17 [-0.05, +0.39] | worse |
| blood-strike | attack | 1 | yes | -3.9 [-5.3, -2.4] pts | +5.0 [+4.5, +5.4] | -3.36 [-3.52, -3.21] | worse |
| test-frail | skill | 1 | no | -16.4 [-18.9, -14.0] pts | +5.7 [+5.2, +6.3] | -0.24 [-0.46, -0.02] | worse |

### greedy bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| test-buffer | skill | 1 | no | +48.6 [+45.3, +51.8] pts | -38.9 [-40.1, -37.7] | +12.47 [+11.83, +13.11] | better |
| test-intangible | skill | 1 | no | +37.3 [+34.2, +40.5] pts | -21.6 [-22.7, -20.5] | +5.73 [+5.29, +6.16] | better |
| ice-block | skill | 3 | yes | +33.2 [+30.1, +36.3] pts | -18.5 [-19.4, -17.5] | +8.18 [+7.72, +8.64] | better |
| big-block | skill | 2 | yes | +18.7 [+16.1, +21.2] pts | -11.9 [-12.6, -11.1] | +4.97 [+4.70, +5.24] | better |
| cryofreeze | power | 2 | yes | +22.2 [+19.5, +24.9] pts | -11.5 [-12.3, -10.7] | +2.93 [+2.69, +3.17] | better |
| end-guard | power | 1 | yes | +20.3 [+17.7, +23.0] pts | -11.1 [-11.8, -10.4] | +3.83 [+3.60, +4.06] | better |
| fortify | power | 2 | yes | +20.2 [+17.6, +22.8] pts | -9.3 [-10.0, -8.7] | +2.55 [+2.33, +2.77] | better |
| heat-flash | attack | 0 | yes | +21.2 [+18.5, +23.9] pts | -8.5 [-9.1, -7.9] | +0.68 [+0.49, +0.87] | better |
| guarded-strike | attack | 1 | yes | +13.3 [+11.1, +15.6] pts | -6.9 [-7.4, -6.4] | +1.65 [+1.47, +1.82] | better |
| frozen-shield | skill | 1 | yes | +11.1 [+9.0, +13.2] pts | -6.5 [-7.0, -5.9] | +4.19 [+3.96, +4.41] | better |
| pain-engine | power | 1 | yes | +19.9 [+17.3, +22.5] pts | -6.4 [-6.9, -5.9] | -0.38 [-0.55, -0.20] | better |
| ice-barrier | skill | 1 | yes | +9.9 [+7.9, +11.9] pts | -6.1 [-6.7, -5.5] | +2.55 [+2.36, +2.74] | better |
| cauterize | skill | 1 | yes | +8.7 [+6.8, +10.6] pts | -6.0 [-6.5, -5.6] | +3.21 [+3.03, +3.40] | better |
| test-retain | skill | 1 | no | +6.4 [+4.8, +8.1] pts | -5.7 [-6.2, -5.2] | +3.72 [+3.53, +3.92] | better |
| attack-echo | power | 1 | yes | +5.8 [+4.2, +7.3] pts | -5.2 [-5.7, -4.7] | +2.45 [+2.28, +2.63] | better |
| focus | power | 1 | yes | +8.0 [+6.1, +9.9] pts | -5.1 [-5.6, -4.6] | +2.84 [+2.65, +3.03] | better |
| crippling-heat | attack | 1 | yes | +10.6 [+8.5, +12.6] pts | -4.2 [-4.6, -3.8] | +1.99 [+1.82, +2.15] | better |
| heat-warning | attack | 1 | yes | +12.2 [+10.1, +14.4] pts | -4.2 [-4.6, -3.8] | -1.21 [-1.36, -1.06] | better |
| strengthen | power | 1 | yes | +10.1 [+8.1, +12.1] pts | -4.2 [-4.6, -3.8] | +0.21 [+0.06, +0.36] | better |
| weaken | skill | 1 | yes | +7.7 [+5.5, +9.9] pts | -4.1 [-4.6, -3.5] | +4.00 [+3.77, +4.23] | better |
| prime-a | skill | 0 | yes | +6.8 [+5.1, +8.4] pts | -4.0 [-4.4, -3.7] | +1.34 [+1.20, +1.47] | better |
| test-innate | skill | 0 | no | +6.2 [+4.5, +7.9] pts | -4.0 [-4.4, -3.5] | +1.27 [+1.11, +1.43] | better |
| defend | skill | 1 | yes | +2.6 [+1.4, +3.7] pts | -4.0 [-4.3, -3.6] | +2.92 [+2.76, +3.08] | better |
| opening-spark | power | 1 | yes | +5.6 [+3.9, +7.3] pts | -3.0 [-3.4, -2.6] | +0.32 [+0.17, +0.47] | better |
| block-spark | power | 1 | yes | +3.8 [+2.3, +5.3] pts | -2.7 [-3.0, -2.3] | +0.47 [+0.32, +0.61] | better |
| endless-winter | power | 1 | yes | +7.2 [+5.4, +9.0] pts | -2.6 [-3.0, -2.2] | +2.67 [+2.47, +2.87] | better |
| heavy-hit | attack | 3 | yes | +6.0 [+4.4, +7.6] pts | -2.6 [-3.0, -2.2] | -0.98 [-1.10, -0.85] | better |
| power-up | skill | 1 | yes | +4.6 [+3.2, +6.0] pts | -2.3 [-2.6, -1.9] | -0.69 [-0.82, -0.56] | better |
| single-use-strike | attack | 1 | yes | +2.4 [+1.3, +3.5] pts | -2.2 [-2.5, -1.9] | +1.04 [+0.92, +1.16] | better |
| jab | attack | 0 | yes | +2.8 [+1.6, +4.0] pts | -1.8 [-2.1, -1.5] | -0.37 [-0.46, -0.27] | better |
| test-ethereal | attack | 1 | no | +2.3 [+1.2, +3.5] pts | -1.8 [-2.1, -1.5] | +0.65 [+0.53, +0.77] | better |
| kill-reward | power | 1 | yes | +1.2 [+0.1, +2.4] pts | -1.3 [-1.6, -1.0] | +1.23 [+1.10, +1.37] | better |
| tag-a-echo | power | 1 | yes | +1.2 [+0.1, +2.4] pts | -1.1 [-1.5, -0.8] | +1.37 [+1.23, +1.51] | better |
| exhaust-engine | power | 1 | yes | +1.2 [+0.1, +2.4] pts | -1.1 [-1.5, -0.8] | +1.37 [+1.23, +1.51] | better |
| hungering-cold | power | 1 | yes | +1.2 [+0.1, +2.4] pts | -1.1 [-1.5, -0.8] | +1.37 [+1.23, +1.51] | better |
| apocalyptic-flame | attack | 3 | yes | +11.4 [+9.1, +13.8] pts | -0.8 [-1.3, -0.4] | -4.18 [-4.37, -4.00] | better |
| combo-strike | attack | 1 | yes | +1.3 [+0.5, +2.1] pts | -0.8 [-1.0, -0.7] | -0.22 [-0.29, -0.16] | better |
| bolt | attack | 2 | yes | +0.7 [-0.4, +1.7] pts | -0.7 [-0.9, -0.5] | -0.12 [-0.20, -0.04] | better |
| scorching-wind | attack | 0 | yes | +1.2 [+0.3, +2.2] pts | -0.5 [-0.7, -0.3] | -0.12 [-0.19, -0.04] | better |
| hand-strike | attack | 1 | yes | +0.2 [-0.3, +0.8] pts | -0.3 [-0.4, -0.2] | -0.03 [-0.09, +0.02] | better |
| expose | skill | 1 | yes | -0.1 [-1.4, +1.2] pts | -0.3 [-0.6, +0.0] | -0.36 [-0.47, -0.24] | negligible |
| sunder | attack | 2 | yes | +2.0 [+0.5, +3.5] pts | -0.1 [-0.4, +0.3] | -1.66 [-1.79, -1.53] | negligible |
| strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| opportunist | attack | 1 | yes | -0.8 [-1.5, -0.1] pts | +0.4 [+0.3, +0.6] | +0.21 [+0.15, +0.27] | worse |
| tag-a-payoff | attack | 1 | yes | -0.8 [-1.5, -0.1] pts | +0.6 [+0.4, +0.7] | +0.25 [+0.18, +0.32] | worse |
| exhaust-payoff | attack | 1 | yes | -1.1 [-1.9, -0.3] pts | +0.7 [+0.6, +0.9] | +0.29 [+0.22, +0.37] | worse |
| arctic-strike | attack | 1 | yes | -1.1 [-1.9, -0.3] pts | +0.7 [+0.6, +0.9] | +0.29 [+0.22, +0.37] | worse |
| block-slam | attack | 1 | yes | -1.7 [-2.7, -0.6] pts | +0.9 [+0.7, +1.2] | +0.33 [+0.23, +0.43] | worse |
| double-strength | skill | 1 | yes | -1.7 [-2.7, -0.6] pts | +0.9 [+0.7, +1.2] | +0.33 [+0.23, +0.43] | worse |
| cull | skill | 0 | yes | -1.7 [-2.7, -0.6] pts | +0.9 [+0.7, +1.2] | +0.33 [+0.23, +0.43] | worse |
| meteor-shower | attack | 2 | yes | -1.7 [-2.7, -0.6] pts | +0.9 [+0.7, +1.2] | +0.33 [+0.23, +0.43] | worse |
| molten-core | skill | 2 | yes | -1.7 [-2.7, -0.6] pts | +0.9 [+0.7, +1.2] | +0.33 [+0.23, +0.43] | worse |
| absolute-zero | skill | 3 | yes | -1.7 [-2.7, -0.6] pts | +0.9 [+0.7, +1.2] | +0.33 [+0.23, +0.43] | worse |
| test-unplayable | skill | 0 | no | -1.7 [-2.7, -0.6] pts | +0.9 [+0.7, +1.2] | +0.33 [+0.23, +0.43] | worse |
| glaciate | attack | 2 | yes | -1.8 [-2.8, -0.7] pts | +1.2 [+1.0, +1.5] | +0.42 [+0.33, +0.52] | worse |
| quick-draw | skill | 1 | yes | -13.1 [-15.3, -10.9] pts | +1.8 [+1.4, +2.3] | +3.08 [+2.83, +3.33] | worse |
| heating-up | skill | 1 | yes | -10.3 [-12.4, -8.3] pts | +3.0 [+2.6, +3.5] | +0.30 [+0.12, +0.48] | worse |
| hypothermia | skill | 1 | yes | -12.0 [-14.1, -9.9] pts | +4.1 [+3.6, +4.5] | +1.77 [+1.54, +1.99] | worse |
| glacial-spike | skill | 1 | yes | -12.0 [-14.1, -9.9] pts | +4.1 [+3.6, +4.5] | +1.77 [+1.54, +1.99] | worse |
| blood-strike | attack | 1 | yes | -2.3 [-3.6, -1.0] pts | +4.3 [+3.9, +4.7] | -2.93 [-3.05, -2.80] | worse |
| test-frail | skill | 1 | no | -15.9 [-18.3, -13.5] pts | +4.8 [+4.4, +5.3] | +1.00 [+0.77, +1.23] | worse |

### smart bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| test-buffer | skill | 1 | no | +54.4 [+51.2, +57.7] pts | -39.0 [-40.0, -37.9] | +6.55 [+6.08, +7.02] | better |
| test-intangible | skill | 1 | no | +32.4 [+29.3, +35.6] pts | -14.1 [-15.0, -13.2] | +3.75 [+3.46, +4.05] | better |
| ice-block | skill | 3 | yes | +27.4 [+24.5, +30.4] pts | -10.3 [-11.2, -9.5] | +4.72 [+4.38, +5.06] | better |
| end-guard | power | 1 | yes | +17.0 [+14.5, +19.5] pts | -6.8 [-7.3, -6.3] | +1.64 [+1.48, +1.81] | better |
| ice-barrier | skill | 1 | yes | +9.9 [+7.8, +12.0] pts | -6.5 [-7.1, -5.9] | +2.20 [+2.04, +2.35] | better |
| attack-echo | power | 1 | yes | +13.0 [+10.8, +15.2] pts | -6.1 [-6.6, -5.6] | +1.22 [+1.08, +1.37] | better |
| apocalyptic-flame | attack | 3 | yes | +13.0 [+10.7, +15.3] pts | -5.3 [-5.8, -4.9] | -1.82 [-1.95, -1.68] | better |
| big-block | skill | 2 | yes | +11.9 [+9.7, +14.1] pts | -5.0 [-5.5, -4.5] | +2.42 [+2.24, +2.60] | better |
| heat-flash | attack | 0 | yes | +12.6 [+10.2, +14.9] pts | -4.8 [-5.4, -4.3] | +0.67 [+0.53, +0.81] | better |
| cryofreeze | power | 2 | yes | +13.9 [+11.6, +16.1] pts | -4.0 [-4.4, -3.6] | +1.29 [+1.14, +1.45] | better |
| block-slam | attack | 1 | yes | +5.4 [+3.6, +7.3] pts | -3.7 [-4.1, -3.3] | +0.52 [+0.41, +0.63] | better |
| guarded-strike | attack | 1 | yes | +8.1 [+6.1, +10.1] pts | -3.0 [-3.4, -2.6] | +0.53 [+0.40, +0.66] | better |
| prime-a | skill | 0 | yes | +5.8 [+3.9, +7.6] pts | -3.0 [-3.4, -2.6] | +0.77 [+0.65, +0.89] | better |
| frozen-shield | skill | 1 | yes | +5.2 [+3.4, +7.0] pts | -2.9 [-3.3, -2.5] | +1.37 [+1.23, +1.51] | better |
| fortify | power | 2 | yes | +10.7 [+8.6, +12.7] pts | -2.9 [-3.3, -2.5] | +1.14 [+1.00, +1.28] | better |
| cauterize | skill | 1 | yes | +5.0 [+3.2, +6.8] pts | -2.9 [-3.2, -2.5] | +1.23 [+1.10, +1.36] | better |
| test-innate | skill | 0 | no | +5.7 [+3.9, +7.4] pts | -2.7 [-3.1, -2.4] | +0.74 [+0.63, +0.86] | better |
| weaken | skill | 1 | yes | +4.9 [+3.0, +6.8] pts | -2.4 [-2.8, -2.0] | +1.68 [+1.54, +1.82] | better |
| heat-warning | attack | 1 | yes | +7.0 [+5.1, +8.9] pts | -2.3 [-2.7, -1.9] | -1.83 [-1.96, -1.70] | better |
| heavy-hit | attack | 3 | yes | +5.2 [+3.3, +7.1] pts | -1.7 [-2.1, -1.4] | -1.44 [-1.55, -1.32] | better |
| test-retain | skill | 1 | no | +5.6 [+3.7, +7.4] pts | -1.7 [-2.0, -1.4] | +1.04 [+0.91, +1.17] | better |
| jab | attack | 0 | yes | +2.0 [+0.2, +3.8] pts | -1.4 [-1.8, -1.1] | -0.29 [-0.40, -0.19] | better |
| hand-strike | attack | 1 | yes | +4.1 [+2.2, +6.1] pts | -1.3 [-1.6, -0.9] | -1.08 [-1.19, -0.97] | better |
| combo-strike | attack | 1 | yes | +5.8 [+4.0, +7.6] pts | -1.2 [-1.6, -0.9] | -0.92 [-1.04, -0.81] | better |
| crippling-heat | attack | 1 | yes | +1.7 [-0.2, +3.6] pts | -1.1 [-1.5, -0.8] | +0.55 [+0.41, +0.68] | better |
| defend | skill | 1 | yes | +1.6 [-0.2, +3.3] pts | -1.1 [-1.4, -0.8] | +0.76 [+0.64, +0.88] | better |
| scorching-wind | attack | 0 | yes | -0.3 [-2.1, +1.4] pts | -1.1 [-1.3, -0.8] | -0.21 [-0.32, -0.10] | better |
| cull | skill | 0 | yes | -0.8 [-2.5, +1.0] pts | -0.9 [-1.2, -0.6] | +0.16 [+0.04, +0.28] | better |
| quick-draw | skill | 1 | yes | -2.6 [-4.2, -0.9] pts | -0.7 [-1.0, -0.4] | -0.02 [-0.13, +0.10] | better |
| power-up | skill | 1 | yes | +0.9 [-1.0, +2.8] pts | -0.7 [-1.0, -0.4] | -1.17 [-1.28, -1.06] | better |
| pain-engine | power | 1 | yes | +8.9 [+6.7, +11.1] pts | -0.6 [-0.9, -0.2] | -1.54 [-1.67, -1.40] | better |
| glaciate | attack | 2 | yes | -2.1 [-3.7, -0.5] pts | -0.6 [-0.8, -0.3] | -0.06 [-0.17, +0.05] | better |
| opening-spark | power | 1 | yes | +2.6 [+0.7, +4.4] pts | -0.6 [-0.9, -0.2] | -0.58 [-0.69, -0.48] | better |
| opportunist | attack | 1 | yes | -1.9 [-3.6, -0.2] pts | -0.5 [-0.8, -0.2] | -0.06 [-0.17, +0.06] | better |
| exhaust-payoff | attack | 1 | yes | -1.9 [-3.5, -0.3] pts | -0.5 [-0.8, -0.2] | -0.00 [-0.12, +0.11] | better |
| arctic-strike | attack | 1 | yes | -1.9 [-3.5, -0.3] pts | -0.5 [-0.8, -0.2] | -0.00 [-0.12, +0.11] | better |
| tag-a-payoff | attack | 1 | yes | -2.3 [-4.0, -0.7] pts | -0.5 [-0.8, -0.2] | -0.05 [-0.16, +0.07] | better |
| double-strength | skill | 1 | yes | -3.0 [-4.6, -1.4] pts | -0.4 [-0.7, -0.2] | -0.02 [-0.14, +0.10] | better |
| test-unplayable | skill | 0 | no | -3.0 [-4.6, -1.4] pts | -0.4 [-0.7, -0.2] | -0.02 [-0.14, +0.10] | better |
| tag-a-echo | power | 1 | yes | -2.7 [-4.2, -1.1] pts | -0.4 [-0.7, -0.1] | +0.05 [-0.07, +0.16] | better |
| exhaust-engine | power | 1 | yes | -2.7 [-4.2, -1.1] pts | -0.4 [-0.7, -0.1] | +0.05 [-0.07, +0.16] | better |
| endless-winter | power | 1 | yes | +2.3 [+0.4, +4.2] pts | -0.2 [-0.5, +0.1] | +0.48 [+0.35, +0.61] | negligible |
| block-spark | power | 1 | yes | +1.6 [-0.3, +3.4] pts | -0.1 [-0.4, +0.2] | -0.41 [-0.52, -0.31] | negligible |
| sunder | attack | 2 | yes | +2.4 [+0.6, +4.3] pts | -0.1 [-0.4, +0.3] | -1.91 [-2.04, -1.79] | negligible |
| strike | attack | 1 | yes | -2.8 [-4.4, -1.1] pts | -0.0 [-0.3, +0.2] | -0.43 [-0.54, -0.31] | negligible |
| strengthen | power | 1 | yes | +3.8 [+1.8, +5.7] pts | +0.0 [-0.3, +0.4] | -1.52 [-1.63, -1.41] | negligible |
| kill-reward | power | 1 | yes | -2.7 [-4.2, -1.1] pts | +0.1 [-0.2, +0.3] | -0.13 [-0.24, -0.02] | negligible |
| test-ethereal | attack | 1 | no | +0.8 [-1.1, +2.7] pts | +0.1 [-0.2, +0.4] | -0.84 [-0.94, -0.73] | negligible |
| expose | skill | 1 | yes | +0.9 [-0.9, +2.7] pts | +0.1 [-0.2, +0.5] | -1.61 [-1.73, -1.49] | negligible |
| single-use-strike | attack | 1 | yes | -0.3 [-1.9, +1.3] pts | +0.2 [-0.1, +0.4] | -0.21 [-0.32, -0.11] | negligible |
| focus | power | 1 | yes | +0.1 [-1.5, +1.8] pts | +0.6 [+0.3, +0.9] | +0.04 [-0.06, +0.15] | worse |
| hungering-cold | power | 1 | yes | -3.0 [-4.5, -1.5] pts | +0.6 [+0.3, +0.9] | -0.12 [-0.22, -0.01] | worse |
| heating-up | skill | 1 | yes | -4.3 [-6.3, -2.3] pts | +0.7 [+0.4, +1.0] | -1.06 [-1.18, -0.94] | worse |
| bolt | attack | 2 | yes | -4.4 [-6.3, -2.6] pts | +1.2 [+1.0, +1.5] | -1.03 [-1.14, -0.92] | worse |
| blood-strike | attack | 1 | yes | -3.3 [-5.2, -1.4] pts | +1.9 [+1.5, +2.2] | -1.63 [-1.74, -1.51] | worse |
| hypothermia | skill | 1 | yes | -11.3 [-13.5, -9.2] pts | +2.0 [+1.7, +2.3] | -0.08 [-0.23, +0.06] | worse |
| glacial-spike | skill | 1 | yes | -11.3 [-13.5, -9.2] pts | +2.0 [+1.7, +2.3] | -0.08 [-0.23, +0.06] | worse |
| test-frail | skill | 1 | no | -12.7 [-14.8, -10.5] pts | +2.2 [+1.9, +2.5] | -0.43 [-0.59, -0.28] | worse |
| meteor-shower | attack | 2 | yes | -9.7 [-11.7, -7.6] pts | +2.2 [+1.9, +2.6] | -1.10 [-1.23, -0.97] | worse |
| molten-core | skill | 2 | yes | -23.3 [-26.1, -20.6] pts | +5.1 [+4.5, +5.6] | -0.60 [-0.79, -0.41] | worse |
| absolute-zero | skill | 3 | yes | -31.9 [-34.9, -28.8] pts | +7.3 [+6.6, +8.1] | -0.85 [-1.08, -0.61] | worse |

### smart bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| test-buffer | skill | 1 | no | +54.7 [+51.4, +57.9] pts | -40.9 [-41.9, -39.9] | +7.37 [+6.89, +7.85] | better |
| test-intangible | skill | 1 | no | +37.7 [+34.5, +40.8] pts | -17.4 [-18.4, -16.4] | +4.65 [+4.33, +4.97] | better |
| ice-block | skill | 3 | yes | +32.4 [+29.4, +35.5] pts | -12.7 [-13.6, -11.8] | +5.73 [+5.37, +6.08] | better |
| end-guard | power | 1 | yes | +20.3 [+17.7, +23.0] pts | -7.6 [-8.1, -7.1] | +2.19 [+2.00, +2.38] | better |
| ice-barrier | skill | 1 | yes | +12.1 [+9.9, +14.4] pts | -7.3 [-8.0, -6.7] | +3.18 [+3.01, +3.36] | better |
| big-block | skill | 2 | yes | +16.0 [+13.6, +18.4] pts | -6.2 [-6.7, -5.6] | +3.30 [+3.10, +3.49] | better |
| attack-echo | power | 1 | yes | +13.4 [+11.2, +15.7] pts | -6.1 [-6.5, -5.6] | +1.53 [+1.38, +1.68] | better |
| heat-flash | attack | 0 | yes | +15.9 [+13.4, +18.4] pts | -5.9 [-6.4, -5.4] | +1.25 [+1.11, +1.40] | better |
| apocalyptic-flame | attack | 3 | yes | +19.9 [+17.2, +22.6] pts | -5.5 [-6.0, -5.1] | -1.77 [-1.91, -1.64] | better |
| block-slam | attack | 1 | yes | +8.1 [+6.1, +10.1] pts | -5.3 [-5.8, -4.8] | +1.20 [+1.08, +1.33] | better |
| cryofreeze | power | 2 | yes | +17.6 [+15.1, +20.0] pts | -4.5 [-5.0, -4.1] | +1.87 [+1.70, +2.04] | better |
| prime-a | skill | 0 | yes | +7.1 [+5.2, +9.1] pts | -3.8 [-4.2, -3.5] | +1.36 [+1.23, +1.48] | better |
| guarded-strike | attack | 1 | yes | +10.9 [+8.8, +12.9] pts | -3.7 [-4.1, -3.4] | +1.07 [+0.93, +1.20] | better |
| test-innate | skill | 0 | no | +8.0 [+6.0, +10.0] pts | -3.7 [-4.1, -3.3] | +1.43 [+1.30, +1.56] | better |
| frozen-shield | skill | 1 | yes | +8.7 [+6.7, +10.7] pts | -3.7 [-4.0, -3.3] | +2.10 [+1.95, +2.25] | better |
| fortify | power | 2 | yes | +13.6 [+11.3, +15.8] pts | -3.3 [-3.7, -2.9] | +1.67 [+1.52, +1.83] | better |
| cauterize | skill | 1 | yes | +7.2 [+5.3, +9.2] pts | -3.2 [-3.5, -2.8] | +1.82 [+1.69, +1.95] | better |
| heat-warning | attack | 1 | yes | +7.6 [+5.6, +9.5] pts | -2.5 [-2.8, -2.1] | -1.71 [-1.84, -1.58] | better |
| heavy-hit | attack | 3 | yes | +6.8 [+4.8, +8.7] pts | -2.4 [-2.8, -2.1] | -1.38 [-1.50, -1.26] | better |
| weaken | skill | 1 | yes | +5.7 [+3.8, +7.5] pts | -2.2 [-2.5, -1.9] | +2.37 [+2.23, +2.50] | better |
| jab | attack | 0 | yes | +3.7 [+1.9, +5.5] pts | -1.8 [-2.1, -1.5] | +0.24 [+0.15, +0.34] | better |
| hand-strike | attack | 1 | yes | +7.9 [+6.0, +9.8] pts | -1.8 [-2.1, -1.5] | -0.86 [-0.96, -0.75] | better |
| test-retain | skill | 1 | no | +5.2 [+3.5, +7.0] pts | -1.8 [-2.1, -1.5] | +1.52 [+1.40, +1.63] | better |
| combo-strike | attack | 1 | yes | +8.6 [+6.6, +10.5] pts | -1.7 [-1.9, -1.4] | -0.74 [-0.85, -0.64] | better |
| crippling-heat | attack | 1 | yes | +4.2 [+2.4, +6.1] pts | -1.5 [-1.8, -1.2] | +0.97 [+0.85, +1.09] | better |
| defend | skill | 1 | yes | +3.3 [+1.5, +5.1] pts | -1.3 [-1.5, -1.1] | +1.25 [+1.15, +1.36] | better |
| power-up | skill | 1 | yes | +3.2 [+1.3, +5.1] pts | -1.3 [-1.5, -1.0] | -1.08 [-1.18, -0.97] | better |
| scorching-wind | attack | 0 | yes | +2.3 [+0.9, +3.7] pts | -1.3 [-1.5, -1.0] | +0.35 [+0.27, +0.43] | better |
| cull | skill | 0 | yes | +2.4 [+0.7, +4.2] pts | -1.1 [-1.4, -0.9] | +0.86 [+0.73, +0.99] | better |
| quick-draw | skill | 1 | yes | -0.1 [-1.7, +1.5] pts | -1.1 [-1.3, -0.8] | +0.45 [+0.35, +0.54] | better |
| opening-spark | power | 1 | yes | +5.3 [+3.5, +7.1] pts | -1.1 [-1.3, -0.8] | -0.20 [-0.30, -0.09] | better |
| pain-engine | power | 1 | yes | +11.0 [+8.9, +13.1] pts | -1.0 [-1.4, -0.7] | -1.34 [-1.47, -1.21] | better |
| glaciate | attack | 2 | yes | +0.0 [-1.2, +1.2] pts | -0.9 [-1.1, -0.7] | +0.39 [+0.31, +0.46] | better |
| opportunist | attack | 1 | yes | -1.1 [-2.3, +0.1] pts | -0.8 [-1.0, -0.6] | +0.39 [+0.32, +0.46] | better |
| exhaust-payoff | attack | 1 | yes | -1.3 [-2.6, -0.1] pts | -0.7 [-0.9, -0.5] | +0.47 [+0.40, +0.54] | better |
| arctic-strike | attack | 1 | yes | -1.3 [-2.6, -0.1] pts | -0.7 [-0.9, -0.5] | +0.47 [+0.40, +0.54] | better |
| tag-a-payoff | attack | 1 | yes | -1.3 [-2.5, -0.1] pts | -0.7 [-0.9, -0.5] | +0.43 [+0.36, +0.50] | better |
| tag-a-echo | power | 1 | yes | +1.8 [+0.2, +3.3] pts | -0.6 [-0.9, -0.4] | +0.52 [+0.44, +0.61] | better |
| exhaust-engine | power | 1 | yes | +1.8 [+0.2, +3.3] pts | -0.6 [-0.9, -0.4] | +0.52 [+0.44, +0.61] | better |
| endless-winter | power | 1 | yes | +3.8 [+2.0, +5.5] pts | -0.6 [-0.9, -0.3] | +0.98 [+0.85, +1.10] | better |
| double-strength | skill | 1 | yes | -0.9 [-2.3, +0.5] pts | -0.6 [-0.8, -0.4] | +0.47 [+0.39, +0.56] | better |
| test-unplayable | skill | 0 | no | -0.9 [-2.3, +0.5] pts | -0.6 [-0.8, -0.4] | +0.47 [+0.39, +0.56] | better |
| block-spark | power | 1 | yes | +4.1 [+2.4, +5.8] pts | -0.6 [-0.8, -0.3] | -0.03 [-0.13, +0.07] | better |
| kill-reward | power | 1 | yes | +0.4 [-1.3, +2.2] pts | -0.2 [-0.4, +0.1] | +0.34 [+0.24, +0.43] | negligible |
| test-ethereal | attack | 1 | no | +3.2 [+1.5, +4.9] pts | -0.2 [-0.4, +0.1] | -0.54 [-0.63, -0.45] | negligible |
| single-use-strike | attack | 1 | yes | +2.6 [+0.9, +4.2] pts | -0.1 [-0.3, +0.2] | +0.20 [+0.11, +0.30] | negligible |
| strengthen | power | 1 | yes | +4.3 [+2.4, +6.2] pts | -0.0 [-0.3, +0.3] | -1.26 [-1.36, -1.15] | negligible |
| strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| sunder | attack | 2 | yes | +1.2 [-0.6, +3.1] pts | +0.1 [-0.2, +0.4] | -1.89 [-2.02, -1.76] | negligible |
| focus | power | 1 | yes | +5.0 [+3.2, +6.8] pts | +0.3 [+0.1, +0.5] | +0.47 [+0.37, +0.58] | worse |
| hungering-cold | power | 1 | yes | -0.8 [-2.4, +0.9] pts | +0.4 [+0.2, +0.7] | +0.29 [+0.20, +0.39] | worse |
| expose | skill | 1 | yes | +0.7 [-1.0, +2.4] pts | +0.7 [+0.4, +1.1] | -1.35 [-1.45, -1.24] | worse |
| bolt | attack | 2 | yes | -2.7 [-4.3, -1.0] pts | +1.4 [+1.2, +1.7] | -0.85 [-0.94, -0.75] | worse |
| heating-up | skill | 1 | yes | -6.1 [-8.0, -4.2] pts | +1.5 [+1.2, +1.8] | -0.77 [-0.88, -0.66] | worse |
| blood-strike | attack | 1 | yes | -1.1 [-2.7, +0.5] pts | +2.0 [+1.7, +2.3] | -1.45 [-1.56, -1.35] | worse |
| hypothermia | skill | 1 | yes | -11.6 [-13.6, -9.5] pts | +2.1 [+1.8, +2.4] | +0.47 [+0.33, +0.61] | worse |
| glacial-spike | skill | 1 | yes | -11.6 [-13.6, -9.5] pts | +2.1 [+1.8, +2.4] | +0.47 [+0.33, +0.61] | worse |
| meteor-shower | attack | 2 | yes | -10.3 [-12.3, -8.3] pts | +2.4 [+2.0, +2.7] | -1.14 [-1.26, -1.02] | worse |
| test-frail | skill | 1 | no | -13.2 [-15.4, -11.0] pts | +2.6 [+2.3, +2.9] | -0.00 [-0.15, +0.14] | worse |
| molten-core | skill | 2 | yes | -25.1 [-27.9, -22.3] pts | +6.0 [+5.4, +6.6] | -0.49 [-0.69, -0.29] | worse |
| absolute-zero | skill | 3 | yes | -34.3 [-37.4, -31.2] pts | +7.8 [+7.0, +8.6] | -0.78 [-1.04, -0.53] | worse |


## Pair synergy

Synergy score = (benefit of A and B together) minus (benefit of A alone + benefit of B alone), all measured against the starter deck on identical seeds, in HP lost (benefit = HP/turns saved, so positive is good). Positive means the cards help each other more than the sum of their parts; negative means they overlap or fight for the same energy and draws. Brackets are 95% CIs. Skill: smart. 15 fights x 40 seeds = 600 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.
120 of 1596 possible pairs evaluated (a deterministic random sample, --max-pairs 120); a strong pair outside the sample is not seen. Candidate cards: jab, guarded-strike, heavy-hit, big-block, quick-draw, fortify, weaken, expose, sunder, strengthen, combo-strike, block-slam, opportunist, hand-strike, prime-a, tag-a-payoff, tag-a-echo, power-up, double-strength, attack-echo, block-spark, kill-reward, pain-engine, end-guard, opening-spark, exhaust-engine, cull, single-use-strike, exhaust-payoff, blood-strike, scorching-wind, heating-up, meteor-shower, molten-core, apocalyptic-flame, crippling-heat, heat-flash, cauterize, heat-warning, ice-block, ice-barrier, hypothermia, frozen-shield, cryofreeze, endless-winter, glaciate, glacial-spike, absolute-zero, hungering-cold, arctic-strike, test-innate, test-retain, test-ethereal, test-unplayable, test-frail, test-intangible, test-buffer.
Of 120 pairs: 25 clearly synergistic, 31 clearly anti-synergistic, 51 negligible, 13 inconclusive. Each pair is a 4-way difference, so its interval is wide: with 100+ pairs tested, expect about 5% to look significant by chance. Verdicts compare each pair with the TYPICAL pair (the median score, -0.57 HP lost): cards that do not interact still score off zero because benefits are not additive, so zero is not the right reference when many pairs are tested (with fewer than 20 pairs the reference is zero). Treat single hits as leads and confirm a lead by re-running just that pair with more seeds (--pairs a+b --seeds 200).

### Strongest synergies
| pair | synergy score | vs typical pair |
| --- | --- | --- |
| jab + attack-echo | +2.05 [+1.40, +2.69] | better |
| attack-echo + ice-block | +1.96 [+0.74, +3.17] | better |
| guarded-strike + cryofreeze | +1.32 [+0.64, +2.01] | better |
| big-block + block-slam | +1.28 [+0.43, +2.13] | better |
| combo-strike + blood-strike | +1.21 [+0.62, +1.81] | better |
| absolute-zero + test-frail | +1.11 [+0.59, +1.63] | better |
| single-use-strike + blood-strike | +1.08 [+0.58, +1.58] | better |
| hand-strike + heating-up | +0.87 [+0.22, +1.52] | better |
| expose + power-up | +0.63 [+0.04, +1.21] | better |
| combo-strike + test-ethereal | +0.58 [-0.07, +1.23] | better |

### Negative (anti-synergistic) pairs
| pair | synergy score | vs typical pair |
| --- | --- | --- |
| ice-block + absolute-zero | -9.39 [-10.57, -8.21] | worse |
| test-intangible + test-buffer | -8.68 [-10.19, -7.17] | worse |
| molten-core + test-intangible | -7.29 [-8.61, -5.98] | worse |
| hypothermia + test-intangible | -4.54 [-5.81, -3.27] | worse |
| fortify + test-buffer | -3.96 [-4.77, -3.15] | worse |
| heavy-hit + attack-echo | -3.07 [-3.68, -2.45] | worse |
| ice-barrier + test-frail | -3.01 [-3.81, -2.22] | worse |
| hand-strike + test-buffer | -2.61 [-3.36, -1.87] | worse |
| big-block + test-frail | -2.29 [-3.04, -1.55] | worse |
| heavy-hit + test-intangible | -2.23 [-3.56, -0.90] | worse |


## Outlier report

Outlier method: within a cohort of 4 or more values, a value is flagged when its modified z-score (0.6745 * (x - median) / MAD, Iglewicz-Hoaglin) exceeds 3.5 in magnitude OR it lies outside the Tukey fences (Q1 - 1.5 IQR, Q3 + 1.5 IQR). Median/MAD/IQR are used because the cohort itself may contain the outlier. A flag means "look at this", not "this is wrong".

Cards: value = how much adding the card helps on HP lost (positive = helps), compared within all cards and within each energy-cost group. Enemies: fights are compared inside their tier (normal/elite/boss) on the mid deck set. Cohorts smaller than 4 are skipped, so small content lists produce no flags; the tier bands in the ladder report cover that case.

| kind | skill | cohort | id | metric | value | modified z | z | IQR rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| card | random | all cards | attack-echo | HP lost change when added | 3.85 | 3.21 | 0.97 | outside |
| card | random | all cards | end-guard | HP lost change when added | 4.10 | 3.42 | 1.05 | outside |
| card | random | all cards | heat-flash | HP lost change when added | 3.62 | 3.00 | 0.90 | outside |
| card | random | all cards | test-intangible | HP lost change when added | 3.98 | 3.32 | 1.01 | outside |
| card | random | all cards | test-buffer | HP lost change when added | 23.04 | 20.02 | 6.85 | outside |
| card | random | cost 1 | attack-echo | HP lost change when added | 3.85 | 3.53 | 0.82 | outside |
| card | random | cost 1 | end-guard | HP lost change when added | 4.10 | 3.76 | 0.88 | outside |
| card | random | cost 1 | test-intangible | HP lost change when added | 3.98 | 3.65 | 0.85 | outside |
| card | random | cost 1 | test-buffer | HP lost change when added | 23.04 | 21.46 | 5.87 | outside |
| card | random | cost 3 | absolute-zero | HP lost change when added | -2.76 | -3.74 | -1.45 | outside |
| card | greedy | all cards | ice-block | HP lost change when added | 13.26 | 4.05 | 1.93 | outside |
| card | greedy | all cards | test-intangible | HP lost change when added | 16.23 | 4.95 | 2.42 | outside |
| card | greedy | all cards | test-buffer | HP lost change when added | 36.76 | 11.21 | 5.75 | outside |
| card | greedy | cost 1 | test-intangible | HP lost change when added | 16.23 | 5.34 | 2.20 | outside |
| card | greedy | cost 1 | test-buffer | HP lost change when added | 36.76 | 12.08 | 5.22 | outside |
| card | greedy | cost 3 | ice-block | HP lost change when added | 13.26 | 5.38 | 1.47 | outside |
| card | smart | all cards | end-guard | HP lost change when added | 6.82 | 3.65 | 0.84 | inside |
| card | smart | all cards | molten-core | HP lost change when added | -5.07 | -3.30 | -1.22 | outside |
| card | smart | all cards | ice-block | HP lost change when added | 10.35 | 5.71 | 1.45 | outside |
| card | smart | all cards | absolute-zero | HP lost change when added | -7.32 | -4.62 | -1.61 | outside |
| card | smart | all cards | test-intangible | HP lost change when added | 14.08 | 7.89 | 2.10 | outside |
| card | smart | all cards | test-buffer | HP lost change when added | 38.98 | 22.44 | 6.40 | outside |
| card | smart | cost 1 | attack-echo | HP lost change when added | 6.09 | 5.32 | 0.60 | outside |
| card | smart | cost 1 | end-guard | HP lost change when added | 6.82 | 6.03 | 0.72 | outside |
| card | smart | cost 1 | ice-barrier | HP lost change when added | 6.48 | 5.70 | 0.66 | outside |
| card | smart | cost 1 | test-intangible | HP lost change when added | 14.08 | 12.96 | 1.84 | outside |
| card | smart | cost 1 | test-buffer | HP lost change when added | 38.98 | 36.72 | 5.68 | outside |

### Cards worse than adding nothing
Adding the card to the deck measurably HURTS the headline metric (paired 95% CI excludes zero). Possible dead picks, or cards that need a partner; check the pair report before judging.

| skill | card | cost | change [95% CI] |
| --- | --- | --- | --- |
| random | focus | 1 | +0.6 [+0.3, +0.9] |
| random | quick-draw | 1 | +1.9 [+1.5, +2.3] |
| random | block-slam | 1 | +1.0 [+0.7, +1.4] |
| random | opportunist | 1 | +0.7 [+0.4, +1.1] |
| random | tag-a-payoff | 1 | +1.0 [+0.7, +1.4] |
| random | tag-a-echo | 1 | +0.5 [+0.2, +0.8] |
| random | double-strength | 1 | +0.5 [+0.2, +0.8] |
| random | kill-reward | 1 | +0.4 [+0.1, +0.7] |
| random | exhaust-engine | 1 | +0.5 [+0.2, +0.8] |
| random | exhaust-payoff | 1 | +1.3 [+1.0, +1.7] |
| random | blood-strike | 1 | +0.8 [+0.5, +1.1] |
| random | heating-up | 1 | +1.1 [+0.7, +1.4] |
| random | meteor-shower | 2 | +0.5 [+0.2, +0.8] |
| random | molten-core | 2 | +2.4 [+2.0, +2.9] |
| random | hypothermia | 1 | +1.6 [+1.2, +2.0] |
| random | glaciate | 2 | +1.1 [+0.8, +1.5] |
| random | glacial-spike | 1 | +1.6 [+1.2, +2.0] |
| random | absolute-zero | 3 | +2.8 [+2.3, +3.3] |
| random | hungering-cold | 1 | +0.5 [+0.2, +0.8] |
| random | arctic-strike | 1 | +1.3 [+1.0, +1.7] |
| random | test-frail | 1 | +1.8 [+1.4, +2.2] |
| greedy | strike | 1 | +1.2 [+0.8, +1.6] |
| greedy | bolt | 2 | +0.8 [+0.4, +1.2] |
| greedy | quick-draw | 1 | +3.2 [+2.7, +3.7] |
| greedy | sunder | 2 | +0.5 [+0.1, +0.8] |
| greedy | combo-strike | 1 | +0.7 [+0.4, +1.1] |
| greedy | block-slam | 1 | +2.4 [+2.0, +2.8] |
| greedy | opportunist | 1 | +1.8 [+1.4, +2.2] |
| greedy | hand-strike | 1 | +1.2 [+0.8, +1.6] |
| greedy | tag-a-payoff | 1 | +1.9 [+1.5, +2.3] |
| greedy | tag-a-echo | 1 | +1.4 [+1.0, +1.7] |
| greedy | double-strength | 1 | +2.4 [+2.0, +2.8] |
| greedy | kill-reward | 1 | +1.1 [+0.8, +1.5] |
| greedy | exhaust-engine | 1 | +1.4 [+1.0, +1.7] |
| greedy | cull | 0 | +2.4 [+2.0, +2.8] |
| greedy | exhaust-payoff | 1 | +2.0 [+1.6, +2.4] |
| greedy | blood-strike | 1 | +5.0 [+4.5, +5.4] |
| greedy | scorching-wind | 0 | +0.9 [+0.5, +1.3] |
| greedy | heating-up | 1 | +3.4 [+2.9, +3.8] |
| greedy | meteor-shower | 2 | +2.4 [+2.0, +2.8] |
| greedy | molten-core | 2 | +2.4 [+2.0, +2.8] |
| greedy | hypothermia | 1 | +4.8 [+4.3, +5.3] |
| greedy | glaciate | 2 | +2.9 [+2.5, +3.3] |
| greedy | glacial-spike | 1 | +4.8 [+4.3, +5.3] |
| greedy | absolute-zero | 3 | +2.4 [+2.0, +2.8] |
| greedy | hungering-cold | 1 | +1.4 [+1.0, +1.7] |
| greedy | arctic-strike | 1 | +2.0 [+1.6, +2.4] |
| greedy | test-unplayable | 0 | +2.4 [+2.0, +2.8] |
| greedy | test-frail | 1 | +5.7 [+5.2, +6.3] |
| smart | bolt | 2 | +1.2 [+1.0, +1.5] |
| smart | focus | 1 | +0.6 [+0.3, +0.9] |
| smart | blood-strike | 1 | +1.9 [+1.5, +2.2] |
| smart | heating-up | 1 | +0.7 [+0.4, +1.0] |
| smart | meteor-shower | 2 | +2.2 [+1.9, +2.6] |
| smart | molten-core | 2 | +5.1 [+4.5, +5.6] |
| smart | hypothermia | 1 | +2.0 [+1.7, +2.3] |
| smart | glacial-spike | 1 | +2.0 [+1.7, +2.3] |
| smart | absolute-zero | 3 | +7.3 [+6.6, +8.1] |
| smart | hungering-cold | 1 | +0.6 [+0.3, +0.9] |
| smart | test-frail | 1 | +2.2 [+1.9, +2.5] |


## Draft policy comparison (whole runs)

100 runs per policy on seeds 1..100, fights played by the greedy bot. All policies share seeds; differences are against the first policy, run by run (paired). Win rate has a Wilson 95% interval; differences have paired 95% CIs. Verdict margin: +-5 points.
Run-level results are noisy (a run is ~12 fights; one bad fight ends it). Resolving a 5-point win-rate difference takes several hundred runs per policy. For judging individual cards or fights, prefer the fight-level experiments.

| policy | run win rate [95% CI] | avg floor [95% CI] | win change vs first | floor change vs first | verdict |
| --- | --- | --- | --- | --- | --- |
| reward=card (random pick) | 0.0% [0.0%, 3.7%] | 5.0 [4.8, 5.3] | - | - | baseline |
| reward=gold (always gold) | 0.0% [0.0%, 3.7%] | 5.1 [4.8, 5.4] | +0.0 [+0.0, +0.0] pts | +0.1 [-0.1, +0.3] | negligible |
| reward=best (trial-fight pick) | 1.0% [0.2%, 5.4%] | 5.7 [5.3, 6.1] | +1.0 [-1.0, +3.0] pts | +0.6 [+0.4, +0.8] | negligible |
| rest=heal (never upgrade) | 0.0% [0.0%, 3.7%] | 5.0 [4.8, 5.3] | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | negligible |
| path=random | 0.0% [0.0%, 3.7%] | 5.0 [4.6, 5.3] | +0.0 [+0.0, +0.0] pts | -0.1 [-0.5, +0.3] | negligible |

### Pick rates under reward=card (random pick)
Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.

| card | offered | picked | pick rate [95% CI] |
| --- | --- | --- | --- |
| block-spark | 4 | 3 | 75.0% [30.1%, 95.4%] |
| blood-strike | 17 | 10 | 58.8% [36.0%, 78.4%] |
| heat-warning | 11 | 6 | 54.5% [28.0%, 78.7%] |
| quick-draw | 15 | 8 | 53.3% [30.1%, 75.2%] |
| apocalyptic-flame | 15 | 7 | 46.7% [24.8%, 69.9%] |
| defend | 15 | 7 | 46.7% [24.8%, 69.9%] |
| glacial-spike | 22 | 10 | 45.5% [26.9%, 65.3%] |
| cull | 20 | 9 | 45.0% [25.8%, 65.8%] |
| exhaust-payoff | 9 | 4 | 44.4% [18.9%, 73.3%] |
| expose | 16 | 7 | 43.8% [23.1%, 66.8%] |
| focus | 16 | 7 | 43.8% [23.1%, 66.8%] |
| heavy-hit | 16 | 7 | 43.8% [23.1%, 66.8%] |
| hypothermia | 16 | 7 | 43.8% [23.1%, 66.8%] |
| heating-up | 14 | 6 | 42.9% [21.4%, 67.4%] |
| opening-spark | 19 | 8 | 42.1% [23.1%, 63.7%] |
| pain-engine | 12 | 5 | 41.7% [19.3%, 68.0%] |
| weaken | 17 | 7 | 41.2% [21.6%, 64.0%] |
| bolt | 15 | 6 | 40.0% [19.8%, 64.3%] |
| end-guard | 10 | 4 | 40.0% [16.8%, 68.7%] |
| jab | 19 | 7 | 36.8% [19.1%, 59.0%] |
| strike | 14 | 5 | 35.7% [16.3%, 61.2%] |
| cauterize | 17 | 6 | 35.3% [17.3%, 58.7%] |
| tag-a-payoff | 17 | 6 | 35.3% [17.3%, 58.7%] |
| arctic-strike | 12 | 4 | 33.3% [13.8%, 60.9%] |
| block-slam | 12 | 4 | 33.3% [13.8%, 60.9%] |
| crippling-heat | 12 | 4 | 33.3% [13.8%, 60.9%] |
| prime-a | 15 | 5 | 33.3% [15.2%, 58.3%] |
| scorching-wind | 15 | 5 | 33.3% [15.2%, 58.3%] |
| strengthen | 18 | 6 | 33.3% [16.3%, 56.3%] |
| sunder | 15 | 5 | 33.3% [15.2%, 58.3%] |
| tag-a-echo | 12 | 4 | 33.3% [13.8%, 60.9%] |
| ice-barrier | 13 | 4 | 30.8% [12.7%, 57.6%] |
| big-block | 10 | 3 | 30.0% [10.8%, 60.3%] |
| hand-strike | 17 | 5 | 29.4% [13.3%, 53.1%] |
| ice-block | 14 | 4 | 28.6% [11.7%, 54.6%] |
| frozen-shield | 11 | 3 | 27.3% [9.7%, 56.6%] |
| molten-core | 11 | 3 | 27.3% [9.7%, 56.6%] |
| fortify | 15 | 4 | 26.7% [10.9%, 52.0%] |
| glaciate | 15 | 4 | 26.7% [10.9%, 52.0%] |
| hungering-cold | 15 | 4 | 26.7% [10.9%, 52.0%] |
| meteor-shower | 15 | 4 | 26.7% [10.9%, 52.0%] |
| double-strength | 20 | 5 | 25.0% [11.2%, 46.9%] |
| exhaust-engine | 16 | 4 | 25.0% [10.2%, 49.5%] |
| absolute-zero | 9 | 2 | 22.2% [6.3%, 54.7%] |
| endless-winter | 14 | 3 | 21.4% [7.6%, 47.6%] |
| single-use-strike | 14 | 3 | 21.4% [7.6%, 47.6%] |
| power-up | 10 | 2 | 20.0% [5.7%, 51.0%] |
| heat-flash | 11 | 2 | 18.2% [5.1%, 47.7%] |
| opportunist | 22 | 4 | 18.2% [7.3%, 38.5%] |
| attack-echo | 18 | 3 | 16.7% [5.8%, 39.2%] |
| combo-strike | 18 | 3 | 16.7% [5.8%, 39.2%] |
| guarded-strike | 14 | 2 | 14.3% [4.0%, 39.9%] |
| cryofreeze | 16 | 2 | 12.5% [3.5%, 36.0%] |
| kill-reward | 17 | 2 | 11.8% [3.3%, 34.3%] |

### Pick rates under reward=best (trial-fight pick)
Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.

| card | offered | picked | pick rate [95% CI] |
| --- | --- | --- | --- |
| end-guard | 11 | 11 | 100.0% [74.1%, 100.0%] |
| cryofreeze | 19 | 18 | 94.7% [75.4%, 99.1%] |
| fortify | 18 | 16 | 88.9% [67.2%, 96.9%] |
| ice-block | 15 | 13 | 86.7% [62.1%, 96.3%] |
| focus | 17 | 14 | 82.4% [59.0%, 93.8%] |
| ice-barrier | 17 | 14 | 82.4% [59.0%, 93.8%] |
| heat-flash | 13 | 10 | 76.9% [49.7%, 91.8%] |
| guarded-strike | 17 | 13 | 76.5% [52.7%, 90.4%] |
| big-block | 12 | 9 | 75.0% [46.8%, 91.1%] |
| pain-engine | 17 | 12 | 70.6% [46.9%, 86.7%] |
| cauterize | 20 | 14 | 70.0% [48.1%, 85.5%] |
| weaken | 20 | 14 | 70.0% [48.1%, 85.5%] |
| strengthen | 19 | 12 | 63.2% [41.0%, 80.9%] |
| attack-echo | 18 | 10 | 55.6% [33.7%, 75.4%] |
| endless-winter | 19 | 10 | 52.6% [31.7%, 72.7%] |
| prime-a | 22 | 11 | 50.0% [30.7%, 69.3%] |
| block-spark | 5 | 2 | 40.0% [11.8%, 76.9%] |
| heat-warning | 15 | 6 | 40.0% [19.8%, 64.3%] |
| frozen-shield | 13 | 5 | 38.5% [17.7%, 64.5%] |
| scorching-wind | 17 | 6 | 35.3% [17.3%, 58.7%] |
| defend | 18 | 6 | 33.3% [16.3%, 56.3%] |
| opening-spark | 21 | 7 | 33.3% [17.2%, 54.6%] |
| power-up | 15 | 5 | 33.3% [15.2%, 58.3%] |
| crippling-heat | 13 | 4 | 30.8% [12.7%, 57.6%] |
| exhaust-payoff | 10 | 3 | 30.0% [10.8%, 60.3%] |
| single-use-strike | 16 | 4 | 25.0% [10.2%, 49.5%] |
| jab | 21 | 5 | 23.8% [10.6%, 45.1%] |
| expose | 18 | 4 | 22.2% [9.0%, 45.2%] |
| heavy-hit | 18 | 4 | 22.2% [9.0%, 45.2%] |
| strike | 14 | 3 | 21.4% [7.6%, 47.6%] |
| sunder | 14 | 3 | 21.4% [7.6%, 47.6%] |
| combo-strike | 19 | 4 | 21.1% [8.5%, 43.3%] |
| apocalyptic-flame | 20 | 4 | 20.0% [8.1%, 41.6%] |
| exhaust-engine | 16 | 3 | 18.8% [6.6%, 43.0%] |
| heating-up | 18 | 3 | 16.7% [5.8%, 39.2%] |
| tag-a-echo | 13 | 2 | 15.4% [4.3%, 42.2%] |
| double-strength | 21 | 3 | 14.3% [5.0%, 34.6%] |
| kill-reward | 22 | 3 | 13.6% [4.7%, 33.3%] |
| opportunist | 23 | 3 | 13.0% [4.5%, 32.1%] |
| tag-a-payoff | 23 | 3 | 13.0% [4.5%, 32.1%] |
| molten-core | 16 | 2 | 12.5% [3.5%, 36.0%] |
| hand-strike | 19 | 2 | 10.5% [2.9%, 31.4%] |
| block-slam | 16 | 1 | 6.3% [1.1%, 28.3%] |
| bolt | 16 | 1 | 6.3% [1.1%, 28.3%] |
| meteor-shower | 16 | 1 | 6.3% [1.1%, 28.3%] |
| arctic-strike | 17 | 1 | 5.9% [1.0%, 27.0%] |
| quick-draw | 17 | 1 | 5.9% [1.0%, 27.0%] |
| cull | 22 | 1 | 4.5% [0.8%, 21.8%] |
| glacial-spike | 22 | 1 | 4.5% [0.8%, 21.8%] |
| absolute-zero | 12 | 0 | 0.0% [0.0%, 24.2%] |
| blood-strike | 21 | 0 | 0.0% [0.0%, 15.5%] |
| glaciate | 16 | 0 | 0.0% [0.0%, 19.4%] |
| hungering-cold | 16 | 0 | 0.0% [0.0%, 19.4%] |
| hypothermia | 18 | 0 | 0.0% [0.0%, 17.6%] |

