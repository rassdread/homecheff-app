#!/usr/bin/env node
/**
 * Backfill coordinates for active sale products from place labels (one-off).
 *
 * Geocodes pickupAddress → User.place → User.city via Google Maps.
 * Does NOT geocode live on feed requests.
 *
 * Dry-run (default):
 *   npx tsx scripts/backfill-sale-item-coords-from-place.mjs
 *
 * Apply (requires confirmation):
 *   CONFIRM_BACKFILL=1 npx tsx scripts/backfill-sale-item-coords-from-place.mjs --apply
 *
 * Overwrite existing coords (opt-in):
 *   CONFIRM_BACKFILL=1 npx tsx scripts/backfill-sale-item-coords-from-place.mjs --apply --overwrite
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const root = resolve(import.meta.dirname, '..');
process.chdir(root);

function loadEnvLocal() {
  const p = resolve(root, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');
const overwrite = process.argv.includes('--overwrite');
const confirmed = process.env.CONFIRM_BACKFILL === '1';
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

const COUNTRY_BLOCKLIST = new Set(
  ['nederland', 'netherlands', 'nl', 'the netherlands'].map((s) => s.toLowerCase())
);

const GEOCODE_DELAY_MS = 220;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildGeocodeQueryString(address, city, countryCode) {
  return [address?.trim(), city?.trim(), countryCode?.trim()]
    .filter(Boolean)
    .join(', ');
}

function normalizePlacePart(value) {
  const t = value?.trim();
  if (!t) return null;
  if (COUNTRY_BLOCKLIST.has(t.toLowerCase())) return null;
  return t;
}

function firstPlaceSegment(value) {
  const raw = normalizePlacePart(value);
  if (!raw) return null;
  const first = raw.split(',')[0]?.trim();
  return first ? normalizePlacePart(first) : null;
}

function placeFromPickupAddress(pickupAddress) {
  const raw = pickupAddress?.trim();
  if (!raw) return null;
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  return normalizePlacePart(last) ?? normalizePlacePart(parts[0]);
}

function resolveSellerCoords(seller) {
  if (!seller) return null;
  const lat = seller.lat ?? seller.User?.lat;
  const lng = seller.lng ?? seller.User?.lng;
  if (
    lat == null ||
    lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }
  return { lat, lng };
}

function resolveProductCoords(product) {
  if (!product) return null;
  if (
    product.pickupLat != null &&
    product.pickupLng != null &&
    Number.isFinite(product.pickupLat) &&
    Number.isFinite(product.pickupLng)
  ) {
    return { lat: product.pickupLat, lng: product.pickupLng };
  }
  return resolveSellerCoords(product.seller ?? null);
}

function hasValidCoordPair(lat, lng) {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

function stripEmoji(s) {
  return s
    .replace(/[\u{1F300}-\u{1F9FF}\u2600-\u26FF\u2700-\u27BF📍]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip emoji/pin noise; reject country-only labels. */
function sanitizePlaceQuery(raw) {
  if (!raw?.trim()) return null;
  const cleaned = stripEmoji(raw);
  if (!cleaned) return null;
  const segment = firstPlaceSegment(cleaned) ?? cleaned;
  if (!segment || segment.length < 2) return null;
  if (COUNTRY_BLOCKLIST.has(segment.toLowerCase())) return null;
  return segment;
}

function resolveCountryCode(user) {
  const raw = user?.country?.trim();
  if (!raw) return 'NL';
  if (raw.length === 2) return raw.toUpperCase();
  return 'NL';
}

/**
 * @returns {{ target: 'product' | 'sellerProfile', sourceField: string, query: string, countryCode: string } | null}
 */
function pickGeocodeSource(product, seller) {
  const user = seller?.User;

  const pickupRaw = product.pickupAddress?.trim();
  if (pickupRaw) {
    const label = sanitizePlaceQuery(pickupRaw) ?? sanitizePlaceQuery(placeFromPickupAddress(pickupRaw));
    if (label) {
      return {
        target: 'product',
        sourceField: 'pickupAddress',
        query: stripEmoji(pickupRaw),
        countryCode: resolveCountryCode(user),
      };
    }
  }

  const fromPlace = sanitizePlaceQuery(user?.place);
  if (fromPlace) {
    return {
      target: 'sellerProfile',
      sourceField: 'User.place',
      query: fromPlace,
      countryCode: resolveCountryCode(user),
    };
  }

  const fromCity = sanitizePlaceQuery(user?.city);
  if (fromCity) {
    return {
      target: 'sellerProfile',
      sourceField: 'User.city',
      query: fromCity,
      countryCode: resolveCountryCode(user),
    };
  }

  return null;
}

function productNeedsBackfill(product, seller, overwriteFlag) {
  const resolved = resolveProductCoords({
    pickupLat: product.pickupLat,
    pickupLng: product.pickupLng,
    seller: seller ?? null,
  });
  if (resolved && !overwriteFlag) return false;
  return pickGeocodeSource(product, seller) != null;
}

function isCountryOnlyResult(formattedAddress) {
  if (!formattedAddress?.trim()) return true;
  const lower = formattedAddress.trim().toLowerCase();
  if (COUNTRY_BLOCKLIST.has(lower)) return true;
  if (/^nederland$/i.test(lower) || /^netherlands$/i.test(lower)) return true;
  return false;
}

async function geocodeGoogleMaps(query, countryCode) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'GOOGLE_MAPS_API_KEY missing (.env.local)' };
  }

  const fullQuery = buildGeocodeQueryString(query, '', countryCode);
  const region = countryCode.toLowerCase();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullQuery)}&region=${region}&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    return { ok: false, error: `HTTP ${response.status}` };
  }

  const data = await response.json();
  if (data.status !== 'OK' || !data.results?.length) {
    return {
      ok: false,
      error: data.error_message || data.status || 'ZERO_RESULTS',
    };
  }

  const result = data.results[0];
  const loc = result.geometry?.location;
  if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) {
    return { ok: false, error: 'Invalid coordinates in response' };
  }
  if (loc.lat === 0 && loc.lng === 0) {
    return { ok: false, error: 'Zero coordinates' };
  }
  if (isCountryOnlyResult(result.formatted_address)) {
    return { ok: false, error: 'Country-only result rejected' };
  }

  return {
    ok: true,
    lat: loc.lat,
    lng: loc.lng,
    formatted_address: result.formatted_address,
    location_type: result.geometry?.location_type ?? 'UNKNOWN',
    partial_match: result.partial_match === true,
  };
}

function logItemResult(entry) {
  console.log(JSON.stringify(entry, null, 2));
}

async function main() {
  console.log('[backfill-sale-item-coords-from-place] starting', {
    apply,
    overwrite,
    limit,
  });

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      priceCents: { gt: 0 },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      pickupAddress: true,
      pickupLat: true,
      pickupLng: true,
      sellerId: true,
      seller: {
        select: {
          id: true,
          lat: true,
          lng: true,
          User: {
            select: {
              place: true,
              city: true,
              country: true,
              lat: true,
              lng: true,
            },
          },
        },
      },
    },
  });

  const candidates = products.filter((p) =>
    productNeedsBackfill(p, p.seller, overwrite)
  );

  console.log(
    `[backfill-sale-item-coords-from-place] ${candidates.length} sale product(s) need geocoding (of ${products.length} active sale)`
  );

  if (candidates.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  if (apply && !confirmed) {
    console.error(
      'Refused: set CONFIRM_BACKFILL=1 to apply updates (safety guard).'
    );
    process.exit(1);
  }

  /** @type {Map<string, Awaited<ReturnType<typeof geocodeGoogleMaps>>>} */
  const geocodeCache = new Map();
  /** sellerProfile jobs deduped per seller */
  const sellerProfileDone = new Set();

  let geocoded = 0;
  let applied = 0;
  let failed = 0;
  let skipped = 0;

  const toProcess =
    limit != null && Number.isFinite(limit) ? candidates.slice(0, limit) : candidates;

  for (const product of toProcess) {
    const seller = product.seller;
    const source = pickGeocodeSource(product, seller);
    if (!source) {
      skipped += 1;
      logItemResult({
        productId: product.id,
        title: product.title,
        status: 'skipped',
        reason: 'no usable place label',
      });
      continue;
    }

    if (source.target === 'sellerProfile') {
      const sellerKey = `${seller?.id}:${source.query}:${source.countryCode}`;
      if (sellerProfileDone.has(sellerKey)) {
        skipped += 1;
        logItemResult({
          productId: product.id,
          title: product.title,
          status: 'skipped',
          reason: 'seller profile geocode already scheduled for this query',
          sourceField: source.sourceField,
          query: source.query,
        });
        continue;
      }
      if (!overwrite && hasValidCoordPair(seller?.lat, seller?.lng)) {
        skipped += 1;
        logItemResult({
          productId: product.id,
          title: product.title,
          status: 'skipped',
          reason: 'SellerProfile already has coords (use --overwrite)',
        });
        continue;
      }
      sellerProfileDone.add(sellerKey);
    }

    if (
      source.target === 'product' &&
      !overwrite &&
      hasValidCoordPair(product.pickupLat, product.pickupLng)
    ) {
      skipped += 1;
      logItemResult({
        productId: product.id,
        title: product.title,
        status: 'skipped',
        reason: 'Product pickup coords exist (use --overwrite)',
      });
      continue;
    }

    const cacheKey = `${source.countryCode}:${source.query.toLowerCase()}`;
    let geo = geocodeCache.get(cacheKey);
    if (!geo) {
      geo = await geocodeGoogleMaps(source.query, source.countryCode);
      geocodeCache.set(cacheKey, geo);
      await sleep(GEOCODE_DELAY_MS);
    }

    if (!geo.ok) {
      failed += 1;
      logItemResult({
        productId: product.id,
        title: product.title,
        status: 'geocode_failed',
        sourceField: source.sourceField,
        query: source.query,
        error: geo.error,
      });
      continue;
    }

    geocoded += 1;

    const logEntry = {
      productId: product.id,
      title: product.title,
      status: apply ? 'applied' : 'dry_run',
      sourceField: source.sourceField,
      query: source.query,
      target: source.target,
      lat: geo.lat,
      lng: geo.lng,
      formatted_address: geo.formatted_address,
      confidence: geo.location_type,
      partial_match: geo.partial_match,
    };

    if (!apply) {
      logItemResult(logEntry);
      continue;
    }

    try {
      if (source.target === 'product') {
        await prisma.product.update({
          where: { id: product.id },
          data: { pickupLat: geo.lat, pickupLng: geo.lng },
        });
      } else {
        await prisma.sellerProfile.update({
          where: { id: seller.id },
          data: { lat: geo.lat, lng: geo.lng },
        });
      }
      applied += 1;
      logItemResult(logEntry);
    } catch (err) {
      failed += 1;
      logItemResult({
        ...logEntry,
        status: 'write_failed',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log('\n[backfill-sale-item-coords-from-place] summary', {
    candidates: toProcess.length,
    geocoded,
    applied,
    failed,
    skipped,
    dryRun: !apply,
  });

  if (!apply) {
    console.log(
      'Dry run — pass --apply with CONFIRM_BACKFILL=1 to write coordinates.'
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
