import type { Page, Route } from '@playwright/test';
import { expect, test } from './harness';
import { enterFirstFight } from './flows';

// The in-game Report button and window, and the dev panel's snapshot loader (QA_PLAN.md). The
// report proxy is never contacted: the network is stubbed here. The test server is started with
// VITE_REPORT_SECRET=e2e-test-secret (playwright.config.ts).

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };

interface Sent {
  secret: string | undefined;
  body: {
    text: string;
    name: string;
    testerId: string;
    build: string;
    snapshot: {
      screen: string;
      run: { seed: number } | null;
      fight: { enemies: { id: string }[]; piles: { hand: string[] }; energy: number } | null;
      log: string[];
    };
  };
}

/** Answers report posts with `status` and remembers what was sent. */
async function stubReports(page: Page, status = 201): Promise<Sent[]> {
  const sent: Sent[] = [];
  await page.route('**/report', async (route: Route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    sent.push({ secret: request.headers()['x-report-secret'], body: JSON.parse(request.postData() ?? '{}') as Sent['body'] });
    const ok = status === 201;
    return route.fulfill({
      status,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: JSON.stringify(ok ? { ok: true, issue: 99, snapshotId: 'aaaaaaaa-1111' } : { error: 'nope' }),
    });
  });
  return sent;
}

const field = (page: Page, name: string) => page.locator(`[data-report="${name}"]`);

/** The browser logs "Failed to load resource" itself whenever a request gets a 4xx answer. For the tests that
 *  deliberately provoke one, that line is expected, not a game error. */
function expectNetworkErrorLog(game: { errors: string[] }): void {
  const index = game.errors.findIndex((e) => e.includes('Failed to load resource'));
  expect(index, 'the refused request should have been logged by the browser').toBeGreaterThanOrEqual(0);
  game.errors.splice(index, 1);
}

test('a report from the map carries the run, the tester id and the secret', async ({ game }) => {
  const sent = await stubReports(game.page);
  await game.open('seed=1');
  await game.waitForScene('MapScene');

  await game.clickText('Report');
  await expect(field(game.page, 'dialog')).toBeVisible();
  await field(game.page, 'text').fill('The map froze when I clicked a shop');
  await field(game.page, 'name').fill('Sam');
  await field(game.page, 'send').click();
  await expect(field(game.page, 'status')).toContainText('#99');

  expect(sent).toHaveLength(1);
  expect(sent[0]!.secret).toBe('e2e-test-secret');
  const { body } = sent[0]!;
  expect(body.text).toBe('The map froze when I clicked a shop');
  expect(body.name).toBe('Sam');
  expect(body.testerId).toMatch(/^tester-[0-9a-f]{12}$/);
  expect(body.snapshot.screen).toBe('MapScene');
  expect(body.snapshot.run?.seed).toBe(1);
  expect(body.snapshot.fight).toBeNull();

  // closing leaves the game playable and error-free
  await field(game.page, 'cancel').click();
  await expect(field(game.page, 'dialog')).toHaveCount(0);
  await game.step(5);
  game.check();
});

test('the tester id is kept between reports and the name is remembered', async ({ game }) => {
  const sent = await stubReports(game.page);
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  for (const text of ['first problem', 'second problem']) {
    await game.clickText('Report');
    await field(game.page, 'text').fill(text);
    if (text === 'first problem') await field(game.page, 'name').fill('Sam');
    else await expect(field(game.page, 'name')).toHaveValue('Sam');
    await field(game.page, 'send').click();
    await expect(field(game.page, 'status')).toContainText('#99');
    await field(game.page, 'cancel').click();
  }
  expect(sent).toHaveLength(2);
  expect(sent[1]!.body.testerId).toBe(sent[0]!.body.testerId);
});

test('a report from a fight carries the exact fight and its log', async ({ game }) => {
  const sent = await stubReports(game.page);
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await enterFirstFight(game);

  const truth = await game.combatTruth();
  await game.clickText('Report');
  await field(game.page, 'text').fill('Strike did the wrong damage');
  await field(game.page, 'send').click();
  await expect(field(game.page, 'status')).toContainText('#99');

  // regression: pressing Send used to click through to the game and play a card
  expect(await game.combatTruth(), 'sending a report must not change the fight').toEqual(truth);

  const { snapshot } = sent[0]!.body;
  expect(snapshot.screen).toBe('CombatScene');
  expect(snapshot.fight?.enemies).toHaveLength(truth.enemies.length);
  expect(snapshot.fight?.piles.hand).toHaveLength(truth.hand.length);
  expect(snapshot.fight?.energy).toBe(truth.energy);
  expect(snapshot.log).toContain('Combat start.');
  game.check();
});

test('a refused report shows why, keeps the text, and offers to copy it', async ({ game }) => {
  const sent = await stubReports(game.page, 429);
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.clickText('Report');
  await field(game.page, 'text').fill('please do not lose this');
  await field(game.page, 'send').click();

  await expect(field(game.page, 'status')).toContainText('Too many reports');
  await expect(field(game.page, 'copy')).toBeVisible();
  await expect(field(game.page, 'text')).toHaveValue('please do not lose this');
  await expect(field(game.page, 'send')).toBeEnabled(); // they can try again
  expect(sent).toHaveLength(1);
  expectNetworkErrorLog(game);
  game.check();
});

test('an empty report is stopped before it is sent, and Escape closes the window', async ({ game }) => {
  const sent = await stubReports(game.page);
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.clickText('Report');
  await field(game.page, 'send').click();
  await expect(field(game.page, 'status')).toContainText('describe');
  expect(sent).toHaveLength(0);
  await game.page.keyboard.press('Escape');
  await expect(field(game.page, 'dialog')).toHaveCount(0);
});

test('typing in the report window does not trigger game hotkeys', async ({ game }) => {
  await stubReports(game.page);
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.clickText('Report');
  await field(game.page, 'text').fill('d d d e e e 1 2 3 0');
  await game.step(5);
  expect(await game.scene()).toBe('MapScene');
  await expect(field(game.page, 'text')).toHaveValue('d d d e e e 1 2 3 0'); // d would also open the deck view
  game.check();
});

test('dev panel: loading a report snapshot puts the fight back exactly as the tester had it', async ({ game }) => {
  const sent = await stubReports(game.page);
  await game.open('seed=1&dev');
  await game.waitForScene('MapScene');
  await enterFirstFight(game);

  // the tester sends a report at the start of their turn...
  const before = await game.combatTruth();
  await game.clickText('Report');
  await field(game.page, 'text').fill('load me');
  await field(game.page, 'send').click();
  await expect(field(game.page, 'status')).toContainText('#99');
  await field(game.page, 'cancel').click();

  // ...then the fight moves on (a card is played)
  await game.playCard(before.hand.find((n) => n === 'Strike') ?? before.hand[0]!);
  await game.settle();
  const moved = await game.combatTruth();
  expect(moved.energy).toBeLessThan(before.energy);

  // the maintainer loads the stored snapshot with their key
  let keySeen: string | undefined;
  await game.page.route('**/snapshot/*', async (route: Route) => {
    keySeen = route.request().headers()['x-maintainer-key'];
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: sent[0]!.body.snapshot }) });
  });
  await game.page.locator('[data-dev="snapshot-id"]').fill('aaaaaaaa-1111');
  await game.page.locator('[data-dev="maintainer-key"]').fill('test-maintainer-key');
  await game.page.getByRole('button', { name: 'Load report snapshot' }).click();
  await expect(game.page.getByText('Loaded: CombatScene')).toBeVisible();
  expect(keySeen).toBe('test-maintainer-key');

  await game.waitForScene('CombatScene');
  await game.settle();
  const restored = await game.combatTruth();
  expect(restored.energy).toBe(before.energy);
  expect(restored.hand).toEqual(before.hand);
  expect(restored.enemies.map((e) => e.hp)).toEqual(before.enemies.map((e) => e.hp));
  game.check();
});

test('dev panel: a wrong maintainer key is explained, not loaded', async ({ game }) => {
  await game.open('seed=1&dev');
  await game.waitForScene('MapScene');
  await game.page.route('**/snapshot/*', (route: Route) => route.fulfill({ status: 401, headers: { ...CORS, 'content-type': 'application/json' }, body: '{"error":"unauthorized"}' }));
  await game.page.locator('[data-dev="snapshot-id"]').fill('aaaaaaaa-1111');
  await game.page.locator('[data-dev="maintainer-key"]').fill('wrong');
  await game.page.getByRole('button', { name: 'Load report snapshot' }).click();
  await expect(game.page.getByText('Wrong maintainer key.')).toBeVisible();
  expect(await game.scene()).toBe('MapScene');
  expectNetworkErrorLog(game);
  game.check();
});
