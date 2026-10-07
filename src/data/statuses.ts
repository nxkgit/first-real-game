import type { StatusDefinition, StatusId } from '../game/types';
import { EMPOWERED_DAMAGE_MULT, VULNERABLE_DAMAGE_MULT, WEAK_DAMAGE_MULT } from './tunables';

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
};

/** Display order for badges. */
export const STATUS_ORDER: StatusId[] = ['strength', 'empowered', 'weak', 'vulnerable'];
