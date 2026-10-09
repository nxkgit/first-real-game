import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENEMY_ART, ENEMY_PICTURES, ENEMY_SHEETS } from './art';
import { ENEMIES } from './enemies';

/** Width and height from a PNG file's header. */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

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

describe('card art', () => {
  it('has a default picture and one file per listed card id, and no unlisted files', async () => {
    const { CARD_ART_IDS } = await import('./art');
    const { CARDS } = await import('./cards');
    expect(existsSync('public/assets/cards/default.png')).toBe(true);
    const files = readdirSync('public/assets/cards').filter((f) => f.endsWith('.png') && f !== 'default.png');
    expect(files.map((f) => f.replace(/\.png$/, '')).sort()).toEqual([...CARD_ART_IDS].sort());
    for (const id of CARD_ART_IDS) expect(CARDS[id], `card ${id}`).toBeDefined();
  });

  it('draws every picture at 2:1', async () => {
    for (const f of readdirSync('public/assets/cards').filter((n) => n.endsWith('.png'))) {
      const { width, height } = pngSize(`public/assets/cards/${f}`);
      expect(width, f).toBe(height * 2);
    }
  });
});
