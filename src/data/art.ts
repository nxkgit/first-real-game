// Which art file stands in for what. PLACEHOLDER pairings: the art packs are the user's picks, but
// which picture goes with which enemy, relic or map stop is not decided. Change a line to swap one.
// Files live in public/assets (built by tools/prepareAssets.py; sources in public/assets/CREDITS.md).

import type { MapNodeKind } from '../game/actMap';

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
