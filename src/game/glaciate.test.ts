import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import type { DamageResult } from './CombatState';
import type { EnemyDefinition } from './types';
import { getCard } from '../data/cards';

// Issue #27: a tester reported "Glaciate did 19 damage instead of 24". Glaciate is 8 damage, tripled
// against a target with any Freeze (implementationplan.md): 24. The card did deal 24; the enemy's
// block absorbed some of it, and the enemy lost 24 minus its block (a move pattern in the game gives
// 5 block, which is exactly 19). These tests pin that the damage is 24 and that block, not the card,
// is what takes it down.

const FOE: EnemyDefinition = { id: 'foe', name: 'Foe', maxHp: 500, movePattern: [{ name: 'idle', effects: [{ kind: 'block', value: 0 }] }] };

function glaciate(freeze: number, block: number): { hpLost: number; dealt: DamageResult; preview: number | undefined } {
  const combat = new CombatState([getCard('glaciate'), ...Array(4).fill(getCard('strike'))], [FOE]);
  combat.start();
  const enemy = combat.enemies[0];
  if (freeze > 0) enemy.statuses.freeze = freeze;
  enemy.block = block;
  const card = combat.deck.hand.find((c) => c.definition.id === 'glaciate')!;
  const preview = combat.previewCardEffect(card.definition, card.definition.effects![0], enemy);
  let dealt: DamageResult | undefined;
  combat.on('damageDealt', (e) => (dealt = e));
  const before = enemy.hp;
  expect(combat.playCard(card.instanceId, enemy.id)).toBe(true);
  return { hpLost: before - enemy.hp, dealt: dealt!, preview };
}

describe('Glaciate against a frozen target (#27)', () => {
  it('shows and deals 24: 8 tripled by Freeze', () => {
    const r = glaciate(2, 0);
    expect(r.preview).toBe(24);
    expect(r.hpLost).toBe(24);
  });

  it('with 5 block on the target, still deals 24: block absorbs 5 and the target loses 19 HP', () => {
    const r = glaciate(2, 5);
    expect(r.preview).toBe(24);
    expect(r.dealt.amount).toBe(24); // the damage dealt, before block
    expect(r.dealt.absorbed).toBe(5);
    expect(r.hpLost).toBe(19);
  });

  it('deals 8 against a target with no Freeze (including right after the stacks stun it)', () => {
    expect(glaciate(0, 0).hpLost).toBe(8);
  });
});
