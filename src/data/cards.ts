import type { CardDefinition } from '../game/types';

// PLACEHOLDER content. Names/numbers/descriptions here are functional
// stand-ins to exercise the draw/play/discard loop for MVP 1 — final card
// design, naming, and flavor are the user's to author (see CLAUDE.md).

export const STRIKE: CardDefinition = {
  id: 'strike',
  name: 'Strike',
  type: 'attack',
  target: 'enemy',
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
  target: 'enemy',
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

// ---- MVP 2 reward pool ----
// PLACEHOLDER cards offered after winning a fight. Like the starter cards, these
// are functional stand-ins using only the existing damage/block/draw effects, with
// plain descriptive names — real card design is the user's (see CLAUDE.md). They
// differ in cost/shape so the card-vs-gold choice has something to weigh.

export const JAB: CardDefinition = {
  id: 'jab',
  name: 'Jab',
  type: 'attack',
  target: 'enemy',
  cost: 0,
  description: 'Deal 3 damage.',
  effects: [{ kind: 'damage', value: 3 }],
};

export const GUARDED_STRIKE: CardDefinition = {
  id: 'guarded-strike',
  name: 'Guarded Strike',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  description: 'Deal 5 damage. Gain 5 block.',
  effects: [
    { kind: 'damage', value: 5 },
    { kind: 'block', value: 5 },
  ],
};

export const HEAVY_HIT: CardDefinition = {
  id: 'heavy-hit',
  name: 'Heavy Hit',
  type: 'attack',
  target: 'enemy',
  cost: 3,
  description: 'Deal 24 damage.',
  effects: [{ kind: 'damage', value: 24 }],
};

export const BIG_BLOCK: CardDefinition = {
  id: 'big-block',
  name: 'Big Block',
  type: 'skill',
  cost: 2,
  description: 'Gain 13 block.',
  effects: [{ kind: 'block', value: 13 }],
};

export const QUICK_DRAW: CardDefinition = {
  id: 'quick-draw',
  name: 'Quick Draw',
  type: 'skill',
  cost: 1,
  description: 'Draw 2 cards.',
  effects: [{ kind: 'draw', value: 2 }],
};

export const FORTIFY: CardDefinition = {
  id: 'fortify',
  name: 'Fortify',
  type: 'power',
  cost: 2,
  description: 'At the start of each turn, gain 4 block.',
  onTurnStartEffect: { kind: 'block', value: 4 },
};

// ---- status-effect cards (Weak / Vulnerable / Strength) ----
// PLACEHOLDER, same caveat as above: plain descriptive names and rough numbers, just enough to
// exercise the three statuses in play.

export const WEAKEN: CardDefinition = {
  id: 'weaken',
  name: 'Weaken',
  type: 'skill',
  target: 'enemy',
  cost: 1,
  description: 'Apply 2 Weak.',
  effects: [{ kind: 'applyStatus', status: 'weak', value: 2, to: 'enemy' }],
};

export const EXPOSE: CardDefinition = {
  id: 'expose',
  name: 'Expose',
  type: 'skill',
  target: 'enemy',
  cost: 1,
  description: 'Apply 2 Vulnerable.',
  effects: [{ kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'enemy' }],
};

export const SUNDER: CardDefinition = {
  id: 'sunder',
  name: 'Sunder',
  type: 'attack',
  target: 'enemy',
  cost: 2,
  description: 'Deal 8 damage. Apply 2 Vulnerable.',
  effects: [
    { kind: 'damage', value: 8 },
    { kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'enemy' },
  ],
};

export const STRENGTHEN: CardDefinition = {
  id: 'strengthen',
  name: 'Strengthen',
  type: 'power',
  cost: 1,
  description: 'Gain 2 Strength.',
  effects: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }],
};

export const REWARD_POOL: CardDefinition[] = [
  JAB,
  GUARDED_STRIKE,
  HEAVY_HIT,
  BIG_BLOCK,
  QUICK_DRAW,
  FORTIFY,
  BOLT,
  WEAKEN,
  EXPOSE,
  SUNDER,
  STRENGTHEN,
];
