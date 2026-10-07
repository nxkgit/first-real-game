import type { CardDefinition } from '../game/types';

// PLACEHOLDER content. Names/numbers/descriptions here are functional
// stand-ins to exercise the draw/play/discard loop for MVP 1 — final card
// design, naming, and flavor are the user's to author (see CLAUDE.md).

export const STRIKE: CardDefinition = {
  id: 'strike',
  name: 'Strike',
  type: 'attack',
  cost: 1,
  description: 'Deal 6 damage.',
  effects: [{ kind: 'damage', value: 6 }],
};

export const DEFEND: CardDefinition = {
  id: 'defend',
  name: 'Defend',
  type: 'skill',
  cost: 1,
  description: 'Gain 5 block.',
  effects: [{ kind: 'block', value: 5 }],
};

export const BOLT: CardDefinition = {
  id: 'bolt',
  name: 'Bolt',
  type: 'attack',
  cost: 2,
  description: 'Deal 12 damage.',
  effects: [{ kind: 'damage', value: 12 }],
};

export const FOCUS: CardDefinition = {
  id: 'focus',
  name: 'Focus',
  type: 'power',
  cost: 1,
  description: 'At the start of each turn, draw 1 additional card.',
  onTurnStartEffect: { kind: 'draw', value: 1 },
};

/**
 * MVP 1 starter deck. Placeholder composition (mirrors StS's starter-deck
 * shape) chosen just to exercise every card type — attack, skill, power —
 * plus damage/block/draw effects and the cost/energy system.
 */
export function buildStarterDeck(): CardDefinition[] {
  return [STRIKE, STRIKE, STRIKE, STRIKE, DEFEND, DEFEND, DEFEND, DEFEND, BOLT, FOCUS];
}
