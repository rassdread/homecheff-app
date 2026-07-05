import type { ProfileV2SellerRole, ProfileV2User } from './types';

function normalizeSellerRoles(raw: unknown): ProfileV2SellerRole[] {
  if (!Array.isArray(raw)) return [];
  const out: ProfileV2SellerRole[] = [];
  for (const r of raw) {
    const s = String(r).toLowerCase();
    if (s === 'chef' || s === 'cheff') out.push('chef');
    else if (s === 'garden' || s === 'grower' || s === 'grown') out.push('garden');
    else if (s === 'designer' || s === 'design') out.push('designer');
  }
  return [...new Set(out)];
}

/** Normalize private or public user payload into ProfileV2User. */
export function normalizeProfileV2User(raw: Record<string, unknown>): ProfileV2User {
  const sellerRoles = normalizeSellerRoles(raw.sellerRoles);
  const createdAt = raw.createdAt;
  return {
    id: String(raw.id ?? ''),
    name: (raw.name as string | null) ?? null,
    username: (raw.username as string | null) ?? null,
    email: (raw.email as string | null) ?? null,
    bio: (raw.bio as string | null) ?? null,
    quote: (raw.quote as string | null) ?? null,
    place: (raw.place as string | null) ?? null,
    gender: (raw.gender as string | null) ?? null,
    interests: Array.isArray(raw.interests) ? (raw.interests as string[]) : [],
    buyerTypes: Array.isArray(raw.buyerTypes) ? (raw.buyerTypes as string[]) : [],
    selectedBuyerType: (raw.selectedBuyerType as string | null) ?? null,
    image: (raw.image as string | null) ?? null,
    profileImage:
      (raw.profileImage as string | null) ??
      (raw.image as string | null) ??
      null,
    role: String(raw.role ?? 'USER'),
    sellerRoles,
    buyerRoles: Array.isArray(raw.buyerRoles) ? (raw.buyerRoles as string[]) : [],
    displayFullName: Boolean(raw.displayFullName),
    displayNameOption: (raw.displayNameOption as string) ?? 'username',
    showFansList: raw.showFansList !== false,
    showProfileToEveryone: raw.showProfileToEveryone !== false,
    showOnlineStatus: Boolean(raw.showOnlineStatus),
    fanRequestEnabled: raw.fanRequestEnabled !== false,
    emailVerified: (raw.emailVerified as Date | string | null) ?? null,
    hasPassword: raw.hasPassword as boolean | undefined,
    stripeConnectAccountId: (raw.stripeConnectAccountId as string | null) ?? null,
    stripeConnectOnboardingCompleted: Boolean(raw.stripeConnectOnboardingCompleted),
    createdAt:
      createdAt instanceof Date
        ? createdAt.toISOString()
        : String(createdAt ?? new Date().toISOString()),
    profileViews: typeof raw.profileViews === 'number' ? raw.profileViews : undefined,
    SellerProfile: (raw.SellerProfile as ProfileV2User['SellerProfile']) ?? null,
    DeliveryProfile: (raw.DeliveryProfile as ProfileV2User['DeliveryProfile']) ?? null,
    Dish: (raw.Dish as unknown[]) ?? (raw.dish as unknown[]),
    dish: (raw.dish as unknown[]) ?? (raw.Dish as unknown[]),
  };
}
