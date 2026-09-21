'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { runCalculator } from '@/lib/verdiencheck/calculator/engine';
import type {
  AssetsEligibility,
  PartnerHealthcareInsuranceStatus,
} from '@/lib/verdiencheck/calculator/types';
import type {
  CommercialIntent,
  CustomerScope,
  SaleFrequency,
} from '@/lib/verdiencheck/domain/activity';
import type { AllowanceId } from '@/lib/verdiencheck/domain/allowances';
import type { AgeTaxRegime2026 } from '@/lib/verdiencheck/domain/income-bases';
import {
  AOW_MONTHS_2026,
  type AowBirthCohort2026,
  type AowMonth2026,
  type SingleOlderPersonsCreditEligibility,
} from '@/lib/verdiencheck/domain/aow';
import type {
  FiscalPartnerDuration,
  IackCoParentStatus,
  IackHouseholdDuration,
  IackRelativeAge,
} from '@/lib/verdiencheck/domain/iack';
import { V1_COST_SOURCE } from '@/lib/verdiencheck/domain/costs';
import {
  rentsHomeFromTenure,
  resolveHousingTenure,
} from '@/lib/verdiencheck/domain/housing';
import VerdienCheckInfoDialog from '@/components/verdiencheck/VerdienCheckInfoDialog';
import {
  commercialResultCents,
  formatCentsAsEuroDisplay,
  parseEuroInputToCents,
  SCENARIO_PRESET_EUROS,
  type ScenarioPresetEuro,
} from '@/lib/verdiencheck/domain/money';
import { derivePersonSituation, type SituationGroup, type UwvBenefit } from '@/lib/verdiencheck/domain/person';
import type { MunicipalPreparationPeriodStatus, ZwOrigin } from '@/lib/verdiencheck/domain/benefits';
import type {
  HomecheffGrowthIntent,
} from '@/lib/verdiencheck/domain/growth-intent';
import type {
  FoodSafetyPlanStatus,
  PackagingMode,
} from '@/lib/verdiencheck/domain/food-activity';
import { buildPersonalVerdienRoute } from '@/lib/verdiencheck/personal-route';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';
import {
  clearVerdienCheckSession,
  readVerdienCheckSession,
  writeVerdienCheckSession,
} from '@/lib/verdiencheck/privacy/session-client';
import {
  readVerdienCheckEntryPointFromLocation,
  resetVerdienCheckFunnelOccurrence,
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
  type VerdienCheckEntryPoint,
} from '@/lib/analytics/verdiencheck-funnel';
import { verdienCheckProgressBucket } from '@/lib/verdiencheck/privacy/analytics-guard';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyDirectResultMode,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applyRevenueCostHelperFields,
  applySituationGroup,
  applyUwvBenefitUnknown,
  derivedWizardAllowances,
  firstMoneyStep,
  isBenefitSituation,
  markMoneyDepthCompleted,
  nextStep,
  previousStep,
  progressSteps,
  questionsBeforeFirstResult,
  wizardHasInProgressAnswers,
  type ActivityChoice,
  type WizardState,
  type WizardStepId,
  type TaxResidenceChoice,
} from '@/lib/verdiencheck/wizard/schema';
import { deriveIncomeBasesFromUserFacts, shouldAskPayrollTaxCredit } from '@/lib/verdiencheck/wizard/derive-income-bases';
import { parseHolidayPercent, shouldAskHolidayPay } from '@/lib/verdiencheck/wizard/holiday-pay';
import { wizardStateToBenefitFacts, wizardStateToBusinessFacts, wizardStateToCalculatorInput, wizardStateToFoodFacts } from '@/lib/verdiencheck/wizard/to-calculator-input';
import {
  helperFeedsCertifiedEngine,
  mapRevenueAndAllowableCosts,
} from '@/lib/verdiencheck/domain/revenue-cost-helper';
import { compareScenarioPresets } from '@/lib/verdiencheck/wizard/scenario-comparison';
import {
  positionVerdienCheckActiveStep,
  VERDIENCHECK_ACTIVE_STEP_ID,
  VERDIENCHECK_STEP_HEADING_ID,
} from '@/lib/verdiencheck/wizard/active-step-focus';
import { HC_PAGE_BOTTOM_NAV_PAD } from '@/lib/layout/bottomNavInset';
import {
  earningIntentFromEntry,
  isAffiliateActivity,
  resolveResultCtaMode,
} from '@/lib/verdiencheck/presentation/earning-context';
import type {
  ChildcareCareType,
  ChildcareProviderEligibility,
  ParentWorkStudyStatus,
} from '@/lib/verdiencheck/domain/childcare';
import VerdienCheckCostAdvantage from './VerdienCheckCostAdvantage';
import VerdienCheckHolidayPayFields from './VerdienCheckHolidayPayFields';
import VerdienCheckDisclaimer from './VerdienCheckDisclaimer';
import VerdienCheckFinancialImpact from './VerdienCheckFinancialImpact';
import VerdienCheckBaselineCard from './VerdienCheckBaselineCard';
import VerdienCheckLaterSection from './VerdienCheckLaterSection';
import VerdienCheckNowSection from './VerdienCheckNowSection';
import VerdienCheckQuickInsight from './VerdienCheckQuickInsight';
import VerdienCheckRestartConfirm from './VerdienCheckRestartConfirm';
import VerdienCheckResultCta from './VerdienCheckResultCta';
import VerdienCheckShareAction from './VerdienCheckShareAction';
import VerdienCheckResultSummary from './VerdienCheckResultSummary';
import VerdienCheckSoonSection from './VerdienCheckSoonSection';

function ChoiceButton(props: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.selected}
      onClick={props.onClick}
      className={`relative z-[80] block min-h-12 w-full rounded-xl border px-4 py-3 text-left text-lg pointer-events-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
        props.selected
          ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950'
          : 'border-gray-200 bg-white text-gray-800'
      }`}
    >
      {props.children}
    </button>
  );
}

function TriChoices(props: {
  value: boolean | 'UNKNOWN' | null;
  options: Record<string, string>;
  onSelect: (value: boolean | 'UNKNOWN') => void;
}) {
  return (
    <>
      {(
        [
          ['YES', true],
          ['NO', false],
          ['UNKNOWN', 'UNKNOWN'],
        ] as const
      ).map(([key, value]) => (
        <ChoiceButton
          key={key}
          selected={props.value === value}
          onClick={() => props.onSelect(value)}
        >
          {props.options[key] ?? key}
        </ChoiceButton>
      ))}
    </>
  );
}

const NEXT_BTN =
  'relative z-[80] min-h-12 w-full rounded-xl bg-emerald-800 px-4 py-3 text-lg font-semibold text-white pointer-events-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700';
const FIELD =
  'min-h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-lg';

function persist(step: WizardStepId, state: WizardState) {
  writeVerdienCheckSession({ version: 1, currentStep: step, state });
}

function StepHelp(props: { copy: VerdienCheckCopy; step: string }) {
  const help = props.copy.steps[props.step]?.help;
  if (!help) return null;
  return (
    <details className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-base text-gray-700">
      <summary className="cursor-pointer min-h-12 text-base">{props.copy.whatMeansThis}</summary>
      <p className="mt-2 leading-relaxed">{help}</p>
    </details>
  );
}

function progressPhrase(input: {
  copy: VerdienCheckCopy;
  step: WizardStepId;
  stepIndex: number;
  total: number;
  moneyLayer: boolean;
}): string {
  if (input.step === 'result') return input.copy.progressDone;
  if (input.moneyLayer) return input.copy.progressMoney;
  if (input.stepIndex <= 0) return input.copy.progressOngoing;
  const remaining = input.total - input.stepIndex - 1;
  if (remaining <= 1) return input.copy.progressAlmost;
  return input.copy.progressOngoing;
}

export default function VerdienCheckWizard(props: {
  copy: VerdienCheckCopy;
  language: 'nl' | 'en';
}) {
  const { copy, language } = props;
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<WizardStepId>('jurisdiction');
  const [state, setState] = useState<WizardState>(EMPTY_WIZARD_STATE);
  const [infoDialog, setInfoDialog] = useState<'interest' | 'woz' | 'ownerCalc' | null>(null);
  const [entryPoint, setEntryPoint] = useState<VerdienCheckEntryPoint>('direct');
  const [restartOpen, setRestartOpen] = useState(false);
  const [showResumeHint, setShowResumeHint] = useState(false);
  const [currentIncomeError, setCurrentIncomeError] = useState(false);
  const [holidayPayError, setHolidayPayError] = useState(false);
  const activeStepRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const invalidRef = useRef<HTMLParagraphElement>(null);
  const prevStepRef = useRef<WizardStepId | null>(null);

  useEffect(() => {
    const from = readVerdienCheckEntryPointFromLocation();
    setEntryPoint(from);
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.viewed, {
      entry_point: from,
    });
    const saved = readVerdienCheckSession();
    if (saved) {
      const restored = { ...EMPTY_WIZARD_STATE, ...saved.state };
      setState(restored);
      setStep(saved.currentStep);
      if (wizardHasInProgressAnswers(restored)) {
        setShowResumeHint(true);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persist(step, state);
  }, [hydrated, step, state]);

  const turnoverCents =
    (state.amountEntryPeriod === 'MONTH'
      ? (parseEuroInputToCents(state.estimatedTurnoverEuro) ?? 0) * 12
      : parseEuroInputToCents(state.estimatedTurnoverEuro) ?? 0);
  const costsCents =
    (state.amountEntryPeriod === 'MONTH'
      ? (parseEuroInputToCents(state.estimatedCostsEuro) ?? 0) * 12
      : parseEuroInputToCents(state.estimatedCostsEuro) ?? 0);
  const liveResult = commercialResultCents(turnoverCents, costsCents);

  const personSituation =
    derivePersonSituation({
      group: state.situationGroup,
      uwvBenefit: state.uwvBenefit,
    }) ?? (state.uwvBenefitUnknown ? 'OTHER' : null);

  const calculatorInput = wizardStateToCalculatorInput(state);

  const emptyCalculatorFallback = {
    jurisdiction: 'OTHER' as const,
    calendarYear: 2026,
    personContext: { situation: 'OTHER' as const },
    currentAnnualIncomeCents: null,
    allowances: ['UNKNOWN' as const],
    activity: {
      kinds: [],
      frequency: 'UNKNOWN' as const,
      customers: 'UNKNOWN' as const,
      commercialIntent: 'UNKNOWN' as const,
      independence: 'UNKNOWN' as const,
      continuity: 'UNKNOWN' as const,
      timeOrMoneyInvested: 'UNKNOWN' as const,
      listingCount: null,
      transactionCount: null,
      typicalTicketCents: null,
      unitCount: null,
    },
    incomeSource: 'MARKETPLACE_SELLER' as const,
    estimatedTurnoverCents: 0,
    estimatedCosts: { amountCents: 0, source: V1_COST_SOURCE },
    commercialResultCents: 0,
    scenarioAdditionalResultCents: 0,
  };

  let calcResult;
  try {
    calcResult = calculatorInput
      ? runCalculator(calculatorInput)
      : runCalculator(emptyCalculatorFallback);
  } catch {
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.calculatorFailed, {
      error_code: 'CALCULATOR_FAILED',
      component: 'VerdienCheckCalculator',
    });
    calcResult = runCalculator(emptyCalculatorFallback);
  }

  const guidanceContext =
    state.taxResidence === 'NL' && personSituation
      ? {
          jurisdiction: 'NL' as const,
          year: 2026,
          personSituation,
          allowances: derivedWizardAllowances(state),
          activity: calculatorInput
            ? calculatorInput.activity
            : {
                kinds: state.activityKinds,
                frequency: state.frequency ?? 'UNKNOWN',
                customers: state.customers ?? 'UNKNOWN',
                commercialIntent: state.intent ?? 'UNKNOWN',
                independence:
                  state.independentlyDeterminesWork == null
                    ? 'UNKNOWN'
                    : state.independentlyDeterminesWork,
                continuity: 'UNKNOWN',
                timeOrMoneyInvested: 'UNKNOWN',
                listingCount: null,
                transactionCount: null,
                typicalTicketCents: null,
                unitCount: null,
              },
          business: wizardStateToBusinessFacts(state),
          benefits: wizardStateToBenefitFacts(state),
          food: wizardStateToFoodFacts(state),
        }
      : null;

  const derivedIncomeBases = deriveIncomeBasesFromUserFacts(state);
  const enteredNetMonthlyCents =
    state.currentIncomeBasis === 'NET' && !state.currentIncomeUnknown
      ? state.currentIncomePeriod === 'MONTH'
        ? parseEuroInputToCents(state.currentIncomeEuro)
        : parseEuroInputToCents(state.currentIncomeEuro) != null
          ? Math.round((parseEuroInputToCents(state.currentIncomeEuro) as number) / 12)
          : null
      : null;
  const enteredGrossMonthlyCents =
    state.currentIncomeBasis === 'GROSS' &&
    !state.currentIncomeUnknown &&
    state.currentIncomePeriod === 'MONTH'
      ? parseEuroInputToCents(state.currentIncomeEuro)
      : null;
  const personalRoute = buildPersonalVerdienRoute({
    ctx: guidanceContext,
    calculator: calcResult,
    declaredGrowth: state.growthStart,
    forceCheckFirstReason: state.uwvBenefitUnknown ? 'UWV_SCHEME_UNKNOWN' : null,
    holidayPayUnresolved: derivedIncomeBases.holidayPayUnresolved,
    baselineFacts: {
      incomeAnnualCents:
        derivedIncomeBases.baselineGrossEmploymentIncomeCents ??
        derivedIncomeBases.fiscalWageCents ??
        derivedIncomeBases.baselineAssessmentIncomeCents,
      incomeMonthlyCents:
        derivedIncomeBases.baselineGrossEmploymentIncomeCents != null
          ? Math.round(derivedIncomeBases.baselineGrossEmploymentIncomeCents / 12)
          : null,
      contractualGrossCents: derivedIncomeBases.contractualGrossEmploymentIncomeCents,
      holidayPayCents: derivedIncomeBases.holidayPayCents,
      holidayPayIncluded: state.holidayPayIncluded === 'YES',
      fiscalWageCents: derivedIncomeBases.fiscalWageCents,
      assessmentIncomeCents: derivedIncomeBases.baselineAssessmentIncomeCents,
      enteredNetMonthlyCents,
      enteredGrossMonthlyCents,
      estimatedGrossMonthlyCents: derivedIncomeBases.payroll.estimatedGrossMonthlyCents,
      statutoryNetMonthlyCents: derivedIncomeBases.payroll.statutoryNetMonthlyCents,
      payrollUsed: derivedIncomeBases.payroll.used,
      payrollTaxCredit: derivedIncomeBases.payroll.payrollTaxCreditChoice,
      payrollTaxCreditAssumed: derivedIncomeBases.payroll.payrollTaxCreditAssumed,
      incomeUnknown: state.currentIncomeUnknown || derivedIncomeBases.holidayPayUnresolved,
      incomeUnknownReason: state.currentIncomeUnknown
        ? copy.currentIncomeUnknown
        : derivedIncomeBases.holidayPayUnresolved
          ? copy.holidayPayUnresolvedNote
          : null,
      incomeIsNetEstimate:
        state.currentIncomeBasis === 'NET' &&
        derivedIncomeBases.netToGrossConfidence === 'ESTIMATE',
      housingTenure: resolveHousingTenure(state),
      ownerHome: derivedIncomeBases.ownerHome,
      hasChildren: state.hasChildren,
      usesChildcare: state.usesChildcare,
      allowancesNone: derivedWizardAllowances(state).includes('NONE'),
      employeeLikeZvw:
        state.situationGroup === 'EMPLOYEE' ||
        derivedIncomeBases.derivation === 'EMPLOYMENT_PROXY' ||
        derivedIncomeBases.derivation === 'NET_EMPLOYMENT_ESTIMATE',
    },
  });
  const resultCtaMode = resolveResultCtaMode({
    intent: earningIntentFromEntry(entryPoint),
    activity: state.activityChoice,
    semantics: personalRoute.proceedSemantics,
  });

  function goNext() {
    if (step === 'currentIncome') {
      const hasAmount = parseEuroInputToCents(state.currentIncomeEuro) != null;
      if (!state.currentIncomeUnknown && !hasAmount) {
        setCurrentIncomeError(true);
        requestAnimationFrame(() => {
          positionVerdienCheckActiveStep({
            container: activeStepRef.current,
            heading: headingRef.current,
            invalidTarget: invalidRef.current,
            mode: 'invalid',
          });
        });
        return;
      }
      if (
        state.currentIncomeBasis === 'NET' &&
        state.ageTaxRegime === 'REACHES_AOW_IN_2026'
      ) {
        setState({ ...state, currentIncomeBasis: 'GROSS' });
        setCurrentIncomeError(true);
        return;
      }
      if (
        shouldAskHolidayPay(state) &&
        !state.currentIncomeUnknown &&
        (state.holidayPayIncluded == null ||
          (state.holidayPayIncluded === 'NO' &&
            state.holidayPayPercentMode === 'CUSTOM' &&
            parseHolidayPercent(state.holidayPayCustomPercent) == null))
      ) {
        setHolidayPayError(true);
        return;
      }
      setCurrentIncomeError(false);
      setHolidayPayError(false);
    }
    if (step === 'scenario' && state.scenarioInputMode === 'REVENUE_COST') {
      const mapped = mapRevenueAndAllowableCosts({
        revenueEuro: state.helperRevenueEuro,
        costsEuro: state.helperCostsEuro,
        costsUnknown: state.helperCostsUnknown,
      });
      if (!helperFeedsCertifiedEngine(mapped)) return;
    }
    const n = nextStep(state, step);
    if (n) {
      setState(markMoneyDepthCompleted(state, step, n));
      setStep(n);
    }
  }

  function advanceFrom(nextState: WizardState, from: WizardStepId) {
    const n = nextStep(nextState, from);
    setState(n ? markMoneyDepthCompleted(nextState, from, n) : nextState);
    if (n) setStep(n);
  }

  function goBack() {
    const p = previousStep(state, step);
    if (p) setStep(p);
  }

  function selectResidence(value: TaxResidenceChoice) {
    const next = { ...state, taxResidence: value };
    setState(next);
    const n = nextStep(next, 'jurisdiction');
    if (n) setStep(n);
  }

  const progress = progressSteps(state, step);
  const stepIndex = Math.max(0, progress.indexOf(step));
  const extraResultChosen =
    state.scenarioLayerRequested &&
    (state.scenarioInputMode === 'REVENUE_COST'
      ? helperFeedsCertifiedEngine(
          mapRevenueAndAllowableCosts({
            revenueEuro: state.helperRevenueEuro,
            costsEuro: state.helperCostsEuro,
            costsUnknown: state.helperCostsUnknown,
          }),
        )
      : state.scenarioPreset === 'custom'
        ? parseEuroInputToCents(state.customScenarioEuro) != null
        : state.scenarioPreset != null);
  const title =
    step === 'result' && state.moneyDepthCompleted && extraResultChosen
      ? copy.moneyResultTitle
      : step === 'result' && state.moneyDepthCompleted
        ? copy.situationNowTitle
      : step === 'result'
        ? personalRoute.headline
        : (copy.steps[step]?.title ?? copy.pageTitle);
  const options = copy.steps[step]?.options ?? {};
  const moneyLayer = state.moneyDepthRequested && step !== 'result' && !questionsBeforeFirstResult(state).includes(step);
  const scenarioComparison =
    step === 'result' && state.moneyDepthCompleted ? compareScenarioPresets(state) : null;

  useLayoutEffect(() => {
    if (!hydrated) return;
    const previous = prevStepRef.current;
    if (previous === step) return;
    prevStepRef.current = step;
    positionVerdienCheckActiveStep({
      container: activeStepRef.current,
      heading: headingRef.current,
      mode: 'step',
    });
  }, [hydrated, step]);

  useEffect(() => {
    if (!hydrated) return;
    const total = Math.max(1, progress.length);
    const bucket = verdienCheckProgressBucket({
      stepIndex,
      totalVisibleSteps: total,
      isResult: step === 'result',
    });
    if (step !== 'jurisdiction') {
      trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.started, {
        entry_point: entryPoint,
      });
      trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.quickStarted, {
        entry_point: entryPoint,
      });
    }
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.stepProgress, {
      entry_point: entryPoint,
      progress_bucket: bucket,
      step_number: stepIndex + 1,
      total_visible_steps: total,
    });
    if (step === 'result') {
      trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.completed, {
        entry_point: entryPoint,
      });
      trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.quickCompleted, {
        entry_point: entryPoint,
      });
      trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.resultViewed, {
        entry_point: entryPoint,
      });
      if (state.moneyDepthCompleted) {
        trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.moneyCompleted, {
          entry_point: entryPoint,
          funnel_stage: 'baseline',
        });
      }
      if (state.moneyDepthCompleted && extraResultChosen) {
        trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.scenarioCompleted, {
          entry_point: entryPoint,
          funnel_stage: 'scenario',
        });
      }
    }
  }, [
    hydrated,
    step,
    stepIndex,
    progress.length,
    entryPoint,
    state.moneyDepthCompleted,
    extraResultChosen,
  ]);

  function requestRestart() {
    setRestartOpen(true);
  }

  function restartCheck() {
    clearVerdienCheckSession();
    resetVerdienCheckFunnelOccurrence();
    setRestartOpen(false);
    setShowResumeHint(false);
    setCurrentIncomeError(false);
    prevStepRef.current = null;
    setState(EMPTY_WIZARD_STATE);
    setStep('jurisdiction');
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.restartClicked, {
      entry_point: entryPoint,
    });
  }

  function startMoneyDepth() {
    const next = applyMoneyDepthChoice(state, 'YES');
    setState(next);
    const first = firstMoneyStep(next);
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.moneyStarted, {
      entry_point: entryPoint,
    });
    if (first) setStep(first);
  }

  return (
    <div
      data-verdiencheck-shell=""
      className="relative min-w-0 overflow-x-hidden bg-stone-50"
    >
      <VerdienCheckRestartConfirm
        copy={copy}
        open={restartOpen}
        onCancel={() => setRestartOpen(false)}
        onConfirm={restartCheck}
      />
      <VerdienCheckInfoDialog
        open={infoDialog === 'interest'}
        title={copy.housingInterestWhereTitle}
        body={copy.housingInterestWhereBody}
        closeLabel={language === 'en' ? 'Close' : 'Sluiten'}
        onClose={() => setInfoDialog(null)}
      />
      <VerdienCheckInfoDialog
        open={infoDialog === 'ownerCalc'}
        title={copy.housingHowCalculatedTitle}
        body={copy.housingHowCalculatedBody}
        closeLabel={language === 'en' ? 'Close' : 'Sluiten'}
        onClose={() => setInfoDialog(null)}
      />
      <div
        ref={activeStepRef}
        id={VERDIENCHECK_ACTIVE_STEP_ID}
        className={`mx-auto w-full min-w-0 max-w-md px-4 pt-2 break-words scroll-mt-[calc(var(--hc-top-nav-height,4rem)+0.75rem)] ${HC_PAGE_BOTTOM_NAV_PAD} xl:pb-10`}
      >
        <div className="mt-2 flex min-w-0 items-start justify-between gap-3">
          <p className="min-w-0 flex-1 text-sm font-medium text-gray-600">
            {progressPhrase({
              copy,
              step,
              stepIndex,
              total: progress.length,
              moneyLayer,
            })}
          </p>
          <VerdienCheckShareAction
            copy={copy}
            variant="text"
            className="shrink-0 whitespace-nowrap"
            surface="verdiencheck_chrome"
          />
        </div>
        {showResumeHint && wizardHasInProgressAnswers(state) ? (
          <div className="mt-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            <p>{copy.resumeHint}</p>
            <button
              type="button"
              className="mt-2 text-base text-emerald-800 underline"
              onClick={requestRestart}
            >
              {copy.restartFromStart}
            </button>
          </div>
        ) : null}
        {step === 'jurisdiction' ? (
          <div className="mt-3 space-y-2 text-base leading-relaxed text-gray-700">
            <p>{copy.intro}</p>
            <p>{copy.introReassurance}</p>
            <p className="text-sm text-stone-600">{copy.introNoAccount}</p>
            <VerdienCheckQuickInsight
              copy={copy}
              onStart={() => headingRef.current?.focus()}
            />
          </div>
        ) : null}
        <h1
          id={VERDIENCHECK_STEP_HEADING_ID}
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 scroll-mt-[calc(var(--hc-top-nav-height,4.5rem)+0.75rem)] text-2xl font-semibold tracking-tight text-gray-900 break-words outline-none"
        >
          {title}
        </h1>
        {moneyLayer ? (
          <p className="mt-2 text-base leading-relaxed text-gray-700">
            {copy.moneyPhaseNowTitle}. {copy.moneyPhaseNowBody}
          </p>
        ) : null}
        {step === 'result' && state.moneyDepthCompleted && state.scenarioLayerRequested && !extraResultChosen ? (
          <p className="mt-2 text-base leading-relaxed text-gray-700">{copy.whatIf}</p>
        ) : null}

        <div className="mt-6 flex flex-col space-y-3">
          {step === 'jurisdiction' &&
            (['NL', 'OTHER'] as const).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.taxResidence === key}
                onClick={() => selectResidence(key)}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'situation' &&
            (
              [
                'EMPLOYEE',
                'WW',
                'BIJSTAND',
                'OTHER_UWV',
                'EXISTING_ENTREPRENEUR',
                'NONE',
              ] as SituationGroup[]
            ).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.situationGroup === key}
                onClick={() => {
                  const next = applySituationGroup(state, key);
                  setState(next);
                  const n = nextStep(next, 'situation');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'uwvBenefit' && (
            <>
              {(['WIA', 'WAJONG', 'ZW', 'WAO', 'WAZ'] as UwvBenefit[]).map((key) => (
                <ChoiceButton
                  key={key}
                  selected={state.uwvBenefit === key}
                  onClick={() => {
                    const next = { ...state, uwvBenefit: key, uwvBenefitUnknown: false };
                    setState(next);
                    const n = nextStep(next, 'uwvBenefit');
                    if (n) setStep(n);
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              <ChoiceButton
                selected={state.uwvBenefitUnknown}
                onClick={() => {
                  const next = applyUwvBenefitUnknown(state);
                  setState(next);
                  const n = nextStep(next, 'uwvBenefit');
                  if (n) setStep(n);
                }}
              >
                {options.UNKNOWN ?? copy.needMore}
              </ChoiceButton>
              <p className="text-base leading-relaxed text-gray-700">{copy.uwvBenefitUnknownHint}</p>
            </>
          )}

          {step === 'uwvDiscussedPlan' && (
            <TriChoices
              value={state.discussedWithUwv}
              options={options}
              onSelect={(value) => {
                const next = { ...state, discussedWithUwv: value };
                setState(next);
                const n = nextStep(next, 'uwvDiscussedPlan');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'wwStartPeriod' && (
            <TriChoices
              value={state.wantsStartPeriod}
              options={options}
              onSelect={(value) => {
                const next = { ...state, wantsStartPeriod: value };
                setState(next);
                const n = nextStep(next, 'wwStartPeriod');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'wwRetainBenefit' && (
            <TriChoices
              value={state.wantsToRetainWw}
              options={options}
              onSelect={(value) => {
                const next = { ...state, wantsToRetainWw: value };
                setState(next);
                const n = nextStep(next, 'wwRetainBenefit');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'wwFormerEmployer' && (
            <TriChoices
              value={state.formerEmployerWorkPlanned}
              options={options}
              onSelect={(value) => {
                const next = { ...state, formerEmployerWorkPlanned: value };
                setState(next);
                const n = nextStep(next, 'wwFormerEmployer');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'wwUwvSupplement' && (
            <TriChoices
              value={state.receivesUwvSupplement}
              options={options}
              onSelect={(value) => {
                const next = { ...state, receivesUwvSupplement: value };
                setState(next);
                const n = nextStep(next, 'wwUwvSupplement');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'uwvResearchPeriod' && (
            <TriChoices
              value={state.wantsResearchPeriod}
              options={options}
              onSelect={(value) => {
                const next = { ...state, wantsResearchPeriod: value };
                setState(next);
                const n = nextStep(next, 'uwvResearchPeriod');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'uwvPermission' && (
            <TriChoices
              value={state.uwvPermission}
              options={options}
              onSelect={(value) => {
                const next = { ...state, uwvPermission: value };
                setState(next);
                const n = nextStep(next, 'uwvPermission');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'zwOrigin' &&
            (['FROM_OR_AFTER_WW', 'OTHER', 'UNKNOWN'] as ZwOrigin[]).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.zwOrigin === key}
                onClick={() => {
                  const next = { ...state, zwOrigin: key };
                  setState(next);
                  const n = nextStep(next, 'zwOrigin');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'bijstandMunicipality' && (
            <>
              {(
                [
                  ['YES', true],
                  ['NO', false],
                ] as const
              ).map(([key, value]) => (
                <ChoiceButton
                  key={key}
                  selected={state.municipalityKnown === value}
                  onClick={() => {
                    const next = {
                      ...state,
                      municipalityKnown: value,
                      municipalityName: value ? state.municipalityName : '',
                    };
                    setState(next);
                    if (!value) {
                      const n = nextStep(next, 'bijstandMunicipality');
                      if (n) setStep(n);
                    }
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              {state.municipalityKnown === true ? (
                <div className="space-y-2">
                  <input
                    className={FIELD}
                    placeholder="Gemeente"
                    value={state.municipalityName}
                    onChange={(e) =>
                      setState({ ...state, municipalityName: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className={NEXT_BTN}
                    onClick={goNext}
                  >
                    {copy.next}
                  </button>
                </div>
              ) : null}
            </>
          )}

          {step === 'bijstandPreparation' &&
            (['AVAILABLE', 'NOT_AVAILABLE', 'UNKNOWN'] as MunicipalPreparationPeriodStatus[]).map(
              (key) => (
                <ChoiceButton
                  key={key}
                  selected={state.preparationPeriod === key}
                  onClick={() => {
                    const next = { ...state, preparationPeriod: key };
                    setState(next);
                    const n = nextStep(next, 'bijstandPreparation');
                    if (n) setStep(n);
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ),
            )}

          {step === 'aow' &&
            (
              [
                'BELOW_AOW_2026',
                'REACHES_AOW_IN_2026',
                'FULL_YEAR_AOW_2026',
              ] as AgeTaxRegime2026[]
            ).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.ageTaxRegime === key}
                onClick={() => {
                  const next = { ...state, ageTaxRegime: key };
                  setState(next);
                  const n = nextStep(next, 'aow');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'aowBirthCohort' &&
            (['BORN_BEFORE_1946', 'BORN_ON_OR_AFTER_1946'] as AowBirthCohort2026[]).map(
              (key) => (
                <ChoiceButton
                  key={key}
                  selected={state.aowBirthCohort === key}
                  onClick={() => {
                    const next = { ...state, aowBirthCohort: key };
                    setState(next);
                    const n = nextStep(next, 'aowBirthCohort');
                    if (n) setStep(n);
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ),
            )}

          {step === 'aowMonth' &&
            AOW_MONTHS_2026.map((key) => (
              <ChoiceButton
                key={key}
                selected={state.aowMonth === key}
                onClick={() => {
                  const next = { ...state, aowMonth: key as AowMonth2026 };
                  setState(next);
                  const n = nextStep(next, 'aowMonth');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'singleOlderAow' && (
            <>
              {(
                ['ELIGIBLE', 'NOT_ELIGIBLE', 'UNKNOWN'] as SingleOlderPersonsCreditEligibility[]
              ).map((key) => (
                <ChoiceButton
                  key={key}
                  selected={state.singleOlderPersonsCreditEligibility === key}
                  onClick={() => {
                    const next = {
                      ...state,
                      singleOlderPersonsCreditEligibility: key,
                    };
                    setState(next);
                    const n = nextStep(next, 'singleOlderAow');
                    if (n) setStep(n);
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              <details className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <summary>{copy.whatMeansThis}</summary>
                <p className="mt-2">{copy.singleOlderHelp}</p>
              </details>
            </>
          )}

          {step === 'dutchHealthInsurance' && (
            <TriChoices
              value={state.dutchHealthInsurance}
              options={options}
              onSelect={(value) => {
                const next = { ...state, dutchHealthInsurance: value };
                setState(next);
                const n = nextStep(next, 'dutchHealthInsurance');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'allowances' && (
            <>
              {(
                [
                  'HEALTHCARE',
                  'RENT',
                  'CHILD_BUDGET',
                  'CHILDCARE',
                  'NONE',
                  'UNKNOWN',
                ] as AllowanceId[]
              ).map((key) => {
                const selected = state.allowances.includes(key);
                return (
                  <ChoiceButton
                    key={key}
                    selected={selected}
                    onClick={() => {
                      let nextSel: AllowanceId[];
                      if (key === 'NONE' || key === 'UNKNOWN') {
                        nextSel = selected ? [] : [key];
                      } else {
                        const without = state.allowances.filter(
                          (id) => id !== 'NONE' && id !== 'UNKNOWN' && id !== key,
                        );
                        nextSel = selected ? without : [...without, key];
                      }
                      setState({ ...state, allowances: nextSel, hasPartner: null });
                    }}
                  >
                    {options[key] ?? key}
                  </ChoiceButton>
                );
              })}
              <button
                type="button"
                className={NEXT_BTN}
                onClick={goNext}
              >
                {copy.next}
              </button>
            </>
          )}

          {step === 'partner' &&
            (['YES', 'NO', 'UNKNOWN'] as const).map((key) => (
              <ChoiceButton
                key={key}
                selected={
                  (key === 'YES' && state.hasPartner === true) ||
                  (key === 'NO' && state.hasPartner === false) ||
                  (key === 'UNKNOWN' && state.hasPartner === 'UNKNOWN')
                }
                onClick={() => {
                  const hasPartner: WizardState['hasPartner'] =
                    key === 'YES' ? true : key === 'NO' ? false : 'UNKNOWN';
                  const next: WizardState = {
                    ...state,
                    hasPartner,
                    partnerHealthcareInsuranceStatus:
                      hasPartner === true
                        ? state.partnerHealthcareInsuranceStatus
                        : null,
                    partnerAssessmentEuro:
                      hasPartner === true ? state.partnerAssessmentEuro : '',
                    partnerArbeidsinkomenEuro:
                      hasPartner === true ? state.partnerArbeidsinkomenEuro : '',
                  };
                  setState(next);
                  const n = nextStep(next, 'partner');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'partnerInsurance' &&
            (['INSURED', 'NOT_INSURED', 'UNKNOWN'] as PartnerHealthcareInsuranceStatus[]).map(
              (key) => (
                <ChoiceButton
                  key={key}
                  selected={state.partnerHealthcareInsuranceStatus === key}
                  onClick={() => {
                    const next = {
                      ...state,
                      partnerHealthcareInsuranceStatus: key,
                    };
                    setState(next);
                    const n = nextStep(next, 'partnerInsurance');
                    if (n) setStep(n);
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ),
            )}

          {step === 'partnerIncome' && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-base text-gray-700">{copy.partnerAssessmentHelp}</span>
                <input
                  inputMode="decimal"
                  value={state.partnerAssessmentEuro}
                  onChange={(e) =>
                    setState({ ...state, partnerAssessmentEuro: e.target.value })
                  }
                  className={`mt-1 ${FIELD}`}
                  placeholder="€"
                />
              </label>
              <button
                type="button"
                className={NEXT_BTN}
                onClick={goNext}
              >
                {copy.next}
              </button>
            </div>
          )}

          {step === 'rentsHome' && (
            <>
              {(['RENT', 'OWNER_OCCUPIED', 'OTHER'] as const).map((value) => (
                <ChoiceButton
                  key={value}
                  selected={resolveHousingTenure(state) === value}
                  onClick={() => {
                    const next: WizardState = {
                      ...state,
                      housingTenure: value,
                      rentsHome: rentsHomeFromTenure(value),
                    };
                    setState(next);
                    const n = nextStep(next, 'rentsHome');
                    if (n) setStep(n);
                  }}
                >
                  {options[value] ?? value}
                </ChoiceButton>
              ))}
            </>
          )}

          {step === 'hasChildren' && (
            <TriChoices
              value={state.hasChildren}
              options={options}
              onSelect={(value) => {
                const next: WizardState = {
                  ...state,
                  hasChildren: value,
                  childrenAges: value === true ? state.childrenAges : '',
                  hasChildUnder12: value === true ? state.hasChildUnder12 : null,
                  usesChildcare: value === true ? state.usesChildcare : null,
                  childcareCareType: value === true ? state.childcareCareType : null,
                };
                setState(next);
                const n = nextStep(next, 'hasChildren');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'usesChildcare' && (
            <TriChoices
              value={state.usesChildcare}
              options={options}
              onSelect={(value) => {
                const next: WizardState = {
                  ...state,
                  usesChildcare: value,
                  childcareCareType: value === true ? state.childcareCareType : null,
                  childcareHoursPerMonth: value === true ? state.childcareHoursPerMonth : '',
                  childcareHourlyRateEuro: value === true ? state.childcareHourlyRateEuro : '',
                };
                setState(next);
                const n = nextStep(next, 'usesChildcare');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'housingRent' && (
            <div className="space-y-4">
              <input
                inputMode="decimal"
                value={state.bareRentEuro}
                onChange={(e) =>
                  setState({ ...state, bareRentEuro: e.target.value, onlyTotalRentKnown: false })
                }
                className={FIELD}
                placeholder="€"
              />
              <ChoiceButton
                selected={state.onlyTotalRentKnown === true}
                onClick={() =>
                  setState({ ...state, onlyTotalRentKnown: true, bareRentEuro: '' })
                }
              >
                {language === 'en'
                  ? 'I only know the total rent, not the bare rent'
                  : 'Ik weet alleen de totale huur, niet de kale huur'}
              </ChoiceButton>
              <button
                type="button"
                className={NEXT_BTN}
                onClick={goNext}
              >
                {copy.next}
              </button>
            </div>
          )}

          {step === 'housingHousehold' && (
            <div className="space-y-3">
              {(['SINGLE', 'MULTI'] as const).map((key) => (
                <ChoiceButton
                  key={key}
                  selected={state.housingHouseholdType === key}
                  onClick={() => setState({ ...state, housingHouseholdType: key })}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              <input
                inputMode="numeric"
                value={state.oldestHouseholdResidentAge}
                onChange={(e) =>
                  setState({ ...state, oldestHouseholdResidentAge: e.target.value })
                }
                className={FIELD}
                placeholder={language === 'en' ? 'Age of oldest resident' : 'Leeftijd oudste bewoner'}
              />
              <ChoiceButton
                selected={state.housingHasThuiswonendKindUnder23 === true}
                onClick={() =>
                  setState({
                    ...state,
                    housingHasThuiswonendKindUnder23: !state.housingHasThuiswonendKindUnder23,
                  })
                }
              >
                {language === 'en'
                  ? 'A child under 23 lives with me'
                  : 'Er woont een kind jonger dan 23 bij mij'}
              </ChoiceButton>
              {state.housingHasThuiswonendKindUnder23 === true && (
                <input
                  inputMode="decimal"
                  value={state.housingChildAssessmentEuro}
                  onChange={(e) =>
                    setState({ ...state, housingChildAssessmentEuro: e.target.value })
                  }
                  className={FIELD}
                  placeholder="€"
                />
              )}
              <button
                type="button"
                className={NEXT_BTN}
                onClick={goNext}
              >
                {copy.next}
              </button>
            </div>
          )}

          {step === 'housingAssets' &&
            (['ELIGIBLE', 'NOT_ELIGIBLE', 'UNKNOWN'] as AssetsEligibility[]).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.housingAssetsEligibility === key}
                onClick={() => {
                  const next = { ...state, housingAssetsEligibility: key };
                  advanceFrom(next, 'housingAssets');
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'housingWoz' && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-stone-600">{copy.housingWozHelp}</p>
              <input
                inputMode="decimal"
                value={state.wozValueEuro}
                onChange={(e) => setState({ ...state, wozValueEuro: e.target.value })}
                className={FIELD}
                placeholder="€"
                aria-label={title}
              />
              <button type="button" className={NEXT_BTN} onClick={goNext}>
                {copy.next}
              </button>
            </div>
          )}

          {step === 'housingInterest' && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-stone-600">{copy.housingInterestNotPaymentNote}</p>
              <input
                inputMode="decimal"
                value={state.deductibleMortgageInterestEuro}
                onChange={(e) =>
                  setState({
                    ...state,
                    deductibleMortgageInterestEuro: e.target.value,
                    mortgageInterestStatus: e.target.value.trim() ? 'KNOWN' : state.mortgageInterestStatus,
                  })
                }
                className={FIELD}
                placeholder="€"
                aria-label={title}
              />
              <ChoiceButton
                selected={state.mortgageInterestStatus === 'NONE'}
                onClick={() =>
                  setState({
                    ...state,
                    mortgageInterestStatus: 'NONE',
                    deductibleMortgageInterestEuro: '',
                  })
                }
              >
                {copy.housingNoMortgage}
              </ChoiceButton>
              <ChoiceButton
                selected={state.mortgageInterestStatus === 'UNKNOWN'}
                onClick={() =>
                  setState({
                    ...state,
                    mortgageInterestStatus: 'UNKNOWN',
                    deductibleMortgageInterestEuro: '',
                  })
                }
              >
                {copy.housingInterestUnknown}
              </ChoiceButton>
              <button
                type="button"
                className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-base text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                aria-label={copy.housingInterestWhereTitle}
                aria-haspopup="dialog"
                aria-expanded={infoDialog === 'interest'}
                onClick={() => setInfoDialog('interest')}
              >
                {copy.housingInterestWhereTitle}
              </button>
              <button type="button" className={NEXT_BTN} onClick={goNext}>
                {copy.next}
              </button>
            </div>
          )}

          {step === 'housingOwnerShare' && (
            <div className="space-y-4">
              {(['ALL', 'HALF', 'CUSTOM'] as const).map((key) => (
                <ChoiceButton
                  key={key}
                  selected={state.ownerHomeShare === key}
                  onClick={() => setState({ ...state, ownerHomeShare: key })}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              {state.ownerHomeShare === 'CUSTOM' ? (
                <input
                  inputMode="numeric"
                  value={state.ownerHomeSharePercent}
                  onChange={(e) => setState({ ...state, ownerHomeSharePercent: e.target.value })}
                  className={FIELD}
                  placeholder="%"
                  aria-label={options.CUSTOM}
                />
              ) : null}
              <button type="button" className={NEXT_BTN} onClick={goNext}>
                {copy.next}
              </button>
            </div>
          )}

          {step === 'children' && (
            <div className="space-y-4">
              <input
                value={state.childrenAges}
                onChange={(e) => setState({ ...state, childrenAges: e.target.value })}
                className={FIELD}
                placeholder={language === 'en' ? 'For example 8, 14' : 'Bijvoorbeeld 8, 14'}
                aria-label={title}
              />
              <button type="button" className={NEXT_BTN} onClick={goNext}>
                {copy.next}
              </button>
            </div>
          )}

          {step === 'youngChild' &&
            (
              [
                ['YES', true],
                ['NO', false],
              ] as const
            ).map(([key, value]) => (
              <ChoiceButton
                key={key}
                selected={state.hasChildUnder12 === value}
                onClick={() => {
                  const next = { ...state, hasChildUnder12: value };
                  setState(next);
                  const n = nextStep(next, 'youngChild');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'iackHousehold' && (
            <>
              {(
                ['AT_LEAST_6_MONTHS', 'LESS_THAN_6_MONTHS', 'UNKNOWN'] as IackHouseholdDuration[]
              ).map((key) => (
                <ChoiceButton
                  key={key}
                  selected={state.iackHouseholdDuration === key}
                  onClick={() => {
                    const next = { ...state, iackHouseholdDuration: key };
                    setState(next);
                    const n = nextStep(next, 'iackHousehold');
                    if (n) setStep(n);
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              <details className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <summary>{copy.whatMeansThis}</summary>
                <p className="mt-2">{copy.iackHelp}</p>
              </details>
            </>
          )}

          {step === 'iackCoParent' &&
            (
              ['QUALIFYING_CO_PARENT', 'NOT_QUALIFYING', 'UNKNOWN'] as IackCoParentStatus[]
            ).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.iackCoParentStatus === key}
                onClick={() => {
                  const next = { ...state, iackCoParentStatus: key };
                  setState(next);
                  const n = nextStep(next, 'iackCoParent');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'fiscalPartner' && (
            <>
              {(
                [
                  'NONE',
                  'LESS_THAN_6_MONTHS',
                  'MORE_THAN_6_MONTHS',
                  'UNKNOWN',
                ] as FiscalPartnerDuration[]
              ).map((key) => (
                <ChoiceButton
                  key={key}
                  selected={state.fiscalPartnerDuration === key}
                  onClick={() => {
                    const next = { ...state, fiscalPartnerDuration: key };
                    setState(next);
                    const n = nextStep(next, 'fiscalPartner');
                    if (n) setStep(n);
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              <details className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <summary>{copy.whatMeansThis}</summary>
                <p className="mt-2">{copy.fiscalPartnerHelp}</p>
              </details>
            </>
          )}

          {step === 'iackPartnerIncome' && (
            <div className="space-y-4">
              <input
                inputMode="decimal"
                value={state.partnerArbeidsinkomenEuro}
                onChange={(e) =>
                  setState({ ...state, partnerArbeidsinkomenEuro: e.target.value })
                }
                className={FIELD}
              />
              <button
                type="button"
                className={NEXT_BTN}
                onClick={goNext}
              >
                {copy.next}
              </button>
            </div>
          )}

          {step === 'iackRelativeAge' &&
            (['USER_OLDER', 'PARTNER_OLDER', 'UNKNOWN'] as IackRelativeAge[]).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.iackRelativeAge === key}
                onClick={() => {
                  const next = { ...state, iackRelativeAge: key };
                  setState(next);
                  const n = nextStep(next, 'iackRelativeAge');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'childBudgetAssets' &&
            (['ELIGIBLE', 'NOT_ELIGIBLE', 'UNKNOWN'] as AssetsEligibility[]).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.childBudgetAssetsEligibility === key}
                onClick={() => {
                  const next = { ...state, childBudgetAssetsEligibility: key };
                  advanceFrom(next, 'childBudgetAssets');
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'childcare' && (
            <div className="space-y-3">
              {(
                [
                  ['DAYCARE_CENTER', options.DAYCARE_CENTER ?? 'Kinderdagverblijf'],
                  ['AFTER_SCHOOL_CENTER', options.AFTER_SCHOOL_CENTER ?? 'Buitenschoolse opvang (BSO)'],
                  ['CHILDMINDER', options.CHILDMINDER ?? 'Gastouder'],
                ] as const
              ).map(([key, label]) => (
                <ChoiceButton
                  key={key}
                  selected={state.childcareCareType === key}
                  onClick={() => setState({ ...state, childcareCareType: key as ChildcareCareType })}
                >
                  {label}
                </ChoiceButton>
              ))}
              <input
                inputMode="numeric"
                value={state.childcareHoursPerMonth}
                onChange={(e) => setState({ ...state, childcareHoursPerMonth: e.target.value })}
                className={FIELD}
                placeholder={language === 'en' ? 'Hours per month' : 'Uren per maand'}
              />
              <input
                inputMode="decimal"
                value={state.childcareHourlyRateEuro}
                onChange={(e) => setState({ ...state, childcareHourlyRateEuro: e.target.value })}
                className={FIELD}
                placeholder="€"
              />
              {(
                [
                  ['REGISTERED_ELIGIBLE', options.REGISTERED_ELIGIBLE ?? (language === 'en' ? 'Yes, this childcare counts for allowance' : 'Ja, deze opvang telt voor toeslag')],
                  ['NOT_ELIGIBLE', options.NOT_ELIGIBLE ?? (language === 'en' ? 'No, this childcare does not count for allowance' : 'Nee, deze opvang telt niet voor toeslag')],
                  ['UNKNOWN', options.UNKNOWN ?? (language === 'en' ? 'I don’t know' : 'Ik weet het niet')],
                ] as const
              ).map(([key, label]) => (
                <ChoiceButton
                  key={key}
                  selected={state.childcareProviderStatus === key}
                  onClick={() =>
                    setState({
                      ...state,
                      childcareProviderStatus: key as ChildcareProviderEligibility,
                    })
                  }
                >
                  {label}
                </ChoiceButton>
              ))}
              <button
                type="button"
                className={NEXT_BTN}
                onClick={goNext}
              >
                {copy.next}
              </button>
            </div>
          )}

          {step === 'workStudy' &&
            (['ELIGIBLE', 'NOT_ELIGIBLE', 'UNKNOWN'] as ParentWorkStudyStatus[]).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.parentWorkStudyStatus === key}
                onClick={() => {
                  const next = { ...state, parentWorkStudyStatus: key };
                  setState(next);
                  const n = nextStep(next, 'workStudy');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'midYear' &&
            (['YES', 'NO'] as const).map((key) => (
              <ChoiceButton
                key={key}
                selected={
                  (key === 'YES' && state.midYearHouseholdChange === false) ||
                  (key === 'NO' && state.midYearHouseholdChange === true)
                }
                onClick={() => {
                  const next = {
                    ...state,
                    midYearHouseholdChange: key === 'NO',
                  };
                  advanceFrom(next, 'midYear');
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'activity' &&
            (
              [
                'MAKE',
                'FOOD',
                'SERVICE',
                'AFFILIATE',
                'GARDEN',
                'OTHER',
                'UNKNOWN',
              ] as ActivityChoice[]
            ).map(
              (key) => (
                <ChoiceButton
                  key={key}
                  selected={state.activityChoice === key}
                  onClick={() => {
                    const next = {
                      ...state,
                      activityChoice: key,
                      activityKinds: applyActivityChoice(key),
                    };
                    setState(next);
                    const n = nextStep(next, 'activity');
                    if (n) setStep(n);
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ),
            )}

          {step === 'growthStart' &&
            (
              [
                'TRYING_OUT',
                'OCCASIONAL_EARNING',
                'REGULAR_EARNING',
                'SERIOUS_SIDE_INCOME',
                'BUILDING_BUSINESS',
              ] as HomecheffGrowthIntent[]
            ).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.growthStart === key}
                onClick={() => {
                  const next = applyGrowthStartChoice(state, key);
                  setState(next);
                  const n = nextStep(next, 'growthStart');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'frequency' &&
            (['ONE_OFF', 'OCCASIONAL', 'REGULAR', 'UNKNOWN'] as SaleFrequency[]).map(
              (key) => (
                <ChoiceButton
                  key={key}
                  selected={state.frequency === key}
                  onClick={() => {
                    const next = { ...state, frequency: key };
                    setState(next);
                    const n = nextStep(next, 'frequency');
                    if (n) setStep(n);
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ),
            )}

          {step === 'foodSellingFrequency' &&
            (
              [
                'ONE_OFF',
                'OCCASIONAL_RECURRING',
                'REGULAR',
                'UNKNOWN',
              ] as const
            ).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.foodUxFrequency === key}
                onClick={() => {
                  const next = { ...state, foodUxFrequency: key };
                  setState(next);
                  const n = nextStep(next, 'foodSellingFrequency');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'foodPackaging' &&
            (
              [
                'UNPACKAGED',
                'PREPACKED',
                'PREPACKED_FOR_DIRECT_SALE',
                'UNKNOWN',
              ] as PackagingMode[]
            ).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.packagingMode === key}
                onClick={() => {
                  const next = { ...state, packagingMode: key };
                  setState(next);
                  const n = nextStep(next, 'foodPackaging');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'foodNvwa' && (
            <TriChoices
              value={state.nvwaRegistered}
              options={options}
              onSelect={(value) => {
                const next = { ...state, nvwaRegistered: value };
                setState(next);
                const n = nextStep(next, 'foodNvwa');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'foodSafetyPlan' &&
            (
              [
                'USING_APPROVED_HYGIENE_CODE',
                'USING_OWN_HACCP_PLAN',
                'NOT_ARRANGED',
                'UNKNOWN',
              ] as FoodSafetyPlanStatus[]
            ).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.foodSafetyPlanStatus === key}
                onClick={() => {
                  const next = { ...state, foodSafetyPlanStatus: key };
                  setState(next);
                  const n = nextStep(next, 'foodSafetyPlan');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'foodAnimalOrigin' && (
            <TriChoices
              value={state.handlesAnimalOriginProducts}
              options={options}
              onSelect={(value) => {
                const next = { ...state, handlesAnimalOriginProducts: value };
                setState(next);
                const n = nextStep(next, 'foodAnimalOrigin');
                if (n) setStep(n);
              }}
            />
          )}

          {step === 'customers' &&
            (['PRIVATE_CIRCLE', 'PUBLIC', 'MIXED', 'UNKNOWN'] as CustomerScope[]).map(
              (key) => (
                <ChoiceButton
                  key={key}
                  selected={state.customers === key}
                  onClick={() => {
                    const next = { ...state, customers: key };
                    setState(next);
                    const n = nextStep(next, 'customers');
                    if (n) setStep(n);
                  }}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ),
            )}

          {step === 'independentlyDeterminesWork' &&
            (
              [
                ['YES', true],
                ['NO', false],
                ['UNKNOWN', 'UNKNOWN'],
              ] as const
            ).map(([key, value]) => (
              <ChoiceButton
                key={key}
                selected={state.independentlyDeterminesWork === value}
                onClick={() => {
                  const next = { ...state, independentlyDeterminesWork: value };
                  setState(next);
                  const n = nextStep(next, 'independentlyDeterminesWork');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'customerAcquisition' &&
            (
              [
                ['YES', true],
                ['NO', false],
                ['UNKNOWN', 'UNKNOWN'],
              ] as const
            ).map(([key, value]) => (
              <ChoiceButton
                key={key}
                selected={state.customerAcquisition === value}
                onClick={() => {
                  const next = { ...state, customerAcquisition: value };
                  setState(next);
                  const n = nextStep(next, 'customerAcquisition');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'intent' &&
            (
              [
                'HOBBY_COST_RECOVERY',
                'SIDE_INCOME',
                'SERIOUS_SIDE_INCOME',
                'BUILD_BUSINESS',
                'UNKNOWN',
              ] as CommercialIntent[]
            ).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.intent === key}
                onClick={() => {
                  const next = { ...state, intent: key };
                  setState(next);
                  const n = nextStep(next, 'intent');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'currentIncome' && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-gray-700">{copy.baselineEstablished}</p>
              <div className="flex flex-col gap-2">
                <ChoiceButton
                  selected={state.currentIncomeBasis !== 'NET'}
                  onClick={() => setState({ ...state, currentIncomeBasis: 'GROSS' })}
                >
                  {copy.incomeGross}
                </ChoiceButton>
                <ChoiceButton
                  selected={state.currentIncomeBasis === 'NET'}
                  onClick={() => {
                    if (state.ageTaxRegime === 'REACHES_AOW_IN_2026') {
                      setState({ ...state, currentIncomeBasis: 'GROSS' });
                      return;
                    }
                    setState({ ...state, currentIncomeBasis: 'NET' });
                  }}
                >
                  {copy.incomeNet}
                </ChoiceButton>
              </div>
              {state.ageTaxRegime === 'REACHES_AOW_IN_2026' ? (
                <p className="text-sm leading-relaxed text-gray-600">{copy.netInputAowNote}</p>
              ) : null}
              <div className="flex flex-col gap-2">
                <ChoiceButton
                  selected={state.currentIncomePeriod === 'MONTH'}
                  onClick={() => setState({ ...state, currentIncomePeriod: 'MONTH' })}
                >
                  {copy.periodMonth}
                </ChoiceButton>
                <ChoiceButton
                  selected={state.currentIncomePeriod === 'YEAR'}
                  onClick={() => setState({ ...state, currentIncomePeriod: 'YEAR' })}
                >
                  {copy.periodYear}
                </ChoiceButton>
              </div>
              {state.currentIncomePeriod === 'MONTH' ? (
                <p className="text-sm leading-relaxed text-gray-600">{copy.monthToYearHint}</p>
              ) : (
                <p className="text-sm leading-relaxed text-gray-600">{copy.yearInclusiveHint}</p>
              )}
              {state.currentIncomeBasis === 'NET' &&
              state.ageTaxRegime !== 'REACHES_AOW_IN_2026' ? (
                <p className="text-sm leading-relaxed text-gray-600">{copy.netInputEstimateNote}</p>
              ) : null}
              {shouldAskPayrollTaxCredit(state) && !state.currentIncomeUnknown ? (
                <div className="space-y-2">
                  <p className="text-base font-medium text-gray-900">{copy.payrollTaxCreditQuestion}</p>
                  {(
                    [
                      ['YES', copy.payrollTaxCreditYes],
                      ['NO', copy.payrollTaxCreditNo],
                      ['UNKNOWN', copy.payrollTaxCreditUnknown],
                    ] as const
                  ).map(([key, label]) => (
                    <ChoiceButton
                      key={key}
                      selected={state.payrollTaxCredit === key}
                      onClick={() => setState({ ...state, payrollTaxCredit: key })}
                    >
                      {label}
                    </ChoiceButton>
                  ))}
                </div>
              ) : null}
              {currentIncomeError ? (
                <p
                  ref={invalidRef}
                  tabIndex={-1}
                  role="alert"
                  className="text-base text-red-700"
                >
                  {copy.currentIncomeInvalid}
                </p>
              ) : null}
              <label className="block">
                <span className="sr-only">{copy.steps.currentIncome?.title}</span>
                <input
                  inputMode="decimal"
                  value={state.currentIncomeUnknown ? '' : state.currentIncomeEuro}
                  disabled={state.currentIncomeUnknown}
                  onChange={(e) =>
                    setState({
                      ...state,
                      currentIncomeEuro: e.target.value,
                      currentIncomeUnknown: false,
                    })
                  }
                  className={`mt-1 ${FIELD}`}
                  placeholder="€"
                  aria-label={copy.steps.currentIncome?.title}
                />
              </label>
              <ChoiceButton
                selected={state.currentIncomeUnknown}
                onClick={() =>
                  setState({
                    ...state,
                    currentIncomeUnknown: true,
                    currentIncomeEuro: '',
                  })
                }
              >
                {copy.currentIncomeUnknown}
              </ChoiceButton>
              {shouldAskHolidayPay(state) && !state.currentIncomeUnknown ? (
                <>
                  {holidayPayError ? (
                    <p role="alert" className="text-sm text-red-700">
                      {state.holidayPayIncluded === 'NO' && state.holidayPayPercentMode === 'CUSTOM'
                        ? copy.holidayPayPercentInvalid
                        : copy.holidayPayQuestion}
                    </p>
                  ) : null}
                  <VerdienCheckHolidayPayFields
                  copy={copy}
                  included={state.holidayPayIncluded}
                  percentMode={state.holidayPayPercentMode}
                  customPercent={state.holidayPayCustomPercent}
                  onIncluded={(value) => {
                    setHolidayPayError(false);
                    setState({ ...state, holidayPayIncluded: value });
                  }}
                  onPercentMode={(value) => {
                    setHolidayPayError(false);
                    setState({ ...state, holidayPayPercentMode: value });
                  }}
                  onCustomPercent={(value) => {
                    setHolidayPayError(false);
                    setState({ ...state, holidayPayCustomPercent: value });
                  }}
                />
                </>
              ) : null}
              <p className="text-base font-medium text-gray-900">{copy.otherIncomeTitle}</p>
              <TriChoices
                value={state.hasOtherIncome}
                options={copy.steps.currentIncome?.options ?? {}}
                onSelect={(value) => setState({ ...state, hasOtherIncome: value })}
              />
              {state.hasOtherIncome === true ? (
                <label className="block">
                  <span className="text-base text-gray-700">{copy.otherIncomeAmount}</span>
                  <input
                    inputMode="decimal"
                    value={state.otherIncomeEuro}
                    onChange={(e) => setState({ ...state, otherIncomeEuro: e.target.value })}
                    className={`mt-1 ${FIELD}`}
                    placeholder="€"
                  />
                </label>
              ) : null}
              <ChoiceButton
                selected={state.advancedAccuracyRequested}
                onClick={() =>
                  setState({
                    ...state,
                    advancedAccuracyRequested: !state.advancedAccuracyRequested,
                  })
                }
              >
                {copy.advancedAccuracy}
              </ChoiceButton>
              {state.advancedAccuracyRequested ? (
                <p className="text-sm leading-relaxed text-gray-600">{copy.advancedAccuracyExplain}</p>
              ) : null}
              <button type="button" className={NEXT_BTN} onClick={goNext}>
                {copy.next}
              </button>
            </div>
          )}

          {step === 'amounts' && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-gray-700">{copy.moneyExplain}</p>
              <p className="text-base leading-relaxed text-gray-700">{copy.estimateOk}</p>
              <div className="flex flex-col gap-2">
                <ChoiceButton
                  selected={state.amountEntryPeriod === 'YEAR'}
                  onClick={() => setState({ ...state, amountEntryPeriod: 'YEAR' })}
                >
                  {copy.periodYear}
                </ChoiceButton>
                <ChoiceButton
                  selected={state.amountEntryPeriod === 'MONTH'}
                  onClick={() => setState({ ...state, amountEntryPeriod: 'MONTH' })}
                >
                  {copy.periodMonth}
                </ChoiceButton>
              </div>
              <p className="text-base leading-relaxed text-gray-700">
                {state.amountEntryPeriod === 'MONTH' ? copy.monthToYearHint : copy.yearlyHint}
              </p>
              <label className="block">
                <span className="text-base text-gray-700">{copy.expectedTurnover}</span>
                <input
                  inputMode="decimal"
                  value={state.estimatedTurnoverEuro}
                  onChange={(e) =>
                    setState({ ...state, estimatedTurnoverEuro: e.target.value })
                  }
                  className={`mt-1 ${FIELD}`}
                  placeholder="€"
                />
              </label>
              <label className="block">
                <span className="text-base text-gray-700">{copy.expectedCosts}</span>
                <input
                  inputMode="decimal"
                  value={state.estimatedCostsEuro}
                  onChange={(e) =>
                    setState({ ...state, estimatedCostsEuro: e.target.value })
                  }
                  className={`mt-1 ${FIELD}`}
                  placeholder="€"
                />
              </label>
              <label className="block">
                <span className="text-base text-gray-700">{copy.estimatedSales}</span>
                <input
                  inputMode="numeric"
                  value={state.estimatedAnnualTransactions}
                  onChange={(e) =>
                    setState({ ...state, estimatedAnnualTransactions: e.target.value })
                  }
                  className={`mt-1 ${FIELD}`}
                />
              </label>
              <p className="text-lg font-medium text-gray-900">
                {copy.expectedResult}: €{formatCentsAsEuroDisplay(liveResult)}
              </p>
              <button type="button" className={NEXT_BTN} onClick={goNext}>
                {copy.next}
              </button>
            </div>
          )}

          {step === 'otherVatTurnover' && (
            <div className="space-y-3">
              {(
                [
                  ['YES', true],
                  ['NO', false],
                  ['UNKNOWN', 'UNKNOWN'],
                ] as const
              ).map(([key, value]) => (
                <ChoiceButton
                  key={key}
                  selected={state.hasOtherBusinessTurnover === value}
                  onClick={() =>
                    setState({ ...state, hasOtherBusinessTurnover: value })
                  }
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              {state.hasOtherBusinessTurnover === true && (
                <input
                  inputMode="decimal"
                  value={state.otherRelevantVatTurnoverEuro}
                  onChange={(e) =>
                    setState({ ...state, otherRelevantVatTurnoverEuro: e.target.value })
                  }
                  className={FIELD}
                  placeholder={copy.otherTurnoverAmount}
                />
              )}
              <input
                inputMode="decimal"
                value={state.previousYearVatTurnoverEuro}
                onChange={(e) =>
                  setState({ ...state, previousYearVatTurnoverEuro: e.target.value })
                }
                className={FIELD}
                placeholder={copy.previousYearTurnover}
              />
              <button
                type="button"
                className={NEXT_BTN}
                onClick={goNext}
              >
                {copy.next}
              </button>
            </div>
          )}

          {step === 'existingRegistrations' && (
            <div className="space-y-4">
              <p className="text-base font-medium text-gray-900">{copy.registrationKvkLabel}</p>
              {(
                [
                  ['KVK_YES', true],
                  ['KVK_NO', false],
                  ['KVK_UNKNOWN', 'UNKNOWN'],
                ] as const
              ).map(([key, value]) => (
                <ChoiceButton
                  key={key}
                  selected={state.alreadyKvkRegistered === value}
                  onClick={() => setState({ ...state, alreadyKvkRegistered: value })}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              <p className="text-base font-medium text-gray-900">{copy.registrationVatLabel}</p>
              {(
                [
                  ['VAT_YES', 'REGISTERED'],
                  ['VAT_NO', 'NOT_REGISTERED'],
                  ['VAT_UNKNOWN', 'UNKNOWN'],
                ] as const
              ).map(([key, value]) => (
                <ChoiceButton
                  key={key}
                  selected={state.vatRegistrationStatus === value}
                  onClick={() => setState({ ...state, vatRegistrationStatus: value })}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              <p className="text-base font-medium text-gray-900">{copy.registrationKorLabel}</p>
              {(
                [
                  ['KOR_YES', true],
                  ['KOR_NO', false],
                  ['KOR_UNKNOWN', 'UNKNOWN'],
                ] as const
              ).map(([key, value]) => (
                <ChoiceButton
                  key={key}
                  selected={state.korParticipating === value}
                  onClick={() => setState({ ...state, korParticipating: value })}
                >
                  {options[key] ?? key}
                </ChoiceButton>
              ))}
              <button type="button" className={NEXT_BTN} onClick={goNext}>
                {copy.next}
              </button>
            </div>
          )}

          {step === 'costAssumption' &&
            (['YES', 'NO'] as const).map((key) => (
              <ChoiceButton
                key={key}
                selected={
                  (key === 'YES' && state.assumeEstimatedCostsTaxDeductible === true) ||
                  (key === 'NO' && state.assumeEstimatedCostsTaxDeductible === false)
                }
                onClick={() => {
                  const next = {
                    ...state,
                    assumeEstimatedCostsTaxDeductible: key === 'YES',
                  };
                  setState(next);
                  const n = nextStep(next, 'costAssumption');
                  if (n) setStep(n);
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'rowAssumption' && (
            <div className="space-y-4">
              <p className="text-base text-gray-800">{copy.rowAssumptionNote}</p>
              <ChoiceButton
                selected={state.acceptRowAssumption}
                onClick={() => {
                  const next = { ...state, acceptRowAssumption: true };
                  setState(next);
                  const n = nextStep(next, 'rowAssumption');
                  if (n) setStep(n);
                }}
              >
                {options.ACCEPT ?? copy.next}
              </ChoiceButton>
            </div>
          )}

          {step === 'incomeBases' && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-gray-700">{copy.advancedAccuracyExplain}</p>
              {(
                [
                  ['baselineGrossEmploymentEuro', copy.grossEmploymentHelp],
                  ['baselineBox1Euro', copy.box1Help],
                  ['baselineAggregateEuro', copy.aggregateHelp],
                  ['baselineArbeidsinkomenEuro', copy.arbeidsHelp],
                  ['baselineAssessmentEuro', copy.assessmentHelp],
                  ['baselineZvwUsedEuro', copy.zvwUsedHelp],
                ] as const
              ).map(([field, help]) => (
                <label key={field} className="block">
                  <span className="text-base text-gray-700">{help}</span>
                  <input
                    inputMode="decimal"
                    value={state[field]}
                    onChange={(e) =>
                      setState({ ...state, [field]: e.target.value })
                    }
                    className={`mt-1 ${FIELD}`}
                    placeholder="€"
                  />
                </label>
              ))}
              <button type="button" className={NEXT_BTN} onClick={goNext}>
                {copy.next}
              </button>
            </div>
          )}

          {step === 'assets' &&
            (['ELIGIBLE', 'NOT_ELIGIBLE', 'UNKNOWN'] as AssetsEligibility[]).map((key) => (
              <ChoiceButton
                key={key}
                selected={state.assetsEligibility === key}
                onClick={() => {
                  const next = { ...state, assetsEligibility: key };
                  advanceFrom(next, 'assets');
                }}
              >
                {options[key] ?? key}
              </ChoiceButton>
            ))}

          {step === 'scenario' && (
            <div className="space-y-3">
              <p className="text-base leading-relaxed text-gray-700">{copy.extraResultExplain}</p>
              <VerdienCheckCostAdvantage
                copy={copy}
                showExample={false}
                mode={state.scenarioInputMode}
                helperRevenueEuro={state.helperRevenueEuro}
                helperCostsEuro={state.helperCostsEuro}
                helperCostsUnknown={state.helperCostsUnknown}
                onSelectResultMode={() => setState(applyDirectResultMode(state))}
                onSelectHelperMode={() => setState(applyRevenueCostHelperFields(state, {}))}
                onHelperRevenueChange={(value) =>
                  setState(applyRevenueCostHelperFields(state, { helperRevenueEuro: value }))
                }
                onHelperCostsChange={(value) =>
                  setState(applyRevenueCostHelperFields(state, { helperCostsEuro: value }))
                }
                onHelperCostsUnknown={(unknown) =>
                  setState(applyRevenueCostHelperFields(state, { helperCostsUnknown: unknown }))
                }
              />
              {state.scenarioInputMode !== 'REVENUE_COST' ? (
                <>
                  <p className="text-sm leading-relaxed text-stone-600">{copy.scenarioResultHint}</p>
                  {SCENARIO_PRESET_EUROS.map((euro) => (
                    <ChoiceButton
                      key={euro}
                      selected={state.scenarioPreset === euro}
                      onClick={() => {
                        const next = { ...applyDirectResultMode(state), scenarioPreset: euro };
                        const n = nextStep(next, 'scenario');
                        setState(markMoneyDepthCompleted(next, 'scenario', n));
                        if (n) setStep(n);
                      }}
                    >
                      €{euro.toLocaleString('nl-NL')}
                    </ChoiceButton>
                  ))}
                  <ChoiceButton
                    selected={state.scenarioPreset === 'custom'}
                    onClick={() =>
                      setState({ ...applyDirectResultMode(state), scenarioPreset: 'custom' })
                    }
                  >
                    {copy.customAmount}
                  </ChoiceButton>
                  {state.scenarioPreset === 'custom' && (
                    <>
                      <input
                        inputMode="decimal"
                        value={state.customScenarioEuro}
                        onChange={(e) =>
                          setState({
                            ...applyDirectResultMode(state),
                            customScenarioEuro: e.target.value,
                            scenarioPreset: 'custom',
                          })
                        }
                        className={FIELD}
                        placeholder="€"
                      />
                      <button type="button" className={NEXT_BTN} onClick={goNext}>
                        {copy.next}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button type="button" className={NEXT_BTN} onClick={goNext}>
                  {copy.next}
                </button>
              )}
            </div>
          )}

          {step === 'result' && state.taxResidence === 'OTHER' && (
            <p className="text-base text-gray-800">{copy.otherCountry}</p>
          )}

          {step === 'result' && state.taxResidence === 'NL' && (
            <div className="space-y-5">
              {state.moneyDepthCompleted && !isBenefitSituation(state) ? (
                <VerdienCheckBaselineCard
                  copy={copy}
                  route={personalRoute}
                  showHeading={extraResultChosen}
                  incomeAnnualCents={
                    calculatorInput?.baselineGrossEmploymentIncomeCents ??
                    calculatorInput?.baselineBox1TaxableIncomeCents ??
                    null
                  }
                  incomeIsNetEstimate={
                    state.currentIncomeBasis === 'NET' &&
                    derivedIncomeBases.netToGrossConfidence === 'ESTIMATE'
                  }
                  incomeUnknownReason={
                    state.currentIncomeUnknown
                      ? copy.currentIncomeUnknown
                      : derivedIncomeBases.holidayPayUnresolved
                        ? copy.holidayPayUnresolvedNote
                        : state.currentIncomeBasis === 'NET' &&
                            calculatorInput?.baselineBox1TaxableIncomeCents == null
                          ? copy.netInputEstimateNote
                          : null
                  }
                />
              ) : null}
              {state.moneyDepthCompleted && !isBenefitSituation(state) && !state.scenarioLayerRequested ? (
                <button
                  type="button"
                  className={NEXT_BTN}
                  onClick={() => setState({ ...state, scenarioLayerRequested: true })}
                >
                  {copy.viewExtraScenarioCta}
                </button>
              ) : null}
              {state.moneyDepthCompleted &&
              !isBenefitSituation(state) &&
              state.scenarioLayerRequested ? (
                <VerdienCheckFinancialImpact
                  copy={copy}
                  route={personalRoute}
                  scenarioPreset={state.scenarioPreset}
                  customScenarioEuro={state.customScenarioEuro}
                  scenarioInputMode={state.scenarioInputMode}
                  helperRevenueEuro={state.helperRevenueEuro}
                  helperCostsEuro={state.helperCostsEuro}
                  helperCostsUnknown={state.helperCostsUnknown}
                  comparison={scenarioComparison}
                  onSelectPreset={(euro: ScenarioPresetEuro) =>
                    setState({
                      ...applyDirectResultMode(state),
                      scenarioPreset: euro,
                      customScenarioEuro: '',
                    })
                  }
                  onSelectCustom={() =>
                    setState({ ...applyDirectResultMode(state), scenarioPreset: 'custom' })
                  }
                  onCustomChange={(value) =>
                    setState({
                      ...applyDirectResultMode(state),
                      customScenarioEuro: value,
                      scenarioPreset: 'custom',
                    })
                  }
                  onSelectResultMode={() => setState(applyDirectResultMode(state))}
                  onSelectHelperMode={() => setState(applyRevenueCostHelperFields(state, {}))}
                  onHelperRevenueChange={(value) =>
                    setState(applyRevenueCostHelperFields(state, { helperRevenueEuro: value }))
                  }
                  onHelperCostsChange={(value) =>
                    setState(applyRevenueCostHelperFields(state, { helperCostsEuro: value }))
                  }
                  onHelperCostsUnknown={(unknown) =>
                    setState(applyRevenueCostHelperFields(state, { helperCostsUnknown: unknown }))
                  }
                  growthTitles={[
                    ...personalRoute.soon.map((card) => card.title),
                    ...personalRoute.later.map((card) => card.title),
                  ]}
                />
              ) : !state.moneyDepthCompleted ? (
                <VerdienCheckResultSummary route={personalRoute} omitHeadline />
              ) : null}
              {!state.moneyDepthCompleted ? (
                <VerdienCheckNowSection cards={personalRoute.now} heading={copy.nowHeading} />
              ) : null}
              {isAffiliateActivity(state.activityChoice) ? (
                <p className="text-sm leading-relaxed text-stone-600">{copy.affiliateReviewNote}</p>
              ) : null}
              {!state.moneyDepthCompleted &&
              (personalRoute.soon.length > 0 ||
                personalRoute.later.length > 0 ||
                personalRoute.restDetails.length > 0) ? (
                <details
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                  onToggle={(event) => {
                    if ((event.currentTarget as HTMLDetailsElement).open) {
                      trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.detailsOpened);
                    }
                  }}
                >
                  <summary className="cursor-pointer min-h-12 text-base font-medium text-stone-800">
                    {copy.laterHeading}
                  </summary>
                  <div className="mt-3 space-y-3">
                    <VerdienCheckSoonSection cards={personalRoute.soon} plain />
                    <VerdienCheckLaterSection
                      cards={personalRoute.later}
                      restDetails={personalRoute.restDetails}
                      plain
                    />
                  </div>
                </details>
              ) : null}
              {!isBenefitSituation(state) && !state.moneyDepthCompleted ? (
                <div className="space-y-3">
                  <p className="text-base font-medium leading-relaxed text-stone-800">
                    {copy.quickCheckDone}
                  </p>
                  <p className="text-sm leading-relaxed text-stone-600">
                    {personalRoute.trackingMessage}
                  </p>
                  <p className="text-base leading-relaxed text-stone-700">{copy.moneyPrompt}</p>
                  <button type="button" className={NEXT_BTN} onClick={startMoneyDepth}>
                    {copy.moneyYes}
                  </button>
                </div>
              ) : null}
              {state.moneyDepthCompleted ? (
                <p className="text-base font-medium text-stone-800">{copy.moneyDone}</p>
              ) : null}
              {personalRoute.proceedSemantics === 'READY_TO_PROCEED' ||
              personalRoute.proceedSemantics === 'PROCEED_AFTER_ACTION' ? (
                <VerdienCheckResultCta
                  copy={copy}
                  entryPoint={entryPoint}
                  primaryStartSelling={resultCtaMode === 'SELL_PRIMARY'}
                  secondaryStartSelling={resultCtaMode === 'SELL_SECONDARY'}
                  ctaMode={resultCtaMode}
                  onRestart={requestRestart}
                  variant="sell"
                  activity={state.activityChoice}
                  moneyCompleted={Boolean(state.moneyDepthCompleted && extraResultChosen)}
                  includeShare={step === 'result'}
                />
              ) : null}
              <VerdienCheckResultCta
                copy={copy}
                entryPoint={entryPoint}
                primaryStartSelling={false}
                secondaryStartSelling={false}
                onRestart={requestRestart}
                variant="nav"
                completed={step === 'result'}
                includeShare={
                  step === 'result' &&
                  personalRoute.proceedSemantics !== 'READY_TO_PROCEED' &&
                  personalRoute.proceedSemantics !== 'PROCEED_AFTER_ACTION'
                }
              />
            </div>
          )}

          {step === 'result' && state.taxResidence === 'OTHER' && (
            <VerdienCheckResultCta
              copy={copy}
              entryPoint={entryPoint}
              primaryStartSelling={false}
              secondaryStartSelling={false}
              onRestart={requestRestart}
              completed
            />
          )}
        </div>

        {step !== 'result' ? <StepHelp copy={copy} step={step} /> : null}

        {step !== 'jurisdiction' && (
          <button
            type="button"
            onClick={goBack}
            className="relative z-[80] mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg text-gray-800 pointer-events-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            {copy.back}
          </button>
        )}

        <div className="mt-10">
          <VerdienCheckDisclaimer copy={copy} />
        </div>
      </div>
    </div>
  );
}
