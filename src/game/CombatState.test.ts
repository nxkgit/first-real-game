import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import type { CardDefinition, CardInstance, EnemyDefinition, EnemyMove } from './types';

// Test-only content, independent of the placeholder data in src/data so balance tweaks there
// don't break these rule checks.

const HIT: CardDefinition = {
  id: 'hit',
  name: 'Hit',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  owner: 'test',
  inRewardPool: false,
  effects: [{ kind: 'damage', value: 6 }],
};
const BIG_HIT: CardDefinition = { ...HIT, id: 'big-hit', name: 'Big Hit', cost: 5, effects: [{ kind: 'damage', value: 50 }] };
const GUARD: CardDefinition = {
  id: 'guard',
  name: 'Guard',
  type: 'skill',
  cost: 1,
  owner: 'test',
  inRewardPool: false,
  effects: [{ kind: 'block', value: 5 }],
};
const INSIGHT: CardDefinition = {
  id: 'insight',
  name: 'Insight',
  type: 'power',
  cost: 1,
  owner: 'test',
  inRewardPool: false,
  onTurnStartEffect: { kind: 'draw', value: 1 },
};

const hit = (value: number, name = 'Attack'): EnemyMove => ({ name, effects: [{ kind: 'damage', value }] });
const gainBlock = (value: number, name = 'Defend'): EnemyMove => ({ name, effects: [{ kind: 'block', value }] });

function enemy(overrides: Partial<EnemyDefinition> = {}): EnemyDefinition {
  return {
    id: 'dummy',
    name: 'Dummy',
    maxHp: 30,
    movePattern: [hit(8)],
    ...overrides,
  };
}

function started(deck: CardDefinition[], foe = enemy()): CombatState {
  const combat = new CombatState(deck, [foe]);
  combat.start();
  return combat;
}

function inHand(combat: CombatState, id: string): CardInstance {
  const found = combat.deck.hand.find((c) => c.definition.id === id);
  if (!found) throw new Error(`no ${id} in hand`);
  return found;
}

describe('CombatState', () => {
  it('starts the first turn with a full hand and full energy', () => {
    const combat = started(Array(10).fill(GUARD));
    expect(combat.phase).toBe('playerTurn');
    expect(combat.deck.hand).toHaveLength(5);
    expect(combat.energy).toBe(combat.maxEnergy);
  });

  describe('targeting', () => {
    it('rejects an enemy-targeted card played without a target', () => {
      const combat = started(Array(5).fill(HIT));
      const card = combat.deck.hand[0];
      expect(combat.playCard(card.instanceId)).toBe(false);
      expect(combat.deck.hand).toContain(card);
      expect(combat.energy).toBe(combat.maxEnergy);
      expect(combat.enemies[0].hp).toBe(30);
    });

    it('plays an enemy-targeted card onto the enemy', () => {
      const combat = started(Array(5).fill(HIT));
      expect(combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0')).toBe(true);
      expect(combat.enemies[0].hp).toBe(24);
      expect(combat.energy).toBe(combat.maxEnergy - 1);
      expect(combat.deck.hand).toHaveLength(4);
      expect(combat.deck.discardPile).toHaveLength(1);
    });

    it('plays untargeted cards without a target', () => {
      const combat = started(Array(5).fill(GUARD));
      expect(combat.playCard(combat.deck.hand[0].instanceId)).toBe(true);
      expect(combat.player.block).toBe(5);
    });
  });

  it('refuses a card that costs more energy than is left', () => {
    const combat = started([BIG_HIT, GUARD, GUARD, GUARD, GUARD]);
    expect(combat.canPlay(inHand(combat, 'big-hit'))).toBe(false);
    expect(combat.playCard(inHand(combat, 'big-hit').instanceId, 'enemy-0')).toBe(false);
  });

  it('runs out of energy after spending it all', () => {
    const combat = started(Array(10).fill(GUARD));
    for (let i = 0; i < combat.maxEnergy; i++) {
      expect(combat.playCard(combat.deck.hand[0].instanceId)).toBe(true);
    }
    expect(combat.energy).toBe(0);
    expect(combat.playCard(combat.deck.hand[0].instanceId)).toBe(false);
  });

  it('absorbs enemy damage with player block, then resets block next turn', () => {
    const combat = started(Array(10).fill(GUARD));
    combat.playCard(combat.deck.hand[0].instanceId); // 5 block
    combat.endPlayerTurn(); // enemy attacks for 8
    expect(combat.player.hp).toBe(combat.player.maxHp - 3);
    expect(combat.player.block).toBe(0);
    expect(combat.phase).toBe('playerTurn');
  });

  it('enemy block absorbs damage, and resets at the start of the enemy turn', () => {
    const combat = started(
      Array(10).fill(HIT),
      enemy({
        movePattern: [
          gainBlock(10),
          hit(1, 'Poke'),
        ],
      })
    );
    combat.endPlayerTurn(); // enemy defends for 10
    expect(combat.enemies[0].block).toBe(10);
    combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0'); // 6 into 10 block
    expect(combat.enemies[0].block).toBe(4);
    expect(combat.enemies[0].hp).toBe(30);
    combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0'); // 4 absorbed, 2 through
    expect(combat.enemies[0].block).toBe(0);
    expect(combat.enemies[0].hp).toBe(28);
  });

  it('ending the turn runs discard, then the enemy move, then the draw, each with its own hand snapshot', () => {
    const combat = new CombatState(Array(12).fill(GUARD), [enemy()]);
    const events: string[] = [];
    combat.on('handChanged', ({ hand, drawPile, discardPile }) =>
      events.push(`hand:${hand.length} draw:${drawPile} discard:${discardPile}`)
    );
    combat.on('enemyTurnStarted', () => events.push('enemyTurn'));
    combat.on('enemyMoveResolved', ({ move }) => events.push(`enemy:${move.name}`));
    combat.on('turnStarted', () => events.push('yourTurn'));
    combat.start();
    events.length = 0;

    combat.endPlayerTurn();
    expect(events).toEqual([
      'hand:0 draw:7 discard:5', // your hand is discarded first
      'enemyTurn',
      'enemy:Attack',
      'hand:5 draw:2 discard:5', // only then is the next hand drawn
      'yourTurn',
    ]);
  });

  it('hand snapshots are copies, unaffected by later changes to the live hand', () => {
    const combat = new CombatState(Array(12).fill(GUARD), [enemy()]);
    const snapshots: CardInstance[][] = [];
    combat.on('handChanged', ({ hand }) => snapshots.push(hand));
    combat.start();
    combat.endPlayerTurn();
    expect(snapshots.map((h) => h.length)).toEqual([5, 0, 5]);
  });

  it('cycles through the enemy move pattern and exposes the upcoming move', () => {
    const combat = started(
      Array(10).fill(GUARD),
      enemy({
        movePattern: [
          hit(1, 'A'),
          gainBlock(2, 'B'),
        ],
      })
    );
    expect(combat.nextMove(combat.enemies[0]).name).toBe('A');
    combat.endPlayerTurn();
    expect(combat.nextMove(combat.enemies[0]).name).toBe('B');
    combat.endPlayerTurn();
    expect(combat.nextMove(combat.enemies[0]).name).toBe('A');
  });

  it('a power card applies its effect at the start of each later turn', () => {
    const combat = started([INSIGHT, ...Array(14).fill(GUARD)]);
    // INSIGHT may not be in the opening hand; cycle turns until it is
    for (let i = 0; i < 5 && !combat.deck.hand.some((c) => c.definition.id === 'insight'); i++) {
      combat.endPlayerTurn();
    }
    combat.playCard(inHand(combat, 'insight').instanceId);
    combat.endPlayerTurn();
    expect(combat.deck.hand).toHaveLength(6);
  });

  it('wins when the enemy reaches 0 HP and emits combatEnded', () => {
    const combat = new CombatState(Array(10).fill(HIT), [enemy({ maxHp: 12 })]);
    const results: string[] = [];
    combat.on('combatEnded', ({ result }) => results.push(result));
    combat.start();
    combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0');
    combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0');
    expect(combat.enemies[0].hp).toBe(0);
    expect(combat.phase).toBe('won');
    expect(results).toEqual(['won']);
    expect(combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0')).toBe(false); // no plays after the fight
  });

  it('loses when the player reaches 0 HP', () => {
    const combat = started(
      Array(10).fill(GUARD),
      enemy({ movePattern: [hit(1000, 'Crush')] })
    );
    combat.endPlayerTurn();
    expect(combat.player.hp).toBe(0);
    expect(combat.phase).toBe('lost');
  });
});
