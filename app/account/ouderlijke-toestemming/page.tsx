'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

function ConsentBody() {
  const params = useSearchParams();
  const { language } = useTranslation();
  const en = language === 'en';
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
      setError(data.messageEn && en ? data.messageEn : data.message || (en ? 'This did not work.' : 'Dit is niet gelukt.'));
      return;
    }
    setMessage((en && data.messageEn) || data.message || (en ? 'Saved.' : 'Opgeslagen.'));
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">
        {revoke
          ? en
            ? 'Withdraw permission'
            : 'Toestemming intrekken'
          : en
            ? 'Permission for HomeCheff'
            : 'Toestemming voor HomeCheff'}
      </h1>
      <p className="mt-3 text-sm leading-6 text-gray-700">
        {revoke
          ? en
            ? 'This pauses new selling and payment setup for this HomeCheff account. Existing orders stay in place.'
            : 'Hiermee pauzeer je nieuwe verkopen en het instellen van betalingen voor dit HomeCheff-account. Bestaande bestellingen blijven staan.'
          : en
            ? 'You give permission for this HomeCheff account to list offers in categories allowed for that age, and to set up payments. HomeCheff records when you accepted and which version. This is not an identity check with the payment provider.'
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
          {busy
            ? en
              ? 'Working…'
              : 'Bezig…'
            : revoke
              ? en
                ? 'Withdraw permission'
                : 'Toestemming intrekken'
              : en
                ? 'I give permission'
                : 'Ik geef toestemming'}
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
