'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PORTFOLIO_FOCUS,
  DEFAULT_SCENARIO_LEVEL,
  assumptionsFor,
  assumptionsWithoutAddOns,
  compareScenarioLevels,
  percentLabel,
  quoteIncomeGoal,
  starterOnlyCustomersForGoal,
  type GoalAssumptions,
  type PortfolioFocus,
  type ScenarioLevel,
} from '@/lib/affiliate/goal-scenarios';

function eur(cents: number, en: boolean, digits = 2): string {
  return new Intl.NumberFormat(en ? 'en-GB' : 'nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(cents / 100);
}

function pct(value: number, en: boolean): string {
  return `${new Intl.NumberFormat(en ? 'en-GB' : 'nl-NL', { maximumFractionDigits: 1 }).format(value)}%`;
}

const GOAL_COPY = [
  {
    eur: 2000,
    nl: 'Een serieuze extra inkomstenstroom',
    en: 'A serious extra income stream',
  },
  {
    eur: 5000,
    nl: 'Een volwaardige commerciële portefeuille',
    en: 'A full commercial portfolio',
  },
  {
    eur: 10000,
    nl: 'Een grote actieve klantenportefeuille',
    en: 'A large active customer portfolio',
  },
  {
    eur: 20000,
    nl: 'Een schaalbare portefeuille over meerdere HomeCheff-diensten',
    en: 'A scalable portfolio across several HomeCheff services',
  },
] as const;

const LEVELS: { id: ScenarioLevel; nl: string; en: string }[] = [
  { id: 'conservative', nl: 'Voorzichtig', en: 'Conservative' },
  { id: 'mixed', nl: 'Gemengd', en: 'Mixed' },
  { id: 'ambitious', nl: 'Ambitieus', en: 'Ambitious' },
];

const FOCUSES: { id: PortfolioFocus; nl: string; en: string }[] = [
  { id: 'growth', nl: 'Growth', en: 'Growth' },
  { id: 'marketplace', nl: 'Marketplace', en: 'Marketplace' },
  { id: 'studio', nl: 'Studio', en: 'Studio' },
  { id: 'multi', nl: 'Meerdere diensten', en: 'Several services' },
];

function chipClass(active: boolean): string {
  return active
    ? 'min-h-11 rounded-full border border-emerald-700 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950'
    : 'min-h-11 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800';
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm text-slate-800">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isFinite(next)) return;
          onChange(Math.min(max, Math.max(min, Math.round(next))));
        }}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  );
}

export default function AffiliateGoalExperience({
  lang,
  showNetwork = true,
  suggestedFocus = null,
  suggestedNonce = 0,
}: {
  lang: 'nl' | 'en';
  showNetwork?: boolean;
  suggestedFocus?: PortfolioFocus | null;
  suggestedNonce?: number;
}) {
  const en = lang === 'en';
  const [goalEur, setGoalEur] = useState<number>(10000);
  const [custom, setCustom] = useState(false);
  const [level, setLevel] = useState<ScenarioLevel>(DEFAULT_SCENARIO_LEVEL);
  const [focus, setFocus] = useState<PortfolioFocus>(DEFAULT_PORTFOLIO_FOCUS);
  const [assumptions, setAssumptions] = useState<GoalAssumptions>(() =>
    assumptionsFor(DEFAULT_SCENARIO_LEVEL, DEFAULT_PORTFOLIO_FOCUS),
  );
  const [edited, setEdited] = useState(false);
  const [months, setMonths] = useState(0);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);

  const quote = useMemo(
    () => quoteIncomeGoal({ targetEur: goalEur, assumptions }),
    [goalEur, assumptions],
  );
  const comparison = useMemo(() => compareScenarioLevels(goalEur, focus), [goalEur, focus]);
  const ownOnly = useMemo(
    () =>
      quoteIncomeGoal({
        targetEur: goalEur,
        assumptions: { ...assumptions, includeNetwork: false },
      }),
    [goalEur, assumptions],
  );
  const withoutAddOns = useMemo(
    () =>
      quoteIncomeGoal({
        targetEur: goalEur,
        assumptions: assumptionsWithoutAddOns({ ...assumptions, includeNetwork: false }),
      }),
    [goalEur, assumptions],
  );
  const starterOnly = starterOnlyCustomersForGoal(goalEur);

  useEffect(() => {
    if (!suggestedFocus || suggestedNonce === 0) return;
    setLevel(DEFAULT_SCENARIO_LEVEL);
    setFocus(suggestedFocus);
    setEdited(false);
    setAssumptions(assumptionsFor(DEFAULT_SCENARIO_LEVEL, suggestedFocus));
  }, [suggestedFocus, suggestedNonce]);

  function selectLevel(next: ScenarioLevel) {
    setLevel(next);
    setEdited(false);
    setAssumptions((current) =>
      assumptionsFor(next, focus, {
        includeNetwork: current.includeNetwork,
        subAffiliates: current.subAffiliates,
        customersPerSub: current.customersPerSub,
      }),
    );
  }

  function selectFocus(next: PortfolioFocus) {
    setFocus(next);
    setEdited(false);
    setAssumptions((current) =>
      assumptionsFor(level, next, {
        includeNetwork: current.includeNetwork,
        subAffiliates: current.subAffiliates,
        customersPerSub: current.customersPerSub,
      }),
    );
  }

  function patch(partial: Partial<GoalAssumptions>) {
    setEdited(true);
    setAssumptions((current) => ({ ...current, ...partial }));
  }

  const growthWeights = [
    assumptions.growthMixBps.starter,
    assumptions.growthMixBps.pro,
    assumptions.growthMixBps.business,
    assumptions.growthMixBps.enterprise,
  ];
  const studioWeights = [
    assumptions.studioMixBps.creator,
    assumptions.studioMixBps.pro,
    assumptions.studioMixBps.studio,
  ];
  const marketWeights = [
    assumptions.marketplaceMixBps.basic,
    assumptions.marketplaceMixBps.pro,
    assumptions.marketplaceMixBps.premium,
  ];
  const showGrowth = focus === 'growth' || focus === 'multi';
  const showStudio = focus === 'studio' || focus === 'multi';
  const showMarket = focus === 'marketplace' || focus === 'multi';
  const perMonth = months > 0 ? Math.ceil(quote.ownCustomers / months) : 0;
  const years = months / 12;

  const lines: { label: string; count: number; cents: number }[] = [
    { label: 'Growth Starter', count: quote.counts.growthStarter, cents: quote.rates.growthDirect.starter },
    { label: 'Growth Pro', count: quote.counts.growthPro, cents: quote.rates.growthDirect.pro },
    { label: 'Growth Business', count: quote.counts.growthBusiness, cents: quote.rates.growthDirect.business },
    { label: 'Growth Enterprise', count: quote.counts.growthEnterprise, cents: quote.rates.growthDirect.enterprise },
    { label: 'Studio Creator', count: quote.counts.studioCreator, cents: quote.rates.studioDirect.creator },
    { label: 'Studio Pro', count: quote.counts.studioPro, cents: quote.rates.studioDirect.pro },
    { label: 'Studio', count: quote.counts.studioStudio, cents: quote.rates.studioDirect.studio },
    {
      label: en ? 'Studio top-up, 1000 HC' : 'Studio-tegoed 1000 HC',
      count: quote.counts.studioTopUps,
      cents: quote.rates.studioTopUpCents,
    },
    { label: 'Marketplace Basic', count: quote.counts.marketplaceBasic, cents: quote.rates.marketplaceDirect.basic },
    { label: 'Marketplace Pro', count: quote.counts.marketplacePro, cents: quote.rates.marketplaceDirect.pro },
    { label: 'Marketplace Premium', count: quote.counts.marketplacePremium, cents: quote.rates.marketplaceDirect.premium },
    {
      label: en ? 'Marketplace orders of €100' : 'Marketplace-orders van €100',
      count: quote.counts.orders,
      cents: quote.rates.orderCents,
    },
    {
      label: en ? 'Deliveries at €10 delivery cost' : 'Bezorgingen bij €10 bezorgkosten',
      count: quote.counts.deliveries,
      cents: quote.rates.deliveryCents,
    },
  ];

  return (
    <div id="portefeuille-rekenvoorbeeld" className="space-y-5">
      <p className="text-sm font-semibold text-emerald-900">
        {en ? 'Start small. Think big.' : 'Bouw klein. Denk groot.'}
      </p>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {en ? 'One possible ambition' : 'Een mogelijke ambitie'}
        </p>
        <ol className="mt-2 grid gap-2 sm:grid-cols-4">
          {[
            { k: 'START', nl: 'eerste klanten', en: 'first customers' },
            { k: 'BUILD', nl: 'richting €2.000 per maand', en: 'toward €2,000 a month' },
            { k: 'SCALE', nl: 'richting €5.000–€10.000 per maand', en: 'toward €5,000–€10,000 a month' },
            { k: 'EXPAND', nl: 'richting €20.000+ per maand', en: 'toward €20,000+ a month' },
          ].map((step) => (
            <li key={step.k} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-semibold text-emerald-800">{step.k}</p>
              <p className="mt-1 text-sm text-slate-800">{en ? step.en : step.nl}</p>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {en
            ? 'How fast you grow depends on how many customers you build, which services they use, and how long they stay active.'
            : 'Hoe snel je groeit hangt af van hoeveel klanten je opbouwt, welke diensten zij gebruiken en hoe lang zij actief blijven.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GOAL_COPY.map((goal) => {
          const selected = !custom && goalEur === goal.eur;
          return (
            <button
              key={goal.eur}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setCustom(false);
                setGoalEur(goal.eur);
              }}
              className={`rounded-2xl border p-3 text-left ${selected ? 'border-emerald-700 bg-emerald-50' : 'border-slate-200 bg-white'}`}
            >
              <p className="text-base font-semibold text-slate-900">
                {eur(goal.eur * 100, en, 0)}
                <span className="block text-xs font-medium text-slate-600">{en ? 'a month' : 'per maand'}</span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">{en ? goal.en : goal.nl}</p>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => setCustom(true)}
          className={chipClass(custom)}
        >
          {en ? 'Custom goal' : 'Eigen doel'}
        </button>
        {custom ? (
          <NumberField
            label={en ? 'Goal in euros a month' : 'Doel in euro per maand'}
            value={goalEur}
            min={1}
            max={100000}
            onChange={setGoalEur}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={en ? 'Example portfolio' : 'Voorbeeldportefeuille'}>
        {LEVELS.map((item) => (
          <button key={item.id} type="button" aria-pressed={level === item.id} className={chipClass(level === item.id)} onClick={() => selectLevel(item.id)}>
            {en ? item.en : item.nl}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={en ? 'Services in the example' : 'Diensten in het voorbeeld'}>
        {FOCUSES.map((item) => (
          <button key={item.id} type="button" aria-pressed={focus === item.id} className={chipClass(focus === item.id)} onClick={() => selectFocus(item.id)}>
            {en ? item.en : item.nl}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">
          {en ? 'Chosen goal, not a forecast' : 'Gekozen doel, geen voorspelling'}
        </p>
        <p className="mt-1 text-sm text-slate-700">
          {level === 'conservative'
            ? en
              ? 'Conservative example, mainly lower commissions and limited cross-sell. This is not the ceiling.'
              : 'Voorzichtig rekenvoorbeeld, vooral lagere commissies en beperkte cross-sell. Dit is niet het plafond.'
            : level === 'ambitious'
              ? en
                ? 'Ambitious example of a commercially stronger portfolio. Not a prediction.'
                : 'Ambitieus rekenvoorbeeld van een commercieel sterkere portefeuille. Geen voorspelling.'
              : en
                ? 'Mixed example with a chosen product mix. Not a measured distribution of real customers.'
                : 'Gemengd rekenvoorbeeld met een gekozen productmix. Geen gemeten verdeling van echte klanten.'}
        </p>
        <dl className="mt-3 space-y-1 text-sm text-slate-700">
          {showGrowth ? (
            <div>
              <dt className="font-medium text-slate-900">Growth</dt>
              <dd>
                {pct(percentLabel(assumptions.growthMixBps.starter, growthWeights), en)} Starter,{' '}
                {pct(percentLabel(assumptions.growthMixBps.pro, growthWeights), en)} Pro,{' '}
                {pct(percentLabel(assumptions.growthMixBps.business, growthWeights), en)} Business,{' '}
                {pct(percentLabel(assumptions.growthMixBps.enterprise, growthWeights), en)} Enterprise
              </dd>
            </div>
          ) : null}
          {showStudio ? (
            <div>
              <dt className="font-medium text-slate-900">Studio</dt>
              <dd>
                {focus === 'studio'
                  ? en
                    ? 'Every customer in this example uses Studio: '
                    : 'Elke klant in dit voorbeeld gebruikt Studio: '
                  : en
                    ? `Cross-sell ${pct(assumptions.studioCrossSellBps / 100, en)}: `
                    : `Cross-sell ${pct(assumptions.studioCrossSellBps / 100, en)}: `}
                {pct(percentLabel(assumptions.studioMixBps.creator, studioWeights), en)} Creator,{' '}
                {pct(percentLabel(assumptions.studioMixBps.pro, studioWeights), en)} Pro,{' '}
                {pct(percentLabel(assumptions.studioMixBps.studio, studioWeights), en)} Studio.
                {assumptions.studioTopUpBps > 0
                  ? en
                    ? ` ${pct(assumptions.studioTopUpBps / 100, en)} of those Studio customers buy one 1000 HC top-up in this example month.`
                    : ` ${pct(assumptions.studioTopUpBps / 100, en)} van die Studio-klanten koopt in deze voorbeeldmaand één tegoed van 1000 HC.`
                  : null}
              </dd>
            </div>
          ) : null}
          {showMarket ? (
            <div>
              <dt className="font-medium text-slate-900">Marketplace</dt>
              <dd>
                {focus === 'marketplace'
                  ? en
                    ? 'Every customer in this example has a business subscription: '
                    : 'Elke klant in dit voorbeeld heeft een bedrijfsabonnement: '
                  : en
                    ? `Business subscription on ${pct(assumptions.marketplacePlanBps / 100, en)} of the same customers: `
                    : `Bedrijfsabonnement bij ${pct(assumptions.marketplacePlanBps / 100, en)} van dezelfde klanten: `}
                {pct(percentLabel(assumptions.marketplaceMixBps.basic, marketWeights), en)} Basic,{' '}
                {pct(percentLabel(assumptions.marketplaceMixBps.pro, marketWeights), en)} Pro,{' '}
                {pct(percentLabel(assumptions.marketplaceMixBps.premium, marketWeights), en)} Premium.
                {en
                  ? ` ${assumptions.ordersPer100Customers} qualifying private orders of €100 per 100 customers.`
                  : ` ${assumptions.ordersPer100Customers} kwalificerende particuliere orders van €100 per 100 klanten.`}
                {assumptions.deliveriesPer100Customers > 0
                  ? en
                    ? ` ${assumptions.deliveriesPer100Customers} deliveries at €10 delivery cost per 100 customers.`
                    : ` ${assumptions.deliveriesPer100Customers} bezorgingen bij €10 bezorgkosten per 100 klanten.`
                  : en
                    ? ' No delivery in this example.'
                    : ' Geen bezorging in dit voorbeeld.'}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="font-medium text-slate-900">{en ? 'Network' : 'Netwerk'}</dt>
            <dd>
              {assumptions.includeNetwork && showNetwork
                ? en
                  ? 'Included separately, only the MAIN share.'
                  : 'Apart meegenomen, alleen het MAIN-aandeel.'
                : en
                  ? 'Not included.'
                  : 'Niet meegenomen.'}
            </dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {en ? 'Own portfolio' : 'Eigen portefeuille'}
          </p>
          {quote.reachable ? (
            <>
              <p className="mt-1 text-sm text-slate-800">
                {en
                  ? `${quote.ownCustomers.toLocaleString('en-GB')} active customers in this example.`
                  : `${quote.ownCustomers.toLocaleString('nl-NL')} actieve klanten in dit voorbeeld.`}
              </p>
              <p className="mt-1 text-sm text-slate-800">
                {en
                  ? `Example commission ${eur(quote.ownCents, en)} a month. Goal ${eur(quote.targetCents, en)}.`
                  : `Voorbeeldcommissie ${eur(quote.ownCents, en)} per maand. Doel ${eur(quote.targetCents, en)}.`}
              </p>
              {quote.ownCustomers > 0 ? (
                <p className="mt-1 text-sm text-slate-700">
                  {en
                    ? `About ${eur(Math.round(quote.weightedCentsPerCustomer), en)} commission per active customer in this chosen mix.`
                    : `Ongeveer ${eur(Math.round(quote.weightedCentsPerCustomer), en)} commissie per actieve klant in deze gekozen mix.`}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-800">
              {en
                ? 'These assumptions do not create commission. Adjust the mix.'
                : 'Met deze aannames ontstaat geen commissie. Pas de mix aan.'}
            </p>
          )}
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {lines
              .filter((line) => line.count > 0)
              .map((line) => (
                <li key={line.label}>
                  {line.count.toLocaleString(en ? 'en-GB' : 'nl-NL')} × {eur(line.cents, en)} {line.label}
                </li>
              ))}
          </ul>
        </div>

        {showNetwork && assumptions.includeNetwork ? (
          <div className="mt-3 rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {en ? 'Partner network' : 'Partnernetwerk'}
            </p>
            {quote.networkApplies ? (
              <p className="mt-1 text-sm text-slate-800">
                {en
                  ? `${assumptions.subAffiliates} direct SUBs × ${assumptions.customersPerSub} customers = ${quote.networkCustomers.toLocaleString('en-GB')} SUB customers. MAIN share in this example: ${eur(quote.networkCents, en)}. This is separate from your own portfolio.`
                  : `${assumptions.subAffiliates} directe SUB’s × ${assumptions.customersPerSub} klanten = ${quote.networkCustomers.toLocaleString('nl-NL')} SUB-klanten. MAIN-aandeel in dit voorbeeld: ${eur(quote.networkCents, en)}. Dit staat los van je eigen portefeuille.`}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-800">
                {en
                  ? 'This Studio view does not add a MAIN layer. The partner network adds nothing here.'
                  : 'Studio rekent in dit overzicht geen extra MAIN-laag. Het partnernetwerk voegt hier niets toe.'}
              </p>
            )}
            <p className="mt-2 text-sm text-slate-600">
              {en
                ? 'Recruiting partners is not required to start with your own customers.'
                : 'Werven is niet nodig om met je eigen klanten te beginnen.'}
            </p>
            {quote.networkApplies && quote.reachable ? (
              <p className="mt-2 text-sm font-medium text-slate-900">
                {en
                  ? `Own portfolio and partner network together in this example: ${eur(quote.calculatedCents, en)}.`
                  : `Eigen portefeuille en partnernetwerk samen in dit voorbeeld: ${eur(quote.calculatedCents, en)}.`}
              </p>
            ) : null}
          </div>
        ) : null}

        {quote.reachable && quote.deltaCents >= 0 ? (
          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            {en
              ? `The example lands ${eur(quote.deltaCents, en)} above the goal because customers are counted whole. Your result depends on what you build and what your customers actually use.`
              : `Het voorbeeld ligt ${eur(quote.deltaCents, en)} boven het doel, omdat klanten helemaal meetellen. Je resultaat hangt af van wat jij opbouwt en wat jouw klanten daadwerkelijk gebruiken.`}
          </p>
        ) : null}

        {withoutAddOns.ownCustomers !== ownOnly.ownCustomers ? (
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            {en
              ? `Without the chosen cross-sell and extra activity: ${withoutAddOns.ownCustomers.toLocaleString('en-GB')} customers. With it: ${ownOnly.ownCustomers.toLocaleString('en-GB')}. Earning more does not only mean finding more people. An existing customer can use more than one HomeCheff service. That does not happen by itself.`
              : `Zonder de gekozen cross-sell en extra activiteit: ${withoutAddOns.ownCustomers.toLocaleString('nl-NL')} klanten. Mét: ${ownOnly.ownCustomers.toLocaleString('nl-NL')}. Meer verdienen hoeft niet alleen te betekenen dat je steeds meer mensen moet vinden. Een bestaande klant kan meerdere HomeCheff-diensten gebruiken. Dat gebeurt niet vanzelf.`}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            {en
              ? 'Earning more does not only mean finding more people. An existing customer can use more than one HomeCheff service. That does not happen by itself.'
              : 'Meer verdienen hoeft niet alleen te betekenen dat je steeds meer mensen moet vinden. Een bestaande klant kan meerdere HomeCheff-diensten gebruiken. Dat gebeurt niet vanzelf.'}
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">
          {en ? 'Same goal, three examples' : 'Hetzelfde doel, drie voorbeelden'}
        </p>
        <ul className="mt-2 space-y-2">
          {LEVELS.map((item) => {
            const row = comparison[item.id];
            return (
              <li key={item.id} className="flex items-baseline justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm">
                <span className="text-slate-700">{en ? item.en : item.nl}</span>
                <span className="font-semibold text-slate-900">
                  {row.reachable
                    ? en
                      ? `${row.ownCustomers.toLocaleString('en-GB')} customers`
                      : `${row.ownCustomers.toLocaleString('nl-NL')} klanten`
                    : '—'}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          {edited
            ? en
              ? 'This comparison uses the example mixes, without the partner network. Your edited assumptions are in the result above.'
              : 'Deze vergelijking gebruikt de voorbeeldmixen, zonder partnernetwerk. Jouw aangepaste aannames staan in het resultaat hierboven.'
            : en
              ? 'Without the partner network. These are examples, not typical results.'
              : 'Zonder partnernetwerk. Dit zijn voorbeelden, geen typische resultaten.'}
        </p>
        <p className="mt-2 text-sm text-slate-700">
          {en
            ? `If every customer used only Growth Starter: ${starterOnly.toLocaleString('en-GB')} customers × ${eur(quote.rates.growthDirect.starter, en)}. That comparison is available. It is not the ceiling.`
            : `Als al je klanten alleen Growth Starter gebruiken: ${starterOnly.toLocaleString('nl-NL')} klanten × ${eur(quote.rates.growthDirect.starter, en)}. Die vergelijking blijft beschikbaar. Het is niet het plafond.`}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-slate-900"
          aria-expanded={assumptionsOpen}
          onClick={() => setAssumptionsOpen((open) => !open)}
        >
          <span>{en ? 'Edit the assumptions' : 'Pas de aannames aan'}</span>
          <span className="text-xs font-medium text-slate-500" aria-hidden>
            {assumptionsOpen ? '–' : '+'}
          </span>
        </button>
        {assumptionsOpen ? (
          <div className="space-y-4 border-t border-slate-100 px-4 py-4">
            <p className="text-sm text-slate-600">
              {en
                ? 'The percentages are a chosen example mix. They are not a measured customer distribution.'
                : 'De percentages zijn een gekozen voorbeeldmix. Het is geen gemeten klantenverdeling.'}
            </p>
            {showGrowth ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="Growth Starter %" value={assumptions.growthMixBps.starter / 100} min={0} max={100} onChange={(value) => patch({ growthMixBps: { ...assumptions.growthMixBps, starter: value * 100 } })} />
                <NumberField label="Growth Pro %" value={assumptions.growthMixBps.pro / 100} min={0} max={100} onChange={(value) => patch({ growthMixBps: { ...assumptions.growthMixBps, pro: value * 100 } })} />
                <NumberField label="Growth Business %" value={assumptions.growthMixBps.business / 100} min={0} max={100} onChange={(value) => patch({ growthMixBps: { ...assumptions.growthMixBps, business: value * 100 } })} />
                <NumberField label="Growth Enterprise %" value={assumptions.growthMixBps.enterprise / 100} min={0} max={100} onChange={(value) => patch({ growthMixBps: { ...assumptions.growthMixBps, enterprise: value * 100 } })} />
              </div>
            ) : null}
            {showStudio && focus === 'multi' ? (
              <NumberField
                label={en ? 'Studio cross-sell %' : 'Studio cross-sell %'}
                value={assumptions.studioCrossSellBps / 100}
                min={0}
                max={100}
                onChange={(value) => patch({ studioCrossSellBps: value * 100 })}
              />
            ) : null}
            {showStudio ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="Studio Creator %" value={assumptions.studioMixBps.creator / 100} min={0} max={100} onChange={(value) => patch({ studioMixBps: { ...assumptions.studioMixBps, creator: value * 100 } })} />
                <NumberField label="Studio Pro %" value={assumptions.studioMixBps.pro / 100} min={0} max={100} onChange={(value) => patch({ studioMixBps: { ...assumptions.studioMixBps, pro: value * 100 } })} />
                <NumberField label="Studio %" value={assumptions.studioMixBps.studio / 100} min={0} max={100} onChange={(value) => patch({ studioMixBps: { ...assumptions.studioMixBps, studio: value * 100 } })} />
                <NumberField label={en ? 'Top-up % of Studio customers' : 'Tegoed % van Studio-klanten'} value={assumptions.studioTopUpBps / 100} min={0} max={100} onChange={(value) => patch({ studioTopUpBps: value * 100 })} />
              </div>
            ) : null}
            {showMarket && focus === 'multi' ? (
              <NumberField
                label={en ? 'Marketplace business subscription %' : 'Marketplace-bedrijfsabonnement %'}
                value={assumptions.marketplacePlanBps / 100}
                min={0}
                max={100}
                onChange={(value) => patch({ marketplacePlanBps: value * 100 })}
              />
            ) : null}
            {showMarket ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="Marketplace Basic %" value={assumptions.marketplaceMixBps.basic / 100} min={0} max={100} onChange={(value) => patch({ marketplaceMixBps: { ...assumptions.marketplaceMixBps, basic: value * 100 } })} />
                <NumberField label="Marketplace Pro %" value={assumptions.marketplaceMixBps.pro / 100} min={0} max={100} onChange={(value) => patch({ marketplaceMixBps: { ...assumptions.marketplaceMixBps, pro: value * 100 } })} />
                <NumberField label="Marketplace Premium %" value={assumptions.marketplaceMixBps.premium / 100} min={0} max={100} onChange={(value) => patch({ marketplaceMixBps: { ...assumptions.marketplaceMixBps, premium: value * 100 } })} />
                <NumberField label={en ? 'Orders per 100 customers' : 'Orders per 100 klanten'} value={assumptions.ordersPer100Customers} min={0} max={500} onChange={(value) => patch({ ordersPer100Customers: value })} />
                <NumberField label={en ? 'Deliveries per 100 customers' : 'Bezorgingen per 100 klanten'} value={assumptions.deliveriesPer100Customers} min={0} max={500} onChange={(value) => patch({ deliveriesPer100Customers: value })} />
              </div>
            ) : null}
            <label className="block text-sm text-slate-800">
              {en ? 'Optional horizon' : 'Optionele horizon'}
              <select
                value={months}
                onChange={(event) => setMonths(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value={0}>{en ? 'No time frame' : 'Geen termijn'}</option>
                <option value={12}>{en ? 'Within 1 year' : 'Binnen 1 jaar'}</option>
                <option value={24}>{en ? 'Within 2 years' : 'Binnen 2 jaar'}</option>
                <option value={36}>{en ? 'Within 3 years' : 'Binnen 3 jaar'}</option>
                <option value={60}>{en ? 'Within 5 years' : 'Binnen 5 jaar'}</option>
              </select>
            </label>
            {months > 0 && quote.ownCustomers > 0 ? (
              <p className="text-sm leading-relaxed text-slate-700">
                {en
                  ? `I want to build toward ${eur(goalEur * 100, en, 0)} a month within ${years} ${years === 1 ? 'year' : 'years'}. Under these assumptions, if customers stay qualifying, that is about ${perMonth.toLocaleString('en-GB')} new customers a month. That is a pace for building the portfolio, not an outcome tied to that date.`
                  : `Ik wil binnen ${years} jaar bouwen richting ${eur(goalEur * 100, en, 0)} per maand. Onder deze aannames, als de klanten kwalificerend blijven, zijn dat ongeveer ${perMonth.toLocaleString('nl-NL')} nieuwe klanten per maand. Dat is een tempo om de portefeuille op te bouwen, geen uitkomst op die datum.`}
              </p>
            ) : null}
            {showNetwork ? (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <input
                    type="checkbox"
                    checked={assumptions.includeNetwork}
                    onChange={(event) => patch({ includeNetwork: event.target.checked })}
                  />
                  {en ? 'Include my partner network' : 'Neem mijn partnernetwerk mee'}
                </label>
                {assumptions.includeNetwork ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField label={en ? 'Direct SUBs' : 'Directe SUB’s'} value={assumptions.subAffiliates} min={0} max={200} onChange={(value) => patch({ subAffiliates: value })} />
                    <NumberField label={en ? 'Active customers per SUB' : 'Actieve klanten per SUB'} value={assumptions.customersPerSub} min={0} max={500} onChange={(value) => patch({ customersPerSub: value })} />
                  </div>
                ) : null}
                <p className="text-xs leading-relaxed text-slate-600">
                  {en
                    ? 'Off by default. Only the MAIN share on Growth, or on Marketplace business subscriptions when that is the example. Studio orders and deliveries are not in the network example.'
                    : 'Standaard uit. Alleen het MAIN-aandeel op Growth, of op Marketplace-bedrijfsabonnementen als dat het voorbeeld is. Studio, orders en bezorging zitten niet in het netwerkvoorbeeld.'}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
