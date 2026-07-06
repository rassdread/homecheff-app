# Marketplace Exchange Suggestions — Phase 4E Progress

**Phase:** 4E — Exchange Suggestions Architecture  
**Status:** Complete (documentation only)  
**Last updated:** 2026-07-06  
**Depends on:** 4A Value Exchange, 4C Detail Page System, 4D Exchange Matching

---

## Goal

Design how exchange opportunities become **visible to users** across tiles, previews, detail, profile, sidebar, mobile feed, and future notifications — without implementation, ranking changes, discovery section changes, or sponsored integration.

---

## Deliverables

| Item | Status |
|------|--------|
| `MARKETPLACE_EXCHANGE_SUGGESTIONS.md` | Done |
| `EXCHANGE_SURFACE_MATRIX.md` | Done |
| `EXCHANGE_NOTIFICATION_READINESS.md` | Done |
| `MARKETPLACE_EXCHANGE_PHASE4E.md` | Done |

---

## Architecture summary

### Six suggestion types

| Type | Meaning |
|------|---------|
| `DIRECT_EXCHANGE` | You offer something someone wants |
| `REVERSE_EXCHANGE` | Someone offers something you want |
| `MUTUAL_EXCHANGE` | Both sides can exchange value |
| `LOCAL_EXCHANGE` | Within local radius (modifier) |
| `COMMUNITY_EXCHANGE` | Community-wide category opportunity |
| `MULTI_STEP_EXCHANGE` | Future chain-ready (4H) |

### Seven surfaces mapped

| Surface | Verdict |
|---------|---------|
| Tile (browse) | **Forbidden** |
| Preview | Teaser (1 line) |
| Detail | Primary (max 3 cards) |
| Profile (owner) | Hub module |
| Sidebar | Compact (max 2) |
| Mobile feed | Insert band @14/@28 |
| Notifications | Future opt-in (4H) |

### Core rules

- Never affect ranking
- Never replace discovery sections
- Never appear as sponsored
- Sort by exchange score + distance + recency only
- Forbidden: views, followers, HCP, props, engagement metrics
- Anti-spam caps per page, session, seller, listing

---

## Not in scope (4E)

- UI components or API routes
- `resolveExchangeSuggestions()` implementation
- Matching engine / score changes
- Discovery or sponsored system changes
- i18n keys (`marketplace.exchange.suggestions.*` — planned 4F)
- Validator script (planned 4F with implementation)

---

## Validation

No code changes in 4E. Prior phases remain valid:

```bash
npx tsx scripts/validate-exchange-foundation.ts
npx tsx scripts/validate-marketplace-detail-system.ts
npm run lint
npm run build
```

---

## Phase sequence

| Phase | Focus |
|-------|-------|
| 4A | Value exchange contracts ✅ |
| 4C | Detail page contracts ✅ |
| 4D | Matching foundation ✅ |
| **4E** | Suggestion + surface architecture ✅ |
| 4F | `resolveExchangeSuggestions()` + read-only profile/detail UI |
| 4G | Sidebar + mobile feed inserts |
| 4H | Notifications + multi-step chains |
| 4I | Message-thread match context |

---

## References

- [MARKETPLACE_EXCHANGE_SUGGESTIONS.md](../architecture/MARKETPLACE_EXCHANGE_SUGGESTIONS.md)
- [EXCHANGE_SURFACE_MATRIX.md](../audits/EXCHANGE_SURFACE_MATRIX.md)
- [EXCHANGE_NOTIFICATION_READINESS.md](../audits/EXCHANGE_NOTIFICATION_READINESS.md)
- [MARKETPLACE_EXCHANGE_PHASE4D.md](./MARKETPLACE_EXCHANGE_PHASE4D.md)
- [MARKETPLACE_DETAIL_PHASE4C.md](./MARKETPLACE_DETAIL_PHASE4C.md)
- [MARKETPLACE_VALUE_EXCHANGE_PHASE4A.md](./MARKETPLACE_VALUE_EXCHANGE_PHASE4A.md)
