/**
 * U5/U6 — SSO authorize must bind the browser's existing hc_eco_epoch.
 *
 * If /auth/sso/start mints a *new* epoch in the authorization code while the
 * browser still holds a different parent-domain cookie (from Marketplace login),
 * Growth/Studio bind the product session to the code epoch, then fail
 * checkProductEpochBinding → clear session → silent SSO → infinite redirect.
 */

import {
  HC_ECO_EPOCH_LOGGED_OUT,
  newEcosystemEpoch,
  readEcosystemEpochFromCookieHeader,
} from "@/lib/ecosystem-session/epoch";

export type AuthorizeEpochResolution = {
  ecoEpoch: string;
  /** True when we minted a new epoch — redirect must Set-Cookie it. */
  shouldSetCookie: boolean;
};

export function resolveAuthorizeEcoEpoch(
  cookieHeader: string | null | undefined,
): AuthorizeEpochResolution {
  const existing = readEcosystemEpochFromCookieHeader(cookieHeader ?? null);
  if (existing && existing !== HC_ECO_EPOCH_LOGGED_OUT) {
    return { ecoEpoch: existing, shouldSetCookie: false };
  }
  return { ecoEpoch: newEcosystemEpoch(), shouldSetCookie: true };
}
