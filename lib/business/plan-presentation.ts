/**
 * Public wording for business plans.
 * Prices, fees, and affiliate shares are read from the existing engines.
 * This file does not set those numbers.
 */
import {
  getBusinessVisibilityProfile,
  listBusinessPlanIds,
  type BusinessPlanId,
} from '@/lib/business/visibility-profile';
import { SPONSORED_DISTRIBUTION_WEIGHT } from '@/lib/sponsored/recommendation';
import {
  AFFILIATE_BUSINESS_COMMISSION_PCT,
  PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT,
  SUB_AFFILIATE_BUSINESS_COMMISSION_PCT,
  calculateBusinessSubscriptionCommission,
  calculateParentAffiliateBusinessCommission,
} from '@/lib/affiliate-config';

export type PublicLang = 'nl' | 'en';

const NAMES: Record<PublicLang, Record<BusinessPlanId, string>> = {
  nl: { individual: 'Particulier', basic: 'Basic', pro: 'Pro', premium: 'Premium' },
  en: { individual: 'Individual', basic: 'Basic', pro: 'Pro', premium: 'Premium' },
};

export function formatPlanEuros(cents: number): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

export function sponsoredEntitlement(plan: BusinessPlanId): 'none' | 'basic' | 'pro' | 'premium' {
  if (plan === 'individual') return 'none';
  return plan;
}

export function sponsoredWeight(plan: BusinessPlanId): number {
  if (plan === 'individual') return 0;
  return SPONSORED_DISTRIBUTION_WEIGHT[plan];
}

function sponsoredSentence(plan: BusinessPlanId, lang: PublicLang): string {
  if (plan === 'individual') {
    return lang === 'en'
      ? 'No sponsored recommendation. Your offers stay in the ordinary Marketplace.'
      : 'Geen gesponsorde aanbeveling. Je aanbod blijft in de gewone Marketplace.';
  }
  if (plan === 'basic') {
    return lang === 'en'
      ? 'Eligible for a relevant sponsored recommendation. It is shown only when the offer fits what someone is browsing.'
      : 'Je komt in aanmerking voor een relevante gesponsorde aanbeveling. Die verschijnt alleen als het aanbod past bij wat iemand bekijkt.';
  }
  if (plan === 'pro') {
    return lang === 'en'
      ? 'More distribution opportunities than Basic for a relevant sponsored recommendation. Still only when the offer fits.'
      : 'Meer distributiekansen dan Basic voor een relevante gesponsorde aanbeveling. Nog steeds alleen als het aanbod past.';
  }
  return lang === 'en'
    ? 'Highest distribution priority for a relevant sponsored recommendation. Still only when the offer fits.'
    : 'De hoogste distributieprioriteit voor een relevante gesponsorde aanbeveling. Nog steeds alleen als het aanbod past.';
}

/** Sales on which the lower fee can offset the monthly price. Not a revenue promise. */
export function commissionOffsetSalesCents(plan: BusinessPlanId): number | null {
  const current = getBusinessVisibilityProfile(plan);
  const individual = getBusinessVisibilityProfile('individual');
  const points = individual.feePercent - current.feePercent;
  if (current.monthlyPriceCents <= 0 || points <= 0) return null;
  return Math.ceil(current.monthlyPriceCents / (points / 100));
}

export type PublicPlanFact = {
  id: BusinessPlanId;
  name: string;
  priceLabel: string;
  priceCents: number;
  commissionPercent: number;
  sponsored: string;
  who: string;
};

export function publicPlanFacts(lang: PublicLang): PublicPlanFact[] {
  const who: Record<PublicLang, Record<BusinessPlanId, string>> = {
    nl: {
      individual: 'Voor wie af en toe zelf iets aanbiedt, zonder bedrijfsabonnement.',
      basic: 'Voor een lokaal bedrijf dat naast een lagere fee ook relevant extra zichtbaar mag zijn.',
      pro: 'Voor een bedrijf dat vaker in aanmerking wil komen voor die relevante aanbeveling.',
      premium: 'Voor een bedrijf dat, als het aanbod past, de hoogste plek in die verdeling wil.',
    },
    en: {
      individual: 'For someone who lists occasionally, without a business subscription.',
      basic: 'For a local business that wants a lower fee and relevant extra visibility.',
      pro: 'For a business that wants more chances at that relevant recommendation.',
      premium: 'For a business that wants the highest place in that distribution when the offer fits.',
    },
  };
  return listBusinessPlanIds().map((id) => {
    const profile = getBusinessVisibilityProfile(id);
    return {
      id,
      name: NAMES[lang][id],
      priceLabel:
        profile.monthlyPriceCents === 0
          ? lang === 'en'
            ? '€0 / month'
            : '€0 per maand'
          : lang === 'en'
            ? `${formatPlanEuros(profile.monthlyPriceCents)} / month`
            : `${formatPlanEuros(profile.monthlyPriceCents)} per maand`,
      priceCents: profile.monthlyPriceCents,
      commissionPercent: profile.commissionPercent,
      sponsored: sponsoredSentence(id, lang),
      who: who[lang][id],
    };
  });
}

export type AffiliatePlanReward = {
  plan: BusinessPlanId;
  priceCents: number;
  directCents: number;
  partnerCents: number;
  mainCents: number;
};

export function affiliateRewardsForPlans(): AffiliatePlanReward[] {
  return (['basic', 'pro', 'premium'] as const).map((plan) => {
    const priceCents = getBusinessVisibilityProfile(plan).monthlyPriceCents;
    const direct = calculateBusinessSubscriptionCommission(priceCents, 0, false);
    const partner = calculateBusinessSubscriptionCommission(priceCents, 0, true);
    return {
      plan,
      priceCents,
      directCents: direct.finalAffiliateCommissionCents,
      partnerCents: partner.finalAffiliateCommissionCents,
      mainCents: calculateParentAffiliateBusinessCommission(priceCents),
    };
  });
}

export function businessPlanFaq(lang: PublicLang): { question: string; answer: string }[] {
  const facts = publicPlanFacts(lang);
  const byId = Object.fromEntries(facts.map((fact) => [fact.id, fact])) as Record<
    BusinessPlanId,
    PublicPlanFact
  >;
  const basicOffset = commissionOffsetSalesCents('basic');
  const rewards = affiliateRewardsForPlans();
  const basicReward = rewards.find((row) => row.plan === 'basic');
  if (lang === 'en') {
    return [
      {
        question: 'What does HomeCheff cost for a business?',
        answer: `Individual listing is ${byId.individual.priceLabel} plus a ${byId.individual.commissionPercent}% platform fee on a sale. Basic is ${byId.basic.priceLabel} and ${byId.basic.commissionPercent}%. Pro is ${byId.pro.priceLabel} and ${byId.pro.commissionPercent}%. Premium is ${byId.premium.priceLabel} and ${byId.premium.commissionPercent}%.`,
      },
      {
        question: 'Can I use HomeCheff for free?',
        answer: `Yes. As an individual you can list without a subscription. You pay the ${byId.individual.commissionPercent}% platform fee when a sale is checked out through HomeCheff. Buyers do not need a subscription.`,
      },
      {
        question: 'What do I get with Basic, Pro and Premium?',
        answer: `All three lower the platform fee and can be included in a separate sponsored recommendation. ${byId.basic.sponsored} ${byId.pro.sponsored} ${byId.premium.sponsored}`,
      },
      {
        question: 'Does a paid plan rank higher in ordinary search?',
        answer: 'No. Ordinary Marketplace order is not for sale. A subscription does not buy a higher organic position, and it does not skip the query, category, filters or country.',
      },
      {
        question: 'How do sponsored recommendations work?',
        answer: 'After someone is browsing or searching, HomeCheff may insert one labelled sponsored recommendation. The offer has to match that context first. The plan only affects how often an already relevant business is chosen. If nothing fits, no recommendation is shown.',
      },
      {
        question: 'Is extra visibility guaranteed?',
        answer: 'No. There is no promised number of views, clicks or customers. A Premium business with no relevant audience is not shown at random.',
      },
      {
        question: 'When can the lower fee offset the subscription?',
        answer: basicOffset
          ? `On HomeCheff checkout, Basic charges ${byId.basic.commissionPercent}% instead of ${byId.individual.commissionPercent}%. The ${formatPlanEuros(byId.basic.priceCents)} monthly price equals that fee difference on about ${formatPlanEuros(basicOffset)} of checkout sales in a month. That is a fee comparison, not a profit or customer forecast. The plan catalog does not add a separate VAT amount on this page.`
          : 'The fee difference is calculated from the current plan catalog.',
      },
      {
        question: 'What does an affiliate earn for a business subscription?',
        answer: basicReward
          ? `A direct affiliate receives ${Math.round(AFFILIATE_BUSINESS_COMMISSION_PCT * 100)}% of the monthly fee on each paid invoice. For Basic that is ${formatPlanEuros(basicReward.directCents)} of ${formatPlanEuros(basicReward.priceCents)}. A partner in a MAIN network receives ${Math.round(SUB_AFFILIATE_BUSINESS_COMMISSION_PCT * 100)}% (${formatPlanEuros(basicReward.partnerCents)} on Basic) and the MAIN receives ${Math.round(PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT * 100)}% (${formatPlanEuros(basicReward.mainCents)} on Basic). HomeCheff keeps the other half of the fee. This continues on later paid invoices while the subscription and the referral stay in place. It is not a guaranteed income.`
          : 'The affiliate share follows the paid subscription invoice.',
      },
      {
        question: 'What does the referred business receive?',
        answer: 'The same plan a business would buy itself: the listed monthly price, the listed platform fee, and the sponsored entitlement for that plan. The affiliate reward is not taken out of the business’s sales.',
      },
    ];
  }
  return [
    {
      question: 'Wat kost HomeCheff voor bedrijven?',
      answer: `Particulier aanbieden is ${byId.individual.priceLabel}, plus ${byId.individual.commissionPercent}% platformfee op een verkoop. Basic is ${byId.basic.priceLabel} en ${byId.basic.commissionPercent}%. Pro is ${byId.pro.priceLabel} en ${byId.pro.commissionPercent}%. Premium is ${byId.premium.priceLabel} en ${byId.premium.commissionPercent}%.`,
    },
    {
      question: 'Kan ik HomeCheff gratis gebruiken?',
      answer: `Ja. Als particulier plaats je zonder abonnement. Je betaalt ${byId.individual.commissionPercent}% platformfee als een verkoop via HomeCheff wordt afgerekend. Kopers hebben geen abonnement nodig.`,
    },
    {
      question: 'Wat krijg ik bij Basic, Pro en Premium?',
      answer: `Alle drie verlagen de platformfee en kunnen meedoen aan een aparte gesponsorde aanbeveling. ${byId.basic.sponsored} ${byId.pro.sponsored} ${byId.premium.sponsored}`,
    },
    {
      question: 'Kom ik met een betaald abonnement hoger in de gewone resultaten?',
      answer: 'Nee. De gewone Marketplace-volgorde is niet te koop. Een abonnement koopt geen hogere organische plek en slaat zoekwoord, categorie, filters of land niet over.',
    },
    {
      question: 'Hoe werken gesponsorde aanbevelingen?',
      answer: 'Als iemand zoekt of rondkijkt, kan HomeCheff één gelabelde gesponsorde aanbeveling tussen de gewone aanbiedingen zetten. Het aanbod moet eerst bij die context passen. Het abonnement telt pas daarna, voor hoe vaak een al relevant bedrijf wordt gekozen. Past er niets, dan verschijnt er geen aanbeveling.',
    },
    {
      question: 'Is extra zichtbaarheid gegarandeerd?',
      answer: 'Nee. Er is geen beloofd aantal vertoningen, klikken of klanten. Een Premium-bedrijf zonder relevant publiek wordt niet zomaar getoond.',
    },
    {
      question: 'Wanneer weegt de lagere fee op tegen het abonnement?',
      answer: basicOffset
        ? `Bij afrekenen via HomeCheff rekent Basic ${byId.basic.commissionPercent}% in plaats van ${byId.individual.commissionPercent}%. Het maandbedrag van ${formatPlanEuros(byId.basic.priceCents)} is even groot als dat feeverschil op ongeveer ${formatPlanEuros(basicOffset)} afrekenomzet in een maand. Dat is een vergelijking van de fee, geen winst- of klantenvoorspelling. Het abonnementenoverzicht noemt op deze pagina geen apart btw-bedrag.`
        : 'Het feeverschil wordt uit het huidige plancatalogus gerekend.',
    },
    {
      question: 'Wat krijgt een affiliate als die een bedrijf aanbrengt?',
      answer: basicReward
        ? `Een directe affiliate ontvangt ${Math.round(AFFILIATE_BUSINESS_COMMISSION_PCT * 100)}% van de maandfee bij elke betaalde factuur. Bij Basic is dat ${formatPlanEuros(basicReward.directCents)} van ${formatPlanEuros(basicReward.priceCents)}. Een partner in een MAIN-netwerk ontvangt ${Math.round(SUB_AFFILIATE_BUSINESS_COMMISSION_PCT * 100)}% (${formatPlanEuros(basicReward.partnerCents)} bij Basic) en de MAIN ontvangt ${Math.round(PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT * 100)}% (${formatPlanEuros(basicReward.mainCents)} bij Basic). HomeCheff houdt de andere helft van de fee. Dit loopt door op latere betaalde facturen zolang het abonnement en de aanbreng blijven staan. Het is geen gegarandeerd inkomen.`
        : 'Het affiliate-aandeel volgt de betaalde abonnementsfactuur.',
    },
    {
      question: 'Wat krijgt het aangebrachte bedrijf?',
      answer: 'Hetzelfde plan als wanneer het bedrijf zelf kiest: de genoemde maandprijs, de genoemde platformfee, en de gesponsorde mogelijkheid van dat plan. De affiliatebeloning gaat niet van de verkopen van het bedrijf af.',
    },
  ];
}

export function businessPlanJsonLd(lang: PublicLang) {
  const facts = publicPlanFacts(lang).filter((fact) => fact.priceCents > 0);
  const faq = businessPlanFaq(lang);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: lang === 'en' ? 'HomeCheff for business' : 'HomeCheff voor bedrijven',
        url: 'https://homecheff.eu/sell',
        inLanguage: lang === 'en' ? 'en' : 'nl',
        description:
          lang === 'en'
            ? 'Business plans, monthly prices, platform fees and relevant sponsored visibility on HomeCheff.'
            : 'Zakelijke abonnementen, maandprijzen, platformfee en relevante gesponsorde zichtbaarheid op HomeCheff.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'HomeCheff', item: 'https://homecheff.eu/' },
          {
            '@type': 'ListItem',
            position: 2,
            name: lang === 'en' ? 'For business' : 'Voor bedrijven',
            item: 'https://homecheff.eu/sell',
          },
        ],
      },
      ...facts.map((fact) => ({
        '@type': 'Offer',
        name: `HomeCheff ${fact.name}`,
        price: (fact.priceCents / 100).toFixed(0),
        priceCurrency: 'EUR',
        url: 'https://homecheff.eu/sell',
        description: `${fact.commissionPercent}% platform fee. ${fact.sponsored}`,
      })),
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };
}

export function businessPlanMachineBrief(): string {
  const nl = publicPlanFacts('nl');
  const lines = nl.map(
    (fact) =>
      `- ${fact.name}: ${fact.priceLabel}, ${fact.commissionPercent}% platform fee. ${fact.sponsored}`,
  );
  const rewards = affiliateRewardsForPlans();
  const rewardLines = rewards.map(
    (row) =>
      `- ${row.plan}: business pays ${formatPlanEuros(row.priceCents)}; direct affiliate ${formatPlanEuros(row.directCents)} per paid invoice (${Math.round(AFFILIATE_BUSINESS_COMMISSION_PCT * 100)}%).`,
  );
  return [
    '## Business subscriptions',
    'Canonical public page: https://homecheff.eu/sell',
    'Ordinary Marketplace ranking is not paid. Sponsored recommendations are a separate labelled placement and appear only when relevant. No impression count is guaranteed.',
    ...lines,
    'Affiliate reward on a business subscription (not taken from the business sales):',
    ...rewardLines,
    `Partner in a MAIN network: ${Math.round(SUB_AFFILIATE_BUSINESS_COMMISSION_PCT * 100)}% to the partner and ${Math.round(PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT * 100)}% to the MAIN, of the same monthly fee, on each paid invoice while the subscription and referral remain.`,
  ].join('\n');
}
