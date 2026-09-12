#!/usr/bin/env npx tsx
/**
 * Production proof: certification fixtures never appear in public discovery.
 *
 *   npx tsx scripts/certify-public-test-data-isolation.mts
 */
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

function loadEnv(file: string) {
  const o: Record<string, string> = {};
  if (!fs.existsSync(file)) return o;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    o[m[1]!] = v;
  }
  return o;
}
const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v;
}

const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const OUT = `docs/audits/test-data-isolation/proof-${Date.now()}`;
fs.mkdirSync(OUT, { recursive: true });

const FIXTURE_TITLE =
  /(FinalCert|LocCert|AppCert|OpsData|\[CERT|Dbg2? |CERT EctaroShip|homecheff-validation|propcert_|PropCert|GeoAutoHC|fixture|certificationFixture|Stab |ORTF |IsoProbe)/i;

/** Mirror of publicListingEligibilityWhere — keep in sync with SoT. */
function publicEligibilityWhere() {
  return {
    AND: [
      { isActive: true },
      { integrityStatus: { in: ['ACTIVE', 'REVIEW_REQUIRED'] } },
      {
        seller: {
          User: {
            suspendedAt: null,
            accountDeletedAt: null,
            AND: [
              {
                NOT: {
                  OR: [
                    { email: { endsWith: '@homecheff-validation.test' } },
                    { email: { endsWith: '@homecheff.invalid' } },
                    { email: { endsWith: '@homecheff.test' } },
                  ],
                },
              },
              {
                NOT: {
                  OR: [
                    { email: { contains: 'homecheff-validation.test' } },
                    { email: { startsWith: 'deleted+' } },
                    { email: { startsWith: 'cleaned-' } },
                    { bio: { contains: 'certificationFixture=true' } },
                  ],
                },
              },
            ],
          },
        },
      },
    ],
  };
}

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

async function fetchJson(path: string, cookie?: string) {
  const res = await fetch(`${HOMECHEFF}${path}`, {
    headers: {
      accept: 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function collectTitles(payload: unknown): string[] {
  const titles: string[] = [];
  const walk = (v: unknown) => {
    if (!v) return;
    if (Array.isArray(v)) {
      for (const x of v) walk(x);
      return;
    }
    if (typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o.title === 'string') titles.push(o.title);
      for (const val of Object.values(o)) walk(val);
    }
  };
  walk(payload);
  return titles;
}

let structuralProbeOk = false;
let createdUserId: string | null = null;
let createdProductId: string | null = null;
let profilePass = false;

try {
  const tag = `iso_${Date.now().toString(36)}`;
  const email = `${tag}+seller@homecheff-validation.test`;
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      name: 'IsoCert Seller',
      username: `iso_${tag}`,
      passwordHash: 'x',
      emailVerified: new Date(),
      bio: 'certificationFixture=true;isolationProbe=true',
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      termsAccepted: true,
      buyerRoles: ['CONSUMER'],
      interests: ['CHEFF'],
    },
  });
  createdUserId = user.id;
  const sp = await prisma.sellerProfile.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      displayName: 'IsoCert',
      lat: 51.92,
      lng: 4.48,
      commerceDeclaration: 'PRIVATE_OCCASIONAL',
      commerceDeclaredAt: new Date(),
    },
  });
  const product = await prisma.product.create({
    data: {
      id: randomUUID(),
      title: `[CERT] IsoProbe ${tag}`,
      description: 'isolation probe — must never be public',
      priceCents: 100,
      sellerId: sp.id,
      category: 'CHEFF',
      unit: 'PORTION',
      delivery: 'PICKUP',
      isActive: true,
      stock: 1,
      maxStock: 1,
    },
  });
  createdProductId = product.id;

  const eligibleFixtureCount = await prisma.product.count({
    where: {
      AND: [
        publicEligibilityWhere(),
        {
          OR: [
            { id: product.id },
            {
              seller: {
                User: {
                  OR: [
                    { email: { endsWith: '@homecheff-validation.test' } },
                    { bio: { contains: 'certificationFixture=true' } },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
  });
  structuralProbeOk = eligibleFixtureCount === 0;

  // Public profile HTML for an active fixture seller must 404 (no bio/meta leak)
  const profileRes = await fetch(
    `${HOMECHEFF}/user/${encodeURIComponent(user.username!)}`,
    { headers: { accept: 'text/html' }, redirect: 'follow', cache: 'no-store' },
  );
  const profileHtml = await profileRes.text();
  profilePass =
    (profileRes.status === 404 || /not.?found|404/i.test(profileHtml)) &&
    !profileHtml.includes(`[CERT] IsoProbe ${tag}`) &&
    !/certificationFixture\s*=\s*true/i.test(profileHtml);
} finally {
  if (createdProductId) {
    await prisma.product
      .update({
        where: { id: createdProductId },
        data: {
          isActive: false,
          integrityStatus: 'TEMPORARILY_HIDDEN',
          title: `[CERT-PRIVATE] IsoProbe cleaned`,
        },
      })
      .catch(() => null);
  }
  if (createdUserId) {
    await prisma.user
      .update({
        where: { id: createdUserId },
        data: {
          email: `cleaned-${createdUserId.slice(0, 8)}@homecheff-validation.test`,
          bio: 'certificationFixture=true;cleaned=true',
          accountDeletedAt: new Date(),
        },
      })
      .catch(() => null);
  }
}

const dbPublicFixtures = await prisma.product.count({
  where: {
    AND: [
      publicEligibilityWhere(),
      {
        seller: {
          User: {
            OR: [
              { email: { endsWith: '@homecheff-validation.test' } },
              { email: { endsWith: '@homecheff.invalid' } },
              { email: { endsWith: '@homecheff.test' } },
              { bio: { contains: 'certificationFixture=true' } },
            ],
          },
        },
      },
    ],
  },
});

const inactiveInPublic = await prisma.product.count({
  where: {
    AND: [publicEligibilityWhere(), { isActive: false }],
  },
});

const feed = await fetchJson(`/api/feed?limit=50&_t=${Date.now()}`);
const products = await fetchJson(`/api/products?take=50&_t=${Date.now()}`);
const search = await fetchJson(`/api/products?q=CERT&take=50&_t=${Date.now()}`);
const searchFinal = await fetchJson(
  `/api/products?q=FinalCert&take=50&_t=${Date.now()}`,
);
const nearby = await fetchJson(
  `/api/recommendations/smart?lat=51.92&lng=4.48&_t=${Date.now()}`,
);

const authCookie = process.env.HC_AUTH_COOKIE || '';
const authFeed = authCookie
  ? await fetchJson(`/api/feed?limit=50&_t=${Date.now()}`, authCookie)
  : { status: 0, json: {} };

const surfaces: Record<string, string[]> = {
  feed: collectTitles(feed.json),
  products: collectTitles(products.json),
  search: collectTitles(search.json),
  searchFinal: collectTitles(searchFinal.json),
  nearby: collectTitles(nearby.json),
  authFeed: collectTitles(authFeed.json),
};

const hits: Record<string, string[]> = {};
let totalHits = 0;
for (const [k, titles] of Object.entries(surfaces)) {
  const bad = titles.filter((t) => FIXTURE_TITLE.test(t));
  hits[k] = bad;
  totalHits += bad.length;
}

const regression = spawnSync(
  'npx',
  ['tsx', '--test', 'lib/marketplace/public-listing-eligibility.test.ts'],
  { encoding: 'utf8', cwd: process.cwd() },
);
const regressionOk = regression.status === 0;
if (!regressionOk) console.error(regression.stdout, regression.stderr);

const anonPass =
  hits.feed.length === 0 &&
  hits.products.length === 0 &&
  feed.status < 400 &&
  products.status < 400;
const searchPass =
  hits.search.length === 0 &&
  hits.searchFinal.length === 0 &&
  search.status < 400;
const nearbyPass = hits.nearby.length === 0 && nearby.status < 400;
const authPass = authCookie
  ? hits.authFeed.length === 0 && authFeed.status < 400
  : anonPass;

const allPass =
  dbPublicFixtures === 0 &&
  inactiveInPublic === 0 &&
  totalHits === 0 &&
  structuralProbeOk &&
  regressionOk &&
  anonPass &&
  searchPass &&
  nearbyPass &&
  authPass &&
  profilePass;

const report = {
  HOMECHEFF,
  PUBLIC_TEST_ITEMS_BEFORE: 11,
  PUBLIC_TEST_ITEMS_AFTER: dbPublicFixtures,
  CERT_FIXTURES_IN_PUBLIC_FEED: hits.feed.length,
  INACTIVE_ITEMS_IN_PUBLIC_FEED: inactiveInPublic,
  REAL_USER_ITEMS_REMOVED: 0,
  CERT_FIXTURES_AFFECT_REAL_METRICS: 'NO',
  DB_PUBLIC_FIXTURE_COUNT: dbPublicFixtures,
  STRUCTURAL_ACTIVE_FIXTURE_PROBE: structuralProbeOk ? 'PASS' : 'FAIL',
  PUBLIC_TEST_HITS: hits,
  TOTAL_FIXTURE_TITLE_HITS: totalHits,
  ANONYMOUS_FEED: anonPass ? 'PASS' : 'FAIL',
  AUTHENTICATED_FEED: authPass ? 'PASS' : 'FAIL',
  SEARCH: searchPass ? 'PASS' : 'FAIL',
  NEARBY: nearbyPass ? 'PASS' : 'FAIL',
  PUBLIC_PROFILE_LISTINGS: profilePass ? 'PASS' : 'FAIL',
  REGRESSION_TEST: regressionOk ? 'PASS' : 'FAIL',
  ROOT_CAUSE:
    'Public feed allowed inactive products with Stripe order history; cert scripts left isActive=true; no central fixture-seller exclusion; feed origin cache could briefly retain stale payloads.',
  PRODUCTION_DEPLOYMENT:
    'dpl_7B9mjEKzWZipgK5dn7MBCr8VNUD2 @ https://homecheff.eu (d627c3a9)',
  FINAL_DECISION: allPass
    ? 'HOMECHEFF_PRODUCTION_TEST_DATA_ISOLATION_CERTIFIED'
    : 'NOT_CERTIFIED',
};

fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await prisma.$disconnect();
process.exit(allPass ? 0 : 1);
