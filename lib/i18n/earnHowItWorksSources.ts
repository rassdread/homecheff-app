/**
 * Server-renderable copy for /werken-bij/hoe-werkt-het.
 * Numbers come from lib/earn/public-economics (Stage 1 SoT).
 */

import {
  PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE,
  PUBLIC_ATTRIBUTION_COOKIE_DAYS,
  PUBLIC_DEFAULT_INDIVIDUAL_FEE_PERCENT,
  PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT,
  PUBLIC_DIRECT_PERCENT_OF_ELIGIBLE,
  PUBLIC_GROWTH_COMMISSION_MONTHS,
  PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT,
  PUBLIC_GROWTH_HC_CROSS_PLATFORM_CLAIM,
  PUBLIC_GROWTH_PLAN_ECONOMICS,
  PUBLIC_GROWTH_PLANS,
  PUBLIC_LEDGER_PENDING_DAYS,
  PUBLIC_MAIN_PERCENT_OF_ELIGIBLE,
  PUBLIC_MARKETPLACE_MIN_PAYOUT_EUR,
  PUBLIC_MARKETPLACE_REVENUE_WINDOW_DAYS,
  PUBLIC_MARKETPLACE_SELLER_FEES,
  PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL,
  PUBLIC_STUDIO_COMMISSION_MONTHS,
  PUBLIC_STUDIO_PLAN_ECONOMICS,
  PUBLIC_STUDIO_PLANS,
  PUBLIC_SUB_PERCENT_OF_ELIGIBLE,
  deliveryExamplePoolCents,
  formatPublicEurEn,
  formatPublicEurNl,
  formatPublicPercentEn,
  formatPublicPercentNl,
  marketplaceExamplePoolCents,
} from '@/lib/earn/public-economics';

export type EarnHowItWorksLang = 'nl' | 'en';

export type EarnPlanEconomicsCard = {
  key: string;
  name: string;
  price: string;
  includedCredits: string | null;
  /** Separate from included HC — monthly lead quota is not HC/3. */
  leadQuota?: string | null;
  /** HC face reserve (€0.01 × included HC) deducted before affiliate share. */
  hcReserve?: string | null;
  availableMargin: string;
  availableMarginPct: string;
  affiliateShare: string;
  commission: string;
  recurring: string;
};

const growthHcScopeNl =
  PUBLIC_GROWTH_HC_CROSS_PLATFORM_CLAIM === 'GROWTH_ONLY'
    ? 'Je abonnement bevat HC voor gebruik binnen Growth.'
    : 'Je abonnement bevat HC die je kunt gebruiken binnen Growth, HomeCheff Studio en op HomeCheff. HC is ecosysteemtegoed voor ondersteunde functies en aankopen en is niet uitbetaalbaar als koperssaldo.';

const growthHcScopeEn =
  PUBLIC_GROWTH_HC_CROSS_PLATFORM_CLAIM === 'GROWTH_ONLY'
    ? 'Your subscription includes HC for use within Growth.'
    : 'Your subscription includes HC you can use within Growth, HomeCheff Studio and on HomeCheff. HC is ecosystem credit for supported features and purchases and is not withdrawable as buyer cash.';

const mpEx = marketplaceExamplePoolCents(100, PUBLIC_DEFAULT_INDIVIDUAL_FEE_PERCENT);
const delEx = deliveryExamplePoolCents(20);

function growthPlanCardsNl(): EarnPlanEconomicsCard[] {
  return PUBLIC_GROWTH_PLAN_ECONOMICS.map((p) => ({
    key: p.key,
    name: `Growth ${p.label}`,
    price: `€${formatPublicEurNl(p.priceEurExVat)} / maand ex. btw`,
    includedCredits: `${p.includedHc.toLocaleString('nl-NL')} HC inbegrepen`,
    leadQuota: `${p.monthlyLeadQuota.toLocaleString('nl-NL')} leads / maand (apart van HC)`,
    hcReserve: `€${formatPublicEurNl(p.hcReserveEur)} HC-reserve (face value)`,
    availableMargin: `€${formatPublicEurNl(p.commissionableBaseEur)}`,
    availableMarginPct: `${formatPublicPercentNl(p.commissionableBasePercentOfPrice)}% van de abonnementsprijs ex. btw (na HC-reserve)`,
    affiliateShare: `${formatPublicPercentNl(p.affiliatePercentOfBase)}% van de deelbare marge`,
    commission: `€${formatPublicEurNl(p.affiliateCommissionEur)}`,
    recurring:
      'Je ontvangt deze commissie per kwalificerende betaalde abonnementsperiode, maximaal 12 maanden.',
  }));
}

function growthPlanCardsEn(): EarnPlanEconomicsCard[] {
  return PUBLIC_GROWTH_PLAN_ECONOMICS.map((p) => ({
    key: p.key,
    name: `Growth ${p.label}`,
    price: `€${formatPublicEurEn(p.priceEurExVat)} / month ex VAT`,
    includedCredits: `${p.includedHc.toLocaleString('en-GB')} HC included`,
    leadQuota: `${p.monthlyLeadQuota.toLocaleString('en-GB')} leads / month (separate from HC)`,
    hcReserve: `€${formatPublicEurEn(p.hcReserveEur)} HC reserve (face value)`,
    availableMargin: `€${formatPublicEurEn(p.commissionableBaseEur)}`,
    availableMarginPct: `${formatPublicPercentEn(p.commissionableBasePercentOfPrice)}% of the subscription price ex VAT (after HC reserve)`,
    affiliateShare: `${formatPublicPercentEn(p.affiliatePercentOfBase)}% of the distributable margin`,
    commission: `€${formatPublicEurEn(p.affiliateCommissionEur)}`,
    recurring:
      'You receive this commission for each qualifying paid subscription period, for a maximum of 12 months.',
  }));
}

function studioPlanCardsNl(): EarnPlanEconomicsCard[] {
  return PUBLIC_STUDIO_PLAN_ECONOMICS.map((p) => ({
    key: p.key,
    name: p.label,
    price: `€${formatPublicEurNl(p.priceEurGrossInclVat)} / maand`,
    includedCredits: `${p.includedHc.toLocaleString('nl-NL')} HC inbegrepen`,
    leadQuota: null,
    hcReserve: null,
    availableMargin: `€${formatPublicEurNl(p.distributableMarginEur)}`,
    availableMarginPct: `${formatPublicPercentNl(p.distributableMarginPercentOfGross)}% van de catalogusprijs`,
    affiliateShare: `${formatPublicPercentNl(p.affiliatePercentOfResidual)}% van de beschikbare commissiemarge`,
    commission: `€${formatPublicEurNl(p.affiliateCommissionEur)} per volledig betaalde abonnementsperiode`,
    recurring: `Zolang de klant een betaald abonnement houdt binnen het venster van ${p.commissionMonths} maanden, ontvang je dit bedrag per qualifying periode.`,
  }));
}

function studioPlanCardsEn(): EarnPlanEconomicsCard[] {
  return PUBLIC_STUDIO_PLAN_ECONOMICS.map((p) => ({
    key: p.key,
    name: p.label,
    price: `€${formatPublicEurEn(p.priceEurGrossInclVat)} / month`,
    includedCredits: `${p.includedHc.toLocaleString('en-GB')} HC included`,
    leadQuota: null,
    hcReserve: null,
    availableMargin: `€${formatPublicEurEn(p.distributableMarginEur)}`,
    availableMarginPct: `${formatPublicPercentEn(p.distributableMarginPercentOfGross)}% of the catalogue price`,
    affiliateShare: `${formatPublicPercentEn(p.affiliatePercentOfResidual)}% of the available commissionable margin`,
    commission: `€${formatPublicEurEn(p.affiliateCommissionEur)} per fully paid subscription period`,
    recurring: `For as long as the customer keeps a paid subscription within the ${p.commissionMonths}-month window, you receive this amount on each qualifying period.`,
  }));
}

const fees = PUBLIC_MARKETPLACE_SELLER_FEES;

export const earnHowItWorksNl = {
  meta: {
    title: 'Verdienen met HomeCheff | Affiliate, Marketplace, Growth en Studio',
    description:
      'Zo verdien je met HomeCheff: platformfees, affiliatevergoedingen, berekeningsgrondslag, looptijden en uitbetaling voor Marketplace, Bezorgen, Growth en Studio.',
  },
  hero: {
    eyebrow: 'Verdienen uitgelegd',
    title: 'Zo verdien je met HomeCheff',
    subtitle:
      'Verkoop, bezorg of promoot HomeCheff, Growth en Studio. Bekijk hoe inkomsten worden berekend, welke percentages gelden en wanneer je uitbetaald kunt worden.',
    ctaOpportunities: 'Bekijk verdienmogelijkheden',
    ctaAffiliate: 'Word affiliate',
    ctaDashboard: 'Open mijn dashboard',
  },
  fundamentals: {
    title: 'Eerst het basisprincipe',
    lead:
      'Een affiliatevergoeding wordt berekend over de daarvoor geldende HomeCheff-platforminkomsten, niet automatisch over het volledige aankoopbedrag van de klant.',
    flowCustomer: 'Betaling van de klant',
    flowPlatform: 'HomeCheff-platforminkomsten / platformfee',
    flowPool: 'Beschikbare affiliatepool',
    flowReward: 'Jouw affiliatevergoeding',
    note:
      'Niet elk percentage geldt over dezelfde grondslag. “50% affiliate” betekent dus niet “50% van het bestelbedrag”.',
  },
  marketplace: {
    title: 'Marketplace — platformfees voor verkopers',
    intro:
      'Verkoop je via HomeCheff Checkout, dan geldt afhankelijk van je verkopersprofiel een platformfee. Bij directe/contactafspraken buiten HomeCheff Checkout loopt deze fee-route niet.',
    checkoutNote:
      'Bij geprijsde, eligible HomeCheff Checkout-transacties worden betaling via de betaalrail en de platformfee toegepast volgens het geldende verkopersprofiel.',
    directNote:
      'Bij directe of contactafspraken buiten HomeCheff Checkout geldt deze Checkout-platformfee-route niet.',
    individual: `Particulier: ${fees.individual.percent}%`,
    basic: `Business Basic: ${fees.basic.percent}% · €${fees.basic.monthlyEur} / maand`,
    pro: `Business Pro: ${fees.pro.percent}% · €${fees.pro.monthlyEur} / maand`,
    premium: `Business Premium: ${fees.premium.percent}% · €${fees.premium.monthlyEur} / maand`,
    stripeNote:
      'Schattingen van Stripe-betaalkosten voor kopers zijn geen HomeCheff-platformfee en worden hier niet als platforminkomsten gepresenteerd.',
  },
  marketplaceAffiliate: {
    title: 'Marketplace — affiliate',
    basis: `Tot maximaal ${PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE}% van de HomeCheff-platformfee`,
    notOrder: 'Niet: 50% van het verkoopbedrag.',
    exampleTitle: 'Voorbeeld',
    exampleSale: `Eligible Marketplace-verkoop: €${mpEx.saleEur}`,
    exampleFee: `Particulier-platformfee ${mpEx.feePercent}% = €${mpEx.feeEur.toFixed(0)}`,
    examplePool: `Maximale affiliatepool: ${PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE}% van €${mpEx.feeEur.toFixed(0)} = €${mpEx.poolEur.toFixed(0)}`,
    exampleClarify:
      'De klant betaalt deze affiliatevergoeding niet apart. Het bedrag komt uit de beschikbare HomeCheff-fee-pool. Bij meerdere geldige affiliate-relaties kan de pool volgens de actieve structuur worden verdeeld.',
    attribution:
      'Marketplace-attributie kan ontstaan via geldige referral-relaties rond koper- en/of verkopersactiviteit. Er komt geen extra beloning bovenop de beschikbare pool.',
  },
  mainSub: {
    title: 'Een affiliatenetwerk opbouwen',
    description:
      'In bepaalde programma’s, campagnes of groeiregio’s kan HomeCheff affiliates de mogelijkheid geven om andere affiliates uit te nodigen. Wanneer een MAIN/SUB-structuur geldt, wordt de beschikbare affiliatevergoeding verdeeld volgens het geldende partnerprogramma.',
    sub: `Partner / SUB: ${PUBLIC_SUB_PERCENT_OF_ELIGIBLE}%`,
    main: `MAIN: ${PUBLIC_MAIN_PERCENT_OF_ELIGIBLE}%`,
    combined: `Samen: tot ${PUBLIC_DIRECT_PERCENT_OF_ELIGIBLE}% van de geldende platforminkomsten-/fee-grondslag`,
    clarify:
      'Deze percentages zijn aandelen van de in aanmerking komende HomeCheff-platforminkomsten of -fee, niet van de volledige Marketplace-omzet (GMV).',
    availability:
      'Of je als MAIN kunt starten hangt af van regio, campagne of uitnodiging. Bestaande affiliate-relaties en opgebouwde verdiensten blijven behouden als publieke MAIN-aanmelding later verandert.',
  },
  delivery: {
    title: 'Bezorgen',
    age: 'Voor bezorgers geldt een leeftijdsgrens van 18+.',
    fee: `HomeCheff Delivery-platformfee: ${PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT}% van de eligible bezorgomzet`,
    affiliate: `Affiliatepool: tot ${PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE}% van die HomeCheff Delivery-platformfee`,
    exampleGross: `Eligible bezorgomzet: €${delEx.deliveryGrossEur}`,
    exampleFee: `Platformfee ${delEx.feePercent}% = €${delEx.feeEur.toFixed(2)}`,
    examplePool: `Maximale affiliatepool: €${delEx.poolEur.toFixed(2)}`,
    notCourier:
      'Je ontvangt niet automatisch 50% van het volledige bezorgbedrag van de bezorger.',
  },
  growth: {
    title: 'Growth',
    intro:
      'HomeCheff Growth — maandelijkse abonnementen exclusief btw (huidige officiële plannen).',
    free: `Free: €${PUBLIC_GROWTH_PLANS[0].monthlyEurExVat}`,
    basisTitle: 'Waarover wordt Growth-commissie berekend?',
    basisBody:
      `Growth-abonnementen bevatten HC die binnen het HomeCheff-ecosysteem gebruikt kunnen worden. Daarom reserveren we eerst de volledige waarde van de inbegrepen HC (1 HC = €0,01) van de abonnementsprijs exclusief btw. Van het resterende abonnementsbedrag — de deelbare marge — ontvang je ${PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT}% affiliatecommissie. De volledige abonnementsprijs is dus niet de commissiegrondslag. Inbegrepen HC en maandelijkse leadquota zijn aparte rechten: HC is geen leadquota. ${growthHcScopeNl}`,
    notOfVat:
      'Commissie wordt niet berekend over btw. Credit packs vallen niet onder affiliate-commissie.',
    flowPrice: 'Abonnementsprijs ex. btw',
    flowHcReserve: 'HC-reserve (face value)',
    flowMargin: 'Deelbare marge (restant na HC-reserve)',
    flowShare: `${PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT}% affiliateaandeel`,
    rewardDirect: `Directe affiliate: ${PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT}% van de deelbare marge (na aftrek van de HC-face-reserve van de eligible Growth-abonnementsomzet ex. btw)`,
    rewardMainSub: `MAIN/SUB waar van toepassing: Partner ${PUBLIC_SUB_PERCENT_OF_ELIGIBLE}% · MAIN ${PUBLIC_MAIN_PERCENT_OF_ELIGIBLE}% van dezelfde deelbare marge`,
    duration: `Looptijd: tot ${PUBLIC_GROWTH_COMMISSION_MONTHS} maanden volgens het geldende commissievenster`,
    packs:
      'Credit packs vallen niet onder affiliate-commissie.',
    planCards: growthPlanCardsNl(),
    cardLabels: {
      price: 'Abonnement',
      credits: 'Inbegrepen HC',
      leadQuota: 'Leadquota',
      hcReserve: 'HC-reserve',
      margin: 'Deelbare marge',
      marginPct: 'Aandeel van abonnementsprijs',
      affiliatePct: 'Jouw affiliate-aandeel',
      commission: 'Jouw commissie',
      recurring: 'Recurring',
    },
    paidOnlyNote:
      'Je ontvangt dit bedrag alleen voor een volledig betaalde abonnementsperiode met geldige attributie. Refunds, chargebacks of beëindiging kunnen de vergoeding blokkeren of terugdraaien.',
    payoutNote:
      'Growth-uitbetaling volgt de Growth-ledger: positief beschikbaar saldo kan uitbetaalbaar zijn volgens de Growth-regels (niet automatisch dezelfde Marketplace-drempel).',
  },
  studio: {
    title: 'Studio',
    intro: 'HomeCheff Studio — huidige maandelijkse plannen.',
    basisTitle: 'Waarover wordt Studio-commissie berekend?',
    basisBody:
      'De affiliatecommissie wordt berekend over de beschikbare commissiemarge, niet over de volledige abonnementsprijs. Die marge is de eligible residuale platformopbrengst: netto ontvangst exclusief btw, minus geschatte betaalkosten, minus de Model A HC-treasurydekking voor inbegrepen credits.',
    notSticker:
      '“50%” betekent dus niet automatisch de helft van de catalogusprijs (bijvoorbeeld niet automatisch €7,50 op Creator).',
    annual: `Jaarlijks (catalogus): €${formatPublicEurNl(PUBLIC_STUDIO_PLANS[0].yearlyEur)} · €${formatPublicEurNl(PUBLIC_STUDIO_PLANS[1].yearlyEur)} · €${formatPublicEurNl(PUBLIC_STUDIO_PLANS[2].yearlyEur)} — commissie volgt de betaalde factuurperiode binnen het venster.`,
    reward: `Voor Studio ontvang je ${PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL}% van de beschikbare commissiemarge (eligible residuale platformopbrengst).`,
    duration: `Looptijd: tot ${PUBLIC_STUDIO_COMMISSION_MONTHS} maanden`,
    flowPayment: 'Studio-betaling (catalogusprijs)',
    flowResidual: 'Beschikbare commissiemarge (residual)',
    flowShare: `${PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL}% affiliateaandeel`,
    planCards: studioPlanCardsNl(),
    cardLabels: {
      price: 'Abonnement',
      credits: 'Inbegrepen HC',
      leadQuota: 'Leadquota',
      hcReserve: 'HC-reserve',
      margin: 'Beschikbare marge',
      marginPct: 'Marge t.o.v. catalogusprijs',
      affiliatePct: 'Jouw affiliate-aandeel',
      commission: 'Jouw commissie',
      recurring: 'Recurring',
    },
    paidOnlyNote:
      'Je ontvangt dit bedrag alleen voor een volledig betaalde abonnementsperiode met geldige attributie. Ongebruikte credits veranderen de vaste illustratieve marge niet; extra packs kunnen apart eligible zijn volgens Studio-regels.',
  },
  personalCompany: {
    title: 'Persoonlijk of via je bedrijf',
    personalTitle: 'Als persoon',
    personalBody:
      'De affiliate-relatie hoort bij jouw persoonlijke account. Rapportage en uitbetaling lopen via de eligible persoonlijke deelnemer.',
    companyTitle: 'Via mijn bedrijf',
    companyBody:
      'De eligible attributie hoort bij de bedrijfsrelatie. Rapportage en uitbetaling lopen via de eligible bedrijfsdeelnemer.',
    sameRates:
      'Persoonlijk en bedrijf gebruiken dezelfde percentage-regels (direct 50% van de productgrondslag; MAIN/SUB 10%/40% waar van toepassing). Alleen eigenaarschap van attributie, rapportage en uitbetaling verschilt.',
  },
  windows: {
    title: 'Koppelperiode versus verdienperiode',
    lead:
      'De periode waarin een nieuwe gebruiker aan jouw link kan worden gekoppeld is niet hetzelfde als de periode waarin je na een geldige koppeling inkomsten kunt ontvangen.',
    cookie: `Eerste geldige referral / first-touch cookie: ${PUBLIC_ATTRIBUTION_COOKIE_DAYS} dagen`,
    marketplace: `Marketplace-verdiensten na geldige koppeling: tot ${PUBLIC_MARKETPLACE_REVENUE_WINDOW_DAYS} dagen`,
    growth: `Growth: tot ${PUBLIC_GROWTH_COMMISSION_MONTHS} maanden`,
    studio: `Studio: tot ${PUBLIC_STUDIO_COMMISSION_MONTHS} maanden`,
    notLifetime: 'Geen lifetime-commissie. De cookie duurt niet 365 dagen.',
  },
  payout: {
    title: 'Uitbetaling',
    marketplaceMin: `Marketplace-affiliate: minimale uitbetaling €${PUBLIC_MARKETPLACE_MIN_PAYOUT_EUR}`,
    marketplaceHold: `Nieuwe Marketplace-ledgerposten: wacht-/verwerkingsperiode van ${PUBLIC_LEDGER_PENDING_DAYS} dagen voordat ze beschikbaar kunnen zijn`,
    method: 'Uitbetaling via Stripe Connect waar dat voor jouw rol is ingericht',
    human:
      'Nieuwe affiliate-inkomsten kunnen eerst een wacht-/verwerkingsperiode hebben voordat ze beschikbaar zijn voor uitbetaling. Geen belofte van directe uitbetaling.',
    productSpecific:
      'Growth en Studio kunnen andere uitbetalingsdrempels volgen dan Marketplace — bekijk altijd de productspecifieke regels in je dashboard.',
  },
  comparison: {
    title: 'Vergelijking per platform',
    colPlatform: 'Platform',
    colPromote: 'Wat je promoot',
    colBasis: 'Berekeningsgrondslag',
    colReward: 'Directe affiliate',
    colDuration: 'Looptijd',
    rows: [
      {
        platform: 'Marketplace',
        promote: 'Kopers / verkopers / eligible Marketplace-activiteit',
        basis: 'HomeCheff-platformfee',
        reward: `Tot ${PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE}%`,
        duration: `${PUBLIC_MARKETPLACE_REVENUE_WINDOW_DAYS} dagen`,
      },
      {
        platform: 'Bezorgen',
        promote: 'Eligible bezorgactiviteit',
        basis: 'HomeCheff Delivery-platformfee',
        reward: `Tot ${PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE}%`,
        duration: 'Geldend gecertificeerd venster',
      },
      {
        platform: 'Growth',
        promote: 'Betaald abonnement',
        basis: 'Deelbare marge = restant na HC-face-reserve van abonnementsomzet ex. btw',
        reward: `${PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT}% van die marge`,
        duration: `${PUBLIC_GROWTH_COMMISSION_MONTHS} maanden`,
      },
      {
        platform: 'Studio',
        promote: 'Abonnement / eligible pack',
        basis: 'Commissiemarge = eligible residuale platformopbrengst',
        reward: `${PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL}% van die marge`,
        duration: `${PUBLIC_STUDIO_COMMISSION_MONTHS} maanden`,
      },
    ],
  },
  examples: {
    title: 'Voorbeeldberekeningen',
    disclaimer:
      'Voorbeeldberekeningen. Werkelijke verdiensten hangen af van geldige activiteit, attributie, programma en eventuele verdeling binnen een affiliatenetwerk. Geen gegarandeerd inkomen.',
  },
  international: {
    title: 'Internationaal',
    body:
      'HomeCheff is ontworpen om in de toekomst ook makers en klanten over landsgrenzen heen te verbinden. Internationale verkoop, betalingen en verzending worden per land beschikbaar gemaakt zodra de benodigde betaal-, uitbetalings- en verzendmogelijkheden zijn ondersteund.',
  },
  share: {
    title: 'Deel deze uitleg',
    label: 'Deel hoe verdienen werkt',
    text: 'Zo verdien je met HomeCheff: bekijk hoe platformfees, affiliatevergoedingen en uitbetaling werken voor Marketplace, Bezorgen, Growth en Studio.',
  },
} as const;

export const earnHowItWorksEn = {
  meta: {
    title: 'Earn with HomeCheff | Affiliate, Marketplace, Growth and Studio',
    description:
      'How earning works on HomeCheff: platform fees, affiliate rewards, calculation basis, duration and payout for Marketplace, Delivery, Growth and Studio.',
  },
  hero: {
    eyebrow: 'Earning explained',
    title: 'How you earn with HomeCheff',
    subtitle:
      'Sell, deliver or promote HomeCheff, Growth and Studio. See how income is calculated, which percentages apply and when you can get paid out.',
    ctaOpportunities: 'See earning opportunities',
    ctaAffiliate: 'Become an affiliate',
    ctaDashboard: 'Open my dashboard',
  },
  fundamentals: {
    title: 'The fundamental model first',
    lead:
      'An affiliate reward is calculated on the applicable HomeCheff platform revenue — not automatically on the customer’s full purchase amount.',
    flowCustomer: 'Customer payment',
    flowPlatform: 'HomeCheff platform revenue / platform fee',
    flowPool: 'Eligible affiliate pool',
    flowReward: 'Your affiliate reward',
    note:
      'Not every percentage uses the same base. “50% affiliate” does not mean “50% of the order value”.',
  },
  marketplace: {
    title: 'Marketplace — seller platform fees',
    intro:
      'If you sell via HomeCheff Checkout, a platform fee applies depending on your seller profile. Direct/contact settlements outside HomeCheff Checkout do not use this fee path.',
    checkoutNote:
      'Priced, eligible HomeCheff Checkout transactions use the payment rail and platform fee according to the active seller profile.',
    directNote:
      'Direct or contact arrangements outside HomeCheff Checkout do not run this Checkout platform-fee path.',
    individual: `Individual: ${fees.individual.percent}%`,
    basic: `Business Basic: ${fees.basic.percent}% · €${fees.basic.monthlyEur} / month`,
    pro: `Business Pro: ${fees.pro.percent}% · €${fees.pro.monthlyEur} / month`,
    premium: `Business Premium: ${fees.premium.percent}% · €${fees.premium.monthlyEur} / month`,
    stripeNote:
      'Buyer Stripe processing cost estimates are not HomeCheff platform fees and are not presented here as platform revenue.',
  },
  marketplaceAffiliate: {
    title: 'Marketplace — affiliate',
    basis: `Up to ${PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE}% of the HomeCheff platform fee`,
    notOrder: 'Not: 50% of the sale amount.',
    exampleTitle: 'Example',
    exampleSale: `Eligible Marketplace sale: €${mpEx.saleEur}`,
    exampleFee: `Individual platform fee ${mpEx.feePercent}% = €${mpEx.feeEur.toFixed(0)}`,
    examplePool: `Maximum affiliate pool: ${PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE}% of €${mpEx.feeEur.toFixed(0)} = €${mpEx.poolEur.toFixed(0)}`,
    exampleClarify:
      'The customer does not pay this affiliate amount separately. It comes from the eligible HomeCheff fee pool. If multiple eligible affiliate relationships apply, the pool can be distributed according to the active structure.',
    attribution:
      'Marketplace attribution can originate from eligible referral relationships connected to buyer and/or seller activity. No extra reward is added on top of the available pool.',
  },
  mainSub: {
    title: 'Building an affiliate network',
    description:
      'In selected programmes, campaigns or growth regions, HomeCheff may let affiliates invite other affiliates. When a MAIN/SUB structure applies, the available affiliate reward is shared according to the partner programme.',
    sub: `Partner / SUB: ${PUBLIC_SUB_PERCENT_OF_ELIGIBLE}%`,
    main: `MAIN: ${PUBLIC_MAIN_PERCENT_OF_ELIGIBLE}%`,
    combined: `Combined: up to ${PUBLIC_DIRECT_PERCENT_OF_ELIGIBLE}% of the eligible platform revenue / fee basis`,
    clarify:
      'These percentages are shares of eligible HomeCheff platform revenue or fee — not of full Marketplace GMV.',
    availability:
      'Whether you can start as MAIN depends on region, campaign or invitation. Existing affiliate relationships and accrued earnings remain if public MAIN enrolment later changes.',
  },
  delivery: {
    title: 'Delivery',
    age: 'Delivery providers must be 18+.',
    fee: `HomeCheff Delivery platform fee: ${PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT}% of eligible delivery gross`,
    affiliate: `Affiliate pool: up to ${PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE}% of that HomeCheff Delivery platform fee`,
    exampleGross: `Eligible delivery gross: €${delEx.deliveryGrossEur}`,
    exampleFee: `Platform fee ${delEx.feePercent}% = €${delEx.feeEur.toFixed(2)}`,
    examplePool: `Maximum affiliate pool: €${delEx.poolEur.toFixed(2)}`,
    notCourier:
      'You do not automatically receive 50% of the courier’s full delivery amount.',
  },
  growth: {
    title: 'Growth',
    intro:
      'HomeCheff Growth — monthly subscriptions excluding VAT (current official plans).',
    free: `Free: €${PUBLIC_GROWTH_PLANS[0].monthlyEurExVat}`,
    basisTitle: 'What is Growth commission calculated on?',
    basisBody:
      `Growth subscriptions include HC that can be used across the HomeCheff ecosystem. That is why we reserve the full face value of included HC first (1 HC = €0.01) from the subscription price excluding VAT. Of the remaining subscription amount — the distributable margin — you receive ${PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT}% affiliate commission. The full subscription price is therefore not the commission base. Included HC and monthly lead quota are separate entitlements: HC is not lead quota. ${growthHcScopeEn}`,
    notOfVat:
      'Commission is not calculated on VAT. Credit packs are not commissionable.',
    flowPrice: 'Subscription price ex VAT',
    flowHcReserve: 'HC reserve (face value)',
    flowMargin: 'Distributable margin (remainder after HC reserve)',
    flowShare: `${PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT}% affiliate share`,
    rewardDirect: `Direct affiliate: ${PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT}% of the distributable margin (after deducting the HC face reserve from eligible Growth subscription revenue ex VAT)`,
    rewardMainSub: `MAIN/SUB where applicable: Partner ${PUBLIC_SUB_PERCENT_OF_ELIGIBLE}% · MAIN ${PUBLIC_MAIN_PERCENT_OF_ELIGIBLE}% of the same distributable margin`,
    duration: `Duration: up to ${PUBLIC_GROWTH_COMMISSION_MONTHS} months under the certified commission window`,
    packs:
      'Credit packs are not commissionable.',
    planCards: growthPlanCardsEn(),
    cardLabels: {
      price: 'Subscription',
      credits: 'Included HC',
      leadQuota: 'Lead quota',
      hcReserve: 'HC reserve',
      margin: 'Distributable margin',
      marginPct: 'Share of subscription price',
      affiliatePct: 'Your affiliate share',
      commission: 'Your commission',
      recurring: 'Recurring',
    },
    paidOnlyNote:
      'You receive this amount only for a fully paid subscription period with valid attribution. Refunds, chargebacks or cancellation can block or reverse the reward.',
    payoutNote:
      'Growth payout follows the Growth ledger: positive available balance may be payable under Growth rules (not automatically the same Marketplace threshold).',
  },
  studio: {
    title: 'Studio',
    intro: 'HomeCheff Studio — current monthly plans.',
    basisTitle: 'What is Studio commission calculated on?',
    basisBody:
      'Affiliate commission is calculated on the available commissionable margin, not on the full subscription list price. That margin is the eligible residual platform revenue: net receipt excluding VAT, minus estimated payment costs, minus Model A HC treasury coverage for included credits.',
    notSticker:
      '“50%” therefore does not automatically mean half the catalogue price (e.g. not automatically €7.50 on Creator).',
    annual: `Annual (catalogue): €${formatPublicEurEn(PUBLIC_STUDIO_PLANS[0].yearlyEur)} · €${formatPublicEurEn(PUBLIC_STUDIO_PLANS[1].yearlyEur)} · €${formatPublicEurEn(PUBLIC_STUDIO_PLANS[2].yearlyEur)} — commission follows the paid invoice period within the window.`,
    reward: `For Studio you receive ${PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL}% of the available commissionable margin (eligible residual platform revenue).`,
    duration: `Duration: up to ${PUBLIC_STUDIO_COMMISSION_MONTHS} months`,
    flowPayment: 'Studio payment (catalogue price)',
    flowResidual: 'Available commissionable margin (residual)',
    flowShare: `${PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL}% affiliate share`,
    planCards: studioPlanCardsEn(),
    cardLabels: {
      price: 'Subscription',
      credits: 'Included HC',
      leadQuota: 'Lead quota',
      hcReserve: 'HC reserve',
      margin: 'Available margin',
      marginPct: 'Margin vs catalogue price',
      affiliatePct: 'Your affiliate share',
      commission: 'Your commission',
      recurring: 'Recurring',
    },
    paidOnlyNote:
      'You receive this amount only for a fully paid subscription period with valid attribution. Unused credits do not change the fixed illustrative margin; extra packs may be separately eligible under Studio rules.',
  },
  personalCompany: {
    title: 'Personal or via your company',
    personalTitle: 'As a person',
    personalBody:
      'The affiliate relationship belongs to your personal account. Reporting and payout go to the eligible personal participant.',
    companyTitle: 'Via my company',
    companyBody:
      'Eligible attribution belongs to the company relationship. Reporting and payout go to the eligible company participant.',
    sameRates:
      'Personal and company use the same percentage rules (direct 50% of the product basis; MAIN/SUB 10%/40% where applicable). Only ownership of attribution, reporting and payout differs.',
  },
  windows: {
    title: 'Attribution window vs earning window',
    lead:
      'The period in which a new user can be linked to your referral is not the same as the period in which you can earn after a valid link.',
    cookie: `Initial referral / first-touch cookie: ${PUBLIC_ATTRIBUTION_COOKIE_DAYS} days`,
    marketplace: `Marketplace earnings after a valid link: up to ${PUBLIC_MARKETPLACE_REVENUE_WINDOW_DAYS} days`,
    growth: `Growth: up to ${PUBLIC_GROWTH_COMMISSION_MONTHS} months`,
    studio: `Studio: up to ${PUBLIC_STUDIO_COMMISSION_MONTHS} months`,
    notLifetime: 'No lifetime commission. The cookie does not last 365 days.',
  },
  payout: {
    title: 'Payout',
    marketplaceMin: `Marketplace affiliate: minimum payout €${PUBLIC_MARKETPLACE_MIN_PAYOUT_EUR}`,
    marketplaceHold: `New Marketplace ledger entries: ${PUBLIC_LEDGER_PENDING_DAYS}-day hold/processing before they can become available`,
    method: 'Payout via Stripe Connect where set up for your role',
    human:
      'New affiliate earnings may first have a hold/processing period before they are available for payout. No instant-payout promise.',
    productSpecific:
      'Growth and Studio may follow different payout thresholds than Marketplace — always check product-specific rules in your dashboard.',
  },
  comparison: {
    title: 'Comparison by platform',
    colPlatform: 'Platform',
    colPromote: 'What you promote',
    colBasis: 'Calculation basis',
    colReward: 'Direct affiliate',
    colDuration: 'Duration',
    rows: [
      {
        platform: 'Marketplace',
        promote: 'Buyers / sellers / eligible Marketplace activity',
        basis: 'HomeCheff platform fee',
        reward: `Up to ${PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE}%`,
        duration: `${PUBLIC_MARKETPLACE_REVENUE_WINDOW_DAYS} days`,
      },
      {
        platform: 'Delivery',
        promote: 'Eligible delivery activity',
        basis: 'HomeCheff Delivery platform fee',
        reward: `Up to ${PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE}%`,
        duration: 'Applicable certified window',
      },
      {
        platform: 'Growth',
        promote: 'Paid subscription',
        basis: 'Distributable margin = residual after HC face reserve from subscription revenue ex VAT',
        reward: `${PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT}% of that margin`,
        duration: `${PUBLIC_GROWTH_COMMISSION_MONTHS} months`,
      },
      {
        platform: 'Studio',
        promote: 'Subscription / eligible pack',
        basis: 'Commissionable margin = eligible residual platform revenue',
        reward: `${PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL}% of that margin`,
        duration: `${PUBLIC_STUDIO_COMMISSION_MONTHS} months`,
      },
    ],
  },
  examples: {
    title: 'Example calculations',
    disclaimer:
      'Example calculations. Actual earnings depend on valid activity, attribution, programme and any split within an affiliate network. No guaranteed income.',
  },
  international: {
    title: 'International',
    body:
      'HomeCheff is designed to connect makers and customers across borders in the future. International selling, payments and shipping become available per country once the required payment, payout and shipping capabilities are supported.',
  },
  share: {
    title: 'Share this explainer',
    label: 'Share how earning works',
    text: 'How you earn with HomeCheff: see how platform fees, affiliate rewards and payout work for Marketplace, Delivery, Growth and Studio.',
  },
} as const;

export type EarnHowItWorksCopy = typeof earnHowItWorksNl;

export function getEarnHowItWorksCopy(lang: EarnHowItWorksLang): EarnHowItWorksCopy {
  return lang === 'en'
    ? (earnHowItWorksEn as unknown as EarnHowItWorksCopy)
    : earnHowItWorksNl;
}
