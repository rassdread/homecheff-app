/**
 * Cross-tab auth identity coordination for Marketplace (homecheff.eu).
 * Ecosystem convention: BroadcastChannel name = `homecheff-{product}-auth`.
 * Never trust channel payload for authorization — always re-fetch server session.
 */

export const MARKETPLACE_AUTH_CHANNEL = "homecheff-marketplace-auth";
export const MARKETPLACE_AUTH_USER_STORAGE_KEY = "hc_marketplace_auth_user_id";

export type MarketplaceAuthChannelMessage =
  | { type: "logout" }
  | { type: "login"; userId: string }
  | { type: "identity"; userId: string | null };

export function postMarketplaceAuthChannel(
  message: MarketplaceAuthChannelMessage,
): void {
  if (typeof window === "undefined") return;
  try {
    const bc = new BroadcastChannel(MARKETPLACE_AUTH_CHANNEL);
    bc.postMessage(message);
    bc.close();
  } catch {
    /* BroadcastChannel unavailable */
  }
}

export function rememberMarketplaceAuthUserId(userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (userId) sessionStorage.setItem(MARKETPLACE_AUTH_USER_STORAGE_KEY, userId);
    else sessionStorage.removeItem(MARKETPLACE_AUTH_USER_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

export function readRememberedMarketplaceAuthUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(MARKETPLACE_AUTH_USER_STORAGE_KEY);
  } catch {
    return null;
  }
}
