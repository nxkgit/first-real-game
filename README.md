# first-real-game

A browser-based, turn-based deckbuilder roguelike (think Slay the Spire) built with TypeScript and Phaser. This is a learning/portfolio project — an exercise in building a real, working game end-to-end with Claude Code.

## Latest changes

The newest batch of fixes. Every batch is in [`PATCHNOTES.md`](PATCHNOTES.md) and on the [content site](https://nxkgit.github.io/first-real-game/content.html#patchnotes). (This block is written by `npm run patchnotes:sync`; edit `PATCHNOTES.md`, not this block.)

<!-- patchnotes:start -->
## 2026-10-09 (content page: Resource column)

### Added
- The Cards table on the content page has a new "Resource" column right after "Cost", saying whether a card's cost is paid in Energy or Radiant Light (before, both showed just a number). There is a matching "Resource" filter beside the Owner filter, and the card detail panel now reads, for example, "cost 2 (Radiant Light)".

### Not fixed
- Nothing was a bug fix in this batch.

### Checked
- Unit tests and the typecheck pass. Looked at the real content page in a browser: the new column, its position and its values (page text only; a screenshot could not be taken). The Resource filter was tested in code but not clicked in the browser.
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
