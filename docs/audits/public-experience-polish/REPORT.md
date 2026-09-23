# HomeCheff — Public experience polish (first pass)

Header auth + language hierarchy, hero value explanation, homepage human copy.
Date: 2026-09-23. Scope: first implementation pass (items 1–5 of the brief). Everything else is listed under "Remaining scope".

## Result fields

| Field | Value |
|---|---|
| STARTING_SHA | `dbc5a556391be06d350ce0bf0b43268cc5cb7b0e` |
| COMMIT_SHA | `499b9f6590baecc8c01045605e683f3598fc8ec7` |
| DEPLOYMENT_ID | `dpl_DMSKZ71pGRjU43e739qHJNwHfHkJ` (homecheff.eu, Ready, target production) |
| DEPLOYED_SHA_MATCH | YES (GitHub "Vercel – homecheff-app" status for `499b9f65` points to `DMSKZ71pGRjU43e739qHJNwHfHkJ`; `vercel inspect https://homecheff.eu` returns the same id) |
| AUTH_ROOT_CAUSE | Header row capped at `max-w-7xl` (1216px content) with `overflow-hidden`; at ≥1536px (2xl) the LanguageSwitcher and the Ontdek HomeCheff menu (~260px incl. "· Marketplace") were added to the right cluster, row scrollWidth became 1527 vs 1216, so Inloggen/Aanmelden were clipped offscreen and the flag button overlapped "Verkoop of deel". Guests also saw Dashboard/Berichten/Reputatie links that only led to /login. |
| LOGGED_OUT_LOGIN_VISIBLE | YES at 1920, 1536, 1440, 1366, 1280, 1024, 390 (hit-tested), 200% zoom (960x540); 844x390 and 720x450 via the work-bar Menu (Inloggen in menu) |
| LOGGED_OUT_SIGNUP_VISIBLE | YES, same matrix as login |
| LOGGED_IN_HEADER | Home · Werken bij HomeCheff · Dashboard · Berichten · Reputatie · **Verkoop of deel** · 🇳🇱 · (Ontdek HomeCheff from 2xl) · cart · bell · avatar. Zero clipped/covered controls at 1920/1536/1440/1366/1280/1024/390 and 960x540 |
| LANGUAGE_POSITION | Compact utility (flag + chevron, no globe) directly right of the nav, before Ontdek/auth, from xl (1280); below xl it stays in the hamburger menu. Locale logic, cookie and account preference untouched (same `changeLanguage`) |
| PRIMARY_CTA_POSITION | Last item of the desktop nav, visually the only filled green button in the nav; landscape work bar keeps its compact "Aanbieden" (label was invisible, now fixed) |
| HERO_EXPLANATION_CTA | Secondary outline button next to "Verkoop of deel": NL "Wat kan HomeCheff voor mij betekenen?", EN "What can HomeCheff do for me?" |
| HERO_EXPLANATION_COPY | Title "Maak iets van waar jij goed in bent" + three prose paragraphs (cooking, surplus harvest, jewellery/ceramics/illustration, bike repair, garden help, tutoring, sharing knowledge; you choose what, when and price; test interest, occasional sales or growing it; outcome depends on what you do — no income promise). Actions: "Start met aanbieden" (same create path as the primary CTA) and "Bekijk wat je kunt aanbieden" (`careersPath('hub')` → `/werken-bij`, EN `/careers`) |
| HERO_MODAL_OR_DRAWER | Accessible modal (`components/home/HomeValueExplainerDialog.tsx`): bottom sheet on mobile, centered dialog from sm; `role=dialog`, `aria-modal`, labelled/described, focus to close on open, Tab trap, Escape + close button + backdrop close, focus returns to trigger, body scroll locked |
| HERO_MOBILE | 390x844: trigger visible, dialog full-width sheet (0–390px), no horizontal overflow, keyboard open/Escape/focus return pass. Short landscape (844x390) shows the compact work bar by design, without hero CTAs |
| PUBLIC_COPY_SURFACES_AUDITED | Homepage hero strip (all explanation levels), guest discover panel, header/mobile menu labels; inventory of i18n namespaces by pattern density (below) and SEO landing route list |
| AI_STYLE_PATTERNS_FOUND | 309 em dashes in NL i18n (309 EN). Highest: affiliate 34, faq 30, overOns 19, feed 17, marketplace 15, home 14, register 12, business 12. Homepage: dash glue ("— vanaf Vlaardingen", "— of plaats zelf iets"), colon+list ("Echt lokaal aanbod: eten, …"), anglicisms ("listings", "fake landelijke inventory", "maker/verkoper"), numbered bullets inside ✓ lists ("1. …"), fragment chips ("Nu: …") |
| SHARED_COPY_SOURCES_FIXED | `homePhase1.orientationIdentity`, `orientationExplainUltra/CompactPrimary/Standard/Expanded/Rich`, `orientationLocalLaunchNote`, `orientationValueExchangeHint`, `guestSalesPanels.discover.{body,bullet1-3}` (NL + EN, written separately); new namespace `homeValueExplainer` |
| SEO_TEMPLATES_FIXED | NONE in this pass (inventoried only, see Remaining scope) |
| STATIC_PAGES_FIXED | NONE in this pass (homepage copy is i18n-driven) |
| SEO_TITLE_PRESERVED | YES (/, /werken-bij, /hoe-homecheff-werkt, /faq, /wat-is-homecheff NL; / EN — identical before/after) |
| META_PRESERVED | YES (description + robots identical) |
| H1_INTENT_PRESERVED | YES. Homepage H1 key `homePhase1.orientationTitle` unchanged ("Ontdek echt aanbod van buren bij jou in de buurt"); SSR H1/H2 identical on all sampled pages |
| JSON_LD_PRESERVED | YES (JSON-LD sha1 `d7174cb23294` identical before/after on every sampled page; `schemaWebsiteDescription` deliberately not touched) |
| CANONICALS_PRESERVED | YES (identical) |
| INTERNAL_LINKS_PRESERVED | YES for content links. Unique internal hrefs dropped by exactly 1 per page, which is the guest-only header entries (Dashboard/Berichten/Reputatie/Profiel pointed guests to `/login`, a login link still exists). No content link removed |
| DUTCH_HUMAN_REVIEW | DONE — read aloud in context at 1440 and 390; no dash glue, no colon lists, no anglicisms in the rewritten keys; legal precision kept for HC credits ("geen geld … niet opnemen of laten uitbetalen") |
| ENGLISH_HUMAN_REVIEW | DONE — written independently (British spelling to match existing EN), not a line-by-line translation |
| DESKTOP | PASS (production, logged out + logged in, 1280–1920) |
| MOBILE | PASS (production 390x844, logged out + logged in; hamburger shows no account-only rows for guests) |
| LANDSCAPE | PASS (844x390: Menu → Home, Werken bij, Verkoop of deel, App, language, Inloggen, Aanmelden; "Aanbieden" label now visible) |
| ZOOM_200 | PASS (960x540 / 720x450 / 640x450 CSS viewports, logged out + logged in, zero clipped controls) |
| BUILD | PASS (`npm run build` on a clean tree with only this commit; lint 0 errors; smoke-check passed) |
| SEO_REGRESSION | PASS (`test-seo-ai-discoverability-phase40`, `seo-one-ecosystem` pass; `seo-zero-foundation` has 1 pre-existing failure on sitemap-products eligibility, unrelated) |
| LOCALE_REGRESSION | PASS (`validate-cold-start-locale`; NL/EN parity for touched namespaces; production EN cookie renders EN dialog + `/careers`) |
| AUTH_REGRESSION | PASS (logged-out and logged-in production header probes; `/login`/`/register` reachable at every size; logged-in session renders Dashboard/Berichten/Reputatie/cart/bell/avatar) |
| P0_REMAINING | 0 |
| P1_REMAINING | 1 — pre-existing: on the signed-in homepage, `router.push('/sell/new')` from "Verkoop of deel" (hero, header and the new "Start met aanbieden") commits 1.6–11.6s after click although the RSC arrives in 0.1–3.2s; from /werken-bij or /faq it takes ~0.6s. Main-thread starvation on the homepage; dev shows `Maximum update depth exceeded` in `GeoFeed`. Not caused by this commit (links unchanged, dialog renders null when closed), belongs to the feed/geo workstream |
| P2_REMAINING | 3 — (a) the dialog backdrop does not dim the sticky header (header z-index above z-[140]); (b) `GuestExplanationPanel` uses `bg-black/55`, which Tailwind 3.3.7 does not generate, so that older panel has no dim backdrop; (c) `HomeHeroSection` (legacy hero used only when feed workspace mode is off) has no explanation CTA |
| REMAINING_COPY_AUDIT_SCOPE | See below |
| FINAL_DECISION | **HOMECHEFF_PUBLIC_EXPERIENCE_POLISH_FIRST_PASS_PRODUCTION_CERTIFIED** (header auth/language/hierarchy, hero explanation and homepage copy; site-wide copy pass not started) |

## What changed

- `components/NavBar.tsx`
  - Desktop: Dashboard, Berichten and Reputatie render only for signed-in users.
  - LanguageSwitcher moves from `2xl` to `xl` as a compact utility.
  - Ontdek stays `2xl` without its module suffix, and the row widens to `2xl:max-w-screen-2xl`.
  - The oversized 2xl auth padding is removed.
  - Mobile menu: Reputatie and Profiel render only for signed-in users.
- `components/LanguageSwitcher.tsx`: `compact` prop (flag + chevron, focus ring); default rendering unchanged.
- `components/ecosystem/OntdekHomeCheffMenu.tsx`: `showCurrentModule` prop (default true).
- `components/adaptive-workspace/WorkspaceOrientationStrip.tsx`: secondary explanation CTA + dialog wiring (static import; `next/dynamic` mount-on-open never rendered in production builds).
- `components/home/HomeValueExplainerDialog.tsx`: new accessible dialog.
- `components/adaptive-workspace/LandscapeWorkBarCommands.tsx`: "Aanbieden" label fill colour (was white on white).
- `public/i18n/nl.json`, `public/i18n/en.json`: homepage copy rewrite + `homeValueExplainer`.
- `lib/adaptive-workspace-react/tests/run-nav-preservation-1b4-tests.ts`: asserts the Reputatie row is gated on `user`.
- Probes (read-only): `scripts/probe-public-header.mjs`, `probe-home-value-explainer.mjs`, `probe-landscape-guest-menu.mjs`, `probe-login-state.mjs` (credentials via env only), `probe-seo-snapshot.mjs`, `probe-home-hero.mjs`.

## Header before / after (production, logged out)

| Width | Before | After |
|---|---|---|
| 1920 / 1536 | row 1527 > 1216, Inloggen/Aanmelden clipped (NOHIT/OFFSCREEN), 🇳🇱 overlaps "Verkoop of deel" | row 1472 = 1472, all controls hit-tested |
| 1440 / 1366 / 1280 | auth visible, no language in header | auth + compact language visible |
| 1024 / 390 | auth + Menu | unchanged |

Evidence: `header-logged-out/`, `header-logged-in/`, `zoom200/`, `zoom200-in/`, `landscape/` (screenshots + `probe.txt` + `header.json`).

## Homepage copy (NL, before → after)

- Identity: "Lokale buurtmarkt — vanaf Vlaardingen" → "Lokale buurtmarkt, gestart in Vlaardingen"
- Compact: "Echt lokaal aanbod: eten, oogst, creaties en diensten van mensen in je buurt." → "Eten, oogst, creaties en diensten van mensen bij jou in de buurt."
- Standard: "… We groeien van Vlaardingen naar buiten — ontdek wat er nu staat, of bied zelf iets aan." → "Buren bieden hier eten, oogst, creaties en diensten aan. We zijn begonnen in Vlaardingen en groeien van daaruit verder. Kijk wat er nu staat, of zet zelf iets online."
- Expanded: "… — of plaats zelf iets. Geen fake landelijke inventory." → "… en je kunt zelf ook iets plaatsen. Wat je hier vindt, komt van echte mensen en niet uit een landelijk magazijn."
- Rich: "… echte listings … — of word zelf maker/verkoper." → "… met aanbod van echte mensen. Kijk wat er aan eten, oogst, creaties en diensten te vinden is, of bied zelf iets aan."
- Launch chip: "Nu: echte lokale listings in en rond Vlaardingen. Wordt buurt voor buurt groter." → "Nu actief in en rond Vlaardingen"
- Value exchange: "Ruil ook zonder geld — ontdek wat je kunt krijgen met …" → "Je kunt ook ruilen, zonder dat er geld aan te pas komt."
- Guest discover panel: body rewritten as prose; HC credits precision kept; "1./2./3." prefixes removed from ✓ bullets.

Unchanged by design:
- H1 `orientationTitle`.
- Category chip "Eten · Tuin · Creaties · Diensten", which is a tag, not prose.
- JSON-LD `schemaWebsiteDescription`.
- Unused legacy keys `orientationExplainShort/Medium/Full/CompactSecondary/Support/Examples/orientationActions`, which are not rendered anywhere and are candidates for removal.

## Tests

The suites below pass after the change. `validate-navbar-responsive-premium-ui` failed before this change and now passes:

- `validate-hero-toggle-ux`
- `run-landscape-work-posture-tests`
- `validate-marketplace-compact-header`
- `run-homepage-info-chrome-tests`
- `responsive-account-header`
- `run-overlay-history-back-tests`
- `validate-navbar-responsive-premium-ui`
- `validate-navigation-completeness`
- `validate-public-careers-nav`
- `run-nav-preservation-1b4-tests`
- `run-chrome-occupancy-tests`
- `validate-cold-start-locale`
- `test-seo-ai-discoverability-phase40`
- `bottom-nav-five-items`
- `seo-one-ecosystem`
- `test-verdiencheck-mobile-bottom-nav-geometry`
- `test-verdiencheck-mobile-bottom-nav-pad`
- `validate-verdiencheck-public-copy`

These fail with identical counts before and after. Each assertion concerns a file this commit doesn't touch:

| Suite | Failing assertions (before = after) | What they check |
|---|---|---|
| `validate-discovery-experience` | 5 | legacy `HomeHeroSection` chips, single GeoFeed mount |
| `validate-discovery2-information-architecture` | 4 | |
| `authenticated-persona-breakpoint-matrix` | 2 | |
| `validate-pilot-launch-readiness-phase10a` | 3 | brand/settlement sub-validators |
| `validate-marketplace-responsive-nav-cleanup` | 1 | ecosystem block in drawer |
| `validate-discovery-phase5a` | 4 | |
| `validate-first-run-clarity-phase7a` | 4 | `HomeHeroSection` / mobile strip / `/sell` / Gezocht |
| `seo-zero-foundation` | 1 | sitemap-products |

`check-translations`: 8762/8763 keys translated (unchanged).

## Remaining scope (second pass)

Priority by traffic × pattern density:

1. **Shared i18n namespaces:** `affiliate` (34 dashes), `faq` (30; FAQ JSON-LD must stay consistent with visible answers), `overOns` (19), `feed` (17, incl. hints like "Reageer wanneer het jou uitkomt — je gesprek wacht op je."), `marketplace` (15), `home` (14), `register` (12), `business` (12), `guestBottomNav`, `guestSalesPanels.share`.
2. **SEO landing templates:** `app/[seoSlug]`, `app/eten-verkopen-[stad]` (17 cities in `lib/seo/localCities.ts`: check body repetition for doorway risk and fix at the template), plus `bijverdienen-vanuit-huis`, `eten-verkopen-vanuit-huis`, `geld-verdienen-met-koken`, `lokaal-eten-verkopen`, `lokaal-verdienen`, `lokale-producten-verkopen`, `thuisgekookt-eten-verkopen`, `unieke-producten-verkopen`, `verdienen-zonder-dropshipping`, `zelfgemaakt-eten-verkopen`. Snapshot title/meta/H1/canonical/JSON-LD per page with `scripts/probe-seo-snapshot.mjs` before editing.
3. **Static pages:** `hoe-homecheff-werkt` (meta already fine; body is client-rendered), `wat-is-homecheff`, `waarom-homecheff`, `wat-we-niet-zijn`, `werken-bij` + `hoe-werkt-het` + `vacatures`, `verdiencheck` intro (certified; only visual copy, keep fiscal precision), delivery public pages, `sell` onboarding.
4. **Cleanup:** remove unused `homePhase1.orientationExplain*` legacy keys once no validator references them. Add the explainer CTA to `HomeHeroSection` if the workspace-off path is ever used in production.
