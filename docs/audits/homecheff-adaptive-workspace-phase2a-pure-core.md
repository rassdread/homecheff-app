# HomeCheff — Phase 2A  
## Adaptive Workspace — Pure Core Implementation Report

| Field | Value |
| --- | --- |
| Date | 2026-07-18 |
| Branch | `identity/phase2-auth-foundation` |
| Base commit | `789adc0` |
| Scope | Pure TypeScript contracts + Hybrid Policy Resolver |
| UI / Feed / React | **None** |

---

## 1. Scope

Implemented framework-independent Adaptive Workspace core under `lib/adaptive-workspace/**`:

- Versioned types (`schemaVersion: 1`)
- ResolveInput / WidgetManifest validators
- TEST FIXTURE profile bands + capacity budgets
- Settings surface policy (+ minimal generic primary policy for sealed contract tests)
- Pure `resolveWorkspaceLayout`
- DecisionTrace + canonicalization
- Command / Event / Lifecycle contracts
- Domain denylist enforcement
- Node/tsx pure tests + import boundary check

**Not implemented:** React hosts, ResizeObserver, production wiring, GeoFeed adapter, chrome adapters, Notifications/Messages policies as product surfaces.

---

## 2. Binding clarifications processed

1. Chrome occupancy fixed-point — documented; occupancy is ResolveInput only; resolver never recomputes from profile.  
2. Nesting Region → Slot → Panel → Widget — encoded in `WorkspaceLayoutPlan`.  
3. Resolve precedence — `RESOLVE_PRECEDENCE` + candidate sort.  
4. `schemaVersion: 1` on public contracts.  
5. WorkspaceCommand / WorkspaceEvent unions (no bus).  
6. Widget lifecycle states + allowed transitions.  
7. Canonical plan assertions in tests (`stableStringify`).  
8. Homepage interim stance — package header + no Feed imports.  
9. Migration order noted; only Settings policy is product-complete.  
10. Import boundary tested.

---

## 3. Public API (`lib/adaptive-workspace/index.ts`)

Exports include: `resolveWorkspaceLayout`, `resolveWorkspaceProfile`, `validateResolveInput`, `validateWidgetManifest`, `SettingsSurfacePolicy`, types (`ResolveInput`, `WorkspaceLayoutPlan`, `WidgetManifest`, `DecisionTrace`, `WorkspaceCommand`, `WorkspaceEvent`, …), `DIAGNOSTIC_CODES`, `WORKSPACE_DOMAIN_DENYLIST`, `PROFILE_TEST_FIXTURE_BANDS`, `stableStringify`.

---

## 4. Resolver pipeline (implemented)

1. Validate schema + ResolveInput (reject domain keys)  
2. Canonicalize manifests (sort by id; sealed uniqueness)  
3. Compatibility `off` → empty non-activating plan  
4. Load surface policy (`settings` or generic primary)  
5. Select primary widget  
6. Resolve profile from usable width/height fixtures  
7. Apply capacity budget  
8. Place primary on `primary-stage` / `stage`  
9. Order supporting candidates by precedence  
10. Enforce incompatibilities + collapse/capacity  
11. Build focus / transition / lifecycle intents  
12. Canonicalize + freeze plan  

---

## 5. Settings policy

`surfaceId: settings`, primary `settings.hub`. No tab/URL resolution. Invalid/missing primary → conservative fallback diagnostics.

---

## 6. Test results

Command: `npm run test:adaptive-workspace` → **33 assertions ok**.

Coverage: Settings profiles, off/shadow/on, pins, tie-break, reduced motion, sealed preservation, RTL regions, height demote, hinge, negatives (schema, duplicates, sealed, domain denylist), determinism, import boundary, native/PWA inputs.

---

## 7. Invariant status

| Class | Examples |
| --- | --- |
| **PURE CORE VERIFIED** | AWI-001…009 (as applicable), 020–021, 023–026, 029–031, 033–034, 040, 045, 047, 053–056, 057–058, 060 |
| **RUNTIME VERIFICATION DEFERRED** | Remount/SSR/observer/React focus recovery (010–019, 037–039, 046, 048–050, …) |
| **NOT APPLICABLE TO 2A** | Browser CLS numeric scores, Android WebView probes |

---

## 8. Risks

- Generic policy used for sealed/home.discovery **contract tests** only — must not be mistaken for homepage production policy.  
- Profile bands remain TEST FIXTURES.  
- Chrome fixed-point depends on future measurement layer supplying occupancy correctly.

---

## 9. Phase 2B entry criteria

Phase 2B (Settings Workspace Root — shadow-mode integration) may start when:

- Pure tests green (met)
- Determinism proven (met)
- schemaVersion frozen at 1 (met)
- No forbidden imports (met)
- Settings policy complete for primary stage (met)
- Fallback + off/shadow/on proven (met)

Still required before React work: explicit Workspace Root design that preserves sealed remount invariants (runtime).

---

## 10. Hygiene

Only Phase 2A paths: `lib/adaptive-workspace/**`, `package.json` script `test:adaptive-workspace`, this report. Unrelated working-tree files untouched.

---

*End of Phase 2A pure core report.*
