# HOMECHEFF WORK / EARN / SHARE — PRODUCTION STATUS

**Date:** 2026-09-06

| Runtime | SHA | Deployment |
|---------|-----|------------|
| Marketplace | `77cd31a30f0ec87da4f643cf1cdf3b1bf76d25ed` | `dpl_H9ZE5mbuMWncoFiCMnGBMTMgD4XE` |
| Growth | `e5c9707facd212cf3330a9b50c0547c445e45197` | `dpl_2cxAQsJk9qSSkJ8K1U7oLNCWuBbX` |
| Studio | `5f384d9417c11f410bd087f4a4c1c0358daf6968` | `dpl_FjeHjFbmARjHRtf4bwG7F2QFkE8a` |

---

## Shipped

- **Verdien hub** at `/werken-bij` (alias `/verdien`) — benefit-led opportunity cards + orientation + Delivery highlight
- **Employment split** at `/werken-bij/vacatures` (empty honest state, not fake jobs)
- **EcosystemShareAction** — personal / company / plain via existing resolver
- **Deep links:** Delivery `/delivery/signup` + `/delivery/company/signup`
- Company SHARE destinations expanded (delivery, affiliate, studio, growth, hub)
- Affiliate dashboard **Deel & verdien** share center
- Growth account **Deel Growth**; Studio account **Deel Studio**
- Nav/footer/home promo copy → Verdien met HomeCheff
- Client analytics events: `opportunity_hub_view`, `opportunity_card_click`, `opportunity_share_*`

## Production smoke

- `https://homecheff.eu/werken-bij` → 200, title **Verdien met HomeCheff**
- Company ensure `/delivery/signup` → `/a/homecheff-cert-g-15df47` → 302 to delivery signup + `aff_track`

## Remaining blockers (honest)

1. Full **cross-domain signup lock matrix** (HC↔Growth↔Studio personal+company) not re-executed end-to-end this release (binders unchanged; reuse prior certs).
2. Controlled **Delivery provider signup E2E** from shared link (canonical lock) not run this release.
3. **SHARE_TO_ATTRIBUTION_RATE** / funnel BI dashboards not built — events only.
4. Referral progress / “aangebrachte bezorgers” dashboard segment deferred.

---

`FINAL_DECISION = HOMECHEFF_WORK_EARN_AND_ECOSYSTEM_SHARING_PARTIAL_WITH_BLOCKERS`
