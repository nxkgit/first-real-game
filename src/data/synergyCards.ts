import type { CardDefinition } from '../game/types';

// PLACEHOLDER synergy-test cards. They exist to exercise the synergy engine (scaling values,
// multipliers, triggers, tags, exhaust, energy, self-damage) and give the simulator and tests
// something to build decks from. As of 2026-10-07 they ARE in the reward pool (the user wants every
// placeholder offered to players for testing; flip `base.inRewardPool` to take them out again). Names are plain and descriptive; every number is PROVISIONAL. Real card design (and any
// tags with meaning) is the user's to author. Text is generated (game/describe.ts).
// How to write one: docs/SYNERGY_ENGINE.md.

const base = { owner: 'neutral', inRewardPool: true, inStarterPool: true } as const;

// ---- scaling ----

export const COMBO_STRIKE: CardDefinition = {
  ...base,
  id: 'combo-strike',
  name: 'Combo Strike',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  effects: [{ kind: 'damage', value: 4, scaling: { per: 'cardsPlayedThisTurn', value: 3 } }],
  upgrade: { effects: [{ kind: 'damage', value: 5, scaling: { per: 'cardsPlayedThisTurn', value: 4 } }] },
};

export const BLOCK_SLAM: CardDefinition = {
  ...base,
  id: 'block-slam',
  name: 'Block Slam',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  effects: [{ kind: 'damage', value: 0, scaling: { per: 'block', value: 1 } }],
  upgrade: { effects: [{ kind: 'damage', value: 3, scaling: { per: 'block', value: 1 } }] },
};

export const OPPORTUNIST: CardDefinition = {
  ...base,
  id: 'opportunist',
  name: 'Opportunist',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  effects: [{ kind: 'damage', value: 4, scaling: { per: 'targetVulnerable', value: 4 } }],
  upgrade: { effects: [{ kind: 'damage', value: 5, scaling: { per: 'targetVulnerable', value: 5 } }] },
};

export const HAND_STRIKE: CardDefinition = {
  ...base,
  id: 'hand-strike',
  name: 'Hand Strike',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  effects: [{ kind: 'damage', value: 2, scaling: { per: 'handSize', value: 2 } }],
  upgrade: { effects: [{ kind: 'damage', value: 3, scaling: { per: 'handSize', value: 3 } }] },
};

// ---- tags ----

export const PRIME_A: CardDefinition = {
  ...base,
  inRewardPool: false, // removed from the reward pool by the user, 2026-10-08
  id: 'prime-a',
  name: 'Prime A',
  type: 'skill',
  cost: 0,
  tags: ['tag-a'],
  effects: [{ kind: 'block', value: 3 }],
  upgrade: { effects: [{ kind: 'block', value: 5 }] },
};

export const TAG_A_PAYOFF: CardDefinition = {
  ...base,
  inRewardPool: false, // removed from the reward pool by the user, 2026-10-08
  id: 'tag-a-payoff',
  name: 'Tag A Payoff',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  effects: [{ kind: 'damage', value: 3, scaling: { per: 'taggedPlayedThisTurn', tag: 'tag-a', value: 5 } }],
  upgrade: { effects: [{ kind: 'damage', value: 4, scaling: { per: 'taggedPlayedThisTurn', tag: 'tag-a', value: 6 } }] },
};

export const TAG_A_ECHO: CardDefinition = {
  ...base,
  inRewardPool: false, // removed from the reward pool by the user, 2026-10-08
  id: 'tag-a-echo',
  name: 'Tag A Echo',
  type: 'power',
  cost: 1,
  triggers: [{ on: 'cardPlayed', tag: 'tag-a', oncePerTurn: true, effects: [{ kind: 'draw', value: 1 }] }],
  upgrade: { cost: 0 },
};

// ---- multipliers ----

export const POWER_UP: CardDefinition = {
  ...base,
  id: 'power-up',
  name: 'Power Up',
  type: 'skill',
  cost: 1,
  effects: [{ kind: 'applyStatus', status: 'empowered', value: 1, to: 'self' }],
  upgrade: { cost: 0 },
};

export const DOUBLE_STRENGTH: CardDefinition = {
  ...base,
  id: 'double-strength',
  name: 'Double Strength',
  type: 'skill',
  cost: 1,
  exhaust: true,
  effects: [{ kind: 'multiplyStatus', status: 'strength', factor: 2, to: 'self' }],
  upgrade: { cost: 0 },
};

// ---- triggers ----

export const ATTACK_ECHO: CardDefinition = {
  ...base,
  inRewardPool: false, // removed from the reward pool by the user, 2026-10-08
  id: 'attack-echo',
  name: 'Attack Echo',
  type: 'power',
  cost: 1,
  triggers: [{ on: 'cardPlayed', cardType: 'attack', effects: [{ kind: 'block', value: 2 }] }],
  upgrade: { triggers: [{ on: 'cardPlayed', cardType: 'attack', effects: [{ kind: 'block', value: 3 }] }] },
};

export const BLOCK_SPARK: CardDefinition = {
  ...base,
  inRewardPool: false, // removed from the reward pool by the user, 2026-10-08
  id: 'block-spark',
  name: 'Block Spark',
  type: 'power',
  cost: 1,
  triggers: [{ on: 'blockGained', oncePerTurn: true, effects: [{ kind: 'damage', value: 3 }] }],
  upgrade: { triggers: [{ on: 'blockGained', oncePerTurn: true, effects: [{ kind: 'damage', value: 5 }] }] },
};

export const KILL_REWARD: CardDefinition = {
  ...base,
  id: 'kill-reward',
  name: 'Kill Reward',
  type: 'power',
  cost: 1,
  triggers: [{ on: 'enemyDied', effects: [{ kind: 'gainEnergy', value: 1 }] }],
  upgrade: {
    triggers: [
      {
        on: 'enemyDied',
        effects: [
          { kind: 'gainEnergy', value: 1 },
          { kind: 'draw', value: 1 },
        ],
      },
    ],
  },
};

export const PAIN_ENGINE: CardDefinition = {
  ...base,
  id: 'pain-engine',
  name: 'Pain Engine',
  type: 'power',
  cost: 1,
  triggers: [{ on: 'hpLost', effects: [{ kind: 'applyStatus', status: 'strength', value: 1, to: 'self' }] }],
  upgrade: { triggers: [{ on: 'hpLost', effects: [{ kind: 'applyStatus', status: 'strength', value: 2, to: 'self' }] }] },
};

export const END_GUARD: CardDefinition = {
  ...base,
  id: 'end-guard',
  name: 'End Guard',
  type: 'power',
  cost: 1,
  triggers: [{ on: 'turnEnd', effects: [{ kind: 'block', value: 4 }] }],
  upgrade: { triggers: [{ on: 'turnEnd', effects: [{ kind: 'block', value: 6 }] }] },
};

export const OPENING_SPARK: CardDefinition = {
  ...base,
  id: 'opening-spark',
  name: 'Opening Spark',
  type: 'power',
  cost: 1,
  triggers: [{ on: 'turnStart', effects: [{ kind: 'damage', value: 3 }] }],
  upgrade: { triggers: [{ on: 'turnStart', effects: [{ kind: 'damage', value: 5 }] }] },
};

export const EXHAUST_ENGINE: CardDefinition = {
  ...base,
  id: 'exhaust-engine',
  name: 'Exhaust Engine',
  type: 'power',
  cost: 1,
  triggers: [{ on: 'cardExhausted', effects: [{ kind: 'draw', value: 1 }] }],
  upgrade: { cost: 0 },
};

// ---- exhaust, energy, self-damage ----

export const CULL: CardDefinition = {
  ...base,
  id: 'cull',
  name: 'Cull',
  type: 'skill',
  cost: 0,
  exhaust: true,
  effects: [
    { kind: 'exhaustRandom', value: 1 },
    { kind: 'gainEnergy', value: 1 },
  ],
  upgrade: {
    effects: [
      { kind: 'exhaustRandom', value: 1 },
      { kind: 'gainEnergy', value: 2 },
    ],
  },
};

export const SINGLE_USE_STRIKE: CardDefinition = {
  ...base,
  inRewardPool: false, // removed from the reward pool by the user, 2026-10-08
  id: 'single-use-strike',
  name: 'Single Use Strike',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  exhaust: true,
  effects: [{ kind: 'damage', value: 10 }],
  upgrade: { effects: [{ kind: 'damage', value: 14 }] },
};

export const EXHAUST_PAYOFF: CardDefinition = {
  ...base,
  inRewardPool: false, // removed from the reward pool by the user, 2026-10-08
  id: 'exhaust-payoff',
  name: 'Exhaust Payoff',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  effects: [{ kind: 'damage', value: 2, scaling: { per: 'exhaustedThisCombat', value: 3 } }],
  upgrade: { effects: [{ kind: 'damage', value: 3, scaling: { per: 'exhaustedThisCombat', value: 4 } }] },
};

export const BLOOD_STRIKE: CardDefinition = {
  ...base,
  id: 'blood-strike',
  name: 'Blood Strike',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  effects: [
    { kind: 'loseHp', value: 3 },
    { kind: 'damage', value: 14 },
  ],
  upgrade: {
    effects: [
      { kind: 'loseHp', value: 3 },
      { kind: 'damage', value: 18 },
    ],
  },
};

export const SYNERGY_CARDS: CardDefinition[] = [
  COMBO_STRIKE,
  BLOCK_SLAM,
  OPPORTUNIST,
  HAND_STRIKE,
  PRIME_A,
  TAG_A_PAYOFF,
  TAG_A_ECHO,
  POWER_UP,
  DOUBLE_STRENGTH,
  ATTACK_ECHO,
  BLOCK_SPARK,
  KILL_REWARD,
  PAIN_ENGINE,
  END_GUARD,
  OPENING_SPARK,
  EXHAUST_ENGINE,
  CULL,
  SINGLE_USE_STRIKE,
  EXHAUST_PAYOFF,
  BLOOD_STRIKE,
];
