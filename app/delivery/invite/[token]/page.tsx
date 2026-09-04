'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function DeliveryInviteAcceptPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';
  const { data: session, status } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/delivery/company/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || data.code || 'Uitnodiging kon niet worden geaccepteerd');
        return;
      }
      setDone(true);
      router.push('/delivery/dashboard');
    } catch {
      setError('Er ging iets mis');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center space-y-4">
        <h1 className="text-xl font-bold">Uitnodiging chauffeur</h1>
        <p className="text-sm text-gray-600">
          Log in met het e-mailadres waarop je bent uitgenodigd.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/delivery/invite/${token}`)}`}
          className="inline-flex rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white"
        >
          Inloggen
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-12 text-center">
      <h1 className="text-xl font-bold">Uitnodiging accepteren</h1>
      <p className="text-sm text-gray-600">
        Je wordt chauffeur bij een HomeCheff-bezorgdienst. Het bedrijf blijft de
        bezorgpartner voor de klant.
      </p>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {done ? (
        <p className="text-emerald-700">Geaccepteerd — doorsturen…</p>
      ) : (
        <button
          type="button"
          disabled={busy || !token}
          onClick={accept}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Accepteer uitnodiging
        </button>
      )}
    </div>
  );
}
