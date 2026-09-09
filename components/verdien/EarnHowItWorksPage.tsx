'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import EcosystemShareAction from '@/components/share/EcosystemShareAction';
import { useTranslation } from '@/hooks/useTranslation';
import {
  getEarnHowItWorksCopy,
  type EarnHowItWorksCopy,
  type EarnHowItWorksLang,
} from '@/lib/i18n/earnHowItWorksSources';

type Props = {
  copy: EarnHowItWorksCopy;
  initialLang: EarnHowItWorksLang;
};

function FlowSteps({
  steps,
}: {
  steps: string[];
}) {
  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex min-h-[44px] items-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm">
            {label}
          </span>
          {i < steps.length - 1 ? (
            <>
              <ArrowDown className="h-4 w-4 shrink-0 text-emerald-600 sm:hidden" aria-hidden />
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-emerald-600 sm:block" aria-hidden />
            </>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 md:p-8"
    >
      <h2 id={`${id}-heading`} className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function EarnHowItWorksPage({ copy: serverCopy, initialLang }: Props) {
  const { language, isReady } = useTranslation();
  const { data: session, status } = useSession();

  const copy = useMemo(() => {
    if (isReady && (language === 'en' || language === 'nl')) {
      return getEarnHowItWorksCopy(language);
    }
    return serverCopy;
  }, [isReady, language, serverCopy]);

  const showDashboard =
    status === 'authenticated' && Boolean(session?.user);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 md:py-14">
        <header className="mb-10 text-center md:mb-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {copy.hero.eyebrow}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {copy.hero.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            {copy.hero.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/werken-bij"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              {copy.hero.ctaOpportunities}
            </Link>
            <Link
              href="/affiliate"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
            >
              {copy.hero.ctaAffiliate}
            </Link>
            {showDashboard ? (
              <Link
                href="/affiliate/dashboard"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                {copy.hero.ctaDashboard}
              </Link>
            ) : null}
          </div>
        </header>

        <div className="flex flex-col gap-6 md:gap-8">
          <Section id="fundamentals" title={copy.fundamentals.title}>
            <p className="font-medium text-slate-900">{copy.fundamentals.lead}</p>
            <FlowSteps
              steps={[
                copy.fundamentals.flowCustomer,
                copy.fundamentals.flowPlatform,
                copy.fundamentals.flowPool,
                copy.fundamentals.flowReward,
              ]}
            />
            <p>{copy.fundamentals.note}</p>
          </Section>

          <Section id="marketplace" title={copy.marketplace.title}>
            <p>{copy.marketplace.intro}</p>
            <p>{copy.marketplace.checkoutNote}</p>
            <p>{copy.marketplace.directNote}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{copy.marketplace.individual}</li>
              <li>{copy.marketplace.basic}</li>
              <li>{copy.marketplace.pro}</li>
              <li>{copy.marketplace.premium}</li>
            </ul>
            <p className="text-slate-500">{copy.marketplace.stripeNote}</p>
          </Section>

          <Section id="marketplace-affiliate" title={copy.marketplaceAffiliate.title}>
            <p className="font-semibold text-slate-900">{copy.marketplaceAffiliate.basis}</p>
            <p>{copy.marketplaceAffiliate.notOrder}</p>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
              <h3 className="font-semibold text-emerald-950">
                {copy.marketplaceAffiliate.exampleTitle}
              </h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-emerald-950/90">
                <li>{copy.marketplaceAffiliate.exampleSale}</li>
                <li>{copy.marketplaceAffiliate.exampleFee}</li>
                <li>{copy.marketplaceAffiliate.examplePool}</li>
              </ol>
              <p className="mt-3 text-sm">{copy.marketplaceAffiliate.exampleClarify}</p>
            </div>
            <p>{copy.marketplaceAffiliate.attribution}</p>
          </Section>

          <Section id="main-sub" title={copy.mainSub.title}>
            <p>{copy.mainSub.description}</p>
            <ul className="list-disc space-y-1 pl-5 font-medium">
              <li>{copy.mainSub.sub}</li>
              <li>{copy.mainSub.main}</li>
              <li>{copy.mainSub.combined}</li>
            </ul>
            <p>{copy.mainSub.clarify}</p>
            <p>{copy.mainSub.availability}</p>
          </Section>

          <Section id="delivery" title={copy.delivery.title}>
            <p>{copy.delivery.age}</p>
            <p>{copy.delivery.fee}</p>
            <p>{copy.delivery.affiliate}</p>
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4">
              <ul className="list-disc space-y-1 pl-5">
                <li>{copy.delivery.exampleGross}</li>
                <li>{copy.delivery.exampleFee}</li>
                <li>{copy.delivery.examplePool}</li>
              </ul>
            </div>
            <p>{copy.delivery.notCourier}</p>
          </Section>

          <Section id="growth" title={copy.growth.title}>
            <p>{copy.growth.intro}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{copy.growth.free}</li>
              <li>{copy.growth.starter}</li>
              <li>{copy.growth.pro}</li>
              <li>{copy.growth.business}</li>
              <li>{copy.growth.enterprise}</li>
            </ul>
            <p className="font-medium">{copy.growth.rewardDirect}</p>
            <p>{copy.growth.rewardMainSub}</p>
            <p>{copy.growth.duration}</p>
            <p>{copy.growth.packs}</p>
            <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-4">
              <ul className="list-disc space-y-1 pl-5">
                <li>{copy.growth.exampleStarter}</li>
                <li>{copy.growth.examplePro}</li>
              </ul>
            </div>
            <p className="text-slate-500">{copy.growth.payoutNote}</p>
          </Section>

          <Section id="studio" title={copy.studio.title}>
            <p>{copy.studio.intro}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{copy.studio.creator}</li>
              <li>{copy.studio.pro}</li>
              <li>{copy.studio.studio}</li>
              <li>{copy.studio.annual}</li>
            </ul>
            <p className="font-medium">{copy.studio.reward}</p>
            <p>{copy.studio.residualExplain}</p>
            <p>{copy.studio.notSticker}</p>
            <p>{copy.studio.duration}</p>
            <FlowSteps
              steps={[
                copy.studio.flowPayment,
                copy.studio.flowResidual,
                copy.studio.flowShare,
              ]}
            />
          </Section>

          <Section id="personal-company" title={copy.personalCompany.title}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="font-semibold text-slate-900">
                  {copy.personalCompany.personalTitle}
                </h3>
                <p className="mt-2">{copy.personalCompany.personalBody}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="font-semibold text-slate-900">
                  {copy.personalCompany.companyTitle}
                </h3>
                <p className="mt-2">{copy.personalCompany.companyBody}</p>
              </div>
            </div>
            <p>{copy.personalCompany.sameRates}</p>
          </Section>

          <Section id="windows" title={copy.windows.title}>
            <p className="font-medium text-slate-900">{copy.windows.lead}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{copy.windows.cookie}</li>
              <li>{copy.windows.marketplace}</li>
              <li>{copy.windows.growth}</li>
              <li>{copy.windows.studio}</li>
            </ul>
            <p>{copy.windows.notLifetime}</p>
          </Section>

          <Section id="payout" title={copy.payout.title}>
            <ul className="list-disc space-y-1 pl-5">
              <li>{copy.payout.marketplaceMin}</li>
              <li>{copy.payout.marketplaceHold}</li>
              <li>{copy.payout.method}</li>
            </ul>
            <p>{copy.payout.human}</p>
            <p>{copy.payout.productSpecific}</p>
          </Section>

          <Section id="comparison" title={copy.comparison.title}>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {copy.comparison.colPlatform}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {copy.comparison.colPromote}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {copy.comparison.colBasis}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {copy.comparison.colReward}
                    </th>
                    <th scope="col" className="py-2 font-semibold">
                      {copy.comparison.colDuration}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {copy.comparison.rows.map((row) => (
                    <tr key={row.platform} className="border-b border-slate-100 align-top">
                      <th scope="row" className="py-3 pr-3 font-semibold text-slate-900">
                        {row.platform}
                      </th>
                      <td className="py-3 pr-3">{row.promote}</td>
                      <td className="py-3 pr-3">{row.basis}</td>
                      <td className="py-3 pr-3">{row.reward}</td>
                      <td className="py-3">{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="grid gap-3 md:hidden">
              {copy.comparison.rows.map((row) => (
                <li
                  key={row.platform}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <p className="font-semibold text-slate-900">{row.platform}</p>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div>
                      <dt className="inline font-medium text-slate-600">
                        {copy.comparison.colPromote}:{' '}
                      </dt>
                      <dd className="inline">{row.promote}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-slate-600">
                        {copy.comparison.colBasis}:{' '}
                      </dt>
                      <dd className="inline">{row.basis}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-slate-600">
                        {copy.comparison.colReward}:{' '}
                      </dt>
                      <dd className="inline">{row.reward}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-slate-600">
                        {copy.comparison.colDuration}:{' '}
                      </dt>
                      <dd className="inline">{row.duration}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="examples" title={copy.examples.title}>
            <p className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-amber-950">
              {copy.examples.disclaimer}
            </p>
          </Section>

          <Section id="international" title={copy.international.title}>
            <p>{copy.international.body}</p>
          </Section>

          <section
            aria-labelledby="share-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-6"
          >
            <h2 id="share-heading" className="text-lg font-bold text-slate-900">
              {copy.share.title}
            </h2>
            <div className="mt-4 flex justify-center">
              <EcosystemShareAction
                destinationHref="/werken-bij/hoe-werkt-het"
                title={copy.hero.title}
                text={copy.share.text}
                surface="earn_how_it_works"
                product="marketplace"
                opportunityId="hub"
                label={copy.share.label}
                variant="button"
              />
            </div>
          </section>
        </div>

        <p className="sr-only" data-earn-lang={initialLang}>
          earn-how-it-works
        </p>
      </div>
    </div>
  );
}
