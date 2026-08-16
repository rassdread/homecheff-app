/**
 * SP.2D-C6 — Resolve central user id for SSO start without full session hydrate.
 *
 * `auth()` / getServerSession runs the session callback which loads marketplace
 * profile/roles (DeliveryProfile, affiliate, sellerRoles, …). Silent authorize
 * only needs the JWT `id` claim; account freshness is checked in authorize via
 * a narrow User select.
 */

import { getToken } from "next-auth/jwt";
import { NEXTAUTH_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie-name";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveCentralUserIdFromRequest(
  req: Request,
): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) return null;

  const token = await getToken({
    req: req as Parameters<typeof getToken>[0]["req"],
    secret,
    cookieName: NEXTAUTH_SESSION_COOKIE_NAME,
  });

  const id = token?.id ? String(token.id).trim() : "";
  if (!id || !UUID_RE.test(id)) return null;
  return id;
}
