/**
 * SSO tussen *.homecheff.eu (bijv. growth.homecheff.eu en homecheff.eu):
 * zelfde JWT + zelfde session-cookie domain.
 *
 * - Lokaal / preview (*.vercel.app): geen domain → host-only cookie.
 * - Productie op homecheff.eu-boom: standaard `.homecheff.eu`.
 *
 * Override: NEXTAUTH_COOKIE_DOMAIN=.homecheff.eu | none | false
 *
 * @deprecated Prefer getAuthSessionCookieDomain from ./auth-origin — kept for importers.
 */
import { getAuthSessionCookieDomain } from './auth-origin';

export function getNextAuthSharedCookieDomain(): string | undefined {
  return getAuthSessionCookieDomain();
}
