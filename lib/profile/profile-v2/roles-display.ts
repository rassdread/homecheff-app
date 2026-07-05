import type { ProfileV2SellerRole, ProfileV2Stats, ProfileV2User } from './types';

export type BuyerRoleKey =
  | 'explorer'
  | 'collector'
  | 'enthusiast'
  | 'adventurer'
  | 'connoisseur'
  | 'connoisseurArt'
  | 'enjoyer'
  | 'foodLover';

const BUYER_ROLE_ALIASES: Record<string, BuyerRoleKey> = {
  ontdekker: 'explorer',
  verzamelaar: 'collector',
  liefhebber: 'enthusiast',
  avonturier: 'adventurer',
  fijnproever: 'connoisseur',
  connaisseur: 'connoisseurArt',
  genieter: 'enjoyer',
  food_lover: 'foodLover',
  explorer: 'explorer',
  collector: 'collector',
  enthusiast: 'enthusiast',
  adventurer: 'adventurer',
  connoisseur: 'connoisseur',
  connoisseurart: 'connoisseurArt',
  enjoyer: 'enjoyer',
  foodlover: 'foodLover',
};

export function normalizeBuyerRoleKey(raw: string): BuyerRoleKey | null {
  const key = BUYER_ROLE_ALIASES[raw.toLowerCase()] ?? BUYER_ROLE_ALIASES[raw];
  return key ?? null;
}

export function buyerRoleLabelKey(raw: string): string {
  const key = normalizeBuyerRoleKey(raw);
  return key ? `profileV2.roles.buyer.${key}` : `profileV2.roles.buyer.unknown`;
}

export function sellerRoleLabelKey(role: ProfileV2SellerRole): string {
  return `profileV2.roles.seller.${role}`;
}

export const SELLER_ROLE_EMOJI: Record<ProfileV2SellerRole, string> = {
  chef: '👨‍🍳',
  garden: '🌱',
  designer: '🎨',
};

export const SELLER_ROLE_ACCENT: Record<
  ProfileV2SellerRole,
  { border: string; bg: string; text: string; dot: string }
> = {
  chef: {
    border: 'border-orange-200/70',
    bg: 'bg-orange-50/70',
    text: 'text-orange-950',
    dot: 'bg-orange-500',
  },
  garden: {
    border: 'border-emerald-200/70',
    bg: 'bg-emerald-50/70',
    text: 'text-emerald-950',
    dot: 'bg-emerald-500',
  },
  designer: {
    border: 'border-violet-200/70',
    bg: 'bg-violet-50/70',
    text: 'text-violet-950',
    dot: 'bg-violet-500',
  },
};

export const BUYER_ROLE_ACCENT: Record<
  BuyerRoleKey,
  { border: string; bg: string; text: string }
> = {
  explorer: { border: 'border-sky-200/70', bg: 'bg-sky-50/70', text: 'text-sky-950' },
  collector: { border: 'border-indigo-200/70', bg: 'bg-indigo-50/70', text: 'text-indigo-950' },
  enthusiast: { border: 'border-rose-200/70', bg: 'bg-rose-50/70', text: 'text-rose-950' },
  adventurer: { border: 'border-amber-200/70', bg: 'bg-amber-50/70', text: 'text-amber-950' },
  connoisseur: { border: 'border-teal-200/70', bg: 'bg-teal-50/70', text: 'text-teal-950' },
  connoisseurArt: { border: 'border-fuchsia-200/70', bg: 'bg-fuchsia-50/70', text: 'text-fuchsia-950' },
  enjoyer: { border: 'border-lime-200/70', bg: 'bg-lime-50/70', text: 'text-lime-950' },
  foodLover: { border: 'border-orange-200/70', bg: 'bg-orange-50/70', text: 'text-orange-950' },
};

function categoryToSellerRole(category: unknown): ProfileV2SellerRole | null {
  const s = String(category ?? '').toUpperCase();
  if (s === 'CHEFF' || s === 'CHEF') return 'chef';
  if (s === 'GROWN' || s === 'GARDEN') return 'garden';
  if (s === 'DESIGNER' || s === 'DESIGN') return 'designer';
  return null;
}

type ItemLike = { category?: unknown; status?: unknown; isActive?: unknown };

/** Count published/active items per seller vertical when category data is on the user payload. */
export function countItemsBySellerRole(user: ProfileV2User): Partial<Record<ProfileV2SellerRole, number>> {
  const counts: Partial<Record<ProfileV2SellerRole, number>> = {};

  const dishes = (user.Dish ?? user.dish ?? []) as ItemLike[];
  for (const dish of dishes) {
    const status = String(dish.status ?? '').toUpperCase();
    if (status && status !== 'PUBLISHED') continue;
    const role = categoryToSellerRole(dish.category);
    if (role) counts[role] = (counts[role] ?? 0) + 1;
  }

  const products = (user.SellerProfile?.products ?? []) as ItemLike[];
  for (const product of products) {
    if (product.isActive === false) continue;
    const role = categoryToSellerRole(product.category);
    if (role) counts[role] = (counts[role] ?? 0) + 1;
  }

  return counts;
}

export function resolveSellerRoleProductCount(
  role: ProfileV2SellerRole,
  user: ProfileV2User,
  stats: ProfileV2Stats | null,
): number | null {
  const fromItems = countItemsBySellerRole(user)[role];
  if (typeof fromItems === 'number') return fromItems;

  const roles = user.sellerRoles ?? [];
  if (stats && roles.length === 1 && roles[0] === role && typeof stats.products === 'number') {
    return stats.products;
  }

  return null;
}

export function isEmailVerified(user: ProfileV2User): boolean {
  const v = user.emailVerified;
  if (!v) return false;
  if (v instanceof Date) return !Number.isNaN(v.getTime());
  const d = new Date(String(v));
  return !Number.isNaN(d.getTime());
}

const INTEREST_LABEL_KEYS: Record<string, string> = {
  chef: 'profileV2.roles.interests.chef',
  cheff: 'profileV2.roles.interests.chef',
  cooking: 'profileV2.roles.interests.chef',
  koken: 'profileV2.roles.interests.chef',
  garden: 'profileV2.roles.interests.garden',
  gardening: 'profileV2.roles.interests.garden',
  tuinieren: 'profileV2.roles.interests.garden',
  grown: 'profileV2.roles.interests.garden',
  designer: 'profileV2.roles.interests.designer',
  design: 'profileV2.roles.interests.designer',
  creative: 'profileV2.roles.interests.designer',
  creatief: 'profileV2.roles.interests.designer',
  liefhebber: 'profileV2.roles.interests.enthusiast',
  enthusiast: 'profileV2.roles.interests.enthusiast',
  delivery: 'profileV2.roles.interests.delivery',
  bezorging: 'profileV2.roles.interests.delivery',
  help: 'profileV2.roles.interests.help',
  hulp: 'profileV2.roles.interests.help',
};

export function interestLabelKey(interest: string): string | null {
  return INTEREST_LABEL_KEYS[interest.toLowerCase()] ?? null;
}

export function profileHasRoleContent(user: ProfileV2User, viewerIsOwner: boolean): boolean {
  const buyer = (user.buyerRoles?.length ?? 0) > 0;
  const seller = (user.sellerRoles?.length ?? 0) > 0;
  const interests = viewerIsOwner && (user.interests?.length ?? 0) > 0;
  return buyer || seller || Boolean(interests);
}
