/**
 * Probe: where does the baseline card's "Geschat op je rekening" come from for
 * the Phase 7 personas, and is a negative value introduced by the company car?
 */

import {
  EMPTY_WIZARD_STATE,
  applyMoneyDepthChoice,
  type WizardState,
} from '../../../lib/verdiencheck/wizard/schema';
import { deriveIncomeBasesFromUserFacts } from '../../../lib/verdiencheck/wizard/derive-income-bases';
import { calculateEmployeePayslip2026 } from '../../../lib/verdiencheck/rulesets/nl/2026/employee-payslip';

function persona(partial: Partial<WizardState> = {}): WizardState {
  const base: WizardState = {
    ...EMPTY_WIZARD_STATE,
    taxResidence: 'NL',
    situationGroup: 'EMPLOYEE',
    ageTaxRegime: 'BELOW_AOW_2026',
    hasOtherIncome: false,
    hasDutchHealthInsurance: true,
    hasAllowancePartner: false,
    currentIncomeEuro: '2646',
    currentIncomePeriod: 'MONTH',
    currentIncomeBasis: 'GROSS',
    payrollTaxCreditApplied: 'YES',
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    housingTenure: 'RENT',
  };
  return applyMoneyDepthChoice({ ...base, ...partial }, 'YES');
}

const cases: { name: string; state: WizardState }[] = [
  { name: 'no-car', state: persona() },
  {
    name: 'standard-car',
    state: persona({
      companyCarStatus: 'PROVIDED',
      companyCarPrivateUse: 'OVER_500',
      companyCarCategory: 'COMBUSTION_OR_OTHER',
      companyCarFirstAdmissionYear: '2022',
      companyCarFirstAdmissionMonth: '3',
      companyCarValueEuro: '30000',
      companyCarOwnContributionStatus: 'NONE',
    }),
  },
];

for (const item of cases) {
  const bases = deriveIncomeBasesFromUserFacts(item.state);
  const p = bases.payroll;
  console.log(`=== ${item.name}`);
  console.log('  payrollUsed          ', p.used);
  console.log('  cash gross /mnd      ', p.estimatedGrossMonthlyCents);
  console.log('  car addition /mnd    ', p.companyCarAdditionCents);
  console.log('  car own contrib /mnd ', p.companyCarOwnContributionCents);
  console.log('  statutory net /mnd   ', p.statutoryNetMonthlyCents);
  console.log('  bank net /mnd        ', p.bankNetMonthlyCents);
  console.log('  fiscal wage /jaar    ', bases.fiscalWageCents);
}

// Direct ruleset call for the same numbers, to separate ruleset from wiring.
const direct = calculateEmployeePayslip2026({
  grossMonthlyCents: 264_600,
  payrollTaxCredit: true,
  companyCarAdditionCents: 55_000,
  companyCarOwnContributionCents: 0,
});
console.log('=== direct ruleset', JSON.stringify(direct, null, 2).slice(0, 900));
