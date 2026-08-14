# TRUST-1 — Community Marketplace Integrity (CORRECTED CONTRACT)

**Status:** Implementation contract (replaces LEGAL-2 appendix semantics for `NOT_SELF_MADE`)  
**Main before:** `4ad01f1e`  
**Production before:** `dpl_3Hz35XU7pjqthKaS1adeynYMsiZx`

---

## Canonical marketplace-fit definition

HomeCheff is for products and services to which the provider has **personally added meaningful value** through their own work, skill, creativity, preparation, cultivation, personalisation, transformation, restoration, assembly, design or service.

**Unmodified resale does not belong.** Origin of base materials/components is **not** decisive. Wholesale purchase, import country, quantity, or manufactured components alone are **not** violations.

**Allowed:** spray-paint blanks, print shirts, restore furniture, assemble jewellery, prepare food from bought ingredients, personalise/engrave, grow plants, personal services.

**Not allowed:** unchanged finished import/wholesale dropship/resale.

**Not the rule:** “must be entirely homemade from raw materials.”

---

## Report reasons (internal enum)

| Id | NL (user) | EN |
|----|-----------|-----|
| `NO_MEANINGFUL_SELLER_CONTRIBUTION` | Dit lijkt ongewijzigde wederverkoop | This looks like unmodified resale |
| `MISLEADING_OR_FALSE` | Misleidende of onjuiste beschrijving | Misleading or false description |
| `PROHIBITED_OR_UNSAFE` | Verboden of onveilig aanbod | Prohibited or unsafe offer |
| `SPAM_OR_DUPLICATE` | Spam of dubbel aanbod | Spam or duplicate offer |
| `WRONG_CATEGORY` | Verkeerde categorie | Wrong category |
| `OTHER` | Anders | Other |

Supporting copy for contribution reason:

> HomeCheff is bedoeld voor aanbod waar de aanbieder zelf iets aan maakt, bereidt, kweekt, ontwerpt, personaliseert, bewerkt, restaureert, samenstelt of als eigen dienst uitvoert.

`NO_MEANINGFUL_SELLER_CONTRIBUTION` = marketplace-fit signal, **not** fraud/tax/trader verdict.

**Deprecated (must not ship):** `NOT_SELF_MADE`

---

## Contribution / provenance

Types (future): MADE, PREPARED, GROWN, DESIGNED, PERSONALISED, TRANSFORMED, RESTORED, ASSEMBLED, OTHER_OWN_WORK (+ services as own skill).

**TRUST-1:** do **not** require contribution fields on create/edit. Legacy listings without provenance stay visible.

**TRUST-1.1:** optional “Wat heb jij zelf aan dit product gedaan?” + short explanation; never auto-hide for missing data.

---

## Schema (additive)

```
Product.integrityStatus String @default("ACTIVE")
  // ACTIVE | REVIEW_REQUIRED | TEMPORARILY_HIDDEN | UNDER_REVIEW | REMOVED
Product.integrityHiddenAt DateTime?
Product.integrityHiddenReason String?
Product.integrityCaseId String?  // optional link

ProductIntegrityReport {
  id, productId, reporterId, reason, explanation?,
  status OPEN|UNDER_REVIEW|RESOLVED|DISMISSED|WITHDRAWN,
  credibilityWeight Float, createdAt, resolvedAt?,
  @@unique([reporterId, productId, reason]) // one active logical report; soft via status
}

ProductIntegrityAction {
  id, productId, actorUserId?, action, note?, meta Json?, createdAt
  // REPORTED | THRESHOLD_HIDE | ADMIN_RESTORE | ADMIN_REMOVE | ADMIN_UNDER_REVIEW | …
}
```

**Why not `Product.isActive`:** seller pause ≠ moderation hide; restore must not reactivate seller-deactivated items.

---

## Credibility / anti-brigading (deterministic v1)

Window: **14 days**.

Weight per unique `(reporter, product)` (best reason kept):

| Reporter | Weight |
|----------|--------|
| Account age &lt; 7d | 0.25 |
| Email not verified | max 0.5 |
| Verified + age ≥ 7d | 1.0 |
| Verified + age ≥ 30d | 1.25 |

Rules:

- No self-report
- Duplicate same user+product+reason → reject (unique)
- Same user multiple reasons → count **once** toward unique reporters; weight = max of their reports
- Hide when: `uniqueReporters ≥ 3` **AND** `weightSum ≥ 2.5` → `TEMPORARILY_HIDDEN`
- `PROHIBITED_OR_UNSAFE`: always create `REVIEW_REQUIRED` + admin notify; **no** single-report auto-hide in v1
- Threshold is **not** a legal verdict — temporary review only

---

## Eligibility

Public discovery requires `integrityStatus IN ('ACTIVE','REVIEW_REQUIRED')` **and** ordinary `isActive` rules.

Integrate in `lib/feed/feed-product-query.server.ts` (+ profile/seller/`/api/products` mirrors). **No GeoFeed/endless/CTA/radius/sort changes.**

Detail URL: show unavailable/review state (not hard 404). Seller/owner + admin still load full. Profile public lists exclude hidden/removed.

---

## Notifications

- Admin: existing `ADMIN_NOTICE` + integrity admin queue
- Seller on auto-hide: in-app notice — “Je aanbod is tijdelijk niet zichtbaar terwijl we meldingen controleren.” (no reporter identity)
- Appeal/clarification: **TRUST-1.1** minimal (admin restore in TRUST-1)

---

## Phases

1. Schema + enums + eligibility helper + feed/query mirrors  
2. Report API + credibility + threshold hide + admin actions  
3. Listing report UI + seller hide notice  
4. Admin integrity panel (restore/remove)  
5. Tests + migrate + deploy  

No LEGAL-3 / TRUST-2 / Stripe / HCP / LEGAL-1/2 mutation.
