# HomeCheff — Phase 3B.1  
## Feed Sealed-Runtime Baseline, Instrumentation & Shadow Contract

| Field | Value |
| --- | --- |
| Date | 2026-07-19 |
| Branch | `identity/phase2-auth-foundation` |
| Baseline start | `1af209c` — docs(workspace): consolidate platform and audit feed compatibility |
| Decision | **READY FOR PHASE 3B.2** |

---

## 1. Executive summary

Phase 3B.1 inventariseert de bestaande Feed-runtime, legt GeoFeed formeel vast als **sealed runtime widget**, introduceert een **shadow-only** `feed.discovery`-contract, typed invarianten, production-safe O(1) instrumentation en read-only diagnostics. Er is **geen** Feed Workspace-renderer, **geen** remount, **geen** request-/cache-/UI-wijziging.

Workspace kent Feed nu als sealed runtime; legacy GeoFeed blijft enige writer.

---

## 2. Baseline branch en commit

- Branch: `identity/phase2-auth-foundation`
- Start HEAD: `1af209c`
- Baseline match: **YES**

---

## 3. Bestaande dirty/untracked files

Vooraf vastgelegd (~73 entries). Niet aangeraakt, niet gestaged. Inclusief o.a. performance audits, probes, architecture drafts, en `docs/audits/homecheff-performance-phase3fw2-preview-verification.md`.

---

## 4. Actieve Feed renderroute

```
app/page.tsx (RSC)
  → HomePageClient
       → HomeGeoFeedDynamic (next/dynamic, ssr:false)
            → GeoFeed (enige productie-JSX-mount)
                 → optionele children: desktop composed shell + FeedContent
```

---

## 5. GeoFeed mount owner

| Item | Waarde |
| --- | --- |
| Mount owner | `HomePageClient` |
| Dynamic boundary | `HomeGeoFeedDynamic` (`ssr: false`) |
| Parent keys | geen `key` op `<GeoFeed>` |
| Conditionals | viewport/session gates in HomePageClient; GeoFeed intern `homeComposedLayout` |
| Suspense | Next dynamic loading shell only |
| Observer owners | IntersectionObserver in GeoFeed; geen Workspace-observers |
| Request identity | `buildGeoFeedApiParams` → `params.toString()` in GeoFeed |
| Cache init | `home-feed-return-cache` in Feed fetch path |
| Pagination reset | `setFeedHasMore` / load-more in GeoFeed |
| Scroll owner | window (mobile) / `#homecheff-feed-desktop` (desktop) |
| Loading/skeleton | GeoFeed + `HomeFeedViewportShell` (dynamic loading) |

---

## 6. Sealed-runtime definitie

GeoFeed = **SEALED RUNTIME WIDGET**: Workspace mag identificeren/declareren/diagnosticeren/meten; mag niet intern besturen, requests/filters/caches/observers/scroll overnemen, of remounten.

Implementatie: `lib/adaptive-workspace/sealed/*`.

---

## 7. feed.discovery shadow contract

| Veld | Waarde |
| --- | --- |
| widgetId | `feed.discovery` |
| runtimeClassification | `sealed-runtime` |
| owner | `legacy-feed-runtime` |
| renderActivation | `false` |
| shadowActivation | `true` |
| activeWriter | `legacy` |
| mountPolicy | `single-stable-mount` |
| stateBoundary | `opaque` |
| requestBoundary | `owned-by-widget` |
| observerBoundary | `owned-by-widget-except-existing-platform-measurement` |
| scrollBoundary | `owned-by-widget` |
| workspaceRendererRegistered | `false` |

Evaluatie: `evaluateFeedDiscoveryShadow()` — metadata only, geen DOM, geen Feed-component-import.

Manifest: `feedDiscoveryManifest()` in `settings-manifests.ts` (geen renderer-registratie).

---

## 8. Single-writeranalyse

Legacy GeoFeed blijft enige writer. Geen `FeedWorkspaceRoot` / `FeedWorkspaceShadowRoot`. Shadow evaluation produceert geen render output. Statische validator bevestigt één productie-JSX-mount.

---

## 9. Request identity boundary

`requestKey` blijft `buildGeoFeedApiParams(...).toString()` in GeoFeed. Geen Workspace-/AvailableSpace-/profile-inputs. Validator controleert `feed-query-params.ts` + GeoFeed. `nativePaintKey` komt niet voor in Feed-runtime (denylist-only in AW core).

---

## 10. Observer boundary

IntersectionObserver blijft eigendom van GeoFeed. Instrumentation creëert geen observers.

---

## 11. Scroll boundary

Scroll owner ongewijzigd. Workspace raakt scroll niet.

---

## 12. Cache boundary

`home-feed-return-cache` en filter/result caches blijven Feed-owned. Geen herinitialisatie door Workspace.

---

## 13. Toegevoegde instrumentation

`lib/feed/feed-sealed-runtime-instrumentation.ts` — O(1), gated (`development` + window | `NEXT_PUBLIC_FEED_SEALED_BASELINE=1` | test override).

Hooks op bestaande GeoFeed-punten:

- mount / unmount (bestaande mount-effect + cleanup)
- request start (naast bestaande `feedPerfIncrementFeedFetch`, inclusief load-more)
- requestKey transition observation (na bestaande key-berekening)
- contract evaluation count (shadow evaluate)

GeoFeed importeert **niet** `@/lib/adaptive-workspace` (boundary behouden).

---

## 14. Niet-direct meetbare invarianten

Gemarkeerd `not-directly-instrumented-in-3b1` (bewijs in 3B.2 via browser/probe):

- `FEED_NATIVE_PAINT_KEY_STABLE_UNDER_WORKSPACE_CHANGES`
- `FEED_PREPARED_BATCH_IDENTITY_STABLE`
- `FEED_PAGINATION_CURSOR_NOT_RESET_BY_WORKSPACE`
- `FEED_RESULT_CACHE_NOT_REINITIALIZED_BY_WORKSPACE`
- `FEED_FILTER_CACHE_NOT_REINITIALIZED_BY_WORKSPACE`
- `FEED_INTERSECTION_OBSERVER_OWNERSHIP_UNCHANGED`
- `FEED_RESIZE_OBSERVER_OWNERSHIP_UNCHANGED`
- `FEED_SCROLL_OWNERSHIP_UNCHANGED`
- `FEED_TILE_IDENTITY_UNCHANGED`
- `FEED_SKELETON_OWNERSHIP_UNCHANGED`
- `FEED_LOADING_BEHAVIOR_UNCHANGED`
- `FEED_VISIBLE_DOM_UNCHANGED`
- `FEED_SSR_BEHAVIOR_UNCHANGED`
- `FEED_HYDRATION_CLEAN`
- `FEED_NO_WORKSPACE_REQUEST_IDENTITY_INPUT` (statisch bewezen in 3B.1; runtime-crosscheck in 3B.2)

---

## 15. Testresultaten

| Suite | Resultaat |
| --- | --- |
| `npm run test:adaptive-workspace-feed-sealed` | **pass** (4 + 6 assertions) |
| `npm run test:adaptive-workspace` | **pass** (34) |
| `npm run test:adaptive-workspace-react` | **pass** (12) |
| `npm run test:adaptive-workspace-chrome` | **pass** (15) |
| `npm run test:adaptive-workspace-notifications` | **pass** (20) |
| `npm run test:adaptive-workspace-messages` | **pass** (19) |
| `npm run test:adaptive-workspace-settings-on` | **pass** (25) |
| `npm run test:adaptive-workspace-settings-on-freeze` | **pass** (7) |
| `npm run test:adaptive-workspace-feed-compatibility` | **pass** (10) |

Bestaande testexpectations: **niet gewijzigd**.

---

## 16. Validatorresultaten

| Commando | Resultaat |
| --- | --- |
| `validate:adaptive-workspace-feed-sealed` | **ok** |
| `validate:adaptive-workspace-feed-compatibility` | **ok** |
| `validate:adaptive-workspace-settings-shadow` | **ok** |
| `validate:adaptive-workspace-chrome-occupancy` | **ok** |
| `validate:adaptive-workspace-notifications-shadow` | **ok** |
| `validate:adaptive-workspace-messages-shadow` | **ok** |
| `validate:adaptive-workspace-settings-on-pilot` | **ok** |
| `validate:adaptive-workspace-settings-on-freeze` | **ok** |

---

## 17. Buildresultaat

| Check | Resultaat |
| --- | --- |
| `npm run lint` | **pass** (exit 0) |
| `npx tsc --noEmit` | Pre-existing errors in unrelated scripts + baseline GeoFeed type debt; **geen** errors in Phase 3B.1 sealed/shadow/instrumentation-bestanden |
| `npm run build` | **pass** (Next.js 14.2.35 production build exit 0) |

Opmerking: eerste buildpoging faalde op `ENOSPC`; na cache-opruiming buiten de repo opnieuw geslaagd.

---

## 18. Repository-hygiëne

Alleen Phase 3B.1-bestanden gestaged/gecommit. Pre-existing dirty/untracked (probes, audits, performance docs) ongemoeid gelaten.

---

## 19. Bekende risico’s

- Instrumentation-hooks in GeoFeed zijn lifecycle-neutraal maar raken wel het Feed-bestand; regressierisico beperkt tot import + O(1) calls.
- Visuele gelijkheid niet opnieuw met nieuwe browser harness bewezen in 3B.1 (statische validators + geen DOM/CSS/copy-wijziging).
- Verschillende sealed invarianten vereisen Phase 3B.2 browser-observatie.

---

## 20. Expliciet oordeel

**READY FOR PHASE 3B.2**
