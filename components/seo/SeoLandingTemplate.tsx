'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export type SeoLandingLink = { href: string; labelKey: string };

export type RichSegment =
  | { type: 'text'; key: string }
  | { type: 'link'; href: string; labelKey: string };

export type SeoLandingBlock =
  | { type: 'section'; titleKey: string; bodyKey: string }
  | {
      type: 'sectionWithLink';
      titleKey: string;
      bodyKey: string;
      href: string;
      linkLabelKey: string;
    }
  | { type: 'paragraph'; bodyKey: string }
  | { type: 'richParagraph'; segments: RichSegment[] }
  | { type: 'linkRow'; links: SeoLandingLink[] }
  | { type: 'steps'; titleKey: string; stepKeys: string[] }
  | { type: 'mistakes'; titleKey: string; bodyKey: string }
  | {
      type: 'faq';
      /** i18n-namespace met `faqBlockTitle`, `faq1Q`, `faq1A`, … */
      faqNs: string;
      items: { qKey: string; aKey: string }[];
    }
  | { type: 'cta' };

type Props = {
  ns: string;
  blocks: SeoLandingBlock[];
  /** Vervangt `{{key}}` in vertaalde strings (bijv. city-pagina’s). */
  interpolation?: Record<string, string>;
};

function applyInterpolation(
  s: string,
  interpolation?: Record<string, string>
): string {
  if (!interpolation) return s;
  let out = s;
  for (const [k, v] of Object.entries(interpolation)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

export default function SeoLandingTemplate({
  ns,
  blocks,
  interpolation,
}: Props) {
  const { t } = useTranslation();
  const tk = (key: string) =>
    applyInterpolation(t(`${ns}.${key}`), interpolation);

  const faqLdPayload = useMemo(() => {
    const rows: { faqNs: string; qKey: string; aKey: string }[] = [];
    for (const b of blocks) {
      if (b.type === 'faq') {
        for (const it of b.items) {
          rows.push({ faqNs: b.faqNs, qKey: it.qKey, aKey: it.aKey });
        }
      }
    }
    return rows;
  }, [blocks]);

  const faqLdJson = useMemo(() => {
    if (faqLdPayload.length === 0) return null;
    const resolve = (faqNs: string, key: string) =>
      applyInterpolation(t(`${faqNs}.${key}`), interpolation);
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqLdPayload.map(({ faqNs, qKey, aKey }) => ({
        '@type': 'Question',
        name: resolve(faqNs, qKey),
        acceptedAnswer: {
          '@type': 'Answer',
          text: resolve(faqNs, aKey),
        },
      })),
    });
  }, [faqLdPayload, interpolation, t]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
      {faqLdJson ? (
        <Script
          id={`seo-faq-ld-${ns}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: faqLdJson }}
        />
      ) : null}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          {tk('title')}
        </h1>
        <p className="mt-6 text-lg text-gray-700 leading-relaxed">{tk('intro')}</p>

        {blocks.map((b, i) => {
          if (b.type === 'section') {
            return (
              <section key={i} className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {tk(b.titleKey)}
                </h2>
                <p className="mt-4 text-gray-700 leading-relaxed">{tk(b.bodyKey)}</p>
              </section>
            );
          }
          if (b.type === 'sectionWithLink') {
            return (
              <section key={i} className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {tk(b.titleKey)}
                </h2>
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
          if (b.type === 'paragraph') {
            return (
              <p key={i} className="mt-4 text-gray-700 leading-relaxed">
                {tk(b.bodyKey)}
              </p>
            );
          }
          if (b.type === 'richParagraph') {
            return (
              <p key={i} className="mt-6 text-gray-700 leading-relaxed">
                {b.segments.map((seg, j) => {
                  if (seg.type === 'text') {
                    return <span key={j}>{tk(seg.key)}</span>;
                  }
                  return (
                    <Link
                      key={j}
                      href={seg.href}
                      className="font-medium text-emerald-800 underline-offset-2 hover:underline"
                    >
                      {tk(seg.labelKey)}
                    </Link>
                  );
                })}
              </p>
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
                <h2 className="text-2xl font-semibold text-gray-900">
                  {tk(b.titleKey)}
                </h2>
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
                <h2 className="text-2xl font-semibold text-gray-900">
                  {tk(b.titleKey)}
                </h2>
                <p className="mt-4 text-gray-700 leading-relaxed">{tk(b.bodyKey)}</p>
              </section>
            );
          }
          if (b.type === 'faq') {
            const fq = (key: string) =>
              applyInterpolation(t(`${b.faqNs}.${key}`), interpolation);
            return (
              <section key={i} className="mt-14 border-t border-gray-200 pt-12">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {fq('faqBlockTitle')}
                </h2>
                <dl className="mt-6 space-y-6">
                  {b.items.map(({ qKey, aKey }) => (
                    <div key={qKey}>
                      <dt className="font-semibold text-gray-900">{fq(qKey)}</dt>
                      <dd className="mt-2 text-gray-700 leading-relaxed">{fq(aKey)}</dd>
                    </div>
                  ))}
                </dl>
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
