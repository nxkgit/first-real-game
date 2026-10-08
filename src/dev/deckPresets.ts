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
  'mage-burst': {
    // The user's own combo (2026-10-08, corrected the same day — see DESIGN_LOG.md "Heating Up
    // corrected"): Heating Up's real mechanic is an exponential chain (Ignite status), not a flat
    // double — each attack this turn deals 2x the one before it (1st normal, 2nd x2, 3rd x4, ...).
    // Chain several free Scorching Winds to ramp the multiplier, Molten Core/Quick Draw keep them
    // coming, then land Apocalyptic Flame as the big finisher at base x 2^n. Scorching Wind and
    // Apocalyptic Flame cost 0/3, so Heating Up (1) + Apocalyptic Flame (3) already spends a full
    // turn's 4 energy — Molten Core/Quick Draw are meant for a separate turn (or the one after,
    // once the Hero Power's +1 energy kicks in), not all in the same breath as the finisher.
    label: 'Mage: Heating Up burst',
    cardIds: [
      'heating-up',
      'scorching-wind',
      'scorching-wind',
      'scorching-wind',
      'scorching-wind',
      'scorching-wind',
      'scorching-wind',
      'molten-core',
      'molten-core',
      'quick-draw',
      'apocalyptic-flame',
      'cauterize',
      'cauterize',
      'heat-warning',
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
