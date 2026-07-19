# Adaptive Workspace Platform Contract v1

| Field | Value |
| --- | --- |
| Version | **v1** |
| Date | 2026-07-19 |
| Branch | `identity/phase2-auth-foundation` |
| Derived from | Phase 2G Settings ON Freeze (`f79103e`) |
| Status | **NORMATIVE** for Settings; **BASELINE** for future surfaces |

This document consolidates the Settings ON freeze into an explicit platform contract.
It does **not** rewrite Phase 2 target architecture docs. Feed SHADOW/ON is out of scope for this contract’s activation.

---

## 1. Scope

Defines universal Adaptive Workspace platform rules proven by Settings, plus which rules are Settings-specific vs which must be extended before Feed can shadow-integrate.

---

## 2. Versioning & governance

- Contract id: `Adaptive Workspace Platform Contract v1`
- Changes require: architecture review, regression tests, updated freeze/audit record
- Settings freeze record remains authoritative for Settings production behavior:
  `docs/audits/homecheff-adaptive-workspace-phase2g-settings-on-freeze.md`

---

## 3–4. Universal vs surface-specific

### A. Universal platform contracts (all future ON/SHADOW surfaces)

| # | Contract |
| --- | --- |
| U1 | Server-resolved mode enum: `off \| shadow \| on` |
| U2 | Production default **off**; non-production default **shadow** |
| U3 | Invalid / missing mode **fail-closed** to defaults |
| U4 | No query / localStorage / cookie / DB feature flags for mode |
| U5 | Exactly one layout writer per surface per mode |
| U6 | No hidden duplicate trees (`display:none` / parallel hosts forbidden) |
| U7 | Deterministic initial plan (no timestamps/random) |
| U8 | Plan validation before trusting render activation |
| U9 | Explicit widget allowlist (no arbitrary registry) |
| U10 | Region → Slot → Panel → Widget Instance |
| U11 | Stable region / slot / panel / `statePreservationKey` identities |
| U12 | No React keys on profile / width / height / plan / mode / activation |
| U13 | SSR-first content; no measurement gate; no empty shell wait |
| U14 | One container `ResizeObserver` owner for Workspace measurement |
| U15 | Container-first dimensions; chrome occupancy **read-only** |
| U16 | No same-cycle profile ↔ occupancy feedback |
| U17 | Child mount count 1; unmount 0 during normal resolves |
| U18 | No Domain State in Workspace plan/diagnostics/props |
| U19 | Config-only rollback (no DB / migration / cleanup scripts) |
| U20 | Route isolation — ON does not leak to other surfaces |
| U21 | No global WorkspaceProvider / store / event bus / command dispatcher |
| U22 | Pure core remains React/DOM/Next-free |
| U23 | Diagnostics development/test-oriented; no PII / secrets |
| U24 | Accessibility: no extra landmarks; wrappers non-focusable |
| U25 | Sealed widgets: Workspace may place; must not split/clone/remount internals |

### B. Settings-specific contracts (not automatically universal)

| # | Contract |
| --- | --- |
| S1 | Surface id `settings` |
| S2 | Widget allowlist: only `settings.hub` |
| S3 | Canonical ids: `primary-stage`, `slot:settings:primary-stage:settings.hub`, `panel:settings:settings.hub` |
| S4 | `statePreservationKey = settings.hub` |
| S5 | Env: `HOMECHEFF_SETTINGS_WORKSPACE_MODE` |
| S6 | Tabs / forms remain Settings-owned (`?tab=`, local form state) |
| S7 | Visual parity classes (`max-w-5xl`, `px-4`, …) are Settings CSS, not Workspace profile styling |
| S8 | Production ON is Settings-only (no app-wide ON) |

### C. Feed extension points (required before Feed ON; optional for SHADOW)

| # | Extension |
| --- | --- |
| F1 | Feed-specific mode env (not yet created; must not exist until Phase 3B design lands) |
| F2 | `feed.discovery` sealed widget manifest + allowlist |
| F3 | Feed Shadow Root with legacy writer intact |
| F4 | Continuity counters: GeoFeed mounts, feed fetches, requestKey changes |
| F5 | Non-regression budgets vs Feed performance baseline |
| F6 | Explicit prohibition: Workspace must not enter requestKey / caches / IO |

---

## 5–8. Mode, single-writer, renderActivation, identities

| Mode | Writer | Measurement | `renderActivation` |
| --- | --- | --- | --- |
| OFF | Legacy | Off | n/a |
| SHADOW | Legacy | On (diagnostics) | Forced `false` |
| ON | Workspace layout only | On | `true` only if plan validates |

Unexpected combinations fail closed (ON + activation false → fallback; SHADOW + activation true → ignore activation).

Identities must remain stable across profile/width/occupancy updates for the hosted widget’s preservation key.

---

## 9–12. State preservation, initial plan, validation, allowlist

- Preservation key is widget-owned and stable.
- Initial plan is SSR-safe and canonical for the surface.
- Validation checks schema, surface, primary count, allowlist, activation match.
- Allowlist is surface-local and exhaustive; unknown widgets fail closed.

---

## 13–16. SSR, measurement, chrome, diagnostics

- Content must appear in server HTML without waiting for ResizeObserver.
- One Workspace RO; Feed may keep its own IntersectionObserver (surface-owned).
- Chrome occupancy never double-subtracted (Preference B / MODEL A).
- Diagnostics: mode, owner, activation, validation, dimensions, profile, tokens — never Domain State.

---

## 17–19. Fallback, rollback, data isolation

- Invalid plan / unknown widget / resolver error → content remains via single writer path.
- Hard Error Boundary remount after true render crash is bounded/accepted.
- Rollback: set mode env → redeploy/restart; no data migration.
- Denylist keys include (non-exhaustive): `requestKey`, `nativePaintKey`, `preparedBatches`, user/session/token/form payloads.

---

## 20–21. Accessibility & performance

- No autofocus / focus traps / focus commands from Workspace.
- No extra ResizeObserver loops; coalesce identical measurements.
- Workspace must not introduce extra surface API calls.

---

## 22. Sealed widget contract

A **sealed widget**:

1. Owns its Domain State entirely.
2. Is placed by Workspace (region/slot/panel) without internal split.
3. Is never cloned or keyed by profile/size/plan/mode.
4. Is never parallel-rendered (including hidden).
5. Does not receive Workspace Domain State props.
6. Does not have its scroll/IO/request engines replaced by Workspace.

Settings `settings.hub` is the reference sealed production widget.

---

## 23–24. Adapter boundaries & prohibited coupling

Allowed adapters (later phases): presentation intent → panelRequests; measurement normalize; chrome occupancy snapshot.

Prohibited: Workspace → Feed request builders; Feed → Workspace profile for keys; shared global stores; Feed UI imports into Settings renderer; Settings Domain State into Workspace.

---

## 25. Change governance

Any change to U1–U25 or Settings freeze ids requires:

1. Explicit motivation
2. Regression suite green (incl. Settings freeze tests)
3. Updated audit/freeze documentation
4. Isolated commit

---

## Appendix — Settings freeze integrity

Phase 2G evidence remains the browser proof for Settings ON:

- Chromium production-like matrix green
- Single-writer / hydration / continuity proven on harness
- Authenticated SettingsHubClient live session deferred (documented limitation)
