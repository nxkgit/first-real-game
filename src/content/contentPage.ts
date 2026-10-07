import { describeEffect, describeOutcome, relicText } from '../game/describe';
import type { EnemyMove } from '../game/types';
import { DEFAULT_MAP_PARAMS } from '../game/actMap';
import { baseCards, upgradedVersion } from '../data/cards';
import { ENEMIES } from '../data/enemies';
import { EVENTS } from '../data/events';
import { RELICS, RELIC_POOL } from '../data/relics';
import { ACT_CONTENT } from '../data/run';
import { STATUSES } from '../data/statuses';
import * as tunables from '../data/tunables';
import { copyToClipboard } from '../storage';
import {
  CARD_HEADERS,
  NO_FILTERS,
  cardRecord,
  cardRow,
  distinct,
  excludesZero,
  filterCards,
  formatInterval,
  matchesQuery,
  parseSimStats,
  sortRows,
  topPartners,
  upgradeComparison,
} from './browse';
import type { CardFilters, CardRecord, CardSim, SimStats } from './browse';
import { toCsv, toMarkdown } from './tableExport';
import type { Table } from './tableExport';
import { formatIssues, validateContent } from './validate';
import type { Issue } from './validate';
import { realWorld } from './world';

// The content browser: every card, relic, enemy, status and event as the game really has them, with
// the same generated text the game shows. Every table can be searched and sorted (click a header);
// cards also filter and open a detail panel (base vs upgraded, simulation stats, content-check
// findings). Copy as Markdown / CSV copies the rows as currently shown. All the logic lives in
// browse.ts / validate.ts (unit-tested); this file only draws. It has not been viewed in a browser
// by the session that wrote it.

const moveText = (move: EnemyMove): string => `${move.name}: ${move.effects.map((e) => describeEffect(e)).join(' ')}`;

function relicsTable(): Table {
  return {
    id: 'relics',
    title: 'Relics',
    headers: ['Name', 'Text', 'In relic pool'],
    rows: Object.values(RELICS).map((relic) => [relic.name, relicText(relic), RELIC_POOL.includes(relic) ? 'yes' : 'no']),
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
        event.title,
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

function checkTable(issues: Issue[]): Table {
  return {
    id: 'check',
    title: 'Content check',
    note: 'The same findings as `npm run content:check --info`: errors mean broken content, warnings mean probably a mistake, notes are facts that are often intended.',
    headers: ['Severity', 'Kind', 'Id', 'Problem', 'Fix'],
    rows: issues.map((i) => [i.severity, i.kind, i.id, i.message, i.fix]),
  };
}

// ---------- small DOM helpers ----------

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: { className?: string; text?: string; id?: string } = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.id) node.id = props.id;
  if (props.text !== undefined) node.textContent = props.text;
  for (const c of children) node.append(c);
  return node;
}

function select(label: string, options: [string, string][], onChange: (value: string) => void): HTMLLabelElement {
  const sel = el('select');
  for (const [value, text] of options) {
    const o = el('option', { text });
    o.value = value;
    sel.appendChild(o);
  }
  sel.onchange = () => onChange(sel.value);
  return el('label', { className: 'filter' }, `${label} `, sel);
}

/** Shared by every section: heading, note, tools, and a table body that can be redrawn. */
interface SectionParts {
  section: HTMLElement;
  tools: HTMLElement;
  tbody: HTMLTableSectionElement;
  headerCells: HTMLTableCellElement[];
  count: HTMLElement;
  status: HTMLElement;
}

function buildSection(table: Table, onHeaderClick: (column: number) => void): SectionParts {
  const section = el('section', { id: table.id }, el('h2', { text: table.title }));
  if (table.note) section.appendChild(el('p', { className: 'note', text: table.note }));
  const tools = el('div', { className: 'tools' });
  const count = el('span', { className: 'count' });
  const status = el('span', { className: 'status' });
  section.appendChild(tools);

  const wrap = el('div', { className: 'wrap' });
  const tableEl = el('table');
  const head = tableEl.createTHead().insertRow();
  const headerCells = table.headers.map((h, i) => {
    const th = el('th', { text: h, className: 'sortable' });
    th.title = 'Click to sort';
    th.onclick = () => onHeaderClick(i);
    head.appendChild(th);
    return th;
  });
  const tbody = tableEl.createTBody();
  wrap.appendChild(tableEl);
  section.appendChild(wrap);
  return { section, tools, tbody, headerCells, count, status };
}

function copyButtons(parts: SectionParts, current: () => Table): void {
  const button = (label: string, text: () => string): HTMLButtonElement => {
    const b = el('button', { text: label });
    b.onclick = () => {
      void copyToClipboard(text()).then((ok) => {
        parts.status.textContent = ok ? 'Copied.' : "Couldn't copy.";
      });
    };
    return b;
  };
  parts.tools.append(button('Copy as Markdown', () => toMarkdown(current())), button('Copy as CSV', () => toCsv(current())), parts.count, parts.status);
}

function markSort(parts: SectionParts, column: number | undefined, direction: 'asc' | 'desc'): void {
  parts.headerCells.forEach((th, i) => th.classList.toggle('sorted-asc', i === column && direction === 'asc'));
  parts.headerCells.forEach((th, i) => th.classList.toggle('sorted-desc', i === column && direction === 'desc'));
}

/** A plain table section with a search box and sortable headers. */
function simpleSection(table: Table): HTMLElement {
  let query = '';
  let sortCol: number | undefined;
  let dir: 'asc' | 'desc' = 'asc';
  let view: string[][] = table.rows;

  const parts = buildSection(table, (col) => {
    if (sortCol === col) dir = dir === 'asc' ? 'desc' : 'asc';
    else {
      sortCol = col;
      dir = 'asc';
    }
    draw();
  });
  const search = el('input');
  search.type = 'search';
  search.placeholder = 'Search';
  search.oninput = () => {
    query = search.value;
    draw();
  };
  parts.tools.append(search);

  function draw(): void {
    const filtered = table.rows.filter((r) => matchesQuery(r, query));
    view = sortCol === undefined ? filtered : sortRows(filtered, sortCol, dir);
    parts.tbody.replaceChildren();
    for (const row of view) {
      const tr = parts.tbody.insertRow();
      for (const text of row) tr.insertCell().textContent = text;
    }
    parts.count.textContent = `${view.length} of ${table.rows.length}`;
    markSort(parts, sortCol, dir);
  }
  copyButtons(parts, () => ({ ...table, rows: view }));
  draw();
  return parts.section;
}

// ---------- the cards section ----------

function simPanel(card: CardRecord, sim: CardSim | undefined, stats: SimStats | undefined): HTMLElement {
  const panel = el('div', { className: 'sim' }, el('h4', { text: 'Simulation stats' }));
  if (!stats || stats.byCard.size === 0) {
    panel.append(el('p', { className: 'note', text: 'No simulation results found. Run `npm run balance:report` (writes balance/reports/sample.json) or `npm run balance:baseline`, then rebuild the page.' }));
    return panel;
  }
  if (!sim || sim.entries.length === 0) {
    panel.append(el('p', { className: 'note', text: `${card.name} is not in the simulation results (cards are picked up the next time the report or baseline is regenerated; upgraded cards are not simulated alone).` }));
    return panel;
  }
  panel.append(el('p', { className: 'note', text: `Effect of adding or swapping in this card, against the starter deck (negative HP lost and turns are good). Source: ${sim.source}.` }));
  const t = el('table', { className: 'inner' });
  const head = t.createTHead().insertRow();
  for (const h of ['Bot', 'Mode', 'Win rate change', 'HP lost change', 'Turns change', 'Verdict']) head.appendChild(el('th', { text: h }));
  const body = t.createTBody();
  for (const e of sim.entries) {
    const tr = body.insertRow();
    const cells = [e.skill, e.mode, formatInterval(e.win, 'win'), formatInterval(e.hpLost, 'hpLost'), formatInterval(e.turns, 'turns'), e.verdict ?? (excludesZero(e.hpLost) ? 'interval excludes zero' : 'no verdict (baseline)')];
    for (const c of cells) tr.insertCell().textContent = c;
  }
  panel.append(t);
  const better = topPartners(sim, 4, 'better');
  const worse = topPartners(sim, 3, 'worse');
  const partnerLine = (label: string, list: typeof better): HTMLElement =>
    el('p', {}, el('strong', { text: `${label}: ` }), list.length === 0 ? 'none clearly' : list.map((p) => `${p.partner} (${formatInterval(p.hpLost, 'hpLost')} HP saved, ${p.skill})`).join(', '));
  if (sim.partners.length > 0) panel.append(partnerLine('Synergy partners', better), partnerLine('Overlaps with', worse));
  for (const n of stats.notes) panel.append(el('p', { className: 'note', text: n }));
  return panel;
}

function cardsSection(records: CardRecord[], issues: Issue[], stats: SimStats | undefined): HTMLElement {
  const table: Table = {
    id: 'cards',
    title: 'Cards',
    note: 'Text is generated from each card\'s effects, scaling and triggers. Click a row for the upgrade side by side, simulation stats and check findings.',
    headers: CARD_HEADERS,
    rows: records.map(cardRow),
  };
  let filters: CardFilters = { ...NO_FILTERS };
  let sortCol: number | undefined;
  let dir: 'asc' | 'desc' = 'asc';
  let selected: string | undefined;
  let view: string[][] = table.rows;
  let shown: CardRecord[] = records;

  const parts = buildSection(table, (col) => {
    if (sortCol === col) dir = dir === 'asc' ? 'desc' : 'asc';
    else {
      sortCol = col;
      dir = 'asc';
    }
    draw();
  });
  const set = (patch: Partial<CardFilters>): void => {
    filters = { ...filters, ...patch };
    draw();
  };
  const search = el('input');
  search.type = 'search';
  search.placeholder = 'Search name, text, tag';
  search.oninput = () => set({ query: search.value });
  const any: [string, string] = ['', 'any'];
  const filterBar = el(
    'div',
    { className: 'tools' },
    search,
    select('Type', [any, ...distinct(records.map((r) => r.type)).map((v): [string, string] => [v, v])], (type) => set({ type })),
    select('Cost', [any, ...distinct(records.map((r) => String(r.cost))).map((v): [string, string] => [v, v])], (cost) => set({ cost })),
    select('Owner', [any, ...distinct(records.map((r) => r.owner)).map((v): [string, string] => [v, v])], (owner) => set({ owner })),
    select('Tag', [any, ...distinct(records.flatMap((r) => r.tags)).map((v): [string, string] => [v, v])], (tag) => set({ tag })),
    select('In reward pool', [['any', 'any'], ['yes', 'yes'], ['no', 'no']], (pool) => set({ pool: pool as CardFilters['pool'] }))
  );
  parts.tools.after(filterBar);

  const detail = el('div', { className: 'detail' });
  parts.section.insertBefore(detail, parts.section.querySelector('.wrap'));

  function drawDetail(): void {
    detail.replaceChildren();
    const card = records.find((r) => r.id === selected);
    if (!card) {
      detail.hidden = true;
      return;
    }
    detail.hidden = false;
    const close = el('button', { text: 'Close' });
    close.onclick = () => {
      selected = undefined;
      draw();
    };
    detail.append(el('div', { className: 'detail-head' }, el('h3', { text: `${card.name} (${card.id})` }), close));
    const meta = [`${card.type}`, `cost ${card.cost}`, `owner ${card.owner}`, card.inRewardPool ? 'in reward pool' : 'not in reward pool', card.exhaust ? 'exhaust' : '', card.tags.length ? `tags: ${card.tags.join(', ')}` : ''].filter(Boolean);
    detail.append(el('p', { className: 'note', text: meta.join(' | ') }));

    const cmp = el('div', { className: 'compare' });
    const col = (title: string, pick: 'before' | 'after'): HTMLElement => {
      const c = el('div', { className: 'card-col' }, el('h4', { text: title }));
      for (const line of upgradeComparison(card)) {
        c.append(el('p', { className: line.changed && pick === 'after' ? 'changed' : '' }, el('strong', { text: `${line.label}: ` }), line[pick]));
      }
      return c;
    };
    cmp.append(col(card.name, 'before'), col(card.upText === undefined ? 'No upgrade' : `${card.name}+`, 'after'));
    detail.append(cmp);
    if (card.scaling.length) detail.append(el('p', { text: `Scaling: ${card.scaling.join('; ')}` }));

    const mine = issues.filter((i) => i.kind === 'card' && (i.id === card.id));
    if (mine.length > 0) {
      const ul = el('ul', { className: 'issues' });
      for (const i of mine) ul.append(el('li', { className: i.severity, text: `${i.severity}: ${i.message} Fix: ${i.fix}` }));
      detail.append(el('h4', { text: 'Content check' }), ul);
    }
    detail.append(simPanel(card, stats?.byCard.get(card.id), stats));
  }

  function draw(): void {
    shown = filterCards(records, filters);
    // carry each record's id in a hidden last cell so a sorted row still knows which card it is
    const withIds = shown.map((r) => [...cardRow(r), r.id]);
    const sorted = sortCol === undefined ? withIds : sortRows(withIds, sortCol, dir);
    view = sorted.map((r) => r.slice(0, -1));
    parts.tbody.replaceChildren();
    for (const row of sorted) {
      const id = row[row.length - 1];
      const tr = parts.tbody.insertRow();
      tr.className = id === selected ? 'selectable selected' : 'selectable';
      row.slice(0, -1).forEach((text) => (tr.insertCell().textContent = text));
      tr.onclick = () => {
        selected = id;
        draw();
      };
    }
    parts.count.textContent = `${view.length} of ${records.length}`;
    markSort(parts, sortCol, dir);
    drawDetail();
  }
  copyButtons(parts, () => ({ ...table, rows: view }));
  draw();
  return parts.section;
}

// ---------- page ----------

async function loadSimStats(): Promise<SimStats | undefined> {
  // The balance outputs are bundled only if they exist when the page is built; absent files just
  // mean no stats panel data.
  const reports = import.meta.glob('../../balance/reports/sample.json', { query: '?raw', import: 'default' });
  const baselines = import.meta.glob('../../balance/baselines/baseline.json', { query: '?raw', import: 'default' });
  const read = async (loaders: Record<string, () => Promise<unknown>>): Promise<unknown> => {
    const first = Object.values(loaders)[0];
    if (!first) return undefined;
    try {
      return JSON.parse(String(await first())) as unknown;
    } catch {
      return undefined;
    }
  };
  const [report, baseline] = await Promise.all([read(reports), read(baselines)]);
  if (report === undefined && baseline === undefined) return undefined;
  return parseSimStats(report, baseline);
}

function render(sections: { id: string; title: string; node: HTMLElement }[]): void {
  const nav = document.getElementById('nav');
  const container = document.getElementById('sections');
  if (!nav || !container) return;
  for (const s of sections) {
    const link = el('a', { text: s.title });
    link.href = `#${s.id}`;
    nav.appendChild(link);
    container.appendChild(s.node);
  }
}

async function main(): Promise<void> {
  const world = realWorld();
  const issues = validateContent(world);
  const records = baseCards().map((c) => cardRecord(c, upgradedVersion(c)));
  const stats = await loadSimStats();
  const simple: Table[] = [relicsTable(), enemiesTable(), statusesTable(), eventsTable(), actTable(), tunablesTable(), checkTable(issues)];
  render([
    { id: 'cards', title: 'Cards', node: cardsSection(records, issues, stats) },
    ...simple.map((t) => ({ id: t.id, title: t.title, node: simpleSection(t) })),
  ]);
  const summary = document.getElementById('check-summary');
  if (summary) summary.textContent = formatIssues(issues).split('\n').slice(-1)[0];
}

void main();
