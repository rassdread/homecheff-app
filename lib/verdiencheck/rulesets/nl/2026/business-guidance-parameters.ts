import { eurosToCents } from './core-constants';
import {
  SRC_BTW_ONDERNEMER,
  SRC_BTW_REGISTRATIEDREMPEL,
  SRC_DAC7_VERKOPER,
  SRC_KOR_VOORWAARDEN,
  SRC_KVK_INSCHRIJVEN,
} from './sources';
import {
  DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE,
  DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE,
} from '../../../adapters/dac7-readiness';

export const VAT_REGISTRATION_THRESHOLD_CENTS = eurosToCents(2_200);
export const KOR_MAX_RELEVANT_TURNOVER_CENTS = eurosToCents(20_000);

export const BUSINESS_GUIDANCE_PARAMETER_META = {
  'kvk.primaryCriteria': {
    value: 'THREE_OFFICIAL_CRITERIA',
    officialSource: SRC_KVK_INSCHRIJVEN.officialSource,
    officialSourceUrl: SRC_KVK_INSCHRIJVEN.officialSourceUrl,
  },
  'vat.entrepreneurship': {
    value: 'SEPARATE_FROM_KVK',
    officialSource: SRC_BTW_ONDERNEMER.officialSource,
    officialSourceUrl: SRC_BTW_ONDERNEMER.officialSourceUrl,
  },
  'vat.registrationThresholdCents': {
    value: VAT_REGISTRATION_THRESHOLD_CENTS,
    officialSource: SRC_BTW_REGISTRATIEDREMPEL.officialSource,
    officialSourceUrl: SRC_BTW_REGISTRATIEDREMPEL.officialSourceUrl,
  },
  'kor.maxRelevantTurnoverCents': {
    value: KOR_MAX_RELEVANT_TURNOVER_CENTS,
    officialSource: SRC_KOR_VOORWAARDEN.officialSource,
    officialSourceUrl: SRC_KOR_VOORWAARDEN.officialSourceUrl,
  },
  'dac7.goods.maxTransactionsExclusive': {
    value: DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE,
    officialSource: SRC_DAC7_VERKOPER.officialSource,
    officialSourceUrl: SRC_DAC7_VERKOPER.officialSourceUrl,
  },
  'dac7.goods.maxConsiderationCentsInclusive': {
    value: DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE,
    officialSource: SRC_DAC7_VERKOPER.officialSource,
    officialSourceUrl: SRC_DAC7_VERKOPER.officialSourceUrl,
  },
} as const;
