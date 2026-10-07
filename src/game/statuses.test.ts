import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import type { CardDefinition, Effect, EnemyDefinition, EnemyMove } from './types';

// Test-only content, independent of src/data balance numbers (but using the real status rules).

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
const weakenEnemy = (value: number): CardDefinition => ({
  id: 'weaken',
  name: 'Weaken',
  type: 'skill',
  target: 'enemy',
  cost: 0,
  owner: 'test',
  inRewardPool: false,
  effects: [{ kind: 'applyStatus', status: 'weak', value, to: 'target' }],
});
const exposeEnemy = (value: number): CardDefinition => ({
  id: 'expose',
  name: 'Expose',
  type: 'skill',
  target: 'enemy',
  cost: 0,
  owner: 'test',
  inRewardPool: false,
  effects: [{ kind: 'applyStatus', status: 'vulnerable', value, to: 'target' }],
});
const GAIN_STRENGTH: CardDefinition = {
  id: 'str',
  name: 'Str',
  type: 'power',
  cost: 0,
  owner: 'test',
  inRewardPool: false,
  effects: [{ kind: 'applyStatus', status: 'strength', value: 3, to: 'self' }],
};

const move = (name: string, ...effects: Effect[]): EnemyMove => ({ name, effects });
const ATTACK_10 = move('Attack', { kind: 'damage', value: 10 });
const debuffPlayer = (status: 'weak' | 'vulnerable', value: number): EnemyMove =>
  move('Debuff', { kind: 'applyStatus', status, value, to: 'target' });
const buffSelf = (value: number): EnemyMove => move('Rage', { kind: 'applyStatus', status: 'strength', value, to: 'self' });

function foe(pattern: EnemyMove[] = [ATTACK_10]): EnemyDefinition {
  return { id: 'dummy', name: 'Dummy', maxHp: 500, movePattern: pattern };
}

function started(deck: CardDefinition[], enemy: EnemyDefinition = foe()): CombatState {
  const combat = new CombatState(deck, [enemy]);
  combat.start();
  return combat;
}

function play(combat: CombatState, id: string): void {
  const card = combat.deck.hand.find((c) => c.definition.id === id);
  if (!card) throw new Error(`no ${id} in hand`);
  expect(combat.playCard(card.instanceId, card.definition.target && 'enemy-0')).toBe(true);
}

describe('statuses', () => {
  describe('Vulnerable', () => {
    it('makes the enemy take 50% more attack damage, rounded down', () => {
      const combat = started([exposeEnemy(2), HIT, HIT, HIT, HIT]);
      play(combat, 'expose');
      expect(combat.enemies[0].statuses.vulnerable).toBe(2);
      play(combat, 'hit');
      expect(combat.enemies[0].hp).toBe(500 - 15);
    });

    it('lasts through the next player turn, then expires after the enemy acts', () => {
      const combat = started([exposeEnemy(2), HIT, HIT, HIT, HIT]);
      play(combat, 'expose');
      combat.endPlayerTurn(); // round 1 ends: 2 -> 1
      expect(combat.enemies[0].statuses.vulnerable).toBe(1);
      combat.endPlayerTurn(); // round 2 ends: 1 -> gone
      expect(combat.enemies[0].statuses.vulnerable).toBeUndefined();
    });

    it('stacks additively in duration', () => {
      const combat = started([exposeEnemy(2), exposeEnemy(3), HIT, HIT, HIT]);
      play(combat, 'expose');
      play(combat, 'expose');
      expect(combat.enemies[0].statuses.vulnerable).toBe(5);
    });
  });

  describe('Weak', () => {
    it("cuts the enemy's attack damage by 25%, rounded down", () => {
      const combat = started([weakenEnemy(1), HIT, HIT, HIT, HIT]);
      play(combat, 'weaken');
      combat.endPlayerTurn();
      expect(combat.player.hp).toBe(combat.player.maxHp - 7); // 10 * 0.75 = 7.5 -> 7
    });

    it("also applies to the player's own attacks", () => {
      const hex = debuffPlayer('weak', 2);
      const combat = started(Array(10).fill(HIT), foe([hex]));
      combat.endPlayerTurn();
      expect(combat.player.statuses.weak).toBe(2);
      play(combat, 'hit');
      expect(combat.enemies[0].hp).toBe(500 - 7);
    });

    it('an enemy-applied debuff lasts through the next full round, not zero', () => {
      const hex = debuffPlayer('weak', 1);
      const combat = started(Array(10).fill(HIT), foe([hex, ATTACK_10]));
      combat.endPlayerTurn(); // enemy applies Weak 1; it must survive this round's tick
      expect(combat.player.statuses.weak).toBe(1);
      combat.endPlayerTurn(); // enemy attacks, then Weak ticks off
      expect(combat.player.statuses.weak).toBeUndefined();
    });
  });

  describe('Strength', () => {
    it('adds flat damage to each hit and never expires', () => {
      const combat = started([GAIN_STRENGTH, HIT, HIT, HIT, HIT]);
      play(combat, 'str');
      play(combat, 'hit');
      expect(combat.enemies[0].hp).toBe(500 - 13);
      combat.endPlayerTurn();
      combat.endPlayerTurn();
      expect(combat.player.statuses.strength).toBe(3);
    });

    it('applies before Weak and Vulnerable multiply', () => {
      const combat = started([GAIN_STRENGTH, exposeEnemy(1), HIT, HIT, HIT]);
      play(combat, 'str');
      play(combat, 'expose');
      play(combat, 'hit');
      expect(combat.enemies[0].hp).toBe(500 - Math.floor(13 * 1.5)); // 19
    });

    it('an enemy can buff itself, and its attacks hit harder afterwards', () => {
      const buff = buffSelf(2);
      const combat = started(Array(10).fill(HIT), foe([buff, ATTACK_10]));
      combat.endPlayerTurn();
      expect(combat.enemies[0].statuses.strength).toBe(2);
      expect(combat.intentDamage(combat.enemies[0])).toBe(12);
      combat.endPlayerTurn();
      expect(combat.player.hp).toBe(combat.player.maxHp - 12);
    });
  });

  it('Vulnerable on the player makes enemy attacks hit harder', () => {
    const vuln = debuffPlayer('vulnerable', 2);
    const combat = started(Array(10).fill(HIT), foe([vuln, ATTACK_10]));
    combat.endPlayerTurn();
    combat.endPlayerTurn();
    expect(combat.player.hp).toBe(combat.player.maxHp - 15);
  });

  it('reports a snapshot of the side and the delta on every change', () => {
    const combat = new CombatState([exposeEnemy(2), HIT, HIT, HIT, HIT], [foe()]);
    const seen: string[] = [];
    combat.on('statusChanged', ({ target, status, delta, statuses }) =>
      seen.push(`${target}:${status}:${delta}:${statuses.vulnerable ?? 0}`)
    );
    combat.start();
    play(combat, 'expose');
    combat.endPlayerTurn();
    expect(seen).toEqual(['enemy-0:vulnerable:2:2', 'enemy-0:vulnerable:-1:1']);
  });
});
