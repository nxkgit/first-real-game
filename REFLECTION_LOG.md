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

## Session 2026-10-10

### Session-start check that the checkout is current

- **Observed:** The session opened on `hero-select`, 39 commits behind `origin/main`. Claude read the stale `CLAUDE.md` and QA workflow, which said QA mode needs a ticket list, and answered "needs input: ticket list" four times. The current docs say "qa mode" alone starts phase 1 (analyse every open issue). Nothing in the guidance said to check the checkout was current, and the background-job text says to ask before switching branches.
- **Decision:** Added a short `CLAUDE.md` section plus a pointer in `docs/QA_FIX_WORKFLOW.md`: at session start only, `git fetch` and compare with `origin/main`; if on another branch or behind, say so first and report and wait.
- **Why:** Stale docs silently change behaviour, and the user's own checkout should not be moved without them. Limited to session start to avoid constant checking.

### REJECTED: Claude fast-forwarding a stale checkout itself

- **Decision:** REJECTED. The rule is report and wait.
- **Why:** Moving the user's checkout can disturb their work in progress; one question to them is cheaper.

### REJECTED: re-checking before every command

- **Decision:** REJECTED. Session start only.
- **Why:** Over-checking adds noise; the observed failure happened at session start.

## Session 2026-10-13

### Patch notes live in the PR description; the files are written once, after merges

- **Observed:** The user was resolving merge conflicts in GitHub ("current / incoming / both") on `PATCHNOTES.md` and `README.md` on nearly every PR. The cause was the rule that every PR add an entry to the top of `PATCHNOTES.md` and rewrite the README block (a copy of the newest entry): every PR edits the same lines. Seen directly: PR #53 (stacked on #50) was marked conflicting right after following the rule, and a conflict resolution when merging `main` into #50's branch silently dropped #50's entry, so it merged with no patch notes. `PATCHNOTES.md` has 13 commits and `README.md` 18; about a dozen recent merges are main-into-branch or batch merges.
- **Decision:** Replaced the `CLAUDE.md` "Patch notes" rule. PRs no longer edit `PATCHNOTES.md` or `README.md`; a player-visible PR carries a `## Patch notes` section in its description in the final format. When the user says "patch notes", Claude writes one entry from the merged PRs' descriptions, runs `npm run patchnotes:sync`, and opens a docs-only PR from `main`. QA-mode batches are unchanged (the batch branch already writes one entry; `docs/QA_FIX_WORKFLOW.md` needed no change). The live site may be ahead of its notes until the user triggers the step; the user accepted that.
- **Why:** The two files then only change in one PR at a time, so feature PRs cannot conflict on them. Writing the "Checked" lines into the PR description keeps them written by whoever played the build.
- **Known risk:** An entry can be forgotten and nothing checks for it (the README sync test only checks that the README matches `PATCHNOTES.md`). Not addressed; revisit if it happens.

### REJECTED: a fifth "patch notes mode" that refreshes all internal docs

- **Decision:** REJECTED. The only trigger is the plain phrase "patch notes", and it only covers `PATCHNOTES.md` and the README block.
- **Why:** The user found the larger design too complex for the problem (conflict clicking). No evidence of conflicts in `DESIGN_LOG.md` or `HANDOFF.md` was observed, only circumstantial.

### REJECTED: one file per PR under `patchnotes/`, assembled by the build

- **Decision:** REJECTED for now.
- **Why:** Conflict-free and public per PR, but it needs changes to the content site's reader, the sync command and its test (building work), and the README block would still need a separate refresh. Too much for the observed problem.
