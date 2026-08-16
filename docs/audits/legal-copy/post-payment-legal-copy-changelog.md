# Legal/copy changelog — post-payment alignment

Effective Terms bump: **1.1 → 1.2** (`2026-08-16`). Privacy unchanged **1.0 / 2026-08-14**.

| SURFACE | BEFORE | AFTER | WHY | LEGAL BASIS / TECHNICAL FACT | VERSION IMPACT |
|---|---|---|---|---|---|
| Terms / FAQ “geen partij in transacties” | Absolute non-party claim | Facilitation: product agreement between buyer & provider; HomeCheff facilitates platform, Stripe payment, settlement; qualification may depend on law | Absolute distance overclaimed vs platform charge/fee/refund/dispute control | Certified SCT + platform charge | Terms **1.2** |
| Checkout line item | `Transactiekosten (Stripe)` | `Transactiekosten` | Surcharge ≠ exact Stripe fee (live 27¢ vs 29¢) | Buyer surcharge formula | None (checkout API) |
| Checkout fee disclaimer | “Stripe-kosten worden doorberekend…” | “Betaalkosten (transactiekosten)…” | Same | Same | i18n cache 2.38 |
| Seller earnings escrow strings | “escrow” / derdenrekening optics | “gereserveerd voor uitbetaling” / Connect transfer then bank | Not regulated escrow | Delayed Connect transfer | i18n |
| FAQ shipping reservation | Escrow framing | Technical delay of Connect transfer; not derdenrekening / protected escrow service | Same | Same | i18n |
| DAC7 / tax obligation | Implied current filing/sharing | Collect/report **when required**; not automatic tax liability | LEGAL-4A readiness ≠ live filing product | LEGAL-4A | Terms/FAQ |
| Courier earnings | Implied automatic Connect | Ledger entitlement; Connect not guaranteed | Certification: courier ledger-only | Multi-recipient cert | i18n |
| Affiliate payout marketing | Weekly Stripe Connect as guaranteed | Ledger + Connect when batch available; funded from platform fee | Affiliate batch lacks `source_transaction`; fee-funded | Multi-recipient cert | i18n |
| Admin order action | “Escrow vrijgeven” | “Uitbetaling vrijgeven” | Align public semantics | Delayed transfer release | UI label |
| Pillar pricing blurb | “Stripe-kosten voor de koper” | “betaalkosten voor de koper” | Surcharge label accuracy | Same | Copy |
| Liability FAQ (EN/NL) | “only a platform / not a party” absolutes | Facilitation + counsel-safe qualifier | Payment-role optics | Certified payment role facts | Terms/FAQ |

Privacy: audited against Stripe / Connect / transaction / refund / dispute records — **no substantive Privacy amendment** in this pass (version unchanged).
