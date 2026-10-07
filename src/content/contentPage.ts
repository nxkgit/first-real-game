import { cardText, describeEffect, describeOutcome, relicText } from '../game/describe';
import type { EnemyMove } from '../game/types';
import { DEFAULT_MAP_PARAMS } from '../game/actMap';
import { baseCards, upgradedVersion } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { EVENTS } from '../data/events';
import { RELIC_POOL } from '../data/relics';
import { ACT_CONTENT } from '../data/run';
import { STATUSES } from '../data/statuses';
import * as tunables from '../data/tunables';
import { copyToClipboard } from '../storage';
import { toCsv, toMarkdown } from './tableExport';
import type { Table } from './tableExport';

// The content browser: every card, relic, enemy, status and event as the game really has them, with
// the same generated text the game shows, plus copy-as-Markdown / copy-as-CSV for each table so the
// numbers can be pasted into a document or spreadsheet for design discussions.

const moveText = (move: EnemyMove): string => `${move.name}: ${move.effects.map((e) => describeEffect(e)).join(' ')}`;

function cardsTable(): Table {
  return {
    id: 'cards',
    title: 'Cards',
    note: 'Text is generated from each card\'s effects. "Upgrade" is what the card becomes at a rest stop.',
    headers: ['Name', 'Type', 'Cost', 'Text', 'Upgraded text', 'Upgraded cost', 'Owner', 'Reward pool'],
    rows: baseCards().map((card) => {
      const up = upgradedVersion(card);
      return [
        card.name,
        card.type,
        String(card.cost),
        cardText(card),
        up ? cardText(up) : '(none)',
        up ? String(up.cost) : '',
        card.owner,
        card.inRewardPool ? 'yes' : 'no',
      ];
    }),
  };
}

function relicsTable(): Table {
  return {
    id: 'relics',
    title: 'Relics',
    headers: ['Name', 'Text'],
    rows: RELIC_POOL.map((relic) => [relic.name, relicText(relic)]),
  };
}

function enemiesTable(): Table {
  return {
    id: 'enemies',
    title: 'Enemies',
    note: 'Each enemy repeats its moves in this order. "You" in a move means the player.',
    headers: ['Name', 'HP', 'Moves, in order'],
    rows: Object.values(ENEMIES).map((enemy) => [enemy.name, String(enemy.maxHp), enemy.movePattern.map(moveText).join('  |  ')]),
  };
}

function statusesTable(): Table {
  return {
    id: 'statuses',
    title: 'Status effects',
    headers: ['Name', 'Kind', 'What it does (for 2 stacks)'],
    rows: Object.values(STATUSES).map((s) => [s.name, s.kind === 'duration' ? 'counts down' : 'permanent', s.describe(2)]),
  };
}

function eventsTable(): Table {
  const rows: string[][] = [];
  for (const event of Object.values(EVENTS)) {
    event.choices.forEach((choice, i) => {
      rows.push([
        i === 0 ? event.title : '',
        i === 0 ? event.text : '',
        choice.label,
        choice.outcomes.length === 0 ? 'Nothing happens.' : choice.outcomes.map(describeOutcome).join(' '),
      ]);
    });
  }
  return { id: 'events', title: 'Events', headers: ['Event', 'Text', 'Choice', 'What it does'], rows };
}

function actTable(): Table {
  const names = (lists: string[][]): string => lists.map((ids) => ids.map((id) => ENEMIES[id]?.name ?? id).join(' + ')).join('; ');
  const weights = Object.entries(DEFAULT_MAP_PARAMS.weights)
    .map(([kind, w]) => `${kind} ${w}`)
    .join(', ');
  const firstFloor = Object.entries(DEFAULT_MAP_PARAMS.firstFloor)
    .map(([kind, f]) => `${kind} from floor ${(f ?? 0) + 1}`)
    .join(', ');
  return {
    id: 'act',
    title: 'The act',
    note: 'How the map is made and what fills it.',
    headers: ['Setting', 'Value'],
    rows: [
      ['Floors before the boss', String(DEFAULT_MAP_PARAMS.floors)],
      ['Map columns', String(DEFAULT_MAP_PARAMS.lanes)],
      ['Climbs drawn from the bottom', String(DEFAULT_MAP_PARAMS.paths)],
      ['Chance weights for each stop', weights],
      ['Earliest floors', firstFloor],
      ['Easy fights (floors up to ' + (DEFAULT_MAP_PARAMS.earlyFloors + 1) + ')', names(ACT_CONTENT.earlyEncounters)],
      ['Normal fights', names(ACT_CONTENT.encounters)],
      ['Elite fights', names(ACT_CONTENT.elites)],
      ['Boss', names(ACT_CONTENT.bosses)],
    ],
  };
}

function tunablesTable(): Table {
  return {
    id: 'tunables',
    title: 'Balance numbers',
    note: 'Everything in src/data/tunables.ts (all provisional).',
    headers: ['Name', 'Value'],
    rows: Object.entries(tunables).map(([name, value]) => [name, typeof value === 'object' ? JSON.stringify(value) : String(value)]),
  };
}

// ---------- page ----------

function render(tables: Table[]): void {
  const nav = document.getElementById('nav');
  const sections = document.getElementById('sections');
  if (!nav || !sections) return;

  for (const table of tables) {
    const link = document.createElement('a');
    link.href = `#${table.id}`;
    link.textContent = table.title;
    nav.appendChild(link);

    const section = document.createElement('section');
    section.id = table.id;
    const heading = document.createElement('h2');
    heading.textContent = table.title;
    section.appendChild(heading);
    if (table.note) {
      const note = document.createElement('p');
      note.className = 'note';
      note.textContent = table.note;
      section.appendChild(note);
    }

    const tools = document.createElement('div');
    tools.className = 'tools';
    const status = document.createElement('span');
    status.className = 'status';
    const copyButton = (label: string, text: () => string): HTMLButtonElement => {
      const button = document.createElement('button');
      button.textContent = label;
      button.onclick = () => {
        void copyToClipboard(text()).then((ok) => {
          status.textContent = ok ? 'Copied.' : "Couldn't copy.";
        });
      };
      return button;
    };
    tools.append(copyButton('Copy as Markdown', () => toMarkdown(table)), copyButton('Copy as CSV', () => toCsv(table)), status);
    section.appendChild(tools);

    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    const el = document.createElement('table');
    const head = el.createTHead().insertRow();
    for (const h of table.headers) {
      const th = document.createElement('th');
      th.textContent = h;
      head.appendChild(th);
    }
    const body = el.createTBody();
    for (const row of table.rows) {
      const tr = body.insertRow();
      for (const text of row) tr.insertCell().textContent = text;
    }
    wrap.appendChild(el);
    section.appendChild(wrap);
    sections.appendChild(section);
  }
}

render([cardsTable(), relicsTable(), enemiesTable(), statusesTable(), eventsTable(), actTable(), tunablesTable()]);
