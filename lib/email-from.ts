/** Transactionele afzender voor Resend (na verificatie domein in Resend). */

const DEFAULT_FROM = "HomeCheff <no-reply@homecheff.eu>";

const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sommige omgevingen plakken per ongeluk de variabelenaam in de waarde
 * (bijv. `FROM_EMAIL=HomeCheff <noreply@...>`). Strip dat veilig.
 */
function stripEnvKeyArtifact(raw: string): string {
  let v = raw.trim();
  v = v.replace(/^FROM_EMAIL\s*=\s*/i, "");
  v = v.replace(/^RESEND_FROM\s*=\s*/i, "");
  return v.trim();
}

/** Eerste geldige niet-lege waarde: FROM_EMAIL, RESEND_FROM (alias), dan default. */
export function getRawFromEnv(): string {
  const a = process.env.FROM_EMAIL?.trim();
  if (a) {
    const cleaned = stripEnvKeyArtifact(a);
    if (cleaned && validateFromHeader(cleaned)) return cleaned;
  }
  const b = process.env.RESEND_FROM?.trim();
  if (b) {
    const cleaned = stripEnvKeyArtifact(b);
    if (cleaned && validateFromHeader(cleaned)) return cleaned;
  }
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
