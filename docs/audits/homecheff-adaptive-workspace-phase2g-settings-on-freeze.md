# HomeCheff — Phase 2G  
## Settings ON Pilot — Verification, Hardening & Freeze Decision

| Field | Value |
| --- | --- |
| Date | 2026-07-19 |
| Branch | `identity/phase2-auth-foundation` |
| Baseline (Phase 2F) | `49284fc` — `feat(workspace): add controlled settings workspace renderer` |
| Decision | **READY TO FREEZE SETTINGS ON PILOT** |
| Browser | Chromium via Puppeteer |
| Runtime | Local `next start` production build (`NODE_ENV=production`) |
| Evidence | `docs/audits/artifacts/phase2g/phase2g-browser-{on,shadow,off,invalid}.json` |

---

## 1. Scope

Verify that the Phase 2F Settings Workspace ON pilot is stable enough to freeze as the first Adaptive Workspace production surface — **Settings only**, `settings.hub` only. No Notifications/Messages/Feed expansion.

---

## 2–3. Baseline & commit

- Pre-2G HEAD: `49284fc`
- Verification commit: this Phase 2G commit (see git log)
- Unrelated working-tree files left untouched

---

## 4. Verification environment

| Item | Value |
| --- | --- |
| Build | `npm run build` — **green** (includes `/aw-settings-harness`) |
| ON server | `HOMECHEFF_AW_SETTINGS_HARNESS=1 HOMECHEFF_SETTINGS_WORKSPACE_MODE=on` → `:3017` |
| SHADOW | same harness + `MODE=shadow` → `:3018` |
| OFF | `MODE=off` → `:3019` |
| Invalid | `MODE=GARBAGE` → fail-closed **off** → `:3020` |
| Public prod activation | **not** performed |
| Preview deploy | not required; local production build used |

Harness route `/aw-settings-harness` is **test-only**, gated by `HOMECHEFF_AW_SETTINGS_HARNESS=1` (`notFound()` otherwise). It mounts the same `SettingsWorkspaceRoot` + mode resolver as `/settings`, with a fixture child that instruments mount/unmount/local state.

Authenticated `/settings` remains auth-gated (unauthenticated traffic redirects toward login). Browser continuity for the renderer was proven on the harness; Settings Domain UI (real tabs/forms) remains Settings-owned and was previously covered by Phase 2F SSR/unit contracts.

---

## 5. Mode configuration

| Mode | Env | Writer | Browser pass |
| --- | --- | --- | --- |
| off | `HOMECHEFF_SETTINGS_WORKSPACE_MODE=off` | legacy | yes |
| shadow | `shadow` | legacy + diagnostics | yes |
| on | `on` | Workspace Region/Slot/Panel | yes |
| invalid | `GARBAGE` | fail-closed → off (prod) | yes |

Defaults unchanged: production **off**, non-production **shadow**.

---

## 6–8. Browser / viewport matrix

Chromium Puppeteer executed for OFF / SHADOW / ON / invalid.

Viewports (all ON pass: mounts=1, unmounts=0, visible):

- Desktop: 1440×900, 1280×720, 1024×768
- Tablet: 820×1180, 768×1024
- Mobile: 430×932, 390×844, 360×800
- Short: 1280×600, 1024×576, 430×650

Profile boundaries (±1 around 720 / 1024 / 1440 / short height): no remount; structure stable.

Screenshots captured under `/tmp/phase2g-artifacts/` (not committed; paths listed in probe JSON).

---

## 9. Hydration

- No React hydration mismatch / “did not match” console warnings in ON/SHADOW/OFF/invalid reports
- Settings/harness content present in SSR HTML before measurement (`data-aw-*` + child)
- No legacy→Workspace flash (mode is deployment-level; single tree per mode)
- First measurement does not remount child (mounts=1, unmounts=0)

Pre-existing unrelated console noise: invalid PWA icon fetch (`icon-192.png`) — not Workspace-related.

---

## 10. Single-writer

| Mode | legacy shadow root | ON root | children |
| --- | --- | --- | --- |
| OFF | 1 | 0 | 1 |
| SHADOW | 1 | 0 | 1 |
| ON | 0 | 1 | 1 |

Exactly one Region / Slot / Panel / WidgetHost in ON.

---

## 11–16. Continuity, parity, a11y, observers, fallback, rollback

**Continuity (ON browser):** mounts=1, unmounts=0 across viewport matrix, profile boundaries, resize, occupancy-driven resolve; local input + disclosure preserved; focus retained on input after scroll+resize; scrollY preserved (200→200); identical viewport re-apply resolveDelta=0.

**Tab URL continuity on real Settings:** still Settings-owned (`?tab=`); Workspace does not write searchParams (source contract + Phase 2F). Authenticated tab E2E deferred as known limitation (no test credentials in this run).

**Visual parity:** harness reuses Settings layout classes (`max-w-5xl`, `px-4`, `hc-dorpsplein-page`). No Workspace-visible chrome. OFF/SHADOW/ON structural parity via mode matrix + screenshots.

**Layout shift:** no container remount / class swap on first measurement; content present in SSR.

**Accessibility:** wrappers are non-focusable divs; harness hardened to avoid extra `<main>` (AppPageChrome already owns `main#main-content`). Diagnostics are data-attributes only.

**Observers:** one container ResizeObserver in SHADOW/ON; OFF skips observer; no window resize / visualViewport / keyboard listeners; identical measurements coalesced (resolveDelta=0 on identical viewport).

**Fallback:** Phase 2F allowlist/validation unit coverage retained; Error Boundary remount after hard render crash remains an accepted bounded risk (pre-render failures fail closed without remount).

**Rollback:** proven via separate production starts — ON (`:3017`) vs SHADOW (`:3018`) vs OFF (`:3019`) without DB/migration. Operator steps: set env → redeploy/restart.

---

## 17–19. Isolation, data, build

- Route isolation: `/`, `/notifications`, `/messages`, `/profile` show zero Settings ON roots / regions / settings.hub hosts
- Diagnostics attrs contain stability tokens only — no email/session/password values in Workspace attrs
- Production build: **green**
- Feed / Notifications UI / Messages UI: untouched

---

## 20–21. Tests & known limitations

| Suite | Result |
| --- | --- |
| Pure Core / 2B–2F | green (re-run at Phase 2G start) |
| Phase 2G freeze tests | green (require evidence JSON) |
| Browser probes | pass=true for on/shadow/off/invalid |

**Known limitations (accepted for freeze):**

1. Authenticated live `SettingsHubClient` browser session not exercised (auth-gated; harness proves renderer continuity).
2. Hard Error Boundary recovery may remount child after a true render crash.
3. WebKit/Firefox not run (Chromium only).
4. Pixel-diff tooling not present; structured screenshot + class parity used.
5. Harness must never ship with `HOMECHEFF_AW_SETTINGS_HARNESS=1` on public production.

---

## 22–24. Decision & frozen contracts

### READY TO FREEZE SETTINGS ON PILOT

Frozen:

- Settings-only ON scope
- `HOMECHEFF_SETTINGS_WORKSPACE_MODE` off|shadow|on + fail-closed defaults
- `settings.hub` allowlist
- Region/Slot/Panel ids + `statePreservationKey=settings.hub`
- Canonical initial plan schemaVersion 1
- Single-writer OFF/SHADOW/ON trees
- Container-first measurement + one ResizeObserver
- Rollback via env (no DB)
- No Domain State in Workspace
- No profile/size/plan/mode keys on Settings child

Post-freeze changes require architecture review + regression evidence.

---

## 25. Next phase entry

**Phase 3A — Workspace Platform Consolidation & Feed Compatibility Audit** may begin after this freeze. No Feed ON; no Notifications/Messages production render.

---

## 26. Architecture Health Score

| Dimension | Score |
| --- | --- |
| Pure Core | 10 |
| React Integration | 9 |
| Renderer Safety | 9 |
| Browser Runtime | 9 |
| SSR/Hydration | 9 |
| Visual Parity | 8 |
| Accessibility | 8 |
| Single Writer | 10 |
| Test Coverage | 9 |
| State Isolation | 10 |
| Preservation Safety | 9 |
| Observer Stability | 9 |
| Fallback Safety | 8 |
| Rollback Safety | 10 |
| Architectural Drift | 9 |

**Settings ON Freeze readiness: 90%** (remaining 10% = authenticated SettingsHubClient browser matrix + multi-browser).
