/**
 * Single source of truth for the NextAuth session cookie name used by HomeCheff.
 *
 * Intentionally NOT `__Secure-next-auth.session-token`: native Android session minting,
 * force-logout, and session-mode all read/write this exact name. Middleware getToken
 * must pass the same name or it will look for the default secure-prefixed cookie and miss.
 */
export const NEXTAUTH_SESSION_COOKIE_NAME = 'next-auth.session-token';
