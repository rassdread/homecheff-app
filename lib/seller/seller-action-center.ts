import {
  getAccountRequirements,
  missingRequirementsForAction,
  type AccountRequirementsUserInput,
} from '@/lib/account-requirements';
import {
  aggregateRequirementNotice,
  localizedRequirementCopy,
  noticesForAccountMissing,
} from '@/lib/account/profile-requirement-notice';
import {
  taskText,
  type ActionTaskLanguage,
} from '@/lib/i18n/action-task-language';
import {
  connectCtaCopy,
  connectCtaModelForStatus,
  shouldEmitStripeOnboardAction,
} from '@/lib/stripe/connect-account-status';
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
  language?: ActionTaskLanguage;
};

const STRIPE_SETTINGS_HREF = '/settings?tab=payments';
const PROFILE_HREF = '/profile';

function buildStripeActions(
  snapshot: SellerStripeSnapshot,
  language: ActionTaskLanguage,
): SellerActionItem[] {
  const resolution = resolveSellerPaymentStatus(snapshot);
  const ui = resolution.connectUiStatus;
  const statusLabel = taskText(language, 'Bekijk status', 'View status');
  const openLabel = taskText(language, 'Betaalaccount openen', 'Open payout account');

  // Prefer live Account Link eligibility when present.
  if (snapshot.canCreateOnboardingLink === false) {
    if (ui === 'PENDING_VERIFICATION' || ui === 'RESTRICTED') {
      const copy = connectCtaCopy(
        connectCtaModelForStatus(
          ui === 'RESTRICTED' ? 'PENDING_VERIFICATION' : ui,
        ),
        language,
      );
      return [
        {
          id: 'stripe-pending-verification',
          severity: 'orange',
          title: copy.title,
          description: copy.body,
          actionLabel: statusLabel,
          actionHref: STRIPE_SETTINGS_HREF,
          actionKind: 'link',
        },
      ];
    }
    return [];
  }

  if (!shouldEmitStripeOnboardAction(ui)) {
    // PENDING_VERIFICATION → informational (non-onboarding) item
    if (ui === 'PENDING_VERIFICATION') {
      const copy = connectCtaCopy(connectCtaModelForStatus(ui), language);
      return [
        {
          id: 'stripe-pending-verification',
          severity: 'orange',
          title: copy.title,
          description: copy.body,
          actionLabel: statusLabel,
          actionHref: STRIPE_SETTINGS_HREF,
          actionKind: 'link',
        },
      ];
    }
    return [];
  }

  const copy = connectCtaCopy(connectCtaModelForStatus(ui), language);
  const id =
    ui === 'NOT_STARTED'
      ? 'stripe-not-connected'
      : ui === 'ACTION_REQUIRED' || ui === 'RESTRICTED'
        ? 'stripe-action-required'
        : 'stripe-onboarding-incomplete';

  return [
    {
      id,
      severity: 'red',
      title: copy.title,
      description: copy.body,
      actionLabel: copy.cta || openLabel,
      actionHref: STRIPE_SETTINGS_HREF,
      actionKind: 'stripe-onboard',
    },
  ];
}

function buildBlockedProductsAction(
  count: number,
  paymentsReady: boolean,
  hints: ActionCenterEntityHints | undefined,
  language: ActionTaskLanguage,
): SellerActionItem | null {
  if (count <= 0) return null;
  const hrefs = resolveEntityHrefs(hints ?? {});
  const productTitle = hints?.firstBlockedProductTitle?.trim();
  const openLabel = taskText(language, 'Product openen', 'Open listing');
  const notLive = taskText(
    language,
    'Dit product staat nog niet live in de shop.',
    'This listing is not live in the shop yet.',
  );
  const missingPay = taskText(
    language,
    'Betaalinstellingen ontbreken voor dit product.',
    'Payout settings are missing for this listing.',
  );
  const cannotSell = (title: string) =>
    taskText(
      language,
      `${title} kan niet verkocht worden.`,
      `${title} cannot be sold.`,
    );

  if (count === 1 && productTitle) {
    return {
      id: 'products-blocked-payments',
      severity: 'red',
      title: cannotSell(productTitle),
      description: paymentsReady ? notLive : missingPay,
      actionLabel: openLabel,
      actionHref: hrefs.blockedProductHref,
    };
  }

  const label = taskText(
    language,
    count === 1 ? '1 product' : `${count} producten`,
    count === 1 ? '1 listing' : `${count} listings`,
  );
  return {
    id: 'products-blocked-payments',
    severity: 'red',
    title: productTitle
      ? cannotSell(productTitle)
      : taskText(
          language,
          `${label} ${count === 1 ? 'kan' : 'kunnen'} niet verkocht worden.`,
          `${label} cannot be sold.`,
        ),
    description: productTitle
      ? count > 1
        ? taskText(
            language,
            `Nog ${count - 1} andere producten wachten ook op actie.`,
            `${count - 1} other listings are also waiting.`,
          )
        : paymentsReady
          ? notLive
          : missingPay
      : paymentsReady
        ? taskText(
            language,
            'Deze producten staan nog niet live in de shop.',
            'These listings are not live in the shop yet.',
          )
        : taskText(
            language,
            'Betaalinstellingen ontbreken voor deze producten.',
            'Payout settings are missing for these listings.',
          ),
    actionLabel: openLabel,
    actionHref: hrefs.blockedProductHref,
  };
}

function buildAccountIncompleteAction(
  user: AccountRequirementsUserInput,
  language: ActionTaskLanguage,
): SellerActionItem | null {
  const missing = missingRequirementsForAction('postItem', getAccountRequirements(user).missing);
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

function buildPendingOrdersAction(
  count: number,
  hints: ActionCenterEntityHints | undefined,
  language: ActionTaskLanguage,
): SellerActionItem | null {
  if (count <= 0) return null;
  const hrefs = resolveEntityHrefs(hints ?? {});
  const orderNumber = hints?.firstPendingOrderNumber?.trim();
  const openLabel = taskText(language, 'Bestelling openen', 'Open order');

  if (orderNumber) {
    return {
      id: 'orders-pending',
      severity: 'red',
      title:
        count === 1
          ? taskText(
              language,
              `Bestelling #${orderNumber} wacht op je reactie.`,
              `Order #${orderNumber} is waiting for you.`,
            )
          : taskText(
              language,
              `Bestelling #${orderNumber} wacht (+${count - 1} andere).`,
              `Order #${orderNumber} is waiting (+${count - 1} more).`,
            ),
      description: taskText(
        language,
        'Bevestig of verwerk deze bestelling.',
        'Confirm or process this order.',
      ),
      actionLabel: openLabel,
      actionHref: hrefs.pendingOrderHref,
    };
  }

  const label = taskText(
    language,
    count === 1 ? '1 bestelling' : `${count} bestellingen`,
    count === 1 ? '1 order' : `${count} orders`,
  );
  return {
    id: 'orders-pending',
    severity: 'red',
    title: taskText(
      language,
      `${label} ${count === 1 ? 'wacht' : 'wachten'} op je reactie.`,
      `${label} ${count === 1 ? 'is' : 'are'} waiting for you.`,
    ),
    description: taskText(
      language,
      'Bevestig of verwerk deze bestellingen.',
      'Confirm or process these orders.',
    ),
    actionLabel: openLabel,
    actionHref: hrefs.pendingOrderHref,
  };
}

/** P1 — structuur aanwezig, alleen actief als includeOrange en count > 0 */
function buildOrangeActions(input: SellerActionCenterInput): SellerActionItem[] {
  if (!input.includeOrange) return [];

  const items: SellerActionItem[] = [];
  const hints = input.entityHints;
  const hrefs = resolveEntityHrefs(hints ?? {});

  const language = input.language === 'en' ? 'en' : 'nl';
  const unreadMessages = input.unreadMessagesCount ?? 0;
  if (unreadMessages > 0) {
    const sender = hints?.firstUnreadConversationSenderName?.trim();
    items.push({
      id: 'messages-unread',
      severity: 'orange',
      title:
        unreadMessages === 1 && sender
          ? taskText(language, `Bericht van ${sender}.`, `Message from ${sender}.`)
          : unreadMessages === 1
            ? taskText(language, 'Je hebt 1 ongelezen bericht.', 'You have 1 unread message.')
            : taskText(
                language,
                `Je hebt ${unreadMessages} ongelezen berichten.`,
                `You have ${unreadMessages} unread messages.`,
              ),
      description: taskText(
        language,
        'Reageer om vertrouwen en omzet te behouden.',
        'Reply to keep the conversation and the sale moving.',
      ),
      actionLabel: taskText(language, 'Gesprek openen', 'Open conversation'),
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
        ? taskText(
            language,
            `Nieuwe bestelling #${orderNumber}.`,
            `New order #${orderNumber}.`,
          )
        : taskText(language, 'Nieuwe bestelling ontvangen.', 'New order received.'),
      description: taskText(
        language,
        'Bekijk de details en reageer op tijd.',
        'Review the details and respond in time.',
      ),
      actionLabel: taskText(language, 'Bestelling openen', 'Open order'),
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
  const language: ActionTaskLanguage = input.language === 'en' ? 'en' : 'nl';
  const stripeActions = buildStripeActions(input.stripeSnapshot, language);
  const payoutBlocksCurrentWork =
    input.blockedProductsCount > 0 || input.pendingOrdersCount > 0;
  if (payoutBlocksCurrentWork) {
    items.push(...stripeActions);
  }

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
        language,
      );
      if (blocked) items.push(blocked);
    }
  }

  const accountAction = buildAccountIncompleteAction(input.user, language);
  if (accountAction) items.push(accountAction);

  const pendingAction = buildPendingOrdersAction(
    input.pendingOrdersCount,
    input.entityHints,
    language,
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
