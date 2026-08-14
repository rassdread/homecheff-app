'use client';

import { useCallback, useEffect, useState } from 'react';

type Item = {
  productId: string;
  title: string;
  isActive: boolean;
  integrityStatus: string;
  uniqueReporters: number;
  weightSum: number;
  reasons: string[];
  reportCount: number;
  seller: { name?: string | null; username?: string | null; email?: string | null };
};

export default function IntegrityQueuePanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/integrity');
      if (!res.ok) throw new Error('Laden mislukt');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fout');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (productId: string, action: string) => {
    setBusyId(productId);
    try {
      const res = await fetch('/api/admin/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action }),
      });
      if (!res.ok) throw new Error('Actie mislukt');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fout');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Integrity-queue laden…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Marketplace integrity
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Community-meldingen over marketplace-fit. Restore wijzigt nooit
          seller-isActive.
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Geen open integrity-zaken.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.productId}
              className="rounded-xl border border-gray-200 bg-white p-4 space-y-2"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <a
                  href={`/product/${item.productId}`}
                  className="font-medium text-emerald-700 hover:underline"
                >
                  {item.title}
                </a>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {item.integrityStatus}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Seller: {item.seller.name || item.seller.username || '—'} ·
                isActive={String(item.isActive)} · reporters=
                {item.uniqueReporters} · weight={item.weightSum.toFixed(2)} ·
                reports={item.reportCount}
              </p>
              <p className="text-xs text-gray-600">
                Reasons: {item.reasons.join(', ') || '—'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={busyId === item.productId}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  onClick={() => void act(item.productId, 'RESTORE')}
                >
                  Restore
                </button>
                <button
                  type="button"
                  disabled={busyId === item.productId}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-50"
                  onClick={() => void act(item.productId, 'UNDER_REVIEW')}
                >
                  Under review
                </button>
                <button
                  type="button"
                  disabled={busyId === item.productId}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
                  onClick={() => void act(item.productId, 'REMOVE')}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
