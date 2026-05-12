---
name: project-wave0-triage
description: Outcome of the Wave 0 working-tree triage that gated Wave 1 of the production-readiness push
metadata:
  type: project
---

Wave 0 (2026-05-12) cleaned ~30 uncommitted modifications + many untracked files into 9 logical commits. Branch `cursor/add-lottie-f5a82` ended with a clean working tree and 2 labeled stashes awaiting user review.

**Why:** Wave 1 (interview engine, AI negotiation drafting, approval routing, team consistency tracking) is a parallel-agent push. A clean tree was the explicit gate — agents cannot safely modify files that already had uncommitted churn.

**How to apply:** When subsequent waves stall or surface confusing diffs, check `git stash list` for `wave-0-discard-candidate:` entries first — they contain duplicate components and asset junk that the user has not yet decided on. Do not silently re-introduce them. See [[feedback-tenant-isolation]] and [[project-gate-middleware]] for the architectural threads landed in this wave.

Stashed (awaiting user decision):
- `wave-0-discard-candidate: duplicate scope-guard + portal components with no consumers` — scope-guard/{ChangeOrderPDF,ScopeFlagFeed,ScopeMeterBar}.tsx and portal/AnnotationCanvas.tsx. The first three are duplicates of code already exported elsewhere; the last duplicates approval/AnnotationCanvas.tsx which is what `DeliverableViewer` actually imports.
- `wave-0-discard-candidate: junk assets — test2.txt, duplicate logo.png files, temp_conv docx, upload/` — apps/web/public/test2.txt (1-byte stub), three copies of logo.png, the temp_conv/ docx scratchpad, and the upload/ scratch directory.
