import {
  getAccountRequirements,
  missingRequirementsForAction,
  type AccountRequirementsUserInput,
} from '@/lib/account-requirements';
import {
  aggregateRequirementNotice,
  localizedRequirementCopy,
  noticesForAccountMissing,
  noticesForDeliveryMissing,
  recommendedProfileNotices,
} from '@/lib/account/profile-requirement-notice';
import {
  taskText,
  type ActionTaskLanguage,
} from '@/lib/i18n/action-task-language';
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
import { mapDeliveryProfileToLane } from '@/lib/account/resolve-account-readiness';
import type { DeliveryProfileCompletionInput } from '@/lib/delivery/delivery-profile-completion';

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
    /** When false, profile exists but activation gate is incomplete. */
    activationComplete?: boolean;
    activationMessage?: string | null;
    /** Optional raw fields for specific missing-requirement copy. */
    pricingEnabled?: boolean;
    providerType?: string;
    isActive?: boolean;
    isOnline?: boolean;
    homeLat?: number | null;
    homeLng?: number | null;
    maxDistance?: number | null;
    nationalCoverage?: boolean | null;
    baseFeeCents?: number | null;
    pricePerKmCents?: number | null;
    minimumFeeCents?: number | null;
    freeDeliveryRadiusKm?: number | null;
    companyDisplayName?: string | null;
    availableDays?: string[] | null;
    availableTimeSlots?: string[] | null;
    workStartTime?: string | null;
    workEndTime?: string | null;
    dateOfBirth?: Date | string | null;
    activationMissing?: string[];
  } | null;
  activeDeliveryCount: number;
  affiliate?: {
    status: string;
    availableCents: number;
    recentSubAffiliateCount: number;
  } | null;
  pendingHcpRewards: PendingClientReward[];
  entityHints?: ActionCenterEntityHints;
  /** Pending proposals created by the other party. Outgoing proposals are not included. */
  incomingProposalsWaitingCount?: number;
  /**
   * Accepted deal where this user still owes the address, the time, or both.
   * One task, even when both pieces are missing.
   */
  postAcceptWaiting?: {
    count: number;
    communityOrderId: string;
    state:
      | 'LOCATION_PENDING'
      | 'SCHEDULE_PENDING'
      | 'LOCATION_AND_SCHEDULE_PENDING';
  } | null;
  language?: ActionTaskLanguage;
};

const ORDERS_HREF = '/orders';
const PROFILE_HREF = '/profile';
const NOTIFICATIONS_HREF = '/notifications';
const HCP_HREF = '/mijn-hcp';
const DELIVERY_HREF = '/delivery';
const DELIVERY_SETTINGS_HREF = '/delivery/settings';
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
  hints: ActionCenterEntityHints | undefined,
  language: ActionTaskLanguage,
): UserActionItem | null {
  if (count <= 0) return null;
  const hrefs = resolveEntityHrefs(hints ?? {});
  const sender = hints?.firstUnreadConversationSenderName?.trim();
  return {
    id: 'messages-unread',
    severity: 'orange',
    title:
      count === 1 && sender
        ? taskText(language, `Bericht van ${sender}.`, `Message from ${sender}.`)
        : count === 1
          ? taskText(language, 'Je hebt 1 ongelezen bericht.', 'You have 1 unread message.')
          : taskText(
              language,
              `Je hebt ${count} ongelezen berichten.`,
              `You have ${count} unread messages.`,
            ),
    description: taskText(
      language,
      'Reageer om contact en vertrouwen te behouden.',
      'Reply to keep the conversation going.',
    ),
    actionLabel: taskText(language, 'Gesprek openen', 'Open conversation'),
    actionHref: hrefs.messagesHref,
  };
}

export function proposalWaitsOnCurrentUser(input: {
  status: string;
  createdById: string;
  sellerId: string;
  buyerId: string;
  userId: string;
}): boolean {
  if (input.status !== 'PENDING') return false;
  if (input.createdById === input.userId) return false;
  return input.sellerId === input.userId || input.buyerId === input.userId;
}

function buildIncomingProposalAction(
  count: number,
  language: ActionTaskLanguage,
): UserActionItem | null {
  if (count <= 0) return null;
  return {
    id: 'proposals-incoming',
    severity: 'orange',
    title:
      count === 1
        ? taskText(
            language,
            'Er wacht een voorstel op je reactie.',
            'A proposal is waiting for your reply.',
          )
        : taskText(
            language,
            `Er wachten ${count} voorstellen op je reactie.`,
            `${count} proposals are waiting for your reply.`,
          ),
    description: taskText(
      language,
      'Bekijk het voorstel en reageer.',
      'Review the proposal and reply.',
    ),
    actionLabel: taskText(language, 'Voorstel bekijken', 'View proposal'),
    actionHref: '/profile/deals',
  };
}

function buildPostAcceptAction(
  waiting: UserActionCenterInput['postAcceptWaiting'],
  language: ActionTaskLanguage,
): UserActionItem | null {
  if (!waiting || waiting.count <= 0 || !waiting.communityOrderId) return null;
  const extra =
    waiting.count > 1
      ? taskText(
          language,
          ` Nog ${waiting.count - 1} andere afspraken missen ook gegevens.`,
          ` ${waiting.count - 1} other appointments are also missing details.`,
        )
      : '';
  const copy =
    waiting.state === 'LOCATION_PENDING'
      ? {
          title: taskText(
            language,
            'Vul het adres in voor je afspraak.',
            'Add the address for your appointment.',
          ),
          description: taskText(
            language,
            'Het voorstel is geaccepteerd. Het adres ontbreekt nog.',
            'The proposal was accepted. The address is still missing.',
          ),
        }
      : waiting.state === 'SCHEDULE_PENDING'
        ? {
            title: taskText(
              language,
              'Plan een tijd voor de geaccepteerde aanvraag.',
              'Choose a time for the accepted request.',
            ),
            description: taskText(
              language,
              'Het voorstel is geaccepteerd. De tijd ontbreekt nog.',
              'The proposal was accepted. The time is still missing.',
            ),
          }
        : {
            title: taskText(
              language,
              'Maak de afspraak compleet.',
              'Finish the appointment details.',
            ),
            description: taskText(
              language,
              'Het voorstel is geaccepteerd. Adres en tijd ontbreken nog.',
              'The proposal was accepted. The address and time are still missing.',
            ),
          };
  return {
    id: 'post-accept-details',
    severity: 'orange',
    title: copy.title,
    description: `${copy.description}${extra}`,
    actionLabel: taskText(language, 'Afspraak afronden', 'Finish appointment'),
    actionHref: `/profile/deals?highlight=${waiting.communityOrderId}`,
  };
}

function buildBuyerOrderUpdateAction(
  count: number,
  language: ActionTaskLanguage,
): UserActionItem | null {
  if (count <= 0) return null;
  return {
    id: 'orders-buyer-update',
    severity: 'orange',
    title:
      count === 1
        ? taskText(language, 'Je hebt 1 bestellingupdate.', 'You have 1 order update.')
        : taskText(
            language,
            `Je hebt ${count} bestellingupdates.`,
            `You have ${count} order updates.`,
          ),
    description: taskText(
      language,
      'Bekijk de status van je bestelling.',
      'Check the status of your order.',
    ),
    actionLabel: taskText(language, 'Bekijk bestellingen', 'View orders'),
    actionHref: ORDERS_HREF,
  };
}

function buildAccountIncompleteAction(
  user: AccountRequirementsUserInput,
  language: ActionTaskLanguage,
): UserActionItem | null {
  const missing = missingRequirementsForAction(
    'postItem',
    getAccountRequirements(user).missing,
  );
  if (missing.length === 0) return null;
  const notice = aggregateRequirementNotice(noticesForAccountMissing(missing), {
    completeCtaNl: 'Account voltooien',
  });
  const copy = localizedRequirementCopy(notice, language);
  if (!notice || !copy) return null;

  return {
    id: 'account-incomplete',
    severity: 'red',
    title: copy.title,
    description: copy.body,
    actionLabel:
      notice.items.length > 1
        ? taskText(language, notice.ctaLabelNl, 'Finish account')
        : copy.cta,
    actionHref: notice.targetRoute,
  };
}

function buildProfileIncompleteAction(
  user: UserActionCenterInput['user'],
  language: ActionTaskLanguage,
): UserActionItem | null {
  const items = recommendedProfileNotices({
    name: user.name,
    image: user.image,
    place: user.place,
    lat: user.lat,
    lng: user.lng,
  });
  const notice = aggregateRequirementNotice(items, {
    completeCtaNl: 'Profiel voltooien',
  });
  const copy = localizedRequirementCopy(notice, language);
  if (!notice || !copy) return null;

  return {
    id: 'profile-incomplete',
    severity: 'orange',
    title: copy.title,
    description: copy.body,
    actionLabel:
      notice.items.length > 1
        ? taskText(language, notice.ctaLabelNl, 'Finish profile')
        : copy.cta,
    actionHref: notice.targetRoute,
  };
}

function buildHcpWelcomeAction(
  hcpWelcomeSeenAt: Date | null | undefined,
  language: ActionTaskLanguage,
): UserActionItem | null {
  if (hcpWelcomeSeenAt != null) return null;
  return {
    id: 'hcp-welcome',
    severity: 'green',
    title: taskText(
      language,
      'Ontdek je HomeCheff Punten.',
      'Discover your HomeCheff Points.',
    ),
    description: taskText(
      language,
      'Bekijk hoe je reputatie en badges werken.',
      'See how your reputation and badges work.',
    ),
    actionLabel: taskText(language, 'Bekijk HCP', 'View HCP'),
    actionHref: HCP_HREF,
  };
}

function buildHcpRewardAction(
  rewards: PendingClientReward[],
  language: ActionTaskLanguage,
): UserActionItem | null {
  if (rewards.length === 0) return null;
  const first = rewards[0];
  return {
    id: 'hcp-reward-pending',
    severity: 'green',
    title: first.title,
    description:
      first.subtitle ||
      taskText(language, 'Je hebt een nieuwe HCP-beloning.', 'You have a new HCP reward.'),
    actionLabel: taskText(language, 'Bekijk beloning', 'View reward'),
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
  const language: ActionTaskLanguage = input.language === 'en' ? 'en' : 'nl';
  if (!input.roles.hasDeliveryProfile || !input.deliveryProfile) return [];

  const items: UserActionItem[] = [];
  const profile = input.deliveryProfile;
  const activationComplete = profile.activationComplete !== false;

  // Incomplete activation (area/pricing/availability) — not Stripe. Canonical editor: /delivery/settings.
  if (!activationComplete) {
    const raw: DeliveryProfileCompletionInput | null =
      profile.providerType != null
        ? {
            providerType: profile.providerType,
            isActive: Boolean(profile.isActive),
            isOnline: Boolean(profile.isOnline),
            homeLat: profile.homeLat ?? null,
            homeLng: profile.homeLng ?? null,
            maxDistance: profile.maxDistance ?? null,
            nationalCoverage: profile.nationalCoverage ?? null,
            pricingEnabled: Boolean(profile.pricingEnabled),
            baseFeeCents: profile.baseFeeCents ?? null,
            pricePerKmCents: profile.pricePerKmCents ?? null,
            minimumFeeCents: profile.minimumFeeCents ?? null,
            freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm ?? null,
            companyDisplayName: profile.companyDisplayName ?? null,
            availableDays: profile.availableDays ?? [],
            availableTimeSlots: profile.availableTimeSlots ?? [],
            workStartTime: profile.workStartTime ?? null,
            workEndTime: profile.workEndTime ?? null,
            isVerified: profile.isVerified,
            dateOfBirth: profile.dateOfBirth ?? null,
          }
        : null;
    const lane = mapDeliveryProfileToLane(raw);
    const fallbackNotice = aggregateRequirementNotice(
      noticesForDeliveryMissing(profile.activationMissing || []),
      { completeCtaNl: 'Bezorggegevens aanvullen' },
    );
    const localized = localizedRequirementCopy(fallbackNotice, language);
    const dutchTitle =
      lane.titleNl ||
      fallbackNotice?.titleNl ||
      'Stel de ontbrekende bezorggegevens in.';
    const dutchBody =
      lane.bodyNl ||
      fallbackNotice?.bodyNl ||
      profile.activationMessage?.trim() ||
      'Vul werkgebied, tijden of tarieven in om bezorgopdrachten te kunnen ontvangen.';
    const dutchCta =
      lane.ctaLabelNl || fallbackNotice?.ctaLabelNl || 'Bezorginstellingen openen';
    items.push({
      id: 'delivery-profile-incomplete',
      severity: 'orange',
      title: taskText(
        language,
        dutchTitle,
        localized?.title || 'Finish the missing delivery details.',
      ),
      description: taskText(
        language,
        dutchBody,
        localized?.body ||
          'Add your service area, hours, or rates so you can receive delivery jobs.',
      ),
      actionLabel: taskText(
        language,
        dutchCta,
        localized?.cta || 'Open delivery settings',
      ),
      actionHref: lane.ctaHref || fallbackNotice?.targetRoute || DELIVERY_SETTINGS_HREF,
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
          ? taskText(
              language,
              'Nieuwe bezorgaanvraag beschikbaar.',
              'A new delivery request is available.',
            )
          : taskText(
              language,
              `${count} nieuwe bezorgaanvragen beschikbaar.`,
              `${count} new delivery requests are available.`,
            ),
      description: taskText(
        language,
        'Accepteer een opdracht om te verdienen.',
        'Accept a job to earn.',
      ),
      actionLabel: taskText(language, 'Bekijk opdrachten', 'View jobs'),
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
          ? taskText(
              language,
              'Je hebt 1 openstaande bezorgrit.',
              'You have 1 delivery in progress.',
            )
          : taskText(
              language,
              `Je hebt ${count} openstaande bezorgritten.`,
              `You have ${count} deliveries in progress.`,
            ),
      description: taskText(
        language,
        'Rond je actieve bezorging af of werk de status bij.',
        'Finish your active delivery or update the status.',
      ),
      actionLabel: taskText(language, 'Open dashboard', 'Open dashboard'),
      actionHref: DELIVERY_HREF,
    });
  }

  return items;
}

function buildAffiliateActions(input: UserActionCenterInput): UserActionItem[] {
  if (!input.roles.hasAffiliate || !input.affiliate) return [];

  const items: UserActionItem[] = [];
  const { affiliate } = input;
  const language: ActionTaskLanguage = input.language === 'en' ? 'en' : 'nl';

  if (affiliate.status === 'SUSPENDED') {
    items.push({
      id: 'affiliate-suspended',
      severity: 'red',
      title: taskText(
        language,
        'Je affiliate-account is opgeschort.',
        'Your affiliate account is suspended.',
      ),
      description: taskText(
        language,
        'Neem contact op of bekijk je affiliate-dashboard.',
        'Get in touch or open your affiliate dashboard.',
      ),
      actionLabel: taskText(language, 'Open dashboard', 'Open dashboard'),
      actionHref: AFFILIATE_HREF,
    });
  }

  if (affiliate.availableCents >= AFFILIATE_MIN_PAYOUT_CENTS) {
    items.push({
      id: 'affiliate-payout-available',
      severity: 'orange',
      title: taskText(
        language,
        'Uitbetaling beschikbaar in je affiliate-dashboard.',
        'A payout is available in your affiliate dashboard.',
      ),
      description: taskText(
        language,
        'Je hebt commissie klaarstaan om uit te betalen.',
        'You have commission ready to pay out.',
      ),
      actionLabel: taskText(language, 'Bekijk uitbetaling', 'View payout'),
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
          ? taskText(language, 'Nieuwe partner in je netwerk.', 'A new partner joined your network.')
          : taskText(
              language,
              `${count} nieuwe partners in je netwerk.`,
              `${count} new partners joined your network.`,
            ),
      description: taskText(
        language,
        'Bekijk je partnernetwerk en verdiensten.',
        'Review your partner network and earnings.',
      ),
      actionLabel: taskText(language, 'Open partners', 'Open partners'),
      actionHref: AFFILIATE_HREF,
    });
  }

  return items;
}

function buildNotificationActions(
  notifications: UnreadNotificationHint[],
  isSeller: boolean,
  language: ActionTaskLanguage,
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
          ? taskText(
              language,
              'Je hebt een nieuwe review ontvangen.',
              'You received a new review.',
            )
          : taskText(
              language,
              `Je hebt ${reviewCount} nieuwe reviews ontvangen.`,
              `You received ${reviewCount} new reviews.`,
            ),
      description: taskText(
        language,
        'Bekijk wat anderen over je werk zeggen.',
        'See what other people say about your work.',
      ),
      actionLabel: taskText(language, 'Bekijk review', 'View review'),
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
          ? taskText(language, 'Nieuwe reputatie-activiteit.', 'New reputation activity.')
          : taskText(
              language,
              `${reputationCount} nieuwe reputatie-updates.`,
              `${reputationCount} new reputation updates.`,
            ),
      description: taskText(
        language,
        'Fans, props of volgers wachten op je aandacht.',
        'Fans, props, or followers are waiting for your attention.',
      ),
      actionLabel: taskText(language, 'Bekijk meldingen', 'View notifications'),
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
      title: taskText(
        language,
        'Schrijf een review over je bestelling.',
        'Write a review about your order.',
      ),
      description: taskText(
        language,
        'Deel je ervaring met de maker.',
        'Share your experience with the maker.',
      ),
      actionLabel: taskText(language, 'Review schrijven', 'Write review'),
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
  const language: ActionTaskLanguage = input.language === 'en' ? 'en' : 'nl';

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
        language,
      }),
    );
  } else {
    const account = buildAccountIncompleteAction(input.user, language);
    if (account) items.push(account);
  }

  const messages = buildMessagesAction(
    input.unreadMessagesCount,
    input.entityHints,
    language,
  );
  if (messages && !items.some((i) => i.id === 'messages-unread')) {
    items.push(messages);
  }

  const buyerOrders = buildBuyerOrderUpdateAction(
    input.buyerOrderUpdatesCount,
    language,
  );
  if (buyerOrders) items.push(buyerOrders);

  const postAccept = buildPostAcceptAction(input.postAcceptWaiting, language);
  if (postAccept) items.push(postAccept);

  const proposals = buildIncomingProposalAction(
    input.incomingProposalsWaitingCount ?? 0,
    language,
  );
  if (proposals) items.push(proposals);

  items.push(...buildDeliveryActions(input));
  items.push(...buildAffiliateActions(input));
  items.push(
    ...buildNotificationActions(
      input.unreadNotifications,
      input.roles.hasSellerProfile,
      language,
    ),
  );

  const profile = buildProfileIncompleteAction(input.user, language);
  if (profile && !items.some((i) => i.id === 'account-incomplete')) {
    items.push(profile);
  }

  const hcpWelcome = buildHcpWelcomeAction(input.user.hcpWelcomeSeenAt, language);
  if (hcpWelcome) items.push(hcpWelcome);

  const hcpReward = buildHcpRewardAction(input.pendingHcpRewards, language);
  if (hcpReward) items.push(hcpReward);

  return dedupeAndSort(items);
}

export const USER_ACTION_CENTER_MAX_VISIBLE = 5;

export { partitionSellerActionItems as partitionUserActionItems };
