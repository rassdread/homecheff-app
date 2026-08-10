/**
 * Controlled correction: two Madame jeanette dishes → Caribbean Sint Maarten (SX).
 *
 * Default: DRY RUN
 *   node --env-file=.env.local --import tsx scripts/apply-sint-maarten-caribbean-geo.ts
 * Apply:
 *   APPLY=1 node --env-file=.env.local --import tsx scripts/apply-sint-maarten-caribbean-geo.ts
 *
 * Exact IDs only — never WHERE place = 'Sint Maarten'.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { haversineKm } from '../lib/community/geoDistance';

const prisma = new PrismaClient();
const APPLY = process.env.APPLY === '1' || process.env.APPLY === 'true';

/** Exact IDs from prior MANUAL_REVIEW geo audit. */
const EXACT_IDS = [
  'c31d06c4-293e-4d19-a269-fe4c41e6a660',
  '47ce973a-8d93-4ae2-a3af-d1a5064e1b32',
] as const;

const OUT_DIR = path.join(process.cwd(), 'docs/audits/sint-maarten-caribbean-geo');

/** Rotterdam viewer center for distance proof. */
const VIEWER = { lat: 51.9244, lng: 4.4777 };

async function geocodeCaribbeanSintMaarten(): Promise<{
  provider: string;
  query: string;
  label: string;
  countryCode: string;
  lat: number;
  lng: number;
}> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY required');

  const query = 'Sint Maarten, Caribbean';
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.[0]) {
    throw new Error(`Geocode failed: ${data.status} ${data.error_message || ''}`);
  }
  const r = data.results[0];
  const lat = Number(r.geometry.location.lat);
  const lng = Number(r.geometry.location.lng);
  const country = (r.address_components || []).find((c: { types?: string[] }) =>
    c.types?.includes('country'),
  );
  const countryCode = country?.short_name || 'SX';
  // Safety: must be Caribbean, not Noord-Holland
  if (lat > 50) {
    throw new Error(`Refusing metro-NL coords for Caribbean Sint Maarten: ${lat},${lng}`);
  }
  if (countryCode !== 'SX' && countryCode !== 'MF') {
    // Google returns SX for Sint Maarten (Dutch); MF is French side — still Caribbean
    console.warn('Unexpected country code', countryCode);
  }
  return {
    provider: 'GoogleMaps',
    query,
    label: String(r.formatted_address || 'Sint Maarten'),
    countryCode,
    lat,
    lng,
  };
}

async function main() {
  const geo = await geocodeCaribbeanSintMaarten();

  const dishes = await prisma.dish.findMany({
    where: { id: { in: [...EXACT_IDS] } },
    select: {
      id: true,
      title: true,
      place: true,
      lat: true,
      lng: true,
      status: true,
      userId: true,
      category: true,
      subcategory: true,
      user: {
        select: {
          id: true,
          username: true,
          place: true,
          country: true,
          lat: true,
          lng: true,
        },
      },
    },
  });

  if (dishes.length !== 2) {
    console.error(
      JSON.stringify({
        error: 'STOP: candidate count != 2',
        found: dishes.length,
        ids: dishes.map((d) => d.id),
      }),
    );
    process.exit(1);
  }

  const missing = EXACT_IDS.filter((id) => !dishes.some((d) => d.id === id));
  if (missing.length) {
    console.error(JSON.stringify({ error: 'STOP: missing exact IDs', missing }));
    process.exit(1);
  }

  const dryRun = dishes.map((d) => ({
    id: d.id,
    title: d.title,
    ownerUserId: d.userId,
    ownerUsername: d.user?.username,
    ownerPlace: d.user?.place,
    ownerCountry: d.user?.country,
    oldPlace: d.place,
    oldCountry: d.user?.country ?? null,
    oldLat: d.lat,
    oldLng: d.lng,
    proposedCanonicalPlace: 'Sint Maarten',
    proposedCountryContext: `SX (${geo.countryCode}) — Caribbean Sint Maarten`,
    proposedLat: geo.lat,
    proposedLng: geo.lng,
    geocoderProvider: geo.provider,
    geocoderQuery: geo.query,
    geocoderLabel: geo.label,
    confidence: 'HIGH_OWNER_CONFIRMED_CARIBBEAN',
    evidence: [
      'Prior MANUAL_REVIEW audit IDs',
      'Owner profile place=Sint Maarten',
      'Title Madame jeanette (Caribbean chile pepper)',
      'Product owner confirmation: Caribbean constituent country',
      'HomeCheff kingdom Caribbean place-label contract (SX)',
    ],
    proposedDistanceKmFromRotterdam: Number(
      haversineKm(VIEWER.lat, VIEWER.lng, geo.lat, geo.lng).toFixed(1),
    ),
  }));

  mkdirSync(OUT_DIR, { recursive: true });
  const stamp = Date.now();
  const dryPath = path.join(OUT_DIR, `dry-run-${stamp}.json`);
  writeFileSync(
    dryPath,
    JSON.stringify(
      {
        mode: APPLY ? 'APPLY' : 'DRY_RUN',
        candidateCount: dryRun.length,
        geocode: geo,
        candidates: dryRun,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ mode: 'DRY_RUN', candidateCount: dryRun.length, dryPath, geocode: geo, candidates: dryRun }, null, 2));

  if (dryRun.length !== 2) {
    console.error('STOP: dry-run candidate count != 2');
    process.exit(1);
  }

  if (!APPLY) {
    console.log('Dry run only. Set APPLY=1 to mutate exact IDs.');
    await prisma.$disconnect();
    return;
  }

  const mutated: Array<{ id: string; lat: number; lng: number; place: string }> = [];
  for (const row of dryRun) {
    await prisma.dish.update({
      where: { id: row.id },
      data: {
        place: row.proposedCanonicalPlace,
        lat: row.proposedLat,
        lng: row.proposedLng,
      },
    });
    mutated.push({
      id: row.id,
      lat: row.proposedLat,
      lng: row.proposedLng,
      place: row.proposedCanonicalPlace,
    });
  }

  const after = await prisma.dish.findMany({
    where: { id: { in: [...EXACT_IDS] } },
    select: { id: true, title: true, place: true, lat: true, lng: true },
  });

  const verify = after.map((d) => ({
    id: d.id,
    place: d.place,
    lat: d.lat,
    lng: d.lng,
    distanceKmFromRotterdam:
      d.lat != null && d.lng != null
        ? Number(haversineKm(VIEWER.lat, VIEWER.lng, d.lat, d.lng).toFixed(1))
        : null,
    isCaribbean: d.lat != null && d.lat < 30,
    isNotNoordHolland: d.lat != null && d.lat < 50,
  }));

  const applyPath = path.join(OUT_DIR, `apply-${stamp}.json`);
  writeFileSync(
    applyPath,
    JSON.stringify({ mutated, verify, geocode: geo }, null, 2),
  );
  console.log(JSON.stringify({ mode: 'APPLY', applyPath, mutated, verify }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
