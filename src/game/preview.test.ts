import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { cardTagsText, cardText } from './describe';
import { ALL_SCALE_SOURCES, lowerIsBetterFor } from './effects';
import { Rng } from './rng';
import type { CardDefinition, Effect, EffectKind, EnemyDefinition, ScaleSource } from './types';
import { SYNERGY_CARDS } from '../data/synergyCards';

// The live numbers on card faces come from CombatState.previewCardEffect, which goes through the
// effect registry. The property tested here: what a card face says it will do is what playing it does.

const mk = (id: string, extra: Partial<CardDefinition> = {}): CardDefinition => ({
  id,
  name: id,
  type: 'skill',
  cost: 0,
  owner: 'test',
  inRewardPool: false,
  ...extra,
});

const FOE: EnemyDefinition = { id: 'foe', name: 'Foe', maxHp: 500, movePattern: [{ name: 'idle', effects: [{ kind: 'block', value: 0 }] }] };

/** Cards used to build up each scaling source before the card under test is played. */
const HELPERS: Record<string, CardDefinition> = {
  filler: mk('filler'),
  attacker: mk('attacker', { type: 'attack', target: 'enemy', effects: [{ kind: 'damage', value: 1 }] }),
  tagged: mk('tagged', { tags: ['tag-a'] }),
  guard: mk('guard', { effects: [{ kind: 'block', value: 7 }] }),
  flex: mk('flex', { effects: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }] }),
  expose: mk('expose', { type: 'attack', target: 'enemy', effects: [{ kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'target' }] }),
  burn: mk('burn', { exhaust: true }),
};

/** For each scaling source: which helper cards to play first so its count is above zero. */
const SETUP: Record<ScaleSource, string[]> = {
  cardsPlayedThisTurn: ['filler', 'filler'],
  attacksPlayedThisTurn: ['attacker', 'attacker'],
  taggedPlayedThisTurn: ['tagged', 'tagged'],
  block: ['guard'],
  strength: ['flex'],
  handSize: [],
  exhaustedThisCombat: ['burn', 'burn'],
  targetVulnerable: ['expose'],
};

type ScalingArg = { per: ScaleSource; value: number; tag?: string };

/** Every effect kind that shows a number, built with a scaling. */
const KINDS: Record<string, (scaling: ScalingArg) => Effect> = {
  damage: (scaling) => ({ kind: 'damage', value: 1, scaling }),
  block: (scaling) => ({ kind: 'block', value: 1, scaling }),
  draw: (scaling) => ({ kind: 'draw', value: 1, scaling }),
  gainEnergy: (scaling) => ({ kind: 'gainEnergy', value: 1, scaling }),
  applyStatus: (scaling) => ({ kind: 'applyStatus', status: 'strength', value: 1, to: 'self', scaling }),
  loseHp: (scaling) => ({ kind: 'loseHp', value: 1, scaling }),
};

function setup(per: ScaleSource, effect: Effect): { combat: CombatState; subject: CardDefinition } {
  const subject = mk('subject', { type: effect.kind === 'damage' ? 'attack' : 'skill', target: 'enemy', effects: [effect] });
  const rng = new Rng(7);
  const pad = Array.from({ length: 5 }, (_, i) => mk(`pad${i}`));
  const deck = [subject, ...Object.values(HELPERS).flatMap((h) => [h, h, h]), ...pad, ...pad.map((p) => mk(`${p.id}b`))];
  const combat = new CombatState(deck, [FOE], { random: () => rng.next() });
  combat.start();
  // start from a known hand: the subject, the helpers this source needs, and some padding
  combat.deck.drawPile.push(...combat.deck.hand.splice(0));
  const take = (id: string): void => {
    const i = combat.deck.drawPile.findIndex((c) => c.definition.id === id);
    if (i < 0) throw new Error(`no ${id} left to pull`);
    combat.deck.hand.push(...combat.deck.drawPile.splice(i, 1));
  };
  take('subject');
  for (const id of SETUP[per]) take(id);
  for (const id of ['pad0', 'pad1', 'pad2']) take(id);
  for (const id of SETUP[per]) {
    const inst = combat.deck.hand.find((c) => c.definition.id === id);
    if (!inst) throw new Error(`no ${id} in hand`);
    combat.playCard(inst.instanceId, inst.definition.target ? 'enemy-0' : undefined);
  }
  return { combat, subject };
}

describe('live numbers on card faces: preview matches playing the card', () => {
  for (const per of ALL_SCALE_SOURCES) {
    for (const [kind, build] of Object.entries(KINDS)) {
      it(`${kind} scaled by ${per}`, () => {
        const effect = build({ per, value: 2, tag: 'tag-a' });
        const { combat, subject } = setup(per, effect);
        const foe = combat.enemies[0];
        const preview = combat.previewCardEffect(subject, effect, foe);
        expect(preview, 'a preview for a kind that shows a number').toBeDefined();

        // measure what playing it really does
        const energyDeltas: number[] = [];
        combat.on('energyChanged', ({ delta }) => energyDeltas.push(delta));
        const before = {
          foeHp: foe.hp,
          block: combat.player.block,
          hand: combat.deck.hand.length,
          strength: combat.player.statuses.strength ?? 0,
          hp: combat.player.hp,
        };
        const inst = combat.deck.hand.find((c) => c.definition === subject)!;
        expect(combat.playCard(inst.instanceId, foe.id)).toBe(true);
        const actual: Record<string, number> = {
          damage: before.foeHp - foe.hp,
          block: combat.player.block - before.block,
          draw: combat.deck.hand.length - (before.hand - 1),
          gainEnergy: energyDeltas.reduce((a, b) => a + b, 0),
          applyStatus: (combat.player.statuses.strength ?? 0) - before.strength,
          loseHp: before.hp - combat.player.hp,
        };
        expect(preview).toBe(actual[kind]);
      });
    }
  }

  it('shows more than the printed number once a source has built up (so the green/red colouring has something to say)', () => {
    const effect: Effect = { kind: 'block', value: 1, scaling: { per: 'cardsPlayedThisTurn', value: 3 } };
    const { combat, subject } = setup('cardsPlayedThisTurn', effect);
    expect(combat.previewCardEffect(subject, effect, combat.enemies[0])).toBe(1 + 3 * 2);
  });

  it('shows damage after Weak and Vulnerable, and is the same number the play deals', () => {
    const effect: Effect = { kind: 'damage', value: 10 };
    const { combat, subject } = setup('handSize', effect);
    combat.player.statuses.weak = 1;
    combat.enemies[0].statuses.vulnerable = 1;
    const preview = combat.previewCardEffect(subject, effect, combat.enemies[0]);
    expect(preview).toBe(Math.floor(10 * 0.75 * 1.5));
  });

  it('shows no number for kinds that have none, and for damage with nothing to hit', () => {
    const { combat, subject } = setup('handSize', { kind: 'damage', value: 1 });
    expect(combat.previewCardEffect(subject, { kind: 'multiplyStatus', status: 'strength', factor: 2, to: 'self' }, undefined)).toBeUndefined();
    expect(combat.previewCardEffect(subject, { kind: 'exhaustRandom', value: 1 }, undefined)).toBeUndefined();
    expect(combat.previewCardEffect(subject, { kind: 'damage', value: 5 }, undefined)).toBeUndefined();
  });

  it('changes nothing in the fight', () => {
    const effect: Effect = { kind: 'damage', value: 3, scaling: { per: 'handSize', value: 1 } };
    const { combat, subject } = setup('handSize', effect);
    const snapshot = (): string =>
      JSON.stringify({
        hp: combat.player.hp,
        block: combat.player.block,
        energy: combat.energy,
        stats: combat.stats,
        hand: combat.deck.hand.map((c) => c.instanceId),
        draw: combat.deck.drawPile.map((c) => c.instanceId),
        foe: combat.enemies[0],
        log: combat.log.length,
      });
    const before = snapshot();
    for (let i = 0; i < 3; i++) combat.previewCardEffect(subject, effect, combat.enemies[0]);
    expect(snapshot()).toBe(before);
  });

  it('marks only self-damage as better when lower', () => {
    const kinds: Record<EffectKind, boolean> = {
      damage: false,
      block: false,
      draw: false,
      applyStatus: false,
      gainEnergy: false,
      loseHp: true,
      multiplyStatus: false,
      exhaustRandom: false,
    };
    for (const [kind, lower] of Object.entries(kinds)) {
      const effect = { kind, value: 1, status: 'strength', to: 'self', factor: 2 } as unknown as Effect;
      expect(lowerIsBetterFor(effect), kind).toBe(lower);
    }
  });

  it('the first living enemy and another enemy can show different numbers (Vulnerable on one only)', () => {
    const effect: Effect = { kind: 'damage', value: 10 };
    const subject = mk('strike', { type: 'attack', target: 'enemy', effects: [effect] });
    const rng = new Rng(3);
    const c = new CombatState([subject], [FOE, { ...FOE, id: 'foe2' }], { random: () => rng.next() });
    c.start();
    c.enemies[1].statuses.vulnerable = 2;
    expect(c.previewCardEffect(subject, effect, c.enemies[0])).toBe(10);
    expect(c.previewCardEffect(subject, effect, c.enemies[1])).toBe(15);
  });
});

describe('tags on card faces', () => {
  it('lists tags as a #-prefixed line, empty when there are none', () => {
    expect(cardTagsText(mk('a'))).toBe('');
    expect(cardTagsText(mk('b', { tags: [] }))).toBe('');
    expect(cardTagsText(mk('c', { tags: ['tag-a'] }))).toBe('#tag-a');
    expect(cardTagsText(mk('d', { tags: ['tag-a', 'tag-b'] }))).toBe('#tag-a #tag-b');
  });

  it('every placeholder synergy card that has tags yields a short line', () => {
    const tagged = SYNERGY_CARDS.filter((card) => card.tags?.length);
    expect(tagged.length).toBeGreaterThan(0);
    for (const card of tagged) expect(cardTagsText(card).length, card.id).toBeLessThanOrEqual(30);
  });

  it('live values replace the printed numbers in generated card text, for any effect kind', () => {
    const card = mk('combo', {
      effects: [
        { kind: 'block', value: 2, scaling: { per: 'cardsPlayedThisTurn', value: 3 } },
        { kind: 'draw', value: 1 },
      ],
    });
    expect(cardText(card)).toContain('+3 for each card played earlier this turn');
    const live = cardText(card, (e) => (e.kind === 'block' ? 8 : undefined));
    expect(live).toContain('Gain 8 block.');
    expect(live).not.toContain('+3 for each');
    expect(live).toContain('Draw 1 card.');
  });
});
