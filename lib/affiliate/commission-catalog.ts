/**
 * Affiliate sales menu. Amounts come from the certified economics helpers.
 * This file does not store a second price list.
 */
import {
  calculateBusinessSubscriptionCommission,
  calculateParentAffiliateBusinessCommission,
} from '@/lib/affiliate-config';
import {
  PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT,
  PUBLIC_GROWTH_PLAN_ECONOMICS,
  PUBLIC_MAIN_PERCENT_OF_ELIGIBLE,
  PUBLIC_MARKETPLACE_SELLER_FEES,
  PUBLIC_STUDIO_PACKS,
  PUBLIC_SUB_PERCENT_OF_ELIGIBLE,
  PUBLIC_STUDIO_PLAN_ECONOMICS,
  allocateStudioPlanEconomics,
} from '@/lib/earn/public-economics';
import { calculatePlatformFeeCents } from '@/lib/fees';
import { viewerOrderAffiliateCents } from '@/lib/earn/passive-income-scenario';
import { marketplaceSaleEconomics } from '@/lib/affiliate/marketplace-sale-economics';

export const CATALOG_ORDER_ASSUMPTION_EUR = 100;
export const POPULARITY_SORT_AVAILABLE = false;
export const CONVERSION_SORT_AVAILABLE = false;
export const POPULARITY_DATA_SOURCE = 'none';
export const CONVERSION_DATA_SOURCE = 'none';

export type CatalogPlatform = 'Growth' | 'Marketplace' | 'Studio';
export type CatalogKind = 'recurring' | 'purchase' | 'transaction';

export type CatalogRow = {
  id: string;
  platform: CatalogPlatform;
  product: string;
  fitNl: string;
  fitEn: string;
  customerPriceCents: number | null;
  priceLabelNl: string;
  priceLabelEn: string;
  affiliateCents: number;
  earningLabelNl: string;
  earningLabelEn: string;
  kind: CatalogKind;
  promo: boolean;
  network: boolean;
  detailNl: string[];
  detailEn: string[];
  /** MAIN share when this product has a network layer. Null when it does not. */
  networkMainCents?: number | null;
  /** SUB share of the same affiliate margin. Null when this product has no network layer. */
  networkSubCents?: number | null;
};

function eur(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

const RECURRING_NL = 'Loopt door zolang de klant kwalificerend actief blijft.';
const RECURRING_EN = 'Continues for as long as the customer stays qualifying.';
const LONG_NL =
  'Een klant die je vandaag aanbrengt, kan jaren onderdeel blijven van je klantenportefeuille. Blijft die klant 2, 5 of 20 jaar kwalificerend actief, dan kan de commissie gedurende die periode blijven doorlopen.';
const LONG_EN =
  'A customer you refer today can stay in your portfolio for years. If they remain qualifying for 2, 5 or 20 years, commission can continue through that period.';
const STOP_NL =
  'Stopt de klant met het betreffende betaalde product, dan stopt ook de toekomstige commissie uit dat product.';
const STOP_EN =
  'If the customer stops the qualifying paid product, future commission from that product stops too.';
const REFUND_NL =
  'Geen kwalificerende betaling, geen commissie. Een terugbetaling kan de commissie op die transactie terugdraaien.';
const REFUND_EN =
  'No qualifying payment means no commission. A refund can reverse the commission on that transaction.';

function growthRows(): CatalogRow[] {
  return PUBLIC_GROWTH_PLAN_ECONOMICS.map((plan) => {
    const direct = Math.round(plan.affiliateCommissionEur * 100);
    const residualCents = Math.round(plan.commissionableBaseEur * 100);
    const main = Math.floor((residualCents * PUBLIC_MAIN_PERCENT_OF_ELIGIBLE) / 100);
    const sub = Math.floor((residualCents * PUBLIC_SUB_PERCENT_OF_ELIGIBLE) / 100);
    const company = Math.round(plan.commissionableBaseEur * 100) - direct;
    const price = plan.customerPriceEur
      ? `${eur(Math.round(plan.customerPriceEur * 100))} incl. btw`
      : `${eur(Math.round(plan.priceEurExVat * 100))} excl. btw`;
    const priceEn = plan.customerPriceEur
      ? `${eur(Math.round(plan.customerPriceEur * 100))} incl. VAT`
      : `${eur(Math.round(plan.priceEurExVat * 100))} ex VAT`;
    return {
      id: `growth-${plan.key}`,
      platform: 'Growth',
      product: `Growth ${plan.label}`,
      fitNl:
        plan.key === 'starter'
          ? 'Een kleiner bedrijf dat begint met leadgeneratie.'
          : plan.key === 'business' || plan.key === 'enterprise'
            ? 'Een bedrijf met een grotere behoefte aan leads.'
            : 'Een bedrijf dat verder is dan de eerste leadstroom.',
      fitEn:
        plan.key === 'starter'
          ? 'A smaller business starting with lead generation.'
          : plan.key === 'business' || plan.key === 'enterprise'
            ? 'A business with a larger need for leads.'
            : 'A business beyond its first lead flow.',
      customerPriceCents: Math.round((plan.customerPriceEur ?? plan.priceEurExVat) * 100),
      priceLabelNl: price,
      priceLabelEn: priceEn,
      affiliateCents: direct,
      earningLabelNl: `${eur(direct)} per kwalificerende betaalperiode`,
      earningLabelEn: `${eur(direct)} per qualifying billing period`,
      kind: 'recurring',
      promo: true,
      network: true,
      detailNl: [
        `Klantprijs excl. btw: ${eur(Math.round(plan.priceEurExVat * 100))}.`,
        `HC-reserve in de formule: ${eur(Math.round(plan.hcReserveEur * 100))} (${plan.affiliateCapacityHc} HC). Dat is niet het aantal HC dat de klant krijgt (${plan.customerEntitlementHc}).`,
        `Deelbare marge: ${eur(Math.round(plan.commissionableBaseEur * 100))}.`,
        `Directe affiliate: ${eur(direct)}. HomeCheff: ${eur(company)}.`,
        `Als MAIN/SUB geldt: SUB ${eur(sub)}, MAIN ${eur(main)}, van dezelfde deelbare marge.`,
        'Een actiecode haalt de korting uit het affiliatedeel.',
        RECURRING_NL,
        LONG_NL,
        STOP_NL,
        REFUND_NL,
      ],
      networkMainCents: main,
      networkSubCents: sub,
      detailEn: [
        `Customer price ex VAT: ${eur(Math.round(plan.priceEurExVat * 100))}.`,
        `HC reserve in the formula: ${eur(Math.round(plan.hcReserveEur * 100))} (${plan.affiliateCapacityHc} HC). That is not the HC the customer receives (${plan.customerEntitlementHc}).`,
        `Distributable margin: ${eur(Math.round(plan.commissionableBaseEur * 100))}.`,
        `Direct affiliate: ${eur(direct)}. HomeCheff: ${eur(company)}.`,
        `Where MAIN/SUB applies: SUB ${eur(sub)}, MAIN ${eur(main)}, of the same distributable margin.`,
        'A promo code takes the discount from the affiliate share.',
        RECURRING_EN,
        LONG_EN,
        STOP_EN,
        REFUND_EN,
      ],
    };
  });
}

function studioSubscriptionRows(): CatalogRow[] {
  return PUBLIC_STUDIO_PLAN_ECONOMICS.map((plan) => {
    const direct = Math.round(plan.affiliateCommissionEur * 100);
    return {
      id: `studio-${plan.key}`,
      platform: 'Studio',
      product: `Studio ${plan.label}`,
      fitNl: 'Een maker of team dat met Studio content maakt.',
      fitEn: 'A maker or team creating content with Studio.',
      customerPriceCents: Math.round(plan.priceEurGrossInclVat * 100),
      priceLabelNl: `${eur(Math.round(plan.priceEurGrossInclVat * 100))} incl. btw / maand`,
      priceLabelEn: `${eur(Math.round(plan.priceEurGrossInclVat * 100))} incl. VAT / month`,
      affiliateCents: direct,
      earningLabelNl: `${eur(direct)} per kwalificerende betaalperiode`,
      earningLabelEn: `${eur(direct)} per qualifying billing period`,
      kind: 'recurring',
      promo: false,
      network: false,
      detailNl: [
        `Netto excl. btw: ${eur(Math.round(plan.netExVatEur * 100))}.`,
        `Geschatte betaalkosten: ${eur(Math.round(plan.stripeFeeEur * 100))}. HC-dekking in de formule: ${eur(Math.round(plan.hcTreasuryCoverageEur * 100))}.`,
        `Beschikbare marge: ${eur(Math.round(plan.distributableMarginEur * 100))}. Directe affiliate: ${eur(direct)} (50% van die marge, niet van de klantprijs).`,
        'Studio gebruikt deze restantformule. Dat is niet de Growth-formule en niet de Marketplace-fee.',
        'De commissie gaat naar de affiliate aan wie de klant is toegeschreven. Dit overzicht rekent geen extra main-laag op Studio.',
        RECURRING_NL,
        LONG_NL,
        STOP_NL,
        REFUND_NL,
      ],
      detailEn: [
        `Net ex VAT: ${eur(Math.round(plan.netExVatEur * 100))}.`,
        `Estimated payment cost: ${eur(Math.round(plan.stripeFeeEur * 100))}. HC coverage in the formula: ${eur(Math.round(plan.hcTreasuryCoverageEur * 100))}.`,
        `Available margin: ${eur(Math.round(plan.distributableMarginEur * 100))}. Direct affiliate: ${eur(direct)} (50% of that margin, not of the customer price).`,
        'Studio uses this residual formula. It is not the Growth formula and not the Marketplace fee.',
        'Commission goes to the affiliate the customer is attributed to. This view does not add an extra main layer on Studio.',
        RECURRING_EN,
        LONG_EN,
        STOP_EN,
        REFUND_EN,
      ],
    };
  });
}

function studioPackRows(): CatalogRow[] {
  return PUBLIC_STUDIO_PACKS.map((pack) => {
    const econ = allocateStudioPlanEconomics({
      key: 'creator',
      grossPriceEur: pack.priceEur,
      hcGranted: pack.hc,
    });
    const direct = Math.round(econ.affiliateCommissionEur * 100);
    return {
      id: `studio-pack-${pack.hc}`,
      platform: 'Studio',
      product: `Studio-tegoed ${pack.hc} HC`,
      fitNl: 'Een bestaande Studio-klant die extra tegoed koopt.',
      fitEn: 'An existing Studio customer buying extra credit.',
      customerPriceCents: Math.round(pack.priceEur * 100),
      priceLabelNl: `${eur(Math.round(pack.priceEur * 100))} incl. btw, eenmalig`,
      priceLabelEn: `${eur(Math.round(pack.priceEur * 100))} incl. VAT, one-off`,
      affiliateCents: direct,
      earningLabelNl: `${eur(direct)} per kwalificerende aankoop`,
      earningLabelEn: `${eur(direct)} per qualifying purchase`,
      kind: 'purchase',
      promo: false,
      network: false,
      detailNl: [
        `De klant ontvangt ${pack.hc} HC.`,
        `Commissiebasis na de Studio-restantformule: ${eur(Math.round(econ.distributableMarginEur * 100))}. Affiliate: ${eur(direct)}.`,
        'Dit is commissie per aankoop. De klantrelatie kan daarna wel in je portefeuille blijven, zodat een latere kwalificerende aankoop opnieuw commissie kan opleveren.',
        REFUND_NL,
      ],
      detailEn: [
        `The customer receives ${pack.hc} HC.`,
        `Commission basis after the Studio residual formula: ${eur(Math.round(econ.distributableMarginEur * 100))}. Affiliate: ${eur(direct)}.`,
        'This is commission per purchase. The customer relationship can stay in your portfolio, so a later qualifying purchase can earn commission again.',
        REFUND_EN,
      ],
    };
  });
}

function businessPlanRows(): CatalogRow[] {
  const plans = [
    { id: 'basic', name: 'Basic', fee: PUBLIC_MARKETPLACE_SELLER_FEES.basic },
    { id: 'pro', name: 'Pro', fee: PUBLIC_MARKETPLACE_SELLER_FEES.pro },
    { id: 'premium', name: 'Premium', fee: PUBLIC_MARKETPLACE_SELLER_FEES.premium },
  ] as const;
  return plans
    .filter((plan) => plan.fee.monthlyEur && plan.fee.monthlyEur > 0)
    .map((plan) => {
      const cents = Math.round(plan.fee.monthlyEur! * 100);
      const direct = calculateBusinessSubscriptionCommission(cents, 0, false);
      const sub = calculateBusinessSubscriptionCommission(cents, 0, true);
      const main = calculateParentAffiliateBusinessCommission(cents);
      return {
        id: `marketplace-plan-${plan.id}`,
        platform: 'Marketplace' as const,
        product: `Marketplace ${plan.name}`,
        fitNl: 'Een verkoper die als bedrijf via HomeCheff wil verkopen, met een lager transactietarief.',
        fitEn: 'A seller who wants to sell as a business on HomeCheff, with a lower transaction rate.',
        customerPriceCents: cents,
        priceLabelNl: `${eur(cents)} / maand, transactietarief ${plan.fee.percent}%`,
        priceLabelEn: `${eur(cents)} / month, transaction rate ${plan.fee.percent}%`,
        affiliateCents: direct.finalAffiliateCommissionCents,
        earningLabelNl: `${eur(direct.finalAffiliateCommissionCents)} per kwalificerende betaalperiode`,
        earningLabelEn: `${eur(direct.finalAffiliateCommissionCents)} per qualifying billing period`,
        kind: 'recurring' as const,
        promo: true,
        network: true,
        detailNl: [
          `Dit is een Marketplace-bedrijfsabonnement, niet Growth. Er zit geen HC-reserve in deze formule.`,
          `Abonnementsfee: ${eur(cents)}. Directe affiliate: ${eur(direct.affiliateCommissionCents)}. HomeCheff: ${eur(direct.homecheffShareCents)}.`,
          `Als de affiliate een SUB is: SUB ${eur(sub.affiliateCommissionCents)}, MAIN ${eur(main)}.`,
          'Een actiecode voor dit abonnement komt uit het affiliatedeel.',
          RECURRING_NL,
          LONG_NL,
          STOP_NL,
          REFUND_NL,
        ],
        networkMainCents: main,
        networkSubCents: sub.affiliateCommissionCents,
        detailEn: [
          `This is a Marketplace business subscription, not Growth. This formula has no HC reserve.`,
          `Subscription fee: ${eur(cents)}. Direct affiliate: ${eur(direct.affiliateCommissionCents)}. HomeCheff: ${eur(direct.homecheffShareCents)}.`,
          `If the affiliate is a SUB: SUB ${eur(sub.affiliateCommissionCents)}, MAIN ${eur(main)}.`,
          'A promo code for this subscription comes from the affiliate share.',
          RECURRING_EN,
          LONG_EN,
          STOP_EN,
          REFUND_EN,
        ],
      };
    });
}

function orderRows(): CatalogRow[] {
  const sale = marketplaceSaleEconomics({
    saleCents: CATALOG_ORDER_ASSUMPTION_EUR * 100,
    feePercent: PUBLIC_MARKETPLACE_SELLER_FEES.individual.percent,
  });
  const buyer = {
    id: 'marketplace-buyer',
    product: 'Marketplace-koper',
    fitNl: 'Iemand die op HomeCheff koopt.',
    fitEn: 'Someone who buys on HomeCheff.',
  };
  const seller = {
    id: 'marketplace-seller',
    product: 'Marketplace-verkoper',
    fitNl: 'Iemand die via HomeCheff verkoopt.',
    fitEn: 'Someone who sells through HomeCheff.',
  };
  return [buyer, seller].map((row) => ({
    id: row.id,
    platform: 'Marketplace' as const,
    product: row.product,
    fitNl: row.fitNl,
    fitEn: row.fitEn,
    customerPriceCents: null,
    priceLabelNl: `Variabel. Vergelijking bij een order van ${eur(sale.saleCents)}, particulier tarief ${sale.feePercent}%.`,
    priceLabelEn: `Variable. Comparison uses an order of ${eur(sale.saleCents)}, private rate ${sale.feePercent}%.`,
    affiliateCents: sale.singleAffiliate.viewerCommissionCents,
    earningLabelNl: `${eur(sale.singleAffiliate.viewerCommissionCents)} per kwalificerende transactie bij een order van ${eur(sale.saleCents)}`,
    earningLabelEn: `${eur(sale.singleAffiliate.viewerCommissionCents)} per qualifying transaction on an order of ${eur(sale.saleCents)}`,
    kind: 'transaction' as const,
    promo: false,
    network: false,
    detailNl: [
      `Order ${eur(sale.saleCents)}. Platformfee ${eur(sale.platformFeeCents)}. De verkoper houdt ${eur(sale.sellerProceedsCents)} over vóór andere kosten. De affiliatecommissie komt uit de fee, niet uit het verkopersdeel.`,
      `Eén affiliate op de order: ${eur(sale.singleAffiliate.viewerCommissionCents)} (de hele pool).`,
      `Koper en verkoper via twee affiliates: ${eur(sale.twoAffiliates.viewerCommissionCents)} en ${eur(sale.twoAffiliates.otherCommissionCents)}.`,
      'Per kwalificerende transactie. De klant blijft in je portefeuille zolang de affiliate-relatie kwalificeert, zodat een latere order opnieuw commissie kan opleveren.',
      'Geen eigen actiecode op een Marketplace-bestelling in dit overzicht.',
      REFUND_NL,
    ],
    detailEn: [
      `Order ${eur(sale.saleCents)}. Platform fee ${eur(sale.platformFeeCents)}. The seller keeps ${eur(sale.sellerProceedsCents)} before other costs. Affiliate commission comes from the fee, not from the seller share.`,
      `One affiliate on the order: ${eur(sale.singleAffiliate.viewerCommissionCents)} (the whole pool).`,
      `Buyer and seller through two affiliates: ${eur(sale.twoAffiliates.viewerCommissionCents)} and ${eur(sale.twoAffiliates.otherCommissionCents)}.`,
      'Per qualifying transaction. The customer stays in your portfolio while the affiliate relationship qualifies, so a later order can earn commission again.',
      'No own promo code on a Marketplace order in this view.',
      REFUND_EN,
    ],
  }));
}

function deliveryRow(): CatalogRow {
  const deliveryCents = 1000;
  const fee = calculatePlatformFeeCents(deliveryCents, PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT);
  const pool = viewerOrderAffiliateCents({ platformFeeCents: fee, scenario: 'single' });
  return {
    id: 'delivery-fee',
    platform: 'Marketplace',
    product: 'Bezorgfee',
    fitNl: 'Een klant van wie de bestelling met HomeCheff-bezorging gaat.',
    fitEn: 'A customer whose order uses HomeCheff delivery.',
    customerPriceCents: null,
    priceLabelNl: `Voorbeeld bij ${eur(deliveryCents)} bezorgkosten.`,
    priceLabelEn: `Example on ${eur(deliveryCents)} delivery cost.`,
    affiliateCents: pool.viewerCommissionCents,
    earningLabelNl: `${eur(pool.viewerCommissionCents)} per kwalificerende bezorgfee in dit voorbeeld`,
    earningLabelEn: `${eur(pool.viewerCommissionCents)} per qualifying delivery fee in this example`,
    kind: 'transaction',
    promo: false,
    network: false,
    detailNl: [
      `Platformfee op bezorgkosten: ${PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT}%, hier ${eur(fee)}.`,
      `Affiliatepool: ${eur(pool.poolCents)}. De koper-affiliate krijgt die pool als die er is. Alleen zonder koper-affiliate kan de bezorger-affiliate de pool krijgen. Nooit allebei.`,
      'Per kwalificerende bezorging, niet als vast maandbedrag.',
    ],
    detailEn: [
      `Platform fee on delivery cost: ${PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT}%, here ${eur(fee)}.`,
      `Affiliate pool: ${eur(pool.poolCents)}. The buyer affiliate receives that pool when present. Only without a buyer affiliate can the courier affiliate receive the pool. Never both.`,
      'Per qualifying delivery, not as a fixed monthly amount.',
    ],
  };
}

export function buildAffiliateCommissionCatalog(): CatalogRow[] {
  return [
    ...growthRows(),
    ...studioSubscriptionRows(),
    ...studioPackRows(),
    ...businessPlanRows(),
    ...orderRows(),
    deliveryRow(),
  ];
}

export function sortCatalog(
  rows: CatalogRow[],
  sort: 'commission' | 'price' | 'recurring' | 'platform',
): CatalogRow[] {
  const copy = [...rows];
  if (sort === 'price') {
    return copy.sort(
      (a, b) =>
        (a.customerPriceCents ?? Number.MAX_SAFE_INTEGER) -
        (b.customerPriceCents ?? Number.MAX_SAFE_INTEGER),
    );
  }
  if (sort === 'recurring') {
    const rank = { recurring: 0, purchase: 1, transaction: 2 };
    return copy.sort((a, b) => rank[a.kind] - rank[b.kind] || b.affiliateCents - a.affiliateCents);
  }
  if (sort === 'platform') {
    return copy.sort((a, b) => a.platform.localeCompare(b.platform) || a.product.localeCompare(b.product));
  }
  return copy.sort((a, b) => b.affiliateCents - a.affiliateCents);
}
