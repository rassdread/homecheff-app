/**
 * Controlled geo backfill for place-without-coords records.
 *
 * Default: DRY RUN (no writes).
 *
 *   npx tsx scripts/backfill-geo-coords-dry-run.ts
 *   APPLY=1 npx tsx scripts/backfill-geo-coords-dry-run.ts
 *
 * Strategy:
 * - Prefer Product.pickupLat/Lng and Dish.lat/lng (record-level)
 * - Do NOT mass-mutate User.lat/lng unless explicitly listed
 * - Only high-confidence NL city labels from allowlist
 * - Ambiguous → MANUAL_REVIEW_REQUIRED (skipped)
 */
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { geocodePlaceQuery } from '../lib/global-geocoding';

const prisma = new PrismaClient();
const APPLY = process.env.APPLY === '1' || process.env.APPLY === 'true';
const OUT_DIR = path.join(process.cwd(), 'docs/audits/geo-distance-backfill');

/** Unambiguous NL city/place labels eligible for auto geocode. */
const CITY_ALLOWLIST: Record<string, { lat: number; lng: number; label: string } | 'GEOCODE'> = {
  // Curated city centroids (WGS84) — used when geocode unavailable / for known audit IDs
  vlaardingen: { lat: 51.912, lng: 4.341, label: 'Vlaardingen' },
  rotterdam: { lat: 51.9225, lng: 4.4792, label: 'Rotterdam' },
  amsterdam: { lat: 52.3676, lng: 4.9041, label: 'Amsterdam' },
  utrecht: { lat: 52.0907, lng: 5.1214, label: 'Utrecht' },
  'den haag': { lat: 52.0705, lng: 4.3007, label: 'Den Haag' },
  'the hague': { lat: 52.0705, lng: 4.3007, label: 'Den Haag' },
  midwolda: { lat: 53.1951, lng: 7.0137, label: 'Midwolda' },
  borne: { lat: 52.3014, lng: 6.7508, label: 'Borne' },
  'berkel en rodenrijs': { lat: 51.99, lng: 4.47, label: 'Berkel en Rodenrijs' },
  'berkel & rodenrijs': { lat: 51.99, lng: 4.47, label: 'Berkel en Rodenrijs' },
};

type Candidate = {
  recordType: 'PRODUCT' | 'DISH' | 'USER';
  id: string;
  title: string | null;
  currentPlace: string | null;
  currentLat: number | null;
  currentLng: number | null;
  proposedLat: number | null;
  proposedLng: number | null;
  proposedPlace: string | null;
  confidence: 'HIGH' | 'MANUAL_REVIEW_REQUIRED' | 'SKIP_HAS_COORDS';
  source: string;
  action: string;
};

function normalizePlace(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  return raw
    .replace(/📍/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function resolveAllowlist(place: string | null): {
  lat: number;
  lng: number;
  label: string;
  source: string;
} | null {
  const key = normalizePlace(place);
  if (!key) return null;
  const hit = CITY_ALLOWLIST[key];
  if (!hit || hit === 'GEOCODE') return null;
  return { ...hit, source: 'city_allowlist_centroid' };
}

function validCoords(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const candidates: Candidate[] = [];
  let applied = 0;

  // --- Products: place but no resolvable coords ---
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      placeName: true,
      pickupAddress: true,
      pickupLat: true,
      pickupLng: true,
      seller: {
        select: {
          id: true,
          lat: true,
          lng: true,
          User: { select: { id: true, place: true, city: true, lat: true, lng: true } },
        },
      },
    },
  });

  for (const p of products) {
    const hasPickup = validCoords(p.pickupLat, p.pickupLng);
    const hasSeller = validCoords(p.seller?.lat, p.seller?.lng);
    const hasUser = validCoords(p.seller?.User?.lat, p.seller?.User?.lng);
    const place =
      p.placeName?.trim() ||
      p.pickupAddress?.trim() ||
      p.seller?.User?.place?.trim() ||
      p.seller?.User?.city?.trim() ||
      null;

    if (hasPickup || hasSeller || hasUser) {
      if (place && !hasPickup) {
        // Optional: skip — distance already works via seller/user
        continue;
      }
      continue;
    }

    if (!place) continue;

    const proposed = resolveAllowlist(place);
    candidates.push({
      recordType: 'PRODUCT',
      id: p.id,
      title: p.title,
      currentPlace: place,
      currentLat: p.pickupLat,
      currentLng: p.pickupLng,
      proposedLat: proposed?.lat ?? null,
      proposedLng: proposed?.lng ?? null,
      proposedPlace: proposed?.label ?? place,
      confidence: proposed ? 'HIGH' : 'MANUAL_REVIEW_REQUIRED',
      source: proposed?.source ?? 'none',
      action: proposed
        ? 'SET_PRODUCT_PICKUP_COORDS'
        : 'MANUAL_REVIEW_REQUIRED',
    });
  }

  // --- Dishes: published with place, no dish/user coords ---
  const dishes = await prisma.dish.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      place: true,
      lat: true,
      lng: true,
      user: { select: { place: true, city: true, lat: true, lng: true } },
    },
  });

  for (const d of dishes) {
    const hasDish = validCoords(d.lat, d.lng);
    const hasUser = validCoords(d.user?.lat, d.user?.lng);
    const place = d.place?.trim() || d.user?.place?.trim() || d.user?.city?.trim() || null;
    if (hasDish || hasUser) continue;
    if (!place) continue;

    const proposed = resolveAllowlist(place);
    candidates.push({
      recordType: 'DISH',
      id: d.id,
      title: d.title,
      currentPlace: place,
      currentLat: d.lat,
      currentLng: d.lng,
      proposedLat: proposed?.lat ?? null,
      proposedLng: proposed?.lng ?? null,
      proposedPlace: proposed?.label ?? place,
      confidence: proposed ? 'HIGH' : 'MANUAL_REVIEW_REQUIRED',
      source: proposed?.source ?? 'none',
      action: proposed ? 'SET_DISH_LAT_LNG' : 'MANUAL_REVIEW_REQUIRED',
    });
  }

  // Optional geocode verification for HIGH candidates (enrich source label)
  for (const c of candidates.filter((x) => x.confidence === 'HIGH')) {
    try {
      const geo = await geocodePlaceQuery(c.proposedPlace || c.currentPlace || '', 'NL');
      if (geo && !geo.error && Number.isFinite(geo.lat) && Number.isFinite(geo.lng)) {
        const dLat = Math.abs(geo.lat - (c.proposedLat ?? 0));
        const dLng = Math.abs(geo.lng - (c.proposedLng ?? 0));
        if (dLat < 0.15 && dLng < 0.15) {
          c.source = `${c.source}+geocode_confirmed(${geo.source || 'geo'})`;
          // Prefer allowlist centroid for stability; keep proposed as allowlist
        } else {
          c.confidence = 'MANUAL_REVIEW_REQUIRED';
          c.action = 'MANUAL_REVIEW_REQUIRED';
          c.source = `geocode_mismatch:${geo.lat},${geo.lng}`;
        }
      }
      await new Promise((r) => setTimeout(r, 200));
    } catch {
      // keep allowlist proposal
    }
  }

  const high = candidates.filter((c) => c.confidence === 'HIGH');
  const manual = candidates.filter((c) => c.confidence === 'MANUAL_REVIEW_REQUIRED');

  if (APPLY) {
    for (const c of high) {
      if (c.proposedLat == null || c.proposedLng == null) continue;
      if (c.recordType === 'PRODUCT' && c.action === 'SET_PRODUCT_PICKUP_COORDS') {
        await prisma.product.update({
          where: { id: c.id },
          data: {
            pickupLat: c.proposedLat,
            pickupLng: c.proposedLng,
            placeName: c.proposedPlace,
          },
        });
        applied += 1;
      } else if (c.recordType === 'DISH' && c.action === 'SET_DISH_LAT_LNG') {
        await prisma.dish.update({
          where: { id: c.id },
          data: {
            lat: c.proposedLat,
            lng: c.proposedLng,
            place: c.proposedPlace,
          },
        });
        applied += 1;
      }
    }
  }

  const report = {
    mode: APPLY ? 'APPLY' : 'DRY_RUN',
    at: new Date().toISOString(),
    strategy:
      'Record-level Product.pickupLat/Lng and Dish.lat/lng only; no User mass mutation',
    totals: {
      candidates: candidates.length,
      highConfidence: high.length,
      manualReview: manual.length,
      applied,
    },
    candidates,
  };

  const outFile = path.join(
    OUT_DIR,
    APPLY ? `apply-${Date.now()}.json` : `dry-run-${Date.now()}.json`
  );
  writeFileSync(outFile, JSON.stringify(report, null, 2));
  writeFileSync(path.join(OUT_DIR, 'latest.json'), JSON.stringify(report, null, 2));

  console.log(JSON.stringify({
    mode: report.mode,
    totals: report.totals,
    high: high.map((c) => ({
      type: c.recordType,
      id: c.id,
      title: c.title,
      place: c.currentPlace,
      proposed: { lat: c.proposedLat, lng: c.proposedLng, place: c.proposedPlace },
      source: c.source,
    })),
    manual: manual.map((c) => ({
      type: c.recordType,
      id: c.id,
      title: c.title,
      place: c.currentPlace,
      reason: c.source,
    })),
    outFile,
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
