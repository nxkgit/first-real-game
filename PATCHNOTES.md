# Patch notes

What changed in each batch of fixes, newest first. Written so playtesters can read them; issue numbers are for the maintainer. The procedure that produces these is `docs/QA_FIX_WORKFLOW.md`.

## 2026-10-10 (fix commit 0be7c4a)

### Fixed
- #44 (minor fix): a big hand no longer piles up on itself. With 9 or 10 cards in hand, the cards used to overlap and their names and text were cut off. Now every card shrinks just enough to sit side by side, and the card under your mouse grows back to a readable size. Hands of 5 or fewer look exactly as before.

### Not fixed
- #46: could not reproduce. Tried: the rest stop screen on the current build in a real browser. The backdrop, the campfire picture and both buttons show, with no white screen. If it happens again, note which browser and device it was on.

### Checked
- Typecheck, 962 unit tests and the build pass, and a new test fails on the old hand layout and passes now. Played in a real browser: a full 10-card hand, hovering a card, and playing a card from it.
- Not checked: touch screens. At 10 cards the small cards are hard to read until you point at one.

## 2026-10-09 (card picture slot)

### Added
- Cards now have a picture window along the top, showing a plain placeholder picture until real card art is made (each card can get its own picture later). A card whose text is too long to fit beside the picture (Heating Up) is drawn without it so the text stays readable; this is temporary and goes away once real card art exists.

### Not fixed
- Nothing was a bug fix in this batch.

### Checked
- Typecheck, unit tests and the build pass. Played in a real browser: a hand of cards with and without the picture, and Heating Up's text staying inside its card.
- Not checked: touch screens, the deck and reward screens' card layouts beyond the hand.

## 2026-10-09 (fix commit 84bb4d7)

### Fixed
- #32 (minor fix): the Credits screen no longer has text drawn on top of other text. The list is now laid out in two columns so every line has room, and long web addresses wrap instead of running into the next column.
- #26 (minor fix): status icons (Freeze, Vulnerable and the rest) now sit centred under the enemy they belong to. Before, a single icon could appear far to the left, under a different enemy. Hovering an icon explains it, including on enemies standing side by side.
- #28 (big fix): Heating Up and Ignite work the way the card says. Heating Up now reads "For the rest of your turn, your attacks grant you 1 Ignite. (This effect does not apply to Scorching Wind's damage.)" Playing it gives you a new **Fuming** icon for the rest of your turn. Each attack you play while Fuming grants 1 Ignite after it hits, and Ignite makes your attacks deal double damage per stack: the first attack after Heating Up is normal, then 2x, 4x, 8x and so on. Attacks you played before Heating Up never count, and playing Heating Up twice does not stack Fuming. Scorching Wind still grants Ignite, but its own damage is not boosted by it (it still gets Strength, Empowered and the rest). Only damage from attack cards is boosted: damage from a skill card or a trigger is not multiplied by Ignite. Heating Up's longer card text is squeezed to stay inside the card. The Ignite icon now tells you the current multiplier, and attack cards in your hand show the damage they would deal right now, Ignite included. Fuming and Ignite both wear off at the end of your turn.

### Not fixed
- #29 (minor fix): could not reproduce. Empowered and Ignite already multiply together (for example, Heating Up, then Empowered, then Strike dealt 12, then 12, then 24 in a test). The likely cause is that the first attack after Heating Up has no Ignite bonus yet, so with Empowered it only shows the Empowered doubling. Heating Up's rework above makes that clearer, and a test now pins that the two multiply.
- #27 (minor fix): no change needed. Glaciate does deal 24 against a frozen enemy; the 19 seen was most likely the enemy's block absorbing 5 of it, which is how block works. A test now pins the 24. (Glaciate drops back to 8 once the Freeze stacks stun the enemy, because the stacks are used up; that is also unchanged.)

### Checked
- Typecheck, 957 unit tests and the build pass. The new Heating Up rules, the capped Fuming, Scorching Wind's exception and Empowered together with Ignite each have a unit test.
- Played in a real browser: the Credits screen (screenshot, two columns, no overlap), status icons under three enemies at once with hover text, and a full Heating Up turn (Heating Up, Strike, Strike, Scorching Wind, Strike dealt 6, 12, 2 and 48, the Fuming and Ignite icons showed, and both cleared at the end of the turn).
- Not checked: touch screens, other window sizes.

## 2026-10-09 (final boss and campfire art)

### Added
- The final boss (Boss A) now wears the animated lava dino picture, and it is drawn at its own pixel size, so it is a little smaller on screen than the old stand-in picture.
- Rest stops now show the campfire picture (with a small flicker) in place of the drawn placeholder fire, and rest stops on the map use the same campfire as their icon.

### Not fixed
- Nothing was a bug fix in this batch.

### Checked
- Typecheck, unit tests and the build pass. Played in a real browser: a boss fight (the dino animates, fits inside the fight panel, and the boss acts after End Turn), the rest stop screen, and the map icons.
- Not checked: the boss's lunge and defeat animation (idle only was watched), touch screens.

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
