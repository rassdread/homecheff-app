'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import DateOfBirthFields, {
  emptyDateOfBirthParts,
  isoFromParts,
  type DateOfBirthParts,
} from '@/components/account/DateOfBirthFields';
import ConnectTrackSelector from '@/components/seller/ConnectTrackSelector';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import {
  accountCompletionModel,
  type AccountAgeMode,
  type AccountCompletionInput,
  type AccountConnectTrack,
  type AccountStripeUiStatus,
} from '@/lib/account/account-completion';

type StripePayload = {
  hasAccount?: boolean;
  uiStatus?: AccountStripeUiStatus;
  paymentReady?: boolean;
  connectTrack?: string | null;
  canCreateOnboardingLink?: boolean;
  configurationMismatch?: boolean;
  recoveryEligible?: boolean;
};

type AgePayload = {
  mode?: AccountAgeMode;
  consentRequired?: boolean;
  consent?: { status?: string };
};

type Props = {
  emailVerified: boolean;
};

function asTrack(value: string | null | undefined): AccountConnectTrack | null {
  return value === 'PARTICULAR' || value === 'BUSINESS' ? value : null;
}

export default function AccountCompletionPanel({ emailVerified }: Props) {
  const { language } = useTranslation();
  const en = language === 'en';
  const [booting, setBooting] = useState(true);
  const [age, setAge] = useState<AgePayload | null>(null);
  const [stripe, setStripe] = useState<StripePayload | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<AccountConnectTrack | null>(null);
  const [dob, setDob] = useState<DateOfBirthParts>(emptyDateOfBirthParts());
  const [guardianEmail, setGuardianEmail] = useState('');
  const [busy, setBusy] = useState<'dob' | 'consent' | 'payments' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsChoice, setNeedsChoice] = useState(false);

  const load = useCallback(async () => {
    const [ageRes, stripeRes] = await Promise.all([
      fetch('/api/account/parental-consent', { cache: 'no-store' }),
      fetch('/api/stripe/connect/onboard', { cache: 'no-store' }),
    ]);
    if (ageRes.ok) setAge((await ageRes.json()) as AgePayload);
    if (stripeRes.ok) {
      const data = (await stripeRes.json()) as StripePayload;
      setStripe(data);
      const track = asTrack(data.connectTrack);
      if (track) setSelectedTrack((current) => current ?? track);
    }
    setBooting(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const input: AccountCompletionInput = {
    emailVerified,
    ageMode: age?.mode ?? null,
    consentRequired: Boolean(age?.consentRequired),
    hasStripeAccount: Boolean(stripe?.hasAccount),
    stripeUiStatus: stripe?.uiStatus ?? (stripe?.paymentReady ? 'PAYMENT_READY' : null),
    connectTrack: asTrack(stripe?.connectTrack),
    canCreateOnboardingLink: stripe?.canCreateOnboardingLink !== false,
    configurationMismatch: Boolean(stripe?.configurationMismatch),
    selectedTrack,
  };
  const model = accountCompletionModel(input);

  async function saveDob() {
    const iso = isoFromParts(dob);
    if (!iso) {
      setError(en ? 'Enter your real date of birth.' : 'Vul je echte geboortedatum in.');
      return;
    }
    setBusy('dob');
    setError(null);
    setNotice(null);
    const res = await fetch('/api/account/date-of-birth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateOfBirth: iso }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(
        data.error ||
          (en ? 'Could not save your date of birth.' : 'Geboortedatum opslaan lukte niet.'),
      );
      return;
    }
    setNotice(en ? 'Date of birth saved.' : 'Geboortedatum opgeslagen.');
    await load();
  }

  async function requestConsent() {
    setBusy('consent');
    setError(null);
    setNotice(null);
    const res = await fetch('/api/account/parental-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guardianEmail }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError((en && data.messageEn) || data.message || data.error);
      return;
    }
    setNotice((en && data.messageEn) || data.message);
    await load();
  }

  async function startPayments() {
    if (!model.effectiveTrack || model.paymentsBlocked) return;
    setBusy('payments');
    setError(null);
    const result = await startStripeConnectOnboarding({
      returnPath: '/settings?tab=payments',
      track: model.effectiveTrack,
    });
    setBusy(null);
    if (result.needsTrackSelection) {
      setNeedsChoice(true);
      setError(
        result.error ||
          (en
            ? 'Choose Individual or Business to continue.'
            : 'Kies Particulier of Bedrijf om verder te gaan.'),
      );
      return;
    }
    if (!result.ok) {
      setError(result.error || (en ? 'Payments could not be opened.' : 'Betalingen openen lukte niet.'));
      await load();
    }
  }

  const paymentStatus = model.paymentsComplete
    ? en
      ? 'Active'
      : 'Actief'
    : model.paymentCta === 'pending'
      ? en
        ? 'Being reviewed'
        : 'Wordt gecontroleerd'
      : stripe?.hasAccount
        ? en
          ? 'Verification needed'
          : 'Verificatie nodig'
        : en
          ? 'Not set up'
          : 'Niet ingesteld';

  const paymentLabel =
    model.paymentCta === 'setup'
      ? en
        ? 'Set up payments'
        : 'Betalingen instellen'
      : model.paymentCta === 'finish'
        ? en
          ? 'Finish verification'
          : 'Verificatie afronden'
        : model.paymentCta === 'update'
          ? en
            ? 'Update details'
            : 'Gegevens bijwerken'
          : model.paymentCta === 'view'
            ? en
              ? 'View payouts'
              : 'Uitbetalingen bekijken'
            : null;

  if (booting) {
    return (
      <p className="text-sm text-gray-500">
        {en ? 'Loading account status…' : 'Accountstatus laden…'}
      </p>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="account-completion-title">
      <div>
        <h2 id="account-completion-title" className="text-lg font-semibold text-gray-900">
          {model.showChecklist
            ? en
              ? 'Finish your account'
              : 'Account afronden'
            : en
              ? 'Payments and payouts'
              : 'Betalingen en uitbetalingen'}
        </h2>
        {model.showChecklist ? (
          <p className="mt-1 text-sm text-gray-600">
            {en
              ? 'Finish the open items here. You do not need to look for them elsewhere.'
              : 'Rond de openstaande punten hier af. Je hoeft ze niet ergens anders te zoeken.'}
          </p>
        ) : null}
      </div>

      {model.showChecklist ? (
        <ul className="space-y-3">
          {model.steps.map((step) => {
            if (step === 'email') {
              return (
                <li key={step} className="rounded-xl border border-gray-200 p-3">
                  <Row
                    done={model.emailComplete}
                    label={en ? 'Email address confirmed' : 'E-mailadres bevestigd'}
                  />
                  {!model.emailComplete ? (
                    <Link
                      href="/verify-email"
                      className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800"
                    >
                      {en ? 'Confirm email' : 'E-mail bevestigen'}
                    </Link>
                  ) : null}
                </li>
              );
            }
            if (step === 'dob') {
              return (
                <li key={step} className="rounded-xl border border-gray-200 p-3">
                  <Row done={model.dobComplete} label={en ? 'Date of birth' : 'Geboortedatum'} />
                  {model.dobRequired ? (
                    <div className="mt-2">
                      <p className="mb-2 text-sm text-gray-600">
                        {en
                          ? 'We use your date of birth to decide which features are available. It is not public.'
                          : 'We gebruiken je geboortedatum om te bepalen welke functies beschikbaar zijn. Deze is niet openbaar.'}
                      </p>
                      <DateOfBirthFields
                        idPrefix="account-completion-dob"
                        value={dob}
                        onChange={setDob}
                        yearPlaceholder={en ? 'YYYY' : 'JJJJ'}
                      />
                      <button
                        type="button"
                        disabled={busy === 'dob'}
                        onClick={() => void saveDob()}
                        className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {en ? 'Save date of birth' : 'Geboortedatum opslaan'}
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            }
            if (step === 'accountType') {
              return (
                <li key={step} className="rounded-xl border border-gray-200 p-3">
                  <Row
                    done={model.accountTypeComplete}
                    label={en ? 'Account type' : 'Accounttype'}
                  />
                  {model.minorBusinessBlocked ? (
                    <p className="mt-2 text-sm text-gray-700">
                      {en
                        ? 'Individual. A business seller account is available from age 18.'
                        : 'Particulier. Een bedrijfsaccount kan vanaf 18 jaar.'}
                    </p>
                  ) : model.particularSelectable ? (
                    <fieldset className="mt-2 space-y-2">
                      <legend className="sr-only">{en ? 'Account type' : 'Accounttype'}</legend>
                      <TrackChoice
                        name="account-type"
                        value="PARTICULAR"
                        checked={model.effectiveTrack === 'PARTICULAR'}
                        title={en ? 'Individual' : 'Particulier'}
                        body={
                          en
                            ? 'For someone selling as an individual, without the HomeCheff business seller route.'
                            : 'Voor iemand die als particulier verkoopt, zonder de zakelijke HomeCheff-route.'
                        }
                        onSelect={() => setSelectedTrack('PARTICULAR')}
                      />
                      {model.businessSelectable ? (
                        <TrackChoice
                          name="account-type"
                          value="BUSINESS"
                          checked={model.effectiveTrack === 'BUSINESS'}
                          title={en ? 'Business' : 'Bedrijf'}
                          body={
                            en
                              ? 'For a business using the existing business seller flow.'
                              : 'Voor een bedrijf dat de bestaande zakelijke verkopersroute gebruikt.'
                          }
                          onSelect={() => setSelectedTrack('BUSINESS')}
                        />
                      ) : null}
                    </fieldset>
                  ) : (
                    <p className="mt-2 text-sm text-gray-700">
                      {model.effectiveTrack === 'BUSINESS'
                        ? en
                          ? 'Business'
                          : 'Bedrijf'
                        : model.effectiveTrack === 'PARTICULAR'
                          ? en
                            ? 'Individual'
                            : 'Particulier'
                          : en
                            ? 'Already set up'
                            : 'Al ingesteld'}
                    </p>
                  )}
                </li>
              );
            }
            if (step === 'payments') {
              return (
                <li key={step} className="rounded-xl border border-gray-200 p-3">
                  <Row done={model.paymentsComplete} label={en ? 'Payments and payouts' : 'Betalingen en uitbetalingen'} />
                  <p className="mt-1 text-sm text-gray-600">
                    {en ? 'Status' : 'Status'}: {paymentStatus}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {en
                      ? 'Payments run through Stripe, the payment provider.'
                      : 'Betalingen lopen via Stripe, de betaalprovider.'}
                  </p>
                  {needsChoice ? null : paymentLabel && model.paymentCta === 'view' ? (
                    <Link
                      href="/verkoper/revenue"
                      className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800"
                    >
                      {paymentLabel}
                    </Link>
                  ) : paymentLabel ? (
                    <button
                      type="button"
                      disabled={busy === 'payments' || model.paymentsBlocked}
                      onClick={() => void startPayments()}
                      className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {busy === 'payments' ? (en ? 'Opening…' : 'Openen…') : paymentLabel}
                    </button>
                  ) : null}
                  {model.paymentsBlocked && !model.under13 ? (
                    <p className="mt-2 text-xs text-gray-500">
                      {en
                        ? 'Finish the open items above first.'
                        : 'Rond eerst de openstaande punten hierboven af.'}
                    </p>
                  ) : null}
                </li>
              );
            }
            return (
              <li key={step} className="rounded-xl border border-gray-200 p-3">
                <Row
                  done={model.consentComplete}
                  label={en ? 'Parental permission' : 'Ouderlijke toestemming'}
                />
                {!model.consentComplete ? (
                  <div className="mt-2">
                    <p className="mb-2 text-sm text-gray-600">
                      {age?.consent?.status === 'RENEWAL_REQUIRED'
                        ? en
                          ? 'Ask a parent or legal representative to give permission again before you sell or set up payments.'
                          : 'Vraag een ouder of wettelijk vertegenwoordiger om opnieuw toestemming te geven voordat je verkoopt of betalingen instelt.'
                        : en
                          ? 'A parent or legal representative needs to give permission before you can sell or set up payments.'
                          : 'Een ouder of wettelijk vertegenwoordiger moet toestemming geven voordat je kunt verkopen of betalingen instellen.'}
                    </p>
                    <label className="block text-xs font-medium text-gray-700" htmlFor="completion-guardian-email">
                      {en ? 'Their email address' : 'Hun e-mailadres'}
                    </label>
                    <input
                      id="completion-guardian-email"
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      className="mt-1 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busy === 'consent'}
                      onClick={() => void requestConsent()}
                      className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {en ? 'Send permission request' : 'Verzoek om toestemming sturen'}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-950">
            {en ? 'Status' : 'Status'}: {paymentStatus}
          </p>
          <Link
            href="/verkoper/revenue"
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800"
          >
            {en ? 'View payouts' : 'Uitbetalingen bekijken'}
          </Link>
        </div>
      )}

      {(stripe?.configurationMismatch || needsChoice) && !model.minorBusinessBlocked ? (
        <div className="rounded-xl border border-gray-200 p-3">
          <ConnectTrackSelector
            recoveryMode
            mismatchMode={Boolean(stripe?.configurationMismatch)}
            loading={busy === 'payments'}
            error={error}
            onSelect={async (track) => {
              setBusy('payments');
              setError(null);
              const result = await startStripeConnectOnboarding({
                returnPath: '/settings?tab=payments',
                track,
                forceReplace: track === 'PARTICULAR',
              });
              setBusy(null);
              if (!result.ok && !result.redirected) {
                setError(result.error || (en ? 'Could not update the payment account.' : 'Betaalaccount bijwerken lukte niet.'));
              }
            }}
          />
        </div>
      ) : null}

      {notice ? <p className="text-sm text-emerald-800">{notice}</p> : null}
      {error && !stripe?.configurationMismatch ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function Row({ done, label }: { done: boolean; label: string }) {
  return (
    <p className="text-sm font-medium text-gray-900">
      <span className={done ? 'text-emerald-700' : 'text-gray-400'} aria-hidden>
        {done ? '✓ ' : '○ '}
      </span>
      {label}
    </p>
  );
}

function TrackChoice({
  name,
  value,
  checked,
  title,
  body,
  onSelect,
}: {
  name: string;
  value: string;
  checked: boolean;
  title: string;
  body: string;
  onSelect: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 has-[:checked]:border-emerald-600">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="mt-1"
      />
      <span>
        <span className="block text-sm font-semibold text-gray-900">{title}</span>
        <span className="mt-0.5 block text-xs text-gray-600">{body}</span>
      </span>
    </label>
  );
}
