import Phaser from 'phaser';
import { ASHLANDS, BACKGROUNDS, ENEMY_ART, SCREEN_BACKDROPS, ENEMY_DISPLAY_HEIGHT, HERO_ART, ICON_FILES, MAP_ICON_KINDS } from '../data/art';
import type { BackgroundName } from '../data/art';
import { ENEMY_ART_ENTRIES, sheetOf } from '../data/enemyArt';
import type { EnemySheet } from '../data/enemyArt';
import type { EnemyDefinition, HeroDefinition } from '../game/types';
import { buildGoblinCharacter } from './combat/drawings';

// Loading and building the picture-based visuals (hero, enemies, map icons, icons, card border).
// Every builder falls back to the old drawn shapes, so a missing file never breaks a screen.

/** Queues every art file. Call from a scene's preload(). */
export function preloadArt(scene: Phaser.Scene): void {
  scene.load.setPath(`${import.meta.env.BASE_URL}assets/`);
  for (const [id, art] of Object.entries(HERO_ART)) scene.load.spritesheet(`hero-${id}`, art.file, { frameWidth: art.frameWidth, frameHeight: art.frameHeight });
  for (const [name, entry] of Object.entries(ENEMY_ART_ENTRIES)) {
    if (entry.kind === 'still') scene.load.image(`enemy-${name}`, `${entry.still.dir}/${name}.png`);
    else scene.load.spritesheet(`pixel-${name}`, `pixel/${name}.png`, { frameWidth: entry.sheet.frameWidth, frameHeight: entry.sheet.frameHeight });
  }
  for (const kind of MAP_ICON_KINDS) scene.load.image(`map-${kind}`, `map/${kind}.png`);
  for (const name of ICON_FILES) scene.load.image(`icon-${name}`, `icons/${name}.png`);
  scene.load.image('ui-border', 'ui/border.png');
  for (const name of BACKGROUNDS) scene.load.image(`bg-${name}`, `backgrounds/${name}.png`);
  for (let i = 0; i < ASHLANDS.frames; i++) scene.load.image(`bg-${ASHLANDS.name}-${i}`, `backgrounds/${ASHLANDS.name}-${i}.png`);
}

/** Registers a hero's animations once (they are global to the game). */
export function createArtAnimations(scene: Phaser.Scene, heroId: string): void {
  const art = HERO_ART[heroId];
  if (!art || !scene.textures.exists(`hero-${heroId}`) || scene.anims.exists(`hero-${heroId}-idle`)) return;
  const make = (key: 'idle' | 'attack' | 'death'): void => {
    const def = art[key];
    if (!def) return; // no frames for this one: buildHeroSprite draws it in code
    const { start, end, frameRate } = def;
    scene.anims.create({
      key: `hero-${heroId}-${key}`,
      frames: scene.anims.generateFrameNumbers(`hero-${heroId}`, { start, end }),
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
export function buildHeroSprite(scene: Phaser.Scene, heroId: string): HeroSprite | null {
  const art = HERO_ART[heroId];
  if (!art || !scene.textures.exists(`hero-${heroId}`)) return null;
  createArtAnimations(scene, heroId);
  const sprite = scene.add.sprite(0, 0, `hero-${heroId}`, 0).setScale(art.scale).setOrigin(0.5, 1);
  sprite.setY(78);
  sprite.play(`hero-${heroId}-idle`);
  const container = scene.add.container(0, 0, [sprite]);
  let dead = false;
  return {
    container,
    attack: () => {
      if (dead || sprite.anims.currentAnim?.key === `hero-${heroId}-death`) return;
      if (!art.attack) {
        // no attack frames: a quick lunge toward the enemies and back
        scene.tweens.add({ targets: sprite, x: 28, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
        return;
      }
      sprite.play(`hero-${heroId}-attack`);
      sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (sprite.anims.currentAnim?.key === `hero-${heroId}-attack`) sprite.play(`hero-${heroId}-idle`);
      });
    },
    die: () => {
      dead = true;
      if (!art.death) {
        // no death frames: freeze, tip over onto her side, and dim
        sprite.anims.stop();
        scene.tweens.add({ targets: sprite, angle: 90, y: 78, duration: 600, ease: 'Quad.easeIn' });
        scene.tweens.add({ targets: sprite, alpha: 0.5, duration: 600 });
        return;
      }
      sprite.play(`hero-${heroId}-death`);
    },
  };
}

/** What an animated enemy keeps on its container, so the fight screen can trigger its animations. */
interface PixelEnemy {
  sprite: Phaser.GameObjects.Sprite;
  name: string;
}

/** Creates (once) the idle, attack and death animations of a pixel sheet. */
function createSheetAnimations(scene: Phaser.Scene, name: string, sheet: EnemySheet): void {
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
  const entry = picture ? ENEMY_ART_ENTRIES[picture] : undefined;
  const sheet = entry?.kind === 'sheet' ? entry.sheet : undefined;
  if (picture && sheet && scene.textures.exists(`pixel-${picture}`)) {
    const key = `pixel-${picture}`;
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST); // crisp pixels, only for this texture
    createSheetAnimations(scene, picture, sheet);
    const sprite = scene.add.sprite(0, 75 + sheet.feetPad * sheet.scale, key, sheet.idle.frames[0]).setOrigin(0.5, 1).setScale(sheet.scale);
    sprite.play(`${key}-idle`);
    const container = scene.add.container(0, 0, [sprite]);
    container.setData('pixel', { sprite, name: picture } satisfies PixelEnemy);
    return container;
  }
  const key = picture ? `enemy-${picture}` : '';
  if (!key || !scene.textures.exists(key)) return buildGoblinCharacter(scene, definition.placeholderColor ?? 0x5c8143);
  const pixelScale = entry?.kind === 'still' ? entry.still.pixelScale : undefined;
  if (pixelScale) {
    // pixel art: whole-number zoom, crisp edges, feet on the ground line like the sheets
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    return scene.add.container(0, 0, [scene.add.image(0, 75, key).setOrigin(0.5, 1).setScale(pixelScale)]);
  }
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
  if (!pixel || !sheetOf(pixel.name)?.attack) return;
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
  const death = pixel ? sheetOf(pixel.name)?.death : undefined;
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

/** Fills a rectangle with a landscape picture, cropped to fit (never stretched) and darkened by
 *  `dim` (0 to 1) so the white text on top stays readable. Returns false if the picture did not load. */
export function addBackdrop(
  scene: Phaser.Scene,
  name: BackgroundName,
  rect: { x: number; y: number; width: number; height: number },
  dim = 0.45
): boolean {
  if (name === ASHLANDS.name) return addAnimatedBackdrop(scene, rect, dim);
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

/**
 * The animated ashlands picture (a wide, looping one, unlike the square stills): scaled to cover
 * the rectangle and cropped around its centre, then darkened like the others. Returns false, and
 * draws nothing, unless every frame loaded.
 */
function addAnimatedBackdrop(scene: Phaser.Scene, rect: { x: number; y: number; width: number; height: number }, dim: number): boolean {
  const keys = Array.from({ length: ASHLANDS.frames }, (_, i) => `bg-${ASHLANDS.name}-${i}`);
  if (!keys.every((key) => scene.textures.exists(key))) return false;
  const animation = `bg-${ASHLANDS.name}`;
  if (!scene.anims.exists(animation)) {
    scene.anims.create({ key: animation, frames: keys.map((key) => ({ key })), frameRate: 1000 / ASHLANDS.frameMs, repeat: -1 });
  }
  const scale = Math.max(rect.width / ASHLANDS.width, rect.height / ASHLANDS.height); // cover, never stretch
  const cropWidth = rect.width / scale;
  const cropHeight = rect.height / scale;
  const left = (ASHLANDS.width - cropWidth) / 2;
  const top = (ASHLANDS.height - cropHeight) / 2;
  scene.add
    .sprite(rect.x - left * scale, rect.y - top * scale, keys[0]!)
    .setOrigin(0, 0)
    .setScale(scale)
    .setCrop(left, top, cropWidth, cropHeight)
    .play(animation);
  scene.add.rectangle(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height, 0x0c0a14, dim);
  return true;
}

/** The backdrop for a full-screen stop (map, rest, shop, event, reward), drawn over the plain
 *  dark background; does nothing if the picture did not load. */
export function addScreenBackdrop(scene: Phaser.Scene, screen: keyof typeof SCREEN_BACKDROPS): void {
  const { name, dim } = SCREEN_BACKDROPS[screen];
  addBackdrop(scene, name, { x: 0, y: 0, width: 800, height: 600 }, dim);
}

/** A hero's portrait for the select screen: the first frame of their picture sheet, or a flat-colour stand-in
 *  when they have no picture yet. Centered on (x, y), about `height` tall. */
export function addHeroPortrait(scene: Phaser.Scene, hero: HeroDefinition, x: number, y: number, height: number): Phaser.GameObjects.GameObject {
  const art = HERO_ART[hero.id];
  if (art && scene.textures.exists(`hero-${hero.id}`)) {
    const sprite = scene.add.sprite(x, y, `hero-${hero.id}`, 0);
    return sprite.setScale(height / art.frameHeight);
  }
  const g = scene.add.graphics({ x, y });
  g.fillStyle(hero.placeholderColor, 1);
  g.fillRoundedRect(-height * 0.2, -height * 0.3, height * 0.4, height * 0.8, 10);
  g.fillCircle(0, -height * 0.42, height * 0.15);
  return g;
}
