import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import type { CardDefinition, EnemyDefinition, EnemyMove } from './types';

const HIT: CardDefinition = {
  id: 'hit',
  name: 'Hit',
  type: 'attack',
  target: 'enemy',
  cost: 0,
  owner: 'test',
  inRewardPool: false,
  effects: [{ kind: 'damage', value: 10 }],
};
const EXPOSE: CardDefinition = {
  ...HIT,
  id: 'expose',
  effects: [{ kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'target' }],
};
const hit = (value: number): EnemyMove => ({ name: 'Attack', effects: [{ kind: 'damage', value }] });
const foe = (id: string, maxHp: number, ...pattern: EnemyMove[]): EnemyDefinition => ({
  id,
  name: id,
  maxHp,
  movePattern: pattern,
});

function started(enemies: EnemyDefinition[], deck: CardDefinition[] = [HIT, HIT, HIT, HIT, HIT]): CombatState {
  const combat = new CombatState(deck, enemies);
  combat.start();
  return combat;
}

describe('fights with several enemies', () => {
  it('gives each enemy its own id, HP and move position', () => {
    const combat = started([foe('a', 30, hit(1)), foe('b', 20, hit(2))]);
    expect(combat.enemies.map((e) => [e.id, e.hp])).toEqual([
      ['enemy-0', 30],
      ['enemy-1', 20],
    ]);
  });

  it('a card hits only the enemy it was aimed at', () => {
    const combat = started([foe('a', 30, hit(1)), foe('b', 30, hit(1))]);
    combat.playCard(combat.deck.hand[0].instanceId, 'enemy-1');
    expect(combat.enemies.map((e) => e.hp)).toEqual([30, 20]);
  });

  it('statuses land on the aimed enemy only', () => {
    const combat = started([foe('a', 30, hit(1)), foe('b', 30, hit(1))], [EXPOSE, HIT, HIT, HIT, HIT]);
    const expose = combat.deck.hand.find((c) => c.definition.id === 'expose');
    combat.playCard(expose!.instanceId, 'enemy-1');
    expect(combat.enemies[0].statuses.vulnerable).toBeUndefined();
    expect(combat.enemies[1].statuses.vulnerable).toBe(2);
  });

  it('rejects an unknown target, or a dead one', () => {
    const combat = started([foe('a', 5, hit(1)), foe('b', 30, hit(1))]);
    expect(combat.playCard(combat.deck.hand[0].instanceId, 'enemy-9')).toBe(false);
    expect(combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0')).toBe(true); // kills a
    expect(combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0')).toBe(false); // already dead
  });

  it('announces a death, and the fight continues until every enemy is down', () => {
    const combat = started([foe('a', 5, hit(1)), foe('b', 10, hit(1))]);
    const seen: string[] = [];
    combat.on('enemyDied', ({ enemyId }) => seen.push(enemyId));
    combat.on('combatEnded', ({ result }) => seen.push(result));
    combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0');
    expect(combat.phase).toBe('playerTurn');
    combat.playCard(combat.deck.hand[0].instanceId, 'enemy-1');
    expect(seen).toEqual(['enemy-0', 'enemy-1', 'won']);
  });

  it('every living enemy acts each round, in order; the dead stay out of it', () => {
    const combat = started([foe('a', 5, hit(3)), foe('b', 30, hit(4)), foe('c', 30, hit(5))]);
    const acted: string[] = [];
    combat.on('enemyMoveResolved', ({ enemyId }) => acted.push(enemyId));
    combat.endPlayerTurn();
    expect(acted).toEqual(['enemy-0', 'enemy-1', 'enemy-2']);
    expect(combat.player.hp).toBe(combat.player.maxHp - 12);

    combat.playCard(combat.deck.hand[0].instanceId, 'enemy-0'); // kills a
    acted.length = 0;
    combat.endPlayerTurn();
    expect(acted).toEqual(['enemy-1', 'enemy-2']);
  });

  it('stops the enemy phase as soon as the player falls', () => {
    const combat = started([foe('a', 30, hit(1000)), foe('b', 30, hit(1))]);
    const acted: string[] = [];
    combat.on('enemyMoveResolved', ({ enemyId }) => acted.push(enemyId));
    combat.endPlayerTurn();
    expect(combat.phase).toBe('lost');
    expect(acted).toEqual(['enemy-0']);
  });

  it('keeps each enemy on its own move pattern', () => {
    const combat = started([foe('a', 30, hit(1), hit(2)), foe('b', 30, hit(7))]);
    combat.endPlayerTurn();
    expect(combat.nextMove(combat.enemies[0]).effects).toEqual([{ kind: 'damage', value: 2 }]);
    expect(combat.nextMove(combat.enemies[1]).effects).toEqual([{ kind: 'damage', value: 7 }]);
  });

  it('refuses a fight with no enemies', () => {
    expect(() => new CombatState([HIT], [])).toThrow();
  });

  it('an enemy move can do several things at once: attack and debuff', () => {
    const combo: EnemyMove = {
      name: 'Combo',
      effects: [
        { kind: 'damage', value: 5 },
        { kind: 'applyStatus', status: 'weak', value: 1, to: 'target' },
      ],
    };
    const combat = started([foe('a', 30, combo)]);
    combat.endPlayerTurn();
    expect(combat.player.hp).toBe(combat.player.maxHp - 5);
    expect(combat.player.statuses.weak).toBe(1);
  });
});
