'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import {
  fetchOnboardingFlags,
  needsProfileOnboardingFromFlags,
  onboardingFlagsFromSessionUser,
} from '@/lib/auth/post-auth-redirect';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

export default function CompleteProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/onboarding/complete-profile');
      return;
    }
    const u = session?.user as {
      username?: string | null;
      name?: string | null;
      socialOnboardingCompleted?: boolean | null;
    };
    if (!u) return;

    void (async () => {
      let flags = await fetchOnboardingFlags();
      if (!flags) {
        await new Promise((r) => setTimeout(r, 400));
        flags = await fetchOnboardingFlags();
      }
      const resolved = flags ?? onboardingFlagsFromSessionUser(u);
      if (!needsProfileOnboardingFromFlags(resolved)) {
        router.replace('/');
        return;
      }
      trackOnboardingEvent('ONBOARDING_STARTED', { surface: 'complete_profile' });
    })();

    const un = String(u.username || '');
    if (!un.startsWith('temp_')) {
      setUsername(un);
    }
    setDisplayName(String(u.name || '').trim());
  }, [router, session?.user, status]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const uTrim = username.trim();
    if (uTrim.length < 3) {
      setError(t('register.validation.usernameRequiredError'));
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError(t('register.mustAcceptPrivacyTerms'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/complete-social-onboarding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionMode: 'minimal',
          username: uTrim,
          displayName: displayName.trim() || undefined,
          acceptedTerms: acceptTerms,
          acceptedPrivacy: acceptPrivacy,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(data?.message || t('register.validation.socialOnboardingError'));
        return;
      }
      trackOnboardingEvent('ONBOARDING_COMPLETED', { surface: 'complete_profile_minimal' });
      await update({});
      await new Promise((r) => setTimeout(r, 400));
      window.location.replace('/?profile_gate=done');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">{t('onboardingProfile.title')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('onboardingProfile.subtitle')}</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">
              {t('onboardingProfile.displayNameLabel')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">
              {t('onboardingProfile.usernameLabel')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900"
              autoComplete="username"
              required
              minLength={3}
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1"
            />
            <span>{t('onboardingProfile.termsLabel')}</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
              className="mt-1"
            />
            <span>{t('onboardingProfile.privacyLabel')}</span>
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? '…' : t('onboardingProfile.submit')}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-slate-600 underline"
          onClick={() => void signOut({ callbackUrl: '/login' })}
        >
          {t('onboardingProfile.signOut')}
        </button>

        <p className="mt-6 text-xs text-slate-500 text-center">
          <Link href="/terms" className="underline">
            {t('register.termsLink')}
          </Link>
          {' · '}
          <Link href="/profile/privacy" className="underline">
            {t('register.privacyStatementLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
