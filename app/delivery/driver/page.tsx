'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Loader2, MapPin, Package } from 'lucide-react';

type Job = {
  id: string;
  status: string;
  deliveryAddress?: string | null;
  assignedDriverUserId?: string | null;
  order?: { orderNumber?: string | null; User?: { name?: string | null } };
  deliveryProfile?: { companyDisplayName?: string | null };
};

/**
 * Mobile-first driver ops — assigned company jobs + status actions.
 */
export default function DeliveryDriverDashboardPage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/delivery/orders?status=ACCEPTED,PICKED_UP,PENDING');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Kon opdrachten niet laden');
        setJobs([]);
        return;
      }
      setJobs(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      setError('Kon opdrachten niet laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') load();
  }, [status, load]);

  const updateStatus = async (orderId: string, next: string) => {
    setBusyId(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/delivery/orders/${orderId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Status bijwerken mislukt');
      } else {
        await load();
      }
    } finally {
      setBusyId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <Link href="/login" className="text-emerald-700 underline">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-6 pb-24">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Chauffeur
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Mijn opdrachten</h1>
        <p className="text-sm text-gray-600">
          Opdrachten die jouw bezorgdienst aan jou heeft toegewezen.
        </p>
      </header>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <Package className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 font-medium text-gray-900">Er zijn nog geen bezorgopdrachten.</p>
          <p className="mt-1 text-sm text-gray-600">
            Zodra de dispatcher een rit toewijst, verschijnt die hier.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => {
            const busy = busyId === job.id;
            return (
              <li key={job.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">
                      {job.deliveryProfile?.companyDisplayName || 'Bezorgdienst'}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {job.order?.orderNumber || job.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">Status: {job.status}</p>
                  </div>
                </div>
                {job.deliveryAddress && (
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-700">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{job.deliveryAddress}</span>
                  </p>
                )}
                <div className="mt-3 flex flex-col gap-2">
                  {job.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(job.id, 'PICKED_UP')}
                      className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Opgehaald
                    </button>
                  )}
                  {job.status === 'PICKED_UP' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(job.id, 'DELIVERED')}
                      className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Afgeleverd
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-xs text-gray-500">
        <Link href="/delivery/start" className="underline">
          Bezorgkeuze
        </Link>
        {' · '}
        <Link href="/mijn-homecheff" className="underline">
          Dashboard
        </Link>
      </p>
    </div>
  );
}
