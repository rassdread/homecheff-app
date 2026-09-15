# HomeCheff profile notices — exact missing reason

**Rule:** never show a generic profile warning when the system already knows which field is missing.

**COMMIT_SHA:** `ab2e1a81`  
**PRODUCTION_AUTHENTICATED_SMOKE:** PASS (`https://homecheff.eu`, tag `preq_mu2jeoxh`)

## Source of truth

| Surface | Engine |
|---|---|
| Listing / chat / sell 403 | `evaluateProfileRequirements` + `accountRequirementsMissingResponse` |
| Sidebar / Mijn HomeCheff | `buildUserActionItems` / `buildSellerActionItems` via the same notice catalog |
| Delivery settings / dashboard / activate | `noticesForDeliveryMissing(completion.missing)` |
| Seller location nudge | `recommendedSellerLocationNotices` (RECOMMENDED, not blocking) |
| `/api/profile/me` | `user.profileRequirements` (`isComplete`, `blockingRequirements`, `recommendedRequirements`, `notice`, `targetRoute`) |

Catalog: `lib/account/profile-requirement-notice.ts`  
Composer: `lib/account/evaluate-profile-requirements.ts`

## Blocking vs recommended

| Action | Blocking | Not blocking |
|---|---|---|
| Item / dienst / ruilen (`postItem`) | emailVerified, username, termsAccepted | Stripe, woonplaats, foto, naam |
| Contact (`sendMessage`) | emailVerified, username | terms, Stripe, profile extras |
| Sell / payout (`sell`) | postItem + stripeOnboarding when Connect is incomplete | photo / place |
| Bezorgen | serviceArea, availability, pricing, companyDisplayName (business) | Stripe |
| Affiliate / Chef / Garden / Designer listing | same `postItem` gate | Stripe not required to place |

## Forbidden titles (FAIL)

`Maak je profiel af`, `Voltooi je bezorgprofiel`, `Je profiel is nog niet compleet`, `Profiel bijwerken`, `Rond je bezorgprofiel af`, and equivalents as the only copy.

## Production gates

```bash
npx tsx scripts/certify-profile-requirement-notices-production.mts
```

| Gate | Result |
|---|---|
| GENERIC_PROFILE_WARNING_WITHOUT_REASON | NONE |
| LISTING_GATE_EXACT_MISSING_REASON | PASS |
| DELIVERY_EXACT_MISSING_REASON | PASS |
| SIDEBAR_EXACT_MISSING_REASON | PASS |
| SIDEBAR_CTA_TARGET | PASS |
| RESOLVED_WARNING_DISAPPEARS | PASS |
| MULTIPLE_MISSING_REQUIREMENTS | PASS |
| BLOCKING_VS_RECOMMENDED | PASS |
| PROFILE_REQUIREMENTS_SOURCE_OF_TRUTH | PASS |
| STALE_PROFILE_WARNINGS | NONE |
| DUPLICATE_PROFILE_WARNINGS | NONE |

Live examples:

- Listing without terms → “Accepteer de algemene voorwaarden.” / CTA “Voorwaarden accepteren”
- Sidebar without woonplaats → “Voeg je woonplaats toe om items in jouw buurt te kunnen aanbieden.”
- Incomplete courier (pricing) → “Vul je bezorgtarief in voordat je bezorgopdrachten kunt aannemen.”
- After prices saved → delivery incomplete notice gone
- Complete account → no profile/account/delivery incomplete items

Evidence: `docs/audits/profile-requirement-notices-cert/report.json`
