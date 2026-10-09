# Patch notes

What changed in each batch of fixes, newest first. Written so playtesters can read them; issue numbers are for the maintainer. The procedure that produces these is `docs/QA_FIX_WORKFLOW.md`.

## 2026-10-09 (fix commit 55f2f04)

### Fixed
- #7 (game breaking): in fights, the Hero Power button no longer covers an enemy's next-move icons (the sword, shield and arrow readouts). It now sits to the left of End Turn instead of below it, and the short combat log at the top of the screen was narrowed to fit beside it.

### Not fixed
- Nothing: every ticket in this batch was fixed.

### Checked
- Unit tests and the full automated browser suite pass. Played in a real browser: fights against one, two and three enemies, an elite fight, using the Hero Power from its new place, and a whole enemy turn, checked against screenshots.
- Not checked: touch screens.
