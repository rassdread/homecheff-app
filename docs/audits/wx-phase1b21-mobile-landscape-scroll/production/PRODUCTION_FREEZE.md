# WX Phase 1B.2.1 — Mobile Landscape Scroll Fix  
## Production Incident Freeze

**Verdict:** `WX_PHASE_1B2_1_MOBILE_LANDSCAPE_SCROLL_PRODUCTION_SUCCESS`  
**Status:** `PRODUCTION_FROZEN`  
**Freeze timestamp (UTC):** see `production-freeze-pack.json`

---

## Runtime vs documentation

| Layer | Hash |
| --- | --- |
| Production runtime (merge) | `3ddaf59cfd1e95f2276a165cd81807f3de289849` |
| Deployed `gitCommitSha` | `3ddaf59cfd1e95f2276a165cd81807f3de289849` |
| Documentation freeze commit | *(this commit — recorded after push)* |
| Rollback runtime | `5fe0da7855ab7bbf9c4bd6a03f3dca80a423acc4` |
| Pre-merge `origin/main` | `a17cbbf6ff58d3010d3911a5917c7706c0bc6524` |

---

## Lineage

| Item | Value |
| --- | --- |
| Branch | `wx/phase-1b2-1-mobile-landscape-scroll` |
| Implementation | `d1e9b90b8b473f8c31e2234afcf2df7638ad0fee` |
| Evidence | `4642f83852199e8bc7e5214b43adfb81097ce8d7` |
| Formal review | `WX_PHASE_1B2_1_SCROLL_FIX_REVIEW_PASS_WITH_WARNINGS` |
| Merge parents | `a17cbbf6…` + `4642f838…` |
| Merge method | `git merge --no-ff` (ort) · no force push · no conflicts |

---

## Deployment

| Field | Value |
| --- | --- |
| Vercel project | `homecheff-app` (`prj_V0aZoSgSjd8dJKM0YtWkAKI88NLV`) |
| Deployment ID | `dpl_A3vWYojNUsrMG8ykkVCKUL7euiZ6` |
| URL | `https://homecheff-f0tt5ek6n-sergio-s-projects-f7b64ee1.vercel.app` |
| Aliases | https://homecheff.eu · https://homecheff.nl · www variants |
| Target | production · READY |

---

## Live proof summary

- Touch-first landscape scroll PASS on 844×390, 932×430, 812×375, 740×360  
- Scroll owner: `#homecheff-feed-desktop` / `[data-aw-primary-feed]`  
- Orientation journey PASS · mounts stable · no reload  
- Desktop matrix includes **1280** and **1440** (plus 1920 / 2560)  
- `homecheff.nl` landscape touch smoke PASS  
- GeoFeed owner unchanged · phase remains `1b.2` · no 1B.3 runtime  

Sample (740×360): feed `clientHeight=113`, `scrollHeight=2608`, touch-drag `0 → 305`.

---

## Bounded warnings (production reassessment)

1. **1280/1440 matrix gap** — closed in live Production evidence.  
2. **Programmatic scrollTop gates** — live gates require touch-drag.  
3. **Global `h-full` on Region/Slot/Panel** — no zero-height / nested-scroll regression observed on portrait, tablet, or desktop live matrix. Remains safe; track if Settings pilot shows odd fill behaviour.  
4. **Short landscape viewport** — feed remains touch-scrollable to later content; ergonomic density limitation deferred to WX 1B.4 (menu compaction). **Not a freeze blocker.**

---

## Rollback

Revert merge `3ddaf59c` and/or redeploy runtime `5fe0da78`. No DB/data migration. Do not promote 1B.3/1B.4 during rollback.

---

## STOP

Do not promote WX Phase 1B.3.  
Do not begin WX Phase 1B.4.  
Do not implement landscape menu removal.
