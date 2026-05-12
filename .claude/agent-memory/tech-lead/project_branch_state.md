---
name: project-branch-state
description: Production-readiness push lives on cursor/add-lottie-f5a82; diverged 11 ahead / 2 behind origin/main at Wave 0 end
metadata:
  type: project
---

The 4-wave production-readiness push is happening on branch `cursor/add-lottie-f5a82`, not `main`. At the end of Wave 0 (2026-05-12) the branch was **11 commits ahead** of `origin/main` and **2 behind**.

**Why:** The branch name is misleading (it sounds like a one-off Lottie cleanup) but it has accumulated Sprints E + F + brutal-audit + Wave 0 housekeeping. The user has not asked for a rebase or merge; the divergence is intentional during the push.

**How to apply:**
- Do NOT push or force-push without explicit instruction.
- Do NOT rebase onto main during the push — agents in parallel waves rely on a stable tip.
- When the user is ready to integrate, do a regular merge (or PR) rather than a rebase — the history is already linear within the branch and Wave 0 left clean conventional-commit messages.
- The 2 commits behind on main are unknown to me at Wave 0 close — verify with `git log origin/main..HEAD` / `HEAD..origin/main` before any merge.
