## Does a synergy-seeking draft assemble an engine?

300 paired runs per row on seeds 1..300, fights played by the smart bot. The first row is the comparison base. "Engine concentration" = how many non-starter cards of the final deck share the most common mechanism label (1 = none do). "Runs holding a synergy card" counts final decks with at least one card from outside the live reward pool. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| every draftable card offered, random pick | 24.7% [20.1%, 29.8%] | base | 10.2 [10.0, 10.5] | 19.2 [18.6, 19.7] | base | 16.6 | 9 | base |
| every draftable card offered, best by trial fights | 62.7% [57.1%, 67.9%] | +38.0 [+32.3, +43.7] pts | 11.7 [11.5, 12.0] | 11.2 [10.8, 11.7] | -7.9 [-8.5, -7.4] | 17.5 | 10 | better |
| every draftable card offered, synergy-seeking (trial + mechanism overlap) | 63.0% [57.4%, 68.3%] | +38.3 [+32.6, +44.1] pts | 11.7 [11.5, 12.0] | 11.2 [10.7, 11.7] | -8.0 [-8.5, -7.4] | 17.5 | 10 | better |
| reward pool only, best by trial fights (the live game's cards) | 61.0% [55.4%, 66.3%] | +36.3 [+30.3, +42.4] pts | 11.6 [11.4, 11.9] | 12.2 [11.8, 12.5] | -7.0 [-7.6, -6.4] | 17.5 | 11 | better |

| variant | engine concentration [CI] | runs holding a synergy card |
| --- | --- | --- |
| every draftable card offered, random pick | 1.67 [1.60, 1.74] | 100% |
| every draftable card offered, best by trial fights | 1.74 [1.66, 1.82] | 100% |
| every draftable card offered, synergy-seeking (trial + mechanism overlap) | 1.83 [1.75, 1.91] | 100% |
| reward pool only, best by trial fights (the live game's cards) | 1.19 [1.14, 1.23] | 0% |

