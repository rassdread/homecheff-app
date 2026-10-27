'use client';

import { useEffect, useState } from 'react';

type Summary = Record<string, unknown>;

export default function AdminCenterSummary() {
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

  const sections = ['global', 'marketplace', 'growth', 'studio'].filter((key) => summary[key]);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {sections.map((key) => (
        <section key={key} className="rounded-xl border bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">{key}</h3>
          <pre className="mt-2 overflow-auto text-xs text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(summary[key], null, 2)}
          </pre>
        </section>
      ))}
      {summary.stripeMode === 'test' ? (
        <p className="md:col-span-2 text-xs text-amber-700">
          Stripe staat in testmodus. Deze bedragen zijn geen live omzet.
        </p>
      ) : null}
    </div>
  );
}
