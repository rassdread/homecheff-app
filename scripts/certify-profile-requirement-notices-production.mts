/**
 * Authenticated production smoke: profile/account notices name the exact gap.
 *
 *   npx tsx scripts/certify-profile-requirement-notices-production.mts
 */
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

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
    ) {
      v = v.slice(1, -1);
    }
    o[m[1]!] = v;
  }
  return o;
}

const appEnvEarly = { ...loadEnv('.env'), ...loadEnv('.env.local') };
for (const [k, v] of Object.entries(appEnvEarly)) {
  if (!process.env[k]) process.env[k] = v;
}

const { PrismaClient } = await import('@prisma/client');
const bcrypt = (await import('bcryptjs')).default;
const requireFromApp = createRequire(path.join(process.cwd(), 'package.json'));

const HOMECHEFF = process.env.PROD_URL || 'https://homecheff.eu';
const TAG = `preq_${Date.now().toString(36)}`;
const OUT_DIR = 'docs/audits/profile-requirement-notices-cert';
const PASSWORD = 'PReqCert!Only';

type Gate = 'PASS' | 'FAIL' | 'BLOCKED' | 'NONE';

function gate(ok: boolean): 'PASS' | 'FAIL' {
  return ok ? 'PASS' : 'FAIL';
}

const GENERIC_RE =
  /^(Maak je profiel af|Maak je profiel compleet|Maak je profiel completer\.?|Voltooi je bezorgprofiel|Je profiel is nog niet compleet\.?|Je account is nog niet compleet\.?|Profiel bijwerken|Profiel aanvullen|Rond je bezorgprofiel af|Bezorgprofiel afronden)$/i;

function isGeneric(text: unknown): boolean {
  if (typeof text !== 'string' || !text.trim()) return false;
  return GENERIC_RE.test(text.trim());
}

function itemTexts(items: Array<{ title?: string; description?: string; actionLabel?: string }>) {
  return items.flatMap((i) => [i.title, i.description, i.actionLabel]);
}

async function mintCookie(secret: string, userId: string, email: string) {
  const { encode } = requireFromApp('next-auth/jwt') as {
    encode: (p: {
      token: Record<string, unknown>;
      secret: string;
      maxAge?: number;
    }) => Promise<string>;
  };
  const token = await encode({
    token: { sub: userId, email, id: userId, name: email.split('@')[0] },
    secret,
    maxAge: 3600,
  });
  return [
    `__Secure-next-auth.session-token=${token}`,
    `next-auth.session-token=${token}`,
  ].join('; ');
}

async function api(
  cookie: string | null,
  method: string,
  urlPath: string,
  body?: unknown,
) {
  const res = await fetch(`${HOMECHEFF}${urlPath}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      accept: 'application/json',
      'cache-control': 'no-store',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 800) };
  }
  return { status: res.status, json };
}

async function createUser(
  prisma: InstanceType<typeof PrismaClient>,
  over: Record<string, unknown>,
) {
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - 28);
  const email = String(over.email);
  return prisma.user.create({
    data: {
      id: randomUUID(),
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      emailVerified: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      termsAccepted: true,
      dateOfBirth: dob,
      role: 'BUYER',
      buyerRoles: ['CONSUMER'],
      interests: ['CHEFF'],
      name: 'PReq User',
      ...over,
      email,
    } as any,
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    console.log(
      JSON.stringify(
        { PRODUCTION_AUTHENTICATED_SMOKE: 'BLOCKED', reason: 'missing NEXTAUTH_SECRET' },
        null,
        2,
      ),
    );
    process.exit(2);
  }

  const prisma = new PrismaClient();
  const createdUserIds: string[] = [];
  const results: Record<string, Gate> = {};

  try {
    const complete = await createUser(prisma, {
      email: `${TAG}+complete@homecheff-validation.test`,
      username: `prc_${TAG}`.slice(0, 28),
      name: 'Compleet Account',
      image: 'https://homecheff.eu/icon.png',
      place: 'Schiedam',
      city: 'Schiedam',
      country: 'NL',
      postalCode: '3111AA',
      lat: 51.919,
      lng: 4.329,
      termsAccepted: true,
    });
    createdUserIds.push(complete.id);

    const noPlace = await createUser(prisma, {
      email: `${TAG}+noplace@homecheff-validation.test`,
      username: `prn_${TAG}`.slice(0, 28),
      name: 'Zonder Woonplaats',
      image: 'https://homecheff.eu/icon.png',
      place: null,
      city: null,
      lat: null,
      lng: null,
      termsAccepted: true,
    });
    createdUserIds.push(noPlace.id);

    const noTerms = await createUser(prisma, {
      email: `${TAG}+noterms@homecheff-validation.test`,
      username: `prt_${TAG}`.slice(0, 28),
      name: 'Zonder Voorwaarden',
      image: 'https://homecheff.eu/icon.png',
      place: 'Rotterdam',
      city: 'Rotterdam',
      lat: 51.92,
      lng: 4.48,
      termsAccepted: false,
    });
    createdUserIds.push(noTerms.id);

    const multi = await createUser(prisma, {
      email: `${TAG}+multi@homecheff-validation.test`,
      username: `temp_${TAG}`.slice(0, 28),
      name: null,
      image: null,
      place: null,
      city: null,
      lat: null,
      lng: null,
      termsAccepted: false,
      emailVerified: null,
    });
    createdUserIds.push(multi.id);

    const courier = await createUser(prisma, {
      email: `${TAG}+courier@homecheff-validation.test`,
      username: `prb_${TAG}`.slice(0, 28),
      name: 'Incomplete Bezorger',
      image: 'https://homecheff.eu/icon.png',
      place: 'Vlaardingen',
      city: 'Vlaardingen',
      lat: 51.912,
      lng: 4.343,
      role: 'DELIVERY',
      termsAccepted: true,
    });
    createdUserIds.push(courier.id);
    await prisma.deliveryProfile.create({
      data: {
        userId: courier.id,
        age: 28,
        transportation: ['BIKE'],
        availableDays: ['maandag'],
        availableTimeSlots: ['morning'],
        workStartTime: '09:00',
        workEndTime: '17:00',
        isActive: true,
        isVerified: false,
        pricingEnabled: false,
        homeLat: 51.912,
        homeLng: 4.343,
        maxDistance: 8,
        nationalCoverage: false,
        providerType: 'INDEPENDENT',
      },
    });

    const completeCookie = await mintCookie(secret, complete.id, complete.email);
    const noPlaceCookie = await mintCookie(secret, noPlace.id, noPlace.email);
    const noTermsCookie = await mintCookie(secret, noTerms.id, noTerms.email);
    const multiCookie = await mintCookie(secret, multi.id, multi.email);
    const courierCookie = await mintCookie(secret, courier.id, courier.email);

    const completeCenter = await api(completeCookie, 'GET', '/api/user/action-center');
    const completeItems = completeCenter.json?.items || [];
    results.GENERIC_PROFILE_WARNING_WITHOUT_REASON = itemTexts(completeItems).some(isGeneric)
      ? 'FAIL'
      : 'NONE';
    results.STALE_PROFILE_WARNINGS =
      completeItems.some(
        (i: { id: string }) =>
          i.id === 'profile-incomplete' ||
          i.id === 'account-incomplete' ||
          i.id === 'delivery-profile-incomplete',
      )
        ? 'FAIL'
        : 'NONE';

    const noPlaceCenter = await api(noPlaceCookie, 'GET', '/api/user/action-center');
    const noPlaceItem = (noPlaceCenter.json?.items || []).find(
      (i: { id: string }) => i.id === 'profile-incomplete',
    );
    const noPlaceMe = await api(noPlaceCookie, 'GET', '/api/profile/me');
    results.SIDEBAR_EXACT_MISSING_REASON = gate(
      Boolean(noPlaceItem) &&
        /woonplaats/i.test(`${noPlaceItem?.title || ''} ${noPlaceItem?.actionLabel || ''}`) &&
        !isGeneric(noPlaceItem?.title) &&
        noPlaceItem?.actionHref === '/profile',
    );
    results.SIDEBAR_CTA_TARGET = gate(noPlaceItem?.actionHref === '/profile');
    results.PROFILE_REQUIREMENTS_SOURCE_OF_TRUTH = gate(
      noPlaceMe.status === 200 &&
        Array.isArray(noPlaceMe.json?.user?.profileRequirements?.recommendedRequirements) &&
        noPlaceMe.json.user.profileRequirements.recommendedRequirements.some(
          (r: { code: string }) => r.code === 'location',
        ) &&
        noPlaceMe.json.user.profileRequirements.isComplete === true,
    );

    const listing = await api(noTermsCookie, 'POST', '/api/products/create', {
      title: 'PReq listing',
    });
    const listingNotice = listing.json?.notice;
    const listingMissing = listing.json?.missing || [];
    results.LISTING_GATE_EXACT_MISSING_REASON = gate(
      listing.status === 403 &&
        listing.json?.error === 'ACCOUNT_REQUIREMENTS_MISSING' &&
        listingMissing.some((m: { key: string }) => m.key === 'termsAccepted') &&
        /voorwaarden/i.test(`${listingNotice?.titleNl || ''} ${listingNotice?.ctaLabelNl || ''}`) &&
        !isGeneric(listingNotice?.titleNl) &&
        !isGeneric(listingNotice?.ctaLabelNl) &&
        listing.json?.isComplete === false &&
        Array.isArray(listing.json?.blockingRequirements),
    );

    const stripeNotRequired = await api(completeCookie, 'POST', '/api/products/create', {
      title: 'PReq listing stripe',
    });
    results.BLOCKING_VS_RECOMMENDED = gate(
      stripeNotRequired.status !== 403 ||
        !(stripeNotRequired.json?.missing || []).some(
          (m: { key: string }) => m.key === 'stripeOnboarding',
        ),
    );

    const incompleteCourierCenter = await api(courierCookie, 'GET', '/api/user/action-center');
    const courierItem = (incompleteCourierCenter.json?.items || []).find(
      (i: { id: string }) => i.id === 'delivery-profile-incomplete',
    );
    const courierSettings = await api(courierCookie, 'GET', '/api/delivery/settings');
    results.DELIVERY_EXACT_MISSING_REASON = gate(
      Boolean(courierItem) &&
        /tarief/i.test(`${courierItem?.title || ''} ${courierItem?.actionLabel || ''}`) &&
        !isGeneric(courierItem?.title) &&
        courierItem?.actionHref === '/delivery/settings' &&
        courierSettings.json?.completion?.isComplete === false,
    );

    const saveCourier = await api(courierCookie, 'PUT', '/api/delivery/settings', {
      pricingEnabled: true,
      baseFeeCents: 350,
      pricePerKmCents: 80,
      minimumFeeCents: 495,
      availableDays: ['maandag'],
      availableTimeSlots: ['morning'],
      workStartTime: '09:00',
      workEndTime: '17:00',
      homeLat: 51.912,
      homeLng: 4.343,
      maxDistance: 8,
      preferredRadius: 8,
    });
    const completeCourierCenter = await api(courierCookie, 'GET', '/api/user/action-center');
    const stillCourierIncomplete = (completeCourierCenter.json?.items || []).some(
      (i: { id: string }) => i.id === 'delivery-profile-incomplete',
    );
    results.RESOLVED_WARNING_DISAPPEARS = gate(
      saveCourier.json?.completion?.isComplete === true && !stillCourierIncomplete,
    );

    const multiCenter = await api(multiCookie, 'GET', '/api/user/action-center');
    const multiAccount = (multiCenter.json?.items || []).find(
      (i: { id: string }) => i.id === 'account-incomplete',
    );
    const multiProfile = (multiCenter.json?.items || []).find(
      (i: { id: string }) => i.id === 'profile-incomplete',
    );
    const multiListing = await api(multiCookie, 'POST', '/api/products/create', { title: 'x' });
    results.MULTIPLE_MISSING_REQUIREMENTS = gate(
      /mist nog \d+ onderdelen/i.test(multiAccount?.title || multiListing.json?.notice?.titleNl || '') &&
        (multiListing.json?.blockingRequirements?.length || 0) >= 2,
    );
    results.DUPLICATE_PROFILE_WARNINGS =
      multiAccount && multiProfile ? 'FAIL' : 'NONE';

    const allGenericNone =
      results.GENERIC_PROFILE_WARNING_WITHOUT_REASON === 'NONE' &&
      results.STALE_PROFILE_WARNINGS === 'NONE' &&
      results.DUPLICATE_PROFILE_WARNINGS === 'NONE';
    const requiredPass = [
      'LISTING_GATE_EXACT_MISSING_REASON',
      'DELIVERY_EXACT_MISSING_REASON',
      'SIDEBAR_EXACT_MISSING_REASON',
      'SIDEBAR_CTA_TARGET',
      'RESOLVED_WARNING_DISAPPEARS',
      'MULTIPLE_MISSING_REQUIREMENTS',
      'BLOCKING_VS_RECOMMENDED',
      'PROFILE_REQUIREMENTS_SOURCE_OF_TRUTH',
    ].every((k) => results[k] === 'PASS');

    const report = {
      PRODUCTION_AUTHENTICATED_SMOKE: allGenericNone && requiredPass ? 'PASS' : 'FAIL',
      HOMECHEFF,
      tag: TAG,
      ...results,
      listingStatus: listing.status,
      listingError: listing.json?.error ?? null,
      listingNotice,
      courierTitle: courierItem?.title ?? null,
      noPlaceTitle: noPlaceItem?.title ?? null,
      completeItemIds: completeItems.map((i: { id: string }) => i.id),
    };
    fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (report.PRODUCTION_AUTHENTICATED_SMOKE !== 'PASS') process.exitCode = 1;
  } finally {
    for (const id of createdUserIds) {
      await prisma.deliveryProfile.deleteMany({ where: { userId: id } }).catch(() => {});
      await prisma.user.delete({ where: { id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
