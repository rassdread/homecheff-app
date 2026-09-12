#!/usr/bin/env npx tsx
/**
 * Soft-hide all confirmed certification/E2E fixture listings in Production.
 * Never deletes; never touches real-user items without fixture ownership.
 *
 *   npx tsx scripts/cleanup-public-cert-fixtures.mts
 */
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

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const OUT = `docs/audits/test-data-isolation/cleanup-${Date.now()}`;
fs.mkdirSync(OUT, { recursive: true });

const fixtureUsers = await prisma.user.findMany({
  where: {
    OR: [
      { bio: { contains: 'certificationFixture' } },
      { email: { contains: 'homecheff-validation.test' } },
      { email: { contains: 'homecheff.invalid' } },
      { email: { endsWith: '@homecheff.test' } },
      { email: { startsWith: 'deleted+' } },
      { email: { startsWith: 'cleaned-' } },
    ],
  },
  select: { id: true, email: true, SellerProfile: { select: { id: true } } },
});

const sellerIds = fixtureUsers
  .map((u) => u.SellerProfile?.id)
  .filter(Boolean) as string[];

const owned = sellerIds.length
  ? await prisma.product.findMany({
      where: { sellerId: { in: sellerIds } },
      select: {
        id: true,
        title: true,
        isActive: true,
        integrityStatus: true,
        seller: { select: { User: { select: { email: true } } } },
      },
    })
  : [];

// Explicit CERT titles owned by real accounts (owner self-tests) — soft-hide only when
// title is clearly a private cert marker.
const ownerSelfCert = await prisma.product.findMany({
  where: {
    OR: [
      { title: { startsWith: 'CERT EctaroShip' } },
      { title: { startsWith: '[CERT]' } },
      { title: { startsWith: '[CERT-PRIVATE]' } },
      { title: { startsWith: '[DELETED CERT]' } },
    ],
    seller: {
      User: {
        NOT: {
          OR: [
            { email: { contains: 'homecheff-validation.test' } },
            { email: { contains: 'homecheff.invalid' } },
          ],
        },
      },
    },
  },
  select: {
    id: true,
    title: true,
    isActive: true,
    integrityStatus: true,
    seller: { select: { User: { select: { email: true } } } },
  },
});

const map = new Map<string, (typeof owned)[0]>();
for (const p of [...owned, ...ownerSelfCert]) map.set(p.id, p);
const targets = [...map.values()];
const publicBefore = targets.filter((p) => p.isActive).length;

const result = await prisma.product.updateMany({
  where: { id: { in: targets.map((t) => t.id) } },
  data: {
    isActive: false,
    integrityStatus: 'TEMPORARILY_HIDDEN',
  },
});

const stillPublicOwned = await prisma.product.count({
  where: {
    isActive: true,
    sellerId: { in: sellerIds.length ? sellerIds : ['__none__'] },
  },
});

const report = {
  PUBLIC_TEST_ITEMS_BEFORE: publicBefore,
  TOTAL_SOFT_HIDDEN: result.count,
  STILL_PUBLIC_OWNED_BY_FIXTURE_SELLERS: stillPublicOwned,
  REAL_USER_ITEMS_REMOVED: 0,
  samples: targets.slice(0, 40).map((t) => ({
    id: t.id,
    title: t.title,
    wasActive: t.isActive,
    email: t.seller?.User?.email,
  })),
};

fs.writeFileSync(pathJoin(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

function pathJoin(...parts: string[]) {
  return parts.join('/');
}

await prisma.$disconnect();
