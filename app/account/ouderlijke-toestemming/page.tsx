'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legal/document-versions';
import {
  PARENTAL_CONSENT_TEXT_VERSION,
  parentalConsentPageCopy,
  type ConsentPageCopy,
  type GuardianLanguage,
  type GuardianRelationship,
} from '@/lib/age/parental-consent-copy';

type Preview = {
  purpose?: 'accept' | 'revoke';
  minorName?: string | null;
  username?: string | null;
  ageYears?: number | null;
};

type LangChoice = 'both' | GuardianLanguage;

function identityLine(copy: ConsentPageCopy, preview: Preview, en: boolean): string {
  const name = preview.minorName || (preview.username ? `@${preview.username}` : en ? 'this minor' : 'deze minderjarige');
  const age =
    typeof preview.ageYears === 'number'
      ? en
        ? `, age ${preview.ageYears}`
        : `, ${preview.ageYears} jaar`
      : '';
  const handle = preview.minorName && preview.username ? ` (@${preview.username})` : '';
  return `${name}${handle}${age}`;
}

function Explanation({ copy, preview, en }: { copy: ConsentPageCopy; preview: Preview; en: boolean }) {
  return (
    <section className="mt-6 space-y-3 text-sm leading-6 text-gray-800">
      <p className="font-medium text-gray-950">{identityLine(copy, preview, en)}</p>
      <p>{copy.homeCheff}</p>
      <p>{copy.wants}</p>
      <p>{copy.coversIntro}</p>
      <ol className="list-decimal space-y-1 pl-5">
        {copy.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ol>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="font-medium text-emerald-950">{copy.stripeTitle}</p>
        <p className="mt-1">{copy.stripeBody}</p>
      </div>
      <p>{copy.notClaims}</p>
      <p>{copy.delivery}</p>
      <p>{copy.withdraw}</p>
      <p>
        <a className="text-emerald-800 underline" href="/terms">
          {copy.terms}
        </a>
        {' · '}
        <a className="text-emerald-800 underline" href="/privacy">
          {copy.privacy}
        </a>
      </p>
      <p className="text-xs text-gray-500">
        {copy.versions(TERMS_VERSION, PRIVACY_VERSION, PARENTAL_CONSENT_TEXT_VERSION)}
      </p>
    </section>
  );
}

function ConsentBody() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const revoke = params.get('revoke') || '';
  const [lang, setLang] = useState<LangChoice>('both');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [relationship, setRelationship] = useState<GuardianRelationship | ''>('');
  const [otherAuthority, setOtherAuthority] = useState('');
  const [authority, setAuthority] = useState(false);
  const [informed, setInformed] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState(false);

  const nl = parentalConsentPageCopy('nl');
  const en = parentalConsentPageCopy('en');
  const primary = lang === 'en' ? en : nl;
  const showEn = lang === 'en' || lang === 'both';
  const showNl = lang === 'nl' || lang === 'both';

  useEffect(() => {
    if (!token && !revoke) {
      setPreviewError('Deze link is ongeldig. / This link is invalid.');
      return;
    }
    let cancelled = false;
    void fetch('/api/account/parental-consent/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(token ? { token } : { revokeToken: revoke }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setPreviewError(data.message && data.messageEn ? `${data.message} ${data.messageEn}` : 'Deze link is ongeldig. / This link is invalid.');
          return;
        }
        setPreview(data as Preview);
      })
      .catch(() => {
        if (!cancelled) setPreviewError('Deze link is ongeldig. / This link is invalid.');
      });
    return () => {
      cancelled = true;
    };
  }, [token, revoke]);

  async function submit(kind: 'accept' | 'revoke') {
    setBusy(true);
    setError(null);
    const guardianLanguage = lang === 'both' ? undefined : lang;
    const res = await fetch(
      kind === 'accept' ? '/api/account/parental-consent/accept' : '/api/account/parental-consent/revoke',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          kind === 'accept'
            ? {
                token,
                guardianName,
                relationship,
                otherAuthority: relationship === 'other' ? otherAuthority : undefined,
                legalAuthorityDeclaration: authority,
                informedConsent: informed,
                guardianLanguage,
              }
            : { token: revoke, guardianLanguage },
        ),
      },
    );
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const nlMsg = typeof data.message === 'string' ? data.message : '';
      const enMsg = typeof data.messageEn === 'string' ? data.messageEn : '';
      setError([nlMsg, enMsg].filter(Boolean).join(' ') || 'Dit is niet gelukt. / This did not work.');
      return;
    }
    const nlMsg = typeof data.message === 'string' ? data.message : '';
    const enMsg = typeof data.messageEn === 'string' ? data.messageEn : '';
    setMessage(lang === 'en' ? enMsg || nlMsg : lang === 'nl' ? nlMsg || enMsg : [nlMsg, enMsg].filter(Boolean).join(' '));
  }

  const title = revoke ? (lang === 'en' ? en.revokeTitle : nl.revokeTitle) : lang === 'en' ? en.title : nl.title;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex gap-2 text-sm">
        {(['both', 'nl', 'en'] as const).map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => setLang(choice)}
            className={`rounded-full px-3 py-1 ${lang === choice ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-800'}`}
          >
            {choice === 'both' ? 'Beide / Both' : choice === 'nl' ? 'Nederlands' : 'English'}
          </button>
        ))}
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">{title}</h1>
      {previewError ? <p className="mt-4 text-sm text-red-700">{previewError}</p> : null}
      {!preview && !previewError ? <p className="mt-4 text-sm text-gray-500">Laden… / Loading…</p> : null}
      {preview && !message && !declined ? (
        <>
          {showNl && !revoke ? <Explanation copy={nl} preview={preview} en={false} /> : null}
          {showEn && !revoke ? <Explanation copy={en} preview={preview} en /> : null}
          {revoke ? (
            <div className="mt-6 space-y-3 text-sm leading-6 text-gray-800">
              <p className="font-medium">{identityLine(primary, preview, lang === 'en')}</p>
              {showNl ? <p>{nl.revokeBody}</p> : null}
              {showEn ? <p>{en.revokeBody}</p> : null}
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={revokeConfirm}
                  onChange={(event) => setRevokeConfirm(event.target.checked)}
                />
                <span>{lang === 'en' ? en.revokeConfirm : lang === 'nl' ? nl.revokeConfirm : `${nl.revokeConfirm} / ${en.revokeConfirm}`}</span>
              </label>
              <button
                type="button"
                disabled={busy || !revokeConfirm}
                onClick={() => void submit('revoke')}
                className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? '…' : lang === 'en' ? en.revokeSubmit : nl.revokeSubmit}
              </button>
            </div>
          ) : (
            <form
              className="mt-6 space-y-4 text-sm"
              onSubmit={(event) => {
                event.preventDefault();
                void submit('accept');
              }}
            >
              <label className="block">
                <span className="font-medium">{lang === 'both' ? `${nl.nameLabel} / ${en.nameLabel}` : primary.nameLabel}</span>
                <input
                  required
                  autoComplete="name"
                  value={guardianName}
                  onChange={(event) => setGuardianName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="font-medium">
                  {lang === 'both' ? `${nl.relationshipLabel} / ${en.relationshipLabel}` : primary.relationshipLabel}
                </span>
                <select
                  required
                  value={relationship}
                  onChange={(event) => setRelationship(event.target.value as GuardianRelationship | '')}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                >
                  <option value="">{lang === 'en' ? 'Choose' : lang === 'nl' ? 'Kies' : 'Kies / Choose'}</option>
                  {(lang === 'en' ? en.relationships : nl.relationships).map((item, index) => (
                    <option key={item.value} value={item.value}>
                      {lang === 'both' ? `${item.label} / ${en.relationships[index]?.label ?? item.label}` : item.label}
                    </option>
                  ))}
                </select>
              </label>
              {relationship === 'other' ? (
                <label className="block">
                  <span className="font-medium">{lang === 'both' ? `${nl.otherLabel} ${en.otherLabel}` : primary.otherLabel}</span>
                  <textarea
                    required
                    value={otherAuthority}
                    onChange={(event) => setOtherAuthority(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                    rows={3}
                  />
                </label>
              ) : null}
              <label className="flex items-start gap-2 leading-6">
                <input type="checkbox" checked={authority} onChange={(event) => setAuthority(event.target.checked)} />
                <span>{lang === 'en' ? en.declaration : lang === 'nl' ? nl.declaration : nl.declaration}</span>
              </label>
              {lang === 'both' ? <p className="pl-6 text-gray-700">{en.declaration}</p> : null}
              <label className="flex items-start gap-2 leading-6">
                <input type="checkbox" checked={informed} onChange={(event) => setInformed(event.target.checked)} />
                <span>
                  {lang === 'both' ? `${nl.informed} / ${en.informed}` : lang === 'en' ? en.informed : nl.informed}
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={busy || !authority || !informed}
                  className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busy ? '…' : lang === 'en' ? en.submit : nl.submit}
                </button>
                <button
                  type="button"
                  onClick={() => setDeclined(true)}
                  className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800"
                >
                  {lang === 'both' ? `${nl.decline} / ${en.decline}` : lang === 'en' ? en.decline : nl.decline}
                </button>
              </div>
            </form>
          )}
        </>
      ) : null}
      {declined ? (
        <p className="mt-6 text-sm text-gray-800">
          {nl.declineDone} {en.declineDone}
        </p>
      ) : null}
      {message ? <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </main>
  );
}

export default function ParentalConsentPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-2xl px-4 py-12 text-sm text-gray-500">Laden…</main>}>
      <ConsentBody />
    </Suspense>
  );
}
