# Merge conflicts and lost changes: incident notes (2026-10-13)

Written as input for a **reflecting-mode** session. It records what happened, why, what was already done, and the options for preventing it. Nothing here changes any rule: deciding that (with the evidence rule and a `REFLECTION_LOG.md` entry) is for that session.

## Summary

In one working day, four separate problems came from the same family: **several PRs open at once, each editing the same few shared lines of a file, and PRs stacked on each other.** One of them silently lost work. The maintainer's stated pain is spending time on GitHub clicking "accept current / incoming / both" on files that do not need a human decision.

| # | What happened | Cost | Found by |
|---|---|---|---|
| 1 | Patch-notes entries and the README "Latest changes" block conflicted on nearly every PR (every PR prepended an entry at the same spot and rewrote the same README block). | Repeated manual conflict clicking. | The maintainer. |
| 2 | **A conflict resolution dropped content.** Merging `main` into PR #50's branch (commit `aca30ff`) lost the Keeper of the Wild patch-notes entry; #50 merged without it. | Missing patch notes on `main`; found a day later. | The maintainer ("why are there no patch notes"). |
| 3 | **A stacked PR never reached `main`.** PR #58 was based on #57's branch. #57 merged to `main` (`a59e1a2`); #58 was then merged into the (already merged) restructure branch at 16:00:49Z, so its commit `1c2baae` was never on `main`. `CLAUDE.md` on `main` had no "Git and pull requests" section and `docs/AUTOMATION.md` was not archived. PR #53 (stacked on #50) was also marked conflicting. | Guidance changes the maintainer believed were live were not. | Claude, by accident, while branching for the next task (`grep -c "Git and pull requests" CLAUDE.md` returned 0). |
| 4 | **Index-table conflict in PR #60.** `docs/README.md` (the docs index): #60 inserted a `db:*` commands row directly above the `npm run verify` row; #59 (the PR from item 3, re-opened and merged first) rewrote the last cell of that same `verify` row. Adjacent-line edits cannot be merged by git. GitHub showed `mergeStateStatus: DIRTY`. | One conflict to resolve before merging. | The maintainer, on GitHub. |

## What each one has in common

1. **Shared single-point-of-edit text.** Patch notes (top of `PATCHNOTES.md`, the README block), the docs index tables (`docs/README.md`), and logs (`DESIGN_LOG.md`, `REFLECTION_LOG.md`, `HANDOFF.md`). Any rule of the form "every change adds a row/entry here" guarantees that two PRs in flight touch the same lines. The patch-notes case was already fixed (rule moved to PR descriptions, PR #54). **The docs-index rule has the same shape and is unfixed:** `CLAUDE.md`, "Reusability and repeatable processes", says to add a row to `docs/README.md` for every new recurring-process doc, so every such PR edits the same table.
2. **More than one PR in flight, each branched from a `main` that keeps moving.** #60 was branched before #59 merged. Nothing in the rules says to check whether an open PR is still mergeable.
3. **Stacked PRs.** #53 (on #50) and #58 (on #57). When the base PR merges to `main` first, the stacked PR's changes can be merged into a dead branch instead of `main` and are silently lost. GitHub shows the stacked PR as "merged", which looks like success. Claude opened both stacked PRs and said only "merge the base first"; it did not warn that merging the stacked one into the old base after the base had merged loses it.
4. **No post-merge check.** Nobody (human or Claude) verified that what a PR said it added is actually on `main` after the merge. #2 and #3 would have been caught by a one-line check.
5. **Conflicts resolved by clicking.** In the GitHub editor, "accept current / incoming / both" is made without running anything, which is how item 2 lost an entry.

## What was already done

- Patch notes and the README block: PRs no longer edit them; notes go in the PR description and are written once after merges (`CLAUDE.md`, "Patch notes"; PR #54).
- "Git and pull requests" rule added (never push to `main`; Claude opens draft PRs; the user merges). Re-opened as PR #59 after item 3 and merged (`e4a96c4`).
- PR #60's conflict resolved by merging `main` into the branch and keeping both rows: the `db` row from #60 plus the `verify` row with `main`'s new text (commit `c58e23e`).

## Not prevented yet

- The docs-index table conflict can recur on any PR that adds a doc or a command.
- Stacked PRs can still lose changes, and nothing tells Claude to check.
- Open PRs can silently fall behind `main`.
- Nothing checks `main` after a merge.

## Options for the reflecting session (not adopted)

Each is a candidate rule or change; the reflecting session decides which have enough evidence. My view is noted where I have one.

| Option | What it would be | For | Against |
|---|---|---|---|
| **A. Check mergeability before saying "ready"** | Extend the existing "before telling the user a branch is ready" line: also run `gh pr view <n> --json mergeStateStatus`; if `DIRTY` or `BEHIND`, merge `main`, resolve, re-run verify, and only then report. | Cheap; Claude does the clicking the maintainer hates; would have caught #60 before it was seen. | It cannot catch a PR that goes stale later, after it was reported ready. |
| **B. No stacked PRs** | Branch every PR from `main`. If work depends on an unmerged PR, say so and wait, or build it into that PR. | Removes failure #3 and the stacked-conflict case entirely. | Slower when work is genuinely sequential; occasionally one bigger PR. |
| **B2. If stacking is allowed, add a post-merge check** | After the base merges, retarget or re-open the stacked PR against `main`, and confirm its commits are in `main` (`git branch -r --contains <sha>` or a grep for the new content). | Keeps stacking. | Easy to forget; adds a step. |
| **C. Post-merge verification** | When the maintainer says a PR is merged, Claude fetches `main` and confirms the PR's headline changes are present (a file, a heading, a grep). | Catches #2 and #3 whatever the cause. | One more step per merge; needs a sentence on what to check per PR. |
| **D. Stop every PR editing the docs index** | Like patch notes: the index (`docs/README.md`) is updated once after merges, on request, or is generated from the files, instead of a row per PR. | Removes failure #4 for good; same pattern as the patch-notes fix. | A new doc may not be in the index for a while; or needs a small generator. |
| **E. Restructure the index** | One line per document, alphabetical, no multi-row tables, so adjacent edits are rarer. | Smaller conflict area. | Reduces, does not remove, the problem; a big edit of its own. |
| **F. Resolve conflicts with a check, not by eye** | Any conflict Claude resolves is followed by a diff of the result against both sides for dropped lines. | Directly targets failure #2. | Only helps conflicts Claude resolves, not ones clicked on GitHub. |

**My view:** A, B (or B2) and C are small, are about Claude's behaviour, and each answers a concrete incident above. D is the structural fix for the repeating docs-index conflict and matches the decision already taken for patch notes. E and F are weaker. I would take D to the maintainer as the one real design question; A to C are mostly wording.

## Questions for the reflecting session

1. Is stacking PRs ever wanted? If not, B is a one-line rule; if so, B2 plus C.
2. Should the docs index (`docs/README.md`) follow the patch-notes pattern (updated once after merges), or stay a row-per-PR table with an explicit "resolve it yourself" rule for Claude (A)?
3. Should "ready to merge" always include a mergeability check, as in A?
4. Is a post-merge check (C) something the maintainer wants Claude to do unprompted when told "I merged it"?
5. Do `DESIGN_LOG.md`, `HANDOFF.md` and `REFLECTION_LOG.md` (also shared and edited per change) belong in the same decision? No conflicts on them were observed today, only circumstantial evidence from earlier merges.

## Evidence (how to re-check)

- Item 3: `git log origin/main --oneline` shows `a59e1a2` (#57) then `e4a96c4` (#59), and `1c2baae` (the #58 commit) appears only on `reflect/guidance-cleanup`. `gh pr view 58 --json baseRefName,mergedAt` gives base `restructure/by-hero`, merged `2026-10-13T16:00:49Z`.
- Item 4: `gh pr view 60 --json mergeable,mergeStateStatus` showed `CONFLICTING` / `DIRTY` before the fix. The conflicting hunk was the `npm run verify` row in `docs/README.md`'s Tools table (#60 added a row above it; #59 changed its last cell).
- Item 2: `PATCHNOTES.md` on `main` had no `Keeper of the Wild` heading after #50; it was restored in PR #53.
