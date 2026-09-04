'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Loader2, UserPlus, Building2 } from 'lucide-react';

type DriverRow = {
  userId: string;
  name: string | null;
  email: string | null;
  status: string;
  role: string;
};

export default function DeliveryCompanyDashboardPage() {
  const { data: session, status } = useSession();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await fetch('/api/delivery/profile');
      const meData = await me.json().catch(() => ({}));
      const id = meData?.profile?.id || meData?.id || meData?.deliveryProfile?.id;
      const providerType =
        meData?.profile?.providerType ||
        meData?.providerType ||
        meData?.deliveryProfile?.providerType;
      if (!id || providerType !== 'DELIVERY_BUSINESS') {
        setError('Geen bezorgbedrijf-profiel gevonden.');
        setLoading(false);
        return;
      }
      setProfileId(id);
      setCompanyName(
        meData?.profile?.companyDisplayName ||
          meData?.deliveryProfile?.companyDisplayName ||
          'Je bezorgbedrijf',
      );

      const [drv, orders] = await Promise.all([
        fetch(`/api/delivery/company/drivers?companyProfileId=${id}`),
        fetch('/api/delivery/orders?status=PENDING,ACCEPTED,PICKED_UP'),
      ]);
      const drvData = await drv.json();
      const ordersData = await orders.json().catch(() => ({}));
      if (drvData.ok) {
        setDrivers(drvData.drivers || []);
        if (drvData.profile?.companyDisplayName) {
          setCompanyName(drvData.profile.companyDisplayName);
        }
      }
      const list = ordersData.orders || ordersData.deliveryOrders || [];
      setJobs(Array.isArray(list) ? list : []);
    } catch {
      setError('Kon bedrijfsdashboard niet laden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status, load]);

  const invite = async () => {
    if (!profileId || !inviteEmail.trim()) return;
    setBusy(true);
    setInviteUrl(null);
    try {
      const res = await fetch('/api/delivery/company/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite',
          companyProfileId: profileId,
          email: inviteEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || data.code || 'Uitnodigen mislukt');
      } else {
        setInviteUrl(data.acceptUrl);
        setInviteEmail('');
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const assign = async (deliveryOrderId: string, driverUserId: string) => {
    if (!profileId) return;
    setBusy(true);
    try {
      const res = await fetch('/api/delivery/company/assign-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyProfileId: profileId,
          deliveryOrderId,
          driverUserId,
        }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.message || data.code || 'Toewijzen mislukt');
      else await load();
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <Link href="/login" className="text-sky-700 underline">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            Bezorgdienst
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Building2 className="h-6 w-6 text-sky-700" />
            {companyName}
          </h1>
          <p className="text-sm text-gray-600">
            Opdrachten, chauffeurs en bedrijfsinstellingen — tarief blijft van het bedrijf.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await fetch('/api/delivery/activate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ active: true, isOnline: true }),
                });
                const data = await res.json();
                if (!data.ok) setError(data.message || data.code || 'Activeren mislukt');
                else setError(null);
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Activeer voor klanten
          </button>
          <Link
            href="/delivery/settings"
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium"
          >
            Tarieven & gebied
          </Link>
          <Link
            href="/verdiensten"
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium"
          >
            Verdiensten
          </Link>
        </div>
      </header>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs text-gray-500">Nieuwe / actieve opdrachten</p>
          <p className="text-2xl font-bold">{jobs.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs text-gray-500">Actieve chauffeurs</p>
          <p className="text-2xl font-bold">{drivers.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs text-gray-500">Volgende stap</p>
          <p className="text-sm font-medium text-gray-800">
            {drivers.length === 0
              ? 'Nodig je eerste chauffeur uit'
              : jobs.length > 0
                ? 'Wijs een chauffeur toe'
                : 'Stel tarief & beschikbaarheid in'}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 space-y-4">
        <h2 className="text-lg font-semibold">Chauffeurs</h2>
        {drivers.length === 0 ? (
          <p className="text-sm text-gray-600">Je hebt nog geen chauffeurs toegevoegd.</p>
        ) : (
          <ul className="divide-y">
            {drivers.map((d) => (
              <li key={d.userId} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-medium">{d.name || 'Chauffeur'}</span>
                  <span className="ml-2 text-gray-500">{d.email}</span>
                </span>
                <span className="text-xs uppercase text-gray-500">{d.status}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder="chauffeur@email.nl"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={invite}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            Chauffeur uitnodigen
          </button>
        </div>
        {inviteUrl && (
          <p className="break-all rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            Uitnodigingslink (deel veilig): {inviteUrl}
          </p>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5 space-y-3">
        <h2 className="text-lg font-semibold">Opdrachten</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-600">Er zijn nog geen bezorgopdrachten.</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-medium">#{String(job.id).slice(0, 8)} · {job.status}</p>
                <p className="text-gray-600">{job.deliveryAddress || 'Adres volgt'}</p>
                {job.assignedDriverUserId && (
                  <p className="text-xs text-sky-700">Chauffeur toegewezen</p>
                )}
              </div>
              {drivers.length > 0 && (
                <select
                  className="rounded-lg border px-2 py-2 text-sm"
                  defaultValue=""
                  disabled={busy}
                  onChange={(e) => {
                    if (e.target.value) assign(job.id, e.target.value);
                  }}
                >
                  <option value="">Chauffeur toewijzen…</option>
                  {drivers.map((d) => (
                    <option key={d.userId} value={d.userId}>
                      {d.name || d.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
