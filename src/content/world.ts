import { CARDS, MAGE, baseCards, buildStarterDeck, rewardPoolFor } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { EVENTS } from '../data/events';
import { RELICS, RELIC_POOL, SYNERGY_RELICS } from '../data/relics';
import { ACT_CONTENT } from '../data/run';
import { STATUSES } from '../data/statuses';
import { SYNERGY_CARDS } from '../data/synergyCards';
import { MAX_ENERGY, PLAYER_MAX_HP } from '../data/tunables';
import type { ContentWorld } from './validate';

/** The real game content, as the registries hold it. */
export function realWorld(): ContentWorld {
  return {
    cards: baseCards(),
    registry: CARDS,
    starterDeck: buildStarterDeck(),
    rewardPool: rewardPoolFor(MAGE),
    testCardIds: new Set(SYNERGY_CARDS.map((c) => c.id)),
    testRelicIds: new Set(SYNERGY_RELICS.map((r) => r.id)),
    relics: Object.values(RELICS),
    relicPool: RELIC_POOL,
    enemies: ENEMIES,
    events: EVENTS,
    statuses: STATUSES,
    act: ACT_CONTENT,
    playerMaxHp: PLAYER_MAX_HP,
    maxEnergy: MAX_ENERGY,
  };
}
