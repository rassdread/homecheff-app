/**
 * Year-locked official benefit-guidance parameters. Not a benefit calculator.
 */

import { eurosToCents } from './core-constants';
import {
  SRC_RIJK_BBZ_KAPITAAL,
  SRC_RIJK_BBZ_REGELS,
  SRC_RIJK_BIJSTAND_START,
  SRC_UWV_DISABILITY,
  SRC_UWV_INKOMSTEN,
  SRC_UWV_STARTEN,
  SRC_UWV_STARTPERIODE,
  SRC_UWV_WW,
} from './sources';

/** WW start-period reduction is start-period-only. Not a generic WW cut. */
export const WW_START_PERIOD_REDUCTION_PERCENT = 29;

/** Official UWV fictive-income stop test. HomeCheff does not compute this. */
export const WW_NOT_RETAINING_FICTIVE_INCOME_STOP_PERCENT = 87.5;

export const WW_START_PERIOD_MAX_MONTHS = 6;

export const BBZ_PREPARATION_MAX_MONTHS = 12;
export const BBZ_LIVING_ALLOWANCE_INITIAL_MONTHS = 6;
export const BBZ_LIVING_ALLOWANCE_MAX_MONTHS = 36;

/** Starterskrediet maximum 2026 for starting self-employed from bijstand or WW. Not an entitlement. */
export const BBZ_STARTER_CREDIT_MAX_CENTS_2026 = eurosToCents(48_060);

export const INITIAL_INCOME_REPORT_DEADLINE = '1_WEEK' as const;
export const INCOME_CHANGE_REPORT_DEADLINE = '2_DAYS' as const;

export const WIA_AVERAGE_PROFIT_REVIEW_AFTER_YEARS = 3;
export const WAJONG_WAO_WAZ_REVIEW_AFTER_YEARS = 5;
export const WAJONG_WAO_WAZ_AVERAGE_PROFIT_LOOKBACK_YEARS = 3;

export const BENEFIT_GUIDANCE_PARAMETER_META = {
  'ww.startPeriod.reductionPercent': {
    value: WW_START_PERIOD_REDUCTION_PERCENT,
    officialSource: SRC_UWV_STARTPERIODE.officialSource,
    officialSourceUrl: SRC_UWV_STARTPERIODE.officialSourceUrl,
  },
  'ww.startPeriod.maxMonths': {
    value: WW_START_PERIOD_MAX_MONTHS,
    officialSource: SRC_UWV_STARTPERIODE.officialSource,
    officialSourceUrl: SRC_UWV_STARTPERIODE.officialSourceUrl,
  },
  'ww.routes': {
    value: 'THREE_OFFICIAL_WW_ROUTES',
    officialSource: SRC_UWV_WW.officialSource,
    officialSourceUrl: SRC_UWV_WW.officialSourceUrl,
  },
  'ww.notRetaining.fictiveIncomeStopPercent': {
    value: WW_NOT_RETAINING_FICTIVE_INCOME_STOP_PERCENT,
    officialSource: SRC_UWV_WW.officialSource,
    officialSourceUrl: SRC_UWV_WW.officialSourceUrl,
  },
  'ww.notRetaining.computedByHomecheff': {
    value: false,
    officialSource: SRC_UWV_WW.officialSource,
    officialSourceUrl: SRC_UWV_WW.officialSourceUrl,
  },
  'uwv.preStart.discussBeforeStart': {
    value: true,
    officialSource: SRC_UWV_STARTEN.officialSource,
    officialSourceUrl: SRC_UWV_STARTEN.officialSourceUrl,
  },
  'bbz.preparation.maxMonths': {
    value: BBZ_PREPARATION_MAX_MONTHS,
    officialSource: SRC_RIJK_BIJSTAND_START.officialSource,
    officialSourceUrl: SRC_RIJK_BIJSTAND_START.officialSourceUrl,
  },
  'bbz.livingAllowance.maxMonths': {
    value: BBZ_LIVING_ALLOWANCE_MAX_MONTHS,
    officialSource: SRC_RIJK_BBZ_REGELS.officialSource,
    officialSourceUrl: SRC_RIJK_BBZ_REGELS.officialSourceUrl,
  },
  'bbz.starterCredit.maxCents2026': {
    value: BBZ_STARTER_CREDIT_MAX_CENTS_2026,
    officialSource: SRC_RIJK_BBZ_KAPITAAL.officialSource,
    officialSourceUrl: SRC_RIJK_BBZ_KAPITAAL.officialSourceUrl,
  },
  'uwv.disability.initialIncomeReportDeadline': {
    value: INITIAL_INCOME_REPORT_DEADLINE,
    officialSource: SRC_UWV_INKOMSTEN.officialSource,
    officialSourceUrl: SRC_UWV_INKOMSTEN.officialSourceUrl,
  },
  'uwv.disability.incomeChangeReportDeadline': {
    value: INCOME_CHANGE_REPORT_DEADLINE,
    officialSource: SRC_UWV_INKOMSTEN.officialSource,
    officialSourceUrl: SRC_UWV_INKOMSTEN.officialSourceUrl,
  },
  'wia.averageProfitReviewAfterYears': {
    value: WIA_AVERAGE_PROFIT_REVIEW_AFTER_YEARS,
    officialSource: SRC_UWV_DISABILITY.officialSource,
    officialSourceUrl: SRC_UWV_DISABILITY.officialSourceUrl,
  },
  'wajongWaoWaz.reviewAfterYears': {
    value: WAJONG_WAO_WAZ_REVIEW_AFTER_YEARS,
    officialSource: SRC_UWV_DISABILITY.officialSource,
    officialSourceUrl: SRC_UWV_DISABILITY.officialSourceUrl,
  },
} as const;
