# Profile V2 — Migration Report

**Status:** Foundation wired (private + public entry points). Legacy clients preserved as `*Legacy.tsx` for reference.

## Philosophy shift

| Legacy | Profile V2 |
|--------|------------|
| Product/category tabs (Keuken, Tuin, Studio) | Person-centric tabs (Overzicht, Aanbod, Inspiratie, Community, Vertrouwen) |
| Separate private/public implementations | Shared `ProfileV2Client` + `viewerIsOwner` |
| Dashboard panels | Hero header + storytelling sections |

## Tab mapping (data migration)

| Legacy tab / section | V2 destination |
|---------------------|----------------|
| `overview` | **Overzicht** |
| `dishes`, `dishes-chef`, `dishes-garden`, `dishes-designer`, `producten`, `products` | **Aanbod** (role filter) |
| `recipes` / inspiratie sub-tab | **Inspiratie** |
| `reviews`, `fans`, `follows`, `ambassador` | **Community** |
| `workspace` | **Vertrouwen** |
| `business-overview`, `subscription`, `analytics` | Folded into **Overzicht** (owner: Stripe, CreatorAudience) + `/settings` |

URL `?tab=` legacy values are migrated via `migrateLegacyProfileTab()` in `lib/profile/profile-v2/migration.ts`.

## New files

### Lib
- `lib/profile/profile-v2/types.ts` — shared view model
- `lib/profile/profile-v2/migration.ts` — legacy tab → V2 mapping
- `lib/profile/profile-v2/tabs.ts` — 5 tab definitions
- `lib/profile/profile-v2/normalize-user.ts` — `normalizeProfileV2User()`
- `lib/profile/public-profile-hcp.ts` — `PublicProfileHcpPayload` type

### Components
- `components/profile/v2/ProfileV2Client.tsx` — orchestrator (private/public)
- `components/profile/v2/ProfileV2Shell.tsx` — page layout
- `components/profile/v2/ProfileV2Header.tsx` — hero header
- `components/profile/v2/ProfileV2TabNav.tsx` — sticky swipeable tabs
- `components/profile/v2/ProfileV2TabPanels.tsx` — tab content (reuses legacy data components)

### Legacy backups (not routed)
- `components/profile/ProfileClientLegacy.tsx`
- `app/user/[username]/PublicProfileClientLegacy.tsx`

## Modified entry points

| Route | Before | After |
|-------|--------|-------|
| `/profile` | `ProfileClient.tsx` (~1758 lines) | Thin wrapper → `ProfileV2Client variant="private"` |
| `/user/[username]` | `PublicProfileClient.tsx` (~1462 lines) | Thin wrapper → `ProfileV2Client variant="public"` |

## Modified supporting files

- `lib/feed/feedSurfaceState.ts` — `profile_v2` surface id for tab persistence
- `lib/profileProductTab.ts` — post-create flow returns `aanbod` tab
- `public/i18n/nl.json` — `profileV2.*` keys
- `public/i18n/en.json` — `profileV2.*` keys

## Reused legacy components (no data loss)

| Component | V2 tab |
|-----------|--------|
| `MyDishesManager` | Aanbod (`dorpsplein`), Inspiratie (`inspiratie`) |
| `WorkspacePhotoUpload` / `WorkspacePhotosDisplay` | Vertrouwen |
| `ItemsWithReviews` | Community |
| `FansAndFollowsList` | Community |
| `CreatorAudiencePanel` | Overzicht (owner) |
| `StripeConnectSetup` | Overzicht (owner) |
| `PhotoUploader` | Header (owner) |
| `FollowButton`, `MakerContactSection` | Header (visitor) |

## i18n keys (`profileV2`)

- `profileV2.tabs.*` — tab labels + nav aria
- `profileV2.header.*` — HCP, fans, profile views, maker badge
- `profileV2.actions.*` — edit, settings, message, view offerings
- `profileV2.overview.*` — about + section preview cards
- `profileV2.aanbod.*` — title, subtitle, filters (incl. future: services, trade, help, tasks)
- `profileV2.inspiratie.*`
- `profileV2.community.*`
- `profileV2.vertrouwen.*`

Legacy `profilePage.*` keys remain for reused sub-components.

## Owner vs visitor (`viewerIsOwner`)

| Capability | Owner (`/profile`) | Visitor (`/user/...`) |
|------------|-------------------|----------------------|
| Edit profile / settings | ✅ | ❌ |
| Photo upload | ✅ | ❌ |
| Stripe / audience tools | ✅ | ❌ |
| Follow / message | ❌ | ✅ |
| Workspace upload | ✅ | ❌ (display only) |
| Fan list (if private setting) | ✅ | Respects `showFansList` |
| HCP in header | `/api/gamification/me` | Server `publicHcp` |
| Profile view tracking | ❌ | ✅ (non-owner) |

## Photo upload migration (Vertrouwen tab)

| Legacy location | Profile V2 location | Owner | Public |
|-----------------|---------------------|-------|--------|
| Tab `workspace` → Keuken | **Vertrouwen** → Achter de schermen → **Keuken** | `WorkspacePhotoUpload` (CHEFF) | `WorkspacePhotosDisplay` |
| Tab `workspace` → Tuin | **Vertrouwen** → **Tuin** | `WorkspacePhotoUpload` (GROWN) | `WorkspacePhotosDisplay` |
| Tab `workspace` → Atelier | **Vertrouwen** → **Atelier** | `WorkspacePhotoUpload` (DESIGNER) | `WorkspacePhotosDisplay` |
| Tab `ambassador` → vehicle sub-tab | **Vertrouwen** → **Voertuig** | `ProfileV2VehiclePhotos` (upload/camera/delete) | `ProfileV2VehiclePhotos` (carousel + grid) |
| Tab `ambassador` → overview | **Vertrouwen** → **Bezorging & beschikbaarheid** | Read-only trust info | Read-only trust info |
| Profielfoto (header) | **Hero** → `PhotoUploader` (owner only) | Unchanged | Avatar display only |

New files: `ProfileV2TrustSections.tsx`, `ProfileV2VehiclePhotos.tsx`


1. **Public overview product grid** — legacy inline grid with lightbox; V2 overview uses section preview cards + deep links to tabs.
2. **Ambassador sub-tabs** (reviews, vehicle photos) — simplified delivery stats block in Community.
3. **Business analytics/subscription dashboards** — link from settings; not top-level tabs.
4. **`/seller/[sellerId]`** — separate legacy route; not consolidated.
5. **Future aanbod filters** (`trade`, `help`, `tasks`) — UI present; backend filtering when categories ship.
6. **Recent activity feed** on Overzicht — placeholder via section cards.

## Removed from UI (legacy tab names)

- Werkruimte (→ Vertrouwen)
- Mijn Keuken / Mijn Tuin / Mijn Studio (→ Aanbod + Vertrouwen)
- Reviews / Fans as top-level tabs (→ Community)

## Performance notes

- Single stats fetch per surface (`/api/profile/stats` or `/api/user/:id/stats`)
- Owner HCP: one `/api/gamification/me` on mount
- Tab state persisted via `feedSurfaceState` (`profile_v2`)
- Heavy panels lazy-loaded (`MyDishesManager`, workspace, fans, reviews)
- Tab panels mount only active tab content

## Safari / mobile

- Sticky tab nav with safe-area inset
- `pb-24` on tab panels for bottom nav clearance
- Horizontal scroll + snap on tabs
- `touch-manipulation` on filter chips

## Verification

- `npm run lint` — pass
- `npm run build` — pass

## Acceptance checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Feels fully new | ✅ Shell + header + 5 tabs |
| 2 | Not just renamed tabs | ✅ IA restructure + hero |
| 3 | Homepage visual language | ✅ `hc-dorpsplein-*`, `hc-card-lift` |
| 4 | Product page visual language | ✅ Shared card patterns via MyDishesManager |
| 5 | Shared private/public architecture | ✅ `ProfileV2Client` |
| 6 | Old tabs gone | ✅ |
| 7 | New tabs active | ✅ |
| 8 | Data migrated | ✅ Via component reuse + tab mapping |
| 9 | No functionality loss | ⚠️ Minor: public overview grid, ambassador sub-tabs |
| 10 | Mobile first-class | ✅ |
| 11 | Desktop professional | ✅ |
| 12 | Community + trust prominent | ✅ Dedicated tabs |
| 13 | Future aanbod categories | ✅ Filter UI ready |
| 14 | i18n parity | ✅ NL + EN `profileV2` |
| 15 | Safari tested | ⚠️ Manual test recommended |
| 16 | This report | ✅ |
