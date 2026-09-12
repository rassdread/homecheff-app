/**
 * Canonical public listing eligibility (SoT).
 *
 * Every anonymous/public surface that returns Product rows MUST use
 * `publicListingEligibilityWhere()` (or `isListingPubliclyDiscoverable` post-fetch).
 *
 * Rules:
 * - isActive === true
 * - integrity ACTIVE | REVIEW_REQUIRED
 * - seller user not suspended/deleted
 * - seller is not a certification/E2E/fixture account
 *
 * Inactive products (even with paid Stripe orders) are NEVER public-discoverable.
 * Detail pages for participants remain separate from discovery.
 */

import type { Prisma } from '@prisma/client';
import { productIntegrityPublicWhere } from '@/lib/trust/integrity-status';
import {
  isIntegrityPubliclyDiscoverable,
} from '@/lib/trust/integrity-status';

/** Email domains / patterns used exclusively by certification & E2E fixtures. */
export const CERTIFICATION_FIXTURE_EMAIL_SUFFIXES = [
  '@homecheff-validation.test',
  '@homecheff.invalid',
  '@homecheff.test',
] as const;

const FIXTURE_EMAIL_RE =
  /@(homecheff-validation\.test|homecheff\.invalid|homecheff\.test)$/i;

const FIXTURE_BIO_RE = /certificationFixture\s*=\s*true/i;

export function isCertificationFixtureEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (FIXTURE_EMAIL_RE.test(e)) return true;
  // Scrubbed / cleaned cert accounts
  if (e.includes('homecheff-validation.test')) return true;
  if (e.startsWith('deleted+') && e.includes('@homecheff')) return true;
  if (e.startsWith('cleaned-') && e.includes('homecheff-validation')) return true;
  return false;
}

export function isCertificationFixtureBio(
  bio: string | null | undefined,
): boolean {
  return Boolean(bio && FIXTURE_BIO_RE.test(bio));
}

/** True when this account must never appear on public profile/discovery surfaces. */
export function isCertificationFixtureUser(user: {
  email?: string | null;
  bio?: string | null;
}): boolean {
  return (
    isCertificationFixtureEmail(user.email) ||
    isCertificationFixtureBio(user.bio)
  );
}

export type ListingPublicDiscoverabilityInput = {
  isActive?: boolean | null;
  integrityStatus?: string | null;
  sellerEmail?: string | null;
  sellerBio?: string | null;
  sellerSuspendedAt?: Date | string | null;
  sellerAccountDeletedAt?: Date | string | null;
};

/**
 * Boolean gate for detail/SEO/post-fetch checks.
 */
export function isListingPubliclyDiscoverable(
  product: ListingPublicDiscoverabilityInput,
): boolean {
  if (!product.isActive) return false;
  if (!isIntegrityPubliclyDiscoverable(product.integrityStatus)) return false;
  if (product.sellerSuspendedAt) return false;
  if (product.sellerAccountDeletedAt) return false;
  if (isCertificationFixtureEmail(product.sellerEmail)) return false;
  if (isCertificationFixtureBio(product.sellerBio)) return false;
  return true;
}

/**
 * Prisma where fragment — AND into every public Product findMany.
 * Does NOT include inactive+Stripe-order exceptions (those are not public discovery).
 */
export function publicListingEligibilityWhere(): Prisma.ProductWhereInput {
  return {
    AND: [
      { isActive: true },
      productIntegrityPublicWhere(),
      {
        seller: {
          User: {
            suspendedAt: null,
            accountDeletedAt: null,
            AND: [
              // Exclude known certification email domains
              {
                NOT: {
                  OR: CERTIFICATION_FIXTURE_EMAIL_SUFFIXES.map((suffix) => ({
                    email: { endsWith: suffix },
                  })),
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

/** Alias used by sitemap — same SoT. */
export function publicListingSitemapWhere(): Prisma.ProductWhereInput {
  return publicListingEligibilityWhere();
}

/** Combine SoT with extra predicates (category, geo, text search, …). */
export function andPublicListingWhere(
  extras?: Prisma.ProductWhereInput | Prisma.ProductWhereInput[],
): Prisma.ProductWhereInput {
  const extraList = !extras
    ? []
    : Array.isArray(extras)
      ? extras.filter((e) => e && Object.keys(e).length > 0)
      : Object.keys(extras).length > 0
        ? [extras]
        : [];
  if (extraList.length === 0) return publicListingEligibilityWhere();
  return { AND: [publicListingEligibilityWhere(), ...extraList] };
}
