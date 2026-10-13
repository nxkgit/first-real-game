import type { HeroArt } from '../../art';

// Paladin's pictures: the pairing of the hero with its sprite sheet(s). The files live in public/assets/hero/ (built by tools/prepareAssets.py).
// All pixel art is shown at a non-whole zoom, so drawn smoothed; idle only (lunge and tip-over are drawn in code). See docs/ART.md.
export const PALADIN_ART: HeroArt = {
  file: 'hero/paladin.png',
  frameWidth: 211,
  frameHeight: 290,
  idle: { start: 0, end: 11, frameRate: 6 }, // the GIF's 170 ms a frame
  scale: 0.6, // 20% larger than the first 0.5 (user, 2026-10-13)
};
