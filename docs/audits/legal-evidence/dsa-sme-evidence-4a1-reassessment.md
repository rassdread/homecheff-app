# LEGAL-4A.1 — DSA SME / Article 29 evidence completion

**Phase:** LEGAL-4A.1 (evidence + classification only)  
**Previous evidence verdict:** `DSA_SME_EVIDENCE_INCOMPLETE`  
**New evidence verdict:** `DSA_SME_EVIDENCE_SUFFICIENT_FOR_REVIEW`  
**Recommended CompliancePlatformAssessment (NOT applied):** `SME_EXCLUSION_EXPECTED`  
**Production state:** remains `NOT_ASSESSED` until separate explicit human approval  

**Baseline main:** `bd6db78ac269a833b25598e1852fd936a6b2a5ab`  
**Baseline production:** `dpl_Agsee6q8Ccj4K9Ju9zs4nKhbybHt`

This file **supersedes** the incomplete conclusions in the prior `dsa-sme-evidence.md` for size/ownership/FTE. Payment-role sections elsewhere are unchanged.

---

## Delta from DSA_SME_EVIDENCE_INCOMPLETE

| Prior gap | Status after LEGAL-4A.1 |
|---|---|
| Annual accounts / financial history | **Closed years covered by Vpb filings 2022–2025** (not statutory jaarrekening) |
| Employee / FTE | KvK **Werkzame personen: 1** + owner declaration sole worker |
| Ownership / linked enterprises | KvK sole shareholder + Vpb 100% + no deelnemingen + owner declaration (no subsidiaries) |
| Recent KvK extract | **Independently verified** (09-07-2026) |
| Financial year | **Proven calendar year** 01-01 … 31-12 on all four Vpb filings |

---

## Evidence classifications used

`OFFICIAL_REGISTER_EVIDENCE` · `TAX_FILING_EVIDENCE` · `OWNER_DECLARATION` · `CODE_EVIDENCE` · `INFERENCE` · `COUNSEL_REQUIRED`

---

## 1. Legal entity (current)

| Fact | Value | Source type |
|---|---|---|
| Statutory name | **Arrias Beheer B.V.** | `OFFICIAL_REGISTER_EVIDENCE` (KvK 09-07-2026) + `CODE_EVIDENCE` (`LEGAL_OPERATOR`) |
| Legal form | Besloten Vennootschap | KvK |
| KvK | 80532829 | KvK + code |
| RSIN | 861704782 | KvK + Vpb (matches VAT `NL861704782B01`) |
| Statutory seat | Rotterdam | KvK |
| Establishment | Vlaardingen | KvK (street **redacted** from tracked docs) |
| Incorporation | 07-10-2020 (first registration 08-10-2020) | KvK |
| Trade name | Arrias Beheer B.V. | KvK |
| Working persons | **1** | KvK |
| Platform activity | Online-platform trade intermediation food + non-food (SBI 46170/46180 + free text) | KvK |
| Sole shareholder | One natural person, since 07-10-2020 | KvK (identity details **not** stored in git) |
| Director | One managing director, **alleen/zelfstandig bevoegd** | KvK |
| Issued capital (KvK) | EUR 1,20 geplaatst | KvK |

**Private original retention:** OneDrive `Arrias Beheer/uittreksel_handelsregister_80532829.pdf`  
**SHA-256 (integrity):** `d13b366fcefc4b57df503a08026d3187b7da55b4d8e628f41f9c9dacf61b1d90`  
**Do not commit** the PDF or photos containing address/DOB.

---

## 2. SOURCE_NAME_VARIANCE

| Source | Name shown |
|---|---|
| KvK extract + HomeCheff SSOT | **Arrias Beheer B.V.** |
| Vpb filings 2022–2025 | **Arias Beheer B.V.** (one “r”) |

**Treatment:** Canonical current legal identity = **Arrias Beheer B.V.** (recent KvK + code SSOT).  
Tax-return spelling = `SOURCE_NAME_VARIANCE`. Same **RSIN 861704782** establishes same fiscal entity context. **No invented explanation** for the spelling difference.

---

## 3. Vpb filings (2022–2025) — redacted summary

**Document class:** `VENNOOTSCHAPSBELASTINGAANGIFTE` / Vpb filing — **not** statutory jaarrekening.

| Year | Book year | Name on filing | RSIN | Fiscale eenheid | Hoofdactiviteit | Fiscaal ondernemingsvermogen / totaal activa | Belastbare winst | Te betalen Vpb | 100% NP shareholder | Deelnemingen? | SHA-256 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2022 | 01-01-2022 … 31-12-2022 | Arias Beheer B.V. | 861704782 | Nee | Financiële holding | € 1 | € 0 | € 0 | Yes | Nee | `0f51e470…bf71b` |
| 2023 | 01-01-2023 … 31-12-2023 | Arias Beheer B.V. | 861704782 | Nee | Financiële holding | € 1 | € 0 | € 0 | Yes | Nee | `c740da3c…d889` |
| 2024 | 01-01-2024 … 31-12-2024 | Arias Beheer B.V. | 861704782 | Nee | Financiële holding | € 1 | € 0 | € 0 | Yes | Nee | `e83e3061…4d4c` |
| 2025 | 01-01-2025 … 31-12-2025 | Arias Beheer B.V. | 861704782 | Nee | Financiële holding | € 1 | € 0 | € 0 | Yes | Nee | `edf702eb…d8dc` |

Printed/exported copies dated **8-7-2026**; filenames indicate Belastingdienst export timestamps 08-07-2026.

**Corroboration (not a linked enterprise):** accountant invoice (Metis Voorburg B.V.) for preparing/submitting Vpb 2022–2025 — retained privately; banking/contact details **not** copied to git.

**PII excluded from git:** home address, consultant phone, DOB, any BSN fields (filings answer BSN known = Nee).

**2026:** not a closed financial year — operating status only (KvK + owner declaration).

---

## 4. OWNER_DECLARATION (current)

Recorded as `OWNER_DECLARATION` (not independently registry-verified beyond overlap with KvK/Vpb):

- Arrias Beheer B.V. currently has **no subsidiaries**
- **No** separate HomeCheff legal entity today
- HomeCheff is operated/developed **within** Arrias Beheer B.V.
- Future spin-out **possible but has not happened**
- **No other employees**; owner is the only person working in the company

---

## 5. Employee / AWU

| Signal | Value | Type |
|---|---|---|
| KvK Werkzame personen | 1 | `OFFICIAL_REGISTER_EVIDENCE` |
| Owner: only worker; no other employees | Yes | `OWNER_DECLARATION` |
| Exact AWU = 1.0 proven? | **Not claimed** | DGA/owner AWU methodology = `COUNSEL_OR_ACCOUNTANT_CONFIRMATION` (narrow) |

**Materiality:** Even if owner AWU were counted as 1 (or ≤ a few units), headcount remains **dramatically below** micro (&lt;10) and small (&lt;50) thresholds. Uncertainty is **`IMMATERIAL_TO_CURRENT_SIZE_RESULT`**.

Do **not** count platform sellers/couriers/affiliates as company staff.

---

## 6. SME size test (Recommendation 2003/361/EC)

Source: EUR-Lex CELEX `32003H0361` (Annex Art.2).

### Staff

| | |
|---|---|
| Micro threshold | &lt; 10 persons |
| Small threshold (Art.29 ceiling) | &lt; 50 persons |
| Observed | 1 working person (KvK) + sole-worker declaration |
| Result | **PASS** (micro and small) |
| Confidence | High for threshold distance; AWU exactness immaterial |

### Turnover

| | |
|---|---|
| Micro | ≤ EUR 2m |
| Small | ≤ EUR 10m |
| Observed | Vpb shows de minimis fiscal enterprise (€1 equity/assets), €0 belastbare winst, empty commercial P&amp;L for holding years; **no marketplace GMV used** |
| Result | **PASS** (on available tax evidence; note Vpb ≠ jaarrekening “omzet” line-item) |
| Confidence | High that true turnover is far below thresholds for closed years; accountant confirmation of “omzet = 0 / de minimis” = nice-to-have, **immaterial** at this scale |

### Balance-sheet total

| | |
|---|---|
| Micro | ≤ EUR 2m |
| Small | ≤ EUR 10m |
| Observed | Fiscal totaal activa / ondernemingsvermogen **€ 1** each closed year |
| Result | **PASS** |
| Confidence | High |

### Marketplace GMV as company turnover?

**NO** — not used.

---

## 7. Linked / partner enterprises

| Test | Result |
|---|---|
| Partner enterprise (25%+ by another *enterprise*) | No evidence of corporate partner owner; sole NP shareholder |
| Linked via subsidiaries / deelnemingen | Vpb: no deelnemingen; owner: no subsidiaries |
| Linked via same NP controlling other same-market enterprises | Residual: owner declares none; **cannot prove universal negative from registry alone** |
| Aggregation required for current assessment? | **Not indicated** on available evidence |
| CURRENT_GROUP_STRUCTURE_STATUS | **Arrias Beheer B.V. only (current HomeCheff operator); no HomeCheff sub** |
| Evidence confidence | High for “no subsidiaries / no deelnemingen”; residual NP multi-company issue = `FUTURE_MONITORING` + optional written owner confirmation of no other controlled enterprises |
| Materiality of residual | **IMMATERIAL** unless owner controls another large same-market enterprise (owner says none) |

Do **not** treat Metis Voorburg B.V. (tax advisor) as linked.

---

## 8. Two-year / Art.29 transition

- Four consecutive closed Vpb years (2022–2025) all de minimis → no evidence of prior loss of micro/small status in those years.
- DSA Art.29 12-month post-loss rule: **not triggered** on available closed-year evidence.
- Rec. Art.4(2) two-year threshold-crossing rule: no crossing observed in closed years.
- **2026 YTD** incomplete — monitor growth; do not invent full-year 2026 numbers.

---

## 9. VLOP

| | |
|---|---|
| Search | European Commission DSA VLOP/VLOSE designation lists (digital-strategy.ec.europa.eu; EUR-Lex C/2026/1654 list) |
| HomeCheff / Arrias Beheer | **Not found** among designated services |
| Result | `VLOP_DESIGNATED = NO_EVIDENCE_FOUND` (checked 2026-08-15) |
| Note | Not converting “not found” into metaphysical impossibility; annual re-check recommended |

Art.29(2) VLOP derogation: **not applicable** on current designation evidence.

---

## 10. Article 29 reassessment

Online platform allowing consumers to conclude distance contracts with traders: **yes** (`CODE_EVIDENCE` + KvK platform activity text).

Given micro/small size evidence + no VLOP designation evidence:

| Option | Fit |
|---|---|
| A `NOT_ASSESSED` | No longer accurate as *evidence* posture (was correct before pack) |
| B `SME_EXCLUSION_EXPECTED` | **Supported** as internal evidence-backed assessment |
| C `ARTICLE_30_APPLIES` | Not supported by size evidence |
| D `COUNSEL_REVIEW_REQUIRED` | Only if human prefers counsel sign-off before recording B |

**This is not a lawyer’s confirmation that Article 30 can never apply.**

---

## 11. State-change decision (human gate)

```
STATE_CHANGE_RECOMMENDED = YES
STATE_CHANGE_TARGET = SME_EXCLUSION_EXPECTED
REASON = Closed-year Vpb 2022–2025 de minimis + KvK working persons 1 + sole shareholder /
         no deelnemingen / owner no-subsidiary declaration + no VLOP designation found;
         residual AWU/other-NP-company uncertainties immaterial to threshold distance.
REMAINING_BLOCKERS = none material for recording SME_EXCLUSION_EXPECTED
PRODUCTION_MUTATION = NOT DONE (await explicit approval)
```

---

## 12. Article 30 consequence if SME_EXCLUSION_EXPECTED recorded

Do **not** build LEGAL-4B full trader traceability now.

**Retain** as good practice regardless:

- LEGAL-1 commerceDeclaration  
- Business identity / Business.verified path  
- Stripe Connect KYC  
- TRUST-1 / TRUST-1.1  
- LEGAL-2 / LEGAL-3 consumer/food disclosures  

---

## 13. Future monitoring (minimal)

Reassess when any of:

- staff/AWU approaches micro/small ceilings  
- company turnover or balance-sheet approaches thresholds  
- ownership/group/subsidiary changes  
- HomeCheff spin-out to new entity  
- acquisitions  
- VLOP/DSA designation changes  

**Recommended cadence:** annual compliance review (document only; no new infra this phase).

### HomeCheff spin-out note (FUTURE)

If HomeCheff becomes a separate legal entity: **do not inherit** this SME assessment automatically — reassess operator identity, aggregation, Terms/Privacy/SSOT, Stripe ownership, DAC7 platform identity.

---

## 14. Private data room

| Item | Tracked git? | Where originals stay |
|---|---|---|
| KvK PDF + photos | **NO** | Private OneDrive / owner vault |
| Vpb PDFs 2022–2025 | **NO** | Private vault (WhatsApp export copies → archive privately) |
| Accountant invoice | **NO** | Private |
| Redacted summaries / matrix | YES (this folder) | — |

---

## Final phase verdict

**HOMECHEFF_DSA_SME_ARTICLE29_EVIDENCE_READY**
