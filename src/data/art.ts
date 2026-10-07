// Which art file stands in for what. PLACEHOLDER pairings: the art packs are the user's picks, but
// which picture goes with which enemy, relic or map stop is not decided. Change a line to swap one.
// Files live in public/assets (built by tools/prepareAssets.py; sources in public/assets/CREDITS.md).

import type { MapNodeKind } from '../game/actMap';
import type { FightTier } from '../game/RunState';
import { MAP_EARLY_FLOORS, MAP_LATE_FLOORS_FROM } from './tunables';

/** Enemy id -> a still picture (ENEMY_PICTURES) or an animated pixel sheet (ENEMY_SHEETS), by name.
 *  An enemy with no entry falls back to the drawn goblin. PLACEHOLDER pairing: some painted,
 *  some pixel, so both kinds are on screen. */
export const ENEMY_ART: Readonly<Record<string, string>> = {
  'enemy-a': 'goblin',
  'enemy-b': 'disciple',
  'enemy-c': 'fighter',
  'enemy-d': 'gnu',
  'elite-a': 'brute',
  'elite-b': 'minion',
  'boss-a': 'brute',
};
export const ENEMY_PICTURES = ['skeleton', 'goblin', 'fighter', 'brute'] as const;
/** An animated pixel-art enemy: one sheet (public/assets/pixel/<name>.png), cut into equal frames
 *  numbered left to right, top to bottom. Idle loops; attack (optional) plays when the enemy acts;
 *  death (optional) plays when it falls, and the usual fade follows. Frame lists are by eye. */
export interface EnemySheet {
  frameWidth: number;
  frameHeight: number;
  /** Whole-number zoom, so the pixels stay square (the sheets are drawn at 1x). */
  scale: number;
  /** Empty rows of pixels under the feet in the frame, so the feet land on the ground line. */
  feetPad: number;
  idle: { frames: readonly number[]; frameRate: number; yoyo?: boolean };
  attack?: { frames: readonly number[]; frameRate: number };
  death?: { frames: readonly number[]; frameRate: number };
}

export const ENEMY_SHEETS: Readonly<Record<string, EnemySheet>> = {
  // hooded figure; dissolves into dust when it falls (no attack frames)
  disciple: { frameWidth: 45, frameHeight: 51, scale: 3, feetPad: 0, idle: { frames: [0, 1, 2, 3], frameRate: 5 }, death: { frames: [4, 5, 6, 7, 8, 9, 10], frameRate: 8 } },
  // horned figure with a staff; the staff flourish doubles as its attack, and it topples over
  gnu: {
    frameWidth: 120,
    frameHeight: 100,
    scale: 2,
    feetPad: 5,
    idle: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], frameRate: 6, yoyo: true },
    attack: { frames: [9, 10, 9], frameRate: 10 },
    death: { frames: [9, 10, 11, 12, 13, 14, 15, 16], frameRate: 7 },
  },
  // tentacled head; idle only (it just fades when it falls)
  minion: { frameWidth: 45, frameHeight: 66, scale: 2, feetPad: 0, idle: { frames: [0, 1, 2, 3, 4, 5], frameRate: 6, yoyo: true } },
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
