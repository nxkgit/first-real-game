import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import type { CardDefinition, EnemyDefinition, EnemyMove } from './types';

// Test-only content, independent of src/data balance numbers (but using the real status rules).

const HIT: CardDefinition = {
  id: 'hit',
  name: 'Hit',
  type: 'attack',
  target: 'enemy',
  cost: 0,
  description: '',
  effects: [{ kind: 'damage', value: 10 }],
};
const weakenEnemy = (value: number): CardDefinition => ({
  id: 'weaken',
  name: 'Weaken',
  type: 'skill',
  target: 'enemy',
  cost: 0,
  description: '',
  effects: [{ kind: 'applyStatus', status: 'weak', value, to: 'enemy' }],
});
const exposeEnemy = (value: number): CardDefinition => ({
  id: 'expose',
  name: 'Expose',
  type: 'skill',
  target: 'enemy',
  cost: 0,
  description: '',
  effects: [{ kind: 'applyStatus', status: 'vulnerable', value, to: 'enemy' }],
});
const GAIN_STRENGTH: CardDefinition = {
  id: 'str',
  name: 'Str',
  type: 'power',
  cost: 0,
  description: '',
  effects: [{ kind: 'applyStatus', status: 'strength', value: 3, to: 'self' }],
};

const ATTACK_10: EnemyMove = { kind: 'attack', value: 10, name: 'Attack' };

function foe(pattern: EnemyMove[] = [ATTACK_10]): EnemyDefinition {
  return { id: 'dummy', name: 'Dummy', maxHp: 500, movePattern: pattern };
}

function started(deck: CardDefinition[], enemy: EnemyDefinition = foe()): CombatState {
  const combat = new CombatState(deck, enemy);
  combat.start();
  return combat;
}

function play(combat: CombatState, id: string): void {
  const card = combat.deck.hand.find((c) => c.definition.id === id);
  if (!card) throw new Error(`no ${id} in hand`);
  expect(combat.playCard(card.instanceId, card.definition.target)).toBe(true);
}

describe('statuses', () => {
  describe('Vulnerable', () => {
    it('makes the enemy take 50% more attack damage, rounded down', () => {
      const combat = started([exposeEnemy(2), HIT, HIT, HIT, HIT]);
      play(combat, 'expose');
      expect(combat.enemyStatuses.vulnerable).toBe(2);
      play(combat, 'hit');
      expect(combat.enemyHp).toBe(500 - 15);
    });

    it('lasts through the next player turn, then expires after the enemy acts', () => {
      const combat = started([exposeEnemy(2), HIT, HIT, HIT, HIT]);
      play(combat, 'expose');
      combat.endPlayerTurn(); // round 1 ends: 2 -> 1
      expect(combat.enemyStatuses.vulnerable).toBe(1);
      combat.endPlayerTurn(); // round 2 ends: 1 -> gone
      expect(combat.enemyStatuses.vulnerable).toBeUndefined();
    });

    it('stacks additively in duration', () => {
      const combat = started([exposeEnemy(2), exposeEnemy(3), HIT, HIT, HIT]);
      play(combat, 'expose');
      play(combat, 'expose');
      expect(combat.enemyStatuses.vulnerable).toBe(5);
    });
  });

  describe('Weak', () => {
    it("cuts the enemy's attack damage by 25%, rounded down", () => {
      const combat = started([weakenEnemy(1), HIT, HIT, HIT, HIT]);
      play(combat, 'weaken');
      combat.endPlayerTurn();
      expect(combat.playerHp).toBe(combat.playerMaxHp - 7); // 10 * 0.75 = 7.5 -> 7
    });

    it("also applies to the player's own attacks", () => {
      const hex: EnemyMove = { kind: 'applyStatus', value: 2, name: 'Hex', status: { id: 'weak', to: 'player' } };
      const combat = started(Array(10).fill(HIT), foe([hex]));
      combat.endPlayerTurn();
      expect(combat.playerStatuses.weak).toBe(2);
      play(combat, 'hit');
      expect(combat.enemyHp).toBe(500 - 7);
    });

    it('an enemy-applied debuff lasts through the next full round, not zero', () => {
      const hex: EnemyMove = { kind: 'applyStatus', value: 1, name: 'Hex', status: { id: 'weak', to: 'player' } };
      const combat = started(Array(10).fill(HIT), foe([hex, ATTACK_10]));
      combat.endPlayerTurn(); // enemy applies Weak 1; it must survive this round's tick
      expect(combat.playerStatuses.weak).toBe(1);
      combat.endPlayerTurn(); // enemy attacks, then Weak ticks off
      expect(combat.playerStatuses.weak).toBeUndefined();
    });
  });

  describe('Strength', () => {
    it('adds flat damage to each hit and never expires', () => {
      const combat = started([GAIN_STRENGTH, HIT, HIT, HIT, HIT]);
      play(combat, 'str');
      play(combat, 'hit');
      expect(combat.enemyHp).toBe(500 - 13);
      combat.endPlayerTurn();
      combat.endPlayerTurn();
      expect(combat.playerStatuses.strength).toBe(3);
    });

    it('applies before Weak and Vulnerable multiply', () => {
      const combat = started([GAIN_STRENGTH, exposeEnemy(1), HIT, HIT, HIT]);
      play(combat, 'str');
      play(combat, 'expose');
      play(combat, 'hit');
      expect(combat.enemyHp).toBe(500 - Math.floor(13 * 1.5)); // 19
    });

    it('an enemy can buff itself, and its attacks hit harder afterwards', () => {
      const buff: EnemyMove = { kind: 'applyStatus', value: 2, name: 'Rage', status: { id: 'strength', to: 'self' } };
      const combat = started(Array(10).fill(HIT), foe([buff, ATTACK_10]));
      combat.endPlayerTurn();
      expect(combat.enemyStatuses.strength).toBe(2);
      expect(combat.currentEnemyAttackDamage).toBe(12);
      combat.endPlayerTurn();
      expect(combat.playerHp).toBe(combat.playerMaxHp - 12);
    });
  });

  it('Vulnerable on the player makes enemy attacks hit harder', () => {
    const vuln: EnemyMove = { kind: 'applyStatus', value: 2, name: 'Mark', status: { id: 'vulnerable', to: 'player' } };
    const combat = started(Array(10).fill(HIT), foe([vuln, ATTACK_10]));
    combat.endPlayerTurn();
    combat.endPlayerTurn();
    expect(combat.playerHp).toBe(combat.playerMaxHp - 15);
  });

  it('reports a snapshot of the side and the delta on every change', () => {
    const combat = new CombatState([exposeEnemy(2), HIT, HIT, HIT, HIT], foe());
    const seen: string[] = [];
    combat.on('statusChanged', ({ target, status, delta, statuses }) =>
      seen.push(`${target}:${status}:${delta}:${statuses.vulnerable ?? 0}`)
    );
    combat.start();
    play(combat, 'expose');
    combat.endPlayerTurn();
    expect(seen).toEqual(['enemy:vulnerable:2:2', 'enemy:vulnerable:-1:1']);
  });
});
