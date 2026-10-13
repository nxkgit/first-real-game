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

### Retired the unattended / parallel-agent workflow

- **Observed:** A review of the guidance files (2026-10-13) found it contradicted itself. The memory file said not to run background agent waves while the user is active and to ask before launching agents, while `HANDOFF.md` told Claude to hand any task over about 2 minutes to a background agent by default. `docs/AUTOMATION.md` said `gh` was not installed and not to open PRs, which no recent session matched. In practice (the Druid build and the restructure) long builds ran inline anyway, and the user got repeated "hasn't heard from you" notices.
- **Decision (user, 2026-10-13: "lets forget agentic workflow and remove mention of it but document the removal"):** The workflow is retired. `docs/AUTOMATION.md` moved to `docs/archive/AUTOMATION.md` with a RETIRED banner (history only). Its index rows in `docs/README.md` were removed or pointed at `CLAUDE.md`; `HANDOFF.md`'s playbook, orchestrator and "hand off over 2 minutes" notes were replaced with the current working style; `CLAUDE.md`'s reflecting-mode topic list no longer names it, and a rule says long builds run in the session with a one-line status as you go. **Kept on purpose:** QA mode's single-session autonomous run (it is not an agent workflow) and the memory file `no-autonomous-loops-while-active` (a harmless "don't"). Historical text (`DESIGN_LOG.md`, `docs/archive/progress-*.md`, the audits) is not rewritten.
- **Why:** One consistent rule beats two opposite ones, and the user does not use the agent workflow. The CI triggers for `auto/**` and `integration/**` branches in `.github/` were left alone (config, not guidance); revisit separately if wanted.

### Git flow: never push to `main`; Claude opens draft PRs, the user merges

- **Observed:** `HANDOFF.md` said "commit to `main` and push" was fine; `CLAUDE.md` (pipeline-failure section), the QA docs and `AUTOMATION.md` said never push to `main`. After the Druid work was built Claude did not open a PR until the user asked ("wheres the pr"). No rule said to open one.
- **Decision (user: "dont push to main unless i explicitly say so" / "you open drafts and i merge"):** New `CLAUDE.md` section "Git and pull requests": never push to `main` or merge unless explicitly told; work on a branch; when built and verified, open a draft PR without being asked and report its URL and check state; leave the user's untracked files out of commits. `HANDOFF.md`'s "relaxed gitflow" notes were replaced.
- **Why:** Removes the contradiction and the missing step. The user prefers to merge every PR themselves.

### REJECTED: moving procedures into skills

- **Decision:** REJECTED for now. Procedures stay as docs with a pointer in `CLAUDE.md`.
- **Why:** The failures found came from missing pointers and contradictions, not from docs being the wrong format, and a skill adds another file to keep in step. The user: "i dont think we need to use skills if there isnt a clear significant advantage". Revisit if a pointer demonstrably fails to get followed.

### Deferred, by the user

- **`docs/CARD_WORKFLOW.md`:** to be refined in planning mode and then adopted properly in a later reflecting-mode session. Not touched here.
- **Decisions should each have one home:** agreed in principle (user: "i do think decisions should have a home"); the ownership scheme is not yet settled and nothing was changed.
- **Process note:** the reflecting-mode edit allowlist was widened for this one change (user: "widen the allowlist") to cover `docs/AUTOMATION.md`, `docs/README.md` and `HANDOFF.md`; `docs/REFLECTING_MODE.md` itself was not changed, so the allowlist is back to normal.

### Added "card build mode" as a fifth working mode

- **Observed:** Cards reached me as one sentence ("make some placeholder druid cards") or a pasted list, with no fixed shape, so each hand-off cost questions and guesses. `docs/CARD_WORKFLOW.md` existed as an unlinked draft nobody had followed (the guidance review found it referenced nowhere and out of step with how the Mage and Druid cards were really built). Over this session the user and Claude settled a process in planning mode: card designs are rows in a local Postgres table (`docs/DB.md`), the TypeScript stays the game's source of truth, and a trigger phrase builds every `ready` row. The table, the `status` column, `db:backfill` / `db:compare` and the 81 existing cards (0 differences) were built and checked first.
- **Decision (user: "add card build mode to claude.md"):** `CLAUDE.md` gains one bullet, in the same shape as QA mode: entered only by the phrase "card build mode"; follow `docs/CARD_WORKFLOW.md` exactly; read the `ready` rows, build each into its owner's folder, test in tiers, set `built` only after `npm run verify` passes, export the seed, open one draft PR (report plus a player-visible card table in its patch-notes section); autonomous like QA mode with no mid-run questions; a row with no precedent mechanic, an owner with no hero, or missing or contradictory information is set to `blocked`, explained in the report, and the rest continues; Claude changes only the `status` column and never invents a name, number or rule; the mode ends when the report is delivered. The section title and the count ("four" to "five modes") were updated. All detail stays in the doc, per the size rule.
- **Audit of existing guidance (done before editing):** no rule conflicts. "When a mechanic is genuinely undecided, ask the user" (Scope discipline) is overridden inside this mode by the same no-questions rule QA mode already uses, which the new bullet states. The creative boundary, "Git and pull requests" (draft PR, user merges), "Testing discipline" (browser check for moving parts), the dev-preset rule, and the "Patch notes" rule (notes in the PR description, no edits to `PATCHNOTES.md` or the README) all agree with the workflow. No duplication: the procedure is only in `docs/CARD_WORKFLOW.md`.
- **Why:** The same pattern as QA mode (a trigger phrase, a short pointer, the procedure in a doc) keeps `CLAUDE.md` small and makes the process something the user can start with one phrase.

### REJECTED: starting card builds automatically whenever a row is `ready`

- **Decision:** REJECTED. Only the phrase starts a build.
- **Why:** The user wants to choose when a build run happens, and a build changes code and opens a PR; the trigger phrase matches how QA mode and reflecting mode already work.

### Left for the user to decide (outside this session's allowlist)

- Two lines are now stale and sit in files reflecting mode may not edit: the "built and planned" table in `docs/CARD_WORKFLOW.md` (it still lists the `CLAUDE.md` mode as planned) and `HANDOFF.md`'s "Card workflow and the cards table" paragraph (it lists this step as still to do). Neither was changed here.
