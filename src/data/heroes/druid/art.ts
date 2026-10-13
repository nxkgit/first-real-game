import type { HeroArt } from '../../art';

// Druid's pictures: the pairing of the hero with its sprite sheet(s). The files live in public/assets/hero/ (built by tools/prepareAssets.py).
// All pixel art is shown at a non-whole zoom, so drawn smoothed; idle only (lunge and tip-over are drawn in code). See docs/ART.md.
// The Keeper of the Wild (Druid), a deer-centaur. Forms: Tortoise has its own animated picture; Form A and Form B
// are placeholders (tinted copies of the base picture) until the animals are chosen.
export const DRUID_ART: HeroArt = {
  file: 'hero/druid.png',
  frameWidth: 301,
  frameHeight: 230,
  idle: { start: 0, end: 11, frameRate: 6 },
  scale: 0.52, // 20% smaller than the first 0.65 (user, 2026-10-13)
  forms: {
    tortoise: {
      sheet: { file: 'hero/druid_tortoise.png', frameWidth: 285, frameHeight: 150, idle: { start: 0, end: 6, frameRate: 3 }, scale: 0.64 },
    },
    formA: { tint: 0xff9a8a },
    formB: { tint: 0x8ac4ff },
  },
};
