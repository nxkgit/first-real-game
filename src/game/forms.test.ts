import { describe, expect, it } from 'vitest';
import { CombatState } from './CombatState';
import { captureScenario, restoreScenario } from './scenario';
import { Rng } from './rng';
import { cardText } from './describe';
import type { CardDefinition, EnemyDefinition, HeroPowerDefinition } from '../model';
import { FORMS } from '../data/forms';
import { DRUID_HERO } from '../data/heroes';
import { PLACEHOLDER_FORM_A, PLACEHOLDER_FORM_B, PLACEHOLDER_TORTOISE_FORM } from '../data/druidCards';

// Druid forms (user, 2026-10-13): an effect that adds/removes Strength and Dexterity and swaps the picture.
// One form at a time; it ends at the start of the player's next turn or when another form is entered.

const def = (id: string, extra: Partial<CardDefinition>): CardDefinition => ({ id, name: id, type: 'skill', cost: 1, owner: 'test', inRewardPool: false, ...extra });
const DUMMY: EnemyDefinition = { id: 'dummy', name: 'Dummy', maxHp: 1000, movePattern: [{ name: 'Poke', effects: [{ kind: 'damage', value: 1 }] }] };

const FILLER = def('filler', { effects: [{ kind: 'block', value: 1 }] });
const BLOCK5 = def('block5', { effects: [{ kind: 'block', value: 5 }] });
const HIT7 = def('hit7', { type: 'attack', target: 'enemy', effects: [{ kind: 'damage', value: 7 }] });
const DRAW2 = def('draw2', { effects: [{ kind: 'draw', value: 2 }] });
const STRENGTH2 = def('strength2', { effects: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }] });
const DRAW_POWER: HeroPowerDefinition = { id: 'draw-power', name: 'Draw Power', owner: 'test', cost: 1, effects: [{ kind: 'draw', value: 1 }] };

function fight(deck: CardDefinition[], options: { heroPower?: HeroPowerDefinition } = {}): CombatState {
  const padded = [...deck, ...Array.from({ length: 30 }, () => FILLER)];
  const c = new CombatState(padded, [DUMMY], { rng: new Rng(7), maxEnergy: 9, ...options });
  c.start();
  // put the cards under test into the hand, whatever the shuffle did
  for (const card of deck) {
    if (!c.deck.hand.some((x) => x.definition === card)) {
      const found = c.deck.drawPile.find((x) => x.definition === card);
      if (found) {
        c.deck.drawPile.splice(c.deck.drawPile.indexOf(found), 1);
        c.deck.hand.push(found);
      }
    }
  }
  return c;
}
const inHand = (c: CombatState, d: CardDefinition) => c.deck.hand.find((x) => x.definition === d)!;
const play = (c: CombatState, d: CardDefinition, target?: string) => c.playCard(inHand(c, d).instanceId, target);

describe('entering a form', () => {
  it('Tortoise gives +3 Dexterity and -2 Strength, and its card gives 8 block (plus the Dexterity)', () => {
    const c = fight([PLACEHOLDER_TORTOISE_FORM]);
    const events: (string | null)[] = [];
    c.on('formChanged', (e) => events.push(e.form));
    expect(play(c, PLACEHOLDER_TORTOISE_FORM)).toBe(true);
    expect(c.form).toBe('tortoise');
    expect(c.player.statuses.dexterity).toBe(3);
    expect(c.player.statuses.strength).toBe(-2);
    expect(c.player.block).toBe(8 + 3);
    expect(events).toEqual(['tortoise']);
  });

  it('playing the same form again changes no stats and does the ifAlready effect instead (10 block)', () => {
    const c = fight([PLACEHOLDER_TORTOISE_FORM, PLACEHOLDER_TORTOISE_FORM]);
    play(c, PLACEHOLDER_TORTOISE_FORM);
    const events: (string | null)[] = [];
    c.on('formChanged', (e) => events.push(e.form));
    c.player.block = 0;
    const energyBefore = c.energy;
    play(c, PLACEHOLDER_TORTOISE_FORM);
    expect(events).toEqual([]);
    expect(c.player.statuses.dexterity).toBe(3);
    expect(c.player.statuses.strength).toBe(-2);
    expect(c.player.block).toBe(10 + 3);
    expect(c.energy).toBe(energyBefore - 1); // the second card still cost energy
  });

  it('another form replaces the first and takes back exactly what it gave, leaving card-given Strength alone', () => {
    const c = fight([STRENGTH2, PLACEHOLDER_TORTOISE_FORM, PLACEHOLDER_FORM_A]);
    play(c, STRENGTH2);
    play(c, PLACEHOLDER_TORTOISE_FORM);
    expect(c.player.statuses.strength).toBeUndefined(); // +2 from the card, -2 from Tortoise: exactly 0 is removed, not left as a 0 key
    play(c, PLACEHOLDER_FORM_A);
    expect(c.form).toBe('formA');
    expect(c.player.statuses.strength).toBe(2 + 3);
    expect(c.player.statuses.dexterity).toBe(-2);
  });

  it('ends at the start of the next turn, leaving Strength and Dexterity as they were', () => {
    const c = fight([STRENGTH2, PLACEHOLDER_TORTOISE_FORM]);
    play(c, STRENGTH2);
    play(c, PLACEHOLDER_TORTOISE_FORM);
    const events: (string | null)[] = [];
    c.on('formChanged', (e) => events.push(e.form));
    c.endPlayerTurn();
    expect(c.turnNumber).toBe(2);
    expect(c.form).toBeNull();
    expect(events).toEqual([null]);
    expect(c.player.statuses.strength).toBe(2);
    expect(c.player.statuses.dexterity).toBeUndefined();
  });
});

describe('negative Strength and Dexterity', () => {
  it('-2 Dexterity lowers block, and block never goes below 0', () => {
    const c = fight([PLACEHOLDER_FORM_A, BLOCK5]);
    play(c, PLACEHOLDER_FORM_A);
    expect(c.player.block).toBe(5 - 2); // Form A's own 5 block, with -2 Dexterity
    c.player.statuses.dexterity = -50;
    c.player.block = 0;
    play(c, BLOCK5);
    expect(c.player.block).toBe(0);
  });

  it('-2 Strength lowers damage, and damage never goes below 0', () => {
    const c = fight([PLACEHOLDER_TORTOISE_FORM, HIT7]);
    play(c, PLACEHOLDER_TORTOISE_FORM);
    play(c, HIT7, 'enemy-0');
    expect(c.enemies[0].hp).toBe(1000 - 5);
    c.player.statuses.strength = -50;
    expect(c.calcDamage(7, c.player, c.enemies[0])).toBe(0);
  });

  it('the live number on a card face follows Dexterity', () => {
    const c = fight([PLACEHOLDER_TORTOISE_FORM, BLOCK5]);
    play(c, PLACEHOLDER_TORTOISE_FORM);
    expect(c.previewCardEffect(BLOCK5, BLOCK5.effects![0], undefined)).toBe(5 + 3);
  });
});

describe('Form B: every card and hero power draw draws one more', () => {
  it('a card draw draws 3 instead of 2', () => {
    const c = fight([PLACEHOLDER_FORM_B, DRAW2]);
    play(c, PLACEHOLDER_FORM_B);
    const before = c.deck.hand.length;
    play(c, DRAW2);
    expect(c.deck.hand.length).toBe(before - 1 + 3);
  });

  it('without the form a draw is unchanged', () => {
    const c = fight([DRAW2]);
    const before = c.deck.hand.length;
    play(c, DRAW2);
    expect(c.deck.hand.length).toBe(before - 1 + 2);
  });

  it('the hero power draws one more', () => {
    const c = fight([PLACEHOLDER_FORM_B], { heroPower: DRAW_POWER });
    play(c, PLACEHOLDER_FORM_B);
    const before = c.deck.hand.length;
    c.useHeroPower();
    expect(c.deck.hand.length).toBe(before + 2);
  });

  it('a trigger draw never gets the bonus', () => {
    const trigger = def('trigger', { type: 'power', triggers: [{ on: 'cardPlayed', cardType: 'attack', effects: [{ kind: 'draw', value: 1 }] }] });
    const c = fight([PLACEHOLDER_FORM_B, trigger, HIT7]);
    play(c, trigger);
    play(c, PLACEHOLDER_FORM_B);
    const before = c.deck.hand.length;
    play(c, HIT7, 'enemy-0');
    expect(c.deck.hand.length).toBe(before - 1 + 1); // the trigger drew exactly 1
  });

  it('the start-of-turn draw is not changed', () => {
    const c = fight([PLACEHOLDER_FORM_B]);
    play(c, PLACEHOLDER_FORM_B);
    c.endPlayerTurn();
    expect(c.deck.hand.length).toBe(5);
  });
});

describe('forms in saved fights', () => {
  it('a scenario captured mid-form restores the form, its stats and its end', () => {
    const c = fight([PLACEHOLDER_TORTOISE_FORM, BLOCK5]);
    play(c, PLACEHOLDER_TORTOISE_FORM);
    const scenario = captureScenario(c);
    expect(scenario.form).toBe('tortoise');
    expect(scenario.player.statuses.strength).toBe(-2);
    const world = { cards: { [PLACEHOLDER_TORTOISE_FORM.id]: PLACEHOLDER_TORTOISE_FORM, block5: BLOCK5, filler: FILLER }, relics: {}, enemies: { dummy: DUMMY } };
    const restored = restoreScenario(JSON.parse(JSON.stringify(scenario)), world);
    expect(restored.form).toBe('tortoise');
    expect(restored.player.statuses.dexterity).toBe(3);
    restored.endPlayerTurn();
    expect(restored.form).toBeNull();
    expect(restored.player.statuses.dexterity).toBeUndefined();
  });
});

describe('the Druid placeholder content', () => {
  it('has the user-named hero and a 3-block, 1-cost hero power on Mage numbers', () => {
    expect(DRUID_HERO.name).toBe('Keeper of the Wild');
    expect(DRUID_HERO.heroPower.cost).toBe(1);
    expect(DRUID_HERO.heroPower.effects).toEqual([{ kind: 'block', value: 3 }]);
    expect(DRUID_HERO.maxHp).toBe(60);
    expect(DRUID_HERO.energy).toBe(4);
  });

  it('writes form card text from the data', () => {
    expect(cardText(PLACEHOLDER_TORTOISE_FORM)).toBe('Enter Tortoise form (+3 Dexterity, -2 Strength). Gain 8 block. If already in Tortoise form: gain 10 block.');
    expect(cardText(PLACEHOLDER_FORM_B)).toContain('Enter Form B (');
    expect(cardText(PLACEHOLDER_FORM_B)).toContain('draw 1 more');
    expect(FORMS.formA.stats).toEqual({ strength: 3, dexterity: -2 });
  });
});
