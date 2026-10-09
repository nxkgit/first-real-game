# REFLECTION_LOG.md

Chronological, append-only record of decisions about how we work with Claude Code: `CLAUDE.md` rules, memory, skills, subagents, prompting habits. Gameplay decisions go in `DESIGN_LOG.md` instead. Procedure: `docs/REFLECTING_MODE.md`.

Entry format: **Observed** / **Decision** (or **REJECTED**, with the reason) / **Why**. Never rewrite or delete prior entries.

## Session 2026-10-09

### Created reflecting mode

- **Observed:** The three modes (planning, building, QA) had no place for changes to how Claude behaves. Such changes were being made ad hoc, without evidence or an audit of existing rules.
- **Decision:** Added a fourth mode, "reflecting mode", with its procedure in `docs/REFLECTING_MODE.md` and a short entry in `CLAUDE.md`. Entered by trigger phrase, plus a once-per-topic nudge when a request looks like it belongs there. Edits limited to an allowlist of AI-guidance files. New rules need observed evidence and an audit of existing rules. Ends only when the user says so.
- **Why:** Keeps behaviour-shaping changes deliberate and legible, like planning mode does for gameplay. A short pointer plus a doc keeps `CLAUDE.md` small (the QA-mode pattern).

### Restructuring needs no evidence, but needs a no-loss check

- **Observed:** The evidence requirement fits new rules but not moving existing text.
- **Decision:** Restructuring requires a before/after no-loss check instead of evidence. A meaning-changing rewording counts as a rule change.
- **Why:** Restructuring `CLAUDE.md` into a lean file plus docs is expected to be an early reflecting-mode task; this stops it silently dropping or altering rules.

### REJECTED: enforcement (hooks/checks) as part of the mode

- **Decision:** REJECTED for now — the mode does not ask "should this be a hook or check instead of a rule?".
- **Why:** The user wants to start with guidance only. Revisit by logging a new decision.
