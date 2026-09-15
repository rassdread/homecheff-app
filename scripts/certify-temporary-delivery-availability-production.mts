/**
 * Authenticated production smoke: temporary delivery availability.
 *
 *   npx tsx scripts/certify-temporary-delivery-availability-production.mts
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
const MARKET_TZ = 'Europe/Amsterdam';
const TAG = `tonl_${Date.now().toString(36)}`;
const OUT_DIR = 'docs/audits/temporary-delivery-availability-cert';
const PASSWORD = 'TmpOnlineCert!Only';

type Gate = 'PASS' | 'FAIL' | 'BLOCKED';
function gate(ok: boolean): Gate {
  return ok ? 'PASS' : 'FAIL';
}

function overrideActive(profile: {
  isOnline?: boolean | null;
  onlineUntil?: Date | string | null;
  temporaryOffline?: boolean | null;
}) {
  if (profile.temporaryOffline) return false;
  if (profile.isOnline !== true || !profile.onlineUntil) return false;
  return new Date(profile.onlineUntil).getTime() > Date.now();
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

function approxUntil(until: unknown, expectedMs: number, slackMs = 120000) {
  const t = until ? new Date(String(until)).getTime() : NaN;
  if (!Number.isFinite(t)) return false;
  return Math.abs(t - expectedMs) <= slackMs;
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
  const results: Record<string, Gate | string | number | null> = {};

  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 31);

    const completeEmail = `${TAG}+ok@homecheff-validation.test`;
    const complete = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: completeEmail,
        passwordHash,
        name: 'Tmp Online Courier',
        username: `toc_${TAG}`.slice(0, 28),
        emailVerified: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        termsAccepted: true,
        dateOfBirth: dob,
        role: 'DELIVERY',
        lat: 51.912,
        lng: 4.343,
        place: 'Vlaardingen',
        country: 'NL',
        buyerRoles: ['CONSUMER'],
        interests: ['CHEFF'],
      },
    });
    createdUserIds.push(complete.id);

    const incompleteEmail = `${TAG}+inc@homecheff-validation.test`;
    const incomplete = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: incompleteEmail,
        passwordHash,
        name: 'Tmp Incomplete',
        username: `toi_${TAG}`.slice(0, 28),
        emailVerified: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
        termsAccepted: true,
        dateOfBirth: dob,
        role: 'DELIVERY',
        lat: 51.912,
        lng: 4.343,
        place: 'Vlaardingen',
        country: 'NL',
      },
    });
    createdUserIds.push(incomplete.id);

    const completeProfile = await prisma.deliveryProfile.create({
      data: {
        userId: complete.id,
        age: 31,
        transportation: ['BIKE'],
        availableDays: ['zondag'],
        availableTimeSlots: ['morning'],
        workStartTime: '09:00',
        workEndTime: '10:00',
        isActive: true,
        isVerified: true,
        pricingEnabled: true,
        baseFeeCents: 350,
        pricePerKmCents: 80,
        minimumFeeCents: 495,
        homeLat: 51.912,
        homeLng: 4.343,
        homeAddress: 'Certstraat 1, Vlaardingen',
        maxDistance: 12,
        nationalCoverage: false,
        isOnline: false,
      },
    });

    await prisma.deliveryProfile.create({
      data: {
        userId: incomplete.id,
        age: 31,
        transportation: ['BIKE'],
        availableDays: ['zondag'],
        availableTimeSlots: ['morning'],
        workStartTime: '09:00',
        workEndTime: '10:00',
        isActive: true,
        isVerified: true,
        pricingEnabled: false,
        homeLat: 51.912,
        homeLng: 4.343,
        maxDistance: 12,
        isOnline: false,
      },
    });

    const cookie = await mintCookie(secret, complete.id, completeEmail);
    const cookie2 = await mintCookie(secret, complete.id, completeEmail);
    const incompleteCookie = await mintCookie(secret, incomplete.id, incompleteEmail);

    const routeProbe = await api(null, 'GET', '/api/delivery/online');
    results.PRODUCTION_ROUTE_PRESENT = gate(
      routeProbe.status !== 404 && routeProbe.status !== 405,
    );

    const getOnline = await api(cookie, 'GET', '/api/delivery/online');
    results.GO_ONLINE_BUTTON = gate(
      getOnline.status === 200 &&
        getOnline.json?.ok === true &&
        getOnline.json?.canGoOnline === true,
    );

    const noDuration = await api(cookie, 'POST', '/api/delivery/toggle-status', {
      isOnline: true,
    });
    results.DURATION_REQUIRED = gate(
      noDuration.status === 400 && noDuration.json?.code === 'DURATION_REQUIRED',
    );

    const blocked = await api(incompleteCookie, 'POST', '/api/delivery/online', {
      action: 'online',
      preset: '1h',
    });
    results.ACTIONABLE_BLOCK_REASON = gate(
      blocked.status === 400 &&
        blocked.json?.code === 'ACTIVATION_INCOMPLETE' &&
        String(blocked.json?.notice?.titleNl || blocked.json?.message || '').includes(
          'bezorgtarieven',
        ) &&
        !/Maak je profiel af/i.test(JSON.stringify(blocked.json)),
    );
    results.PROFILE_COMPLETENESS_STILL_ENFORCED = results.ACTIONABLE_BLOCK_REASON;

    async function goOnline(preset: string, customUntil?: string) {
      return api(cookie, 'POST', '/api/delivery/online', {
        action: 'online',
        preset,
        customUntil: customUntil || null,
        timeZone: MARKET_TZ,
      });
    }

    const weekdayNl = new Intl.DateTimeFormat('en-US', {
      timeZone: MARKET_TZ,
      weekday: 'long',
    })
      .format(new Date())
      .toLowerCase();
    const todayNl =
      (
        {
          monday: 'maandag',
          tuesday: 'dinsdag',
          wednesday: 'woensdag',
          thursday: 'donderdag',
          friday: 'vrijdag',
          saturday: 'zaterdag',
          sunday: 'zondag',
        } as Record<string, string>
      )[weekdayNl] || 'maandag';
    const nowParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: MARKET_TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const nowMinutes =
      Number(nowParts.find((p) => p.type === 'hour')?.value ?? '0') * 60 +
      Number(nowParts.find((p) => p.type === 'minute')?.value ?? '0');
    const insideStart = Math.max(0, nowMinutes - 45);
    const insideEnd = Math.min(23 * 60 + 59, nowMinutes + 75);
    const hm = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    await prisma.deliveryProfile.update({
      where: { id: completeProfile.id },
      data: {
        availableDays: [todayNl],
        availableTimeSlots: ['morning', 'afternoon', 'evening'],
        workStartTime: hm(insideStart),
        workEndTime: hm(insideEnd),
        isOnline: false,
        onlineUntil: null,
      },
    });
    const insideSched = await api(null, 'POST', '/api/delivery/check-availability', {
      lat: 51.912,
      lng: 4.343,
      sellerLat: 51.912,
      sellerLng: 4.343,
      sellerCountry: 'NL',
    });
    const insideSchedIds = (insideSched.json?.profiles || []).map((p: { id: string }) => p.id);
    results.INSIDE_FIXED_SCHEDULE = gate(
      insideSched.status === 200 && insideSchedIds.includes(completeProfile.id),
    );
    const insideOnline = await goOnline('30m');
    const insideDb = await prisma.deliveryProfile.findUnique({
      where: { id: completeProfile.id },
    });
    results.INSIDE_FIXED_SCHEDULE_OVERRIDE = gate(
      insideOnline.status === 200 &&
        insideDb?.availableDays?.includes(todayNl) === true &&
        insideDb?.workStartTime === hm(insideStart) &&
        overrideActive(insideDb!),
    );

    await prisma.deliveryProfile.update({
      where: { id: completeProfile.id },
      data: {
        availableDays: ['zondag'],
        availableTimeSlots: ['morning'],
        workStartTime: '09:00',
        workEndTime: '10:00',
        isOnline: false,
        onlineUntil: null,
      },
    });

    const now = Date.now();
    const r30 = await goOnline('30m');
    results.ONLINE_30_MIN = gate(
      r30.status === 200 &&
        r30.json?.availability?.source === 'TEMPORARY_ONLINE_OVERRIDE' &&
        approxUntil(r30.json?.onlineUntil, now + 30 * 60 * 1000),
    );

    const r1 = await goOnline('1h');
    results.ONLINE_1_HOUR = gate(
      r1.status === 200 && approxUntil(r1.json?.onlineUntil, Date.now() + 60 * 60 * 1000),
    );
    const r2 = await goOnline('2h');
    results.ONLINE_2_HOURS = gate(
      r2.status === 200 && approxUntil(r2.json?.onlineUntil, Date.now() + 2 * 60 * 60 * 1000),
    );
    const r4 = await goOnline('4h');
    results.ONLINE_4_HOURS = gate(
      r4.status === 200 && approxUntil(r4.json?.onlineUntil, Date.now() + 4 * 60 * 60 * 1000),
    );

    const eod = await goOnline('end_of_day');
    const eodDb = await prisma.deliveryProfile.findUnique({ where: { id: completeProfile.id } });
    results.ONLINE_END_OF_DAY = gate(
      eod.status === 200 &&
        Boolean(eodDb?.onlineUntil) &&
        new Date(eodDb!.onlineUntil!).getUTCHours() >= 20,
    );

    const customLocal = '2099-01-01T18:45';
    const custom = await goOnline('custom', customLocal);
    results.ONLINE_CUSTOM_END = gate(
      custom.status === 200 && Boolean(custom.json?.onlineUntil),
    );

    const afterOnline = await prisma.deliveryProfile.findUnique({
      where: { id: completeProfile.id },
    });
    results.FIXED_SCHEDULE_UNCHANGED = gate(
      JSON.stringify(afterOnline?.availableDays) === JSON.stringify(['zondag']) &&
        afterOnline?.workStartTime === '09:00' &&
        afterOnline?.workEndTime === '10:00',
    );
    results.OUTSIDE_SCHEDULE_OVERRIDE = gate(
      afterOnline?.isOnline === true &&
        Boolean(afterOnline?.onlineUntil) &&
        overrideActive(afterOnline!),
    );

    const dash = await api(cookie, 'GET', '/api/delivery/dashboard');
    results.HARD_REFRESH_PERSISTENCE = gate(
      dash.status === 200 &&
        dash.json?.availability?.source === 'TEMPORARY_ONLINE_OVERRIDE',
    );
    const relogin = await mintCookie(secret, complete.id, completeEmail);
    const dash2 = await api(relogin, 'GET', '/api/delivery/online');
    results.RELOGIN_PERSISTENCE = gate(
      dash2.status === 200 && dash2.json?.availability?.overrideActive === true,
    );

    const beforeExtendUntil = afterOnline?.onlineUntil
      ? new Date(afterOnline.onlineUntil).getTime()
      : Date.now();
    const extended = await api(cookie, 'POST', '/api/delivery/online', {
      action: 'extend',
      preset: '1h',
      timeZone: MARKET_TZ,
    });
    results.EXTEND_ONLINE = gate(
      extended.status === 200 &&
        approxUntil(extended.json?.onlineUntil, Math.max(Date.now(), beforeExtendUntil) + 60 * 60 * 1000),
    );

    const availWhile = await api(null, 'POST', '/api/delivery/check-availability', {
      lat: 51.912,
      lng: 4.343,
      sellerLat: 51.912,
      sellerLng: 4.343,
      sellerCountry: 'NL',
    });
    const idsWhile = (availWhile.json?.profiles || []).map((p: { id: string }) => p.id);
    results.DELIVERY_MATCHING_WHILE_OVERRIDE = gate(
      availWhile.status === 200 && idsWhile.includes(completeProfile.id),
    );

    const far = await api(null, 'POST', '/api/delivery/check-availability', {
      lat: 53.2,
      lng: 6.57,
      sellerLat: 53.2,
      sellerLng: 6.57,
      sellerCountry: 'NL',
    });
    const farIds = (far.json?.profiles || []).map((p: { id: string }) => p.id);
    results.SERVICE_AREA_STILL_ENFORCED = gate(!farIds.includes(completeProfile.id));

    await prisma.deliveryProfile.update({
      where: { id: completeProfile.id },
      data: { onlineUntil: new Date(Date.now() - 1000) },
    });
    const availAfter = await api(null, 'POST', '/api/delivery/check-availability', {
      lat: 51.912,
      lng: 4.343,
      sellerLat: 51.912,
      sellerLng: 4.343,
      sellerCountry: 'NL',
    });
    const idsAfter = (availAfter.json?.profiles || []).map((p: { id: string }) => p.id);
    const dbAfterExpiry = await prisma.deliveryProfile.findUnique({
      where: { id: completeProfile.id },
    });
    results.AUTOMATIC_EXPIRY = gate(dbAfterExpiry?.isOnline === false);
    results.DELIVERY_MATCHING_AFTER_EXPIRY = gate(!idsAfter.includes(completeProfile.id));

    await goOnline('30m');
    const otherSession = await api(cookie2, 'GET', '/api/delivery/online');
    const offline = await api(cookie, 'POST', '/api/delivery/online', { action: 'offline' });
    const otherAfter = await api(cookie2, 'GET', '/api/delivery/online');
    results.MANUAL_OFFLINE = gate(
      offline.status === 200 &&
        offline.json?.isOnline === false &&
        otherAfter.json?.availability?.overrideActive === false,
    );
    results.TWO_SESSIONS = gate(
      otherSession.status === 200 && otherAfter.status === 200,
    );

    results.ONLINE_API = '/api/delivery/online';
    results.NO_DELIVERY_REGRESSION = gate(
      results.FIXED_SCHEDULE_UNCHANGED === 'PASS' &&
        results.PROFILE_COMPLETENESS_STILL_ENFORCED === 'PASS' &&
        results.SERVICE_AREA_STILL_ENFORCED === 'PASS',
    );

    const required = [
      'PRODUCTION_ROUTE_PRESENT',
      'GO_ONLINE_BUTTON',
      'DURATION_REQUIRED',
      'INSIDE_FIXED_SCHEDULE',
      'INSIDE_FIXED_SCHEDULE_OVERRIDE',
      'ONLINE_30_MIN',
      'ONLINE_1_HOUR',
      'ONLINE_2_HOURS',
      'ONLINE_4_HOURS',
      'ONLINE_END_OF_DAY',
      'ONLINE_CUSTOM_END',
      'OUTSIDE_SCHEDULE_OVERRIDE',
      'FIXED_SCHEDULE_UNCHANGED',
      'HARD_REFRESH_PERSISTENCE',
      'RELOGIN_PERSISTENCE',
      'EXTEND_ONLINE',
      'MANUAL_OFFLINE',
      'AUTOMATIC_EXPIRY',
      'DELIVERY_MATCHING_WHILE_OVERRIDE',
      'DELIVERY_MATCHING_AFTER_EXPIRY',
      'SERVICE_AREA_STILL_ENFORCED',
      'PROFILE_COMPLETENESS_STILL_ENFORCED',
      'ACTIONABLE_BLOCK_REASON',
      'TWO_SESSIONS',
      'NO_DELIVERY_REGRESSION',
    ];
    const allPass = required.every((k) => results[k] === 'PASS');
    results.PRODUCTION_AUTHENTICATED_SMOKE = allPass ? 'PASS' : 'FAIL';
    results.GET_ONLINE_STATUS = getOnline.status;
    results.GET_ONLINE_CODE = getOnline.json?.code || getOnline.json?.ok || null;

    fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify({ HOMECHEFF, tag: TAG, ...results }, null, 2));
    console.log(JSON.stringify({ HOMECHEFF, tag: TAG, ...results }, null, 2));
    if (!allPass) process.exitCode = 1;
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
