import type Phaser from 'phaser';
import { buildRunReport, formatRunReport } from '../game/runReport';
import { CARDS, getCard } from '../data/cards';
import { ENEMIES, getEnemy } from '../data/enemies';
import { newRun } from '../data/run';
import { enterCurrentNode } from '../scenes/ui';
import { getCurrentRun } from '../session';
import { copyToClipboard, loadReportHistory } from '../storage';

/**
 * A developer panel for getting the game into any state quickly, for testing. It is only loaded
 * when the page address has `?dev` (see main.ts), so players never see it. Press ` (backtick) to
 * fold it away. It works on the live run through the same methods the game itself uses.
 */
export function installDevPanel(game: Phaser.Game): void {
  const panel = document.createElement('div');
  panel.style.cssText =
    'position:fixed;left:8px;bottom:8px;z-index:1000;width:250px;max-height:90vh;overflow:auto;' +
    'background:rgba(12,12,18,0.94);color:#d8d8e4;border:1px solid #5a5a72;border-radius:6px;' +
    'font:12px/1.4 monospace;padding:8px;';

  const body = document.createElement('div');
  const title = document.createElement('div');
  title.textContent = 'DEV  (` to fold)';
  title.style.cssText = 'font-weight:bold;cursor:pointer;margin-bottom:6px;color:#ffe066;';
  title.onclick = () => (body.hidden = !body.hidden);
  window.addEventListener('keydown', (e) => {
    if (e.key === '`') body.hidden = !body.hidden;
  });
  panel.append(title, body);
  document.body.appendChild(panel);

  // ---- helpers ----

  const info = document.createElement('div');
  info.style.cssText = 'margin-bottom:6px;color:#9fd3ff;white-space:pre-wrap;';
  const status = document.createElement('div');
  status.style.cssText = 'margin-top:6px;color:#9a9aae;';

  const row = (...els: HTMLElement[]): HTMLDivElement => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;gap:4px;margin:4px 0;align-items:center;flex-wrap:wrap;';
    d.append(...els);
    return d;
  };
  const button = (label: string, onClick: () => void): HTMLButtonElement => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'font:inherit;cursor:pointer;background:#2a2a3a;color:#fff;border:1px solid #5a5a72;padding:2px 6px;';
    b.onclick = onClick;
    return b;
  };
  const select = (options: [string, string][]): HTMLSelectElement => {
    const s = document.createElement('select');
    s.style.cssText = 'font:inherit;max-width:150px;background:#1b1b24;color:#fff;border:1px solid #5a5a72;';
    for (const [value, label] of options) s.add(new Option(label, value));
    return s;
  };
  const say = (text: string): void => {
    status.textContent = text;
  };
  const scene = (): Phaser.Scene => {
    const active = game.scene.getScenes(true)[0];
    if (!active) throw new Error('no active scene');
    return active;
  };
  /** Runs `action` on the current run, then shows whatever screen matches the new state. */
  const withRun = (action: (run: NonNullable<ReturnType<typeof getCurrentRun>>) => void, redraw = true): void => {
    const run = getCurrentRun();
    if (!run) return say('No run yet.');
    try {
      action(run);
      if (redraw) enterCurrentNode(scene(), run);
      refresh();
    } catch (error) {
      say(String(error));
    }
  };

  // ---- sections ----

  const jump = select([]);
  const refreshJump = (): void => {
    const run = getCurrentRun();
    if (!run || jump.options.length === run.nodes.length) return;
    jump.innerHTML = '';
    run.nodes.forEach((node, i) => {
      const label = node.kind === 'combat' ? node.enemies.map((e) => e.name).join(' + ') : node.kind;
      jump.add(new Option(`${i + 1}. ${label}`, String(i)));
    });
  };

  const enemyBoxes = Object.keys(ENEMIES).map((id) => {
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = id;
    const label = document.createElement('label');
    label.append(box, ` ${getEnemy(id).name}`);
    label.style.marginRight = '6px';
    return { box, label };
  });

  const cardPick = select(Object.values(CARDS).map((c) => [c.id, `${c.name} (${c.cost})`]));
  const seedInput = document.createElement('input');
  seedInput.placeholder = 'seed (blank = random)';
  seedInput.style.cssText = 'font:inherit;width:130px;background:#1b1b24;color:#fff;border:1px solid #5a5a72;';

  body.append(
    info,
    row(jump, button('Go to node', () => withRun((run) => run.jumpTo(Number(jump.value))))),
    row(...enemyBoxes.map((e) => e.label)),
    row(
      button('Fight these here', () => {
        const ids = enemyBoxes.filter((e) => e.box.checked).map((e) => e.box.value);
        if (ids.length === 0) return say('Tick at least one enemy.');
        withRun((run) => {
          run.nodes[run.nodeIndex] = { kind: 'combat', enemies: ids.map(getEnemy) };
          run.jumpTo(run.nodeIndex);
        });
      })
    ),
    row(cardPick, button('Add card', () => withRun((run) => run.deck.push(getCard(cardPick.value)), false))),
    row(
      button('+50 gold', () => withRun((run) => (run.gold += 50), false)),
      button('Heal full', () => withRun((run) => (run.hp = run.maxHp), false)),
      button('HP 1', () => withRun((run) => (run.hp = 1), false))
    ),
    row(
      seedInput,
      button('New run', () => {
        const text = seedInput.value.trim();
        if (text !== '' && !/^\d+$/.test(text)) return say('Seed must be a whole number.');
        enterCurrentNode(scene(), newRun(text === '' ? undefined : Number(text)));
        refresh();
      })
    ),
    row(
      button('Copy this run', () =>
        withRun((run) => void copyToClipboard(formatRunReport(buildRunReport(run))).then((ok) => say(ok ? 'Copied.' : 'Copy failed.')), false)
      ),
      button('Copy past runs', () => {
        const history = loadReportHistory();
        void copyToClipboard(JSON.stringify(history, null, 2)).then((ok) =>
          say(ok ? `Copied ${history.length} report(s).` : 'Copy failed.')
        );
      })
    ),
    status
  );

  function refresh(): void {
    const run = getCurrentRun();
    refreshJump();
    if (!run) {
      info.textContent = 'No run yet.';
      return;
    }
    jump.value = String(Math.min(run.nodeIndex, run.nodes.length - 1));
    info.textContent = `seed ${run.seed}\nfloor ${run.floor}/${run.totalFloors}  ${run.phase}\nhp ${run.hp}/${run.maxHp}  gold ${run.gold}  deck ${run.deck.length}`;
  }

  refresh();
  window.setInterval(refresh, 500);
}
