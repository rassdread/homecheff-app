'use client';

import { useEffect, useState } from 'react';
import DateOfBirthFields, {
  emptyDateOfBirthParts,
  isoFromParts,
  type DateOfBirthParts,
} from '@/components/account/DateOfBirthFields';
import { useTranslation } from '@/hooks/useTranslation';

type Gate = {
  mode?: string;
  consentRequired?: boolean;
  consent?: { status?: string };
};

/**
 * HomeCheff age and parental-permission step before Stripe onboarding.
 * Copy stays in ordinary language. Stripe requirement keys are not shown.
 */
export default function MinorAccountGate({
  onBlockedChange,
}: {
  onBlockedChange?: (blocked: boolean) => void;
}) {
  const { language } = useTranslation();
  const en = language === 'en';
  const [gate, setGate] = useState<Gate | null>(null);
  const [dob, setDob] = useState<DateOfBirthParts>(emptyDateOfBirthParts());
  const [guardianEmail, setGuardianEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch('/api/account/parental-consent', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as Gate;
    setGate(data);
    const blocked =
      data.mode === 'DOB_REQUIRED' ||
      data.mode === 'BLOCKED_UNDER_13' ||
      Boolean(data.consentRequired);
    onBlockedChange?.(blocked);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!gate) return null;
  if (gate.mode === 'ADULT' || gate.mode === 'LEGACY_ADULT') return null;
  if (gate.mode === 'MINOR' && !gate.consentRequired) return null;

  async function saveDob() {
    const iso = isoFromParts(dob);
    if (!iso) {
      setError(en ? 'Enter your real date of birth.' : 'Vul je echte geboortedatum in.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch('/api/account/date-of-birth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateOfBirth: iso }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || (en ? 'Could not save your date of birth.' : 'Geboortedatum opslaan lukte niet.'));
      return;
    }
    setMessage(en ? 'Date of birth saved.' : 'Geboortedatum opgeslagen.');
    await load();
  }

  async function requestConsent() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/account/parental-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guardianEmail }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError((en && data.messageEn) || data.message || data.error);
      return;
    }
    setMessage((en && data.messageEn) || data.message);
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      {gate.mode === 'BLOCKED_UNDER_13' ? (
        <p>
          {en
            ? 'Selling on HomeCheff is available from age 13.'
            : 'Verkopen op HomeCheff kan vanaf 13 jaar.'}
        </p>
      ) : null}
      {gate.mode === 'DOB_REQUIRED' ? (
        <div>
          <p className="mb-2">
            {en
              ? 'Enter your real date of birth before you sell or set up payments. It stays private and is not shown on your public profile.'
              : 'Vul je echte geboortedatum in voordat je verkoopt of betalingen instelt. Die blijft privé en staat niet op je openbare profiel.'}
          </p>
          <DateOfBirthFields idPrefix="minor-dob" value={dob} onChange={setDob} />
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveDob()}
            className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-white"
          >
            {en ? 'Save date of birth' : 'Geboortedatum opslaan'}
          </button>
        </div>
      ) : null}
      {gate.mode === 'MINOR' && gate.consentRequired ? (
        <div>
          <p className="mb-2">
            {en
              ? 'Because you are under 18, a parent or legal representative needs to give permission before you can sell or set up payments. Delivery stays available from age 18.'
              : 'Omdat je jonger bent dan 18, heeft een ouder of wettelijk vertegenwoordiger eerst toestemming nodig voordat je kunt verkopen of betalingen kunt instellen. Bezorgen kan vanaf 18 jaar.'}
          </p>
          <label className="block text-xs font-medium" htmlFor="guardian-email">
            {en ? 'Their email address' : 'Hun e-mailadres'}
          </label>
          <input
            id="guardian-email"
            type="email"
            value={guardianEmail}
            onChange={(e) => setGuardianEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void requestConsent()}
            className="mt-3 rounded-lg bg-emerald-700 px-3 py-2 text-white"
          >
            {en ? 'Send permission request' : 'Verzoek om toestemming sturen'}
          </button>
        </div>
      ) : null}
      {message ? <p className="mt-2">{message}</p> : null}
      {error ? <p className="mt-2 text-red-700">{error}</p> : null}
    </div>
  );
}
