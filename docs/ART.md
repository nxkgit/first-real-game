# Art pipeline

How pictures get from a downloaded pack into the game, which code draws them, and how to swap one. Written 2026-10-07 after the first art pass. **Which picture stands in for which enemy, relic or map stop is a placeholder** (the packs are the user's picks; the pairings are not decided), and the pack styles deliberately clash for now.

## The flow

```
assets/                       raw packs (zips, pngs). GIT-IGNORED: never committed
   |  python tools/prepareAssets.py        (needs Pillow: pip install pillow)
   v
public/assets/                only the files the game uses, resized/cropped. COMMITTED, served by the site
   |  loaded once in BootScene.preload() -> preloadArt() in src/scenes/art.ts
   v
Phaser texture cache          keys: hero, enemy-<name>, map-<kind>, icon-<name>, ui-border, bg-<name>
   |  drawn through the helpers in src/scenes/art.ts, chosen by the data in src/data/art.ts
   v
screens
```

- **Raw packs** live in `assets/` at the repository root (not `public/`, which would publish them). `.gitignore` excludes `/assets/`, so a fresh clone has none; the committed `public/assets/` is all the game needs to run. You only need the raw packs to rebuild.
- **`tools/prepareAssets.py`** reads the zips in `assets/` directly (no unzipping needed) and writes `public/assets/`. It trims and downsizes (enemy pictures are capped at 200 px tall), cuts the four painted characters out of `characters.png`, and packs the hero's frames into one strip. The dictionaries at the top of the script say which pack file feeds which output (`MAP_ICONS`, `ICONS`, `BACKGROUNDS`, `ENEMIES`, `HERO_FRAMES`). It prints one `wrote ...` line per file. It needs `assets/` to contain: `kenney_cartography-pack.zip`, `RavenmoreIconPack.02.2014.zip`, `kenney_fantasy-ui-borders.zip`, `kenney_background-elements-remastered.zip`, `characters.png`, `fantasy_vector_character.zip`.
- **`src/data/art.ts`** is the data: the pairings (enemy id to picture, relic id to icon, fight tier and floor to backdrop, screen to backdrop and dimming), the hero's frame size and which frames are idle/attack/death, and the list of files to load. A pairing is one line.
- **`src/scenes/art.ts`** is the code: `preloadArt`, the builders, and the helpers below.
- The loader path is `import.meta.env.BASE_URL + 'assets/'`, so it works both on the dev server (`/`) and on GitHub Pages (`/first-real-game/`).

## Where each picture appears

| Picture | Files in `public/assets/` | Keys | Drawn by | Chosen by |
|---|---|---|---|---|
| Hero (idle, attack, death animation) | `hero/hero.png` (11 frames of 303x266: idle 0-3, attack 4-7, death 8-10) | `hero` | `buildHeroSprite` (used by `PlayerView`); the attack plays when an attack card is played, death on defeat (`CombatScene`) | `HERO_SHEET` |
| Enemies | `enemies/<name>.png` | `enemy-<name>` | `buildEnemySprite` (used by `EnemyView`) | `ENEMY_ART` (enemy id to picture); size from `ENEMY_DISPLAY_HEIGHT` and the enemy's `placeholderScale` |
| Map stop icons | `map/<kind>.png` | `map-<kind>` | `addMapIcon` (map nodes and legend) | file per stop kind, set in `MAP_ICONS` in the prepare script |
| Relic badges, HP heart | `icons/<name>.png` | `icon-<name>` | `addIcon` (relic bar, `PlayerView`) | `RELIC_ICON` (relic id to icon), `ICON_FILES` |
| Card and button borders | `ui/border.png` | `ui-border` | `addBorder` (card faces, buttons) | tinted by card type (`TYPE_COLOR` in `ui.ts`) or the button's stroke colour |
| Card pictures | `cards/default.png`, `cards/<card-id>.png` | `card-art-default`, `card-art-<card-id>` | `addCardArt` (the window on `buildCardFace`, every screen that shows a card) | `CARD_ART_IDS` (ids that have their own file); every other card shows the default, an upgrade without its own file shows its base card's |
| Backdrops | `backgrounds/<name>.png` | `bg-<name>` | `addBackdrop` (fights), `addScreenBackdrop` (map, rest, shop, event, reward) | `backgroundFor(tier, floor)` and `SCREEN_BACKDROPS` |

## How pictures are drawn (the tricks that matter)

- **Fallbacks.** Every helper returns `null` (or `false`) when its texture is missing, and the caller draws the old placeholder shape instead: the drawn mage and goblin (`combat/drawings.ts`), a lettered relic badge, a letter on the map disc, a rounded rectangle outline on cards, the flat fight panel. A missing or misnamed file never breaks a screen. The converse is also true: a typo in a file name fails silently, so look at the screen after changing one.
- **Line-art icons are drawn white.** The Cartography icons are black outlines, which vanish on the dark map, so `addMapIcon` fills them white with `setTint(0xffffff).setTintMode(Phaser.TintModes.FILL)`. (Phaser 4: `setTintFill` no longer exists.)
- **The border is white pixel art, tinted.** `addBorder` makes a 9-slice (the corners stay crisp while the middle stretches) and tints it. The 48 px source tile has 14 px corners (10 on buttons, which are shorter); the helper shrinks the slice for very small boxes.
- **Backdrops are cropped, never stretched, and dimmed.** The source pictures are square (1024x1024). `addBackdrop` scales to the target width, shows the band around the horizon (starting 25% down the picture, or higher if the band would run off the bottom), and lays a dark rectangle over it. The `dim` value (0 to 1) is how dark: fights 0.45, text-heavy screens 0.6-0.7. Raise it if white text becomes hard to read.
- **Animations are registered once** (`createArtAnimations`), globally. Phaser keeps them across scene restarts.

## Swapping a picture

1. **Same slot, different file from a pack you already have:** change the dictionary in `tools/prepareAssets.py` (for example `MAP_ICONS = {'shop': 'chest', ...}`), run the script, reload. No code change.
2. **Different pairing, same files** (a different enemy gets a different picture, a relic a different icon): edit `src/data/art.ts` only. The picture must be one that is loaded (`ENEMY_PICTURES`, `ICON_FILES`, `BACKGROUNDS`).
3. **A new pack:** drop the zip in `assets/`, add the file(s) to the script, add the new names to the matching list in `src/data/art.ts` (so `preloadArt` loads them; the script's `ICONS` and `ICON_FILES` in `art.ts` must list the same names), then add the pairing. Add the pack to `public/assets/CREDITS.md` in the same commit.
4. After any change: `npm run verify`, then look at the screen. For fights and scenes that changed, `npm run e2e` (the harness waits for the art to load, see `E2E.md`).

## Licences and credit

- **CC0** (all Kenney packs): no credit needed; we list them anyway.
- **CC-BY** (the hero, the four painted enemies, the Ravenmore icons): credit is required. The names, links and licences are in `public/assets/CREDITS.md`, which is published with the site at `/assets/CREDITS.md`. **Every file in `public/assets/` must have a row there.** A pack added without a credits row is a bug.
- The user does not plan to sell the game, so non-commercial licences are not ruled out, but check the licence file inside each pack and keep a row for it anyway.
- Packs that are mixtures from several artists (the "bestiary" spritesheets) need one credit per artist; read the pack's own list.

## Known limits

- The styles clash on purpose (painted enemies, vector hero, pixel borders, flat backgrounds, line-art map icons). Choosing one direction is a creative decision still to come.
- There are no pictures yet for statuses or enemy intents (they are still drawn shapes), and no touch or phone check of the new art.
- Work on branches other than this one may add in-game credits, start/end-screen backdrops and animated enemies; check `git log` and `HANDOFF.md` before assuming this document is complete.

## Card pictures

Your own card art is made outside the repo (any editor); keep layered source files out of `public/` (for example in the git-ignored `assets/` folder) and export the finished picture.

- **Size and shape:** a PNG at **2:1**, 320x160 recommended (a test fails on any other ratio). On the card it shows in a 98x42 window and is cropped to fill, never stretched, so keep the important part near the centre.
- **To add one:** save it as `public/assets/cards/<card-id>.png` and add the id to `CARD_ART_IDS` in `src/data/art.ts`. `npm test` checks the list and the folder match and every id is a real card. No other code changes.
- **Default:** `cards/default.png` is a plain geometric placeholder (regenerate with `python tools/makeDefaultCardArt.py`, or replace the file with a standard card picture of your own). Cards with no file of their own show it; if it is missing too, the card falls back to the old text-only layout.
- **Upgrades** (`<id>+`) use the base card's picture unless `cards/<id>+.png` is listed in `CARD_ART_IDS`.
- Third-party art needs a credit (`src/data/credits.ts` and `public/assets/CREDITS.md`); your own does not.
