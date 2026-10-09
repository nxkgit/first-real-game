// The enemy art manifest: every picture an enemy can wear, one entry each. To add art: drop the
// PNG in public/assets/<dir>/, add an entry here, then point an enemy at it in ENEMY_ART
// (src/data/art.ts). Nothing else needs editing: preloadArt loads whatever is listed.
// Guide: docs/ART.md. Texture keys: still -> `enemy-<name>`, sheet -> `pixel-<name>`.

/** An animated pixel sheet: equal frames numbered left to right, top to bottom. Idle loops; attack
 *  (optional) plays when the enemy acts; death (optional) plays when it falls, and the usual fade
 *  follows. Frame lists are by eye. */
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

/** A single picture. Painted ones (the default) are shown `ENEMY_DISPLAY_HEIGHT` tall, smoothed.
 *  Set `pixelScale` for pixel art: it is shown at that whole-number zoom with crisp edges. */
export interface EnemyStill {
  /** Folder under public/assets/ holding `<name>.png`. */
  dir: 'enemies' | 'pixel';
  pixelScale?: number;
}

export type EnemyArtEntry = { kind: 'still'; still: EnemyStill } | { kind: 'sheet'; sheet: EnemySheet };

const paintedStill = (): EnemyArtEntry => ({ kind: 'still', still: { dir: 'enemies' } });
/** A 64x64 pixel picture (see tools/prepareAssets.py), shown at 2x. */
const pixelStill = (): EnemyArtEntry => ({ kind: 'still', still: { dir: 'enemies', pixelScale: 2 } });

export const ENEMY_ART_ENTRIES: Readonly<Record<string, EnemyArtEntry>> = {
  // painted stills, cut from characters.png
  skeleton: paintedStill(),
  goblin: paintedStill(),
  fighter: paintedStill(),
  brute: paintedStill(),
  // pixel stills (the 604x604 "Instagram_last" pictures, shrunk back to their native 64x64).
  // Names are neutral, in file-name order: pixel-a green winged, b blue fists, c skull brute,
  // d hooded wings, e flame, f golden armour, g dark beast.
  'pixel-a': pixelStill(),
  'pixel-b': pixelStill(),
  'pixel-c': pixelStill(),
  'pixel-d': pixelStill(),
  'pixel-e': pixelStill(),
  'pixel-f': pixelStill(),
  'pixel-g': pixelStill(),
  // animated pixel sheets, from spritesheets.zip
  // hooded figure; dissolves into dust when it falls (no attack frames)
  disciple: { kind: 'sheet', sheet: { frameWidth: 45, frameHeight: 51, scale: 3, feetPad: 0, idle: { frames: [0, 1, 2, 3], frameRate: 5 }, death: { frames: [4, 5, 6, 7, 8, 9, 10], frameRate: 8 } } },
  // horned figure with a staff; the staff flourish doubles as its attack, and it topples over
  gnu: {
    kind: 'sheet',
    sheet: {
      frameWidth: 120,
      frameHeight: 100,
      scale: 2,
      feetPad: 5,
      idle: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8], frameRate: 6, yoyo: true },
      attack: { frames: [9, 10, 9], frameRate: 10 },
      death: { frames: [9, 10, 11, 12, 13, 14, 15, 16], frameRate: 7 },
    },
  },
  // tentacled head; idle only (it just fades when it falls)
  minion: { kind: 'sheet', sheet: { frameWidth: 45, frameHeight: 66, scale: 2, feetPad: 0, idle: { frames: [0, 1, 2, 3, 4, 5], frameRate: 6, yoyo: true } } },
};

/** The sheet for an entry name, if it is one. */
export function sheetOf(name: string): EnemySheet | undefined {
  const entry = ENEMY_ART_ENTRIES[name];
  return entry?.kind === 'sheet' ? entry.sheet : undefined;
}
