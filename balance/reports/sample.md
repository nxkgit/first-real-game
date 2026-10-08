# Balance report

Generated 2026-10-08 by `npm run balance -- report` from the current registries. **The content measured here is all placeholder** (see implementationplan.md): treat the numbers as an example of the process, not as findings about the real game. Bot skills: random, greedy, smart. Target bands are provisional placeholders (src/sim/targets.ts). How to read this: docs/BALANCE.md.


## Fight difficulty ladder

Win rate (Wilson 95% interval), HP lost in fights that were won (mean with 95% CI) and turns (mean with 95% CI), at full starting HP, for each reference deck set: starter (the starter deck, 1 deck); mid (starter + 5 sampled cards, 3 decks); late (starter + 10 sampled cards, 3 upgraded, 3 decks); syn-tag (tag-a deck: enablers, payoff, draw power, 1 deck); syn-exhaust (exhaust deck: Cull, one-shot attacks, exhaust payoff and engine, 1 deck); syn-trigger (trigger / block deck: block triggers, Block Slam, 1 deck); syn-mult (empowered / strength multiplier deck, 1 deck); syn-combo (combo-count deck: cheap plays into count scaling, 1 deck); syn-mixed (starter + 8 sampled synergy cards, 3 decks). 15 fights x 100 seeds = 1500 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.
Flags compare the mid deck set to the PROVISIONAL target bands in src/sim/targets.ts (LOW / HIGH = outside the band; "ok" = inside). Per-fight numbers vary in how hard the individual fight is; the tier rollup is the better first read.

### random bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 12 | 33.1% | 38.2 | 13.9 |
| starter | elite | 2 | 0.0% | n/a | 13.9 |
| starter | boss | 1 | 0.0% | n/a | 12.2 |
| mid | normal | 12 | 41.7% | 36.8 | 13.4 |
| mid | elite | 2 | 4.7% | 52.4 | 14.3 |
| mid | boss | 1 | 0.0% | n/a | 12.0 |
| late | normal | 12 | 55.1% | 37.0 | 14.2 |
| late | elite | 2 | 35.0% | 47.0 | 17.1 |
| late | boss | 1 | 0.0% | n/a | 15.0 |
| syn-tag | normal | 12 | 51.9% | 33.6 | 14.6 |
| syn-tag | elite | 2 | 11.0% | 52.3 | 16.1 |
| syn-tag | boss | 1 | 0.0% | n/a | 13.5 |
| syn-exhaust | normal | 12 | 41.1% | 41.9 | 8.9 |
| syn-exhaust | elite | 2 | 7.0% | 52.4 | 9.9 |
| syn-exhaust | boss | 1 | 0.0% | n/a | 8.8 |
| syn-trigger | normal | 12 | 93.8% | 16.9 | 20.6 |
| syn-trigger | elite | 2 | 90.5% | 25.5 | 21.6 |
| syn-trigger | boss | 1 | 0.0% | n/a | 27.4 |
| syn-mult | normal | 12 | 49.5% | 46.3 | 6.5 |
| syn-mult | elite | 2 | 15.0% | 56.8 | 7.4 |
| syn-mult | boss | 1 | 0.0% | n/a | 7.1 |
| syn-combo | normal | 12 | 34.8% | 39.2 | 8.3 |
| syn-combo | elite | 2 | 2.5% | 55.8 | 9.2 |
| syn-combo | boss | 1 | 0.0% | n/a | 8.1 |
| syn-mixed | normal | 12 | 62.1% | 32.6 | 14.4 |
| syn-mixed | elite | 2 | 35.3% | 40.3 | 16.6 |
| syn-mixed | boss | 1 | 0.0% | n/a | 13.9 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 29.6 [28.2, 31.0] | 13.2 [12.9, 13.4] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 21.2 [19.8, 22.6] | 13.9 [13.7, 14.2] |  |
| enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 24.0 [22.5, 25.5] | 18.4 [18.1, 18.7] |  |
| enemy-b+enemy-d | normal | starter | 100 | 83.0% [74.5%, 89.1%] | 47.6 [45.7, 49.4] | 25.2 [24.5, 25.9] |  |
| enemy-c | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 16.6 [16.1, 17.1] |  |
| enemy-a+enemy-d | normal | starter | 100 | 11.0% [6.3%, 18.6%] | 52.1 [48.5, 55.7] | 15.0 [14.3, 15.7] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 3.0% [1.0%, 8.5%] | 55.0 [55.0, 55.0] | 13.1 [12.6, 13.7] |  |
| enemy-a+enemy-b | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.2 [9.8, 10.5] |  |
| enemy-c+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 12.0 [11.6, 12.3] |  |
| enemy-b+enemy-d+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 12.0 [11.6, 12.4] |  |
| enemy-a+enemy-b+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.2 [7.0, 7.5] |  |
| enemy-b+enemy-c | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.2 [10.0, 10.4] |  |
| elite-a | elite | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.7 [10.4, 11.0] |  |
| elite-b | elite | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 17.1 [16.5, 17.8] |  |
| boss-a | boss | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 12.2 [11.8, 12.5] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 24.5 [23.3, 25.7] | 11.1 [11.0, 11.3] | win HIGH, HP HIGH, turns HIGH |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 20.1 [18.9, 21.3] | 12.2 [12.1, 12.4] | win HIGH, HP HIGH, turns HIGH |
| enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 18.7 [17.7, 19.8] | 15.0 [14.8, 15.2] | win HIGH, HP HIGH, turns HIGH |
| enemy-b+enemy-d | normal | mid | 300 | 74.7% [69.5%, 79.3%] | 37.7 [36.0, 39.4] | 20.6 [20.2, 21.0] | win ok, HP HIGH, turns HIGH |
| enemy-c | normal | mid | 300 | 28.0% [23.2%, 33.3%] | 49.9 [48.5, 51.3] | 16.5 [16.1, 16.9] | win LOW, HP HIGH, turns HIGH |
| enemy-a+enemy-d | normal | mid | 300 | 45.0% [39.5%, 50.7%] | 44.3 [42.6, 45.9] | 14.8 [14.3, 15.2] | win ok, HP HIGH, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 44.3% [38.8%, 50.0%] | 46.3 [44.8, 47.8] | 14.6 [14.1, 15.1] | win ok, HP HIGH, turns HIGH |
| enemy-a+enemy-b | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 10.7 [10.4, 11.1] | win LOW, HP n/a, turns HIGH |
| enemy-c+enemy-d | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 12.9 [12.5, 13.3] | win LOW, HP n/a, turns HIGH |
| enemy-b+enemy-d+enemy-d | normal | mid | 300 | 8.0% [5.4%, 11.6%] | 53.2 [50.4, 56.0] | 14.1 [13.3, 14.8] | win LOW, HP HIGH, turns HIGH |
| enemy-a+enemy-b+enemy-d | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 7.3 [7.1, 7.5] | win LOW, HP n/a, turns HIGH |
| enemy-b+enemy-c | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 10.7 [10.5, 11.0] | win LOW, HP n/a, turns HIGH |
| elite-a | elite | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 10.9 [10.7, 11.1] | win LOW, HP n/a, turns HIGH |
| elite-b | elite | mid | 300 | 9.3% [6.5%, 13.2%] | 52.4 [50.2, 54.6] | 17.7 [17.1, 18.3] | win ok, HP HIGH, turns HIGH |
| boss-a | boss | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 12.0 [11.7, 12.3] | win ok, HP n/a, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 18.5 [17.5, 19.5] | 10.5 [10.1, 10.9] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 17.2 [16.2, 18.2] | 11.5 [11.0, 11.9] |  |
| enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 14.5 [13.5, 15.4] | 13.6 [13.0, 14.1] |  |
| enemy-b+enemy-d | normal | late | 300 | 96.0% [93.1%, 97.7%] | 34.0 [32.5, 35.6] | 20.0 [19.2, 20.9] |  |
| enemy-c | normal | late | 300 | 83.3% [78.7%, 87.1%] | 39.9 [38.5, 41.3] | 17.2 [16.5, 18.0] |  |
| enemy-a+enemy-d | normal | late | 300 | 79.7% [74.8%, 83.8%] | 42.9 [41.5, 44.4] | 15.7 [15.0, 16.4] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 69.3% [63.9%, 74.3%] | 45.2 [43.8, 46.5] | 16.2 [15.4, 17.0] |  |
| enemy-a+enemy-b | normal | late | 300 | 3.7% [2.1%, 6.4%] | 55.8 [53.8, 57.9] | 12.7 [12.0, 13.4] |  |
| enemy-c+enemy-d | normal | late | 300 | 10.3% [7.4%, 14.3%] | 51.4 [49.2, 53.5] | 16.0 [15.2, 16.7] |  |
| enemy-b+enemy-d+enemy-d | normal | late | 300 | 18.7% [14.7%, 23.5%] | 50.4 [48.1, 52.6] | 17.4 [16.3, 18.4] |  |
| enemy-a+enemy-b+enemy-d | normal | late | 300 | 0.0% [0.0%, 1.3%] | n/a | 8.1 [7.8, 8.5] |  |
| enemy-b+enemy-c | normal | late | 300 | 0.0% [0.0%, 1.3%] | n/a | 12.1 [11.6, 12.6] |  |
| elite-a | elite | late | 300 | 6.7% [4.4%, 10.1%] | 49.5 [45.4, 53.6] | 13.5 [13.0, 14.1] |  |
| elite-b | elite | late | 300 | 63.3% [57.7%, 68.6%] | 44.5 [43.0, 46.0] | 20.7 [19.7, 21.8] |  |
| boss-a | boss | late | 300 | 0.0% [0.0%, 1.3%] | n/a | 15.0 [14.3, 15.7] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 15.0 [13.6, 16.3] | 11.2 [11.0, 11.5] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 14.3 [12.8, 15.7] | 12.1 [11.8, 12.3] |  |
| enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 14.2 [12.9, 15.6] | 15.2 [14.9, 15.4] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 96.0% [90.2%, 98.4%] | 30.9 [29.1, 32.7] | 21.4 [21.1, 21.7] |  |
| enemy-c | normal | syn-tag | 100 | 53.0% [43.3%, 62.5%] | 49.8 [48.0, 51.6] | 18.4 [18.1, 18.6] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 85.0% [76.7%, 90.7%] | 43.4 [41.5, 45.3] | 16.8 [16.4, 17.2] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 71.0% [61.5%, 79.0%] | 48.5 [46.5, 50.4] | 16.7 [16.2, 17.2] |  |
| enemy-a+enemy-b | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 12.2 [11.7, 12.7] |  |
| enemy-c+enemy-d | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 14.5 [14.0, 15.0] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-tag | 100 | 18.0% [11.7%, 26.7%] | 52.4 [50.2, 54.7] | 17.2 [16.1, 18.3] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.4 [8.2, 8.7] |  |
| enemy-b+enemy-c | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 11.6 [11.2, 11.9] |  |
| elite-a | elite | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 11.8 [11.5, 12.1] |  |
| elite-b | elite | syn-tag | 100 | 22.0% [15.0%, 31.1%] | 52.3 [49.7, 54.9] | 20.5 [19.9, 21.1] |  |
| boss-a | boss | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 13.5 [13.2, 13.7] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 28.3 [26.6, 30.0] | 7.4 [7.1, 7.7] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 24.7 [23.1, 26.3] | 8.3 [7.9, 8.7] |  |
| enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 21.3 [19.8, 22.8] | 10.1 [9.6, 10.6] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 85.0% [76.7%, 90.7%] | 45.0 [43.0, 47.0] | 13.3 [12.9, 13.8] |  |
| enemy-c | normal | syn-exhaust | 100 | 42.0% [32.8%, 51.8%] | 49.4 [47.2, 51.6] | 11.5 [11.2, 11.9] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 30.0% [21.9%, 39.6%] | 52.3 [50.3, 54.2] | 9.2 [8.8, 9.5] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 31.0% [22.8%, 40.6%] | 48.1 [45.6, 50.6] | 8.7 [8.3, 9.0] |  |
| enemy-a+enemy-b | normal | syn-exhaust | 100 | 1.0% [0.2%, 5.4%] | n/a | 7.4 [7.1, 7.6] |  |
| enemy-c+enemy-d | normal | syn-exhaust | 100 | 2.0% [0.6%, 7.0%] | 52.5 [46.1, 58.9] | 9.7 [9.4, 10.1] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-exhaust | 100 | 2.0% [0.6%, 7.0%] | 56.0 [56.0, 56.0] | 8.3 [7.8, 8.8] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.4 [5.2, 5.5] |  |
| enemy-b+enemy-c | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.7 [7.5, 7.9] |  |
| elite-a | elite | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.6 [8.4, 8.7] |  |
| elite-b | elite | syn-exhaust | 100 | 14.0% [8.5%, 22.1%] | 52.4 [49.4, 55.4] | 11.2 [10.8, 11.6] |  |
| boss-a | boss | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.8 [8.5, 9.1] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.5 [2.0, 3.1] | 11.7 [11.5, 11.9] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 3.9 [3.3, 4.6] | 12.0 [11.8, 12.2] |  |
| enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.1 [1.6, 2.7] | 14.7 [14.4, 14.9] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.2 [6.3, 8.1] | 21.0 [20.6, 21.4] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.5 [4.6, 6.4] | 18.4 [18.1, 18.7] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 10.1 [9.0, 11.1] | 16.6 [16.3, 16.9] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 12.0 [11.0, 13.0] | 17.7 [17.4, 18.0] |  |
| enemy-a+enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 23.6 [21.9, 25.3] | 25.7 [25.3, 26.1] |  |
| enemy-c+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 22.8 [21.0, 24.6] | 24.2 [23.9, 24.6] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 20.2 [18.7, 21.8] | 27.4 [27.0, 27.8] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-trigger | 100 | 69.0% [59.4%, 77.2%] | 46.0 [44.0, 48.1] | 27.4 [25.9, 28.8] |  |
| enemy-b+enemy-c | normal | syn-trigger | 100 | 57.0% [47.2%, 66.3%] | 46.8 [44.0, 49.6] | 30.7 [30.0, 31.5] |  |
| elite-a | elite | syn-trigger | 100 | 81.0% [72.2%, 87.5%] | 41.1 [38.7, 43.5] | 19.7 [19.4, 20.0] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 9.9 [8.8, 11.1] | 23.4 [23.0, 23.8] |  |
| boss-a | boss | syn-trigger | 100 | 0.0% [0.0%, 3.7%] | n/a | 27.4 [26.6, 28.2] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 34.0 [32.7, 35.3] | 5.7 [5.5, 5.8] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 32.1 [30.8, 33.4] | 5.9 [5.8, 6.1] |  |
| enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 29.9 [28.5, 31.3] | 6.8 [6.7, 7.0] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 86.0% [77.9%, 91.5%] | 49.6 [48.0, 51.1] | 8.3 [8.0, 8.5] |  |
| enemy-c | normal | syn-mult | 100 | 79.0% [70.0%, 85.8%] | 50.9 [49.5, 52.2] | 7.9 [7.7, 8.0] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 58.0% [48.2%, 67.2%] | 52.3 [50.7, 53.8] | 6.6 [6.4, 6.8] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 62.0% [52.2%, 70.9%] | 52.5 [50.9, 54.1] | 6.7 [6.5, 6.9] |  |
| enemy-a+enemy-b | normal | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.8 [5.7, 5.9] |  |
| enemy-c+enemy-d | normal | syn-mult | 100 | 4.0% [1.6%, 9.8%] | 57.8 [53.6, 61.9] | 7.0 [6.8, 7.2] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mult | 100 | 5.0% [2.2%, 11.2%] | 57.8 [55.4, 60.2] | 6.5 [6.2, 6.7] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 4.4 [4.3, 4.6] |  |
| enemy-b+enemy-c | normal | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.0 [6.0, 6.1] |  |
| elite-a | elite | syn-mult | 100 | 2.0% [0.6%, 7.0%] | 58.5 [52.1, 64.9] | 6.8 [6.7, 6.9] |  |
| elite-b | elite | syn-mult | 100 | 28.0% [20.1%, 37.5%] | 55.1 [53.7, 56.5] | 8.0 [7.8, 8.2] |  |
| boss-a | boss | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.1 [7.0, 7.2] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 27.6 [26.4, 28.7] | 6.8 [6.6, 7.0] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 28.6 [27.0, 30.1] | 8.2 [8.0, 8.4] |  |
| enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 22.3 [21.2, 23.5] | 8.8 [8.6, 9.0] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 61.0% [51.2%, 70.0%] | 50.0 [48.3, 51.7] | 13.0 [12.7, 13.4] |  |
| enemy-c | normal | syn-combo | 100 | 44.0% [34.7%, 53.8%] | 51.4 [49.6, 53.2] | 10.6 [10.4, 10.8] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 11.0% [6.3%, 18.6%] | 55.1 [53.0, 57.1] | 8.3 [8.1, 8.5] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 1.0% [0.2%, 5.4%] | n/a | 7.7 [7.5, 7.9] |  |
| enemy-a+enemy-b | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.9 [6.7, 7.1] |  |
| enemy-c+enemy-d | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.8 [8.6, 9.1] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.3 [7.1, 7.4] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.2 [5.1, 5.3] |  |
| enemy-b+enemy-c | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.6 [7.5, 7.8] |  |
| elite-a | elite | syn-combo | 100 | 1.0% [0.2%, 5.4%] | n/a | 8.2 [8.0, 8.4] |  |
| elite-b | elite | syn-combo | 100 | 4.0% [1.6%, 9.8%] | 55.8 [50.5, 61.0] | 10.2 [10.0, 10.5] |  |
| boss-a | boss | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.1 [7.9, 8.3] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 17.1 [15.9, 18.3] | 10.7 [10.4, 10.9] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 15.2 [14.1, 16.3] | 11.3 [11.0, 11.5] |  |
| enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 12.3 [11.3, 13.4] | 13.9 [13.7, 14.2] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 98.3% [96.2%, 99.3%] | 27.1 [25.6, 28.7] | 18.4 [17.9, 19.0] |  |
| enemy-c | normal | syn-mixed | 300 | 85.0% [80.5%, 88.6%] | 35.0 [33.4, 36.6] | 16.9 [16.5, 17.4] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 86.7% [82.4%, 90.1%] | 36.5 [34.9, 38.0] | 14.7 [14.2, 15.2] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 85.7% [81.2%, 89.2%] | 37.0 [35.6, 38.3] | 14.8 [14.3, 15.3] |  |
| enemy-a+enemy-b | normal | syn-mixed | 300 | 12.7% [9.4%, 16.9%] | 51.4 [49.6, 53.2] | 14.3 [13.6, 15.1] |  |
| enemy-c+enemy-d | normal | syn-mixed | 300 | 22.0% [17.7%, 27.0%] | 51.0 [49.4, 52.5] | 16.9 [16.1, 17.6] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mixed | 300 | 55.3% [49.7%, 60.9%] | 43.4 [41.8, 44.9] | 19.6 [18.5, 20.6] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 8.5 [8.2, 8.9] |  |
| enemy-b+enemy-c | normal | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 13.0 [12.5, 13.5] |  |
| elite-a | elite | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 12.5 [12.1, 12.9] |  |
| elite-b | elite | syn-mixed | 300 | 70.7% [65.3%, 75.5%] | 40.3 [38.6, 42.1] | 20.6 [19.9, 21.4] |  |
| boss-a | boss | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 13.9 [13.4, 14.4] |  |

### greedy bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 12 | 72.3% | 21.0 | 19.6 |
| starter | elite | 2 | 38.0% | 48.0 | 22.6 |
| starter | boss | 1 | 0.0% | n/a | 17.0 |
| mid | normal | 12 | 74.9% | 28.8 | 15.1 |
| mid | elite | 2 | 34.7% | 47.0 | 16.6 |
| mid | boss | 1 | 0.0% | n/a | 14.6 |
| late | normal | 12 | 85.5% | 28.1 | 14.5 |
| late | elite | 2 | 87.3% | 36.7 | 16.3 |
| late | boss | 1 | 8.3% | 48.4 | 21.0 |
| syn-tag | normal | 12 | 71.5% | 28.7 | 16.2 |
| syn-tag | elite | 2 | 28.5% | 49.7 | 17.4 |
| syn-tag | boss | 1 | 0.0% | n/a | 13.8 |
| syn-exhaust | normal | 12 | 38.4% | 35.4 | 12.9 |
| syn-exhaust | elite | 2 | 0.0% | n/a | 11.4 |
| syn-exhaust | boss | 1 | 0.0% | n/a | 10.1 |
| syn-trigger | normal | 12 | 92.2% | 15.2 | 26.8 |
| syn-trigger | elite | 2 | 71.0% | 27.1 | 28.7 |
| syn-trigger | boss | 1 | 0.0% | n/a | 32.1 |
| syn-mult | normal | 12 | 69.4% | 41.6 | 6.8 |
| syn-mult | elite | 2 | 43.5% | 55.3 | 7.5 |
| syn-mult | boss | 1 | 0.0% | n/a | 7.2 |
| syn-combo | normal | 12 | 54.8% | 38.9 | 9.5 |
| syn-combo | elite | 2 | 2.0% | 56.8 | 9.6 |
| syn-combo | boss | 1 | 0.0% | n/a | 8.6 |
| syn-mixed | normal | 12 | 84.1% | 27.4 | 16.1 |
| syn-mixed | elite | 2 | 49.5% | 44.3 | 17.6 |
| syn-mixed | boss | 1 | 0.0% | n/a | 16.3 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 8.3 [7.3, 9.4] | 13.8 [13.6, 13.9] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 3.0 [2.4, 3.7] | 11.4 [11.3, 11.6] |  |
| enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 6.0 [5.2, 6.9] | 15.0 [14.8, 15.2] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 11.0 [9.9, 12.1] | 21.9 [21.7, 22.2] |  |
| enemy-c | normal | starter | 100 | 97.0% [91.5%, 99.0%] | 41.9 [40.3, 43.4] | 23.4 [23.2, 23.6] |  |
| enemy-a+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 22.4 [21.2, 23.7] | 21.5 [21.3, 21.7] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 15.3 [14.5, 16.2] | 18.6 [18.4, 18.7] |  |
| enemy-a+enemy-b | normal | starter | 100 | 70.0% [60.4%, 78.1%] | 48.6 [47.0, 50.2] | 25.6 [24.2, 26.9] |  |
| enemy-c+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 24.9 [24.5, 25.4] |  |
| enemy-b+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 32.3 [30.8, 33.7] | 29.7 [29.5, 30.0] |  |
| enemy-a+enemy-b+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 13.3 [12.7, 13.8] |  |
| enemy-b+enemy-c | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 16.7 [16.4, 17.0] |  |
| elite-a | elite | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 14.7 [14.3, 15.2] |  |
| elite-b | elite | starter | 100 | 76.0% [66.8%, 83.3%] | 48.0 [46.4, 49.6] | 30.4 [30.1, 30.7] |  |
| boss-a | boss | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 17.0 [16.6, 17.5] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 12.9 [12.0, 13.8] | 9.8 [9.7, 10.0] | win ok, HP ok, turns HIGH |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 7.8 [7.3, 8.4] | 9.5 [9.4, 9.6] | win ok, HP ok, turns HIGH |
| enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 9.6 [8.8, 10.4] | 11.8 [11.6, 12.0] | win ok, HP ok, turns HIGH |
| enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 20.1 [18.9, 21.3] | 16.6 [16.4, 16.9] | win ok, HP HIGH, turns HIGH |
| enemy-c | normal | mid | 300 | 96.7% [94.0%, 98.2%] | 36.0 [34.5, 37.5] | 16.2 [15.9, 16.5] | win ok, HP HIGH, turns HIGH |
| enemy-a+enemy-d | normal | mid | 300 | 99.7% [98.1%, 99.9%] | 29.7 [28.2, 31.2] | 15.0 [14.7, 15.2] | win ok, HP HIGH, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 23.3 [22.2, 24.3] | 14.2 [14.0, 14.4] | win ok, HP HIGH, turns HIGH |
| enemy-a+enemy-b | normal | mid | 300 | 61.7% [56.1%, 67.0%] | 42.0 [40.4, 43.7] | 19.3 [18.6, 20.0] | win LOW, HP HIGH, turns HIGH |
| enemy-c+enemy-d | normal | mid | 300 | 37.0% [31.7%, 42.6%] | 46.4 [44.8, 48.0] | 19.2 [18.6, 19.7] | win LOW, HP HIGH, turns HIGH |
| enemy-b+enemy-d+enemy-d | normal | mid | 300 | 91.3% [87.6%, 94.0%] | 36.2 [34.5, 37.9] | 21.9 [21.4, 22.3] | win ok, HP HIGH, turns HIGH |
| enemy-a+enemy-b+enemy-d | normal | mid | 300 | 12.0% [8.8%, 16.2%] | 52.8 [50.4, 55.1] | 13.2 [12.2, 14.2] | win LOW, HP HIGH, turns HIGH |
| enemy-b+enemy-c | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 14.7 [14.0, 15.4] | win LOW, HP n/a, turns HIGH |
| elite-a | elite | mid | 300 | 1.3% [0.5%, 3.4%] | 53.3 [47.5, 59.0] | 13.2 [12.8, 13.6] | win LOW, HP HIGH, turns HIGH |
| elite-b | elite | mid | 300 | 68.0% [62.5%, 73.0%] | 40.8 [38.8, 42.7] | 20.0 [19.5, 20.6] | win ok, HP HIGH, turns HIGH |
| boss-a | boss | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 14.6 [14.2, 15.1] | win LOW, HP n/a, turns HIGH |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 11.9 [11.1, 12.8] | 9.1 [8.7, 9.4] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 10.3 [9.6, 11.1] | 9.1 [8.8, 9.4] |  |
| enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 8.2 [7.5, 8.9] | 10.2 [9.8, 10.6] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 18.8 [17.7, 19.9] | 14.5 [14.0, 15.1] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 23.0 [21.8, 24.1] | 14.3 [13.7, 14.9] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 26.0 [24.9, 27.2] | 13.5 [12.9, 14.0] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 24.6 [23.4, 25.8] | 13.5 [13.0, 13.9] |  |
| enemy-a+enemy-b | normal | late | 300 | 94.3% [91.1%, 96.4%] | 39.5 [38.2, 40.8] | 18.5 [17.7, 19.3] |  |
| enemy-c+enemy-d | normal | late | 300 | 93.0% [89.5%, 95.4%] | 41.4 [40.0, 42.8] | 18.8 [18.0, 19.6] |  |
| enemy-b+enemy-d+enemy-d | normal | late | 300 | 98.3% [96.2%, 99.3%] | 34.3 [33.0, 35.7] | 19.5 [18.8, 20.3] |  |
| enemy-a+enemy-b+enemy-d | normal | late | 300 | 25.7% [21.1%, 30.9%] | 48.8 [46.8, 50.8] | 15.6 [14.5, 16.6] |  |
| enemy-b+enemy-c | normal | late | 300 | 14.3% [10.8%, 18.8%] | 50.8 [48.4, 53.3] | 17.8 [16.9, 18.7] |  |
| elite-a | elite | late | 300 | 75.3% [70.2%, 79.9%] | 44.0 [42.5, 45.5] | 15.1 [14.5, 15.7] |  |
| elite-b | elite | late | 300 | 99.3% [97.6%, 99.8%] | 29.5 [28.1, 30.9] | 17.5 [16.7, 18.3] |  |
| boss-a | boss | late | 300 | 8.3% [5.7%, 12.0%] | 48.4 [44.4, 52.3] | 21.0 [19.9, 22.1] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 11.1 [9.8, 12.3] | 10.3 [10.1, 10.5] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 6.5 [5.7, 7.4] | 11.3 [11.1, 11.5] |  |
| enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 12.4 [11.1, 13.8] | 14.7 [14.4, 14.9] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 20.0 [18.4, 21.6] | 19.9 [19.6, 20.2] |  |
| enemy-c | normal | syn-tag | 100 | 91.0% [83.8%, 95.2%] | 44.1 [42.0, 46.1] | 18.1 [17.9, 18.4] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 30.0 [28.2, 31.8] | 15.5 [15.2, 15.8] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 22.4 [20.9, 23.8] | 16.4 [16.1, 16.7] |  |
| enemy-a+enemy-b | normal | syn-tag | 100 | 64.0% [54.2%, 72.7%] | 49.6 [47.8, 51.3] | 21.1 [20.0, 22.2] |  |
| enemy-c+enemy-d | normal | syn-tag | 100 | 8.0% [4.1%, 15.0%] | 52.4 [47.5, 57.3] | 19.3 [18.9, 19.8] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-tag | 100 | 95.0% [88.8%, 97.8%] | 39.1 [37.0, 41.1] | 25.3 [25.0, 25.7] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.1 [9.8, 10.4] |  |
| enemy-b+enemy-c | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 12.9 [12.4, 13.3] |  |
| elite-a | elite | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 12.8 [12.6, 13.0] |  |
| elite-b | elite | syn-tag | 100 | 57.0% [47.2%, 66.3%] | 49.7 [47.7, 51.6] | 22.1 [21.6, 22.6] |  |
| boss-a | boss | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 13.8 [13.5, 14.2] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 37.3 [36.3, 38.2] | 12.8 [12.6, 13.0] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 18.5 [17.6, 19.4] | 12.1 [11.9, 12.3] |  |
| enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 24.7 [23.3, 26.1] | 15.2 [15.0, 15.4] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 86.0% [77.9%, 91.5%] | 45.6 [44.2, 46.9] | 21.5 [21.1, 22.0] |  |
| enemy-c | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 13.7 [13.3, 14.0] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 13.8 [13.4, 14.2] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 75.0% [65.7%, 82.5%] | 50.9 [49.9, 52.0] | 17.0 [16.3, 17.6] |  |
| enemy-a+enemy-b | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.6 [8.4, 8.7] |  |
| enemy-c+enemy-d | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 11.7 [11.5, 12.0] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 13.2 [12.6, 13.7] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.0 [6.0, 6.0] |  |
| enemy-b+enemy-c | normal | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.8 [8.6, 9.0] |  |
| elite-a | elite | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 9.1 [8.9, 9.3] |  |
| elite-b | elite | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 13.7 [13.4, 13.9] |  |
| boss-a | boss | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.1 [9.8, 10.4] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.5 [1.1, 1.9] | 14.3 [14.2, 14.4] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.4 [1.8, 3.0] | 14.2 [14.1, 14.3] |  |
| enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.4 [1.0, 1.9] | 19.0 [18.9, 19.2] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.1 [4.3, 6.0] | 27.4 [27.2, 27.6] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 9.1 [8.0, 10.1] | 25.0 [24.8, 25.3] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.2 [6.2, 8.2] | 22.2 [22.1, 22.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 8.6 [7.7, 9.5] | 20.7 [20.6, 20.9] |  |
| enemy-a+enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 18.8 [16.8, 20.7] | 33.3 [33.0, 33.5] |  |
| enemy-c+enemy-d | normal | syn-trigger | 100 | 99.0% [94.6%, 99.8%] | 29.0 [27.0, 31.0] | 33.2 [33.0, 33.5] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 14.1 [12.7, 15.4] | 36.3 [36.0, 36.6] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-trigger | 100 | 81.0% [72.2%, 87.5%] | 33.8 [30.9, 36.7] | 37.4 [35.5, 39.4] |  |
| enemy-b+enemy-c | normal | syn-trigger | 100 | 26.0% [18.4%, 35.4%] | 51.8 [50.1, 53.5] | 38.9 [37.8, 40.1] |  |
| elite-a | elite | syn-trigger | 100 | 42.0% [32.8%, 51.8%] | 43.8 [41.0, 46.6] | 24.1 [23.3, 24.9] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 10.5 [9.3, 11.7] | 33.3 [33.0, 33.5] |  |
| boss-a | boss | syn-trigger | 100 | 0.0% [0.0%, 3.7%] | n/a | 32.1 [31.1, 33.1] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 27.9 [26.8, 29.0] | 5.2 [5.0, 5.3] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 23.7 [22.7, 24.6] | 5.3 [5.2, 5.4] |  |
| enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 23.6 [22.5, 24.6] | 5.9 [5.8, 6.1] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 39.4 [38.2, 40.6] | 7.4 [7.3, 7.6] |  |
| enemy-c | normal | syn-mult | 100 | 99.0% [94.6%, 99.8%] | 45.5 [44.5, 46.6] | 7.2 [7.1, 7.2] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 99.0% [94.6%, 99.8%] | 46.8 [45.6, 48.0] | 6.7 [6.5, 6.8] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 99.0% [94.6%, 99.8%] | 43.9 [42.5, 45.3] | 6.9 [6.8, 7.1] |  |
| enemy-a+enemy-b | normal | syn-mult | 100 | 37.0% [28.2%, 46.8%] | 55.4 [54.2, 56.7] | 7.6 [7.3, 7.9] |  |
| enemy-c+enemy-d | normal | syn-mult | 100 | 37.0% [28.2%, 46.8%] | 55.4 [54.2, 56.6] | 8.0 [7.9, 8.2] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mult | 100 | 62.0% [52.2%, 70.9%] | 54.0 [52.9, 55.2] | 8.4 [8.1, 8.6] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.3 [5.2, 5.5] |  |
| enemy-b+enemy-c | normal | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.4 [7.2, 7.6] |  |
| elite-a | elite | syn-mult | 100 | 7.0% [3.4%, 13.7%] | 56.9 [54.7, 59.0] | 7.0 [7.0, 7.1] |  |
| elite-b | elite | syn-mult | 100 | 80.0% [71.1%, 86.7%] | 53.8 [52.8, 54.7] | 7.9 [7.8, 8.1] |  |
| boss-a | boss | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.2 [7.1, 7.3] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 25.5 [24.5, 26.5] | 6.9 [6.8, 7.1] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 15.8 [14.8, 16.9] | 7.4 [7.2, 7.6] |  |
| enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 18.6 [17.6, 19.6] | 8.4 [8.2, 8.6] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 37.0 [35.5, 38.6] | 12.2 [11.9, 12.4] |  |
| enemy-c | normal | syn-combo | 100 | 54.0% [44.3%, 63.4%] | 51.3 [49.8, 52.8] | 10.9 [10.8, 11.1] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 84.0% [75.6%, 89.9%] | 51.3 [50.2, 52.3] | 10.4 [10.2, 10.6] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 98.0% [93.0%, 99.4%] | 40.9 [39.5, 42.2] | 11.0 [10.8, 11.2] |  |
| enemy-a+enemy-b | normal | syn-combo | 100 | 3.0% [1.0%, 8.5%] | 56.0 [53.5, 58.5] | 9.1 [8.6, 9.6] |  |
| enemy-c+enemy-d | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.6 [10.5, 10.7] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-combo | 100 | 18.0% [11.7%, 26.7%] | 53.4 [51.3, 55.6] | 13.4 [13.0, 13.8] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 6.0 [5.9, 6.1] |  |
| enemy-b+enemy-c | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.0 [8.0, 8.1] |  |
| elite-a | elite | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.5 [8.4, 8.7] |  |
| elite-b | elite | syn-combo | 100 | 4.0% [1.6%, 9.8%] | 56.8 [54.4, 59.1] | 10.8 [10.5, 11.0] |  |
| boss-a | boss | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.6 [8.4, 8.8] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 10.5 [9.6, 11.5] | 10.5 [10.3, 10.7] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 7.5 [6.9, 8.1] | 10.3 [10.1, 10.4] |  |
| enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 7.2 [6.5, 8.0] | 12.7 [12.4, 12.9] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 14.3 [13.3, 15.2] | 16.8 [16.4, 17.2] |  |
| enemy-c | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 25.0 [23.7, 26.3] | 16.8 [16.4, 17.2] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 24.0 [22.7, 25.4] | 14.6 [14.3, 15.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 22.1 [21.1, 23.1] | 14.2 [13.8, 14.5] |  |
| enemy-a+enemy-b | normal | syn-mixed | 300 | 94.3% [91.1%, 96.4%] | 39.3 [38.1, 40.5] | 20.4 [19.8, 21.1] |  |
| enemy-c+enemy-d | normal | syn-mixed | 300 | 87.7% [83.5%, 90.9%] | 42.0 [41.0, 43.1] | 20.7 [20.1, 21.3] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mixed | 300 | 99.3% [97.6%, 99.8%] | 29.3 [28.0, 30.6] | 21.2 [20.6, 21.9] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mixed | 300 | 27.0% [22.3%, 32.3%] | 51.8 [50.4, 53.1] | 16.6 [15.4, 17.7] |  |
| enemy-b+enemy-c | normal | syn-mixed | 300 | 1.3% [0.5%, 3.4%] | 55.3 [49.1, 61.4] | 19.0 [18.2, 19.8] |  |
| elite-a | elite | syn-mixed | 300 | 5.7% [3.6%, 8.9%] | 55.8 [54.4, 57.2] | 14.2 [13.8, 14.6] |  |
| elite-b | elite | syn-mixed | 300 | 93.3% [89.9%, 95.6%] | 32.8 [31.3, 34.3] | 20.9 [20.4, 21.5] |  |
| boss-a | boss | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 16.3 [15.9, 16.8] |  |

### smart bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 12 | 57.1% | 42.2 | 13.9 |
| starter | elite | 2 | 0.0% | n/a | 12.8 |
| starter | boss | 1 | 0.0% | n/a | 12.9 |
| mid | normal | 12 | 69.1% | 34.2 | 13.1 |
| mid | elite | 2 | 22.7% | 51.4 | 13.9 |
| mid | boss | 1 | 0.0% | n/a | 13.4 |
| late | normal | 12 | 80.5% | 34.0 | 12.0 |
| late | elite | 2 | 72.0% | 44.0 | 13.6 |
| late | boss | 1 | 7.7% | 52.2 | 17.3 |
| syn-tag | normal | 12 | 72.4% | 30.4 | 13.9 |
| syn-tag | elite | 2 | 32.0% | 50.7 | 15.2 |
| syn-tag | boss | 1 | 0.0% | n/a | 13.4 |
| syn-exhaust | normal | 12 | 74.1% | 37.1 | 8.7 |
| syn-exhaust | elite | 2 | 35.0% | 51.3 | 9.4 |
| syn-exhaust | boss | 1 | 0.0% | n/a | 9.5 |
| syn-trigger | normal | 12 | 100.0% | 7.6 | 15.1 |
| syn-trigger | elite | 2 | 100.0% | 8.9 | 16.1 |
| syn-trigger | boss | 1 | 71.0% | 46.4 | 30.7 |
| syn-mult | normal | 12 | 71.3% | 44.2 | 5.9 |
| syn-mult | elite | 2 | 56.5% | 55.9 | 6.7 |
| syn-mult | boss | 1 | 0.0% | n/a | 7.0 |
| syn-combo | normal | 12 | 63.8% | 37.4 | 7.9 |
| syn-combo | elite | 2 | 40.5% | 53.5 | 8.9 |
| syn-combo | boss | 1 | 0.0% | n/a | 8.1 |
| syn-mixed | normal | 12 | 87.1% | 30.0 | 12.9 |
| syn-mixed | elite | 2 | 54.7% | 46.1 | 14.1 |
| syn-mixed | boss | 1 | 0.0% | n/a | 14.9 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 33.0 [32.0, 34.0] | 9.9 [9.8, 10.0] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 17.8 [16.9, 18.7] | 10.2 [10.1, 10.3] |  |
| enemy-b | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 20.4 [19.1, 21.8] | 12.8 [12.7, 12.9] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 35.6 [34.0, 37.2] | 17.9 [17.8, 18.1] |  |
| enemy-c | normal | starter | 100 | 12.0% [7.0%, 19.8%] | 57.0 [57.0, 57.0] | 15.5 [15.1, 15.9] |  |
| enemy-a+enemy-d | normal | starter | 100 | 96.0% [90.2%, 98.4%] | 56.4 [55.9, 56.8] | 15.3 [15.0, 15.5] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 44.9 [43.7, 46.0] | 15.2 [15.0, 15.3] |  |
| enemy-a+enemy-b | normal | starter | 100 | 16.0% [10.1%, 24.4%] | 58.4 [57.8, 59.1] | 14.8 [13.6, 15.9] |  |
| enemy-c+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 14.0 [13.6, 14.4] |  |
| enemy-b+enemy-d+enemy-d | normal | starter | 100 | 61.0% [51.2%, 70.0%] | 56.7 [55.8, 57.6] | 23.3 [22.8, 23.8] |  |
| enemy-a+enemy-b+enemy-d | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.0 [7.8, 8.1] |  |
| enemy-b+enemy-c | normal | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.3 [10.0, 10.7] |  |
| elite-a | elite | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 10.6 [10.2, 10.9] |  |
| elite-b | elite | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 14.9 [14.5, 15.4] |  |
| boss-a | boss | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 12.9 [12.7, 13.2] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 19.3 [18.2, 20.4] | 8.7 [8.5, 8.8] | win ok, HP HIGH, turns HIGH |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 13.2 [12.2, 14.1] | 9.0 [8.9, 9.1] | win ok, HP ok, turns HIGH |
| enemy-b | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 13.0 [12.1, 13.9] | 10.9 [10.7, 11.1] | win ok, HP ok, turns HIGH |
| enemy-b+enemy-d | normal | mid | 300 | 99.0% [97.1%, 99.7%] | 27.3 [25.7, 28.8] | 15.6 [15.4, 15.8] | win ok, HP HIGH, turns HIGH |
| enemy-c | normal | mid | 300 | 80.3% [75.5%, 84.4%] | 42.1 [40.5, 43.6] | 14.3 [14.0, 14.6] | win LOW, HP HIGH, turns HIGH |
| enemy-a+enemy-d | normal | mid | 300 | 97.0% [94.4%, 98.4%] | 39.8 [38.2, 41.4] | 12.6 [12.3, 12.8] | win ok, HP HIGH, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 97.7% [95.3%, 98.9%] | 33.7 [32.2, 35.3] | 13.1 [12.9, 13.3] | win ok, HP HIGH, turns HIGH |
| enemy-a+enemy-b | normal | mid | 300 | 50.3% [44.7%, 56.0%] | 43.8 [42.0, 45.6] | 15.8 [15.1, 16.4] | win LOW, HP HIGH, turns HIGH |
| enemy-c+enemy-d | normal | mid | 300 | 31.0% [26.0%, 36.4%] | 51.7 [50.4, 53.0] | 16.0 [15.5, 16.5] | win LOW, HP HIGH, turns HIGH |
| enemy-b+enemy-d+enemy-d | normal | mid | 300 | 62.7% [57.1%, 67.9%] | 37.1 [35.3, 38.9] | 18.5 [18.0, 19.0] | win LOW, HP HIGH, turns HIGH |
| enemy-a+enemy-b+enemy-d | normal | mid | 300 | 11.7% [8.5%, 15.8%] | 55.0 [54.1, 55.9] | 10.7 [9.8, 11.5] | win LOW, HP HIGH, turns HIGH |
| enemy-b+enemy-c | normal | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 11.9 [11.4, 12.3] | win LOW, HP n/a, turns HIGH |
| elite-a | elite | mid | 300 | 1.7% [0.7%, 3.8%] | 57.4 [54.8, 60.0] | 11.6 [11.3, 11.9] | win LOW, HP HIGH, turns HIGH |
| elite-b | elite | mid | 300 | 43.7% [38.2%, 49.3%] | 45.4 [43.7, 47.1] | 16.3 [15.8, 16.8] | win LOW, HP HIGH, turns HIGH |
| boss-a | boss | mid | 300 | 0.0% [0.0%, 1.3%] | n/a | 13.4 [13.0, 13.8] | win LOW, HP n/a, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 18.0 [17.1, 19.0] | 7.4 [7.1, 7.7] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 15.1 [14.2, 15.9] | 7.7 [7.4, 7.9] |  |
| enemy-b | normal | late | 300 | 100.0% [98.7%, 100.0%] | 13.8 [13.0, 14.7] | 9.2 [8.8, 9.5] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 27.4 [26.0, 28.8] | 12.6 [12.1, 13.0] |  |
| enemy-c | normal | late | 300 | 99.7% [98.1%, 99.9%] | 34.8 [33.3, 36.3] | 12.2 [11.7, 12.6] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 36.2 [34.8, 37.5] | 10.9 [10.5, 11.3] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 33.1 [31.8, 34.4] | 11.3 [10.9, 11.7] |  |
| enemy-a+enemy-b | normal | late | 300 | 78.0% [73.0%, 82.3%] | 44.6 [43.1, 46.1] | 15.1 [14.5, 15.8] |  |
| enemy-c+enemy-d | normal | late | 300 | 60.3% [54.7%, 65.7%] | 43.7 [42.1, 45.3] | 14.8 [14.2, 15.5] |  |
| enemy-b+enemy-d+enemy-d | normal | late | 300 | 86.7% [82.4%, 90.1%] | 41.3 [39.8, 42.8] | 16.2 [15.5, 16.9] |  |
| enemy-a+enemy-b+enemy-d | normal | late | 300 | 26.7% [22.0%, 31.9%] | 49.8 [47.9, 51.6] | 12.4 [11.5, 13.2] |  |
| enemy-b+enemy-c | normal | late | 300 | 14.7% [11.1%, 19.1%] | 50.4 [48.2, 52.6] | 14.8 [14.0, 15.6] |  |
| elite-a | elite | late | 300 | 54.7% [49.0%, 60.2%] | 47.4 [45.8, 49.0] | 12.8 [12.3, 13.3] |  |
| elite-b | elite | late | 300 | 89.3% [85.3%, 92.3%] | 40.7 [39.1, 42.2] | 14.3 [13.7, 14.9] |  |
| boss-a | boss | late | 300 | 7.7% [5.2%, 11.2%] | 52.2 [49.4, 55.0] | 17.3 [16.4, 18.3] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 13.8 [12.4, 15.2] | 9.1 [8.9, 9.2] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 8.8 [7.8, 9.7] | 9.2 [9.0, 9.4] |  |
| enemy-b | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 12.6 [11.2, 14.0] | 11.9 [11.8, 12.1] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 23.6 [21.9, 25.3] | 16.6 [16.4, 16.8] |  |
| enemy-c | normal | syn-tag | 100 | 88.0% [80.2%, 93.0%] | 43.2 [41.1, 45.3] | 15.4 [15.2, 15.7] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 33.3 [31.5, 35.1] | 13.4 [13.2, 13.6] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 24.9 [23.5, 26.2] | 13.5 [13.3, 13.8] |  |
| enemy-a+enemy-b | normal | syn-tag | 100 | 59.0% [49.2%, 68.1%] | 49.8 [48.1, 51.5] | 18.1 [17.3, 19.0] |  |
| enemy-c+enemy-d | normal | syn-tag | 100 | 24.0% [16.7%, 33.2%] | 54.3 [52.3, 56.2] | 17.6 [17.2, 18.0] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-tag | 100 | 98.0% [93.0%, 99.4%] | 39.6 [37.7, 41.4] | 20.9 [20.6, 21.1] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.8 [8.4, 9.2] |  |
| enemy-b+enemy-c | normal | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 11.8 [11.5, 12.2] |  |
| elite-a | elite | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 11.9 [11.7, 12.2] |  |
| elite-b | elite | syn-tag | 100 | 64.0% [54.2%, 72.7%] | 50.7 [49.1, 52.3] | 18.5 [18.1, 18.9] |  |
| boss-a | boss | syn-tag | 100 | 0.0% [0.0%, 3.7%] | n/a | 13.4 [13.1, 13.6] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 21.8 [20.7, 23.0] | 5.7 [5.4, 5.9] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 15.8 [14.8, 16.7] | 5.9 [5.7, 6.1] |  |
| enemy-b | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 15.9 [14.6, 17.2] | 7.2 [6.9, 7.5] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 29.0 [27.4, 30.5] | 9.9 [9.4, 10.4] |  |
| enemy-c | normal | syn-exhaust | 100 | 92.0% [85.0%, 95.9%] | 44.6 [42.7, 46.6] | 9.5 [9.2, 9.8] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 98.0% [93.0%, 99.4%] | 41.9 [40.1, 43.7] | 8.4 [8.1, 8.7] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 37.1 [35.6, 38.7] | 8.9 [8.5, 9.2] |  |
| enemy-a+enemy-b | normal | syn-exhaust | 100 | 70.0% [60.4%, 78.1%] | 49.1 [47.0, 51.2] | 11.1 [10.7, 11.6] |  |
| enemy-c+enemy-d | normal | syn-exhaust | 100 | 34.0% [25.5%, 43.7%] | 51.4 [48.3, 54.4] | 10.3 [10.1, 10.6] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-exhaust | 100 | 84.0% [75.6%, 89.9%] | 46.0 [44.0, 48.1] | 12.4 [11.9, 13.0] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-exhaust | 100 | 10.0% [5.5%, 17.4%] | 55.9 [53.4, 58.4] | 7.1 [6.6, 7.6] |  |
| enemy-b+enemy-c | normal | syn-exhaust | 100 | 1.0% [0.2%, 5.4%] | n/a | 8.3 [7.9, 8.6] |  |
| elite-a | elite | syn-exhaust | 100 | 12.0% [7.0%, 19.8%] | 54.3 [52.3, 56.4] | 8.4 [8.2, 8.6] |  |
| elite-b | elite | syn-exhaust | 100 | 58.0% [48.2%, 67.2%] | 48.2 [46.0, 50.4] | 10.3 [10.0, 10.7] |  |
| boss-a | boss | syn-exhaust | 100 | 0.0% [0.0%, 3.7%] | n/a | 9.5 [9.1, 9.8] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.4 [1.1, 1.8] | 8.4 [8.2, 8.5] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.6 [2.0, 3.2] | 8.6 [8.4, 8.7] |  |
| enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.1 [0.7, 1.6] | 10.7 [10.5, 10.8] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.3 [3.5, 5.0] | 14.7 [14.5, 14.8] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.6 [1.1, 2.0] | 13.5 [13.4, 13.7] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.1 [4.3, 5.9] | 11.9 [11.8, 12.1] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.7 [6.9, 8.5] | 11.9 [11.8, 12.1] |  |
| enemy-a+enemy-b | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 10.0 [8.9, 11.1] | 18.1 [17.9, 18.3] |  |
| enemy-c+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.5 [4.7, 6.4] | 17.4 [17.2, 17.6] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 9.2 [8.2, 10.1] | 18.9 [18.7, 19.0] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 21.9 [20.4, 23.5] | 22.2 [22.0, 22.4] |  |
| enemy-b+enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 20.4 [18.5, 22.4] | 24.9 [24.6, 25.2] |  |
| elite-a | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 14.4 [12.6, 16.2] | 15.3 [15.2, 15.4] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 3.5 [2.8, 4.1] | 16.9 [16.7, 17.0] |  |
| boss-a | boss | syn-trigger | 100 | 71.0% [61.5%, 79.0%] | 46.4 [44.1, 48.7] | 30.7 [30.2, 31.2] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 28.6 [27.2, 29.9] | 4.5 [4.4, 4.7] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 26.9 [26.0, 27.8] | 4.5 [4.4, 4.6] |  |
| enemy-b | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 26.9 [26.2, 27.5] | 5.3 [5.2, 5.4] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 40.3 [38.8, 41.8] | 6.4 [6.3, 6.5] |  |
| enemy-c | normal | syn-mult | 100 | 98.0% [93.0%, 99.4%] | 47.1 [45.7, 48.4] | 6.3 [6.2, 6.5] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 45.2 [43.6, 46.9] | 5.7 [5.5, 5.8] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 45.4 [44.1, 46.6] | 5.7 [5.6, 5.8] |  |
| enemy-a+enemy-b | normal | syn-mult | 100 | 43.0% [33.7%, 52.8%] | 55.4 [54.2, 56.7] | 6.8 [6.6, 6.9] |  |
| enemy-c+enemy-d | normal | syn-mult | 100 | 47.0% [37.5%, 56.7%] | 56.8 [56.3, 57.3] | 6.9 [6.7, 7.1] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mult | 100 | 63.0% [53.2%, 71.8%] | 55.6 [54.6, 56.6] | 7.2 [7.0, 7.4] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mult | 100 | 4.0% [1.6%, 9.8%] | 58.5 [57.6, 59.4] | 5.1 [4.9, 5.3] |  |
| enemy-b+enemy-c | normal | syn-mult | 100 | 1.0% [0.2%, 5.4%] | n/a | 6.1 [6.0, 6.3] |  |
| elite-a | elite | syn-mult | 100 | 35.0% [26.4%, 44.7%] | 57.2 [56.7, 57.7] | 6.5 [6.4, 6.7] |  |
| elite-b | elite | syn-mult | 100 | 78.0% [68.9%, 85.0%] | 54.6 [53.3, 56.0] | 6.9 [6.8, 7.0] |  |
| boss-a | boss | syn-mult | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.0 [6.9, 7.0] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 20.6 [19.5, 21.7] | 5.2 [5.1, 5.3] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 16.1 [15.1, 17.2] | 5.7 [5.6, 5.9] |  |
| enemy-b | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 14.9 [13.9, 16.0] | 6.4 [6.2, 6.5] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 32.6 [31.2, 33.9] | 9.7 [9.6, 9.9] |  |
| enemy-c | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 43.0 [41.5, 44.6] | 8.7 [8.5, 8.8] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 99.0% [94.6%, 99.8%] | 40.0 [38.5, 41.6] | 8.0 [7.8, 8.2] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 98.0% [93.0%, 99.4%] | 38.9 [37.5, 40.4] | 8.7 [8.5, 8.9] |  |
| enemy-a+enemy-b | normal | syn-combo | 100 | 7.0% [3.4%, 13.7%] | 55.3 [52.4, 58.1] | 7.8 [7.4, 8.3] |  |
| enemy-c+enemy-d | normal | syn-combo | 100 | 9.0% [4.8%, 16.2%] | 58.7 [58.3, 59.1] | 9.8 [9.7, 10.0] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-combo | 100 | 53.0% [43.3%, 62.5%] | 53.9 [52.5, 55.3] | 12.1 [11.7, 12.6] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 5.3 [5.2, 5.4] |  |
| enemy-b+enemy-c | normal | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 7.7 [7.5, 7.8] |  |
| elite-a | elite | syn-combo | 100 | 16.0% [10.1%, 24.4%] | 55.4 [54.5, 56.3] | 8.2 [8.0, 8.3] |  |
| elite-b | elite | syn-combo | 100 | 65.0% [55.3%, 73.6%] | 51.6 [50.2, 53.1] | 9.7 [9.5, 9.9] |  |
| boss-a | boss | syn-combo | 100 | 0.0% [0.0%, 3.7%] | n/a | 8.1 [7.9, 8.3] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 14.3 [13.3, 15.4] | 8.4 [8.2, 8.5] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 10.8 [10.1, 11.6] | 8.3 [8.1, 8.4] |  |
| enemy-b | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 9.1 [8.3, 9.9] | 10.5 [10.3, 10.7] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 18.6 [17.4, 19.8] | 13.3 [12.9, 13.6] |  |
| enemy-c | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 28.6 [27.1, 30.0] | 13.2 [12.9, 13.5] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 29.7 [28.4, 31.0] | 11.0 [10.7, 11.3] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 25.9 [24.8, 26.9] | 11.1 [10.8, 11.4] |  |
| enemy-a+enemy-b | normal | syn-mixed | 300 | 96.7% [94.0%, 98.2%] | 41.8 [40.5, 43.1] | 16.1 [15.6, 16.7] |  |
| enemy-c+enemy-d | normal | syn-mixed | 300 | 88.0% [83.8%, 91.2%] | 42.8 [41.4, 44.2] | 15.8 [15.3, 16.3] |  |
| enemy-b+enemy-d+enemy-d | normal | syn-mixed | 300 | 99.7% [98.1%, 99.9%] | 33.2 [31.6, 34.7] | 16.2 [15.7, 16.8] |  |
| enemy-a+enemy-b+enemy-d | normal | syn-mixed | 300 | 43.3% [37.8%, 49.0%] | 52.9 [52.0, 53.8] | 14.8 [13.8, 15.8] |  |
| enemy-b+enemy-c | normal | syn-mixed | 300 | 17.3% [13.5%, 22.0%] | 52.1 [50.5, 53.8] | 15.9 [15.1, 16.7] |  |
| elite-a | elite | syn-mixed | 300 | 15.7% [12.0%, 20.2%] | 53.0 [51.7, 54.3] | 12.7 [12.3, 13.0] |  |
| elite-b | elite | syn-mixed | 300 | 93.7% [90.3%, 95.9%] | 39.2 [37.6, 40.7] | 15.6 [15.2, 16.0] |  |
| boss-a | boss | syn-mixed | 300 | 0.0% [0.0%, 1.3%] | n/a | 14.9 [14.4, 15.4] |  |


## Fight length distribution

Turns per fight with the mid deck set (starter + 5 sampled cards). Mean has a 95% CI; p10/median/p90 show spread (a fight that is usually 4 turns but sometimes 12 is a pacing problem the mean hides). Histogram buckets are turn counts (last bucket = 15+). 15 fights x 100 seeds = 1500 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.

### random bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 11.12 [10.96, 11.28] | 9 | 11 | 13 | 3-6 | HIGH |
| enemy-d+enemy-d | normal | 12.22 [12.05, 12.39] | 10 | 12 | 14 | 3-6 | HIGH |
| enemy-b | normal | 15.01 [14.80, 15.23] | 13 | 15 | 17 | 3-6 | HIGH |
| enemy-b+enemy-d | normal | 20.59 [20.20, 20.98] | 14 | 21 | 24 | 3-6 | HIGH |
| enemy-c | normal | 16.49 [16.11, 16.86] | 13 | 16 | 21 | 3-6 | HIGH |
| enemy-a+enemy-d | normal | 14.75 [14.32, 15.18] | 10 | 16 | 19 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 14.58 [14.06, 15.10] | 8 | 14 | 20 | 3-6 | HIGH |
| enemy-a+enemy-b | normal | 10.74 [10.41, 11.06] | 8 | 10 | 14 | 3-6 | HIGH |
| enemy-c+enemy-d | normal | 12.94 [12.53, 13.34] | 10 | 11 | 18 | 3-6 | HIGH |
| enemy-b+enemy-d+enemy-d | normal | 14.06 [13.33, 14.80] | 8 | 11 | 24.200000000000045 | 3-6 | HIGH |
| enemy-a+enemy-b+enemy-d | normal | 7.33 [7.13, 7.53] | 5 | 8 | 10 | 3-6 | HIGH |
| enemy-b+enemy-c | normal | 10.75 [10.46, 11.03] | 8 | 10 | 15 | 3-6 | HIGH |
| elite-a | elite | 10.89 [10.66, 11.12] | 9 | 11 | 13 | 5-9 | HIGH |
| elite-b | elite | 17.67 [17.09, 18.26] | 12 | 17 | 26 | 5-9 | HIGH |
| boss-a | boss | 12.00 [11.70, 12.29] | 9 | 13 | 15 | 8-14 | ok |

```
enemy-a (normal)
 7     2 
 8     4 #
 9    26 ######
10    65 ################
11    99 ########################
12    57 ##############
13    31 ########
14    11 ###
15+    5 #
```

```
enemy-d+enemy-d (normal)
 8     4 #
 9     9 ##
10    19 #####
11    55 ##############
12    92 ########################
13    58 ###############
14    47 ############
15+   16 ####
```

```
enemy-b (normal)
11     9 #
12    14 ##
13    51 ######
14    32 ####
15+  194 ########################
```

```
enemy-b+enemy-d (normal)
11     1 
12     2 
14    30 ###
15+  267 ########################
```

```
enemy-c (normal)
10     6 #
11    15 ##
13    65 #######
15+  214 ########################
```

```
enemy-a+enemy-d (normal)
 6     1 
 8    16 ##
 9    10 #
10    29 ####
11     4 #
12    47 #######
13    20 ###
14    12 ##
15+  161 ########################
```

```
enemy-d+enemy-d+enemy-d (normal)
 7     6 #
 8    29 #####
10    47 ########
11    35 ######
13    24 ####
14    15 ###
15+  144 ########################
```

```
enemy-a+enemy-b (normal)
 6     9 ##
 8    79 #####################
 9    17 #####
10    90 ########################
12    32 #########
13     4 #
14    40 ###########
15+   29 ########
```

```
enemy-c+enemy-d (normal)
 8    20 #####
10    70 ##################
11    61 ################
13    55 ##############
15+   94 ########################
```

```
enemy-b+enemy-d+enemy-d (normal)
 6     3 #
 7     5 #
 8    36 #########
10    92 ########################
11    19 #####
12     5 #
13    12 ###
14    44 ###########
15+   84 ######################
```

```
enemy-a+enemy-b+enemy-d (normal)
 4     1 
 5    32 #######
 6   109 ########################
 7     4 #
 8   103 #######################
 9     1 
10    41 #########
12     8 ##
13     1 
```

```
enemy-b+enemy-c (normal)
 6     1 
 8    72 ##############
10   126 ########################
11    23 ####
12     2 
13    26 #####
14    10 ##
15+   40 ########
```

```
elite-a (elite)
 7     6 #
 9   116 ########################
11    89 ##################
13    70 ##############
15+   19 ####
```

```
elite-b (elite)
 9     3 
10     5 #
12    58 #######
13    20 ##
15+  214 ########################
```

```
boss-a (boss)
 7     8 ##
 9    90 ####################
12    43 ##########
13   108 ########################
15+   51 ###########
```

### greedy bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 9.82 [9.66, 9.98] | 8 | 10 | 12 | 3-6 | HIGH |
| enemy-d+enemy-d | normal | 9.49 [9.36, 9.62] | 8 | 9 | 11 | 3-6 | HIGH |
| enemy-b | normal | 11.79 [11.59, 11.99] | 10 | 11 | 15 | 3-6 | HIGH |
| enemy-b+enemy-d | normal | 16.65 [16.40, 16.90] | 14 | 16 | 20 | 3-6 | HIGH |
| enemy-c | normal | 16.23 [15.93, 16.53] | 14 | 15 | 20 | 3-6 | HIGH |
| enemy-a+enemy-d | normal | 14.99 [14.75, 15.24] | 13 | 14 | 18 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 14.23 [14.03, 14.43] | 12 | 14 | 17 | 3-6 | HIGH |
| enemy-a+enemy-b | normal | 19.33 [18.64, 20.02] | 10 | 19 | 27 | 3-6 | HIGH |
| enemy-c+enemy-d | normal | 19.17 [18.61, 19.73] | 13 | 18 | 27 | 3-6 | HIGH |
| enemy-b+enemy-d+enemy-d | normal | 21.85 [21.45, 22.26] | 18 | 21 | 27 | 3-6 | HIGH |
| enemy-a+enemy-b+enemy-d | normal | 13.19 [12.21, 14.16] | 6 | 9 | 32 | 3-6 | HIGH |
| enemy-b+enemy-c | normal | 14.71 [14.00, 15.41] | 10 | 11 | 25 | 3-6 | HIGH |
| elite-a | elite | 13.21 [12.83, 13.59] | 9 | 13 | 19 | 5-9 | HIGH |
| elite-b | elite | 20.04 [19.53, 20.55] | 15 | 18.5 | 26 | 5-9 | HIGH |
| boss-a | boss | 14.62 [14.19, 15.06] | 9 | 13 | 21 | 8-14 | HIGH |

```
enemy-a (normal)
 7     9 ##
 8    44 ############
 9    87 ########################
10    55 ###############
11    71 ####################
12    24 #######
13    10 ###
```

```
enemy-d+enemy-d (normal)
 7     5 #
 8    55 ############
 9   107 ########################
10    60 #############
11    67 ###############
12     6 #
```

```
enemy-b (normal)
 9    23 #####
10    40 #########
11   108 ########################
12    24 #####
13    50 ###########
14    21 #####
15+   34 ########
```

```
enemy-b+enemy-d (normal)
13    17 ##
14    16 #
15+  267 ########################
```

```
enemy-c (normal)
11     3 
13    25 ###
14    89 ############
15+  183 ########################
```

```
enemy-a+enemy-d (normal)
11     6 #
12    19 ###
13    61 ##########
14    73 ############
15+  141 ########################
```

```
enemy-d+enemy-d+enemy-d (normal)
11     8 ##
12    46 #########
13    67 ##############
14    61 ############
15+  118 ########################
```

```
enemy-a+enemy-b (normal)
 6     1 
 8    24 ###
10    20 ##
12     4 
14    26 ###
15+  225 ########################
```

```
enemy-c+enemy-d (normal)
10     2 
11     5 
13    30 ###
15+  263 ########################
```

```
enemy-b+enemy-d+enemy-d (normal)
 8     1 
12     1 
14     7 #
15+  291 ########################
```

```
enemy-a+enemy-b+enemy-d (normal)
 5     2 
 6    37 ########
 8   105 ########################
 9     9 ##
10    37 ########
12    12 ###
13     1 
14    16 ####
15+   81 ###################
```

```
enemy-b+enemy-c (normal)
 8     9 ##
10   121 ########################
11    37 #######
12     1 
13    23 #####
14     2 
15+  107 #####################
```

```
elite-a (elite)
 7     1 
 9    51 ############
11    82 ###################
13    64 ###############
15+  102 ########################
```

```
elite-b (elite)
12     6 
13     2 
15+  292 ########################
```

```
boss-a (boss)
 9    37 ########
12    40 ########
13   106 ######################
15+  117 ########################
```

### smart bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 8.69 [8.55, 8.83] | 7 | 8.5 | 10 | 3-6 | HIGH |
| enemy-d+enemy-d | normal | 8.99 [8.86, 9.12] | 7.900000000000002 | 9 | 10 | 3-6 | HIGH |
| enemy-b | normal | 10.91 [10.73, 11.09] | 9 | 10 | 13 | 3-6 | HIGH |
| enemy-b+enemy-d | normal | 15.58 [15.35, 15.80] | 13 | 16 | 18 | 3-6 | HIGH |
| enemy-c | normal | 14.33 [14.04, 14.61] | 11 | 13 | 18 | 3-6 | HIGH |
| enemy-a+enemy-d | normal | 12.55 [12.33, 12.78] | 10 | 12 | 15 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 13.11 [12.92, 13.30] | 11 | 14 | 15 | 3-6 | HIGH |
| enemy-a+enemy-b | normal | 15.78 [15.12, 16.45] | 8 | 16 | 23 | 3-6 | HIGH |
| enemy-c+enemy-d | normal | 16.03 [15.51, 16.55] | 11 | 15 | 22 | 3-6 | HIGH |
| enemy-b+enemy-d+enemy-d | normal | 18.47 [17.97, 18.96] | 14 | 18 | 23 | 3-6 | HIGH |
| enemy-a+enemy-b+enemy-d | normal | 10.66 [9.82, 11.50] | 6 | 8 | 28 | 3-6 | HIGH |
| enemy-b+enemy-c | normal | 11.90 [11.44, 12.35] | 8 | 10 | 18 | 3-6 | HIGH |
| elite-a | elite | 11.58 [11.27, 11.88] | 9 | 11 | 15 | 5-9 | HIGH |
| elite-b | elite | 16.30 [15.83, 16.77] | 12 | 15 | 22 | 5-9 | HIGH |
| boss-a | boss | 13.36 [12.95, 13.77] | 9 | 13 | 19 | 8-14 | ok |

```
enemy-a (normal)
 6     3 #
 7    53 ##############
 8    94 ########################
 9    53 ##############
10    83 #####################
11    10 ###
12     4 #
```

```
enemy-d+enemy-d (normal)
 6     2 
 7    28 #######
 8    67 ################
 9   103 ########################
10    76 ##################
11    22 #####
12     2 
```

```
enemy-b (normal)
 8     3 #
 9    66 ##################
10    88 ########################
11    32 #########
12    32 #########
13    70 ###################
14     6 ##
15+    3 #
```

```
enemy-b+enemy-d (normal)
11     4 
12    10 #
13    41 #####
14    33 ####
15+  212 ########################
```

```
enemy-c (normal)
10     3 #
11    42 ########
12    31 ######
13    84 #################
14    21 ####
15+  119 ########################
```

```
enemy-a+enemy-d (normal)
 7     1 
 8     8 ###
 9     2 #
10    24 ########
11    61 ###################
12    76 ########################
13    16 #####
14    48 ###############
15+   64 ####################
```

```
enemy-d+enemy-d+enemy-d (normal)
 8     1 
 9     1 
10    21 ######
11    49 ###############
12    36 ###########
13    37 ###########
14    75 #######################
15+   80 ########################
```

```
enemy-a+enemy-b (normal)
 6     3 
 8    41 ######
 9     5 #
10    53 ########
12    20 ###
14    16 ##
15+  162 ########################
```

```
enemy-c+enemy-d (normal)
 8     1 
10    27 ####
11    44 ######
13    64 #########
15+  164 ########################
```

```
enemy-b+enemy-d+enemy-d (normal)
 8     2 
10    19 ##
11     1 
12     1 
14    54 ######
15+  223 ########################
```

```
enemy-a+enemy-b+enemy-d (normal)
 4     1 
 5     9 ##
 6    95 ########################
 7     2 #
 8    96 ########################
10    36 #########
12     7 ##
14    11 ###
15+   43 ###########
```

```
enemy-b+enemy-c (normal)
 6     1 
 8    98 ########################
10    73 ##################
11    10 ##
13    20 #####
14     1 
15+   97 ########################
```

```
elite-a (elite)
 7     8 ##
 9   107 ########################
11    60 #############
13    63 ##############
15+   62 ##############
```

```
elite-b (elite)
 9     6 #
10     6 #
12    86 ###########
13    11 #
15+  191 ########################
```

```
boss-a (boss)
 7     4 #
 9    75 #################
12    35 ########
13    80 ##################
15+  106 ########################
```


## Card effect: ablation and addition

Each row compares the starter deck WITH the card against the same deck WITHOUT it, on identical seeds (paired). Changes are "with minus without"; a negative HP-lost change is good for the player. Brackets are 95% confidence intervals. 15 fights x 60 seeds = 900 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.
Verdict reads the headline metric (HP lost, negligible if within +-1): INCONCLUSIVE means the interval spans zero and is too wide to call the card negligible. Add seeds before concluding anything.
A card added to the starter deck shows its stand-alone value. Cards that need partners (synergy) will look weak here; see the pair experiment.

### random bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| attack-echo | power | 1 | yes | +21.3 [+18.7, +24.0] pts | -7.9 [-8.6, -7.2] | +4.66 [+4.31, +5.02] | better |
| cryofreeze | power | 2 | yes | +23.4 [+20.7, +26.2] pts | -7.6 [-8.3, -6.9] | +4.95 [+4.57, +5.33] | better |
| end-guard | power | 1 | yes | +18.9 [+16.3, +21.4] pts | -7.2 [-7.8, -6.5] | +4.50 [+4.16, +4.85] | better |
| fortify | power | 2 | yes | +16.1 [+13.7, +18.6] pts | -5.4 [-6.0, -4.8] | +3.76 [+3.43, +4.08] | better |
| heating-up | skill | 1 | yes | +17.9 [+15.3, +20.5] pts | -4.5 [-5.1, -4.0] | -2.41 [-2.67, -2.14] | better |
| pain-engine | power | 1 | yes | +19.3 [+16.8, +21.9] pts | -4.0 [-4.5, -3.5] | -1.47 [-1.73, -1.21] | better |
| heat-flash | attack | 0 | yes | +11.8 [+9.5, +14.0] pts | -3.9 [-4.4, -3.3] | +1.44 [+1.17, +1.70] | better |
| prime-a | skill | 0 | yes | +7.7 [+5.8, +9.6] pts | -3.3 [-3.8, -2.8] | +2.03 [+1.79, +2.27] | better |
| ice-barrier | skill | 1 | yes | +6.3 [+4.5, +8.2] pts | -2.6 [-3.1, -2.1] | +3.67 [+3.37, +3.97] | better |
| guarded-strike | attack | 1 | yes | +3.8 [+2.2, +5.3] pts | -2.3 [-2.8, -1.9] | +1.10 [+0.87, +1.32] | better |
| strengthen | power | 1 | yes | +5.9 [+4.2, +7.6] pts | -1.9 [-2.3, -1.5] | -1.07 [-1.30, -0.84] | better |
| frozen-shield | skill | 1 | yes | +3.2 [+1.7, +4.7] pts | -1.8 [-2.2, -1.4] | +2.35 [+2.11, +2.60] | better |
| big-block | skill | 2 | yes | +2.0 [+0.6, +3.4] pts | -1.5 [-1.9, -1.1] | +3.31 [+3.04, +3.59] | better |
| cauterize | skill | 1 | yes | +2.0 [+0.4, +3.6] pts | -1.4 [-1.8, -0.9] | +2.11 [+1.87, +2.35] | better |
| jab | attack | 0 | yes | +1.6 [+0.2, +2.9] pts | -1.2 [-1.6, -0.7] | -0.53 [-0.73, -0.32] | better |
| endless-winter | power | 1 | yes | +3.4 [+1.7, +5.2] pts | -1.1 [-1.5, -0.8] | +1.34 [+1.09, +1.59] | better |
| defend | skill | 1 | no | +0.4 [-1.1, +2.0] pts | -0.9 [-1.3, -0.5] | +1.66 [+1.43, +1.89] | better |
| opening-spark | power | 1 | yes | +1.0 [-0.5, +2.5] pts | -0.9 [-1.3, -0.5] | -0.94 [-1.15, -0.72] | better |
| weaken | skill | 1 | yes | -0.8 [-2.1, +0.5] pts | -0.8 [-1.2, -0.5] | +1.99 [+1.75, +2.24] | better |
| block-spark | power | 1 | yes | +0.6 [-0.9, +2.0] pts | -0.8 [-1.2, -0.4] | -0.93 [-1.15, -0.72] | better |
| scorching-wind | attack | 0 | yes | +0.8 [-0.5, +2.0] pts | -0.8 [-1.2, -0.4] | -0.38 [-0.57, -0.18] | better |
| apocalyptic-flame | attack | 3 | yes | +2.7 [+1.1, +4.3] pts | -0.8 [-1.2, -0.4] | -1.93 [-2.15, -1.71] | better |
| heat-warning | attack | 1 | yes | +0.3 [-1.2, +1.9] pts | -0.7 [-1.1, -0.3] | -1.41 [-1.62, -1.21] | better |
| crippling-heat | attack | 1 | yes | +0.1 [-1.4, +1.6] pts | -0.6 [-1.0, -0.2] | +0.39 [+0.19, +0.60] | better |
| ice-block | skill | 3 | yes | +0.1 [-1.3, +1.5] pts | -0.4 [-0.9, -0.0] | +2.76 [+2.49, +3.04] | better |
| hand-strike | attack | 1 | yes | -0.2 [-1.6, +1.2] pts | -0.3 [-0.7, +0.0] | -1.21 [-1.41, -1.01] | negligible |
| combo-strike | attack | 1 | yes | -0.7 [-2.1, +0.7] pts | -0.2 [-0.6, +0.2] | -1.16 [-1.36, -0.96] | negligible |
| cull | skill | 0 | yes | -0.9 [-2.3, +0.5] pts | -0.2 [-0.5, +0.2] | +0.02 [-0.21, +0.26] | negligible |
| heavy-hit | attack | 3 | yes | +0.4 [-0.9, +1.8] pts | -0.1 [-0.5, +0.3] | -1.78 [-1.99, -1.57] | negligible |
| single-use-strike | attack | 1 | yes | -2.3 [-3.8, -0.9] pts | +0.0 [-0.3, +0.4] | -0.34 [-0.54, -0.14] | negligible |
| focus | power | 1 | no | -1.4 [-2.7, -0.2] pts | +0.2 [-0.2, +0.5] | -0.17 [-0.38, +0.04] | negligible |
| expose | skill | 1 | yes | -2.0 [-3.4, -0.6] pts | +0.2 [-0.2, +0.5] | -1.09 [-1.29, -0.88] | negligible |
| power-up | skill | 1 | yes | -1.3 [-2.7, +0.1] pts | +0.2 [-0.1, +0.6] | -1.13 [-1.34, -0.92] | negligible |
| sunder | attack | 2 | yes | -1.9 [-3.3, -0.5] pts | +0.2 [-0.1, +0.6] | -1.72 [-1.93, -1.51] | negligible |
| kill-reward | power | 1 | yes | -2.1 [-3.4, -0.9] pts | +0.3 [-0.1, +0.6] | -0.30 [-0.51, -0.09] | negligible |
| strike | attack | 1 | no | -2.0 [-3.4, -0.6] pts | +0.3 [-0.0, +0.7] | -1.00 [-1.20, -0.80] | negligible |
| tag-a-echo | power | 1 | yes | -2.4 [-3.6, -1.3] pts | +0.4 [+0.0, +0.7] | -0.31 [-0.52, -0.11] | worse |
| double-strength | skill | 1 | yes | -2.4 [-3.6, -1.3] pts | +0.4 [+0.0, +0.7] | -0.31 [-0.52, -0.11] | worse |
| exhaust-engine | power | 1 | yes | -2.4 [-3.6, -1.3] pts | +0.4 [+0.0, +0.7] | -0.31 [-0.52, -0.11] | worse |
| hungering-cold | power | 1 | yes | -2.4 [-3.6, -1.3] pts | +0.4 [+0.0, +0.7] | -0.31 [-0.52, -0.11] | worse |
| bolt | attack | 2 | yes | -2.3 [-3.8, -0.9] pts | +0.6 [+0.2, +1.0] | -1.58 [-1.78, -1.38] | worse |
| opportunist | attack | 1 | yes | -2.2 [-3.6, -0.8] pts | +0.9 [+0.5, +1.3] | -0.80 [-1.01, -0.60] | worse |
| meteor-shower | attack | 2 | yes | -2.1 [-3.6, -0.6] pts | +1.1 [+0.7, +1.5] | -1.36 [-1.56, -1.15] | worse |
| block-slam | attack | 1 | yes | -2.9 [-4.3, -1.5] pts | +1.1 [+0.7, +1.5] | -0.73 [-0.94, -0.53] | worse |
| tag-a-payoff | attack | 1 | yes | -3.0 [-4.4, -1.6] pts | +1.2 [+0.8, +1.5] | -0.70 [-0.90, -0.49] | worse |
| exhaust-payoff | attack | 1 | yes | -3.4 [-4.8, -2.1] pts | +1.3 [+0.9, +1.7] | -0.62 [-0.82, -0.41] | worse |
| arctic-strike | attack | 1 | yes | -3.4 [-4.8, -2.1] pts | +1.3 [+0.9, +1.7] | -0.62 [-0.82, -0.41] | worse |
| hypothermia | skill | 1 | yes | -3.3 [-4.7, -2.0] pts | +1.4 [+1.0, +1.7] | -0.22 [-0.43, +0.00] | worse |
| glacial-spike | skill | 1 | yes | -3.3 [-4.7, -2.0] pts | +1.4 [+1.0, +1.7] | -0.22 [-0.43, +0.00] | worse |
| glaciate | attack | 2 | yes | -3.8 [-5.2, -2.4] pts | +1.4 [+1.0, +1.8] | -1.33 [-1.53, -1.12] | worse |
| quick-draw | skill | 1 | yes | -5.0 [-6.5, -3.5] pts | +2.1 [+1.7, +2.6] | -0.50 [-0.73, -0.27] | worse |
| blood-strike | attack | 1 | yes | -4.2 [-5.6, -2.8] pts | +2.4 [+2.0, +2.8] | -3.14 [-3.36, -2.93] | worse |
| molten-core | skill | 2 | yes | -6.3 [-7.9, -4.7] pts | +3.0 [+2.5, +3.5] | -0.75 [-1.00, -0.51] | worse |
| absolute-zero | skill | 3 | yes | -6.2 [-7.8, -4.6] pts | +3.1 [+2.5, +3.6] | -0.80 [-1.05, -0.54] | worse |

### random bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| cryofreeze | power | 2 | yes | +23.1 [+20.3, +25.9] pts | -8.8 [-9.5, -8.0] | +6.99 [+6.58, +7.39] | better |
| end-guard | power | 1 | yes | +21.9 [+19.2, +24.6] pts | -8.3 [-9.0, -7.6] | +6.43 [+6.04, +6.83] | better |
| attack-echo | power | 1 | yes | +20.4 [+17.8, +23.1] pts | -8.0 [-8.7, -7.3] | +6.05 [+5.66, +6.43] | better |
| fortify | power | 2 | yes | +17.2 [+14.7, +19.7] pts | -6.6 [-7.3, -6.0] | +5.75 [+5.39, +6.10] | better |
| heat-flash | attack | 0 | yes | +18.7 [+16.0, +21.3] pts | -5.8 [-6.4, -5.2] | +3.15 [+2.85, +3.46] | better |
| heating-up | skill | 1 | yes | +19.9 [+17.2, +22.5] pts | -5.3 [-5.9, -4.8] | -1.58 [-1.84, -1.32] | better |
| pain-engine | power | 1 | yes | +21.1 [+18.4, +23.8] pts | -4.8 [-5.3, -4.3] | -0.28 [-0.52, -0.03] | better |
| prime-a | skill | 0 | yes | +11.6 [+9.3, +13.8] pts | -4.5 [-5.1, -3.9] | +4.17 [+3.87, +4.47] | better |
| ice-barrier | skill | 1 | yes | +8.4 [+6.5, +10.4] pts | -3.7 [-4.2, -3.2] | +5.71 [+5.38, +6.04] | better |
| guarded-strike | attack | 1 | yes | +7.8 [+6.0, +9.6] pts | -3.2 [-3.6, -2.8] | +2.69 [+2.51, +2.87] | better |
| frozen-shield | skill | 1 | yes | +6.0 [+4.3, +7.7] pts | -2.6 [-3.0, -2.2] | +4.37 [+4.14, +4.60] | better |
| strengthen | power | 1 | yes | +6.4 [+4.7, +8.2] pts | -2.5 [-3.0, -2.1] | +0.18 [-0.04, +0.40] | better |
| cauterize | skill | 1 | yes | +5.7 [+3.8, +7.5] pts | -2.4 [-2.9, -2.0] | +4.17 [+3.88, +4.46] | better |
| big-block | skill | 2 | yes | +4.7 [+2.9, +6.4] pts | -2.3 [-2.7, -1.8] | +5.50 [+5.18, +5.83] | better |
| jab | attack | 0 | yes | +4.9 [+3.2, +6.6] pts | -2.2 [-2.6, -1.8] | +0.81 [+0.59, +1.03] | better |
| endless-winter | power | 1 | yes | +4.9 [+3.2, +6.6] pts | -2.1 [-2.5, -1.7] | +3.00 [+2.75, +3.25] | better |
| defend | skill | 1 | no | +3.8 [+2.1, +5.4] pts | -1.9 [-2.3, -1.5] | +3.63 [+3.35, +3.91] | better |
| scorching-wind | attack | 0 | yes | +3.6 [+2.0, +5.1] pts | -1.8 [-2.2, -1.4] | +1.02 [+0.80, +1.25] | better |
| opening-spark | power | 1 | yes | +3.4 [+1.9, +5.0] pts | -1.6 [-2.0, -1.3] | +0.34 [+0.13, +0.55] | better |
| weaken | skill | 1 | yes | +1.8 [+0.7, +2.9] pts | -1.6 [-1.9, -1.4] | +3.99 [+3.78, +4.19] | better |
| block-spark | power | 1 | yes | +3.0 [+1.5, +4.5] pts | -1.6 [-2.0, -1.2] | +0.34 [+0.14, +0.55] | better |
| ice-block | skill | 3 | yes | +2.2 [+0.8, +3.6] pts | -1.3 [-1.7, -0.9] | +4.80 [+4.50, +5.11] | better |
| heat-warning | attack | 1 | yes | +2.6 [+1.5, +3.6] pts | -1.3 [-1.5, -1.1] | -0.57 [-0.66, -0.48] | better |
| cull | skill | 0 | yes | +1.4 [+0.1, +2.8] pts | -1.2 [-1.6, -0.8] | +1.70 [+1.41, +1.98] | better |
| apocalyptic-flame | attack | 3 | yes | +3.7 [+2.0, +5.3] pts | -1.2 [-1.5, -0.8] | -1.23 [-1.44, -1.01] | better |
| crippling-heat | attack | 1 | yes | +1.7 [+0.7, +2.7] pts | -1.1 [-1.3, -0.9] | +1.78 [+1.65, +1.91] | better |
| hand-strike | attack | 1 | yes | +2.0 [+1.1, +2.9] pts | -0.9 [-1.0, -0.7] | -0.31 [-0.38, -0.24] | better |
| single-use-strike | attack | 1 | yes | +0.7 [-0.7, +2.0] pts | -0.8 [-1.1, -0.4] | +1.05 [+0.84, +1.26] | better |
| combo-strike | attack | 1 | yes | +1.1 [+0.4, +1.8] pts | -0.6 [-0.7, -0.5] | -0.24 [-0.30, -0.19] | better |
| power-up | skill | 1 | yes | +0.7 [-0.8, +2.1] pts | -0.5 [-0.9, -0.1] | -0.10 [-0.30, +0.09] | better |
| focus | power | 1 | no | -0.7 [-2.1, +0.7] pts | -0.5 [-0.9, -0.1] | +1.28 [+1.06, +1.50] | better |
| kill-reward | power | 1 | yes | +0.2 [-1.2, +1.6] pts | -0.4 [-0.7, -0.0] | +1.13 [+0.92, +1.34] | better |
| heavy-hit | attack | 3 | yes | +0.2 [-1.2, +1.6] pts | -0.3 [-0.6, +0.1] | -1.04 [-1.24, -0.84] | negligible |
| tag-a-echo | power | 1 | yes | -0.7 [-1.9, +0.6] pts | -0.3 [-0.6, +0.1] | +1.16 [+0.95, +1.37] | negligible |
| double-strength | skill | 1 | yes | -0.7 [-1.9, +0.6] pts | -0.3 [-0.6, +0.1] | +1.16 [+0.95, +1.37] | negligible |
| exhaust-engine | power | 1 | yes | -0.7 [-1.9, +0.6] pts | -0.3 [-0.6, +0.1] | +1.16 [+0.95, +1.37] | negligible |
| hungering-cold | power | 1 | yes | -0.7 [-1.9, +0.6] pts | -0.3 [-0.6, +0.1] | +1.16 [+0.95, +1.37] | negligible |
| expose | skill | 1 | yes | -0.7 [-1.5, +0.1] pts | -0.2 [-0.3, -0.1] | -0.10 [-0.15, -0.05] | better |
| sunder | attack | 2 | yes | -1.3 [-2.7, +0.0] pts | -0.2 [-0.5, +0.2] | -0.93 [-1.14, -0.73] | negligible |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| bolt | attack | 2 | yes | -2.0 [-3.3, -0.7] pts | +0.1 [-0.2, +0.5] | -0.73 [-0.93, -0.53] | negligible |
| meteor-shower | attack | 2 | yes | -0.3 [-1.9, +1.3] pts | +0.5 [+0.2, +0.9] | -0.36 [-0.56, -0.16] | worse |
| opportunist | attack | 1 | yes | -2.1 [-3.1, -1.2] pts | +0.6 [+0.5, +0.7] | +0.23 [+0.18, +0.29] | worse |
| block-slam | attack | 1 | yes | -2.3 [-3.4, -1.3] pts | +0.6 [+0.5, +0.8] | +0.26 [+0.19, +0.33] | worse |
| tag-a-payoff | attack | 1 | yes | -2.9 [-4.0, -1.8] pts | +0.8 [+0.7, +1.0] | +0.35 [+0.28, +0.43] | worse |
| exhaust-payoff | attack | 1 | yes | -3.2 [-4.4, -2.1] pts | +1.0 [+0.8, +1.2] | +0.47 [+0.38, +0.57] | worse |
| arctic-strike | attack | 1 | yes | -3.2 [-4.4, -2.1] pts | +1.0 [+0.8, +1.2] | +0.47 [+0.38, +0.57] | worse |
| glaciate | attack | 2 | yes | -3.7 [-5.0, -2.3] pts | +1.1 [+0.7, +1.4] | -0.43 [-0.64, -0.22] | worse |
| hypothermia | skill | 1 | yes | -4.1 [-5.4, -2.8] pts | +1.1 [+0.8, +1.3] | +0.93 [+0.79, +1.06] | worse |
| glacial-spike | skill | 1 | yes | -4.1 [-5.4, -2.8] pts | +1.1 [+0.8, +1.3] | +0.93 [+0.79, +1.06] | worse |
| quick-draw | skill | 1 | yes | -4.6 [-6.1, -3.1] pts | +1.6 [+1.3, +2.0] | +0.70 [+0.46, +0.94] | worse |
| blood-strike | attack | 1 | yes | -4.8 [-6.2, -3.4] pts | +2.4 [+2.1, +2.8] | -2.75 [-2.90, -2.60] | worse |
| molten-core | skill | 2 | yes | -6.6 [-8.2, -4.9] pts | +2.7 [+2.2, +3.2] | +0.39 [+0.12, +0.65] | worse |
| absolute-zero | skill | 3 | yes | -6.1 [-7.8, -4.5] pts | +3.0 [+2.4, +3.5] | +0.20 [-0.08, +0.47] | worse |

### greedy bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| cryofreeze | power | 2 | yes | +16.3 [+13.9, +18.7] pts | -12.1 [-13.1, -11.2] | +2.11 [+1.65, +2.58] | better |
| end-guard | power | 1 | yes | +14.3 [+12.0, +16.6] pts | -10.8 [-11.6, -10.1] | +3.47 [+3.07, +3.86] | better |
| ice-block | skill | 3 | yes | +15.7 [+13.3, +18.1] pts | -10.4 [-11.3, -9.5] | +7.60 [+7.07, +8.14] | better |
| fortify | power | 2 | yes | +13.8 [+11.5, +16.0] pts | -9.5 [-10.3, -8.7] | +1.81 [+1.42, +2.20] | better |
| big-block | skill | 2 | yes | +11.6 [+9.4, +13.7] pts | -8.9 [-9.7, -8.1] | +5.15 [+4.67, +5.62] | better |
| attack-echo | power | 1 | yes | +6.7 [+5.0, +8.3] pts | -5.9 [-6.5, -5.4] | +1.73 [+1.51, +1.94] | better |
| guarded-strike | attack | 1 | yes | +8.8 [+6.9, +10.6] pts | -5.6 [-6.2, -5.1] | +0.31 [+0.03, +0.59] | better |
| frozen-shield | skill | 1 | yes | +4.7 [+3.1, +6.2] pts | -4.9 [-5.5, -4.3] | +3.57 [+3.25, +3.89] | better |
| ice-barrier | skill | 1 | yes | +5.6 [+3.9, +7.2] pts | -4.9 [-5.5, -4.3] | +2.08 [+1.81, +2.36] | better |
| pain-engine | power | 1 | yes | +13.1 [+10.9, +15.3] pts | -4.9 [-5.5, -4.3] | -3.34 [-3.63, -3.04] | better |
| focus | power | 1 | no | +3.9 [+2.6, +5.2] pts | -4.4 [-4.9, -3.9] | +1.67 [+1.46, +1.88] | better |
| heat-flash | attack | 0 | yes | +8.3 [+6.4, +10.3] pts | -4.1 [-4.7, -3.6] | -0.91 [-1.16, -0.66] | better |
| cauterize | skill | 1 | yes | +3.0 [+1.6, +4.4] pts | -4.1 [-4.7, -3.6] | +2.41 [+2.14, +2.67] | better |
| heating-up | skill | 1 | yes | +11.6 [+9.5, +13.6] pts | -3.9 [-4.5, -3.3] | -5.76 [-6.05, -5.46] | better |
| strengthen | power | 1 | yes | +6.9 [+5.1, +8.7] pts | -2.9 [-3.4, -2.4] | -2.53 [-2.76, -2.30] | better |
| defend | skill | 1 | no | +2.2 [+0.8, +3.6] pts | -2.7 [-3.3, -2.2] | +2.27 [+2.02, +2.51] | better |
| prime-a | skill | 0 | yes | +3.1 [+1.8, +4.4] pts | -2.3 [-2.7, -1.8] | +0.11 [-0.11, +0.32] | better |
| endless-winter | power | 1 | yes | +4.7 [+3.1, +6.3] pts | -2.1 [-2.6, -1.6] | +1.48 [+1.21, +1.75] | better |
| weaken | skill | 1 | yes | +1.6 [+0.1, +3.0] pts | -1.8 [-2.4, -1.3] | +3.95 [+3.66, +4.24] | better |
| opening-spark | power | 1 | yes | +4.3 [+2.8, +5.9] pts | -1.6 [-2.0, -1.1] | -1.90 [-2.10, -1.71] | better |
| crippling-heat | attack | 1 | yes | +1.9 [+0.4, +3.3] pts | -1.1 [-1.6, -0.6] | +0.68 [+0.45, +0.92] | better |
| heat-warning | attack | 1 | yes | +6.8 [+5.0, +8.6] pts | -1.1 [-1.6, -0.6] | -4.42 [-4.66, -4.17] | better |
| block-spark | power | 1 | yes | +3.2 [+1.8, +4.6] pts | -1.0 [-1.4, -0.6] | -1.45 [-1.64, -1.25] | better |
| single-use-strike | attack | 1 | yes | +1.1 [-0.2, +2.4] pts | +0.3 [-0.1, +0.6] | -0.24 [-0.43, -0.05] | negligible |
| kill-reward | power | 1 | yes | -0.2 [-1.6, +1.1] pts | +1.0 [+0.6, +1.3] | -0.05 [-0.26, +0.15] | worse |
| tag-a-echo | power | 1 | yes | -0.2 [-1.6, +1.1] pts | +1.0 [+0.7, +1.4] | +0.06 [-0.15, +0.26] | worse |
| exhaust-engine | power | 1 | yes | -0.2 [-1.6, +1.1] pts | +1.0 [+0.7, +1.4] | +0.06 [-0.15, +0.26] | worse |
| hungering-cold | power | 1 | yes | -0.2 [-1.6, +1.1] pts | +1.0 [+0.7, +1.4] | +0.06 [-0.15, +0.26] | worse |
| heavy-hit | attack | 3 | yes | -0.1 [-1.7, +1.5] pts | +1.8 [+1.3, +2.3] | -3.52 [-3.75, -3.29] | worse |
| quick-draw | skill | 1 | yes | -9.6 [-11.8, -7.3] pts | +1.8 [+1.3, +2.3] | +3.62 [+3.27, +3.96] | worse |
| expose | skill | 1 | yes | -1.4 [-3.1, +0.2] pts | +1.9 [+1.4, +2.3] | -3.02 [-3.25, -2.79] | worse |
| power-up | skill | 1 | yes | -2.0 [-3.7, -0.3] pts | +2.1 [+1.6, +2.5] | -2.77 [-3.00, -2.54] | worse |
| jab | attack | 0 | yes | -2.3 [-3.9, -0.8] pts | +2.3 [+1.8, +2.7] | -2.30 [-2.53, -2.08] | worse |
| sunder | attack | 2 | yes | +0.7 [-0.8, +2.1] pts | +2.6 [+2.1, +3.1] | -4.42 [-4.63, -4.20] | worse |
| combo-strike | attack | 1 | yes | -3.8 [-5.4, -2.1] pts | +2.7 [+2.2, +3.1] | -2.13 [-2.36, -1.90] | worse |
| scorching-wind | attack | 0 | yes | -3.9 [-5.5, -2.3] pts | +2.9 [+2.4, +3.3] | -1.91 [-2.14, -1.69] | worse |
| bolt | attack | 2 | yes | -4.4 [-6.2, -2.6] pts | +3.0 [+2.6, +3.5] | -1.88 [-2.10, -1.66] | worse |
| hand-strike | attack | 1 | yes | -5.9 [-7.7, -4.1] pts | +3.2 [+2.7, +3.7] | -1.80 [-2.03, -1.57] | worse |
| strike | attack | 1 | no | -6.1 [-7.9, -4.3] pts | +3.4 [+2.9, +3.8] | -1.73 [-1.96, -1.49] | worse |
| opportunist | attack | 1 | yes | -7.1 [-9.0, -5.2] pts | +3.6 [+3.1, +4.1] | -1.53 [-1.77, -1.29] | worse |
| tag-a-payoff | attack | 1 | yes | -7.6 [-9.5, -5.6] pts | +3.7 [+3.2, +4.2] | -1.44 [-1.68, -1.20] | worse |
| exhaust-payoff | attack | 1 | yes | -7.9 [-9.9, -5.9] pts | +3.8 [+3.4, +4.3] | -1.38 [-1.63, -1.14] | worse |
| arctic-strike | attack | 1 | yes | -7.9 [-9.9, -5.9] pts | +3.8 [+3.4, +4.3] | -1.38 [-1.63, -1.14] | worse |
| block-slam | attack | 1 | yes | -8.1 [-10.1, -6.1] pts | +4.1 [+3.6, +4.6] | -1.29 [-1.55, -1.03] | worse |
| double-strength | skill | 1 | yes | -8.1 [-10.1, -6.1] pts | +4.1 [+3.6, +4.6] | -1.29 [-1.55, -1.03] | worse |
| cull | skill | 0 | yes | -8.1 [-10.1, -6.1] pts | +4.1 [+3.6, +4.6] | -1.29 [-1.55, -1.03] | worse |
| meteor-shower | attack | 2 | yes | -8.1 [-10.1, -6.1] pts | +4.1 [+3.6, +4.6] | -1.29 [-1.55, -1.03] | worse |
| molten-core | skill | 2 | yes | -8.1 [-10.1, -6.1] pts | +4.1 [+3.6, +4.6] | -1.29 [-1.55, -1.03] | worse |
| absolute-zero | skill | 3 | yes | -8.1 [-10.1, -6.1] pts | +4.1 [+3.6, +4.6] | -1.29 [-1.55, -1.03] | worse |
| glaciate | attack | 2 | yes | -9.7 [-11.8, -7.6] pts | +4.5 [+4.0, +5.0] | -1.09 [-1.35, -0.82] | worse |
| apocalyptic-flame | attack | 3 | yes | -0.6 [-2.3, +1.2] pts | +4.9 [+4.3, +5.4] | -7.89 [-8.17, -7.62] | worse |
| hypothermia | skill | 1 | yes | -14.0 [-16.3, -11.7] pts | +6.0 [+5.4, +6.6] | +1.08 [+0.74, +1.41] | worse |
| glacial-spike | skill | 1 | yes | -14.0 [-16.3, -11.7] pts | +6.0 [+5.4, +6.6] | +1.08 [+0.74, +1.41] | worse |
| blood-strike | attack | 1 | yes | -17.2 [-19.7, -14.7] pts | +13.2 [+12.4, +14.0] | -6.87 [-7.17, -6.57] | worse |

### greedy bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ice-block | skill | 3 | yes | +21.3 [+18.7, +24.0] pts | -15.9 [-16.8, -14.9] | +10.78 [+10.14, +11.42] | better |
| cryofreeze | power | 2 | yes | +17.4 [+15.0, +19.9] pts | -15.2 [-16.3, -14.1] | +3.81 [+3.27, +4.35] | better |
| end-guard | power | 1 | yes | +16.8 [+14.3, +19.2] pts | -14.4 [-15.3, -13.5] | +5.94 [+5.44, +6.44] | better |
| big-block | skill | 2 | yes | +13.8 [+11.5, +16.0] pts | -12.9 [-13.8, -12.0] | +7.60 [+7.04, +8.17] | better |
| fortify | power | 2 | yes | +16.7 [+14.2, +19.1] pts | -12.8 [-13.7, -11.8] | +4.00 [+3.49, +4.50] | better |
| guarded-strike | attack | 1 | yes | +13.0 [+10.8, +15.2] pts | -10.1 [-10.8, -9.4] | +2.11 [+1.73, +2.49] | better |
| focus | power | 1 | no | +8.7 [+6.8, +10.5] pts | -9.4 [-10.1, -8.6] | +4.05 [+3.69, +4.41] | better |
| heat-flash | attack | 0 | yes | +11.9 [+9.8, +14.0] pts | -8.9 [-9.6, -8.2] | +0.70 [+0.41, +0.99] | better |
| frozen-shield | skill | 1 | yes | +7.6 [+5.8, +9.3] pts | -8.7 [-9.4, -8.0] | +6.51 [+6.09, +6.92] | better |
| pain-engine | power | 1 | yes | +16.7 [+14.2, +19.1] pts | -8.5 [-9.2, -7.9] | -1.07 [-1.39, -0.74] | better |
| attack-echo | power | 1 | yes | +7.1 [+5.4, +8.8] pts | -8.5 [-9.2, -7.8] | +3.65 [+3.36, +3.93] | better |
| cauterize | skill | 1 | yes | +5.9 [+4.3, +7.4] pts | -8.1 [-8.7, -7.5] | +4.88 [+4.55, +5.21] | better |
| ice-barrier | skill | 1 | yes | +7.8 [+6.0, +9.5] pts | -7.9 [-8.5, -7.2] | +4.40 [+4.06, +4.75] | better |
| strengthen | power | 1 | yes | +9.9 [+7.9, +11.8] pts | -6.8 [-7.4, -6.2] | -0.66 [-0.94, -0.39] | better |
| defend | skill | 1 | no | +4.7 [+3.2, +6.1] pts | -6.7 [-7.3, -6.2] | +4.65 [+4.36, +4.94] | better |
| endless-winter | power | 1 | yes | +10.0 [+8.0, +12.0] pts | -6.0 [-6.6, -5.4] | +3.99 [+3.63, +4.35] | better |
| heating-up | skill | 1 | yes | +11.0 [+9.0, +13.0] pts | -6.0 [-6.6, -5.4] | -4.24 [-4.51, -3.96] | better |
| prime-a | skill | 0 | yes | +5.8 [+4.3, +7.3] pts | -5.9 [-6.4, -5.4] | +2.07 [+1.81, +2.32] | better |
| opening-spark | power | 1 | yes | +7.6 [+5.8, +9.3] pts | -5.7 [-6.3, -5.2] | -0.18 [-0.41, +0.05] | better |
| crippling-heat | attack | 1 | yes | +5.7 [+4.2, +7.2] pts | -5.4 [-5.9, -4.8] | +2.65 [+2.44, +2.85] | better |
| block-spark | power | 1 | yes | +6.3 [+4.7, +7.9] pts | -5.2 [-5.8, -4.7] | +0.27 [+0.05, +0.49] | better |
| weaken | skill | 1 | yes | +2.9 [+1.8, +4.0] pts | -5.1 [-5.7, -4.5] | +6.75 [+6.46, +7.04] | better |
| heat-warning | attack | 1 | yes | +9.2 [+7.3, +11.1] pts | -4.6 [-5.1, -4.1] | -3.20 [-3.42, -2.97] | better |
| single-use-strike | attack | 1 | yes | +3.8 [+2.5, +5.0] pts | -4.0 [-4.5, -3.6] | +1.66 [+1.47, +1.86] | better |
| kill-reward | power | 1 | yes | +3.6 [+2.3, +4.8] pts | -3.3 [-3.8, -2.9] | +2.09 [+1.90, +2.29] | better |
| tag-a-echo | power | 1 | yes | +3.3 [+2.1, +4.6] pts | -3.3 [-3.8, -2.9] | +2.19 [+2.00, +2.38] | better |
| exhaust-engine | power | 1 | yes | +3.3 [+2.1, +4.6] pts | -3.3 [-3.8, -2.9] | +2.19 [+2.00, +2.38] | better |
| hungering-cold | power | 1 | yes | +3.3 [+2.1, +4.6] pts | -3.3 [-3.8, -2.9] | +2.19 [+2.00, +2.38] | better |
| power-up | skill | 1 | yes | +3.1 [+1.8, +4.4] pts | -2.1 [-2.5, -1.7] | -1.58 [-1.76, -1.40] | better |
| quick-draw | skill | 1 | yes | -6.1 [-8.3, -3.9] pts | -1.5 [-2.0, -0.9] | +6.02 [+5.66, +6.37] | better |
| jab | attack | 0 | yes | +2.2 [+1.2, +3.3] pts | -1.3 [-1.5, -1.0] | -0.59 [-0.73, -0.45] | better |
| heavy-hit | attack | 3 | yes | +3.3 [+1.9, +4.7] pts | -1.2 [-1.5, -0.8] | -2.38 [-2.58, -2.19] | better |
| expose | skill | 1 | yes | +1.6 [+0.4, +2.7] pts | -0.9 [-1.2, -0.6] | -1.17 [-1.32, -1.01] | better |
| combo-strike | attack | 1 | yes | +1.7 [+0.7, +2.6] pts | -0.7 [-0.8, -0.5] | -0.56 [-0.67, -0.46] | better |
| bolt | attack | 2 | yes | +1.1 [+0.3, +1.9] pts | -0.5 [-0.7, -0.2] | -0.34 [-0.44, -0.23] | better |
| scorching-wind | attack | 0 | yes | +0.9 [+0.0, +1.8] pts | -0.4 [-0.6, -0.2] | -0.09 [-0.21, +0.02] | better |
| hand-strike | attack | 1 | yes | +0.4 [-0.2, +1.1] pts | -0.2 [-0.3, -0.0] | -0.20 [-0.28, -0.13] | better |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| opportunist | attack | 1 | yes | -0.3 [-0.9, +0.2] pts | +0.6 [+0.4, +0.8] | +0.32 [+0.23, +0.40] | worse |
| tag-a-payoff | attack | 1 | yes | -1.0 [-1.7, -0.3] pts | +0.8 [+0.6, +1.0] | +0.46 [+0.37, +0.55] | worse |
| exhaust-payoff | attack | 1 | yes | -1.3 [-2.1, -0.5] pts | +1.0 [+0.8, +1.2] | +0.63 [+0.53, +0.73] | worse |
| arctic-strike | attack | 1 | yes | -1.3 [-2.1, -0.5] pts | +1.0 [+0.8, +1.2] | +0.63 [+0.53, +0.73] | worse |
| sunder | attack | 2 | yes | +1.8 [+0.4, +3.1] pts | +1.0 [+0.6, +1.4] | -3.64 [-3.84, -3.44] | worse |
| glaciate | attack | 2 | yes | -2.2 [-3.4, -1.0] pts | +1.1 [+0.8, +1.4] | +0.83 [+0.70, +0.96] | worse |
| block-slam | attack | 1 | yes | -3.4 [-4.9, -2.0] pts | +1.3 [+1.0, +1.6] | +0.91 [+0.76, +1.06] | worse |
| double-strength | skill | 1 | yes | -3.4 [-4.9, -2.0] pts | +1.3 [+1.0, +1.6] | +0.91 [+0.76, +1.06] | worse |
| cull | skill | 0 | yes | -3.4 [-4.9, -2.0] pts | +1.3 [+1.0, +1.6] | +0.91 [+0.76, +1.06] | worse |
| meteor-shower | attack | 2 | yes | -3.4 [-4.9, -2.0] pts | +1.3 [+1.0, +1.6] | +0.91 [+0.76, +1.06] | worse |
| molten-core | skill | 2 | yes | -3.4 [-4.9, -2.0] pts | +1.3 [+1.0, +1.6] | +0.91 [+0.76, +1.06] | worse |
| absolute-zero | skill | 3 | yes | -3.4 [-4.9, -2.0] pts | +1.3 [+1.0, +1.6] | +0.91 [+0.76, +1.06] | worse |
| hypothermia | skill | 1 | yes | -9.1 [-11.1, -7.1] pts | +3.3 [+2.8, +3.7] | +4.15 [+3.82, +4.49] | worse |
| glacial-spike | skill | 1 | yes | -9.1 [-11.1, -7.1] pts | +3.3 [+2.8, +3.7] | +4.15 [+3.82, +4.49] | worse |
| apocalyptic-flame | attack | 3 | yes | +1.6 [+0.0, +3.1] pts | +4.5 [+3.9, +5.0] | -8.07 [-8.35, -7.78] | worse |
| blood-strike | attack | 1 | yes | -15.0 [-17.3, -12.7] pts | +12.6 [+11.8, +13.3] | -6.28 [-6.53, -6.02] | worse |

### smart bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| end-guard | power | 1 | yes | +23.7 [+20.9, +26.4] pts | -10.6 [-11.3, -10.0] | +3.59 [+3.27, +3.91] | better |
| attack-echo | power | 1 | yes | +21.1 [+18.4, +23.8] pts | -10.5 [-11.1, -9.8] | +2.53 [+2.28, +2.79] | better |
| ice-barrier | skill | 1 | yes | +13.3 [+10.9, +15.8] pts | -8.2 [-8.9, -7.5] | +4.21 [+3.92, +4.51] | better |
| cryofreeze | power | 2 | yes | +22.1 [+19.4, +24.8] pts | -7.6 [-8.2, -7.0] | +2.76 [+2.45, +3.07] | better |
| big-block | skill | 2 | yes | +14.1 [+11.8, +16.5] pts | -7.0 [-7.7, -6.4] | +4.33 [+4.02, +4.65] | better |
| ice-block | skill | 3 | yes | +21.0 [+18.2, +23.8] pts | -5.7 [-6.3, -5.1] | +6.36 [+5.89, +6.82] | better |
| block-slam | attack | 1 | yes | +6.9 [+4.9, +8.9] pts | -5.4 [-6.0, -4.9] | +1.19 [+0.99, +1.39] | better |
| guarded-strike | attack | 1 | yes | +11.4 [+9.3, +13.6] pts | -4.8 [-5.2, -4.3] | +1.15 [+0.94, +1.36] | better |
| fortify | power | 2 | yes | +17.3 [+14.8, +19.8] pts | -4.3 [-4.7, -3.8] | +2.15 [+1.89, +2.41] | better |
| heat-flash | attack | 0 | yes | +11.9 [+9.5, +14.3] pts | -4.0 [-4.5, -3.5] | +1.08 [+0.85, +1.31] | better |
| frozen-shield | skill | 1 | yes | +9.4 [+7.3, +11.6] pts | -3.8 [-4.3, -3.3] | +2.80 [+2.55, +3.05] | better |
| prime-a | skill | 0 | yes | +7.0 [+4.9, +9.1] pts | -3.5 [-4.0, -3.1] | +1.61 [+1.39, +1.83] | better |
| cauterize | skill | 1 | yes | +5.1 [+3.2, +7.1] pts | -3.5 [-4.0, -3.0] | +2.37 [+2.14, +2.61] | better |
| heating-up | skill | 1 | yes | +12.7 [+10.3, +15.1] pts | -2.2 [-2.7, -1.8] | -4.73 [-4.94, -4.51] | better |
| apocalyptic-flame | attack | 3 | yes | +9.1 [+6.9, +11.3] pts | -2.0 [-2.4, -1.6] | -3.29 [-3.49, -3.10] | better |
| jab | attack | 0 | yes | +1.3 [-0.5, +3.1] pts | -2.0 [-2.4, -1.6] | -0.44 [-0.61, -0.27] | better |
| defend | skill | 1 | no | +3.2 [+1.5, +5.0] pts | -1.6 [-2.0, -1.3] | +1.59 [+1.38, +1.80] | better |
| hand-strike | attack | 1 | yes | +4.6 [+2.6, +6.5] pts | -1.5 [-1.9, -1.1] | -1.77 [-1.94, -1.59] | better |
| combo-strike | attack | 1 | yes | +5.0 [+3.0, +7.0] pts | -1.5 [-1.8, -1.1] | -1.68 [-1.86, -1.49] | better |
| scorching-wind | attack | 0 | yes | -0.6 [-2.2, +1.1] pts | -1.4 [-1.7, -1.0] | -0.18 [-0.36, -0.00] | better |
| pain-engine | power | 1 | yes | +11.4 [+9.2, +13.7] pts | -1.0 [-1.4, -0.7] | -3.52 [-3.75, -3.29] | better |
| cull | skill | 0 | yes | +0.6 [-1.2, +2.3] pts | -0.9 [-1.3, -0.6] | +0.52 [+0.29, +0.76] | better |
| quick-draw | skill | 1 | yes | -1.4 [-3.1, +0.2] pts | -0.8 [-1.1, -0.4] | +0.16 [-0.03, +0.34] | better |
| opening-spark | power | 1 | yes | +4.2 [+2.4, +6.1] pts | -0.8 [-1.1, -0.5] | -0.77 [-0.94, -0.59] | better |
| glaciate | attack | 2 | yes | -3.1 [-4.9, -1.4] pts | -0.6 [-0.9, -0.3] | -0.10 [-0.29, +0.09] | better |
| exhaust-payoff | attack | 1 | yes | -3.4 [-5.2, -1.7] pts | -0.6 [-0.9, -0.2] | -0.07 [-0.26, +0.12] | better |
| arctic-strike | attack | 1 | yes | -3.4 [-5.2, -1.7] pts | -0.6 [-0.9, -0.2] | -0.07 [-0.26, +0.12] | better |
| opportunist | attack | 1 | yes | -3.0 [-4.7, -1.3] pts | -0.6 [-0.9, -0.2] | -0.21 [-0.40, -0.03] | better |
| endless-winter | power | 1 | yes | +5.8 [+3.9, +7.6] pts | -0.5 [-0.9, -0.2] | +1.18 [+0.98, +1.38] | better |
| tag-a-payoff | attack | 1 | yes | -3.2 [-4.9, -1.5] pts | -0.5 [-0.9, -0.2] | -0.14 [-0.32, +0.05] | better |
| tag-a-echo | power | 1 | yes | -1.6 [-3.2, +0.1] pts | -0.5 [-0.8, -0.2] | +0.12 [-0.07, +0.30] | better |
| exhaust-engine | power | 1 | yes | -1.6 [-3.2, +0.1] pts | -0.5 [-0.8, -0.2] | +0.12 [-0.07, +0.30] | better |
| double-strength | skill | 1 | yes | -3.1 [-4.8, -1.4] pts | -0.4 [-0.8, -0.1] | +0.07 [-0.12, +0.26] | better |
| block-spark | power | 1 | yes | +2.2 [+0.5, +3.9] pts | -0.4 [-0.7, -0.1] | -0.55 [-0.71, -0.38] | better |
| weaken | skill | 1 | yes | +1.4 [-0.3, +3.2] pts | -0.3 [-0.7, +0.1] | +2.51 [+2.27, +2.76] | negligible |
| single-use-strike | attack | 1 | yes | +0.9 [-0.7, +2.5] pts | -0.3 [-0.6, -0.0] | -0.21 [-0.38, -0.04] | better |
| kill-reward | power | 1 | yes | -2.0 [-3.7, -0.3] pts | -0.1 [-0.4, +0.2] | -0.11 [-0.28, +0.06] | negligible |
| power-up | skill | 1 | yes | -1.2 [-3.0, +0.5] pts | -0.0 [-0.4, +0.3] | -1.97 [-2.15, -1.79] | negligible |
| heavy-hit | attack | 3 | yes | +0.9 [-1.1, +2.9] pts | +0.1 [-0.2, +0.4] | -2.73 [-2.92, -2.53] | negligible |
| strike | attack | 1 | no | -3.9 [-5.6, -2.2] pts | +0.2 [-0.2, +0.5] | -0.77 [-0.96, -0.58] | negligible |
| crippling-heat | attack | 1 | yes | -0.6 [-2.6, +1.5] pts | +0.2 [-0.2, +0.6] | +0.66 [+0.44, +0.87] | negligible |
| heat-warning | attack | 1 | yes | +2.0 [+0.1, +3.9] pts | +0.5 [+0.2, +0.8] | -3.87 [-4.06, -3.68] | worse |
| hungering-cold | power | 1 | yes | -1.9 [-3.6, -0.2] pts | +0.6 [+0.3, +0.9] | -0.11 [-0.29, +0.07] | worse |
| focus | power | 1 | no | +3.1 [+1.2, +5.0] pts | +0.8 [+0.4, +1.1] | +0.32 [+0.13, +0.52] | worse |
| strengthen | power | 1 | yes | -0.2 [-1.9, +1.5] pts | +1.4 [+1.0, +1.7] | -3.19 [-3.37, -3.01] | worse |
| sunder | attack | 2 | yes | -4.4 [-6.1, -2.8] pts | +2.3 [+1.9, +2.6] | -4.15 [-4.34, -3.96] | worse |
| bolt | attack | 2 | yes | -5.7 [-7.4, -3.9] pts | +2.4 [+2.1, +2.8] | -1.89 [-2.07, -1.70] | worse |
| hypothermia | skill | 1 | yes | -10.4 [-12.5, -8.4] pts | +2.6 [+2.2, +3.0] | +0.10 [-0.12, +0.33] | worse |
| glacial-spike | skill | 1 | yes | -10.4 [-12.5, -8.4] pts | +2.6 [+2.2, +3.0] | +0.10 [-0.12, +0.33] | worse |
| expose | skill | 1 | yes | -5.6 [-7.5, -3.6] pts | +2.7 [+2.3, +3.1] | -3.00 [-3.20, -2.81] | worse |
| meteor-shower | attack | 2 | yes | -10.1 [-12.2, -8.0] pts | +3.5 [+3.1, +3.9] | -2.38 [-2.59, -2.17] | worse |
| blood-strike | attack | 1 | yes | -7.0 [-8.8, -5.2] pts | +4.1 [+3.6, +4.6] | -3.27 [-3.47, -3.08] | worse |
| molten-core | skill | 2 | yes | -20.7 [-23.3, -18.0] pts | +6.6 [+5.9, +7.2] | -1.12 [-1.48, -0.76] | worse |
| absolute-zero | skill | 3 | yes | -32.4 [-35.5, -29.4] pts | +8.7 [+7.9, +9.5] | -1.85 [-2.28, -1.41] | worse |

### smart bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| end-guard | power | 1 | yes | +26.9 [+24.0, +29.8] pts | -12.0 [-12.7, -11.3] | +4.64 [+4.26, +5.01] | better |
| attack-echo | power | 1 | yes | +20.9 [+18.2, +23.5] pts | -10.7 [-11.3, -10.0] | +3.21 [+2.93, +3.49] | better |
| ice-barrier | skill | 1 | yes | +17.3 [+14.8, +19.9] pts | -10.1 [-10.9, -9.4] | +6.12 [+5.79, +6.45] | better |
| big-block | skill | 2 | yes | +18.8 [+16.2, +21.3] pts | -9.0 [-9.6, -8.3] | +6.06 [+5.70, +6.42] | better |
| cryofreeze | power | 2 | yes | +26.9 [+24.0, +29.8] pts | -8.8 [-9.4, -8.2] | +3.87 [+3.49, +4.25] | better |
| block-slam | attack | 1 | yes | +13.6 [+11.3, +15.8] pts | -8.2 [-8.9, -7.6] | +2.45 [+2.24, +2.67] | better |
| ice-block | skill | 3 | yes | +28.1 [+25.2, +31.0] pts | -7.0 [-7.6, -6.4] | +8.18 [+7.66, +8.70] | better |
| guarded-strike | attack | 1 | yes | +14.8 [+12.5, +17.1] pts | -5.8 [-6.3, -5.3] | +1.81 [+1.58, +2.04] | better |
| heat-flash | attack | 0 | yes | +18.1 [+15.6, +20.7] pts | -5.3 [-5.8, -4.8] | +2.17 [+1.93, +2.42] | better |
| fortify | power | 2 | yes | +21.1 [+18.4, +23.8] pts | -5.0 [-5.5, -4.6] | +3.17 [+2.85, +3.49] | better |
| frozen-shield | skill | 1 | yes | +12.4 [+10.2, +14.7] pts | -5.0 [-5.5, -4.6] | +4.00 [+3.75, +4.25] | better |
| cauterize | skill | 1 | yes | +8.4 [+6.4, +10.5] pts | -4.5 [-4.9, -4.1] | +3.52 [+3.29, +3.75] | better |
| prime-a | skill | 0 | yes | +11.2 [+9.0, +13.4] pts | -4.4 [-4.9, -4.0] | +2.80 [+2.56, +3.04] | better |
| heating-up | skill | 1 | yes | +15.3 [+12.8, +17.9] pts | -2.8 [-3.2, -2.4] | -4.56 [-4.78, -4.34] | better |
| apocalyptic-flame | attack | 3 | yes | +12.1 [+9.9, +14.3] pts | -2.7 [-3.1, -2.3] | -3.23 [-3.43, -3.04] | better |
| jab | attack | 0 | yes | +4.2 [+2.5, +5.9] pts | -2.6 [-3.0, -2.2] | +0.41 [+0.24, +0.58] | better |
| hand-strike | attack | 1 | yes | +6.7 [+4.9, +8.4] pts | -2.1 [-2.4, -1.7] | -1.46 [-1.62, -1.30] | better |
| defend | skill | 1 | no | +6.2 [+4.4, +8.1] pts | -2.0 [-2.3, -1.8] | +2.72 [+2.51, +2.94] | better |
| cull | skill | 0 | yes | +5.6 [+3.6, +7.5] pts | -1.9 [-2.3, -1.5] | +1.98 [+1.71, +2.25] | better |
| scorching-wind | attack | 0 | yes | +2.9 [+1.4, +4.4] pts | -1.9 [-2.2, -1.6] | +0.67 [+0.53, +0.81] | better |
| quick-draw | skill | 1 | yes | +2.1 [+0.5, +3.7] pts | -1.6 [-2.0, -1.3] | +1.17 [+1.00, +1.33] | better |
| combo-strike | attack | 1 | yes | +6.8 [+5.0, +8.6] pts | -1.5 [-1.8, -1.2] | -1.32 [-1.47, -1.16] | better |
| opening-spark | power | 1 | yes | +8.0 [+6.0, +10.0] pts | -1.5 [-1.8, -1.2] | +0.12 [-0.07, +0.30] | better |
| pain-engine | power | 1 | yes | +15.3 [+12.9, +17.8] pts | -1.3 [-1.7, -1.0] | -3.08 [-3.31, -2.84] | better |
| glaciate | attack | 2 | yes | +0.8 [-0.7, +2.2] pts | -1.2 [-1.5, -1.0] | +0.85 [+0.69, +1.00] | better |
| block-spark | power | 1 | yes | +6.6 [+4.7, +8.4] pts | -1.2 [-1.5, -0.9] | +0.36 [+0.18, +0.54] | better |
| exhaust-payoff | attack | 1 | yes | -0.1 [-1.4, +1.2] pts | -1.1 [-1.3, -0.8] | +1.03 [+0.90, +1.17] | better |
| arctic-strike | attack | 1 | yes | -0.1 [-1.4, +1.2] pts | -1.1 [-1.3, -0.8] | +1.03 [+0.90, +1.17] | better |
| endless-winter | power | 1 | yes | +9.3 [+7.3, +11.3] pts | -1.1 [-1.4, -0.7] | +2.09 [+1.87, +2.31] | better |
| tag-a-payoff | attack | 1 | yes | -0.1 [-1.5, +1.2] pts | -1.0 [-1.2, -0.8] | +0.96 [+0.83, +1.09] | better |
| opportunist | attack | 1 | yes | +0.7 [-0.6, +2.0] pts | -1.0 [-1.2, -0.8] | +0.80 [+0.67, +0.92] | better |
| double-strength | skill | 1 | yes | -0.7 [-2.1, +0.8] pts | -0.9 [-1.2, -0.7] | +1.07 [+0.92, +1.22] | better |
| tag-a-echo | power | 1 | yes | +2.8 [+1.2, +4.3] pts | -0.9 [-1.2, -0.7] | +1.18 [+1.03, +1.34] | better |
| exhaust-engine | power | 1 | yes | +2.8 [+1.2, +4.3] pts | -0.9 [-1.2, -0.7] | +1.18 [+1.03, +1.34] | better |
| single-use-strike | attack | 1 | yes | +4.4 [+2.7, +6.2] pts | -0.7 [-1.0, -0.5] | +0.72 [+0.54, +0.91] | better |
| kill-reward | power | 1 | yes | +2.8 [+1.2, +4.4] pts | -0.7 [-0.9, -0.4] | +0.99 [+0.82, +1.16] | better |
| weaken | skill | 1 | yes | +3.1 [+1.3, +4.9] pts | -0.5 [-0.9, -0.2] | +3.72 [+3.49, +3.94] | better |
| power-up | skill | 1 | yes | -0.2 [-1.9, +1.4] pts | -0.5 [-0.8, -0.2] | -1.85 [-2.01, -1.69] | better |
| heavy-hit | attack | 3 | yes | +3.9 [+2.1, +5.7] pts | -0.5 [-0.8, -0.1] | -2.53 [-2.70, -2.36] | better |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| crippling-heat | attack | 1 | yes | +3.0 [+0.9, +5.1] pts | +0.1 [-0.3, +0.5] | +1.68 [+1.47, +1.89] | negligible |
| hungering-cold | power | 1 | yes | +2.2 [+0.6, +3.8] pts | +0.1 [-0.2, +0.4] | +0.97 [+0.80, +1.15] | negligible |
| heat-warning | attack | 1 | yes | +4.2 [+2.4, +6.1] pts | +0.4 [+0.1, +0.7] | -3.55 [-3.73, -3.38] | worse |
| focus | power | 1 | no | +10.7 [+8.5, +12.8] pts | +0.4 [+0.1, +0.7] | +1.41 [+1.18, +1.64] | worse |
| strengthen | power | 1 | yes | +3.8 [+2.0, +5.6] pts | +1.3 [+1.0, +1.6] | -2.40 [-2.58, -2.22] | worse |
| sunder | attack | 2 | yes | -5.2 [-7.0, -3.4] pts | +2.4 [+2.1, +2.8] | -4.14 [-4.33, -3.95] | worse |
| hypothermia | skill | 1 | yes | -11.1 [-13.2, -9.0] pts | +2.7 [+2.4, +3.1] | +0.97 [+0.76, +1.19] | worse |
| glacial-spike | skill | 1 | yes | -11.1 [-13.2, -9.0] pts | +2.7 [+2.4, +3.1] | +0.97 [+0.76, +1.19] | worse |
| expose | skill | 1 | yes | -5.4 [-7.3, -3.6] pts | +2.7 [+2.4, +3.1] | -2.44 [-2.62, -2.26] | worse |
| bolt | attack | 2 | yes | -4.3 [-6.1, -2.6] pts | +2.8 [+2.4, +3.1] | -1.58 [-1.75, -1.42] | worse |
| meteor-shower | attack | 2 | yes | -9.9 [-11.9, -7.8] pts | +4.0 [+3.5, +4.4] | -2.30 [-2.50, -2.10] | worse |
| blood-strike | attack | 1 | yes | -5.0 [-6.6, -3.4] pts | +4.6 [+4.1, +5.0] | -2.93 [-3.09, -2.76] | worse |
| molten-core | skill | 2 | yes | -23.9 [-26.7, -21.1] pts | +7.7 [+7.0, +8.4] | -0.91 [-1.29, -0.52] | worse |
| absolute-zero | skill | 3 | yes | -35.2 [-38.3, -32.1] pts | +9.3 [+8.4, +10.2] | -1.64 [-2.10, -1.18] | worse |


## Pair synergy

Synergy score = (benefit of A and B together) minus (benefit of A alone + benefit of B alone), all measured against the starter deck on identical seeds, in HP lost (benefit = HP/turns saved, so positive is good). Positive means the cards help each other more than the sum of their parts; negative means they overlap or fight for the same energy and draws. Brackets are 95% CIs. Skill: smart. 15 fights x 40 seeds = 600 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, enemy-a+enemy-b, enemy-c+enemy-d, enemy-b+enemy-d+enemy-d, enemy-a+enemy-b+enemy-d, enemy-b+enemy-c, elite-a, elite-b, boss-a.
120 of 1225 possible pairs evaluated (a deterministic random sample, --max-pairs 120); a strong pair outside the sample is not seen. Candidate cards: jab, guarded-strike, heavy-hit, big-block, quick-draw, fortify, weaken, expose, sunder, strengthen, combo-strike, block-slam, opportunist, hand-strike, prime-a, tag-a-payoff, tag-a-echo, power-up, double-strength, attack-echo, block-spark, kill-reward, pain-engine, end-guard, opening-spark, exhaust-engine, cull, single-use-strike, exhaust-payoff, blood-strike, scorching-wind, heating-up, meteor-shower, molten-core, apocalyptic-flame, crippling-heat, heat-flash, cauterize, heat-warning, ice-block, ice-barrier, hypothermia, frozen-shield, cryofreeze, endless-winter, glaciate, glacial-spike, absolute-zero, hungering-cold, arctic-strike.
Of 120 pairs: 28 clearly synergistic, 18 clearly anti-synergistic, 42 negligible, 32 inconclusive. Each pair is a 4-way difference, so its interval is wide: with 100+ pairs tested, expect about 5% to look significant by chance. Verdicts compare each pair with the TYPICAL pair (the median score, -0.48 HP lost): cards that do not interact still score off zero because benefits are not additive, so zero is not the right reference when many pairs are tested (with fewer than 20 pairs the reference is zero). Treat single hits as leads and confirm a lead by re-running just that pair with more seeds (--pairs a+b --seeds 200).

### Strongest synergies
| pair | synergy score | vs typical pair |
| --- | --- | --- |
| expose + heating-up | +4.23 [+3.57, +4.89] | better |
| end-guard + cryofreeze | +4.15 [+3.00, +5.30] | better |
| strengthen + heating-up | +3.84 [+3.21, +4.48] | better |
| strengthen + heat-warning | +3.21 [+2.62, +3.80] | better |
| molten-core + crippling-heat | +3.02 [+2.36, +3.68] | better |
| fortify + cryofreeze | +3.01 [+2.03, +3.99] | better |
| expose + pain-engine | +1.72 [+1.11, +2.33] | better |
| cryofreeze + endless-winter | +1.43 [+0.71, +2.14] | better |
| sunder + molten-core | +1.32 [+0.83, +1.82] | better |
| expose + molten-core | +1.22 [+0.72, +1.72] | better |

### Negative (anti-synergistic) pairs
| pair | synergy score | vs typical pair |
| --- | --- | --- |
| molten-core + ice-block | -5.23 [-6.11, -4.34] | worse |
| big-block + expose | -4.18 [-5.04, -3.33] | worse |
| block-slam + absolute-zero | -3.62 [-4.41, -2.82] | worse |
| heat-warning + ice-block | -2.86 [-3.82, -1.89] | worse |
| strengthen + ice-block | -2.76 [-3.64, -1.87] | worse |
| ice-barrier + hypothermia | -2.22 [-3.04, -1.40] | worse |
| ice-barrier + glacial-spike | -2.22 [-3.04, -1.40] | worse |
| heavy-hit + end-guard | -2.21 [-2.85, -1.58] | worse |
| block-slam + glacial-spike | -2.21 [-2.91, -1.51] | worse |
| block-slam + meteor-shower | -1.98 [-2.73, -1.22] | worse |


## Outlier report

Outlier method: within a cohort of 4 or more values, a value is flagged when its modified z-score (0.6745 * (x - median) / MAD, Iglewicz-Hoaglin) exceeds 3.5 in magnitude OR it lies outside the Tukey fences (Q1 - 1.5 IQR, Q3 + 1.5 IQR). Median/MAD/IQR are used because the cohort itself may contain the outlier. A flag means "look at this", not "this is wrong".

Cards: value = how much adding the card helps on HP lost (positive = helps), compared within all cards and within each energy-cost group. Enemies: fights are compared inside their tier (normal/elite/boss) on the mid deck set. Cohorts smaller than 4 are skipped, so small content lists produce no flags; the tier bands in the ladder report cover that case.

| kind | skill | cohort | id | metric | value | modified z | z | IQR rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| card | random | all cards | fortify | HP lost change when added | 5.41 | 3.44 | 1.93 | outside |
| card | random | all cards | attack-echo | HP lost change when added | 7.94 | 5.11 | 2.98 | outside |
| card | random | all cards | end-guard | HP lost change when added | 7.17 | 4.60 | 2.66 | outside |
| card | random | all cards | heating-up | HP lost change when added | 4.53 | 2.86 | 1.57 | outside |
| card | random | all cards | cryofreeze | HP lost change when added | 7.63 | 4.90 | 2.85 | outside |
| card | random | cost 1 | attack-echo | HP lost change when added | 7.94 | 5.69 | 3.23 | outside |
| card | random | cost 1 | pain-engine | HP lost change when added | 3.98 | 2.86 | 1.47 | outside |
| card | random | cost 1 | end-guard | HP lost change when added | 7.17 | 5.14 | 2.89 | outside |
| card | random | cost 1 | heating-up | HP lost change when added | 4.53 | 3.26 | 1.72 | outside |
| card | random | cost 2 | cryofreeze | HP lost change when added | 7.63 | 3.71 | 1.80 | inside |
| card | random | cost 3 | absolute-zero | HP lost change when added | -3.08 | -6.39 | -1.48 | outside |
| enemy-fight | random | normal fights | enemy-b+enemy-d | turns | 20.59 | 2.46 | 2.14 | outside |
| card | greedy | cost 1 | blood-strike | HP lost change when added | -13.20 | -2.87 | -2.93 | outside |
| card | greedy | cost 2 | big-block | HP lost change when added | 8.90 | 5.27 | 1.02 | inside |
| card | greedy | cost 2 | fortify | HP lost change when added | 9.47 | 5.53 | 1.10 | inside |
| card | greedy | cost 2 | cryofreeze | HP lost change when added | 12.13 | 6.73 | 1.46 | inside |
| card | greedy | cost 3 | ice-block | HP lost change when added | 10.43 | 5.89 | 1.47 | outside |
| card | smart | all cards | big-block | HP lost change when added | 7.02 | 3.43 | 1.62 | outside |
| card | smart | all cards | attack-echo | HP lost change when added | 10.45 | 5.25 | 2.57 | outside |
| card | smart | all cards | end-guard | HP lost change when added | 10.62 | 5.34 | 2.62 | outside |
| card | smart | all cards | blood-strike | HP lost change when added | -4.10 | -2.48 | -1.45 | outside |
| card | smart | all cards | molten-core | HP lost change when added | -6.58 | -3.79 | -2.13 | outside |
| card | smart | all cards | ice-barrier | HP lost change when added | 8.23 | 4.07 | 1.96 | outside |
| card | smart | all cards | cryofreeze | HP lost change when added | 7.60 | 3.73 | 1.78 | outside |
| card | smart | all cards | absolute-zero | HP lost change when added | -8.71 | -4.92 | -2.72 | outside |
| card | smart | cost 1 | guarded-strike | HP lost change when added | 4.76 | 3.13 | 1.10 | outside |
| card | smart | cost 1 | block-slam | HP lost change when added | 5.43 | 3.62 | 1.31 | outside |
| card | smart | cost 1 | attack-echo | HP lost change when added | 10.45 | 7.34 | 2.88 | outside |
| card | smart | cost 1 | end-guard | HP lost change when added | 10.62 | 7.46 | 2.93 | outside |
| card | smart | cost 1 | blood-strike | HP lost change when added | -4.10 | -3.44 | -1.67 | outside |
| card | smart | cost 1 | ice-barrier | HP lost change when added | 8.23 | 5.69 | 2.18 | outside |

### Cards worse than adding nothing
Adding the card to the deck measurably HURTS the headline metric (paired 95% CI excludes zero). Possible dead picks, or cards that need a partner; check the pair report before judging.

| skill | card | cost | change [95% CI] |
| --- | --- | --- | --- |
| random | bolt | 2 | +0.6 [+0.2, +1.0] |
| random | quick-draw | 1 | +2.1 [+1.7, +2.6] |
| random | block-slam | 1 | +1.1 [+0.7, +1.5] |
| random | opportunist | 1 | +0.9 [+0.5, +1.3] |
| random | tag-a-payoff | 1 | +1.2 [+0.8, +1.5] |
| random | tag-a-echo | 1 | +0.4 [+0.0, +0.7] |
| random | double-strength | 1 | +0.4 [+0.0, +0.7] |
| random | exhaust-engine | 1 | +0.4 [+0.0, +0.7] |
| random | exhaust-payoff | 1 | +1.3 [+0.9, +1.7] |
| random | blood-strike | 1 | +2.4 [+2.0, +2.8] |
| random | meteor-shower | 2 | +1.1 [+0.7, +1.5] |
| random | molten-core | 2 | +3.0 [+2.5, +3.5] |
| random | hypothermia | 1 | +1.4 [+1.0, +1.7] |
| random | glaciate | 2 | +1.4 [+1.0, +1.8] |
| random | glacial-spike | 1 | +1.4 [+1.0, +1.7] |
| random | absolute-zero | 3 | +3.1 [+2.5, +3.6] |
| random | hungering-cold | 1 | +0.4 [+0.0, +0.7] |
| random | arctic-strike | 1 | +1.3 [+0.9, +1.7] |
| greedy | strike | 1 | +3.4 [+2.9, +3.8] |
| greedy | bolt | 2 | +3.0 [+2.6, +3.5] |
| greedy | jab | 0 | +2.3 [+1.8, +2.7] |
| greedy | heavy-hit | 3 | +1.8 [+1.3, +2.3] |
| greedy | quick-draw | 1 | +1.8 [+1.3, +2.3] |
| greedy | expose | 1 | +1.9 [+1.4, +2.3] |
| greedy | sunder | 2 | +2.6 [+2.1, +3.1] |
| greedy | combo-strike | 1 | +2.7 [+2.2, +3.1] |
| greedy | block-slam | 1 | +4.1 [+3.6, +4.6] |
| greedy | opportunist | 1 | +3.6 [+3.1, +4.1] |
| greedy | hand-strike | 1 | +3.2 [+2.7, +3.7] |
| greedy | tag-a-payoff | 1 | +3.7 [+3.2, +4.2] |
| greedy | tag-a-echo | 1 | +1.0 [+0.7, +1.4] |
| greedy | power-up | 1 | +2.1 [+1.6, +2.5] |
| greedy | double-strength | 1 | +4.1 [+3.6, +4.6] |
| greedy | kill-reward | 1 | +1.0 [+0.6, +1.3] |
| greedy | exhaust-engine | 1 | +1.0 [+0.7, +1.4] |
| greedy | cull | 0 | +4.1 [+3.6, +4.6] |
| greedy | exhaust-payoff | 1 | +3.8 [+3.4, +4.3] |
| greedy | blood-strike | 1 | +13.2 [+12.4, +14.0] |
| greedy | scorching-wind | 0 | +2.9 [+2.4, +3.3] |
| greedy | meteor-shower | 2 | +4.1 [+3.6, +4.6] |
| greedy | molten-core | 2 | +4.1 [+3.6, +4.6] |
| greedy | apocalyptic-flame | 3 | +4.9 [+4.3, +5.4] |
| greedy | hypothermia | 1 | +6.0 [+5.4, +6.6] |
| greedy | glaciate | 2 | +4.5 [+4.0, +5.0] |
| greedy | glacial-spike | 1 | +6.0 [+5.4, +6.6] |
| greedy | absolute-zero | 3 | +4.1 [+3.6, +4.6] |
| greedy | hungering-cold | 1 | +1.0 [+0.7, +1.4] |
| greedy | arctic-strike | 1 | +3.8 [+3.4, +4.3] |
| smart | bolt | 2 | +2.4 [+2.1, +2.8] |
| smart | focus | 1 | +0.8 [+0.4, +1.1] |
| smart | expose | 1 | +2.7 [+2.3, +3.1] |
| smart | sunder | 2 | +2.3 [+1.9, +2.6] |
| smart | strengthen | 1 | +1.4 [+1.0, +1.7] |
| smart | blood-strike | 1 | +4.1 [+3.6, +4.6] |
| smart | meteor-shower | 2 | +3.5 [+3.1, +3.9] |
| smart | molten-core | 2 | +6.6 [+5.9, +7.2] |
| smart | heat-warning | 1 | +0.5 [+0.2, +0.8] |
| smart | hypothermia | 1 | +2.6 [+2.2, +3.0] |
| smart | glacial-spike | 1 | +2.6 [+2.2, +3.0] |
| smart | absolute-zero | 3 | +8.7 [+7.9, +9.5] |
| smart | hungering-cold | 1 | +0.6 [+0.3, +0.9] |


## Draft policy comparison (whole runs)

100 runs per policy on seeds 1..100, fights played by the greedy bot. All policies share seeds; differences are against the first policy, run by run (paired). Win rate has a Wilson 95% interval; differences have paired 95% CIs. Verdict margin: +-5 points.
Run-level results are noisy (a run is ~12 fights; one bad fight ends it). Resolving a 5-point win-rate difference takes several hundred runs per policy. For judging individual cards or fights, prefer the fight-level experiments.

| policy | run win rate [95% CI] | avg floor [95% CI] | win change vs first | floor change vs first | verdict |
| --- | --- | --- | --- | --- | --- |
| reward=card (random pick) | 0.0% [0.0%, 3.7%] | 6.1 [5.7, 6.5] | - | - | baseline |
| reward=gold (always gold) | 0.0% [0.0%, 3.7%] | 6.1 [5.7, 6.4] | +0.0 [+0.0, +0.0] pts | -0.0 [-0.5, +0.4] | negligible |
| reward=best (trial-fight pick) | 7.0% [3.4%, 13.7%] | 8.4 [7.8, 9.0] | +7.0 [+1.9, +12.1] pts | +2.3 [+1.7, +2.9] | better |
| rest=heal (never upgrade) | 0.0% [0.0%, 3.7%] | 6.1 [5.7, 6.5] | +0.0 [+0.0, +0.0] pts | +0.0 [-0.0, +0.0] | negligible |
| path=random | 1.0% [0.2%, 5.4%] | 6.4 [6.0, 6.8] | +1.0 [-1.0, +3.0] pts | +0.3 [-0.2, +0.8] | negligible |

### Pick rates under reward=card (random pick)
Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.

| card | offered | picked | pick rate [95% CI] |
| --- | --- | --- | --- |
| opportunist | 15 | 8 | 53.3% [30.1%, 75.2%] |
| bolt | 21 | 11 | 52.4% [32.4%, 71.7%] |
| crippling-heat | 20 | 10 | 50.0% [29.9%, 70.1%] |
| scorching-wind | 22 | 11 | 50.0% [30.7%, 69.3%] |
| meteor-shower | 23 | 11 | 47.8% [29.2%, 67.0%] |
| opening-spark | 19 | 9 | 47.4% [27.3%, 68.3%] |
| single-use-strike | 28 | 13 | 46.4% [29.5%, 64.2%] |
| heavy-hit | 26 | 11 | 42.3% [25.5%, 61.1%] |
| glacial-spike | 17 | 7 | 41.2% [21.6%, 64.0%] |
| strengthen | 17 | 7 | 41.2% [21.6%, 64.0%] |
| jab | 28 | 11 | 39.3% [23.6%, 57.6%] |
| molten-core | 23 | 9 | 39.1% [22.2%, 59.2%] |
| double-strength | 18 | 7 | 38.9% [20.3%, 61.4%] |
| block-slam | 26 | 10 | 38.5% [22.4%, 57.5%] |
| apocalyptic-flame | 21 | 8 | 38.1% [20.8%, 59.1%] |
| pain-engine | 16 | 6 | 37.5% [18.5%, 61.4%] |
| block-spark | 19 | 7 | 36.8% [19.1%, 59.0%] |
| prime-a | 19 | 7 | 36.8% [19.1%, 59.0%] |
| endless-winter | 22 | 8 | 36.4% [19.7%, 57.0%] |
| guarded-strike | 22 | 8 | 36.4% [19.7%, 57.0%] |
| cryofreeze | 20 | 7 | 35.0% [18.1%, 56.7%] |
| end-guard | 20 | 7 | 35.0% [18.1%, 56.7%] |
| arctic-strike | 21 | 7 | 33.3% [17.2%, 54.6%] |
| blood-strike | 18 | 6 | 33.3% [16.3%, 56.3%] |
| cull | 18 | 6 | 33.3% [16.3%, 56.3%] |
| expose | 21 | 7 | 33.3% [17.2%, 54.6%] |
| frozen-shield | 24 | 8 | 33.3% [18.0%, 53.3%] |
| glaciate | 21 | 7 | 33.3% [17.2%, 54.6%] |
| sunder | 24 | 8 | 33.3% [18.0%, 53.3%] |
| big-block | 22 | 7 | 31.8% [16.4%, 52.7%] |
| heating-up | 13 | 4 | 30.8% [12.7%, 57.6%] |
| hungering-cold | 23 | 7 | 30.4% [15.6%, 50.9%] |
| weaken | 17 | 5 | 29.4% [13.3%, 53.1%] |
| tag-a-payoff | 14 | 4 | 28.6% [11.7%, 54.6%] |
| power-up | 18 | 5 | 27.8% [12.5%, 50.9%] |
| absolute-zero | 22 | 6 | 27.3% [13.2%, 48.2%] |
| combo-strike | 22 | 6 | 27.3% [13.2%, 48.2%] |
| ice-block | 19 | 5 | 26.3% [11.8%, 48.8%] |
| kill-reward | 23 | 6 | 26.1% [12.5%, 46.5%] |
| attack-echo | 20 | 5 | 25.0% [11.2%, 46.9%] |
| tag-a-echo | 12 | 3 | 25.0% [8.9%, 53.2%] |
| hand-strike | 17 | 4 | 23.5% [9.6%, 47.3%] |
| ice-barrier | 17 | 4 | 23.5% [9.6%, 47.3%] |
| cauterize | 15 | 3 | 20.0% [7.0%, 45.2%] |
| fortify | 15 | 3 | 20.0% [7.0%, 45.2%] |
| quick-draw | 30 | 6 | 20.0% [9.5%, 37.3%] |
| heat-flash | 21 | 4 | 19.0% [7.7%, 40.0%] |
| hypothermia | 16 | 3 | 18.8% [6.6%, 43.0%] |
| exhaust-payoff | 17 | 3 | 17.6% [6.2%, 41.0%] |
| heat-warning | 16 | 2 | 12.5% [3.5%, 36.0%] |
| exhaust-engine | 19 | 2 | 10.5% [2.9%, 31.4%] |

### Pick rates under reward=best (trial-fight pick)
Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.

| card | offered | picked | pick rate [95% CI] |
| --- | --- | --- | --- |
| end-guard | 26 | 26 | 100.0% [87.1%, 100.0%] |
| big-block | 36 | 32 | 88.9% [74.7%, 95.6%] |
| fortify | 23 | 19 | 82.6% [62.9%, 93.0%] |
| attack-echo | 22 | 18 | 81.8% [61.5%, 92.7%] |
| cryofreeze | 27 | 22 | 81.5% [63.3%, 91.8%] |
| ice-block | 27 | 21 | 77.8% [59.2%, 89.4%] |
| heat-flash | 26 | 17 | 65.4% [46.2%, 80.6%] |
| frozen-shield | 30 | 19 | 63.3% [45.5%, 78.1%] |
| pain-engine | 26 | 16 | 61.5% [42.5%, 77.6%] |
| prime-a | 27 | 16 | 59.3% [40.7%, 75.5%] |
| ice-barrier | 22 | 13 | 59.1% [38.7%, 76.7%] |
| cauterize | 21 | 12 | 57.1% [36.5%, 75.5%] |
| guarded-strike | 25 | 14 | 56.0% [37.1%, 73.3%] |
| endless-winter | 27 | 14 | 51.9% [34.0%, 69.3%] |
| crippling-heat | 24 | 12 | 50.0% [31.4%, 68.6%] |
| strengthen | 26 | 13 | 50.0% [32.1%, 67.9%] |
| heating-up | 21 | 10 | 47.6% [28.3%, 67.6%] |
| opening-spark | 37 | 17 | 45.9% [31.0%, 61.6%] |
| weaken | 24 | 10 | 41.7% [24.5%, 61.2%] |
| heat-warning | 33 | 13 | 39.4% [24.7%, 56.3%] |
| block-spark | 29 | 10 | 34.5% [19.9%, 52.7%] |
| single-use-strike | 36 | 12 | 33.3% [20.2%, 49.7%] |
| heavy-hit | 30 | 9 | 30.0% [16.7%, 47.9%] |
| hand-strike | 27 | 8 | 29.6% [15.9%, 48.5%] |
| hungering-cold | 30 | 8 | 26.7% [14.2%, 44.4%] |
| kill-reward | 38 | 10 | 26.3% [15.0%, 42.0%] |
| expose | 24 | 5 | 20.8% [9.2%, 40.5%] |
| scorching-wind | 29 | 6 | 20.7% [9.8%, 38.4%] |
| bolt | 34 | 7 | 20.6% [10.3%, 36.8%] |
| exhaust-engine | 26 | 5 | 19.2% [8.5%, 37.9%] |
| opportunist | 23 | 4 | 17.4% [7.0%, 37.1%] |
| meteor-shower | 35 | 6 | 17.1% [8.1%, 32.7%] |
| cull | 24 | 4 | 16.7% [6.7%, 35.9%] |
| power-up | 30 | 5 | 16.7% [7.3%, 33.6%] |
| tag-a-payoff | 25 | 4 | 16.0% [6.4%, 34.7%] |
| jab | 29 | 4 | 13.8% [5.5%, 30.6%] |
| combo-strike | 32 | 4 | 12.5% [5.0%, 28.1%] |
| arctic-strike | 25 | 3 | 12.0% [4.2%, 30.0%] |
| absolute-zero | 26 | 3 | 11.5% [4.0%, 29.0%] |
| sunder | 35 | 4 | 11.4% [4.5%, 26.0%] |
| molten-core | 28 | 3 | 10.7% [3.7%, 27.2%] |
| tag-a-echo | 19 | 2 | 10.5% [2.9%, 31.4%] |
| hypothermia | 24 | 2 | 8.3% [2.3%, 25.8%] |
| apocalyptic-flame | 30 | 2 | 6.7% [1.8%, 21.3%] |
| block-slam | 35 | 2 | 5.7% [1.6%, 18.6%] |
| double-strength | 20 | 1 | 5.0% [0.9%, 23.6%] |
| exhaust-payoff | 22 | 1 | 4.5% [0.8%, 21.8%] |
| blood-strike | 26 | 1 | 3.8% [0.7%, 18.9%] |
| glacial-spike | 26 | 1 | 3.8% [0.7%, 18.9%] |
| glaciate | 30 | 1 | 3.3% [0.6%, 16.7%] |
| quick-draw | 39 | 1 | 2.6% [0.5%, 13.2%] |

