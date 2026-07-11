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
  | { type: 'linkRow'; links: SeoLandingLink[]; labelNs?: string }
  | { type: 'steps'; titleKey: string; stepKeys: string[] }
  | { type: 'mistakes'; titleKey: string; bodyKey: string }
  | {
      type: 'faq';
      /** i18n-namespace met `faqBlockTitle`, `faq1Q`, `faq1A`, … — default: page `ns` */
      faqNs?: string;
      items: { qKey: string; aKey: string }[];
    }
  | {
      type: 'comparisonTable';
      titleKey: string;
      sharedNs: string;
      rows: {
        dimensionKey: string;
        competitorKey: string;
        homecheffKey: string;
      }[];
    }
  | {
      type: 'glossary';
      titleKey: string;
      items: { termKey: string; defKey: string; shortDefKey?: string }[];
    }
  | { type: 'pressFacts'; titleKey: string; factKeys: string[] }
  | { type: 'lastReviewed'; sharedNs: string }
  | { type: 'cta' };

type Props = {
  ns: string;
  blocks: SeoLandingBlock[];
  /** Vervangt `{{key}}` in vertaalde strings (bijv. city-pagina’s). */
  interpolation?: Record<string, string>;
  /** Phase 13S — optional food identity reconciliation after intro */
  foodContextVariant?: 0 | 1 | 2;
  /** Breadcrumb + WebPage schema */
  pagePath?: string;
  breadcrumbItems?: Array<{ nameKey: string; path: string; ns?: string }>;
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
  foodContextVariant,
  pagePath,
  breadcrumbItems,
}: Props) {
  const { t, language } = useTranslation();
  const tk = (key: string) =>
    applyInterpolation(t(`${ns}.${key}`), interpolation);
  const sk = (sharedNs: string, key: string) =>
    applyInterpolation(t(`${sharedNs}.${key}`), interpolation);

  const faqLdPayload = useMemo(() => {
    const rows: { faqNs: string; qKey: string; aKey: string }[] = [];
    for (const b of blocks) {
      if (b.type === 'faq') {
        const faqNs = b.faqNs ?? ns;
        for (const it of b.items) {
          rows.push({ faqNs, qKey: it.qKey, aKey: it.aKey });
        }
      }
    }
    return rows;
  }, [blocks, ns]);

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

  const webPageLdJson = useMemo(() => {
    if (!pagePath) return null;
    const lang = language === 'en' ? 'en' : 'nl';
    const domain =
      typeof document !== 'undefined'
        ? document.documentElement.getAttribute('data-domain') || 'https://homecheff.eu'
        : 'https://homecheff.eu';
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: tk('title'),
      description: tk('intro').slice(0, 300),
      url: `${domain}${pagePath}`,
      inLanguage: lang === 'en' ? 'en-US' : 'nl-NL',
      isPartOf: { '@id': `${domain}/#website` },
      publisher: { '@id': `${domain}/#organization` },
      dateModified: '2026-07-11',
    });
  }, [language, pagePath, t, ns, interpolation]);

  const breadcrumbLdJson = useMemo(() => {
    if (!pagePath || !breadcrumbItems?.length) return null;
    const domain =
      typeof document !== 'undefined'
        ? document.documentElement.getAttribute('data-domain') || 'https://homecheff.eu'
        : 'https://homecheff.eu';
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.ns ? sk(item.ns, item.nameKey) : tk(item.nameKey),
        item: `${domain}${item.path}`,
      })),
    });
  }, [breadcrumbItems, pagePath, t, ns, interpolation]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/80 to-white">
      {faqLdJson ? (
        <Script
          id={`seo-faq-ld-${ns}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: faqLdJson }}
        />
      ) : null}
      {webPageLdJson ? (
        <Script
          id={`seo-wp-ld-${ns}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: webPageLdJson }}
        />
      ) : null}
      {breadcrumbLdJson ? (
        <Script
          id={`seo-bc-ld-${ns}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: breadcrumbLdJson }}
        />
      ) : null}
      <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          {tk('title')}
        </h1>
        <p className="mt-6 text-lg text-gray-700 leading-relaxed">{tk('intro')}</p>

        {foodContextVariant != null ? (
          <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm leading-relaxed text-gray-700">
            {sk(`foodCategoryContextV${foodContextVariant}`, 'body')}
            <Link href="/wat-is-homecheff" className="font-medium text-emerald-800 underline-offset-2 hover:underline">
              {sk('foodCategoryContextShared', 'linkPlatform')}
            </Link>
            {' · '}
            <Link href="/hoe-homecheff-werkt" className="font-medium text-emerald-800 underline-offset-2 hover:underline">
              {sk('foodCategoryContextShared', 'linkEcosystem')}
            </Link>
          </p>
        ) : null}

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
            const lk = (key: string) =>
              applyInterpolation(
                t(`${b.labelNs ?? ns}.${key}`),
                interpolation,
              );
            return (
              <div key={i} className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {b.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="font-medium text-emerald-700 underline-offset-2 hover:underline"
                  >
                    {lk(l.labelKey)}
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
            const faqNs = b.faqNs ?? ns;
            const fq = (key: string) =>
              applyInterpolation(t(`${faqNs}.${key}`), interpolation);
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
          if (b.type === 'comparisonTable') {
            return (
              <section key={i} className="mt-12 overflow-x-auto">
                <h2 className="text-2xl font-semibold text-gray-900">{tk(b.titleKey)}</h2>
                <table className="mt-4 w-full min-w-[520px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 font-semibold text-gray-900">
                        {sk(b.sharedNs, 'tableDimension')}
                      </th>
                      <th className="px-3 py-2 font-semibold text-gray-900">
                        {sk(b.sharedNs, 'tableCompetitor')}
                      </th>
                      <th className="px-3 py-2 font-semibold text-gray-900">
                        {sk(b.sharedNs, 'tableHomeCheff')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row) => (
                      <tr key={row.dimensionKey} className="border-b border-gray-100">
                        <th className="px-3 py-2 font-medium text-gray-900">
                          {sk(b.sharedNs, row.dimensionKey)}
                        </th>
                        <td className="px-3 py-2 text-gray-700">{tk(row.competitorKey)}</td>
                        <td className="px-3 py-2 text-gray-700">{tk(row.homecheffKey)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          }
          if (b.type === 'glossary') {
            return (
              <section key={i} className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900">{tk(b.titleKey)}</h2>
                <dl className="mt-4 space-y-4">
                  {b.items.map(({ termKey, defKey, shortDefKey }) => (
                    <div key={termKey}>
                      <dt className="font-semibold text-gray-900">{tk(termKey)}</dt>
                      <dd className="mt-1 text-gray-700 leading-relaxed">
                        {shortDefKey ? (
                          <p className="text-sm font-medium text-gray-600">{tk(shortDefKey)}</p>
                        ) : null}
                        <p className={shortDefKey ? 'mt-2' : undefined}>{tk(defKey)}</p>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          }
          if (b.type === 'pressFacts') {
            return (
              <section key={i} className="mt-12 rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-2xl font-semibold text-gray-900">{tk(b.titleKey)}</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700 leading-relaxed">
                  {b.factKeys.map((fk) => (
                    <li key={fk}>{tk(fk)}</li>
                  ))}
                </ul>
              </section>
            );
          }
          if (b.type === 'lastReviewed') {
            return (
              <p key={i} className="mt-10 text-sm text-gray-500">
                {sk(b.sharedNs, 'lastReviewedLabel')}: {sk(b.sharedNs, 'lastReviewedDate')}
              </p>
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
