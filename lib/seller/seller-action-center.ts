import {
  getAccountRequirements,
  missingRequirementsForAction,
  type AccountRequirementsUserInput,
} from '@/lib/account-requirements';
import {
  resolveSellerPaymentStatus,
  type SellerStripeSnapshot,
} from '@/lib/stripe/seller-payment-status';
import type { ActionCenterEntityHints } from '@/lib/action-center/fetch-action-center-entities';
import { resolveEntityHrefs } from '@/lib/action-center/fetch-action-center-entities';

export type SellerActionSeverity = 'red' | 'orange' | 'green' | 'gray';

export type SellerActionKind = 'link' | 'stripe-onboard';

export type SellerActionItem = {
  id: string;
  severity: SellerActionSeverity;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  actionKind?: SellerActionKind;
};

export type SellerActionCenterInput = {
  user: AccountRequirementsUserInput & { id: string };
  stripeSnapshot: SellerStripeSnapshot;
  blockedProductsCount: number;
  pendingOrdersCount: number;
  /** P1 — optioneel, niet tonen in MVP tenzij > 0 en includeOrange true */
  unreadMessagesCount?: number;
  sellerUnreadOrdersCount?: number;
  includeOrange?: boolean;
  entityHints?: ActionCenterEntityHints;
};

const STRIPE_SETTINGS_HREF = '/settings?tab=payments';
const PROFILE_HREF = '/profile';

function buildStripeActions(
  snapshot: SellerStripeSnapshot,
): SellerActionItem[] {
  const resolution = resolveSellerPaymentStatus(snapshot);

  if (resolution.status === 'NOT_CONNECTED') {
    return [
      {
        id: 'stripe-not-connected',
        severity: 'red',
        title: 'Je kunt nog geen betalingen ontvangen.',
        description: 'Koppel Stripe om producten via HomeCheff te verkopen.',
        actionLabel: 'Stripe koppelen',
        actionHref: STRIPE_SETTINGS_HREF,
        actionKind: 'stripe-onboard',
      },
    ];
  }

  if (!resolution.paymentsReady) {
    return [
      {
        id: 'stripe-onboarding-incomplete',
        severity: 'red',
        title: 'Je betaalinstellingen zijn nog niet afgerond.',
        description: 'Rond Stripe af om betalingen te ontvangen.',
        actionLabel: 'Nu afronden',
        actionHref: STRIPE_SETTINGS_HREF,
        actionKind: 'stripe-onboard',
      },
    ];
  }

  return [];
}

function buildBlockedProductsAction(
  count: number,
  paymentsReady: boolean,
  hints?: ActionCenterEntityHints,
): SellerActionItem | null {
  if (count <= 0) return null;
  const hrefs = resolveEntityHrefs(hints ?? {});
  const productTitle = hints?.firstBlockedProductTitle?.trim();

  if (count === 1 && productTitle) {
    return {
      id: 'products-blocked-payments',
      severity: 'red',
      title: `${productTitle} kan niet verkocht worden.`,
      description: paymentsReady
        ? 'Dit product staat nog niet live in de shop.'
        : 'Betaalinstellingen ontbreken voor dit product.',
      actionLabel: 'Product openen',
      actionHref: hrefs.blockedProductHref,
    };
  }

  const label = count === 1 ? '1 product' : `${count} producten`;
  return {
    id: 'products-blocked-payments',
    severity: 'red',
    title: productTitle
      ? `${productTitle} kan niet verkocht worden.`
      : `${label} ${count === 1 ? 'kan' : 'kunnen'} niet verkocht worden.`,
    description: productTitle
      ? count > 1
        ? `Nog ${count - 1} andere producten wachten ook op actie.`
        : paymentsReady
          ? 'Dit product staat nog niet live in de shop.'
          : 'Betaalinstellingen ontbreken voor dit product.'
      : paymentsReady
        ? 'Deze producten staan nog niet live in de shop.'
        : 'Betaalinstellingen ontbreken voor deze producten.',
    actionLabel: 'Product openen',
    actionHref: hrefs.blockedProductHref,
  };
}

function buildAccountIncompleteAction(
  user: AccountRequirementsUserInput,
): SellerActionItem | null {
  const missing = missingRequirementsForAction('postItem', getAccountRequirements(user).missing);
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

function buildPendingOrdersAction(
  count: number,
  hints?: ActionCenterEntityHints,
): SellerActionItem | null {
  if (count <= 0) return null;
  const hrefs = resolveEntityHrefs(hints ?? {});
  const orderNumber = hints?.firstPendingOrderNumber?.trim();

  if (orderNumber) {
    return {
      id: 'orders-pending',
      severity: 'red',
      title:
        count === 1
          ? `Bestelling #${orderNumber} wacht op je reactie.`
          : `Bestelling #${orderNumber} wacht (+${count - 1} andere).`,
      description: 'Bevestig of verwerk deze bestelling.',
      actionLabel: 'Bestelling openen',
      actionHref: hrefs.pendingOrderHref,
    };
  }

  const label = count === 1 ? '1 bestelling' : `${count} bestellingen`;
  return {
    id: 'orders-pending',
    severity: 'red',
    title: `${label} ${count === 1 ? 'wacht' : 'wachten'} op je reactie.`,
    description: 'Bevestig of verwerk deze bestellingen.',
    actionLabel: 'Bestelling openen',
    actionHref: hrefs.pendingOrderHref,
  };
}

/** P1 — structuur aanwezig, alleen actief als includeOrange en count > 0 */
function buildOrangeActions(input: SellerActionCenterInput): SellerActionItem[] {
  if (!input.includeOrange) return [];

  const items: SellerActionItem[] = [];
  const hints = input.entityHints;
  const hrefs = resolveEntityHrefs(hints ?? {});

  const unreadMessages = input.unreadMessagesCount ?? 0;
  if (unreadMessages > 0) {
    const sender = hints?.firstUnreadConversationSenderName?.trim();
    items.push({
      id: 'messages-unread',
      severity: 'orange',
      title:
        unreadMessages === 1 && sender
          ? `Bericht van ${sender}.`
          : unreadMessages === 1
            ? 'Je hebt 1 ongelezen bericht.'
            : `Je hebt ${unreadMessages} ongelezen berichten.`,
      description: 'Reageer om vertrouwen en omzet te behouden.',
      actionLabel: 'Gesprek openen',
      actionHref: hrefs.messagesHref,
    });
  }

  const sellerOrderNotifs = input.sellerUnreadOrdersCount ?? 0;
  if (sellerOrderNotifs > 0) {
    const orderNumber = hints?.firstSellerOrderNotificationOrderNumber?.trim();
    items.push({
      id: 'orders-notification',
      severity: 'orange',
      title: orderNumber
        ? `Nieuwe bestelling #${orderNumber}.`
        : 'Nieuwe bestelling ontvangen.',
      description: 'Bekijk de details en reageer op tijd.',
      actionLabel: 'Bestelling openen',
      actionHref: hrefs.sellerOrderNotifHref,
    });
  }

  return items;
}

/**
 * Bouw gesorteerde actielijst (ROOD → ORANJE).
 * Geen dubbele Stripe + geblokkeerde-producten als de oorzaak hetzelfde is.
 */
export function buildSellerActionItems(
  input: SellerActionCenterInput,
): SellerActionItem[] {
  const items: SellerActionItem[] = [];
  const stripeActions = buildStripeActions(input.stripeSnapshot);
  items.push(...stripeActions);

  if (input.blockedProductsCount > 0) {
    const stripeId = stripeActions[0]?.id;
    const skipBlocked =
      stripeId === 'stripe-not-connected' ||
      stripeId === 'stripe-onboarding-incomplete';
    if (!skipBlocked) {
      const paymentsReady = resolveSellerPaymentStatus(input.stripeSnapshot).paymentsReady;
      const blocked = buildBlockedProductsAction(
        input.blockedProductsCount,
        paymentsReady,
        input.entityHints,
      );
      if (blocked) items.push(blocked);
    }
  }

  const accountAction = buildAccountIncompleteAction(input.user);
  if (accountAction) items.push(accountAction);

  const pendingAction = buildPendingOrdersAction(
    input.pendingOrdersCount,
    input.entityHints,
  );
  if (pendingAction) items.push(pendingAction);

  items.push(...buildOrangeActions(input));

  const severityRank: Record<SellerActionSeverity, number> = {
    red: 0,
    orange: 1,
    green: 2,
    gray: 3,
  };

  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export const SELLER_ACTION_CENTER_MAX_VISIBLE = 5;

export function partitionSellerActionItems(
  items: SellerActionItem[],
  maxVisible: number = SELLER_ACTION_CENTER_MAX_VISIBLE,
): {
  visible: SellerActionItem[];
  hidden: SellerActionItem[];
  hasMore: boolean;
} {
  const visible = items.slice(0, maxVisible);
  const hidden = items.slice(maxVisible);
  return {
    visible,
    hidden,
    hasMore: hidden.length > 0,
  };
}
