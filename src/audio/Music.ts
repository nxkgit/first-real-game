// The background theme: one track, started once, kept playing across every scene. It lives in
// Phaser's game-wide sound manager, so changing scenes does not interrupt it. Browsers hold audio
// back until the first click or key press; Phaser queues the play and starts it then. Volume
// follows the player's music volume and mute settings; the start fades in.

import type Phaser from 'phaser';
import { MUSIC_FADE_IN_MS } from '../data/tunables';
import { effectiveMusicVolume, onSettingsChange } from '../settings';

const MUSIC_KEY = 'music-main-theme';
const MUSIC_FILE = 'audio/main_theme_alex089.mp3';

type Track = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;

let track: Track | null = null;
/** When the fade-in began (performance.now), or null until playback actually starts. */
let fadeStartedAt: number | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;

/** The browser tests drive the game by hand and should not load or play the theme. */
function disabled(): boolean {
  return new URLSearchParams(window.location.search).has('e2e');
}

/** Queues the music file. Call from a scene's preload(). */
export function preloadMusic(scene: Phaser.Scene): void {
  if (disabled()) return;
  scene.load.setPath(`${import.meta.env.BASE_URL}assets/`);
  scene.load.audio(MUSIC_KEY, MUSIC_FILE);
}

function fadeProgress(): number {
  if (fadeStartedAt === null) return 0;
  return Math.min(1, (performance.now() - fadeStartedAt) / MUSIC_FADE_IN_MS);
}

function applyVolume(): void {
  if (!track) return;
  track.volume = effectiveMusicVolume() * fadeProgress();
  if (fadeProgress() >= 1 && fadeTimer !== null) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

/** Starts the theme (looping) if it is not already playing. Safe to call from any scene, any number of times. */
export function startMusic(scene: Phaser.Scene): void {
  if (track || disabled() || !scene.cache.audio.exists(MUSIC_KEY)) return;
  track = scene.sound.add(MUSIC_KEY, { loop: true, volume: 0 }) as Track;
  track.once('play', () => {
    fadeStartedAt = performance.now();
    fadeTimer = setInterval(applyVolume, 50);
  });
  onSettingsChange(applyVolume);
  track.play();
}
