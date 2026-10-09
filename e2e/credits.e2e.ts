import { expect, test } from './harness';

// Issue #32: the credits screen drew its rows on a fixed pitch, so once there were more rows than
// fit, wrapped rows were drawn on top of the next row. Every text must have its own space.

test('credits: no two lines of text overlap, and all of them are on the screen', async ({ game }) => {
  await game.open('seed=123');
  await game.waitForScene('MapScene');
  await game.page.evaluate(async () => {
    const w = window as unknown as { __game: { scene: { getScenes(active: boolean): unknown[] } }; __imp(p: string): Promise<{ toggleCredits(s: unknown): void }> };
    const credits = await w.__imp('/src/scenes/credits.ts');
    credits.toggleCredits(w.__game.scene.getScenes(true)[0]);
  });
  await game.step(4);

  type Box = { text: string; x: number; y: number; w: number; h: number };
  const boxes: Box[] = await game.page.evaluate(() => {
    const out: Box[] = [];
    const scene = (window as unknown as { __game: { scene: { getScenes(a: boolean): { children: { list: unknown[] } }[] } } }).__game.scene.getScenes(true)[0];
    const walk = (objects: unknown[], inCredits: boolean): void => {
      for (const o of objects as { list?: unknown[]; text?: unknown; visible: boolean; depth: number; getBounds(): { x: number; y: number; width: number; height: number } }[]) {
        if (!o.visible) continue;
        if (o.list) walk(o.list, inCredits || o.depth === 300);
        else if (inCredits && typeof o.text === 'string' && o.text !== '') {
          const b = o.getBounds();
          out.push({ text: o.text, x: b.x, y: b.y, w: b.width, h: b.height });
        }
      }
    };
    walk(scene.children.list, false);
    return out;
  });

  expect(boxes.length).toBeGreaterThan(12); // the title, the hint, and every row
  for (const b of boxes) {
    expect(b.x, b.text).toBeGreaterThanOrEqual(0);
    expect(b.y, b.text).toBeGreaterThanOrEqual(0);
    expect(b.x + b.w, b.text).toBeLessThanOrEqual(800);
    expect(b.y + b.h, b.text).toBeLessThanOrEqual(600);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      expect(overlap, `"${a.text}" overlaps "${b.text}"`).toBe(false);
    }
  }
  game.check();
});
