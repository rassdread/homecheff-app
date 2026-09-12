#!/usr/bin/env npx tsx
import fs from 'node:fs';
function loadEnv(file: string) {
  const o: Record<string, string> = {};
  if (!fs.existsSync(file)) return o;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    o[m[1]!] = v;
  }
  return o;
}
const env = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v;

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const TITLE_RE = /(test|cert|certification|fixture|e2e|probe|smoke|geoautohc|demo|opsdata|appcert|sctacta|finalcert|ddash|mediacert|homecheff-validation)/i;
const EMAIL_RE = /@(homecheff-validation\.test|homecheff\.invalid|homecheff\.test|example\.com)$/i;

const users = await prisma.user.findMany({
  where: {
    OR: [
      { bio: { contains: 'certificationFixture' } },
      { email: { contains: 'homecheff-validation.test' } },
      { email: { contains: 'homecheff.invalid' } },
      { email: { endsWith: '@homecheff.test' } },
      { email: { contains: 'mediacert' } },
    ],
  },
  select: { id: true, email: true, bio: true, SellerProfile: { select: { id: true } } },
  take: 500,
});

const sellerIds = users.map((u) => u.SellerProfile?.id).filter(Boolean) as string[];

const byOwner = sellerIds.length
  ? await prisma.product.findMany({
      where: { sellerId: { in: sellerIds } },
      select: {
        id: true,
        title: true,
        isActive: true,
        integrityStatus: true,
        createdAt: true,
        sellerId: true,
        seller: { select: { userId: true, User: { select: { email: true, bio: true } } } },
      },
      take: 2000,
    })
  : [];

const byTitle = await prisma.product.findMany({
  where: {
    OR: [
      { title: { contains: 'CERT', mode: 'insensitive' } },
      { title: { contains: 'certification', mode: 'insensitive' } },
      { title: { contains: 'fixture', mode: 'insensitive' } },
      { title: { contains: 'E2E', mode: 'insensitive' } },
      { title: { contains: 'GeoAutoHC', mode: 'insensitive' } },
      { title: { contains: 'AppCert', mode: 'insensitive' } },
      { title: { contains: 'OpsData', mode: 'insensitive' } },
      { title: { contains: 'FinalCert', mode: 'insensitive' } },
      { title: { contains: '[test]', mode: 'insensitive' } },
      { description: { contains: 'certificationFixture' } },
      { description: { contains: 'Private certification fixture' } },
    ],
  },
  select: {
    id: true,
    title: true,
    isActive: true,
    integrityStatus: true,
    createdAt: true,
    sellerId: true,
    seller: { select: { userId: true, User: { select: { email: true, bio: true } } } },
  },
  take: 2000,
});

const map = new Map<string, (typeof byTitle)[0]>();
for (const p of [...byOwner, ...byTitle]) map.set(p.id, p);
const all = [...map.values()];

const publicish = all.filter((p) => p.isActive === true);
const privateish = all.filter((p) => p.isActive !== true);

const suspiciousReal = all.filter((p) => {
  const email = p.seller?.User?.email || '';
  const bio = p.seller?.User?.bio || '';
  const ownedByFixture = EMAIL_RE.test(email) || /certificationFixture/i.test(bio);
  const titleLooksTest = TITLE_RE.test(p.title || '');
  // real user with only "test" in title — flag separately
  return !ownedByFixture && titleLooksTest;
});

console.log(JSON.stringify({
  TOTAL_TEST_ITEMS_FOUND: all.length,
  PUBLIC_TEST_ITEMS_FOUND: publicish.length,
  PRIVATE_TEST_ITEMS_FOUND: privateish.length,
  SUSPICIOUS_TITLE_ONLY_NON_FIXTURE_OWNER: suspiciousReal.length,
  fixtureUsers: users.length,
  publicSamples: publicish.slice(0, 30).map((p) => ({
    id: p.id,
    title: p.title,
    isActive: p.isActive,
    integrityStatus: p.integrityStatus,
    email: p.seller?.User?.email,
    bio: (p.seller?.User?.bio || '').slice(0, 80),
  })),
  privateSamples: privateish.slice(0, 20).map((p) => ({
    id: p.id,
    title: p.title,
    isActive: p.isActive,
    email: p.seller?.User?.email,
  })),
  suspiciousRealSamples: suspiciousReal.slice(0, 15).map((p) => ({
    id: p.id,
    title: p.title,
    isActive: p.isActive,
    email: p.seller?.User?.email,
  })),
}, null, 2));

await prisma.$disconnect();
