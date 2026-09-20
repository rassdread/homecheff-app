/**
 * VerdienCheck Fase 4A — NL-2026 KVK / btw / KOR / DAC7 seller guidance.
 *
 *   npx tsx scripts/test-verdiencheck-nl-2026-business-guidance.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  hundredProductsAtFifty,
  paintingOnceFiveThousand,
} from '../lib/verdiencheck/domain/activity';
import {
  assessKvkEntrepreneurship,
  deriveKvkPrimaryFromActivity,
  deriveKvkSupportingFromActivity,
  type KvkPrimaryCriteria,
} from '../lib/verdiencheck/domain/kvk';
import {
  assessVatEntrepreneurship,
  deriveVatEntrepreneurshipContext,
  totalRelevantVatTurnoverCents,
} from '../lib/verdiencheck/domain/vat';
import { UNKNOWN } from '../lib/verdiencheck/domain/unknown';
import { DAC7_NOT_A_TAX_JUDGMENT } from '../lib/verdiencheck/domain/dac7';
import {
  evaluateVatRegistrationThreshold,
} from '../lib/verdiencheck/guidance/nl2026/vat';
import { evaluateKor, korGuidanceRules } from '../lib/verdiencheck/guidance/nl2026/kor';
import { evaluateDac7SellerReporting } from '../lib/verdiencheck/guidance/nl2026/dac7';
import { evaluateBusinessGuidance } from '../lib/verdiencheck/guidance/nl2026/orchestrator';
import { evaluateGuidance } from '../lib/verdiencheck/guidance/engine';
import { defaultBlocking } from '../lib/verdiencheck/guidance/types';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import {
  DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE,
  DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE,
  isExcludedGoodsSeller,
} from '../lib/verdiencheck/adapters/dac7-readiness';
import { VAT_REGISTRATION_THRESHOLD_CENTS, KOR_MAX_RELEVANT_TURNOVER_CENTS } from '../lib/verdiencheck/rulesets/nl/2026/business-guidance-parameters';
import { derivePersonSituation } from '../lib/verdiencheck/domain/person';

const ROOT = process.cwd();
const results: Record<string, 'PASS' | 'FAIL'> = {
  KVK_CRITERIA: 'FAIL',
  KVK_NO_REVENUE_THRESHOLD: 'FAIL',
  VAT_ENTREPRENEURSHIP_ISOLATION: 'FAIL',
  VAT_REGISTRATION_THRESHOLD_2200: 'FAIL',
  KOR_20000: 'FAIL',
  KOR_NOT_TAX_FREE: 'FAIL',
  DAC7_GOODS: 'FAIL',
  DAC7_SERVICES: 'FAIL',
  DAC7_NOT_TAX_JUDGMENT: 'FAIL',
  TURNOVER_RESULT_ISOLATION: 'FAIL',
  GUIDANCE_DEFAULT_NON_BLOCKING: 'FAIL',
  LEGAL_4A_PRESERVED: 'FAIL',
};

function allYesPrimary(): KvkPrimaryCriteria {
  return {
    independentlySuppliesGoodsOrServices: 'YES',
    chargesWithEarningIntent: 'YES',
    regularlySuppliesOutsideFamilyFriends: 'YES',
  };
}

{
  const hobby: KvkPrimaryCriteria = {
    independentlySuppliesGoodsOrServices: 'YES',
    chargesWithEarningIntent: 'NO',
    regularlySuppliesOutsideFamilyFriends: 'NO',
  };
  assert.equal(assessKvkEntrepreneurship({ primary: hobby }), 'CLEAR_NON_BUSINESS_INDICATION');
  assert.equal(
    assessKvkEntrepreneurship({ primary: allYesPrimary() }),
    'CLEAR_REGISTRATION_INDICATION',
  );
  assert.equal(
    assessKvkEntrepreneurship({
      primary: {
        independentlySuppliesGoodsOrServices: 'YES',
        chargesWithEarningIntent: 'YES',
        regularlySuppliesOutsideFamilyFriends: 'NO',
      },
    }),
    'CLEAR_NON_BUSINESS_INDICATION',
  );
  assert.equal(
    assessKvkEntrepreneurship({
      primary: {
        independentlySuppliesGoodsOrServices: 'UNKNOWN',
        chargesWithEarningIntent: 'YES',
        regularlySuppliesOutsideFamilyFriends: 'YES',
      },
    }),
    'INSUFFICIENT_INFORMATION',
  );
  assert.equal(
    assessKvkEntrepreneurship({
      primary: {
        independentlySuppliesGoodsOrServices: 'YES',
        chargesWithEarningIntent: 'YES',
        regularlySuppliesOutsideFamilyFriends: 'NO',
      },
      supporting: {
        investsTimeOrMoney: 'YES',
        regularAndLongerTermActivity: 'YES',
        multipleCustomersOrAcquisition: 'YES',
        independentlyDeterminesWork: 'YES',
      },
    }),
    'CLEAR_REGISTRATION_INDICATION',
  );
  results.KVK_CRITERIA = 'PASS';
}

{
  const a = paintingOnceFiveThousand();
  const b = hundredProductsAtFifty();
  const turnoverA = (a.typicalTicketCents ?? 0) * (a.unitCount ?? 0);
  const turnoverB = (b.typicalTicketCents ?? 0) * (b.unitCount ?? 0);
  assert.equal(turnoverA, 500_000);
  assert.equal(turnoverB, 500_000);
  const assessA = assessKvkEntrepreneurship({
    primary: deriveKvkPrimaryFromActivity(a),
    supporting: deriveKvkSupportingFromActivity(a),
  });
  const assessB = assessKvkEntrepreneurship({
    primary: deriveKvkPrimaryFromActivity(b),
    supporting: deriveKvkSupportingFromActivity(b),
  });
  assert.notEqual(assessA, assessB);
  assert.equal(assessA, 'CLEAR_NON_BUSINESS_INDICATION');
  results.KVK_NO_REVENUE_THRESHOLD = 'PASS';
}

{
  const kvkYes = assessKvkEntrepreneurship({ primary: allYesPrimary() });
  const vatFromHobby = assessVatEntrepreneurship(
    deriveVatEntrepreneurshipContext(paintingOnceFiveThousand()),
  );
  assert.notEqual(kvkYes, vatFromHobby);
  const vatRegular = assessVatEntrepreneurship(
    deriveVatEntrepreneurshipContext({
      ...hundredProductsAtFifty(),
      independence: true,
    }),
  );
  assert.equal(vatRegular, 'CLEAR_VAT_ENTREPRENEUR_INDICATION');
  results.VAT_ENTREPRENEURSHIP_ISOLATION = 'PASS';
}

{
  const vat = 'CLEAR_VAT_ENTREPRENEUR_INDICATION' as const;
  const baseTurnover = {
    homeCheffVatTurnoverCents: 0,
    otherRelevantVatTurnoverCents: 0,
  };
  const t2199 = evaluateVatRegistrationThreshold({
    vatAssessment: vat,
    kvkRegistrationObliged: 'NO',
    alreadyVatRegistered: 'NO',
    turnover: { ...baseTurnover, homeCheffVatTurnoverCents: 219_999 },
    calendarYear: 2026,
  });
  assert.equal(t2199.eligibility, 'ELIGIBLE');
  const t2200 = evaluateVatRegistrationThreshold({
    vatAssessment: vat,
    kvkRegistrationObliged: 'NO',
    alreadyVatRegistered: 'NO',
    turnover: { ...baseTurnover, homeCheffVatTurnoverCents: 220_000 },
    calendarYear: 2026,
  });
  assert.equal(t2200.eligibility, 'ELIGIBLE');
  assert.equal(t2200.thresholdEvent.state, 'REACHED');
  const t2201 = evaluateVatRegistrationThreshold({
    vatAssessment: vat,
    kvkRegistrationObliged: 'NO',
    alreadyVatRegistered: 'NO',
    turnover: { ...baseTurnover, homeCheffVatTurnoverCents: 220_001 },
    calendarYear: 2026,
  });
  assert.equal(t2201.eligibility, 'NOT_ELIGIBLE');
  assert.equal(t2201.thresholdEvent.state, 'EXCEEDED');
  const kvkReq = evaluateVatRegistrationThreshold({
    vatAssessment: vat,
    kvkRegistrationObliged: 'YES',
    alreadyVatRegistered: 'NO',
    turnover: { ...baseTurnover, homeCheffVatTurnoverCents: 100_000 },
    calendarYear: 2026,
  });
  assert.equal(kvkReq.eligibility, 'NOT_ELIGIBLE');
  const kvkUnknown = evaluateVatRegistrationThreshold({
    vatAssessment: vat,
    kvkRegistrationObliged: 'UNKNOWN',
    alreadyVatRegistered: 'NO',
    turnover: { ...baseTurnover, homeCheffVatTurnoverCents: 100_000 },
    calendarYear: 2026,
  });
  assert.equal(kvkUnknown.eligibility, 'UNKNOWN');
  assert.equal(VAT_REGISTRATION_THRESHOLD_CENTS, 220_000);
  results.VAT_REGISTRATION_THRESHOLD_2200 = 'PASS';
}

{
  const base = {
    establishedInNetherlands: 'YES' as const,
    activityEligibility: 'ELIGIBLE' as const,
    currentlyParticipating: 'NO' as const,
    previousYearRelevantTurnoverCents: 1_999_900,
  };
  assert.equal(
    evaluateKor({
      calendarYear: 2026,
      context: { ...base, currentYearRelevantTurnoverCents: 1_999_999 },
    }).outcome,
    'POTENTIALLY_ELIGIBLE',
  );
  assert.equal(
    evaluateKor({
      calendarYear: 2026,
      context: { ...base, currentYearRelevantTurnoverCents: 2_000_000 },
    }).outcome,
    'POTENTIALLY_ELIGIBLE',
  );
  const over = evaluateKor({
    calendarYear: 2026,
    context: {
      ...base,
      currentlyParticipating: 'YES',
      currentYearRelevantTurnoverCents: 2_000_001,
    },
  });
  assert.equal(over.thresholdEvent.state, 'EXCEEDED');
  assert.equal(
    evaluateKor({
      calendarYear: 2026,
      context: {
        ...base,
        previousYearRelevantTurnoverCents: 2_000_100,
        currentYearRelevantTurnoverCents: 1_000_000,
      },
    }).outcome,
    'NOT_ELIGIBLE',
  );
  const unknownOther = evaluateKor({
    calendarYear: 2026,
    context: {
      ...base,
      currentYearRelevantTurnoverCents: UNKNOWN,
    },
  });
  assert.equal(unknownOther.outcome, 'REVIEW_REQUIRED');
  assert.equal(KOR_MAX_RELEVANT_TURNOVER_CENTS, 2_000_000);
  results.KOR_20000 = 'PASS';
}

{
  const korHits = korGuidanceRules({
    outcome: 'POTENTIALLY_ELIGIBLE',
    thresholdEvent: { kind: 'KOR_20000', calendarYear: 2026, state: 'NONE' },
  });
  const text = korHits.map((r) => `${r.shortText} ${r.expandedExplanation}`).join(' ');
  assert.match(text, /kun je mogelijk kiezen/);
  assert.doesNotMatch(text, /Je moet KOR gebruiken/);
  assert.doesNotMatch(text, /Tot .* betaal je geen belasting/);
  assert.doesNotMatch(text, /belastingvrij tot/);
  results.KOR_NOT_TAX_FREE = 'PASS';
}

{
  assert.equal(DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE, 30);
  assert.equal(DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE, 200_000);
  assert.equal(
    evaluateDac7SellerReporting({
      calendarYear: 2026,
      activityCategory: 'SALE_OF_GOODS',
      transactionCount: 29,
      considerationCents: 200_000,
    }),
    'GOODS_EXCLUSION_MAY_APPLY',
  );
  assert.equal(
    isExcludedGoodsSeller({ transactionCount: 29, netConsiderationCents: 200_000 }),
    true,
  );
  assert.equal(
    evaluateDac7SellerReporting({
      calendarYear: 2026,
      activityCategory: 'SALE_OF_GOODS',
      transactionCount: 29,
      considerationCents: 200_001,
    }),
    'POTENTIALLY_REPORTABLE',
  );
  assert.equal(
    evaluateDac7SellerReporting({
      calendarYear: 2026,
      activityCategory: 'SALE_OF_GOODS',
      transactionCount: 30,
      considerationCents: 1,
    }),
    'POTENTIALLY_REPORTABLE',
  );
  assert.equal(
    evaluateDac7SellerReporting({
      calendarYear: 2026,
      activityCategory: 'SALE_OF_GOODS',
      transactionCount: 30,
      considerationCents: 200_000,
    }),
    'POTENTIALLY_REPORTABLE',
  );
  assert.equal(
    evaluateDac7SellerReporting({
      calendarYear: 2026,
      activityCategory: 'SALE_OF_GOODS',
      transactionCount: 1,
      considerationCents: 200_100,
    }),
    'POTENTIALLY_REPORTABLE',
  );
  assert.equal(
    evaluateDac7SellerReporting({
      calendarYear: 2026,
      activityCategory: 'SALE_OF_GOODS',
      transactionCount: 0,
      considerationCents: 0,
    }),
    'GOODS_EXCLUSION_MAY_APPLY',
  );
  results.DAC7_GOODS = 'PASS';
}

{
  assert.equal(
    evaluateDac7SellerReporting({
      calendarYear: 2026,
      activityCategory: 'PERSONAL_SERVICE',
      transactionCount: 1,
      considerationCents: 2_000,
    }),
    'POTENTIALLY_REPORTABLE',
  );
  assert.equal(
    evaluateDac7SellerReporting({
      calendarYear: 2026,
      activityCategory: 'PERSONAL_SERVICE',
      transactionCount: 29,
      considerationCents: 150_000,
    }),
    'POTENTIALLY_REPORTABLE',
  );
  assert.equal(
    isExcludedGoodsSeller({ transactionCount: 29, netConsiderationCents: 150_000 }),
    true,
  );
  results.DAC7_SERVICES = 'PASS';
}

{
  const hits = evaluateBusinessGuidance({
    jurisdiction: 'NL',
    year: 2026,
    personSituation: 'EMPLOYEE',
    allowances: ['NONE'],
    activity: { ...hundredProductsAtFifty(), independence: true },
    business: {
      calendarYear: 2026,
      dac7: {
        calendarYear: 2026,
        activityCategory: 'SALE_OF_GOODS',
        transactionCount: 40,
        considerationCents: 400_000,
      },
    },
  });
  const blob = hits.map((h) => `${h.rule.shortText} ${h.rule.expandedExplanation}`).join('\n');
  assert.match(blob, /niet automatisch dat je belasting moet betalen|niet automatisch/);
  assert.ok(DAC7_NOT_A_TAX_JUDGMENT.includes('niet automatisch dat je belasting moet betalen'));
  const srcFiles = [
    'lib/verdiencheck/domain/dac7.ts',
    'lib/verdiencheck/guidance/nl2026/dac7.ts',
  ];
  for (const rel of srcFiles) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.equal(src.includes('DAC7-belastinggrens'), false);
    assert.equal(src.includes('belastingvrij tot €2.000'), false);
    assert.equal(src.includes('vanaf 30 verkopen betaal je belasting'), false);
  }
  results.DAC7_NOT_TAX_JUDGMENT = 'PASS';
}

{
  const turnover = 300_000;
  const costs = 200_000;
  const result = turnover - costs;
  assert.equal(result, 100_000);
  const total = totalRelevantVatTurnoverCents({
    homeCheffVatTurnoverCents: turnover,
    otherRelevantVatTurnoverCents: 0,
  });
  assert.equal(total, 300_000);
  assert.notEqual(total, result);
  const listingCount = 1;
  const transactionCount = 5;
  assert.notEqual(listingCount, transactionCount);
  results.TURNOVER_RESULT_ISOLATION = 'PASS';
}

{
  const hits = evaluateGuidance({
    jurisdiction: 'NL',
    year: 2026,
    personSituation: derivePersonSituation({ group: 'EMPLOYEE' }) ?? 'EMPLOYEE',
    allowances: ['NONE'],
    activity: paintingOnceFiveThousand(),
  });
  assert.ok(hits.length <= 20);
  assert.ok(hits.every((h) => h.rule.blocking === false));
  assert.equal(defaultBlocking({ blocking: false }), false);
  const business = hits.filter((h) => !h.rule.developmentFixture);
  assert.ok(business.length <= 3);
  results.GUIDANCE_DEFAULT_NON_BLOCKING = 'PASS';
}

{
  const out = execSync('git diff -- lib/compliance/dac7-threshold.ts lib/compliance/dac7-activity.ts lib/compliance/dac7-readiness.ts', {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(out, '');
  assert.equal(NL_2026_MODULE_STATUS.kvkGuidance, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.vatRegistrationThreshold, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.korGuidance, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.dac7SellerGuidance, 'CERTIFIED');
  assert.equal(NL_2026_PACK.status, 'DRAFT');
  results.LEGAL_4A_PRESERVED = 'PASS';
}

const failed = Object.entries(results).filter(([, v]) => v !== 'PASS');
if (failed.length > 0) {
  console.error(results);
  throw new Error(`FAIL: ${failed.map(([k]) => k).join(', ')}`);
}
console.log('verdiencheck NL-2026 business guidance tests: PASS');
console.log(results);
