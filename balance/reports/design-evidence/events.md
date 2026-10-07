## Event choices (default policy: gold never taken)

300 paired runs per row on seeds 1..300, fights played by the smart bot. Each row forces one choice at every stop of that event and leaves every other event, compared with leaving every event, over the runs that met the event (the choice that does nothing reads as zero by construction). "HP at the boss" is the HP carried into the boss fight, over runs that reached it. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| event choice | runs that met it | win vs leaving | floor reached | final deck cost (HP/fight) | HP at the boss |
| --- | --- | --- | --- | --- | --- |
| event-a: Take it (+60 gold, -8 HP) | 128 | -13.3 [-19.9, -6.6] pts | -0.54 [-0.77, -0.31] | +0.3 [-0.0, +0.5] | -5.8 [-7.6, -4.1] |
| event-a: Leave it (nothing) | 128 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-b: Rest here (+15 HP) | 110 | +16.4 [+8.9, +23.8] pts | +0.50 [+0.28, +0.72] | -0.2 [-0.5, +0.0] | +10.4 [+8.2, +12.5] |
| event-b: Study here (randomCard) | 110 | -5.5 [-13.1, +2.1] pts | -0.15 [-0.40, +0.11] | +0.6 [+0.1, +1.2] | -0.8 [-3.3, +1.8] |
| event-b: Move on (nothing) | 110 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-c: Fight for it (fight enemy-b, relic) | 98 | +5.1 [-3.2, +13.4] pts | +0.20 [-0.13, +0.54] | -0.5 [-1.1, -0.0] | +4.5 [+1.2, +7.7] |
| event-c: Walk away (nothing) | 98 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-d: Pay for strength (-50 gold, +8 max HP) | 123 | +12.2 [+6.0, +18.4] pts | +0.45 [+0.26, +0.63] | -0.1 [-0.2, +0.1] | +12.2 [+10.4, +13.9] |
| event-d: Decline (nothing) | 123 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |

## Event choices (gold is spent at shops)

300 paired runs per row on seeds 1..300, fights played by the smart bot. Each row forces one choice at every stop of that event and leaves every other event, compared with leaving every event, over the runs that met the event (the choice that does nothing reads as zero by construction). "HP at the boss" is the HP carried into the boss fight, over runs that reached it. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| event choice | runs that met it | win vs leaving | floor reached | final deck cost (HP/fight) | HP at the boss |
| --- | --- | --- | --- | --- | --- |
| event-a: Take it (+60 gold, -8 HP) | 146 | -15.8 [-22.8, -8.7] pts | -0.58 [-0.82, -0.33] | +0.3 [+0.1, +0.5] | -6.9 [-8.8, -4.9] |
| event-a: Leave it (nothing) | 146 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-b: Rest here (+15 HP) | 136 | +22.1 [+14.5, +29.6] pts | +0.45 [+0.22, +0.68] | -0.3 [-0.5, +0.0] | +9.1 [+6.9, +11.2] |
| event-b: Study here (randomCard) | 136 | -2.9 [-11.8, +6.0] pts | -0.18 [-0.46, +0.09] | +1.1 [+0.4, +1.8] | -0.0 [-2.5, +2.4] |
| event-b: Move on (nothing) | 136 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-c: Fight for it (fight enemy-b, relic) | 132 | +6.8 [-1.9, +15.6] pts | -0.01 [-0.30, +0.28] | -0.9 [-1.5, -0.3] | +3.2 [+0.5, +6.0] |
| event-c: Walk away (nothing) | 132 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-d: Pay for strength (-50 gold, +8 max HP) | 141 | +13.5 [+7.5, +19.5] pts | +0.25 [+0.12, +0.37] | +0.1 [-0.2, +0.3] | +9.5 [+7.7, +11.3] |
| event-d: Decline (nothing) | 141 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |

