import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ASHLANDS, BACKGROUNDS, DEFAULT_COMBAT_BACKGROUND, ENEMY_ART, HERO_ART, backgroundFor } from './art';
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
    for (const [id, art] of Object.entries(HERO_ART)) {
      const { width, height } = pngSize(`public/assets/${art.file}`);
      expect(width % art.frameWidth, id).toBe(0);
      expect(height, id).toBe(art.frameHeight);
      const count = width / art.frameWidth;
      for (const def of [art.idle, art.attack, art.death]) {
        if (def) expect(def.end, id).toBeLessThan(count);
      }
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
