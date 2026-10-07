## Does a synergy-seeking draft assemble an engine?

300 paired runs per row on seeds 1..300, fights played by the greedy bot. The first row is the comparison base. "Engine concentration" = how many non-starter cards of the final deck share the most common mechanism label (1 = none do). "Runs holding a synergy card" counts final decks with at least one card from outside the live reward pool. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| variant | win rate [95% CI] | win vs first (paired) | floor reached | final deck cost, HP/fight [CI] | cost vs first | deck size | gold left | verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| every draftable card offered, random pick | 46.3% [40.8%, 52.0%] | base | 11.7 [11.5, 11.9] | 18.5 [18.0, 19.0] | base | 17.6 | 11 | base |
| every draftable card offered, best by trial fights | 84.7% [80.2%, 88.3%] | +38.3 [+32.4, +44.2] pts | 12.6 [12.5, 12.8] | 10.5 [10.0, 11.0] | -8.0 [-8.5, -7.4] | 18.2 | 11 | better |
| every draftable card offered, synergy-seeking (trial + mechanism overlap) | 84.3% [79.8%, 88.0%] | +38.0 [+32.1, +43.9] pts | 12.6 [12.5, 12.7] | 10.5 [10.0, 11.0] | -8.0 [-8.5, -7.4] | 18.2 | 11 | better |
| reward pool only, best by trial fights (the live game's cards) | 91.3% [87.6%, 94.0%] | +45.0 [+38.7, +51.3] pts | 12.9 [12.8, 12.9] | 11.3 [11.0, 11.7] | -7.1 [-7.7, -6.5] | 18.4 | 11 | better |

| variant | engine concentration [CI] | runs holding a synergy card |
| --- | --- | --- |
| every draftable card offered, random pick | 1.80 [1.73, 1.88] | 100% |
| every draftable card offered, best by trial fights | 1.83 [1.75, 1.91] | 100% |
| every draftable card offered, synergy-seeking (trial + mechanism overlap) | 1.92 [1.83, 2.00] | 100% |
| reward pool only, best by trial fights (the live game's cards) | 1.26 [1.20, 1.31] | 0% |

