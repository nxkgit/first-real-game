# Implementation Plan

## Project Overview

A browser-based, turn-based deckbuilder roguelike in the spirit of Slay the Spire (StS), built with **TypeScript + Phaser**. Purpose: a learning exercise in building a real project with Claude Code, and a portfolio/resume piece shareable with friends via a link (no install).

Source of truth for *current* decisions is this document. For *why* a decision was made, or if it changed over time, see `DESIGN_LOG.md`.

Creative/aesthetic/narrative content (hero identity, art, flavor, names) is authored by the user, not by Claude Code. Placeholder values and placeholder visuals (simple shapes/colors) are expected and correct until the user supplies real ones.

## Build Staging

### MVP 1 — Single Combat (done)

**Status (2026-10-06):** complete. First playtest verdict: the core loop "seems fine"; it led to two changes — attack cards are now aimed at the enemy (drag, or click card then enemy) instead of click-to-play, and the enemy's intent/block readouts are icons instead of words. Followed by playtest-friendly polish: scale-to-window (phones included) at full device resolution, draw/discard pile counts, and hover tooltips on icon readouts. Unit tests (Vitest, `npm test`) cover the logic layer.

**Goal:** prove out the core combat loop's feel and visuals. Nothing beyond one fight.

**In scope:**
- One hero ("Mage" — final identity/visuals TBD by user, placeholder visuals for now)
- One enemy (placeholder visuals; final look TBD by user)
- Draw a hand, play cards, spend energy, end turn, enemy acts on its telegraphed intent, repeat until win (enemy HP to 0) or loss (player HP to 0)
- StS-style face-off layout: enemy area top/center, player area bottom, hand of cards at bottom of screen, energy and HP indicators visible

**Explicitly out of scope for MVP 1** (do not build yet, see "Deferred" section below): shop, gold, relics, non-combat events, map/run structure, multiple heroes, card rarity tiers, full status-effect roster, balance pass, meta progression.

**Definition of done:** the full loop (draw → play → end turn → enemy turn → win/loss) runs in a browser, is playable with mouse/click, and feels responsive enough to evaluate "does this feel good" before building anything further.

### MVP 2 — Chained Combats + Non-Combat Events (current target)

A short linear sequence of a few fights plus non-combat nodes, deployed somewhere shareable for friend playtesting.

**Decided and built (2026-10-06), all numbers provisional:**
- **Run skeleton:** a fixed linear path — fight, fight, rest, fight (`src/data/run.ts`). HP, deck, and gold carry between fights. Losing any fight ends the run; winning the last one wins it. Run-end screen offers a new run.
- **Reward after each won fight (except the last):** pick 1 of 3 cards from a reward pool, *or* take gold. Gold is banked and shown but has nothing to spend on yet — the shop is still deferred, and gold's value vs. a card is still an open question.
- **Rest stop:** heals 30% of max HP (capped at max), then moves on.
- **Placeholder content:** Enemies A/B/C with rising difficulty (same placeholder drawing, different colors) and a 7-card reward pool built only from the existing damage/block/draw effects. Final cards/enemies are the user's to design.
- **Starting/MVP 1 numbers kept as provisional placeholders** (user's call, 2026-10-06): enemy HP/damage/patterns, starter deck, Block as the only status effect.
- **Deployment:** GitHub Actions workflow publishes to GitHub Pages on every push to `main` (needs Pages source set to "GitHub Actions" in repo settings).

**Still open for MVP 2:** shop (and with it, gold's value), non-combat events beyond the rest stop, Weak/Vulnerable/Strength, and whether the path should become a branching map.

## Architecture Principles

(Engineering/structure guidance — not creative decisions. This is Claude Code's lane.)

- **Data-driven content.** Cards, status effects, and enemy move patterns should be defined as data (objects/config), not as hardcoded branching logic, so adding/changing content later doesn't require restructuring code.
- **Separate game logic from rendering.** Core game state and rules (deck/hand/discard, energy, turn resolution, win/loss) should be plain TypeScript, independent of Phaser, so it's easy to reason about and unit-test. Phaser scenes should read from and dispatch actions into that logic layer, not own game state themselves.
- **Centralize tunable numbers.** HP, damage, energy, costs, hand size, etc. belong in one obvious place (constants/config), since balance will be iterated on repeatedly once playtesting starts.
- **Build to current scope only.** Don't implement anything in the "Deferred" list below ahead of when it's actually scheduled, even if it seems easy to add while touching related code.

## Core Systems — Decided

### Energy & Hand

- Energy per turn: **4** (static default, explicitly expected to be tuned later)
- Draw: **5 cards** per turn
- Draw/discard model: copy StS directly — draw pile, hand, discard pile. Draw up to hand size at the start of each turn; if the draw pile empties mid-draw, shuffle the discard pile into the draw pile and continue. Unplayed cards in hand discard at end of turn; played cards go to the discard pile. (Exhaust pile not needed for MVP 1; can be added later without restructuring if data-driven.)

### Card Types

Reusing StS's **Attack / Skill / Power** split for now. This is generic, non-proprietary game-mechanic plumbing common across the genre, not a creative identity element — fine to reuse. Treat as a placeholder categorization; real mechanical differentiation should come later from the hero's own signature systems, not from renaming this split.

### Status Effects

Decision: **mirror StS closely.** Same reasoning as card types — this is proven, generic plumbing. Exact roster for MVP 1 is minimal (see Open Questions — likely just Block to start; broader roster like Weak/Vulnerable/Strength arrives in MVP 2).

### Enemy Intent Telegraphing

Decision: **very similar to StS** — an icon above the enemy showing its next move (damage number for attacks, icon for buff/debuff/defend-style effects), visible to the player before they act.

### Run Structure (future, not needed for MVP 1)

- One life per run (permadeath), like StS — no meta progression/persistent currency between runs, at least for now.
- The eventual full run includes elites and a boss at the end.

## Deferred (explicitly not MVP 1 — do not build yet)

- Shop system (shop contents, prices, exchange rate between a card reward and gold) — gold itself now exists and is banked, but has no use yet
- Relics
- Non-combat event node design beyond the rest stop (narrative events, other node types)
- Map/run structure beyond MVP 2's fixed linear path (branching map, elite placement, boss)
- Card rarity tiers and reward-pool weighting
- Multiple heroes/archetypes (ranger, fighter, etc.) — MVP 1 is Mage only
- Magic-school/tribe synergy system — deprioritized in favor of single-hero depth for now
- Full status-effect roster beyond MVP 1's minimal set
- Combat math/balance pass (HP/damage scale, target fight length in turns)
- Enemy roster beyond the three placeholder enemies, enemy AI variety

## Open Questions

<!-- OPEN QUESTION: exact status-effect roster needed for MVP 1 beyond Block (if any) — needs a decision before/during MVP 1 build. -->
<!-- OPEN QUESTION: MVP 1 enemy's move pattern, HP, and damage numbers — not yet specified. A simple fixed or lightly-repeating pattern is enough to test telegraphing; exact numbers TBD. -->
<!-- OPEN QUESTION: MVP 1 starter card count/list — exact cards TBD (hero design is the user's). Needs enough variety to exercise the draw/play/discard loop meaningfully, likely fewer than the eventual full ~20-25 card target. -->
<!-- OPEN QUESTION: non-combat event design (narrative-choice style like StS, or simpler?) — deferred to MVP 2 planning. -->
<!-- OPEN QUESTION: card rarity tiers and reward odds — deferred to MVP 2 planning. -->
<!-- OPEN QUESTION: shop contents and the gold-value tuning for the card-vs-gold reward choice — deferred to MVP 2 planning; must avoid gold becoming a strictly dominant or strictly inferior choice. -->
<!-- OPEN QUESTION: combat math (HP/damage scale, target turns per fight) — deferred. -->

## MVP 1 Build Order

1. Scaffold TS + Phaser project (Vite + Phaser template), basic repo structure (`src/game` for logic, `src/scenes` for Phaser rendering, `src/data` for card/status definitions).
2. Static scene: render enemy area, player area, hand area using placeholder shapes — no logic yet, just layout.
3. Data model: `Card`, `Deck/Hand/DiscardPile`, `Player`, `Enemy`, `GameState`, as plain TypeScript, decoupled from Phaser.
4. Draw/discard/shuffle logic per the decided model.
5. Energy system and card-playing (cost check, effect resolution, targeting).
6. Single enemy: intent telegraph + simple move pattern.
7. Turn loop: player turn → enemy turn → win/loss check.
8. Win/loss screen (placeholder).
9. Manual playtest pass in-browser; iterate on feel before moving to MVP 2.
