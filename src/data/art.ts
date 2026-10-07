// Which art file stands in for what. PLACEHOLDER pairings: the art packs are the user's picks, but
// which picture goes with which enemy, relic or map stop is not decided. Change a line to swap one.
// Files live in public/assets (built by tools/prepareAssets.py; sources in public/assets/CREDITS.md).

import type { MapNodeKind } from '../game/actMap';
import type { FightTier } from '../game/RunState';
import { MAP_EARLY_FLOORS, MAP_LATE_FLOORS_FROM } from './tunables';

/** Enemy id -> picture. An enemy with no entry falls back to the drawn goblin. */
export const ENEMY_ART: Readonly<Record<string, string>> = {
  'enemy-a': 'goblin',
  'enemy-b': 'skeleton',
  'enemy-c': 'fighter',
  'enemy-d': 'brute',
  'elite-a': 'brute',
  'elite-b': 'fighter',
  'boss-a': 'brute',
};
export const ENEMY_PICTURES = ['skeleton', 'goblin', 'fighter', 'brute'] as const;
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

/** The hero's picture sheet: frame size, and which frames are which animation. */
export const HERO_SHEET = {
  frameWidth: 303,
  frameHeight: 266,
  idle: { start: 0, end: 3, frameRate: 5 },
  attack: { start: 4, end: 7, frameRate: 12 },
  death: { start: 8, end: 10, frameRate: 6 },
  /** On-screen scale; the hero stands about 145px tall. */
  scale: 0.68,
} as const;

export const BACKGROUNDS = ['grass', 'forest', 'fall', 'desert', 'castles'] as const;
export type BackgroundName = (typeof BACKGROUNDS)[number];

/** The fight backdrop: the boss gets the castles, elites the desert, ordinary fights change with
 *  how far into the act you are. PLACEHOLDER pairing. `floor` counts from 0 at the bottom. */
export function backgroundFor(tier: FightTier, floor: number): BackgroundName {
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
