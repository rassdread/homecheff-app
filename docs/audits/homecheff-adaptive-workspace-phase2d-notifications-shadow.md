# HomeCheff — Phase 2D  
## Notifications Panel Contract — Shadow-Mode Integration

| Field | Value |
| --- | --- |
| Date | 2026-07-19 |
| Branch | `identity/phase2-auth-foundation` |
| Base (Phase 2C) | `0bc5a88` — `feat(workspace): add chrome occupancy shadow adapters` |
| Mode | SHADOW diagnostics only |
| Notifications UI writer | Existing `/notifications` page + `NotificationBell` (unchanged) |

---

## 1. Scope

Model Notifications as a declarative supporting/transient workspace capability inside the Settings shadow pilot — **without** rendering panels, opening/closing inbox UI, or touching Domain State.

---

## 2. Reference baseline

- Branch: `identity/phase2-auth-foundation`
- HEAD before Phase 2D: `0bc5a88`
- Pure core / 2B / 2C green before start

---

## 3. Existing Notifications topology

| Surface | Reality |
| --- | --- |
| Inbox | Full-page route `app/notifications/page.tsx` (client) |
| Bell | `NotificationBell` → `router.push('/notifications')` — **no drawer/popover** |
| Toasts | Separate dock (`.hc-toast-dock`) — not inbox presentation |
| Prefs | Settings hub `NotificationSettings` — domain prefs, not inbox panel |

No production open/closed panel presentation state exists for the inbox.

---

## 4–5. State ownership

| Category | Owner |
| --- | --- |
| **Domain State** (records, unread, mark-as-read, API, SWR) | `hooks/useNotifications`, page `useSessionSwr`, `/api/notifications/**`, `NotificationBell` badge fetch |
| **Presentation State** (inbox visible) | Next.js route `/notifications` |
| **Workspace Intent** (Phase 2D) | Fixture/test `NotificationsPresentationIntent` → `panelRequests` only |

Workspace never owns A or B.

---

## 6. Shadow integration model

```
SettingsWorkspaceShadowRoot
  → container measurement + chrome occupancy (2B/2C)
  → createSettingsNotificationsResolveInput
       (settings.hub + notifications.inbox manifests;
        panelRequests only when presentation override requests open)
  → resolveWorkspaceLayout (shadow)
  → data-aw-notifications-* diagnostics
  → SettingsHubClient remains UI writer
```

Default runtime presentation: **closed** (no panelRequests).  
Open scenarios: **test/dev override only** — not wired to bell, route, or unread.

---

## 7. Widget Manifest

| Field | Value |
| --- | --- |
| id | `notifications.inbox` |
| statePreservationKey | `notifications.inbox` |
| preferredRegion | `supporting-end` |
| allowedPanelModes | `rail`, `sheet`, `overlay` |
| canBePrimary | `false` (Settings pilot) |
| collapseBehavior | `to-sheet` |
| canOverlay | `true` |
| canPersist / canFloat | `false` |

Pure core: `notificationsInboxManifest()` in `lib/adaptive-workspace/registry/settings-manifests.ts`.

---

## 8. Panel Request adapter

`createNotificationsPanelRequest(intent)`:

- closed → `[]`
- open → `{ widgetId, intent: "open", preferredMode? }`
- unsupported mode → warning, open without preferredMode
- pin → unsupported (product has no pin); warning; no pin request
- close → `{ intent: "close" }`
- deterministic; no Domain State payload

---

## 9. Profile × mode matrix (Settings + open)

| Profile | Result |
| --- | --- |
| COMPACT closed | no notifications placement |
| COMPACT open (prefer rail) | transient **sheet/overlay** |
| COMFORT open | **rail** @ supporting-end |
| EXPANDED open | **rail** @ supporting-end |
| PROFESSIONAL open | **rail**; primary stays `settings.hub` |
| H_SHORT open | primary kept; preservation key stable |

Always: exactly one stage (`settings.hub`); `renderActivation: false` in shadow.

---

## 10–13. Intents

| Kind | Behavior |
| --- | --- |
| Focus | Rail: no trap. Sheet: `panel.requiresFocusTrap` (+ closeContract). Plan-level trap only for modal (pure core). |
| Transition | Reduced motion → `none`; else relocate/reveal family from resolver |
| Lifecycle | Placed → `VISIBLE`; mode change does **not** yield DESTROYED |
| DecisionTrace | placed/rejected reasons; no Domain State |

---

## 14–16. Single-writer / continuity

- Workspace does not open/close Notifications, mount panels, run focus/lifecycle, or mutate bell/badge/API.
- Settings child host has no profile/notifications keys; one container ResizeObserver.
- Notifications UI files unchanged and do not import adaptive-workspace.

---

## 17–20. SSR / a11y / perf / diagnostics

- SSR: Settings content immediate; notifications attrs present with closed baseline until client resolve.
- A11y: no focus trap/ARIA mutation from Workspace.
- Perf: no extra RO for Notifications.
- Diagnostics: `data-aw-notifications-{candidate,request,mode,region,placement,collapse,focus-intent,transition-intent,lifecycle-intent,preservation-key,diagnostic-codes}`.

---

## 21–22. Tests / pure-core changes

| Suite | Script |
| --- | --- |
| Phase 2D | `npm run test:adaptive-workspace-notifications` |
| Validator | `validate:adaptive-workspace-notifications-shadow` |

Pure-core change: add `notificationsInboxManifest` + export `PanelRequest` type. No resolver algorithm changes. Regression: 33 pure assertions remain green.

---

## 23–25. Deferred / risks / Phase 2E

Deferred: production panel renderer, route-as-surface primary for `/notifications`, read-only observation of future open-state, Messages.

Risks: inventing drawer UX that doesn't exist; mitigated by fixture-only open intent.

**Next:** PHASE 2E — Messages split/stage contract — shadow integration.

Entry: manifest/mode/focus/lifecycle/single-writer green; no Domain State leak; 2B/2C/2D green; production ON off.

---

## 26. Hygiene

Commit only Phase 2D paths. Unrelated working-tree files untouched. No Notifications UI file edits. No Feed/Messages.
