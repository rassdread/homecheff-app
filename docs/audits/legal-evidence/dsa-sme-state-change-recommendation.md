# LEGAL-4A.1 — State change recommendation (human gate)

**Do not execute without explicit owner/admin approval.**

| Field | Value |
|---|---|
| STATE_CHANGE_RECOMMENDED | **YES** |
| STATE_CHANGE_TARGET | `SME_EXCLUSION_EXPECTED` |
| CURRENT_PRODUCTION_STATE | `NOT_ASSESSED` |
| PRODUCTION_CHANGED_IN_4A1 | **NO** |
| REASON | See `dsa-sme-evidence-4a1-reassessment.md` |
| REMAINING_MATERIAL_BLOCKERS | **None** for recording `SME_EXCLUSION_EXPECTED` |
| OPTIONAL_BEFORE_FLIP | Written owner confirmation: no other controlled enterprises in same/adjacent markets; optional accountant one-liner on omzet |
| HOW_TO_APPLY_LATER | Admin Financial → Compliance → set DSA state + assessment note referencing LEGAL-4A.1 pack / KvK date / Vpb years (no PII) |
| MUST_NOT | Auto-flip from CI/agent; build LEGAL-4B; collect BSN/TIN/ID/IBAN |

Assessment note template (no PII):

```
LEGAL-4A.1: KvK extract 2026-07-09 (80532829, RSIN 861704782, working persons 1);
Vpb filings 2022-2025 calendar years de minimis (€1 fiscal assets, €0 taxable profit, no fiscale eenheid, no deelnemingen);
owner declaration no subsidiaries / HomeCheff within BV / sole worker;
VLOP not found on EC designation list 2026-08-15;
SOURCE_NAME_VARIANCE Arias vs Arrias on Vpb vs KvK — same RSIN.
Not a counsel opinion. Annual review required.
```
