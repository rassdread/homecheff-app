/**
 * Read-only Production inventory: Steve buyer + r.sergio delivery Connect readiness.
 *
 *   npx tsx --env-file=.env.local scripts/delivery-controlled-e2e-inventory.ts
 */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const STEVE = 'c54bbbcf-1323-4539-8e30-c2a6b7f95662';
const SERGIO = '7647bf21-e9ab-4e3a-af83-eeec23e24dcb';

function load(p: string) {
  const o: Record<string, string> = {};
  if (!existsSync(p)) return o;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    o[m[1]!] = v;
  }
  return o;
}

function mask(id: string | null | undefined) {
  if (!id) return null;
  return `${id.slice(0, 8)}…#${createHash('sha256').update(id).digest('hex').slice(0, 8)}`;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const [steve, sergio] = await Promise.all([
      prisma.user.findUnique({
        where: { id: STEVE },
        select: { id: true, email: true, country: true, city: true, lat: true, lng: true },
      }),
      prisma.user.findUnique({
        where: { id: SERGIO },
        select: {
          id: true,
          email: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
        },
      }),
    ]);

    const sergioProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: SERGIO },
    });

    const listings = await prisma.product.findMany({
      where: { sellerId: SERGIO },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        title: true,
        priceCents: true,
        stock: true,
        maxStock: true,
        isActive: true,
        pickupLat: true,
        pickupLng: true,
        placeName: true,
      },
    });

    let stripeReport: Record<string, unknown> = {
      RSERGIO_STRIPE_CONNECT_ACCOUNT: mask(sergio?.stripeConnectAccountId ?? null),
      RSERGIO_STRIPE_CONNECT_READY: Boolean(
        sergio?.stripeConnectOnboardingCompleted,
      ),
      RSERGIO_PAYOUTS_ENABLED: null,
      RSERGIO_CHARGES_ENABLED: null,
    };

    const key = process.env.STRIPE_SECRET_KEY;
    if (sergio?.stripeConnectAccountId && key) {
      const stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' });
      const acct = await stripe.accounts.retrieve(sergio.stripeConnectAccountId);
      stripeReport = {
        RSERGIO_STRIPE_CONNECT_ACCOUNT: mask(acct.id),
        RSERGIO_STRIPE_CONNECT_READY: Boolean(acct.details_submitted),
        RSERGIO_PAYOUTS_ENABLED: Boolean(acct.payouts_enabled),
        RSERGIO_CHARGES_ENABLED: Boolean(acct.charges_enabled),
      };
    }

    const growthEnv = {
      ...load('../homecheff-leads/.env'),
      ...load('../homecheff-leads/.env.local'),
    };
    let steveHc: Record<string, unknown> = {
      STEVE_HC_TOTAL: null,
      STEVE_MARKETPLACE_ELIGIBLE_HC: null,
    };

    if (growthEnv.DATABASE_URL) {
      const req = createRequire(
        '/Users/sergioarrias/HomeCheffProjects/homecheff-leads/package.json',
      );
      const pg = req('pg') as typeof import('pg');
      const gc = new pg.Client({
        connectionString: growthEnv.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      await gc.connect();
      try {
        const link = await gc.query<{ centralUserId: string; platform: string }>(
          `SELECT "centralUserId", platform::text AS platform
           FROM "PlatformIdentityLink"
           WHERE "platformUserId" = $1
           LIMIT 10`,
          [STEVE],
        );
        const central =
          link.rows.find((r) => /market/i.test(r.platform))?.centralUserId ??
          link.rows[0]?.centralUserId;
        if (central) {
          const w = await gc.query<{
            availableHc: string;
            reservedHc: string;
            status: string;
          }>(
            `SELECT "availableHc"::text, "reservedHc"::text, status::text
             FROM "HcWallet" WHERE "centralUserId" = $1 LIMIT 1`,
            [central],
          );
          steveHc = {
            STEVE_CENTRAL_MASK: mask(central),
            STEVE_HC_TOTAL: Number(w.rows[0]?.availableHc ?? 0),
            STEVE_HC_RESERVED: Number(w.rows[0]?.reservedHc ?? 0),
            STEVE_HC_STATUS: w.rows[0]?.status ?? null,
            STEVE_MARKETPLACE_ELIGIBLE_HC: Number(w.rows[0]?.availableHc ?? 0),
            STEVE_IDENTITY_LINKS: link.rows.map((r) => r.platform),
          };
        } else {
          steveHc = { STEVE_HC_TOTAL: null, STEVE_HC_NOTE: 'no_identity_link' };
        }
      } catch (e) {
        steveHc = {
          STEVE_HC_ERROR: e instanceof Error ? e.message : String(e),
        };
      } finally {
        await gc.end();
      }
    }

    const out = {
      at: new Date().toISOString(),
      STEVE_USER_ID: mask(STEVE),
      STEVE_ACCOUNT_ACTIVE: Boolean(steve),
      STEVE_STRIPE_CUSTOMER_READY: 'CHECK_PRIOR_ORDERS',
      STEVE_CITY: steve?.city ?? null,
      STEVE_HAS_COORDS: steve?.lat != null && steve?.lng != null,
      STEVE_TEST_CERT_SCOPE: 'PENDING_PRIVATE_CERT_GATE',
      ...steveHc,
      RSERGIO_USER_ID: mask(SERGIO),
      RSERGIO_DELIVERY_PROVIDER_EXISTS: Boolean(sergioProfile),
      RSERGIO_PROVIDER_TYPE: sergioProfile?.providerType ?? null,
      RSERGIO_PROFILE: sergioProfile
        ? {
            id: sergioProfile.id,
            isActive: sergioProfile.isActive,
            isVerified: sergioProfile.isVerified,
            isBlocked: sergioProfile.isBlocked,
            isOnline: sergioProfile.isOnline,
            pricingEnabled: sergioProfile.pricingEnabled,
            baseFeeCents: sergioProfile.baseFeeCents,
            pricePerKmCents: sergioProfile.pricePerKmCents,
            minimumFeeCents: sergioProfile.minimumFeeCents,
            hasHome:
              sergioProfile.homeLat != null && sergioProfile.homeLng != null,
            homeLat: sergioProfile.homeLat,
            homeLng: sergioProfile.homeLng,
            maxDistance: sergioProfile.maxDistance,
            nationalCoverage: sergioProfile.nationalCoverage,
          }
        : null,
      ...stripeReport,
      LISTINGS: listings.map((l) => ({
        id: l.id,
        title: (l.title || '').slice(0, 40),
        priceCents: l.priceCents,
        stock: l.stock,
        maxStock: l.maxStock,
        isActive: l.isActive,
        hasPickup: l.pickupLat != null && l.pickupLng != null,
        placeName: l.placeName,
      })),
    };

    console.log(JSON.stringify(out, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
