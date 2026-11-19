import { parseInternalPathFromUnknownInput } from '@/lib/native/safeRoute';
import { savePendingIntent, type PendingIntentInput } from '@/lib/onboarding/pending-intent';
import { isHomeCheffHttpsUrl } from '@/lib/communication/official-admin-message';

/** Stay inside the app. A HomeCheff https button becomes its internal path. */
export function officialActionHref(action: { url: string }): string {
  if (!isHomeCheffHttpsUrl(action.url)) return action.url;
  try {
    const url = new URL(action.url);
    return parseInternalPathFromUnknownInput(url.pathname) || action.url;
  } catch {
    return action.url;
  }
}

/**
 * The clicked button's own page, kept for a login that page requires.
 * A signed-in recipient does not replace an older stored task.
 */
export function pendingIntentForOfficialDestination(path: string): PendingIntentInput | null {
  const safe = parseInternalPathFromUnknownInput(path);
  if (!safe) return null;
  const bare = safe.replace(/\/+$/, '') || '/';
  if (bare === '/sell/new' || bare.startsWith('/sell/new/')) {
    return { type: 'create_item', mode: 'dorpsplein', returnPath: safe };
  }
  if (bare === '/affiliate' || bare.startsWith('/affiliate/')) {
    return { type: 'join_affiliate', returnPath: safe, persona: 'affiliate' };
  }
  return null;
}

export function rememberOfficialAction(path: string, signedIn: boolean): void {
  if (signedIn) return;
  const intent = pendingIntentForOfficialDestination(path);
  if (!intent) return;
  savePendingIntent(intent);
}
