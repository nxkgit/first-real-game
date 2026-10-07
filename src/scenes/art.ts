import Phaser from 'phaser';
import { ENEMY_ART, ENEMY_DISPLAY_HEIGHT, ENEMY_PICTURES, HERO_SHEET, ICON_FILES, MAP_ICON_KINDS } from '../data/art';
import type { EnemyDefinition } from '../game/types';
import { buildGoblinCharacter } from './combat/drawings';

// Loading and building the picture-based visuals (hero, enemies, map icons, icons, card border).
// Every builder falls back to the old drawn shapes, so a missing file never breaks a screen.

/** Queues every art file. Call from a scene's preload(). */
export function preloadArt(scene: Phaser.Scene): void {
  scene.load.setPath(`${import.meta.env.BASE_URL}assets/`);
  scene.load.spritesheet('hero', 'hero/hero.png', { frameWidth: HERO_SHEET.frameWidth, frameHeight: HERO_SHEET.frameHeight });
  for (const name of ENEMY_PICTURES) scene.load.image(`enemy-${name}`, `enemies/${name}.png`);
  for (const kind of MAP_ICON_KINDS) scene.load.image(`map-${kind}`, `map/${kind}.png`);
  for (const name of ICON_FILES) scene.load.image(`icon-${name}`, `icons/${name}.png`);
  scene.load.image('ui-border', 'ui/border.png');
}

/** Registers the hero's animations once (they are global to the game). */
export function createArtAnimations(scene: Phaser.Scene): void {
  if (!scene.textures.exists('hero') || scene.anims.exists('hero-idle')) return;
  const make = (key: 'idle' | 'attack' | 'death'): void => {
    const { start, end, frameRate } = HERO_SHEET[key];
    scene.anims.create({
      key: `hero-${key}`,
      frames: scene.anims.generateFrameNumbers('hero', { start, end }),
      frameRate,
      repeat: key === 'idle' ? -1 : 0,
    });
  };
  make('idle');
  make('attack');
  make('death');
}

export interface HeroSprite {
  container: Phaser.GameObjects.Container;
  /** Plays the attack animation, then goes back to idle. */
  attack(): void;
  /** Plays the death animation and stays on its last frame. */
  die(): void;
}

/** The hero as a picture (animated), or null if the sheet did not load. Stands on the container's
 *  origin like the drawn hero did: feet near y = 70. */
export function buildHeroSprite(scene: Phaser.Scene): HeroSprite | null {
  if (!scene.textures.exists('hero')) return null;
  createArtAnimations(scene);
  const sprite = scene.add.sprite(0, 0, 'hero', 0).setScale(HERO_SHEET.scale).setOrigin(0.5, 1);
  sprite.setY(78);
  sprite.play('hero-idle');
  const container = scene.add.container(0, 0, [sprite]);
  return {
    container,
    attack: () => {
      if (sprite.anims.currentAnim?.key === 'hero-death') return;
      sprite.play('hero-attack');
      sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (sprite.anims.currentAnim?.key === 'hero-attack') sprite.play('hero-idle');
      });
    },
    die: () => {
      sprite.play('hero-death');
    },
  };
}

/** An enemy's picture (or the drawn goblin if it has none), centered on the container's origin. */
export function buildEnemySprite(scene: Phaser.Scene, definition: EnemyDefinition): Phaser.GameObjects.Container {
  const picture = ENEMY_ART[definition.id];
  const key = picture ? `enemy-${picture}` : '';
  if (!key || !scene.textures.exists(key)) return buildGoblinCharacter(scene, definition.placeholderColor ?? 0x5c8143);
  const image = scene.add.image(0, 0, key);
  image.setScale(ENEMY_DISPLAY_HEIGHT / image.height);
  return scene.add.container(0, 0, [image]);
}

/** A white-filled copy of a line-art icon (the map icons are black, which vanishes on the dark map). */
export function addMapIcon(scene: Phaser.Scene, kind: string, size: number): Phaser.GameObjects.Image | null {
  const key = `map-${kind}`;
  if (!scene.textures.exists(key)) return null;
  return scene.add.image(0, 0, key).setDisplaySize(size, size).setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
}

/** A small icon image, or null if it did not load. */
export function addIcon(scene: Phaser.Scene, name: string, size: number): Phaser.GameObjects.Image | null {
  const key = `icon-${name}`;
  if (!scene.textures.exists(key)) return null;
  return scene.add.image(0, 0, key).setDisplaySize(size, size);
}

/** A stretchable pixel border (corners stay crisp), tinted to `color`; null if it did not load. */
export function addBorder(
  scene: Phaser.Scene,
  width: number,
  height: number,
  color: number,
  slice = 14
): Phaser.GameObjects.NineSlice | null {
  if (!scene.textures.exists('ui-border')) return null;
  const s = Math.min(slice, Math.floor(width / 2) - 1, Math.floor(height / 2) - 1);
  return scene.add.nineslice(0, 0, 'ui-border', undefined, width, height, s, s, s, s).setTint(color);
}
