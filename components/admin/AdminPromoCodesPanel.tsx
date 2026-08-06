'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gift, Plus, RefreshCw } from 'lucide-react';

type PromoRow = {
  id: string;
  code: string;
  status: string;
  discountSharePct: number;
  appliesTo: string;
  isPlatform?: boolean;
  startsAt: string;
  endsAt: string | null;
  redemptionCount: number;
  maxRedemptions: number | null;
  affiliate: { id: string | null; name: string | null; email: string | null } | null;
};

const ADMIN_PERCENTS = [0, 10, 25, 40, 50, 75, 90, 100] as const;

const PURPOSES = [
  { value: 'gift', label: 'Gift' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'launch', label: 'Launch' },
  { value: 'testing', label: 'Internal testing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'general', label: 'General' },
] as const;

export default function AdminPromoCodesPanel() {
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(100);
  const [purpose, setPurpose] = useState<string>('gift');
  const [target, setTarget] = useState<'subscription' | 'checkout'>('subscription');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/promo-codes', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kon promocodes niet laden');
        return;
      }
      setRows(data.promoCodes || []);
    } catch {
      setError('Kon promocodes niet laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          discountType,
          discountValue:
            discountType === 'fixed' ? Math.round(Number(discountValue) * 100) : Number(discountValue),
          purpose,
          target,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Aanmaken mislukt');
        return;
      }
      setSuccess(
        data.kind === 'coupon'
          ? `Checkout coupon ${data.coupon.code} aangemaakt`
          : `Platform promocode ${data.promoCode.code} aangemaakt (${discountType === 'percent' ? `${discountValue}%` : `€${discountValue}`})`,
      );
      setCode('');
      await load();
    } catch {
      setError('Aanmaken mislukt');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (row: PromoRow) => {
    const next = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const res = await fetch(`/api/admin/promo-codes/${row.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: next,
        reason: next === 'DISABLED' ? 'Admin disable' : undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Status wijzigen mislukt');
      return;
    }
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950">
        <p className="font-semibold">Admin platform promocodes</p>
        <p className="mt-1 text-emerald-900/90">
          Alleen administrators kunnen 0–100% of vaste bedragen aanmaken. Affiliate-maxima
          (hoofd 80% / sub 75% van commissie ≈ max ~40% van de prijs) blijven ongewijzigd.
        </p>
      </div>

      <form
        onSubmit={createPromo}
        className="rounded-xl border bg-white p-4 sm:p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Nieuwe admin code</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Code</span>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="LAUNCH100"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Doel</span>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Type</span>
            <select
              value={discountType}
              onChange={(e) =>
                setDiscountType(e.target.value === 'fixed' ? 'fixed' : 'percent')
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="percent">Percentage (0–100%)</option>
              <option value="fixed">Vast bedrag (€)</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-medium text-gray-700">Target</span>
            <select
              value={target}
              onChange={(e) =>
                setTarget(e.target.value === 'checkout' ? 'checkout' : 'subscription')
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="subscription">Zakelijk abonnement (PromoCode)</option>
              <option value="checkout">Checkout coupon (vast / %)</option>
            </select>
          </label>

          {discountType === 'percent' ? (
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-gray-700">Korting %</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {ADMIN_PERCENTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDiscountValue(p)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
                      discountValue === p
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="mt-2 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          ) : (
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-gray-700">Bedrag (€)</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !code.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {submitting ? 'Bezig…' : 'Aanmaken'}
        </button>
      </form>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-gray-900">Recente codes</h3>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="h-4 w-4" />
            Vernieuwen
          </button>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Laden…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Geen promocodes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Korting</th>
                  <th className="px-4 py-2 font-medium">Owner</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Actie</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-2 font-mono font-semibold">{row.code}</td>
                    <td className="px-4 py-2">
                      {row.isPlatform || !row.affiliate ? (
                        <span className="rounded bg-violet-100 px-2 py-0.5 text-xs text-violet-800">
                          Platform
                        </span>
                      ) : (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          Affiliate
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {row.appliesTo.startsWith('PLATFORM_FIXED:')
                        ? `€${(Number(row.appliesTo.split(':')[1] || 0) / 100).toFixed(2)}`
                        : `${row.discountSharePct}%`}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {row.affiliate?.name || row.affiliate?.email || '—'}
                    </td>
                    <td className="px-4 py-2">{row.status}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => toggleStatus(row)}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        {row.status === 'ACTIVE' ? 'Disable' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
