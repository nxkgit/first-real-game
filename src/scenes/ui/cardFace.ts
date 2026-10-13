import Phaser from 'phaser';
import type { CardDefinition, Effect } from '../../model';
import { cardTagsText, cardText } from '../../game/describe';
import { lowerIsBetterFor } from '../../game/effects';
import { addBorder, addCardArt, hasOwnCardArt } from '../artLoader';

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

  // picture window along the top (the cost badge sits over its corner); without one the text
  // keeps the layout it had before cards had pictures
  const showArt = hasOwnCardArt(scene, card) || descriptionFitsBesidePlaceholder(scene, card);
  const art = showArt ? addCardArt(scene, card, { x: 0, y: ART_Y, width: ART_WIDTH, height: ART_HEIGHT }) : null;
  const top = art ? WITH_ART : NO_ART;
  const artFrame = art ? scene.add.rectangle(0, ART_Y, ART_WIDTH, ART_HEIGHT).setStrokeStyle(1, accent) : null;

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
    .text(0, top.name, card.name, { fontSize: '14px', color: card.upgradeOf ? '#9fe08a' : '#ffffff', fontStyle: 'bold' })
    .setOrigin(0.5);
  for (let size = 13; nameText.width > CARD_WIDTH - 12 && size >= 10; size--) nameText.setFontSize(size);
  const typeText = scene.add.text(0, top.type, `${card.type.toUpperCase()}${card.costResource === 'radiantLight' ? ' · LIGHT' : ''}`, { fontSize: '10px', color: '#9a9aae' }).setOrigin(0.5);
  const descText = scene.add
    .text(0, top.descCenter, cardText(card), {
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
  fitDescription(descText, tagsLine === '' ? null : tagsText, top);

  const face = scene.add.container(0, 0, [g, ...(border ? [border] : []), ...(art ? [art] : []), ...(artFrame ? [artFrame] : []), costBadge, costText, nameText, typeText, descText, tagsText]);
  face.setData('descText', descText);
  face.setData('tagsText', tagsText);
  face.setData('textTop', top);
  return face;
}

const ART_WIDTH = 98;

const ART_HEIGHT = 42;

const ART_Y = -CARD_HEIGHT / 2 + 8 + ART_HEIGHT / 2;

/** Vertical positions of the name, the type line and the description (top and usual centre). */
interface TextTop {
  name: number;
  type: number;
  descTop: number;
  descCenter: number;
}

const WITH_ART: TextTop = { name: -15, type: -1, descTop: 7, descCenter: 36 };

const NO_ART: TextTop = { name: -36, type: -19, descTop: -10, descCenter: 28 };

/** Space for the description: just under the type line down to the bottom edge (or the tags line). */
const DESC_BOTTOM = CARD_HEIGHT / 2 - 5;

/**
 * TEMPORARY (user, 2026-10-09): while every card shows the shared placeholder picture, a card whose
 * text cannot fit beside the picture window (Heating Up's long wording) is drawn without the picture,
 * in the layout cards had before they had pictures. A card with its own picture always keeps it (see
 * `hasOwnCardArt`). REMOVE this check, and its mention in docs/CARD_WORKFLOW.md, once real card art
 * exists and the layout has room for the longest text.
 */
function descriptionFitsBesidePlaceholder(scene: Phaser.Scene, card: CardDefinition): boolean {
  const wrap = { width: CARD_WIDTH - 16 };
  const desc = scene.add.text(0, 0, cardText(card), { fontSize: '9px', wordWrap: wrap, align: 'center' });
  const tagsLine = cardTagsText(card);
  const tags = scene.add.text(0, 0, tagsLine, { fontSize: '9px', wordWrap: { width: CARD_WIDTH - 14 }, align: 'center' });
  const bottom = tagsLine === '' ? DESC_BOTTOM : CARD_HEIGHT / 2 - 5 - tags.height - 2;
  const fits = desc.height <= bottom - WITH_ART.descTop;
  desc.destroy();
  tags.destroy();
  return fits;
}

/** Centers the description on its usual spot, nudging it up (and shrinking the font, down to 9px)
 *  if it would run into the tags line or off the card. */
function fitDescription(desc: Phaser.GameObjects.Text, tags: Phaser.GameObjects.Text | null, top: TextTop): void {
  const bottom = tags ? tags.y - tags.height - 2 : DESC_BOTTOM;
  desc.setLineSpacing(0);
  for (let size = 11; size >= 9; size--) {
    desc.setFontSize(size);
    if (desc.height <= bottom - top.descTop) break;
  }
  // a very long text (Heating Up's) still does not fit at 9px: pull the lines closer together
  for (let spacing = -1; spacing >= -5 && desc.height > bottom - top.descTop; spacing--) desc.setLineSpacing(spacing);
  const center = Math.min(top.descCenter, bottom - desc.height / 2);
  desc.setY(Math.max(center, top.descTop + desc.height / 2));
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
  const top = face.getData('textTop') as TextTop;
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
    fitDescription(desc, tags?.visible ? tags : null, top);
  }
  desc.setColor(better && !worse ? '#7fe08a' : worse && !better ? '#ff7b7b' : '#d8d8e4');
}
