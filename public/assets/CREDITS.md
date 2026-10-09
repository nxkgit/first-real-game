# Art credits

Raw packs are kept outside the repo; `tools/prepareAssets.py` builds the files in this folder from them. The same list is in `src/data/credits.ts`, which feeds the in-game Credits screen (a test keeps the two in step).

| Used for | Source | Author | Licence |
|---|---|---|---|
| Hero (dark-elf witch portraits) | Free Dark Elf Pixel Art Asset Pack, https://craftpix.net/freebies/free-dark-elf-pixel-art-asset-pack/ | CraftPix.net 2D Game Assets | CraftPix free licence (exact terms unconfirmed) |
| Pixel enemies (seven still pictures) | OpenGameArt.org pack (files named *Instagram_last.png), https://opengameart.org/ | BlackSwordo | UNCONFIRMED (check the OpenGameArt page) |
| Painted enemies (four characters) | Fantasy Character, https://opengameart.org/content/fantasy-character | Nikolai Bird (dicingdangers.com) | CC-BY 4.0 |
| Pixel enemies (animated) | Dark Fantasy Platformer Bestiary, https://opengameart.org/content/dark-fantasy-platformer-bestiary | Stephen "Redshrike" Challener, Ansimuz, Calciumtrice, Balmer, Surt | CC-BY 4.0 |
| Relic, heart and other icons | Fantasy Icon Pack by Ravenmore, https://opengameart.org/content/fantasy-icon-pack-by-ravenmore-0 | Ravenmore (ravenmore.itch.io) | CC-BY 3.0 |
| Map stop icons | Cartography Pack, https://kenney.nl/assets/cartography-pack | Kenney | CC0 |
| Card and button borders | Fantasy UI Borders, https://kenney.nl/assets/fantasy-ui-borders | Kenney | CC0 |
| Fight and screen backdrops | Background Elements Remastered, https://kenney.nl/assets/background-elements-remastered | Kenney | CC0 |

The pixel-enemy sheets came as a zip with no licence or author file; the credit above is the licence and artist list on the page of the bestiary they belong to, so the per-sheet artist is not known.

The seven pixel stills (`enemies/pixel-a.png` to `pixel-g.png`) and the witch hero came with no licence file (2026-10-09). The user gave the authors: the stills are by BlackSwordo on OpenGameArt.org (exact pack page and licence not yet confirmed), the witch is from CraftPix.net (free licence, terms not yet read). Those licence cells are provisional.

Which picture stands in for which enemy, relic or stop is placeholder (see `src/data/art.ts`).
