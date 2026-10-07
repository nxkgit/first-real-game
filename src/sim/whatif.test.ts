import { describe, expect, it } from 'vitest';
import { getCard } from '../data/cards';
import { runCommand } from './commands';
import { loopsExperiment } from './loops';
import { applyAssignments, parseAssignments } from './tweak';

describe('what-if tooling', () => {
  const io = { readText: (): string => '' };

  it('--tweak changes a card in memory for one command and restores it afterwards', () => {
    const card = getCard('blood-strike');
    const before = JSON.stringify(card);
    const r = runCommand('deck', { cards: 'blood-strike*3,strike*2', seeds: '2', fights: 'enemy-d', skills: 'greedy', turns: '2', tweak: 'blood-strike:effects.0.value=0' }, io, 'd');
    expect(r.markdown).toContain('Fixed deck');
    expect(JSON.stringify(card)).toBe(before);
    const strike = JSON.stringify(getCard('strike'));
    expect(() => runCommand('deck', { cards: 'strike', tweak: 'strike:effects.9.value=1' }, io, 'd')).toThrow();
    expect(JSON.stringify(getCard('strike'))).toBe(strike);
  });

  it('a tweak that removes a loop is visible to the loop finder', () => {
    const universe = ['prime-a', 'tag-a-echo', 'strike'].map(getCard);
    const search = () => loopsExperiment({ cards: universe, maxSize: 3, maxCopies: 1, threshold: 20, skill: 'smart', seed: 1, turns: 2 });
    expect(search().hits.map((h) => h.cards.join(','))).toContain('prime-a,tag-a-echo');
    const restore = applyAssignments(getCard('tag-a-echo'), parseAssignments('triggers.0.oncePerTurn=true'));
    try {
      expect(search().hits).toEqual([]);
    } finally {
      restore();
    }
    expect(getCard('tag-a-echo').triggers?.[0].oncePerTurn).toBeUndefined();
  });

  it('tweak command reports before / after / change and can append an effect', () => {
    const r = runCommand('tweak', { card: 'kill-reward', set: 'triggers.0.effects.1={"kind":"draw","value":1}', seeds: '2', fights: 'enemy-d+enemy-d', skills: 'greedy' }, io, 'd');
    expect(r.markdown).toContain('change from the tweak');
    expect(getCard('kill-reward').triggers?.[0].effects).toHaveLength(1);
  });

  it('ablate and dominance run', () => {
    const a = runCommand('ablate', { sets: 'syn-tag', seeds: '2', fights: 'enemy-d', skills: 'greedy' }, io, 'd');
    expect(a.markdown).toContain('tag-a-echo');
    expect(runCommand('dominance', {}, io, 'd').markdown).toContain('dominance');
  });

  it('pair verdicts are judged against the typical pair when there are many', () => {
    const r = runCommand('pairs', { seeds: '2', fights: 'enemy-d', skills: 'greedy', skill: 'greedy', 'max-pairs': '25', cardset: 'synergy' }, io, 'd');
    expect(r.markdown).toContain('TYPICAL pair');
  });
});
