# Marketplace Mobile Navigation & Filter Surface Layering Audit

**Date:** 2026-07-07  
**Scope:** Audit only — no implementation.  
**Symptom:** Mobile filter bar and bottom navigation feel visually “floating”; feed content appears through both chrome layers; separation from the feed is weak.

---

## Executive summary

The effect is **primarily caused by semi-transparent backgrounds + backdrop blur** on the mobile feed toolbar and bottom tab bar, not by missing `z-index` on the tab bar. Feed tiles scroll **behind** sticky/fixed chrome as designed; with `bg-white/95` and `bg-white/88`, product photos and card edges remain visible through the bars.

**Secondary factors:** low `z-index` on the feed filter toolbar (`z-[2]`), a **sticky `top` offset mismatch** vs navbar height, and **occasional under-padding** when the native Play migration strip is visible.

**Safest minimal fix:** make both surfaces **opaque** (match page surface color), keep existing shadows/borders, optionally bump filter toolbar `z-index`. No layout or CTA redesign required.

---

## Surfaces in scope

| Route / context | Filter UI | Feed |
|-----------------|-----------|------|
| **Home `/` (primary marketplace feed)** | `FeedMobileToolbar` via `GeoFeed` (`feedCompactChrome`) | `GeoFeed` → `FeedMarketplaceCard` / `MarketplaceTileCompact` |
| **Discover hub `/inspiratie?bron=dorpsplein`** | `ImprovedFilterBar` in `DorpspleinPageContent` | Dorpsplein product grid (legacy) |
| **Filter sheet (both)** | `FeedMobileFilterSheet` modal | N/A |

Screenshots described in the brief most likely match **Home `/`** (`FeedMobileToolbar` + glass bottom nav). Dorpsplein uses a **solid** `bg-white` filter bar and behaves differently.

---

## 1. Mobile filter container

### Component: `FeedMobileToolbar`

**File:** `components/feed/FeedMobileToolbar.tsx`

```tsx
className="sticky top-[3.25rem] z-[2] … bg-white/95 … shadow-sm backdrop-blur-sm"
```

| Property | Current value | Assessment |
|----------|---------------|------------|
| **Background** | `bg-white/95` | 5% transparent — feed bleeds through |
| **Backdrop blur** | `backdrop-blur-sm` | Reinforces “glass”; content stays readable underneath |
| **Opacity** | 95% white | **Primary cause** of see-through effect |
| **z-index** | `z-[2]` | Very low; feed cards (`hc-card-lift`, badges `z-10`) can compete in stacking contexts |
| **Sticky position** | `top-[3.25rem]` (52px) | Navbar content is `h-16` (64px); offset is **12px short** if a fixed/sticky header is assumed |
| **Safe-area (top)** | None | Native navbar adds `pt-[env(safe-area-inset-top)]` on `NavBar` — toolbar does not compensate |
| **Border / shadow** | `border-gray-200/80`, `shadow-sm` | Light; insufficient alone to separate from busy feed imagery |

**Parent context:** Rendered inside `GeoFeed` when `feedCompactChrome` is true (mobile web &lt;1024px or Capacitor). Sits in `#homecheff-feed` above the results grid with only `space-y-4` spacing — no opaque backing layer behind the sticky region.

**NavBar interaction:** `NavBar` uses `lg:sticky` only — on mobile the header **scrolls away**. After scroll, the toolbar sticks at 52px from the viewport top, not flush to `top-0`, leaving an awkward gap and odd overlap behavior during the transition.

### Component: `ImprovedFilterBar` (Dorpsplein / discover)

**File:** `components/feed/ImprovedFilterBar.tsx`

```tsx
className="bg-white border-b … sticky top-0 md:top-[64px] z-50 md:z-40 shadow-sm"
```

| Property | Assessment |
|----------|------------|
| Background | **Solid** `bg-white` — no glass effect |
| z-index | `z-50` — adequate |
| Mobile sticky | `top-0` — sticks to viewport top when scrolling |

Less affected by transparency; may still show **sticky overlap** (feed sliding under opaque bar) which is correct but can feel harsh without a stronger shadow.

### Component: `FeedMobileFilterSheet`

Modal at `z-[130]` with `bg-black/50` scrim — **not** part of the floating-bar problem.

---

## 2. Mobile bottom navigation

### Component: `BottomNavigation`

**File:** `components/navigation/BottomNavigation.tsx`

**Outer wrapper (fixed):**

```tsx
fixed inset-x-0 bottom-0 z-[65] … pointer-events-none
pb-[env(safe-area-inset-bottom,0px)]
```

**Inner bar (`[data-hc-bottom-nav]`):**

```tsx
bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/88
border-t border-emerald-100/70 shadow-[…]
```

| Property | Current value | Assessment |
|----------|---------------|------------|
| **Background** | `bg-white/95`, **`bg-white/88` when blur supported** | **Primary cause** — more transparent on iOS/Safari/Chrome where `backdrop-filter` works |
| **Blur** | `backdrop-blur-md` | Feed imagery visible through bar |
| **z-index** | `65` (confirmed in `globals.css` for native) | Adequate vs feed content |
| **Shadow** | Teal-tinted upward shadow | Present but subtle against photographic tiles |
| **Safe-area** | Wrapper `pb-[env(safe-area-inset-bottom)]`; inner native `pb-[max(0.75rem,calc(env+10px))]` | Generally correct |
| **Tablet (md–lg)** | Floating rounded bar (`md:rounded-2xl`, `md:max-w-[760px]`) | Intentionally “floating”; gap around edges increases see-through |

**Optional height add-on:** Play migration strip (`showPlayMigrationStrip`) adds a row **above** tab icons — not included in `AppPageChrome` padding math.

**Flow spacer:** `bottomNavFlowSpacerClass()` renders a sibling `h-20` / `h-[6.5rem]` block after the fixed bar. `AppPageChrome` already applies bottom padding; spacer is belt-and-suspenders for document height.

---

## 3. Feed container

### Layout chain (Home)

```
layout.tsx
  NavBar (scrolls on mobile)
  AppPageChrome (bottom padding reserve)
    main
      HomePageClient (.hc-dorpsplein-page)
        GeoFeed (#homecheff-feed.space-y-4)
          FeedMobileToolbar (sticky glass)
          feedResultsBlock (grid of tiles)
    Footer (compact on `/` mobile)
  BottomNavigation (fixed glass)
```

### Bottom padding

**`AppPageChrome`** (`components/AppPageChrome.tsx`):

```tsx
max-lg:pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]
max-lg:sm:pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]
```

**Native / PWA override** (`app/globals.css`):

```css
html.hc-native-capacitor [data-homecheff-app-chrome][data-bottom-nav-visible="true"],
html.hc-pwa-standalone … {
  padding-bottom: calc(6.75rem + env(safe-area-inset-bottom, 0px)) !important;
}
```

| Check | Result |
|-------|--------|
| Default mobile web | ~92px + safe-area — **usually sufficient** for tab bar alone |
| Native / PWA | ~108px + safe-area — **better match** for taller native bar |
| Play migration strip visible | **Not accounted** — last feed rows can sit under strip + tabs |
| `#homecheff-feed` grid | **No** extra `padding-bottom` on the feed itself |
| Sticky filter overlap | Feed scrolls under toolbar — expected; transparency makes it visible |

### Sticky overlap

- Filter toolbar and feed share one scroll container (page scroll).
- No `scroll-padding-top` on `#main-content` for the sticky filter height.
- When toolbar is stuck, tile media scrolls beneath it — **opacity exposes this**.

---

## 4. Platform matrix

| Environment | Filter bar issue | Bottom nav issue | Padding issue |
|-------------|------------------|------------------|---------------|
| **iOS Safari (mobile web)** | Strong — `backdrop-filter` + `/88` nav | Strong — glass + home indicator safe-area | Rare shortfall unless migration strip |
| **Android Chrome** | Strong — same glass tokens | Strong | Similar |
| **PWA standalone** (`hc-pwa-standalone`) | Same glass | Same glass | **6.75rem** override helps |
| **Capacitor native** (`hc-native-capacitor`) | Same + safe-area top not on toolbar | Taller inner padding; footer suppressed on many routes; **`/` uses compact footer** | Migration strip edge case |

**Native note:** `globals.css` documents that `backdrop-filter` on some headers breaks nested scroll (messages). Feed chrome uses the same pattern — risk is visual, not scroll-breaking, on feed routes.

---

## 5. What causes the “floating” effect?

| Factor | Role |
|--------|------|
| **Opacity (`/95`, `/88`)** | **Main cause** — content visible through bars |
| **Backdrop blur** | **Amplifies** — keeps scrolled content legible under chrome |
| **z-index (filter `z-[2]`)** | **Minor** — can cause odd overlap with elevated card children; not the see-through effect |
| **Bottom padding** | **Secondary** — mostly OK; fails when migration strip or very tall dynamic nav |
| **Shadow / border** | Too light to compensate for glass on photo-heavy feed |

It is **not** a missing fixed positioning on the bottom nav (it is `fixed z-[65]`). It is **not** primarily a z-index war with the feed.

---

## 6. Screenshot situations that are wrong today

1. **Home feed scrolled — filter chips stuck:** Product image from row directly below visible through chip row / sort dropdown.
2. **Home feed end of list:** Last tile price/CTA visible through bottom tab bar (especially iOS with blur).
3. **Discover grid mode:** Dense 2-column photos increase contrast under glass bars.
4. **Tablet md–lg:** Floating centered bottom bar with rounded corners — feed visible in side margins and through bar.
5. **Native + Play migration strip:** Bottom two rows may sit under strip + tabs despite page padding.
6. **Scroll transition (home):** Brief moment where toolbar sticks at 52px while navbar was 64px — uneven top gap.

**Not wrong (by current design):** Feed sliding *under* an **opaque** sticky header (Dorpsplein `ImprovedFilterBar`) — separation is visual only via border/shadow.

---

## 7. Minimal safe fix (no redesign)

### A. Opaque surfaces (highest impact, lowest risk)

| Component | Change |
|-----------|--------|
| `FeedMobileToolbar` | Replace `bg-white/95 backdrop-blur-sm` → `bg-[#faf8f4]` or `bg-white` (match `.hc-dorpsplein-page` gradient end) |
| `BottomNavigation` `[data-hc-bottom-nav]` | Replace `bg-white/95 … bg-white/88` → solid `bg-white`; **remove** `supports-[backdrop-filter]:bg-white/88` |

Keep existing `border-t`, `shadow-*`, and safe-area classes. **No** nav item, icon, or filter layout changes.

### B. Filter toolbar stacking (small)

| Change | Rationale |
|--------|-----------|
| `z-[2]` → `z-30` (below NavBar `z-[100]`, above feed) | Predictable stacking over tile badges |
| Consider `top-0` on mobile once navbar scrolls away, or `top-[calc(4rem+env(safe-area-inset-top))]` if navbar becomes sticky on mobile | Fixes offset mismatch |

### C. Padding belt (optional, targeted)

| Change | Rationale |
|--------|-----------|
| When `showPlayMigrationStrip`, add `~2.5rem` to effective bottom inset or hide strip on feed scroll | Prevents last-row overlap |
| `scroll-padding-bottom` on `#main-content` matching `HC_BOTTOM_NAV_OFFSET_CSS` | Helps anchor scroll-to-feed |

### D. Do **not** do in a minimal pass

- Redesign tab bar or filter chip layout
- New enums or feature flags beyond CSS class tweaks
- Remove sticky behavior (would hurt filter discoverability)

---

## 8. Files to touch (implementation phase)

| Priority | File |
|----------|------|
| P0 | `components/feed/FeedMobileToolbar.tsx` |
| P0 | `components/navigation/BottomNavigation.tsx` |
| P1 | `components/AppPageChrome.tsx` or `lib/layout/bottomNavInset.ts` — migration strip height |
| P2 | `app/globals.css` — only if centralizing opaque nav tokens for native/PWA |
| P2 | `components/feed/ImprovedFilterBar.tsx` — stronger `shadow-md` if Dorpsplein needs parity |

---

## 9. Validation checklist (post-fix)

- [ ] Home `/` mobile: scroll feed — no tile imagery readable through filter bar or bottom nav
- [ ] iOS Safari + PWA standalone + Capacitor Android/iOS
- [ ] Last feed tile fully above tab bar (with and without Play migration strip)
- [ ] Filter sheet (`FeedMobileFilterSheet`) unchanged
- [ ] Desktop (lg+) unchanged — bottom nav hidden on web lg+
- [ ] `npm run lint` / visual regression on messages route (backdrop-filter removed only on bottom nav, not messages header)

---

## References

- `components/feed/FeedMobileToolbar.tsx` — mobile marketplace filter chrome
- `components/navigation/BottomNavigation.tsx` — fixed bottom tab bar
- `components/AppPageChrome.tsx` — scroll padding reserve
- `lib/layout/bottomNavInset.ts` — shared padding constants
- `app/globals.css` — native/PWA padding overrides, `[data-hc-bottom-nav]`
- `docs/architecture/MOBILE_SURFACE_ARCHITECTURE.md` — filter sheet vs feed roles
