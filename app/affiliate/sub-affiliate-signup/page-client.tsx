'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SubAffiliateSignupClientProps {
  token?: string;
}

export default function SubAffiliateSignupClient({ token }: SubAffiliateSignupClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState(false);
  const [inviterName, setInviterName] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [hasAffiliate, setHasAffiliate] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError(t('affiliate.subAffiliateSignup.noToken'));
      setLoading(false);
      return;
    }

    fetch(`/api/affiliate/validate-invite?token=${encodeURIComponent(token)}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setValid(true);
          setInviterName(data.invite?.parentAffiliateName || '');
          setInviteEmail(data.invite?.email || '');
          setHasAffiliate(Boolean(data.existingUser?.hasAffiliate));
        } else {
          setError(data.error || t('affiliate.subAffiliateSignup.invalidToken'));
        }
      })
      .catch(() => {
        setError(t('affiliate.subAffiliateSignup.error'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, t]);

  const returnPath = `/affiliate/sub-affiliate-signup?token=${encodeURIComponent(token || '')}`;
  const sessionEmail = session?.user?.email?.trim().toLowerCase() || '';
  const invitedEmail = inviteEmail.trim().toLowerCase();
  const emailMatches = Boolean(sessionEmail && invitedEmail && sessionEmail === invitedEmail);

  async function acceptInvite() {
    if (!token) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch('/api/affiliate/accept-partner-invite', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAcceptError(
          data.code === 'ALREADY_AFFILIATE'
            ? t('affiliate.subAffiliateSignup.alreadyAffiliate')
            : data.code === 'EMAIL_MISMATCH'
              ? t('affiliate.subAffiliateSignup.emailMismatch')
              : t('affiliate.subAffiliateSignup.error'),
        );
        return;
      }
      router.push('/affiliate/dashboard');
    } catch {
      setAcceptError(t('affiliate.subAffiliateSignup.error'));
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('affiliate.subAffiliateSignup.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('affiliate.subAffiliateSignup.errorTitle')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/affiliate"
            className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {t('affiliate.subAffiliateSignup.backToAffiliate')}
          </Link>
        </div>
      </div>
    );
  }

  if (!valid) return null;

  const steps = [1, 2, 3, 4] as const;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 py-8 px-4 sm:py-12">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <header className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-emerald-800">HomeCheff</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {t('affiliate.subAffiliateSignup.headline')}
          </h1>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-800">
            {t('affiliate.subAffiliateSignup.rate')}
          </p>
          {inviterName ? (
            <p className="mt-4 text-sm leading-relaxed text-gray-700">
              {t('affiliate.subAffiliateSignup.invitedBy', { name: inviterName })}
            </p>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-gray-700">
              {t('affiliate.subAffiliateSignup.description')}
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-gray-700">
            {t('affiliate.subAffiliateSignup.lead')}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-800">
            {t('affiliate.subAffiliateSignup.rateDetail')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            {t('affiliate.subAffiliateSignup.notOrder')}
          </p>
        </header>

        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900">
            {t('affiliate.subAffiliateSignup.exampleTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            {t('affiliate.subAffiliateSignup.exampleIntro')}
          </p>
          <p className="mt-3 text-lg font-semibold text-emerald-900">
            {t('affiliate.subAffiliateSignup.exampleMath')}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-800">
            <li>{t('affiliate.subAffiliateSignup.examplePurchase')}</li>
            <li>{t('affiliate.subAffiliateSignup.exampleFee')}</li>
            <li>{t('affiliate.subAffiliateSignup.exampleYou')}</li>
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-gray-600">
            {t('affiliate.subAffiliateSignup.exampleNote')}
          </p>
        </section>

        <details className="rounded-2xl bg-white p-5 shadow-sm sm:p-6" open>
          <summary className="cursor-pointer text-base font-semibold text-gray-900">
            {t('affiliate.subAffiliateSignup.howTitle')}
          </summary>
          <ol className="mt-4 space-y-4">
            {steps.map((step) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900">
                  {step}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {t(`affiliate.subAffiliateSignup.step${step}Title`)}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-700">
                    {t(`affiliate.subAffiliateSignup.step${step}`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </details>

        <p className="rounded-2xl bg-white p-5 text-sm leading-relaxed text-gray-700 shadow-sm sm:p-6">
          {t('affiliate.subAffiliateSignup.structure')}
        </p>

        <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          {hasAffiliate ? (
            <p className="text-sm text-gray-700">
              {t('affiliate.subAffiliateSignup.alreadyAffiliate')}
            </p>
          ) : status === 'authenticated' && emailMatches ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void acceptInvite()}
                disabled={accepting}
                className="block w-full min-h-[44px] px-6 py-3 bg-emerald-600 text-white text-center rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60"
              >
                {accepting
                  ? t('affiliate.subAffiliateSignup.accepting')
                  : t('affiliate.subAffiliateSignup.accept')}
              </button>
              {acceptError ? <p className="text-sm text-red-700">{acceptError}</p> : null}
            </div>
          ) : (
            <div className="space-y-3">
              {status === 'authenticated' && !emailMatches ? (
                <p className="text-sm text-gray-700">
                  {t('affiliate.subAffiliateSignup.emailMismatch')}
                </p>
              ) : null}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(returnPath)}`}
                className="block w-full min-h-[44px] px-6 py-3 bg-emerald-600 text-white text-center rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                {t('affiliate.subAffiliateSignup.login')}
              </Link>
              <Link
                href={`/register?inviteToken=${encodeURIComponent(token || '')}`}
                className="block w-full min-h-[44px] px-6 py-3 bg-gray-200 text-gray-800 text-center rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                {t('affiliate.subAffiliateSignup.register')}
              </Link>
              <p className="text-xs leading-relaxed text-gray-500">
                {t('affiliate.subAffiliateSignup.noAccount')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
