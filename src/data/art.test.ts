import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ASHLANDS, BACKGROUNDS, DEFAULT_COMBAT_BACKGROUND, ENEMY_ART, ENEMY_PICTURES, ENEMY_SHEETS, backgroundFor } from './art';
import { ENEMIES } from './enemies';

/** Width and height from a PNG file's header. */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('backdrops', () => {
  it('has a file for every still background and every frame of the ashlands animation', () => {
    for (const name of BACKGROUNDS) expect(existsSync(`public/assets/backgrounds/${name}.png`), name).toBe(true);
    for (let i = 0; i < ASHLANDS.frames; i++) expect(existsSync(`public/assets/backgrounds/${ASHLANDS.name}-${i}.png`), `frame ${i}`).toBe(true);
  });

  it('describes the ashlands frames the way the files really are', () => {
    for (let i = 0; i < ASHLANDS.frames; i++) {
      const { width, height } = pngSize(`public/assets/backgrounds/${ASHLANDS.name}-${i}.png`);
      expect({ width, height }, `frame ${i}`).toEqual({ width: ASHLANDS.width, height: ASHLANDS.height });
    }
    expect(ASHLANDS.frameMs).toBeGreaterThan(0);
  });

  it('uses the default combat backdrop for every kind of fight and floor', () => {
    expect(DEFAULT_COMBAT_BACKGROUND).toBe('ashlands'); // provisional (DESIGN_LOG.md, 2026-10-09); change this test with the constant
    for (const tier of ['normal', 'elite', 'boss'] as const) {
      for (const floor of [0, 3, 8, 12]) expect(backgroundFor(tier, floor), `${tier} floor ${floor}`).toBe('ashlands');
    }
  });
});

describe('enemy art', () => {
  it('points every mapped enemy at a real enemy and an existing picture or sheet', () => {
    for (const [enemyId, name] of Object.entries(ENEMY_ART)) {
      expect(ENEMIES[enemyId], `enemy ${enemyId}`).toBeDefined();
      const isStill = (ENEMY_PICTURES as readonly string[]).includes(name);
      const isSheet = name in ENEMY_SHEETS;
      expect(isStill || isSheet, `${enemyId} -> ${name}`).toBe(true);
      expect(isStill && isSheet, `${name} is both a still and a sheet`).toBe(false);
      expect(existsSync(`public/assets/${isSheet ? 'pixel' : 'enemies'}/${name}.png`), `${name}.png`).toBe(true);
    }
  });

  it('uses both painted stills and animated pixel sheets', () => {
    const names = Object.values(ENEMY_ART);
    expect(names.some((n) => n in ENEMY_SHEETS)).toBe(true);
    expect(names.some((n) => (ENEMY_PICTURES as readonly string[]).includes(n))).toBe(true);
  });

  it('describes each sheet the way its picture is really cut', () => {
    for (const [name, sheet] of Object.entries(ENEMY_SHEETS)) {
      const { width, height } = pngSize(`public/assets/pixel/${name}.png`);
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
