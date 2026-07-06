# REQUEST Discovery Readiness (Gezocht)

**Version:** V1 (Discovery Phase 1A)  
**Last updated:** 2026-07-06

Audit of REQUEST listing discoverability ahead of a future **Gezocht** profile tab and Discovery Phase 1 ranking.

---

## What already works ✅

| Capability | Status |
|------------|--------|
| `listingIntent=REQUEST` on Product model | ✅ |
| `deriveListingKind` → REQUEST | ✅ |
| Feed API text search includes REQUEST products | ✅ |
| REQUEST intent query expansion (`gezocht`, `hulp`, `wie kan`) | ✅ Phase 1A |
| Products API search + `listingKind` on results | ✅ Phase 1A |
| Profile filter **Hulpvragen** (`help`) | ✅ |
| Href → `/product/[slug]` (temporary) | ✅ |
| `listingIntent` + `listingKind` on feed/search payloads | ✅ |

---

## What partially works ⚠️

| Capability | Gap |
|------------|-----|
| GeoFeed search finds REQUEST | Found in API; displayed via inspiration bucket / mixed rows — not labeled Gezocht |
| Dorpsplein search | Server q + classification; no REQUEST-specific UI |
| Query examples ("tuinman gezocht") | Matches via `inferSearchQueryIntent` + title text — not full taxonomy synonym search |

---

## What blocks Gezocht tab ❌

| Blocker | Severity | Owner phase |
|---------|----------|-------------|
| No `/request/[slug]` route | Medium | Routes Phase 2 |
| No dedicated Gezocht profile section | Medium | Profile Phase 2 |
| REQUEST cards use sale/inspiration card components | Medium | UI Phase 2 |
| No REQUEST-specific empty states | Low | Discovery UI |
| No urgency/budget/neededBy fields | Low | Schema Phase 2+ |
| REQUEST mixed with OFFER in Aanbod grid | Medium | Profile layout |

---

## Search examples (expected Phase 1A behavior)

| Query | Expected matches |
|-------|------------------|
| "tuinman gezocht" | REQUEST + TASK listings with garden/help keywords |
| "wie kan helpen verhuizen" | REQUEST listings; moving-related titles |
| "webdesigner gezocht" | REQUEST + SERVICE listings |
| "kookworkshop" | WORKSHOP listings (kind hint, not ranking) |

Matching is **filter + text only** — no proposal matching, notifications, or ranking engine.

---

## Gezocht readiness score

| Area | Score | Notes |
|------|-------|-------|
| Data model | 90% | REQUEST on Product sufficient for V1 |
| Search/findability | 70% | API layer complete; UI bucket wrong |
| Profile placement | 40% | Filter exists; no tab |
| Routes | 50% | Product slug works; no request URL |
| Discovery ranking | 0% | Explicitly out of scope |

**Verdict:** Safe to proceed to Discovery Phase 1 **ranking** once Gezocht UI and unified search read model are scheduled. Search **classification** prerequisite met.
