## What one card is worth (HP per fight saved)

9 act fights x 40 seeds per deck, smart bot, full HP each fight. Positive = fewer HP lost per fight than the deck without the card. Best-of-k = expected maximum over 3000 random offers of k distinct reward-pool cards, taking each card's measured value (a perfect judge). Removal = HP per fight saved by taking the single best card out (and the best Strike/Defend-type starter card out).

| deck stage | one random card | best of 3 (reward) | best of 4 (shop) | offers whose best card adds <= 0.5 | best single removal | best basic-card removal | win-rate points of the best card |
| --- | --- | --- | --- | --- | --- | --- | --- |
| starter | 0.05 | 2.25 | 2.82 | 22% | 1.25 | 0.74 | 1.1 |
| mid#1 | 0.32 | 1.22 | 1.39 | 12% | 0.96 | -0.07 | 0.0 |
| mid#2 | -0.48 | 0.80 | 1.05 | 33% | 2.55 | -0.14 | 0.0 |
| mid#3 | 0.32 | 1.17 | 1.40 | 20% | 0.92 | -0.16 | 0.0 |
| late#1 | 0.02 | 0.60 | 0.74 | 50% | 1.55 | 0.54 | 0.0 |
| late#2 | -0.15 | 0.36 | 0.49 | 72% | 1.20 | 0.60 | 0.0 |
| late#3 | 0.26 | 0.80 | 0.93 | 34% | 1.39 | 0.59 | 0.0 |

### Each reward card, averaged over the stages

| card | cost | mean HP/fight saved | worst stage | best stage |
| --- | --- | --- | --- | --- |
| guarded-strike | 1 | 1.91 | 1.01 | 3.96 |
| big-block | 2 | 1.21 | -0.08 | 4.20 |
| jab | 0 | 0.83 | 0.45 | 1.48 |
| heavy-hit | 3 | 0.18 | -0.55 | 0.60 |
| quick-draw | 1 | -0.17 | -0.99 | 0.46 |
| fortify | 2 | -0.25 | -0.82 | 0.27 |
| weaken | 1 | -0.31 | -1.57 | 0.15 |
| strengthen | 1 | -0.49 | -2.60 | 0.33 |
| expose | 1 | -0.75 | -2.83 | 1.57 |
| sunder | 2 | -0.75 | -2.43 | 1.16 |
| bolt | 2 | -0.86 | -2.49 | 0.38 |

