'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';

type MetricValue = number | string | Record<string, unknown> | Array<unknown> | null;

type Metric = {
  value: MetricValue;
  tracked: boolean;
  note?: string;
};

type CommandCenterData = {
  generatedAt: string;
  rangeDays: number;
  overview: Record<string, Metric>;
  marketplace: Record<string, Metric>;
  money: Record<string, Metric>;
  subscriptions: Record<string, Metric>;
  affiliate: Record<string, Metric>;
  growth: Record<string, Metric>;
  discovery: Record<string, Metric>;
  trustAndSafety: Record<string, Metric>;
  operations: Record<string, Metric>;
  seoAndContent: Record<string, Metric>;
};

function formatMetricValue(value: MetricValue): string {
  if (value == null) return 'not tracked yet';
  if (typeof value === 'number') return value.toLocaleString('nl-NL');
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `${value.length} items`;
  return Object.entries(value)
    .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toLocaleString('nl-NL') : String(v)}`)
    .join(' | ');
}

function Section({ title, metrics }: { title: string; metrics: Record<string, Metric> }) {
  const entries = Object.entries(metrics);
  return (
    <section className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entries.map(([key, metric]) => (
          <div key={key} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              {metric.tracked ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  tracked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Clock3 className="w-3 h-3" />
                  not tracked yet
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900">{formatMetricValue(metric.value)}</p>
            {metric.note ? <p className="text-xs text-gray-500 mt-1">{metric.note}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminCommandCenter() {
  const [range, setRange] = useState<'1d' | '7d' | '30d'>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommandCenterData | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/command-center?range=${range}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Unable to load command center');
      }
      setData(await response.json());
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const attentionNow = useMemo(() => {
    if (!data) return [];
    const checks: Array<{ label: string; metric?: Metric }> = [
      { label: 'Pending Stripe Connect sellers', metric: data.overview.pendingStripeConnectSellers },
      { label: 'Pending accepted value proposals', metric: data.overview.pendingTaxonomyProposals },
      { label: 'Affiliate payout cron', metric: data.affiliate.cronStatus },
      { label: 'Production backfill status', metric: data.operations.productionBackfillStatus },
      { label: 'Webhook failures', metric: data.operations.webhookFailures },
    ];
    return checks;
  }, [data]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">HomeCheff Command Center</h2>
            <p className="text-sm text-gray-600">
              Founder-first health snapshot. No synthetic data; unknown signals are shown as not tracked yet.
            </p>
            {data?.generatedAt ? (
              <p className="text-xs text-gray-500 mt-1">
                Updated: {new Date(data.generatedAt).toLocaleString('nl-NL')}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as '1d' | '7d' | '30d')}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="1d">1 day</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading command center metrics...
        </div>
      ) : null}

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      ) : null}

      {!loading && !error && data ? (
        <>
          <section className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Needs Attention Now</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attentionNow.map((item) => (
                <div key={item.label} className="rounded-lg border p-3">
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {item.metric ? formatMetricValue(item.metric.value) : 'not tracked yet'}
                  </p>
                  {!item.metric?.tracked ? (
                    <p className="text-xs text-amber-700 mt-1">{item.metric?.note || 'not tracked yet'}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <Section title="Overview" metrics={data.overview} />
          <Section title="Marketplace" metrics={data.marketplace} />
          <Section title="Money" metrics={data.money} />
          <Section title="Subscriptions / Business DNA" metrics={data.subscriptions} />
          <Section title="Affiliate" metrics={data.affiliate} />
          <Section title="Growth & Pilot" metrics={data.growth} />
          <Section title="Discovery" metrics={data.discovery} />
          <Section title="Trust & Safety" metrics={data.trustAndSafety} />
          <Section title="Operations" metrics={data.operations} />
          <Section title="Content & SEO" metrics={data.seoAndContent} />
        </>
      ) : null}
    </div>
  );
}
