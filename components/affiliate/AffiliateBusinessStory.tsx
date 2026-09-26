'use client';

import dynamic from 'next/dynamic';
import { useId, useState } from 'react';
import { buildAffiliateCommissionCatalog, type CatalogRow } from '@/lib/affiliate/commission-catalog';
import { NETWORK_CAPABILITY } from '@/lib/affiliate/network-capability';
import {
  JOURNEY_NEW_GROWTH_STARTER_PER_MONTH,
  JOURNEY_RETENTION,
  JOURNEY_STUDIO_CROSS_SELL_RATE,
  JOURNEY_STUDIO_FROM_MONTH,
  SCALE_TARGET_EUR,
  alongsideWorkJourneyStages,
  growthStarterCustomersForMonthlyTarget,
  growthStarterShareCents,
} from '@/lib/affiliate/portfolio-scenario';
import { affiliatePropositionFaqs } from '@/lib/affiliate/proposition-faqs';
import { publicFaqs } from '@/lib/affiliate/program-control';

const AffiliateCommissionCatalog = dynamic(
  () => import('@/components/affiliate/AffiliateCommissionCatalog'),
  { ssr: false },
);
const PortfolioExplorer = dynamic(() => import('@/components/affiliate/PortfolioExplorer'), {
  ssr: false,
});
const AffiliateCountryInterestForm = dynamic(
  () => import('@/components/affiliate/AffiliateCountryInterestForm'),
  { ssr: false },
);

function eur(cents: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

const STAGE_LABELS: Record<number, { nl: string; en: string }> = {
  1: { nl: 'Maand 1', en: 'Month 1' },
  3: { nl: 'Maand 3', en: 'Month 3' },
  6: { nl: 'Maand 6', en: 'Month 6' },
  12: { nl: 'Maand 12', en: 'Month 12' },
  24: { nl: 'Jaar 2', en: 'Year 2' },
  36: { nl: 'Jaar 3', en: 'Year 3' },
};

const PREVIEW_IDS = ['growth-starter', 'marketplace-buyer', 'studio-creator', 'delivery-fee'] as const;

function previewTitle(row: CatalogRow, en: boolean): string {
  if (row.id === 'marketplace-buyer') return en ? 'Marketplace order' : 'Marketplace-bestelling';
  if (row.id === 'delivery-fee') return en ? 'Delivery' : 'Bezorging';
  if (row.id === 'growth-starter') return 'Growth Starter';
  if (row.id === 'studio-creator') return 'Studio Creator';
  return row.product;
}

function previewType(row: CatalogRow, en: boolean): string {
  if (row.id === 'marketplace-buyer') {
    return en ? 'example on a €100 order' : 'voorbeeld bij een order van €100';
  }
  if (row.id === 'delivery-fee') {
    return en ? 'example on €10 delivery cost' : 'voorbeeld bij €10 bezorgkosten';
  }
  if (row.kind === 'purchase') return en ? 'per qualifying purchase' : 'per kwalificerende aankoop';
  return en ? 'per qualifying billing period' : 'per kwalificerende betaalperiode';
}

function NamedDisclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const reactId = useId();
  const panelId = `affiliate-panel-${reactId.replace(/:/g, '')}`;
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{title}</span>
        <span className="text-xs font-medium text-slate-500" aria-hidden>
          {open ? '–' : '+'}
        </span>
      </button>
      <div id={panelId} hidden={!open} className="border-t border-slate-100 px-4 py-4">
        {open ? children : null}
      </div>
    </div>
  );
}

export default function AffiliateBusinessStory({
  lang,
  programName = 'Vroege instap',
  showEarly = true,
  showNetwork = true,
  showPromo = true,
  focusProduct = null,
}: {
  lang: 'nl' | 'en';
  programName?: string;
  showEarly?: boolean;
  showNetwork?: boolean;
  showPromo?: boolean;
  focusProduct?: 'growth' | 'studio' | 'marketplace' | null;
}) {
  const en = lang === 'en';
  const catalog = buildAffiliateCommissionCatalog();
  const byId = new Map(catalog.map((row) => [row.id, row]));
  const preview = PREVIEW_IDS.map((id) => byId.get(id)).filter((row): row is CatalogRow => Boolean(row));
  const stages = alongsideWorkJourneyStages();
  const share = growthStarterShareCents();
  const faqs = publicFaqs(affiliatePropositionFaqs(lang), {
    main: showNetwork,
    network: showNetwork,
    promo: showPromo,
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const catalogPlatform =
    focusProduct === 'growth' ? 'Growth' : focusProduct === 'studio' ? 'Studio' : focusProduct === 'marketplace' ? 'Marketplace' : 'all';

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-12 text-left">
      <section aria-labelledby="affiliate-how">
        <h2 id="affiliate-how" className="text-xl font-semibold text-slate-900">
          {en ? 'How it works' : 'Hoe werkt het?'}
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              n: '1',
              title: en ? 'Share HomeCheff' : 'Deel HomeCheff',
              body: en
                ? 'Use your personal link, promotional material, or a promo code where one is available.'
                : 'Gebruik je persoonlijke link, promotiemateriaal of een beschikbare promotiecode.',
            },
            {
              n: '2',
              title: en ? 'Build customers' : 'Bouw klanten op',
              body: en
                ? 'When someone becomes a customer through you, that relationship is added to your portfolio under the current terms.'
                : 'Wanneer iemand via jou klant wordt, wordt die relatie aan jouw portefeuille gekoppeld volgens de geldende voorwaarden.',
            },
            {
              n: '3',
              title: en ? 'Earn with them' : 'Verdien mee',
              body: en
                ? 'Qualifying use of HomeCheff services can create commission.'
                : 'Bij kwalificerend gebruik van HomeCheff-diensten kan daar commissie uit ontstaan.',
            },
          ].map((step) => (
            <li key={step.n} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-emerald-800">{step.n}</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="commissies" aria-labelledby="affiliate-earn" className="scroll-mt-24">
        <h2 id="affiliate-earn" className="text-xl font-semibold text-slate-900">
          {en ? 'What can I earn?' : 'Wat kan ik verdienen?'}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          {en
            ? 'A few examples from the current program. The full list is one step further.'
            : 'Een paar voorbeelden uit het huidige programma. De volledige lijst staat één stap verder.'}
        </p>
        {focusProduct ? (
          <p className="mt-2 text-sm text-slate-700">
            {focusProduct === 'growth'
              ? en
                ? 'You arrived from Growth. Growth commissions are in this same overview.'
                : 'Je komt vanuit Growth. De Growth-commissies staan in hetzelfde overzicht.'
              : focusProduct === 'studio'
                ? en
                  ? 'You arrived from Studio. Studio commissions are in this same overview.'
                  : 'Je komt vanuit Studio. De Studio-commissies staan in hetzelfde overzicht.'
                : en
                  ? 'You are looking at the Marketplace examples in this same overview.'
                  : 'Je bekijkt de Marketplace-voorbeelden in hetzelfde overzicht.'}
          </p>
        ) : null}
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {preview.map((row) => (
            <li key={row.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{previewTitle(row, en)}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {eur(row.affiliateCents)}
              </p>
              <p className="mt-1 text-sm text-slate-600">{previewType(row, en)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <NamedDisclosure title={en ? 'View all products and commissions' : 'Bekijk alle producten en commissies'}>
            <p className="mb-3 text-sm text-slate-600">
              {en
                ? `These amounts are the public program for a new affiliate${showEarly ? `: ${programName}` : ''}. An affiliate who already joined keeps the program they enrolled in.`
                : `Deze bedragen horen bij het openbare programma voor een nieuwe affiliate${showEarly ? `: ${programName}` : ''}. Een affiliate die al is ingestapt, houdt het programma waarin die is ingeschreven.`}
            </p>
            <AffiliateCommissionCatalog
              rows={catalog}
              lang={lang}
              showNetwork={showNetwork}
              showPromo={showPromo}
              initialPlatform={catalogPlatform}
            />
          </NamedDisclosure>
        </div>
      </section>

      <section aria-labelledby="affiliate-portfolio">
        <h2 id="affiliate-portfolio" className="text-xl font-semibold text-slate-900">
          {en ? 'Build something that can keep going' : 'Bouw iets op dat kan blijven doorlopen'}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-700">
          {en
            ? 'You do not start over every month. What you build today can keep working for years, for as long as the customer keeps making qualifying use of HomeCheff. That is not guaranteed income.'
            : 'Je begint niet iedere maand opnieuw. Wat je vandaag opbouwt, kan jaren voor je blijven werken, zolang de klant kwalificerend gebruik blijft maken van HomeCheff. Dat is geen gegarandeerd inkomen.'}
        </p>
        <div className="mt-4 space-y-3">
          <NamedDisclosure title={en ? 'Calculate my possible portfolio' : 'Bereken mijn mogelijke portefeuille'}>
            <PortfolioExplorer lang={lang} showNetwork={showNetwork} />
          </NamedDisclosure>
          <NamedDisclosure
            title={
              en
                ? 'View examples of €3,000, €10,000 and €20,000 a month'
                : 'Bekijk voorbeelden van €3.000, €10.000 en €20.000 per maand'
            }
          >
            <p className="text-sm text-slate-600">
              {en
                ? 'Scenarios, not a promise and not a timeline. They show how many qualifying Growth Starter customers the current commission would require.'
                : 'Scenario’s, geen belofte en geen termijn. Ze laten zien hoeveel kwalificerende Growth Starter-klanten de huidige commissie daarvoor vraagt.'}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-800">
              {SCALE_TARGET_EUR.map((target) => {
                const need = growthStarterCustomersForMonthlyTarget(target);
                return (
                  <li key={target} className="rounded-xl bg-slate-50 px-3 py-2">
                    {en
                      ? `About €${target.toLocaleString('en-GB')} / month from Growth Starter alone: ${need.customers} active qualifying customers × ${eur(need.perCustomerCents)}.`
                      : `Ongeveer €${target.toLocaleString('nl-NL')} / maand uit alleen Growth Starter: ${need.customers} actieve kwalificerende klanten × ${eur(need.perCustomerCents)}.`}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm font-medium text-slate-900">
              {en ? 'A smaller example, with the assumptions visible' : 'Een kleiner voorbeeld, met de aannames erbij'}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>
                {en
                  ? `${JOURNEY_NEW_GROWTH_STARTER_PER_MONTH} new Growth Starter customers per month, and this scenario keeps ${Math.round(JOURNEY_RETENTION * 100)}% qualifying.`
                  : `${JOURNEY_NEW_GROWTH_STARTER_PER_MONTH} nieuwe Growth Starter-klanten per maand, en dit scenario houdt ${Math.round(JOURNEY_RETENTION * 100)}% kwalificerend.`}
              </li>
              <li>
                {en
                  ? `From month ${JOURNEY_STUDIO_FROM_MONTH}, ${Math.round(JOURNEY_STUDIO_CROSS_SELL_RATE * 100)}% also pay Studio Creator.`
                  : `Vanaf maand ${JOURNEY_STUDIO_FROM_MONTH} betaalt ${Math.round(JOURNEY_STUDIO_CROSS_SELL_RATE * 100)}% ook Studio Creator.`}
              </li>
              <li>
                {en
                  ? `Each Starter customer is ${eur(share.directCents)} per qualifying billing period. That is half of the margin after the HC reserve, not half of the customer price.`
                  : `Elke Starter-klant is ${eur(share.directCents)} per kwalificerende betaalperiode. Dat is de helft van de marge na de HC-reserve, niet de helft van de klantprijs.`}
              </li>
            </ul>
            <ol className="mt-3 space-y-2">
              {stages.map((stage) => (
                <li key={stage.months} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-slate-600">
                    {en ? STAGE_LABELS[stage.months]?.en : STAGE_LABELS[stage.months]?.nl}
                  </span>
                  <span className="font-semibold text-slate-900">{eur(stage.ownCents)}</span>
                </li>
              ))}
            </ol>
          </NamedDisclosure>
        </div>
      </section>

      <section aria-labelledby="affiliate-services">
        <h2 id="affiliate-services" className="text-xl font-semibold text-slate-900">
          {en ? 'A customer can use more than one HomeCheff service' : 'Een klant kan meer dan één HomeCheff-dienst gebruiken'}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-slate-800">
          {['Marketplace', 'Growth', 'Studio', en ? 'Delivery' : 'Bezorging'].map((name) => (
            <li key={name} className="rounded-full border border-slate-200 bg-white px-3 py-1.5">
              {name}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <NamedDisclosure
            title={
              en
                ? 'How earning works across HomeCheff services'
                : 'Zo werkt verdienen over meerdere HomeCheff-diensten'
            }
          >
            <p className="text-sm leading-relaxed text-slate-700">
              {en
                ? 'The affiliate who introduced the customer stays the origin. Commission arises only on qualifying paid revenue of that service, under that service’s own rules. Not every service pays the same amount. At Growth we share the earning basis after the required HC credit is reserved.'
                : 'De affiliate die de klant heeft aangebracht, blijft de herkomst. Commissie ontstaat alleen bij kwalificerende betaalde omzet van die dienst, volgens de regels van die dienst. Niet elke dienst betaalt hetzelfde bedrag. Bij Growth delen we de verdienbasis nadat het benodigde HC-tegoed is gereserveerd.'}
            </p>
          </NamedDisclosure>
        </div>
      </section>

      <section aria-labelledby="affiliate-tools">
        <h2 id="affiliate-tools" className="text-xl font-semibold text-slate-900">
          {en ? 'How you share HomeCheff' : 'Hoe je HomeCheff deelt'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {showPromo
            ? en
              ? 'You get a personal affiliate link and promotional material. Promo codes are available for Growth and for Marketplace business subscriptions, not for every product.'
              : 'Je krijgt een persoonlijke affiliatelink en promotiemateriaal. Promotiecodes zijn er voor Growth en voor zakelijke Marketplace-abonnementen, niet voor elk product.'
            : en
              ? 'You get a personal affiliate link and promotional material.'
              : 'Je krijgt een persoonlijke affiliatelink en promotiemateriaal.'}
        </p>
        <div className="mt-4">
          <NamedDisclosure title={en ? 'View the promotion options' : 'Bekijk de promotiemogelijkheden'}>
            <ul className="space-y-2 text-sm">
              <li>
                <a className="font-semibold text-emerald-800 underline-offset-2 hover:underline" href="/affiliate/dashboard">
                  {en ? 'Your affiliate link' : 'Je affiliatelink'}
                </a>
              </li>
              <li>
                <a className="font-semibold text-emerald-800 underline-offset-2 hover:underline" href="/affiliate/promotiemateriaal">
                  {en ? 'Promotional material' : 'Promotiemateriaal'}
                </a>
              </li>
              {showPromo ? (
                <li>
                  <a className="font-semibold text-emerald-800 underline-offset-2 hover:underline" href="/affiliate/promo-codes">
                    {en ? 'Promo codes for Growth and Marketplace business subscriptions' : 'Promotiecodes voor Growth en zakelijke Marketplace-abonnementen'}
                  </a>
                </li>
              ) : null}
            </ul>
          </NamedDisclosure>
        </div>
      </section>

      {showNetwork ? (
        <section aria-labelledby="affiliate-network">
          <h2 id="affiliate-network" className="text-xl font-semibold text-slate-900">
            {en ? 'Working with other partners' : 'Samenwerken met andere partners'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {en
              ? 'Most people start by earning on their own customers. The partner network is a later step.'
              : 'De meeste mensen beginnen met verdienen op hun eigen klanten. Het partnernetwerk is een latere stap.'}
          </p>
          <div className="mt-4">
            <NamedDisclosure title={en ? 'See how the partner network works' : 'Bekijk hoe het partnernetwerk werkt'}>
              <p className="text-sm leading-relaxed text-slate-700">
                {en ? NETWORK_CAPABILITY.publicNoteEn : NETWORK_CAPABILITY.publicNoteNl}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {en
                  ? `On a Growth Starter customer the direct share is ${eur(share.directCents)}. Where MAIN and SUB apply, the sub share is ${eur(share.subCents)} and the main share is ${eur(share.mainCents)}, from the same margin after the HC reserve.`
                  : `Op een Growth Starter-klant is het directe aandeel ${eur(share.directCents)}. Waar MAIN en SUB gelden, is het sub-aandeel ${eur(share.subCents)} en het main-aandeel ${eur(share.mainCents)}, uit dezelfde marge na de HC-reserve.`}
              </p>
            </NamedDisclosure>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="affiliate-country">
        <h2 id="affiliate-country" className="text-xl font-semibold text-slate-900">
          {en ? 'Another country' : 'Een ander land'}
        </h2>
        <div className="mt-4">
          <NamedDisclosure title={en ? 'I want to build HomeCheff in my country' : 'Ik wil HomeCheff in mijn land opbouwen'}>
            <p className="text-sm leading-relaxed text-slate-700">
              {en
                ? 'If HomeCheff is not fully active where you live or work, you can register your interest. That request does not approve you and does not open the country.'
                : 'Als HomeCheff nog niet volledig actief is waar je woont of werkt, kun je je interesse doorgeven. Die aanvraag keurt je niet goed en opent het land niet.'}
            </p>
            <AffiliateCountryInterestForm lang={lang} />
          </NamedDisclosure>
        </div>
      </section>

      <section aria-labelledby="affiliate-faq">
        <h2 id="affiliate-faq" className="text-xl font-semibold text-slate-900">
          {en ? 'Questions' : 'Vragen'}
        </h2>
        <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {faqs.map((faq, index) => {
            const open = openFaq === index;
            const panelId = `affiliate-faq-${index}`;
            return (
              <div key={faq.q}>
                <h3>
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenFaq(open ? null : index)}
                  >
                    {faq.q}
                  </button>
                </h3>
                <div id={panelId} hidden={!open} className="px-4 pb-4">
                  <p className="text-sm leading-relaxed text-slate-700">{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="affiliate-start" aria-labelledby="affiliate-begin" className="scroll-mt-24">
        <h2 id="affiliate-begin" className="text-xl font-semibold text-slate-900">
          {en ? 'How do I start?' : 'Hoe begin ik?'}
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          {en
            ? 'Start as a person, or work with your company. A company path is for teams and campaigns. It is not employment.'
            : 'Start als persoon, of werk met je bedrijf. De bedrijfsroute is voor teams en campagnes. Het is geen dienstverband.'}
        </p>
        <p className="mt-3">
          <a href="/affiliate/company" className="text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline">
            {en ? 'Work with my company' : 'Werk met mijn bedrijf'}
          </a>
        </p>
      </section>
    </div>
  );
}
