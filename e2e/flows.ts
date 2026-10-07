/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Harness } from './harness';

// Multi-step moves shared by several tests.

// Map geometry from src/scenes/MapScene.ts (LANE_X / FLOOR_Y).
const laneX = (lane: number): number => 200 + lane * 100;
const floorY = (floor: number): number => 548 - floor * 35;

/** Clicks one of the open stops on the map with the real mouse (the first one of `kind`, if given). */
export async function chooseMapStop(game: Harness, kind?: string): Promise<{ id: string; kind: string }> {
  const run = await game.run();
  const stop = run.choices.find((c) => kind === undefined || c.kind === kind);
  if (!stop) throw new Error(`no open ${kind ?? 'any'} stop; choices: ${run.choices.map((c) => c.kind).join()}`);
  await game.click(laneX(stop.lane), floorY(stop.floor));
  return stop;
}

/** From the map: walks into the first open fight. */
export async function enterFirstFight(game: Harness): Promise<void> {
  const stop = await chooseMapStop(game, 'combat');
  await game.waitForScene('CombatScene');
  await game.settle();
  if ((await game.run()).position !== stop.id) throw new Error('entered a different stop than clicked');
}

// ---------- dev panel (?dev) ----------

/** Jumps to the `nth` stop of this kind with the dev panel's "Go to stop" (real DOM clicks). */
export async function devJump(game: Harness, kind: string, nth = 0): Promise<{ id: string; kind: string }> {
  const node = (await game.run()).nodes.filter((n) => n.kind === kind)[nth];
  if (!node) throw new Error(`this map has no ${kind} stop #${nth}`);
  await game.page.locator('select').first().selectOption(node.id);
  await game.page.getByRole('button', { name: 'Go to stop' }).click();
  await game.step(3);
  return node;
}

export const SCENE_FOR_KIND: Record<string, string> = {
  combat: 'CombatScene',
  elite: 'CombatScene',
  boss: 'CombatScene',
  rest: 'RestScene',
  shop: 'ShopScene',
  event: 'EventScene',
};

/** Wins the fight on screen with the dev panel's "Kill enemies" and clicks Continue. */
export async function devWinFight(game: Harness): Promise<void> {
  await game.page.getByRole('button', { name: 'Kill enemies' }).click();
  await game.settle();
  if (!(await game.hasText('VICTORY'))) throw new Error('no VICTORY banner after killing the enemies');
  await game.clickText('Continue');
}

/** The first choice of the event on screen that does not start a fight: its index and label. */
export async function firstPeacefulEventChoice(game: Harness): Promise<{ index: number; label: string; outcomes: any[] }> {
  return game.page.evaluate(async () => {
    const run = (await (window as any).__imp('/src/session.ts')).getCurrentRun();
    const index = run.event.choices.findIndex((c: any) => !c.outcomes.some((o: any) => o.kind === 'fight'));
    const choice = run.event.choices[index];
    return { index, label: choice.label as string, outcomes: choice.outcomes as any[] };
  });
}

/** Leaves the stop the run is standing on, the way a player would, ending on the map (or the run-end screen after a boss). */
export async function leaveStop(game: Harness, kind: string): Promise<void> {
  if (kind === 'combat' || kind === 'elite' || kind === 'boss') {
    await devWinFight(game);
    if (kind === 'boss') return game.waitForScene('RunEndScene');
    await game.waitForScene('RewardScene');
    await game.clickText(/^Take \d+ gold$/);
  } else if (kind === 'rest') {
    await game.clickText(/^Rest( \(\+\d+ HP\))?$/);
  } else if (kind === 'shop') {
    await game.clickText('Leave');
  } else if (kind === 'event') {
    await game.clickText((await firstPeacefulEventChoice(game)).label);
    await game.clickText('Continue');
  }
  await game.waitForScene('MapScene');
}
