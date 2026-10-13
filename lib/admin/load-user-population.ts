import { prisma } from '@/lib/prisma';
import {
  anonymizedUserWhere,
  demonstrableTestUserWhere,
  marketingSourceFromTouch,
  realUserWhere,
  registrationOrigin,
  type AdminUserPopulationSnapshot,
  type MeasuredCount,
  type RegistrationOrigin,
} from '@/lib/admin/user-population';

export type { AdminUserPopulationSnapshot };

const META_VISITORS_NOTE =
  'Meta-bezoekers worden niet in de database opgeslagen. De pixel en GA sturen geen bezoekersaantal terug, en cookietoestemming blokkeert analytics zonder toestemming.';

const ALL_TIME = 'Alle echte accounts, geen periodefilter';
const USER_SOURCE = 'User, centrale classificatie echte accounts';

function measured(
  value: number | null,
  complete: boolean,
  period: string,
  source: string,
  definition: string,
): MeasuredCount {
  return { value, complete, period, source, definition };
}

function startOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function loadAdminUserPopulation(now = new Date()): Promise<AdminUserPopulationSnapshot> {
  const real = realUserWhere();
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = startOfLocalDay(now);

  const [
    totalRegistered,
    totalRealUsers,
    totalVerified,
    totalActive,
    totalSoftDeleted,
    totalTestAccounts,
    newUsersToday,
    newUsers7Days,
    newUsers30Days,
    unverifiedRealUsers,
    attributions,
    realRows,
    listingSellers,
    paidBuyers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: real }),
    prisma.user.count({ where: { AND: [real, { emailVerified: { not: null } }] } }),
    prisma.user.count({ where: { AND: [real, { updatedAt: { gte: day7 } }] } }),
    prisma.user.count({ where: anonymizedUserWhere() }),
    prisma.user.count({ where: demonstrableTestUserWhere() }),
    prisma.user.count({ where: { AND: [real, { createdAt: { gte: today } }] } }),
    prisma.user.count({ where: { AND: [real, { createdAt: { gte: day7 } }] } }),
    prisma.user.count({ where: { AND: [real, { createdAt: { gte: day30 } }] } }),
    prisma.user.count({ where: { AND: [real, { emailVerified: null }] } }),
    prisma.attribution.findMany({
      where: { type: { in: ['USER_SIGNUP', 'BUSINESS_SIGNUP'] } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.user.findMany({
      where: real,
      select: {
        id: true,
        emailVerified: true,
        sellerActivatedAt: true,
        acquisitionActivatedAt: true,
        acquisitionFirstTouch: true,
      },
    }),
    prisma.product.findMany({
      where: { seller: { User: real } },
      distinct: ['sellerId'],
      select: { seller: { select: { userId: true } } },
    }),
    prisma.order.findMany({
      where: {
        stripeSessionId: { not: null },
        NOT: { orderNumber: { startsWith: 'SUB-' } },
        User: real,
      },
      distinct: ['userId'],
      select: { userId: true },
    }),
  ]);

  const affiliateIds = new Set(attributions.map((row) => row.userId));
  const origins: Record<RegistrationOrigin, number> = {
    meta: 0,
    affiliate: 0,
    organic: 0,
    recorded_other: 0,
    unknown: 0,
  };
  let metaVerified = 0;
  let metaActivated = 0;
  let metaFirstListing = 0;
  let metaFirstTransaction = 0;
  const marketing = { meta: 0, organic: 0, recorded_other: 0, unknown: 0 };
  let affiliateRegistrations = 0;
  let metaAffiliateOverlap = 0;
  let accountActivated = 0;
  let firstListingPublished = 0;
  const paidBuyerIds = new Set(paidBuyers.map((row) => row.userId));
  const listingCreatorIds = new Set(listingSellers.map((row) => row.seller.userId));

  for (const row of realRows) {
    const hasAffiliate = affiliateIds.has(row.id);
    const origin = registrationOrigin({
      acquisitionFirstTouch: row.acquisitionFirstTouch,
      hasAffiliateAttribution: hasAffiliate,
    });
    origins[origin] += 1;
    const marketingSource = marketingSourceFromTouch(row.acquisitionFirstTouch);
    marketing[marketingSource] += 1;
    if (hasAffiliate) affiliateRegistrations += 1;
    if (marketingSource === 'meta' && hasAffiliate) metaAffiliateOverlap += 1;
    if (row.acquisitionActivatedAt) accountActivated += 1;
    if (row.sellerActivatedAt) firstListingPublished += 1;
    if (marketingSource !== 'meta') continue;
    if (row.emailVerified) metaVerified += 1;
    if (row.acquisitionActivatedAt) metaActivated += 1;
    if (row.sellerActivatedAt) metaFirstListing += 1;
    if (paidBuyerIds.has(row.id)) metaFirstTransaction += 1;
  }

  const campaignPeriod = ALL_TIME;
  const notMeasured = measured(
    null,
    false,
    campaignPeriod,
    'Geen opgeslagen gebeurtenis',
    'Iemand opende het registratieformulier. Dat moment wordt niet bewaard.',
  );

  return {
    totalRegistered,
    totalRealUsers,
    totalVerified,
    totalActive,
    totalSoftDeleted,
    totalTestAccounts,
    newUsersToday,
    newUsers7Days,
    newUsers30Days,
    unverifiedRealUsers,
    origins,
    meta: {
      visitors: null,
      visitorsNote: META_VISITORS_NOTE,
      registrations: origins.meta,
      verifiedRegistrations: metaVerified,
      activatedUsers: metaActivated,
      firstListing: metaFirstListing,
      firstTransaction: metaFirstTransaction,
    },
    campaign: {
      realUsers: measured(totalRealUsers, true, campaignPeriod, USER_SOURCE, 'Account dat geen testaccount en geen verwijderd account is.'),
      newToday: measured(newUsersToday, true, 'Kalenderdag van de server, vanaf middernacht', USER_SOURCE, 'Echt account aangemaakt vandaag.'),
      new7Days: measured(newUsers7Days, true, 'Afgelopen 7 keer 24 uur', USER_SOURCE, 'Echt account aangemaakt in de afgelopen 7 dagen.'),
      new30Days: measured(newUsers30Days, true, 'Afgelopen 30 keer 24 uur', USER_SOURCE, 'Echt account aangemaakt in de afgelopen 30 dagen.'),
      verified: measured(totalVerified, true, campaignPeriod, 'User.emailVerified', 'Echt account met een ingevulde verificatiedatum.'),
      unverified: measured(unverifiedRealUsers, true, campaignPeriod, 'User.emailVerified is leeg', 'Echt account zonder verificatiedatum. Testaccounts zitten hier niet in.'),
      marketingMeta: measured(marketing.meta, true, campaignPeriod, 'User.acquisitionFirstTouch', 'Eerste opgeslagen verkeersbron heeft utm_source meta, facebook, fb, instagram of ig. Een affiliatecode alleen is geen Meta-bron.'),
      marketingOrganic: measured(marketing.organic, true, campaignPeriod, 'User.acquisitionFirstTouch', 'Opgeslagen utm_medium organic of referral, of utm_source organic of direct. Ontbrekende bron telt niet als organisch.'),
      marketingOther: measured(marketing.recorded_other, true, campaignPeriod, 'User.acquisitionFirstTouch', 'Er is een UTM opgeslagen die niet Meta en niet organisch is.'),
      marketingUnknown: measured(marketing.unknown, true, campaignPeriod, 'User.acquisitionFirstTouch', 'Geen opgeslagen UTM. Dit is onbekend, niet organisch en niet Meta.'),
      affiliateRegistrations: measured(affiliateRegistrations, true, campaignPeriod, 'Attribution USER_SIGNUP of BUSINESS_SIGNUP', 'Echt account met een affiliate-registratie. Dit is een andere dimensie dan de marketingbron en mag daarbij niet worden opgeteld.'),
      metaAffiliateOverlap: measured(metaAffiliateOverlap, true, campaignPeriod, 'UTM én Attribution', 'Echt account dat zowel een Meta-UTM als een affiliate-registratie heeft.'),
      funnel: {
        registrationStarted: notMeasured,
        registrationCompleted: measured(totalRealUsers, true, campaignPeriod, USER_SOURCE, 'Er is een echt account aangemaakt. Een latere login telt niet opnieuw.'),
        emailVerified: measured(totalVerified, true, campaignPeriod, 'User.emailVerified', 'Het e-mailadres is geverifieerd. Opnieuw verifiëren telt niet opnieuw.'),
        accountActivated: measured(
          accountActivated,
          false,
          campaignPeriod,
          'User.acquisitionActivatedAt',
          'Eerste betekenisvolle actie: bewaren of betaalde bestelling als koper, of eerste kwaliteitslisting als verkoper. E-mailverificatie is deze stap niet. Oudere activaties zonder timestamp zijn niet teruggezet.',
        ),
        firstListingCreated: measured(
          listingCreatorIds.size,
          false,
          'Huidige productrijen',
          'Product via SellerProfile van een echt account',
          'Minstens één productrij die nu bestaat. Verwijderde producten zijn niet meegeteld. Dit is geen bewijs dat er nooit een listing is geweest.',
        ),
        firstListingPublished: measured(
          firstListingPublished,
          false,
          campaignPeriod,
          'User.sellerActivatedAt',
          'Eerste kwaliteitslisting die als gepubliceerd is vastgelegd. Listings van vóór dit veld zijn niet teruggezet.',
        ),
        firstTransactionCompleted: measured(
          paidBuyerIds.size,
          false,
          'Huidige Stripe-bestellingen',
          'Order met stripeSessionId, zonder abonnementsnummer SUB-',
          'Echte koper met minstens één Stripe-bestelling. HC-only ruilen zit niet in dit getal en is apart niet gemeten.',
        ),
      },
      metaFunnel: {
        registered: measured(marketing.meta, true, campaignPeriod, 'User.acquisitionFirstTouch', 'META_REGISTERED. Echt account met opgeslagen Meta-UTM. Historische accounts zonder UTM blijven onbekend.'),
        verified: measured(metaVerified, true, campaignPeriod, 'Meta-UTM én User.emailVerified', 'META_VERIFIED. Meta-account met verificatiedatum.'),
        activated: measured(metaActivated, false, campaignPeriod, 'Meta-UTM én User.acquisitionActivatedAt', 'META_ACTIVATED. Zelfde activatieregel als de trechter. Oudere activaties zonder timestamp zijn niet teruggezet.'),
        firstListing: measured(metaFirstListing, false, campaignPeriod, 'Meta-UTM én User.sellerActivatedAt', 'META_FIRST_LISTING. Eerste vastgelegde kwaliteitslisting.'),
        firstTransaction: measured(metaFirstTransaction, false, campaignPeriod, 'Meta-UTM én Stripe-bestelling', 'META_FIRST_TRANSACTION. Zelfde Stripe-regel als de trechter. HC-only is niet gemeten.'),
      },
      separationNote:
        'Interne registratie-attributie staat op het account en hangt niet af van de Meta Pixel. Pixel-events en Meta Ads Manager kunnen afwijken door toestemming, het attributievenster en mensen die de pixel blokkeren. Die drie cijfers zijn niet hetzelfde getal. Marketingbron en affiliateherkomst zijn aparte dimensies.',
    },
  };
}
