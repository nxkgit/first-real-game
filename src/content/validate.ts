import { cardText, describeEffect, describeOutcome, relicText } from '../game/describe';
import type { MapContent } from '../game/actMap';
import type {
  CardDefinition,
  Effect,
  EnemyDefinition,
  EnemyMove,
  EventDefinition,
  RelicDefinition,
  RunEffect,
  StatusDefinition,
  Trigger,
} from '../game/types';
import { EFFECT_KINDS, SCALE_SOURCES, TRIGGER_EVENTS } from './vocabulary';

// Content validation: reads everything the registries hold and reports problems in words a content
// author can act on. Pure (no Phaser, no DOM, no Node): `validateContent(world)` takes the content
// as an argument so tests can feed it deliberately broken content. `world.ts` builds the real one,
// `checkCli.ts` is `npm run content:check`.
//
// Severity: error = the content is broken or does nothing (the CLI exits non-zero);
// warning = probably a mistake or a gap, check it; info = a fact worth knowing, often intended.

export type Severity = 'error' | 'warning' | 'info';
export type ContentKind = 'card' | 'relic' | 'enemy' | 'event' | 'status' | 'act';

export interface Issue {
  severity: Severity;
  kind: ContentKind;
  /** The id of the item the issue is about. */
  id: string;
  /** A stable short code, for tests and for silencing by hand. */
  code: string;
  message: string;
  /** What to change. */
  fix: string;
}

/** Everything the check looks at. */
export interface ContentWorld {
  /** Base cards (not the generated `+` versions), in registry order. */
  cards: readonly CardDefinition[];
  /** Every card by id, including the generated upgrades. */
  registry: Readonly<Record<string, CardDefinition>>;
  starterDeck: readonly CardDefinition[];
  /** What rewards and shops can offer (the playable hero's pool). */
  rewardPool: readonly CardDefinition[];
  /** Cards and relics that exist only to exercise the engine; reachability is not expected of them. */
  testCardIds: ReadonlySet<string>;
  testRelicIds: ReadonlySet<string>;
  relics: readonly RelicDefinition[];
  relicPool: readonly RelicDefinition[];
  enemies: Readonly<Record<string, EnemyDefinition>>;
  events: Readonly<Record<string, EventDefinition>>;
  statuses: Readonly<Record<string, StatusDefinition>>;
  act: MapContent;
  playerMaxHp: number;
  maxEnergy: number;
}

/** How far from the cohort's middle counts as "suspicious". Provisional; tune freely. */
export const EXTREME_HIGH = 3;
export const EXTREME_LOW = 1 / 3;
/** Cohorts smaller than this are not compared (too little to say what is normal). */
export const MIN_COHORT = 4;

const FILE = { card: 'src/data/cards.ts', relic: 'src/data/relics.ts', enemy: 'src/data/enemies.ts', event: 'src/data/events.ts', status: 'src/data/statuses.ts', act: 'src/data/run.ts' } as const;

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

class Collector {
  readonly issues: Issue[] = [];
  add(severity: Severity, kind: ContentKind, id: string, code: string, message: string, fix: string): void {
    this.issues.push({ severity, kind, id, code, message, fix });
  }
}

type Who = 'card' | 'trigger' | 'relic' | 'enemy';

interface EffectCtx {
  kind: ContentKind;
  /** Item name for messages. */
  id: string;
  /** e.g. "effects[1]" */
  where: string;
  who: Who;
  /** Card is declared `target: 'enemy'` (only meaningful for who 'card'). */
  aimed: boolean;
  statuses: Readonly<Record<string, StatusDefinition>>;
  out: Collector;
}

const safeText = (fn: () => string): string | undefined => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

/** Checks one effect (shape, scaling, status ids, target). */
function checkEffect(effect: Effect, ctx: EffectCtx): void {
  const { out, kind, id, where } = ctx;
  const file = FILE[kind === 'enemy' ? 'enemy' : kind === 'relic' ? 'relic' : 'card'];
  const info = EFFECT_KINDS[effect.kind as Effect['kind']] as (typeof EFFECT_KINDS)[Effect['kind']] | undefined;
  if (!info) {
    out.add('error', kind, id, 'unknown-effect', `${where}: unknown effect kind "${(effect as { kind: string }).kind}".`, `Use one of: ${Object.keys(EFFECT_KINDS).join(', ')} (see docs/CONTENT_GUIDE.md).`);
    return;
  }

  if ('status' in effect && !ctx.statuses[effect.status]) {
    out.add('error', kind, id, 'unknown-status', `${where}: status "${effect.status}" does not exist.`, `Use one of: ${Object.keys(ctx.statuses).join(', ')}, or add the status in src/data/statuses.ts.`);
  }

  if ('value' in effect) {
    const v = effect.value;
    const scaled = 'scaling' in effect && effect.scaling !== undefined;
    if (!Number.isFinite(v)) {
      out.add('error', kind, id, 'bad-number', `${where}: value is ${String(v)}, not a number.`, `Set a real number in ${file}.`);
    } else if (v < 0 && effect.kind !== 'adjustTemperature') {
      out.add('error', kind, id, 'negative-value', `${where}: ${effect.kind} value ${v} is negative.`, `Use a value of 0 or more (to take something away use a different effect, e.g. loseHp) in ${file}.`);
    } else if (effect.kind === 'adjustTemperature' && v === 0) {
      out.add('warning', kind, id, 'zero-value', `${where}: adjustTemperature value is 0, so it does nothing.`, 'Give it a nonzero value (negative cools down) or delete the effect.');
    } else if (v === 0 && !scaled) {
      out.add('warning', kind, id, 'zero-value', `${where}: ${effect.kind} value is 0 and has no scaling, so it does nothing.`, `Give it a value, add scaling, or delete the effect.`);
    } else if (!Number.isInteger(v)) {
      out.add('warning', kind, id, 'fractional-value', `${where}: ${effect.kind} value ${v} is not a whole number.`, 'Use whole numbers; the game rounds damage down and shows the text as written.');
    }
  }
  if (effect.kind === 'multiplyStatus' && !(Number.isFinite(effect.factor) && effect.factor >= 0)) {
    out.add('error', kind, id, 'bad-number', `${where}: multiplyStatus factor ${String(effect.factor)} is not a number of 0 or more.`, 'Set the factor (2 doubles the stacks).');
  }
  if (effect.kind === 'multiplyStatus' && effect.factor === 1) {
    out.add('warning', kind, id, 'noop-multiply', `${where}: multiplyStatus factor 1 changes nothing.`, 'Use a factor other than 1.');
  }

  // scaling
  const scaling = 'scaling' in effect ? effect.scaling : undefined;
  if (scaling !== undefined) {
    if (!info.scales) {
      out.add('error', kind, id, 'scaling-unsupported', `${where}: a "${effect.kind}" effect cannot scale; the scaling block is ignored.`, `Remove "scaling" from this effect. Effects that can scale: ${Object.keys(EFFECT_KINDS).filter((k) => EFFECT_KINDS[k as Effect['kind']].scales).join(', ')}.`);
    } else {
      if (!(scaling.per in SCALE_SOURCES)) {
        out.add('error', kind, id, 'unknown-scale-source', `${where}: scaling.per "${scaling.per}" does not exist.`, `Use one of: ${Object.keys(SCALE_SOURCES).join(', ')}.`);
      }
      if (scaling.per === 'taggedPlayedThisTurn' && !scaling.tag) {
        out.add('error', kind, id, 'scaling-missing-tag', `${where}: scaling per "taggedPlayedThisTurn" needs a "tag".`, 'Add tag: "<the tag>" to the scaling block.');
      }
      if (scaling.per !== 'taggedPlayedThisTurn' && scaling.tag !== undefined) {
        out.add('warning', kind, id, 'scaling-stray-tag', `${where}: scaling has a tag but per is "${scaling.per}", so the tag is ignored.`, 'Remove the tag, or change per to "taggedPlayedThisTurn".');
      }
      if (!Number.isFinite(scaling.value) || scaling.value <= 0) {
        out.add('warning', kind, id, 'scaling-no-gain', `${where}: scaling.value is ${String(scaling.value)}, so scaling adds nothing.`, 'Use a positive scaling value, or remove the scaling.');
      }
    }
  }

  // who can use it
  if (ctx.who === 'enemy') {
    if (!info.enemyMove) {
      out.add('error', kind, id, 'enemy-effect-ignored', `${where}: enemies cannot use "${effect.kind}"; it is silently ignored in a fight.`, 'Enemy moves can only use damage, block and applyStatus. Remove this effect.');
    } else if (scaling !== undefined) {
      out.add('warning', kind, id, 'enemy-scaling-ignored', `${where}: scaling on an enemy move is ignored (enemies always use the plain value).`, 'Remove the scaling and write the number you want.');
    }
    if (effect.kind === 'applyStatus') {
      if (effect.to === 'target' && effect.status === 'strength') {
        out.add('warning', kind, id, 'enemy-buffs-player', `${where}: this move gives the PLAYER Strength (to: "target" means the player on an enemy move).`, 'Use to: "self" to buff the enemy, or a debuff status for the player.');
      }
      if (effect.to === 'self' && (effect.status === 'weak' || effect.status === 'vulnerable')) {
        out.add('warning', kind, id, 'enemy-debuffs-self', `${where}: this move puts ${effect.status} on the enemy itself, and the intent shows a buff arrow.`, 'Use to: "target" to debuff the player, or confirm this is meant.');
      }
    }
  }

  // aimed effects
  const needsTarget = effect.kind === 'damage' || (effect.kind === 'applyStatus' && effect.to === 'target') || (effect.kind === 'multiplyStatus' && effect.to === 'target');
  if (ctx.who === 'card' && needsTarget && !ctx.aimed) {
    out.add('error', kind, id, 'missing-target', `${where}: this ${effect.kind} hits a target but the card is not declared target: 'enemy', so the player cannot aim it.`, "Add target: 'enemy' to the card.");
  }
  if (ctx.who === 'relic' && needsTarget) {
    out.add('warning', kind, id, 'relic-targets', `${where}: a relic hook has no aimed target, so "${effect.kind}" on a target may hit nothing useful.`, 'Use to: "self" or move this into a trigger (triggers aim at the first living enemy).');
  }
}

function checkTrigger(trigger: Trigger, index: number, ctx: Omit<EffectCtx, 'where' | 'who'>, tagsDeclared: ReadonlySet<string>): void {
  const where = `triggers[${index}]`;
  const { out, kind, id } = ctx;
  if (!(trigger.on in TRIGGER_EVENTS)) {
    out.add('error', kind, id, 'unknown-trigger', `${where}: trigger event "${trigger.on}" does not exist.`, `Use one of: ${Object.keys(TRIGGER_EVENTS).join(', ')}.`);
  }
  if (!trigger.effects || trigger.effects.length === 0) {
    out.add('error', kind, id, 'trigger-no-effect', `${where} (${trigger.on}): the trigger has no effects, so it never does anything.`, 'Add at least one effect to the trigger, or delete it.');
  }
  if (trigger.on !== 'cardPlayed' && (trigger.cardType !== undefined || trigger.tag !== undefined)) {
    out.add('warning', kind, id, 'trigger-stray-filter', `${where}: cardType/tag filters only work for "cardPlayed"; they are ignored for "${trigger.on}".`, 'Remove the filter or change the event to cardPlayed.');
  }
  if (trigger.tag !== undefined && !tagsDeclared.has(trigger.tag)) {
    out.add('warning', kind, id, 'trigger-unknown-tag', `${where}: filters on tag "${trigger.tag}" but no card has that tag, so it never fires.`, `Add tags: ['${trigger.tag}'] to a card, or fix the spelling.`);
  }
  (trigger.effects ?? []).forEach((effect, i) => checkEffect(effect, { ...ctx, where: `${where}.effects[${i}]`, who: 'trigger' }));
}

function allEffectsOfCard(card: CardDefinition): Effect[] {
  return [...(card.effects ?? []), ...(card.onTurnStartEffect ? [card.onTurnStartEffect] : []), ...(card.triggers ?? []).flatMap((t) => t.effects ?? [])];
}

/** Every tag a scaling block or trigger filter reads. */
function tagsRead(cards: readonly CardDefinition[], relics: readonly RelicDefinition[]): Set<string> {
  const read = new Set<string>();
  const effects: Effect[] = [];
  const triggers: Trigger[] = [];
  for (const c of cards) {
    effects.push(...allEffectsOfCard(c));
    triggers.push(...(c.triggers ?? []));
  }
  for (const r of relics) {
    effects.push(...(r.onCombatStart ?? []), ...(r.onTurnStart ?? []), ...(r.triggers ?? []).flatMap((t) => t.effects ?? []));
    triggers.push(...(r.triggers ?? []));
  }
  for (const e of effects) if ('scaling' in e && e.scaling?.tag) read.add(e.scaling.tag);
  for (const t of triggers) if (t.tag) read.add(t.tag);
  return read;
}

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

// ---------- cards ----------

function checkCards(world: ContentWorld, out: Collector): void {
  const tagsDeclared = new Set<string>();
  for (const c of Object.values(world.registry)) for (const t of c.tags ?? []) tagsDeclared.add(t);
  const tagsUsed = tagsRead(Object.values(world.registry), world.relics);

  const eventCardIds = new Set<string>();
  for (const e of Object.values(world.events)) for (const ch of e.choices) for (const o of ch.outcomes) if (o.kind === 'card') eventCardIds.add(o.cardId);
  const starterIds = new Set(world.starterDeck.map((c) => c.id));
  const poolIds = new Set(world.rewardPool.map((c) => c.id));

  // duplicate names
  const byName = new Map<string, string[]>();
  for (const card of world.cards) {
    const key = card.name.trim().toLowerCase();
    byName.set(key, [...(byName.get(key) ?? []), card.id]);
  }
  for (const [name, ids] of byName) {
    if (ids.length > 1 && name !== '') {
      for (const id of ids) out.add('warning', 'card', id, 'duplicate-name', `Another card has the same name "${name}" (${ids.join(', ')}); players cannot tell them apart.`, 'Give each card a distinct name.');
    }
  }

  for (const card of world.cards) {
    const id = card.id;
    const file = FILE.card;
    if (world.registry[id] !== card) {
      out.add('error', 'card', id, 'not-registered', `Card "${card.name}" is not in the CARDS registry under its id.`, `Add it to ALL_CARDS in ${file} (and make sure the id is unique).`);
    }
    if (!card.name || card.name.trim() === '') out.add('error', 'card', id, 'empty-name', 'The card has no name.', 'Set name.');
    if (!Number.isInteger(card.cost) || card.cost < 0) {
      out.add('error', 'card', id, 'bad-cost', `Cost ${String(card.cost)} is not a whole number of 0 or more.`, 'Set cost to 0, 1, 2...');
    } else if (card.cost > world.maxEnergy) {
      out.add('error', 'card', id, 'unplayable-cost', `Costs ${card.cost} but the player only ever has ${world.maxEnergy} energy, so it can never be played.`, `Lower the cost to ${world.maxEnergy} or less, or raise MAX_ENERGY in src/data/tunables.ts.`);
    }

    // text
    const text = safeText(() => cardText(card));
    if (text === undefined) out.add('error', 'card', id, 'text-throws', "The card's text cannot be generated (probably an unknown status id or a malformed effect).", 'Fix the effect error listed for this card.');
    else if (text.trim() === '') out.add('error', 'card', id, 'empty-text', 'The card shows no text: it has no effects, no turn-start effect, no triggers and no description.', 'Give it effects (or triggers, for a power).');
    if (card.description !== undefined) {
      out.add('warning', 'card', id, 'hand-written-text', 'The card has a hand-written `description`, so its text will NOT follow the numbers if they change.', 'Delete `description` and let the text be generated, unless a special rule truly cannot be expressed as effects.');
    }

    // shape
    if (card.type === 'power' && !card.effects?.length && !card.onTurnStartEffect && !card.triggers?.length) {
      out.add('error', 'card', id, 'empty-power', 'This power does nothing: no effects, onTurnStartEffect or triggers.', 'Give it something to do.');
    }
    if (card.type !== 'power' && card.triggers?.length) {
      out.add('error', 'card', id, 'trigger-not-power', 'Triggers only work on power cards (they start when the power is played); this card is not a power.', "Set type: 'power', or move the effect into effects.");
    }
    if (card.type !== 'power' && card.onTurnStartEffect) {
      out.add('error', 'card', id, 'turnstart-not-power', 'onTurnStartEffect only works on power cards.', "Set type: 'power', or move the effect into effects.");
    }
    if (card.type === 'attack' && !(card.effects ?? []).some((e) => e.kind === 'damage')) {
      out.add('info', 'card', id, 'attack-without-damage', "This is an 'attack' card but has no damage effect.", "Fine if intended (e.g. Empowered reads 'attack'); otherwise make it a skill.");
    }
    for (const t of card.tags ?? []) {
      if (t.trim() === '') out.add('error', 'card', id, 'empty-tag', 'The card has an empty tag.', 'Remove it or give it a name.');
      else if (!tagsUsed.has(t)) out.add('info', 'card', id, 'tag-unused', `Tag "${t}" is on this card but nothing reads it (no scaling or trigger uses it).`, 'Fine while designing; add a payoff card or remove the tag.');
    }

    // effects and triggers on the base card, then on its upgrade
    const variants: [string, CardDefinition][] = [[card.name, card]];
    const upgraded = card.upgrade ? world.registry[`${id}+`] : undefined;
    if (upgraded) variants.push([`${card.name}+`, upgraded]);
    for (const [label, def] of variants) {
      const ctx = { kind: 'card' as const, id, statuses: world.statuses, out, aimed: def.target === 'enemy' };
      const prefix = def === card ? '' : 'Upgrade: ';
      const tag = (w: string): string => `${prefix}${w}`;
      (def.effects ?? []).forEach((e, i) => checkEffect(e, { ...ctx, where: tag(`effects[${i}]`), who: 'card' }));
      if (def.onTurnStartEffect) checkEffect(def.onTurnStartEffect, { ...ctx, where: tag('onTurnStartEffect'), who: 'trigger' });
      (def.triggers ?? []).forEach((t, i) => checkTrigger(t, i, ctx, tagsDeclared));
      if (def !== card) {
        const upText = safeText(() => cardText(def));
        if (upText === undefined || upText.trim() === '') out.add('error', 'card', id, 'empty-upgrade-text', `${label} shows no text.`, "Fix the upgrade block's effects.");
      }
    }

    // upgrades
    if (!card.upgrade) {
      out.add('warning', 'card', id, 'no-upgrade', 'The card has no upgrade block, so it cannot be upgraded at a rest stop.', 'Add `upgrade: { ... }` (only the fields that change), or accept that this card never upgrades.');
    } else if (!upgraded) {
      out.add('error', 'card', id, 'upgrade-not-registered', `The card has an upgrade block but "${id}+" is not registered.`, `Check ${file}: upgrades are generated from the block; the id must be unique.`);
    } else {
      const upText = safeText(() => cardText(upgraded));
      const baseText = safeText(() => cardText(card));
      if (upText !== undefined && upText === baseText && upgraded.cost === card.cost) {
        out.add('error', 'card', id, 'upgrade-no-change', 'The upgrade changes nothing: same cost and same text.', 'Change a number in the upgrade block (or remove the block if the card should not upgrade).');
      }
      if (upgraded.cost > card.cost) out.add('warning', 'card', id, 'upgrade-costs-more', `The upgrade costs more (${card.cost} to ${upgraded.cost}).`, 'Confirm this is intended.');
      const be = card.effects ?? [];
      const ue = upgraded.effects ?? [];
      if (be.length === ue.length) {
        be.forEach((b, i) => {
          const u = ue[i];
          if (b.kind === u.kind && 'value' in b && 'value' in u && b.value > u.value) {
            out.add('warning', 'card', id, 'upgrade-weaker', `The upgrade lowers a ${b.kind} value (${b.value} to ${u.value}).`, 'Confirm this is intended.');
          }
        });
      }
      if (card.upgrade && sameJson(card.upgrade, {})) out.add('error', 'card', id, 'empty-upgrade', 'The upgrade block is empty.', 'Add what changes, or remove the block.');
    }

    // reachability
    const reachable = starterIds.has(id) || poolIds.has(id) || eventCardIds.has(id);
    if (world.testCardIds.has(id)) {
      if (!reachable) out.add('info', 'card', id, 'test-card', 'Engine test card: not offered to players (and not meant to be).', 'Nothing to do. Move it into cards.ts with inRewardPool: true to make it a real card.');
    } else if (!reachable) {
      if (card.inRewardPool) {
        out.add('info', 'card', id, 'other-hero-pool', `Marked inRewardPool but belongs to "${card.owner}", whose pool is not the playable hero's.`, 'Nothing to do until that hero exists.');
      } else {
        out.add('warning', 'card', id, 'unreachable', 'No player can ever get this card: it is not in the starter deck, not in the reward pool (inRewardPool is false) and no event gives it.', 'Set inRewardPool: true, add it to the starter deck, or give it through an event (kind: "card"). Ignore if it is a work in progress.');
      }
    }
    if (card.inRewardPool && starterIds.has(id)) {
      out.add('info', 'card', id, 'starter-in-pool', 'The card is both in the starter deck and in the reward pool.', 'Fine if intended.');
    }
  }

  // cohort extremes: per-energy damage and block of single-hit values, unscaled
  const stat = (c: CardDefinition, kind: 'damage' | 'block'): number => (c.effects ?? []).filter((e) => e.kind === kind && !('scaling' in e && e.scaling)).reduce((s, e) => s + ('value' in e ? e.value : 0), 0);
  for (const kind of ['damage', 'block'] as const) {
    const rows = world.cards.map((c) => ({ c, per: stat(c, kind) / Math.max(c.cost, 0.5) })).filter((r) => r.per > 0);
    if (rows.length < MIN_COHORT) continue;
    const mid = median(rows.map((r) => r.per));
    for (const { c, per } of rows) {
      if (per > mid * EXTREME_HIGH) out.add('warning', 'card', c.id, 'extreme-high', `${kind} per energy (${per.toFixed(1)}) is over ${EXTREME_HIGH}x the typical card's (${mid.toFixed(1)}).`, 'Check the number is not a typo (an extra digit?). Then run `npm run balance -- cards`.');
      else if (per < mid * EXTREME_LOW) out.add('warning', 'card', c.id, 'extreme-low', `${kind} per energy (${per.toFixed(1)}) is under 1/${Math.round(1 / EXTREME_LOW)} of the typical card's (${mid.toFixed(1)}).`, 'Check the number is not a typo. Fine for a card whose value is elsewhere.');
    }
  }
}

// ---------- relics ----------

function checkRunEffect(effect: RunEffect, id: string, where: string, out: Collector): void {
  if (!Number.isFinite(effect.value) || effect.value === 0) {
    out.add('warning', 'relic', id, 'run-effect-zero', `${where}: ${effect.kind} value is ${String(effect.value)} and does nothing.`, 'Give it a non-zero number.');
  }
}

function checkRelics(world: ContentWorld, out: Collector): void {
  const tagsDeclared = new Set<string>();
  for (const c of Object.values(world.registry)) for (const t of c.tags ?? []) tagsDeclared.add(t);
  const poolIds = new Set(world.relicPool.map((r) => r.id));
  const names = new Map<string, string[]>();
  for (const r of world.relics) names.set(r.name.trim().toLowerCase(), [...(names.get(r.name.trim().toLowerCase()) ?? []), r.id]);
  for (const [name, ids] of names) if (ids.length > 1) for (const id of ids) out.add('warning', 'relic', id, 'duplicate-name', `Another relic has the same name "${name}" (${ids.join(', ')}).`, 'Give each relic a distinct name.');

  for (const relic of world.relics) {
    const id = relic.id;
    if (!relic.name || relic.name.trim() === '') out.add('error', 'relic', id, 'empty-name', 'The relic has no name.', 'Set name.');
    const text = safeText(() => relicText(relic));
    if (text === undefined) out.add('error', 'relic', id, 'text-throws', "The relic's text cannot be generated (probably an unknown status id).", 'Fix the effect error listed for this relic.');
    else if (text.trim() === '') out.add('error', 'relic', id, 'empty-text', 'The relic does nothing and shows no text: it has no onPickup, onVictory, onCombatStart, onTurnStart, triggers or description.', 'Give it at least one of those hooks.');
    if (relic.description !== undefined) out.add('warning', 'relic', id, 'hand-written-text', 'The relic has a hand-written `description`, so its text will NOT follow the numbers if they change.', 'Delete `description` unless a rule cannot be expressed as effects.');

    const ctx = { kind: 'relic' as const, id, statuses: world.statuses, out, aimed: false };
    (relic.onCombatStart ?? []).forEach((e, i) => checkEffect(e, { ...ctx, where: `onCombatStart[${i}]`, who: 'relic' }));
    (relic.onTurnStart ?? []).forEach((e, i) => checkEffect(e, { ...ctx, where: `onTurnStart[${i}]`, who: 'relic' }));
    (relic.triggers ?? []).forEach((t, i) => checkTrigger(t, i, ctx, tagsDeclared));
    (relic.onPickup ?? []).forEach((e, i) => checkRunEffect(e, id, `onPickup[${i}]`, out));
    (relic.onVictory ?? []).forEach((e, i) => checkRunEffect(e, id, `onVictory[${i}]`, out));

    if (!poolIds.has(id)) {
      if (world.testRelicIds.has(id)) out.add('info', 'relic', id, 'test-relic', 'Engine test relic: not in the relic pool (and not meant to be).', 'Nothing to do. Add it to RELIC_POOL in relics.ts to make it findable.');
      else out.add('warning', 'relic', id, 'outside-pool', 'The relic is not in RELIC_POOL, so no elite or event will ever give it.', `Add it to RELIC_POOL in ${FILE.relic}, or ignore if it is a work in progress.`);
    }
  }
  if (world.relicPool.length === 0) {
    out.add('error', 'act', 'relic-pool', 'empty-relic-pool', 'The relic pool is empty, but elites and events try to give relics.', 'Add a relic to RELIC_POOL in src/data/relics.ts.');
  }
}

// ---------- enemies ----------

const moveDamage = (move: EnemyMove): number => move.effects.reduce((s, e) => s + (e.kind === 'damage' ? e.value : 0), 0);

function checkEnemies(world: ContentWorld, out: Collector): void {
  const enemies = Object.values(world.enemies);
  const actIds = new Set<string>();
  const lists = [world.act.earlyEncounters, world.act.encounters, world.act.lateEncounters ?? [], world.act.elites, world.act.bosses];
  for (const list of lists) for (const fight of list) for (const eid of fight) actIds.add(eid);
  for (const e of Object.values(world.events)) for (const c of e.choices) for (const o of c.outcomes) if (o.kind === 'fight') for (const eid of o.enemies) actIds.add(eid);

  const names = new Map<string, string[]>();
  for (const e of enemies) names.set(e.name.trim().toLowerCase(), [...(names.get(e.name.trim().toLowerCase()) ?? []), e.id]);
  for (const [name, ids] of names) if (ids.length > 1) for (const id of ids) out.add('warning', 'enemy', id, 'duplicate-name', `Another enemy has the same name "${name}" (${ids.join(', ')}).`, 'Give each enemy a distinct name.');

  const hpMid = median(enemies.map((e) => e.maxHp));
  const hitMid = median(enemies.map((e) => Math.max(0, ...e.movePattern.map(moveDamage))).filter((n) => n > 0));

  for (const enemy of enemies) {
    const id = enemy.id;
    if (!enemy.name || enemy.name.trim() === '') out.add('error', 'enemy', id, 'empty-name', 'The enemy has no name.', 'Set name.');
    if (!Number.isFinite(enemy.maxHp) || enemy.maxHp <= 0) out.add('error', 'enemy', id, 'bad-hp', `maxHp ${String(enemy.maxHp)} is not a positive number.`, 'Set maxHp above 0.');
    if (enemy.movePattern.length === 0) out.add('error', 'enemy', id, 'no-moves', 'The enemy has no moves, so it never acts and has no intent.', 'Add at least one move to movePattern.');
    const stats = enemy.movePattern;
    enemy.movePattern.forEach((move, i) => {
      const label = move.name ? `move ${i + 1} "${move.name}"` : `move ${i + 1}`;
      if (!move.name || move.name.trim() === '') out.add('warning', 'enemy', id, 'unnamed-move', `${label} has no name (it appears in the combat log).`, 'Give the move a name.');
      if (move.effects.length === 0) {
        out.add('error', 'enemy', id, 'empty-move', `${label} has no effects: the enemy does nothing and its intent shows nothing.`, 'Add an effect (damage, block or applyStatus).');
      } else {
        const text = safeText(() => move.effects.map((e) => describeEffect(e)).join(' '));
        if (text === undefined) out.add('error', 'enemy', id, 'text-throws', `${label}: its text cannot be generated (unknown status id?).`, 'Fix the effect error listed for this enemy.');
        const showsIcon = move.effects.some((e) => EFFECT_KINDS[e.kind as Effect['kind']]?.intentIcon);
        if (!showsIcon) out.add('error', 'enemy', id, 'invisible-intent', `${label}: none of its effects show an intent icon (only damage, block and applyStatus do), so the player sees nothing.`, 'Use damage, block or applyStatus.');
      }
      move.effects.forEach((e, j) => checkEffect(e, { kind: 'enemy', id, where: `${label}, effects[${j}]`, who: 'enemy', aimed: false, statuses: world.statuses, out }));
      const hit = moveDamage(move);
      if (hit >= world.playerMaxHp) out.add('warning', 'enemy', id, 'one-shot', `${label} deals ${hit} damage, at least the player's whole max HP (${world.playerMaxHp}).`, 'Check the number is not a typo; a one-shot from full HP is rarely intended.');
    });
    if (stats.length > 0 && stats.every((m) => moveDamage(m) === 0)) out.add('warning', 'enemy', id, 'never-attacks', 'None of its moves deal damage, so it can never hurt the player directly.', 'Fine for a pure support enemy; otherwise add an attack.');
    if (enemies.length >= MIN_COHORT) {
      if (enemy.maxHp > hpMid * EXTREME_HIGH * 1.5) out.add('warning', 'enemy', id, 'extreme-high', `HP ${enemy.maxHp} is over ${EXTREME_HIGH * 1.5}x the typical enemy's (${hpMid}).`, 'Check the number is not a typo.');
      else if (enemy.maxHp < hpMid * EXTREME_LOW / 2) out.add('warning', 'enemy', id, 'extreme-low', `HP ${enemy.maxHp} is tiny next to the typical enemy's (${hpMid}).`, 'Check the number is not a typo.');
      const big = Math.max(0, ...stats.map(moveDamage));
      if (hitMid > 0 && big > hitMid * EXTREME_HIGH) out.add('warning', 'enemy', id, 'extreme-hit', `Its biggest hit (${big}) is over ${EXTREME_HIGH}x the typical enemy's biggest hit (${hitMid}).`, 'Check the number is not a typo.');
    }
    if (!actIds.has(id)) out.add('warning', 'enemy', id, 'not-in-act', 'The enemy is not in any act fight list or event, so the player never meets it.', `Add it to a list in ACT_CONTENT (${FILE.act}), or ignore if it is a work in progress. Fights not in the act can still be tested: npm run balance -- ladder --fights ${id}.`);
  }
}

// ---------- events ----------

function checkEvents(world: ContentWorld, out: Collector): void {
  const events = Object.values(world.events);
  const titles = new Map<string, string[]>();
  for (const e of events) titles.set(e.title.trim().toLowerCase(), [...(titles.get(e.title.trim().toLowerCase()) ?? []), e.id]);
  for (const [t, ids] of titles) if (ids.length > 1) for (const id of ids) out.add('warning', 'event', id, 'duplicate-name', `Another event has the same title "${t}" (${ids.join(', ')}).`, 'Give each event a distinct title.');

  const actEvents = new Set(world.act.events);
  for (const event of events) {
    const id = event.id;
    if (!event.title.trim()) out.add('error', 'event', id, 'empty-title', 'The event has no title.', 'Set title.');
    if (!event.text.trim()) out.add('error', 'event', id, 'empty-text', 'The event has no text.', 'Set text.');
    if (event.choices.length === 0) out.add('error', 'event', id, 'no-choices', 'The event has no choices, so the player is stuck.', 'Add at least one choice.');
    const labels = new Set<string>();
    let freeChoice = false;
    for (const [i, choice] of event.choices.entries()) {
      const label = choice.label.trim() || `(choice ${i + 1})`;
      if (!choice.label.trim()) out.add('error', 'event', id, 'empty-label', `Choice ${i + 1} has no label.`, 'Set label.');
      if (labels.has(label)) out.add('warning', 'event', id, 'duplicate-label', `Two choices are both labelled "${label}".`, 'Give each choice its own label.');
      labels.add(label);
      let costs = false;
      for (const o of choice.outcomes) {
        if (safeText(() => describeOutcome(o)) === undefined) out.add('error', 'event', id, 'text-throws', `Choice "${label}": an outcome cannot be described (unknown card or enemy id?).`, 'See the unknown-card / unknown-enemy message for this event.');
        if (o.kind === 'card' && !world.registry[o.cardId]) out.add('error', 'event', id, 'unknown-card', `Choice "${label}" gives card "${o.cardId}", which does not exist.`, 'Use a real card id from src/data/cards.ts.');
        if (o.kind === 'fight') {
          if (o.enemies.length === 0) out.add('error', 'event', id, 'empty-fight', `Choice "${label}" starts a fight with no enemies.`, 'List at least one enemy id.');
          for (const eid of o.enemies) if (!world.enemies[eid]) out.add('error', 'event', id, 'unknown-enemy', `Choice "${label}" fights "${eid}", which does not exist.`, 'Use a real enemy id from src/data/enemies.ts.');
          if (o.enemies.length > 3) out.add('warning', 'event', id, 'too-many-enemies', `Choice "${label}" fights ${o.enemies.length} enemies; the screen lays out 3.`, 'Use 3 or fewer.');
        }
        if ('value' in o && (!Number.isFinite(o.value) || o.value === 0)) out.add('warning', 'event', id, 'zero-outcome', `Choice "${label}": ${o.kind} ${String(o.value)} does nothing.`, 'Use a non-zero number.');
        if ('value' in o && o.value < 0) costs = true;
        if (o.kind === 'fight') costs = true;
        if (o.kind === 'relic' && world.relicPool.length === 0) out.add('error', 'event', id, 'no-relics', `Choice "${label}" gives a relic but the relic pool is empty.`, 'Add relics to RELIC_POOL.');
      }
      if (!costs) freeChoice = true;
    }
    if (event.choices.length > 0 && !freeChoice) out.add('warning', 'event', id, 'no-free-choice', 'Every choice costs HP, gold or a fight; the player is forced to pay.', 'Add a choice with no cost (e.g. "Leave").');
    if (!actEvents.has(id)) out.add('warning', 'event', id, 'not-in-act', 'The event is not in ACT_CONTENT.events, so it never appears on the map.', `Add it to events in ${FILE.act}.`);
  }
}

// ---------- statuses ----------

function checkStatuses(world: ContentWorld, out: Collector): void {
  const used = new Set<string>();
  const note = (effects: readonly Effect[]): void => {
    for (const e of effects) if ('status' in e) used.add(e.status);
  };
  for (const c of Object.values(world.registry)) note(allEffectsOfCard(c));
  for (const r of world.relics) note([...(r.onCombatStart ?? []), ...(r.onTurnStart ?? []), ...(r.triggers ?? []).flatMap((t) => t.effects ?? [])]);
  for (const en of Object.values(world.enemies)) for (const m of en.movePattern) note(m.effects);

  const symbols = new Map<string, string[]>();
  const names = new Map<string, string[]>();
  for (const [key, s] of Object.entries(world.statuses)) {
    if (s.id !== key) out.add('error', 'status', key, 'id-mismatch', `Registered under "${key}" but its id is "${s.id}".`, 'Make the key and id match.');
    if (!s.name.trim()) out.add('error', 'status', key, 'empty-name', 'The status has no name.', 'Set name.');
    const text = safeText(() => s.describe(2));
    if (text === undefined || text.trim() === '') out.add('error', 'status', key, 'empty-text', 'describe() returns no text, so the tooltip is blank.', 'Make describe(stacks) return a sentence.');
    names.set(s.name.toLowerCase(), [...(names.get(s.name.toLowerCase()) ?? []), key]);
    symbols.set(s.badge.symbol, [...(symbols.get(s.badge.symbol) ?? []), key]);
    if (!used.has(key)) out.add('info', 'status', key, 'status-unused', 'No card, relic or enemy applies this status.', 'Fine while designing.');
  }
  for (const [name, ids] of names) if (ids.length > 1) for (const id of ids) out.add('warning', 'status', id, 'duplicate-name', `Another status has the name "${name}".`, 'Give each status a distinct name.');
  for (const [sym, ids] of symbols) if (ids.length > 1) for (const id of ids) out.add('warning', 'status', id, 'duplicate-badge', `Badge symbol "${sym}" is shared with ${ids.filter((x) => x !== id).join(', ')}; the badges look the same.`, 'Give each status a different badge symbol or colour.');
}

// ---------- the act ----------

function checkAct(world: ContentWorld, out: Collector): void {
  const lists: [string, string[][]][] = [
    ['earlyEncounters', world.act.earlyEncounters],
    ['encounters', world.act.encounters],
    ['lateEncounters', world.act.lateEncounters ?? world.act.encounters],
    ['elites', world.act.elites],
    ['bosses', world.act.bosses],
  ];
  for (const [name, list] of lists) {
    if (list.length === 0) out.add('error', 'act', name, 'empty-list', `ACT_CONTENT.${name} is empty, so the map cannot place that kind of fight.`, `Add at least one fight (a list of enemy ids) to ${name} in ${FILE.act}.`);
    list.forEach((fight, i) => {
      if (fight.length === 0) out.add('error', 'act', name, 'empty-fight', `${name}[${i}] is a fight with no enemies.`, 'List at least one enemy id.');
      if (fight.length > 3) out.add('warning', 'act', name, 'too-many-enemies', `${name}[${i}] has ${fight.length} enemies; the screen lays out 3.`, 'Use 3 or fewer.');
      for (const eid of fight) if (!world.enemies[eid]) out.add('error', 'act', name, 'unknown-enemy', `${name}[${i}] uses enemy "${eid}", which does not exist.`, 'Use a real enemy id from src/data/enemies.ts.');
    });
  }
  for (const eid of world.act.events) if (!world.events[eid]) out.add('error', 'act', 'events', 'unknown-event', `ACT_CONTENT.events lists "${eid}", which does not exist.`, 'Use a real event id from src/data/events.ts.');
  if (world.rewardPool.length < 3) out.add('warning', 'act', 'rewardPool', 'small-pool', `The reward pool has ${world.rewardPool.length} cards; rewards offer 3 to choose from.`, 'Add reward-pool cards (inRewardPool: true).');
  const wrong = world.rewardPool.filter((c) => c.upgradeOf !== undefined);
  for (const c of wrong) out.add('error', 'act', c.id, 'upgraded-in-pool', `Upgraded card ${c.name} is in the reward pool.`, 'Upgrades must never be offered by themselves.');
}

// ---------- entry points ----------

const ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/** All issues, errors first, then warnings, then info; stable within a severity. */
export function validateContent(world: ContentWorld): Issue[] {
  const out = new Collector();
  checkCards(world, out);
  checkRelics(world, out);
  checkEnemies(world, out);
  checkEvents(world, out);
  checkStatuses(world, out);
  checkAct(world, out);
  return out.issues.map((issue, i) => ({ issue, i })).sort((a, b) => ORDER[a.issue.severity] - ORDER[b.issue.severity] || a.i - b.i).map((x) => x.issue);
}

export function countBySeverity(issues: readonly Issue[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  for (const i of issues) counts[i.severity] += 1;
  return counts;
}

/** Human-readable report. Info lines are listed only when `showInfo` is set. */
export function formatIssues(issues: readonly Issue[], opts: { showInfo?: boolean } = {}): string {
  const shown = issues.filter((i) => opts.showInfo || i.severity !== 'info');
  const lines: string[] = [];
  for (const i of shown) {
    lines.push(`${i.severity.toUpperCase().padEnd(7)} ${i.kind} ${i.id}: ${i.message}`);
    lines.push(`        Fix: ${i.fix}`);
  }
  const c = countBySeverity(issues);
  if (lines.length > 0) lines.push('');
  lines.push(`${c.error} error(s), ${c.warning} warning(s), ${c.info} note(s)${opts.showInfo || c.info === 0 ? '' : ' (add --info to list notes)'}.`);
  return lines.join('\n');
}
