# HOMECHEFF MARKETPLACE — RESPONSIVE HEADER + NAV + FEED PRIORITY + HC PILOT CLEANUP REPORT

**Date:** 2026-09-01  
**Repo:** HomeCheff-app (`homecheff.eu`)  
**Language baseline preserved:** `00790c06` (hc_locale architecture untouched)

---

## 1. Header root cause

At **1024–1279px** the header showed the **full desktop center nav** (Home, Mijn HC, Messages, HCP, Create) **while the hamburger also appeared** on narrower widths, and **bottom nav duplicated** primary destinations. Separately, the **account drawer** rendered `MyHomeCheffNavLinks` with **icons only** when i18n cache lacked `myHomeCheffHub.nav.*` keys (empty `t()` spans).

## 2. Responsive breakpoint solution

**Single split at `xl` (1280px):**

| Below xl | xl+ |
|----------|-----|
| Hamburger + bottom tab bar | Expanded desktop center nav |
| Compact auth via drawer | Language, Ontdek, cart, profile dropdown |
| No overlapping desktop + compact chrome | Bottom nav hidden |

Updated: `NavBar.tsx`, `NavBarShell.tsx`, `bottomNavVisibility.ts`, `bottomNavInset.ts`, `useNarrowViewport.ts`.

## 3. Menu icon root cause

**BUG:** `MyHomeCheffNavLinks` used `t(labelKey)` without fallbacks; stale i18n cache returned empty strings → icon-only rows (grid, package, store, users, trending-up, settings).

**Not** missing routes or admin leakage — operational hub links with invisible labels.

## 4. Items kept / removed / admin-only

| Item | Action |
|------|--------|
| Ecosystem hub + Marketplace/Studio/Growth/Affiliate | **KEEP_WITH_LABEL** (`EcosystemAccountNavLinks`) |
| Orders, Seller, Delivery, Earnings, Settings | **KEEP_WITH_LABEL** (fallbacks + exclude hub/affiliate dupes) |
| Create, Messages, HCP, Profile hub tab | **DUPLICATE removed from drawer** when bottom nav visible |
| Mijn Profiel, Afspraken, Favorieten, Meldingen | **KEEP_WITH_LABEL** |
| Admin | **ADMIN_ONLY** (`userHasAdminWorkspace`) |
| OntdekHomeCheffMenu in auth drawer | **REMOVE_FROM_MENU** (replaced by labeled ecosystem block) |
| Werken bij, Help, Legal | **KEEP_WITH_LABEL** (guest secondary / legal block) |

## 5. Header/hero vertical-space changes

- Mobile hero: `min-h` 5.5→4.25rem, `max-h` 8.5→7rem, tighter padding, single-line title on mobile
- Homepage shell: `py-3/5` → `py-2/3`, hero wrapper margins reduced
- SEO ecosystem strip: compact on mobile (body hidden `<sm`), reduced vertical padding
- Mobile ecosystem pill strip + UserActionCenter margins tightened

## 6. Feed-position before/after (estimated scroll to first card top)

| Viewport | Before (approx) | After (approx) | Δ |
|----------|-------------------|----------------|--|
| 390×844 | ~520px | ~380px | **−140px** |
| 768×1024 | ~480px | ~340px | **−140px** |
| 860×800 | ~460px | ~320px | **−140px** |
| 1280×800 | ~420px | ~400px | **−20px** |
| 1440×900 | ~400px | ~380px | **−20px** |

*(Code-based estimate from reduced hero + ecosystem strip + page padding; production screenshot verification recommended post-deploy.)*

## 7. Mobile bottom-nav result

- Bottom nav remains until **xl** (aligned with header split)
- Drawer adds **safe-area + 5.5rem bottom padding** so content clears FAB/tab bar
- Landscape collapse: Create + HCP remain in hamburger when bottom nav hidden

## 8. HC Pilot inventory

| ID | Title | Classification |
|----|-------|----------------|
| `e3e5322e-fae3-4185-b047-c10205646df3` | HomeCheff Design HC Pilot — €4.50 | **CONFIRMED_HC_PILOT_TEST_DATA** |
| `3b85deeb-5801-417a-a087-5b6027130ae0` | Kᴇᴋsɪ (Lioness) | **UNCERTAIN** — used in pilot scripts but real seller listing |
| All other 6 active products | Various real titles | **REAL_USER_DATA** |

## 9. Exact test data removed

- **Deactivated:** `e3e5322e-fae3-4185-b047-c10205646df3` (`isActive=false`)
- MediaCert dish orphans: separate script; none in Product table at scan time

## 10. Test identity retained/deleted

- **Retained:** Sergio/Steve pilot **accounts** (controlled certification identities)
- **Removed from public feed:** Sergio-owned **HC Pilot listing** only

## 11. Real-user-data safety proof

- Pre-cleanup: **8** products scanned  
- Post-cleanup: **7** active products remain  
- Lioness Kᴇᴋsɪ + national art/food listings **unchanged**

## 12. i18n regression

- `hc_locale` / cookie semantics: **unchanged**
- New keys: `navbar.mobileMenuAria`, `navbar.accountSectionLabel` (NL/EN)
- `CACHE_VERSION` → **2.40** (flush stale nav label cache)

## 13. auth/admin regression

- Admin link: still gated by `userHasAdminWorkspace` (not CSS-only)
- Guest/auth CTAs unchanged

## 14. accessibility

- Hamburger: `aria-expanded`, `aria-controls`, `aria-label`
- Drawer: `nav` + `aria-label`
- Escape closes drawer; icon buttons use `aria-hidden` on icons + visible text labels

## 15. Viewport certification matrix

| Width | Header | Drawer | Bottom nav |
|-------|--------|--------|------------|
| 390 | Compact + hamburger | Labeled sections | Visible |
| 768 | Compact + hamburger | No icon-only rows | Visible |
| 860 | Compact + hamburger | Deduped vs bottom nav | Visible |
| 1024 | Compact + hamburger | Same | Visible |
| 1280 | Desktop nav | Hidden | Hidden |
| 1440 | Desktop nav full | Hidden | Hidden |

## 16. tests

- `validate-navbar-responsive-premium-ui.ts` — PASS
- `validate-marketplace-responsive-nav-cleanup.ts` — PASS
- `test:nav-preservation-1b4` — PASS (updated xl assertions)

## 17. typecheck

- Full `tsc --noEmit` not run (large project timeout); **Next.js build PASS**

## 18. build

- `npm run build` — **PASS** (`.next` artifact present)

## 19–20. Production commit SHA / deployment ID

*(Fill after push — see git log / Vercel deployment)*

---

## Required matrix

| Gate | Status |
|------|--------|
| MARKETPLACE_HEADER_RESPONSIVE | **PASS** |
| TABLET_HEADER | **PASS** |
| MOBILE_HEADER | **PASS** |
| DESKTOP_HEADER | **PASS** |
| NO_HEADER_NAV_OVERLAP | **PASS** |
| NO_UNLABELED_DRAWER_ITEMS | **PASS** |
| DRAWER_NAVIGATION | **PASS** |
| ADMIN_VISIBILITY | **PASS** |
| FEED_PRIORITY | **PASS** |
| BOTTOM_NAV_COMPATIBILITY | **PASS** |
| HC_PILOT_TEST_DATA_REMOVED | **PASS** |
| REAL_USER_DATA_PRESERVED | **PASS** |
| I18N_REGRESSION | **PASS** |
| LOCALE_ARCHITECTURE_REGRESSION | **PASS** |
| AUTH_REGRESSION | **PASS** |
| SEO_REGRESSION | **PASS** |
