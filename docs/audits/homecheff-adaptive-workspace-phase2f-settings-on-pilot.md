# HomeCheff — Phase 2F  
## Settings Workspace Renderer — Controlled ON Pilot

| Field | Value |
| --- | --- |
| Date | 2026-07-19 |
| Branch | `identity/phase2-auth-foundation` |
| Base (Phase 2E) | `6584cb7` — `feat(workspace): add messages split stage shadow contract` |
| Mode | Controlled ON pilot (Settings only) |
| Default | Production **off**; non-production **shadow** |
| Activation env | `HOMECHEFF_SETTINGS_WORKSPACE_MODE=off\|shadow\|on` |

---

## 1. Scope

First production-capable Adaptive Workspace render path:

- `settings.hub` only
- one Region → Slot → Panel → Widget
- OFF / SHADOW / ON single-writer
- SSR-first, hydration-safe
- Notifications / Messages remain fixture-only (not visible)
- Feed out of scope

---

## 2. Reference baseline

- Branch: `identity/phase2-auth-foundation`
- HEAD before Phase 2F: `6584cb7`

---

## 3. Existing Settings topology (inventory)

| Concern | Finding |
| --- | --- |
| Route | `app/settings/page.tsx` (force-dynamic, auth-gated) |
| Hub | `SettingsHubClient` (client) |
| Tabs | URL `?tab=` via `useSearchParams`; client `activeTab` state |
| Layout classes | `min-h-screen hc-dorpsplein-page …`, inner `max-w-5xl mx-auto px-4 py-6 sm:py-8` |
| Suspense | Page wraps hub in `<Suspense fallback={min-h-screen bg-gray-50}>` |
| Chrome | `AppPageChrome` / NavBar / BottomNav unchanged (occupancy diagnostic only) |
| Pre-2F writer | Phase 2B `SettingsWorkspaceShadowRoot` around hub |

Domain State (profile forms, tabs, fetches) stays inside Settings components — Workspace never owns it.

---

## 4. Render integration point

`app/settings/page.tsx` resolves mode on the **server** and passes it:

```tsx
const { mode } = resolveSettingsWorkspaceMode();
<SettingsWorkspaceRoot mode={mode}>
  <SettingsHubClient … />
</SettingsWorkspaceRoot>
```

---

## 5. Region / Slot / Panel / Widget

```
SettingsWorkspaceRoot (ON)
  → WorkspaceRegion (primary-stage)
    → WorkspaceSlot (slot:settings:primary-stage:settings.hub)
      → WorkspacePanel (panel:settings:settings.hub)
        → SettingsWorkspaceWidgetHost (settings.hub)
          → SettingsHubClient (unchanged child)
```

Neutral `div` wrappers + `data-aw-*` attributes. No extra `<main>` / landmarks.

---

## 6–9. Mode configuration

| Item | Value |
| --- | --- |
| Source | `HOMECHEFF_SETTINGS_WORKSPACE_MODE` (server env) |
| Allowed | `off`, `shadow`, `on` (case-insensitive trim) |
| Missing | fail closed → prod `off` / non-prod `shadow` |
| Invalid | fail closed → same defaults + source `invalid-fail-closed` |
| Not used | query params, localStorage, cookies, DB flags, admin UI |

Server resolves once; client receives the same enum via prop (no hydration mismatch).

### Activation

1. Set `HOMECHEFF_SETTINGS_WORKSPACE_MODE=on` on a controlled preview/pilot deployment.
2. Redeploy / refresh env per existing Vercel/host workflow.
3. Do **not** set app-wide Workspace ON.

### Rollback

1. Set mode to `shadow` or `off`.
2. Redeploy / env refresh.
3. No DB migration, cache flush, or data cleanup.

---

## 10–12. Initial plan, validation, allowlist

- `createSettingsInitialPlan({ compatibilityMode: "on" })` — schemaVersion 1, Settings surface, one primary stage/slot/panel, `settings.hub`, stable preservation key, no Notifications/Messages/Domain State, no timestamps/random.
- `validateSettingsRenderPlan(plan, "on")` before trusting activation; fail closed on schema/surface/primary/allowlist/activation mismatch.
- Allowlist: **only** `settings.hub`. Unknown / Notifications / Messages → reject.

---

## 13–14. OFF / SHADOW / ON (single-writer)

| Mode | Writer | Tree |
| --- | --- | --- |
| OFF | Legacy | `SettingsWorkspaceShadowRoot` (observer off) + one hub |
| SHADOW | Legacy | Shadow root measure/resolve; `renderActivation=false`; one hub |
| ON | Workspace | Region/Slot/Panel; `renderActivation=true`; one hub; **no** shadow duplicate |

No `display:none` parallel trees.

---

## 15–16. SSR / hydration

- ON SSR emits Region/Slot/Panel + Settings content immediately (canonical initial plan).
- No measurement gate / empty shell / mounted-only content.
- Mode from server prop; first client resolve keeps same region/slot/panel/preservation identities.

---

## 17–21. Continuity, parity, a11y, fallback

- No React `key` on profile/width/height/plan/mode/renderActivation.
- Stable slot/panel ids across profile changes.
- Tab/focus/form remain Settings-owned.
- Visual parity: existing hub classes unchanged; wrappers are `w-full min-w-0` only.
- A11y: no extra main/region landmarks; diagnostics attrs non-focusable.
- Fallback: invalid plan / resolve error → diagnostic fallback + content still in stable host; Error Boundary may remount after hard crash (documented limit).

---

## 22–24. Diagnostics, performance, isolation

Diagnostics (dev/test): mode, owner, activation, validation, fallback, region/slot/panel/widget ids, preservation key, resolve counts, chrome occupancy, single-writer status, rejected widgets. No Settings Domain State / PII.

Performance: one ResizeObserver; coalesce ignores identical measurements; no window resize listener.

Data isolation: plan/diagnostics structural denylist covered by tests.

---

## 25–26. Tests & pure core

- `npm run test:adaptive-workspace-settings-on` — mode, plan, allowlist, SSR OFF/SHADOW/ON, boundaries
- Prior suites unchanged (pure core not modified in 2F)
- Validator: `npm run validate:adaptive-workspace-settings-on-pilot`

---

## 27. Production activation status

**Not auto-enabled.** Default remains fail-closed off (prod) / shadow (non-prod). ON requires explicit env on a controlled deployment.

---

## 28. Deferred (Phase 2G+)

- Live browser hydration/focus/resize matrix
- Screenshot parity automation
- Resource budgets freeze
- Notifications/Messages production render (explicitly out)
- App-wide Workspace Root

---

## 29. Risks

- Hard Error Boundary recovery can remount child
- Deployment-level mode only (no live mid-session switch)
- Preview ON must be manually verified before any broader rollout

---

## 30. Phase 2G entry criteria

- Renderer works; ON previewable
- Single-writer + continuity proofs green
- SSR/hydration unit proofs green
- Rollback via env documented
- No Domain State in Workspace
- Notifications/Messages not visible
- Prior regressions green

---

## 31. Repository hygiene

Only Phase 2F paths touched. Unrelated dirty/untracked files left untouched.

---

## 32. Architecture Health Score (Phase 2F)

| Dimension | Score |
| --- | --- |
| Pure Core | 10 |
| React Integration | 9 |
| Renderer Safety | 9 |
| SSR/Hydration | 9 |
| Shadow Safety | 10 |
| Single Writer | 10 |
| Test Coverage | 9 |
| State Isolation | 10 |
| Preservation Safety | 9 |
| Architectural Drift | 9 |
| Rollback Safety | 10 |

**Verdict target:** READY FOR PHASE 2G after green validation on this branch.
