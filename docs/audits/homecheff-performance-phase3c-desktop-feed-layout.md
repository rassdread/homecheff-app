# Phase 3C — Desktop Single-Column Default

**Datum:** 2026-07-12

---

## Doel

Desktop standaardfeed = **één kolom**. Geen automatische 2/3-koloms grid voor nieuwe gebruikers.

---

## Implementatie

### [homeDesktopFeedColumns.ts](lib/feed/homeDesktopFeedColumns.ts)

| Wijziging | Detail |
|-----------|--------|
| Default | `1` (was `2`) |
| Version key | `homecheff.homeDesktopFeedColumns.version = "2"` |
| Explicit flag | `homecheff.homeDesktopFeedColumns.explicit = "1"` bij toggle |
| Migratie | Oude impliciete `"2"` → reset naar `1` tenzij explicit |

### [GeoFeed.tsx](components/feed/GeoFeed.tsx)

| Context | Grid |
|---------|------|
| Desktop homepage split | `homeDesktopFeedGridClass(cols)` — default 1 |
| Desktop home-main | `grid-cols-1` (was 2) |
| Desktop andere routes | `grid-cols-1` (was sm:2 md:3) |
| Mobile discover | ongewijzigd `grid-cols-2 hc-discover-feed-grid` |
| Mobile cards | ongewijzigd `flex-col hc-feed-cards-column` |

---

## Veiligheid

| Check | Status |
|-------|--------|
| Geen extra GeoFeed mount | ✅ |
| Geen extra `/api/feed` fetch | ✅ layout niet in fetch deps |
| Sidebar intact | ✅ |
| Discovery modules intact | ✅ |
| Expliciete 2/3-koloms keuze | ✅ via FeedDesktopColumnToggle + explicit flag |

---

## Validatie

`scripts/validate-feed-desktop-layout-phase3c.ts` — **10/10**
