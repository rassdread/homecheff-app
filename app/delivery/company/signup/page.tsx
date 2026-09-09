'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { ArrowRight, Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type FormState = {
  name: string;
  email: string;
  password: string;
  username: string;
  companyName: string;
  kvkNumber: string;
  vatNumber: string;
  contactPhone: string;
  age: number;
  transportation: string[];
  availableDays: string[];
  availableTimeSlots: string[];
  preferredRadius: number;
  homeAddress: string;
  acceptDeliveryAgreement: boolean;
};

const TRANSPORT = [
  { id: 'BIKE', label: 'Fiets' },
  { id: 'EBIKE', label: 'E-bike' },
  { id: 'SCOOTER', label: 'Scooter' },
  { id: 'CAR', label: 'Auto' },
] as const;

const DAYS = [
  'maandag',
  'dinsdag',
  'woensdag',
  'donderdag',
  'vrijdag',
  'zaterdag',
  'zondag',
];

const SLOTS = [
  { id: 'morning', label: 'Ochtend' },
  { id: 'afternoon', label: 'Middag' },
  { id: 'evening', label: 'Avond' },
];

export default function DeliveryCompanySignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLock, setSubmitLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeHint, setResumeHint] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    username: '',
    companyName: '',
    kvkNumber: '',
    vatNumber: '',
    contactPhone: '',
    age: 18,
    transportation: [],
    availableDays: [],
    availableTimeSlots: [],
    preferredRadius: 10,
    homeAddress: '',
    acceptDeliveryAgreement: false,
  });

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/me');
        if (!res.ok || cancelled) return;
        const payload = await res.json();
        const user = payload.user || payload;
        setIsExistingUser(true);
        setForm((prev) => ({
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
          username: user.username || prev.username,
          homeAddress: user.address || prev.homeAddress,
          contactPhone: user.phoneNumber || prev.contactPhone,
        }));
        setStep((s) => (s < 2 ? 2 : s));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email, status]);

  const firstStep = isExistingUser ? 2 : 1;

  const toggle = (key: 'transportation' | 'availableDays' | 'availableTimeSlots', value: string) => {
    setForm((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value],
      };
    });
  };

  const stepValid = () => {
    switch (step) {
      case 1:
        return (
          form.name.trim().length > 1 &&
          form.email.includes('@') &&
          form.password.length >= 6 &&
          /^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())
        );
      case 2:
        return (
          form.companyName.trim().length > 1 &&
          /^\d{8}$/.test(form.kvkNumber.replace(/\s+/g, ''))
        );
      case 3:
        return form.age >= 18 && form.transportation.length > 0;
      case 4:
        return (
          form.availableDays.length > 0 &&
          form.availableTimeSlots.length > 0 &&
          form.homeAddress.trim().length > 3
        );
      case 5:
        return form.acceptDeliveryAgreement && form.age >= 18;
      default:
        return false;
    }
  };

  const submit = async () => {
    if (submitLock || loading) return;
    if (form.age < 18) {
      setError('Commerciële bezorging via HomeCheff is beschikbaar vanaf 18 jaar.');
      return;
    }
    setSubmitLock(true);
    setLoading(true);
    setError(null);
    setResumeHint(false);
    try {
      const body = isExistingUser
        ? {
            age: form.age,
            transportation: form.transportation,
            availableDays: form.availableDays,
            availableTimeSlots: form.availableTimeSlots,
            preferredRadius: form.preferredRadius,
            maxDistance: form.preferredRadius,
            homeAddress: form.homeAddress,
            acceptDeliveryAgreement: form.acceptDeliveryAgreement,
            providerType: 'DELIVERY_BUSINESS',
            companyName: form.companyName,
            kvkNumber: form.kvkNumber,
            vatNumber: form.vatNumber || undefined,
            contactPhone: form.contactPhone || undefined,
          }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            username: form.username,
            age: form.age,
            transportation: form.transportation,
            availableDays: form.availableDays,
            availableTimeSlots: form.availableTimeSlots,
            preferredRadius: form.preferredRadius,
            maxDistance: form.preferredRadius,
            homeAddress: form.homeAddress,
            acceptDeliveryAgreement: form.acceptDeliveryAgreement,
            providerType: 'DELIVERY_BUSINESS',
            companyName: form.companyName,
            kvkNumber: form.kvkNumber,
            vatNumber: form.vatNumber || undefined,
            contactPhone: form.contactPhone || undefined,
          };

      const res = await fetch('/api/delivery/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data?.error === 'string' &&
            data.error !== 'ALREADY_REGISTERED' &&
            data.error !== 'INTERNAL_SERVER_ERROR'
            ? data.error
            : typeof data?.message === 'string'
              ? data.message
              : 'Controleer de gemarkeerde gegevens en probeer opnieuw.'
        );
        setResumeHint(
          data?.resumeHint === 'login_and_resume' ||
            data?.code === 'RESUME_REQUIRED'
        );
        return;
      }

      if (!isExistingUser) {
        const login = await signIn('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (!login?.ok) {
          router.push(
            `/login?message=${encodeURIComponent(
              'Bedrijfsaccount aangemaakt. Log in om je dashboard te openen.'
            )}&callbackUrl=${encodeURIComponent('/delivery/dashboard')}`
          );
          return;
        }
      }
      router.push('/delivery/dashboard?welcome=true&newSignup=true&business=true');
    } catch {
      setError(
        'Er ging iets mis bij het afronden van je bedrijfsregistratie. Je gegevens zijn bewaard. Probeer het opnieuw.'
      );
    } finally {
      setLoading(false);
      setSubmitLock(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Sessie wordt geladen…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-700 text-white">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Bezorgbedrijf aanmelden
          </h1>
          <p className="mt-2 text-slate-600">
            Registreer je bedrijf als bezorgpartner. De contactpersoon/bestuurder moet 18+ zijn.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Particulier?{' '}
            <Link href="/delivery/signup" className="font-medium text-sky-800 underline">
              Ga naar particuliere aanmelding
            </Link>
          </p>
        </div>

        <div className="mb-6 text-center text-sm text-slate-500">
          Stap {step} van 5
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
          {step === 1 && !isExistingUser && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Account contactpersoon</h2>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Volledige naam"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Gebruikersnaam"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value.toLowerCase() }))
                }
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Wachtwoord (min. 6)"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Bedrijfsgegevens</h2>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Bedrijfsnaam *"
                value={form.companyName}
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="KvK-nummer (8 cijfers) *"
                value={form.kvkNumber}
                onChange={(e) => setForm((p) => ({ ...p, kvkNumber: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="BTW-nummer (optioneel)"
                value={form.vatNumber}
                onChange={(e) => setForm((p) => ({ ...p, vatNumber: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Zakelijk telefoonnummer (optioneel)"
                value={form.contactPhone}
                onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Leeftijd & vervoer</h2>
              <p className="text-sm text-slate-600">
                Leeftijd van de bestuurder/bezorger die dit account beheert (hard 18+).
              </p>
              <select
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                value={form.age}
                onChange={(e) => setForm((p) => ({ ...p, age: Number(e.target.value) }))}
              >
                {Array.from({ length: 82 }, (_, i) => i + 18).map((age) => (
                  <option key={age} value={age}>
                    {age} jaar
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                {TRANSPORT.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle('transportation', t.id)}
                    className={`rounded-xl border-2 p-3 text-sm font-medium ${
                      form.transportation.includes(t.id)
                        ? 'border-sky-700 bg-sky-50 text-sky-900'
                        : 'border-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Werkgebied</h2>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Zakelijk adres / standplaats *"
                value={form.homeAddress}
                onChange={(e) => setForm((p) => ({ ...p, homeAddress: e.target.value }))}
              />
              <label className="block text-sm text-slate-700">
                Radius: {form.preferredRadius} km
                <input
                  type="range"
                  min={2}
                  max={50}
                  value={form.preferredRadius}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, preferredRadius: Number(e.target.value) }))
                  }
                  className="mt-2 w-full"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggle('availableDays', day)}
                    className={`rounded-xl border-2 p-2 text-sm capitalize ${
                      form.availableDays.includes(day)
                        ? 'border-sky-700 bg-sky-50'
                        : 'border-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {SLOTS.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggle('availableTimeSlots', slot.id)}
                    className={`w-full rounded-xl border-2 p-3 text-left text-sm ${
                      form.availableTimeSlots.includes(slot.id)
                        ? 'border-sky-700 bg-sky-50'
                        : 'border-slate-200'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Voorwaarden</h2>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Meerdere chauffeurs onder één bedrijf volgen later via team-uitnodigingen.
                Dit account is de primaire bedrijfscontactpersoon en moet 18+ zijn.
              </div>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5"
                  checked={form.acceptDeliveryAgreement}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      acceptDeliveryAgreement: e.target.checked,
                    }))
                  }
                />
                <span>
                  Ik accepteer de Bezorger Overeenkomst en bevestig dat de bestuurder/bezorger 18+ is.
                </span>
              </label>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle className="mb-1 inline h-4 w-4" /> {form.companyName || 'Bedrijf'} · KvK{' '}
                {form.kvkNumber || '—'} · {form.age}+
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
              <p>{error}</p>
              {resumeHint && (
                <p className="mt-2">
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent('/delivery/company/signup')}`}
                    className="font-semibold underline"
                  >
                    Log in om je bedrijfsregistratie af te ronden
                  </Link>
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-between gap-3">
            <Button
              variant="outline"
              disabled={step === firstStep}
              onClick={() => setStep((s) => Math.max(firstStep, s - 1))}
            >
              Vorige
            </Button>
            {step < 5 ? (
              <Button
                disabled={!stepValid()}
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-2"
              >
                Volgende <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                disabled={!stepValid() || loading || submitLock}
                onClick={submit}
              >
                {loading ? 'Bezig…' : 'Bedrijf registreren'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
