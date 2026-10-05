/**
 * Idempotent, additive repair plan for historical seller capabilities.
 * Reads already-loaded rows. Does not query or write.
 * A public commercial OFFER classified by listingSemanticFamily is the only proof.
 * Existing roles are kept. User.role is never part of the plan.
 */

import { listingSemanticFamily } from '@/lib/marketplace/commercial-capability';
import {
  CANONICAL_SELLER_ROLES,
  canonicalizeSellerRoleList,
  normalizeSellerRole,
  unionSellerRoles,
  type CanonicalSellerRole,
} from '@/lib/seller/seller-role-consistency';

const ROLE_ORDER: CanonicalSellerRole[] = [...CANONICAL_SELLER_ROLES];

export type HistoricalOfferRow = {
  productId: string;
  userId: string;
  listingIntent: string;
  marketplaceCategory: string | null;
  productCategory: string | null;
  specializations: string[];
  subcategory: string | null;
  isActive: boolean;
  integrityPublic: boolean;
  sellerSuspended: boolean;
  sellerDeleted: boolean;
  isCertificationFixture: boolean;
};

export type HistoricalUserRow = {
  userId: string;
  userRole: string;
  sellerRoles: string[];
  hasSellerProfile: boolean;
  hasDeliveryProfile: boolean;
  isCertificationFixture: boolean;
  accountDeleted: boolean;
};

export type RoleRepair = {
  userId: string;
  userRole: string;
  before: string[];
  after: string[];
  added: CanonicalSellerRole[];
  evidence: string[];
};

export type HistoricalIntegrityPlan = {
  provenServiceUserIds: string[];
  serviceUsersAlreadyWithService: string[];
  serviceRepairs: RoleRepair[];
  otherRoleRepairs: RoleRepair[];
  ambiguousServiceUserIds: string[];
  profilesToCreate: Array<{ userId: string; reason: 'commercial-role-without-profile' }>;
  profileWithoutRole: {
    count: number;
    provableRoleMissing: string[];
    legitimateProfileWithoutRole: string[];
    ambiguous: string[];
    certificationOrSystem: string[];
  };
  roleWithoutProfile: {
    count: number;
    definitelyRequired: string[];
    notRequired: string[];
    ambiguous: string[];
    certificationOrSystem: string[];
  };
  excluded: {
    requests: number;
    serviceLikeRequests: number;
    dishes: number;
    certificationOffers: number;
    inactiveOrHiddenOffers: number;
  };
};

function commercialRoles(roles: readonly string[]): CanonicalSellerRole[] {
  return canonicalizeSellerRoleList(roles).filter((role): role is CanonicalSellerRole =>
    (ROLE_ORDER as readonly string[]).includes(role),
  );
}

export function provenCapability(offer: HistoricalOfferRow): CanonicalSellerRole | null {
  if (offer.listingIntent !== 'OFFER') return null;
  if (!offer.isActive || !offer.integrityPublic) return null;
  if (offer.sellerSuspended || offer.sellerDeleted || offer.isCertificationFixture) return null;
  const family = listingSemanticFamily({
    marketplaceCategory: offer.marketplaceCategory,
    productCategory: offer.productCategory,
    specializations: offer.specializations,
    subcategory: offer.subcategory,
  });
  if (family === 'food') return 'chef';
  if (family === 'garden') return 'garden';
  if (family === 'creation') return 'designer';
  if (family === 'service') return 'service';
  return null;
}

function evidenceLabel(offer: HistoricalOfferRow, role: CanonicalSellerRole): string {
  const category = offer.marketplaceCategory ?? 'none';
  const sub = offer.subcategory ?? 'none';
  return `${role}:${category}:${sub}`;
}

function unionProven(
  existing: readonly string[],
  add: readonly CanonicalSellerRole[],
): { roles: string[]; changed: boolean; added: CanonicalSellerRole[] } {
  let roles = canonicalizeSellerRoleList(existing);
  const added: CanonicalSellerRole[] = [];
  for (const role of ROLE_ORDER) {
    if (!add.includes(role)) continue;
    const next = unionSellerRoles(roles, role);
    if (next.added) added.push(role);
    roles = next.roles;
  }
  return { roles, changed: added.length > 0, added };
}

export function sellerRoleWriteIsAdditive(before: readonly string[], after: readonly string[]): boolean {
  const afterSet = new Set(after);
  if (after.filter((role) => role === 'service').length > 1) return false;
  for (const value of before) {
    if (typeof value !== 'string') return false;
    const kept = normalizeSellerRole(value) ?? value.trim();
    if (!kept) continue;
    if (!afterSet.has(kept) && !afterSet.has(value)) return false;
  }
  return true;
}

function looksLikeServiceTaxonomy(offer: HistoricalOfferRow): boolean {
  const marketplace = String(offer.marketplaceCategory ?? '').toUpperCase();
  if (marketplace === 'PRACTICAL_SERVICE' || marketplace === 'KNOWLEDGE' || marketplace === 'ARTISTIC_SERVICE' || marketplace === 'DESIGN') {
    return true;
  }
  const sub = String(offer.subcategory ?? '').toLowerCase();
  if (sub.startsWith('design.')) return true;
  return (offer.specializations ?? []).some((id) => String(id).toLowerCase().startsWith('design.'));
}

export function planHistoricalRoleIntegrity(input: {
  offers: HistoricalOfferRow[];
  users: HistoricalUserRow[];
  requestCount: number;
  serviceLikeRequestCount: number;
  dishCount: number;
}): HistoricalIntegrityPlan {
  const usersById = new Map<string, HistoricalUserRow>();
  for (const user of input.users) usersById.set(user.userId, user);

  const provenByUser = new Map<string, { roles: Set<CanonicalSellerRole>; evidence: string[] }>();
  let certificationOffers = 0;
  let inactiveOrHiddenOffers = 0;
  const ambiguousServiceUserIds = new Set<string>();

  for (const offer of input.offers) {
    if (offer.isCertificationFixture) {
      certificationOffers += 1;
      continue;
    }
    const role = provenCapability(offer);
    if (!role) {
      if (offer.listingIntent === 'OFFER' && (!offer.isActive || !offer.integrityPublic || offer.sellerSuspended || offer.sellerDeleted)) {
        inactiveOrHiddenOffers += 1;
      }
      if (
        offer.listingIntent === 'OFFER' &&
        offer.isActive &&
        offer.integrityPublic &&
        !offer.sellerSuspended &&
        !offer.sellerDeleted &&
        looksLikeServiceTaxonomy(offer)
      ) {
        ambiguousServiceUserIds.add(offer.userId);
      }
      continue;
    }
    const bucket = provenByUser.get(offer.userId) ?? { roles: new Set<CanonicalSellerRole>(), evidence: [] };
    bucket.roles.add(role);
    bucket.evidence.push(evidenceLabel(offer, role));
    provenByUser.set(offer.userId, bucket);
  }

  const provenServiceUserIds: string[] = [];
  const serviceUsersAlreadyWithService: string[] = [];
  const serviceRepairs: RoleRepair[] = [];
  const otherRoleRepairs: RoleRepair[] = [];

  for (const [userId, proof] of provenByUser) {
    const user = usersById.get(userId);
    if (!user || user.isCertificationFixture || user.accountDeleted) continue;
    if (!proof.roles.has('service')) continue;
    provenServiceUserIds.push(userId);
    const already = commercialRoles(user.sellerRoles).includes('service');
    if (already) {
      serviceUsersAlreadyWithService.push(userId);
      continue;
    }
    if (ambiguousServiceUserIds.has(userId) && !proof.roles.has('service')) continue;
    const currentCommercial = commercialRoles(user.sellerRoles);
    const toAdd: CanonicalSellerRole[] = ['service'];
    if (currentCommercial.length === 0) {
      for (const role of ROLE_ORDER) {
        if (role !== 'service' && proof.roles.has(role)) toAdd.push(role);
      }
    }
    const merged = unionProven(user.sellerRoles, toAdd);
    if (!merged.changed) continue;
    if (!sellerRoleWriteIsAdditive(user.sellerRoles, merged.roles)) continue;
    const repair: RoleRepair = {
      userId,
      userRole: user.userRole,
      before: [...user.sellerRoles],
      after: merged.roles,
      added: merged.added,
      evidence: proof.evidence,
    };
    if (merged.added.length === 1 && merged.added[0] === 'service') serviceRepairs.push(repair);
    else otherRoleRepairs.push(repair);
  }

  for (const [userId, proof] of provenByUser) {
    const user = usersById.get(userId);
    if (!user || user.isCertificationFixture || user.accountDeleted) continue;
    if (proof.roles.has('service')) continue;
    if (commercialRoles(user.sellerRoles).length > 0) continue;
    if (!user.hasSellerProfile) continue;
    const toAdd = ROLE_ORDER.filter((role) => proof.roles.has(role));
    if (toAdd.length === 0) continue;
    const merged = unionProven(user.sellerRoles, toAdd);
    if (!merged.changed || !sellerRoleWriteIsAdditive(user.sellerRoles, merged.roles)) continue;
    otherRoleRepairs.push({
      userId,
      userRole: user.userRole,
      before: [...user.sellerRoles],
      after: merged.roles,
      added: merged.added,
      evidence: proof.evidence,
    });
  }

  const profileWithoutRole = {
    count: 0,
    provableRoleMissing: [] as string[],
    legitimateProfileWithoutRole: [] as string[],
    ambiguous: [] as string[],
    certificationOrSystem: [] as string[],
  };

  for (const user of input.users) {
    if (!user.hasSellerProfile) continue;
    if (commercialRoles(user.sellerRoles).length > 0) continue;
    profileWithoutRole.count += 1;
    if (user.isCertificationFixture) {
      profileWithoutRole.certificationOrSystem.push(user.userId);
      continue;
    }
    const proof = provenByUser.get(user.userId);
    if (proof && proof.roles.size > 0) {
      profileWithoutRole.provableRoleMissing.push(user.userId);
      continue;
    }
    const unclassifiedOffer = input.offers.some(
      (offer) =>
        offer.userId === user.userId &&
        offer.listingIntent === 'OFFER' &&
        offer.isActive &&
        offer.integrityPublic &&
        !offer.isCertificationFixture &&
        provenCapability(offer) == null &&
        looksLikeServiceTaxonomy(offer),
    );
    if (unclassifiedOffer) profileWithoutRole.ambiguous.push(user.userId);
    else profileWithoutRole.legitimateProfileWithoutRole.push(user.userId);
  }

  const roleWithoutProfile = {
    count: 0,
    definitelyRequired: [] as string[],
    notRequired: [] as string[],
    ambiguous: [] as string[],
    certificationOrSystem: [] as string[],
  };
  const profilesToCreate: HistoricalIntegrityPlan['profilesToCreate'] = [];

  for (const user of input.users) {
    if (user.hasSellerProfile || user.accountDeleted) continue;
    const commercial = commercialRoles(user.sellerRoles);
    const repair = [...serviceRepairs, ...otherRoleRepairs].find((row) => row.userId === user.userId);
    const willHaveCommercial = commercial.length > 0 || (repair?.added.some((role) => role !== 'delivery') ?? false);
    if (commercial.length === 0 && !willHaveCommercial) continue;
    roleWithoutProfile.count += 1;
    if (user.isCertificationFixture) {
      roleWithoutProfile.certificationOrSystem.push(user.userId);
      continue;
    }
    const onlyDelivery = commercial.length > 0 && commercial.every((role) => role === 'delivery') && !repair;
    if (onlyDelivery) {
      roleWithoutProfile.notRequired.push(user.userId);
      continue;
    }
    const hasMarketplaceRole =
      commercial.some((role) => role !== 'delivery') ||
      (repair?.added.some((role) => role !== 'delivery') ?? false);
    if (hasMarketplaceRole) {
      roleWithoutProfile.definitelyRequired.push(user.userId);
      profilesToCreate.push({ userId: user.userId, reason: 'commercial-role-without-profile' });
      continue;
    }
    roleWithoutProfile.ambiguous.push(user.userId);
  }

  return {
    provenServiceUserIds,
    serviceUsersAlreadyWithService,
    serviceRepairs,
    otherRoleRepairs,
    ambiguousServiceUserIds: [...ambiguousServiceUserIds],
    profilesToCreate,
    profileWithoutRole,
    roleWithoutProfile,
    excluded: {
      requests: input.requestCount,
      serviceLikeRequests: input.serviceLikeRequestCount,
      dishes: input.dishCount,
      certificationOffers,
      inactiveOrHiddenOffers,
    },
  };
}
