# Scenarios

A **scenario** is an exact fight state written down as JSON: who the enemies are and where they are in their pattern, your HP, block, energy and statuses, the order of every card in the draw pile, your hand, the discard and exhaust piles, the powers in play, your relics, and where the fight's random stream is. Load one and the game puts you in precisely that situation, every time.

Use it to:

- keep trying one interaction between cards and effects without playing up to it each time;
- reproduce "I fought this boss with these cards in these piles at this HP" and send it to someone else as text;
- write a test that says "from this state, play these cards, expect this" (see "Using it in tests");
- (later, not built) be the starting position of a puzzle mode.

Source: `src/game/scenario.ts` (format, validation, conversion, test helper), `CombatState.exportState` and the `restore` option (`src/game/CombatState.ts`), `Deck.loadPiles`. Examples: `scenarios/*.json`. All plain TypeScript; no Phaser in the logic.

## Capturing and loading in the game

Add `?dev` to the address to get the dev panel (bottom-left; the backtick key folds it away).

1. **Capture:** during a fight, on your turn, click **Capture this fight**. The JSON is put in the box under the buttons and copied to the clipboard (if the browser refuses the copy, take it from the box).
2. **Load:** paste JSON into the box and click **Load scenario**. The fight screen restarts in exactly that state. A scenario that can't be read is refused with a message in the panel and nothing changes.

What the dev panel does with the run (a provisional choice, same as "Fight these here"):

- The run is only a stand-in. The scenario's own HP, relics and piles are used for the fight; the run's deck, HP and relics are not touched during it.
- The fight ends without a reward. **Continue** returns to the map, and the run's HP becomes the HP the fight ended with.
- The loaded scenario is not saved: refreshing the page restarts that stop as an ordinary fight against the same enemies.
- The run's own random stream is not used by a loaded scenario, so loading one doesn't change what the rest of the run rolls.

You can only capture on your turn, between plays (not during an enemy turn or after the fight has ended). The fight must have been started by the game itself (every normal fight is) so it has a seeded stream to read.

## The format

Everything except `enemies` is optional; what you leave out gets the default shown. Unknown fields are rejected (a typo like `"discrad"` is an error, not silently ignored). Ids are the ones in the content browser (`/content.html`) and the `id` fields in `src/data/`.

```json
{
  "version": 1,
  "name": "free text for people",
  "note": "free text for people",
  "rng": { "seed": 1234, "position": 1234 },
  "turn": 1,
  "energy": 4,
  "maxEnergy": 4,
  "player": { "hp": 60, "maxHp": 60, "block": 0, "statuses": { "strength": 1 } },
  "relics": ["strength-token"],
  "enemies": [
    { "id": "boss-a", "hp": 150, "block": 0, "statuses": { "vulnerable": 2 }, "moveIndex": 0 }
  ],
  "piles": {
    "draw": ["defend", "defend", "strike"],
    "hand": ["strike", "strike", "defend", "bolt", "focus"],
    "discard": [],
    "exhaust": [],
    "powers": []
  },
  "stats": { "cardsPlayedThisTurn": 0, "attacksPlayedThisTurn": 0, "taggedPlayedThisTurn": {}, "exhaustedThisCombat": 0 },
  "triggersFired": []
}
```

| Field | Meaning | Default |
|---|---|---|
| `version` | Format version. Must be 1 if present. | 1 |
| `rng` | The fight's random stream. `seed` is where it started, `position` where it is now. Shuffles and "exhaust a random card" take their numbers from it. | seed 1, position = seed (a fresh stream) |
| `turn` | Turn number (1 on the first turn). | 1 |
| `energy`, `maxEnergy` | Energy you have now, and the per-turn refill. | `maxEnergy` = the game's setting, `energy` = `maxEnergy` |
| `player` | HP (at least 1), max HP, block, statuses. | 60 / 60, no block, no statuses |
| `relics` | Relic ids, in order. | none |
| `enemies` | At least one, up to 8, in fight order (they become `enemy-0`, `enemy-1`, ...). `hp` can be 0 (already dead); not every enemy may be. `moveIndex` is which move of its pattern is next. | full HP, no block, no statuses, move 0 |
| `piles.draw` | **The first entry is drawn next.** | empty |
| `piles.hand` | Left to right, as shown. At most the hand limit (10). | empty |
| `piles.discard` | In the order cards got there. The order matters: when the draw pile runs out, the discard pile is shuffled using the stream, and the shuffle starts from this order. | empty |
| `piles.exhaust` | Exhausted cards, in order. | empty |
| `piles.powers` | Power cards already in play (played "before" the scenario starts), in the order they were played. They must be power cards. | empty |
| `stats` | Counters that "for each card played earlier this turn" style scaling reads. | zeros; `exhaustedThisCombat` = the length of `piles.exhaust` |
| `triggersFired` | One true/false for each reactive ability in force, in firing order: the relics' abilities first, then the powers' in the order played. `true` means it already fired this turn (matters for "once per turn" abilities). Leave it out for all false. If you give it, the length must match. | all false |

Statuses are `strength`, `empowered`, `weak`, `vulnerable`, each a whole number of stacks from 1 up. Card ids can be upgraded cards (`strike+`).

### What loading does and does not do

- It **does not** draw cards and **does not** run relics' "at the start of the fight" effects. The state you give is the state you get: if Strength Token matters, write `"strength": 1` under `player.statuses` (see `scenarios/boss-opening.json`).
- It **does** keep every reactive ability live: relics' abilities, and the abilities of the cards in `piles.powers`. A power already in play also keeps its "at the start of each turn" effect.
- The screen announces the hand and a "YOUR TURN" banner, as for any turn.
- Not captured, on purpose: the message log, the internal ids of card copies (so identical copies are interchangeable), and the "just applied" markers on statuses, which only matter during an enemy turn (a capture is always on your turn).

## How the random stream works (and what a scenario does and doesn't fix)

The stream is one list of numbers. Each random event (a shuffle, a random exhaust) takes the next numbers. A scenario fixes **where in the list the fight is**, not what you will do next. So:

- From the same scenario, playing the same cards in the same order gives the identical result, every time (including random choices).
- A different **order** can give a different result, and not only for the obvious reasons: a card that draws and triggers a reshuffle uses stream numbers, so a random effect played after it sees later numbers than one played before it.
- To make a random effect land the same whatever you play first, there is currently no way; a scenario for a no-randomness situation simply uses no random cards (and no reshuffle: keep the draw pile long enough).

## Writing one by hand

The smallest scenario is just an enemy: `{ "enemies": [{ "id": "enemy-a" }] }`. Add what you care about. The examples in `scenarios/` are written this way and are also used by the tests:

| File | What it sets up |
|---|---|
| `boss-opening.json` | The boss's first turn with a chosen hand and draw order. |
| `tag-a-combo.json` | A power already in play, a tagged-card combo with Empowered. Expected: Elite A loses 26 HP. |
| `random-exhaust.json` | Cull (random exhaust) with Exhaust Engine; always the same pick. |
| `exact-lethal.json` | Exactly lethal in one turn (Expose, Opportunist, Bolt): 18 + 18 = 36. Bolt first leaves 6 HP. |

When something is wrong the message names the field: `piles.hand[1]: unknown card "strkie" (did you mean "strike"?)`, `enemies[0].hp: 41 is out of range (0 to 40)`, `triggersFired: has 1 entries but these relics and powers give 0 reactive abilities`.

## Using it in tests

```ts
import { parseScenario, runScenario, captureScenario, restoreScenario, performPlays, recordEvents } from '../game/scenario';

const parsed = parseScenario({ enemies: [{ id: 'enemy-a', hp: 36 }], piles: { hand: ['expose', 'opportunist', 'bolt'] } });
if (!parsed.ok) throw new Error(parsed.error);

const run = runScenario(parsed.scenario, [{ card: 'expose' }, { card: 'opportunist' }, { card: 'bolt' }]);
run.phase;   // 'won'
run.events;  // every event the fight announced, card copies reduced to ids (comparable between runs)
run.final;   // the state after the last play as a Scenario, or null if the fight is over
```

- A play is `{ card: 'id', target?: enemyIndex }` (the first copy of that card in the hand; the first living enemy if no target) or `{ endTurn: true }`. An impossible play throws and names it ("play #2 (bolt): ...").
- To compare a live fight with its restoration: build the fight with a seeded `Rng` (`new CombatState(deck, enemies, { rng: new Rng(7) })`), play, `captureScenario(combat)`, `restoreScenario(...)`, call `start()`, then use `recordEvents` and `performPlays` on both and compare (see `src/game/scenario.test.ts`).
- `parseScenario(raw, world)` takes another set of cards, relics and enemies (`ScenarioWorld`) for tests that don't use the real content.
- `src/game/scenario.test.ts` also checks that every id in `scenarios/*.json` still exists, so renaming a card shows up as a test failure naming the file.

## Notes and limits

- **Content changes:** a scenario names content by id, so it follows a card's new numbers (it then plays with them), but a renamed or removed id makes it unreadable (the message says which).
- **Version:** if the shape changes, bump `SCENARIO_VERSION` and keep a reader for the old one or say plainly that old files are dropped (as saves are).
- **Not a save:** scenarios are never written to the player's browser storage and the run's save format is untouched.
- **Not a puzzle mode:** this is the groundwork (an exact state, a deterministic engine, a way to replay and check plays). A mode with a goal, a reset button, and so on is a design decision that has not been made.
