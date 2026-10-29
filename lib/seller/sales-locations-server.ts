/**
 * Seller sales locations — database access.
 * Does not update Order rows, stock, Stripe, or delivery profiles.
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { geocodeDutchAddress } from '@/lib/dutch-geocoding';
import { prisma } from '@/lib/prisma';
import { getBusinessVisibilityProfile } from '@/lib/business/visibility-profile';
import type { SellerSubscriptionInput } from '@/lib/business/visibility-profile';
import {
  activeFeedPoints,
  actorOwnsLocation,
  entitledActiveLocationIds,
  formatSalesLocationAddress,
  locationLimitDecision,
  parseSalesLocationDraft,
  parseSalesLocationIdList,
  primaryIdAfterDeactivate,
  toPublicPickupLocation,
  type FeedSalesPoint,
  type PublicPickupLocation,
  type SalesLocationDraft,
} from '@/lib/seller/sales-locations';

type Db = PrismaClient | Prisma.TransactionClient;

export type SalesLocationRecord = {
  id: string;
  userId: string;
  name: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  isPrimary: boolean;
  isActive: boolean;
};

export type LocationMutationResult =
  | { ok: true; location: PublicPickupLocation }
  | {
      ok: false;
      status: number;
      error: string;
      code: string;
      maxLocations?: number;
      plan?: string;
      upgradeHref?: string;
    };

async function geocodeDraft(draft: SalesLocationDraft): Promise<{ lat: number; lng: number } | null> {
  if (draft.country !== 'NL') return null;
  const house = draft.houseNumber.match(/\d+/)?.[0];
  if (!house) return null;
  try {
    const result = await geocodeDutchAddress(draft.postalCode, house);
    if ('error' in result) return null;
    if (!Number.isFinite(result.lat) || !Number.isFinite(result.lng)) return null;
    return { lat: result.lat, lng: result.lng };
  } catch {
    return null;
  }
}

function present(row: SalesLocationRecord): PublicPickupLocation {
  return toPublicPickupLocation(row);
}

async function loadPlan(userId: string) {
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: {
      subscriptionId: true,
      subscriptionValidUntil: true,
      Subscription: { select: { name: true, feeBps: true } },
    },
  });
  const input: SellerSubscriptionInput = {
    subscriptionId: profile?.subscriptionId,
    subscriptionValidUntil: profile?.subscriptionValidUntil,
    Subscription: profile?.Subscription,
  };
  return getBusinessVisibilityProfile(input);
}

async function activeCount(userId: string, db: Db = prisma): Promise<number> {
  return db.sellerSalesLocation.count({
    where: { userId, isActive: true },
  });
}

async function lockSellerRow(userId: string, db: Db): Promise<void> {
  await db.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
}

async function entitledIdSetForUsers(
  userIds: string[],
  db: Db = prisma,
): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  if (userIds.length === 0) return map;
  const [rows, profiles] = await Promise.all([
    db.sellerSalesLocation.findMany({
      where: { userId: { in: userIds }, isActive: true },
      select: { id: true, userId: true, isPrimary: true, isActive: true, createdAt: true },
    }),
    prisma.sellerProfile.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        subscriptionId: true,
        subscriptionValidUntil: true,
        Subscription: { select: { name: true, feeBps: true } },
      },
    }),
  ]);
  const maxByUser = new Map(
    profiles.map((profile) => [
      profile.userId,
      getBusinessVisibilityProfile({
        subscriptionId: profile.subscriptionId,
        subscriptionValidUntil: profile.subscriptionValidUntil,
        Subscription: profile.Subscription,
      }).maxLocations,
    ]),
  );
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const bucket = grouped.get(row.userId) ?? [];
    bucket.push(row);
    grouped.set(row.userId, bucket);
  }
  const individualMax = getBusinessVisibilityProfile('individual').maxLocations;
  for (const userId of userIds) {
    map.set(
      userId,
      new Set(
        entitledActiveLocationIds(grouped.get(userId) ?? [], maxByUser.get(userId) ?? individualMax),
      ),
    );
  }
  return map;
}

export async function listSalesLocations(userId: string): Promise<{
  locations: PublicPickupLocation[];
  limit: {
    max: number;
    activeCount: number;
    plan: string;
    canAdd: boolean;
    upgradeHref: string;
  };
}> {
  const [rows, plan] = await Promise.all([
    prisma.sellerSalesLocation.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    }),
    loadPlan(userId),
  ]);
  const locations = rows.map((row) => present(row));
  const active = locations.filter((row) => row.isActive).length;
  const decision = locationLimitDecision(active, plan.maxLocations);
  return {
    locations,
    limit: {
      max: plan.maxLocations,
      activeCount: active,
      plan: plan.plan,
      canAdd: decision.allowed,
      upgradeHref: '/sell',
    },
  };
}

class LocationLimitError extends Error {
  constructor(
    private readonly plan: string,
    private readonly maxLocations: number,
    private readonly upgradeHref?: string,
  ) {
    super('LOCATION_LIMIT');
  }

  result(): LocationMutationResult {
    return {
      ok: false,
      status: 409,
      error: `Je ${this.plan}-abonnement staat ${this.maxLocations} actieve locatie${this.maxLocations === 1 ? '' : 's'} toe.`,
      code: 'LOCATION_LIMIT',
      maxLocations: this.maxLocations,
      plan: this.plan,
      upgradeHref: this.upgradeHref,
    };
  }
}

export async function createSalesLocation(
  userId: string,
  body: unknown,
): Promise<LocationMutationResult> {
  const parsed = parseSalesLocationDraft(body);
  if (!parsed.ok) {
    return { ok: false, status: 400, error: parsed.error, code: 'INVALID_LOCATION' };
  }
  const plan = await loadPlan(userId);
  const coords = await geocodeDraft(parsed.value);
  try {
    const row = await prisma.$transaction(async (tx) => {
      await lockSellerRow(userId, tx);
      const count = await activeCount(userId, tx);
      const decision = locationLimitDecision(count, plan.maxLocations);
      if (!decision.allowed) {
        throw new LocationLimitError(plan.plan, plan.maxLocations, decision.upgradeHref);
      }
      const existingPrimary = await tx.sellerSalesLocation.findFirst({
        where: { userId, isActive: true, isPrimary: true },
        select: { id: true },
      });
      return tx.sellerSalesLocation.create({
        data: {
          userId,
          ...parsed.value,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          isPrimary: !existingPrimary,
          isActive: true,
        },
      });
    });
    return { ok: true, location: present(row) };
  } catch (error) {
    if (error instanceof LocationLimitError) return error.result();
    throw error;
  }
}

export async function updateSalesLocation(
  userId: string,
  locationId: string,
  body: unknown,
): Promise<LocationMutationResult> {
  const current = await prisma.sellerSalesLocation.findUnique({
    where: { id: locationId },
  });
  if (!current || !actorOwnsLocation(current.userId, userId)) {
    return { ok: false, status: 404, error: 'Locatie niet gevonden.', code: 'NOT_FOUND' };
  }
  const raw = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const wantsActive = typeof raw.isActive === 'boolean' ? raw.isActive : undefined;
  const wantsPrimary = raw.isPrimary === true;
  const reactivating = wantsActive === true && !current.isActive;

  const addressTouched =
    raw.name != null ||
    raw.street != null ||
    raw.houseNumber != null ||
    raw.postalCode != null ||
    raw.city != null ||
    raw.country != null;
  let draft: SalesLocationDraft | null = null;
  if (addressTouched) {
    const parsed = parseSalesLocationDraft({
      name: raw.name ?? current.name,
      street: raw.street ?? current.street,
      houseNumber: raw.houseNumber ?? current.houseNumber,
      postalCode: raw.postalCode ?? current.postalCode,
      city: raw.city ?? current.city,
      country: raw.country ?? current.country,
    });
    if (!parsed.ok) {
      return { ok: false, status: 400, error: parsed.error, code: 'INVALID_LOCATION' };
    }
    draft = parsed.value;
  }

  const coords = draft ? await geocodeDraft(draft) : null;
  const nextActive = wantsActive ?? current.isActive;

  let row;
  try {
    row = await prisma.$transaction(async (tx) => {
    await lockSellerRow(userId, tx);
    if (reactivating) {
      const plan = await loadPlan(userId);
      const count = await activeCount(userId, tx);
      const decision = locationLimitDecision(count, plan.maxLocations);
      if (!decision.allowed) {
        throw new LocationLimitError(plan.plan, plan.maxLocations, decision.upgradeHref);
      }
    }
    if (wantsPrimary && nextActive) {
      await tx.sellerSalesLocation.updateMany({
        where: { userId, isPrimary: true, NOT: { id: locationId } },
        data: { isPrimary: false },
      });
    }
    const updated = await tx.sellerSalesLocation.update({
      where: { id: locationId },
      data: {
        ...(draft
          ? {
              ...draft,
              lat: coords?.lat ?? current.lat,
              lng: coords?.lng ?? current.lng,
            }
          : {}),
        ...(wantsActive !== undefined ? { isActive: wantsActive } : {}),
        ...(wantsPrimary && nextActive ? { isPrimary: true, isActive: true } : {}),
      },
    });
    if (wantsActive === false && current.isPrimary) {
      const siblings = await tx.sellerSalesLocation.findMany({
        where: { userId },
        select: { id: true, isPrimary: true, isActive: true },
      });
      const promote = primaryIdAfterDeactivate(
        siblings.map((sibling) => ({
          ...sibling,
          isActive: sibling.id === locationId ? false : sibling.isActive,
          isPrimary: sibling.id === locationId ? false : sibling.isPrimary,
        })),
        locationId,
      );
      if (promote) {
        await tx.sellerSalesLocation.update({
          where: { id: promote },
          data: { isPrimary: true },
        });
      }
    }
    return updated;
    });
  } catch (error) {
    if (error instanceof LocationLimitError) return error.result();
    throw error;
  }

  return { ok: true, location: present(row) };
}

export async function selectedLocationIdsForProduct(
  userId: string,
  productId: string,
): Promise<string[] | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { seller: { select: { userId: true } } },
  });
  if (!product || !actorOwnsLocation(product.seller.userId, userId)) return null;
  const links = await prisma.productSalesLocation.findMany({
    where: { productId },
    select: { locationId: true },
  });
  return links.map((link) => link.locationId);
}

export async function assertOwnedActiveSalesLocations(
  userId: string,
  input: unknown,
): Promise<
  | { ok: true; ids: string[] }
  | { ok: false; status: number; error: string; code: string }
> {
  const ids = parseSalesLocationIdList(input);
  if (ids.length === 0) return { ok: true, ids: [] };
  const rows = await prisma.sellerSalesLocation.findMany({
    where: { id: { in: ids }, userId, isActive: true },
    select: { id: true, userId: true },
  });
  if (rows.length !== ids.length || rows.some((row) => !actorOwnsLocation(row.userId, userId))) {
    return {
      ok: false,
      status: 403,
      error: 'Kies alleen je eigen actieve locaties.',
      code: 'LOCATION_FORBIDDEN',
    };
  }
  const entitled = await entitledIdSetForUsers([userId]);
  const allowed = entitled.get(userId) ?? new Set<string>();
  if (ids.some((id) => !allowed.has(id))) {
    return {
      ok: false,
      status: 409,
      error: 'Deze locatie valt buiten je abonnement.',
      code: 'LOCATION_LIMIT',
    };
  }
  return { ok: true, ids };
}

export async function replaceProductSalesLocationLinks(
  productId: string,
  locationIds: string[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.productSalesLocation.deleteMany({
      where: {
        productId,
        ...(locationIds.length > 0 ? { locationId: { notIn: locationIds } } : {}),
      },
    });
    for (const locationId of locationIds) {
      await tx.productSalesLocation.upsert({
        where: { productId_locationId: { productId, locationId } },
        create: { productId, locationId },
        update: {},
      });
    }
  });
}

export async function loadPublicPickupLocations(
  productId: string,
): Promise<PublicPickupLocation[]> {
  const links = await prisma.productSalesLocation.findMany({
    where: { productId, location: { isActive: true } },
    include: { location: true },
  });
  const userIds = [...new Set(links.map((link) => link.location.userId))];
  const entitled = await entitledIdSetForUsers(userIds);
  return links
    .filter((link) => entitled.get(link.location.userId)?.has(link.location.id))
    .map((link) => present(link.location))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
}

export async function loadActiveSalesLocationsByProductId(
  db: Db,
  productIds: string[],
): Promise<Map<string, FeedSalesPoint[]>> {
  const map = new Map<string, FeedSalesPoint[]>();
  if (productIds.length === 0) return map;
  const links = await db.productSalesLocation.findMany({
    where: { productId: { in: productIds }, location: { isActive: true } },
    select: {
      productId: true,
      location: {
        select: {
          id: true,
          userId: true,
          lat: true,
          lng: true,
          city: true,
          isActive: true,
          isPrimary: true,
        },
      },
    },
  });
  const entitled = await entitledIdSetForUsers(
    [...new Set(links.map((link) => link.location.userId))],
    db,
  );
  const visible = links.filter((link) =>
    entitled.get(link.location.userId)?.has(link.location.id),
  );
  const grouped = new Map<string, typeof visible>();
  for (const link of visible) {
    const bucket = grouped.get(link.productId) ?? [];
    bucket.push(link);
    grouped.set(link.productId, bucket);
  }
  for (const [productId, rows] of grouped) {
    map.set(
      productId,
      activeFeedPoints(rows.map((row) => row.location)),
    );
  }
  return map;
}

export async function resolveCheckoutPickupAddress(input: {
  deliveryMode: string;
  buyerAddress: string;
  items: Array<{ productId?: string | null; pickupLocationId?: string | null }>;
}): Promise<
  | { ok: true; address: string }
  | { ok: false; status: number; error: string; code: string }
> {
  if (input.deliveryMode.trim().toLowerCase() !== 'pickup') {
    return { ok: true, address: input.buyerAddress };
  }
  const productIds = [
    ...new Set(
      input.items
        .map((item) => item.productId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ];
  if (productIds.length === 0) return { ok: true, address: input.buyerAddress };
  const links = await prisma.productSalesLocation.findMany({
    where: { productId: { in: productIds }, location: { isActive: true } },
    select: {
      productId: true,
      locationId: true,
      location: true,
    },
  });
  if (links.length === 0) return { ok: true, address: input.buyerAddress };
  const entitled = await entitledIdSetForUsers([...new Set(links.map((link) => link.location.userId))]);
  const byProduct = new Map<string, typeof links>();
  for (const link of links) {
    if (!entitled.get(link.location.userId)?.has(link.location.id)) continue;
    const bucket = byProduct.get(link.productId) ?? [];
    bucket.push(link);
    byProduct.set(link.productId, bucket);
  }
  const labels: string[] = [];
  for (const item of input.items) {
    if (!item.productId || !links.some((link) => link.productId === item.productId)) continue;
    const chosen = (byProduct.get(item.productId) ?? []).find(
      (link) => link.locationId === item.pickupLocationId,
    );
    if (!chosen) {
      return {
        ok: false,
        status: 400,
        error: 'Kies een geldige afhaallocatie.',
        code: 'PICKUP_LOCATION_REQUIRED',
      };
    }
    const label = formatSalesLocationAddress(chosen.location);
    if (!labels.includes(label)) labels.push(label);
  }
  if (labels.length === 0) return { ok: true, address: input.buyerAddress };
  return { ok: true, address: labels.join(' | ') };
}

export function addressLabelOf(location: {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
}): string {
  return formatSalesLocationAddress(location);
}
