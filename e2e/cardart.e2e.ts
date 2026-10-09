/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from './harness';

// Card pictures and the TEMPORARY fallback (src/scenes/ui.ts, descriptionFitsBesidePlaceholder): while
// every card shows the shared placeholder picture, a card whose text cannot fit beside it (Heating Up's
// long wording) is drawn without the picture. A card with its own picture keeps it. Delete the fallback
// part of this test together with the fallback once real card art exists.

/** For each card face in the hand: does it have a picture, and where does its text end vs the card bottom. */
async function faces(game: any): Promise<Record<string, { picture: boolean; textBottom: number; cardBottom: number }>> {
  return game.page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('CombatScene');
    const out: Record<string, any> = {};
    const walk = (list: any[]): void => {
      for (const o of list) {
        if (o.list) {
          const desc = o.list.find((c: any) => c.type === 'Text' && o.getData?.('descText') === c);
          if (desc) {
            const name = o.list.filter((c: any) => c.type === 'Text')[1]?.text as string; // cost, then name
            const m = o.getWorldTransformMatrix();
            out[name] = { picture: o.list.some((c: any) => c.type === 'Image' && /^card-art/.test(c.texture?.key ?? '')), textBottom: desc.getBounds().bottom, cardBottom: m.ty + 75 * m.d };
          }
          walk(o.list);
        }
      }
    };
    walk(scene.children.list);
    return out;
  });
}

test('placeholder card pictures: short cards keep one, Heating Up (long text) drops it and its text fits', async ({ game }) => {
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.startFightWith(['strike', 'defend', 'heating-up', 'scorching-wind', 'glaciate'], ['enemy-a']);
  await game.step(10, 33);
  const f = await faces(game);

  for (const name of ['Strike', 'Defend', 'Scorching Wind', 'Glaciate']) {
    expect(f[name], name).toBeDefined();
    expect(f[name].picture, `${name} keeps its picture`).toBe(true);
  }
  expect(f['Heating Up'].picture, 'Heating Up has no room beside a picture').toBe(false);
  for (const [name, face] of Object.entries(f)) expect(face.textBottom, `${name} text inside the card`).toBeLessThanOrEqual(face.cardBottom);
  game.check();
});

test('a card with its own picture keeps it even when its text is long', async ({ game }) => {
  await game.open('seed=1');
  await game.waitForScene('MapScene');
  await game.page.evaluate(async () => {
    // pretend Heating Up has real art: the placeholder rule must not apply to it
    const scene = (window as any).__game.scene.getScene('MapScene');
    scene.textures.addCanvas('card-art-heating-up', Object.assign(document.createElement('canvas'), { width: 100, height: 50 }));
  });
  await game.startFightWith(['strike', 'defend', 'heating-up', 'scorching-wind', 'glaciate'], ['enemy-a']);
  await game.step(10, 33);
  const f = await faces(game);
  expect(f['Heating Up'].picture).toBe(true);
});
