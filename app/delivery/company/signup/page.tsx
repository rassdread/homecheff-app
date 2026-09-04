'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Building2, Loader2 } from 'lucide-react';

export default function DeliveryCompanySignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companyDisplayName, setCompanyDisplayName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [maxDistance, setMaxDistance] = useState(15);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Bezorgbedrijf aanmelden</h1>
        <p className="text-gray-600">Log eerst in of maak een HomeCheff-account.</p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent('/delivery/company/signup')}`}
          className="inline-flex rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white"
        >
          Inloggen
        </Link>
      </div>
    );
  }

  const submit = async () => {
    setError(null);
    if (!acceptTerms) {
      setError('Accepteer de voorwaarden om door te gaan.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/delivery/company/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyDisplayName,
          companyDescription,
          homeAddress,
          maxDistance,
          age: 18,
          transportation: ['CAR'],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || data.code || 'Aanmelden mislukt');
        return;
      }
      router.push('/delivery/company/dashboard');
    } catch {
      setError('Er ging iets mis. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-sky-50/80 to-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bezorg met je bedrijf</h1>
          <p className="text-sm text-gray-600">
            Je bedrijf wordt de bezorgdienst die klanten kiezen. Chauffeurs wijs je later zelf
            toe — het tarief blijft van het bedrijf.
          </p>
        </header>

        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-800">Bedrijfsnaam</span>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
              value={companyDisplayName}
              onChange={(e) => setCompanyDisplayName(e.target.value)}
              placeholder="bijv. Vlaardingen Express"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-800">Korte omschrijving (optioneel)</span>
            <textarea
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
              rows={3}
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              placeholder="Lokale bezorgdienst in de regio…"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-800">Basisadres / standplaats</span>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              placeholder="Adres of plaats"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-800">
              Werkgebied (max. km): {maxDistance}
            </span>
            <input
              type="range"
              min={3}
              max={40}
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <span>
              Ik bevestig dat mijn bedrijf als zelfstandige bezorgpartner via HomeCheff werkt en
              akkoord gaat met de toepasselijke voorwaarden.
            </span>
          </label>
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <button
            type="button"
            disabled={loading || !companyDisplayName.trim()}
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Bedrijf aanmaken
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Liever zelf bezorgen?{' '}
          <Link href="/delivery/signup" className="font-medium text-emerald-700 underline">
            Persoonlijk profiel
          </Link>
        </p>
      </div>
    </div>
  );
}
