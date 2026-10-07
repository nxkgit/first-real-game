## Event choices (default policy: gold never taken)

300 paired runs per row on seeds 1..300, fights played by the greedy bot. Each row forces one choice at every stop of that event and leaves every other event, compared with leaving every event, over the runs that met the event (the choice that does nothing reads as zero by construction). "HP at the boss" is the HP carried into the boss fight, over runs that reached it. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| event choice | runs that met it | win vs leaving | floor reached | final deck cost (HP/fight) | HP at the boss |
| --- | --- | --- | --- | --- | --- |
| event-a: Take it (+60 gold, -8 HP) | 127 | -4.7 [-9.0, -0.4] pts | -0.17 [-0.31, -0.04] | +0.3 [+0.1, +0.6] | -3.7 [-5.7, -1.8] |
| event-a: Leave it (nothing) | 127 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-b: Rest here (+15 HP) | 118 | +1.7 [-0.7, +4.1] pts | +0.06 [-0.03, +0.15] | -0.2 [-0.3, -0.1] | +4.2 [+2.8, +5.7] |
| event-b: Study here (randomCard) | 118 | -4.2 [-9.2, +0.8] pts | -0.13 [-0.28, +0.02] | +0.5 [-0.1, +1.0] | -1.7 [-4.6, +1.2] |
| event-b: Move on (nothing) | 118 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-c: Fight for it (fight enemy-b, relic) | 116 | +0.9 [-3.7, +5.4] pts | -0.02 [-0.14, +0.11] | -0.7 [-1.2, -0.3] | +2.4 [+0.2, +4.7] |
| event-c: Walk away (nothing) | 116 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-d: Pay for strength (-50 gold, +8 max HP) | 125 | +2.4 [-0.3, +5.1] pts | +0.11 [-0.01, +0.23] | -0.0 [-0.1, +0.1] | +10.5 [+9.3, +11.8] |
| event-d: Decline (nothing) | 125 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |

## Event choices (gold is spent at shops)

300 paired runs per row on seeds 1..300, fights played by the greedy bot. Each row forces one choice at every stop of that event and leaves every other event, compared with leaving every event, over the runs that met the event (the choice that does nothing reads as zero by construction). "HP at the boss" is the HP carried into the boss fight, over runs that reached it. "final deck cost" is the HP per fight the end-of-run deck loses against four reference fights (lower is better), a far less noisy measure than a run's win/loss. Brackets are 95% intervals; differences are paired by seed against the first row. Run-level win rates are noisy (about 5 points needs a few hundred runs), so read deck cost next to them.

| event choice | runs that met it | win vs leaving | floor reached | final deck cost (HP/fight) | HP at the boss |
| --- | --- | --- | --- | --- | --- |
| event-a: Take it (+60 gold, -8 HP) | 149 | -4.0 [-7.7, -0.4] pts | -0.11 [-0.21, -0.02] | +0.1 [-0.1, +0.3] | -5.2 [-6.7, -3.6] |
| event-a: Leave it (nothing) | 149 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-b: Rest here (+15 HP) | 146 | +2.7 [+0.1, +5.4] pts | +0.03 [-0.01, +0.07] | -0.3 [-0.4, -0.1] | +4.7 [+3.4, +6.0] |
| event-b: Study here (randomCard) | 146 | -4.1 [-9.5, +1.2] pts | -0.14 [-0.26, -0.03] | +0.6 [-0.1, +1.2] | -2.5 [-4.7, -0.2] |
| event-b: Move on (nothing) | 146 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-c: Fight for it (fight enemy-b, relic) | 151 | +2.6 [-1.4, +6.7] pts | -0.02 [-0.10, +0.06] | -1.3 [-1.7, -0.8] | +3.3 [+1.4, +5.3] |
| event-c: Walk away (nothing) | 151 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |
| event-d: Pay for strength (-50 gold, +8 max HP) | 149 | +3.4 [+0.5, +6.3] pts | +0.07 [-0.03, +0.16] | -0.1 [-0.4, +0.2] | +9.5 [+8.3, +10.8] |
| event-d: Decline (nothing) | 149 | +0.0 [+0.0, +0.0] pts | +0.00 [+0.00, +0.00] | +0.0 [+0.0, +0.0] | +0.0 [+0.0, +0.0] |

