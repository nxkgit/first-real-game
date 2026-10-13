import type { HeroArt } from '../../art';

// Mage's pictures: the pairing of the hero with its sprite sheet(s). The files live in public/assets/hero/ (built by tools/prepareAssets.py).
// All pixel art is shown at a non-whole zoom, so drawn smoothed; idle only (lunge and tip-over are drawn in code). See docs/ART.md.
export const MAGE_ART: HeroArt = {
  file: 'hero/mage_model.png',
  frameWidth: 416,
  frameHeight: 464,
  idle: { start: 0, end: 5, frameRate: 4 },
  scale: 0.31,
};
