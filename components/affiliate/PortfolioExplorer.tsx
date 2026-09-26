'use client';

import { useMemo, useState } from 'react';
import {
  JOURNEY_STUDIO_CROSS_SELL_RATE,
  SCALE_TARGET_EUR,
  growthStarterCustomersForMonthlyTarget,
  quotePortfolio,
  type PortfolioPresetId,
} from '@/lib/affiliate/portfolio-scenario';

function eur(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

const PRESETS: { id: PortfolioPresetId; nl: string; en: string }[] = [
  { id: 'alongside', nl: 'Rustig naast je werk', en: 'Alongside work' },
  { id: 'active', nl: 'Actief opbouwen', en: 'Building actively' },
  { id: 'growing', nl: 'Groeiende portefeuille', en: 'Growing portfolio' },
  { id: 'organisation', nl: 'Grotere affiliateorganisatie', en: 'Larger affiliate organisation' },
];

export default function PortfolioExplorer({
  lang,
  showNetwork = true,
}: {
  lang: 'nl' | 'en';
  showNetwork?: boolean;
}) {
  const en = lang === 'en';
  const [months, setMonths] = useState(12);
  const [perMonth, setPerMonth] = useState(2);
  const [retention, setRetention] = useState(1);
  const [studio, setStudio] = useState(0);
  const [orders, setOrders] = useState(0);
  const [subs, setSubs] = useState(0);
  const [subPerMonth, setSubPerMonth] = useState(0);

  const quote = useMemo(
    () =>
      quotePortfolio({
        months,
        newGrowthStarterPerMonth: perMonth,
        retention,
        studioCrossSellRate: studio,
        marketplaceOrdersPerActiveCustomer: orders,
        subAffiliates: showNetwork ? subs : 0,
        subNewGrowthStarterPerMonth: showNetwork ? subPerMonth : 0,
      }),
    [months, perMonth, retention, studio, orders, subs, subPerMonth, showNetwork],
  );

  function applyPreset(id: PortfolioPresetId) {
    if (id === 'alongside') {
      setMonths(12);
      setPerMonth(1);
      setRetention(1);
      setStudio(0);
      setOrders(0);
      setSubs(0);
      setSubPerMonth(0);
    } else if (id === 'active') {
      setMonths(12);
      setPerMonth(2);
      setRetention(1);
      setStudio(JOURNEY_STUDIO_CROSS_SELL_RATE);
      setOrders(0);
      setSubs(0);
      setSubPerMonth(0);
    } else if (id === 'growing') {
      setMonths(24);
      setPerMonth(8);
      setRetention(1);
      setStudio(JOURNEY_STUDIO_CROSS_SELL_RATE);
      setOrders(0);
      setSubs(0);
      setSubPerMonth(0);
    } else {
      setMonths(36);
      setPerMonth(8);
      setRetention(1);
      setStudio(JOURNEY_STUDIO_CROSS_SELL_RATE);
      setOrders(0);
      setSubs(10);
      setSubPerMonth(4);
    }
  }

  return (
    <div id="portefeuille-rekenvoorbeeld" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap gap-2">
        {PRESETS.filter((preset) => showNetwork || preset.id !== 'organisation').map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800"
          >
            {en ? preset.en : preset.nl}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          {en ? 'Period' : 'Periode'}
          <select
            value={months}
            onChange={(event) => setMonths(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value={6}>{en ? '6 months' : '6 maanden'}</option>
            <option value={12}>{en ? '1 year' : '1 jaar'}</option>
            <option value={24}>{en ? '2 years' : '2 jaar'}</option>
            <option value={36}>{en ? '3 years' : '3 jaar'}</option>
            <option value={60}>{en ? '5 years' : '5 jaar'}</option>
          </select>
        </label>
        <label className="text-sm">
          {en ? 'New Growth Starter customers / month' : 'Nieuwe Growth Starter-klanten / maand'}
          <input
            type="number"
            min={0}
            max={500}
            value={perMonth}
            onChange={(event) => setPerMonth(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          {en ? 'Retention in this scenario' : 'Behoud in dit scenario'}
          <select
            value={retention}
            onChange={(event) => setRetention(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value={1}>{en ? 'All stay qualifying' : 'Iedereen blijft kwalificerend'}</option>
            <option value={0.8}>80%</option>
            <option value={0.5}>50%</option>
          </select>
        </label>
        <label className="text-sm">
          {en ? 'Also on Studio Creator' : 'Ook op Studio Creator'}
          <select
            value={studio}
            onChange={(event) => setStudio(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value={0}>{en ? 'None' : 'Geen'}</option>
            <option value={JOURNEY_STUDIO_CROSS_SELL_RATE}>25%</option>
          </select>
        </label>
        <label className="text-sm">
          {en ? 'Private Marketplace orders / active customer this month' : 'Particuliere Marketplace-orders / actieve klant deze maand'}
          <input
            type="number"
            min={0}
            max={20}
            value={orders}
            onChange={(event) => setOrders(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        {showNetwork ? (
          <>
            <label className="text-sm">
              {en ? 'Invited sub-affiliates' : 'Uitgenodigde sub-affiliates'}
              <input
                type="number"
                min={0}
                max={200}
                value={subs}
                onChange={(event) => setSubs(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              {en ? 'New Starter customers / sub / month' : 'Nieuwe Starter-klanten / sub / maand'}
              <input
                type="number"
                min={0}
                max={100}
                value={subPerMonth}
                onChange={(event) => setSubPerMonth(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </>
        ) : null}
      </div>
      <dl className="mt-4 space-y-1 text-sm text-slate-800">
        <div className="flex justify-between gap-3">
          <dt>{en ? 'Active Growth customers' : 'Actieve Growth-klanten'}</dt>
          <dd>{quote.activeGrowth}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>{en ? 'Own customers' : 'Eigen klanten'}</dt>
          <dd>{eur(quote.ownCents)}</dd>
        </div>
        {showNetwork ? <div className="flex justify-between gap-3">
          <dt>{en ? 'Network' : 'Netwerk'}</dt>
          <dd>{eur(quote.networkCents)}</dd>
        </div> : null}
        <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 font-semibold">
          <dt>{en ? 'Scenario total / month' : 'Scenario totaal / maand'}</dt>
          <dd>{eur(quote.totalCents)}</dd>
        </div>
      </dl>
      <ul className="mt-4 space-y-1 text-xs leading-relaxed text-slate-600">
        {SCALE_TARGET_EUR.map((target) => {
          const need = growthStarterCustomersForMonthlyTarget(target);
          return (
            <li key={target}>
              {en
                ? `About €${target.toLocaleString('en-GB')} / month from Growth Starter alone needs ${need.customers} active qualifying customers at ${eur(need.perCustomerCents)} each.`
                : `Ongeveer €${target.toLocaleString('nl-NL')} / maand uit alleen Growth Starter vraagt ${need.customers} actieve kwalificerende klanten à ${eur(need.perCustomerCents)}.`}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
