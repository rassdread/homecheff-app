# VerdienCheck — toeslagen questions and live extra-result

Production: https://homecheff.eu/verdiencheck

The founder walked the live VerdienCheck and found two linked failures. A saved session with a salary plus only a toetsingsinkomen showed “Nog niet te berekenen” for tax, Zvw and zorgtoeslag, and pressing an extra HomeCheff result did not move any rendered amount. That session is the reproduction. A fully answered employee path already recalculated; the defect was the incomplete jaaropgave path, plus the absence of a toeslagen step that asks for the facts the calculators need.

## Decision

```
STARTING_SHA = 3154883b078cb9624960731312b3456d683b1cda
COMMIT_SHA = 5c943d5861c611e5d7891d4c9e6e9e8d495b4dfc
DEPLOYMENT_ID = dpl_BbEgSrGVw5cTdhDDaqfogtS9xtws
DEPLOYED_SHA_MATCH = YES

FOUNDER_BUG_REPRODUCED = YES

ROOT_CAUSE_TOESLAGEN_NOT_SHOWN = The allowances multi-select was hardcoded hidden. Allowance facts were scattered later in the money layer, with no toeslagen section, and the quick check never asked them.
ROOT_CAUSE_FALSE_NOT_CALCULABLE = A single filled toetsingsinkomen replaced the whole income picture and cleared box 1, aggregate income, arbeidsinkomen and the Zvw base. Tax could not run, so every allowance delta stayed unknown. The screen blamed missing assets or a toeslagpartner even when those answers were present. Zorgtoeslag was also withheld whenever tax itself was incomplete.
ROOT_CAUSE_EXTRA_RESULT_NOT_UPDATING = The preset and the custom amount already wrote the same annual scenario cents. With every delta unknown, changing €500–€10.000 could not change a rendered euro. There was no stale memo and no separate preset-only path.

TOESLAGEN_STEP_VISIBLE = YES

ZT_QUESTIONS = YES
HT_QUESTIONS = YES
KGB_QUESTIONS = YES
KOT_QUESTIONS = YES

ZT_CALCULATES = YES
HT_CALCULATES = YES
KGB_CALCULATES = YES
KOT_CALCULATES = YES

NO_TOESLAGEN_FALSE_UNKNOWN = YES

MISSING_INPUT_STATE = NEEDS_INPUT
MISSING_INPUT_CTA = Gegevens aanvullen
MISSING_INPUT_CTA_TARGET = assets

EXTRA_RESULT_SOURCE_OF_TRUTH = scenarioPreset / customScenarioEuro → scenarioAdditionalResultCents (annual euros, not multiplied by 12)

EXTRA_0 = result €0, tax €1.012→€1.012, Zvw €0→€0, ZT €1.550→€1.550, retained €0
EXTRA_500 = result €500, tax €1.012→€1.181, Zvw €0→€24, ZT €1.550→€1.550, retained €307
EXTRA_1000 = result €1.000, tax €1.012→€1.350, Zvw €0→€49, ZT €1.550→€1.550, retained €614
EXTRA_2500 = result €2.500, tax €1.012→€1.857, Zvw €0→€121, ZT €1.550→€1.550, retained €1.534
EXTRA_5000 = result €5.000, tax €1.012→€2.809, Zvw €0→€243, ZT €1.550→€1.322, retained €2.733
EXTRA_10000 = result €10.000, tax €1.012→€4.819, Zvw €0→€485, ZT €1.550→€635, retained €4.794
EXTRA_CUSTOM_7321 = result €7.321, tax €1.012→€3.742, Zvw €0→€355, ZT €1.550→€1.003, retained €3.689

BASELINE_REMAINS_STABLE = YES
SCENARIO_RECALCULATES = YES
TOETSINGSINKOMEN_RECALCULATES = YES
TAX_RECALCULATES = YES
ZVW_RECALCULATES = YES
ALLOWANCES_RECALCULATE = YES
NET_EXTRA_RETAINED_RECALCULATES = YES

DESKTOP = PASS (1280×900)
MOBILE_390 = PASS (390×844, elementFromPoint on Verder and €5.000)
LANDSCAPE = PASS (844×390, elementFromPoint on Iets verkopen)
ZOOM_200 = PASS (elementFromPoint on Ja, in Nederland)
BOTTOM_NAV_HIT_TEST = PASS

ZERO_PERSISTENCE_PRESERVED = YES
NO_FINANCIAL_ANALYTICS = YES
NO_FINANCIAL_URL_STATE = YES

VERDIENCHECK_REGRESSION = PASS
PHASE_8C_REGRESSION = PASS (134 checks, 0 failed)
PHASE_8D_REGRESSION = PASS (542/542)
BUILD = PASS

P0_REMAINING = none
P1_REMAINING = none
P2_REMAINING = Displayed euros are rounded per line from cents, so the sum of the rounded tax and Zvw lines can differ by €1 from the rounded net. The engine net stays the certified cent formula.

FINAL_DECISION = HOMECHEFF_VERDIENCHECK_TOESLAGEN_LIVE_SCENARIO_PRODUCTION_CERTIFIED
```

`homecheff.eu` is deployment `dpl_BbEgSrGVw5cTdhDDaqfogtS9xtws`, status Ready, GitHub status success for commit `5c943d58`.

## What changed

Phase A now has a Toeslagen step after the current income and before housing. It explains that extra income can change allowances, and that the person does not need to be receiving one already. It does not ask “Ontvang je toeslagen?” and then stop.

Only the relevant follow-ups appear. Huur opens kale huur and the household. Children open ages and, when answered yes, childcare. A person who is not insured, does not rent, has no children and is above the asset limit sees €0 or “Niet van toepassing”, not four times “Nog niet te berekenen”.

If a relevant fact is still “Ik weet het niet”, the result stays incomplete and shows **Gegevens aanvullen**. On production that returned to “Is je spaargeld laag genoeg voor zorgtoeslag?”. After “Ja, mijn spaargeld is laag genoeg” the same scenario calculated.

A known toetsingsinkomen no longer erases a salary-derived box 1. An explicit fiscal wage or gross jaaropgave still replaces the salary picture, so holiday pay and a company car are not counted twice. Zorgtoeslag calculates from toetsingsinkomen, assets and partner when those are known, including when wage-tax bases are still incomplete.

The extra HomeCheff amount is one annual result: €500, €1.000, €2.500, €5.000, €10.000 and “Zelf invullen”. Nu stays the baseline. Met extra and Verschil follow

`extra result − extra income tax − extra Zvw + ΔZT + ΔHT + ΔKGB + ΔKOT`.

## Production journeys

Evidence is in `docs/audits/verdiencheck-toeslagen-live-scenario/production/`. The walk is `scripts/certify-verdiencheck-toeslagen-live-scenario.mts` with `VC_BASE=https://homecheff.eu/verdiencheck`.

Persona: employee, €2.200 bruto per month, holiday pay included, Dutch health insurance, no toeslagpartner, other housing, no children, assets eligible. Questions actually shown included **Toeslagen**, then housing, children and the zorgtoeslag asset question. Baseline tax €1.012 and zorgtoeslag €1.550 stayed fixed while the scenario moved, as in the table above. At €1.000 the 2026 zorgtoeslag band for this income does not move; tax, Zvw and retained amount do. At €5.000 zorgtoeslag falls from €1.550 to €1.322.

Huurtoeslag, same site, 390×844, kale huur €700, living alone: at €1.000 huurtoeslag stays €5.122; at €5.000 it falls to €4.265. Tax moves in both steps (€623→€671, then €623→€1.080).

Kindgebonden budget, one child age 8, on production: €5.996 at €1.000 and €5.870 at €5.000.

Kinderopvangtoeslag, €5.000 per month, daycare, on production: €13.522 at €1.000 extra and €13.306 at €5.000 extra.

No relevant allowances (not insured, no rent, no children, assets too high): zorgtoeslag €0, huurtoeslag, kindgebonden budget and kinderopvangtoeslag “Niet van toepassing”. The phrase “Nog niet te berekenen” did not appear.

Restart cleared the session. No request URL or body carried the entered amounts.

## Regression lock

`scripts/test-verdiencheck-toeslagen-live-scenario.ts` uses the founder-shaped employee (gross €2.646 per month, holiday pay not included, toetsingsinkomen exactly €35.000). Box 1 stays the salary derivation and is not replaced by €35.000. Baseline tax stays 132.023 cents and baseline zorgtoeslag stays 82.770 cents for every extra amount. At €1.000 extra the rendered net is 47.620 cents (`100.000 − 33.800 − 4.850 − 13.730`). At €5.000 the net is 219.186 cents. Custom €7.321 is 732.100 cents, not times 12.

Phase 8C and Phase 8D were not modified. 8C: 134 checks, 0 failed. 8D: 542/542.
