'use client';

import { useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  fetchOnboardingFlags,
  onboardingFlagsFromSessionUser,
  resolvePathAfterSocialAuth,
} from '@/lib/auth/post-auth-redirect';

/**
 * Legacy URL `/register?social=true` → canonical onboarding.
 * Google/social users land on `/onboarding/complete-profile` (see post-auth-redirect).
 */
export default function RegisterSocialRedirect() {
  const { t } = useTranslation();

  useEffect(() => {
    void (async () => {
      const session = await getSession();
      let flags = await fetchOnboardingFlags();
      if (!flags) {
        await new Promise((r) => setTimeout(r, 400));
        flags = await fetchOnboardingFlags();
      }
      const resolved =
        flags ??
        onboardingFlagsFromSessionUser(
          (session?.user ?? {}) as {
            username?: string | null;
            socialOnboardingCompleted?: boolean | null;
          },
        );
      window.location.replace(resolvePathAfterSocialAuth(resolved));
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="text-center px-6">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"
          aria-hidden
        />
        <p className="text-gray-700">{t('register.socialRedirect')}</p>
      </div>
    </div>
  );
}
