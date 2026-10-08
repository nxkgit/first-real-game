import type { CardDefinition } from '../game/types';

// PLACEHOLDER keyword-demo cards. They exist only to exercise the StS-style card-property keywords
// (innate, retain, ethereal, unplayable) and keyword statuses (frail, intangible, buffer) built
// 2026-10-08 at the user's request — see implementationplan.md's "Keyword mechanics" section and
// DESIGN_LOG.md. Engine-only: these are NOT in the reward pool and no real Mage card uses any of
// these keywords yet, on purpose. Reachable via the `?dev` panel's "Add card" dropdown and the
// scenario system. Same pattern as synergyCards.ts, upgrade blocks included for the same reason
// (the content checker expects every registered card to have one).

const base = { owner: 'neutral', inRewardPool: false } as const;

export const TEST_INNATE: CardDefinition = {
  ...base,
  id: 'test-innate',
  name: 'Test: Innate',
  type: 'skill',
  cost: 0,
  innate: true,
  effects: [{ kind: 'block', value: 3 }],
  upgrade: { effects: [{ kind: 'block', value: 5 }] },
};

export const TEST_RETAIN: CardDefinition = {
  ...base,
  id: 'test-retain',
  name: 'Test: Retain',
  type: 'skill',
  cost: 1,
  retain: true,
  effects: [{ kind: 'block', value: 5 }],
  upgrade: { effects: [{ kind: 'block', value: 8 }] },
};

export const TEST_ETHEREAL: CardDefinition = {
  ...base,
  id: 'test-ethereal',
  name: 'Test: Ethereal',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  ethereal: true,
  effects: [{ kind: 'damage', value: 8 }],
  upgrade: { effects: [{ kind: 'damage', value: 12 }] },
};

export const TEST_UNPLAYABLE: CardDefinition = {
  ...base,
  id: 'test-unplayable',
  name: 'Test: Unplayable',
  type: 'skill',
  cost: 0,
  unplayable: true,
  effects: [{ kind: 'block', value: 5 }],
  upgrade: { effects: [{ kind: 'block', value: 7 }] },
};

export const TEST_FRAIL: CardDefinition = {
  ...base,
  id: 'test-frail',
  name: 'Test: Frail',
  type: 'skill',
  target: 'enemy',
  cost: 1,
  effects: [{ kind: 'applyStatus', status: 'frail', value: 2, to: 'target' }],
  upgrade: { effects: [{ kind: 'applyStatus', status: 'frail', value: 3, to: 'target' }] },
};

export const TEST_INTANGIBLE: CardDefinition = {
  ...base,
  id: 'test-intangible',
  name: 'Test: Intangible',
  type: 'skill',
  cost: 1,
  effects: [{ kind: 'applyStatus', status: 'intangible', value: 1, to: 'self' }],
  upgrade: { effects: [{ kind: 'applyStatus', status: 'intangible', value: 2, to: 'self' }] },
};

export const TEST_BUFFER: CardDefinition = {
  ...base,
  id: 'test-buffer',
  name: 'Test: Buffer',
  type: 'skill',
  cost: 1,
  effects: [{ kind: 'applyStatus', status: 'buffer', value: 2, to: 'self' }],
  upgrade: { effects: [{ kind: 'applyStatus', status: 'buffer', value: 3, to: 'self' }] },
};

export const KEYWORD_CARDS: CardDefinition[] = [
  TEST_INNATE,
  TEST_RETAIN,
  TEST_ETHEREAL,
  TEST_UNPLAYABLE,
  TEST_FRAIL,
  TEST_INTANGIBLE,
  TEST_BUFFER,
];
