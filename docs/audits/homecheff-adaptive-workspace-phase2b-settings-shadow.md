# HomeCheff — Phase 2B  
## Settings Workspace Root — Shadow-Mode Integration

| Field | Value |
| --- | --- |
| Date | 2026-07-18 |
| Branch | `identity/phase2-auth-foundation` |
| Base (Phase 2A) | `aeee99e` — `feat(workspace): add pure adaptive workspace resolver core` |
| Mode | **SHADOW** in non-production; **OFF** in production |
| UI writer | Existing `SettingsHubClient` (unchanged layout) |
| Verdict | Ready for Phase 2C entry (chrome occupancy adapters) |

---

## 1. Scope

Integrate Phase 2A pure core around Settings **without** changing visible layout:

- Measure Settings workspace container
- Build `ResolveInput` (`schemaVersion: 1`)
- Call `resolveWorkspaceLayout` in **shadow**
- Force `renderActivation = false` at the React boundary
- Diagnostics via `data-aw-*` attributes
- No panel placement, insets, navigation, Feed, or chrome migration

---

## 2. Reference baseline

- Branch before Phase 2B: `identity/phase2-auth-foundation`
- HEAD before Phase 2B: `aeee99e`
- Pure core: `lib/adaptive-workspace/**` (unchanged in Phase 2B)
- Pure-core tests: `npm run test:adaptive-workspace` → 33 assertions ok

---

## 3. Settings architecture (as found)

| Piece | Path | Role |
| --- | --- | --- |
| Route (SSR) | `app/settings/page.tsx` | Auth + prisma + Suspense |
| Hub client | `components/settings/SettingsHubClient.tsx` | Tabs via `?tab=`, domain UI |
| Tab model | `lib/settings/settings-hub.ts` | `SettingsTabId`, visibility |

---

## 4. Integration point

Wrap `SettingsHubClient` in `SettingsWorkspaceShadowRoot` inside `app/settings/page.tsx`.

Tab state stays inside the hub; wrapper does not read/write URL, storage, or domain state.

```
SettingsPage (SSR)
  → Suspense
    → SettingsWorkspaceShadowRoot (client)
      → SettingsHubClient (existing UI writer)
```

---

## 5. Runtime components

| File | Role |
| --- | --- |
| `components/adaptive-workspace/SettingsWorkspaceShadowRoot.tsx` | Client root: measure, resolve, diagnostics attrs |
| `components/adaptive-workspace/WorkspaceMeasurementHost.tsx` | Named seam (re-export) |
| `components/adaptive-workspace/WorkspaceDiagnosticsHost.tsx` | Named seam (types) |
| `lib/adaptive-workspace-react/settings-mode.ts` | OFF/SHADOW resolution; ON fail-closed |
| `lib/adaptive-workspace-react/normalize-workspace-measurement.ts` | Floor + coalesce + stabilityToken |
| `lib/adaptive-workspace-react/create-settings-resolve-input.ts` | ResolveInput adapter |
| `lib/adaptive-workspace-react/workspace-runtime-types.ts` | Runtime diagnostic types |

No global provider. `Providers.tsx` unchanged. No Zustand/Redux. No command/event bus.

---

## 6. Measurement model

- **One** `ResizeObserver` on the shadow root element (principal box; not `display:contents`)
- Container size = usable space (already inside existing root chrome)
- Not `window.innerWidth`, not UA, not device type
- `chromeOccupied` zeros in Phase 2B (Phase 2C supplies real occupancy)
- No chrome/profile feedback loop

---

## 7. Stability / coalescing

- Floor to integers (sub-pixel noise ignored)
- Coalesce identical floored sizes → no re-resolve
- Zero-width/height → no resolve
- `requestAnimationFrame` coalescing; cleanup on unmount
- `stabilityToken`: `settings:{w}x{h}:v1` (no time/random)
- No `window` resize listener

---

## 8. ResolveInput adapter

`createSettingsResolveInput`:

- `schemaVersion: 1` via `ADAPTIVE_WORKSPACE_SCHEMA_VERSION`
- `surfaceId: "settings"`, `primaryTask: "settings.edit"`
- `manifests: [settingsHubManifest()]`
- `availableSpace.widthPx/heightPx` = measured container (no double chrome subtract)
- `chromeOccupied` / `safeArea` zeros (documented Phase 2C handoff)
- `compatibility.mode` always `"shadow"` from the React root (never `"on"`)
- React boundary forces `renderActivation = false` regardless of plan

---

## 9. Shadow-mode contract

| Mode | Behavior |
| --- | --- |
| **OFF** | Default in `NODE_ENV=production`; no observer; no resolve |
| **SHADOW** | Default in non-production; measure + resolve; UI unchanged |
| **ON** | Coerced to **shadow** (fail closed); never production-activatable |

No query-param or browser-storage source of truth. Test-only `modeOverride` prop.

---

## 10. Single-writer proof

- Layout Plan never applied to className / grid / visibility / insets
- `renderActivation` forced false in React layer
- Existing Settings hub remains sole writer
- Source contracts + validator assert no production ON path

---

## 11. SSR / hydration

- Server render includes Settings child immediately (no measurement gate)
- Observer starts in `useEffect` only (no browser globals on SSR)
- Proven via `renderToString` tests
- Full browser hydration E2E deferred; unit/integration covers SSR HTML + stable child host

---

## 12. Child continuity / remount

- Children under stable `data-aw-settings-content` host
- No `key={profile|width|plan|mode}`
- Source contract tests enforce this
- Remount-on-resize prevented by design (coalesce + stable tree)
- Without jsdom remount counters: continuity proven structurally + coalesce proofs

---

## 13. Accessibility

- Wrapper has no landmark role
- Hub keeps its own `<nav>` / `<main>`
- Diagnostics are `data-*` only (not focusable UI)
- Focus not manipulated by workspace
- Reduced motion only forwarded into pure ResolveInput capabilities

---

## 14. Performance observations

Release-blocking checks covered by design + contracts:

- One ResizeObserver per root (single observe in effect)
- Observer disconnect + rAF cancel on unmount
- Identical measurements do not re-resolve
- No window resize listener
- Production OFF avoids observer cost

No hard ms SLO claimed without baseline.

---

## 15. Test results

| Suite | Result |
| --- | --- |
| `npm run test:adaptive-workspace` | 33 assertions ok |
| `npm run test:adaptive-workspace-react` | 12 assertions ok |
| `validate:adaptive-workspace-settings-shadow` | ok |
| Adaptive-workspace `tsc` paths | no errors |
| ESLint on Phase 2B globs | repo flat config supplies no matching TS/TSX config (pre-existing; files ignored) |

Settings hub domain tests were not expanded; wrapper does not alter hub props/URL.

---

## 16. Deferred runtime

- Real chrome occupancy (Phase 2C)
- Production ON
- Panel rendering / lifecycle / commands / events
- Notifications / Messages / Feed

---

## 17. Risks

| Risk | Mitigation |
| --- | --- |
| Accidental visual activation | Forced `renderActivation=false`; no plan→CSS |
| Observer leak | Effect cleanup disconnects RO + cancels rAF |
| Hydration mismatch from mode | Mode from `NODE_ENV` only; production OFF |
| Chrome double-count later | Documented zeros; Phase 2C adapters |
| Remount via keys | Source contracts forbid profile/width keys |

---

## 18. Phase 2C entry criteria

- Shadow root stable
- OFF/SHADOW proven
- No hydration gate on Settings content
- Observer cleanup proven (effect cleanup)
- Pure core green
- No Feed impact

**Next:** PHASE 2C — Chrome occupancy & inset adapters (still shadow-first).

---

## 19. Repository hygiene

Only Phase 2B paths committed:

- `components/adaptive-workspace/**`
- `lib/adaptive-workspace-react/**`
- `app/settings/page.tsx`
- `package.json` (scripts)
- `scripts/validate-adaptive-workspace-settings-shadow.ts`
- `docs/audits/homecheff-adaptive-workspace-phase2b-settings-shadow.md`

Unrelated working-tree files left untouched. Pure core `lib/adaptive-workspace/**` not modified.
