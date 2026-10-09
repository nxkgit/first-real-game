# Reflecting mode

Procedure for the fourth working mode in `CLAUDE.md`. Read this before starting. Reflecting mode is for thinking about how the user and Claude work together — AI usage, prompting, agentic workflow — and for changing the guidance documents that shape Claude's behaviour. It is not about game design (that is planning mode, logged in `DESIGN_LOG.md`).

## Entering the mode

- The user says "reflecting mode".
- **Detection nudge.** If the user asks for a change that belongs here and hasn't said the phrase — adding or changing a rule in `CLAUDE.md`, a memory, a skill, a subagent definition, the QA docs, or how tasks are handed over — say so once ("this looks like a reflecting-mode change, switch?") and follow the answer. If the user says no, do not raise it again for that change.

## Behaviour

Same posture as planning mode: inquisitive, surfaces tradeoffs, gives a genuine opinion when there is a specific reason, says plainly when there is no objection. Never disagree reflexively. Never say a rule "sounds good" to be agreeable — if a proposed rule is vague, unverifiable, or likely to backfire (e.g. makes Claude over-ask or over-refuse), say so.

- **No offers to draft or build.** Same rule as planning mode: only the user moves from discussion to editing, and only by saying so explicitly.
- **Edit allowlist.** Only these files may be changed in this mode:
  - `CLAUDE.md`
  - the memory directory (`MEMORY.md` and its files)
  - `docs/QA_FIX_WORKFLOW.md` and `QA_PLAN.md`
  - skills and subagent definitions (`.claude/skills/`, `.claude/agents/`)
  - `docs/REFLECTING_MODE.md` (this file) and `REFLECTION_LOG.md`

  Anything else (game code, `implementationplan.md`, `HANDOFF.md`, settings, hooks) is out of bounds here; if a change there seems needed, say so and let the user switch modes.
- **No enforcement push (for now).** The question "should this be a hook or a check instead of a rule?" is deliberately not part of the mode yet. Revisit by logging a decision.

## Evaluating a proposed rule

1. **Evidence.** Every new or changed rule must point at something observed: a session where Claude went wrong, a repeated correction from the user, or a specific failure mode being guarded against. If there is no evidence, hold the rule back and say so.
2. **Why.** The rule is written with its reason, so it can be judged later.
3. **Audit.** Check the existing guidance for conflicts, staleness, and duplication with the new rule. Report what you find even when the user didn't ask.
4. **Size.** Prefer few, specific rules. A longer `CLAUDE.md` dilutes adherence to every rule in it. Detail that only matters in one mode belongs in a doc under `docs/`, with a short pointer in `CLAUDE.md` (the pattern QA mode and this mode use).

## Restructuring existing guidance

Moving or reorganising existing text needs **no evidence**, because it changes no behaviour — but it needs a **no-loss check**: compare before and after and confirm no rule was dropped or reworded. Any wording change that alters meaning counts as a rule change and goes through "Evaluating a proposed rule".

## Recording

Append to `REFLECTION_LOG.md` (new entry at the end, under the current session's heading; never rewrite or delete prior entries). Each entry has:

- **Observed** — the behaviour or friction that prompted it.
- **Decision** — the rule or change adopted, or **REJECTED** with the reason it was rejected. Rejected ideas are recorded and clearly labelled so they are not relitigated.
- **Why** — the reasoning.

## Ending the mode

Only when the user says so. Never close the mode unprompted, even when the work seems finished. After it ends the session is in whichever mode the user names next.
