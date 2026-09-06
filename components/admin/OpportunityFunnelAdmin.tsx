'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';

type FunnelReport = {
  ok: boolean;
  from: string;
  to: string;
  commercialOnly: boolean;
  shareToAttributionRate: number | null;
  shareToAttributionRateDefinition: string;
  shareToAttributionDenominatorReliable: boolean;
  attributedSignupsFromShares: number;
  uniqueShareSessions: number;
  companyShareLinkCreated: number;
  buckets: Array<{
    opportunityId: string;
    views: number;
    cardClicks: number;
    shareIntents: number;
    shareLinkCreated: number;
    referralLandings: number;
    signupsCompleted: number;
    attributionLocks: number;
    deliveryProfilesCreated: number;
    deliveryActivated: number;
  }>;
  kpiDefinitions: Record<string, string>;
};

export default function OpportunityFunnelAdmin() {
  const [days, setDays] = useState(30);
  const [includeCert, setIncludeCert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<FunnelReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          days: String(days),
          ...(includeCert ? { includeCert: '1' } : {}),
        });
        const res = await fetch(`/api/admin/opportunity-funnel?${qs}`);
        const data = await res.json();
        if (cancelled) return;
        if (!data.ok) {
          setError(data.code || 'Laden mislukt');
          setReport(null);
          return;
        }
        setReport(data);
      } catch {
        if (!cancelled) setError('Laden mislukt');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days, includeCert]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <BarChart3 className="h-5 w-5 text-emerald-600" />
          Opportunity funnel (Verdien / share)
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-1">
            Dagen
            <select
              className="rounded border border-slate-200 px-2 py-1"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {[7, 14, 30, 90].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeCert}
              onChange={(e) => setIncludeCert(e.target.checked)}
            />
            Inclusief cert traffic
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : error ? (
        <p className="text-sm text-amber-800">{error}</p>
      ) : report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Attributed signups from shares</p>
              <p className="text-2xl font-semibold">{report.attributedSignupsFromShares}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Company share links created</p>
              <p className="text-2xl font-semibold">{report.companyShareLinkCreated}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Unique share sessions</p>
              <p className="text-2xl font-semibold">{report.uniqueShareSessions}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">SHARE_TO_ATTRIBUTION_RATE</p>
              <p className="text-2xl font-semibold">
                {report.shareToAttributionDenominatorReliable &&
                report.shareToAttributionRate != null
                  ? `${(report.shareToAttributionRate * 100).toFixed(1)}%`
                  : 'Niet betrouwbaar'}
              </p>
              {!report.shareToAttributionDenominatorReliable ? (
                <p className="mt-1 text-xs text-slate-500">
                  Toon attributed signups tot company denominator betrouwbaar is.
                </p>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-slate-500">{report.shareToAttributionRateDefinition}</p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-3 py-2">Opportunity</th>
                  <th className="px-3 py-2">Views</th>
                  <th className="px-3 py-2">Clicks</th>
                  <th className="px-3 py-2">Shares</th>
                  <th className="px-3 py-2">Landings</th>
                  <th className="px-3 py-2">Signups</th>
                  <th className="px-3 py-2">Locks</th>
                  <th className="px-3 py-2">Delivery profiles</th>
                  <th className="px-3 py-2">Activated</th>
                </tr>
              </thead>
              <tbody>
                {report.buckets.map((b) => (
                  <tr key={b.opportunityId} className="border-b border-slate-50">
                    <td className="px-3 py-2 font-medium">{b.opportunityId}</td>
                    <td className="px-3 py-2">{b.views}</td>
                    <td className="px-3 py-2">{b.cardClicks}</td>
                    <td className="px-3 py-2">{b.shareIntents}</td>
                    <td className="px-3 py-2">{b.referralLandings}</td>
                    <td className="px-3 py-2">{b.signupsCompleted}</td>
                    <td className="px-3 py-2">{b.attributionLocks}</td>
                    <td className="px-3 py-2">{b.deliveryProfilesCreated}</td>
                    <td className="px-3 py-2">{b.deliveryActivated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
