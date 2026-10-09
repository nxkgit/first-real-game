import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENEMY_ART, HERO_SHEET } from './art';
import { ENEMY_ART_ENTRIES } from './enemyArt';
import { ENEMIES } from './enemies';

/** Width and height from a PNG file's header. */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const fileOf = (name: string): string => {
  const entry = ENEMY_ART_ENTRIES[name];
  return `public/assets/${entry.kind === 'sheet' ? 'pixel' : entry.still.dir}/${name}.png`;
};

describe('enemy art manifest', () => {
  it('points every mapped enemy at a real enemy and a manifest entry with a file', () => {
    for (const [enemyId, name] of Object.entries(ENEMY_ART)) {
      expect(ENEMIES[enemyId], `enemy ${enemyId}`).toBeDefined();
      expect(ENEMY_ART_ENTRIES[name], `${enemyId} -> ${name}`).toBeDefined();
    }
  });

  it('has a picture file for every manifest entry', () => {
    for (const name of Object.keys(ENEMY_ART_ENTRIES)) expect(existsSync(fileOf(name)), fileOf(name)).toBe(true);
  });

  it('uses both stills and animated sheets in the manifest', () => {
    const kinds = Object.values(ENEMY_ART_ENTRIES).map((e) => e.kind);
    expect(kinds).toContain('still');
    expect(kinds).toContain('sheet');
  });

  it('keeps pixel stills at a whole-number zoom, so the pixels stay square', () => {
    for (const [name, entry] of Object.entries(ENEMY_ART_ENTRIES)) {
      if (entry.kind === 'still' && entry.still.pixelScale !== undefined) {
        expect(Number.isInteger(entry.still.pixelScale), name).toBe(true);
        expect(entry.still.pixelScale, name).toBeGreaterThan(0);
      }
    }
  });

  it('describes each sheet the way its picture is really cut', () => {
    for (const [name, entry] of Object.entries(ENEMY_ART_ENTRIES)) {
      if (entry.kind !== 'sheet') continue;
      const sheet = entry.sheet;
      const { width, height } = pngSize(fileOf(name));
      expect(width % sheet.frameWidth, `${name} width ${width}`).toBe(0);
      expect(height % sheet.frameHeight, `${name} height ${height}`).toBe(0);
      const count = (width / sheet.frameWidth) * (height / sheet.frameHeight);
      for (const [kind, def] of Object.entries({ idle: sheet.idle, attack: sheet.attack, death: sheet.death })) {
        if (!def) continue;
        expect(def.frames.length, `${name} ${kind}`).toBeGreaterThan(0);
        for (const frame of def.frames) expect(frame, `${name} ${kind} frame`).toBeLessThan(count);
        expect(def.frameRate, `${name} ${kind} rate`).toBeGreaterThan(0);
      }
      expect(Number.isInteger(sheet.scale), `${name} scale keeps pixels square`).toBe(true);
    }
  });
});

describe('hero art', () => {
  it('describes the hero strip the way it is really cut', () => {
    const { width, height } = pngSize('public/assets/hero/hero.png');
    expect(width % HERO_SHEET.frameWidth).toBe(0);
    expect(height).toBe(HERO_SHEET.frameHeight);
    const count = width / HERO_SHEET.frameWidth;
    for (const def of [HERO_SHEET.idle, HERO_SHEET.attack, HERO_SHEET.death]) {
      if (def) expect(def.end).toBeLessThan(count);
    }
  });
});
