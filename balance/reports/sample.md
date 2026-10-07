# Balance report

Generated 2026-10-07 by `npm run balance -- report` from the current registries. **The content measured here is all placeholder** (see implementationplan.md): treat the numbers as an example of the process, not as findings about the real game. Bot skills: random, greedy, smart. Target bands are provisional placeholders (src/sim/targets.ts). How to read this: docs/BALANCE.md. Commit fdde0fa, synergy decks included in the ladder, pool=reward.


## Fight difficulty ladder

Win rate (Wilson 95% interval), HP lost in fights that were won (mean with 95% CI) and turns (mean with 95% CI), at full starting HP, for each reference deck set: starter (the starter deck, 1 deck); mid (starter + 5 sampled cards, 3 decks); late (starter + 10 sampled cards, 3 upgraded, 3 decks); syn-tag (tag-a deck: enablers, payoff, draw power, 1 deck); syn-exhaust (exhaust deck: Cull, one-shot attacks, exhaust payoff and engine, 1 deck); syn-trigger (trigger / block deck: block triggers, Block Slam, 1 deck); syn-mult (empowered / strength multiplier deck, 1 deck); syn-combo (combo-count deck: cheap plays into count scaling, 1 deck); syn-mixed (starter + 8 sampled synergy cards, 3 decks). 9 fights x 100 seeds = 900 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, elite-a, elite-b, boss-a.
Flags compare the mid deck set to the PROVISIONAL target bands in src/sim/targets.ts (LOW / HIGH = outside the band; "ok" = inside). Per-fight numbers vary in how hard the individual fight is; the tier rollup is the better first read.

### random bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 6 | 100.0% | 12.8 | 5.7 |
| starter | elite | 2 | 100.0% | 28.0 | 7.7 |
| starter | boss | 1 | 6.0% | 50.7 | 12.2 |
| mid | normal | 6 | 100.0% | 12.7 | 5.8 |
| mid | elite | 2 | 100.0% | 22.1 | 7.3 |
| mid | boss | 1 | 58.3% | 46.3 | 12.3 |
| late | normal | 6 | 100.0% | 11.6 | 4.9 |
| late | elite | 2 | 100.0% | 18.5 | 5.8 |
| late | boss | 1 | 93.3% | 40.6 | 10.2 |
| syn-tag | normal | 6 | 100.0% | 8.1 | 4.5 |
| syn-tag | elite | 2 | 100.0% | 16.9 | 6.1 |
| syn-tag | boss | 1 | 98.0% | 40.9 | 10.9 |
| syn-exhaust | normal | 6 | 100.0% | 12.0 | 3.4 |
| syn-exhaust | elite | 2 | 100.0% | 19.4 | 4.4 |
| syn-exhaust | boss | 1 | 67.0% | 41.2 | 7.8 |
| syn-trigger | normal | 6 | 100.0% | 5.8 | 5.7 |
| syn-trigger | elite | 2 | 100.0% | 8.1 | 6.9 |
| syn-trigger | boss | 1 | 100.0% | 19.0 | 12.3 |
| syn-mult | normal | 6 | 100.0% | 16.2 | 3.1 |
| syn-mult | elite | 2 | 100.0% | 24.1 | 3.8 |
| syn-mult | boss | 1 | 99.0% | 40.7 | 5.9 |
| syn-combo | normal | 6 | 100.0% | 11.4 | 3.2 |
| syn-combo | elite | 2 | 100.0% | 18.5 | 4.0 |
| syn-combo | boss | 1 | 82.0% | 38.8 | 7.1 |
| syn-mixed | normal | 6 | 100.0% | 13.3 | 5.1 |
| syn-mixed | elite | 2 | 100.0% | 23.2 | 6.7 |
| syn-mixed | boss | 1 | 78.0% | 42.6 | 11.3 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 4.7 [4.1, 5.3] | 3.6 [3.5, 3.8] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 5.5 [4.8, 6.1] | 4.3 [4.2, 4.5] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 14.5 [13.2, 15.9] | 7.3 [7.1, 7.6] |  |
| enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 13.5 [12.2, 14.7] | 6.5 [6.3, 6.6] |  |
| enemy-a+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 19.5 [18.3, 20.7] | 5.8 [5.6, 6.0] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 19.0 [18.0, 20.0] | 6.6 [6.4, 6.8] |  |
| elite-a | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 29.5 [28.0, 31.1] | 7.0 [6.9, 7.2] |  |
| elite-b | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 26.5 [25.3, 27.7] | 8.4 [8.1, 8.6] |  |
| boss-a | boss | starter | 100 | 6.0% [2.8%, 12.5%] | 50.7 [43.6, 57.8] | 12.2 [11.8, 12.5] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 6.3 [5.9, 6.7] | 3.9 [3.8, 4.1] | win HIGH, HP ok, turns ok |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 6.3 [5.8, 6.8] | 4.5 [4.3, 4.6] | win HIGH, HP ok, turns ok |
| enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 13.3 [12.6, 14.1] | 7.4 [7.1, 7.7] | win HIGH, HP ok, turns HIGH |
| enemy-c | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 13.2 [12.4, 13.9] | 6.2 [5.9, 6.4] | win HIGH, HP ok, turns HIGH |
| enemy-a+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 18.8 [17.9, 19.7] | 6.3 [6.0, 6.5] | win HIGH, HP HIGH, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 18.3 [17.5, 19.0] | 6.8 [6.6, 7.1] | win HIGH, HP HIGH, turns HIGH |
| elite-a | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 24.5 [23.4, 25.6] | 6.9 [6.6, 7.1] | win HIGH, HP ok, turns ok |
| elite-b | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 19.8 [18.8, 20.7] | 7.8 [7.4, 8.1] | win HIGH, HP ok, turns ok |
| boss-a | boss | mid | 300 | 58.3% [52.7%, 63.8%] | 46.3 [44.9, 47.7] | 12.3 [11.8, 12.7] | win HIGH, HP HIGH, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 5.1 [4.7, 5.5] | 3.3 [3.2, 3.5] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 6.1 [5.7, 6.6] | 3.8 [3.7, 4.0] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 12.4 [11.7, 13.1] | 6.2 [6.1, 6.4] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 11.1 [10.3, 11.8] | 5.1 [4.9, 5.2] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 16.6 [15.8, 17.4] | 5.3 [5.2, 5.4] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 18.3 [17.5, 19.1] | 5.9 [5.7, 6.0] |  |
| elite-a | elite | late | 300 | 100.0% [98.7%, 100.0%] | 20.3 [19.3, 21.2] | 5.5 [5.4, 5.6] |  |
| elite-b | elite | late | 300 | 100.0% [98.7%, 100.0%] | 16.8 [15.9, 17.6] | 6.1 [6.0, 6.3] |  |
| boss-a | boss | late | 300 | 93.3% [89.9%, 95.6%] | 40.6 [39.4, 41.8] | 10.2 [10.0, 10.4] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 2.5 [2.0, 3.1] | 3.1 [2.9, 3.2] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 4.1 [3.5, 4.7] | 3.5 [3.4, 3.6] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 9.2 [8.1, 10.2] | 5.6 [5.5, 5.8] |  |
| enemy-c | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 8.4 [7.5, 9.3] | 5.1 [5.0, 5.3] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 11.7 [10.3, 13.0] | 4.9 [4.7, 5.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 12.5 [11.5, 13.5] | 5.1 [4.9, 5.2] |  |
| elite-a | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 18.5 [17.1, 19.9] | 5.7 [5.6, 5.9] |  |
| elite-b | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 15.4 [14.0, 16.8] | 6.5 [6.3, 6.7] |  |
| boss-a | boss | syn-tag | 100 | 98.0% [93.0%, 99.4%] | 40.9 [39.2, 42.6] | 10.9 [10.6, 11.1] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 6.0 [5.3, 6.6] | 2.4 [2.3, 2.5] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 6.8 [6.0, 7.6] | 2.7 [2.6, 2.9] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 13.1 [12.0, 14.1] | 4.2 [4.0, 4.4] |  |
| enemy-c | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 11.7 [10.5, 12.9] | 3.6 [3.5, 3.8] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 16.2 [15.0, 17.3] | 3.5 [3.4, 3.7] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 18.1 [17.0, 19.2] | 3.9 [3.7, 4.0] |  |
| elite-a | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 20.3 [19.1, 21.5] | 4.3 [4.1, 4.4] |  |
| elite-b | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 18.5 [17.1, 19.9] | 4.5 [4.3, 4.7] |  |
| boss-a | boss | syn-exhaust | 100 | 67.0% [57.3%, 75.4%] | 41.2 [38.4, 43.9] | 7.8 [7.5, 8.0] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.1 [1.6, 2.7] | 4.3 [4.1, 4.4] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 3.6 [3.0, 4.3] | 4.6 [4.5, 4.8] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 6.5 [5.6, 7.3] | 7.0 [6.8, 7.2] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 3.7 [2.9, 4.5] | 6.2 [6.1, 6.4] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.8 [6.9, 8.8] | 5.8 [5.6, 6.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 11.1 [10.1, 12.0] | 6.3 [6.2, 6.5] |  |
| elite-a | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 10.1 [9.0, 11.2] | 6.6 [6.4, 6.7] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 6.2 [5.3, 7.1] | 7.2 [7.0, 7.5] |  |
| boss-a | boss | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 19.0 [17.4, 20.7] | 12.3 [12.1, 12.6] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 9.6 [9.0, 10.3] | 2.2 [2.1, 2.3] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 10.6 [9.8, 11.3] | 2.5 [2.4, 2.6] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 19.9 [18.9, 20.8] | 3.8 [3.6, 3.9] |  |
| enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 15.6 [14.4, 16.7] | 3.2 [3.1, 3.3] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 19.9 [18.8, 21.0] | 3.3 [3.1, 3.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 21.4 [20.3, 22.5] | 3.5 [3.4, 3.6] |  |
| elite-a | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 25.2 [23.7, 26.8] | 3.7 [3.6, 3.8] |  |
| elite-b | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 23.0 [21.7, 24.4] | 3.9 [3.8, 4.0] |  |
| boss-a | boss | syn-mult | 100 | 99.0% [94.6%, 99.8%] | 40.7 [39.6, 41.9] | 5.9 [5.7, 6.0] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 5.3 [4.7, 5.9] | 2.1 [2.0, 2.2] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 6.3 [5.6, 7.1] | 2.5 [2.4, 2.6] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 13.0 [11.9, 14.1] | 4.1 [4.0, 4.3] |  |
| enemy-c | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 10.7 [9.6, 11.9] | 3.4 [3.2, 3.5] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 14.7 [13.9, 15.5] | 3.3 [3.2, 3.5] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 18.4 [17.4, 19.3] | 3.7 [3.6, 3.8] |  |
| elite-a | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 18.6 [17.2, 20.1] | 3.9 [3.8, 4.0] |  |
| elite-b | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 18.3 [17.1, 19.6] | 4.1 [4.0, 4.2] |  |
| boss-a | boss | syn-combo | 100 | 82.0% [73.3%, 88.3%] | 38.8 [36.7, 40.9] | 7.1 [6.9, 7.2] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 6.6 [6.1, 7.1] | 3.7 [3.6, 3.8] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 7.2 [6.7, 7.7] | 4.0 [3.9, 4.1] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 13.8 [13.0, 14.6] | 6.2 [6.1, 6.4] |  |
| enemy-c | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 14.0 [13.2, 14.8] | 5.9 [5.8, 6.0] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 18.7 [17.9, 19.6] | 5.3 [5.2, 5.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 19.4 [18.8, 20.1] | 5.5 [5.3, 5.6] |  |
| elite-a | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 26.0 [24.9, 27.1] | 6.2 [6.1, 6.3] |  |
| elite-b | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 20.5 [19.5, 21.5] | 7.2 [7.0, 7.3] |  |
| boss-a | boss | syn-mixed | 300 | 78.0% [73.0%, 82.3%] | 42.6 [41.6, 43.7] | 11.3 [11.0, 11.6] |  |

### greedy bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 6 | 100.0% | 4.7 | 5.4 |
| starter | elite | 2 | 100.0% | 14.4 | 7.4 |
| starter | boss | 1 | 100.0% | 38.3 | 12.9 |
| mid | normal | 6 | 100.0% | 6.9 | 5.8 |
| mid | elite | 2 | 100.0% | 12.5 | 7.7 |
| mid | boss | 1 | 99.7% | 31.4 | 13.4 |
| late | normal | 6 | 100.0% | 8.5 | 4.8 |
| late | elite | 2 | 100.0% | 12.8 | 5.5 |
| late | boss | 1 | 100.0% | 24.5 | 9.1 |
| syn-tag | normal | 6 | 100.0% | 4.3 | 4.2 |
| syn-tag | elite | 2 | 100.0% | 12.7 | 5.6 |
| syn-tag | boss | 1 | 98.0% | 36.5 | 10.6 |
| syn-exhaust | normal | 6 | 100.0% | 10.8 | 4.4 |
| syn-exhaust | elite | 2 | 100.0% | 28.3 | 6.4 |
| syn-exhaust | boss | 1 | 17.0% | 55.6 | 10.0 |
| syn-trigger | normal | 6 | 100.0% | 3.8 | 6.5 |
| syn-trigger | elite | 2 | 100.0% | 5.9 | 8.7 |
| syn-trigger | boss | 1 | 100.0% | 18.0 | 16.3 |
| syn-mult | normal | 6 | 100.0% | 12.7 | 2.8 |
| syn-mult | elite | 2 | 100.0% | 16.6 | 3.3 |
| syn-mult | boss | 1 | 100.0% | 36.3 | 5.0 |
| syn-combo | normal | 6 | 100.0% | 8.2 | 3.2 |
| syn-combo | elite | 2 | 100.0% | 17.1 | 3.9 |
| syn-combo | boss | 1 | 94.0% | 37.7 | 7.1 |
| syn-mixed | normal | 6 | 100.0% | 7.9 | 4.9 |
| syn-mixed | elite | 2 | 100.0% | 16.6 | 6.4 |
| syn-mixed | boss | 1 | 97.7% | 35.9 | 10.6 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 1.9 [1.5, 2.3] | 3.3 [3.1, 3.4] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 1.5 [1.0, 2.0] | 3.8 [3.6, 3.9] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 3.8 [3.3, 4.3] | 6.0 [5.8, 6.2] |  |
| enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 3.7 [2.9, 4.5] | 6.7 [6.5, 6.8] |  |
| enemy-a+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 8.2 [7.6, 8.7] | 6.7 [6.6, 6.8] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 9.4 [8.9, 9.9] | 6.2 [6.1, 6.2] |  |
| elite-a | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 16.7 [15.3, 18.2] | 6.8 [6.6, 6.9] |  |
| elite-b | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 12.1 [11.1, 13.1] | 8.0 [7.9, 8.1] |  |
| boss-a | boss | starter | 100 | 100.0% [96.3%, 100.0%] | 38.3 [36.8, 39.8] | 12.9 [12.6, 13.1] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 3.8 [3.5, 4.1] | 4.3 [4.1, 4.5] | win ok, HP LOW, turns ok |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 3.7 [3.3, 4.1] | 4.4 [4.3, 4.6] | win ok, HP LOW, turns ok |
| enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 6.3 [5.8, 6.9] | 6.4 [6.2, 6.6] | win ok, HP ok, turns HIGH |
| enemy-c | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 7.0 [6.4, 7.5] | 6.0 [5.7, 6.2] | win ok, HP ok, turns ok |
| enemy-a+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 10.0 [9.4, 10.6] | 7.0 [6.7, 7.3] | win ok, HP ok, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 10.5 [9.9, 11.1] | 6.8 [6.5, 7.1] | win ok, HP ok, turns HIGH |
| elite-a | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 13.8 [12.9, 14.7] | 7.2 [6.9, 7.5] | win HIGH, HP ok, turns ok |
| elite-b | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 11.2 [10.5, 12.0] | 8.1 [7.8, 8.5] | win HIGH, HP LOW, turns ok |
| boss-a | boss | mid | 300 | 99.7% [98.1%, 99.9%] | 31.4 [29.9, 32.9] | 13.4 [12.9, 14.0] | win HIGH, HP ok, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 4.8 [4.3, 5.2] | 3.4 [3.3, 3.5] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 5.2 [4.7, 5.6] | 4.0 [3.9, 4.1] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 7.4 [6.9, 8.0] | 5.3 [5.2, 5.4] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 8.2 [7.7, 8.8] | 4.6 [4.5, 4.8] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 11.9 [11.3, 12.5] | 5.4 [5.3, 5.5] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 13.6 [13.0, 14.2] | 5.7 [5.6, 5.9] |  |
| elite-a | elite | late | 300 | 100.0% [98.7%, 100.0%] | 14.2 [13.4, 14.9] | 5.4 [5.2, 5.5] |  |
| elite-b | elite | late | 300 | 100.0% [98.7%, 100.0%] | 11.4 [10.7, 12.1] | 5.6 [5.5, 5.8] |  |
| boss-a | boss | late | 300 | 100.0% [98.7%, 100.0%] | 24.5 [23.5, 25.5] | 9.1 [8.9, 9.3] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 1.9 [1.4, 2.4] | 2.9 [2.8, 3.0] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 1.8 [1.3, 2.3] | 3.2 [3.1, 3.3] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 4.0 [3.2, 4.8] | 5.3 [5.1, 5.4] |  |
| enemy-c | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 6.4 [5.6, 7.2] | 4.8 [4.6, 5.0] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 5.7 [4.8, 6.6] | 4.5 [4.4, 4.7] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 6.2 [5.6, 6.8] | 4.7 [4.6, 4.9] |  |
| elite-a | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 14.0 [12.6, 15.4] | 5.3 [5.2, 5.5] |  |
| elite-b | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 11.3 [10.0, 12.7] | 5.9 [5.7, 6.1] |  |
| boss-a | boss | syn-tag | 100 | 98.0% [93.0%, 99.4%] | 36.5 [34.5, 38.4] | 10.6 [10.3, 10.8] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 7.2 [6.8, 7.7] | 3.1 [3.0, 3.2] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 4.7 [4.2, 5.2] | 3.1 [3.0, 3.2] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 8.8 [7.9, 9.7] | 5.3 [5.2, 5.5] |  |
| enemy-c | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 15.7 [14.8, 16.6] | 4.9 [4.7, 5.1] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 15.0 [14.0, 16.0] | 4.8 [4.6, 5.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 13.4 [12.7, 14.2] | 5.0 [4.8, 5.1] |  |
| elite-a | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 28.6 [27.3, 29.8] | 5.7 [5.5, 5.8] |  |
| elite-b | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 27.9 [26.9, 29.0] | 7.2 [7.0, 7.4] |  |
| boss-a | boss | syn-exhaust | 100 | 17.0% [10.9%, 25.5%] | 55.6 [54.5, 56.7] | 10.0 [9.7, 10.3] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.2 [0.9, 1.6] | 5.0 [4.9, 5.1] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.2 [1.6, 2.8] | 5.0 [4.9, 5.1] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.5 [3.7, 5.3] | 7.9 [7.8, 8.1] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.9 [1.4, 2.4] | 7.3 [7.2, 7.4] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 5.2 [4.4, 5.9] | 6.8 [6.7, 7.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.6 [6.8, 8.3] | 6.8 [6.6, 6.9] |  |
| elite-a | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 7.4 [6.4, 8.5] | 7.8 [7.7, 7.9] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.3 [3.5, 5.1] | 9.5 [9.3, 9.7] |  |
| boss-a | boss | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 18.0 [16.2, 19.8] | 16.3 [16.1, 16.5] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 7.7 [6.9, 8.4] | 1.9 [1.8, 2.1] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 8.6 [7.9, 9.4] | 2.4 [2.3, 2.5] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 14.7 [13.9, 15.5] | 3.3 [3.2, 3.4] |  |
| enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 11.9 [11.2, 12.7] | 2.8 [2.7, 2.8] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 15.4 [14.6, 16.2] | 3.0 [2.9, 3.0] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 18.1 [17.2, 19.0] | 3.4 [3.2, 3.5] |  |
| elite-a | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 18.5 [17.3, 19.7] | 3.2 [3.1, 3.3] |  |
| elite-b | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 14.6 [13.2, 16.0] | 3.3 [3.2, 3.4] |  |
| boss-a | boss | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 36.3 [35.4, 37.3] | 5.0 [5.0, 5.1] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 4.8 [4.2, 5.4] | 2.2 [2.1, 2.3] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 4.0 [3.4, 4.7] | 2.6 [2.5, 2.7] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 7.9 [7.2, 8.7] | 4.0 [3.9, 4.1] |  |
| enemy-c | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 9.5 [8.4, 10.6] | 3.3 [3.2, 3.4] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 10.7 [10.1, 11.4] | 3.4 [3.3, 3.6] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 12.4 [11.6, 13.3] | 3.8 [3.7, 4.0] |  |
| elite-a | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 17.3 [15.8, 18.7] | 3.8 [3.7, 3.9] |  |
| elite-b | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 16.9 [15.6, 18.1] | 4.0 [3.9, 4.1] |  |
| boss-a | boss | syn-combo | 100 | 94.0% [87.5%, 97.2%] | 37.7 [35.6, 39.8] | 7.1 [7.0, 7.3] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 4.6 [4.2, 5.0] | 3.6 [3.5, 3.7] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 4.0 [3.6, 4.4] | 3.9 [3.8, 4.0] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 6.8 [6.3, 7.3] | 5.7 [5.6, 5.8] |  |
| enemy-c | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 9.1 [8.5, 9.6] | 5.6 [5.5, 5.7] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 11.0 [10.3, 11.6] | 5.3 [5.2, 5.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 12.1 [11.6, 12.6] | 5.3 [5.2, 5.4] |  |
| elite-a | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 19.3 [18.5, 20.2] | 5.9 [5.8, 6.0] |  |
| elite-b | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 14.0 [13.2, 14.8] | 6.8 [6.7, 7.0] |  |
| boss-a | boss | syn-mixed | 300 | 97.7% [95.3%, 98.9%] | 35.9 [34.9, 36.9] | 10.6 [10.4, 10.8] |  |

### smart bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 6 | 100.0% | 10.3 | 4.2 |
| starter | elite | 2 | 100.0% | 21.8 | 5.7 |
| starter | boss | 1 | 92.0% | 46.7 | 11.1 |
| mid | normal | 6 | 100.0% | 10.0 | 4.0 |
| mid | elite | 2 | 100.0% | 18.9 | 4.9 |
| mid | boss | 1 | 99.7% | 34.7 | 8.9 |
| late | normal | 6 | 100.0% | 8.7 | 3.5 |
| late | elite | 2 | 100.0% | 15.0 | 4.2 |
| late | boss | 1 | 100.0% | 26.2 | 7.1 |
| syn-tag | normal | 6 | 100.0% | 5.2 | 3.6 |
| syn-tag | elite | 2 | 100.0% | 12.4 | 4.7 |
| syn-tag | boss | 1 | 100.0% | 31.9 | 8.8 |
| syn-exhaust | normal | 6 | 100.0% | 8.2 | 2.7 |
| syn-exhaust | elite | 2 | 100.0% | 12.5 | 3.4 |
| syn-exhaust | boss | 1 | 98.0% | 28.4 | 6.0 |
| syn-trigger | normal | 6 | 100.0% | 3.2 | 4.3 |
| syn-trigger | elite | 2 | 100.0% | 3.5 | 5.3 |
| syn-trigger | boss | 1 | 100.0% | 9.9 | 9.1 |
| syn-mult | normal | 6 | 100.0% | 13.2 | 2.5 |
| syn-mult | elite | 2 | 100.0% | 15.2 | 3.0 |
| syn-mult | boss | 1 | 100.0% | 40.6 | 4.7 |
| syn-combo | normal | 6 | 100.0% | 6.7 | 2.5 |
| syn-combo | elite | 2 | 100.0% | 8.3 | 2.9 |
| syn-combo | boss | 1 | 100.0% | 28.1 | 5.4 |
| syn-mixed | normal | 6 | 100.0% | 8.9 | 4.1 |
| syn-mixed | elite | 2 | 100.0% | 16.3 | 5.3 |
| syn-mixed | boss | 1 | 100.0% | 35.4 | 9.0 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 7.0 [6.5, 7.5] | 3.0 [3.0, 3.0] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 5.3 [4.7, 6.0] | 3.2 [3.1, 3.3] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 9.0 [8.2, 9.7] | 5.0 [5.0, 5.1] |  |
| enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 11.9 [10.8, 13.0] | 4.6 [4.5, 4.7] |  |
| enemy-a+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 14.7 [14.0, 15.3] | 4.5 [4.4, 4.7] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 13.8 [13.1, 14.6] | 4.9 [4.8, 5.0] |  |
| elite-a | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 22.5 [21.0, 23.9] | 5.4 [5.3, 5.5] |  |
| elite-b | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 21.1 [20.1, 22.1] | 5.9 [5.8, 6.1] |  |
| boss-a | boss | starter | 100 | 92.0% [85.0%, 95.9%] | 46.7 [45.3, 48.1] | 11.1 [10.9, 11.3] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 6.7 [6.4, 7.0] | 2.9 [2.8, 2.9] | win ok, HP ok, turns LOW |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 5.6 [5.2, 6.0] | 3.2 [3.1, 3.3] | win ok, HP ok, turns ok |
| enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 9.3 [8.8, 9.9] | 4.9 [4.8, 5.0] | win ok, HP ok, turns ok |
| enemy-c | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 11.7 [11.1, 12.3] | 4.3 [4.2, 4.4] | win ok, HP ok, turns ok |
| enemy-a+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 13.4 [12.8, 13.9] | 4.2 [4.1, 4.4] | win ok, HP ok, turns ok |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 13.1 [12.6, 13.6] | 4.6 [4.5, 4.8] | win ok, HP ok, turns ok |
| elite-a | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 19.7 [18.9, 20.5] | 4.8 [4.7, 5.0] | win HIGH, HP ok, turns LOW |
| elite-b | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 18.1 [17.4, 18.7] | 5.0 [4.9, 5.1] | win HIGH, HP ok, turns ok |
| boss-a | boss | mid | 300 | 99.7% [98.1%, 99.9%] | 34.7 [33.6, 35.8] | 8.9 [8.7, 9.1] | win HIGH, HP ok, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 5.6 [5.2, 6.0] | 2.4 [2.4, 2.5] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 4.9 [4.5, 5.2] | 2.7 [2.7, 2.8] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 7.9 [7.4, 8.4] | 4.2 [4.1, 4.3] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 9.8 [9.2, 10.3] | 3.7 [3.6, 3.8] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 11.4 [10.8, 11.9] | 3.7 [3.6, 3.8] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 13.0 [12.4, 13.5] | 4.0 [3.9, 4.1] |  |
| elite-a | elite | late | 300 | 100.0% [98.7%, 100.0%] | 15.8 [15.1, 16.4] | 4.2 [4.1, 4.3] |  |
| elite-b | elite | late | 300 | 100.0% [98.7%, 100.0%] | 14.2 [13.5, 14.8] | 4.3 [4.2, 4.4] |  |
| boss-a | boss | late | 300 | 100.0% [98.7%, 100.0%] | 26.2 [25.2, 27.2] | 7.1 [7.0, 7.2] |  |
| enemy-a | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 2.3 [1.7, 2.8] | 2.6 [2.5, 2.7] |  |
| enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 1.8 [1.3, 2.2] | 2.9 [2.8, 2.9] |  |
| enemy-b+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 4.8 [4.0, 5.6] | 4.5 [4.4, 4.6] |  |
| enemy-c | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 7.3 [6.5, 8.1] | 4.0 [3.9, 4.1] |  |
| enemy-a+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 8.0 [7.3, 8.8] | 3.8 [3.6, 3.9] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 6.9 [6.2, 7.6] | 3.9 [3.7, 4.0] |  |
| elite-a | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 13.2 [12.2, 14.2] | 4.6 [4.5, 4.7] |  |
| elite-b | elite | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 11.5 [10.6, 12.4] | 4.9 [4.8, 5.0] |  |
| boss-a | boss | syn-tag | 100 | 100.0% [96.3%, 100.0%] | 31.9 [30.2, 33.7] | 8.8 [8.6, 9.0] |  |
| enemy-a | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 5.3 [4.7, 5.9] | 2.1 [2.0, 2.2] |  |
| enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 3.6 [3.0, 4.3] | 2.1 [2.0, 2.1] |  |
| enemy-b+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 8.0 [7.1, 8.9] | 3.1 [3.0, 3.3] |  |
| enemy-c | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 8.8 [8.0, 9.7] | 3.0 [2.9, 3.2] |  |
| enemy-a+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 12.1 [11.1, 13.0] | 2.8 [2.7, 2.9] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 11.2 [10.3, 12.0] | 3.0 [2.8, 3.1] |  |
| elite-a | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 13.7 [12.5, 15.0] | 3.4 [3.2, 3.5] |  |
| elite-b | elite | syn-exhaust | 100 | 100.0% [96.3%, 100.0%] | 11.3 [9.9, 12.7] | 3.5 [3.3, 3.6] |  |
| boss-a | boss | syn-exhaust | 100 | 98.0% [93.0%, 99.4%] | 28.4 [26.8, 30.0] | 6.0 [5.8, 6.2] |  |
| enemy-a | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.4 [1.1, 1.8] | 3.3 [3.2, 3.4] |  |
| enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.9 [1.3, 2.4] | 3.6 [3.5, 3.8] |  |
| enemy-b+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 3.5 [2.8, 4.2] | 5.1 [5.0, 5.2] |  |
| enemy-c | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 1.5 [1.1, 1.9] | 4.7 [4.5, 4.8] |  |
| enemy-a+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.4 [3.7, 5.1] | 4.5 [4.4, 4.6] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 6.3 [5.6, 7.1] | 4.7 [4.6, 4.8] |  |
| elite-a | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 4.6 [3.9, 5.3] | 5.2 [5.1, 5.2] |  |
| elite-b | elite | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 2.4 [1.8, 3.0] | 5.5 [5.4, 5.6] |  |
| boss-a | boss | syn-trigger | 100 | 100.0% [96.3%, 100.0%] | 9.9 [9.0, 10.8] | 9.1 [8.9, 9.3] |  |
| enemy-a | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 7.5 [6.7, 8.3] | 1.7 [1.6, 1.8] |  |
| enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 8.2 [7.6, 8.9] | 2.0 [2.0, 2.1] |  |
| enemy-b+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 15.6 [14.8, 16.4] | 3.1 [3.0, 3.1] |  |
| enemy-c | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 13.4 [12.9, 13.9] | 2.6 [2.5, 2.7] |  |
| enemy-a+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 16.3 [15.4, 17.2] | 2.6 [2.5, 2.7] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 18.0 [17.3, 18.8] | 2.8 [2.8, 2.9] |  |
| elite-a | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 16.8 [15.9, 17.7] | 3.0 [2.9, 3.0] |  |
| elite-b | elite | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 13.6 [12.5, 14.7] | 3.0 [3.0, 3.1] |  |
| boss-a | boss | syn-mult | 100 | 100.0% [96.3%, 100.0%] | 40.6 [39.7, 41.4] | 4.7 [4.6, 4.8] |  |
| enemy-a | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 3.3 [2.7, 3.9] | 1.8 [1.7, 1.9] |  |
| enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 2.4 [1.9, 2.9] | 2.0 [2.0, 2.1] |  |
| enemy-b+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 8.2 [7.5, 9.0] | 3.1 [3.0, 3.2] |  |
| enemy-c | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 7.1 [6.4, 7.8] | 2.6 [2.6, 2.7] |  |
| enemy-a+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 9.3 [8.6, 10.0] | 2.7 [2.6, 2.8] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 9.6 [8.9, 10.3] | 3.0 [2.9, 3.1] |  |
| elite-a | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 9.9 [8.8, 10.9] | 2.9 [2.8, 3.0] |  |
| elite-b | elite | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 6.7 [5.7, 7.7] | 2.9 [2.8, 3.0] |  |
| boss-a | boss | syn-combo | 100 | 100.0% [96.3%, 100.0%] | 28.1 [27.2, 28.9] | 5.4 [5.2, 5.5] |  |
| enemy-a | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 5.4 [5.0, 5.8] | 3.0 [2.9, 3.1] |  |
| enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 4.7 [4.3, 5.1] | 3.3 [3.2, 3.3] |  |
| enemy-b+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 7.0 [6.5, 7.6] | 5.1 [5.0, 5.1] |  |
| enemy-c | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 10.8 [10.2, 11.4] | 4.6 [4.5, 4.7] |  |
| enemy-a+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 12.6 [11.9, 13.2] | 4.3 [4.3, 4.4] |  |
| enemy-d+enemy-d+enemy-d | normal | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 13.0 [12.4, 13.6] | 4.5 [4.4, 4.6] |  |
| elite-a | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 17.5 [16.9, 18.2] | 5.1 [5.0, 5.2] |  |
| elite-b | elite | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 15.1 [14.4, 15.8] | 5.6 [5.5, 5.7] |  |
| boss-a | boss | syn-mixed | 300 | 100.0% [98.7%, 100.0%] | 35.4 [34.3, 36.5] | 9.0 [8.9, 9.2] |  |


## Fight length distribution

Turns per fight with the mid deck set (starter + 5 sampled cards). Mean has a 95% CI; p10/median/p90 show spread (a fight that is usually 4 turns but sometimes 12 is a pacing problem the mean hides). Histogram buckets are turn counts (last bucket = 15+). 9 fights x 100 seeds = 900 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, elite-a, elite-b, boss-a.

### random bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 3.93 [3.77, 4.09] | 2 | 4 | 6 | 3-6 | ok |
| enemy-d+enemy-d | normal | 4.46 [4.27, 4.64] | 3 | 4 | 7 | 3-6 | ok |
| enemy-b+enemy-d | normal | 7.36 [7.08, 7.65] | 5 | 7 | 11 | 3-6 | HIGH |
| enemy-c | normal | 6.18 [5.94, 6.42] | 4 | 6 | 9 | 3-6 | HIGH |
| enemy-a+enemy-d | normal | 6.25 [6.01, 6.49] | 4 | 6 | 9 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 6.83 [6.56, 7.10] | 5 | 6 | 11 | 3-6 | HIGH |
| elite-a | elite | 6.88 [6.65, 7.10] | 5 | 6 | 10 | 5-9 | ok |
| elite-b | elite | 7.77 [7.44, 8.09] | 5 | 7 | 13 | 5-9 | ok |
| boss-a | boss | 12.26 [11.84, 12.68] | 9 | 11 | 19 | 8-14 | ok |

```
enemy-a (normal)
 2    31 #######
 3   114 ########################
 4    66 ##############
 5    46 ##########
 6    28 ######
 7    10 ##
 8     2 
 9     2 
10     1 
```

```
enemy-d+enemy-d (normal)
 2    17 ####
 3    92 ########################
 4    64 #################
 5    44 ###########
 6    48 #############
 7    20 #####
 8    14 ####
11     1 
```

```
enemy-b+enemy-d (normal)
 4    12 ####
 5    79 ########################
 6    51 ###############
 7    51 ###############
 8    15 #####
 9    28 #########
10    17 #####
11    21 ######
12    16 #####
13     5 ##
14     3 #
15+    2 #
```

```
enemy-c (normal)
 3     3 #
 4    77 ########################
 5    43 #############
 6    72 ######################
 7    37 ############
 8    30 #########
 9    17 #####
10     5 ##
11     8 ##
12     5 ##
13     2 #
14     1 
```

```
enemy-a+enemy-d (normal)
 3     7 ##
 4    43 ###########
 5    97 ########################
 6    48 ############
 7    32 ########
 8    25 ######
 9    20 #####
10    15 ####
11     7 ##
12     2 
13     2 
14     2 
```

```
enemy-d+enemy-d+enemy-d (normal)
 3     2 #
 4    25 #######
 5    91 ########################
 6    65 #################
 7    21 ######
 8    16 ####
 9    35 #########
10    12 ###
11    17 ####
12    12 ###
13     3 #
15+    1 
```

```
elite-a (elite)
 4    13 ####
 5    73 ######################
 6    79 ########################
 7    42 #############
 8    28 #########
 9    28 #########
10    17 #####
11    12 ####
12     5 ##
13     2 #
14     1 
```

```
elite-b (elite)
 4    16 #####
 5    55 ###################
 6    49 #################
 7    70 ########################
 8    18 ######
 9     6 ##
10    32 ###########
11    17 ######
12     6 ##
13    16 #####
14     9 ###
15+    6 ##
```

```
boss-a (boss)
 7    15 #####
 8    10 ###
 9    67 #######################
10    20 #######
11    42 ##############
12    17 ######
13    50 #################
14     8 ###
15+   71 ########################
```

### greedy bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 4.28 [4.10, 4.47] | 3 | 3 | 7 | 3-6 | ok |
| enemy-d+enemy-d | normal | 4.43 [4.28, 4.58] | 3 | 4 | 6 | 3-6 | ok |
| enemy-b+enemy-d | normal | 6.39 [6.16, 6.61] | 5 | 5 | 9 | 3-6 | HIGH |
| enemy-c | normal | 5.98 [5.73, 6.23] | 4 | 6 | 9 | 3-6 | ok |
| enemy-a+enemy-d | normal | 7.01 [6.72, 7.29] | 5 | 6 | 11 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 6.79 [6.52, 7.06] | 4 | 6 | 11 | 3-6 | HIGH |
| elite-a | elite | 7.19 [6.89, 7.49] | 5 | 6 | 11.100000000000023 | 5-9 | ok |
| elite-b | elite | 8.12 [7.79, 8.45] | 5 | 7 | 13 | 5-9 | ok |
| boss-a | boss | 13.44 [12.89, 13.99] | 9.900000000000002 | 11 | 21 | 8-14 | ok |

```
enemy-a (normal)
 2     6 #
 3   151 ########################
 4    24 ####
 5    45 #######
 6    37 ######
 7    26 ####
 8     4 #
 9     7 #
```

```
enemy-d+enemy-d (normal)
 2     1 
 3    88 #######################
 4    91 ########################
 5    57 ###############
 6    41 ###########
 7    11 ###
 8     8 ##
 9     3 #
```

```
enemy-b+enemy-d (normal)
 4    15 ##
 5   145 ########################
 6    24 ####
 7    48 ########
 8    13 ##
 9    31 #####
10     3 
11    16 ###
12     3 
13     2 
```

```
enemy-c (normal)
 4   118 ########################
 5    24 #####
 6    57 ############
 7    46 #########
 8     8 ##
 9    31 ######
11     2 
12    12 ##
14     2 
```

```
enemy-a+enemy-d (normal)
 3     1 
 4    24 ########
 5    73 ########################
 6    70 #######################
 7    53 #################
 9    22 #######
10    17 ######
11    27 #########
13     7 ##
14     1 
15+    5 ##
```

```
enemy-d+enemy-d+enemy-d (normal)
 4    42 ############
 5    65 ##################
 6    86 ########################
 7     8 ##
 8    25 #######
 9    19 #####
10    18 #####
11    25 #######
12    10 ###
13     2 #
```

```
elite-a (elite)
 4    20 ####
 5    52 ##########
 6   122 ########################
 7     5 #
 8    26 #####
 9     5 #
10    34 #######
11     6 #
12    17 ###
13     1 
14     9 ##
15+    3 #
```

```
elite-b (elite)
 4     4 #
 5    66 #####################
 6    20 ######
 7    77 ########################
 8    41 #############
 9     1 
10    22 #######
11    29 #########
13    21 #######
14    12 ####
15+    7 ##
```

```
boss-a (boss)
 8     5 #
 9    25 ######
10    90 ######################
11    76 ##################
12     1 
13     3 #
14     1 
15+   99 ########################
```

### smart bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 2.85 [2.76, 2.94] | 2 | 3 | 4 | 3-6 | LOW |
| enemy-d+enemy-d | normal | 3.20 [3.08, 3.32] | 2 | 3 | 5 | 3-6 | ok |
| enemy-b+enemy-d | normal | 4.91 [4.79, 5.03] | 4 | 5 | 6.100000000000023 | 3-6 | ok |
| enemy-c | normal | 4.30 [4.19, 4.41] | 3 | 4 | 6 | 3-6 | ok |
| enemy-a+enemy-d | normal | 4.23 [4.10, 4.37] | 3 | 4 | 6 | 3-6 | ok |
| enemy-d+enemy-d+enemy-d | normal | 4.63 [4.48, 4.79] | 3 | 4 | 7 | 3-6 | ok |
| elite-a | elite | 4.85 [4.74, 4.96] | 4 | 5 | 6 | 5-9 | LOW |
| elite-b | elite | 5.01 [4.88, 5.14] | 4 | 5 | 7 | 5-9 | ok |
| boss-a | boss | 8.91 [8.69, 9.14] | 7 | 8 | 12 | 8-14 | ok |

```
enemy-a (normal)
 2   116 ######################
 3   127 ########################
 4    43 ########
 5    14 ###
```

```
enemy-d+enemy-d (normal)
 2    92 #####################
 3   105 ########################
 4    58 #############
 5    42 ##########
 6     3 #
```

```
enemy-b+enemy-d (normal)
 3    14 ###
 4   110 ########################
 5    99 ######################
 6    47 ##########
 7    27 ######
 8     3 #
```

```
enemy-c (normal)
 3    61 ##########
 4   142 ########################
 5    45 ########
 6    50 ########
 7     2 
```

```
enemy-a+enemy-d (normal)
 3   105 ########################
 4    92 #####################
 5    44 ##########
 6    46 ###########
 7    13 ###
```

```
enemy-d+enemy-d+enemy-d (normal)
 3    66 ##############
 4   110 ########################
 5    40 #########
 6    43 #########
 7    34 #######
 8     7 ##
```

```
elite-a (elite)
 3     7 #
 4   135 ########################
 5    75 #############
 6    65 ############
 7    15 ###
 8     3 #
```

```
elite-b (elite)
 4   143 ########################
 5    70 ############
 6    36 ######
 7    44 #######
 8     6 #
 9     1 
```

```
boss-a (boss)
 7    92 ########################
 8    88 #######################
 9    19 #####
10    20 #####
11    42 ###########
12    16 ####
13    21 #####
14     2 #
```


## Card effect: ablation and addition

Each row compares the starter deck WITH the card against the same deck WITHOUT it, on identical seeds (paired). Changes are "with minus without"; a negative HP-lost change is good for the player. Brackets are 95% confidence intervals. 9 fights x 60 seeds = 540 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, elite-a, elite-b, boss-a.
Verdict reads the headline metric (HP lost, negligible if within +-1): INCONCLUSIVE means the interval spans zero and is too wide to call the card negligible. Add seeds before concluding anything.
A card added to the starter deck shows its stand-alone value. Cards that need partners (synergy) will look weak here; see the pair experiment.

### random bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| end-guard | power | 1 | no | +5.9 [+3.8, +8.0] pts | -5.0 [-5.7, -4.4] | +0.49 [+0.36, +0.62] | better |
| attack-echo | power | 1 | no | +4.8 [+2.9, +6.8] pts | -4.2 [-4.8, -3.5] | +0.47 [+0.34, +0.60] | better |
| guarded-strike | attack | 1 | yes | +3.1 [+1.4, +4.9] pts | -3.3 [-4.0, -2.7] | -0.19 [-0.31, -0.06] | better |
| prime-a | skill | 0 | no | +0.9 [-0.3, +2.1] pts | -3.3 [-3.9, -2.7] | +0.26 [+0.14, +0.39] | better |
| strengthen | power | 1 | yes | +6.7 [+4.5, +8.8] pts | -2.3 [-3.0, -1.7] | -0.81 [-0.93, -0.68] | better |
| jab | attack | 0 | yes | +3.0 [+1.4, +4.6] pts | -2.3 [-2.9, -1.7] | -0.62 [-0.74, -0.50] | better |
| single-use-strike | attack | 1 | no | +0.4 [-0.7, +1.4] pts | -1.5 [-2.1, -0.9] | -0.59 [-0.72, -0.47] | better |
| big-block | skill | 2 | yes | +0.4 [-0.8, +1.5] pts | -1.4 [-2.1, -0.7] | +1.25 [+1.10, +1.40] | better |
| hand-strike | attack | 1 | no | +2.6 [+1.1, +4.1] pts | -1.4 [-2.0, -0.8] | -0.78 [-0.90, -0.66] | better |
| heavy-hit | attack | 3 | yes | +2.2 [+0.6, +3.8] pts | -1.4 [-2.0, -0.7] | -0.90 [-1.04, -0.76] | better |
| pain-engine | power | 1 | no | +7.0 [+4.8, +9.3] pts | -1.3 [-1.9, -0.6] | -0.52 [-0.65, -0.40] | better |
| fortify | power | 2 | yes | +2.6 [+1.0, +4.2] pts | -1.2 [-1.9, -0.5] | +0.64 [+0.52, +0.77] | better |
| combo-strike | attack | 1 | no | +2.2 [+0.8, +3.7] pts | -1.1 [-1.7, -0.5] | -0.71 [-0.83, -0.59] | better |
| weaken | skill | 1 | yes | +2.6 [+1.0, +4.2] pts | -1.1 [-1.7, -0.4] | +0.86 [+0.73, +0.99] | better |
| defend | skill | 1 | no | -0.7 [-1.5, -0.0] pts | -0.8 [-1.4, -0.2] | +0.65 [+0.52, +0.77] | better |
| block-spark | power | 1 | no | +3.7 [+1.9, +5.5] pts | -0.6 [-1.3, +0.1] | -0.50 [-0.61, -0.38] | INCONCLUSIVE |
| opening-spark | power | 1 | no | +4.1 [+2.2, +6.0] pts | -0.5 [-1.2, +0.2] | -0.45 [-0.57, -0.33] | INCONCLUSIVE |
| sunder | attack | 2 | yes | +2.4 [+0.9, +3.9] pts | -0.0 [-0.7, +0.6] | -0.69 [-0.82, -0.57] | negligible |
| expose | skill | 1 | yes | +3.1 [+1.5, +4.8] pts | +0.0 [-0.6, +0.6] | -0.36 [-0.49, -0.23] | negligible |
| power-up | skill | 1 | no | +0.6 [-0.6, +1.8] pts | +0.3 [-0.3, +0.9] | -0.42 [-0.54, -0.30] | negligible |
| strike | attack | 1 | no | +0.2 [-0.9, +1.3] pts | +0.5 [-0.1, +1.1] | -0.39 [-0.51, -0.27] | INCONCLUSIVE |
| blood-strike | attack | 1 | no | +0.9 [-0.4, +2.2] pts | +0.5 [-0.0, +1.1] | -1.54 [-1.66, -1.41] | INCONCLUSIVE |
| opportunist | attack | 1 | no | +0.0 [-1.0, +1.0] pts | +0.9 [+0.3, +1.5] | -0.22 [-0.34, -0.10] | worse |
| cull | skill | 0 | no | -0.6 [-1.4, +0.3] pts | +0.9 [+0.3, +1.5] | +0.21 [+0.07, +0.35] | worse |
| bolt | attack | 2 | yes | +0.4 [-0.8, +1.5] pts | +1.0 [+0.3, +1.6] | -0.52 [-0.64, -0.40] | worse |
| kill-reward | power | 1 | no | -0.2 [-1.1, +0.8] pts | +1.4 [+0.8, +2.0] | +0.13 [+0.01, +0.25] | worse |
| tag-a-payoff | attack | 1 | no | -0.6 [-1.4, +0.3] pts | +1.5 [+0.8, +2.1] | -0.01 [-0.14, +0.11] | worse |
| block-slam | attack | 1 | no | -0.7 [-1.5, -0.0] pts | +1.8 [+1.1, +2.4] | +0.01 [-0.11, +0.13] | worse |
| tag-a-echo | power | 1 | no | -0.2 [-1.1, +0.8] pts | +1.8 [+1.1, +2.4] | +0.24 [+0.11, +0.36] | worse |
| double-strength | skill | 1 | no | -0.2 [-1.1, +0.8] pts | +1.8 [+1.1, +2.4] | +0.24 [+0.11, +0.36] | worse |
| exhaust-engine | power | 1 | no | -0.2 [-1.1, +0.8] pts | +1.8 [+1.1, +2.4] | +0.24 [+0.11, +0.36] | worse |
| focus | power | 1 | no | -0.6 [-1.4, +0.3] pts | +1.8 [+1.2, +2.4] | +0.28 [+0.16, +0.40] | worse |
| exhaust-payoff | attack | 1 | no | -0.6 [-1.4, +0.3] pts | +2.0 [+1.4, +2.6] | +0.11 [-0.01, +0.24] | worse |
| quick-draw | skill | 1 | yes | -0.7 [-1.5, -0.0] pts | +4.1 [+3.4, +4.9] | +0.61 [+0.47, +0.76] | worse |

### random bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| end-guard | power | 1 | no | +6.7 [+4.5, +8.8] pts | -5.8 [-6.4, -5.3] | +1.17 [+1.03, +1.32] | better |
| prime-a | skill | 0 | no | +2.6 [+1.2, +4.0] pts | -4.3 [-4.8, -3.7] | +0.85 [+0.72, +0.98] | better |
| attack-echo | power | 1 | no | +4.6 [+2.8, +6.5] pts | -4.2 [-4.8, -3.7] | +1.13 [+0.99, +1.26] | better |
| guarded-strike | attack | 1 | yes | +2.2 [+0.8, +3.7] pts | -3.9 [-4.2, -3.5] | +0.23 [+0.17, +0.29] | better |
| jab | attack | 0 | yes | +2.6 [+1.1, +4.1] pts | -3.1 [-3.6, -2.5] | -0.27 [-0.39, -0.16] | better |
| strengthen | power | 1 | yes | +5.7 [+3.7, +7.8] pts | -2.3 [-2.8, -1.7] | -0.30 [-0.41, -0.18] | better |
| fortify | power | 2 | yes | +5.2 [+3.1, +7.3] pts | -2.1 [-2.7, -1.5] | +1.37 [+1.23, +1.51] | better |
| single-use-strike | attack | 1 | no | +0.4 [-0.7, +1.4] pts | -2.0 [-2.5, -1.5] | -0.10 [-0.22, +0.01] | better |
| heavy-hit | attack | 3 | yes | +3.9 [+2.2, +5.6] pts | -2.0 [-2.5, -1.4] | -0.55 [-0.67, -0.42] | better |
| hand-strike | attack | 1 | no | +3.3 [+1.8, +4.8] pts | -1.9 [-2.3, -1.6] | -0.43 [-0.48, -0.38] | better |
| big-block | skill | 2 | yes | +0.9 [-0.4, +2.2] pts | -1.9 [-2.5, -1.3] | +2.11 [+1.94, +2.28] | better |
| weaken | skill | 1 | yes | +1.9 [+0.6, +3.1] pts | -1.8 [-2.1, -1.4] | +1.57 [+1.46, +1.69] | better |
| pain-engine | power | 1 | no | +7.6 [+5.4, +9.8] pts | -1.7 [-2.3, -1.1] | -0.03 [-0.15, +0.09] | better |
| combo-strike | attack | 1 | no | +1.7 [+0.6, +2.7] pts | -1.6 [-1.9, -1.3] | -0.40 [-0.46, -0.35] | better |
| opening-spark | power | 1 | no | +4.3 [+2.5, +6.0] pts | -1.0 [-1.6, -0.5] | -0.01 [-0.12, +0.10] | better |
| block-spark | power | 1 | no | +3.7 [+2.0, +5.4] pts | -1.0 [-1.6, -0.5] | -0.07 [-0.18, +0.03] | better |
| defend | skill | 1 | no | -0.4 [-1.1, +0.4] pts | -0.9 [-1.5, -0.3] | +1.51 [+1.37, +1.65] | better |
| power-up | skill | 1 | no | +2.4 [+0.8, +4.0] pts | -0.7 [-1.2, -0.2] | +0.03 [-0.09, +0.14] | better |
| sunder | attack | 2 | yes | +2.6 [+1.1, +4.1] pts | -0.7 [-1.2, -0.1] | -0.31 [-0.43, -0.19] | better |
| expose | skill | 1 | yes | +2.0 [+0.8, +3.2] pts | -0.1 [-0.5, +0.2] | +0.10 [+0.04, +0.16] | negligible |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| bolt | attack | 2 | yes | -0.2 [-1.0, +0.6] pts | +0.2 [-0.3, +0.7] | -0.20 [-0.31, -0.09] | negligible |
| cull | skill | 0 | no | +0.0 [-0.7, +0.7] pts | +0.5 [-0.0, +1.1] | +0.85 [+0.70, +1.00] | INCONCLUSIVE |
| blood-strike | attack | 1 | no | +1.3 [+0.3, +2.3] pts | +0.6 [+0.2, +1.0] | -1.30 [-1.39, -1.22] | worse |
| opportunist | attack | 1 | no | -0.6 [-1.2, +0.1] pts | +0.7 [+0.5, +0.9] | +0.21 [+0.17, +0.25] | worse |
| kill-reward | power | 1 | no | -0.7 [-1.5, -0.0] pts | +1.1 [+0.6, +1.6] | +0.72 [+0.60, +0.84] | worse |
| focus | power | 1 | no | -0.2 [-1.0, +0.6] pts | +1.3 [+0.7, +1.8] | +0.89 [+0.76, +1.01] | worse |
| tag-a-echo | power | 1 | no | -0.7 [-1.5, -0.0] pts | +1.4 [+0.9, +1.9] | +0.86 [+0.74, +0.98] | worse |
| double-strength | skill | 1 | no | -0.7 [-1.5, -0.0] pts | +1.4 [+0.9, +1.9] | +0.86 [+0.74, +0.98] | worse |
| exhaust-engine | power | 1 | no | -0.7 [-1.5, -0.0] pts | +1.4 [+0.9, +1.9] | +0.86 [+0.74, +0.98] | worse |
| tag-a-payoff | attack | 1 | no | -0.7 [-1.5, -0.0] pts | +1.6 [+1.3, +1.9] | +0.45 [+0.39, +0.50] | worse |
| block-slam | attack | 1 | no | -0.7 [-1.5, -0.0] pts | +1.6 [+1.3, +2.0] | +0.43 [+0.36, +0.50] | worse |
| exhaust-payoff | attack | 1 | no | -0.7 [-1.5, -0.0] pts | +2.2 [+1.8, +2.5] | +0.60 [+0.53, +0.67] | worse |
| quick-draw | skill | 1 | yes | -0.7 [-1.5, -0.0] pts | +4.5 [+3.8, +5.2] | +1.34 [+1.19, +1.48] | worse |

### greedy bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| big-block | skill | 2 | yes | +0.0 [+0.0, +0.0] pts | -4.4 [-5.0, -3.8] | +0.75 [+0.64, +0.85] | better |
| end-guard | power | 1 | no | +0.0 [+0.0, +0.0] pts | -4.1 [-4.7, -3.5] | +0.40 [+0.32, +0.47] | better |
| guarded-strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -3.0 [-3.5, -2.5] | -0.51 [-0.59, -0.43] | better |
| attack-echo | power | 1 | no | +0.0 [+0.0, +0.0] pts | -1.6 [-2.1, -1.2] | +0.40 [+0.32, +0.47] | better |
| weaken | skill | 1 | yes | -0.2 [-0.5, +0.2] pts | -1.5 [-2.0, -1.0] | +1.26 [+1.16, +1.36] | better |
| fortify | power | 2 | yes | +0.0 [+0.0, +0.0] pts | -1.4 [-2.0, -0.8] | +0.36 [+0.27, +0.45] | better |
| defend | skill | 1 | no | +0.0 [+0.0, +0.0] pts | -1.0 [-1.5, -0.5] | +0.58 [+0.49, +0.67] | better |
| prime-a | skill | 0 | no | +0.0 [+0.0, +0.0] pts | -1.0 [-1.5, -0.5] | -0.09 [-0.17, -0.00] | better |
| strengthen | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.7 [-1.2, -0.2] | -1.04 [-1.13, -0.95] | better |
| focus | power | 1 | no | +0.0 [+0.0, +0.0] pts | -0.7 [-1.3, -0.2] | +0.35 [+0.27, +0.43] | better |
| single-use-strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | -0.2 [-0.7, +0.3] | -0.54 [-0.63, -0.46] | negligible |
| heavy-hit | attack | 3 | yes | +0.0 [+0.0, +0.0] pts | +0.2 [-0.3, +0.7] | -1.07 [-1.18, -0.96] | negligible |
| opening-spark | power | 1 | no | +0.0 [+0.0, +0.0] pts | +0.2 [-0.3, +0.7] | -0.62 [-0.71, -0.54] | negligible |
| block-spark | power | 1 | no | +0.0 [+0.0, +0.0] pts | +0.3 [-0.2, +0.8] | -0.53 [-0.61, -0.45] | negligible |
| jab | attack | 0 | yes | +0.0 [+0.0, +0.0] pts | +0.3 [-0.1, +0.8] | -0.81 [-0.89, -0.72] | negligible |
| pain-engine | power | 1 | no | +0.0 [+0.0, +0.0] pts | +0.4 [-0.1, +0.9] | -0.48 [-0.58, -0.38] | negligible |
| sunder | attack | 2 | yes | +0.0 [+0.0, +0.0] pts | +0.6 [+0.1, +1.1] | -1.25 [-1.37, -1.14] | worse |
| power-up | skill | 1 | no | +0.0 [+0.0, +0.0] pts | +0.7 [+0.2, +1.2] | -0.78 [-0.88, -0.67] | worse |
| expose | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | +0.8 [+0.3, +1.3] | -0.75 [-0.86, -0.64] | worse |
| combo-strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +1.0 [+0.5, +1.5] | -0.65 [-0.74, -0.56] | worse |
| bolt | attack | 2 | yes | +0.0 [+0.0, +0.0] pts | +1.2 [+0.7, +1.7] | -0.45 [-0.53, -0.37] | worse |
| hand-strike | attack | 1 | no | -0.2 [-0.5, +0.2] pts | +1.2 [+0.8, +1.7] | -0.45 [-0.53, -0.37] | worse |
| strike | attack | 1 | no | -0.2 [-0.5, +0.2] pts | +1.6 [+1.1, +2.0] | -0.34 [-0.43, -0.26] | worse |
| opportunist | attack | 1 | no | -0.2 [-0.5, +0.2] pts | +1.7 [+1.2, +2.2] | -0.27 [-0.35, -0.19] | worse |
| tag-a-payoff | attack | 1 | no | -0.2 [-0.5, +0.2] pts | +1.9 [+1.4, +2.4] | -0.16 [-0.24, -0.07] | worse |
| kill-reward | power | 1 | no | +0.0 [+0.0, +0.0] pts | +2.0 [+1.5, +2.5] | +0.31 [+0.23, +0.38] | worse |
| tag-a-echo | power | 1 | no | +0.0 [+0.0, +0.0] pts | +2.0 [+1.5, +2.5] | +0.40 [+0.32, +0.47] | worse |
| exhaust-engine | power | 1 | no | +0.0 [+0.0, +0.0] pts | +2.0 [+1.5, +2.5] | +0.40 [+0.32, +0.47] | worse |
| exhaust-payoff | attack | 1 | no | -0.4 [-0.9, +0.1] pts | +2.1 [+1.6, +2.6] | -0.12 [-0.20, -0.04] | worse |
| block-slam | attack | 1 | no | -0.6 [-1.2, +0.1] pts | +2.5 [+2.0, +3.0] | +0.07 [-0.02, +0.15] | worse |
| double-strength | skill | 1 | no | -0.6 [-1.2, +0.1] pts | +2.5 [+2.0, +3.0] | +0.07 [-0.02, +0.15] | worse |
| cull | skill | 0 | no | -0.6 [-1.2, +0.1] pts | +2.5 [+2.0, +3.0] | +0.07 [-0.02, +0.15] | worse |
| quick-draw | skill | 1 | yes | -1.1 [-2.0, -0.2] pts | +2.7 [+2.1, +3.2] | +1.94 [+1.83, +2.04] | worse |
| blood-strike | attack | 1 | no | -0.7 [-1.5, -0.0] pts | +6.1 [+5.5, +6.6] | -1.74 [-1.85, -1.63] | worse |

### greedy bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| end-guard | power | 1 | no | +0.0 [+0.0, +0.0] pts | -5.9 [-6.5, -5.4] | +0.75 [+0.67, +0.83] | better |
| big-block | skill | 2 | yes | +0.0 [+0.0, +0.0] pts | -5.7 [-6.3, -5.1] | +1.23 [+1.11, +1.35] | better |
| guarded-strike | attack | 1 | yes | +0.0 [+0.0, +0.0] pts | -4.4 [-4.8, -4.0] | -0.24 [-0.32, -0.17] | better |
| weaken | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -3.5 [-3.9, -3.0] | +1.90 [+1.79, +2.01] | better |
| focus | power | 1 | no | +0.0 [+0.0, +0.0] pts | -3.3 [-3.9, -2.8] | +0.62 [+0.54, +0.70] | better |
| fortify | power | 2 | yes | +0.0 [+0.0, +0.0] pts | -3.2 [-3.8, -2.6] | +0.64 [+0.54, +0.73] | better |
| attack-echo | power | 1 | no | +0.0 [+0.0, +0.0] pts | -3.1 [-3.5, -2.7] | +0.75 [+0.67, +0.83] | better |
| defend | skill | 1 | no | +0.0 [+0.0, +0.0] pts | -2.6 [-3.0, -2.2] | +1.11 [+1.01, +1.21] | better |
| strengthen | power | 1 | yes | +0.0 [+0.0, +0.0] pts | -2.4 [-2.9, -2.0] | -0.67 [-0.75, -0.59] | better |
| prime-a | skill | 0 | no | +0.0 [+0.0, +0.0] pts | -2.2 [-2.6, -1.9] | +0.34 [+0.26, +0.42] | better |
| single-use-strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | -2.0 [-2.4, -1.7] | -0.21 [-0.28, -0.13] | better |
| pain-engine | power | 1 | no | +0.0 [+0.0, +0.0] pts | -1.9 [-2.4, -1.4] | -0.14 [-0.23, -0.04] | better |
| opening-spark | power | 1 | no | +0.0 [+0.0, +0.0] pts | -1.8 [-2.3, -1.4] | -0.35 [-0.43, -0.28] | better |
| block-spark | power | 1 | no | +0.0 [+0.0, +0.0] pts | -1.7 [-2.1, -1.3] | -0.20 [-0.27, -0.13] | better |
| heavy-hit | attack | 3 | yes | +0.0 [+0.0, +0.0] pts | -1.1 [-1.5, -0.7] | -0.84 [-0.94, -0.75] | better |
| jab | attack | 0 | yes | -0.2 [-0.5, +0.2] pts | -1.0 [-1.2, -0.7] | -0.56 [-0.63, -0.49] | better |
| power-up | skill | 1 | no | +0.0 [+0.0, +0.0] pts | -0.9 [-1.3, -0.5] | -0.51 [-0.60, -0.42] | better |
| combo-strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | -0.6 [-0.9, -0.4] | -0.37 [-0.43, -0.31] | better |
| expose | skill | 1 | yes | +0.0 [+0.0, +0.0] pts | -0.4 [-0.7, -0.0] | -0.23 [-0.32, -0.14] | better |
| bolt | attack | 2 | yes | +0.0 [+0.0, +0.0] pts | -0.3 [-0.6, -0.1] | -0.19 [-0.25, -0.14] | better |
| hand-strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | -0.3 [-0.5, -0.1] | -0.14 [-0.18, -0.09] | better |
| tag-a-echo | power | 1 | no | +0.0 [+0.0, +0.0] pts | -0.2 [-0.5, +0.2] | +0.75 [+0.67, +0.83] | negligible |
| kill-reward | power | 1 | no | +0.0 [+0.0, +0.0] pts | -0.2 [-0.5, +0.2] | +0.65 [+0.57, +0.74] | negligible |
| exhaust-engine | power | 1 | no | +0.0 [+0.0, +0.0] pts | -0.2 [-0.5, +0.2] | +0.75 [+0.67, +0.83] | negligible |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| sunder | attack | 2 | yes | +0.0 [+0.0, +0.0] pts | +0.3 [-0.1, +0.8] | -1.01 [-1.11, -0.91] | negligible |
| opportunist | attack | 1 | no | -0.4 [-0.9, +0.1] pts | +0.5 [+0.3, +0.7] | +0.12 [+0.08, +0.16] | worse |
| quick-draw | skill | 1 | yes | -0.6 [-1.2, +0.1] pts | +0.5 [-0.1, +1.0] | +2.53 [+2.42, +2.65] | INCONCLUSIVE |
| tag-a-payoff | attack | 1 | no | -0.4 [-0.9, +0.1] pts | +0.7 [+0.5, +0.9] | +0.24 [+0.19, +0.29] | worse |
| exhaust-payoff | attack | 1 | no | -0.4 [-0.9, +0.1] pts | +0.9 [+0.6, +1.1] | +0.29 [+0.23, +0.34] | worse |
| block-slam | attack | 1 | no | -0.9 [-1.7, -0.1] pts | +1.3 [+1.0, +1.7] | +0.55 [+0.48, +0.62] | worse |
| double-strength | skill | 1 | no | -0.9 [-1.7, -0.1] pts | +1.3 [+1.0, +1.7] | +0.55 [+0.48, +0.62] | worse |
| cull | skill | 0 | no | -0.9 [-1.7, -0.1] pts | +1.3 [+1.0, +1.7] | +0.55 [+0.48, +0.62] | worse |
| blood-strike | attack | 1 | no | -0.4 [-0.9, +0.1] pts | +5.5 [+5.1, +5.8] | -1.70 [-1.80, -1.61] | worse |

### smart bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| end-guard | power | 1 | no | +0.9 [+0.1, +1.7] pts | -4.7 [-5.3, -4.1] | +0.28 [+0.21, +0.34] | better |
| big-block | skill | 2 | yes | +0.9 [+0.1, +1.7] pts | -4.3 [-4.9, -3.6] | +0.68 [+0.60, +0.77] | better |
| guarded-strike | attack | 1 | yes | +0.9 [+0.1, +1.7] pts | -3.9 [-4.4, -3.3] | -0.20 [-0.26, -0.14] | better |
| attack-echo | power | 1 | no | +0.9 [+0.1, +1.7] pts | -3.7 [-4.3, -3.1] | +0.23 [+0.16, +0.29] | better |
| prime-a | skill | 0 | no | +0.7 [-0.1, +1.6] pts | -2.4 [-3.0, -1.8] | +0.30 [+0.23, +0.37] | better |
| block-slam | attack | 1 | no | +0.7 [-0.1, +1.6] pts | -2.4 [-2.9, -1.8] | +0.15 [+0.07, +0.22] | better |
| jab | attack | 0 | yes | +0.0 [-1.1, +1.1] pts | -1.4 [-1.9, -0.8] | -0.20 [-0.26, -0.13] | better |
| hand-strike | attack | 1 | no | +0.6 [-0.4, +1.5] pts | -1.0 [-1.6, -0.5] | -0.83 [-0.90, -0.75] | better |
| combo-strike | attack | 1 | no | +0.9 [+0.1, +1.7] pts | -0.9 [-1.4, -0.4] | -0.81 [-0.89, -0.74] | better |
| single-use-strike | attack | 1 | no | +0.6 [-0.4, +1.5] pts | -0.6 [-1.1, -0.1] | -0.39 [-0.45, -0.32] | better |
| heavy-hit | attack | 3 | yes | +0.9 [+0.1, +1.7] pts | -0.6 [-1.1, -0.0] | -1.19 [-1.28, -1.11] | better |
| defend | skill | 1 | no | +0.0 [-1.1, +1.1] pts | -0.1 [-0.7, +0.4] | +0.46 [+0.39, +0.54] | negligible |
| weaken | skill | 1 | yes | +0.9 [+0.1, +1.7] pts | -0.1 [-0.7, +0.5] | +0.81 [+0.72, +0.90] | negligible |
| opportunist | attack | 1 | no | -0.2 [-1.1, +0.8] pts | -0.0 [-0.6, +0.5] | +0.03 [-0.04, +0.09] | negligible |
| power-up | skill | 1 | no | +0.2 [-0.9, +1.3] pts | +0.0 [-0.5, +0.6] | -0.58 [-0.65, -0.50] | negligible |
| tag-a-payoff | attack | 1 | no | -0.6 [-1.6, +0.5] pts | +0.1 [-0.5, +0.6] | +0.10 [+0.03, +0.17] | negligible |
| exhaust-payoff | attack | 1 | no | -0.7 [-1.9, +0.4] pts | +0.1 [-0.4, +0.6] | +0.12 [+0.05, +0.19] | negligible |
| cull | skill | 0 | no | -0.9 [-2.2, +0.4] pts | +0.2 [-0.3, +0.7] | +0.26 [+0.18, +0.35] | negligible |
| fortify | power | 2 | yes | +0.9 [+0.1, +1.7] pts | +0.4 [-0.3, +1.0] | +0.41 [+0.34, +0.48] | negligible |
| tag-a-echo | power | 1 | no | +0.4 [-0.5, +1.3] pts | +0.4 [-0.2, +0.9] | +0.21 [+0.15, +0.28] | negligible |
| opening-spark | power | 1 | no | +0.7 [-0.1, +1.6] pts | +0.4 [-0.1, +0.9] | -0.30 [-0.36, -0.24] | negligible |
| exhaust-engine | power | 1 | no | +0.4 [-0.5, +1.3] pts | +0.4 [-0.2, +0.9] | +0.21 [+0.15, +0.28] | negligible |
| quick-draw | skill | 1 | yes | +0.2 [-0.9, +1.3] pts | +0.4 [-0.1, +1.0] | +0.15 [+0.08, +0.22] | negligible |
| block-spark | power | 1 | no | +0.4 [-0.7, +1.4] pts | +0.5 [+0.1, +1.0] | -0.19 [-0.25, -0.13] | worse |
| strike | attack | 1 | no | -0.6 [-1.6, +0.5] pts | +0.6 [+0.1, +1.1] | -0.13 [-0.20, -0.07] | worse |
| double-strength | skill | 1 | no | -0.4 [-1.4, +0.7] pts | +0.9 [+0.3, +1.5] | +0.29 [+0.22, +0.36] | worse |
| kill-reward | power | 1 | no | +0.4 [-0.5, +1.3] pts | +0.9 [+0.4, +1.4] | +0.18 [+0.11, +0.25] | worse |
| focus | power | 1 | no | +0.7 [-0.1, +1.6] pts | +1.3 [+0.8, +1.9] | +0.09 [+0.03, +0.16] | worse |
| pain-engine | power | 1 | no | +0.2 [-0.9, +1.3] pts | +2.0 [+1.5, +2.5] | -0.58 [-0.66, -0.49] | worse |
| sunder | attack | 2 | yes | +0.6 [-0.4, +1.5] pts | +2.1 [+1.6, +2.6] | -1.10 [-1.20, -1.00] | worse |
| expose | skill | 1 | yes | +0.4 [-0.7, +1.4] pts | +2.3 [+1.8, +2.8] | -0.93 [-1.03, -0.83] | worse |
| bolt | attack | 2 | yes | -2.2 [-3.8, -0.7] pts | +2.6 [+2.1, +3.1] | -0.44 [-0.51, -0.38] | worse |
| strengthen | power | 1 | yes | +0.9 [+0.1, +1.7] pts | +2.7 [+2.2, +3.2] | -1.03 [-1.12, -0.94] | worse |
| blood-strike | attack | 1 | no | -0.2 [-1.4, +1.0] pts | +4.1 [+3.6, +4.7] | -1.17 [-1.25, -1.09] | worse |

### smart bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| end-guard | power | 1 | no | +0.9 [+0.1, +1.7] pts | -5.8 [-6.4, -5.2] | +0.44 [+0.38, +0.50] | better |
| big-block | skill | 2 | yes | +0.7 [-0.1, +1.6] pts | -4.8 [-5.4, -4.2] | +0.98 [+0.89, +1.08] | better |
| guarded-strike | attack | 1 | yes | +0.9 [+0.1, +1.7] pts | -4.8 [-5.2, -4.3] | -0.11 [-0.15, -0.06] | better |
| attack-echo | power | 1 | no | +0.9 [+0.1, +1.7] pts | -4.3 [-4.8, -3.8] | +0.39 [+0.33, +0.45] | better |
| block-slam | attack | 1 | no | +0.9 [+0.1, +1.7] pts | -3.5 [-3.9, -3.0] | +0.35 [+0.28, +0.42] | better |
| prime-a | skill | 0 | no | +0.4 [-0.7, +1.4] pts | -3.1 [-3.6, -2.6] | +0.51 [+0.44, +0.58] | better |
| jab | attack | 0 | yes | +0.6 [-0.3, +1.4] pts | -2.1 [-2.5, -1.6] | -0.10 [-0.15, -0.04] | better |
| hand-strike | attack | 1 | no | +0.7 [+0.0, +1.5] pts | -1.5 [-1.9, -1.1] | -0.81 [-0.88, -0.74] | better |
| single-use-strike | attack | 1 | no | +0.2 [-0.9, +1.3] pts | -1.3 [-1.7, -0.9] | -0.27 [-0.33, -0.22] | better |
| combo-strike | attack | 1 | no | +0.9 [+0.1, +1.7] pts | -1.3 [-1.7, -0.9] | -0.81 [-0.88, -0.74] | better |
| heavy-hit | attack | 3 | yes | +0.9 [+0.1, +1.7] pts | -1.0 [-1.5, -0.6] | -1.21 [-1.29, -1.13] | better |
| cull | skill | 0 | no | -1.9 [-3.4, -0.3] pts | -0.6 [-1.1, -0.2] | +0.55 [+0.46, +0.64] | better |
| power-up | skill | 1 | no | +0.6 [-0.3, +1.4] pts | -0.6 [-1.0, -0.2] | -0.58 [-0.64, -0.51] | better |
| opportunist | attack | 1 | no | +0.7 [+0.0, +1.5] pts | -0.6 [-0.9, -0.3] | +0.22 [+0.17, +0.26] | better |
| opening-spark | power | 1 | no | +0.6 [-0.4, +1.5] pts | -0.5 [-0.9, -0.1] | -0.19 [-0.24, -0.14] | better |
| quick-draw | skill | 1 | yes | +0.4 [-0.7, +1.4] pts | -0.5 [-0.9, +0.0] | +0.43 [+0.36, +0.49] | negligible |
| tag-a-payoff | attack | 1 | no | +0.2 [-0.8, +1.1] pts | -0.4 [-0.8, -0.1] | +0.33 [+0.28, +0.39] | better |
| block-spark | power | 1 | no | +0.4 [-0.7, +1.4] pts | -0.4 [-0.8, +0.0] | -0.10 [-0.15, -0.04] | negligible |
| fortify | power | 2 | yes | +0.9 [+0.1, +1.7] pts | -0.4 [-1.0, +0.2] | +0.56 [+0.50, +0.63] | negligible |
| weaken | skill | 1 | yes | +0.7 [-0.1, +1.6] pts | -0.3 [-0.7, +0.2] | +1.04 [+0.96, +1.13] | negligible |
| exhaust-payoff | attack | 1 | no | -0.4 [-1.4, +0.7] pts | -0.3 [-0.7, +0.1] | +0.39 [+0.33, +0.44] | negligible |
| tag-a-echo | power | 1 | no | +0.0 [-1.0, +1.0] pts | -0.1 [-0.6, +0.3] | +0.45 [+0.39, +0.51] | negligible |
| exhaust-engine | power | 1 | no | +0.0 [-1.0, +1.0] pts | -0.1 [-0.6, +0.3] | +0.45 [+0.39, +0.51] | negligible |
| defend | skill | 1 | no | -0.9 [-2.0, +0.2] pts | -0.1 [-0.6, +0.4] | +0.72 [+0.65, +0.80] | negligible |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| kill-reward | power | 1 | no | +0.0 [-1.0, +1.0] pts | +0.4 [-0.0, +0.8] | +0.40 [+0.34, +0.46] | negligible |
| double-strength | skill | 1 | no | -1.3 [-2.5, -0.1] pts | +0.4 [-0.0, +0.9] | +0.55 [+0.49, +0.62] | negligible |
| focus | power | 1 | no | +0.9 [+0.1, +1.7] pts | +0.6 [+0.1, +1.1] | +0.15 [+0.09, +0.21] | worse |
| pain-engine | power | 1 | no | +0.7 [-0.1, +1.6] pts | +1.6 [+1.2, +2.1] | -0.50 [-0.58, -0.42] | worse |
| sunder | attack | 2 | yes | +0.2 [-0.8, +1.1] pts | +1.7 [+1.2, +2.2] | -1.16 [-1.25, -1.06] | worse |
| expose | skill | 1 | yes | +0.6 [-0.3, +1.4] pts | +2.1 [+1.7, +2.5] | -0.87 [-0.96, -0.78] | worse |
| bolt | attack | 2 | yes | -1.3 [-2.6, +0.0] pts | +2.3 [+1.9, +2.7] | -0.39 [-0.44, -0.33] | worse |
| strengthen | power | 1 | yes | +0.9 [+0.1, +1.7] pts | +2.3 [+1.9, +2.7] | -0.92 [-1.01, -0.83] | worse |
| blood-strike | attack | 1 | no | -0.2 [-1.1, +0.8] pts | +4.3 [+3.8, +4.7] | -1.16 [-1.24, -1.08] | worse |


## Pair synergy

Synergy score = (benefit of A and B together) minus (benefit of A alone + benefit of B alone), all measured against the starter deck on identical seeds, in HP lost (benefit = HP/turns saved, so positive is good). Positive means the cards help each other more than the sum of their parts; negative means they overlap or fight for the same energy and draws. Brackets are 95% CIs. Skill: smart. 9 fights x 40 seeds = 360 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, elite-a, elite-b, boss-a.
120 of 435 possible pairs evaluated (a deterministic random sample, --max-pairs 120); a strong pair outside the sample is not seen. Candidate cards: jab, guarded-strike, heavy-hit, big-block, quick-draw, fortify, weaken, expose, sunder, strengthen, combo-strike, block-slam, opportunist, hand-strike, prime-a, tag-a-payoff, tag-a-echo, power-up, double-strength, attack-echo, block-spark, kill-reward, pain-engine, end-guard, opening-spark, exhaust-engine, cull, single-use-strike, exhaust-payoff, blood-strike.
Of 120 pairs: 24 clearly synergistic, 6 clearly anti-synergistic, 6 negligible, 84 inconclusive. Each pair is a 4-way difference, so its interval is wide: with 100+ pairs tested, expect about 5% to look significant by chance. Verdicts compare each pair with the TYPICAL pair (the median score, -0.02 HP lost): cards that do not interact still score off zero because benefits are not additive, so zero is not the right reference when many pairs are tested (with fewer than 20 pairs the reference is zero). Treat single hits as leads and confirm a lead by re-running just that pair with more seeds (--pairs a+b --seeds 200).

### Strongest synergies
| pair | synergy score | vs typical pair |
| --- | --- | --- |
| sunder + blood-strike | +4.69 [+3.66, +5.73] | better |
| expose + opportunist | +3.47 [+2.42, +4.52] | better |
| strengthen + double-strength | +2.90 [+1.89, +3.91] | better |
| sunder + hand-strike | +2.13 [+1.13, +3.13] | better |
| fortify + weaken | +2.11 [+1.13, +3.09] | better |
| heavy-hit + blood-strike | +1.91 [+0.91, +2.91] | better |
| sunder + pain-engine | +1.74 [+0.79, +2.70] | better |
| expose + cull | +1.69 [+0.80, +2.58] | better |
| expose + pain-engine | +1.58 [+0.71, +2.45] | better |
| weaken + end-guard | +1.46 [+0.42, +2.49] | better |

### Negative (anti-synergistic) pairs
| pair | synergy score | vs typical pair |
| --- | --- | --- |
| prime-a + tag-a-echo | -1.45 [-2.52, -0.38] | worse |
| exhaust-engine + single-use-strike | -1.42 [-2.36, -0.48] | worse |
| end-guard + blood-strike | -1.33 [-2.26, -0.40] | worse |
| tag-a-echo + exhaust-payoff | -1.08 [-2.11, -0.06] | worse |
| exhaust-engine + exhaust-payoff | -1.08 [-2.11, -0.06] | worse |
| sunder + block-spark | -1.01 [-1.88, -0.14] | worse |


## Outlier report

Outlier method: within a cohort of 4 or more values, a value is flagged when its modified z-score (0.6745 * (x - median) / MAD, Iglewicz-Hoaglin) exceeds 3.5 in magnitude OR it lies outside the Tukey fences (Q1 - 1.5 IQR, Q3 + 1.5 IQR). Median/MAD/IQR are used because the cohort itself may contain the outlier. A flag means "look at this", not "this is wrong".

Cards: value = how much adding the card helps on HP lost (positive = helps), compared within all cards and within each energy-cost group. Enemies: fights are compared inside their tier (normal/elite/boss) on the mid deck set. Cohorts smaller than 4 are skipped, so small content lists produce no flags; the tier bands in the ladder report cover that case.

| kind | skill | cohort | id | metric | value | modified z | z | IQR rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| card | greedy | all cards | blood-strike | HP lost change when added | -6.06 | -2.68 | -2.69 | outside |
| card | greedy | cost 1 | blood-strike | HP lost change when added | -6.06 | -3.07 | -2.60 | outside |
| card | smart | all cards | guarded-strike | HP lost change when added | 3.89 | 3.54 | 1.88 | outside |
| card | smart | all cards | big-block | HP lost change when added | 4.25 | 3.86 | 2.06 | outside |
| card | smart | all cards | attack-echo | HP lost change when added | 3.70 | 3.37 | 1.78 | outside |
| card | smart | all cards | end-guard | HP lost change when added | 4.67 | 4.23 | 2.27 | outside |
| card | smart | all cards | blood-strike | HP lost change when added | -4.15 | -3.52 | -2.11 | outside |
| card | smart | cost 1 | guarded-strike | HP lost change when added | 3.89 | 4.05 | 1.97 | outside |
| card | smart | cost 1 | attack-echo | HP lost change when added | 3.70 | 3.86 | 1.87 | outside |
| card | smart | cost 1 | end-guard | HP lost change when added | 4.67 | 4.82 | 2.37 | outside |
| card | smart | cost 1 | blood-strike | HP lost change when added | -4.15 | -3.86 | -2.11 | outside |

### Cards worse than adding nothing
Adding the card to the deck measurably HURTS the headline metric (paired 95% CI excludes zero). Possible dead picks, or cards that need a partner; check the pair report before judging.

| skill | card | cost | change [95% CI] |
| --- | --- | --- | --- |
| random | bolt | 2 | +1.0 [+0.3, +1.6] |
| random | focus | 1 | +1.8 [+1.2, +2.4] |
| random | quick-draw | 1 | +4.1 [+3.4, +4.9] |
| random | block-slam | 1 | +1.8 [+1.1, +2.4] |
| random | opportunist | 1 | +0.9 [+0.3, +1.5] |
| random | tag-a-payoff | 1 | +1.5 [+0.8, +2.1] |
| random | tag-a-echo | 1 | +1.8 [+1.1, +2.4] |
| random | double-strength | 1 | +1.8 [+1.1, +2.4] |
| random | kill-reward | 1 | +1.4 [+0.8, +2.0] |
| random | exhaust-engine | 1 | +1.8 [+1.1, +2.4] |
| random | cull | 0 | +0.9 [+0.3, +1.5] |
| random | exhaust-payoff | 1 | +2.0 [+1.4, +2.6] |
| greedy | strike | 1 | +1.6 [+1.1, +2.0] |
| greedy | bolt | 2 | +1.2 [+0.7, +1.7] |
| greedy | quick-draw | 1 | +2.7 [+2.1, +3.2] |
| greedy | expose | 1 | +0.8 [+0.3, +1.3] |
| greedy | sunder | 2 | +0.6 [+0.1, +1.1] |
| greedy | combo-strike | 1 | +1.0 [+0.5, +1.5] |
| greedy | block-slam | 1 | +2.5 [+2.0, +3.0] |
| greedy | opportunist | 1 | +1.7 [+1.2, +2.2] |
| greedy | hand-strike | 1 | +1.2 [+0.8, +1.7] |
| greedy | tag-a-payoff | 1 | +1.9 [+1.4, +2.4] |
| greedy | tag-a-echo | 1 | +2.0 [+1.5, +2.5] |
| greedy | power-up | 1 | +0.7 [+0.2, +1.2] |
| greedy | double-strength | 1 | +2.5 [+2.0, +3.0] |
| greedy | kill-reward | 1 | +2.0 [+1.5, +2.5] |
| greedy | exhaust-engine | 1 | +2.0 [+1.5, +2.5] |
| greedy | cull | 0 | +2.5 [+2.0, +3.0] |
| greedy | exhaust-payoff | 1 | +2.1 [+1.6, +2.6] |
| greedy | blood-strike | 1 | +6.1 [+5.5, +6.6] |
| smart | strike | 1 | +0.6 [+0.1, +1.1] |
| smart | bolt | 2 | +2.6 [+2.1, +3.1] |
| smart | focus | 1 | +1.3 [+0.8, +1.9] |
| smart | expose | 1 | +2.3 [+1.8, +2.8] |
| smart | sunder | 2 | +2.1 [+1.6, +2.6] |
| smart | strengthen | 1 | +2.7 [+2.2, +3.2] |
| smart | double-strength | 1 | +0.9 [+0.3, +1.5] |
| smart | block-spark | 1 | +0.5 [+0.1, +1.0] |
| smart | kill-reward | 1 | +0.9 [+0.4, +1.4] |
| smart | pain-engine | 1 | +2.0 [+1.5, +2.5] |
| smart | blood-strike | 1 | +4.1 [+3.6, +4.7] |


## Draft policy comparison (whole runs)

100 runs per policy on seeds 1..100, fights played by the greedy bot. All policies share seeds; differences are against the first policy, run by run (paired). Win rate has a Wilson 95% interval; differences have paired 95% CIs. Verdict margin: +-5 points.
Run-level results are noisy (a run is ~12 fights; one bad fight ends it). Resolving a 5-point win-rate difference takes several hundred runs per policy. For judging individual cards or fights, prefer the fight-level experiments.

| policy | run win rate [95% CI] | avg floor [95% CI] | win change vs first | floor change vs first | verdict |
| --- | --- | --- | --- | --- | --- |
| reward=card (random pick) | 61.0% [51.2%, 70.0%] | 11.8 [11.4, 12.2] | - | - | baseline |
| reward=gold (always gold) | 72.0% [62.5%, 79.9%] | 12.8 [12.6, 12.9] | +11.0 [-0.9, +22.9] pts | +1.0 [+0.6, +1.4] | INCONCLUSIVE |
| reward=best (trial-fight pick) | 87.0% [79.0%, 92.2%] | 12.6 [12.3, 12.8] | +26.0 [+15.6, +36.4] pts | +0.8 [+0.4, +1.1] | better |
| rest=heal (never upgrade) | 62.0% [52.2%, 70.9%] | 11.8 [11.4, 12.2] | +1.0 [-2.4, +4.4] pts | +0.0 [-0.0, +0.1] | negligible |
| path=random | 57.0% [47.2%, 66.3%] | 11.8 [11.4, 12.2] | -4.0 [-17.2, +9.2] pts | +0.0 [-0.5, +0.5] | INCONCLUSIVE |

### Pick rates under reward=card (random pick)
Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.

| card | offered | picked | pick rate [95% CI] |
| --- | --- | --- | --- |
| jab | 205 | 82 | 40.0% [33.5%, 46.8%] |
| big-block | 205 | 73 | 35.6% [29.4%, 42.4%] |
| bolt | 223 | 77 | 34.5% [28.6%, 41.0%] |
| sunder | 175 | 60 | 34.3% [27.7%, 41.6%] |
| weaken | 190 | 65 | 34.2% [27.8%, 41.2%] |
| strengthen | 188 | 61 | 32.4% [26.2%, 39.4%] |
| fortify | 211 | 68 | 32.2% [26.3%, 38.8%] |
| expose | 201 | 64 | 31.8% [25.8%, 38.6%] |
| heavy-hit | 223 | 70 | 31.4% [25.7%, 37.8%] |
| quick-draw | 210 | 64 | 30.5% [24.6%, 37.0%] |
| guarded-strike | 234 | 71 | 30.3% [24.8%, 36.5%] |

### Pick rates under reward=best (trial-fight pick)
Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.

| card | offered | picked | pick rate [95% CI] |
| --- | --- | --- | --- |
| guarded-strike | 234 | 157 | 67.1% [60.8%, 72.8%] |
| big-block | 219 | 135 | 61.6% [55.1%, 67.8%] |
| jab | 223 | 87 | 39.0% [32.8%, 45.5%] |
| heavy-hit | 235 | 81 | 34.5% [28.7%, 40.8%] |
| weaken | 210 | 62 | 29.5% [23.8%, 36.0%] |
| strengthen | 202 | 56 | 27.7% [22.0%, 34.3%] |
| bolt | 242 | 65 | 26.9% [21.7%, 32.8%] |
| fortify | 238 | 53 | 22.3% [17.4%, 28.0%] |
| expose | 202 | 42 | 20.8% [15.8%, 26.9%] |
| quick-draw | 215 | 41 | 19.1% [14.4%, 24.8%] |
| sunder | 174 | 19 | 10.9% [7.1%, 16.4%] |

