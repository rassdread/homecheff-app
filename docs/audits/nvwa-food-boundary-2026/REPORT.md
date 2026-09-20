# NVWA_2026_RESEARCH_REPORT

VerdienCheck food-registration boundary. Official sources only. Retrieved 2026-09-20.

## OFFICIAL_SOURCES

1. NVWA — Registreer uw levensmiddelenbedrijf  
   https://www.nvwa.nl/onderwerpen/voedselveiligheid/levensmiddelen-produceren-en-verhandelen/registratie-en-erkenning/registreer-uw-levensmiddelenbedrijf  
   Legal basis cited: art. 6 Verordening (EG) 852/2004.  
   Last checked: 2026-09-20 (page live; no separate “last updated” stamp in the retrieved HTML).

2. NVWA — Stappenplan veilig eten en drinken verkopen aan consumenten  
   https://www.nvwa.nl/onderwerpen/voedselveiligheid/voedselveilig-werken-in-horeca-ambacht-en-retail/stappenplan  
   Last checked: 2026-09-20.

3. NVWA — Eten en drinken verkopen vanuit huis  
   https://www.nvwa.nl/onderwerpen/voedselveiligheid/voedselveilig-werken-in-horeca-ambacht-en-retail/verkopen-vanuit-huis  
   Last checked: 2026-09-20.

4. NVWA — Eten en drinken verkopen op markten en evenementen  
   https://www.nvwa.nl/onderwerpen/voedselveiligheid/voedselveilig-werken-in-horeca-ambacht-en-retail/markten-en-evenementen

5. Verordening (EG) nr. 852/2004 — recital 9, art. 2, art. 5, art. 6  
   https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32004R0852

6. European Commission guidance on 852/2004 (SANCO, 2018) §§ 3.8–3.9, 6.1  
   https://food.ec.europa.eu/system/files/2018-10/biosafety_fh_legis_guidance_reg-2004-852_en.pdf

7. KVK — Moet je je bedrijf inschrijven bij KVK? (ondernemerscriteria)  
   https://www.kvk.nl/starten/moet-ik-mijn-bedrijf-inschrijven-bij-kvk/

No blogs, accountants, or marketplace SEO used as legal source of truth.

## APPARENT_CONFLICT

NVWA stappenplan (startende ondernemers): “U moet zich bij ons registreren als u meerdere keren per jaar voedsel verkoopt. Als u een keer per jaar voedsel verkoopt hoeft dit niet.”

NVWA registration page, “Wanneer hoef ik mij niet te registreren?”: “U bent geen ondernemer, bijvoorbeeld omdat u maar een paar keer per jaar voedsel verkoopt. U verkoopt bijvoorbeeld elk jaar cakejes op de vrijmarkt op Koningsdag. Bekijk de ondernemerscriteria van de KVK.”

Sentence-level conflict: YES. Legal-concept conflict: NO, if read in context.

Controlling concept is food-business / ondernemer (undertaking: continuity + degree of organisation), not frequency alone. Frequency is NVWA’s practical example/heuristic.

## LEGAL_BASIS

852/2004 applies to food businesses. A food business is an undertaking (178/2002 art. 3(2)). Recital 9: Community rules apply only to undertakings, which implies continuity of activities and a degree of organisation.

Art. 6 registration duty is on food business operators for establishments under their control.

Commission guidance §3.8: occasional handling/preparation/storage/serving of food by private persons at church/school/village fairs is outside 852/2004. Occasional small-scale private activity is not an undertaking.

Commission guidance §3.9: businesses that sell via the internet are food businesses. That is about businesses offering goods online, not “any listing on a platform converts a private person into an undertaking”.

## NVWA_INTERPRETATION

| Source | Exact rule | Scope | Exceptions | Potential conflict |
| --- | --- | --- | --- | --- |
| Registration page | Registration is required for levensmiddelenbedrijven (art. 6 852/2004). Also: “Ook bedrijven die zich richten op online verkoop van levensmiddelen aan consumenten moeten zich registreren.” Operationally NVWA registration requires KVK inscription. | Food businesses | Non-entrepreneur, e.g. “een paar keer per jaar” / yearly Koningsdag cakes; primary production small quantities; COKZ; DUO/IGJ schools/care; non-NL establishment | “Bedrijven … online” vs occasional private HomeCheff listing |
| Stappenplan | Register if you sell food multiple times per year; not if once per year. Plan/hygiene code also if multiple times per year. Written for startende ondernemers. | Starting a food business (home, market, shop) | One time per year | “Meerdere keren” vs “een paar keer” |
| Home-sale page | Hygiene/allergens apply for home cooks/bakers/caterers. Food safety plan required for everyone who sells food multiple times per year. | Home food sale | Does not define a numeric “paar keer” | Plan duty uses same “meerdere keren” heuristic as registration stappenplan |
| Markets page | Hygiene/Warenwet and allergen information apply whether entrepreneur or particular | Markets/events | n/a | Safety ≠ registration |

NVWA does not define a number for “een paar keer”. Do not invent one.

## FREQUENCY_ANALYSIS

Official language categories, not invented counts:

- één keer per jaar → registration not required (stappenplan)
- een paar keer per jaar → example of non-entrepreneur exception (registration page)
- meerdere keren / regelmatig / bedrijfsmatig → registration relevant for a food business (stappenplan + undertaking continuity)

Previous engine error: UX “Een paar keer per jaar” (`OCCASIONAL_RECURRING`) mapped to `MULTIPLE_TIMES_PER_YEAR` → automatic `REGISTRATION_REQUIRED`. That treated NVWA’s own exception example as a NOW registration duty.

## ENTREPRENEURSHIP_ANALYSIS

NVWA exception is “u bent geen ondernemer”, not “frequency ≤ N”. Frequency is an example. NVWA points to KVK criteria.

Operational: if you must register with NVWA, you need KVK inscription first. That is process, not identity of the two assessments.

Do not implement:

- KVK NO → NVWA NO as a blanket
- KVK YES → NVWA YES as a blanket

Do: if the person is already clearly an entrepreneur (existing entrepreneur / already KVK-registered / clear KVK registration indication), do not apply the “not an entrepreneur” exception. Use REVIEW for few-times + entrepreneur, REQUIRED for regular food business activity.

## ONLINE_MARKETPLACE_ANALYSIS

Mere use of HomeCheff does not automatically make an occasional private seller a food business.

A food business that sells to consumers online must register.

## FOOD_PLAN_ANALYSIS

Plan/hygiene code is a separate duty, also using “meerdere keren per jaar”.

For one-off: no plan NOW (unchanged).

For “een paar keer”: do not NOW-block on plan; SOON/CHECK. Same linguistic overlap as registration. Do not claim a plan exemption.

For regular/business: plan NOW if not arranged.

Food safety hygiene and allergens remain NOW even when registration is not required.

## PROPOSED_RULE_MATRIX

| Facts | NVWA registration | Food safety / allergens | Plan |
| --- | --- | --- | --- |
| One homemade cake once | NOT_REQUIRED_ONE_OFF | NOW | not NOW |
| 2x / few times / “een paar keer”, not a clear entrepreneur | NOT_REQUIRED_OCCASIONAL_NON_BUSINESS | NOW | SOON/CHECK |
| Few times + existing/clear entrepreneur | REVIEW | NOW | SOON/CHECK |
| Monthly / weekly / regular public food business | REQUIRED | NOW | NOW if not arranged |
| TRYING_OUT + one-off or few times | not auto REQUIRED | NOW | not NOW ACTION |
| TRYING_OUT + regular food | REQUIRED (intent ≠ exemption) | NOW | NOW if not arranged |
| Friends/family only, occasional | not REQUIRED via non-entrepreneur example | NOW | SOON/CHECK |
| Public HomeCheff, occasional non-business | not REQUIRED; platform ≠ automatic FBO | NOW | SOON/CHECK |
| Existing KVK, regular food | REQUIRED | NOW | NOW if not arranged |
| Unknown frequency | UNKNOWN / REVIEW | NOW | not invented |

No monetary threshold.

## UNCERTAINTIES

- Exact numeric meaning of “een paar keer” is not official. Preserve as a named UX category, not `<= X`.
- Stappenplan “meerdere keren” vs registration-page “een paar keer” remains sentence-level tension. Resolved by controlling concept (undertaking / entrepreneur), not by picking the stricter sentence.
- Member States may add national hygiene rules for activity outside 852/2004 (Commission EP answer). NL Warenwet/hygiene still applies to particulars.

OFFICIAL_GUIDANCE_CONFLICT = YES (sentence-level). Conservative REVIEW used only for few-times + already-entrepreneur, not as a replacement for regular-business REQUIRED.


VerdienCheck food-registration boundary. Official sources only. 2026-09-20.

## OFFICIAL_SOURCES

1. NVWA — Registreer uw levensmiddelenbedrijf  
   https://www.nvwa.nl/onderwerpen/voedselveiligheid/levensmiddelen-produceren-en-verhandelen/registratie-en-erkenning/registreer-uw-levensmiddelenbedrijf  
   Legal basis cited: art. 6 Verordening (EG) 852/2004.

2. NVWA — Stappenplan veilig eten en drinken verkopen aan consumenten  
   https://www.nvwa.nl/onderwerpen/voedselveiligheid/voedselveilig-werken-in-horeca-ambacht-en-retail/stappenplan

3. NVWA — Eten en drinken verkopen vanuit huis  
   https://www.nvwa.nl/onderwerpen/voedselveiligheid/voedselveilig-werken-in-horeca-ambacht-en-retail/verkopen-vanuit-huis

4. NVWA — Eten en drinken verkopen op markten en evenementen  
   https://www.nvwa.nl/onderwerpen/voedselveiligheid/voedselveilig-werken-in-horeca-ambacht-en-retail/markten-en-evenementen

5. Verordening (EG) nr. 852/2004 — recital 9, art. 2, art. 5, art. 6  
   https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32004R0852

6. European Commission guidance on 852/2004 (SANCO, 2018) §§ 3.8–3.9, 6.1  
   https://food.ec.europa.eu/system/files/2018-10/biosafety_fh_legis_guidance_reg-2004-852_en.pdf

7. KVK — Moet je je bedrijf inschrijven bij KVK? (ondernemerscriteria)  
   https://www.kvk.nl/starten/moet-ik-mijn-bedrijf-inschrijven-bij-kvk/

No blogs, accountants, or marketplace SEO used as legal source of truth.

## APPARENT_CONFLICT

NVWA stappenplan: register if you sell food multiple times per year; not if once per year.

NVWA registration page, “Wanneer hoef ik mij niet te registreren?”: not required if you are not an entrepreneur, for example because you sell food only a few times per year (Koningsdag cakes). Look at KVK entrepreneur criteria.

Sentence-level conflict: YES. Legal-concept conflict: NO, if read in context.

## LEGAL_BASIS

852/2004 applies to food businesses. A food business is an undertaking (178/2002 art. 3(2)). Recital 9: Community rules apply only to undertakings, which implies continuity of activities and a degree of organisation.

Art. 6 registration duty is on food business operators for establishments under their control.

Commission guidance §3.8: occasional handling/preparation/storage/serving of food by private persons at church/school/village fairs is outside 852/2004. Occasional small-scale private activity is not an undertaking.

Commission guidance §3.9: businesses that sell via the internet are food businesses. That is about businesses offering goods online, not “any listing on a platform converts a private person into an undertaking”.

## NVWA_INTERPRETATION

Registration is for levensmiddelenbedrijven. Operationally NVWA registration requires KVK inscription.

Exception: not an entrepreneur, illustrated by “een paar keer per jaar” / yearly Koningsdag cakes, and a pointer to KVK criteria.

Stappenplan is written for startende ondernemers. “Meerdere keren per jaar” is a practical heuristic on that path, not a numeric statute.

Hygiene/Warenwet and allergen information apply whether entrepreneur or particular (markets page).

Food safety plan / hygiene code: required for everyone who sells food multiple times per year (home-sale and markets pages). Separate from registration.

Online: “bedrijven die zich richten op online verkoop van levensmiddelen” must register. Company-focused online food sale, not mere platform use.

NVWA does not define a number for “een paar keer”. Do not invent one.

## FREQUENCY_ANALYSIS

Official language categories, not invented counts:

- één keer per jaar → registration not required (stappenplan)
- een paar keer per jaar → example of non-entrepreneur exception (registration page)
- meerdere keren / regelmatig / bedrijfsmatig → registration relevant for a food business (stappenplan + undertaking continuity)

Current engine error: UX “Een paar keer per jaar” (`OCCASIONAL_RECURRING`) maps to `MULTIPLE_TIMES_PER_YEAR` → automatic `REGISTRATION_REQUIRED`. That treats NVWA’s own exception example as a NOW registration duty.

## ENTREPRENEURSHIP_ANALYSIS

NVWA exception is “u bent geen ondernemer”, not “frequency ≤ N”. Frequency is an example. NVWA points to KVK criteria.

Operational: if you must register with NVWA, you need KVK inscription first. That is process, not identity of the two assessments.

Do not implement:

- KVK NO → NVWA NO as a blanket
- KVK YES → NVWA YES as a blanket

Do: if the person is already clearly an entrepreneur (existing entrepreneur / already KVK-registered / clear KVK registration indication), do not apply the “not an entrepreneur” exception. Use REVIEW for few-times + entrepreneur, REQUIRED for regular food business activity.

## ONLINE_MARKETPLACE_ANALYSIS

Mere use of HomeCheff does not automatically make an occasional private seller a food business.

A food business that sells to consumers online must register.

## FOOD_PLAN_ANALYSIS

Plan/hygiene code is a separate duty, also using “meerdere keren per jaar”.

For one-off: no plan NOW (unchanged).

For “een paar keer”: do not NOW-block on plan; SOON/CHECK. Same linguistic overlap as registration. Do not claim a plan exemption.

For regular/business: plan NOW if not arranged.

Food safety hygiene and allergens remain NOW even when registration is not required.

## PROPOSED_RULE_MATRIX

| Facts | NVWA registration | Food safety / allergens | Plan |
| --- | --- | --- | --- |
| One homemade cake once | NOT_REQUIRED_ONE_OFF | NOW | not NOW |
| 2x / few times / “een paar keer”, not a clear entrepreneur | NOT_REQUIRED_OCCASIONAL_NON_BUSINESS | NOW | SOON/CHECK |
| Few times + existing/clear entrepreneur | REVIEW | NOW | SOON/CHECK |
| Monthly / weekly / regular public food business | REQUIRED | NOW | NOW if not arranged |
| TRYING_OUT + one-off or few times | not auto REQUIRED | NOW | not NOW ACTION |
| TRYING_OUT + regular food | REQUIRED (intent ≠ exemption) | NOW | NOW if not arranged |
| Friends/family only, occasional | not REQUIRED via non-entrepreneur example | NOW | SOON/CHECK |
| Public HomeCheff, occasional non-business | not REQUIRED; platform ≠ automatic FBO | NOW | SOON/CHECK |
| Existing KVK, regular food | REQUIRED | NOW | NOW if not arranged |
| Unknown frequency | UNKNOWN / REVIEW | NOW | not invented |

No monetary threshold.

## UNCERTAINTIES

- Exact numeric meaning of “een paar keer” is not official. Preserve as a named UX category, not `<= X`.
- Stappenplan “meerdere keren” vs registration-page “een paar keer” remains sentence-level tension. Resolved by controlling concept (undertaking / entrepreneur), not by picking the stricter sentence.
- Member States may add national hygiene rules for activity outside 852/2004 (Commission EP answer). NL Warenwet/hygiene still applies to particulars.

OFFICIAL_GUIDANCE_CONFLICT = YES (sentence-level). Conservative REVIEW used only for few-times + already-entrepreneur, not as a replacement for regular-business REQUIRED.
