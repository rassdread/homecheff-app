'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Gift, Plus, RefreshCw } from 'lucide-react';

type PromoRow = {
  id: string;
  code: string;
  name: string | null;
  status: string;
  discountSharePct: number;
  discountDurationCycles: number | null;
  appliesTo: string;
  isPlatform?: boolean;
  startsAt: string;
  endsAt: string | null;
  redemptionCount: number;
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number | null;
  businessSubscriptionCount?: number;
};

const ADMIN_PERCENTS = [0, 10, 25, 40, 50, 75, 90, 100] as const;
const DURATIONS = [1, 3, 6, 12] as const;

const PURPOSES = [
  { value: 'launch', label: 'Launch campaign' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'invited_business', label: 'Invited business' },
  { value: 'pilot', label: 'Pilot participant' },
  { value: 'gift', label: 'Gift' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'testing', label: 'Internal testing' },
  { value: 'general', label: 'General' },
] as const;

/**
 * Dedicated Admin → Promotions panel (platform-owned codes only).
 * Not affiliate / partner / referral codes.
 */
export default function AdminPromotionsPanel() {
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(100);
  const [durationCycles, setDurationCycles] = useState<number | ''>(3);
  const [purpose, setPurpose] = useState<string>('launch');
  const [maxRedemptions, setMaxRedemptions] = useState<string>('');
  const [maxRedemptionsPerUser, setMaxRedemptionsPerUser] = useState<string>('1');
  const [endsAt, setEndsAt] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/promo-codes?platformOnly=1', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kon promoties niet laden');
        return;
      }
      setRows((data.promoCodes || []).filter((p: PromoRow) => p.isPlatform !== false));
    } catch {
      setError('Kon promoties niet laden');
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
          name: name.trim() || undefined,
          code,
          discountType,
          discountValue:
            discountType === 'fixed'
              ? Math.round(Number(discountValue) * 100)
              : Number(discountValue),
          discountDurationCycles:
            durationCycles === '' ? null : Number(durationCycles),
          purpose,
          target: 'subscription',
          maxRedemptions: maxRedemptions.trim()
            ? Number(maxRedemptions)
            : undefined,
          maxRedemptionsPerUser: maxRedemptionsPerUser.trim()
            ? Number(maxRedemptionsPerUser)
            : undefined,
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Aanmaken mislukt');
        return;
      }
      const cyclesLabel =
        durationCycles === ''
          ? 'zolang actief'
          : `${durationCycles} maand${Number(durationCycles) === 1 ? '' : 'en'}`;
      setSuccess(
        `Promotie ${data.promoCode.code} aangemaakt (${discountType === 'percent' ? `${discountValue}%` : `€${discountValue}`} · ${cyclesLabel})`,
      );
      setCode('');
      setName('');
      await load();
    } catch {
      setError('Aanmaken mislukt');
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (id: string, status: 'ACTIVE' | 'DISABLED') => {
    const reason =
      status === 'DISABLED'
        ? window.prompt('Reden om promotie te deactiveren?') || ''
        : undefined;
    if (status === 'DISABLED' && !reason.trim()) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Status wijzigen mislukt');
        return;
      }
      await load();
    } catch {
      setError('Status wijzigen mislukt');
    }
  };

  const copyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setSuccess(`Code ${value} gekopieerd`);
    } catch {
      setError('Kopiëren mislukt');
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-promotions-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Gift className="h-5 w-5 text-emerald-600" aria-hidden />
            Promotions
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Platform-owned subscription codes created by HomeCheff. Separate from
            Affiliates / partners / referrals — no affiliate commission.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Vernieuwen
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </div>
      )}

      <form
        onSubmit={createPromo}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4"
        data-testid="admin-promotions-create"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Plus className="h-4 w-4" aria-hidden />
          Create promotion
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Name / title</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Welcome 3 months"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Code</span>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="WELCOME3"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Purpose</span>
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
            <span className="font-medium text-gray-700">Discount type</span>
            <select
              value={discountType}
              onChange={(e) =>
                setDiscountType(e.target.value === 'fixed' ? 'fixed' : 'percent')
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="percent">Percentage (0–100%)</option>
              <option value="fixed">Fixed amount (€)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">
              {discountType === 'percent' ? 'Discount %' : 'Amount (€)'}
            </span>
            {discountType === 'percent' ? (
              <select
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {ADMIN_PERCENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}%
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                min={0}
                step={1}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            )}
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Duration (billing months)</span>
            <select
              value={durationCycles === '' ? '' : String(durationCycles)}
              onChange={(e) =>
                setDurationCycles(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} month{d === 1 ? '' : 's'}
                </option>
              ))}
              <option value="">Forever (while code active)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">
              Max redemptions (all users)
            </span>
            <input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Unlimited"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <span className="mt-0.5 block text-xs text-gray-500">
              Total uses across every account.
            </span>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">
              Max redemptions per user
            </span>
            <input
              type="number"
              min={1}
              value={maxRedemptionsPerUser}
              onChange={(e) => setMaxRedemptionsPerUser(e.target.value)}
              placeholder="Unlimited"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <span className="mt-0.5 block text-xs text-gray-500">
              How often one account may redeem this code.
            </span>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Ends (optional)</span>
            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Target: business subscriptions (Basic / Pro / Premium). After the
          promotional months, the normal plan price resumes.
        </p>
        <button
          type="submit"
          disabled={submitting || !code.trim()}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Bezig…' : 'Create promotion'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Discount</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Usage</th>
              <th className="px-3 py-2">Per user</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  Laden…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  Nog geen platform-promoties.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-mono font-semibold text-gray-900">
                      {row.code}
                    </div>
                    {row.name ? (
                      <div className="text-xs text-gray-500">{row.name}</div>
                    ) : null}
                    {row.endsAt ? (
                      <div className="text-xs text-gray-400">
                        Ends {new Date(row.endsAt).toLocaleDateString()}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    {row.appliesTo?.startsWith('PLATFORM_FIXED:')
                      ? `Fixed ${row.appliesTo.replace('PLATFORM_FIXED:', '')}¢`
                      : `${row.discountSharePct}%`}
                  </td>
                  <td className="px-3 py-2">
                    {row.discountDurationCycles != null
                      ? `${row.discountDurationCycles} mo`
                      : 'Forever'}
                  </td>
                  <td className="px-3 py-2">
                    {row.redemptionCount}
                    {row.maxRedemptions != null ? ` / ${row.maxRedemptions}` : ' / ∞'}
                    <div className="text-xs text-gray-500">all users</div>
                  </td>
                  <td className="px-3 py-2">
                    {row.maxRedemptionsPerUser != null
                      ? row.maxRedemptionsPerUser
                      : '∞'}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        row.status === 'ACTIVE'
                          ? 'text-emerald-700'
                          : 'text-gray-500'
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copyCode(row.code)}
                        className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        <Copy className="h-3 w-3" aria-hidden />
                        Copy
                      </button>
                      {row.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => void setStatus(row.id, 'DISABLED')}
                          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void setStatus(row.id, 'ACTIVE')}
                          className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-50"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
