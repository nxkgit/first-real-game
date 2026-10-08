import type { ActMap, MapNode, MapNodeKind } from './actMap';
import type { RunWorld } from './RunState';
import type { CardDefinition, EnemyDefinition, EventDefinition, RelicDefinition } from './types';

// Small builders for tests, so run tests don't depend on the placeholder game content.

export function card(id: string, extra: Partial<CardDefinition> = {}): CardDefinition {
  return { id, name: id, type: 'skill', cost: 1, owner: 'test', inRewardPool: true, ...extra };
}

export const FOE: EnemyDefinition = {
  id: 'foe',
  name: 'Foe',
  maxHp: 10,
  movePattern: [{ name: 'A', effects: [{ kind: 'damage', value: 1 }] }],
};

/** A straight-line map: each stop leads to the next, the last one being the boss. */
export function chainMap(kinds: MapNodeKind[]): ActMap {
  const nodes: MapNode[] = kinds.map((kind, floor) => ({
    id: `${floor}-0`,
    floor,
    lane: 0,
    kind,
    next: floor < kinds.length - 1 ? [`${floor + 1}-0`] : [],
    enemies: kind === 'combat' || kind === 'elite' || kind === 'boss' ? ['foe'] : undefined,
    eventId: kind === 'event' ? 'ev' : undefined,
  }));
  return { lanes: 1, floors: kinds.length, nodes };
}

export interface WorldOptions {
  cards?: CardDefinition[];
  relics?: RelicDefinition[];
  events?: EventDefinition[];
  starterPool?: CardDefinition[];
}

export const STARTER = [card('s1', { owner: 'test', inRewardPool: false }), card('s2', { inRewardPool: false })];
export const POOL = ['p1', 'p2', 'p3', 'p4', 'p5'].map((id) => card(id));
/** A separate pool for the starter-deck draft, distinct from the reward `POOL` (see RunState's "Starter deck draft"). */
export const STARTER_POOL = ['d1', 'd2', 'd3', 'd4', 'd5'].map((id) => card(id, { inRewardPool: false, inStarterPool: true }));

export const TEST_EVENT: EventDefinition = {
  id: 'ev',
  title: 'Event',
  text: 'Something happens.',
  choices: [
    { label: 'Take gold', outcomes: [{ kind: 'gold', value: 30 }, { kind: 'hp', value: -5 }] },
    { label: 'Nothing', outcomes: [] },
    { label: 'Fight', outcomes: [{ kind: 'fight', enemies: ['foe'] }, { kind: 'gold', value: 99 }] },
  ],
};

export function world(options: WorldOptions = {}): RunWorld {
  const cards = [...STARTER, ...POOL, ...(options.starterPool ?? STARTER_POOL), ...(options.cards ?? [])];
  const relics = options.relics ?? [];
  const events = [TEST_EVENT, ...(options.events ?? [])];
  const find = <T extends { id: string }>(list: T[], id: string, what: string): T => {
    const found = list.find((x) => x.id === id);
    if (!found) throw new Error(`unknown ${what} ${id}`);
    return found;
  };
  return {
    rewardPool: POOL,
    starterPool: options.starterPool ?? STARTER_POOL,
    relicPool: relics,
    card: (id) => find(cards, id, 'card'),
    relic: (id) => find(relics, id, 'relic'),
    enemy: (id) => find([FOE], id, 'enemy'),
    event: (id) => find(events, id, 'event'),
  };
}
