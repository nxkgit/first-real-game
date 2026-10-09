/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test } from './harness';

// The default combat backdrop (DESIGN_LOG.md, 2026-10-09): the animated ashlands picture, a looping
// sprite of three frames, behind every fight.

const FOES: Record<string, string[]> = {
  normal: ['enemy-a'],
  elite: ['elite-a'],
  boss: ['boss-a'],
};

/** The texture keys of the backdrop sprites in the fight scene, and the one showing now. */
async function backdrop(game: { page: any }): Promise<{ count: number; shown: string | null; playing: boolean }> {
  return game.page.evaluate(() => {
    const scene = (window as any).__game.scene.getScene('CombatScene');
    const sprites = scene.children.list.filter((o: any) => o.type === 'Sprite' && o.texture?.key?.startsWith('bg-ashlands'));
    return { count: sprites.length, shown: sprites[0]?.texture.key ?? null, playing: Boolean(sprites[0]?.anims?.isPlaying) };
  });
}

for (const [tier, foes] of Object.entries(FOES)) {
  test(`${tier} fights play the animated ashlands backdrop`, async ({ game }) => {
    await game.open('seed=1');
    await game.waitForScene('MapScene');
    await game.startFightWith(Array(10).fill('strike'), foes);
    const first = await backdrop(game);
    expect(first.count, 'one backdrop sprite').toBe(1);
    expect(first.playing).toBe(true);

    // the frames really change as game time passes (330 ms each, three frames)
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      await game.step(10, 33); // 330 ms of game time per loop
      const now = await backdrop(game);
      if (now.shown) seen.add(now.shown);
    }
    expect(seen.size, `frames seen: ${[...seen].join(', ')}`).toBeGreaterThan(1);
    game.check();
  });
}
