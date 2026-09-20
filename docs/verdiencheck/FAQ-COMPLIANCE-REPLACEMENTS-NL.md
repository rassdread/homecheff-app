# FAQ compliance replacements (NL) — published in 5B

Status: **PUBLISHED_5B** into `public/i18n/nl.json` and `public/i18n/en.json`.
VerdienCheck public CTAs remain flag-off (no dead links).

---

## faq.taxes.1 — “btw vanaf €20.000”

| | |
|---|---|
| OLD | “Vanaf welk bedrag moet ik BTW betalen?” — “BTW-plichtig vanaf €20.000 omzet per jaar.” |
| RISK | Zet KOR-omzetgrens neer als algemene btw-plicht. Verwart omzet met resultaat. Negeert registratiedrempel en btw-ondernemerschap. |
| REPLACEMENT | “Btw hangt eerst af van of je ondernemer bent voor de btw. Dat is iets anders dan KVK. Bij een kleine omzet kan een registratiedrempel gelden. De KOR is een aparte vrijstelling waar je onder voorwaarden voor kunt kiezen — geen belastingvrije inkomsten.” |
| OFFICIAL_SOURCE | Belastingdienst — Ondernemer voor de btw; Registratiedrempel voor kleine ondernemers; Voorwaarden KOR |
| STATUS | PUBLISHED_5B |

---

## faq.taxes.0 — “geen minimum voor belasting”

| | |
|---|---|
| OLD | Alle inkomsten opgeven, geen minimumbedrag. |
| RISK | Absolute claim zonder jaargebonden nuance of onderscheid inkomstenbelasting / btw / toeslagen. |
| REPLACEMENT | “Of je inkomstenbelasting betaalt, volgt uit je situatie en het jaar. HomeCheff rekent ondersteunde NL-2026-onderdelen met A en B. Er is geen losse ‘belastingvrije’ HomeCheff-grens.” |
| OFFICIAL_SOURCE | Belastingdienst — inkomstenbelasting box 1 / inkomsten uit overig werk |
| STATUS | PUBLISHED_5B |

---

## faq.taxes.3 — generieke KVK omzet-/structureeltekst

| | |
|---|---|
| OLD | Structurele verkoop → inschrijven; incidenteel meestal niet. |
| RISK | Reduceert KVK tot frequentie/omzet zonder de drie officiële ondernemerscriteria. |
| REPLACEMENT | “KVK kijkt of je zelfstandig levert, geld verdient, en regelmatig levert aan anderen dan alleen familie of vrienden. Zelfde omzet kan tot een andere uitkomst leiden. HomeCheff bepaalt niet dat je ondernemer bent.” |
| OFFICIAL_SOURCE | KVK — Moet je je bedrijf inschrijven bij KVK? |
| STATUS | PUBLISHED_5B |

---

## taxOurObligationText / faq.taxes.2 — DAC7 €2.000/30 wording

| | |
|---|---|
| OLD | Harde DAC7-tekst die 30 transacties / €2.000 als belastingdoorgifte behandelt. |
| RISK | DAC7-rapportage verwarren met belastingplicht. Goederendrempel toepassen op diensten. |
| REPLACEMENT | “HomeCheff kan verplicht zijn gegevens over je verkopen door te geven aan de Belastingdienst. Dat betekent niet automatisch dat je belasting moet betalen. Voor verkoop van goederen kan een uitzondering gelden bij minder dan 30 transacties én een tegenprestatie van maximaal €2.000 in een kalenderjaar. Voor persoonlijke diensten geldt die uitzondering niet.” |
| OFFICIAL_SOURCE | Belastingdienst — Wat betekent DAC7 voor mij als verkoper? |
| STATUS | PUBLISHED_5B |

---

## faq.general.5 — uitkeringen

| | |
|---|---|
| OLD | Generieke uitkeringsmelding (Wajong 70%, bijstand “een deel houden”, alle inkomsten binnen 1 week bij UWV). |
| RISK | Voegt WW, bijstand en UWV-arbeidsongeschiktheidsroutes samen. Hardcoded percentage. WW heeft een andere meldroute. 1-week + 2-dagen geldt voor WIA/WAO/WAZ/Wajong/ZW, niet als generieke WW-regel. |
| REPLACEMENT | “Je kunt mogelijk vanuit je uitkering starten. Wat je eerst moet regelen hangt af van de regeling. Bij WW: volg de UWV-training en kies een van de drie officiële routes (met startperiode, zonder startperiode, of zonder behoud van WW). Tijdens de UWV-startperiode is je WW 29% lager; dat is geen algemene WW-korting. Bij bijstand: bespreek je plan eerst met je gemeente; Bbz en een voorbereidingsperiode zijn gemeentelijk. Bij WIA, Wajong, Ziektewet, WAO of WAZ: bespreek je plan met je arbeidsdeskundige. Geef inkomsten binnen 1 week door en wijzigingen binnen 2 dagen. Ook commerciële internetverkopen kunnen relevant zijn, ook zonder KVK. Dat HomeCheff of UWV gegevens vraagt, betekent niet dat HomeCheff je uitkering herberekent.” |
| OFFICIAL_SOURCE | UWV — Eigen bedrijf starten; Bedrijf vanuit WW; Startperiode; Bedrijf vanuit Ziektewet/WIA/Wajong/WAZ/WAO; Inkomsten doorgeven WIA/WAO/WAZ/Wajong/Ziektewet. Rijksoverheid — Starten vanuit bijstand / Bbz; Bedrijfskapitaal. |
| STATUS | CERTIFIED_REPLACEMENT_READY |

---

## faq.sustainability.1 / .2 / .4 — voedsel / NVWA

| | |
|---|---|
| OLD | “Overtollig eten is geen commerciële voedselproductie”; “geen NVWA-registratie voor delen”; limiet “1–5 porties”; “onder de radar van voedselinspectie”; eventueel “HACCP-certificaat”. |
| RISK | Verzonnen portiesdrempel. Verwart delen met verkopen. Zegt dat voedselregels niet gelden. HACCP-certificaat is geen NVWA-eis voor thuisverkoop. |
| REPLACEMENT | “Verkoop je meerdere keren per jaar eten? Dan moet je je levensmiddelenbedrijf doorgaans bij de NVWA registreren. Ook bij incidentele verkoop moet je veilig en hygiënisch werken en klanten informeren over allergenen. Je hoeft niet altijd zelf een voedselveiligheidsplan te schrijven; je kunt een goedgekeurde hygiënecode gebruiken.” |
| OFFICIAL_SOURCE | NVWA — Eten en drinken verkopen vanuit huis; Stappenplan; Registreer uw levensmiddelenbedrijf; HACCP; Allergenen bij onverpakte levensmiddelen |
| STATUS | CERTIFIED_REPLACEMENT_READY |
