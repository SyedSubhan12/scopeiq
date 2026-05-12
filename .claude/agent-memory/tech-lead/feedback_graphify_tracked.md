---
name: feedback-graphify-tracked
description: graphify-out/cache JSON files are tracked in git; rebuild and commit after code changes
metadata:
  type: feedback
---

`graphify-out/cache/*.json` and `graphify-out/converted/*.md` are tracked in source control (not gitignored). The wiki + knowledge graph in `graphify-out/` are the canonical answer to architecture questions per the top-level `CLAUDE.md`.

**Why:** Subsequent agent runs prefer the graph over reading raw files. If the graph drifts from the source tree, agents either skip the graph (slow) or answer from stale data (wrong). A single Wave 0 batch added 350 cache JSONs after a Sprint F rebuild; that pattern will repeat.

**How to apply:**
- After a non-trivial code change (multiple files in `apps/` or `packages/`), rebuild before commit:
  `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`
- Commit cache JSONs in a dedicated `chore(graphify):` commit — do not mix with feature commits.
- Do NOT gitignore `graphify-out/cache/`. The committed graph is the contract.
