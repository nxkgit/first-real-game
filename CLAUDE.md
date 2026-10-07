# CLAUDE.md

Guidance for working in this repository. This project is a learning/portfolio exercise: a browser-based, turn-based deckbuilder roguelike (TypeScript + Phaser) built in close collaboration with the user via Claude Code.

## Source documents — read these first

- `implementationplan.md` — current scope, decided systems, and what's explicitly deferred. This is the source of truth for "what are we building right now."
- `DESIGN_LOG.md` — chronological record of *why* decisions were made, including ones that later changed. Consult it before assuming a past decision still holds if something seems inconsistent with current code.

## Creative boundary — important

Hero identity, card flavor/names, art, narrative, and overall aesthetic are authored by the user, not by Claude Code. Do not invent or propose finished creative content unprompted (hero concepts, lore, visual style, card names/flavor text). It's fine to:
- Use clearly-placeholder values (simple geometric shapes, flat colors, generic labels like "Enemy A") for anything not yet designed.
- Ask clarifying *systems* questions about a creative choice the user has already made (e.g., mechanical implications).
- Point out when a creative choice has a mechanical consequence worth flagging.

Stay on the systems/architecture/mechanics side of the line.

## Scope discipline

- Build exactly to the current MVP target in `implementationplan.md`. Do not implement anything from its "Deferred" list ahead of schedule, even if it looks easy or related to code you're already touching.
- When a mechanic is genuinely undecided (marked as an open question in the plan), ask the user rather than quietly picking an answer. Silent assumptions on gameplay-affecting decisions are worse here than an extra question, since the whole point of this phase is deliberate, legible design choices.
- If you do need to make a small, reversible placeholder call just to keep moving (e.g. an exact filler number), make it obviously provisional and flag it rather than letting it look like a finished decision.

## Architecture conventions

- **Data-driven content.** Cards, status effects, enemy move patterns: define as data/config, not hardcoded branching logic. Content should be addable without restructuring systems.
- **Logic/rendering separation.** Core game state and rules (deck, hand, discard, energy, turn resolution, win/loss) live as plain TypeScript independent of Phaser, so they're easy to reason about and unit-test. Phaser scenes read from and dispatch into that logic layer; they don't own game state.
- **Centralized tunables.** Balance numbers (HP, damage, costs, hand size, etc.) live in one obvious place. Expect these to change frequently once playtesting starts — don't scatter them inline.
- **No premature abstraction.** This is a small solo project at MVP stage. Don't build generic systems for hypothetical future content (e.g., a full hero-plugin architecture) before there's more than one hero to support it.

## Testing discipline

Game *feel* cannot be verified by type-checking or unit tests alone. After any change to combat flow, card effects, or turn structure, actually run the dev server and play the loop (draw → play a card → end turn → watch the enemy act) before reporting it as working. State plainly when something has only been type-checked/logic-tested versus actually played.

## Keeping the design log current

When a nontrivial gameplay decision is made, changed, or reversed in conversation, append an entry to `DESIGN_LOG.md` (new entry at the end, under the current session's heading — create a new session heading if none exists yet for today). Don't rewrite or delete prior entries, even superseded ones — the log's value is tracking how reasoning evolved over time.
