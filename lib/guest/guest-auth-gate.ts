import type {
  GuestBottomNavPanelId,
  GuestExplanationNamespace,
  GuestSalesPanelId,
} from '@/lib/guest/guest-explanation-panels';

/** Actions that require an account — open guest explanation panel instead of navigating. */
export type GuestAuthActionType =
  | 'messages'
  | 'profile'
  | 'settings'
  | 'reputation'
  | 'create'
  | 'share'
  | 'dashboard'
  | 'discover';

export type GuestAuthPanelTarget = {
  namespace: GuestExplanationNamespace;
  panel: GuestBottomNavPanelId | GuestSalesPanelId;
};

/** Map gated action → explanation panel copy (i18n keys under namespace.panel). */
export function guestAuthActionToPanel(action: GuestAuthActionType): GuestAuthPanelTarget {
  switch (action) {
    case 'messages':
      return { namespace: 'guestBottomNav', panel: 'messages' };
    case 'profile':
    case 'settings':
      return { namespace: 'guestBottomNav', panel: 'profile' };
    case 'reputation':
      return { namespace: 'guestBottomNav', panel: 'reputation' };
    case 'create':
    case 'share':
      return { namespace: 'guestBottomNav', panel: 'create' };
    case 'dashboard':
      return { namespace: 'guestBottomNav', panel: 'earn' };
    case 'discover':
      return { namespace: 'guestSalesPanels', panel: 'discover' };
    default:
      return { namespace: 'guestBottomNav', panel: 'profile' };
  }
}

/** Routes that require auth — used for guards and returnUrl hints. */
export const GUEST_GATED_ROUTE_PREFIXES = [
  '/messages',
  '/profile',
  '/settings',
  '/mijn-hcp',
  '/verkoper/dashboard',
  '/verdiensten',
  '/sell/new',
  '/delivery/dashboard',
] as const;

export function isGuestGatedRoute(path: string): boolean {
  const p = path.split('?')[0]?.split('#')[0] ?? path;
  return GUEST_GATED_ROUTE_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`)
  );
}
