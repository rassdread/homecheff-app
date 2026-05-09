'use client';

import { useEffect, useState } from 'react';

type Payload = {
  downloadClicksLast30Days: number;
  androidBetaDownloadSignupsLast30Days: number;
  androidBetaDownloadSignupsAllTime: number;
  usersCompletedBetaOnboarding: number;
  usersBetaTesterJoined: number;
  attributionSourceKey: string;
};

export default function AdminBetaInsightsClient() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/beta-insights', { credentials: 'include' });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          if (!cancelled) setErr(json?.error || 'Kon data niet laden');
          return;
        }
        if (!cancelled) setData(json as Payload);
      } catch {
        if (!cancelled) setErr('Netwerkfout');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">{err}</p>;
  }

  if (!data) {
    return <p className="text-sm text-gray-500">Laden…</p>;
  }

  const rows: { label: string; value: number | string }[] = [
    { label: 'Beta-downloadkliks (30 dagen)', value: data.downloadClicksLast30Days },
    { label: 'Signups bron android beta (30 dagen)', value: data.androidBetaDownloadSignupsLast30Days },
    { label: 'Signups bron android beta (totaal)', value: data.androidBetaDownloadSignupsAllTime },
    { label: 'Gebruikers met afgeronde beta-onboarding', value: data.usersCompletedBetaOnboarding },
    { label: 'Gebruikers met beta-testerbonus (HCP/badge)', value: data.usersBetaTesterJoined },
    { label: 'Bronsleutel affiliatie', value: data.attributionSourceKey },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
          <span className="text-gray-600">{r.label}</span>
          <span className="font-medium text-gray-900 tabular-nums">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
