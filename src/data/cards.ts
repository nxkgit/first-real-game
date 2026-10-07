import type { CardDefinition } from '../game/types';

// PLACEHOLDER content. Names/numbers here are functional stand-ins to exercise the game's
// systems — final card design, naming, and flavor are the user's to author (see CLAUDE.md).
// Card text is generated from `effects` (game/describe.ts), so numbers live in one place.

/** The only hero so far. Cards belong to a hero by id, or to 'neutral' for cards any hero can use. */
export const MAGE = 'mage';

export const STRIKE: CardDefinition = {
  id: 'strike',
  name: 'Strike',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  owner: MAGE,
  inRewardPool: false,
  effects: [{ kind: 'damage', value: 6 }],
};

export const DEFEND: CardDefinition = {
  id: 'defend',
  name: 'Defend',
  type: 'skill',
  cost: 1,
  owner: MAGE,
  inRewardPool: false,
  effects: [{ kind: 'block', value: 5 }],
};

export const BOLT: CardDefinition = {
  id: 'bolt',
  name: 'Bolt',
  type: 'attack',
  target: 'enemy',
  cost: 2,
  owner: MAGE,
  inRewardPool: true,
  effects: [{ kind: 'damage', value: 12 }],
};

export const FOCUS: CardDefinition = {
  id: 'focus',
  name: 'Focus',
  type: 'power',
  cost: 1,
  owner: MAGE,
  inRewardPool: false,
  onTurnStartEffect: { kind: 'draw', value: 1 },
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
  owner: MAGE,
  inRewardPool: true,
  effects: [{ kind: 'damage', value: 3 }],
};

export const GUARDED_STRIKE: CardDefinition = {
  id: 'guarded-strike',
  name: 'Guarded Strike',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
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
  owner: MAGE,
  inRewardPool: true,
  effects: [{ kind: 'damage', value: 24 }],
};

export const BIG_BLOCK: CardDefinition = {
  id: 'big-block',
  name: 'Big Block',
  type: 'skill',
  cost: 2,
  owner: MAGE,
  inRewardPool: true,
  effects: [{ kind: 'block', value: 13 }],
};

export const QUICK_DRAW: CardDefinition = {
  id: 'quick-draw',
  name: 'Quick Draw',
  type: 'skill',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  effects: [{ kind: 'draw', value: 2 }],
};

export const FORTIFY: CardDefinition = {
  id: 'fortify',
  name: 'Fortify',
  type: 'power',
  cost: 2,
  owner: MAGE,
  inRewardPool: true,
  onTurnStartEffect: { kind: 'block', value: 4 },
};

// ---- status-effect cards (Weak / Vulnerable / Strength) ----

export const WEAKEN: CardDefinition = {
  id: 'weaken',
  name: 'Weaken',
  type: 'skill',
  target: 'enemy',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  effects: [{ kind: 'applyStatus', status: 'weak', value: 2, to: 'target' }],
};

export const EXPOSE: CardDefinition = {
  id: 'expose',
  name: 'Expose',
  type: 'skill',
  target: 'enemy',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  effects: [{ kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'target' }],
};

export const SUNDER: CardDefinition = {
  id: 'sunder',
  name: 'Sunder',
  type: 'attack',
  target: 'enemy',
  cost: 2,
  owner: MAGE,
  inRewardPool: true,
  effects: [
    { kind: 'damage', value: 8 },
    { kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'target' },
  ],
};

export const STRENGTHEN: CardDefinition = {
  id: 'strengthen',
  name: 'Strengthen',
  type: 'power',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  effects: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }],
};

// ---- registry ----
// Every card is listed here once. Anything that needs to refer to a card by name (a saved run, a
// reward pool, a test) goes through its id, so the id is the card's identity.

const ALL_CARDS: CardDefinition[] = [
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

export const CARDS: Readonly<Record<string, CardDefinition>> = Object.fromEntries(
  ALL_CARDS.map((card): [string, CardDefinition] => [card.id, card])
);

if (Object.keys(CARDS).length !== ALL_CARDS.length) throw new Error('duplicate card id in ALL_CARDS');

export function getCard(id: string): CardDefinition {
  const card = CARDS[id];
  if (!card) throw new Error(`unknown card id: ${id}`);
  return card;
}

/** Cards a hero can be offered as rewards or in a shop: their own plus the neutral ones. */
export function rewardPoolFor(heroId: string): CardDefinition[] {
  return ALL_CARDS.filter((card) => card.inRewardPool && (card.owner === heroId || card.owner === 'neutral'));
}

/** Placeholder starter deck (mirrors StS's starter-deck shape): every card type, and the cost/energy system. */
export function buildStarterDeck(): CardDefinition[] {
  return [STRIKE, STRIKE, STRIKE, STRIKE, DEFEND, DEFEND, DEFEND, DEFEND, BOLT, FOCUS];
}
