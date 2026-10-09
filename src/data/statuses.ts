import type { StatusDefinition, StatusId } from '../game/types';
import {
  EMPOWERED_DAMAGE_MULT,
  FRAIL_BLOCK_MULT,
  FREEZE_STUN_THRESHOLD,
  INTANGIBLE_DAMAGE_CAP,
  VULNERABLE_DAMAGE_MULT,
  WEAK_DAMAGE_MULT,
} from './tunables';

// Mirrors the Slay the Spire trio (implementationplan.md: "mirror StS closely"). Names and the
// badge look are placeholders; the numbers live in tunables.ts.

const pct = (mult: number): number => Math.round(Math.abs(mult - 1) * 100);

export const STATUSES: Record<StatusId, StatusDefinition> = {
  weak: {
    id: 'weak',
    name: 'Weak',
    kind: 'duration',
    describe: (n) => `Weak ${n}: deals ${pct(WEAK_DAMAGE_MULT)}% less attack damage. Drops by 1 at the end of its turn.`,
    outgoingDamageMult: () => WEAK_DAMAGE_MULT,
    badge: { symbol: 'W', color: 0x7fae5c },
  },
  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    kind: 'duration',
    describe: (n) => `Vulnerable ${n}: takes ${pct(VULNERABLE_DAMAGE_MULT)}% more attack damage. Drops by 1 at the end of its turn.`,
    incomingDamageMult: () => VULNERABLE_DAMAGE_MULT,
    badge: { symbol: 'V', color: 0xd9824f },
  },
  strength: {
    id: 'strength',
    name: 'Strength',
    kind: 'intensity',
    describe: (n) => `Strength ${n}: attacks deal ${n} more damage. Lasts the whole fight.`,
    outgoingDamageAdd: (n) => n,
    badge: { symbol: 'S', color: 0xd9544f },
  },
  empowered: {
    id: 'empowered',
    name: 'Empowered',
    kind: 'intensity',
    consumedByAttack: true,
    describe: (n) => `Empowered ${n}: your next ${n === 1 ? 'attack deals' : `${n} attacks deal`} ${EMPOWERED_DAMAGE_MULT}x damage. Used up by playing an attack.`,
    outgoingDamageMult: () => EMPOWERED_DAMAGE_MULT,
    badge: { symbol: 'E', color: 0xc78fe8 },
  },
  // Mage-only (implementationplan.md "Mage — Core Mechanics"): stacks never count down on their
  // own; CombatState.addStatus stuns the holder and removes the stacks every FREEZE_STUN_THRESHOLD.
  freeze: {
    id: 'freeze',
    name: 'Freeze',
    kind: 'intensity',
    describe: (n) =>
      `Freeze ${n}: every ${FREEZE_STUN_THRESHOLD} stacks, stuns the target for its next turn and removes those stacks. Does not wear off on its own.`,
    badge: { symbol: 'F', color: 0x6fd3e8 },
  },
  // Generic StS-style keyword statuses (engine-only for now: no real card applies them yet, see
  // src/data/keywordCards.ts and implementationplan.md's "Keyword mechanics" section).
  frail: {
    id: 'frail',
    name: 'Frail',
    kind: 'duration',
    describe: (n) => `Frail ${n}: gains ${pct(FRAIL_BLOCK_MULT)}% less block. Drops by 1 at the end of its turn.`,
    blockMult: () => FRAIL_BLOCK_MULT,
    badge: { symbol: 'Fr', color: 0x8a7fae },
  },
  intangible: {
    id: 'intangible',
    name: 'Intangible',
    kind: 'duration',
    describe: (n) => `Intangible ${n}: all damage taken is capped at ${INTANGIBLE_DAMAGE_CAP}. Drops by 1 at the end of its turn.`,
    incomingDamageCap: () => INTANGIBLE_DAMAGE_CAP,
    badge: { symbol: 'In', color: 0xd8e8f0 },
  },
  buffer: {
    id: 'buffer',
    name: 'Buffer',
    kind: 'intensity',
    describe: (n) =>
      `Buffer ${n}: prevents the next ${n === 1 ? 'instance' : `${n} instances`} of HP loss entirely (block still absorbs normally first). Used up one at a time.`,
    badge: { symbol: 'Bu', color: 0xe8c23c },
  },
  // Mage-only (implementationplan.md "Heating Up: the real mechanic", corrected 2026-10-09, QA #28).
  // Heating Up gives Fuming for the rest of the turn; each attack card played while Fuming grants 1
  // Ignite after it resolves; Ignite multiplies outgoing damage by 2^stacks. So the 1st attack after
  // Heating Up is at 2^0 = normal, the 2nd 2^1 = double, the 3rd 2^2 = quadruple, and so on, and
  // attacks played before Heating Up never count. Both clear at the end of the turn
  // (`clearAtTurnEnd`, not `duration`, which would only drop by 1 a round). A damage effect can ignore
  // Ignite (Scorching Wind's `ignoresStatuses`); it still grants Ignite, being an attack.
  ignite: {
    id: 'ignite',
    name: 'Ignite',
    kind: 'intensity',
    clearAtTurnEnd: true,
    describe: (n) =>
      `Ignite ${n}: your attacks deal ${2 ** n}x damage (2^${n}). Does not apply to Scorching Wind's damage. Clears at the end of the turn.`,
    outgoingDamageMult: (stacks) => 2 ** stacks,
    badge: { symbol: 'Ig', color: 0xff8c3c },
  },
  fuming: {
    id: 'fuming',
    name: 'Fuming',
    kind: 'intensity',
    clearAtTurnEnd: true,
    maxStacks: 1,
    grantsOnAttack: { status: 'ignite', stacks: 1 },
    describe: (n) => `Fuming ${n}: for the rest of your turn, your attacks grant you 1 Ignite. Clears at the end of the turn.`,
    gainText: () => `For the rest of your turn, your attacks grant you 1 Ignite. (This effect does not apply to Scorching Wind's damage.)`,
    badge: { symbol: 'Fu', color: 0xd9552b },
  },
};

/** Display order for badges. */
export const STATUS_ORDER: StatusId[] = ['strength', 'empowered', 'weak', 'vulnerable', 'freeze', 'frail', 'intangible', 'buffer', 'fuming', 'ignite'];
