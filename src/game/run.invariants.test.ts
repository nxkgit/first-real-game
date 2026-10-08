import { afterEach, describe, expect, it, vi } from 'vitest';
import { CombatState } from './CombatState';
import { RunState } from './RunState';
import { Rng } from './rng';
import { buildRunReport } from './runReport';
import { parseSavedRun } from './save';
import { isRunOver, playWholeRun, stepRun } from './invariantHarness';
import { newRun, restoreSavedRun } from '../data/run';
import { playBotTurn } from '../sim/bot';
import { playFight, playRun } from '../sim/simulate';

const SEEDS = 150;
const stepSeed = (seed: number, i: number): number => (seed * 7919 + i * 104729) >>> 0;
const roundTrip = (run: RunState): unknown => JSON.parse(JSON.stringify(run.toSaved()));

afterEach(() => vi.restoreAllMocks());

function summary(run: RunState): unknown {
  return { report: buildRunReport(run), saved: run.toSaved(), deck: run.deck.map((c) => c.id), gold: run.gold, hp: run.hp };
}

describe('whole-run determinism', () => {
  it('same seed + same scripted policy => identical report, HP, deck, gold and save, and no Math.random is ever used', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random called during a seeded run');
    });
    let finished = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const a = newRun(seed);
      const b = newRun(seed);
      const ka = playWholeRun(a, seed);
      const kb = playWholeRun(b, seed);
      expect(kb).toEqual(ka);
      expect(summary(b)).toEqual(summary(a));
      if (isRunOver(a)) finished++;
    }
    expect(spy).not.toHaveBeenCalled();
    expect(finished).toBeGreaterThan(SEEDS * 0.9); // the scripted policy really gets through whole acts
  });

  it('different seeds give different runs', () => {
    const reports = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const run = newRun(seed);
      playWholeRun(run, seed);
      reports.add(JSON.stringify(buildRunReport(run)));
    }
    expect(reports.size).toBeGreaterThan(28);
  });

  it('a run that is won or lost is stable: it ends in a terminal phase with HP in range', () => {
    let won = 0;
    let lost = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const run = newRun(seed);
      playWholeRun(run, seed);
      if (run.phase === 'won') won++;
      if (run.phase === 'lost') lost++;
      expect(run.hp).toBeGreaterThanOrEqual(0);
      expect(run.hp).toBeLessThanOrEqual(run.maxHp);
      expect(run.gold).toBeGreaterThanOrEqual(0);
      expect(run.deck.length).toBeGreaterThan(0);
      expect(run.visited.length).toBeGreaterThan(0);
    }
    expect(won + lost).toBeGreaterThan(SEEDS * 0.9);
    expect(lost).toBeGreaterThan(0); // a random-play policy must lose sometimes, or the fights aren't being exercised
  });
});

describe('save -> parse -> resume equivalence', () => {
  it('restoring from a save at every stop of a full run continues exactly like the original', () => {
    let stops = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const original = newRun(seed);
      for (let i = 0; i < 400 && !isRunOver(original); i++) {
        // snapshot at this stop, through real JSON and the validator, as the browser storage does
        const raw = roundTrip(original);
        expect(parseSavedRun(raw)).not.toBeNull();
        const resumed = restoreSavedRun(raw);
        expect(resumed, `seed ${seed} step ${i}: save was refused`).not.toBeNull();
        expect(resumed!.toSaved()).toEqual(original.toSaved());

        // the same decision on both, then they must still agree
        const ra = stepRun(original, stepSeed(seed, i));
        const rb = stepRun(resumed!, stepSeed(seed, i));
        expect(rb, `seed ${seed} step ${i}`).toEqual(ra);
        expect(resumed!.toSaved(), `seed ${seed} step ${i} (${ra.kind})`).toEqual(original.toSaved());
        stops++;
      }
    }
    expect(stops).toBeGreaterThan(SEEDS * 4); // random play dies early now that enemies have high HP (about 5.5 stops per run)
  });

  it('a save is idempotent: save, restore, save gives the same text', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const run = newRun(seed);
      for (let i = 0; i < 400 && !isRunOver(run); i++) {
        const text = JSON.stringify(run.toSaved());
        expect(JSON.stringify(restoreSavedRun(JSON.parse(text))!.toSaved())).toBe(text);
        stepRun(run, stepSeed(seed, i));
      }
    }
  });

  it('toSaved is a copy: later play does not rewrite an earlier snapshot', () => {
    const run = newRun(3);
    const early = JSON.stringify(run.toSaved());
    const snapshot = run.toSaved();
    playWholeRun(run, 3);
    expect(JSON.stringify(snapshot)).toBe(early);
  });

  it('after resuming, the next fight shuffles identically (a refresh cannot reroll a fight)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const run = newRun(seed);
      for (let i = 0; i < 400 && !isRunOver(run); i++) {
        const resumed = restoreSavedRun(roundTrip(run))!;
        expect(resumed.newCombatRng().position).toBe(run.newCombatRng().position);
        stepRun(run, stepSeed(seed, i));
      }
    }
  });
});

describe('differential: the simulator path and the RunState path agree', () => {
  it('a fight inside a run equals the same fight played standalone, for the same seed and policy', () => {
    let fights = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const run = newRun(seed);
      for (let i = 0; i < 400 && !isRunOver(run); i++) {
        const node = run.phase === 'inNode' ? run.currentNode : null;
        if (!node || node.kind !== 'combat') {
          stepRun(run, stepSeed(seed, i));
          continue;
        }
        // path 1 (simulator): playFight with the seed the run is about to hand out
        const fightSeed = Rng.restore(run.rng.seed, run.rng.position).nextSeed();
        const standalone = playFight(run.deck, node.enemies, { hp: run.hp, maxHp: run.maxHp }, new Rng(fightSeed), 60, run.relics);
        // path 2 (RunState): the run's own newCombatRng() driving a CombatState with the same bot
        const combat = new CombatState(run.deck, node.enemies, {
          player: { hp: run.hp, maxHp: run.maxHp },
          random: ((r) => () => r.next())(run.newCombatRng()),
          relics: run.relics,
        });
        combat.start();
        while (combat.phase === 'playerTurn' && combat.turnNumber <= 60) {
          playBotTurn(combat);
          if (combat.phase === 'playerTurn') combat.endPlayerTurn();
        }
        const result = combat.phase === 'playerTurn' ? 'stalled' : combat.phase;
        expect({ result, turns: combat.turnNumber, hp: combat.player.hp }).toEqual({
          result: standalone.result,
          turns: standalone.turns,
          hp: standalone.hpAfter,
        });
        // and the run records exactly what happened
        run.finishCombat(result === 'won' ? 'won' : 'lost', combat.player.hp, combat.turnNumber);
        const entry = run.history[run.history.length - 1];
        expect(entry).toMatchObject({ kind: 'combat', result: result === 'won' ? 'won' : 'lost', turns: combat.turnNumber, hpAfter: combat.player.hp });
        fights++;
      }
    }
    // lowered from 200 (2026-10-08): the starter-deck draft now spends ~11 extra non-combat steps
    // at the start of every run (DESIGN_LOG.md "Starter deck draft"), so slightly fewer fights land
    // inside the same 400-step-per-seed budget.
    expect(fights).toBeGreaterThan(180);
  });

  it('the simulator is a pure function of its seed and agrees with itself across policies', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const a = playRun(seed);
      expect(playRun(seed)).toEqual(a);
      for (const f of a.fights) {
        expect(f.turns).toBeGreaterThan(0);
      }
      // a won run's last fight is the boss; a lost run's last fight is a loss
      if (a.won) expect(a.fights[a.fights.length - 1].tier).toBe('boss');
      else expect(a.fights[a.fights.length - 1].won).toBe(false);
    }
  });
});
