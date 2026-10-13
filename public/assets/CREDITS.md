# Art credits

Raw packs are kept outside the repo; `tools/prepareAssets.py` builds the files in this folder from them. The same list is in `src/data/credits.ts`, which feeds the in-game Credits screen (a test keeps the two in step).

| Used for | Source | Author | Licence |
|---|---|---|---|
| Pixel enemies (seven still pictures) | OpenGameArt.org pack (files named *Instagram_last.png), https://opengameart.org/ | BlackSwordo | UNCONFIRMED (check the OpenGameArt page) |
| Painted enemies (four characters) | Fantasy Character, https://opengameart.org/content/fantasy-character | Nikolai Bird (dicingdangers.com) | CC-BY 4.0 |
| Pixel enemies (animated) | Dark Fantasy Platformer Bestiary, https://opengameart.org/content/dark-fantasy-platformer-bestiary | Stephen "Redshrike" Challener, Ansimuz, Calciumtrice, Balmer, Surt | CC-BY 4.0 |
| Relic, heart and other icons | Fantasy Icon Pack by Ravenmore, https://opengameart.org/content/fantasy-icon-pack-by-ravenmore-0 | Ravenmore (ravenmore.itch.io) | CC-BY 3.0 |
| Map stop icons | Cartography Pack, https://kenney.nl/assets/cartography-pack | Kenney | CC0 |
| Card and button borders | Fantasy UI Borders, https://kenney.nl/assets/fantasy-ui-borders | Kenney | CC0 |
| Fight and screen backdrops | Background Elements Remastered, https://kenney.nl/assets/background-elements-remastered | Kenney | CC0 |
| Combat backdrop (animated ashlands) | Ashlands animated background | trowheel | Licence not yet confirmed |
| Paladin hero (animated black knight) | Paladin_1 (animated GIF) | Unknown (supplied by the project owner) | Licence not yet confirmed |
| Mage hero (animated) | Mage model (animated GIF) | Unknown (supplied by the project owner) | Licence not yet confirmed |
| Keeper of the Wild hero (animated) | Druid_1 (animated GIF) | Unknown (supplied by the project owner) | Licence not yet confirmed |
| Keeper of the Wild tortoise form (animated) | Tortoise form (animated GIF) | Unknown (supplied by the project owner) | Licence not yet confirmed |
| Final boss (animated lava dino) | Lava dino (animated GIF) | Unknown (supplied by the project owner) | Licence not yet confirmed |
| Rest stop campfire | Campfire (GIF) | Unknown (supplied by the project owner) | Licence not yet confirmed |
| Background music | alex_089 on SoundCloud, https://soundcloud.com/alex_089_x | alex_089 | Free to use (from a licence-free site; exact terms unconfirmed) |

The pixel-enemy sheets came as a zip with no licence or author file; the credit above is the licence and artist list on the page of the bestiary they belong to, so the per-sheet artist is not known.

The seven pixel stills (`enemies/pixel-a.png` to `pixel-g.png`) came with no licence file (2026-10-09). The user gave the author: BlackSwordo on OpenGameArt.org (exact pack page and licence not yet confirmed). That licence cell is provisional. The dark-elf witch (CraftPix.net free pack) was the Mage's picture until 2026-10-13 and is no longer used in the game (`hero/hero.png` is still in the repo), so it has no credits row.

The ashlands backdrop came as a single GIF (`Ashlands_1.gif`) with no pack page or licence file; it is credited to the name the project owner gave (trowheel). Its source page and licence are **not confirmed yet**: fill them in here and in `src/data/credits.ts` once known, and check the licence allows the use before the game is shared widely.

The lava dino (`enemies/LavaDino.gif`, built into `pixel/lava-dino.png`) and the campfire (`icons/CampFire.gif`, built into `icons/campfire.png` and the map's rest icon) were supplied by the project owner (2026-10-09) with no author, source page or licence. Both are **not confirmed yet**: fill them in here and in `src/data/credits.ts` once known.

The four hero pictures (`hero/paladin.png`, `hero/mage_model.png`, `hero/druid.png`, `hero/druid_tortoise.png`, built from GIFs by `python tools/prepareAssets.py <paladin|mage|druid|tortoise>`) were supplied by the project owner (2026-10-13) with no author, source page or licence. Their authors and licences are **not confirmed yet**: fill them in here and in `src/data/credits.ts` once known.

Which picture stands in for which enemy, relic or stop is placeholder (see `src/data/art.ts`).
