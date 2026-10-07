import Phaser from 'phaser';
import type { MapNode, MapNodeKind } from '../game/actMap';
import type { RunState } from '../game/RunState';
import { Sfx } from '../audio/Sfx';
import { useLayoutCamera } from '../display';
import { mapLayout } from './mapLayout';
import {
  addDeckButton,
  addRunHud,
  addSettingsButton,
  closeDeckView,
  enterCurrentNode,
  onKeyPress,
  toggleDeckView,
} from './ui';

/** Placeholder look for each kind of stop: a letter on a colored disc. */
export const MAP_STYLE: Record<MapNodeKind, { symbol: string; color: number; label: string }> = {
  combat: { symbol: 'F', color: 0xc9544f, label: 'Fight' },
  elite: { symbol: 'E', color: 0x8a2f6a, label: 'Elite fight' },
  rest: { symbol: 'R', color: 0xe0803c, label: 'Rest stop' },
  shop: { symbol: '$', color: 0xd8b23c, label: 'Shop' },
  event: { symbol: '?', color: 0x4f8fd9, label: 'Event' },
  boss: { symbol: 'B', color: 0x5a3a8a, label: 'Boss' },
};




/** Between stops: the act's map. Pick one of the glowing stops to go there next. */
export class MapScene extends Phaser.Scene {
  private run!: RunState;
  private chosen = false;

  constructor() {
    super('MapScene');
  }

  init(data: { run: RunState }): void {
    this.run = data.run;
    this.chosen = false;
  }

  create(): void {
    useLayoutCamera(this);
    this.add.rectangle(400, 300, 800, 600, 0x14141c);
    const hud = addRunHud(this, this.run, { showHp: true });
    addDeckButton(this, this.run, hud.x + hud.width + 70);
    addSettingsButton(this);
    onKeyPress(this, (key) => {
      if (key === 'd') toggleDeckView(this, this.run);
      else if (key === 'escape') closeDeckView(this);
    });

    this.add.text(400, 62, 'Choose your path', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    const layout = mapLayout(this.run.map.floors, this.run.map.lanes);
    const choices = new Set(this.run.mapChoices.map((n) => n.id));
    const visited = new Set(this.run.visited);
    const byId = new Map(this.run.map.nodes.map((n) => [n.id, n]));

    // paths first, so the stops sit on top of them
    const lines = this.add.graphics();
    for (const node of this.run.map.nodes) {
      for (const nextId of node.next) {
        const next = byId.get(nextId)!;
        const walked = visited.has(node.id) && visited.has(nextId);
        const open = node.id === this.run.position && choices.has(nextId);
        lines.lineStyle(walked ? 4 : 2, walked ? 0xd8b23c : open ? 0xe8e8f0 : 0x3a3a50, 1);
        lines.lineBetween(layout.x(node.lane), layout.y(node.floor), layout.x(next.lane), layout.y(next.floor));
      }
    }
    // before the first stop, every bottom stop is open: draw a faint "start" marker beneath them
    if (this.run.position === null) {
      this.add.text(400, layout.y(0) + 34, 'Start here', { fontSize: '12px', color: '#777788' }).setOrigin(0.5);
    }

    const hover = this.add.text(400, 586, '', { fontSize: '13px', color: '#c8c8d8' }).setOrigin(0.5);
    for (const node of this.run.map.nodes) this.drawNode(node, choices.has(node.id), visited.has(node.id), hover);
    this.drawLegend();
    this.showNotice();
  }

  private drawNode(node: MapNode, open: boolean, visited: boolean, hover: Phaser.GameObjects.Text): void {
    const style = MAP_STYLE[node.kind];
    const radius = node.kind === 'boss' ? 21 : 14;
    const here = node.id === this.run.position;
    const layout = mapLayout(this.run.map.floors, this.run.map.lanes);
    const x = layout.x(node.lane);
    const y = layout.y(node.floor);

    const disc = this.add.circle(0, 0, radius, style.color).setStrokeStyle(open || here ? 3 : 2, open ? 0xffffff : here ? 0xd8b23c : 0x1b1b24);
    const symbol = this.add
      .text(0, 0, style.symbol, { fontSize: node.kind === 'boss' ? '20px' : '15px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    const container = this.add.container(x, y, [disc, symbol]);
    container.setAlpha(open || here ? 1 : visited ? 0.4 : 0.6);

    if (!open) return;
    this.tweens.add({ targets: disc, scale: { from: 1, to: 1.18 }, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    disc.setInteractive({ useHandCursor: true });
    disc.on('pointerover', () => hover.setText(style.label));
    disc.on('pointerout', () => hover.setText(''));
    disc.on('pointerdown', () => {
      if (this.chosen) return;
      this.chosen = true;
      Sfx.choose();
      this.run.chooseNode(node.id);
      enterCurrentNode(this, this.run);
    });
  }

  private drawLegend(): void {
    this.add.text(690, 110, 'Stops', { fontSize: '13px', color: '#9a9aae', fontStyle: 'bold' }).setOrigin(0, 0.5);
    (Object.keys(MAP_STYLE) as MapNodeKind[]).forEach((kind, i) => {
      const y = 140 + i * 28;
      const style = MAP_STYLE[kind];
      this.add.circle(702, y, 9, style.color);
      this.add.text(702, y, style.symbol, { fontSize: '11px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(718, y, style.label, { fontSize: '12px', color: '#c8c8d8' }).setOrigin(0, 0.5);
    });
  }

  /** Anything the player should be told once, such as a relic an event fight gave them. */
  private showNotice(): void {
    const lines = this.run.takeNotice();
    if (lines.length === 0) return;
    const banner = this.add
      .text(400, 96, lines.join('\n'), {
        fontSize: '15px',
        color: '#ffe066',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#0c0c12',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: banner, alpha: 0, delay: 3500, duration: 700, onComplete: () => banner.destroy() });
  }
}
