/**
 * Public-surface redaction for users whose canonical DOB is under 18.
 * Internal order, payment and fulfilment records are not passed through here.
 */

import { resolveAgeEnforcement, type AgeSubject } from '@/lib/age/marketplace-eligibility';

export function requiresMinorPublicPrivacy(
  subject: AgeSubject | null | undefined,
  now: Date = new Date(),
): boolean {
  const mode = resolveAgeEnforcement(subject, now).mode;
  return mode === 'MINOR' || mode === 'BLOCKED_UNDER_13';
}

/** ~1.1 km. Keeps city discovery without publishing a rooftop point. */
export function coarsenPublicCoordinate(
  value: number | null | undefined,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

export function redactMinorPublicContactChannels<T extends { id: string }>(
  channels: T[],
  subject: AgeSubject | null | undefined,
  now?: Date,
): T[] {
  if (!requiresMinorPublicPrivacy(subject, now)) return channels;
  return channels.filter((channel) => channel.id !== 'phone' && channel.id !== 'whatsapp');
}

function copyRecord(value: object): Record<string, unknown> {
  return { ...(value as Record<string, unknown>) };
}

function omitKeys(record: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const drop = new Set<string>(keys);
  return Object.fromEntries(Object.entries(record).filter(([key]) => !drop.has(key)));
}

export function redactMinorSellerRecord<T extends object>(
  seller: T | null | undefined,
  dateOfBirth: Date | string | null | undefined,
): T | null | undefined {
  if (!seller || !requiresMinorPublicPrivacy({ dateOfBirth })) return seller;
  const next = copyRecord(seller);
  if (typeof next.lat === 'number') next.lat = coarsenPublicCoordinate(next.lat);
  if (typeof next.lng === 'number') next.lng = coarsenPublicCoordinate(next.lng);
  const stripped = omitKeys(next, ['address', 'postalCode', 'phoneNumber', 'email']);
  if (next.User && typeof next.User === 'object') {
    const user = omitKeys(copyRecord(next.User), [
      'email',
      'dateOfBirth',
      'phoneNumber',
      'address',
      'postalCode',
    ]);
    if (typeof user.lat === 'number') user.lat = coarsenPublicCoordinate(user.lat);
    if (typeof user.lng === 'number') user.lng = coarsenPublicCoordinate(user.lng);
    user.displayFullName = false;
    if (typeof user.username === 'string' && user.username) user.name = user.username;
    stripped.User = user;
  }
  return stripped as T;
}

export function redactMinorPublicListing<T extends object>(
  listing: T,
  subject: AgeSubject | null | undefined,
  now?: Date,
): T {
  if (!requiresMinorPublicPrivacy(subject, now)) return listing;
  const next = copyRecord(listing);
  next.pickupAddress = null;
  next.pickupLat = null;
  next.pickupLng = null;
  if (next.location && typeof next.location === 'object') {
    const location = copyRecord(next.location);
    location.lat = coarsenPublicCoordinate(
      typeof location.lat === 'number' ? location.lat : null,
    );
    location.lng = coarsenPublicCoordinate(
      typeof location.lng === 'number' ? location.lng : null,
    );
    next.location = location;
  }
  if (next.seller && typeof next.seller === 'object') {
    const seller = omitKeys(copyRecord(next.seller), [
      'email',
      'phoneNumber',
      'dateOfBirth',
      'address',
      'postalCode',
    ]);
    if (typeof seller.lat === 'number') seller.lat = coarsenPublicCoordinate(seller.lat);
    if (typeof seller.lng === 'number') seller.lng = coarsenPublicCoordinate(seller.lng);
    if (typeof seller.username === 'string' && seller.username) {
      seller.name = seller.username;
    }
    seller.displayFullName = false;
    next.seller = seller;
  }
  return next as T;
}

const SENSITIVE_USER_KEYS = [
  'email',
  'dateOfBirth',
  'phoneNumber',
  'address',
  'postalCode',
  'lat',
  'lng',
  'iban',
  'accountHolderName',
] as const;

export function redactMinorPublicProfile<T extends object>(
  user: T,
  now?: Date,
): T {
  if (!requiresMinorPublicPrivacy(user as AgeSubject, now)) return user;
  const next = omitKeys(copyRecord(user), SENSITIVE_USER_KEYS);
  next.displayFullName = false;
  next.displayNameOption = 'username';
  if (next.DeliveryProfile && typeof next.DeliveryProfile === 'object') {
    next.DeliveryProfile = {
      ...copyRecord(next.DeliveryProfile),
      age: null,
    };
  }
  const sellerProfile = next.SellerProfile;
  if (sellerProfile && typeof sellerProfile === 'object' && 'products' in sellerProfile) {
    const profile = sellerProfile as { products?: Array<Record<string, unknown>> };
    next.SellerProfile = {
      ...profile,
      products: (profile.products ?? []).map((product) => ({
        ...product,
        pickupAddress: null,
      })),
    };
  }
  return next as T;
}
