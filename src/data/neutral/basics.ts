import type { CardDefinition } from '../../model';

// The basic classless ("neutral") cards: the original placeholder set, usable by every hero. Strike and Defend are the starter
// deck's backbone. PLACEHOLDER numbers (the user's to tune); card text is generated from `effects` (game/describe.ts).
// Neutral cards must not use one hero's own mechanic (Temperature, Freeze, Radiant Light, forms): the content check enforces it.

export const STRIKE: CardDefinition = {
  id: 'strike',
  name: 'Strike',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [{ kind: 'damage', value: 6 }],
  upgrade: { effects: [{ kind: 'damage', value: 9 }] },
};

export const DEFEND: CardDefinition = {
  id: 'defend',
  name: 'Defend',
  type: 'skill',
  cost: 1,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [{ kind: 'block', value: 5 }],
  upgrade: { effects: [{ kind: 'block', value: 8 }] },
};

export const BOLT: CardDefinition = {
  id: 'bolt',
  name: 'Bolt',
  type: 'attack',
  target: 'enemy',
  cost: 2,
  owner: 'neutral',
  inRewardPool: false, // removed from the reward pool by the user, 2026-10-08
  inStarterPool: true,
  effects: [{ kind: 'damage', value: 12 }],
  upgrade: { effects: [{ kind: 'damage', value: 16 }] },
};

export const FOCUS: CardDefinition = {
  id: 'focus',
  name: 'Focus',
  type: 'power',
  cost: 1,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  onTurnStartEffect: { kind: 'draw', value: 1 },
  upgrade: { cost: 0 },
};

// ---- reward-pool cards ----
// Plain descriptive names and rough numbers; they differ in cost/shape so the card-vs-gold
// choice has something to weigh.

export const JAB: CardDefinition = {
  id: 'jab',
  name: 'Jab',
  type: 'attack',
  target: 'enemy',
  cost: 0,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [{ kind: 'damage', value: 3 }],
  upgrade: { effects: [{ kind: 'damage', value: 5 }] },
};

export const GUARDED_STRIKE: CardDefinition = {
  id: 'guarded-strike',
  name: 'Guarded Strike',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [
    { kind: 'damage', value: 5 },
    { kind: 'block', value: 5 },
  ],
  upgrade: {
    effects: [
      { kind: 'damage', value: 7 },
      { kind: 'block', value: 7 },
    ],
  },
};

export const HEAVY_HIT: CardDefinition = {
  id: 'heavy-hit',
  name: 'Heavy Hit',
  type: 'attack',
  target: 'enemy',
  cost: 3,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [{ kind: 'damage', value: 24 }],
  upgrade: { effects: [{ kind: 'damage', value: 32 }] },
};

export const BIG_BLOCK: CardDefinition = {
  id: 'big-block',
  name: 'Big Block',
  type: 'skill',
  cost: 2,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [{ kind: 'block', value: 13 }],
  upgrade: { effects: [{ kind: 'block', value: 18 }] },
};

export const QUICK_DRAW: CardDefinition = {
  id: 'quick-draw',
  name: 'Quick Draw',
  type: 'skill',
  cost: 1,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [{ kind: 'draw', value: 2 }],
  upgrade: { effects: [{ kind: 'draw', value: 3 }] },
};

export const FORTIFY: CardDefinition = {
  id: 'fortify',
  name: 'Fortify',
  type: 'power',
  cost: 2,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  onTurnStartEffect: { kind: 'block', value: 4 },
  upgrade: { onTurnStartEffect: { kind: 'block', value: 6 } },
};

// ---- status-effect cards (Weak / Vulnerable / Strength) ----

export const WEAKEN: CardDefinition = {
  id: 'weaken',
  name: 'Weaken',
  type: 'skill',
  target: 'enemy',
  cost: 1,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [{ kind: 'applyStatus', status: 'weak', value: 2, to: 'target' }],
  upgrade: { effects: [{ kind: 'applyStatus', status: 'weak', value: 3, to: 'target' }] },
};

export const EXPOSE: CardDefinition = {
  id: 'expose',
  name: 'Expose',
  type: 'skill',
  target: 'enemy',
  cost: 1,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [{ kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'target' }],
  upgrade: { effects: [{ kind: 'applyStatus', status: 'vulnerable', value: 3, to: 'target' }] },
};

export const SUNDER: CardDefinition = {
  id: 'sunder',
  name: 'Sunder',
  type: 'attack',
  target: 'enemy',
  cost: 2,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [
    { kind: 'damage', value: 8 },
    { kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'target' },
  ],
  upgrade: {
    effects: [
      { kind: 'damage', value: 11 },
      { kind: 'applyStatus', status: 'vulnerable', value: 3, to: 'target' },
    ],
  },
};

export const STRENGTHEN: CardDefinition = {
  id: 'strengthen',
  name: 'Strengthen',
  type: 'power',
  cost: 1,
  owner: 'neutral',
  inRewardPool: true,
  inStarterPool: true,
  effects: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }],
  upgrade: { effects: [{ kind: 'applyStatus', status: 'strength', value: 3, to: 'self' }] },
};

/** Every basic neutral card, in the order they are offered. */
export const BASIC_CARDS: CardDefinition[] = [
  STRIKE,
  DEFEND,
  BOLT,
  FOCUS,
  JAB,
  GUARDED_STRIKE,
  HEAVY_HIT,
  BIG_BLOCK,
  QUICK_DRAW,
  FORTIFY,
  WEAKEN,
  EXPOSE,
  SUNDER,
  STRENGTHEN,
];
