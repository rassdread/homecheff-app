import type { SettingsHubContext } from '@/lib/settings/settings-hub';
import type { UserActionItem } from '@/lib/user/user-action-center';

/**
 * Insights and optional profile polish. They stay out of the Today queue
 * so a real message, proposal, order, or delivery is not pushed down.
 */
const DEFERRED_TODAY_IDS = new Set([
  'profile-incomplete',
  'hcp-welcome',
  'hcp-reward-pending',
  'reputation-update',
  'review-received',
  'affiliate-new-sub',
]);

export function selectTodayActionItems(
  items: readonly UserActionItem[],
): UserActionItem[] {
  return items.filter((item) => {
    if (DEFERRED_TODAY_IDS.has(item.id)) return false;
    return item.severity === 'red' || item.severity === 'orange';
  });
}

export type TodayEmptyNextAction = {
  id: string;
  href: string;
  labelKey: string;
  fallbackEn: string;
  fallbackNl: string;
};

function roleNames(ctx: SettingsHubContext): string[] {
  return (ctx.sellerRoles ?? []).map((role) => role.toLowerCase());
}

/**
 * One next step when nothing is waiting.
 * A live listing is not treated as urgent. Opening this does not assign a role.
 */
export function deriveTodayEmptyNextAction(
  ctx: SettingsHubContext | null | undefined,
): TodayEmptyNextAction {
  const roles = roleNames(ctx ?? {});
  const service =
    roles.includes('service') || ctx?.hasActiveServiceOffer === true;
  const product =
    ctx?.hasActiveProductOffer === true ||
    roles.some((role) =>
      ['chef', 'cheff', 'garden', 'grower', 'designer', 'design'].includes(role),
    );
  const coarseSeller = (ctx?.role || '').toUpperCase() === 'SELLER';

  if (service && !product) {
    return {
      id: 'my-services',
      href: '/profile?tab=aanbod',
      labelKey: 'home.presentation.myServices',
      fallbackEn: 'My services',
      fallbackNl: 'Mijn diensten',
    };
  }

  if (product || coarseSeller || service) {
    return {
      id: 'my-offer',
      href: '/profile?tab=aanbod',
      labelKey: 'home.presentation.myOffer',
      fallbackEn: 'My listings',
      fallbackNl: 'Mijn aanbod',
    };
  }

  if (ctx?.hasAffiliate) {
    return {
      id: 'share-link',
      href: '/affiliate',
      labelKey: 'home.presentation.myLink',
      fallbackEn: 'My link',
      fallbackNl: 'Mijn link',
    };
  }

  if (ctx?.hasDeliveryProfile || (ctx?.role || '').toUpperCase() === 'DELIVERY') {
    return {
      id: 'deliveries',
      href: '/delivery',
      labelKey: 'home.presentation.deliveries',
      fallbackEn: 'Deliveries',
      fallbackNl: 'Leveringen',
    };
  }

  return {
    id: 'marketplace',
    href: '/',
    labelKey: 'operations.today.empty.marketplace',
    fallbackEn: 'Back to the marketplace',
    fallbackNl: 'Terug naar de markt',
  };
}
