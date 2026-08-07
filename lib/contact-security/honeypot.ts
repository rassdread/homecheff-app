/** Honeypot field name — must stay empty for humans. */
export const CONTACT_HONEYPOT_FIELD = 'company_website';

export function checkHoneypot(raw: unknown): {
  ok: true;
} | { ok: false; reason: 'HONEYPOT_TRIGGERED' } {
  if (raw == null || raw === '') return { ok: true };
  if (typeof raw === 'string' && raw.trim() === '') return { ok: true };
  return { ok: false, reason: 'HONEYPOT_TRIGGERED' };
}
