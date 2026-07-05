/**
 * Unified public item detail view model.
 * Used by inspiration detail, product detail (subset), and future offering types.
 */

import type { OfferingProfileSlug } from '@/lib/create/offering-vertical';

export type PublicItemKind =
  | 'product'
  | 'inspiration'
  | 'chef'
  | 'garden'
  | 'designer'
  | 'service'
  | 'swap'
  | 'request'
  | 'task';

export type PublicItemVisibility = 'private' | 'published';

export type PublicItemOwner = {
  id: string;
  username: string | null;
  displayName: string;
  avatar: string | null;
  location?: string | null;
  roles?: string[];
  hcp?: number;
  fansCount?: number;
  badges?: Array<{ key: string; name: string; icon?: string }>;
  verified?: boolean;
  memberSince?: string | null;
};

export type PublicItemTrust = {
  profileVerified?: boolean;
  workspaceShared?: boolean;
  reviewsCount?: number;
  averageRating?: number | null;
  paymentsViaHomeCheff?: boolean;
};

export type PublicItemActions = {
  canOrder: boolean;
  canMessage: boolean;
  canSave: boolean;
  canShare: boolean;
  canFollow: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSell: boolean;
  canPause: boolean;
};

export type PublicItemMedia = {
  id: string;
  url: string;
  kind: 'image' | 'video';
  thumbnail?: string | null;
  isMain?: boolean;
};

export type PublicItemDetail = {
  id: string;
  kind: PublicItemKind;
  vertical: OfferingProfileSlug | null;
  title: string;
  description: string | null;
  media: PublicItemMedia[];
  priceCents: number | null;
  stock: number | null;
  availability: string | null;
  location: string | null;
  deliveryOptions: string[];
  pickupOptions: string[];
  categoryLabel: string;
  visibility: PublicItemVisibility;
  status: string;
  createdAt: string;
  updatedAt: string;
  owner: PublicItemOwner;
  trust: PublicItemTrust;
  actions: PublicItemActions;
  /** Inspiration-specific story fields */
  ingredients?: string[];
  instructions?: string[];
  tags?: string[];
  prepTime?: number | null;
  servings?: number | null;
  difficulty?: string | null;
};

const CATEGORY_TO_KIND: Record<string, PublicItemKind> = {
  CHEFF: 'chef',
  GROWN: 'garden',
  DESIGNER: 'designer',
};

const CATEGORY_TO_VERTICAL: Record<string, OfferingProfileSlug> = {
  CHEFF: 'chef',
  GROWN: 'garden',
  DESIGNER: 'designer',
};

export function dishCategoryToKind(category: string): PublicItemKind {
  return CATEGORY_TO_KIND[category] ?? 'inspiration';
}

export function dishCategoryToVertical(category: string): OfferingProfileSlug | null {
  return CATEGORY_TO_VERTICAL[category] ?? null;
}

/** Compute visitor/owner action flags for inspiration dishes. */
export function buildInspirationActions(opts: {
  isOwner: boolean;
  isPublished: boolean;
  hasPrice: boolean;
  viewerLoggedIn: boolean;
}): PublicItemActions {
  const { isOwner, isPublished, hasPrice, viewerLoggedIn } = opts;
  return {
    canOrder: !isOwner && isPublished && hasPrice,
    canMessage: !isOwner && isPublished && viewerLoggedIn,
    canSave: !isOwner && isPublished,
    canShare: isPublished,
    canFollow: !isOwner && isPublished && viewerLoggedIn,
    canEdit: isOwner,
    canDelete: isOwner,
    canSell: isOwner && !hasPrice,
    canPause: isOwner,
  };
}

export function buildProductActions(opts: {
  isOwner: boolean;
  isActive: boolean;
  viewerLoggedIn: boolean;
}): PublicItemActions {
  const { isOwner, isActive, viewerLoggedIn } = opts;
  return {
    canOrder: !isOwner && isActive,
    canMessage: !isOwner && isActive && viewerLoggedIn,
    canSave: !isOwner && isActive,
    canShare: isActive,
    canFollow: !isOwner && isActive && viewerLoggedIn,
    canEdit: isOwner,
    canDelete: isOwner,
    canSell: false,
    canPause: isOwner,
  };
}
