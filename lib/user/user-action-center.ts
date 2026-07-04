import {
  getAccountRequirements,
  missingRequirementsForAction,
  type AccountRequirementsUserInput,
} from '@/lib/account-requirements';
import {
  buildSellerActionItems,
  partitionSellerActionItems,
  type SellerActionItem,
  type SellerActionSeverity,
} from '@/lib/seller/seller-action-center';
import type { SellerStripeSnapshot } from '@/lib/stripe/seller-payment-status';
import {
  notificationVisibleToSellerAndBuyer,
  resolveNotificationTargetUrl,
} from '@/lib/notifications/notificationRouting';
import { prismaTypeString } from '@/lib/notifications/mapNotificationForApi';
import type { ActionCenterEntityHints } from '@/lib/action-center/fetch-action-center-entities';
import { resolveEntityHrefs } from '@/lib/action-center/fetch-action-center-entities';
import type { PendingClientReward } from '@/lib/gamification/gamification-me-types';

export type UserActionItem = SellerActionItem;
export type UserActionSeverity = SellerActionSeverity;
export type UserActionCenterVariant = 'dashboard' | 'sidebar' | 'mobileCompact';

export type UserRoles = {
  hasSellerProfile: boolean;
  hasDeliveryProfile: boolean;
  hasAffiliate: boolean;
};

export type UnreadNotificationHint = {
  id: string;
  prismaType: string;
  payload: Record<string, unknown>;
  orderId: string | null;
};

export type UserActionCenterInput = {
  user: AccountRequirementsUserInput & {
    id: string;
    name?: string | null;
    image?: string | null;
    place?: string | null;
    lat?: number | null;
    lng?: number | null;
    hcpWelcomeSeenAt?: Date | null;
  };
  roles: UserRoles;
  stripeSnapshot: SellerStripeSnapshot;
  blockedProductsCount: number;
  pendingSellerOrdersCount: number;
  unreadMessagesCount: number;
  buyerOrderUpdatesCount: number;
  sellerOrderNotificationsCount: number;
  unreadNotifications: UnreadNotificationHint[];
  deliveryProfile?: {
    id: string;
    isVerified: boolean;
  } | null;
  activeDeliveryCount: number;
  affiliate?: {
    status: string;
    availableCents: number;
    recentSubAffiliateCount: number;
  } | null;
  pendingHcpRewards: PendingClientReward[];
  entityHints?: ActionCenterEntityHints;
};

const ORDERS_HREF = '/orders';
const PROFILE_HREF = '/profile';
const NOTIFICATIONS_HREF = '/notifications';
const HCP_HREF = '/mijn-hcp';
const DELIVERY_HREF = '/delivery/dashboard';
const AFFILIATE_HREF = '/affiliate/dashboard';

const AFFILIATE_MIN_PAYOUT_CENTS = 1000;

function severityRank(severity: UserActionSeverity): number {
  const ranks: Record<UserActionSeverity, number> = {
    red: 0,
    orange: 1,
    green: 2,
    gray: 3,
  };
  return ranks[severity];
}

function dedupeAndSort(items: UserActionItem[]): UserActionItem[] {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

function buildMessagesAction(
  count: number,
  hints?: ActionCenterEntityHints,
): UserActionItem | null {
  if (count <= 0) return null;
  const hrefs = resolveEntityHrefs(hints ?? {});
  const sender = hints?.firstUnreadConversationSenderName?.trim();
  return {
    id: 'messages-unread',
    severity: 'orange',
    title:
      count === 1 && sender
        ? `Bericht van ${sender}.`
        : count === 1
          ? 'Je hebt 1 ongelezen bericht.'
          : `Je hebt ${count} ongelezen berichten.`,
    description: 'Reageer om contact en vertrouwen te behouden.',
    actionLabel: 'Gesprek openen',
    actionHref: hrefs.messagesHref,
  };
}

function buildBuyerOrderUpdateAction(count: number): UserActionItem | null {
  if (count <= 0) return null;
  return {
    id: 'orders-buyer-update',
    severity: 'orange',
    title:
      count === 1
        ? 'Je hebt 1 bestellingupdate.'
        : `Je hebt ${count} bestellingupdates.`,
    description: 'Bekijk de status van je bestelling.',
    actionLabel: 'Bekijk bestellingen',
    actionHref: ORDERS_HREF,
  };
}

function buildAccountIncompleteAction(
  user: AccountRequirementsUserInput,
): UserActionItem | null {
  const missing = missingRequirementsForAction(
    'postItem',
    getAccountRequirements(user).missing,
  );
  if (missing.length === 0) return null;

  return {
    id: 'account-incomplete',
    severity: 'red',
    title: 'Je account is nog niet compleet.',
    description: 'Voltooi je account om HomeCheff volledig te gebruiken.',
    actionLabel: 'Account afronden',
    actionHref: missing[0]?.actionHref ?? PROFILE_HREF,
  };
}

function buildProfileIncompleteAction(
  user: UserActionCenterInput['user'],
): UserActionItem | null {
  const hasName = Boolean(user.name?.trim());
  const hasImage = Boolean(user.image?.trim());
  const hasPlace =
    Boolean(user.place?.trim()) ||
    (user.lat != null &&
      user.lng != null &&
      Number.isFinite(Number(user.lat)) &&
      Number.isFinite(Number(user.lng)));

  if (hasName && hasImage && hasPlace) return null;

  return {
    id: 'profile-incomplete',
    severity: 'orange',
    title: 'Maak je profiel completer.',
    description: 'Voeg naam, foto of locatie toe om beter zichtbaar te zijn.',
    actionLabel: 'Profiel aanvullen',
    actionHref: PROFILE_HREF,
  };
}

function buildHcpWelcomeAction(
  hcpWelcomeSeenAt: Date | null | undefined,
): UserActionItem | null {
  if (hcpWelcomeSeenAt != null) return null;
  return {
    id: 'hcp-welcome',
    severity: 'green',
    title: 'Ontdek je HomeCheff Punten.',
    description: 'Bekijk hoe je reputatie en badges werken.',
    actionLabel: 'Bekijk HCP',
    actionHref: HCP_HREF,
  };
}

function buildHcpRewardAction(rewards: PendingClientReward[]): UserActionItem | null {
  if (rewards.length === 0) return null;
  const first = rewards[0];
  return {
    id: 'hcp-reward-pending',
    severity: 'green',
    title: first.title,
    description: first.subtitle || 'Je hebt een nieuwe HCP-beloning.',
    actionLabel: 'Bekijk beloning',
    actionHref: HCP_HREF,
  };
}

function isDeliveryNotification(prismaType: string, payload: Record<string, unknown>): boolean {
  const typeUpper = prismaType.toUpperCase();
  const data = (payload.data as Record<string, unknown> | undefined) || {};
  const dataType = String(data.type || payload.type || '').toUpperCase();
  if (typeUpper === 'ORDER_UPDATE' || typeUpper === 'ORDER_RECEIVED') {
    return dataType.startsWith('DELIVERY_');
  }
  return false;
}

function buildDeliveryActions(input: UserActionCenterInput): UserActionItem[] {
  if (!input.roles.hasDeliveryProfile || !input.deliveryProfile) return [];

  const items: UserActionItem[] = [];

  if (!input.deliveryProfile.isVerified) {
    items.push({
      id: 'delivery-verification',
      severity: 'orange',
      title: 'Je bezorgerprofiel is nog niet geverifieerd.',
      description: 'Rond verificatie af om opdrachten te kunnen doen.',
      actionLabel: 'Profiel openen',
      actionHref: DELIVERY_HREF,
    });
  }

  const deliveryNotifs = input.unreadNotifications.filter((n) =>
    isDeliveryNotification(n.prismaType, n.payload),
  );

  const availableNotifs = deliveryNotifs.filter((n) => {
    const data = (n.payload.data as Record<string, unknown> | undefined) || {};
    const dataType = String(data.type || n.payload.type || '').toUpperCase();
    return dataType === 'DELIVERY_ORDER_AVAILABLE';
  });

  if (availableNotifs.length > 0) {
    const count = availableNotifs.length;
    items.push({
      id: 'delivery-available',
      severity: 'orange',
      title:
        count === 1
          ? 'Nieuwe bezorgaanvraag beschikbaar.'
          : `${count} nieuwe bezorgaanvragen beschikbaar.`,
      description: 'Accepteer een opdracht om te verdienen.',
      actionLabel: 'Bekijk opdrachten',
      actionHref: DELIVERY_HREF,
    });
  }

  if (input.activeDeliveryCount > 0) {
    const count = input.activeDeliveryCount;
    items.push({
      id: 'delivery-active',
      severity: 'red',
      title:
        count === 1
          ? 'Je hebt 1 openstaande bezorgrit.'
          : `Je hebt ${count} openstaande bezorgritten.`,
      description: 'Rond je actieve bezorging af of werk de status bij.',
      actionLabel: 'Open dashboard',
      actionHref: DELIVERY_HREF,
    });
  }

  return items;
}

function buildAffiliateActions(input: UserActionCenterInput): UserActionItem[] {
  if (!input.roles.hasAffiliate || !input.affiliate) return [];

  const items: UserActionItem[] = [];
  const { affiliate } = input;

  if (affiliate.status === 'SUSPENDED') {
    items.push({
      id: 'affiliate-suspended',
      severity: 'red',
      title: 'Je affiliate-account is opgeschort.',
      description: 'Neem contact op of bekijk je affiliate-dashboard.',
      actionLabel: 'Open dashboard',
      actionHref: AFFILIATE_HREF,
    });
  }

  if (affiliate.availableCents >= AFFILIATE_MIN_PAYOUT_CENTS) {
    items.push({
      id: 'affiliate-payout-available',
      severity: 'orange',
      title: 'Uitbetaling beschikbaar in je affiliate-dashboard.',
      description: 'Je hebt commissie klaarstaan om uit te betalen.',
      actionLabel: 'Bekijk uitbetaling',
      actionHref: AFFILIATE_HREF,
    });
  }

  if (affiliate.recentSubAffiliateCount > 0) {
    const count = affiliate.recentSubAffiliateCount;
    items.push({
      id: 'affiliate-new-sub',
      severity: 'green',
      title:
        count === 1
          ? 'Nieuwe sub-affiliate aangesloten.'
          : `${count} nieuwe sub-affiliates aangesloten.`,
      description: 'Bekijk je netwerk en commissies.',
      actionLabel: 'Open dashboard',
      actionHref: AFFILIATE_HREF,
    });
  }

  return items;
}

function buildNotificationActions(
  notifications: UnreadNotificationHint[],
  isSeller: boolean,
): UserActionItem[] {
  const items: UserActionItem[] = [];

  const visible = notifications.filter((n) =>
    notificationVisibleToSellerAndBuyer(n.prismaType, n.payload, isSeller),
  );

  const reviewCount = visible.filter(
    (n) => prismaTypeString(n.prismaType).toUpperCase() === 'REVIEW_RECEIVED',
  ).length;
  if (reviewCount > 0) {
    items.push({
      id: 'review-received',
      severity: 'green',
      title:
        reviewCount === 1
          ? 'Je hebt een nieuwe review ontvangen.'
          : `Je hebt ${reviewCount} nieuwe reviews ontvangen.`,
      description: 'Bekijk wat anderen over je werk zeggen.',
      actionLabel: 'Bekijk review',
      actionHref: NOTIFICATIONS_HREF,
    });
  }

  const reputationCount = visible.filter((n) => {
    const t = prismaTypeString(n.prismaType).toUpperCase();
    return t === 'PROP_RECEIVED' || t === 'FAN_REQUEST' || t === 'FOLLOW_RECEIVED';
  }).length;
  if (reputationCount > 0) {
    items.push({
      id: 'reputation-update',
      severity: 'green',
      title:
        reputationCount === 1
          ? 'Nieuwe reputatie-activiteit.'
          : `${reputationCount} nieuwe reputatie-updates.`,
      description: 'Fans, props of volgers wachten op je aandacht.',
      actionLabel: 'Bekijk meldingen',
      actionHref: NOTIFICATIONS_HREF,
    });
  }

  const writeReview = visible.find((n) => {
    const data = (n.payload.data as Record<string, unknown> | undefined) || {};
    const actions = data.actions as Array<{ action?: string }> | undefined;
    return actions?.some((a) => a.action === 'WRITE_REVIEW');
  });
  if (writeReview) {
    const link =
      resolveNotificationTargetUrl(writeReview.prismaType, writeReview.payload) ||
      ORDERS_HREF;
    items.push({
      id: 'review-requested',
      severity: 'orange',
      title: 'Schrijf een review over je bestelling.',
      description: 'Deel je ervaring met de maker.',
      actionLabel: 'Review schrijven',
      actionHref: link,
    });
  }

  return items;
}

/**
 * Universele actielijst voor homepage (alle rollen).
 * Seller-specifieke P0/P1 acties komen uit buildSellerActionItems als subset.
 */
export function buildUserActionItems(input: UserActionCenterInput): UserActionItem[] {
  const items: UserActionItem[] = [];

  if (input.roles.hasSellerProfile) {
    items.push(
      ...buildSellerActionItems({
        user: input.user,
        stripeSnapshot: input.stripeSnapshot,
        blockedProductsCount: input.blockedProductsCount,
        pendingOrdersCount: input.pendingSellerOrdersCount,
        unreadMessagesCount: input.unreadMessagesCount,
        sellerUnreadOrdersCount: input.sellerOrderNotificationsCount,
        includeOrange: true,
        entityHints: input.entityHints,
      }),
    );
  } else {
    const account = buildAccountIncompleteAction(input.user);
    if (account) items.push(account);
  }

  const messages = buildMessagesAction(
    input.unreadMessagesCount,
    input.entityHints,
  );
  if (messages && !items.some((i) => i.id === 'messages-unread')) {
    items.push(messages);
  }

  const buyerOrders = buildBuyerOrderUpdateAction(input.buyerOrderUpdatesCount);
  if (buyerOrders) items.push(buyerOrders);

  items.push(...buildDeliveryActions(input));
  items.push(...buildAffiliateActions(input));
  items.push(
    ...buildNotificationActions(
      input.unreadNotifications,
      input.roles.hasSellerProfile,
    ),
  );

  const profile = buildProfileIncompleteAction(input.user);
  if (profile && !items.some((i) => i.id === 'account-incomplete')) {
    items.push(profile);
  }

  const hcpWelcome = buildHcpWelcomeAction(input.user.hcpWelcomeSeenAt);
  if (hcpWelcome) items.push(hcpWelcome);

  const hcpReward = buildHcpRewardAction(input.pendingHcpRewards);
  if (hcpReward) items.push(hcpReward);

  return dedupeAndSort(items);
}

export const USER_ACTION_CENTER_MAX_VISIBLE = 5;

export { partitionSellerActionItems as partitionUserActionItems };
