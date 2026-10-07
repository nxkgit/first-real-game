import { describe, expect, it } from 'vitest';
import { getEnemy } from '../data/enemies';
import { Rng } from '../game/rng';
import { DUMMY, PLAY_CAP, combosExperiment, comboUniverse, deckExperiment, dummyRun } from './combos';
import { unitSeed } from './engine';
import { runFight } from './fight';
import { createFight, rngStartFromSeed } from './fightCore';
import { BOTS, endTurn } from './skills';
import type { FightContext, SkillLevel } from './skills';
import { actFights, deckFromSpec, referenceDeckSets, synergyDeckSets } from './suites';
import { runCommand } from './commands';

/** A fight whose hand is exactly `cards` on turn 1 (the deck is the hand: HAND_SIZE is 5). */
function fiveCardTurn(cards: string[], enemy: string, skill: SkillLevel, player?: { hp: number; maxHp: number }) {
  const spec = { deck: deckFromSpec(cards), enemies: [enemy === 'dummy' ? DUMMY : getEnemy(enemy)], player };
  const start = rngStartFromSeed(5);
  const { combat } = createFight(spec, start);
  const ctx: FightContext = { combat, spec, start, history: [], rng: new Rng(1) };
  BOTS[skill].playTurn(ctx);
  return combat;
}

const played = (c: ReturnType<typeof fiveCardTurn>): string[] => [...c.deck.discardPile, ...c.deck.powerPile, ...c.deck.exhaustPile].map((x) => x.definition.id);
const dummyHp = (c: ReturnType<typeof fiveCardTurn>): number => DUMMY.maxHp - c.enemies[0].hp;

describe('smart bot: synergy mechanics', () => {
  it('plays tag enablers before the payoff that counts them (greedy plays the payoff first)', () => {
    const cards = ['prime-a', 'prime-a', 'tag-a-payoff', 'strike', 'defend'];
    const smart = dummyHp(fiveCardTurn(cards, 'dummy', 'smart'));
    const greedy = dummyHp(fiveCardTurn(cards, 'dummy', 'greedy'));
    // 3 + 5*2 for the payoff, plus a Strike
    expect(smart).toBe(19);
    expect(smart).toBeGreaterThan(greedy);
  });

  it('puts Empowered on the biggest hit, not a cheap one', () => {
    const smart = dummyHp(fiveCardTurn(['power-up', 'jab', 'bolt', 'defend', 'defend'], 'dummy', 'smart'));
    expect(smart).toBe(27); // Bolt 12 doubled, Jab 3
  });

  it('plays scaling-by-hand-size early, before the hand shrinks', () => {
    // Hand Strike with 4 other cards in hand: 2 + 2*4
    const smart = dummyHp(fiveCardTurn(['hand-strike', 'defend', 'defend', 'defend', 'defend'], 'dummy', 'smart'));
    expect(smart).toBe(10);
  });

  it('uses Cull (it exhausts a random card) only when the energy is needed', () => {
    const idle = fiveCardTurn(['cull', 'strike', 'strike', 'defend', 'defend'], 'enemy-a', 'smart');
    expect(idle.deck.exhaustPile.map((c) => c.definition.id)).toEqual([]);
    const needy = fiveCardTurn(['cull', 'bolt', 'heavy-hit', 'strike', 'strike'], 'enemy-a', 'smart');
    expect(needy.deck.exhaustPile.map((c) => c.definition.id)).toContain('cull');
    expect(needy.deck.exhaustPile.length).toBe(2);
  });

  it('does not spend a one-shot attack on overkill, but does when it kills', () => {
    const wasteful = fiveCardTurn(['single-use-strike', 'defend', 'defend', 'defend', 'defend'], 'enemy-d', 'smart');
    // 10 damage into a 20 HP enemy is fine
    expect(wasteful.deck.exhaustPile.map((c) => c.definition.id)).toEqual(['single-use-strike']);
  });

  it('never takes self-damage into lethal, and does take it when safe', () => {
    const dire = fiveCardTurn(['blood-strike', 'strike', 'strike', 'strike', 'strike'], 'enemy-a', 'smart', { hp: 6, maxHp: 60 });
    expect(dire.player.hp).toBe(6);
    expect(played(dire)).not.toContain('blood-strike');
    const safe = fiveCardTurn(['blood-strike', 'strike', 'strike', 'strike', 'strike'], 'enemy-a', 'smart', { hp: 40, maxHp: 60 });
    expect(played(safe)).toContain('blood-strike');
    expect(safe.player.hp).toBe(37);
  });

  it('gains energy before spending it', () => {
    // Cull's energy lets the Heavy Hit (3) and the Bolt (2) both be played with 4 energy: 24 + 12 ... with Cull exhausting only one card
    const c = fiveCardTurn(['cull', 'heavy-hit', 'bolt', 'strike', 'defend'], 'dummy', 'smart');
    expect(played(c)).toContain('cull');
    expect(dummyHp(c)).toBeGreaterThanOrEqual(24);
  });

  it('draw cards do not spin forever in a deck full of them', () => {
    const spec = { deck: deckFromSpec(['quick-draw*5', 'strike*3', 'defend', 'bolt']), enemies: [getEnemy('enemy-a')] };
    for (let s = 1; s <= 10; s++) {
      const r = runFight(spec, rngStartFromSeed(s), 'smart');
      expect(r.result).toBe('won');
    }
  });
});

describe('smart beats greedy where sequencing matters', () => {
  const total = (deck: string[], skill: SkillLevel): number => {
    let sum = 0;
    for (let i = 0; i < 30; i++) sum += dummyRun(deckFromSpec(deck), unitSeed(1, 'dummy', i), skill, 5).damage.reduce((a, b) => a + b, 0);
    return sum / 30;
  };

  it('on a combo-count deck', () => {
    const deck = ['strike*2', 'defend*2', 'jab*3', 'combo-strike*2', 'hand-strike*2', 'quick-draw', 'expose', 'opportunist'];
    expect(total(deck, 'smart')).toBeGreaterThan(total(deck, 'greedy') * 1.2);
  });

  it('on a tag deck', () => {
    const deck = ['strike*2', 'defend*3', 'prime-a*3', 'tag-a-payoff*2', 'tag-a-echo', 'bolt', 'jab*2'];
    expect(total(deck, 'smart')).toBeGreaterThan(total(deck, 'greedy') * 1.15);
  });

  it('and wins the exhaust deck at least as often as greedy (it once drew itself into a stall)', () => {
    const deck = synergyDeckSets()[1].decks[0];
    const wins = (skill: SkillLevel): number => {
      let w = 0;
      for (let i = 0; i < 20; i++) w += runFight({ deck, enemies: [getEnemy('elite-a')] }, rngStartFromSeed(unitSeed(1, 'elite-a', i)), skill).result === 'won' ? 1 : 0;
      return w;
    };
    expect(wins('smart')).toBeGreaterThanOrEqual(wins('greedy'));
    expect(wins('smart')).toBeGreaterThanOrEqual(18);
  });
});

describe('every bot on the synergy decks', () => {
  it('finishes, deterministically', () => {
    const fights = actFights().filter((f) => ['enemy-a', 'elite-b', 'boss-a'].includes(f.id));
    for (const set of synergyDeckSets()) {
      for (const skill of ['random', 'greedy', 'smart', 'expert'] as SkillLevel[]) {
        for (const f of fights) {
          const spec = { deck: set.decks[0], enemies: f.enemies.map(getEnemy) };
          const a = runFight(spec, rngStartFromSeed(3), skill);
          const b = runFight(spec, rngStartFromSeed(3), skill);
          expect(a).toEqual(b);
          expect(['won', 'lost', 'stalled']).toContain(a.result);
        }
      }
    }
  });

  it('expert still wins what smart wins (not required to beat it)', () => {
    const deck = synergyDeckSets()[4].decks[0];
    let wins = 0;
    for (let i = 0; i < 10; i++) wins += runFight({ deck, enemies: [getEnemy('elite-a')] }, rngStartFromSeed(unitSeed(2, 'elite-a', i)), 'expert').result === 'won' ? 1 : 0;
    expect(wins).toBeGreaterThanOrEqual(8);
  });
});

describe('synergy reference decks and new commands', () => {
  it('existing reference sets are unchanged by the synergy sets', () => {
    const core = referenceDeckSets();
    const withSyn = referenceDeckSets({ synergy: true });
    expect(core.map((s) => s.name)).toEqual(['starter', 'mid', 'late']);
    expect(withSyn.slice(0, 3).map((s) => s.decks.map((d) => d.map((c) => c.id)))).toEqual(core.map((s) => s.decks.map((d) => d.map((c) => c.id))));
    expect(withSyn.map((s) => s.name)).toContain('syn-mixed');
  });

  it('dummy runs report loops: a deck of 0-cost draw and tag cards hits the play cap', () => {
    const deck = deckFromSpec(['prime-a*8', 'tag-a-echo', 'tag-a-payoff']);
    const r = dummyRun(deck, 1, 'smart', 3);
    expect(Math.max(...r.plays)).toBeLessThanOrEqual(PLAY_CAP);
  });

  it('deck command runs an exact deck and the combos search is deterministic', () => {
    const io = { readText: (): string => '' };
    const r = runCommand('deck', { cards: 'strike*4,defend*4,bolt', seeds: '3', fights: 'enemy-a', skills: 'smart', turns: '3' }, io, '2026-01-01');
    expect(r.markdown).toContain('Fixed deck');
    expect(r.markdown).toContain('Dummy');
    const opts = { goal: 'damage' as const, skill: 'greedy' as SkillLevel, minSize: 8, maxSize: 12, trials: 6, climb: 3, searchSeeds: 2, confirmSeeds: 3, baseSeed: 1, cards: comboUniverse('synergy'), fights: [], dummyTurns: 2, top: 2, maxCopies: 2 };
    const a = combosExperiment(opts);
    expect(a.markdown).toContain('Adversarial search');
    expect(combosExperiment(opts).markdown).toBe(a.markdown);
    const speed = runCommand('combos', { goal: 'speed', trials: '4', climb: '2', 'search-seeds': '1', 'confirm-seeds': '2', top: '1', fights: 'enemy-d', skill: 'greedy' }, io, '2026-01-01');
    expect(speed.markdown).toContain('turns');
  });

  it('ladder and cards accept the synergy sets and card filter', () => {
    const io = { readText: (): string => '' };
    const tiny = { seeds: '1', fights: 'enemy-d', skills: 'greedy' };
    expect(runCommand('ladder', { ...tiny, sets: 'synergy' }, io, 'd').markdown).toContain('syn-tag');
    const c = runCommand('cards', { ...tiny, modes: 'add', cardset: 'synergy', context: 'syn-mult' }, io, 'd');
    expect(c.markdown).toContain('combo-strike');
    expect(c.markdown).not.toContain('| jab |');
    const p = runCommand('pairs', { ...tiny, cardset: 'synergy', 'max-pairs': '2', skill: 'greedy' }, io, 'd');
    expect(p.markdown).toContain('2 of');
  });
});
