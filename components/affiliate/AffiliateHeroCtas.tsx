'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { savePendingIntent } from '@/lib/onboarding/pending-intent';

export default function AffiliateHeroCtas({ lang }: { lang: 'nl' | 'en' }) {
  const en = lang === 'en';
  const { data: session } = useSession();
  const [isAffiliate, setIsAffiliate] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      setIsAffiliate(false);
      return;
    }
    let cancelled = false;
    fetch('/api/profile/me')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setIsAffiliate(Boolean(data?.user?.affiliate?.id));
      })
      .catch(() => {
        if (!cancelled) setIsAffiliate(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (isAffiliate) {
    return (
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <Link
          href="/affiliate/dashboard"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          {en ? 'Go to my affiliate dashboard' : 'Ga naar mijn affiliate-dashboard'}
        </Link>
        <Link
          href="/affiliate/promotiemateriaal"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          {en ? 'Promotional material' : 'Promotiemateriaal'}
        </Link>
      </div>
    );
  }

  const startClass =
    'inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800';
  const secondaryClass =
    'inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50';

  return (
    <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
      {session?.user ? (
        <a href="#affiliate-signup" className={startClass}>
          {en ? 'Start as an affiliate' : 'Start als affiliate'}
        </a>
      ) : (
        <Link
          href="/register?returnUrl=/affiliate"
          className={startClass}
          onClick={() =>
            savePendingIntent({
              type: 'join_affiliate',
              returnPath: '/affiliate',
              persona: 'affiliate',
            })
          }
        >
          {en ? 'Start as an affiliate' : 'Start als affiliate'}
        </Link>
      )}
      <a href="#commissies" className={secondaryClass}>
        {en ? 'See what you can earn' : 'Bekijk wat je kunt verdienen'}
      </a>
    </div>
  );
}
