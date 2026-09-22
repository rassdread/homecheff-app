# VerdienCheck Phase 7 — Auto van de zaak (bijtelling 2026)

Starting SHA `edc52a71a630dd4310a2cfc4c826bba80eb30d87`, deployed as
`dpl_4CxSWFtWB6gA1HKZqfUnGJUae8HC` from commit `e7fa7f99`.

## Verified 2026 rules

All figures come from the Belastingdienst, re-fetched on 2026-09-22, not from
the earlier architecture audit.

| Rule | Value | Source |
|---|---|---|
| General percentages | 22% (DET from 2017-01-01), 25% (before), 35% (older than 16 years) | Handboek Loonheffingen 2026 §23.3.3 |
| Basis | Dutch catalogue price incl. bpm and btw on the date of first admission | §23.3.2 |
| Zero-emission 2026 | 18% up to € 30.000 catalogue value, 22% above | §23.3.4 and the Belastingdienst 2026 page |
| Hydrogen / qualifying solar | 18% on the full basis, no cap | §23.3.4 |
| Limited (non-zero) CO2 | no discount remains | §23.3.5 |
| 60-month term | starts the first day of the month after first admission / first registration | §23.3.4 |
| Youngtimer | older than 16 years, 35% of waarde in het economisch verkeer | §23.3.20 |
| Youngtimer transition | a car used in 2025 and older than 15 on 2025-12-31 also gets 35% WEV | Belastingdienst 2026 page |
| ≤ 500 private km | value may be omitted only with a sluitende rittenregistratie, other evidence, or a Verklaring geen privégebruik auto | §23.3.15 |
| Own contribution | withheld from net pay, reduces the value of private use, calendar-year balance not negative | §23.3.7 |
| Wage treatment | loon in natura, kolom 4; kolom 14 = 3 + 4 + 5 − 7 | §11.2.4 |
| Income-dependent schemes | the value counts for zorg- and huurtoeslag; no pension accrual over it | §23.3.22 |

The strongest check is fixture H: it reproduces the handbook's own worked
example in §23.3.4 to the cent, including the € 866,67 and € 1.100 monthly
amounts the handbook prints after a € 50/month own contribution.

## Local fixtures

`npm run test:verdiencheck-company-car-2026`, all annual cents:

| Fixture | Taxable addition |
|---|---|
| A no car | baseline fiscal wage 3.429.216 unchanged |
| B standard car, € 30.000, >500 km | 660.000 |
| C ≤ 500 km with evidence | 0 |
| D EV below threshold | 540.000 |
| E EV above threshold, € 85.000 | 1.750.000 |
| F hydrogen / solar, € 85.000 | 1.530.000 |
| G 60-month term still running | 700.000 |
| H 60-month expiry mid-2026 (handbook example) | 1.203.335 |
| I youngtimer, WEV € 15.000 | 525.000 |
| J own contribution | 540.000 |
| K unknown details | null, never 0 |

Round trip over € 2.646, € 3.500 and € 5.000 with a company car:
`MAX_BANK_NET_DELTA = 0`, `MAX_CASH_GROSS_DELTA = 234` cents.

## Production walk on homecheff.eu

Persona: € 2.646/month cash gross, payroll tax credit yes, holiday pay 8% on
top, renting, single, no children.

| Persona | Bruto (cash) | Fiscal | Addition | On account |
|---|---|---|---|---|
| 1 no car | € 34.292 | — | — | € 2.400 |
| 2 standard car € 30.000 | € 34.292 | € 40.892 | + € 550/month | € 2.180 |
| 3 EV € 85.000 | € 34.292 | € 51.792 | + € 1.458/month | € 1.773 |
| 4 own contribution € 600 | € 34.292 | € 40.292 | + € 500/month | € 2.150 |
| 10 unknown | € 34.292 | — | "niet meegenomen" | € 2.400 |

Cash gross never moves, which is the point: the addition changes the taxable
wage and the withholding, never the deposit. Persona 4 shows the own
contribution is not subtracted twice — the deposit drops € 30 rather than the
full € 50/month, because the lower taxable addition gives back about € 20 of
withholding. Persona 10 states the car was left out instead of showing € 0.

## Responsive and accessibility

`responsive.mts` drives the real wizard and measures the fully expanded form
(18 controls) at four viewports:

| Viewport | Horizontal overflow | Bottom nav covers action | Disclosure collapses |
|---|---|---|---|
| Desktop 1440x900 | 0 | no | 18 → 3 → 18 |
| Mobile 390x844 | 0 | no | 18 → 3 → 18 |
| Landscape 844x390 | 0 | no | 18 → 3 → 18 |
| Zoom 200% (195x422 @2x) | 0 | no | 18 → 3 → 18 |

All 19 controls in the section are native `button`/`input`, all keyboard
reachable, every input labelled, focus is not trapped, and the "waarom telt
een auto van de zaak mee" explanation is inline text rather than a dialog.

## Defect found and fixed

The company-car step returned from `goNext` without a message when the answers
were incomplete, so "Verder" appeared to do nothing on the longest form in the
wizard. It now shows the same `role="alert"` message the holiday-pay question
uses. Covered by an assertion so it cannot regress.

## Note on the audit harness

An earlier version of the driver filled the first empty numeric input on every
step, which typed € 2.646 into "Overige inhoudingen" on the payslip step and
produced a negative bank net. That was the harness, not the product: the
engine returned € 2.400,33 throughout. The driver now only fills the salary on
the income step, and `banknet-dom-probe.mts` re-checks the rendered row.
