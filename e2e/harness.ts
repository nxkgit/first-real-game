import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Shared driver for the browser tests. See docs/E2E.md.
//
// Everything here goes through the page's `?e2e` hook (src/main.ts): `window.__game` (the Phaser
// game) and `window.__step(frames, dtMs)` (run frames on a virtual clock). The real render loop is
// stopped, so the game only moves when a test steps it. Game modules are reached with dynamic
// imports of /src/... through the Vite dev server (the same module instances the game uses).

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

export interface Label {
  text: string;
  /** centre of the text on the 800x600 layout */
  cx: number;
  cy: number;
}

export interface CombatReadout {
  energy: string | null;
  hp: string | null;
  block: number;
  enemies: { hp: string | null; block: number }[];
}

export interface CombatTruth {
  phase: string;
  energy: number;
  maxEnergy: number;
  hp: number;
  maxHp: number;
  block: number;
  turn: number;
  hand: string[];
  exhaust: number;
  enemies: { id: string; name: string; hp: number; maxHp: number; block: number; alive: boolean }[];
}

export class Harness {
  readonly errors: string[] = [];
  private initScriptAdded = false;
  /** Milliseconds of game time per frame while waiting for animations (bigger = fewer frames to wait). */
  settleDt = 33;

  constructor(readonly page: Page) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') this.errors.push(`console.error: ${msg.text()}`);
    });
    page.on('pageerror', (error) => this.errors.push(`pageerror: ${error.message}`));
  }

  /** Throws if the page logged an error, threw, or rejected a promise since the last check. */
  check(): void {
    expect(this.errors, 'browser errors').toEqual([]);
  }

  // ---------- loading and stepping ----------

  /**
   * Loads the game with the test hook on, stops the real loop, and runs the first frames. A fresh
   * run now starts at the starter-deck draft (DESIGN_LOG.md "Starter deck draft", 2026-10-08); by
   * default this instantly completes it with the simulator's reference starter deck (same content
   * as the old fixed starter deck), so every test written before the draft existed still reaches
   * `MapScene` exactly as before. Pass `{ skipDraft: false }` to see the real draft screens instead
   * (see the dedicated draft e2e test).
   */
  async open(query = 'seed=123', opts: { skipDraft?: boolean } = {}): Promise<void> {
    if (!this.initScriptAdded) {
      this.initScriptAdded = true;
      await this.page.addInitScript(() => {
        (window as Any).__imp = (path: string) => import(/* @vite-ignore */ path);
        window.addEventListener('unhandledrejection', (e) => console.error(`unhandledrejection: ${String(e.reason)}`));
      });
    }
    await this.page.goto(`/?${query ? `${query}&` : ''}e2e`);
    await this.afterLoad();
    if (opts.skipDraft ?? true) await this.completeDraftIfPending();
  }

  /**
   * Reloads the page (browser storage survives), as a player refreshing the tab would. If there was
   * no run to resume (e.g. the previous one just finished), the boot screen starts a fresh one,
   * same as `open()` — so this also completes a pending starter-deck draft by default; see `open()`.
   */
  async reload(opts: { skipDraft?: boolean } = {}): Promise<void> {
    await this.page.reload();
    await this.afterLoad();
    if (opts.skipDraft ?? true) await this.completeDraftIfPending();
  }

  /**
   * If the current run is mid starter-deck draft, completes it instantly (`RunState.skipDraftWith`)
   * with the simulator's reference starter deck, and moves on to the map — a no-op otherwise. Lets
   * most tests ignore the draft entirely; see the dedicated draft e2e test for the real UI.
   */
  async completeDraftIfPending(): Promise<void> {
    const changed = await this.page.evaluate(async () => {
      const session = await (window as Any).__imp('/src/session.ts');
      const run = session.getCurrentRun();
      if (!run || run.phase !== 'draft') return false;
      const { buildStarterDeck } = await (window as Any).__imp('/src/data/cards.ts');
      const { enterCurrentNode } = await (window as Any).__imp('/src/scenes/ui.ts');
      const scene = (window as Any).__game.scene.getScenes(true)[0];
      run.skipDraftWith(buildStarterDeck());
      enterCurrentNode(scene, run);
      return true;
    });
    if (changed) await this.step(10);
  }

  private async afterLoad(): Promise<void> {
    await this.page.waitForFunction(() => (window as Any).__game?.isBooted === true);
    // the art files load over the network in real time, which stepped frames cannot speed up
    await this.page.waitForFunction(
      () => (window as Any).__game?.textures?.exists('bg-ashlands-2') && (window as Any).__game.textures.exists('bg-castles') && (window as Any).__game.textures.exists('pixel-minion')
    ); // the last files queued in preloadArt
    await this.page.evaluate(() => (window as Any).__game.loop.stop());
    await this.step(10);
  }

  /** Runs frames and fails if the active scene's clock did not advance (the loop or scene is stuck). */
  async step(frames = 1, dtMs = 16): Promise<void> {
    const before = await this.sceneClock();
    await this.page.evaluate(([n, dt]) => (window as Any).__step(n, dt), [frames, dtMs] as const);
    const after = await this.sceneClock();
    if (before && after && before.key === after.key && after.now === before.now) {
      throw new Error(`scene ${after.key} stopped advancing (clock ${before.now} -> ${after.now})`);
    }
    this.check();
  }

  private sceneClock(): Promise<{ key: string; now: number } | null> {
    return this.page.evaluate(() => {
      const scene = (window as Any).__game.scene.getScenes(true)[0];
      return scene ? { key: scene.sys.settings.key as string, now: scene.time.now as number } : null;
    });
  }

  /** The key of the scene that is running now ('' between scenes). */
  async scene(): Promise<string> {
    return this.page.evaluate(() => (window as Any).__game.scene.getScenes(true)[0]?.sys.settings.key ?? '');
  }

  /** Steps until `key` is the running scene (and has had a few frames); fails after `maxFrames`. */
  async waitForScene(key: string, maxFrames = 400): Promise<void> {
    for (let spent = 0; spent <= maxFrames; spent += 5) {
      if ((await this.scene()) === key) {
        await this.step(4);
        return;
      }
      await this.step(5, 33);
    }
    throw new Error(`never reached ${key}; stuck in '${await this.scene()}' after ${maxFrames} frames`);
  }

  // ---------- reading the screen ----------

  /** Every visible text on the running scene, with where it sits. */
  async labels(): Promise<Label[]> {
    return this.page.evaluate(() => {
      const out: Label[] = [];
      const walk = (objects: Any[]): void => {
        for (const o of objects) {
          if (!o.visible) continue;
          if (o.list) walk(o.list);
          else if (typeof o.text === 'string' && o.text !== '') {
            const b = o.getBounds();
            out.push({ text: o.text, cx: b.centerX, cy: b.centerY });
          }
        }
      };
      const scene = (window as Any).__game.scene.getScenes(true)[0];
      if (scene) walk(scene.children.list);
      return out;
    });
  }

  async hasText(pattern: RegExp | string): Promise<boolean> {
    return (await this.labels()).some((l) => (typeof pattern === 'string' ? l.text === pattern : pattern.test(l.text)));
  }

  /** What the fight screen shows for energy, player HP and block, and each enemy's HP and block. */
  async combatReadout(): Promise<CombatReadout> {
    const labels = await this.labels();
    const slots: number[] = await this.page.evaluate(async () => {
      const layout = await (window as Any).__imp('/src/scenes/combat/layout.ts');
      const combat = (await (window as Any).__imp('/src/session.ts')).getCurrentCombat();
      return layout.enemySlots(combat.enemies.length);
    });
    const near = (l: Label, x: number, y: number, tol = 12): boolean => Math.abs(l.cx - x) <= tol && Math.abs(l.cy - y) <= tol;
    const at = (x: number, y: number, tol?: number): string | null => labels.find((l) => near(l, x, y, tol))?.text ?? null;
    // layout constants from scenes/combat/PlayerView.ts and EnemyView.ts
    const blockLabel = labels.find((l) => l.cy > 355 && l.cy < 372 && l.cx > 178 && l.cx < 205 && /^\d+$/.test(l.text));
    return {
      energy: labels.find((l) => /^\d+\/\d+$/.test(l.text) && near(l, 235, 360))?.text ?? null,
      hp: labels.find((l) => /^\d+\/\d+$/.test(l.text) && l.cx > 90 && l.cx < 150 && l.cy > 355 && l.cy < 372)?.text ?? null,
      block: blockLabel ? Number(blockLabel.text) : 0,
      enemies: slots.map((x) => {
        const bl = labels.find((l) => /^\d+$/.test(l.text) && Math.abs(l.cx - (x + 3)) < 30 && l.cy > 376 && l.cy < 392);
        return { hp: at(x, 363, 40)?.replace(/^HP /, '') ?? null, block: bl ? Number(bl.text) : 0 };
      }),
    };
  }

  /** The fight's real state, read straight from CombatState. */
  async combatTruth(): Promise<CombatTruth> {
    return this.page.evaluate(async () => {
      const c = (await (window as Any).__imp('/src/session.ts')).getCurrentCombat();
      return {
        phase: c.phase,
        energy: c.energy,
        maxEnergy: c.maxEnergy,
        hp: c.player.hp,
        maxHp: c.player.maxHp,
        block: c.player.block,
        turn: c.turnNumber,
        hand: c.deck.hand.map((card: Any) => card.definition.name),
        exhaust: c.deck.exhaustPile.length,
        enemies: c.enemies.map((e: Any) => ({ id: e.id, name: e.name, hp: e.hp, maxHp: e.maxHp, block: e.block, alive: e.hp > 0 })),
      };
    });
  }

  /** Asserts the on-screen fight readouts equal CombatState (call after `settle`). */
  async expectReadoutsMatchTruth(): Promise<CombatTruth> {
    const [shown, truth] = [await this.combatReadout(), await this.combatTruth()];
    expect(shown.energy, 'energy readout').toBe(`${truth.energy}/${truth.maxEnergy}`);
    expect(shown.hp, 'player HP readout').toBe(`${truth.hp}/${truth.maxHp}`);
    expect(shown.block, 'player block readout').toBe(truth.block);
    truth.enemies.forEach((e, i) => {
      if (!e.alive) return;
      expect(shown.enemies[i].hp, `${e.name} #${i} HP readout`).toBe(`${e.hp}/${e.maxHp}`);
      expect(shown.enemies[i].block, `${e.name} #${i} block readout`).toBe(e.block);
    });
    return truth;
  }

  /** The run as plain data. */
  async run(): Promise<{
    seed: number;
    phase: string;
    hp: number;
    maxHp: number;
    gold: number;
    floor: number;
    position: string | null;
    deck: string[];
    relics: string[];
    choices: { id: string; kind: string; floor: number; lane: number }[];
    nodes: { id: string; kind: string; floor: number; lane: number }[];
  }> {
    return this.page.evaluate(async () => {
      const r = (await (window as Any).__imp('/src/session.ts')).getCurrentRun();
      const node = (n: Any) => ({ id: n.id, kind: n.kind, floor: n.floor, lane: n.lane });
      return {
        seed: r.seed,
        phase: r.phase,
        hp: r.hp,
        maxHp: r.maxHp,
        gold: r.gold,
        floor: r.floor,
        position: r.position,
        deck: r.deck.map((c: Any) => c.name),
        relics: r.relics.map((c: Any) => c.name),
        choices: r.mapChoices.map(node),
        nodes: r.map.nodes.map(node),
      };
    });
  }

  // ---------- real pointer and keyboard input ----------

  /** Moves the mouse to a point on the 800x600 layout (so hover handlers run), then steps. */
  async hover(x: number, y: number): Promise<void> {
    const { left, top, scale } = await this.canvasBox();
    await this.page.mouse.move(left + x * scale, top + y * scale);
    await this.step(2);
  }

  /** A real mouse click at a point on the layout: hover, press, step, release, step. */
  async click(x: number, y: number): Promise<void> {
    await this.hover(x, y);
    await this.page.mouse.down();
    await this.step(2);
    await this.page.mouse.up();
    await this.step(2);
  }

  /** Clicks the centre of the (first) visible text matching `pattern`. */
  async clickText(pattern: RegExp | string): Promise<void> {
    const label = (await this.labels()).find((l) => (typeof pattern === 'string' ? l.text === pattern : pattern.test(l.text)));
    if (!label) throw new Error(`no visible text matching ${pattern} on ${await this.scene()}`);
    await this.click(label.cx, label.cy);
  }

  async key(key: string): Promise<void> {
    await this.page.keyboard.press(key);
    await this.step(2);
  }

  private async canvasBox(): Promise<{ left: number; top: number; scale: number }> {
    const box = await this.page.locator('canvas').boundingBox();
    if (!box) throw new Error('no canvas');
    return { left: box.x, top: box.y, scale: box.width / 800 };
  }

  // ---------- fights ----------

  /**
   * Steps until the fight's animation queue has drained: the enemy turn is over, input is
   * unlocked, and no finite tween is still running.
   */
  async settle(maxFrames = 1500): Promise<void> {
    let calm = 0;
    for (let spent = 0; spent < maxFrames; spent += 5) {
      await this.step(5, this.settleDt);
      const busy = await this.page.evaluate(async () => {
        const game = (window as Any).__game;
        const scene = game.scene.getScene('CombatScene');
        if (!scene || !scene.sys.isActive()) return false;
        const combat = (await (window as Any).__imp('/src/session.ts')).getCurrentCombat();
        const locked = scene.inputLocked && combat.phase === 'playerTurn';
        const finite = scene.tweens.getTweens().some((t: Any) => !t.isInfinite);
        return locked || combat.phase === 'enemyTurn' || scene.sequencer !== null || finite || scene.time._active.length > 0;
      });
      calm = busy ? 0 : calm + 1;
      if (calm >= 2) return;
    }
    throw new Error(`fight animations never settled (scene ${await this.scene()})`);
  }

  /** Wins the fight at once (CombatState.devKillAllEnemies, what the dev panel's button calls) and clicks Continue. */
  async winFightQuickly(): Promise<void> {
    await this.page.evaluate(async () => (await (window as Any).__imp('/src/session.ts')).getCurrentCombat().devKillAllEnemies());
    await this.settle();
    expect(await this.hasText('VICTORY')).toBe(true);
    await this.clickText('Continue');
  }

  /** Where a card in the hand is drawn, by card name. */
  async handCard(name: string): Promise<{ x: number; y: number } | null> {
    return this.page.evaluate((cardName) => {
      const scene = (window as Any).__game.scene.getScene('CombatScene');
      for (const tracked of scene.handCards.values()) {
        const label = tracked.container.list.find((o: Any) => typeof o.text === 'string' && o.text === cardName);
        if (label) return { x: tracked.container.x as number, y: 515 };
      }
      return null;
    }, name);
  }

  /** Plays a card from the hand with real mouse input (an attack is picked up, then clicked onto enemy `enemyIndex`). */
  async playCard(name: string, enemyIndex = 0): Promise<void> {
    const spot = await this.handCard(name);
    if (!spot) throw new Error(`${name} is not in the hand`);
    const needsTarget = await this.page.evaluate(async (cardName) => {
      const combat = (await (window as Any).__imp('/src/session.ts')).getCurrentCombat();
      return combat.deck.hand.find((c: Any) => c.definition.name === cardName)?.definition.target === 'enemy';
    }, name);
    await this.click(spot.x, spot.y);
    if (needsTarget) {
      const slots: number[] = await this.page.evaluate(async () => {
        const layout = await (window as Any).__imp('/src/scenes/combat/layout.ts');
        const combat = (await (window as Any).__imp('/src/session.ts')).getCurrentCombat();
        return layout.enemySlots(combat.enemies.length);
      });
      await this.click(slots[enemyIndex], 250);
    }
    await this.settle();
  }

  /** Ends the turn with a real click on the End Turn button, then waits for the enemy turn to play out. */
  async endTurn(): Promise<void> {
    await this.clickText('End Turn');
    await this.settle();
  }

  // ---------- setup shortcuts (dev-panel equivalents) ----------

  /** Replaces the deck, starts a fight against `enemies` and enters it, like the dev panel does. */
  async startFightWith(deckIds: string[], enemies: string[]): Promise<void> {
    await this.page.evaluate(
      async ([ids, foes]) => {
        const cards = await (window as Any).__imp('/src/data/cards.ts');
        const session = await (window as Any).__imp('/src/session.ts');
        const ui = await (window as Any).__imp('/src/scenes/ui.ts');
        const run = session.getCurrentRun();
        run.deck.length = 0;
        for (const id of ids) run.deck.push(cards.getCard(id));
        run.startFight(foes);
        ui.enterCurrentNode((window as Any).__game.scene.getScenes(true)[0], run);
      },
      [deckIds, enemies] as const
    );
    await this.waitForScene('CombatScene');
    await this.settle();
  }
}

export const test = base.extend<{ game: Harness }>({
  game: async ({ page }, use) => {
    const harness = new Harness(page);
    await use(harness);
    harness.check();
  },
});

export { expect };
