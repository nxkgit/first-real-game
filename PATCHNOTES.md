# Patch notes

What changed in each batch of fixes, newest first. Written so playtesters can read them; issue numbers are for the maintainer. The procedure that produces these is `docs/QA_FIX_WORKFLOW.md`.

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

## 2026-10-09 (fix commit 55f2f04)

### Fixed
- #7 (game breaking): in fights, the Hero Power button no longer covers an enemy's next-move icons (the sword, shield and arrow readouts). It now sits to the left of End Turn instead of below it, and the short combat log at the top of the screen was narrowed to fit beside it.

### Not fixed
- Nothing: every ticket in this batch was fixed.

### Checked
- Unit tests and the full automated browser suite pass. Played in a real browser: fights against one, two and three enemies, an elite fight, using the Hero Power from its new place, and a whole enemy turn, checked against screenshots.
- Not checked: touch screens.
