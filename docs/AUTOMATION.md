# Unattended work (cloud sessions)

How to hand a block of work to an autonomous Claude Code session and get back something reviewable. Written 2026-10-07, when the process was first set up; refine it as it proves itself.

`CLAUDE.md` still applies in full. This file adds the rules for sessions that run with **nobody to ask**.

## What suits unattended work

Good fits: work with a machine-checkable definition of done (tests, build, simulator output), systems/mechanics/tooling/docs, anything that makes no creative call.

Poor fits: anything judged by feel (needs a human playing it), hero/card/enemy/art/narrative design, picking real balance numbers.

## Rules for an unattended session

1. **Work on a branch named `auto/<topic>`.** Never push to `main` (a push to `main` deploys the live site). Open a pull request into `main` if you can (`gh pr create`); if you can't, pushing the branch is enough.
2. **No questions: decide, and write the decision down.** Where `implementationplan.md`, `DESIGN_LOG.md`, `HANDOFF.md` and `CLAUDE.md` don't settle something, pick the option most consistent with them and the existing code, then record it in the PR description under **Decisions I made** (what, why, and how to reverse it). Prefer the smaller, more reversible choice.
3. **Placeholders stay placeholders.** Numbers are provisional and live in `src/data/tunables.ts` (or the data file they belong to). Card/enemy/relic names are plain and descriptive ("Jab", "Heavy Hit", "Enemy A"), never flavorful or lore-bearing. No hero identity, story, art or aesthetic decisions.
4. **Stay in scope.** Do the brief, not the neighbouring things. If you notice something worth doing outside it, list it under **Follow-ups** in the PR instead of doing it.
5. **Prove it.** Before finishing, `npm run verify` must pass (typecheck, tests, build). New logic needs tests. Don't weaken or delete an existing test to get green; if one is wrong, say so in the PR.
6. **Say what was and wasn't played.** Cloud sessions can't playtest in a browser. Anything that changes combat flow, card effects or what the player sees is "type-checked and unit-tested only, not played" and the PR must say so, listing what a human should try first.
7. **Shared files.** Several sessions run at once. Edit `HANDOFF.md` and `DESIGN_LOG.md` only if your brief says so. Otherwise put notes in your PR description and, if long, in your own file under `docs/`. Don't reformat files you aren't changing. Keep public APIs backward compatible unless the brief says otherwise.
8. **Determinism.** All gameplay randomness comes from the run's seeded stream. Never `Math.random()` in game logic (see HANDOFF "Patterns to keep").
9. **Finish with a report** at the top of the PR description: what was built, what was verified and how, decisions made, follow-ups, and anything a human must look at before merging.
10. **Don't spiral.** If something is blocked after a couple of honest attempts, finish the rest, describe the blocker precisely in the PR, and stop.

## Brief template

```
Goal: <one sentence>
Context to read first: CLAUDE.md, docs/AUTOMATION.md, HANDOFF.md, implementationplan.md, DESIGN_LOG.md, <specific files>
Branch: auto/<topic>
Deliverables: <concrete list>
You own these files/dirs: <list>.  Don't touch: <list>.
Definition of done: <checks>
Decide-for-yourself guidance: <the likely forks and which way to lean>
```

## Merging

A human reviews each PR. Sessions that touch disjoint files merge independently; if two PRs conflict, merge the engine/data change first and rebase the other. After merging, update `HANDOFF.md` (what's built, new open decisions).
