/** Transactionele afzender voor Resend (na verificatie domein in Resend). */

const DEFAULT_FROM = "HomeCheff <noreply@homecheff.eu>";

const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Eerste niet-lege waarde: FROM_EMAIL, RESEND_FROM (alias), dan default. */
export function getRawFromEnv(): string {
  const a = process.env.FROM_EMAIL?.trim();
  if (a) return a;
  const b = process.env.RESEND_FROM?.trim();
  if (b) return b;
  return DEFAULT_FROM;
}

/**
 * Valideert Resend "from": plain email of `Display Name <addr@domain>`.
 * Returns false voor lege local-part, ontbrekende hoekhaken, of ongeldig adres.
 */
export function validateFromHeader(from: string): boolean {
  const f = from.trim();
  if (!f) return false;
  const angle = f.match(/^(.+)<([^>]+)>\s*$/);
  if (angle) {
    const addr = angle[2].trim();
    return SIMPLE_EMAIL_RE.test(addr);
  }
  return SIMPLE_EMAIL_RE.test(f);
}

export function getTransactionalFrom(): string {
  return getRawFromEnv();
}
