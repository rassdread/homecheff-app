import { parseInternalPathFromUnknownInput } from '@/lib/native/safeRoute';

/** Standaard bij openen van een admin-melding in de app. */
const DEFAULT_ROUTE = '/notifications';

/**
 * Alleen interne paden die `safeRoute` toelaat; anders meldingen-inbox.
 */
export function sanitizeAdminBroadcastRoute(input: unknown): string {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return DEFAULT_ROUTE;
  const parsed = parseInternalPathFromUnknownInput(raw);
  return parsed ?? DEFAULT_ROUTE;
}
