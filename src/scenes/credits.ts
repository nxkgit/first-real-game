import Phaser from 'phaser';
import { CREDITS } from '../data/credits';
import { CREDITS_AREA, CREDITS_COLUMN_GAP, CREDITS_MAX_COLUMNS, CREDITS_ROW_GAP, packCredits } from './creditsLayout';
import { onKeyPress } from './ui';

// The Credits overlay: who made the art. Opens over any scene; click anywhere or press Esc to close.

const open = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container>();
const listening = new WeakSet<Phaser.Scene>();

export function isCreditsOpen(scene: Phaser.Scene): boolean {
  return open.has(scene);
}

export function closeCredits(scene: Phaser.Scene): void {
  open.get(scene)?.destroy();
  open.delete(scene);
}

/** Opens the credits (or closes them, if already open). */
export function toggleCredits(scene: Phaser.Scene): void {
  if (isCreditsOpen(scene)) {
    closeCredits(scene);
    return;
  }
  // Esc closes it; scenes are reused, so the listener goes in once per run of the scene
  if (!listening.has(scene)) {
    listening.add(scene);
    onKeyPress(scene, (key) => {
      if (key === 'escape' && isCreditsOpen(scene)) closeCredits(scene);
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      listening.delete(scene);
      open.delete(scene);
    });
  }

  // the backdrop is interactive and on top, so nothing underneath can be clicked while it is open
  const backdrop = scene.add.rectangle(400, 300, 800, 600, 0x08080c, 0.94).setInteractive();
  backdrop.on('pointerdown', () => closeCredits(scene));
  const parts: Phaser.GameObjects.GameObject[] = [backdrop];
  parts.push(scene.add.text(400, 40, 'Credits', { fontSize: '26px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
  parts.push(
    scene.add
      .text(400, 70, 'Art and music used in this game. Click anywhere to close.', { fontSize: '12px', color: '#777788' })
      .setOrigin(0.5)
  );

  // Each row is a group of texts whose height depends on how far its lines wrap, so the rows are
  // measured and flowed into 1, 2 or 3 columns (the first count that fits) instead of sitting on a
  // fixed pitch (issue #32: a fixed pitch drew wrapped rows on top of the next one).
  const rows = CREDITS.map((credit) => {
    const head = scene.add.text(0, 0, credit.usedFor, { fontSize: '14px', color: '#e8e8f0', fontStyle: 'bold' });
    const detail = scene.add.text(0, 18, `${credit.source}, by ${credit.author} (${credit.licence})`, { fontSize: '11px', color: '#c8c8d8' });
    const link = credit.url ? scene.add.text(0, 0, credit.url, { fontSize: '10px', color: '#6f8fb8' }) : null;
    return { texts: [head, detail, ...(link ? [link] : [])], detail, link };
  });
  const measure = (colWidth: number): number[] =>
    rows.map((r) => {
      r.detail.setWordWrapWidth(colWidth, true);
      r.link?.setWordWrapWidth(colWidth, true); // advanced wrap breaks a web address that is wider than the column
      r.link?.setY(18 + r.detail.height + 2);
      return r.link ? 18 + r.detail.height + 2 + r.link.height : 18 + r.detail.height;
    });
  let colWidth = CREDITS_AREA.width;
  let placed = null as ReturnType<typeof packCredits>;
  for (let columns = 1; columns <= CREDITS_MAX_COLUMNS && !placed; columns++) {
    colWidth = (CREDITS_AREA.width - (columns - 1) * CREDITS_COLUMN_GAP) / columns;
    placed = packCredits(measure(colWidth), CREDITS_AREA.height, CREDITS_ROW_GAP, columns);
  }
  // more rows than three columns hold: keep one long column rather than draw nothing
  if (!placed) placed = packCredits(measure((colWidth = CREDITS_AREA.width)), Infinity, CREDITS_ROW_GAP, 1);
  rows.forEach((r, i) => {
    const at = placed![i];
    const x = CREDITS_AREA.x + at.column * (colWidth + CREDITS_COLUMN_GAP);
    for (const t of r.texts) t.setPosition(x, CREDITS_AREA.y + at.y + t.y);
    parts.push(...r.texts);
  });

  const view = scene.add.container(0, 0, parts).setDepth(300);
  open.set(scene, view);
  view.once(Phaser.GameObjects.Events.DESTROY, () => open.delete(scene));
}
