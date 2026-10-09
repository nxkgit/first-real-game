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

  // StS-style keyword statuses (engine-only, see implementationplan.md's "Keyword mechanics"): no
  // real card uses them yet, so these use raw test CardDefinitions like the rest of this file.
  describe('Frail (engine-only keyword)', () => {
    const FRAIL_SELF: CardDefinition = {
      id: 'frail-self',
      name: 'Frail Self',
      type: 'skill',
      cost: 0,
      owner: 'test',
      inRewardPool: false,
      effects: [{ kind: 'applyStatus', status: 'frail', value: 2, to: 'self' }],
    };
    const BLOCK_8: CardDefinition = {
      id: 'block-8',
      name: 'Block 8',
      type: 'skill',
      cost: 0,
      owner: 'test',
      inRewardPool: false,
      effects: [{ kind: 'block', value: 8 }],
    };

    it('reduces block gained by 25%, rounded down', () => {
      const combat = started([FRAIL_SELF, BLOCK_8]);
      play(combat, 'frail-self');
      play(combat, 'block-8');
      expect(combat.player.block).toBe(6); // 8 * 0.75 = 6
    });
  });

  describe('Intangible (engine-only keyword)', () => {
    const INTANGIBLE_SELF: CardDefinition = {
      id: 'intangible-self',
      name: 'Intangible Self',
      type: 'skill',
      cost: 0,
      owner: 'test',
      inRewardPool: false,
      effects: [{ kind: 'applyStatus', status: 'intangible', value: 1, to: 'self' }],
    };

    it('caps all damage taken at 1, however big the hit', () => {
      const bigHit = move('Smash', { kind: 'damage', value: 999 });
      const combat = started([INTANGIBLE_SELF, ...Array(4).fill(HIT)], foe([bigHit]));
      play(combat, 'intangible-self');
      combat.endPlayerTurn();
      expect(combat.player.hp).toBe(combat.player.maxHp - 1);
    });

    it('wears off after its duration like Weak/Vulnerable', () => {
      const bigHit = move('Smash', { kind: 'damage', value: 999 });
      const combat = started([INTANGIBLE_SELF, ...Array(4).fill(HIT)], foe([bigHit, bigHit]));
      play(combat, 'intangible-self');
      combat.endPlayerTurn(); // round 1: capped at 1, then the stack ticks off
      expect(combat.player.hp).toBe(combat.player.maxHp - 1);
      expect(combat.player.statuses.intangible).toBeUndefined();
      combat.endPlayerTurn(); // round 2: full damage again (999 far exceeds remaining HP, so it floors at 0)
      expect(combat.player.hp).toBe(0);
    });
  });

  describe('Buffer (engine-only keyword)', () => {
    const BUFFER_SELF: CardDefinition = {
      id: 'buffer-self',
      name: 'Buffer Self',
      type: 'skill',
      cost: 0,
      owner: 'test',
      inRewardPool: false,
      effects: [{ kind: 'applyStatus', status: 'buffer', value: 2, to: 'self' }],
    };

    it('prevents the next instance of HP loss entirely and is consumed one at a time', () => {
      const combat = started([BUFFER_SELF, ...Array(4).fill(HIT)], foe([ATTACK_10, ATTACK_10, ATTACK_10]));
      play(combat, 'buffer-self');
      expect(combat.player.statuses.buffer).toBe(2);
      combat.endPlayerTurn(); // hit 1: fully prevented
      expect(combat.player.hp).toBe(combat.player.maxHp);
      expect(combat.player.statuses.buffer).toBe(1);
      combat.endPlayerTurn(); // hit 2: fully prevented, stack used up
      expect(combat.player.hp).toBe(combat.player.maxHp);
      expect(combat.player.statuses.buffer).toBeUndefined();
      combat.endPlayerTurn(); // hit 3: no stacks left, full damage
      expect(combat.player.hp).toBe(combat.player.maxHp - 10);
    });

    it('does not block damage that block already absorbed (block first, buffer only for the rest)', () => {
      const BLOCK_SELF: CardDefinition = {
        id: 'block-self',
        name: 'Block Self',
        type: 'skill',
        cost: 0,
        owner: 'test',
        inRewardPool: false,
        effects: [{ kind: 'block', value: 100 }],
      };
      const combat = started([BUFFER_SELF, BLOCK_SELF, HIT, HIT, HIT], foe([ATTACK_10]));
      play(combat, 'buffer-self');
      play(combat, 'block-self');
      combat.endPlayerTurn(); // block absorbs it all; buffer is never touched
      expect(combat.player.hp).toBe(combat.player.maxHp);
      expect(combat.player.statuses.buffer).toBe(2);
    });
  });

  // Heating Up's real mechanic (user, 2026-10-09, QA #28): Heating Up gives Fuming for the rest of the
  // turn; while Fuming, each attack card played grants 1 Ignite after it resolves; Ignite multiplies
  // outgoing damage by 2^stacks. So the 1st attack after Heating Up is normal, then x2, x4, x8...
  // Attacks played before Heating Up never count. A damage effect can ignore Ignite (Scorching Wind).
  describe('Fuming and Ignite (Heating Up)', () => {
    const FUME_SELF: CardDefinition = {
      id: 'fume-self',
      name: 'Fume Self',
      type: 'skill',
      cost: 0,
      owner: 'test',
      inRewardPool: false,
      effects: [{ kind: 'applyStatus', status: 'fuming', value: 1, to: 'self' }],
    };
    const SCORCH: CardDefinition = {
      id: 'scorch',
      name: 'Scorch',
      type: 'attack',
      target: 'enemy',
      cost: 0,
      owner: 'test',
      inRewardPool: false,
      effects: [{ kind: 'damage', value: 10, ignoresStatuses: ['ignite'] }],
    };
    const EMPOWER_SELF: CardDefinition = {
      id: 'empower-self',
      name: 'Empower Self',
      type: 'skill',
      cost: 0,
      owner: 'test',
      inRewardPool: false,
      effects: [{ kind: 'applyStatus', status: 'empowered', value: 1, to: 'self' }],
    };

    it('Fuming grants 1 Ignite per attack, so attacks deal 1x, 2x, 4x, 8x', () => {
      const combat = started([FUME_SELF, HIT, HIT, HIT, HIT]);
      play(combat, 'fume-self');
      expect(combat.player.statuses.ignite).toBeUndefined(); // Heating Up itself gives no Ignite
      let expected = 500;
      for (const mult of [1, 2, 4, 8]) {
        play(combat, 'hit');
        expected -= 10 * mult;
        expect(combat.enemies[0].hp).toBe(expected);
      }
      expect(combat.player.statuses.ignite).toBe(4);
    });

    it('attacks played before Fuming never count', () => {
      const combat = started([HIT, HIT, FUME_SELF, HIT, HIT]);
      play(combat, 'hit');
      play(combat, 'hit');
      play(combat, 'fume-self');
      play(combat, 'hit'); // the 1st attack after Heating Up is normal, however many came before it
      expect(combat.enemies[0].hp).toBe(500 - 10 - 10 - 10);
      play(combat, 'hit');
      expect(combat.enemies[0].hp).toBe(500 - 10 - 10 - 10 - 20);
    });

    it('Fuming cannot stack higher than 1, and an attack still grants only 1 Ignite', () => {
      const combat = started([FUME_SELF, FUME_SELF, HIT, HIT, HIT]);
      play(combat, 'fume-self');
      play(combat, 'fume-self');
      expect(combat.player.statuses.fuming).toBe(1);
      play(combat, 'hit');
      expect(combat.player.statuses.ignite).toBe(1);
      play(combat, 'hit');
      expect(combat.player.statuses.ignite).toBe(2);
    });

    it('a skill grants no Ignite, only an attack card does', () => {
      const combat = started([FUME_SELF, EMPOWER_SELF, HIT, HIT, HIT]);
      play(combat, 'fume-self');
      play(combat, 'empower-self');
      expect(combat.player.statuses.ignite).toBeUndefined();
    });

    it('a damage effect that ignores Ignite deals its normal damage but still grants Ignite', () => {
      const combat = started([FUME_SELF, HIT, SCORCH, HIT, HIT]);
      play(combat, 'fume-self');
      play(combat, 'hit'); // 10, grants Ignite 1
      play(combat, 'hit'); // 20, grants Ignite 2
      const before = combat.enemies[0].hp;
      play(combat, 'scorch'); // ignores Ignite 2: normal 10
      expect(combat.enemies[0].hp).toBe(before - 10);
      expect(combat.player.statuses.ignite).toBe(3);
      const next = combat.enemies[0].hp;
      play(combat, 'hit'); // Ignite 3 -> x8
      expect(combat.enemies[0].hp).toBe(next - 80);
    });

    it('a damage effect that ignores Ignite still gets Strength, Empowered and the rest', () => {
      const combat = started([FUME_SELF, EMPOWER_SELF, SCORCH, HIT, HIT]);
      play(combat, 'fume-self');
      play(combat, 'hit');
      play(combat, 'empower-self');
      const before = combat.enemies[0].hp;
      play(combat, 'scorch'); // Empowered x2, Ignite ignored
      expect(combat.enemies[0].hp).toBe(before - 20);
    });

    it('Ignite stacks with Empowered (#29): the multipliers multiply', () => {
      const combat = started([FUME_SELF, EMPOWER_SELF, HIT, HIT, HIT]);
      play(combat, 'fume-self');
      play(combat, 'hit'); // Ignite 1 afterwards
      play(combat, 'empower-self');
      const before = combat.enemies[0].hp;
      play(combat, 'hit'); // Ignite 2^1 = 2, Empowered 2: 10 x 2 x 2
      expect(combat.enemies[0].hp).toBe(before - 40);
    });

    it('the live damage a card shows includes Ignite, except for a damage effect that ignores it (#28)', () => {
      const combat = started([FUME_SELF, HIT, HIT, HIT, SCORCH]);
      play(combat, 'fume-self');
      play(combat, 'hit');
      play(combat, 'hit'); // Ignite 2
      const target = combat.enemies[0];
      expect(combat.previewCardEffect(HIT, HIT.effects![0], target)).toBe(40);
      expect(combat.previewCardEffect(SCORCH, SCORCH.effects![0], target)).toBe(10);
    });

    it('Ignite and Fuming are not consumed by attacks, and both clear at the end of the turn', () => {
      const combat = started([FUME_SELF, HIT, HIT, HIT, HIT]);
      play(combat, 'fume-self');
      play(combat, 'hit');
      expect(combat.player.statuses.fuming).toBe(1);
      expect(combat.player.statuses.ignite).toBe(1);
      combat.endPlayerTurn();
      expect(combat.player.statuses.fuming).toBeUndefined();
      expect(combat.player.statuses.ignite).toBeUndefined();
      const before = combat.enemies[0].hp;
      play(combat, 'hit'); // a fresh turn: nothing active, normal damage and no Ignite granted
      expect(combat.enemies[0].hp).toBe(before - 10);
      expect(combat.player.statuses.ignite).toBeUndefined();
    });
  });

  it('Unplayable (engine-only keyword): can never be played, even with energy and a legal target', () => {
    const CURSED: CardDefinition = {
      id: 'cursed',
      name: 'Cursed',
      type: 'skill',
      target: 'enemy',
      cost: 0,
      owner: 'test',
      inRewardPool: false,
      unplayable: true,
      effects: [{ kind: 'block', value: 5 }],
    };
    const combat = started([CURSED, ...Array(4).fill(HIT)]);
    const card = combat.deck.hand.find((c) => c.definition.id === 'cursed')!;
    expect(combat.canPlay(card)).toBe(false);
    expect(combat.playCard(card.instanceId, 'enemy-0')).toBe(false);
    expect(combat.deck.hand).toContain(card);
  });
});
