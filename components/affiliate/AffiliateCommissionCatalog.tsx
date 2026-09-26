'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  POPULARITY_SORT_AVAILABLE,
  sortCatalog,
  type CatalogKind,
  type CatalogPlatform,
  type CatalogRow,
} from '@/lib/affiliate/commission-catalog';

type SortId = 'commission' | 'price' | 'recurring' | 'platform';

export default function AffiliateCommissionCatalog({
  rows,
  lang,
  showNetwork = true,
  showPromo = true,
}: {
  rows: CatalogRow[];
  lang: 'nl' | 'en';
  showNetwork?: boolean;
  showPromo?: boolean;
}) {
  const en = lang === 'en';
  const [platform, setPlatform] = useState<CatalogPlatform | 'all'>('all');
  const [kind, setKind] = useState<CatalogKind | 'all'>('all');
  const [promoOnly, setPromoOnly] = useState(false);
  const [networkOnly, setNetworkOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('recurring');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (platform !== 'all' && row.platform !== platform) return false;
      if (kind !== 'all' && row.kind !== kind) return false;
      if (promoOnly && !row.promo) return false;
      if (networkOnly && !row.network) return false;
      if (!q) return true;
      const hay = `${row.platform} ${row.product} ${row.fitNl} ${row.fitEn}`.toLowerCase();
      return hay.includes(q);
    });
    return sortCatalog(filtered, sort);
  }, [rows, platform, kind, promoOnly, networkOnly, query, sort]);

  const kindLabel = (value: CatalogKind) => {
    if (en) {
      if (value === 'recurring') return 'Recurring';
      if (value === 'purchase') return 'Per purchase';
      return 'Per transaction';
    }
    if (value === 'recurring') return 'Terugkerend';
    if (value === 'purchase') return 'Per aankoop';
    return 'Per transactie';
  };

  return (
    <div id="commissies">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label className="text-sm text-slate-700">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {en ? 'Search' : 'Zoeken'}
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 sm:w-56"
            placeholder={en ? 'Product or use' : 'Product of gebruik'}
          />
        </label>
        <label className="text-sm text-slate-700">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            {en ? 'Sort' : 'Sorteren'}
          </span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortId)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="recurring">{en ? 'Recurring first' : 'Terugkerend eerst'}</option>
            <option value="commission">
              {en ? 'Highest commission per event' : 'Hoogste commissie per gebeurtenis'}
            </option>
            <option value="price">{en ? 'Lowest customer price' : 'Laagste klantprijs'}</option>
            <option value="platform">{en ? 'Platform' : 'Platform'}</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(['all', 'Growth', 'Marketplace', 'Studio'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPlatform(value)}
            className={`rounded-full px-3 py-1 text-sm ${platform === value ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}
          >
            {value === 'all' ? (en ? 'All platforms' : 'Alle platformen') : value}
          </button>
        ))}
        {(['all', 'recurring', 'purchase', 'transaction'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={`rounded-full px-3 py-1 text-sm ${kind === value ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}
          >
            {value === 'all' ? (en ? 'All types' : 'Alle types') : kindLabel(value)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPromoOnly((value) => !value)}
          className={`rounded-full px-3 py-1 text-sm ${promoOnly ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}
        >
          {en ? 'Promo code' : 'Actiecode'}
        </button>
        {showNetwork ? (
          <button
            type="button"
            onClick={() => setNetworkOnly((value) => !value)}
            className={`rounded-full px-3 py-1 text-sm ${networkOnly ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}
          >
            MAIN/SUB
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        {en
          ? `Marketplace orders are compared at an order of €${100}. That assumption is labelled on the card. Subscription amounts are per billing period. No popularity or conversion ranking: there is no reliable public sample for that.`
          : `Marketplace-bestellingen worden vergeleken bij een order van €100. Die aanname staat op de kaart. Abonnementsbedragen zijn per betaalperiode. Er is geen rangschikking op populariteit of conversie: daar is geen betrouwbare openbare steekproef voor.`}
        {POPULARITY_SORT_AVAILABLE ? '' : ''}
      </p>
      <ul className="mt-4 space-y-3">
        {visible.map((row) => (
          <li key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  {row.platform}
                </p>
                <h3 className="text-base font-semibold text-slate-900">{row.product}</h3>
                <p className="mt-1 text-sm text-slate-600">{en ? row.fitEn : row.fitNl}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {kindLabel(row.kind)}
              </span>
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">{en ? 'Customer price' : 'Klantprijs'}</dt>
                <dd className="font-medium text-slate-900">{en ? row.priceLabelEn : row.priceLabelNl}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{en ? 'Your commission' : 'Jouw commissie'}</dt>
                <dd className="font-medium text-slate-900">
                  {en ? row.earningLabelEn : row.earningLabelNl}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">
              {showPromo
                ? row.promo
                  ? en
                    ? 'Own promo code where the dashboard offers it.'
                    : 'Eigen actiecode waar het dashboard dat aanbiedt.'
                  : en
                    ? 'No promo code on this item.'
                    : 'Geen actiecode op dit onderdeel.'
                : null}{' '}
              {showNetwork
                ? row.network
                  ? en
                    ? 'MAIN/SUB can apply.'
                    : 'MAIN/SUB kan gelden.'
                  : en
                    ? 'No extra MAIN/SUB layer in this view.'
                    : 'Geen extra MAIN/SUB-laag in dit overzicht.'
                : null}
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-emerald-800">
                {en ? 'How this amount is built' : 'Hoe dit bedrag is opgebouwd'}
              </summary>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-slate-700">
                {(en ? row.detailEn : row.detailNl)
                  .filter((line) => showNetwork || !/\bMAIN\b|\bSUB\b/i.test(line))
                  .map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                <Link href="/affiliate/dashboard" className="text-emerald-800 underline-offset-2 hover:underline">
                  {en ? 'Copy your affiliate link' : 'Kopieer je affiliatelink'}
                </Link>
                {row.promo ? (
                  <Link href="/affiliate/promo-codes" className="text-emerald-800 underline-offset-2 hover:underline">
                    {en ? 'Create a promo code' : 'Maak een actiecode'}
                  </Link>
                ) : null}
                <Link href="/affiliate/promotiemateriaal" className="text-emerald-800 underline-offset-2 hover:underline">
                  {en ? 'Promo material' : 'Promotiemateriaal'}
                </Link>
              </div>
            </details>
          </li>
        ))}
      </ul>
      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          {en ? 'Nothing matches this filter.' : 'Niets past bij deze filter.'}
        </p>
      ) : null}
    </div>
  );
}
