import type { Harness } from './harness';

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
