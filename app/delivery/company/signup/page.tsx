'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { ArrowRight, Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import DeliveryAgreementModal from '@/components/delivery/DeliveryAgreementModal';
import DeliveryRegistrationNotice from '@/components/delivery/DeliveryRegistrationNotice';
import { useTranslation } from '@/hooks/useTranslation';
import { CANONICAL_DELIVERY_DAYS } from '@/lib/delivery/delivery-profile-canonical';
import { trackDeliverySignupFunnel } from '@/lib/delivery/delivery-signup-funnel';
import { newDeliveryFlowId } from '@/lib/delivery/delivery-signup-draft';

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

const TRANSPORT = ['BIKE', 'EBIKE', 'SCOOTER', 'CAR'] as const;
const TRANSPORT_KEYS: Record<(typeof TRANSPORT)[number], string> = {
  BIKE: 'deliverySignup.transportation.bike',
  EBIKE: 'deliverySignup.transportation.ebike',
  SCOOTER: 'deliverySignup.transportation.scooter',
  CAR: 'deliverySignup.transportation.car',
};
const SLOT_IDS = ['morning', 'afternoon', 'evening'] as const;

const DAY_LABEL_KEYS = [
  'deliverySignup.days.monday',
  'deliverySignup.days.tuesday',
  'deliverySignup.days.wednesday',
  'deliverySignup.days.thursday',
  'deliverySignup.days.friday',
  'deliverySignup.days.saturday',
  'deliverySignup.days.sunday',
] as const;

export default function DeliveryCompanySignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const individualHref = searchParams?.toString()
    ? `/delivery/signup?${searchParams.toString()}`
    : '/delivery/signup';
  const flowId = useState(() => newDeliveryFlowId())[0];
  const funnel = (stepNumber: number) => ({
    registrationType: 'company' as const,
    language,
    flowId,
    step: stepNumber,
  });
  const [step, setStep] = useState(1);
  const [showAgreement, setShowAgreement] = useState(false);
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

  useEffect(() => {
    trackDeliverySignupFunnel('delivery_signup_started', funnel(step));
    // One start event for this page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackDeliverySignupFunnel('delivery_signup_step_viewed', funnel(step));
  }, [step, language]);

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
      setError(t('deliveryCompanySignup.underage'));
      return;
    }
    trackDeliverySignupFunnel('delivery_signup_submitted', funnel(5));
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
            deliveryRegion: form.homeAddress,
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
            deliveryRegion: form.homeAddress,
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
              : t('deliveryCompanySignup.checkFields')
        );
        trackDeliverySignupFunnel('delivery_signup_validation_failed', {
          ...funnel(5),
          reason: 'submit_rejected',
        });
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
              t('deliveryCompanySignup.createdLogin')
            )}&callbackUrl=${encodeURIComponent('/delivery/dashboard')}`
          );
          return;
        }
      }
      trackDeliverySignupFunnel('delivery_signup_completed', funnel(5));
      router.push('/delivery/dashboard?welcome=true&newSignup=true&business=true');
    } catch {
      setError(
        t('deliveryCompanySignup.submitFailed')
      );
    } finally {
      setLoading(false);
      setSubmitLock(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">{t('deliveryCompanySignup.sessionLoading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen max-w-[100vw] overflow-x-clip bg-gradient-to-br from-sky-50 via-white to-slate-50">
      <div className="mx-auto max-w-2xl px-4 pt-3 pb-[calc(8rem+var(--hc-cookie-banner-offset,0px)+env(safe-area-inset-bottom,0px))] sm:pt-8">
        <div className="mb-2 text-center sm:mb-8">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sky-700 text-white sm:mb-4 sm:h-16 sm:w-16">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <h1 className="max-w-full whitespace-normal break-words text-2xl font-bold text-slate-900 sm:text-3xl">
            {t('deliveryCompanySignup.title')}
          </h1>
          <p className="mt-2 text-slate-600">
            {t('deliveryCompanySignup.subtitle')}
          </p>
          <DeliveryRegistrationNotice />
          <p className="mt-2 text-sm text-slate-500">
            <Link href={individualHref} className="font-medium text-sky-800 underline">
              {t('deliveryCompanySignup.individualLink')}
            </Link>
          </p>
        </div>

        <div className="mb-3 text-center text-sm text-slate-500 sm:mb-6">
          {t('deliveryCompanySignup.step').replace('{step}', String(step))}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-lg sm:p-8">
          {step === 1 && !isExistingUser && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">{t('deliveryCompanySignup.account')}</h2>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder={t('deliveryCompanySignup.fullName')}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder={t('deliveryCompanySignup.email')}
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder={t('deliveryCompanySignup.username')}
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value.toLowerCase() }))
                }
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder={t('deliveryCompanySignup.password')}
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">{t('deliveryCompanySignup.company')}</h2>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder={t('deliveryCompanySignup.companyName')}
                value={form.companyName}
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder={t('deliveryCompanySignup.kvk')}
                value={form.kvkNumber}
                onChange={(e) => setForm((p) => ({ ...p, kvkNumber: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder={t('deliveryCompanySignup.vat')}
                value={form.vatNumber}
                onChange={(e) => setForm((p) => ({ ...p, vatNumber: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder={t('deliveryCompanySignup.phone')}
                value={form.contactPhone}
                onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">{t('deliveryCompanySignup.ageVehicle')}</h2>
              <p className="text-sm text-slate-600">
                {t('deliveryCompanySignup.ageHelp')}
              </p>
              <select
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                value={form.age}
                onChange={(e) => setForm((p) => ({ ...p, age: Number(e.target.value) }))}
              >
                {Array.from({ length: 82 }, (_, i) => i + 18).map((age) => (
                  <option key={age} value={age}>
                    {t('deliveryCompanySignup.years').replace('{age}', String(age))}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                {TRANSPORT.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle('transportation', id)}
                    className={`rounded-xl border-2 p-3 text-sm font-medium ${
                      form.transportation.includes(id)
                        ? 'border-sky-700 bg-sky-50 text-sky-900'
                        : 'border-slate-200'
                    }`}
                  >
                    {t(TRANSPORT_KEYS[id])}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">{t('deliveryCompanySignup.workArea')}</h2>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder={t('deliveryCompanySignup.businessAddress')}
                value={form.homeAddress}
                onChange={(e) => setForm((p) => ({ ...p, homeAddress: e.target.value }))}
              />
              <label className="block text-sm text-slate-700">
                {t('deliveryCompanySignup.radius').replace('{km}', String(form.preferredRadius))}
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
                {CANONICAL_DELIVERY_DAYS.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggle('availableDays', day)}
                    className={`rounded-xl border-2 p-2 text-sm ${
                      form.availableDays.includes(day)
                        ? 'border-sky-700 bg-sky-50'
                        : 'border-slate-200'
                    }`}
                  >
                    {t(DAY_LABEL_KEYS[index])}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {SLOT_IDS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggle('availableTimeSlots', slot)}
                    className={`w-full rounded-xl border-2 p-3 text-left text-sm ${
                      form.availableTimeSlots.includes(slot)
                        ? 'border-sky-700 bg-sky-50'
                        : 'border-slate-200'
                    }`}
                  >
                    {t(`deliverySignup.timeSlots.${slot}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">{t('deliveryCompanySignup.terms')}</h2>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {t('deliveryCompanySignup.teamNote')}
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
                <span>{t('deliveryCompanySignup.accept')}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAgreement(true)}
                className="text-sm font-medium text-sky-800 underline"
              >
                {t('deliverySignup.fullDeliveryAgreement')}
              </button>
              <DeliveryAgreementModal open={showAgreement} onClose={() => setShowAgreement(false)} />
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
                    {t('deliveryCompanySignup.loginToFinish')}
                  </Link>
                </p>
              )}
            </div>
          )}

          <div
            className="sticky z-[70] mt-4 flex justify-between gap-3 bg-white py-2"
            style={{
              bottom: 'calc(var(--hc-cookie-banner-offset, 0px) + 0.75rem)',
              scrollMarginBottom: 'calc(var(--hc-cookie-banner-offset, 0px) + 1rem)',
            }}
          >
            <Button
              variant="outline"
              disabled={step === firstStep}
              onClick={() => setStep((s) => Math.max(firstStep, s - 1))}
            >
              {t('deliveryCompanySignup.previous')}
            </Button>
            {step < 5 ? (
              <Button
                onClick={() => {
                  if (!stepValid()) {
                    setError(t('deliveryCompanySignup.completeStep'));
                    trackDeliverySignupFunnel('delivery_signup_validation_failed', {
                      ...funnel(step),
                      reason: 'step_incomplete',
                    });
                    return;
                  }
                  setError(null);
                  trackDeliverySignupFunnel('delivery_signup_step_completed', funnel(step));
                  setStep((s) => s + 1);
                }}
                className="inline-flex min-h-12 items-center gap-2"
              >
                {t('deliveryCompanySignup.next')} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                disabled={loading || submitLock}
                onClick={() => {
                  if (!stepValid()) {
                    setError(t('deliveryCompanySignup.completeStep'));
                    return;
                  }
                  void submit();
                }}
              >
                {loading ? t('deliveryCompanySignup.loading') : t('deliveryCompanySignup.submit')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
