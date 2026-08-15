'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  labelForContributionType,
  parseSellerContributionTypes,
  type SellerContributionType,
} from '@/lib/trust/seller-contribution';

type ActionRow = {
  id: string;
  action: string;
  note: string | null;
  createdAt: string;
  actorUserId: string;
};

type Item = {
  productId: string;
  title: string;
  isActive: boolean;
  integrityStatus: string;
  uniqueReporters: number;
  weightSum: number;
  reasons: string[];
  reportCount: number;
  sellerContributionTypes?: string[];
  sellerContributionNote?: string | null;
  sellerContributionUpdatedAt?: string | null;
  actions?: ActionRow[];
  seller: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
  };
};

export default function IntegrityQueuePanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

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
        body: JSON.stringify({
          productId,
          action,
          note: notes[productId]?.trim() || undefined,
        }),
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
    <div className="space-y-4" data-hc-integrity-queue="">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Marketplace integrity
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Community-meldingen over marketplace-fit. Restore wijzigt nooit
          seller-isActive. Bijdrage = seller-declared evidence, geen certificaat.
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Geen open integrity-zaken.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const types = parseSellerContributionTypes(
              item.sellerContributionTypes,
            );
            const clarifications = (item.actions || []).filter(
              (a) => a.action === 'SELLER_CLARIFICATION',
            );
            return (
              <li
                key={item.productId}
                className="rounded-xl border border-gray-200 bg-white p-4 space-y-2"
                data-hc-integrity-case={item.productId}
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
                <div
                  className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-800 space-y-1"
                  data-hc-integrity-contribution=""
                >
                  <p className="font-semibold">Seller contribution (declared)</p>
                  {types.length > 0 ? (
                    <p>
                      {types
                        .map((id: SellerContributionType) =>
                          labelForContributionType(id, 'nl'),
                        )
                        .join(' · ')}
                    </p>
                  ) : (
                    <p className="text-gray-500">NOT DECLARED (legacy / empty)</p>
                  )}
                  {item.sellerContributionNote?.trim() ? (
                    <p className="whitespace-pre-wrap">
                      {item.sellerContributionNote.trim()}
                    </p>
                  ) : null}
                </div>
                {clarifications.length > 0 ? (
                  <div className="text-xs text-gray-700 space-y-1">
                    <p className="font-semibold">Seller clarifications</p>
                    {clarifications.map((c) => (
                      <p key={c.id} className="border-l-2 border-amber-300 pl-2">
                        {new Date(c.createdAt).toLocaleString('nl-NL')}:{' '}
                        {c.note || '—'}
                      </p>
                    ))}
                  </div>
                ) : null}
                {(item.actions || []).length > 0 ? (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer">History</summary>
                    <ul className="mt-1 space-y-0.5">
                      {(item.actions || []).map((a) => (
                        <li key={a.id}>
                          {a.action} ·{' '}
                          {new Date(a.createdAt).toLocaleString('nl-NL')}
                          {a.note ? ` — ${a.note}` : ''}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                <label className="block text-xs text-gray-600">
                  Moderator note (optional)
                  <input
                    className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-sm"
                    value={notes[item.productId] || ''}
                    onChange={(e) =>
                      setNotes((prev) => ({
                        ...prev,
                        [item.productId]: e.target.value,
                      }))
                    }
                  />
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    data-hc-integrity-restore=""
                    disabled={busyId === item.productId}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    onClick={() => void act(item.productId, 'RESTORE')}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    data-hc-integrity-request-changes=""
                    disabled={busyId === item.productId}
                    className="rounded-lg border border-amber-400 px-3 py-1.5 text-xs font-medium text-amber-900 disabled:opacity-50"
                    onClick={() => void act(item.productId, 'REQUEST_CHANGES')}
                  >
                    Request changes
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
                    data-hc-integrity-remove=""
                    disabled={busyId === item.productId}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
                    onClick={() => void act(item.productId, 'REMOVE')}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
