/**
 * SP.2D-C7 — Security response headers only (no rate-limit timers).
 * Edge middleware imports this instead of `@/lib/security` to avoid
 * module-level `setInterval` and unrelated rate-limit state on every request.
 */

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy':
      "default-src 'self'; frame-src 'self' https://challenges.cloudflare.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://maps.googleapis.com https://*.gstatic.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.gstatic.com; img-src 'self' data: https: blob: https://maps.gstatic.com https://maps.googleapis.com; media-src 'self' blob: data: https: http:; connect-src 'self' blob: https: wss: http: https://*.pusher.com wss://*.pusher.com https://sockjs-eu.pusher.com wss://ws-eu.pusher.com https://maps.googleapis.com https://*.vercel-storage.com; font-src 'self' data: https://fonts.gstatic.com;",
  };
}
