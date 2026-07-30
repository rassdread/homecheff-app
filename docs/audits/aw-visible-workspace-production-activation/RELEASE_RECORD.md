# Adaptive Workspace — Controlled Production Activation Record

**Final verdict:** `ADAPTIVE_WORKSPACE_PRODUCTION_SUCCESS`  
**Production activation:** Succeeded.  
**Workspace visibility:** `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=on`  
**Production URLs:** https://homecheff.eu · https://homecheff.nl  
**Production verification timestamp (UTC):** 2026-07-30T22:40:00Z (Gate 10 smoke PASS; clean ON redeploy followed)  
**Authority scope:** Presentation-only activation. Adaptive Workspace owns layout/AvailableSpace/rails/panels only. GeoFeed remains the sole runtime and data owner. Controlled Host remains `COMMIT_READY`. Controlled Host `ACTIVE` was not authorized. Writer/request/cache/pagination/observer authority was not transferred.  
**Sealed instrumentation:** Temporary Production `NEXT_PUBLIC_FEED_SEALED_BASELINE` was used only for Gate 10 counters, then **removed**. Production runs **without** sealed proof instrumentation.  
**Rollback:** Environment-based and immediate — set Production visibility to `off`/unset and redeploy the same merge commit (preferred). Revert merge only if OFF path itself is broken. Never force-push main.

---

## Git

| Field | Value |
| --- | --- |
| Release branch | `phase-aw-visible-workspace-preview` |
| Release branch tip | `cbf7b6ebf6abae4da7d9a36428a3be48f281b6ea` |
| Pre-merge `origin/main` | `929bc67ca25a037f9d2e53c5606f5e695e0ab6d1` |
| Merge commit | `7f071b929c937bbb7e3a227ca8f24e97101d3858` |
| Merge parents | `929bc67c…` + `cbf7b6eb…` |
| Merge message | `feat(adaptive-workspace): merge visible presentation workspace with stable GeoFeed mount` |
| Remote main after push | `7f071b929c937bbb7e3a227ca8f24e97101d3858` |
| Merge style | `--no-ff` (history preserved) |
| Force push | No |

Hardening commits included: `0eb7b115`, `80dbc6c0`, `c71efcd7`, `cbf7b6eb`.

---

## Environment modes by gate

| Gate | Production `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE` | Preview mode | Notes |
| --- | --- | --- | --- |
| 1–5 | unset / off | n/a | Merged code live; presentation OFF |
| 6–7 | unset / off | `preview` | Preview isolated; query `?awFeedWorkspace=1` required |
| 8 | unset / off | `preview` | Readiness decision only |
| 9–10 | `on` | `preview` | Production ON; no query required |
| Post-smoke clean | `on` | `preview` | Removed temporary Production `NEXT_PUBLIC_FEED_SEALED_BASELINE` |

`NEXT_PUBLIC_FEED_SEALED_BASELINE=1` was Preview-only for Gate 7, temporarily Production for Gate 10 smoke counters, then removed from Production. Preview retains sealed baseline for future proofs.

---

## Deployments

| Gate | Role | Deployment ID | URL / alias |
| --- | --- | --- | --- |
| 4 | Production OFF | `dpl_6FbjmWaP7cqRuK2QPy54PourYfcL` | `homecheff.eu` (at that time) |
| 6–7 | Preview proof | `dpl_b4wPQvPaUrEm5p9MkbFvaNu8nBm5` | https://homecheff-hstyb4hrm-sergio-s-projects-f7b64ee1.vercel.app |
| 9–10 smoke | Production ON (+ sealed) | `dpl_BJX8zqQxPiH7njjdE3J4nePkDH76` | `homecheff.eu` during smoke |
| Post-smoke | Production ON (clean) | `dpl_2PX82MnkeL1aYJqwfYUjGZQMeG9r` | `homecheff.eu` (current) |

All production deployments used merge commit tree `7f071b92`. No unrelated application code change during activation.

---

## Gate results

| Gate | Result |
| --- | --- |
| 1 Pre-merge revalidation | `PRE_MERGE_REVALIDATION_PASS` |
| 2 No-ff merge | `POST_MERGE_LOCAL_PASS` |
| 3 Push main | `MAIN_PUSH_PASS` |
| 4 Production deploy OFF | PASS |
| 5 Production OFF parity | `PRODUCTION_OFF_PARITY_PASS` |
| 6 Preview isolation | PASS (`preview` Preview-only; Production OFF) |
| 7 Deployed Preview proof | `DEPLOYED_PREVIEW_PASS` |
| 8 Readiness | `READY_TO_ENABLE_PRODUCTION_WORKSPACE_PRESENTATION` |
| 9 Production ON | Enabled + redeployed same commit |
| 10 Production smoke | `PRODUCTION_WORKSPACE_ACTIVATION_PASS` |

Artifacts:

- `ARTIFACT_MANIFEST.json` — deterministic SHA-256 manifest (does not self-hash)
- `SCREENSHOT_INDEX.md` — viewport → file map (Preview vs Production distinguishable by gate path)
- `FILE_CLASSIFICATION.md` — close-out classification
- `gate1-local-proof/`
- `gate5-off-parity/`
- `gate7-preview-proof/` (screenshots + `chromium-proof.json`; `probe-run.log` excluded as temporary)
- `gate10-production-smoke/` (screenshots + `production-smoke.json`)

### Final Production aliases (clean ON)

Deployment `dpl_2PX82MnkeL1aYJqwfYUjGZQMeG9r` → `homecheff.eu`, `homecheff.nl`, `www.homecheff.eu`, `www.homecheff.nl`, plus project Vercel aliases.

---

## Proof metrics (Preview Gate 7 + Production Gate 10)

| Metric | Preview (with query) | Production ON (`/`) |
| --- | --- | --- |
| Viewport matrix | PASS (11) | PASS (7 required) |
| Continuous resize | PASS | PASS |
| GeoFeed mounts | 1 | 1 |
| GeoFeed unmounts | 0 | 0 |
| Request identity transitions | 0 (`fbd314f0`) | 0 (`fbd314f0`) |
| Feed data owner | `geofeed` | `geofeed` |
| QHD usable width | ~2528 | ~2528 |
| Feed column | ≤720 | ≤720 |
| Desktop-wide rails | 2 | 2 |
| Hydration warnings | 0 | 0 |
| Release-blocking console errors | 0 | 0 |
| Horizontal overflow | none | none |

Known non-blocking Preview noise: CSP blocks `vercel.live/_next-live/feedback/feedback.js` (Preview tooling only).

Fail-closed Preview without query: legacy sticky, no AW markers (Gate 7 laptop off-check).

---

## Ownership matrix (unchanged)

| Concern | Owner |
| --- | --- |
| Feed requests / identity / cache / pagination / filters / observers / scroll / loading / skeletons / tiles | **GeoFeed** |
| Presentation layout / AvailableSpace / grid / panel visibility / placement / responsive mode | **Adaptive Workspace** |
| Controlled Host machine state | **COMMIT_READY** (ACTIVE not authorized) |

This release did **not** transfer writer, request, cache, pagination, or observer authority. GeoFeed was not retired. No second GeoFeed / second request owner.

---

## Rollback

**Preferred (flag):** set Production `HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE=off` (or remove) → redeploy same commit → legacy presentation returns.

**If OFF path itself is broken:** revert merge commit `7f071b92` on main and push (no force-push).

Rollback was **not** required. Path verified by Gate 5 OFF parity + documented procedure.

---

## Known debt

- Historical sealed Adaptive Workspace import warnings (`Attempted import error` / identity export mismatches) remain **known metadata debt**, not visibility blockers.
- Controlled Host remains `COMMIT_READY`; `COMMIT_READY → ACTIVE` was not touched.

## Next phase boundary (not started)

Recommended title only: **Controlled Host Runtime Activation Authority Reassessment**.  
Still not authorized: Host ACTIVE, GeoFeed request/writer/cache/pagination/observer ownership transfer, GeoFeed retirement, full runtime-host activation.

---

## Final Production state

| Field | Value |
| --- | --- |
| Visibility mode | `on` |
| Domain | https://homecheff.eu |
| Deployment | `dpl_2PX82MnkeL1aYJqwfYUjGZQMeG9r` |
| Commit | `7f071b929c937bbb7e3a227ca8f24e97101d3858` |
| Sealed baseline on Production | **removed** after smoke |
| Rollback status | not triggered |
