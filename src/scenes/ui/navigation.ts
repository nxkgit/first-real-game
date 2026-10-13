import Phaser from 'phaser';
import type { RunNode, RunState } from '../../game/RunState';
import { heroFromUrl, seedFromUrl, setCurrentRun } from '../../app/session';
import { newRun } from '../../game/newRun';
import { clearSavedRun, recordFinishedRun, saveRun } from '../../app/storage';

// ---- moving between screens ----

/** Runs whose report has already been stored, so re-entering the end screen doesn't store it twice. */
const reportedRuns = new WeakSet<RunState>();

const NODE_SCENE: Record<RunNode['kind'], string> = {
  combat: 'CombatScene',
  rest: 'RestScene',
  shop: 'ShopScene',
  event: 'EventScene',
};

/**
 * A new run: the hero select screen, or straight in when the address names a hero (`?hero=paladin`,
 * which the browser tests and the dev tools use). Continuing a saved run never comes through here.
 * `useUrlSeed` is whether `?seed=` applies (the first boot) or the run gets a random seed.
 */
export function startNewRun(scene: Phaser.Scene, useUrlSeed: boolean): void {
  const heroId = heroFromUrl();
  if (heroId) enterCurrentNode(scene, newRun(useUrlSeed ? seedFromUrl() : undefined, heroId));
  else scene.scene.start('HeroSelectScene', { useUrlSeed });
}

/** Starts whichever scene matches where the run is now. Every scene transition goes through here. */
export function enterCurrentNode(scene: Phaser.Scene, run: RunState): void {
  setCurrentRun(run);
  if (run.phase === 'won' || run.phase === 'lost') {
    // the run is over: keep its report for the playtester and forget the save
    if (!reportedRuns.has(run)) {
      reportedRuns.add(run);
      recordFinishedRun(run);
    }
    clearSavedRun();
    scene.scene.start('RunEndScene', { run });
    return;
  }
  saveRun(run); // every stop is a save point
  if (run.phase === 'map') {
    scene.scene.start('MapScene', { run });
  } else if (run.phase === 'reward') {
    scene.scene.start('RewardScene', { run });
  } else if (run.phase === 'draft') {
    // starter-deck draft (DESIGN_LOG.md "Starter deck draft"): an intro screen until the first
    // offer is rolled, then the reward screen's own 1-of-3 picker, reused, once per round.
    scene.scene.start(run.pendingDraftOffer ? 'RewardScene' : 'DraftIntroScene', { run, draft: true });
  } else {
    scene.scene.start(NODE_SCENE[run.currentNode.kind], { run });
  }
}
