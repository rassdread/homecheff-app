import Link from 'next/link';
import {
  ECOSYSTEM_LOOP,
  ECOSYSTEM_PUBLIC_URLS,
} from '@/lib/seo/ecosystem-participation';
import {
  ecosystemParticipationPage,
  growthLandingPage,
  studioLandingPage,
} from '@/lib/i18n/ecosystemParticipationSources';
import { tBi } from '@/lib/seo/buildEcosystemParticipationMetadata';
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from '@/lib/seo/schema-builders';
import { MAIN_DOMAIN } from '@/lib/seo/metadata';
import JsonLdScript from '@/components/seo/JsonLdScript';

type Lang = 'nl' | 'en';
type Variant = 'ecosystem' | 'studio' | 'growth';

const card =
  'rounded-2xl border border-emerald-100/80 bg-white/90 p-5 shadow-sm sm:p-6';
const ctaPrimary =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800';
const ctaSecondary =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50';

export function EcosystemParticipationLanding({
  variant,
  lang,
}: {
  variant: Variant;
  lang: Lang;
}) {
  if (variant === 'ecosystem') {
    const s = ecosystemParticipationPage;
    const title = tBi(s.heroTitle, lang);
    const description = tBi(s.metaDescription, lang);
    const breadcrumbs = buildBreadcrumbJsonLd({
      domain: MAIN_DOMAIN,
      items: [
        { name: 'HomeCheff', path: '/' },
        { name: lang === 'nl' ? 'Ecosysteem' : 'Ecosystem', path: '/ecosystem' },
      ],
    });
    const webpage = buildWebPageJsonLd({
      domain: MAIN_DOMAIN,
      lang,
      path: '/ecosystem',
      name: tBi(s.metaTitle, lang),
      description,
    });

    const roles = [
      s.roleMaker,
      s.roleService,
      s.roleCreator,
      s.roleBusiness,
      s.rolePromoter,
      s.rolePartner,
    ];

    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <JsonLdScript id="ecosystem-webpage" data={webpage} />
        <JsonLdScript id="ecosystem-breadcrumb" data={breadcrumbs} />

        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
          {tBi(s.heroKicker, lang)}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          HomeCheff — {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          {tBi(s.heroBody, lang)}
        </p>

        <section className={`mt-10 ${card}`} aria-labelledby="ecosystem-idea">
          <h2 id="ecosystem-idea" className="text-xl font-bold text-slate-900">
            {tBi(s.ideaTitle, lang)}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {tBi(s.ideaBody, lang)}
          </p>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section className={card} aria-labelledby="ecosystem-create">
            <h2 id="ecosystem-create" className="text-lg font-bold text-slate-900">
              {tBi(s.createTitle, lang)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {tBi(s.createBody, lang)}
            </p>
            <Link href={ECOSYSTEM_PUBLIC_URLS.studioLanding} className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline">
              {tBi(s.ctaStudio, lang)}
            </Link>
          </section>
          <section className={card} aria-labelledby="ecosystem-sell">
            <h2 id="ecosystem-sell" className="text-lg font-bold text-slate-900">
              {tBi(s.sellTitle, lang)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {tBi(s.sellBody, lang)}
            </p>
            <a href={ECOSYSTEM_PUBLIC_URLS.marketplace} className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline">
              {tBi(s.ctaMarketplace, lang)}
            </a>
          </section>
          <section className={card} aria-labelledby="ecosystem-grow">
            <h2 id="ecosystem-grow" className="text-lg font-bold text-slate-900">
              {tBi(s.growTitle, lang)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {tBi(s.growBody, lang)}
            </p>
            <Link href={ECOSYSTEM_PUBLIC_URLS.growthLanding} className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline">
              {tBi(s.ctaGrowth, lang)}
            </Link>
          </section>
          <section className={card} aria-labelledby="ecosystem-promote">
            <h2 id="ecosystem-promote" className="text-lg font-bold text-slate-900">
              {tBi(s.promoteTitle, lang)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {tBi(s.promoteBody, lang)}
            </p>
            <Link href={ECOSYSTEM_PUBLIC_URLS.affiliate} className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline">
              {tBi(s.ctaAffiliate, lang)}
            </Link>
          </section>
        </div>

        <section className={`mt-6 ${card}`} aria-labelledby="ecosystem-earn">
          <h2 id="ecosystem-earn" className="text-xl font-bold text-slate-900">
            {tBi(s.earnTitle, lang)}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {tBi(s.earnBody, lang)}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {roles.map((role) => (
              <li
                key={role.nl}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {tBi(role, lang)}
              </li>
            ))}
          </ul>
        </section>

        <section className={`mt-6 ${card}`} aria-labelledby="ecosystem-loop">
          <h2 id="ecosystem-loop" className="text-xl font-bold text-slate-900">
            {tBi(s.loopTitle, lang)}
          </h2>
          <p className="mt-3 font-semibold tracking-wide text-emerald-900">
            {ECOSYSTEM_LOOP}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {tBi(s.loopBody, lang)}
          </p>
        </section>

        <section className="mt-10" aria-labelledby="ecosystem-start">
          <h2 id="ecosystem-start" className="text-xl font-bold text-slate-900">
            {tBi(s.startTitle, lang)}
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={ECOSYSTEM_PUBLIC_URLS.marketplace} className={ctaPrimary}>
              {tBi(s.ctaMarketplace, lang)}
            </a>
            <a href={ECOSYSTEM_PUBLIC_URLS.studioApp} className={ctaSecondary}>
              {tBi(s.ctaStudio, lang)}
            </a>
            <a href={ECOSYSTEM_PUBLIC_URLS.growthApp} className={ctaSecondary}>
              {tBi(s.ctaGrowth, lang)}
            </a>
            <Link href={ECOSYSTEM_PUBLIC_URLS.affiliate} className={ctaSecondary}>
              {tBi(s.ctaAffiliate, lang)}
            </Link>
            <Link href={ECOSYSTEM_PUBLIC_URLS.about} className={ctaSecondary}>
              {tBi(s.ctaAbout, lang)}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (variant === 'studio') {
    const s = studioLandingPage;
    const breadcrumbs = buildBreadcrumbJsonLd({
      domain: MAIN_DOMAIN,
      items: [
        { name: 'HomeCheff', path: '/' },
        { name: lang === 'nl' ? 'Ecosysteem' : 'Ecosystem', path: '/ecosystem' },
        { name: 'Studio', path: '/studio' },
      ],
    });
    const webpage = buildWebPageJsonLd({
      domain: MAIN_DOMAIN,
      lang,
      path: '/studio',
      name: tBi(s.metaTitle, lang),
      description: tBi(s.metaDescription, lang),
    });

    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <JsonLdScript id="studio-landing-webpage" data={webpage} />
        <JsonLdScript id="studio-landing-breadcrumb" data={breadcrumbs} />
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
          {tBi(s.heroKicker, lang)}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {tBi(s.heroTitle, lang)}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          {tBi(s.heroBody, lang)}
        </p>
        <section className={`mt-8 ${card}`}>
          <h2 className="text-lg font-bold text-slate-900">{tBi(s.forTitle, lang)}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{tBi(s.forBody, lang)}</p>
        </section>
        <section className={`mt-4 ${card}`}>
          <h2 className="text-lg font-bold text-slate-900">{tBi(s.whatTitle, lang)}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{tBi(s.whatBody, lang)}</p>
        </section>
        <section className={`mt-4 ${card}`}>
          <h2 className="text-lg font-bold text-slate-900">{tBi(s.connectTitle, lang)}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{tBi(s.connectBody, lang)}</p>
          <p className="mt-3 text-sm font-semibold text-emerald-900">{ECOSYSTEM_LOOP}</p>
        </section>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a href={ECOSYSTEM_PUBLIC_URLS.studioApp} className={ctaPrimary}>
            {tBi(s.ctaPrimary, lang)}
          </a>
          <Link href={ECOSYSTEM_PUBLIC_URLS.ecosystem} className={ctaSecondary}>
            {tBi(s.ctaEcosystem, lang)}
          </Link>
          <a href={ECOSYSTEM_PUBLIC_URLS.marketplace} className={ctaSecondary}>
            {tBi(s.ctaMarketplace, lang)}
          </a>
          <Link href={ECOSYSTEM_PUBLIC_URLS.growthLanding} className={ctaSecondary}>
            {tBi(s.ctaGrowth, lang)}
          </Link>
        </div>
      </main>
    );
  }

  const s = growthLandingPage;
  const breadcrumbs = buildBreadcrumbJsonLd({
    domain: MAIN_DOMAIN,
    items: [
      { name: 'HomeCheff', path: '/' },
      { name: lang === 'nl' ? 'Ecosysteem' : 'Ecosystem', path: '/ecosystem' },
      { name: 'Growth', path: '/growth' },
    ],
  });
  const webpage = buildWebPageJsonLd({
    domain: MAIN_DOMAIN,
    lang,
    path: '/growth',
    name: tBi(s.metaTitle, lang),
    description: tBi(s.metaDescription, lang),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLdScript id="growth-landing-webpage" data={webpage} />
      <JsonLdScript id="growth-landing-breadcrumb" data={breadcrumbs} />
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
        {tBi(s.heroKicker, lang)}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {tBi(s.heroTitle, lang)}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
        {tBi(s.heroBody, lang)}
      </p>
      <section className={`mt-8 ${card}`}>
        <h2 className="text-lg font-bold text-slate-900">{tBi(s.forTitle, lang)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{tBi(s.forBody, lang)}</p>
      </section>
      <section className={`mt-4 ${card}`}>
        <h2 className="text-lg font-bold text-slate-900">{tBi(s.whatTitle, lang)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{tBi(s.whatBody, lang)}</p>
      </section>
      <section className={`mt-4 ${card}`}>
        <h2 className="text-lg font-bold text-slate-900">{tBi(s.connectTitle, lang)}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{tBi(s.connectBody, lang)}</p>
        <p className="mt-3 text-sm font-semibold text-emerald-900">{ECOSYSTEM_LOOP}</p>
      </section>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a href={ECOSYSTEM_PUBLIC_URLS.growthApp} className={ctaPrimary}>
          {tBi(s.ctaPrimary, lang)}
        </a>
        <Link href={ECOSYSTEM_PUBLIC_URLS.ecosystem} className={ctaSecondary}>
          {tBi(s.ctaEcosystem, lang)}
        </Link>
        <a href={ECOSYSTEM_PUBLIC_URLS.marketplace} className={ctaSecondary}>
          {tBi(s.ctaMarketplace, lang)}
        </a>
        <Link href={ECOSYSTEM_PUBLIC_URLS.studioLanding} className={ctaSecondary}>
          {tBi(s.ctaStudio, lang)}
        </Link>
      </div>
    </main>
  );
}
