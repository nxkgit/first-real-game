// Which art file stands in for what. PLACEHOLDER pairings: the art packs are the user's picks, but
// which picture goes with which enemy, relic or map stop is not decided. Change a line to swap one.
// Files live in public/assets (built by tools/prepareAssets.py; sources in public/assets/CREDITS.md).

import type { MapNodeKind } from '../game/actMap';
import type { FightTier } from '../game/RunState';
import { MAP_EARLY_FLOORS, MAP_LATE_FLOORS_FROM } from './tunables';

/** Enemy id -> the name of an entry in the art manifest (src/data/enemyArt.ts: a still picture or an
 *  animated sheet). An enemy with no entry falls back to the drawn goblin. PLACEHOLDER pairing
 *  (2026-10-09): the seven pixel stills, the biggest looks on the elites and the boss. The user picks
 *  the real ones. */
export const ENEMY_ART: Readonly<Record<string, string>> = {
  'enemy-a': 'pixel-a',
  'enemy-b': 'pixel-e',
  'enemy-c': 'pixel-g',
  'enemy-d': 'pixel-d',
  'elite-a': 'pixel-b',
  'elite-b': 'pixel-f',
  'boss-a': 'pixel-c',
};

/** On-screen height of an enemy picture at scale 1 (the pictures are 200px tall). */
export const ENEMY_DISPLAY_HEIGHT = 150;

/** Relic id -> icon in public/assets/icons. A relic with no entry keeps its lettered badge. */
export const RELIC_ICON: Readonly<Record<string, string>> = {
  'strength-token': 'axe',
  'vitality-token': 'heart',
  'guard-token': 'shield',
  'recovery-token': 'potionRed',
  'draw-token': 'scroll',
  'exhaust-token': 'potionGreen',
  'kill-token': 'dagger',
};
export const ICON_FILES = ['axe', 'heart', 'shield', 'potionRed', 'potionGreen', 'scroll', 'dagger', 'coin', 'tome', 'wand'] as const;

/** Map stop kind -> icon in public/assets/map (the file is named after the kind). */
export const MAP_ICON_KINDS: readonly MapNodeKind[] = ['combat', 'elite', 'rest', 'shop', 'event', 'boss'];

/** The hero's picture sheet: frame size, and which frames are which animation. `attack` and `death`
 *  are optional: a sheet without them gets a lunge and a tip-over drawn in code (`buildHeroSprite`).
 *  The dark-elf witch (2026-10-09) has only four idle frames, so she uses those substitutes. */
export interface HeroSheet {
  frameWidth: number;
  frameHeight: number;
  idle: { start: number; end: number; frameRate: number };
  attack?: { start: number; end: number; frameRate: number };
  death?: { start: number; end: number; frameRate: number };
  /** On-screen scale; the hero stands about 145px tall. */
  scale: number;
  /** True for pixel art: drawn with crisp edges. */
  pixel?: boolean;
}
export const HERO_SHEET: HeroSheet = {
  frameWidth: 119,
  frameHeight: 288,
  idle: { start: 0, end: 3, frameRate: 3 },
  scale: 0.5, // half size is not a whole-number zoom, so no crisp-edge flag: she is drawn smoothed
};

export const BACKGROUNDS = ['grass', 'forest', 'fall', 'desert', 'castles'] as const;

/**
 * The animated ashlands backdrop: a short looping picture, one PNG per frame
 * (`backgrounds/ashlands-<n>.png`, built from the GIF by tools/prepareAssets.py). The numbers
 * describe the files and must match them (art.test.ts checks the sizes).
 */
export const ASHLANDS = { name: 'ashlands', frames: 3, frameMs: 330, width: 1350, height: 625 } as const;

export type BackgroundName = (typeof BACKGROUNDS)[number] | typeof ASHLANDS.name;

/**
 * PROVISIONAL (user, 2026-10-09: "default combat background for now"): every fight uses this
 * backdrop. Set it to `null` to go back to the older pairing in `backgroundFor` below, which is kept.
 */
export const DEFAULT_COMBAT_BACKGROUND: BackgroundName | null = 'ashlands';

/** The fight backdrop: `DEFAULT_COMBAT_BACKGROUND` while one is set; otherwise the boss gets the
 *  castles, elites the desert, ordinary fights change with how far into the act you are.
 *  PLACEHOLDER pairing. `floor` counts from 0 at the bottom. */
export function backgroundFor(tier: FightTier, floor: number): BackgroundName {
  if (DEFAULT_COMBAT_BACKGROUND) return DEFAULT_COMBAT_BACKGROUND;
  if (tier === 'boss') return 'castles';
  if (tier === 'elite') return 'desert';
  if (floor <= MAP_EARLY_FLOORS) return 'grass';
  if (floor >= MAP_LATE_FLOORS_FROM) return 'fall';
  return 'forest';
}

/** The backdrop behind each full-screen stop. PLACEHOLDER pairing; dimmed harder than fights
 *  because these screens are full of text and cards. */
export const SCREEN_BACKDROPS: Readonly<
  Record<'map' | 'rest' | 'shop' | 'event' | 'reward' | 'start' | 'end', { name: BackgroundName; dim: number }>
> = {
  start: { name: 'castles', dim: 0.6 },
  end: { name: 'fall', dim: 0.6 },
  map: { name: 'forest', dim: 0.7 },
  rest: { name: 'fall', dim: 0.6 },
  shop: { name: 'desert', dim: 0.65 },
  event: { name: 'castles', dim: 0.65 },
  reward: { name: 'grass', dim: 0.65 },
};
