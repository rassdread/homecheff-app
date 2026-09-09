'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

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
};

function eur(c: number) {
  return `€${(c / 100).toFixed(2)}`;
}

function productLabel(
  key: string,
  tOr: (k: string, en: string, nl: string) => string,
): string {
  const map: Record<string, [string, string, string]> = {
    MARKETPLACE: [
      'affiliateDashboard.ecosystem.product.marketplace',
      'Marketplace',
      'Marketplace',
    ],
    GROWTH: ['affiliateDashboard.ecosystem.product.growth', 'Growth', 'Growth'],
    STUDIO: ['affiliateDashboard.ecosystem.product.studio', 'Studio', 'Studio'],
    DELIVERY: [
      'affiliateDashboard.ecosystem.product.delivery',
      'Delivery',
      'Bezorgen',
    ],
  };
  const row = map[key.toUpperCase()];
  if (!row) return key.replace(/_/g, ' ');
  return tOr(row[0], row[1], row[2]);
}

type LoadState = 'loading' | 'success' | 'empty' | 'error';

/** Ecosystem ledger panel inside HomeCheff affiliate shell. */
export function HomecheffEcosystemAffiliatePanel() {
  const { tOr } = useTranslation();
  const [data, setData] = useState<Dash | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      const res = await fetch('/api/affiliate/ecosystem-dashboard?source=marketplace', {
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
        k.totalEarnedCents > 0 ||
        k.availableCents > 0 ||
        k.pendingCents > 0 ||
        k.paidCents > 0;
      setData(json);
      setState(hasActivity ? 'success' : 'empty');
    } catch {
      setData(null);
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === 'loading') {
    return (
      <section
        className="mt-6 rounded-xl border border-slate-200 bg-white p-4"
        aria-busy="true"
        aria-label={tOr(
          'affiliateDashboard.ecosystem.loading',
          'Loading ecosystem earnings…',
          'Ecosysteem-inkomsten laden…',
        )}
      >
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

  if (state === 'empty' || !data?.kpis) {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          {tOr(
            'affiliateDashboard.ecosystem.title',
            'Affiliate earnings',
            'Affiliate-verdiensten',
          )}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {tOr(
            'affiliateDashboard.ecosystem.empty',
            'No affiliate activity yet. Share HomeCheff to get started.',
            'Nog geen affiliate-activiteit. Deel HomeCheff om te beginnen.',
          )}
        </p>
        <Link
          href="/werken-bij"
          className="mt-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
        >
          {tOr(
            'affiliateDashboard.ecosystem.emptyCta',
            'See what you can promote',
            'Bekijk wat je kunt promoten',
          )}
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        {tOr(
          'affiliateDashboard.ecosystem.title',
          'Affiliate earnings',
          'Affiliate-verdiensten',
        )}
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        {tOr(
          'affiliateDashboard.ecosystem.blurb',
          'One network: main affiliate (10%) and partner (40%) of eligible HomeCheff platform revenue — together max 50%. No guaranteed income.',
          'Eén netwerk: hoofd-affiliate (10%) en partner (40%) van eligible HomeCheff-platformomzet — samen max 50%. Geen garantie op inkomsten.',
        )}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [
            tOr('affiliateDashboard.earnings.total', 'Total earned', 'Totaal verdiend'),
            data.kpis.totalEarnedCents,
          ],
          [
            tOr('affiliateDashboard.earnings.pending', 'Pending', 'In behandeling'),
            data.kpis.pendingCents,
          ],
          [
            tOr('affiliateDashboard.earnings.available', 'Available', 'Beschikbaar'),
            data.kpis.availableCents,
          ],
          [
            tOr('affiliateDashboard.earnings.paid', 'Paid out', 'Uitbetaald'),
            data.kpis.paidCents,
          ],
        ].map(([l, c]) => (
          <div key={l as string} className="rounded-lg bg-slate-50 p-2 min-w-0">
            <p className="text-[11px] text-slate-500 break-words">{l as string}</p>
            <p className="text-sm font-semibold tabular-nums">{eur(c as number)}</p>
          </div>
        ))}
      </div>
      {Object.keys(data.productBreakdownCents ?? {}).length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs">
          {Object.entries(data.productBreakdownCents ?? {}).map(([p, c]) => (
            <li key={p} className="flex justify-between gap-2 min-w-0">
              <span className="truncate">{productLabel(p, tOr)}</span>
              <span className="shrink-0 tabular-nums">{eur(c)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs">
        <Link
          href="/werken-bij/hoe-werkt-het"
          className="font-medium text-emerald-800 underline-offset-2 hover:underline"
        >
          {tOr(
            'affiliateDashboard.ecosystem.howItWorks',
            'How does affiliate earning work on HomeCheff?',
            'Hoe werkt affiliate verdienen op HomeCheff?',
          )}
        </Link>
      </p>
    </section>
  );
}
