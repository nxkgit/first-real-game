import { CARDS } from '../data/cards';

/**
 * Dev-only deck presets: curated lists of card ids the `?dev` panel can drop straight into the
 * current run's deck, for playtesting a combo or a late-run power level without drafting into it
 * card by card. Not game content — never read outside devPanel.ts.
 */
export interface DeckPreset {
  label: string;
  cardIds: string[];
}

export const DECK_PRESETS: Record<string, DeckPreset> = {
  'mage-fire': {
    label: 'Mage: Fire aggro',
    cardIds: [
      'heating-up',
      'scorching-wind',
      'scorching-wind',
      'scorching-wind',
      'heat-warning',
      'heat-warning',
      'crippling-heat',
      'crippling-heat',
      'meteor-shower',
      'meteor-shower',
      'molten-core',
      'apocalyptic-flame',
      'cauterize',
    ],
  },
  'mage-frost': {
    label: 'Mage: Frost/Freeze lock',
    cardIds: [
      'hypothermia',
      'hypothermia',
      'glacial-spike',
      'glacial-spike',
      'frozen-shield',
      'frozen-shield',
      'endless-winter',
      'cryofreeze',
      'glaciate',
      'glaciate',
      'arctic-strike',
      'arctic-strike',
      'ice-barrier',
    ],
  },
  'mage-swing': {
    label: 'Mage: Temperature swing',
    cardIds: [
      'scorching-wind',
      'scorching-wind',
      'heating-up',
      'molten-core',
      'molten-core',
      'meteor-shower',
      'hypothermia',
      'hypothermia',
      'glacial-spike',
      'glacial-spike',
      'absolute-zero',
      'hungering-cold',
      'glaciate',
      'arctic-strike',
    ],
  },
  'mage-everything': {
    label: 'Mage: one of everything',
    cardIds: [
      'scorching-wind',
      'heating-up',
      'meteor-shower',
      'molten-core',
      'apocalyptic-flame',
      'crippling-heat',
      'heat-flash',
      'cauterize',
      'heat-warning',
      'ice-block',
      'ice-barrier',
      'hypothermia',
      'frozen-shield',
      'cryofreeze',
      'endless-winter',
      'glaciate',
      'glacial-spike',
      'absolute-zero',
      'hungering-cold',
      'arctic-strike',
    ],
  },
};

// Fail fast on a typo'd id, the same way cards.ts fails fast on a duplicate one.
for (const [key, preset] of Object.entries(DECK_PRESETS)) {
  for (const id of preset.cardIds) {
    if (!CARDS[id]) throw new Error(`deck preset "${key}" names unknown card id "${id}"`);
  }
}
