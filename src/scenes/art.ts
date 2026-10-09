import Phaser from 'phaser';
import { BACKGROUNDS, CARD_ART_IDS, ENEMY_ART, ENEMY_SHEETS, SCREEN_BACKDROPS, ENEMY_DISPLAY_HEIGHT, ENEMY_PICTURES, HERO_SHEET, ICON_FILES, MAP_ICON_KINDS } from '../data/art';
import type { BackgroundName } from '../data/art';
import type { EnemyDefinition } from '../game/types';
import { buildGoblinCharacter } from './combat/drawings';

// Loading and building the picture-based visuals (hero, enemies, map icons, icons, card border).
// Every builder falls back to the old drawn shapes, so a missing file never breaks a screen.

/** Queues every art file. Call from a scene's preload(). */
export function preloadArt(scene: Phaser.Scene): void {
  scene.load.setPath(`${import.meta.env.BASE_URL}assets/`);
  scene.load.spritesheet('hero', 'hero/hero.png', { frameWidth: HERO_SHEET.frameWidth, frameHeight: HERO_SHEET.frameHeight });
  for (const name of ENEMY_PICTURES) scene.load.image(`enemy-${name}`, `enemies/${name}.png`);
  for (const [name, sheet] of Object.entries(ENEMY_SHEETS)) {
    scene.load.spritesheet(`pixel-${name}`, `pixel/${name}.png`, { frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight });
  }
  for (const kind of MAP_ICON_KINDS) scene.load.image(`map-${kind}`, `map/${kind}.png`);
  for (const name of ICON_FILES) scene.load.image(`icon-${name}`, `icons/${name}.png`);
  scene.load.image('ui-border', 'ui/border.png');
  scene.load.image('card-art-default', 'cards/default.png');
  for (const id of CARD_ART_IDS) scene.load.image(`card-art-${id}`, `cards/${id}.png`);
  for (const name of BACKGROUNDS) scene.load.image(`bg-${name}`, `backgrounds/${name}.png`);
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

/** What an animated enemy keeps on its container, so the fight screen can trigger its animations. */
interface PixelEnemy {
  sprite: Phaser.GameObjects.Sprite;
  name: string;
}

/** Creates (once) the idle, attack and death animations of a pixel sheet. */
function createSheetAnimations(scene: Phaser.Scene, name: string): void {
  const sheet = ENEMY_SHEETS[name];
  const key = `pixel-${name}`;
  const make = (kind: 'idle' | 'attack' | 'death'): void => {
    const def = sheet[kind];
    if (!def || scene.anims.exists(`${key}-${kind}`)) return;
    scene.anims.create({
      key: `${key}-${kind}`,
      frames: scene.anims.generateFrameNumbers(key, { frames: [...def.frames] }),
      frameRate: def.frameRate,
      repeat: kind === 'idle' ? -1 : 0,
      yoyo: kind === 'idle' && 'yoyo' in def && def.yoyo === true,
    });
  };
  make('idle');
  make('attack');
  make('death');
}

/** An enemy's picture (a still, an animated pixel sheet, or the drawn goblin if it has none),
 *  centered on the container's origin: feet near y = 75. */
export function buildEnemySprite(scene: Phaser.Scene, definition: EnemyDefinition): Phaser.GameObjects.Container {
  const picture = ENEMY_ART[definition.id];
  const sheet = picture ? ENEMY_SHEETS[picture] : undefined;
  if (picture && sheet && scene.textures.exists(`pixel-${picture}`)) {
    const key = `pixel-${picture}`;
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST); // crisp pixels, only for this texture
    createSheetAnimations(scene, picture);
    const sprite = scene.add.sprite(0, 75 + sheet.feetPad * sheet.scale, key, sheet.idle.frames[0]).setOrigin(0.5, 1).setScale(sheet.scale);
    sprite.play(`${key}-idle`);
    const container = scene.add.container(0, 0, [sprite]);
    container.setData('pixel', { sprite, name: picture } satisfies PixelEnemy);
    return container;
  }
  const key = picture ? `enemy-${picture}` : '';
  if (!key || !scene.textures.exists(key)) return buildGoblinCharacter(scene, definition.placeholderColor ?? 0x5c8143);
  const image = scene.add.image(0, 0, key);
  image.setScale(ENEMY_DISPLAY_HEIGHT / image.height);
  return scene.add.container(0, 0, [image]);
}

const pixelOf = (container: Phaser.GameObjects.Container): PixelEnemy | undefined => container.getData('pixel') as PixelEnemy | undefined;

/** True for an enemy that animates itself (so the fight screen skips the idle bob). */
export function isPixelEnemy(container: Phaser.GameObjects.Container): boolean {
  return pixelOf(container) !== undefined;
}

/** Plays the enemy's attack animation (if its sheet has one), then back to idle. */
export function playEnemyAttack(container: Phaser.GameObjects.Container): void {
  const pixel = pixelOf(container);
  if (!pixel || !ENEMY_SHEETS[pixel.name].attack) return;
  const key = `pixel-${pixel.name}`;
  pixel.sprite.play(`${key}-attack`);
  pixel.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
    if (pixel.sprite.anims.currentAnim?.key === `${key}-attack`) pixel.sprite.play(`${key}-idle`);
  });
}

/** Starts the enemy's death animation (if its sheet has one) and returns how long it lasts in ms
 *  (0 if there is none), so the caller can wait before fading it. Holds on the last frame. */
export function playEnemyDeath(container: Phaser.GameObjects.Container): number {
  const pixel = pixelOf(container);
  const death = pixel ? ENEMY_SHEETS[pixel.name].death : undefined;
  if (!pixel || !death) return 0;
  pixel.sprite.play(`pixel-${pixel.name}-death`);
  return Math.round((death.frames.length / death.frameRate) * 1000);
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

/** A card's picture, cropped to fill `width` x `height` centered on (x, y) (never stretched), or
 *  null if even the default did not load. Looks for the card's own file, then its base card's (for
 *  an upgrade), then the default. */
export function addCardArt(
  scene: Phaser.Scene,
  card: { id: string; upgradeOf?: string },
  rect: { x: number; y: number; width: number; height: number }
): Phaser.GameObjects.Image | null {
  const key = [card.id, card.upgradeOf, 'default']
    .map((id) => `card-art-${id}`)
    .find((k) => scene.textures.exists(k));
  if (!key) return null;
  const image = scene.add.image(rect.x, rect.y, key);
  const scale = Math.max(rect.width / image.width, rect.height / image.height);
  const cropW = rect.width / scale;
  const cropH = rect.height / scale;
  image.setCrop((image.width - cropW) / 2, (image.height - cropH) / 2, cropW, cropH).setScale(scale);
  return image;
}

/** Fills a rectangle with a landscape picture, cropped to fit (never stretched) and darkened by
 *  `dim` (0 to 1) so the white text on top stays readable. Returns false if the picture did not load. */
export function addBackdrop(
  scene: Phaser.Scene,
  name: BackgroundName,
  rect: { x: number; y: number; width: number; height: number },
  dim = 0.45
): boolean {
  const key = `bg-${name}`;
  if (!scene.textures.exists(key)) return false;
  const image = scene.add.image(rect.x, rect.y, key).setOrigin(0, 0);
  const source = image.width; // the pictures are square
  const scale = rect.width / source;
  const bandHeight = rect.height / scale;
  const top = Math.min(source - bandHeight, source * 0.25); // the band that holds the horizon
  image.setScale(scale).setCrop(0, top, source, bandHeight).setY(rect.y - top * scale);
  scene.add.rectangle(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height, 0x0c0a14, dim);
  return true;
}

/** The backdrop for a full-screen stop (map, rest, shop, event, reward), drawn over the plain
 *  dark background; does nothing if the picture did not load. */
export function addScreenBackdrop(scene: Phaser.Scene, screen: keyof typeof SCREEN_BACKDROPS): void {
  const { name, dim } = SCREEN_BACKDROPS[screen];
  addBackdrop(scene, name, { x: 0, y: 0, width: 800, height: 600 }, dim);
}
