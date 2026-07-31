# WX Phase 1B.2 — Promotion Guard Blocker Remediation

**Status:** `READY_TO_RESTART_PROMOTION_FROM_GATE_1`  
**Verdict:** `WX_PHASE_1B2_PROMOTION_BLOCKER_REMEDIATED`  
**Timestamp (UTC):** 2026-07-31T15:50:00Z (approx.)

| Field | Value |
| --- | --- |
| Original blocked tip | `464267423e7d3011c1b7638d44411fc930ba5a0f` |
| Remediation Commit C | `686f0ee1aaab3ebcbca20f9fa67edc88804f70a2` |
| Evidence Commit D | a72910afb6569835b3d543bdb4957ecbec24e7f3 |
| Production / unchanged | `0a0299408b5e531f1971d97c6cfe9bb0b95f721d` |
| Branch | `wx/phase-1b2-transition-continuity` |
| Merge | **no** |
| Deploy | **no** |
| Freeze | **no** |
| Phase 1B.3 / 1B.4 | **not started** |

---

## Root cause

Gate 2 failed on:

```bash
npm run test:adaptive-workspace-react
→ run-feed-workspace-visibility-tests.ts
```

Stale source guard required literal `aw-slot-primary` in `FeedWorkspaceVisibleLayout.tsx`.  
Phase 1B.2 correctly uses `key={WORKSPACE_TRANSITION_CONTINUITY.primarySlotKey}` with contract value `"aw-slot-primary"`.

Runtime behaviour was already correct; the guard was implementation-fragile.

---

## Guard change

**File:** `lib/adaptive-workspace-react/tests/run-feed-workspace-visibility-tests.ts` only.

### Layer 1 — source usage
- Require exact `key={WORKSPACE_TRANSITION_CONTINUITY.primarySlotKey}` (exactly once)
- Exactly one `data-aw-slot-host="primary"`
- Reject Mode/posture keys, random/time keys, duplicated literal `key="aw-slot-primary"`

### Layer 2 — contract value
- Import `WORKSPACE_TRANSITION_CONTINUITY`
- Assert `primarySlotKey === "aw-slot-primary"`
- Assert `neverKeyPrimaryByMode === true`

### Negative fixtures (synthetic)
1. Mode-dependent key rejected  
2. Random key rejected  
3. Local unapproved constant rejected  
4. Alternate literal rejected as continuity expression  
5. Contract drift to `aw-slot-other` rejected  
6. Duplicate primary hosts fail single-host count  
7. Literal-only primary without continuity constant rejected  

---

## Runtime behaviour impact

```
git diff --name-only 46426742..686f0ee1
→ lib/adaptive-workspace-react/tests/run-feed-workspace-visibility-tests.ts
```

**Runtime implementation byte-for-byte unchanged.**  
Existing Phase 1B.2 browser-proof claims remain valid (not re-run; not rewritten).

---

## Validation (Commit C)

| Command | Result |
| --- | --- |
| `npx tsx …/run-feed-workspace-visibility-tests.ts` | PASS (21) |
| `npm run test:adaptive-workspace-react` | PASS |
| `npm run test:workspace-transition-continuity` | PASS — 9 groups · 31 vectors · 11 assertions · 14 pairs · 720/1024/1440 |
| `npm run test:workspace-mode-engine` | PASS |
| `npm run test:adaptive-workspace` | PASS |
| `npm run lint` | PASS |
| `npm run smoke-check` | PASS |

---

## Ownership / architecture

Unchanged: GeoFeed, Controlled Host, single mount/writer/renderer, no capability activation, no Mode React keys, no CSS/nav/landscape changes.

---

## Next step

Restart promotion authorization **from Gate 1** at tip including Commit C (+ Commit D after push).

**STOP** — do not merge/deploy/freeze/1B.3 from this remediation.
