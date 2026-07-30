# Close-out File Classification

Classification performed during Adaptive Workspace production release close-out.
Actions apply to what is committed onto `main`; Category D files remain untouched in the primary worktree.

## Worktrees

| Path | Branch | HEAD | Dirty? | Purpose | Required? |
| --- | --- | --- | --- | --- | --- |
| `/Users/sergioarrias/Homecheff-app git` | `phase-aw-visible-workspace-preview` | `cbf7b6eb` | Yes | Primary repo | Yes (switch to main after close-out) |
| `/Users/sergioarrias/homecheff-p0-native-google-release` | `main` | `7f071b92` | Yes (unrelated untracked) | Main release worktree | Yes (close-out target) |
| `/Users/sergioarrias/homecheff-geo-feed-audit` | `fix/feed-prefetch-smooth` | `2b66362a` | No | Unrelated feature | Keep |
| `/Users/sergioarrias/homecheff-navbar-adaptive-fix` | `fix/adaptive-responsive-navbar` | `a8332a2c` | No | Unrelated feature | Keep |
| `/Users/sergioarrias/homecheff-r1-first-paint-release` | `release/r1-first-paint-wave2` | `c17f324b` | No | Unrelated release | Keep |

## Category A — Required release record (commit to main)

| File | Reason | Keep | Commit target | Action |
| --- | --- | --- | --- | --- |
| `docs/audits/aw-visible-workspace-production-activation/RELEASE_RECORD.md` | Authoritative activation record | Yes | main | Commit |
| `docs/audits/aw-visible-workspace-production-activation/SCREENSHOT_INDEX.md` | Screenshot map | Yes | main | Commit |
| `docs/audits/aw-visible-workspace-production-activation/ARTIFACT_MANIFEST.json` | SHA-256 artifact manifest | Yes | main | Commit |
| `docs/audits/aw-visible-workspace-production-activation/FILE_CLASSIFICATION.md` | Close-out classification | Yes | main | Commit |
| `docs/audits/aw-visible-workspace-production-activation/gate1-local-proof/**` | Gate 1 evidence | Yes | main | Commit |
| `docs/audits/aw-visible-workspace-production-activation/gate5-off-parity/**` | Gate 5 OFF parity | Yes | main | Commit |
| `docs/audits/aw-visible-workspace-production-activation/gate7-preview-proof/**` (excl. probe-run.log) | Gate 7 Preview proof | Yes | main | Commit |
| `docs/audits/aw-visible-workspace-production-activation/gate10-production-smoke/**` | Gate 10 Production smoke | Yes | main | Commit |
| `FREEZE_RECORD.md` (later commit) | Freeze record | Yes | main | Commit after close-out |

## Category B — Reusable proof tooling (commit to main)

| File | Reason | Keep | Commit target | Action |
| --- | --- | --- | --- | --- |
| `scripts/probe-feed-workspace-visibility.mjs` | Deployed-Preview helpers: optional protection-bypass via env/CLI arg (no hardcoded secret), vercel.live CSP noise filter, Gate-7 resize includes 1920×1080; CLI-only; no runtime ownership change | Yes | main | Commit (separate tooling commit) |

## Category C — Temporary release instrumentation (do not commit)

| File | Reason | Keep | Commit target | Action |
| --- | --- | --- | --- | --- |
| `docs/audits/aw-visible-workspace-production-activation/gate7-preview-proof/probe-run.log` | One-off probe stdout log | Local only | none | Do not stage |

## Category D — Unrelated / pre-existing (untouched)

All other untracked files in the primary worktree (architecture docs, phase30/prisma/performance audits, unrelated probe scripts, backup JSON, etc.) and main worktree `docs/audits/homecheff-workspace-topology-audit.md` remain untouched.
