'use client';

/**
 * LEGAL-4A — admin compliance foundation panel (internal only).
 * Does not expose DAC7 labels to buyers. Does not send seller tax verdicts.
 */

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Shield } from 'lucide-react';

type DsaState =
  | 'NOT_ASSESSED'
  | 'SME_EXCLUSION_EXPECTED'
  | 'ARTICLE_30_APPLIES'
  | 'COUNSEL_REVIEW_REQUIRED';

type SellerRow = {
  sellerUserId: string;
  email: string | null;
  name: string | null;
  username: string | null;
  commerceDeclaration: string;
  businessVerified: boolean | null;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingCompleted: boolean;
  dac7PrimaryActivity: string;
  dac7Readiness: string;
  goodsTransactionCount: number;
  goodsGrossCents: number;
  goodsRefundCents: number;
  goodsNetCents: number;
  goodsPlatformFeesCents: number;
  identityCompletenessScore: number;
  refundReconciliationState: string;
  reviewFlags: string[];
};

type Report = {
  dsa: {
    state: DsaState;
    assessedAt: string | null;
    assessmentNote: string | null;
    reviewDueAt: string | null;
  };
  year: number;
  sellers: SellerRow[];
};

function eur(cents: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export default function ComplianceFoundationPanel() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dsaState, setDsaState] = useState<DsaState>('NOT_ASSESSED');
  const [dsaNote, setDsaNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/compliance');
      if (!res.ok) {
        setError('Kon compliance rapport niet laden');
        return;
      }
      const data = (await res.json()) as Report;
      setReport(data);
      setDsaState(data.dsa.state);
      setDsaNote(data.dsa.assessmentNote || '');
    } catch {
      setError('Netwerkfout');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveDsa = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_dsa_applicability',
          state: dsaState,
          assessmentNote: dsaNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Opslaan mislukt');
        return;
      }
      await load();
    } catch {
      setError('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance foundation (LEGAL-4A)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Interne assen: DSA-toepasselijkheid + DAC7-readiness. Geen
            belastingoordeel. Geen Art.30-onboarding in deze fase.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Vernieuwen
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="border rounded-xl p-4 space-y-3 bg-gray-50">
        <h4 className="font-medium text-gray-900">DSA Article 29/30 gate</h4>
        <p className="text-xs text-gray-600">
          Geen automatische juridische SME-conclusie. Alleen reviewed assessment.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="block text-gray-700 mb-1">State</span>
            <select
              value={dsaState}
              onChange={(e) => setDsaState(e.target.value as DsaState)}
              className="w-full border rounded-lg px-3 py-2 bg-white"
            >
              <option value="NOT_ASSESSED">NOT_ASSESSED</option>
              <option value="SME_EXCLUSION_EXPECTED">
                SME_EXCLUSION_EXPECTED
              </option>
              <option value="ARTICLE_30_APPLIES">ARTICLE_30_APPLIES</option>
              <option value="COUNSEL_REVIEW_REQUIRED">
                COUNSEL_REVIEW_REQUIRED
              </option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="block text-gray-700 mb-1">Assessment note</span>
            <textarea
              value={dsaNote}
              onChange={(e) => setDsaNote(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 bg-white"
              placeholder="Basis / evidence reference (geen PII)"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveDsa()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? 'Opslaan…' : 'DSA assessment opslaan'}
        </button>
        {report?.dsa.assessedAt && (
          <p className="text-xs text-gray-500">
            Laatst beoordeeld: {report.dsa.assessedAt}
          </p>
        )}
      </div>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-3 py-2">Seller</th>
              <th className="px-3 py-2">LEGAL-1</th>
              <th className="px-3 py-2">Biz.verified</th>
              <th className="px-3 py-2">Stripe</th>
              <th className="px-3 py-2">DAC7 act.</th>
              <th className="px-3 py-2">Readiness</th>
              <th className="px-3 py-2">Goods #</th>
              <th className="px-3 py-2">Gross</th>
              <th className="px-3 py-2">Refund</th>
              <th className="px-3 py-2">Net</th>
              <th className="px-3 py-2">Fees</th>
              <th className="px-3 py-2">ID %</th>
              <th className="px-3 py-2">Flags</th>
            </tr>
          </thead>
          <tbody>
            {(report?.sellers || []).map((s) => (
              <tr key={s.sellerUserId} className="border-t align-top">
                <td className="px-3 py-2">
                  <div className="font-medium">{s.name || s.username || '—'}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                </td>
                <td className="px-3 py-2 text-xs">{s.commerceDeclaration}</td>
                <td className="px-3 py-2">
                  {s.businessVerified == null
                    ? '—'
                    : s.businessVerified
                      ? 'yes'
                      : 'no'}
                </td>
                <td className="px-3 py-2 text-xs">
                  {s.stripeConnectAccountId
                    ? s.stripeConnectOnboardingCompleted
                      ? 'connected'
                      : 'pending'
                    : 'none'}
                </td>
                <td className="px-3 py-2 text-xs">{s.dac7PrimaryActivity}</td>
                <td className="px-3 py-2 text-xs">{s.dac7Readiness}</td>
                <td className="px-3 py-2">{s.goodsTransactionCount}</td>
                <td className="px-3 py-2">{eur(s.goodsGrossCents)}</td>
                <td className="px-3 py-2">{eur(s.goodsRefundCents)}</td>
                <td className="px-3 py-2">{eur(s.goodsNetCents)}</td>
                <td className="px-3 py-2">{eur(s.goodsPlatformFeesCents)}</td>
                <td className="px-3 py-2">
                  {Math.round(s.identityCompletenessScore * 100)}%
                </td>
                <td className="px-3 py-2 text-xs">
                  {s.reviewFlags.join(', ') || '—'}
                </td>
              </tr>
            ))}
            {!loading && (report?.sellers?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-gray-500">
                  Geen sellers in sample
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
