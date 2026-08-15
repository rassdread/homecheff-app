# Counsel / Decision Matrix

| Question | Facts complete? | Missing evidence | Can HomeCheff/Cursor decide? | Counsel required? | Next action |
|---|---|---|---|---|---|
| DSA SME Art.29 | NO | Accounts, FTE, group structure, boekjaar, KvK live confirm | NO (state stay `NOT_ASSESSED`) | YES for final classification | Owner pack → accountant → counsel → then admin state |
| DSA Art.30 scope | NO | Depends on Art.29 outcome | NO | YES | Wait for SME verdict |
| Stripe technical MoR (Stripe sense) | YES (architecture) | Dashboard branding | YES for **technical** description only | Soft | Complete Dashboard checklist |
| Underlying-contract seller / civil MoR | NO | Receipt identity + Terms vs charge locus | NO | **YES** | Counsel pack with B1–B4 evidence |
| PSD2 | NO | Same + DNB characterisation | NO | **YES** | Counsel |
| Refund allocation | PARTIAL | After-transfer clawback economics | NO | YES | Ops cases + counsel |
| Chargeback allocation | PARTIAL | Dispute liability Dashboard | NO | YES | Dashboard #14–15 + counsel |
| Invoice structure | NO | Receipt/VAT supplier identity | NO | YES | Controlled receipt |
| Delivery role | PARTIAL | Wording vs independence | NO | YES (wording) | Counsel; no code fix this phase |
| DAC7 identity package | NO | Legal field list NL | NO | YES | Counsel before collecting TIN/BSN |
| DAC7 monetary consideration | PARTIAL | Filing rules | Derive YES; file NO | YES for filing | Improve reconciliation later |
| DAC7 refunds | PARTIAL | Item allocation | NO for filing | YES | Keep RECONCILIATION_REQUIRED |
| DAC7 barter | PARTIAL | Valuation rule | NO | YES | Keep COUNSEL valuation |
| Retention | NO | Policy + legal | NO | YES | Separate privacy/tax retention work |

## Stripe KYC vs future Art.30 (capability — no PII harvest)

| Art.30-ish need (conceptual) | Home DB | Stripe runtime (`accounts.retrieve`) | Verified by Stripe | Local ID copy |
|---|---|---|---|---|
| Name | AVAILABLE_HOME_DB | AVAILABLE_STRIPE_RUNTIME | VERIFIED_BY_STRIPE (when charges/payouts enabled) | LOCAL_STORAGE_REQUIREMENT_COUNSEL |
| Address | AVAILABLE_HOME_DB (partial) | AVAILABLE_STRIPE_RUNTIME | VERIFIED_BY_STRIPE (status) | COUNSEL |
| Email / phone | AVAILABLE_HOME_DB | AVAILABLE_STRIPE_RUNTIME | partial | COUNSEL |
| DOB | AVAILABLE_HOME_DB (optional field) | presence via requirements — do not store docs | VERIFIED_BY_STRIPE | COUNSEL |
| Company / KvK / VAT | AVAILABLE_HOME_DB / Business | may expose tax_id **presence** only | Stripe KYC | COUNSEL |
| ID document images | NOT_AVAILABLE (and must not harvest) | Stripe holds — do not retrieve images | VERIFIED_BY_STRIPE | **LOCAL_STORAGE_REQUIREMENT_COUNSEL** — do not collect now |
| IBAN / external_account | DORMANT local IBAN; Stripe external_account **presence** only | AVAILABLE_STRIPE_RUNTIME (presence) | Stripe | Do not revive local IBAN for DSA |

**Local ID copy required?** remains **`COUNSEL_REQUIRED`** — not implemented.
