import type { CardDefinition } from '../game/types';

// 'mage' is not imported from cards.ts (circular import): see synergyCards.ts for the same pattern.
const MAGE = 'mage';

// PLACEHOLDER numbers throughout this file, per CLAUDE.md: the user designed these 20 cards' names,
// types and mechanics (DESIGN_LOG.md, "Mage — Core Mechanics" session); where they used "X" for a
// damage/block value, or left a cost or effect unspecified, a provisional placeholder was chosen
// here, calibrated against the existing starter/reward cards in cards.ts (Strike 6 dmg/1 cost,
// Bolt 12/2, Heavy Hit 24/3, Defend 5/1, Big Block 13/2). All of it is open to change.
//
// The "Temperature System" the user described (fire cards heat it up, frost cards cool it down,
// thresholds eventually unlock bonus effects) is built as a real resource (CombatState.temperature,
// the `adjustTemperature` effect, and the `temperature` scaling source used by Molten Core below).
// None of these 19 cards needs the threshold-bonus-effect half of that idea yet (no pasted card
// calls for it), so it is not built — add it to the engine once a real card needs it, rather than
// building it ahead of content (see CLAUDE.md "No premature abstraction").
//
// Freeze (StatusId 'freeze') is unique to the Mage: stacks never wear off, and every
// FREEZE_STUN_THRESHOLD (5, tunables.ts) stacks stuns the enemy for one move. "Plating" (Cryofreeze)
// and "immune to damage" (Ice Block) are not separate mechanics — reused as a turn-start block power
// and a very large block value respectively, since the user did not specify anything beyond those
// names; flagged below.

export const SCORCHING_WIND: CardDefinition = {
  id: 'scorching-wind',
  name: 'Scorching Wind',
  type: 'attack',
  target: 'enemy',
  cost: 0,
  owner: MAGE,
  inRewardPool: true,
  tags: ['fire'],
  effects: [
    { kind: 'damage', value: 2 },
    { kind: 'adjustTemperature', value: 1 },
  ],
  upgrade: { effects: [{ kind: 'damage', value: 4 }, { kind: 'adjustTemperature', value: 1 }] },
};

export const HEATING_UP: CardDefinition = {
  id: 'heating-up',
  name: 'Heating Up',
  type: 'skill',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['fire'],
  // PLACEHOLDER approximation of "every attack deals double damage for the rest of this turn":
  // the engine has no unlimited-duration damage-double, so this grants a generous Empowered stack
  // instead (Empowered is "used up by playing an attack"; 5 stacks covers any turn in practice).
  // No description override, so the card face honestly shows "Gain 5 Empowered." rather than
  // hiding that approximation behind cleaner-sounding text.
  effects: [
    { kind: 'applyStatus', status: 'empowered', value: 5, to: 'self' },
    { kind: 'adjustTemperature', value: 1 },
  ],
  upgrade: { cost: 0 },
};

export const METEOR_SHOWER: CardDefinition = {
  id: 'meteor-shower',
  name: 'Meteor Shower',
  type: 'attack',
  cost: 2,
  owner: MAGE,
  inRewardPool: true,
  tags: ['fire'],
  effects: [
    { kind: 'damageAll', value: 8 },
    { kind: 'adjustTemperature', value: 1 },
  ],
  upgrade: { effects: [{ kind: 'damageAll', value: 11 }, { kind: 'adjustTemperature', value: 1 }] },
};

export const MOLTEN_CORE: CardDefinition = {
  id: 'molten-core',
  name: 'Molten Core',
  type: 'skill',
  cost: 2,
  owner: MAGE,
  inRewardPool: true,
  tags: ['fire'],
  // "Add X Scorching Winds to your hand for every X temperature" (the user's pasted text): copies
  // scale with the current Temperature (0 or below adds none; scaledValue floors at 0).
  effects: [{ kind: 'addCardToHand', cardId: 'scorching-wind', value: 0, scaling: { per: 'temperature', value: 1 } }],
  upgrade: { effects: [{ kind: 'addCardToHand', cardId: 'scorching-wind', value: 1, scaling: { per: 'temperature', value: 1 } }] },
};

export const APOCALYPTIC_FLAME: CardDefinition = {
  id: 'apocalyptic-flame',
  name: 'Apocalyptic Flame',
  type: 'attack',
  target: 'enemy',
  // Cost wasn't given ("Deal massive damage"); placed above Heavy Hit (24 dmg/3 cost) to read as the
  // Mage's biggest single hit.
  cost: 3,
  owner: MAGE,
  inRewardPool: true,
  tags: ['fire'],
  effects: [
    { kind: 'damage', value: 30 },
    { kind: 'adjustTemperature', value: 2 },
  ],
  upgrade: { effects: [{ kind: 'damage', value: 40 }, { kind: 'adjustTemperature', value: 2 }] },
};

export const CRIPPLING_HEAT: CardDefinition = {
  id: 'crippling-heat',
  name: 'Crippling Heat',
  type: 'attack',
  target: 'enemy',
  // Cost was given as "0 or 1"; set to 1 here, distinct from Heat Flash below at 0, so the pair
  // aren't exact duplicates.
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['fire'],
  effects: [
    { kind: 'damage', value: 4 },
    { kind: 'applyStatus', status: 'weak', value: 1, to: 'target' },
    { kind: 'adjustTemperature', value: 1 },
  ],
  upgrade: { effects: [{ kind: 'damage', value: 6 }, { kind: 'applyStatus', status: 'weak', value: 2, to: 'target' }, { kind: 'adjustTemperature', value: 1 }] },
};

export const HEAT_FLASH: CardDefinition = {
  id: 'heat-flash',
  name: 'Heat Flash',
  type: 'attack',
  target: 'enemy',
  cost: 0,
  owner: MAGE,
  inRewardPool: true,
  tags: ['fire'],
  effects: [
    { kind: 'damage', value: 3 },
    { kind: 'applyStatus', status: 'weak', value: 1, to: 'target' },
    { kind: 'adjustTemperature', value: 1 },
  ],
  upgrade: { effects: [{ kind: 'damage', value: 5 }, { kind: 'applyStatus', status: 'weak', value: 1, to: 'target' }, { kind: 'adjustTemperature', value: 1 }] },
};

export const CAUTERIZE: CardDefinition = {
  id: 'cauterize',
  name: 'Cauterize',
  type: 'skill',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['fire'],
  // User's answer when asked what the unspecified "defensive skill" does: plain block.
  effects: [
    { kind: 'block', value: 6 },
    { kind: 'adjustTemperature', value: 1 },
  ],
  upgrade: { effects: [{ kind: 'block', value: 9 }, { kind: 'adjustTemperature', value: 1 }] },
};

export const HEAT_WARNING: CardDefinition = {
  id: 'heat-warning',
  name: 'Heat Warning',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['fire'],
  effects: [
    { kind: 'damage', value: 4 },
    { kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'target' },
    { kind: 'adjustTemperature', value: 1 },
  ],
  upgrade: { effects: [{ kind: 'damage', value: 6 }, { kind: 'applyStatus', status: 'vulnerable', value: 2, to: 'target' }, { kind: 'adjustTemperature', value: 1 }] },
};

export const ICE_BLOCK: CardDefinition = {
  id: 'ice-block',
  name: 'Ice Block',
  type: 'skill',
  // "High cost" was specified, no number: placed at the top of the Mage's cost range.
  cost: 3,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  // PLACEHOLDER approximation of "immune to damage until your next turn": the engine has no
  // immunity flag, so this is just a block value well above any other block card's, high enough to
  // cover a full enemy turn against current placeholder enemies. Kept inside the content checker's
  // per-energy sanity range on purpose (36/3 = 12/energy; Big Block is 6.5/energy) rather than an
  // arbitrarily huge number, so a real balance pass can still trust that check. No description
  // override, so the card face honestly shows the real "Gain 36 block." number.
  effects: [
    { kind: 'block', value: 36 },
    { kind: 'adjustTemperature', value: -1 },
  ],
  upgrade: { cost: 2 },
};

export const ICE_BARRIER: CardDefinition = {
  id: 'ice-barrier',
  name: 'Ice Barrier',
  type: 'skill',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  effects: [
    { kind: 'discardRandom', value: 2 },
    { kind: 'block', value: 10 },
    { kind: 'adjustTemperature', value: -1 },
  ],
  upgrade: { effects: [{ kind: 'discardRandom', value: 2 }, { kind: 'block', value: 14 }, { kind: 'adjustTemperature', value: -1 }] },
};

export const HYPOTHERMIA: CardDefinition = {
  id: 'hypothermia',
  name: 'Hypothermia',
  type: 'skill',
  target: 'enemy',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  effects: [
    { kind: 'applyStatus', status: 'freeze', value: 1, to: 'target' },
    { kind: 'adjustTemperature', value: -1 },
  ],
  upgrade: { effects: [{ kind: 'applyStatus', status: 'freeze', value: 2, to: 'target' }, { kind: 'adjustTemperature', value: -1 }] },
};

export const FROZEN_SHIELD: CardDefinition = {
  id: 'frozen-shield',
  name: 'Frozen Shield',
  type: 'skill',
  target: 'enemy',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  effects: [
    { kind: 'block', value: 6 },
    { kind: 'applyStatus', status: 'freeze', value: 1, to: 'target' },
    { kind: 'adjustTemperature', value: -1 },
  ],
  upgrade: { effects: [{ kind: 'block', value: 9 }, { kind: 'applyStatus', status: 'freeze', value: 1, to: 'target' }, { kind: 'adjustTemperature', value: -1 }] },
};

export const CRYOFREEZE: CardDefinition = {
  id: 'cryofreeze',
  name: 'Cryofreeze',
  type: 'power',
  cost: 2,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  // "Gain X plating" was not otherwise specified: reused as the existing turn-start-block power
  // pattern (see Fortify in cards.ts) rather than inventing a separate "plating" mechanic.
  effects: [{ kind: 'adjustTemperature', value: -1 }],
  onTurnStartEffect: { kind: 'block', value: 5 },
  upgrade: { onTurnStartEffect: { kind: 'block', value: 7 } },
};

export const ENDLESS_WINTER: CardDefinition = {
  id: 'endless-winter',
  name: 'Endless Winter',
  type: 'power',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  effects: [{ kind: 'adjustTemperature', value: -1 }],
  onTurnStartEffect: { kind: 'applyStatus', status: 'freeze', value: 1, to: 'target' },
  upgrade: { cost: 0 },
};

export const GLACIATE: CardDefinition = {
  id: 'glaciate',
  name: 'Glaciate',
  type: 'attack',
  target: 'enemy',
  cost: 2,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  effects: [{ kind: 'damage', value: 8, vsFreezeMult: 3 }],
  upgrade: { effects: [{ kind: 'damage', value: 11, vsFreezeMult: 3 }] },
};

export const GLACIAL_SPIKE: CardDefinition = {
  id: 'glacial-spike',
  name: 'Glacial Spike',
  type: 'skill',
  target: 'enemy',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  effects: [
    { kind: 'applyStatus', status: 'freeze', value: 1, to: 'target' },
    { kind: 'adjustTemperature', value: -1 },
  ],
  upgrade: { effects: [{ kind: 'applyStatus', status: 'freeze', value: 2, to: 'target' }, { kind: 'adjustTemperature', value: -1 }] },
};

export const ABSOLUTE_ZERO: CardDefinition = {
  id: 'absolute-zero',
  name: 'Absolute Zero',
  type: 'skill',
  // "Large cost, big temp reduction".
  cost: 3,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  effects: [{ kind: 'adjustTemperature', value: -4 }],
  upgrade: { cost: 2 },
};

export const HUNGERING_COLD: CardDefinition = {
  id: 'hungering-cold',
  name: 'Hungering Cold',
  type: 'power',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  onTurnStartEffect: { kind: 'adjustTemperature', value: -1 },
  upgrade: { cost: 0 },
};

export const ARCTIC_STRIKE: CardDefinition = {
  id: 'arctic-strike',
  name: 'Arctic Strike',
  type: 'attack',
  target: 'enemy',
  cost: 1,
  owner: MAGE,
  inRewardPool: true,
  tags: ['frost'],
  effects: [{ kind: 'damage', value: 2, scaling: { per: 'targetFreeze', value: 3 } }],
  upgrade: { effects: [{ kind: 'damage', value: 4, scaling: { per: 'targetFreeze', value: 3 } }] },
};

/** Every placeholder Mage fire/frost/Freeze card from the user's 2026-10-07 design pass. */
export const MAGE_CARDS: CardDefinition[] = [
  SCORCHING_WIND,
  HEATING_UP,
  METEOR_SHOWER,
  MOLTEN_CORE,
  APOCALYPTIC_FLAME,
  CRIPPLING_HEAT,
  HEAT_FLASH,
  CAUTERIZE,
  HEAT_WARNING,
  ICE_BLOCK,
  ICE_BARRIER,
  HYPOTHERMIA,
  FROZEN_SHIELD,
  CRYOFREEZE,
  ENDLESS_WINTER,
  GLACIATE,
  GLACIAL_SPIKE,
  ABSOLUTE_ZERO,
  HUNGERING_COLD,
  ARCTIC_STRIKE,
];
