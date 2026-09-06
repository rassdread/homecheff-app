'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bike, Building2, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import EcosystemShareAction from '@/components/share/EcosystemShareAction';
import { OPPORTUNITY_DESTINATIONS } from '@/lib/share/ecosystem-opportunities';

type ProviderRow = {
  attributionId: string;
  referredCentralUserId: string;
  displayName: string;
  providerType: string;
  providerTypeLabel: string;
  status: string;
  referredAt: string;
  sourceCampaign: string | null;
  campaignId: string | null;
  eligibleAffiliateEarningsCents: number;
  firstDeliveryAt: string | null;
  isActive: boolean;
};

const FILTERS = [
  { id: 'ALL', label: 'Alle' },
  { id: 'ONBOARDING', label: 'Onboarding' },
  { id: 'ACTIEF', label: 'Actief' },
  { id: 'EERSTE_ACTIVITEIT', label: 'Eerste activiteit' },
  { id: 'BEZORGBEDRIJF', label: 'Bezorgbedrijf' },
  { id: 'INDIVIDUEEL', label: 'Individueel' },
] as const;

function euro(cents: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function statusLabel(status: string) {
  switch (status) {
    case 'AANGEMELD':
      return 'Aangemeld';
    case 'ONBOARDING':
      return 'Onboarding';
    case 'ACTIEF':
      return 'Actief';
    case 'EERSTE_BEZORGING':
      return 'Eerste bezorging';
    case 'INKOMSTEN_GEGENEREERD':
      return 'Inkomsten gegenereerd';
    default:
      return status;
  }
}

/**
 * Private affiliate acquisition progress — Delivery recruits only.
 */
export default function AangebrachteBezorgers({
  organizationId,
}: {
  organizationId?: string | null;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('ALL');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ filter });
      if (organizationId) qs.set('organizationId', organizationId);
      const res = await fetch(`/api/affiliate/referred-delivery-providers?${qs}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.code || 'Laden mislukt');
        setRows([]);
        return;
      }
      setRows(data.providers || []);
    } catch {
      setError('Laden mislukt');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const ind = OPPORTUNITY_DESTINATIONS.delivery_individual;
  const company = OPPORTUNITY_DESTINATIONS.delivery_company;

  return (
    <section
      aria-labelledby="aangebrachte-bezorgers-heading"
      className="rounded-2xl border border-sky-200 bg-white p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="aangebrachte-bezorgers-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Aangebrachte bezorgers
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Alleen door jou aangebrachte bezorgers en bezorgbedrijven. Geen
            privéadressen of KYC.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <EcosystemShareAction
            destinationHref={ind.href}
            title={t('verdienHub.cards.delivery.title')}
            text={t('verdienHub.shareCopy.delivery_individual')}
            surface="aangebrachte_bezorgers"
            product={ind.product}
            opportunityId="delivery_individual"
            labelKey="verdienHub.cards.delivery.share"
            variant="button"
          />
          <EcosystemShareAction
            destinationHref={company.href}
            title={t('verdienHub.cards.deliveryCompany.title')}
            text={t('verdienHub.shareCopy.delivery_company')}
            surface="aangebrachte_bezorgers"
            product={company.product}
            opportunityId="delivery_company"
            labelKey="verdienHub.cards.deliveryCompany.share"
            variant="button"
          />
        </div>
      </div>

      <div
        className="mt-4 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Filter aangebrachte bezorgers"
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
              filter === f.id
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" aria-label="Laden" />
        </div>
      ) : error ? (
        <p className="mt-6 text-sm text-amber-800">{error}</p>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-800">
            Je hebt nog geen bezorgers aangebracht.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <EcosystemShareAction
              destinationHref={ind.href}
              title={t('verdienHub.cards.delivery.title')}
              text={t('verdienHub.shareCopy.delivery_individual')}
              surface="aangebrachte_bezorgers_empty"
              product={ind.product}
              opportunityId="delivery_individual"
              labelKey="verdienHub.cards.delivery.share"
            />
            <EcosystemShareAction
              destinationHref={company.href}
              title={t('verdienHub.cards.deliveryCompany.title')}
              text={t('verdienHub.shareCopy.delivery_company')}
              surface="aangebrachte_bezorgers_empty"
              product={company.product}
              opportunityId="delivery_company"
              labelKey="verdienHub.cards.deliveryCompany.share"
            />
          </div>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="mt-4 space-y-3 md:hidden">
            {rows.map((r) => (
              <li
                key={r.attributionId}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
              >
                <div className="flex items-start gap-2">
                  {r.providerType === 'DELIVERY_BUSINESS' ? (
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                  ) : (
                    <Bike className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{r.displayName}</p>
                    <p className="text-xs text-slate-500">{r.providerTypeLabel}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {statusLabel(r.status)} ·{' '}
                      {new Date(r.referredAt).toLocaleDateString('nl-NL')}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {euro(r.eligibleAffiliateEarningsCents)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">Naam</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Aangebracht</th>
                  <th className="py-2 pr-3 font-medium">Bron</th>
                  <th className="py-2 font-medium">Affiliate-inkomsten</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.attributionId} className="border-b border-slate-100">
                    <td className="py-2.5 pr-3 font-medium text-slate-900">{r.displayName}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{r.providerTypeLabel}</td>
                    <td className="py-2.5 pr-3 text-slate-700">{statusLabel(r.status)}</td>
                    <td className="py-2.5 pr-3 text-slate-600">
                      {new Date(r.referredAt).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="max-w-[10rem] truncate py-2.5 pr-3 text-slate-500">
                      {r.sourceCampaign || '—'}
                    </td>
                    <td className="py-2.5 font-medium text-slate-900">
                      {euro(r.eligibleAffiliateEarningsCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
