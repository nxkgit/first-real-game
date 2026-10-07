/**
 * Where map stops are drawn. The map always fills the same screen area, whatever the number of
 * floors and lanes, so changing the map tunables can't push stops off screen. At the current
 * 13 floors (12 plus the boss) and 5 lanes this gives the original 35 px and 100 px steps.
 */
export const MAP_BOTTOM_Y = 548;
export const MAP_TOP_Y = 128;
export const MAP_LEFT_X = 200;
export const MAP_RIGHT_X = 600;

export interface MapLayout {
  x(lane: number): number;
  y(floor: number): number;
}

/** `floors` includes the boss's floor (map.floors); `lanes` is map.lanes. */
export function mapLayout(floors: number, lanes: number): MapLayout {
  const floorStep = floors > 1 ? (MAP_BOTTOM_Y - MAP_TOP_Y) / (floors - 1) : 0;
  const laneStep = lanes > 1 ? (MAP_RIGHT_X - MAP_LEFT_X) / (lanes - 1) : 0;
  const centre = (MAP_LEFT_X + MAP_RIGHT_X) / 2;
  return {
    x: (lane) => (lanes > 1 ? MAP_LEFT_X + lane * laneStep : centre),
    y: (floor) => MAP_BOTTOM_Y - floor * floorStep,
  };
}
