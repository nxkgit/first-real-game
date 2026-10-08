import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { ALL_SCALE_SOURCES, EFFECTS, acceptsScaling, intentIconOf } from './effects';
import { describeEffect } from './describe';
import { intentIcons } from './intent';
import type { Effect, EffectKind, EnemyDefinition } from './types';
import { CARDS } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { RELICS } from '../data/relics';
import { SYNERGY_CARDS } from '../data/synergyCards';
import { PLAYER_MAX_HP } from '../data/tunables';

/**
 * One sample of every effect kind. The `Record<EffectKind, ...>` type makes this fail to COMPILE when a
 * kind is added to the Effect union without a sample here, and the tests below then insist the
 * registry has an entry for it. That is the "adding a ninth kind" checklist (docs/EFFECTS.md).
 */
const SAMPLES: Record<EffectKind, Effect> = {
  damage: { kind: 'damage', value: 3 },
  block: { kind: 'block', value: 3 },
  draw: { kind: 'draw', value: 2 },
  applyStatus: { kind: 'applyStatus', status: 'weak', value: 2, to: 'target' },
  gainEnergy: { kind: 'gainEnergy', value: 1 },
  loseHp: { kind: 'loseHp', value: 2 },
  multiplyStatus: { kind: 'multiplyStatus', status: 'strength', factor: 2, to: 'self' },
  exhaustRandom: { kind: 'exhaustRandom', value: 1 },
  discardRandom: { kind: 'discardRandom', value: 1 },
  damageAll: { kind: 'damageAll', value: 3 },
  adjustTemperature: { kind: 'adjustTemperature', value: 1 },
  addCardToHand: { kind: 'addCardToHand', cardId: 'strike', value: 1 },
  gainEnergizedTurns: { kind: 'gainEnergizedTurns', value: 2 },
};
const KINDS = Object.keys(SAMPLES) as EffectKind[];

describe('effect registry', () => {
  it('has exactly one entry for every effect kind', () => {
    expect(Object.keys(EFFECTS).sort()).toEqual([...KINDS].sort());
  });

  it('every entry has the required parts', () => {
    for (const kind of KINDS) {
      const entry = EFFECTS[kind];
      expect(typeof entry.resolvePlayer, kind).toBe('function');
      expect(typeof entry.describe, kind).toBe('function');
      expect(Array.isArray(entry.scales), kind).toBe(true);
      expect(describeEffect(SAMPLES[kind]).length, `${kind} text`).toBeGreaterThan(0);
    }
  });

  it('a kind only shows an intent icon if enemies can perform it', () => {
    for (const kind of KINDS) {
      const entry = EFFECTS[kind];
      if (entry.intent?.icon || entry.intent?.damage || entry.intent?.block) expect(entry.resolveEnemy, kind).toBeDefined();
    }
    expect(KINDS.filter((k) => EFFECTS[k].resolveEnemy).sort()).toEqual(['applyStatus', 'block', 'damage']);
  });

  it('scaling: value-carrying kinds accept every source, the rest accept none', () => {
    for (const kind of KINDS) {
      const scales = EFFECTS[kind].scales;
      if (['multiplyStatus', 'exhaustRandom', 'discardRandom', 'adjustTemperature', 'gainEnergizedTurns'].includes(kind)) expect(scales, kind).toEqual([]);
      else expect([...scales].sort(), kind).toEqual([...ALL_SCALE_SOURCES].sort());
      expect(acceptsScaling(SAMPLES[kind]), kind).toBe(scales.length > 0);
    }
  });

  it('every scaling in the real content is one its effect kind accepts', () => {
    const effects: Effect[] = [];
    const cards = [...Object.values(CARDS), ...SYNERGY_CARDS];
    for (const c of cards) {
      effects.push(...(c.effects ?? []), ...(c.onTurnStartEffect ? [c.onTurnStartEffect] : []), ...(c.triggers ?? []).flatMap((t) => t.effects));
    }
    for (const r of Object.values(RELICS)) {
      effects.push(...(r.onCombatStart ?? []), ...(r.onTurnStart ?? []), ...(r.triggers ?? []).flatMap((t) => t.effects));
    }
    for (const e of Object.values(ENEMIES)) for (const m of e.movePattern) effects.push(...m.effects);
    for (const effect of effects) {
      const scaling = 'scaling' in effect ? effect.scaling : undefined;
      if (scaling) expect(EFFECTS[effect.kind].scales, effect.kind).toContain(scaling.per);
    }
  });

  it('intent icons come from the registry', () => {
    expect(intentIconOf(SAMPLES.damage)).toBe('attack');
    expect(intentIconOf(SAMPLES.block)).toBe('defend');
    expect(intentIconOf({ kind: 'applyStatus', status: 'weak', value: 1, to: 'self' })).toBe('buff');
    expect(intentIconOf(SAMPLES.applyStatus)).toBe('debuff');
    for (const kind of [
      'draw',
      'gainEnergy',
      'loseHp',
      'multiplyStatus',
      'exhaustRandom',
      'discardRandom',
      'damageAll',
      'adjustTemperature',
      'addCardToHand',
      'gainEnergizedTurns',
    ] as EffectKind[]) {
      expect(intentIconOf(SAMPLES[kind]), kind).toBeUndefined();
    }
    expect(intentIcons({ name: 'm', effects: KINDS.map((k) => SAMPLES[k]) })).toEqual(['attack', 'defend', 'debuff']);
  });

  it('player-only kinds do nothing in an enemy move; the others work', () => {
    const foe: EnemyDefinition = {
      id: 'f',
      name: 'F',
      maxHp: 20,
      movePattern: [{ name: 'all', effects: KINDS.map((k) => SAMPLES[k]) }],
    };
    const combat = new CombatState([], [foe], { random: () => 0.5 });
    combat.start();
    const energyBefore = combat.energy;
    combat.endPlayerTurn();
    expect(combat.player.hp).toBe(PLAYER_MAX_HP - 3); // damage only: loseHp 2 did not apply
    expect(combat.energy).toBe(energyBefore); // gainEnergy did not apply
    expect(combat.enemies[0].block).toBe(3);
    expect(combat.enemies[0].statuses.strength).toBeUndefined(); // multiplyStatus did nothing
  });

  it('an effect kind nobody has heard of is ignored, not a crash', () => {
    const odd = { kind: 'conjure', value: 3 } as unknown as Effect;
    const foe: EnemyDefinition = { id: 'f', name: 'F', maxHp: 20, movePattern: [{ name: 'odd', effects: [odd] }] };
    const combat = new CombatState([], [foe], { random: () => 0.5 });
    combat.start();
    expect(() => combat.endPlayerTurn()).not.toThrow();
    expect(describeEffect(odd)).toBe('');
    expect(intentIcons({ name: 'odd', effects: [odd] })).toEqual([]);
  });
});
