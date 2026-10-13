import type { CardDefinition } from '../game/types';

// 'druid' is not imported from cards.ts (circular import): same pattern as paladinCards.ts.
export const DRUID = 'druid';

// PURELY PLACEHOLDER cards (user, 2026-10-13: "make some placeholder druid cards"). They exist to prove the
// form mechanic (src/data/forms.ts): three cards enter the forms, the rest give Strength, Dexterity and
// Form B's bonus draw something to act on. Names are generic on purpose; every name and number is a
// provisional stand-in, real Druid design is the user's. Text is generated from `effects` (game/describe.ts).

const base = { owner: DRUID, inRewardPool: true, inStarterPool: true } as const;

// ---- form cards ----

/** The user's own example: "enter tortoise form. if already in tortoise form gain 10 block"; entering also grants 8 block. */
export const PLACEHOLDER_TORTOISE_FORM: CardDefinition = {
  ...base,
  id: 'placeholder-tortoise-form',
  name: 'Tortoise Form',
  type: 'skill',
  cost: 1,
  effects: [{ kind: 'enterForm', form: 'tortoise', onEnter: [{ kind: 'block', value: 8 }], ifAlready: [{ kind: 'block', value: 10 }] }],
  upgrade: { effects: [{ kind: 'enterForm', form: 'tortoise', onEnter: [{ kind: 'block', value: 11 }], ifAlready: [{ kind: 'block', value: 14 }] }] },
};

export const PLACEHOLDER_FORM_A: CardDefinition = {
  ...base,
  id: 'placeholder-form-a',
  name: 'Form A',
  type: 'skill',
  cost: 1,
  effects: [{ kind: 'enterForm', form: 'formA', onEnter: [{ kind: 'block', value: 5 }], ifAlready: [{ kind: 'gainEnergy', value: 1 }] }],
  upgrade: { effects: [{ kind: 'enterForm', form: 'formA', onEnter: [{ kind: 'block', value: 8 }], ifAlready: [{ kind: 'gainEnergy', value: 1 }] }] },
};

export const PLACEHOLDER_FORM_B: CardDefinition = {
  ...base,
  id: 'placeholder-form-b',
  name: 'Form B',
  type: 'skill',
  cost: 1,
  effects: [{ kind: 'enterForm', form: 'formB', onEnter: [{ kind: 'block', value: 5 }], ifAlready: [{ kind: 'draw', value: 1 }] }],
  upgrade: { effects: [{ kind: 'enterForm', form: 'formB', onEnter: [{ kind: 'block', value: 8 }], ifAlready: [{ kind: 'draw', value: 2 }] }] },
};

// ---- cards that care about Strength, Dexterity and drawing ----

export const PLACEHOLDER_DRUID_ATTACK: CardDefinition = {
  ...base,
  id: 'placeholder-druid-attack',
  name: 'Druid Attack',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  effects: [{ kind: 'damage', value: 7 }],
  upgrade: { effects: [{ kind: 'damage', value: 10 }] },
};

export const PLACEHOLDER_DRUID_HEAVY: CardDefinition = {
  ...base,
  id: 'placeholder-druid-heavy',
  name: 'Druid Heavy Attack',
  type: 'attack',
  target: 'enemy',
  cost: 2,
  effects: [{ kind: 'damage', value: 14 }],
  upgrade: { effects: [{ kind: 'damage', value: 18 }] },
};

export const PLACEHOLDER_DRUID_SWEEP: CardDefinition = {
  ...base,
  id: 'placeholder-druid-sweep',
  name: 'Druid Sweep',
  type: 'attack',
  cost: 1,
  effects: [{ kind: 'damageAll', value: 5 }],
  upgrade: { effects: [{ kind: 'damageAll', value: 8 }] },
};

export const PLACEHOLDER_DRUID_DEBUFF: CardDefinition = {
  ...base,
  id: 'placeholder-druid-debuff',
  name: 'Druid Debuff',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  effects: [
    { kind: 'damage', value: 4 },
    { kind: 'applyStatus', status: 'weak', value: 1, to: 'target' },
  ],
  upgrade: { effects: [{ kind: 'damage', value: 6 }, { kind: 'applyStatus', status: 'weak', value: 2, to: 'target' }] },
};

export const PLACEHOLDER_DRUID_BLOCK: CardDefinition = {
  ...base,
  id: 'placeholder-druid-block',
  name: 'Druid Block',
  type: 'skill',
  cost: 1,
  effects: [{ kind: 'block', value: 6 }],
  upgrade: { effects: [{ kind: 'block', value: 9 }] },
};

export const PLACEHOLDER_DRUID_BIG_BLOCK: CardDefinition = {
  ...base,
  id: 'placeholder-druid-big-block',
  name: 'Druid Big Block',
  type: 'skill',
  cost: 2,
  effects: [{ kind: 'block', value: 12 }],
  upgrade: { effects: [{ kind: 'block', value: 16 }] },
};

export const PLACEHOLDER_DRUID_DRAW: CardDefinition = {
  ...base,
  id: 'placeholder-druid-draw',
  name: 'Druid Draw',
  type: 'skill',
  cost: 1,
  effects: [{ kind: 'draw', value: 2 }],
  upgrade: { effects: [{ kind: 'draw', value: 3 }] },
};

/** Every placeholder Druid card. */
export const DRUID_CARDS: CardDefinition[] = [
  PLACEHOLDER_TORTOISE_FORM,
  PLACEHOLDER_FORM_A,
  PLACEHOLDER_FORM_B,
  PLACEHOLDER_DRUID_ATTACK,
  PLACEHOLDER_DRUID_HEAVY,
  PLACEHOLDER_DRUID_SWEEP,
  PLACEHOLDER_DRUID_DEBUFF,
  PLACEHOLDER_DRUID_BLOCK,
  PLACEHOLDER_DRUID_BIG_BLOCK,
  PLACEHOLDER_DRUID_DRAW,
];
