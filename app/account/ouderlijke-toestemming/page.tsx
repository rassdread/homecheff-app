'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ConsentBody() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const revoke = params.get('revoke') || '';
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(kind: 'accept' | 'revoke') {
    setBusy(true);
    setError(null);
    const res = await fetch(
      kind === 'accept'
        ? '/api/account/parental-consent/accept'
        : '/api/account/parental-consent/revoke',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: kind === 'accept' ? token : revoke }),
      },
    );
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.message || 'Dit is niet gelukt.');
      return;
    }
    setMessage(data.message || 'Opgeslagen.');
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">
        {revoke ? 'Toestemming intrekken' : 'Toestemming voor HomeCheff'}
      </h1>
      <p className="mt-3 text-sm leading-6 text-gray-700">
        {revoke
          ? 'Hiermee pauzeer je nieuwe verkopen en het instellen van betalingen voor dit HomeCheff-account. Bestaande bestellingen blijven staan.'
          : 'Je geeft toestemming zodat dit HomeCheff-account aanbiedingen mag plaatsen in categorieën die voor die leeftijd zijn toegestaan, en betalingen mag instellen. HomeCheff bewaart wanneer en welke versie je hebt geaccepteerd. Dit is geen identiteitscontrole bij de betaalprovider.'}
      </p>
      {message ? (
        <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>
      ) : (
        <button
          type="button"
          disabled={busy || (revoke ? !revoke : !token)}
          onClick={() => submit(revoke ? 'revoke' : 'accept')}
          className="mt-6 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Bezig…' : revoke ? 'Toestemming intrekken' : 'Ik geef toestemming'}
        </button>
      )}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </main>
  );
}

export default function ParentalConsentPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-lg px-4 py-12 text-sm text-gray-500">Laden…</main>}>
      <ConsentBody />
    </Suspense>
  );
}
