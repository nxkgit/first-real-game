# Patch notes

What changed in each batch of fixes, newest first. Written so playtesters can read them; issue numbers are for the maintainer. The procedure that produces these is `docs/QA_FIX_WORKFLOW.md`.

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
