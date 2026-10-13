import Phaser from 'phaser';
import { relicText } from '../../game/describe';
import type { RunState } from '../../game/RunState';
import { getCurrentCombat, getCurrentRun } from '../../app/session';
import { BUILD_ID } from '../../qa/buildInfo';
import { browserEnvironment, openReportDialog } from '../../qa/reportDialog';
import { buildSnapshot } from '../../qa/snapshot';
import { RELIC_ICON } from '../../data/art';
import { addIcon } from '../artLoader';
import { addButton } from './widgets';

/** Centre-to-centre distance from the Deck button to the Report button beside it. */
const REPORT_BUTTON_OFFSET = 102;

/**
 * Small top-bar "Report" button that opens the bug-report window (QA_PLAN.md). Put it next to the
 * Deck button by passing that button's x; on screens with no Deck button it sits at the top left.
 * The snapshot is taken when the window opens, from the live run and fight.
 */
export function addReportButton(scene: Phaser.Scene, deckX?: number): void {
  addButton(
    scene,
    deckX === undefined ? 70 : deckX + REPORT_BUTTON_OFFSET,
    22,
    'Report',
    () =>
      openReportDialog({
        getSnapshot: () =>
          buildSnapshot({
            run: getCurrentRun(),
            combat: getCurrentCombat(),
            screen: scene.scene.key,
            build: BUILD_ID,
            environment: browserEnvironment(),
            now: new Date(),
          }),
      }),
    { width: 84, height: 28, fontSize: 13, fill: 0x2a2a3a, stroke: 0x5a5a72, once: false }
  );
}

// ---- run readout, relics ----

/** The text of the run status line: floor, gold, and (outside combat) HP. */
export function runHudText(run: RunState, showHp: boolean): string {
  const parts = [`Floor ${Math.max(1, run.floor)}/${run.totalFloors}`, `Gold ${run.gold}`];
  if (showHp) parts.unshift(`HP ${run.hp}/${run.maxHp}`);
  return parts.join('    ');
}

/** Top-left run status line (floor, gold, and outside combat also HP), with the relics you hold below it. */
export function addRunHud(scene: Phaser.Scene, run: RunState, opts: { showHp?: boolean } = {}): Phaser.GameObjects.Text {
  const text = scene.add.text(20, 22, runHudText(run, opts.showHp ?? false), { fontSize: '14px', color: '#c8c8d8' }).setOrigin(0, 0.5);
  addRelicBar(scene, run);
  return text;
}

const RELIC_COLORS = [0xc9544f, 0x4f8fd9, 0x5fb36b, 0xd8b23c, 0xb07de0, 0xe0803c];

/** A row of small badges, one per relic held; hover (or tap) one to read what it does. */
function addRelicBar(scene: Phaser.Scene, run: RunState): void {
  if (run.relics.length === 0) return;
  const bubbleBg = scene.add.rectangle(0, 0, 10, 10, 0x0c0c12, 0.95).setStrokeStyle(1, 0x5a5a72).setOrigin(0, 0);
  const bubbleText = scene.add
    .text(8, 6, '', { fontSize: '12px', color: '#e8e8f0', wordWrap: { width: 230 } })
    .setOrigin(0, 0);
  const bubble = scene.add.container(0, 0, [bubbleBg, bubbleText]).setDepth(150).setVisible(false);
  let shownByTouch: number | null = null;

  scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    if (shownByTouch !== null && pointer.downTime !== shownByTouch) {
      bubble.setVisible(false);
      shownByTouch = null;
    }
  });

  run.relics.forEach((relic, i) => {
    const x = 32 + i * 30;
    const y = 54;
    const hash = [...relic.id].reduce((n, ch) => n + ch.charCodeAt(0), 0);
    const icon = RELIC_ICON[relic.id] ? addIcon(scene, RELIC_ICON[relic.id], 24) : null;
    const badge = scene.add
      .rectangle(x, y, 26, 26, icon ? 0x23232f : RELIC_COLORS[hash % RELIC_COLORS.length])
      .setStrokeStyle(2, icon ? 0x8a8aa2 : 0xffffff, 0.6)
      .setInteractive({ useHandCursor: true });
    if (icon) icon.setPosition(x, y);
    else {
      scene.add
        .text(x, y, relic.name.charAt(0).toUpperCase(), { fontSize: '13px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5);
    }
    badge.on('pointerover', (pointer: Phaser.Input.Pointer) => {
      bubbleText.setText(`${relic.name}\n${relicText(relic)}`);
      bubbleBg.setSize(bubbleText.width + 16, bubbleText.height + 12);
      bubble.setPosition(Math.min(x - 12, 800 - bubbleBg.width - 4), y + 18).setVisible(true);
      shownByTouch = pointer.wasTouch ? pointer.downTime : null;
    });
    badge.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.wasTouch) bubble.setVisible(false);
    });
  });
}
