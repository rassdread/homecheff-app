# First-Run Clarity & Seller Entry — Phase 7A Audit

Date: 2026-07-08
Scope: copy · routing · visibility · microcopy only (no redesign, no new
functionality, no backend/API/marketplace/ranking/payment/performance/design-
system change). Grounded in the current codebase and the Phase 7 audit
(`docs/audits/PRODUCT_EXPERIENCE_PHASE7_AUDIT.md`).

---

## 1. The two adoption blockers (Phase 7 → Phase 7A)

| # | Blocker (Phase 7) | Root cause in code | Phase 7A fix |
|---|---|---|---|
| P0-1 | New users don't understand *what HomeCheff is / why* on first view | Hero only had a verb-list subtitle; no plain noun definition; value prop copy existed but was unrendered | Added `homePhase1.heroDefinition` one-liner rendered in the desktop hero + surfaced in the mobile ecosystem strip (guests) + guest discover panel; how-it-works steps surfaced |
| P0-2 | Selling entry points push individuals to a **paid business subscription** | `/sell` renders only the BASIC/PRO/PREMIUM subscription cards; many links ("Start met verkopen", register redirect) point there | Reworked `/sell` to lead with a free-listing block → `/sell/new`; subscriptions reframed as an *optional* business upgrade. Fixing the destination page fixes every entry point at once (no logic/pricing change) |

---

## 2. Homepage clarity (7A.1 – 7A.3)

- **Definition (7A.1):** `homePhase1.heroDefinition` — "HomeCheff is een lokaal
  platform waar buurtgenoten eten, oogst, creaties, diensten en hulp kunnen
  kopen, verkopen, ruilen en afspreken." EN parity added.
  - Rendered in the desktop hero (small line under the subtitle — the hero has
    vertical room and `overflow-visible`).
  - Surfaced in `HomeMobileEcosystemStrip` for guests (`!isLoggedIn`) so it is
    visible on mobile first view directly below the compact hero (no hero-height
    risk; the compact mobile hero is height-constrained + `overflow-hidden`).
- **Why different (7A.2):** the guest `discover` panel body now carries the
  plain value prop (local, community, buy/sell/barter/arrange).
- **How it works (7A.3):** `howItWorksStep1..3` keys + the discover panel
  bullets ("1. Ontdek of plaats iets · 2. Maak een afspraak of voorstel ·
  3. Betaal, ruil of help lokaal"). Kept in the guest panel to avoid homepage
  bloat (explicitly allowed by the brief).

## 3. Seller entry (7A.4)

- `/sell` now opens with `sell.pageTitle` ("Verkopen op HomeCheff") and a
  prominent free-listing card (`sell.freeTitle/freeBody/freeCta`) whose CTA
  routes to the free create flow `/sell/new` (`MARKETPLACE_ENTRY_PATH`).
- The subscription grid is preserved unchanged but sits under a clear divider
  heading `sell.businessSectionTitle` ("Optioneel: zakelijk abonnement (KVK /
  bedrijf)") + `sell.businessSectionSubtitle` framing it as an upgrade, not a
  requirement.
- No pricing, plan, Stripe or subscription logic touched.

## 4. Vocabulary & naming consistency (7A.5 / 7A.6)

Chosen canonical terms (Phase 7 decision) applied to remaining visible strings:

- **Props → Waardering (NL) / Appreciation (EN):** removed the leftover stat/
  filter/tooltip strings ("props voor dit item", "Meeste props", "Minimaal
  props", "Studio props", "Props op studio-content", "reviews en props",
  community bullet, login-gate body, error toasts, `propsWithdrawn`). The button
  family was already "Waardering"/"Appreciation".
- `requester` label "Gezochte" → "Vrager"; "Gezocht door" → "Gevraagd door".

## 5. Jargon & typo cleanup (7A.7 / 7A.12)

- **"Geen geldleg" → "Geen betaling" / "No money leg" → "No payment"** (both
  the `productBinding` and `paymentPath` occurrences, NL + EN).
- **"CommunityOrders" → "groepsbestellingen" / "group orders"** in the payment
  hint.

## 6. Gezocht (7A.8)

- `discovery.requests.sectionSubtitle` rewritten to signal you can **browse and
  post** ("Bekijk wat buurtgenoten zoeken — of plaats zelf een oproep voor een
  product, dienst, hulp of iets dat gemaakt, bezorgd of gerepareerd moet
  worden."). EN parity.

## 7. Diensten / Buurthulp (7A.9) & Barter (7A.10)

- Services empty state now **defines** the concept at the point of use:
  "Diensten zijn services, workshops, coaching en praktische klusjes — inclusief
  buurthulp: lokale hulp tussen buurtgenoten." EN parity.
- `acceptedValues.description` rewritten to the plain point-of-use example
  ("geef aan wat je naast geld ook zou accepteren, zoals hulp, eten, bezorging
  of een creatie") + explicit "verplicht niemand tot ruilen".
- `barterOpenness.hint` adds "Ruilen is nooit verplicht en niet gegarandeerd —
  je spreekt het samen af." (no overpromised automated matching). EN parity.

## 8. New-maker trust (7A.11)

- `PublicSellerProfileNew` reviews tab replaced its hardcoded bare "Er zijn nog
  geen reviews voor deze verkoper" with `publicProfile.newMakerReassurance`
  ("Nieuwe maker — bekijk het profiel, de foto's en het aanbod, en maak
  duidelijke afspraken via een bericht."). Reassuring, no invented stats.

## 9. Notifications translation (7A.13)

- `app/notifications/page.tsx` header, subtitle and "mark all read" button were
  hardcoded Dutch (EN users saw Dutch). Added `notificationsPage.*` namespace
  (NL + EN) and wired the page to it.

## 10. Performance & regression (7A.14)

No architecture touched. Re-validated (see progress doc): Phase 4C runtime,
5C discovery pillars, 5E feedback, 6A/6B design system, density defaults, SWR
caches. All green. Changes are string edits + a few conditional render lines
guarded by existing props — no new fetches, remounts or cache/SWR changes.

## 11. Deferred / documented (not executed — out of safe copy scope)

- **Pillar/type chip subtitles** (P1-3): adding subtitles under compact feed/
  ecosystem chips is a layout change; deferred (concept is now defined via hero
  definition + services/Gezocht copy instead).
- **Global rename of nav labels routing to `/sell`** (SEO landing pages,
  register redirect): left as-is because fixing the `/sell` destination page
  already resolves the misdirection without touching routing logic.
- **Hardcoded "Nog geen producten"/"Nog geen recepten"** empties in
  `PublicSellerProfileNew` and the `mapApiToFeed` `'Melding'` fallback: minor
  untranslated strings; only the trust-critical reviews empty was migrated this
  phase.
- **`nl-from-vercel*.json` / `en-from-vercel*.json`** snapshots still contain
  legacy "Props" — these are backups, not the loaded runtime i18n; left
  untouched.
- **"Product ID" error string** (`productOrDishIdRequired`): low-visibility
  error toast; deferred.
- **Fans vs volgers, Aankopen vs bestellingen, bezorger/buurtbezorger/
  ambassadeur**: risky cross-surface renames; deferred per brief (document, do
  not mass-rename).
