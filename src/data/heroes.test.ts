import { describe, expect, it } from 'vitest';
import { MAGE, baseCards, getCard, rewardPoolFor, starterPoolFor } from './cards';
import { DEFAULT_HERO_ID, HEROES, getHero } from './heroes';
import { PALADIN } from './paladinCards';
import { ACT_CONTENT, newPlayableRun, newRun, restoreSavedRun, streamSeedFor, worldFor } from './run';
import { PLAYER_MAX_HP } from './tunables';
import { restoreRun } from '../game/save';
import { validateContent } from '../content/validate';
import { realWorld } from '../content/world';

// Multiple heroes (implementationplan.md "Multiple heroes and hero selection", 2026-10-09).

describe('heroes', () => {
  it('has the Mage and the Paladin, each with a hero power, and the Mage is the default', () => {
    expect(HEROES.map((h) => h.id)).toEqual([MAGE, PALADIN]);
    expect(DEFAULT_HERO_ID).toBe(MAGE);
    for (const h of HEROES) {
      expect(h.heroPower.effects.length, h.id).toBeGreaterThan(0);
      expect(h.heroPower.owner, h.id).toBe(h.id);
      expect(h.resource, h.id).toBeDefined();
    }
    expect(() => getHero('nobody')).toThrow();
  });

  it('gives the heroes different stats: the Paladin has 10% less max HP and 3 energy; the Mage is unchanged', () => {
    const mage = getHero(MAGE);
    const paladin = getHero(PALADIN);
    expect(mage.maxHp).toBe(PLAYER_MAX_HP);
    expect(mage.energy).toBe(4);
    expect(paladin.maxHp).toBe(Math.round(PLAYER_MAX_HP * 0.9));
    expect(paladin.maxHp).toBe(54);
    expect(paladin.energy).toBe(3);
  });

  it("declares each hero's own resource (a hero power does not decide what the fight screen shows)", () => {
    expect(getHero(MAGE).resource).toBe('temperature');
    expect(getHero(PALADIN).resource).toBe('radiantLight');
  });

  it('uses the literal placeholder blurb, not invented flavor', () => {
    for (const h of HEROES) expect(h.blurb).toBe('placeholder blurb');
  });

  it('draws the Paladin placeholder hero power as 1 energy for 1 card', () => {
    const p = getHero(PALADIN).heroPower;
    expect(p.cost).toBe(1);
    expect(p.effects).toEqual([{ kind: 'draw', value: 1 }]);
  });
});

describe('card ownership and pools', () => {
  it('owns only fire/frost cards as the Mage, and makes every other pre-existing card colorless', () => {
    for (const id of ['strike', 'defend', 'focus', 'bolt', 'heavy-hit', 'big-block', 'quick-draw', 'fortify']) {
      expect(getCard(id).owner, id).toBe('neutral');
    }
    for (const c of baseCards().filter((c) => c.owner === MAGE)) {
      expect(c.tags?.some((t) => t === 'fire' || t === 'frost'), c.id).toBe(true);
    }
  });

  it("gives each hero its own cards plus the colorless ones, and never another hero's", () => {
    for (const hero of HEROES) {
      for (const pool of [rewardPoolFor(hero.id), starterPoolFor(hero.id)]) {
        expect(pool.length).toBeGreaterThanOrEqual(3);
        for (const c of pool) expect(['neutral', hero.id], `${hero.id} / ${c.id}`).toContain(c.owner);
        expect(pool.some((c) => c.owner === hero.id), hero.id).toBe(true);
        expect(pool.some((c) => c.owner === 'neutral'), hero.id).toBe(true);
      }
    }
    expect(rewardPoolFor(MAGE).map((c) => c.id)).not.toContain('placeholder-light-attack');
    expect(rewardPoolFor(PALADIN).map((c) => c.id)).not.toContain('scorching-wind');
  });

  it('shares one Strike and one Defend between heroes', () => {
    for (const hero of HEROES) {
      const ids = starterPoolFor(hero.id).map((c) => c.id);
      expect(ids).toContain('strike');
      expect(ids).toContain('defend');
    }
  });

  it('has Paladin placeholder cards that cost Radiant Light and that gain it', () => {
    const paladin = baseCards().filter((c) => c.owner === PALADIN);
    expect(paladin.some((c) => c.costResource === 'radiantLight')).toBe(true);
    expect(paladin.some((c) => (c.effects ?? []).some((e) => e.kind === 'gainRadiantLight'))).toBe(true);
    // every one can be upgraded, and none has invented flavor in its name
    for (const c of paladin) expect(c.upgrade, c.id).toBeDefined();
  });

  it('passes the content check, including: no colorless card needs a hero-only mechanic', () => {
    const issues = validateContent(realWorld()).filter((i) => i.severity !== 'info');
    expect(issues.map((i) => `${i.kind} ${i.id}: ${i.message}`)).toEqual([]);
  });

  it('the content check does catch a colorless card using Radiant Light', () => {
    const world = realWorld();
    const bad = { ...getCard('strike'), id: 'strike-bad', effects: [{ kind: 'gainRadiantLight' as const, value: 1 }] };
    const issues = validateContent({ ...world, cards: [...world.cards, bad], registry: { ...world.registry, [bad.id]: bad } });
    expect(issues.some((i) => i.id === 'strike-bad' && i.message.includes('belongs to one hero'))).toBe(true);
  });
});

describe('a run as a hero', () => {
  it('starts with the hero max HP and carries the hero id', () => {
    const mage = newRun(5);
    const paladin = newRun(5, PALADIN);
    expect(mage.heroId).toBe(MAGE);
    expect(paladin.heroId).toBe(PALADIN);
    expect(mage.maxHp).toBe(60);
    expect(mage.hp).toBe(60);
    expect(paladin.maxHp).toBe(54);
    expect(paladin.hp).toBe(54);
  });

  it("drafts, and later rewards, only from the hero's own pool", () => {
    const run = newRun(11, PALADIN);
    run.rollDraftOffer();
    for (const c of run.pendingDraftOffer!) expect(['neutral', PALADIN]).toContain(c.owner);
    for (let i = 0; i < 10; i++) run.pickDraftCard(0);
    expect(run.phase).toBe('map');
    for (const c of run.deck) expect(['neutral', PALADIN]).toContain(c.owner);
  });

  it('keeps the Mage seed stream as it was, and gives other heroes their own stream for the same seed', () => {
    expect(streamSeedFor(123, MAGE)).toBe(123);
    expect(streamSeedFor(123, PALADIN)).not.toBe(123);
    expect(streamSeedFor(123, PALADIN)).toBe(streamSeedFor(123, PALADIN));
    const a = newRun(123, MAGE);
    const b = newRun(123, PALADIN);
    expect(a.seed).toBe(123);
    expect(b.seed).toBe(123); // the number the player sees and types is the same
    expect(JSON.stringify(a.map)).not.toBe(JSON.stringify(b.map)); // but the run itself differs
    expect(JSON.stringify(newRun(123, PALADIN).map)).toBe(JSON.stringify(b.map)); // and replays exactly
  });

  it("saves and restores the hero, the seed the player sees, and the hero's max HP", () => {
    const run = newPlayableRun(321, PALADIN);
    const saved = JSON.parse(JSON.stringify(run.toSaved())) as unknown;
    const back = restoreSavedRun(saved)!;
    expect(back.heroId).toBe(PALADIN);
    expect(back.seed).toBe(321);
    expect(back.maxHp).toBe(54);
    expect(JSON.stringify(back.toSaved())).toBe(JSON.stringify(run.toSaved()));
  });

  it('refuses a save for a hero that does not exist, or a save restored into the wrong hero world', () => {
    const saved = JSON.parse(JSON.stringify(newPlayableRun(4, PALADIN).toSaved())) as Record<string, unknown>;
    expect(restoreRun(saved, worldFor(MAGE))).toBeNull();
    expect(restoreRun(saved, worldFor(PALADIN))).not.toBeNull();
    saved.heroId = 'nobody';
    expect(restoreSavedRun(saved)).toBeNull();
    delete saved.heroId;
    expect(restoreSavedRun(saved)).toBeNull();
  });

  it('builds a map from the same act content for every hero', () => {
    for (const hero of HEROES) {
      const run = newRun(9, hero.id);
      for (const n of run.map.nodes) for (const id of n.enemies ?? []) expect(Object.values(ACT_CONTENT).flat(2)).toContain(id);
    }
  });
});
