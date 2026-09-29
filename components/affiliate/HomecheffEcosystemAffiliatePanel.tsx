'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

type PlatformRow = {
  product: string;
  pendingCents: number;
  availableCents: number;
  paidCents: number;
  reversedCents: number;
  generatedCents: number;
  externalMirrorCents: number;
  uniqueCustomers: number;
  activities: {
    key: string;
    revenueEventType: string;
    planKey: string | null;
    generatedCents: number;
    eventCount: number;
    uniqueCustomers: number;
  }[];
};

type Dash = {
  ok?: boolean;
  kpis?: {
    pendingCents: number;
    availableCents: number;
    paidCents: number;
    reversedCents: number;
    totalEarnedCents: number;
  };
  productBreakdownCents?: Record<string, number>;
  performance?: {
    platforms: PlatformRow[];
    reconciliation: {
      pending: boolean;
      available: boolean;
      paid: boolean;
      generated: boolean;
    };
  };
};

function eur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

function productLabel(key: string, tOr: (k: string, en: string, nl: string) => string): string {
  const map: Record<string, [string, string, string]> = {
    MARKETPLACE: ['affiliateDashboard.ecosystem.product.marketplace', 'Marketplace', 'Marketplace'],
    GROWTH: ['affiliateDashboard.ecosystem.product.growth', 'Growth', 'Growth'],
    STUDIO: ['affiliateDashboard.ecosystem.product.studio', 'Studio', 'Studio'],
    DELIVERY: ['affiliateDashboard.ecosystem.product.delivery', 'Delivery', 'Bezorgen'],
    STUDIO_HC_PACK: ['affiliateDashboard.ecosystem.product.studioPack', 'Studio credit', 'Studio-tegoed'],
  };
  const row = map[key.toUpperCase()];
  if (!row) return key.replace(/_/g, ' ');
  return tOr(row[0], row[1], row[2]);
}

type LoadState = 'loading' | 'success' | 'empty' | 'error';
type Period = 'all' | 'month' | 'previous' | 'year';

function periodRange(period: Period): { from?: string; to?: string } {
  if (period === 'all') return {};
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 1);
    end.setHours(0, 0, 0, 0);
  } else if (period === 'previous') {
    start.setMonth(start.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(end.getFullYear() + 1, 0, 1);
    end.setHours(0, 0, 0, 0);
  }
  return { from: start.toISOString(), to: end.toISOString() };
}

/** Ecosystem ledger inside the central affiliate shell. */
export function HomecheffEcosystemAffiliatePanel({
  variant = 'summary',
}: {
  variant?: 'summary' | 'detail';
}) {
  const { tOr } = useTranslation();
  const [data, setData] = useState<Dash | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [period, setPeriod] = useState<Period>('all');
  const [openProduct, setOpenProduct] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      const range = periodRange(period);
      const params = new URLSearchParams({ source: 'marketplace' });
      if (range.from) params.set('from', range.from);
      if (range.to) params.set('to', range.to);
      const res = await fetch(`/api/affiliate/ecosystem-dashboard?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      if (!res.ok) {
        setData(null);
        setState('error');
        return;
      }
      const json = (await res.json()) as Dash;
      if (!json?.kpis) {
        setData(json);
        setState('empty');
        return;
      }
      const k = json.kpis;
      const hasActivity =
        k.totalEarnedCents > 0 || k.availableCents > 0 || k.pendingCents > 0 || k.paidCents > 0;
      setData(json);
      setState(hasActivity ? 'success' : 'empty');
    } catch {
      setData(null);
      setState('error');
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === 'loading') {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4" aria-busy="true">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  if (state === 'error') {
    return (
      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950">
        <p>
          {tOr(
            'affiliateDashboard.ecosystem.error',
            'Your earnings could not be loaded. Please try again.',
            'Je verdiensten konden niet worden geladen. Probeer opnieuw.',
          )}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 inline-flex min-h-[40px] items-center rounded-lg bg-amber-900 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800"
        >
          {tOr('affiliateDashboard.ecosystem.retry', 'Try again', 'Opnieuw proberen')}
        </button>
      </section>
    );
  }

  const kpis = data?.kpis;
  const platforms = data?.performance?.platforms ?? [];
  const reconciliation = data?.performance?.reconciliation;
  const reconciling =
    !reconciliation ||
    (reconciliation.pending && reconciliation.available && reconciliation.paid && reconciliation.generated);

  if ((state === 'empty' || !kpis) && variant === 'summary') {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          {tOr('affiliateDashboard.ecosystem.title', 'Affiliate earnings', 'Affiliate-verdiensten')}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {tOr(
            'affiliateDashboard.ecosystem.empty',
            'No affiliate activity yet. Share HomeCheff to get started.',
            'Nog geen affiliate-activiteit. Deel HomeCheff om te beginnen.',
          )}
        </p>
        <Link
          href="/affiliate/dashboard?section=verdienen"
          className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
        >
          {tOr('affiliateDashboard.ecosystem.emptyCta', 'See what you can promote', 'Bekijk wat je kunt promoten')}
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        {variant === 'detail'
          ? tOr('affiliate.verdiensten.title', 'Earnings', 'Verdiensten')
          : tOr('affiliateDashboard.ecosystem.title', 'Affiliate earnings', 'Affiliate-verdiensten')}
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        {variant === 'detail'
          ? tOr(
              'affiliate.verdiensten.intro',
              'Commission already generated by attributed activity. This is not the list of rates you can still earn.',
              'Commissie die toegeschreven activiteit al heeft opgeleverd. Dit is niet de lijst met tarieven die je nog kunt verdienen.',
            )
          : tOr(
              'affiliateDashboard.ecosystem.blurb',
              'Where a network split applies: SUB 40% and MAIN 10% of that product’s commission base, together the affiliate share. Not 50% of what the customer pays. No guaranteed income.',
              'Waar een netwerkverdeling geldt: SUB 40% en MAIN 10% van de commissiegrondslag van dat product, samen het affiliate-deel. Niet 50% van wat de klant betaalt. Geen gegarandeerd inkomen.',
            )}
      </p>
      {variant === 'detail' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ['all', 'All time', 'Alles'],
              ['month', 'This month', 'Deze maand'],
              ['previous', 'Previous month', 'Vorige maand'],
              ['year', 'This year', 'Dit jaar'],
            ] as const
          ).map(([id, en, nl]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPeriod(id)}
              className={`min-h-9 rounded-full px-3 text-xs font-semibold ${
                period === id ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'
              }`}
            >
              {tOr(`affiliate.verdiensten.period.${id}`, en, nl)}
            </button>
          ))}
        </div>
      ) : null}
      {kpis ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            [tOr('affiliateDashboard.earnings.total', 'Total earned', 'Totaal verdiend'), kpis.totalEarnedCents],
            [tOr('affiliateDashboard.earnings.pending', 'Pending', 'In behandeling'), kpis.pendingCents],
            [tOr('affiliateDashboard.earnings.available', 'Available', 'Beschikbaar'), kpis.availableCents],
            [tOr('affiliateDashboard.earnings.paid', 'Paid out', 'Uitbetaald'), kpis.paidCents],
          ].map(([label, cents]) => (
            <div key={label as string} className="rounded-lg bg-slate-50 p-2 min-w-0">
              <p className="text-[11px] text-slate-500 break-words">{label as string}</p>
              <p className="text-sm font-semibold tabular-nums">{eur(cents as number)}</p>
            </div>
          ))}
        </div>
      ) : null}
      {variant === 'detail' && !reconciling ? (
        <p className="mt-3 text-sm text-red-700">
          {tOr(
            'affiliate.verdiensten.reconMismatch',
            'Platform totals do not match the ecosystem total. Figures are shown as returned and are not adjusted.',
            'Platformtotalen komen niet overeen met het ecosysteemtotaal. De bedragen worden getoond zoals ze binnenkomen en worden niet aangepast.',
          )}
        </p>
      ) : null}
      {variant === 'detail' ? (
        <div className="mt-4 space-y-3">
          {(platforms.length > 0
            ? platforms
            : ['MARKETPLACE', 'GROWTH', 'STUDIO'].map((product) => ({
                product,
                pendingCents: 0,
                availableCents: 0,
                paidCents: 0,
                reversedCents: 0,
                generatedCents: data?.productBreakdownCents?.[product] ?? 0,
                externalMirrorCents: 0,
                uniqueCustomers: 0,
                activities: [],
              }))
          ).map((row) => (
            <article key={row.product} className="rounded-lg border border-slate-200 p-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setOpenProduct((current) => (current === row.product ? null : row.product))}
              >
                <span className="font-semibold text-slate-900">{productLabel(row.product, tOr)}</span>
                <span className="tabular-nums text-sm">{eur(row.generatedCents)}</span>
              </button>
              <p className="mt-1 text-xs text-slate-600">
                {tOr('affiliate.verdiensten.customers', 'Customers', 'Klanten')}: {row.uniqueCustomers}
                {' · '}
                {tOr('affiliateDashboard.earnings.pending', 'Pending', 'In behandeling')} {eur(row.pendingCents)}
                {' · '}
                {tOr('affiliateDashboard.earnings.available', 'Available', 'Beschikbaar')} {eur(row.availableCents)}
                {' · '}
                {tOr('affiliateDashboard.earnings.paid', 'Paid out', 'Uitbetaald')} {eur(row.paidCents)}
              </p>
              {row.generatedCents === 0 ? (
                <p className="mt-1 text-xs text-slate-500">
                  {tOr(
                    'affiliate.verdiensten.zero',
                    'No commission on this platform in this period.',
                    'Geen commissie op dit platform in deze periode.',
                  )}
                </p>
              ) : null}
              {openProduct === row.product && row.activities.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs">
                  {row.activities.map((activity) => (
                    <li key={activity.key} className="flex justify-between gap-2">
                      <span>
                        {activity.planKey ? `${activity.revenueEventType} · ${activity.planKey}` : activity.revenueEventType}
                        {' · '}
                        {activity.uniqueCustomers}{' '}
                        {tOr('affiliate.verdiensten.customers', 'Customers', 'Klanten')}
                      </span>
                      <span className="tabular-nums">{eur(activity.generatedCents)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {variant === 'summary' ? (
        <p className="mt-3 text-xs">
          <Link href="/affiliate/dashboard?section=verdiensten" className="font-medium text-emerald-800 underline-offset-2 hover:underline">
            {tOr('affiliate.verdiensten.open', 'View earnings', 'Bekijk verdiensten')}
          </Link>
        </p>
      ) : (
        <p className="mt-3 text-xs">
          <Link href="/werken-bij/hoe-werkt-het" className="font-medium text-emerald-800 underline-offset-2 hover:underline">
            {tOr(
              'affiliateDashboard.ecosystem.howItWorks',
              'How does affiliate earning work on HomeCheff?',
              'Hoe werkt affiliate verdienen op HomeCheff?',
            )}
          </Link>
        </p>
      )}
    </section>
  );
}
