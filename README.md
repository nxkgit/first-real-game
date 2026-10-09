# first-real-game

A browser-based, turn-based deckbuilder roguelike (think Slay the Spire) built with TypeScript and Phaser. This is a learning/portfolio project — an exercise in building a real, working game end-to-end with Claude Code.

## Latest changes

The newest batch of fixes. Every batch is in [`PATCHNOTES.md`](PATCHNOTES.md) and on the [content site](https://nxkgit.github.io/first-real-game/content.html#patchnotes). (This block is written by `npm run patchnotes:sync`; edit `PATCHNOTES.md`, not this block.)

<!-- patchnotes:start -->
## 2026-10-09 (second hero and hero selection)

### Added
- A hero select screen when you start a new run (and on "New Run" at the end of a run). Pick the Mage or the new Paladin; each shows max HP, energy, resource and hero power. "Continue" goes straight back into your saved run as the hero you picked.
- The Paladin, a second hero made only of placeholders: 54 max HP, 3 energy, a placeholder hero power (1 energy: draw a card), and 10 placeholder cards. The Paladin's own resource, Radiant Light, starts at 0 each fight, carries between turns and is gained from cards; some Paladin cards (gold cost badge, "LIGHT" on the card) are paid for with it instead of energy. The Paladin uses an animated picture supplied by the project owner (a hooded figure with a staff; its source and licence are not confirmed yet).
- A run now belongs to a hero. The same seed number gives a different run for a different hero. Add `?hero=paladin` to the address to skip the select screen.

### Changed
- Strike, Defend and every card that used to belong to the Mage except the fire and frost cards are now colorless: either hero can be offered them. Cards of your own hero are offered twice as often as colorless ones (it was 1.5 times).
- Old saved runs from before this update cannot be continued; the game starts a new run instead.

### Not fixed
- Nothing was a bug fix in this batch.

### Checked
- Unit tests and the full automated browser suite pass. Played in a real browser: the select screen, picking each hero, Continue skipping the select screen, a Paladin fight (hero power, Radiant Light gained, spent and carried to the next turn), checked against screenshots.
- Not checked: touch screens; how the Paladin's numbers feel; balance (deliberately left alone).
<!-- patchnotes:end -->

Currently building **MVP 2**: a short run of chained fights — three fights and a rest stop, with your HP, deck, and gold carrying between them, and a choice after each win between adding a card to your deck or taking gold. (MVP 1, a single fully playable combat, is done.) All content and numbers are placeholders for now. See [`implementationplan.md`](implementationplan.md) for current scope and what's intentionally deferred, and [`DESIGN_LOG.md`](DESIGN_LOG.md) for the reasoning behind the design decisions made so far.

All visuals are built from Phaser's drawing primitives (shapes, not image assets) — a simple vector mage and goblin, card UI with tweened animation, particle effects, and procedurally-generated sound. Placeholder-quality by design; final art direction is a separate, later pass.

## Tech stack

- **TypeScript** + **[Phaser](https://phaser.io/)** (4.x) for the game engine
- **Vite** for dev server and production builds
- No backend — it's a fully static, client-side game

## Running with Docker (recommended)

This is the easiest way to run the game exactly as it'll be deployed — no need to install Node, npm, or any dependencies locally.

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) (with Docker Compose, which ships with Docker Desktop).

```bash
docker compose up --build
```

This builds the image (installs dependencies, compiles TypeScript, produces a production Vite build, then copies the built static files into a lean nginx image) and starts the container. Once it's up, open:

```
http://localhost:8080
```

To run it in the background instead of tying up your terminal:

```bash
docker compose up --build -d
```

To stop it:

```bash
docker compose down
```

After pulling new changes or editing source files, rebuild with `docker compose up --build` again — the image isn't rebuilt automatically.

### What's actually happening under the hood

`Dockerfile` uses a two-stage build:

1. **Build stage** (`node:24-alpine`) — installs dependencies with `npm ci` (uses the committed `package-lock.json` for a reproducible install) and runs `npm run build`, which type-checks with `tsc` and produces an optimized static bundle in `dist/`.
2. **Runtime stage** (`nginx:1.27-alpine`) — copies just the built `dist/` output into nginx's web root. The Node toolchain, source files, and `node_modules` never make it into the final image, so it stays small.

`docker-compose.yml` just wraps `docker build .` and maps container port 80 (nginx's default) to host port 8080, so you don't have to remember the long-form `docker build`/`docker run` commands.

If you want a different host port, edit the `ports` mapping in `docker-compose.yml` (e.g. `"3000:80"` to use port 3000 instead).

## Running without Docker

Requires Node.js (v24+ recommended — matches what the Docker build uses).

```bash
npm install
npm run dev
```

This starts Vite's dev server (with hot module reload) at `http://localhost:5173`.

Other scripts:

```bash
npm run build    # type-check + production build, output to dist/
npm run preview  # serve the production build locally, for a final sanity check
npm test         # unit tests for the game-logic layer (src/game), via Vitest
```

## How to play

Click a skill or power card to play it. Attack cards are aimed: drag one onto the enemy, or click it and then click the enemy. Right-click (or click anywhere else) to put a picked-up card back. The icon above the enemy shows its next move — a sword is an attack for that much damage, a shield is that much block. Hover the icons, energy orb, or card piles for a short explanation (on a phone, tap them). The **Deck** button in the top bar shows every card in your deck.

Keyboard: `1`–`9` play that card from your hand (attacks go straight at the enemy), `E` ends your turn, `D` opens the deck view, `Esc` cancels aiming or closes the deck view. On the reward screen, `1`–`3` pick a card and `G` takes the gold.

On a phone, play with it held sideways — the layout is too small to read upright.

Win a fight and you choose a reward: add one of three cards to your deck, or take gold (saved for a shop that isn't built yet). The rest stop heals you before the final fight. Lose any fight and the run is over.

## Project structure

```
src/
  game/        # Pure TypeScript game logic (deck, combat, run state, rules) — no Phaser dependency, unit-testable in isolation
  data/        # Data-driven cards, enemies, the run's path, and tunables.ts (all balance numbers in one place)
  scenes/      # Phaser scenes: boot, combat, reward, rest, run end; ui.ts holds shared UI pieces
  audio/       # Procedural sound effects (Web Audio API, no audio files)
  display.ts   # Fits the 800x600 layout to the window at full device resolution
  main.ts      # Phaser game entry point
```

The split between `src/game` (plain logic) and `src/scenes` (Phaser rendering) is deliberate — see [`CLAUDE.md`](CLAUDE.md) for the architectural conventions this project follows.
