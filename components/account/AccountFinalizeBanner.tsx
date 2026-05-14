'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserBootstrap } from '@/components/user/UserBootstrapProvider';
import type { AccountRequirementsSnapshot } from '@/lib/account-requirements';

function pathSkipsUsernameBanner(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/register')) return true;
  if (pathname.startsWith('/auth/')) return true;
  if (pathname.startsWith('/verify-email')) return true;
  if (pathname.startsWith('/profile')) return true;
  if (pathname.startsWith('/onboarding/')) return true;
  return false;
}

export default function AccountFinalizeBanner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { profile } = useUserBootstrap();

  const ar = profile?.accountRequirements as AccountRequirementsSnapshot | undefined;
  const needsUsername = ar?.missing?.some((m) => m.key === 'username');

  if (!needsUsername || pathSkipsUsernameBanner(pathname)) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
      <p className="font-medium">{t('accountRequirementsGate.subtitleUsername')}</p>
      <Link
        href="/profile"
        className="mt-2 inline-block font-semibold text-emerald-800 underline underline-offset-2"
      >
        {t('accountRequirementsGate.cta')}
      </Link>
    </div>
  );
}
