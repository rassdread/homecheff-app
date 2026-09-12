'use client';

import { useState } from 'react';

type Preview = {
  userId: string;
  email: string | null;
  currentAccountId: string | null;
  legacyOldAccountId: string | null;
  track: string | null;
  onboardingCompleted: boolean;
  alreadyCleared: boolean;
  safety: { safe: true; blockers: [] } | { safe: false; blockers: string[]; decision: string };
};

/**
 * Admin tool: Stripe-koppeling opnieuw instellen (non-destructive).
 */
export default function AdminStripeConnectReset() {
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = async () => {
    setError(null);
    setResult(null);
    setPreview(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/stripe/connect-reset?userId=${encodeURIComponent(userId.trim())}`,
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Preview mislukt');
        return;
      }
      setPreview(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview mislukt');
    } finally {
      setLoading(false);
    }
  };

  const execute = async () => {
    if (!preview?.safety.safe && !preview?.alreadyCleared) {
      setError('Reset geblokkeerd — MANUAL_REVIEW');
      return;
    }
    if (
      !window.confirm(
        'Stripe-koppeling opnieuw instellen? Het oude Stripe-account blijft bewaard en wordt niet verwijderd. De gebruiker moet opnieuw Particulier/Bedrijf kiezen.',
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stripe/connect-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId.trim(),
          reason: reason.trim(),
          confirm: true,
          idempotencyKey: `admin-reset-${userId.trim()}-${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.code === 'MANUAL_REVIEW'
            ? `Geblokkeerd: ${(json.blockers || []).join(', ')}`
            : json.code || json.error || 'Reset mislukt',
        );
        return;
      }
      setResult(json.message || 'OK');
      await loadPreview();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
      <div>
        <h3 className="text-base font-semibold text-amber-950">
          Stripe-koppeling opnieuw instellen
        </h3>
        <p className="mt-1 text-sm text-amber-900">
          Verwijdert géén Stripe-account. Bewaart het oude account als legacy en
          wist alleen de huidige HomeCheff-koppeling, zodat de gebruiker opnieuw
          Particulier of Bedrijf kan kiezen. Bij financiële exposure: blokkeer
          (MANUAL_REVIEW).
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium text-slate-700">User ID</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="cuid / uuid"
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-700">Reden (verplicht)</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bijv. verkeerde track / stuck KYC"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading || !userId.trim()}
          onClick={() => void loadPreview()}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Safety preview
        </button>
        <button
          type="button"
          disabled={
            loading ||
            !preview ||
            (!preview.alreadyCleared && !preview.safety.safe) ||
            reason.trim().length < 8
          }
          onClick={() => void execute()}
          className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Reset uitvoeren
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {result && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {result}
        </p>
      )}
      {preview && (
        <pre className="overflow-x-auto rounded-lg bg-white/80 p-3 text-xs text-slate-800">
          {JSON.stringify(preview, null, 2)}
        </pre>
      )}
    </div>
  );
}
