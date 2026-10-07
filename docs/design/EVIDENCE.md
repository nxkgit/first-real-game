# Design evidence for the open decisions

Written 2026-10-07 by an unattended session (branch `auto/design-evidence`). **This is measurement, not a decision.** Everything in the game is placeholder (cards, enemies, relics, events, every number), the simulator's bots are not players, and nothing here was played in a browser. The owner decides; this document says what each choice would *do* mechanically, and how sure the numbers are. No file in `src/game`, `src/data` or `src/scenes` was changed: every "what if" is an in-memory parameter of the simulator (`src/sim/runsim.ts`, `docs/BALANCE.md` section "Design-evidence commands").

How to read it:
- Every table cell with a bracket is a 95% interval. Run-level comparisons are **paired** (the same seeds on both sides).
- **Two bots are used because they disagree.** `smart` loses about twice the HP `greedy` does on ordinary decks (documented in `BALANCE.md`), so on the same content `smart` wins about 54% of acts and `greedy` about 92%. A conclusion is stated as firm only when both bots agree; where they differ, both numbers are given. A real player is somewhere in between and may be neither.
- Units: **HP per fight** = how many fewer HP a deck/relic/choice costs per fight (paired fights against the act's encounters at full HP); **win points** = change in whole-act win rate; **final deck cost** = HP per fight lost, against four reference fights, by the deck a run ends with.
- Raw reports (all the rows): `balance/reports/design-evidence/<name>.md|json` (smart bot) and `<name>-greedy.md|json`. Sizes: 300 runs per row (600 for `paths`), 20-40 paired seeds per fight for fight-level tables, 200-300 maps for map statistics. Intervals reflect those sizes.
- **The act's difficulty is dominated by HP attrition**, not by any single fight: runs that die do so in ordinary fights on floors 7-11 with about 26 HP left (see section 7). Anything that adds or saves HP (rests, relics, events, max HP) therefore moves win rate far more than anything that changes the deck by a card. Section 2 gives a conversion.

## Decision menu

"Evidence-backed range" is what the measurements say keeps the choice meaningful (not dominated, not dominant), written as a mechanic. It is a range to choose inside, not a recommendation. "Blocked" = the number cannot be set until a creative choice exists.

| # | Open decision (HANDOFF) | What the numbers say | Evidence-backed range / mechanic | Blocked on creative content? |
|---|---|---|---|---|
| 1 | Shop: contents, price, gold's value against a card | Always taking gold loses 26-33 win points (smart) at **every** price from 20 to 80, because a path meets a shop only ~0.4 times and gold left unspent is worth nothing. Taking gold **only when the offered cards are weak** (best card saves under 1 HP per fight) *wins* 13-15 points at every price. So the standing choice is dominated, the per-offer choice is live. | To keep "card or gold" a real choice every time: either (a) guarantee shops (about 1.5+ per path, section 1) and price a card at 25-30 gold against a 25-gold reward, or (b) keep shops rare and accept that gold is chosen only on weak offers (20-50% of offers from mid-deck on). Price is a weak knob next to shop frequency. A shop price above reward gold makes gold lumpy (price 40 needs two gold picks per card). | Partly: what the shop *sells* is creative; the price and frequency numbers are not. |
| 1b | Card removal as a service | One removal is worth 0.9-2.6 HP per fight from a mid deck on, as much as or more than the best of 4 shop cards (1.05-1.4). A removal costing more than about 2x a card is dominated at late stages. | Price removal at 1x-2x a card; below 1x it dominates buying cards. | No |
| 2 | Relics: sources, count, effects | Placeholder relics span ~0 to ~35 win points. Per act: Guard Token ~30 HP, Recovery Token ~30 HP, Vitality Token 10 HP (+15 points), Strength Token ~6 HP, Draw Token ~1-2 HP, two synergy relics 0 outside their decks. Elites give one each and a path meets ~0.5 elites. | A relic worth 5-15 HP over the act moves win rate 5-20 points; anything near 30 HP (a third of the HP budget) decides the act. Relics that act every fight are worth 3-4 HP x fights; "once" relics 1 HP per HP. Sizing in HP-equivalents (section 2) keeps them comparable. | **Yes** (what they do). The sizing method is not. |
| 3 | Events: real events, whether event fights reward | Gold-for-HP trades are strongly negative while gold is nearly worthless (+60 gold -8 HP = -13 points); HP heals and max HP are strongly positive (+15 HP = +16 points; +8 max HP = +12 points); a "pay gold" cost is free when you hold none. | An event choice is live when its HP-equivalent value is within a few HP of the alternatives; table in section 3 converts outcomes. Costs paid in gold only bite once gold has a use. | **Yes** (the events themselves). |
| 4 | Map shape and rules | Per two floors, win rate moves about 8-12 points (12 floors: 54%; 10: 69%; 14: 46%; 16: 31%) because enemies do not scale with floor and rests do not either. Rest weight is the strongest map knob (+8 points per +0.2 rests per path). Lanes, climbs and elite/shop thresholds: no detectable effect (+/-5). | Pick floors and rests-per-path together (section 4). A path sees ~8.6 fights, 0.5 elites (0.1-1.1 across a map's paths), 1.5 rests (1.1-2.1), 0.4 shops (0.1-0.9), 2.4 events (0.9-4.1). | Treasure stops / multiple acts: yes. Numbers: no. |
| 5 | Upgrades: numbers, and rest options beyond heal-or-upgrade | One upgrade saves ~1 HP per fight on average (0.5-1.8 by card); the best one at a rest saves 1.9 early, 1.1 late, i.e. 1-9 HP over the rest of the act. A heal restores ~17-19 HP and is fully used at every floor. **Upgrade is dominated by heal** at the current numbers (always-upgrade loses 14-26 win points). | For upgrade to be a live choice at a rest: raise its value to ~10-15 HP over the rest of the act (about 2-3x today), or cut the heal to ~10-12 HP (fraction ~0.2; costs 7 points smart / 2 greedy), or add something that is worth ~15 HP. | Rest options: yes. |
| 6 | Difficulty curve | Flat: normal fights cost 5.7 HP on floors 1-3 and 8-10 after (one step at floor 4 where the encounter list changes); elites 12.8 and the boss 21.3 HP are at the low edge of the provisional bands; HP entering fights falls from 60 to ~26 by floor 8. | Section 7. If a rising curve is wanted it has to come from encounter strength (content), because the map does not scale anything. | Enemy designs: yes. |
| 7 | Deck size (thin vs fat), removal | Opposite for the two bots: `smart` gains from fat decks (+25 random cards -3.9 HP/fight), `greedy` loses (+30 cards: +3.3) and gains from thin ones. | No range can be given from the bots alone; this is a playtest question (section 8). | No |
| - | Hero abilities, status cards, real content, rarity, phone layout (HANDOFF 6-10) | Not covered: no mechanic exists yet to measure (6, 7, 9, 10) or they are purely creative (8). | - | Yes |

---

## 1. The shop: card versus gold

**Finding.** With the current map, taking the 25 gold instead of a card is a bad choice as a standing policy at every shop price, because **gold is almost never spent**: a path passes through ~0.4 shops (0.1-0.9), and a policy that steers toward shops still ends the act holding ~130 gold on average. The price hardly matters; shop frequency and per-offer judgement do. Taking gold *when the three offered cards are weak* is clearly better than always taking a card.

**(a) The question.** "How much is gold worth against a card? Should the choice be a genuine toss-up (plan: avoid dominant or dominated choices)? What does a shop sell and for how much?"

**(b) What was measured.**

*What a card is worth* (`npm run balance -- picks --seeds 40`; HP per fight saved by adding the card, paired fights at full HP, smart bot; best-of-k = expected best card over random offers, valued as if the player judged perfectly):

| deck stage | one random card | best of 3 (reward) | best of 4 (shop) | offers whose best card adds <= 0.5 HP | best single removal |
|---|---|---|---|---|---|
| starter | 0.05 | 2.25 | 2.82 | 22% | 1.25 |
| mid (3 sampled decks) | -0.48 to 0.32 | 0.80 to 1.22 | 1.05 to 1.40 | 12-33% | 0.92-2.55 |
| late (3 sampled decks) | -0.15 to 0.26 | 0.36 to 0.80 | 0.49 to 0.93 | 34-72% | 1.20-1.55 |

Reading: a typical *random* card is worth about nothing (many dilute the deck); the best of three is worth 1-2 HP per fight early and under 1 later; the best of four (a shop shelf) is ~15-30% better than the best of three. Per-card values (guarded-strike 1.9, big-block 1.2, jab 0.8 best; bolt, sunder, expose -0.8 worst, averaged over stages) are in `balance/reports/design-evidence/picks.md`. With `greedy` the pattern is the same but best-of-3 stays ~2.3 through mid decks (`picks-greedy.md`).

*Whole acts* (`npm run balance -- gold --runs 300`; 25 gold per reward, shop of 4 cards, price varied in memory):

| policy (smart bot) | win rate | win vs always-card (paired) | final deck cost vs always-card (HP/fight) |
|---|---|---|---|
| always take the card | 54.0% [48.3, 59.6] | base | base (6.9) |
| price 20, always gold, route to shops | 27.3% | -26.7 [-32.8, -20.5] | +5.7 [+5.2, +6.2] |
| price 40, always gold, route to shops | 26.0% | -28.0 [-34.0, -22.0] | +5.9 [+5.4, +6.4] |
| price 80, always gold, route to shops | 21.3% | -32.7 [-38.5, -26.8] | +6.6 [+6.1, +7.0] |
| price 20, gold only if a shop is ahead | 50.0% | -4.0 [-9.9, +1.9] | +1.6 [+1.2, +2.0] |
| price 40, gold only if a shop is ahead | 50.7% | -3.3 [-9.0, +2.4] | +1.6 [+1.2, +2.0] |
| price 20, gold when the best card adds < 1 HP/fight | 68.3% | **+14.3** [+8.6, +20.1] | **-0.8** [-1.1, -0.5] |
| price 40, gold when the best card adds < 1 HP/fight | 68.7% | **+14.7** [+9.0, +20.4] | **-0.8** [-1.1, -0.5] |
| price 80, gold when the best card adds < 1 HP/fight | 67.0% | +13.0 [+7.3, +18.7] | -0.7 [-1.0, -0.4] |

(prices 30, 50, 60 are in the report and lie on the same lines.) With `greedy` the same ordering holds at smaller scale: always-gold -10 to -11 points; gold-when-weak +3.3 to +4.0 [+0.3, +6.9].

Reward gold amount does not rescue it: with 15, 25, 40 or 60 gold per reward and prices 20-60, always-gold still ends with a deck 5.6-6.6 HP per fight worse than always-card in every cell of the grid (`goldGrid` in `gold.md`). Gold is only unspent value.

SHOPFREQ

*Why*, as arithmetic: a gold pick is worth `(G / P) x (best-of-4 / best-of-3) x u` card-picks, where G is reward gold, P the card price, and u the chance the gold is ever spent. With the table above (ratio about 1.2 at mid stages):

| price P | gold per card pick, G = 25 | value of one gold pick, in card picks, if u = 1 | if u = 0.4 (today's shop frequency) |
|---|---|---|---|
| 20 | 1.25 | 1.5 | 0.6 |
| 30 | 0.83 | 1.0 | 0.4 |
| 40 | 0.63 | 0.75 | 0.3 |
| 60 | 0.42 | 0.5 | 0.2 |
| 80 | 0.31 | 0.38 | 0.15 |

Gold can only be a toss-up when `u` is near 1 and P is near G. Lumpiness matters too: at P = 40 and G = 25 a single gold pick buys nothing; two are needed.

**(c) Knobs and sensitivity.** Shop frequency (map shop weight / guaranteed shops) is the dominant knob (section 4: shop weight 5 -> 16 raises shops per path 0.4 -> 1.0). Price is second-order in every table above. Gold per reward is third. The *selection rule* (gold on weak offers) changes the result by 40 points, far more than any price.

**(d) What the simulator cannot say.** Whether players *want* a gold option, whether shopping feels good, whether a shelf of four is the right size, the fun of saving for something, and how real players judge "weak offer" (the bot knows each card's value; a person guesses). It also only models cards for sale; a shop selling relics, upgrades or services changes the values.

**(e) Mechanical consequences of each plausible choice.**
- *Flat price P, reward gold G = 25, shops as today (~0.4 per path):* gold is dominated as a standing policy at any P in 20-80. It is still chosen sensibly on weak offers (+14 points), so the choice exists only where offers vary; if every offer has a decent card the choice collapses to "card".
- *Price at or below G (<= 25) and about 1.5 shops per path:* one gold pick buys one shelf card (best of 4, ~15-30% better than best of 3), so gold is roughly a toss-up for a player who will meet a shop. Needs the shop-frequency table above to confirm the break-even.
- *Price above G (40+):* gold is lumpy; a single gold pick is worth nothing until combined with another, so taking gold early is a bet on future gold.
- *Removal service* (`npm run balance -- removal`): see 1b.
- *Gold from events* (+60) is worth ~0 HP at current shop frequency; making gold matter re-prices every gold event (section 3).

### 1b. Card removal

One removal (taking the best card out) is worth 0.92-2.55 HP/fight in mid decks and 1.2-1.55 in late ones (smart), more than the best of four shelf cards late (0.5-0.9) and comparable mid (1.05-1.4). Removing a Strike-type card specifically is worth -0.1 to 0.7 mid/late (`best basic-card removal`), i.e. removing *the right* card matters. Run-level (`removal`, gold + shop policy): a 25-gold removal ends with a deck 0.3-0.5 HP/fight better (win +2.0 [-0.9, +4.9], inconclusive); at 50-75 gold the effect is within noise because shops are rare. Mechanical consequence: below about the price of a card, removal dominates buying a card from mid-deck onward; above about 2x a card it is dominated late. `greedy` agrees on direction (best removal 1.8-4.9 HP mid, `picks-greedy.md`). Cannot say: whether a thinner deck is *fun* (it also makes the same cards repeat; section 8).

## 2. Relics: value in HP and win-rate units

**Finding.** The placeholder relics span a factor of ~30 in value. Two of them (Guard Token, Recovery Token) are each worth about **a third of the act's HP budget** (~30 HP) and move the whole-act win rate by 31-35 points (smart); the Strength Token is worth ~6 HP; Draw Token and the two synergy relics are near zero outside decks built for them. A relic therefore changes difficulty more than any other single item in the game.

**(a) The question.** "How strong should a relic be? How many, from where? Does a boss/shop relic change the game?"

**(b) Measured** (`npm run balance -- relics --runs 300 --seeds 30`).

*Fight level* (paired fights, change in HP lost per fight; negative = saves HP; smart bot):

| relic | starter deck | mid | late | synergy decks | between fights |
|---|---|---|---|---|---|
| strength-token (+1 Strength each fight) | +1.09 [+0.42, +1.76] (worse) | -0.75 [-1.06, -0.45] | -0.60 [-0.85, -0.35] | -0.79 [-0.95, -0.64] | |
| guard-token (6 block each fight) | -3.27 [-3.70, -2.85] | -3.67 [-3.92, -3.42] | -3.83 [-4.04, -3.61] | -3.45 [-3.57, -3.33] | |
| draw-token (+1 card each turn) | -0.23 | -0.09 | -0.31 | -1.50 [-1.72, -1.27] | |
| recovery-token (heal 4 per win) | 0 in fights | | | | +4 HP per fight won |
| vitality-token (+10 max HP) | 0 in fights | | | | +10 max HP once |
| exhaust-token (3 block per exhaust) | 0 | 0 | 0 | -1.15 [-1.25, -1.04] | |
| kill-token (draw on a kill) | +0.11 | +0.20 | -0.01 | -0.11 | |

(The Strength Token costing HP on the starter deck is a property of the `smart` bot, which spends the strength on speed; `greedy` shows -0.7 HP.)

*Whole act, starting with the relic* (upper bound on its value; paired runs):

| start with | win rate | win vs none | final deck cost |
|---|---|---|---|
| none | 54.0% | base | 6.9 |
| strength-token | 58.7% | +4.7 [+0.7, +8.7] | -0.5 |
| vitality-token | 69.3% | +15.3 [+11.1, +19.5] | -0.2 |
| guard-token | 85.0% | +31.0 [+25.6, +36.4] | -1.6 |
| recovery-token | 88.7% | +34.7 [+29.1, +40.2] | -0.5 |
| draw-token | 58.0% | +4.0 [-1.0, +9.0] (inconclusive) | -1.9 |
| exhaust-token / kill-token | 54.0% / 51.7% | 0 / -2.3 [-5.6, +0.9] | 0 / -0.1 |

With `greedy` (already winning 92%): strength +3.0, vitality +6.0, guard +7.3, recovery +7.0, draw +6.0 points (ceiling effect).

HPBUDGET

*HP-equivalents per act* (per-fight value x ~8.6 fights on a path): guard ~30 HP, recovery 4 x ~7.6 won fights = ~30 HP, vitality 10 HP, strength ~6 HP, draw 1-2 HP (about 13 in synergy decks), exhaust 0 (10 in an exhaust deck).

**(c) Knobs.** What matters is *how often the effect fires* and *what it replaces*: per-fight flat effects (block, heal) scale with the number of fights; conditional effects (exhaust, kill) are worth 0 in decks that never trigger them and 10+ HP in decks built on them. Count of relics: one per elite today, and a path meets ~0.5 elites (0.1-1.1), so an average act holds about half a relic; elite-seeking pathing gains +7.2 [+2.3, +12.0] points, so elites already read as worth taking.

**(d) Cannot say.** Whether a relic is fun or readable, whether a build-defining relic should exist, and how relics interact with *real* cards. Starting with a relic overstates the value of one found at floor 6.

**(e) Consequences.** A "tier" of relics would be: ~5 HP (a few win points), ~10 HP (+15), ~30 HP (decides the act); more than one 30-HP relic in an act pushes win rate to the ceiling for any bot that wins more than half the time. Boss or shop relics at 30-HP strength make the post-boss content (a second act) start far above its baseline. Frequency x strength is the budget: at ~0.5 relics per act today, a 10-HP average relic is worth ~5 HP per act (about +7 points).

## 3. Events: outcome values

**Finding.** In HP units the placeholder events are very uneven: *Rest here* (+15 HP) and *Pay for strength* (+8 max HP) are strong, *Take it* (+60 gold, -8 HP) is a bad trade, and *Study here* (a random card) is worth less than nothing on average (random cards dilute decks). **Gold is priced at ~0 by the current economy**, which is why "+60 gold for -8 HP" loses and "pay 50 gold" costs nothing.

**(a) Question.** "What should events offer, and how big should each outcome be? Do event fights give normal rewards?"

**(b) Measured** (`npm run balance -- events --runs 300`; each choice forced at every stop of that event, all other events left; compared with leaving every event, over runs that met the event; smart bot):

| event choice | runs | win vs leaving | HP carried into the boss | final deck cost |
|---|---|---|---|---|
| A: take it (+60 gold, -8 HP) | 128 | -13.3 [-19.9, -6.6] | -5.8 [-7.6, -4.1] | +0.3 |
| B: rest here (+15 HP) | 110 | **+16.4** [+8.9, +23.8] | +10.4 [+8.2, +12.5] | -0.2 |
| B: study here (random card) | 110 | -5.5 [-13.1, +2.1] | -0.8 | +0.6 [+0.1, +1.2] (worse) |
| C: fight for it (enemy B, then a relic) | 98 | +5.1 [-3.2, +13.4] | +4.5 [+1.2, +7.7] | -0.5 |
| D: pay 50 gold for +8 max HP | 123 | **+12.2** [+6.0, +18.4] | +12.2 [+10.4, +13.9] | -0.1 |

When gold is spent at shops ("rich" policy) the ranking is unchanged (A -15.8, B rest +22.1, C +6.8 inconclusive, D +13.5). With `greedy`: A -4.7, B rest +1.7, B study -4.2, C +0.9, D +2.4 points; HP at the boss moves the same way as for smart (A -3.7, B rest +4.2, D +10.5), so the *HP* values are bot-independent and only the win-rate translation differs.

HP-equivalents (from the HP at the boss column and the HP-budget table): 1 HP ~ 1 HP; +8 max HP ~ +10-12 HP carried to the boss (one heal-and-cap buffer); a random card ~ -1 HP (it hurts a deck on average); the relic from fight C ~ +4 HP net of the fight's cost; **60 gold ~ 0 HP** today.

**(c) Knobs.** The gold exchange rate (section 1) decides every gold-cost or gold-gain choice; HP outcomes are priced by section 2's conversion; a random card is worth the average pick in section 1 (about 0 at mid decks), a *chosen* card the best-of-3 (0.4-2.3).

**(d) Cannot say.** Whether a choice feels meaningful, text/theme, risk appetite (the bot takes the expected value; players avoid or seek variance), and the value of information. Event *fights* were measured as given (no card reward after them).

**(e) Consequences.** An event is a real choice only when options sit within a few HP-equivalents of each other; today every event has a clear best option (B rest > leave > B study; D pay > leave; A leave > take; C slightly positive). "Pay gold" is free when you hold none (the engine clamps gold at 0 but still gives the max HP), which is a rule consequence the owner may want to know: a cost the player cannot be charged is not a cost.

## 4. The map: shape, rules, and how much path choice matters

**Finding.** A path through today's act sees about **8.6 fights (boss included), 0.5 elites, 1.5 rests, 0.4 shops and 2.4 events**. Win rate responds strongly to *number of floors* and *rests per path* and not at all to lanes, climbs, or elite/shop floor thresholds. Path choice has more headroom than the bots use: the best path of a map offers about one more rest than the worst, and one more rest per path is worth tens of win points.

**(a) Question.** "How many floors/paths, what mix of stops, where do elites appear, treasure stops, more acts?"

**(b) Measured** (`npm run balance -- maps --runs 300 --maps 300`; static columns from 300 maps per row; run columns smart bot, 300 runs, paired by seed with the current shape, loosely since maps differ). Full tables in `maps.md`; the knobs:

| knob (current value) | values tried -> win rate (smart) |
|---|---|
| floors before the boss (12) | 8: 81.0% (+27.0); 10: 69.0% (+15.0); **12: 54.0%**; 14: 46.0% (-8.0); 16: 31.0% (-23.0) |
| rest weight (10 of 100) -> rests per path | 0: 1.0 -> 35.7% (-18.3); 5: 1.3 -> 44.3% (-9.7); **10: 1.5 -> 54.0%**; 18: 1.9 -> 68.0% (+14.0); 26: 2.1 -> 76.3% (+22.3) |
| first floor for rests (4) | 2: 60.7% (+6.7 [+1.1, +12.2]); **4: 54.0%**; 6: 48.0% (-6.0); 8: 43.0% (-11.0) |
| event weight (22) | 0: 36.0% (-18.0); 10: 41.0% (-13.0); **22: 54.0%**; 35: 65.3% (+11.3) |
| elite weight (8) / first floor (4) | 0 elites: +5.7 [-0.5, +11.9]; weight 20: 0.0; first floor 2: +2.0; 8: +4.7 [-1.4, +10.7]: all inside noise |
| shop weight (5) / first floor (3) | weight 0: -2.3; 10: +4.3; 16: +6.0 (shops per path 0.0 / 0.7 / 1.0); first floor 1: +3.3; 7: +4.0: inside noise |
| lanes (5), climbs (4) | 3-7 lanes: +/-2 points; 2-7 climbs: +6.3 to -3.7, all inside noise |

Static statistics for the current shape (300 maps): 66 distinct routes, 35 stops, 3.0 first-floor choices; elites per path 0.5 (a map's best/worst path: 0.1-1.1), rests 1.5 (1.1-2.1), shops 0.4 (0.1-0.9), events 2.4 (0.9-4.1). More climbs raise route count (8 routes at 2 climbs, 446 at 7) without changing what a typical path holds.

*Path choice* (`npm run balance -- paths --runs 600`): against random pathing, the "smart" rule (rest when hurt, shop with gold, elites when strong) gains +1.2 [-3.6, +6.0] points (inconclusive); never-elites +1.3; fight-seeking +1.2; shop-seeking -1.0; **elite-seeking +7.2 [+2.3, +12.0]** (smart bot; elites give relics and cost little HP, 12.8 per won elite). With `greedy` no path style differs from random (all within +/-3 of 94.7%). Observationally (random pathing, first 7 floors only): runs that passed one rest in floors 5-7 won 79.6% against 47.5% for none.

**(c) Sensitivity summary.** Win rate per additional floor: about -4 to -6 points; per +0.2 rests per path: +8 to +10 points; per event weight +13: +11 points (events are net HP-positive, and they replace fights). A longer map is "more of the same difficulty" because encounter strength does not rise with floor; if floors are added without changing encounters, difficulty rises only through attrition.

**(d) Cannot say.** Whether a map *looks* like a choice (readability), whether players plan routes, the tension of route risk, and treasure-stop or multi-act pacing. The bots look only one step ahead; a human reading the whole map can exploit the rest spread much better, so the true value of path choice is probably higher than measured.

**(e) Consequences.** Rest frequency is the actual difficulty dial (more than elites or the shop): each rest is ~18 HP, and the best vs worst path in a map differs by about one rest. If the owner wants route choice to matter, the generator's spread in rests per path (1.1-2.1) is the lever; if they want it not to matter, reduce the spread. Elites are currently almost free (low HP cost, relic reward): "avoid elites" is a bad rule here (never-elites does not help), which is a rule consequence, not a flaw in the bot. Adding floors without adding content or rests makes the act strictly harder at ~5 points per floor.

## 5. Rest stops: heal or upgrade, and what an upgrade is worth

**Finding.** **Heal dominates upgrade at the current numbers, at every floor, for both bots.** A rest heals ~17-19 HP (30% of 60) and nearly all of it is used (HP missing at a rest averages 25-43 for smart, 12-28 for greedy). The *best* upgrade the deck could take saves 1.9 HP per fight early and ~1.1 late, worth 9.4 HP over the rest of the act at floor 5 and ~1 HP at the last rest.

**(a) Question.** "What do upgrades do and what do rest stops offer beyond heal-or-upgrade?"

**(b) Measured** (`npm run balance -- rests --runs 300`; `npm run balance -- upgrades --seeds 40`).

By floor (smart; fights left from the map statistics):

| floor | HP a heal restores | HP missing at the stop | best upgrade, HP/fight | fights left | best upgrade over the rest of the act (HP) | average upgrade over the rest |
|---|---|---|---|---|---|---|
| 5 | 17.3 | 24.8 | 1.91 | 4.9 | 9.4 | 4.5 |
| 6 | 17.4 | 31.9 | 1.64 | 4.3 | 7.0 | 3.6 |
| 8 | 18.7 | 39.6 | 1.32 | 3.0 | 3.9 | 1.7 |
| 10 | 18.6 | 42.8 | 1.17 | 1.7 | 2.0 | 0.7 |
| 12 (before the boss) | 18.6 | 38.9 | 1.07 | 1.0 | 1.1 | 0.4 |

With `greedy`: heals 11.8-16.1 HP (it is hurt less), best upgrade over the rest 9.3 at floor 5 down to 1.0; heal still at least equal everywhere past floor 5.

Whole-act policies (smart / greedy win rate): always heal 54.3% / 92.3% (equal to the default mix); always upgrade a random card 28.0% / 78.0%; always upgrade the best card 30.7% / 80.7% (-23.3 / -11.7 points); heal under 50% HP else upgrade the best 52.3% / 91.7%. Upgrading still builds a better deck (final deck cost -0.3 to -0.6 HP/fight) but it costs more win rate than it buys.

**Heal fraction** (the 30% in memory; smart / greedy win): 0.2: 47.3% / 90.7% (-6.7 / -1.7); 0.3: 54.0% / 92.3%; 0.4: 60.7% / 94.0% (+6.7 / +1.3); 0.5: 63.3% / 94.0% (+9.3 / +1.7).

**Upgrade value per card** (HP per fight saved by upgrading it, mid decks; smart): defend -1.83, heavy-hit -1.56, focus -1.41 (cost 1 to 0), sunder -1.40, fortify -1.35, guarded-strike -1.11, strike -0.91, bolt -0.86, strengthen -0.75, weaken -0.66, big-block -0.60, jab -0.54, expose -0.45, quick-draw -0.04 (all with 95% intervals of about +/-0.2 in `upgrades.md`; `upgrades-greedy.md` for the other bot). The best upgrade costs a rest stop and saves 1.4-1.8 HP per fight, about the same as the best of three reward cards (section 1).

**(c) Knobs.** Heal fraction (about +/-6.7 win points per 0.1 for smart, +/-1.3 for greedy); upgrade strength (per-card numbers above, ~1 HP per fight average); rests per path (section 4).

**(d) Cannot say.** Whether choosing which card to upgrade is satisfying, whether a rest "feels" like a decision, and what a third rest option (the plan's open question) would be worth to a person.

**(e) Consequences.** *Heal 30%, upgrade as is:* the rest is a one-button stop; picking upgrade is a mistake unless HP is nearly full (a human who only upgrades at full HP would rarely have the chance: HP missing is 25+ HP at floor 5+). *To make it a toss-up* the upgrade would need ~2-3x today's value over the rest of the act, or the heal cut to ~0.2 (cost: -7 points smart). *Adding a third option* (e.g. removal at a rest): one removal is worth 0.9-2.6 HP per fight (section 1b), i.e. 3-20 HP over the rest of the act, so it is a live competitor to heal only early; at 18 HP of heal it is dominated late.

## 6. Relic/event/shop decisions in one currency

Put together, the same HP currency prices most things (smart bot; one HP of budget is about 1-1.5 win points near a 50% win rate):

| item | HP-equivalent over an act |
|---|---|
| a rest heal | 17-19 |
| +10 max HP | 10 (+15 win points measured) |
| Guard Token / Recovery Token | ~30 each |
| the best upgrade at floor 5 / floor 10 | 9 / 2 |
| removal (mid/late deck) | 0.9-2.6 per fight x fights left (about 4-13) |
| one card pick (best of 3) | 0.4-2.3 per fight x fights left (about 2-10) |
| 25 gold | ~0 now; up to ~one card pick if a shop is certain and P <= 30 |
| event B rest | 15; event D | +8 max HP ~ 10-12 |

HPBUDGETNOTE

## 7. The pressure curve: HP lost per fight by floor

**Finding.** The act is attritional: ordinary fights cost 5.7 HP on floors 1-3, step up to ~9.9 at floor 4 (where the early encounter list ends), then drift to ~7-8 as decks improve; the player enters floor 8+ fights with about 26 HP and **dies in ordinary fights on floors 7-11 (11-16% lost each)**, not in the boss (9.5% lost). Against the provisional bands the smart bot is inside everywhere except elites at floors 9-11, which are LOW (7-11 HP against 12-27); the boss at 21.3 HP is at the bottom edge of 21-42. With `greedy` every tier is LOW (3.9 / 6.7 / 11.1 HP) and the act is won 92% of the time, i.e. too easy by the bands.

**(a) Question.** "Where is the act too easy or too hard? What should the difficulty curve be?"

**(b) Measured** (`npm run balance -- pressure --runs 300`; HP lost in fights that were won, from decks the policies actually built; bands from `src/sim/targets.ts`, provisional):

| floor | tier | HP on entering | HP lost when won (smart) | lost | band |
|---|---|---|---|---|---|
| 1 | normal | 60.0 | 5.8 [5.5, 6.1] | 0% | 5-15 ok |
| 2-3 | normal | 54 / 50 | 5.7 / 5.7 | 0% | ok |
| 4 | normal | 45.8 | 9.9 [9.2, 10.6] | 0% | ok |
| 5-6 | normal | 38 / 35 | 9.7 / 9.4 | 0-3% | ok |
| 7 | normal | 28.5 | 8.6 [7.8, 9.4] | 12.9% | ok |
| 8-11 | normal | 26 | 7.1-7.9 | 11-16% | ok |
| 5-8 | elite | 30-42 | 13.5-15.6 | 0-14% | 12-27 ok |
| 9-11 | elite | 23-26 | 7.4-10.6 | 8-20% | LOW |
| 13 | boss | 41.9 | 21.3 [19.9, 22.6] | 9.5% | 21-42 ok (bottom) |

Tiers: normal 7.6 HP and 4.2 turns (in band); elite 12.8 HP, 5.9 turns (bottom of the band); boss 21.3 HP, 9.9 turns. Random-card drafting (smart bot): 29% wins, boss 26.9 HP; `greedy`: 92% wins.

**(c) Knobs.** HP entering fights (rests, relics, events: sections 2-5) matters more than fight strength; the encounter lists (`earlyFloors`, content) fix the shape; the bands are the owner's.

**(d) Cannot say.** What difficulty *feels* like, tilt, how fast real players learn, whether 54% (smart) or 92% (greedy) is closer to a human first-time win rate. The bands are provisional and were never tuned.

**(e) Consequences.** The curve is flat except one step at floor 4; there is no escalation between floors 5 and 11 apart from attrition. A rising curve needs content that scales (encounter strength per floor); more floors alone make the same fights cost more HP in total. The bot gap (54% vs 92%) is bigger than any single design knob, so *which player the owner is designing for* is the largest unknown in difficulty.

## 8. Deck size: thin versus fat

**Finding.** The two bots disagree in sign, so the simulator cannot settle thin-versus-fat. For `smart`, adding random reward cards helps (+10 cards: -3.4 HP/fight; +25: -3.9) and thinning below 8 hurts; for `greedy`, thin helps (8 cards: -4.8 HP/fight) and fat hurts (+30 cards: +3.3).

**(b) Measured** (`npm run balance -- decksize --seeds 20 --samples 8`; effect on HP lost per fight vs the starter deck, negative better):

| deck | smart | greedy |
|---|---|---|
| 6 cards (4 Strikes removed) | +1.19 [+0.73, +1.65] (win -9.4 points) | -2.97 [-3.41, -2.53] |
| 8 cards (2 Strikes removed) | -1.30 [-1.67, -0.93] | -4.77 [-5.09, -4.45] |
| starter, 10 | 0 | 0 |
| 14 | -2.12 [-2.57, -1.67] | -1.26 [-1.73, -0.79] |
| 20 | -3.05 [-3.52, -2.58] | +1.26 [+0.79, +1.73] |
| 30 | -3.56 [-4.06, -3.05] | +3.25 [+2.75, +3.76] |

Add and remove together (smart; cards added x basic cards removed): +3 cards: -1.47 with none removed, -0.96 with 2 removed, -0.42 with 4 removed; +10 cards: -3.36 / -3.00 / -2.93. So removing basics after adding cards *costs* `smart` a little; the reverse holds for the card-quality-sensitive `greedy` (`decksize-greedy.md`). In the earlier tool (`picks`), removing the *best single* card helps both bots 0.9-2.6 HP per fight, so it is *which* card leaves that matters.

**(c) Knobs.** Which cards are removed and what is added (these are *random reward cards*, not a drafted deck, so drafted decks do better), and the bot's play. **(d) Cannot say:** consistency, repetition, "the deck I built", variance. **(e) Consequences.** If thin decks are a design goal, removal prices must be tuned against a player who plays well, and the current bots cannot tell the owner whether thinning is net-good. This is the clearest case for a real playtest.

## 9. What a synergy-seeking draft reaches (toolkit result)

Offering every draftable card (not just the live reward pool), a random picker wins 24.7%; a trial-fight picker 62.7%; a synergy-seeking picker (trial gain plus overlap of mechanism labels with the deck) 63.0%, which is not distinguishable from the trial picker (paired difference of the two rows is within the interval of each against the base). The live reward-pool picker wins 61.0% with a deck 1 HP per fight worse (12.2 vs 11.2). The most any deck concentrates on one mechanism label is 1.7-1.8 cards (1.2 for the live pool): **no policy assembled an engine**, so the engine results of `synergy-findings-2026-10.md` describe decks the draft rarely produces. Command: `npm run balance -- synergy --runs 300`.

## 10. What was not measured, and how to reproduce

- Not measured: hero abilities, status cards, rarity (nothing to measure yet), real content, human behaviour. Nothing was played in a browser.
- Look-ahead path planning (a bot that reads the whole map), gold from events as a first-class resource, relics found mid-act (instead of at the start), and enemy scaling by floor were not modelled; the first would probably raise the value of path choice (section 4).
- Reproduce any table with the command named in its section; defaults are `--runs 200` (these reports used 300) and `--seeds 20` (these used 30-40); add `--skill greedy` for the second bot. `npm run balance:evidence` runs everything (long: about 15-20 minutes on a laptop at report sizes; `-- --quick` for a smoke run).
- Statistical note: run-level win rates need ~300 runs for +/-5 points; any "INCONCLUSIVE" or interval spanning zero in the reports is not a finding. Where a result changed sign between bots it is flagged above.
