# Card workflow

**DRAFT for the user's review.** This file covers a card's *functionality*; card *pictures* are a separate step (see "Card art" at the end). The process for turning a card you design into a card in the game. The *what* (fields, effects, scaling, triggers) is in `CONTENT_GUIDE.md`; this file is the *how we work*. You design the card; Claude writes the data object and proves it works.

## The split

- **You decide:** the name, the cost, the numbers, what the card does, what it is for. Anything creative or mechanical (`CLAUDE.md`, "Creative boundary").
- **Claude does:** translates it into a `CardDefinition`, registers it, tests it, reports what was and was not verified.
- **Claude does not:** invent a name, flavour, a missing number or a missing rule. If the hand-off leaves something out, Claude asks. If a placeholder is unavoidable (an unspecified "X"), it is labelled provisional in a comment and in the report, like the Mage batch in `mageCards.ts`.

## 1. Hand-off template

Give each card in this shape. Anything you leave out, Claude asks about instead of guessing.

```
Name:
Hero / owner:        (mage, or neutral)
Type:                (attack / skill / power)
Cost:
Target:              (an enemy you aim at / all enemies / self-only)
Effects, in order:   (plain words with the numbers: "deal 6, then +1 Temperature")
Keywords/tags:       (exhaust, innate, retain, ethereal, unplayable, tags such as "fire")
Upgrade:             (what changes; "nothing" is allowed but means no upgrade at the rest stop)
Where it appears:    (reward pool / starter draft pool / neither; archetype and rarity if you have them)
Edge cases you care about: (e.g. "second attack in a turn counts the first")
```

Cards can be sent one at a time or as a list. A card whose mechanic does not exist yet is *not* sent here; see step 2.

## 2. Check the engine can express it

Claude maps each effect to the vocabulary in `CONTENT_GUIDE.md` (effect kinds, scaling sources, trigger events, statuses, keywords).

- **Everything fits:** go to step 3.
- **Something does not** (a new effect kind, trigger event, scaling source, status behaviour): **stop and go back to planning.** Claude says what is missing and what it would take, and we settle the mechanic (as with Temperature, Freeze and Heating Up) before any card using it is written. No improvising a near-match in the card data, no hand-written `description` to paper over it. Engine work is its own planned task, with its own tests.

This is the rule that keeps card building mechanical: by the time a card is handed over, the design questions are already answered.

## 3. Write the card

1. Add the `CardDefinition` in the owner's file: Mage cards in `src/data/mageCards.ts` (add to `MAGE_CARDS`), neutral originals in `src/data/cards.ts` (add to `ALL_CARDS`), engine test cards in `synergyCards.ts` / `keywordCards.ts`. The `id` is lowercase-with-dashes and never changes afterwards.
2. Never write `description`; text is generated.
3. Give it an `upgrade` block (it replaces the **whole** effect list; repeat unchanged effects). If the upgrade changes only the cost, say so.
4. Mark any value you were not given with a comment: `// PLACEHOLDER: not specified`.

## 4. Test, in tiers

Every card gets Tier 1. A card gets Tier 2 as well if it has any of: scaling, triggers, a status, randomness, a new interaction with Temperature/Freeze, a keyword, or an effect that depends on turn order.

**Tier 1 (all cards):**
- `npm run content:check`: no errors, and read each warning about the new card.
- Read its generated text and the base/upgraded pair in `content.html`. Is the sentence what you meant?
- A unit test with a small fight (see `src/game/synergy.test.ts`: `fight(deck)` builder, then `playCard`): play it and assert the numbers on both the base and the `+` version, including the cost.
- `npm test`.

**Tier 2 (cards with moving parts), in addition:**
- Unit tests for the interactions it claims (the exact sequence, e.g. 1st/2nd/3rd attack for a chain; a Freeze stun threshold crossing; a trigger firing once).
- **Played in a real browser** through a scenario (`docs/SCENARIOS.md`: hand-write the hand, piles, enemy statuses and Temperature, load it from the `?dev` panel) or an e2e test (`e2e/synergy.e2e.ts` is the pattern). Check the live number on the card face, the readouts and the log.
- Where the scenario is worth keeping, commit it to `scenarios/`.

The report always says which tier ran and separates **played in a browser** from **only unit-tested** (`CLAUDE.md`, "Testing discipline").

## 5. Wire it in

- Reward pool / starter draft: the card's `inRewardPool` / `inStarterPool` flags. Check the pool counts a test pins (`synergy.test.ts` keeps a `REMOVED_FROM_POOL` list for cards deliberately out of the pool).
- Deck presets (`src/dev/deckPresets.ts`) if you want it in a playtest deck. Not automatic.
- If a card is new to the pool, the balance baseline moves: `npm run balance:baseline` (we are not tuning, only keeping `balance:check` meaningful).

## 6. Wrap up

1. `npm run verify` (typecheck, tests, build). A test that pins a content number failing after you changed the number means the test needs updating, not that the engine broke; update it on purpose.
2. Append a `DESIGN_LOG.md` entry if a nontrivial design decision was made or changed during the work. Update `HANDOFF.md` at the end of the session.
3. Commit with a message naming the cards. Push only when you say so.

## Changing a number yourself

You can edit a card's file directly; this is the checklist so nothing goes stale.

1. Edit the value in the card's own file (`mageCards.ts`, `cards.ts`, `synergyCards.ts`). Tunables that apply to everything are in `tunables.ts`, not on cards.
2. **Check the `upgrade` block.** It replaces the whole list, so it may restate the number you just changed.
3. `npm run content:check`, then `npm test`.
4. Expect some of these to need a deliberate refresh, not a bug fix: golden hashes (`effects.golden.test.ts`), e2e tests with hardcoded numbers, unit tests that pin that card's values, and the balance baseline (`npm run balance:baseline`).
5. Tell Claude what you changed so the design log and handoff stay current.

## Card art

A card can ship without art: it shows the default picture. Your own art goes in `public/assets/cards/<card-id>.png` (2:1, 320x160) and its id is added to `CARD_ART_IDS`; the full rules are in `ART.md`, "Card pictures".

## Open questions for review

- Is the template missing a field you think about when designing (flavour text? art id?). Flavour and art are yours; today there is no field for them.
- Should Tier 2 browser checks always be committed as scenarios, or only when you ask?
- A tiny helper that prints a card's base and upgraded numbers was offered and not decided.

## Temporary: long-text cards drop the placeholder picture

While every card shows the shared placeholder picture (`public/assets/cards/default.png`), the picture window leaves about 63 px for the card text instead of 80. A card whose text does not fit in that space (Heating Up's wording is the one so far) is drawn **without** the picture, in the layout cards had before pictures: `descriptionFitsBesidePlaceholder` in `src/scenes/ui.ts`. A card with its **own** picture (`hasOwnCardArt`, a file listed in `CARD_ART_IDS`) always keeps it, so the rule fades out as real art is added.

**Remove it** (the function, the `showArt` check in `buildCardFace`, the second test in `e2e/cardart.e2e.ts`, and this section) once real card art exists and the layout has room for the longest card text. Decided by the user on 2026-10-09; see `DESIGN_LOG.md`.
