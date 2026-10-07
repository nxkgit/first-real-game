# Balance report

Generated 2026-10-07 by `npm run balance -- report` from the current registries. **The content measured here is all placeholder** (see implementationplan.md): treat the numbers as an example of the process, not as findings about the real game. Bot skills: random, greedy, smart. Target bands are provisional placeholders (src/sim/targets.ts). How to read this: docs/BALANCE.md.


## Fight difficulty ladder

Win rate (Wilson 95% interval), HP lost in fights that were won (mean with 95% CI) and turns (mean with 95% CI), at full starting HP, for each reference deck set: starter (the starter deck, 1 deck); mid (starter + 5 sampled cards, 3 decks); late (starter + 10 sampled cards, 3 upgraded, 3 decks). 9 fights x 100 seeds = 900 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, elite-a, elite-b, boss-a.
Flags compare the mid deck set to the PROVISIONAL target bands in src/sim/targets.ts (LOW / HIGH = outside the band; "ok" = inside). Per-fight numbers vary in how hard the individual fight is; the tier rollup is the better first read.

### random bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 6 | 100.0% | 14.9 | 6.2 |
| starter | elite | 2 | 99.5% | 32.0 | 8.2 |
| starter | boss | 1 | 0.0% | n/a | 11.6 |
| mid | normal | 6 | 100.0% | 13.4 | 6.1 |
| mid | elite | 2 | 99.8% | 24.9 | 7.8 |
| mid | boss | 1 | 65.3% | 44.4 | 13.0 |
| late | normal | 6 | 100.0% | 11.8 | 5.0 |
| late | elite | 2 | 100.0% | 19.2 | 6.0 |
| late | boss | 1 | 88.3% | 40.8 | 10.5 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 6.1 [5.4, 6.8] | 3.9 [3.8, 4.1] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 6.1 [5.4, 6.8] | 4.7 [4.5, 4.9] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 16.9 [15.7, 18.1] | 7.9 [7.7, 8.2] |  |
| enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 16.7 [15.3, 18.2] | 6.8 [6.6, 7.0] |  |
| enemy-a+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 22.4 [21.1, 23.7] | 6.4 [6.2, 6.7] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 21.1 [19.9, 22.4] | 7.1 [6.8, 7.3] |  |
| elite-a | elite | starter | 100 | 99.0% [94.6%, 99.8%] | 33.8 [32.1, 35.5] | 7.5 [7.3, 7.7] |  |
| elite-b | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 30.3 [28.8, 31.8] | 8.9 [8.6, 9.1] |  |
| boss-a | boss | starter | 100 | 0.0% [0.0%, 3.7%] | n/a | 11.6 [11.2, 11.9] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 6.7 [6.2, 7.1] | 4.1 [3.9, 4.3] | win HIGH, HP ok, turns ok |
| enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 6.5 [6.0, 6.9] | 4.6 [4.4, 4.8] | win HIGH, HP ok, turns ok |
| enemy-b+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 14.0 [13.2, 14.8] | 7.9 [7.5, 8.3] | win HIGH, HP ok, turns HIGH |
| enemy-c | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 14.1 [13.3, 14.9] | 6.6 [6.3, 6.8] | win HIGH, HP ok, turns HIGH |
| enemy-a+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 20.0 [19.0, 20.9] | 6.5 [6.2, 6.8] | win HIGH, HP HIGH, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 19.3 [18.5, 20.2] | 7.2 [6.9, 7.5] | win HIGH, HP HIGH, turns HIGH |
| elite-a | elite | mid | 300 | 99.7% [98.1%, 99.9%] | 27.7 [26.5, 28.8] | 7.3 [7.0, 7.6] | win HIGH, HP HIGH, turns ok |
| elite-b | elite | mid | 300 | 100.0% [98.7%, 100.0%] | 22.1 [21.0, 23.1] | 8.3 [7.9, 8.7] | win HIGH, HP ok, turns ok |
| boss-a | boss | mid | 300 | 65.3% [59.8%, 70.5%] | 44.4 [43.1, 45.6] | 13.0 [12.3, 13.6] | win HIGH, HP HIGH, turns ok |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 5.2 [4.7, 5.6] | 3.4 [3.2, 3.5] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 6.2 [5.7, 6.6] | 3.9 [3.7, 4.0] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 12.6 [11.9, 13.4] | 6.4 [6.2, 6.6] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 11.3 [10.6, 12.0] | 5.2 [5.0, 5.4] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 17.1 [16.3, 17.8] | 5.4 [5.3, 5.5] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 18.6 [17.8, 19.3] | 6.0 [5.8, 6.1] |  |
| elite-a | elite | late | 300 | 100.0% [98.7%, 100.0%] | 20.6 [19.6, 21.7] | 5.6 [5.4, 5.7] |  |
| elite-b | elite | late | 300 | 100.0% [98.7%, 100.0%] | 17.8 [16.9, 18.7] | 6.4 [6.2, 6.5] |  |
| boss-a | boss | late | 300 | 88.3% [84.2%, 91.5%] | 40.8 [39.5, 42.1] | 10.5 [10.2, 10.7] |  |

### greedy bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 6 | 100.0% | 5.2 | 6.5 |
| starter | elite | 2 | 100.0% | 18.8 | 9.4 |
| starter | boss | 1 | 90.0% | 49.2 | 16.6 |
| mid | normal | 6 | 79.4% | 7.6 | 17.1 |
| mid | elite | 2 | 70.2% | 16.5 | 23.0 |
| mid | boss | 1 | 63.0% | 34.5 | 27.3 |
| late | normal | 6 | 100.0% | 9.3 | 5.2 |
| late | elite | 2 | 100.0% | 14.7 | 6.3 |
| late | boss | 1 | 100.0% | 29.7 | 11.0 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 2.6 [2.1, 3.1] | 4.1 [3.9, 4.3] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 1.6 [1.1, 2.1] | 4.6 [4.4, 4.7] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 4.2 [3.6, 4.7] | 7.0 [6.9, 7.2] |  |
| enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 4.7 [3.9, 5.4] | 7.7 [7.5, 7.8] |  |
| enemy-a+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 8.4 [7.9, 9.0] | 7.8 [7.6, 8.0] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 9.8 [9.4, 10.2] | 7.5 [7.4, 7.7] |  |
| elite-a | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 23.8 [22.7, 24.8] | 8.6 [8.4, 8.8] |  |
| elite-b | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 13.8 [12.9, 14.7] | 10.2 [10.0, 10.4] |  |
| boss-a | boss | starter | 100 | 90.0% [82.6%, 94.5%] | 49.2 [48.2, 50.2] | 16.6 [16.5, 16.8] |  |
| enemy-a | normal | mid | 300 | 93.7% [90.3%, 95.9%] | 4.6 [4.2, 5.1] | 8.2 [6.6, 9.8] | win ok, HP LOW, turns HIGH |
| enemy-d+enemy-d | normal | mid | 300 | 89.0% [85.0%, 92.1%] | 3.6 [3.2, 4.1] | 11.1 [9.1, 13.1] | win LOW, HP LOW, turns HIGH |
| enemy-b+enemy-d | normal | mid | 300 | 71.0% [65.6%, 75.8%] | 6.0 [5.4, 6.6] | 22.0 [19.2, 24.8] | win LOW, HP ok, turns HIGH |
| enemy-c | normal | mid | 300 | 77.7% [72.6%, 82.0%] | 8.8 [8.1, 9.5] | 18.3 [15.7, 20.9] | win LOW, HP ok, turns HIGH |
| enemy-a+enemy-d | normal | mid | 300 | 74.7% [69.5%, 79.3%] | 12.1 [11.3, 12.9] | 20.5 [17.8, 23.1] | win LOW, HP ok, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 70.3% [64.9%, 75.2%] | 10.2 [9.5, 10.8] | 22.4 [19.5, 25.2] | win LOW, HP ok, turns HIGH |
| elite-a | elite | mid | 300 | 71.0% [65.6%, 75.8%] | 18.0 [16.8, 19.2] | 22.2 [19.4, 25.0] | win ok, HP ok, turns HIGH |
| elite-b | elite | mid | 300 | 69.3% [63.9%, 74.3%] | 15.0 [13.7, 16.2] | 23.8 [21.0, 26.6] | win ok, HP ok, turns HIGH |
| boss-a | boss | mid | 300 | 63.0% [57.4%, 68.3%] | 34.5 [32.4, 36.6] | 27.3 [24.6, 30.0] | win ok, HP ok, turns HIGH |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 5.2 [4.7, 5.6] | 3.5 [3.4, 3.6] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 5.2 [4.8, 5.6] | 4.2 [4.0, 4.3] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 8.0 [7.4, 8.5] | 6.1 [6.0, 6.3] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 9.2 [8.6, 9.7] | 5.1 [4.9, 5.3] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 13.4 [12.7, 14.0] | 5.9 [5.7, 6.0] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 14.6 [14.0, 15.2] | 6.5 [6.3, 6.6] |  |
| elite-a | elite | late | 300 | 100.0% [98.7%, 100.0%] | 16.5 [15.7, 17.4] | 5.9 [5.7, 6.1] |  |
| elite-b | elite | late | 300 | 100.0% [98.7%, 100.0%] | 12.9 [12.1, 13.6] | 6.6 [6.4, 6.8] |  |
| boss-a | boss | late | 300 | 100.0% [98.7%, 100.0%] | 29.7 [28.6, 30.8] | 11.0 [10.6, 11.4] |  |

### smart bot
Tier rollup (unweighted mean of the fights in the tier)

| deck set | tier | fights | win rate | HP lost (won) | turns |
| --- | --- | --- | --- | --- | --- |
| starter | normal | 6 | 100.0% | 11.4 | 4.5 |
| starter | elite | 2 | 100.0% | 30.8 | 6.3 |
| starter | boss | 1 | 30.0% | 55.9 | 12.3 |
| mid | normal | 6 | 91.4% | 12.1 | 9.3 |
| mid | elite | 2 | 80.7% | 22.9 | 16.1 |
| mid | boss | 1 | 56.3% | 44.8 | 25.6 |
| late | normal | 6 | 100.0% | 10.0 | 3.7 |
| late | elite | 2 | 100.0% | 17.2 | 4.7 |
| late | boss | 1 | 99.3% | 34.4 | 9.6 |

| fight | tier | deck set | n | win rate [95% CI] | HP lost when won [95% CI] | turns [95% CI] | vs bands (mid) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 7.1 [6.6, 7.6] | 3.0 [3.0, 3.1] |  |
| enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 5.6 [4.9, 6.3] | 3.3 [3.2, 3.4] |  |
| enemy-b+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 9.7 [8.9, 10.5] | 5.4 [5.3, 5.5] |  |
| enemy-c | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 14.8 [13.8, 15.7] | 5.2 [5.1, 5.4] |  |
| enemy-a+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 15.3 [14.6, 16.0] | 5.0 [4.9, 5.1] |  |
| enemy-d+enemy-d+enemy-d | normal | starter | 100 | 100.0% [96.3%, 100.0%] | 16.0 [15.1, 16.9] | 5.3 [5.2, 5.4] |  |
| elite-a | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 31.7 [30.2, 33.2] | 5.9 [5.8, 6.0] |  |
| elite-b | elite | starter | 100 | 100.0% [96.3%, 100.0%] | 30.0 [28.7, 31.2] | 6.8 [6.6, 6.9] |  |
| boss-a | boss | starter | 100 | 30.0% [21.9%, 39.6%] | 55.9 [55.0, 56.9] | 12.3 [11.9, 12.6] |  |
| enemy-a | normal | mid | 300 | 100.0% [98.7%, 100.0%] | 8.1 [7.8, 8.5] | 3.1 [3.0, 3.3] | win ok, HP ok, turns ok |
| enemy-d+enemy-d | normal | mid | 300 | 99.7% [98.1%, 99.9%] | 7.0 [6.6, 7.5] | 3.8 [3.4, 4.2] | win ok, HP ok, turns ok |
| enemy-b+enemy-d | normal | mid | 300 | 79.7% [74.8%, 83.8%] | 10.8 [10.1, 11.4] | 16.7 [14.1, 19.2] | win LOW, HP ok, turns HIGH |
| enemy-c | normal | mid | 300 | 88.3% [84.2%, 91.5%] | 15.1 [14.4, 15.8] | 11.5 [9.4, 13.5] | win LOW, HP HIGH, turns HIGH |
| enemy-a+enemy-d | normal | mid | 300 | 90.0% [86.1%, 92.9%] | 15.7 [15.0, 16.4] | 10.4 [8.4, 12.3] | win LOW, HP HIGH, turns HIGH |
| enemy-d+enemy-d+enemy-d | normal | mid | 300 | 91.0% [87.2%, 93.7%] | 15.8 [15.0, 16.5] | 10.3 [8.5, 12.1] | win LOW, HP HIGH, turns HIGH |
| elite-a | elite | mid | 300 | 81.0% [76.2%, 85.0%] | 24.2 [23.2, 25.2] | 15.9 [13.4, 18.4] | win ok, HP ok, turns HIGH |
| elite-b | elite | mid | 300 | 80.3% [75.5%, 84.4%] | 21.7 [20.9, 22.5] | 16.3 [13.8, 18.8] | win ok, HP ok, turns HIGH |
| boss-a | boss | mid | 300 | 56.3% [50.7%, 61.8%] | 44.8 [43.4, 46.2] | 25.6 [22.8, 28.5] | win ok, HP HIGH, turns HIGH |
| enemy-a | normal | late | 300 | 100.0% [98.7%, 100.0%] | 6.1 [5.7, 6.5] | 2.5 [2.5, 2.6] |  |
| enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 6.0 [5.6, 6.4] | 2.8 [2.7, 2.8] |  |
| enemy-b+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 9.3 [8.8, 9.8] | 4.6 [4.5, 4.7] |  |
| enemy-c | normal | late | 300 | 100.0% [98.7%, 100.0%] | 11.3 [10.7, 11.8] | 3.9 [3.8, 4.0] |  |
| enemy-a+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 13.1 [12.5, 13.6] | 3.8 [3.7, 3.9] |  |
| enemy-d+enemy-d+enemy-d | normal | late | 300 | 100.0% [98.7%, 100.0%] | 14.3 [13.8, 14.9] | 4.2 [4.1, 4.3] |  |
| elite-a | elite | late | 300 | 100.0% [98.7%, 100.0%] | 18.5 [17.8, 19.3] | 4.6 [4.5, 4.8] |  |
| elite-b | elite | late | 300 | 100.0% [98.7%, 100.0%] | 15.9 [15.2, 16.6] | 4.7 [4.6, 4.9] |  |
| boss-a | boss | late | 300 | 99.3% [97.6%, 99.8%] | 34.4 [33.4, 35.5] | 9.6 [9.2, 9.9] |  |


## Fight length distribution

Turns per fight with the mid deck set (starter + 5 sampled cards). Mean has a 95% CI; p10/median/p90 show spread (a fight that is usually 4 turns but sometimes 12 is a pacing problem the mean hides). Histogram buckets are turn counts (last bucket = 15+). 9 fights x 100 seeds = 900 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, elite-a, elite-b, boss-a.

### random bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 4.08 [3.89, 4.27] | 2 | 4 | 6 | 3-6 | ok |
| enemy-d+enemy-d | normal | 4.60 [4.40, 4.80] | 3 | 4 | 7 | 3-6 | ok |
| enemy-b+enemy-d | normal | 7.92 [7.55, 8.29] | 5 | 7 | 13 | 3-6 | HIGH |
| enemy-c | normal | 6.58 [6.31, 6.84] | 4 | 6 | 9 | 3-6 | HIGH |
| enemy-a+enemy-d | normal | 6.51 [6.23, 6.78] | 4 | 6 | 10 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 7.16 [6.85, 7.47] | 5 | 6 | 12 | 3-6 | HIGH |
| elite-a | elite | 7.32 [7.04, 7.60] | 5 | 6 | 11 | 5-9 | ok |
| elite-b | elite | 8.30 [7.90, 8.69] | 5 | 7 | 13 | 5-9 | ok |
| boss-a | boss | 12.98 [12.35, 13.62] | 8 | 11 | 21 | 8-14 | ok |

```
enemy-a (normal)
 2    31 #######
 3   113 ########################
 4    55 ############
 5    48 ##########
 6    33 #######
 7    10 ##
 8     2 
 9     4 #
10     2 
11     1 
12     1 
```

```
enemy-d+enemy-d (normal)
 2    17 #####
 3    87 ########################
 4    55 ###############
 5    59 ################
 6    42 ############
 7    14 ####
 8    18 #####
 9     5 #
10     3 #
```

```
enemy-b+enemy-d (normal)
 4    10 ###
 5    78 ########################
 6    45 ##############
 7    54 #################
 8    16 #####
 9    17 #####
10     5 ##
11    25 ########
12    14 ####
13    14 ####
14     7 ##
15+   15 #####
```

```
enemy-c (normal)
 3     3 #
 4    55 #################
 5    47 ###############
 6    76 ########################
 7    37 ############
 8    31 ##########
 9    22 #######
10     3 #
11     9 ###
12     9 ###
13     4 #
14     3 #
15+    1 
```

```
enemy-a+enemy-d (normal)
 3     9 ##
 4    36 ##########
 5    89 ########################
 6    66 ##################
 7    23 ######
 8    12 ###
 9    20 #####
10    19 #####
11    13 ####
12     5 #
13     2 #
14     6 ##
```

```
enemy-d+enemy-d+enemy-d (normal)
 3     2 #
 4    27 #########
 5    71 ########################
 6    71 ########################
 7    23 ########
 8    28 #########
 9    19 ######
10    13 ####
11    15 #####
12    16 #####
13     3 #
14    10 ###
15+    2 #
```

```
elite-a (elite)
 4    14 ####
 5    54 ###############
 6    84 ########################
 7    43 ############
 8    24 #######
 9    26 #######
10    16 #####
11    15 ####
12    12 ###
13     8 ##
15+    4 #
```

```
elite-b (elite)
 4    13 #####
 5    42 ###############
 6    54 ###################
 7    67 ########################
 8    31 ###########
 9     3 #
10    20 #######
11    19 #######
12     3 #
13    19 #######
14     9 ###
15+   20 #######
```

```
boss-a (boss)
 7    19 ######
 8    15 ####
 9    80 ########################
10    25 #######
11    25 #######
12    19 ######
13    32 #########
14     4 #
15+   81 ########################
```

### greedy bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 8.18 [6.60, 9.75] | 3 | 4 | 10 | 3-6 | HIGH |
| enemy-d+enemy-d | normal | 11.07 [9.06, 13.07] | 3 | 5 | 61 | 3-6 | HIGH |
| enemy-b+enemy-d | normal | 21.99 [19.16, 24.82] | 5 | 7 | 61 | 3-6 | HIGH |
| enemy-c | normal | 18.30 [15.69, 20.90] | 4 | 6 | 61 | 3-6 | HIGH |
| enemy-a+enemy-d | normal | 20.45 [17.77, 23.14] | 5 | 7 | 61 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 22.39 [19.54, 25.23] | 5 | 6 | 61 | 3-6 | HIGH |
| elite-a | elite | 22.20 [19.38, 25.01] | 5 | 6 | 61 | 5-9 | HIGH |
| elite-b | elite | 23.81 [21.01, 26.62] | 5 | 8 | 61 | 5-9 | HIGH |
| boss-a | boss | 27.30 [24.60, 30.00] | 10 | 11 | 61 | 8-14 | HIGH |

```
enemy-a (normal)
 2     6 #
 3   126 ########################
 4    29 ######
 5    49 #########
 6    27 #####
 7    19 ####
 8     6 #
 9     7 #
10     4 #
11     4 #
12     2 
14     1 
15+   20 ####
```

```
enemy-d+enemy-d (normal)
 2     1 
 3    75 ########################
 4    66 #####################
 5    60 ###################
 6    19 ######
 7    11 ####
 8    16 #####
 9     7 ##
10     2 #
11     9 ###
15+   34 ###########
```

```
enemy-b+enemy-d (normal)
 4     4 #
 5   107 ########################
 6    25 ######
 7    59 #############
 8     7 ##
 9     3 #
10     1 
11     5 #
12     1 
15+   88 ####################
```

```
enemy-c (normal)
 4    66 #######################
 5    26 #########
 6    69 ########################
 7    43 ###############
 8     9 ###
 9     6 ##
10     1 
11     5 ##
12     4 #
13     2 #
14     2 #
15+   67 #######################
```

```
enemy-a+enemy-d (normal)
 4     9 ###
 5    40 ###########
 6    63 ##################
 7    85 ########################
 8     4 #
 9     3 #
10     8 ##
11     3 #
12     4 #
13     3 #
15+   78 ######################
```

```
enemy-d+enemy-d+enemy-d (normal)
 4    14 ####
 5    62 #################
 6    83 ######################
 7    32 #########
 8    10 ###
 9     2 #
10     1 
11     2 #
12     2 #
13     1 
14     1 
15+   90 ########################
```

```
elite-a (elite)
 4     9 ##
 5    31 ######
 6   127 ########################
 7    18 ###
 8    16 ###
 9     1 
10     1 
11     4 #
12     2 
14     3 #
15+   88 #################
```

```
elite-b (elite)
 4     5 #
 5    29 ########
 6     9 ##
 7    58 ###############
 8    90 #######################
 9     3 #
10     6 ##
11     2 #
12     1 
13     4 #
14     1 
15+   92 ########################
```

```
boss-a (boss)
 7     1 
 8     8 ##
 9    19 #####
10    69 #################
11    92 ######################
12     1 
13     6 #
14     4 #
15+  100 ########################
```

### smart bot
| fight | tier | mean [95% CI] | p10 | median | p90 | target band | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| enemy-a | normal | 3.11 [2.98, 3.25] | 2 | 3 | 5 | 3-6 | ok |
| enemy-d+enemy-d | normal | 3.80 [3.38, 4.22] | 2 | 3 | 6 | 3-6 | ok |
| enemy-b+enemy-d | normal | 16.67 [14.12, 19.21] | 4 | 5 | 61 | 3-6 | HIGH |
| enemy-c | normal | 11.46 [9.41, 13.51] | 3 | 4 | 61 | 3-6 | HIGH |
| enemy-a+enemy-d | normal | 10.35 [8.42, 12.28] | 3 | 4 | 18.70000000000107 | 3-6 | HIGH |
| enemy-d+enemy-d+enemy-d | normal | 10.28 [8.45, 12.11] | 3 | 4 | 12 | 3-6 | HIGH |
| elite-a | elite | 15.89 [13.41, 18.38] | 4 | 5 | 61 | 5-9 | HIGH |
| elite-b | elite | 16.33 [13.82, 18.85] | 4 | 5 | 61 | 5-9 | HIGH |
| boss-a | boss | 25.63 [22.80, 28.47] | 7 | 8 | 61 | 8-14 | HIGH |

```
enemy-a (normal)
 2   107 ######################
 3   115 ########################
 4    40 ########
 5    20 ####
 6    14 ###
 7     2 
 8     1 
 9     1 
```

```
enemy-d+enemy-d (normal)
 2    87 ####################
 3   105 ########################
 4    29 #######
 5    31 #######
 6    25 ######
 7    17 ####
 8     1 
 9     2 
12     2 
15+    1 
```

```
enemy-b+enemy-d (normal)
 3     7 ##
 4    86 ####################
 5   102 ########################
 6     5 #
 7     5 #
 8     8 ##
 9     9 ##
10     6 #
11     4 #
12     3 #
13     3 #
15+   62 ###############
```

```
enemy-c (normal)
 3    37 #######
 4   127 ########################
 5    40 ########
 6    13 ##
 7    21 ####
 8     8 ##
 9    10 ##
10     2 
11     3 #
12     3 #
15+   36 #######
```

```
enemy-a+enemy-d (normal)
 3    91 ########################
 4    89 #######################
 5    31 ########
 6    12 ###
 7    14 ####
 8     8 ##
 9    10 ###
10     8 ##
11     2 #
13     4 #
14     1 
15+   30 ########
```

```
enemy-d+enemy-d+enemy-d (normal)
 3    58 ##############
 4   103 ########################
 5    38 #########
 6     7 ##
 7    16 ####
 8     7 ##
 9    15 ###
10    16 ####
11     6 #
12     5 #
15+   29 #######
```

```
elite-a (elite)
 4   108 ########################
 5    83 ##################
 6    12 ###
 7     7 ##
 8     5 #
 9    11 ##
10     9 ##
11     5 #
13     3 #
15+   57 #############
```

```
elite-b (elite)
 4    96 ########################
 5    90 #######################
 6    13 ###
 7    12 ###
 8     5 #
 9     5 #
10     8 ##
11     6 ##
12     4 #
13     2 #
15+   59 ###############
```

```
boss-a (boss)
 6     1 
 7    51 ###########
 8   107 ########################
 9    39 #########
10     2 
15+  100 ######################
```


## Card effect: ablation and addition

Each row compares the starter deck WITH the card against the same deck WITHOUT it, on identical seeds (paired). Changes are "with minus without"; a negative HP-lost change is good for the player. Brackets are 95% confidence intervals. 9 fights x 60 seeds = 540 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, elite-a, elite-b, boss-a.
Verdict reads the headline metric (HP lost, negligible if within +-1): INCONCLUSIVE means the interval spans zero and is too wide to call the card negligible. Add seeds before concluding anything.
A card added to the starter deck shows its stand-alone value. Cards that need partners (synergy) will look weak here; see the pair experiment.

### random bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| guarded-strike | attack | 1 | yes | +0.9 [+0.1, +1.7] pts | -4.0 [-4.6, -3.3] | -0.31 [-0.45, -0.17] | better |
| jab | attack | 0 | yes | +1.5 [+0.5, +2.5] pts | -3.2 [-3.9, -2.6] | -0.83 [-0.97, -0.70] | better |
| strengthen | power | 1 | yes | +6.5 [+4.4, +8.6] pts | -3.1 [-3.8, -2.4] | -1.01 [-1.16, -0.87] | better |
| heavy-hit | attack | 3 | yes | +2.0 [+0.7, +3.3] pts | -2.9 [-3.7, -2.1] | -1.07 [-1.22, -0.91] | better |
| fortify | power | 2 | yes | +6.1 [+4.0, +8.2] pts | -2.8 [-3.6, -1.9] | +1.42 [+1.20, +1.63] | better |
| big-block | skill | 2 | yes | -0.2 [-0.8, +0.4] pts | -2.1 [-2.8, -1.3] | +1.05 [+0.89, +1.20] | better |
| weaken | skill | 1 | yes | +1.3 [+0.3, +2.3] pts | -1.4 [-2.1, -0.7] | +0.82 [+0.67, +0.98] | better |
| defend | skill | 1 | no | +0.2 [-0.2, +0.5] pts | -1.3 [-2.1, -0.6] | +0.63 [+0.47, +0.79] | better |
| sunder | attack | 2 | yes | +0.4 [-0.4, +1.1] pts | -1.3 [-2.1, -0.6] | -0.90 [-1.04, -0.75] | better |
| bolt | attack | 2 | yes | +0.0 [-0.5, +0.5] pts | -0.5 [-1.2, +0.1] | -0.74 [-0.88, -0.60] | INCONCLUSIVE |
| expose | skill | 1 | yes | +1.3 [+0.2, +2.4] pts | -0.5 [-1.2, +0.2] | -0.49 [-0.64, -0.34] | INCONCLUSIVE |
| strike | attack | 1 | no | +0.4 [-0.1, +0.9] pts | -0.4 [-1.1, +0.2] | -0.54 [-0.67, -0.40] | INCONCLUSIVE |
| focus | power | 1 | no | -0.9 [-1.9, +0.0] pts | +3.9 [+3.2, +4.7] | +0.51 [+0.35, +0.66] | worse |
| quick-draw | skill | 1 | yes | -1.1 [-2.1, -0.1] pts | +4.2 [+3.5, +5.0] | +0.44 [+0.28, +0.60] | worse |

### random bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| guarded-strike | attack | 1 | yes | +0.7 [+0.0, +1.5] pts | -4.1 [-4.4, -3.7] | +0.29 [+0.22, +0.36] | better |
| fortify | power | 2 | yes | +8.1 [+5.8, +10.5] pts | -3.5 [-4.3, -2.7] | +2.72 [+2.46, +2.98] | better |
| jab | attack | 0 | yes | +1.3 [+0.3, +2.3] pts | -3.4 [-4.0, -2.9] | -0.34 [-0.47, -0.20] | better |
| strengthen | power | 1 | yes | +6.1 [+4.1, +8.1] pts | -2.5 [-3.1, -1.9] | -0.55 [-0.67, -0.42] | better |
| heavy-hit | attack | 3 | yes | +2.6 [+1.3, +3.9] pts | -2.5 [-3.1, -1.8] | -0.66 [-0.81, -0.51] | better |
| big-block | skill | 2 | yes | +0.0 [-0.5, +0.5] pts | -1.3 [-2.1, -0.6] | +2.13 [+1.94, +2.31] | better |
| weaken | skill | 1 | yes | +0.4 [-0.4, +1.1] pts | -1.1 [-1.5, -0.7] | +1.71 [+1.59, +1.83] | better |
| sunder | attack | 2 | yes | +0.7 [+0.0, +1.5] pts | -0.9 [-1.5, -0.3] | -0.29 [-0.43, -0.15] | better |
| defend | skill | 1 | no | +0.0 [-0.5, +0.5] pts | -0.8 [-1.5, -0.1] | +1.49 [+1.33, +1.64] | better |
| bolt | attack | 2 | yes | +0.2 [-0.2, +0.5] pts | -0.3 [-0.9, +0.3] | -0.18 [-0.31, -0.05] | negligible |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| expose | skill | 1 | yes | +0.9 [+0.1, +1.7] pts | +0.0 [-0.3, +0.4] | +0.15 [+0.08, +0.22] | negligible |
| focus | power | 1 | no | -1.7 [-2.9, -0.5] pts | +4.7 [+4.0, +5.5] | +1.24 [+1.07, +1.41] | worse |
| quick-draw | skill | 1 | yes | -3.1 [-4.7, -1.6] pts | +5.5 [+4.7, +6.3] | +1.34 [+1.18, +1.50] | worse |

### greedy bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| big-block | skill | 2 | yes | +0.9 [+0.1, +1.7] pts | -5.2 [-5.9, -4.6] | +0.20 [+0.09, +0.32] | better |
| fortify | power | 2 | yes | +0.9 [+0.1, +1.7] pts | -4.1 [-5.1, -3.1] | +4.25 [+3.88, +4.62] | better |
| guarded-strike | attack | 1 | yes | +0.9 [+0.1, +1.7] pts | -3.4 [-3.9, -2.9] | -1.10 [-1.20, -1.00] | better |
| defend | skill | 1 | no | +0.2 [-0.9, +1.3] pts | -1.4 [-1.9, -1.0] | +0.19 [+0.09, +0.30] | better |
| heavy-hit | attack | 3 | yes | +0.9 [+0.1, +1.7] pts | -1.2 [-1.8, -0.6] | -1.67 [-1.82, -1.52] | better |
| jab | attack | 0 | yes | +0.9 [+0.1, +1.7] pts | -1.1 [-1.7, -0.6] | -1.57 [-1.68, -1.46] | better |
| strengthen | power | 1 | yes | -1.1 [-2.5, +0.2] pts | +0.5 [-0.0, +1.1] | -1.55 [-1.71, -1.38] | INCONCLUSIVE |
| bolt | attack | 2 | yes | +0.2 [-0.9, +1.3] pts | +0.9 [+0.5, +1.4] | -0.71 [-0.82, -0.60] | worse |
| strike | attack | 1 | no | -0.2 [-1.4, +1.0] pts | +1.0 [+0.6, +1.5] | -0.61 [-0.72, -0.50] | worse |
| weaken | skill | 1 | yes | -7.8 [-10.1, -5.5] pts | +1.1 [+0.6, +1.5] | +2.74 [+2.53, +2.95] | worse |
| expose | skill | 1 | yes | -7.6 [-10.0, -5.2] pts | +2.3 [+1.8, +2.8] | -0.83 [-0.99, -0.67] | worse |
| sunder | attack | 2 | yes | -1.9 [-3.4, -0.3] pts | +2.4 [+1.9, +2.9] | -2.13 [-2.31, -1.96] | worse |
| focus | power | 1 | no | -17.0 [-20.2, -13.9] pts | +12.8 [+11.7, +13.9] | +3.94 [+3.60, +4.27] | worse |
| quick-draw | skill | 1 | yes | -87.4 [-90.2, -84.6] pts | +40.3 [+38.5, +42.0] | +4.42 [+3.93, +4.91] | worse |

### greedy bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| big-block | skill | 2 | yes | +0.9 [+0.1, +1.7] pts | -6.2 [-6.7, -5.6] | +0.87 [+0.77, +0.97] | better |
| fortify | power | 2 | yes | +0.9 [+0.1, +1.7] pts | -4.6 [-5.6, -3.5] | +6.66 [+6.30, +7.03] | better |
| guarded-strike | attack | 1 | yes | +0.9 [+0.1, +1.7] pts | -4.0 [-4.3, -3.7] | -0.70 [-0.79, -0.61] | better |
| jab | attack | 0 | yes | +0.9 [+0.1, +1.7] pts | -2.4 [-2.6, -2.1] | -1.14 [-1.23, -1.04] | better |
| heavy-hit | attack | 3 | yes | +0.9 [+0.1, +1.7] pts | -2.1 [-2.5, -1.7] | -1.07 [-1.20, -0.95] | better |
| defend | skill | 1 | no | +0.0 [-0.7, +0.7] pts | -2.0 [-2.3, -1.7] | +0.91 [+0.82, +1.00] | better |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| bolt | attack | 2 | yes | -0.2 [-0.5, +0.2] pts | +0.2 [+0.1, +0.3] | +0.05 [+0.00, +0.11] | worse |
| weaken | skill | 1 | yes | -9.1 [-11.5, -6.6] pts | +1.7 [+1.3, +2.1] | +4.60 [+4.33, +4.88] | worse |
| strengthen | power | 1 | yes | -2.2 [-3.8, -0.6] pts | +2.1 [+1.7, +2.5] | -0.54 [-0.70, -0.37] | worse |
| sunder | attack | 2 | yes | -4.3 [-6.0, -2.5] pts | +4.1 [+3.6, +4.6] | -1.79 [-1.95, -1.62] | worse |
| expose | skill | 1 | yes | -9.8 [-12.3, -7.3] pts | +4.2 [+3.8, +4.7] | +0.40 [+0.23, +0.58] | worse |
| focus | power | 1 | no | -20.2 [-23.6, -16.8] pts | +14.5 [+13.4, +15.7] | +5.09 [+4.71, +5.46] | worse |
| quick-draw | skill | 1 | yes | -96.1 [-97.7, -94.5] pts | +45.1 [+43.7, +46.5] | +4.14 [+3.63, +4.65] | worse |

### smart bot, card added to the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| big-block | skill | 2 | yes | +7.2 [+5.0, +9.4] pts | -6.5 [-7.2, -5.7] | +0.80 [+0.68, +0.91] | better |
| guarded-strike | attack | 1 | yes | +7.0 [+4.8, +9.3] pts | -5.6 [-6.3, -5.0] | -0.30 [-0.38, -0.22] | better |
| jab | attack | 0 | yes | +5.6 [+3.5, +7.6] pts | -3.9 [-4.5, -3.2] | -0.47 [-0.55, -0.39] | better |
| heavy-hit | attack | 3 | yes | +6.7 [+4.6, +8.8] pts | -3.2 [-3.8, -2.7] | -1.45 [-1.55, -1.34] | better |
| fortify | power | 2 | yes | +7.6 [+5.4, +9.8] pts | -2.7 [-3.8, -1.7] | +3.04 [+2.68, +3.39] | better |
| defend | skill | 1 | no | -2.0 [-3.6, -0.5] pts | -1.3 [-1.8, -0.7] | +0.25 [+0.17, +0.33] | better |
| strike | attack | 1 | no | +1.5 [-0.3, +3.3] pts | -0.8 [-1.3, -0.3] | -0.15 [-0.24, -0.07] | better |
| sunder | attack | 2 | yes | +2.4 [+0.5, +4.4] pts | -0.4 [-0.9, +0.2] | -1.36 [-1.48, -1.23] | negligible |
| strengthen | power | 1 | yes | +7.0 [+4.8, +9.3] pts | -0.3 [-0.9, +0.3] | -1.34 [-1.46, -1.22] | negligible |
| expose | skill | 1 | yes | +0.4 [-1.3, +2.1] pts | -0.3 [-0.8, +0.3] | -1.16 [-1.27, -1.04] | negligible |
| bolt | attack | 2 | yes | +1.5 [-0.6, +3.5] pts | -0.2 [-0.8, +0.4] | -0.53 [-0.62, -0.44] | negligible |
| weaken | skill | 1 | yes | -3.3 [-4.9, -1.7] pts | +0.1 [-0.5, +0.6] | +0.73 [+0.65, +0.82] | negligible |
| focus | power | 1 | no | -3.5 [-5.1, -2.0] pts | +9.2 [+8.4, +10.1] | +0.65 [+0.51, +0.79] | worse |
| quick-draw | skill | 1 | yes | -19.6 [-23.0, -16.3] pts | +13.2 [+12.1, +14.4] | +1.04 [+0.83, +1.26] | worse |

### smart bot, card replacing the most common card of the starter deck
| card | type | cost | pool | win rate change | HP lost change | turns change | verdict (HP lost) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| big-block | skill | 2 | yes | +7.6 [+5.4, +9.8] pts | -7.5 [-8.2, -6.8] | +1.21 [+1.09, +1.33] | better |
| guarded-strike | attack | 1 | yes | +7.0 [+4.9, +9.2] pts | -5.2 [-5.6, -4.7] | -0.17 [-0.23, -0.11] | better |
| jab | attack | 0 | yes | +5.0 [+3.1, +6.9] pts | -3.4 [-3.9, -3.0] | -0.33 [-0.40, -0.26] | better |
| fortify | power | 2 | yes | +7.6 [+5.4, +9.8] pts | -3.4 [-4.5, -2.3] | +4.53 [+4.12, +4.93] | better |
| heavy-hit | attack | 3 | yes | +6.9 [+4.7, +9.0] pts | -3.3 [-3.8, -2.8] | -1.46 [-1.57, -1.36] | better |
| defend | skill | 1 | no | -2.6 [-4.0, -1.2] pts | -0.4 [-0.8, -0.0] | +0.48 [+0.42, +0.54] | better |
| strengthen | power | 1 | yes | +5.4 [+3.2, +7.5] pts | -0.0 [-0.6, +0.6] | -1.19 [-1.32, -1.07] | negligible |
| strike | attack | 1 | no | +0.0 [+0.0, +0.0] pts | +0.0 [+0.0, +0.0] | +0.00 [+0.00, +0.00] | negligible |
| sunder | attack | 2 | yes | -0.2 [-1.9, +1.6] pts | +0.3 [-0.2, +0.8] | -1.28 [-1.40, -1.16] | negligible |
| expose | skill | 1 | yes | -1.1 [-2.7, +0.5] pts | +0.6 [+0.1, +1.1] | -1.03 [-1.14, -0.92] | worse |
| bolt | attack | 2 | yes | -0.2 [-1.6, +1.2] pts | +0.7 [+0.3, +1.1] | -0.36 [-0.43, -0.30] | worse |
| weaken | skill | 1 | yes | -3.5 [-5.1, -2.0] pts | +1.6 [+1.2, +2.1] | +1.02 [+0.94, +1.09] | worse |
| focus | power | 1 | no | -4.4 [-6.2, -2.7] pts | +11.8 [+11.0, +12.7] | +1.01 [+0.87, +1.15] | worse |
| quick-draw | skill | 1 | yes | -46.7 [-50.9, -42.5] pts | +20.7 [+19.2, +22.2] | +2.14 [+1.83, +2.45] | worse |


## Pair synergy

Synergy score = (benefit of A and B together) minus (benefit of A alone + benefit of B alone), all measured against the starter deck on identical seeds, in HP lost (benefit = HP/turns saved, so positive is good). Positive means the cards help each other more than the sum of their parts; negative means they overlap or fight for the same energy and draws. Brackets are 95% CIs. Skill: smart. 9 fights x 40 seeds = 360 paired units per deck (base seed 1). Fights: enemy-a, enemy-d+enemy-d, enemy-b+enemy-d, enemy-c, enemy-a+enemy-d, enemy-d+enemy-d+enemy-d, elite-a, elite-b, boss-a.
45 of 45 possible pairs evaluated. Candidate cards: jab, guarded-strike, heavy-hit, big-block, quick-draw, fortify, weaken, expose, sunder, strengthen.
Of 45 pairs: 9 clearly synergistic, 25 clearly anti-synergistic, 0 negligible, 11 inconclusive. Each pair is a 4-way difference, so its interval is wide: with 100+ pairs tested, expect about 5% to look significant by chance. Treat single hits as leads and confirm a lead by re-running just that pair with more seeds (--pairs a+b --seeds 200).

### Strongest synergies
| pair | synergy score | verdict |
| --- | --- | --- |
| heavy-hit + quick-draw | +7.46 [+5.88, +9.03] | better |
| quick-draw + sunder | +6.69 [+5.22, +8.16] | better |
| quick-draw + strengthen | +6.55 [+5.07, +8.02] | better |
| jab + quick-draw | +6.36 [+4.74, +7.97] | better |
| guarded-strike + quick-draw | +5.35 [+3.61, +7.08] | better |
| quick-draw + expose | +4.97 [+3.48, +6.45] | better |
| expose + strengthen | +1.91 [+0.83, +2.99] | better |
| sunder + strengthen | +1.80 [+0.74, +2.85] | better |
| weaken + strengthen | +1.40 [+0.50, +2.30] | better |

### Negative (anti-synergistic) pairs
| pair | synergy score | verdict |
| --- | --- | --- |
| quick-draw + fortify | -16.48 [-18.51, -14.44] | worse |
| fortify + weaken | -6.95 [-8.96, -4.95] | worse |
| fortify + expose | -5.64 [-7.06, -4.22] | worse |
| heavy-hit + big-block | -3.36 [-4.41, -2.31] | worse |
| big-block + sunder | -3.16 [-4.30, -2.02] | worse |
| big-block + expose | -2.99 [-4.08, -1.90] | worse |
| quick-draw + weaken | -2.92 [-4.56, -1.28] | worse |
| jab + heavy-hit | -2.85 [-3.85, -1.85] | worse |
| guarded-strike + big-block | -2.84 [-3.95, -1.73] | worse |
| fortify + strengthen | -2.83 [-3.97, -1.69] | worse |


## Outlier report

Outlier method: within a cohort of 4 or more values, a value is flagged when its modified z-score (0.6745 * (x - median) / MAD, Iglewicz-Hoaglin) exceeds 3.5 in magnitude OR it lies outside the Tukey fences (Q1 - 1.5 IQR, Q3 + 1.5 IQR). Median/MAD/IQR are used because the cohort itself may contain the outlier. A flag means "look at this", not "this is wrong".

Cards: value = how much adding the card helps on HP lost (positive = helps), compared within all cards and within each energy-cost group. Enemies: fights are compared inside their tier (normal/elite/boss) on the mid deck set. Cohorts smaller than 4 are skipped, so small content lists produce no flags; the tier bands in the ladder report cover that case.

| kind | skill | cohort | id | metric | value | modified z | z | IQR rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| card | random | all cards | focus | HP lost change when added | -3.94 | -3.03 | -2.04 | outside |
| card | random | all cards | quick-draw | HP lost change when added | -4.24 | -3.20 | -2.17 | outside |
| card | greedy | all cards | focus | HP lost change when added | -12.77 | -4.29 | -0.83 | outside |
| card | greedy | all cards | quick-draw | HP lost change when added | -40.26 | -14.08 | -3.23 | outside |
| card | greedy | cost 1 | focus | HP lost change when added | -12.77 | -4.22 | -0.43 | outside |
| card | greedy | cost 1 | quick-draw | HP lost change when added | -40.26 | -14.11 | -2.33 | outside |
| card | smart | all cards | focus | HP lost change when added | -9.24 | -4.75 | -1.77 | outside |
| card | smart | all cards | quick-draw | HP lost change when added | -13.23 | -6.67 | -2.52 | outside |
| card | smart | cost 1 | focus | HP lost change when added | -9.24 | -8.37 | -1.20 | outside |
| card | smart | cost 1 | guarded-strike | HP lost change when added | 5.64 | 4.71 | 1.20 | inside |
| card | smart | cost 1 | quick-draw | HP lost change when added | -13.23 | -11.87 | -1.85 | outside |

### Cards worse than adding nothing
Adding the card to the deck measurably HURTS the headline metric (paired 95% CI excludes zero). Possible dead picks, or cards that need a partner; check the pair report before judging.

| skill | card | cost | change [95% CI] |
| --- | --- | --- | --- |
| random | focus | 1 | +3.9 [+3.2, +4.7] |
| random | quick-draw | 1 | +4.2 [+3.5, +5.0] |
| greedy | strike | 1 | +1.0 [+0.6, +1.5] |
| greedy | bolt | 2 | +0.9 [+0.5, +1.4] |
| greedy | focus | 1 | +12.8 [+11.7, +13.9] |
| greedy | quick-draw | 1 | +40.3 [+38.5, +42.0] |
| greedy | weaken | 1 | +1.1 [+0.6, +1.5] |
| greedy | expose | 1 | +2.3 [+1.8, +2.8] |
| greedy | sunder | 2 | +2.4 [+1.9, +2.9] |
| smart | focus | 1 | +9.2 [+8.4, +10.1] |
| smart | quick-draw | 1 | +13.2 [+12.1, +14.4] |


## Draft policy comparison (whole runs)

100 runs per policy on seeds 1..100, fights played by the greedy bot. All policies share seeds; differences are against the first policy, run by run (paired). Win rate has a Wilson 95% interval; differences have paired 95% CIs. Verdict margin: +-5 points.
Run-level results are noisy (a run is ~12 fights; one bad fight ends it). Resolving a 5-point win-rate difference takes several hundred runs per policy. For judging individual cards or fights, prefer the fight-level experiments.

| policy | run win rate [95% CI] | avg floor [95% CI] | win change vs first | floor change vs first | verdict |
| --- | --- | --- | --- | --- | --- |
| reward=card (random pick) | 37.0% [28.2%, 46.8%] | 9.9 [9.2, 10.6] | - | - | baseline |
| reward=gold (always gold) | 41.0% [31.9%, 50.8%] | 12.2 [11.9, 12.6] | +4.0 [-8.2, +16.2] pts | +2.3 [+1.6, +3.1] | INCONCLUSIVE |
| reward=best (trial-fight pick) | 77.0% [67.8%, 84.2%] | 12.7 [12.5, 12.9] | +40.0 [+27.1, +52.9] pts | +2.8 [+2.1, +3.5] | better |
| rest=heal (never upgrade) | 36.0% [27.3%, 45.8%] | 9.9 [9.2, 10.6] | -1.0 [-3.0, +1.0] pts | -0.0 [-0.1, +0.0] | negligible |
| path=random | 28.0% [20.1%, 37.5%] | 10.0 [9.3, 10.7] | -9.0 [-21.9, +3.9] pts | +0.1 [-0.9, +1.0] | INCONCLUSIVE |

### Pick rates under reward=card (random pick)
Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.

| card | offered | picked | pick rate [95% CI] |
| --- | --- | --- | --- |
| jab | 171 | 68 | 39.8% [32.7%, 47.2%] |
| sunder | 141 | 55 | 39.0% [31.3%, 47.2%] |
| big-block | 172 | 61 | 35.5% [28.7%, 42.9%] |
| expose | 170 | 59 | 34.7% [28.0%, 42.1%] |
| bolt | 186 | 62 | 33.3% [27.0%, 40.4%] |
| heavy-hit | 189 | 61 | 32.3% [26.0%, 39.2%] |
| weaken | 163 | 52 | 31.9% [25.2%, 39.4%] |
| fortify | 176 | 56 | 31.8% [25.4%, 39.0%] |
| guarded-strike | 185 | 58 | 31.4% [25.1%, 38.4%] |
| strengthen | 161 | 50 | 31.1% [24.4%, 38.6%] |
| quick-draw | 176 | 48 | 27.3% [21.2%, 34.3%] |

### Pick rates under reward=best (trial-fight pick)
Each card is offered as one of three; with three equal options a random picker takes any given offer about 33% of the time, so only distance from that matters for the random policy. For a deliberate policy, a card picked far more or less than 33% of its offers is a dominant or dominated choice.

| card | offered | picked | pick rate [95% CI] |
| --- | --- | --- | --- |
| guarded-strike | 236 | 166 | 70.3% [64.2%, 75.8%] |
| big-block | 223 | 152 | 68.2% [61.8%, 73.9%] |
| jab | 227 | 86 | 37.9% [31.8%, 44.3%] |
| heavy-hit | 232 | 84 | 36.2% [30.3%, 42.6%] |
| weaken | 213 | 76 | 35.7% [29.6%, 42.3%] |
| bolt | 244 | 78 | 32.0% [26.4%, 38.1%] |
| strengthen | 208 | 43 | 20.7% [15.7%, 26.7%] |
| fortify | 239 | 46 | 19.2% [14.8%, 24.7%] |
| expose | 204 | 35 | 17.2% [12.6%, 22.9%] |
| sunder | 175 | 24 | 13.7% [9.4%, 19.6%] |
| quick-draw | 214 | 15 | 7.0% [4.3%, 11.2%] |

