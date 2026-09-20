# VerdienCheck general public earning tool — audit + affiliate research

2026-09-20. Official sources only for affiliate classification.

## CURRENT_HOMECHEFF_ASSUMPTIONS

- Activity title: “Wat wil je via HomeCheff doen?”
- Tracking: “Wij houden je verkopen bij”
- Sell CTA always `/sell/new` + “Maak je eerste aanbod” on READY
- Hardcoded `incomeSource: MARKETPLACE_SELLER`
- SEO: “Wil je iets verkopen…”
- DAC7 copy assumes HomeCheff reporting
- Money: “buiten HomeCheff” for other VAT turnover

## CURRENT_ACTIVITY_TYPES

MAKE/GARDEN → PRODUCT, FOOD → FOOD, SERVICE → SERVICE, UNKNOWN → empty. No affiliate UI.

## CURRENT_INCOME_TYPES

Turnover − costs = result; ROW assumption; baselines for wages/allowances. No commission field. V1 calculator disabled AFFILIATE.

## CURRENT_PLATFORM_DEPENDENCIES

No platform question. Entry points: direct, faq, seller, careers, werken-bij. Entry does not change legal result.

## CURRENT_RESULT_CTA_DEPENDENCIES

READY → primary listing CTA. PROCEED_AFTER_ACTION → secondary listing CTA. No activity fork.

## CURRENT_MONEY_MODEL

One commercial extra-earning stream + optional other VAT turnover. Do not sum unrelated gross amounts.

## CURRENT_ANALYTICS

Consent-gated funnel. `entry_point` allowlisted. No activity/benefit/amounts.

## CURRENT_SEO_POSITIONING

`VerdienCheck | HomeCheff`, selling-framed description, no JSON-LD, no sitemap from this module.

## Classification

| Dependency | Class |
| --- | --- |
| Tax/Zvw/toeslagen/IACK/AOW formulas | KEEP |
| Food/NVWA/allergens/KVK/VAT/KOR/DAC7 engines | KEEP |
| Activity “via HomeCheff” | GENERALIZE |
| Tracking / monitoring claim | REMOVE (false; VerdienWijzer off) |
| Sell CTA | CONTEXTUALIZE |
| AFFILIATE income source | GENERALIZE (same calculator; REVIEW classification) |
| Platform question in Quick Check | REMOVE (does not change legal result) |
| Homepage placement | KEEP dirty work untouched; recommend later |
| activity_category analytics | REMOVE this phase (privacy) |

## AFFILIATE LEGAL RESEARCH

Sources (Belastingdienst, 2026):

- https://www.belastingdienst.nl/wps/wcm/connect/nl/werk-en-inkomen/content/wat-zijn-inkomsten-uit-overig-werk
- https://www.belastingdienst.nl/wps/wcm/connect/nl/werk-en-inkomen/content/welke-bijverdiensten-moet-ik-aangeven
- https://www.belastingdienst.nl/wps/wcm/connect/nl/jongeren/content/ik-maak-content-op-internet-moet-ik-mijn-inkomsten-aangeven

Rule: commission is taxable income. If not an entrepreneur for income tax, it is usually “inkomsten uit overig werk” (result after deductible costs; Zvw may apply). If entrepreneurship facts are met, it is winst uit onderneming. No universal affiliate exemption. Platform choice does not decide this.

AFFILIATE_LEGAL_CLASSIFICATION = REVIEW_REQUIRED (onderneming vs overig werk uses existing KVK/intent facts, not a new invented class).
AFFILIATE_FINANCIAL_CLASSIFICATION = REVIEW_REQUIRED (same result engine as other extra earnings; do not treat as product turnover or wages).

## MONEY AGGREGATION

Do not add HomeCheff turnover + affiliate commission + external sales as one gross figure. Certified path remains: one extra-earning result (receipts minus relevant costs) plus existing baselines. Multiple independent streams stay later/P1.
