## What one card is worth (HP per fight saved)

9 act fights x 40 seeds per deck, greedy bot, full HP each fight. Positive = fewer HP lost per fight than the deck without the card. Best-of-k = expected maximum over 3000 random offers of k distinct reward-pool cards, taking each card's measured value (a perfect judge). Removal = HP per fight saved by taking the single best card out (and the best Strike/Defend-type starter card out).

| deck stage | one random card | best of 3 (reward) | best of 4 (shop) | offers whose best card adds <= 0.5 | best single removal | best basic-card removal | win-rate points of the best card |
| --- | --- | --- | --- | --- | --- | --- | --- |
| starter | 0.48 | 2.33 | 2.79 | 12% | 2.19 | 2.19 | 0.0 |
| mid#1 | 0.31 | 2.31 | 2.75 | 20% | 1.79 | 0.91 | 0.0 |
| mid#2 | -1.46 | 2.29 | 2.72 | 13% | 4.95 | -3.82 | 0.3 |
| mid#3 | -0.43 | 0.54 | 0.83 | 50% | 0.57 | 0.57 | 0.0 |
| late#1 | -1.02 | 0.21 | 0.44 | 50% | 4.13 | -0.20 | 0.0 |
| late#2 | -0.51 | 0.52 | 0.73 | 34% | 2.68 | 0.47 | 0.0 |
| late#3 | -0.82 | 0.11 | 0.30 | 50% | 1.82 | 0.57 | 0.0 |

### Each reward card, averaged over the stages

| card | cost | mean HP/fight saved | worst stage | best stage |
| --- | --- | --- | --- | --- |
| big-block | 2 | 2.28 | 0.54 | 4.45 |
| guarded-strike | 1 | 1.90 | 0.74 | 3.09 |
| jab | 0 | 0.43 | -0.46 | 2.22 |
| heavy-hit | 3 | 0.03 | -0.71 | 1.87 |
| bolt | 2 | -0.29 | -1.37 | 1.72 |
| fortify | 2 | -0.29 | -1.18 | 1.59 |
| weaken | 1 | -0.36 | -1.87 | 1.62 |
| strengthen | 1 | -0.37 | -1.14 | 0.81 |
| expose | 1 | -1.54 | -2.88 | 0.13 |
| sunder | 2 | -2.43 | -5.25 | -0.72 |
| quick-draw | 1 | -4.78 | -17.78 | -1.06 |

