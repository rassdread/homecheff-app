# HomeCheff — Phase 2C  
## Chrome Occupancy & Inset Adapters — Shadow-Mode Integration

| Field | Value |
| --- | --- |
| Date | 2026-07-19 |
| Branch | `identity/phase2-auth-foundation` |
| Base (Phase 2B) | `08443c0` — `feat(workspace): add settings shadow root integration` |
| Model | **A — container-first** |
| Mode | SHADOW diagnostics only; production OFF |
| Chrome writers | Unchanged NavBar / BottomNavigation / AppPageChrome |

---

## 1. Scope

Add a read-only, versioned chrome occupancy snapshot so Settings Shadow Root can populate `AvailableSpace.chromeOccupied` accurately **without** changing usable `widthPx`/`heightPx` or any visible layout.

---

## 2. Reference baseline

- Branch: `identity/phase2-auth-foundation`
- HEAD before Phase 2C: `08443c0`
- Pure core + Phase 2B tests green before start

---

## 3. Existing chrome topology (evidence)

| Piece | Position | vs Settings measure |
| --- | --- | --- |
| NavBar | In-flow (`lg:sticky`); `h-16` / `--hc-navbar-height: 4rem` | **Outside** measure root (above `AppPageChrome`) |
| AppPageChrome | In-flow; `padding-bottom` for bottom nav on `max-lg` | Parent of Settings; pad does not shrink measure box |
| BottomNavigation | `fixed` overlay + flow spacer | Overlaps visually; clearance via chrome pad |
| Footer | In-flow after `main` | Outside Settings measure; not fixed occupancy |

Sources: `app/layout.tsx`, `components/AppPageChrome.tsx`, `components/NavBar.tsx`, `components/navigation/BottomNavigation.tsx`, `lib/layout/bottomNavInset.ts`, `lib/bottomNavRoutes.ts`.

---

## 4. Chosen model: **container-first (A)**

- Measured Settings container = usable space (Preference B).
- Occupancy fills diagnostic `chromeOccupied` fields.
- `appliedToUsableSpace: false` always.
- Pure resolver does not subtract chrome again.

**Rejected Model B** (raw + subtract): would double-count NavBar (already outside box) and risk double-counting bottom clearance already expressed as AppPageChrome pad.

---

## 5. Source of truth

| Input | Source |
| --- | --- |
| Top height | Policy constant `64` (`--hc-navbar-height`) |
| Bottom height | Policy constant `92` (`5.75rem`) when bottom nav occupying |
| Bottom visibility | Existing `isBottomNavigationHidden` + lg breakpoint / native|PWA shell |
| Shell | `html.hc-native-capacitor` / `html.hc-pwa-standalone` classes |
| Safe-area | Optional client probe; **not** subtracted into usable dims |
| SSR occupancy | Zeros until client viewport known (hydration-safe) |

No chrome ResizeObserver. No MutationObserver. No AppPageChrome/NavBar/BottomNav visual edits.

---

## 6. AppPageChrome / NavBar / BottomNavigation relation

- Settings Shadow Root reads **policy + shell classes**, not chrome DOM geometry.
- Existing `data-homecheff-app-chrome` / `data-bottom-nav-visible` remain the shell’s own attrs; unchanged.
- Workspace does not rewrite visibility, padding, or positioning.

---

## 7. Safe-area analysis

| Source | includedInChromeOccupancy | includedInContainerMeasurement |
| --- | --- | --- |
| NavBar top SA (native pad) | false | true |
| Bottom nav SA (bar + AppPageChrome pad) | false | true |
| AvailableSpace.safeArea | zeros (subtract semantics) | — |

Safe area is never subtracted a second time from usable space.

---

## 8. Double-subtract prevention

1. Usable dims = floored container measurement only (`usableDimensionsFromContainerFirst`).
2. `chromeOccupied` is diagnostic input for Preference B.
3. `appliedToUsableSpace === false`.
4. Tests assert width/height unchanged when occupancy is non-zero.

---

## 9. Fixed-point rule (runtime)

```
shell + route + viewport facts
  → occupancy snapshot
  → ResolveInput (usable = container)
  → Layout Plan
```

Occupancy builder imports **neither** `resolveWorkspaceLayout`, `WorkspaceLayoutPlan`, nor `WorkspaceProfile`.

Legacy chrome may change via existing CSS (`lg` hide); matchMedia `change` produces a **new** snapshot → next resolve cycle — never recursive same-cycle.

---

## 10. Occupancy contract

`WorkspaceChromeOccupancy` (`schemaVersion: 1`):

- `topPx` / `bottomPx` / `startPx` / `endPx`
- `safeArea` (logical start/end)
- `sources[]`
- `stabilityToken` = `chrome-{t}-{b}-{s}-{e}:v1`
- `appliedToUsableSpace: false`

Resolve token: `settings:{w}x{h}:chrome-{t}-{b}-{s}-{e}:v1`

---

## 11. Observer ownership

| Owner | Count | Notes |
| --- | --- | --- |
| Settings container RO | ≤1 | Unchanged from Phase 2B |
| Chrome RO | 0 | Policy + matchMedia only |
| matchMedia lg | ≤1 | Cleanup on unmount |

Identical occupancy tokens ignored (`coalesceChromeOccupancy`).

---

## 12. Settings ResolveInput integration

`createSettingsResolveInput` accepts optional `chromeOccupancy`:

- `widthPx`/`heightPx` = usable container dims
- `chromeOccupied` = snapshot edges
- `safeArea` = zeros for subtract semantics
- `stabilityToken` = combined resolve token

---

## 13. OFF / SHADOW / ON

| Mode | Occupancy | Resolver | UI |
| --- | --- | --- | --- |
| OFF | Not applied / skipped | No | Unchanged |
| SHADOW | Read + diagnostics | Yes, `renderActivation=false` | Unchanged |
| ON | Fail-closed to shadow | Never production-active | Unchanged |

---

## 14. SSR / hydration

- Initial occupancy zeros (no browser globals required for first HTML).
- Settings child renders immediately (no gate).
- Client occupancy update changes `data-aw-chrome-*` only after hydrate.
- Full browser E2E hydration deferred; unit SSR + contracts proven.

---

## 15. Child continuity

- No `key` on profile / width / plan / occupancy.
- Occupancy updates do not remount Settings child host.
- Structural source contracts + coalesce proofs.

---

## 16. Accessibility

- No landmark on wrapper.
- Diagnostics via `data-*` only (not focusable).
- No focus commands on occupancy update.

---

## 17. Diagnostics fields

`data-aw-chrome-token`, `data-aw-chrome-top/bottom`, `data-aw-chrome-applied`, `data-aw-usable-w/h`, plus internal: sources summary, update/ignored counts, normalization status.

---

## 18. Performance

- No extra RO for chrome.
- Coalesce prevents identical occupancy resolves.
- Production OFF skips workspace observers.

---

## 19. Tests

| Suite | Script |
| --- | --- |
| Pure core | `npm run test:adaptive-workspace` |
| Phase 2B | `npm run test:adaptive-workspace-react` |
| Phase 2C | `npm run test:adaptive-workspace-chrome` |
| Validators | `validate:adaptive-workspace-settings-shadow`, `validate:adaptive-workspace-chrome-occupancy` |

---

## 20. Modified existing chrome files

**None.** Read-only adapters only.

---

## 21. Deferred

- True viewport-remainder measure host (still Model A)
- Live chrome DOM measurement if policy constants diverge
- Keyboard occlusion
- Notifications panel (Phase 2D)
- Production ON

---

## 22. Phase 2D entry criteria

- Occupancy source stable
- Fixed-point proven
- No double subtract / double safe-area
- Settings child continuity
- OFF/SHADOW + no production ON
- Pure core + 2B + 2C green

**Next:** PHASE 2D — Notifications panel contract — shadow integration.

---

## 23. Repository hygiene

Commit only Phase 2C paths under adaptive-workspace adapters/tests/docs/scripts/package.json. Unrelated working-tree files untouched. Pure core unchanged.
