# VerdienCheck — FAQ compliance inventory

Status of every listed item: **NEEDS_OFFICIAL_REVIEW**.

This file inventories existing copy. It does **not** replace it and does **not** add new fiscal claims.

Source files: `public/i18n/nl.json`, `public/i18n/en.json`.

---

## faq.general.5

| | |
|---|---|
| NL key | `faq.general.5` |
| EN key | `faq.general.5` |
| NL (huidig) | Vraag: “Kan ik bijverdienen naast mijn uitkering?” Antwoord claimt o.a. Wajong 70% verrekening; bijstand “een deel houden”; alle inkomsten binnen 1 week melden bij UWV. |
| EN (huidig) | Question: “Can I earn extra income alongside your benefits?” Answer claims Wajong 70% deducted; social assistance “keep part”; report to UWV within 1 week. |
| Risk | Voegt WW/bijstand/Wajong/WIA/ZW/WAO/WAZ samen tot één generieke uitkeringsmelding. Hardcoded percentage. Geen officiële bron. |
| Vervangen door | Aparte guidance-routes `WW`, `BIJSTAND`, `WIA`, `WAJONG`, `ZW`, `WAO`, `WAZ` + officiële URL uit gecertificeerde pack. Geen verdiengrens verzinnen. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## faq.taxes.0

| | |
|---|---|
| NL key | `faq.taxes.0` |
| EN key | `faq.taxes.0` |
| NL (huidig) | “Moet ik belasting betalen over mijn verkopen?” — alle inkomsten opgeven, geen minimumbedrag. |
| EN (huidig) | “Do I have to pay taxes on my sales?” — all income must be reported, no minimum. |
| Risk | Absoluut “geen minimum” zonder jaargebonden nuance of bron. Kan angst of valse zekerheid geven. |
| Vervangen door | Calculator A vs B + incomeTax-delta uit NL-year pack; copy verwijst naar officiële Belastingdienst-bron. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## faq.taxes.1

| | |
|---|---|
| NL key | `faq.taxes.1` |
| EN key | `faq.taxes.1` |
| NL (huidig) | “Vanaf welk bedrag moet ik BTW betalen?” — “BTW-plichtig vanaf €20.000 omzet per jaar.” |
| EN (huidig) | “VAT-liable from €20,000 revenue per year.” |
| Risk | Hardcoded omzetdrempel in i18n, niet in een jaargebonden VAT/KOR-pack. Verwarring omzet vs resultaat. |
| Vervangen door | `VAT` / `KOR` parameters in gecertificeerde NL-year pack + guidance; geen drempel in React/FAQ tot certificering. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## faq.taxes.2

| | |
|---|---|
| NL key | `faq.taxes.2` |
| EN key | `faq.taxes.2` |
| NL (huidig) | DAC7-achtige rapportage “wanneer de toepasselijke regels dat vereisen”; geen automatische belastingplicht. |
| EN (huidig) | Soft DAC7 wording; not automatic tax liability. |
| Risk | Relatief voorzichtig, maar staat naast hardere duplicate `taxOurObligationText`. Inconsistent. |
| Vervangen door | DAC7-guidance as **apart** van belastingcalculator (`lib/compliance/dac7-*` intern; gebruikerstekst uit gecertificeerde DAC7-parameter). |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## faq.taxes.3

| | |
|---|---|
| NL key | `faq.taxes.3` |
| EN key | `faq.taxes.3` |
| NL (huidig) | KvK: structurele verkoop → inschrijven; incidenteel meestal niet. |
| EN (huidig) | Structural sales → Chamber of Commerce; occasional usually not. |
| Risk | Reduceert KvK tot frequentie/omzet-gevoel zonder activity-context (1×€5.000 vs 100×€50). |
| Vervangen door | KVK-guidance op `ActivityContext` (frequency, intent, continuity, ticket size, unit count) — geen enkele omzetgrens. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## faq.taxes.4

| | |
|---|---|
| NL key | `faq.taxes.4` |
| EN key | `faq.taxes.4` |
| NL (huidig) | HomeCheff biedt geen belastingadvies. |
| EN (huidig) | HomeCheff does not provide tax advice. |
| Risk | Laag. Past bij disclaimer; moet consistent blijven met VerdienCheck-belofte (uitleg/berekening ≠ advies-als-vervanging). |
| Vervangen door | Korte VerdienCheck-disclaimer (“jij blijft verantwoordelijk…”) naast officiële bronnen. Geen nieuwe fiscale claim. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## taxOurObligationText (duplicate keys)

| | |
|---|---|
| NL keys | `taxOurObligationText` — twee verschillende strings in `nl.json` (~4209 hard DAC7 30 tx / €2.000; ~10733 zacht). |
| EN keys | `taxOurObligationText` — same split (hard ~4440; soft ~10733). |
| Risk | Duplicate JSON keys: last-write wins at parse time; product copy is undefined. Hard text treated DAC7 drempel als belastingdoorgifte. |
| Vervangen door | Eén DAC7-guidance-key uit gecertificeerde pack; reporting ≠ belastingplicht. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## faq.sustainability.1

| | |
|---|---|
| NL key | `faq.sustainability.1` |
| EN key | `faq.sustainability.1` |
| NL (huidig) | Delen van overtollig eten is geen commerciële voedselproductie. |
| EN (huidig) | Sharing surplus food is not commercial food production. |
| Risk | Juridische kwalificatie in marketingcopy, zonder food/NVWA-pack of frequentie/intent. |
| Vervangen door | Food-guidance route (prepared/packaged/other + frequency + intent) uit officiële spec. LEGAL-2 allergenen blijven checkout-gate. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## faq.sustainability.2

| | |
|---|---|
| NL key | `faq.sustainability.2` |
| EN key | `faq.sustainability.2` |
| NL (huidig) | Geen NVWA-registratie voor delen van overtollig eten. |
| EN (huidig) | No NVWA registration for sharing surplus food. |
| Risk | Absolute NVWA-conclusie zonder bron of jaargebonden rule. |
| Vervangen door | Food/NVWA guidance uit gecertificeerde pack + officialSourceUrl. Geen drempel verzinnen tot spec. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## faq.sustainability.3

| | |
|---|---|
| NL key | `faq.sustainability.3` |
| EN key | `faq.sustainability.3` |
| NL (huidig) | Delen vs verkopen; HomeCheff “richt zich op delen”. |
| EN (huidig) | Sharing vs selling; platform “focuses on sharing”. |
| Risk | Productclaim die marketplace-verkoop kan ontkennen. |
| Vervangen door | Intent/frequency in ActivityContext + food-guidance; geen nieuwe fiscale/NVWA-getallen. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## faq.sustainability.4

| | |
|---|---|
| NL key | `faq.sustainability.4` |
| EN key | `faq.sustainability.4` |
| NL (huidig) | Limiet “1–5 porties”; “onder de radar van voedselinspectie”. |
| EN (huidig) | “1–5 portions”; “stay under the radar of food inspection”. |
| Risk | Verzonnen hoeveelheidsdrempel. Strijdig met “geen NVWA-drempels verzinnen”. |
| Vervangen door | Officiële food-guidance; tot die tijd geen getal in FAQ vervangen door een ander getal. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

## faq.sustainability.7

| | |
|---|---|
| NL key | `faq.sustainability.7` |
| EN key | `faq.sustainability.7` |
| NL (huidig) | Geen NVWA-registratie voor delen tuinproducten. |
| EN (huidig) | No NVWA registration for surplus garden produce. |
| Risk | Zelfde absolute NVWA-claim voor GROW-taxonomy. |
| Vervangen door | Food kind `OTHER_FOOD_OR_PRODUCT` + officiële NVWA-guidance wanneer aangeleverd. |
| Status | NEEDS_OFFICIAL_REVIEW |

---

Geen van deze items is in Fase 2 gewijzigd in i18n-bestanden.

---

## FASE 3A — conflicten met nu gecertificeerde NL-2026 core

Geen publieke FAQ-copy herschreven. Onderstaande claims **botsen** of **ontbreken** t.o.v. de Fase-3A-core. Status blijft **NEEDS_OFFICIAL_REVIEW**. Geen vervangende drempels of percentages publiceren.

| Item | Conflict met 3A-core |
|---|---|
| `faq.taxes.1` — “BTW vanaf €20.000” | BTW/KOR is **niet** geïmplementeerd. Hardcoded omzetdrempel blijft strijdig. Resultaat vs omzet wordt in de core wél gescheiden; deze FAQ-zin niet. |
| `faq.taxes.0` — alle inkomsten opgeven, “geen minimumbedrag” | Core belast extra **resultaat uit overig werk** via A vs B vanaf de eerste euro belastbaar ROW, maar spreekt over **resultaat**, niet omzet. FAQ noemt Zvw, arbeidskorting en toeslagen niet. Geen algemene belastingvrije grens in de core. |
| FAQ algemeen — Zvw ontbreekt | Core berekent inkomensafhankelijke bijdrage Zvw **apart** van inkomstenbelasting. FAQ vermeldt Zvw niet. |
| FAQ algemeen — arbeidskorting ontbreekt | Core telt ROW mee als arbeidsinkomen voor arbeidskorting. FAQ zwijgt. |
| `faq.general.5` — uitkeringen (Wajong 70%, bijstand “een deel houden”, alles binnen 1 week bij UWV) | WW/bijstand/WIA/Wajong/ZW/WAO/WAZ-berekening is **NOT_IMPLEMENTED**. Hardcoded percentages blijven ongecertificeerd. |
| Omzet vs resultaat | Core: `commercialResult ≠ taxableROW` tenzij `assumeEstimatedCostsTaxDeductible`. FAQ.taxes.1 praat over omzet als BTW-grondslag. |

Niet in 3A, dus **niet** als €0 of “geen recht” in FAQ zetten: huurtoeslag, kindgebonden budget, kinderopvangtoeslag, KVK, BTW/KOR, DAC7-tax judgement.
