'use client';

import { useEffect, useState } from 'react';

type Summary = Record<string, unknown>;
type SectionKey = 'global' | 'marketplace' | 'growth' | 'studio';

const SECTION_LABEL: Record<SectionKey, string> = {
  global: 'Algemeen',
  marketplace: 'Marktplaats',
  growth: 'Groei',
  studio: 'Studio',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function countLabel(value: unknown): string {
  return typeof value === 'number' ? String(value) : 'Niet vastgelegd';
}

function euroLabel(cents: unknown): string {
  if (typeof cents !== 'number') return 'Niet vastgelegd';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-gray-100 py-2 first:border-t-0">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900 text-right">{value}</dd>
    </div>
  );
}

function sectionFacts(key: SectionKey, raw: Record<string, unknown>): { label: string; value: string }[] {
  if (key === 'global') {
    return [
      { label: 'Gebruikers', value: countLabel(raw.users) },
      { label: 'E-mail geverifieerd', value: countLabel(raw.verifiedUsers) },
      { label: 'Beheerders', value: countLabel(raw.administrators) },
    ];
  }
  if (key === 'marketplace') {
    return [
      { label: 'Betaalde bestellingen', value: countLabel(raw.paidOrders) },
      { label: 'Bruto bestelwaarde', value: euroLabel(raw.grossMerchandiseCents) },
      { label: 'Geslaagde uitbetalingen', value: euroLabel(raw.successfulTransferCents) },
      { label: 'Refunds', value: countLabel(raw.refundRecords) },
      { label: 'Bezorgprofielen', value: countLabel(raw.deliveryProfiles) },
    ];
  }
  if (key === 'growth') {
    return [
      { label: 'Commerciële affiliates', value: countLabel(raw.commercialAffiliates) },
      { label: 'Promotierecords', value: countLabel(raw.promotionRecords) },
      { label: 'Geïnde omzet', value: euroLabel(raw.collectedRevenueCents) },
    ];
  }
  const jobs = Array.isArray(raw.generationJobsByStatus) ? raw.generationJobsByStatus : null;
  const jobLabel =
    jobs === null
      ? 'Niet vastgelegd'
      : jobs.length === 0
        ? 'Geen'
        : jobs
            .map((row) => {
              const item = asRecord(row);
              if (!item) return '';
              return `${String(item.status)}: ${countLabel(item.count)}`;
            })
            .filter(Boolean)
            .join(', ');
  return [
    { label: 'Projecten', value: countLabel(raw.workspaceProjects) },
    { label: 'Generatie-opdrachten', value: jobLabel },
    { label: 'Providerkosten', value: euroLabel(raw.providerCostCents) },
    { label: 'Klantomzet', value: euroLabel(raw.customerRevenueCents) },
  ];
}

export default function AdminCenterSummary({ only }: { only?: SectionKey }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/center/summary')
      .then(async (response) => {
        if (!response.ok) throw new Error('Summary unavailable');
        return response.json();
      })
      .then((body) => {
        if (!cancelled) setSummary(body);
      })
      .catch(() => {
        if (!cancelled) setError('De samenvatting kon niet geladen worden.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!summary) return <p className="text-sm text-gray-500">Samenvatting laden…</p>;

  const sections = (['global', 'marketplace', 'growth', 'studio'] as const).filter(
    (key) => summary[key] && (!only || key === only),
  );
  if (sections.length === 0) {
    return <p className="text-sm text-gray-600">Geen gegevens voor dit onderdeel.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {sections.map((key) => {
        const raw = asRecord(summary[key]);
        if (!raw) return null;
        return (
          <section key={key} className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold text-emerald-800">{SECTION_LABEL[key]}</h3>
            <dl className="mt-2">
              {sectionFacts(key, raw).map((fact) => (
                <Fact key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </dl>
            {key === 'marketplace' ? (
              <p className="mt-2 text-xs text-gray-500">
                Bruto is de bestelwaarde, geen platformwinst. Testbedragen zijn geen live omzet.
              </p>
            ) : null}
            {key === 'studio' && typeof raw.unavailable === 'string' ? (
              <p className="mt-2 text-xs text-gray-500">
                Er is geen aparte boekhouding voor providerkosten of studio-omzet. De aantallen zijn records.
              </p>
            ) : null}
            {key === 'growth' && raw.collectedRevenueCents == null ? (
              <p className="mt-2 text-xs text-gray-500">
                Groei heeft in dit overzicht geen aparte omzetboekhouding.
              </p>
            ) : null}
          </section>
        );
      })}
      {summary.stripeMode === 'test' ? (
        <p className="md:col-span-2 text-xs text-amber-700">
          Stripe staat in testmodus. Deze bedragen zijn geen live omzet.
        </p>
      ) : null}
    </div>
  );
}
