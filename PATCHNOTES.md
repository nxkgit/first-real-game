# Patch notes

What changed in each batch of fixes, newest first. Written so playtesters can read them; issue numbers are for the maintainer. The procedure that produces these is `docs/QA_FIX_WORKFLOW.md`.

## 2026-10-09 (batch c: restart run from Settings)

### Added
- A "Restart run" button in the Settings panel during a run (map, fights, rest sites, shops, events, rewards and the starting-deck draft). It asks "Abandon this run?"; Yes takes you to the hero select screen for a new run, Cancel goes back to Settings. The button is not shown on the start screen, the hero select screen or the end-of-run screen, which already offer a new run. An abandoned run is not recorded anywhere.

### Not fixed
- Nothing was a bug fix in this batch.

### Checked
- Typecheck, unit tests and the build pass. Played in a real browser: the button and the confirm box, Cancel returning to Settings, Yes landing on hero select, and the button being absent on the start screen.
- Not checked: restarting in the middle of a fight, touch screens.
- The other two changes in this batch only touch the project's working guidance (`CLAUDE.md`, a new reflecting-mode doc and log) and have no effect in the game.

## 2026-10-09 (content page: Resource column)

### Added
- The Cards table on the content page has a new "Resource" column right after "Cost", saying whether a card's cost is paid in Energy or Radiant Light (before, both showed just a number). There is a matching "Resource" filter beside the Owner filter, and the card detail panel now reads, for example, "cost 2 (Radiant Light)".

### Not fixed
- Nothing was a bug fix in this batch.

### Checked
- Unit tests and the typecheck pass. Looked at the real content page in a browser: the new column, its position and its values (page text only; a screenshot could not be taken). The Resource filter was tested in code but not clicked in the browser.

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
## 2026-10-09 (fix commit 972d45a)

### Fixed
- #12 (big fix): a card in your hand that shows its live damage (Opportunist, Block Slam, Combo Strike, Hand Strike and the other scaling cards) now also keeps the sentence that explains why the number changes, for example "Deal 12 damage. +4 for each stack of Vulnerable on the target."
- #14 (minor fix): when 5 stacks of Freeze stun an enemy, its next-move slot now shows a blue gem (a placeholder picture) instead of the sword and damage number, with the hover text "Frozen solid: skips its next move." The normal icons come back once the stun is spent.

### Not fixed
- #13: could not reproduce (the aiming arrow drawn away from the cursor). Tried: picking up and aiming cards in a fresh fight, after enemy turns (screen shake), after resizing the window, in a second fight and against two enemies, at seven window sizes and display scalings (100%, 125%, 150%, mouse and click-then-click), and in the maintainer's own Chrome; in every case the arrow ended within a pixel of the cursor. No fix was guessed at. Needs the browser, window size, display scaling and zoom of someone who sees it, or a screen recording.

### Checked
- Unit tests, the typecheck and the build pass, and the browser tests for both fixes pass (each fails without its fix).
- Played in a real browser: a fight with a stunned enemy beside a normal one, and a hand of scaling cards against an enemy with Vulnerable, checked against screenshots.
- Not checked: touch screens, and the Freeze icon during a full enemy-turn animation.

## 2026-10-09 (fix commit 55f2f04)

### Fixed
- #7 (game breaking): in fights, the Hero Power button no longer covers an enemy's next-move icons (the sword, shield and arrow readouts). It now sits to the left of End Turn instead of below it, and the short combat log at the top of the screen was narrowed to fit beside it.

### Not fixed
- Nothing: every ticket in this batch was fixed.

### Checked
- Unit tests and the full automated browser suite pass. Played in a real browser: fights against one, two and three enemies, an elite fight, using the Hero Power from its new place, and a whole enemy turn, checked against screenshots.
- Not checked: touch screens.
