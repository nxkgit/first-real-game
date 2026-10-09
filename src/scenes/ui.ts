import Phaser from 'phaser';
import type { CardDefinition, Effect } from '../game/types';
import { cardTagsText, cardText, relicText } from '../game/describe';
import { lowerIsBetterFor } from '../game/effects';
import type { RunNode, RunState } from '../game/RunState';
import { ANIMATION_SPEEDS, getSettings, onSettingsChange, updateSettings } from '../settings';
import { getCurrentCombat, getCurrentRun, heroFromUrl, seedFromUrl, setCurrentRun } from '../session';
import { newRun } from '../data/run';
import { clearSavedRun, recordFinishedRun, saveRun } from '../storage';
import { BUILD_ID } from '../qa/buildInfo';
import { browserEnvironment, openReportDialog } from '../qa/reportDialog';
import { buildSnapshot } from '../qa/snapshot';
import { RELIC_ICON } from '../data/art';
import { addBorder, addIcon } from './art';
import { toggleCredits } from './credits';
import { gameKeyFrom } from './keyFilter';

// Small UI pieces shared by the run's scenes. Placeholder look, like the rest of the visuals.

export const CARD_WIDTH = 110;
export const CARD_HEIGHT = 150;

const TYPE_COLOR: Record<string, number> = {
  attack: 0xd9534f,
  skill: 0x4f8fd9,
  power: 0xb07de0,
};

/** A card's face (frame, cost badge, name, type, description), centered on the container's origin. */
export function buildCardFace(scene: Phaser.Scene, card: CardDefinition): Phaser.GameObjects.Container {
  const accent = TYPE_COLOR[card.type] ?? 0x888888;

  const g = scene.add.graphics();
  g.fillStyle(0x2c2c3c, 1);
  g.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 10);
  const border = addBorder(scene, CARD_WIDTH, CARD_HEIGHT, accent);
  if (!border) {
    g.lineStyle(2, accent, 1);
    g.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 10);
  }

  // a card paid for in Radiant Light has a gold cost badge, so it can't be mistaken for an energy cost
  const costBadge = scene.add.circle(-CARD_WIDTH / 2 + 16, -CARD_HEIGHT / 2 + 16, 13, card.costResource === 'radiantLight' ? 0xc9a23a : accent);
  const costText = scene.add
    .text(-CARD_WIDTH / 2 + 16, -CARD_HEIGHT / 2 + 16, `${card.cost}`, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  // name sits below the cost badge so long names never run into it; shrink to fit the width.
  // An upgraded card's name is green.
  const nameText = scene.add
    .text(0, -36, card.name, { fontSize: '14px', color: card.upgradeOf ? '#9fe08a' : '#ffffff', fontStyle: 'bold' })
    .setOrigin(0.5);
  for (let size = 13; nameText.width > CARD_WIDTH - 12 && size >= 10; size--) nameText.setFontSize(size);
  const typeText = scene.add.text(0, -19, `${card.type.toUpperCase()}${card.costResource === 'radiantLight' ? ' · LIGHT' : ''}`, { fontSize: '10px', color: '#9a9aae' }).setOrigin(0.5);
  const descText = scene.add
    .text(0, 28, cardText(card), {
      fontSize: '11px',
      color: '#d8d8e4',
      wordWrap: { width: CARD_WIDTH - 16 },
      align: 'center',
    })
    .setOrigin(0.5);

  // tags: a small line along the bottom edge; the description makes room for it
  const tagsLine = cardTagsText(card);
  const tagsText = scene.add
    .text(0, CARD_HEIGHT / 2 - 5, tagsLine, { fontSize: '9px', color: '#7f8fa8', wordWrap: { width: CARD_WIDTH - 14 }, align: 'center' })
    .setOrigin(0.5, 1)
    .setVisible(tagsLine !== '');
  fitDescription(descText, tagsLine === '' ? null : tagsText);

  const face = scene.add.container(0, 0, [g, ...(border ? [border] : []), costBadge, costText, nameText, typeText, descText, tagsText]);
  face.setData('descText', descText);
  face.setData('tagsText', tagsText);
  return face;
}

/** Space for the description: just under the type line down to the bottom edge (or the tags line). */
const DESC_TOP = -10;
const DESC_BOTTOM = CARD_HEIGHT / 2 - 5;

/** Centers the description on its usual spot, nudging it up (and shrinking the font, down to 9px)
 *  if it would run into the tags line or off the card. */
function fitDescription(desc: Phaser.GameObjects.Text, tags: Phaser.GameObjects.Text | null): void {
  const bottom = tags ? tags.y - tags.height - 2 : DESC_BOTTOM;
  for (let size = 11; size >= 9; size--) {
    desc.setFontSize(size);
    if (desc.height <= bottom - DESC_TOP) break;
  }
  const center = Math.min(28, bottom - desc.height / 2);
  desc.setY(Math.max(center, DESC_TOP + desc.height / 2));
}

/**
 * Re-writes a card face's text with live numbers. `liveValue` gives what an effect would really do
 * now (see `CombatState.previewCardEffect`); the text turns green if the card ends up better than
 * printed and red if worse. Effects that show no number, and cards with none, keep their normal
 * text and colour; a card with both better and worse numbers also keeps the normal colour.
 */
export function setCardLiveText(
  face: Phaser.GameObjects.Container,
  card: CardDefinition,
  liveValue: ((effect: Effect) => number | undefined) | undefined
): void {
  const desc = face.getData('descText') as Phaser.GameObjects.Text | undefined;
  if (!desc) return;
  const tags = (face.getData('tagsText') as Phaser.GameObjects.Text | undefined) ?? null;
  let better = false;
  let worse = false;
  const tracked = (effect: Effect): number | undefined => {
    const n = liveValue?.(effect);
    if (n !== undefined) {
      const printed = 'value' in effect ? effect.value : n;
      const delta = lowerIsBetterFor(effect) ? printed - n : n - printed;
      if (delta > 0) better = true;
      else if (delta < 0) worse = true;
    }
    return n;
  };
  const text = cardText(card, tracked);
  if (desc.text !== text) {
    desc.setText(text);
    fitDescription(desc, tags?.visible ? tags : null);
  }
  desc.setColor(better && !worse ? '#7fe08a' : worse && !better ? '#ff7b7b' : '#d8d8e4');
}

/** A clickable rectangle button with a hover grow. Returns its container. */
export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: { width?: number; height?: number; fontSize?: number; fill?: number; stroke?: number; once?: boolean } = {}
): Phaser.GameObjects.Container {
  const { width = 180, height = 46, fontSize = 16, fill = 0x2b6b3d, stroke = 0x4fae6f, once = true } = opts;
  const bg = scene.add.rectangle(0, 0, width, height, fill).setStrokeStyle(2, stroke);
  const text = scene.add.text(0, 0, label, { fontSize: `${fontSize}px`, color: '#ffffff' }).setOrigin(0.5);
  const border = addBorder(scene, width, height, stroke, 10);
  const button = scene.add.container(x, y, border ? [bg, border, text] : [bg, text]);

  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerover', () => scene.tweens.add({ targets: button, scale: 1.05, duration: 100 }));
  bg.on('pointerout', () => scene.tweens.add({ targets: button, scale: 1, duration: 100 }));
  bg.on('pointerdown', () => {
    // scene-changing buttons take one click only; the switch happens on the next frame
    if (once) bg.disableInteractive();
    onClick();
  });
  return button;
}

/**
 * Calls `handler` with the lowercased key for each key press while the scene is running.
 * Listens to the DOM directly rather than Phaser's keyboard plugin: the plugin re-dispatches
 * every key still in its per-frame queue whenever another key event arrives in the same frame,
 * so two quick presses (or a press and release) could fire a handler twice. Held keys are ignored.
 */
export function onKeyPress(scene: Phaser.Scene, handler: (key: string) => void): void {
  const listener = (event: KeyboardEvent): void => {
    // typing in the dev panel's boxes must not play cards
    const target = event.target;
    if (target instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
    const key = gameKeyFrom(event);
    if (key !== null) handler(key);
  };
  window.addEventListener('keydown', listener);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', listener));
}

/** Shakes the camera unless the player has turned motion down in the settings. */
export function shakeCamera(scene: Phaser.Scene, duration: number, intensity: number): void {
  if (!getSettings().reducedMotion) scene.cameras.main.shake(duration, intensity);
}

// ---- card list viewer (the deck, a draw pile, a discard pile) ----

const openCardViews = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container>();

export function isDeckViewOpen(scene: Phaser.Scene): boolean {
  return openCardViews.has(scene);
}

export function closeDeckView(scene: Phaser.Scene): void {
  openCardViews.get(scene)?.destroy();
  openCardViews.delete(scene);
}

/** Opens (or closes, if one is open) a full-screen view of a list of cards. */
export function toggleCardView(scene: Phaser.Scene, title: string, cards: CardDefinition[]): void {
  if (isDeckViewOpen(scene)) {
    closeDeckView(scene);
    return;
  }

  // the backdrop is interactive and on top, so nothing underneath can be clicked while it's open
  const backdrop = scene.add.rectangle(400, 300, 800, 600, 0x08080c, 0.92).setInteractive();
  backdrop.on('pointerdown', () => closeDeckView(scene));
  const heading = scene.add.text(400, 36, title, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
  const hint = scene.add
    .text(400, 62, cards.length === 0 ? 'Nothing here. Click anywhere to close' : 'Click anywhere to close', {
      fontSize: '12px',
      color: '#777788',
    })
    .setOrigin(0.5);
  const view = scene.add.container(0, 0, [backdrop, heading, hint]).setDepth(100);

  // lay cards out in a grid that always fits below the title, shrinking if there are many
  const cols = cards.length > 36 ? 10 : cards.length > 24 ? 8 : 6;
  const rows = Math.max(1, Math.ceil(cards.length / cols));
  const scale = Math.min(0.9, (600 - 100) / (rows * (CARD_HEIGHT + 16)), 740 / (cols * (CARD_WIDTH + 14)));
  const stepX = (CARD_WIDTH + 14) * scale;
  const stepY = (CARD_HEIGHT + 16) * scale;
  cards.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, cards.length - row * cols);
    const x = 400 + (col - (inRow - 1) / 2) * stepX;
    const y = 90 + stepY / 2 + row * stepY;
    view.add(buildCardFace(scene, card).setPosition(x, y).setScale(scale));
  });

  openCardViews.set(scene, view);
  // scenes are reused across restarts, so never let a stale entry outlive the view
  view.once(Phaser.GameObjects.Events.DESTROY, () => openCardViews.delete(scene));
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => openCardViews.delete(scene));
}

/** Opens (or closes) the view of every card in the run's deck. */
export function toggleDeckView(scene: Phaser.Scene, run: RunState): void {
  toggleCardView(scene, `Deck (${run.deck.length} cards)`, run.deck);
}

/** Small top-bar "Deck (N)" button that toggles the deck viewer. */
export function addDeckButton(scene: Phaser.Scene, run: RunState, x: number, beforeOpen?: () => void): void {
  addButton(
    scene,
    x,
    22,
    `Deck (${run.deck.length})`,
    () => {
      beforeOpen?.();
      toggleDeckView(scene, run);
    },
    { width: 104, height: 28, fontSize: 13, fill: 0x2a2a3a, stroke: 0x5a5a72, once: false }
  );
}

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

// ---- settings ----

/** Applies the animation-speed setting to a scene and keeps it in step if the setting changes. */
function followAnimationSpeed(scene: Phaser.Scene): void {
  const apply = (): void => {
    scene.tweens.timeScale = getSettings().animationSpeed;
    scene.time.timeScale = getSettings().animationSpeed;
  };
  apply();
  const off = onSettingsChange(apply);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
}

/** Adds the small Settings button in the bottom-right corner, and applies the saved animation speed. */
export function addSettingsButton(scene: Phaser.Scene, options: { canRestart?: boolean } = {}): void {
  const canRestart = options.canRestart ?? true;
  followAnimationSpeed(scene);
  let panel: Phaser.GameObjects.Container | null = null;

  const close = (): void => {
    panel?.destroy();
    panel = null;
  };
  /** "Abandon this run?": Yes goes to a new run (the hero select screen), Cancel returns to Settings. */
  const openConfirm = (): void => {
    close();
    const backdrop = scene.add.rectangle(400, 300, 800, 600, 0x08080c, 0.8).setInteractive();
    backdrop.on('pointerdown', close);
    const box = scene.add.rectangle(400, 300, 380, 190, 0x1b1b24).setStrokeStyle(2, 0x5a5a72).setInteractive();
    const title = scene.add.text(400, 245, 'Abandon this run?', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const note = scene.add.text(400, 280, 'Your progress will be lost.', { fontSize: '14px', color: '#c8c8d8' }).setOrigin(0.5);
    const yes = addButton(scene, 330, 335, 'Yes', () => startNewRun(scene, false), { width: 120, height: 36, fontSize: 15 });
    const cancel = addButton(scene, 470, 335, 'Cancel', openSettings, {
      width: 120,
      height: 36,
      fontSize: 15,
      fill: 0x2a2a3a,
      stroke: 0x5a5a72,
      once: false,
    });
    panel = scene.add.container(0, 0, [backdrop, box, title, note, yes, cancel]).setDepth(200);
  };
  const extra = canRestart ? 50 : 0;
  const openSettings = (): void => {
    close();
    const parts: Phaser.GameObjects.GameObject[] = [];
    const backdrop = scene.add.rectangle(400, 300, 800, 600, 0x08080c, 0.8).setInteractive();
    backdrop.on('pointerdown', close);
    const box = scene.add.rectangle(400, 300 + extra / 2, 380, 340 + extra, 0x1b1b24).setStrokeStyle(2, 0x5a5a72).setInteractive();
    parts.push(backdrop, box);
    parts.push(scene.add.text(400, 152, 'Settings', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));

    const s = getSettings();
    const row = (y: number, label: string, value: string, onClick: () => void): void => {
      parts.push(scene.add.text(240, y, label, { fontSize: '15px', color: '#c8c8d8' }).setOrigin(0, 0.5));
      parts.push(
        addButton(scene, 530, y, value, onClick, {
          width: 130,
          height: 30,
          fontSize: 14,
          fill: 0x2a2a3a,
          stroke: 0x5a5a72,
          once: false,
        })
      );
    };
    const volumeSteps = [0, 0.25, 0.5, 0.75, 1];
    row(205, 'Effects volume', `${Math.round(s.volume * 100)}%`, () => {
      const next = volumeSteps.find((v) => v > s.volume + 0.001) ?? 0;
      updateSettings({ volume: next });
      openSettings();
    });
    row(243, 'Music volume', `${Math.round(s.musicVolume * 100)}%`, () => {
      const next = volumeSteps.find((v) => v > s.musicVolume + 0.001) ?? 0;
      updateSettings({ musicVolume: next });
      openSettings();
    });
    row(281, 'Sound & music', s.muted ? 'Off' : 'On', () => {
      updateSettings({ muted: !s.muted });
      openSettings();
    });
    row(319, 'Animation speed', `${s.animationSpeed}x`, () => {
      const next = ANIMATION_SPEEDS[(ANIMATION_SPEEDS.indexOf(s.animationSpeed) + 1) % ANIMATION_SPEEDS.length];
      updateSettings({ animationSpeed: next });
      openSettings();
    });
    row(357, 'Screen shake', s.reducedMotion ? 'Off' : 'On', () => {
      updateSettings({ reducedMotion: !s.reducedMotion });
      openSettings();
    });
    if (canRestart) {
      parts.push(
        addButton(scene, 400, 410, 'Restart run', openConfirm, {
          width: 260,
          height: 36,
          fontSize: 15,
          fill: 0x4a2430,
          stroke: 0x8a4a5a,
          once: false,
        })
      );
    }
    parts.push(
      addButton(scene, 330, 415 + extra, 'Credits', () => toggleCredits(scene), {
        width: 120,
        height: 36,
        fontSize: 15,
        fill: 0x2a2a3a,
        stroke: 0x5a5a72,
        once: false,
      })
    );
    parts.push(addButton(scene, 470, 415 + extra, 'Close', close, { width: 120, height: 36, fontSize: 15, once: false }));
    panel = scene.add.container(0, 0, parts).setDepth(200);
  };

  addButton(scene, 756, 586, 'Settings', () => (panel ? close() : openSettings()), {
    width: 76,
    height: 22,
    fontSize: 11,
    fill: 0x2a2a3a,
    stroke: 0x5a5a72,
    once: false,
  });
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => (panel = null));
}

// ---- moving between screens ----

/** Runs whose report has already been stored, so re-entering the end screen doesn't store it twice. */
const reportedRuns = new WeakSet<RunState>();

const NODE_SCENE: Record<RunNode['kind'], string> = {
  combat: 'CombatScene',
  rest: 'RestScene',
  shop: 'ShopScene',
  event: 'EventScene',
};

/**
 * A new run: the hero select screen, or straight in when the address names a hero (`?hero=paladin`,
 * which the browser tests and the dev tools use). Continuing a saved run never comes through here.
 * `useUrlSeed` is whether `?seed=` applies (the first boot) or the run gets a random seed.
 */
export function startNewRun(scene: Phaser.Scene, useUrlSeed: boolean): void {
  const heroId = heroFromUrl();
  if (heroId) enterCurrentNode(scene, newRun(useUrlSeed ? seedFromUrl() : undefined, heroId));
  else scene.scene.start('HeroSelectScene', { useUrlSeed });
}

/** Starts whichever scene matches where the run is now. Every scene transition goes through here. */
export function enterCurrentNode(scene: Phaser.Scene, run: RunState): void {
  setCurrentRun(run);
  if (run.phase === 'won' || run.phase === 'lost') {
    // the run is over: keep its report for the playtester and forget the save
    if (!reportedRuns.has(run)) {
      reportedRuns.add(run);
      recordFinishedRun(run);
    }
    clearSavedRun();
    scene.scene.start('RunEndScene', { run });
    return;
  }
  saveRun(run); // every stop is a save point
  if (run.phase === 'map') {
    scene.scene.start('MapScene', { run });
  } else if (run.phase === 'reward') {
    scene.scene.start('RewardScene', { run });
  } else if (run.phase === 'draft') {
    // starter-deck draft (DESIGN_LOG.md "Starter deck draft"): an intro screen until the first
    // offer is rolled, then the reward screen's own 1-of-3 picker, reused, once per round.
    scene.scene.start(run.pendingDraftOffer ? 'RewardScene' : 'DraftIntroScene', { run, draft: true });
  } else {
    scene.scene.start(NODE_SCENE[run.currentNode.kind], { run });
  }
}
