'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { AUTHORITY_HUB_LINKS } from '@/lib/living-platform/registry';

type FaqItem = { qKey: string; aKey: string };

type Props = {
  ns: string;
  children?: React.ReactNode;
  faqItems?: FaqItem[];
  showAuthorityLinks?: boolean;
};

export default function LivingPlatformPageShell({
  ns,
  children,
  faqItems,
  showAuthorityLinks = true,
}: Props) {
  const { t } = useTranslation();
  const tk = (key: string) => t(`${ns}.${key}`);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{tk('title')}</h1>
        <p className="mt-6 text-lg text-gray-700 leading-relaxed">{tk('intro')}</p>

        {children}

        {showAuthorityLinks ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('livingPlatformShared.authoritySectionTitle')}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {AUTHORITY_HUB_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm text-emerald-800 hover:bg-emerald-50"
                  >
                    {t(`livingPlatformShared.${link.labelKey}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {faqItems && faqItems.length > 0 ? (
          <section className="mt-14 border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-semibold text-gray-900">{tk('faqBlockTitle')}</h2>
            <dl className="mt-6 space-y-6">
              {faqItems.map(({ qKey, aKey }) => (
                <div key={qKey}>
                  <dt className="font-semibold text-gray-900">{tk(qKey)}</dt>
                  <dd className="mt-2 text-gray-700 leading-relaxed">{tk(aKey)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <p className="mt-10 text-sm text-gray-500">
          {tk('lastReviewedLabel')}: {tk('lastReviewedDate')}
        </p>
      </article>
    </main>
  );
}
