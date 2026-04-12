'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export type SeoLandingLink = { href: string; labelKey: string };

export type SeoLandingBlock =
  | { type: 'section'; titleKey: string; bodyKey: string }
  | {
      type: 'sectionWithLink';
      titleKey: string;
      bodyKey: string;
      href: string;
      linkLabelKey: string;
    }
  | { type: 'linkRow'; links: SeoLandingLink[] }
  | { type: 'steps'; titleKey: string; stepKeys: string[] }
  | { type: 'mistakes'; titleKey: string; bodyKey: string }
  | { type: 'cta' };

type Props = {
  ns: string;
  blocks: SeoLandingBlock[];
};

export default function SeoLandingTemplate({ ns, blocks }: Props) {
  const { t } = useTranslation();
  const tk = (key: string) => t(`${ns}.${key}`);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          {tk('title')}
        </h1>
        <p className="mt-6 text-lg text-gray-700 leading-relaxed">{tk('intro')}</p>

        {blocks.map((b, i) => {
          if (b.type === 'section') {
            return (
              <section key={i} className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900">{tk(b.titleKey)}</h2>
                <p className="mt-4 text-gray-700 leading-relaxed">{tk(b.bodyKey)}</p>
              </section>
            );
          }
          if (b.type === 'sectionWithLink') {
            return (
              <section key={i} className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900">{tk(b.titleKey)}</h2>
                <p className="mt-4 text-gray-700 leading-relaxed">{tk(b.bodyKey)}</p>
                <p className="mt-4">
                  <Link
                    href={b.href}
                    className="font-medium text-emerald-700 underline-offset-2 hover:underline"
                  >
                    {tk(b.linkLabelKey)}
                  </Link>
                </p>
              </section>
            );
          }
          if (b.type === 'linkRow') {
            return (
              <div key={i} className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {b.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="font-medium text-emerald-700 underline-offset-2 hover:underline"
                  >
                    {tk(l.labelKey)}
                  </Link>
                ))}
              </div>
            );
          }
          if (b.type === 'steps') {
            return (
              <section key={i} className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900">{tk(b.titleKey)}</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-5 text-gray-700">
                  {b.stepKeys.map((sk) => (
                    <li key={sk}>{tk(sk)}</li>
                  ))}
                </ol>
              </section>
            );
          }
          if (b.type === 'mistakes') {
            return (
              <section key={i} className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900">{tk(b.titleKey)}</h2>
                <p className="mt-4 text-gray-700 leading-relaxed">{tk(b.bodyKey)}</p>
              </section>
            );
          }
          if (b.type === 'cta') {
            return (
              <section
                key={i}
                className="mt-14 rounded-2xl bg-emerald-600 px-6 py-8 text-center text-white shadow-lg"
              >
                <p className="text-xl font-semibold">{tk('cta')}</p>
                <p className="mt-2 text-sm text-emerald-100 sm:text-base">{tk('ctaSub')}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-base font-semibold text-emerald-700 shadow hover:bg-emerald-50"
                  >
                    {t('navigation.register')}
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-3 text-base font-semibold text-white hover:bg-white/10"
                  >
                    {t('navigation.home')}
                  </Link>
                </div>
              </section>
            );
          }
          return null;
        })}
      </article>
    </main>
  );
}
