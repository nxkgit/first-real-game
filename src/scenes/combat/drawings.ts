import Phaser from 'phaser';

// Visuals are built entirely from Phaser's drawing primitives (no art assets): simple vector
// silhouettes in a rough fantasy style, meant to make combat readable, not as finished art.
// Final character/art identity is the user's to design — see CLAUDE.md.

/** A simple vector wizard: robe, pointed hood, and a glowing staff. Facing right. */
export function buildMageCharacter(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const g = scene.add.graphics();

  // cape, behind everything else
  g.fillStyle(0x2e2550, 1);
  g.fillTriangle(-10, -25, -34, 72, 2, 60);
  g.fillTriangle(8, -25, 32, 72, -4, 60);

  // robe (tapered torso, as two triangles forming a trapezoid)
  g.fillStyle(0x473a82, 1);
  g.fillTriangle(-16, -28, 16, -28, 30, 62);
  g.fillTriangle(-16, -28, 30, 62, -30, 62);

  // belt
  g.fillStyle(0xd8b23c, 1);
  g.fillRect(-20, 18, 40, 6);

  // off-arm
  g.fillStyle(0x473a82, 1);
  g.fillRect(-30, -10, 10, 30);

  // staff arm
  g.fillRect(16, -10, 10, 34);

  // hood
  g.fillStyle(0x362b5e, 1);
  g.fillTriangle(-18, -30, 18, -30, 0, -74);

  // face
  g.fillStyle(0xe3b183, 1);
  g.fillCircle(0, -46, 12);

  // staff shaft
  g.fillStyle(0x6b4a2a, 1);
  g.fillRect(27, -98, 6, 112);

  // feet
  g.fillStyle(0x241c40, 1);
  g.fillRect(-18, 60, 14, 10);
  g.fillRect(6, 60, 14, 10);

  const staffOrb = scene.add.circle(30, -101, 8, 0x6fe0ff).setStrokeStyle(2, 0xd6f7ff);
  scene.tweens.add({
    targets: staffOrb,
    alpha: { from: 0.65, to: 1 },
    scale: { from: 0.85, to: 1.2 },
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  return scene.add.container(0, 0, [g, staffOrb]);
}

/** A simple vector goblin: squat body, pointed ears, claws. Facing left. `skin` sets the body
 *  color (head a shade lighter, legs darker) so placeholder enemies can be told apart. */
export function buildGoblinCharacter(scene: Phaser.Scene, skin: number): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  const head = Phaser.Display.Color.IntegerToColor(skin).lighten(8).color;
  const legs = Phaser.Display.Color.IntegerToColor(skin).darken(12).color;

  // legs
  g.fillStyle(legs, 1);
  g.fillRect(-24, 38, 14, 16);
  g.fillRect(10, 38, 14, 16);

  // body
  g.fillStyle(skin, 1);
  g.fillEllipse(0, 10, 72, 56);

  // loincloth
  g.fillStyle(0x5a3f23, 1);
  g.fillRect(-20, 26, 40, 14);

  // arms
  g.fillStyle(skin, 1);
  g.fillRect(-44, -4, 16, 32);
  g.fillRect(28, -4, 16, 32);

  // claws
  g.fillStyle(0xe8e4d8, 1);
  g.fillTriangle(-44, 24, -28, 24, -36, 38);
  g.fillTriangle(28, 24, 44, 24, 36, 38);

  // head
  g.fillStyle(head, 1);
  g.fillCircle(0, -32, 24);

  // ears
  g.fillTriangle(-23, -40, -38, -58, -12, -46);
  g.fillTriangle(23, -40, 38, -58, 12, -46);

  // teeth
  g.fillStyle(0xf2efe0, 1);
  g.fillTriangle(-8, -14, -2, -14, -5, -7);
  g.fillTriangle(2, -14, 8, -14, 5, -7);

  const leftEye = scene.add.circle(-9, -34, 4, 0xffcc33);
  const rightEye = scene.add.circle(9, -34, 4, 0xffcc33);
  scene.tweens.add({
    targets: [leftEye, rightEye],
    alpha: { from: 1, to: 0.45 },
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  return scene.add.container(0, 0, [g, leftEye, rightEye]);
}

/** Slow up-and-down float, so a standing character reads as alive. */
export function addIdleBob(scene: Phaser.Scene, target: Phaser.GameObjects.Container, baseY: number): void {
  scene.tweens.add({
    targets: target,
    y: baseY - 6,
    duration: 1300 + Math.random() * 200,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

/** Kite-shield icon centered on the graphic's origin. */
export function drawShield(g: Phaser.GameObjects.Graphics, scale = 1): void {
  const outline = [0, -10, 9, -6, 9, 4, 0, 11, -9, 4, -9, -6];
  const points: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < outline.length; i += 2) {
    points.push(new Phaser.Math.Vector2(outline[i] * scale, outline[i + 1] * scale));
  }
  g.fillStyle(0x6fa8d9, 1);
  g.fillPoints(points, true);
  g.lineStyle(2, 0xbfe0ff, 1);
  g.strokePoints(points, true);
}

/** Upright sword icon centered on the graphic's origin (rotate the graphic to tilt it). */
export function drawSword(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xdfe6ee, 1);
  g.fillRect(-3, -14, 6, 18); // blade
  g.fillTriangle(-3, -14, 3, -14, 0, -21); // tip
  g.fillStyle(0xc9a23c, 1);
  g.fillRect(-9, 4, 18, 4); // crossguard
  g.fillStyle(0x6b4a2a, 1);
  g.fillRect(-2, 8, 4, 8); // grip
  g.fillStyle(0xc9a23c, 1);
  g.fillCircle(0, 18, 3); // pommel
}

/** A bold arrow centered on the graphic's origin: up for "buff", down for "debuff". */
export function drawArrow(g: Phaser.GameObjects.Graphics, direction: 'up' | 'down', color: number): void {
  const d = direction === 'up' ? -1 : 1;
  g.fillStyle(color, 1);
  g.fillTriangle(-11, d * 1, 11, d * 1, 0, d * 15); // head (point away from the shaft)
  g.fillRect(-4, d === -1 ? 0 : -14, 8, 14); // shaft
  g.lineStyle(2, 0xffffff, 0.6);
  g.strokeTriangle(-11, d * 1, 11, d * 1, 0, d * 15);
}

/** A plain flat-colour stand-in for a hero with no picture yet (a body and a head). Facing right, feet near y = 70. */
export function buildPlaceholderHero(scene: Phaser.Scene, color: number): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRoundedRect(-24, -30, 48, 100, 10);
  g.fillCircle(0, -48, 18);
  g.lineStyle(2, 0xffffff, 0.5);
  g.strokeRoundedRect(-24, -30, 48, 100, 10);
  g.strokeCircle(0, -48, 18);
  return scene.add.container(0, 0, [g]);
}
