// Who made the art the game uses. The single source for the in-game Credits screen; the same
// list is written out in public/assets/CREDITS.md (a test keeps the two in step). Add a row here
// whenever a new pack's files go into public/assets (tools/prepareAssets.py).

export interface Credit {
  /** What the art is used for, in the game's words. */
  usedFor: string;
  /** The pack's name. */
  source: string;
  /** Where the pack came from. Empty when the source page is not known yet (say so in CREDITS.md). */
  url: string;
  author: string;
  licence: string;
}

export const CREDITS: readonly Credit[] = [
  {
    usedFor: 'Hero (dark-elf witch portraits)',
    source: 'Free Dark Elf Pixel Art Asset Pack',
    url: 'https://craftpix.net/freebies/free-dark-elf-pixel-art-asset-pack/',
    author: 'CraftPix.net 2D Game Assets',
    licence: 'CraftPix free licence (exact terms unconfirmed)',
  },
  {
    usedFor: 'Pixel enemies (seven still pictures)',
    source: 'OpenGameArt.org pack (files named *Instagram_last.png)',
    url: 'https://opengameart.org/',
    author: 'BlackSwordo',
    licence: 'UNCONFIRMED (check the OpenGameArt page)',
  },
  {
    usedFor: 'Painted enemies (four characters)',
    source: 'Fantasy Character',
    url: 'https://opengameart.org/content/fantasy-character',
    author: 'Nikolai Bird (dicingdangers.com)',
    licence: 'CC-BY 4.0',
  },
  {
    usedFor: 'Pixel enemies (animated)',
    source: 'Dark Fantasy Platformer Bestiary',
    url: 'https://opengameart.org/content/dark-fantasy-platformer-bestiary',
    author: 'Stephen "Redshrike" Challener, Ansimuz, Calciumtrice, Balmer, Surt',
    licence: 'CC-BY 4.0',
  },
  {
    usedFor: 'Relic, heart and other icons',
    source: 'Fantasy Icon Pack by Ravenmore',
    url: 'https://opengameart.org/content/fantasy-icon-pack-by-ravenmore-0',
    author: 'Ravenmore (ravenmore.itch.io)',
    licence: 'CC-BY 3.0',
  },
  {
    usedFor: 'Map stop icons',
    source: 'Cartography Pack',
    url: 'https://kenney.nl/assets/cartography-pack',
    author: 'Kenney',
    licence: 'CC0',
  },
  {
    usedFor: 'Card and button borders',
    source: 'Fantasy UI Borders',
    url: 'https://kenney.nl/assets/fantasy-ui-borders',
    author: 'Kenney',
    licence: 'CC0',
  },
  {
    usedFor: 'Fight and screen backdrops',
    source: 'Background Elements Remastered',
    url: 'https://kenney.nl/assets/background-elements-remastered',
    author: 'Kenney',
    licence: 'CC0',
  },
  {
    usedFor: 'Combat backdrop (animated ashlands)',
    source: 'Ashlands animated background',
    // PROVISIONAL: the user supplied the picture and named the artist; where it came from and its
    // licence are not known yet. Fill both in (and CREDITS.md) once they are.
    url: '',
    author: 'trowheel',
    licence: 'Licence not yet confirmed',
  },
];
