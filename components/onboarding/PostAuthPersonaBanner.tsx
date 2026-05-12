'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { PERSONA_HINT_KEY } from '@/lib/onboarding/pending-intent';

const HREF: Record<string, string> = {
  chef: '/sell/new?mode=sale&vertical=chef',
  designer: '/sell/new?mode=sale&vertical=designer',
  grower: '/sell/new?mode=sale&vertical=garden',
  affiliate: '/affiliate',
  explorer: '/#homecheff-feed',
  business: '/sell/new?mode=sale&vertical=chef',
  inspiration: '/sell/new?mode=inspiratie&vertical=chef',
};

const SECONDARY_HREF: Record<string, { href: string; labelKey: string }> = {
  chef: { href: '/#homecheff-feed', labelKey: 'personaBanner.suggested.discover' },
  designer: { href: '/#homecheff-feed', labelKey: 'personaBanner.suggested.discover' },
  grower: { href: '/#homecheff-feed', labelKey: 'personaBanner.suggested.discover' },
  affiliate: { href: '/profile', labelKey: 'personaBanner.suggested.profile' },
  explorer: { href: '/mijn-hcp', labelKey: 'personaBanner.suggested.hcp' },
  business: { href: '/profile', labelKey: 'personaBanner.suggested.profile' },
  inspiration: { href: '/#homecheff-feed', labelKey: 'personaBanner.suggested.feed' },
};

export default function PostAuthPersonaBanner() {
  const { status } = useSession();
  const { t } = useTranslation();
  const [persona, setPersona] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    try {
      const p = sessionStorage.getItem(PERSONA_HINT_KEY)?.trim();
      if (p) setPersona(p);
    } catch {
      /* ignore */
    }
  }, [status]);

  const dismiss = () => {
    try {
      sessionStorage.removeItem(PERSONA_HINT_KEY);
    } catch {
      /* ignore */
    }
    setPersona(null);
  };

  if (!persona) return null;
  const href = HREF[persona] || '/sell/new';
  const welcomeKey = `personaBanner.${persona}.welcome`;
  const welcome = t(welcomeKey);
  const welcomeLine = welcome !== welcomeKey ? welcome : null;
  const secondary = SECONDARY_HREF[persona];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-4">
      <div className="relative flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 pr-12 text-sm text-emerald-950 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          {welcomeLine ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90">
              {welcomeLine}
            </p>
          ) : null}
          <p className="font-medium">{t(`personaBanner.${persona}.teaser`)}</p>
          {secondary ? (
            <p className="text-xs text-emerald-900/85">
              <Link
                href={secondary.href}
                prefetch={false}
                className="font-semibold underline decoration-emerald-400/80 underline-offset-2 hover:text-emerald-950"
              >
                {t(secondary.labelKey)}
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            href={href}
            prefetch={false}
            className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {t(`personaBanner.${persona}.cta`)}
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 rounded-full p-2 text-emerald-800 hover:bg-white/60"
          aria-label={t('buttons.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
