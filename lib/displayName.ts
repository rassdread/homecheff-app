/**
 * Publieke weergavenaam op basis van gebruikersvoorkeur (profielinstellingen).
 * Één centrale helper voor UI + server payloads — geen losse first+last combinaties.
 */

import { normalizePersonNameDisplay } from '@/lib/person-name';

/** Laatste fallback als er geen voorkeur-/gebruikersnaam-/naamdata is. */
export const PUBLIC_DISPLAY_FALLBACK = 'HomeCheff gebruiker';

export interface User {
  id?: string | null;
  name?: string | null;
  username?: string | null;
  displayFullName?: boolean | null;
  displayNameOption?: string | null;
  sellerProfileId?: string | null;
}

function trimStr(s: string | null | undefined): string {
  return (s ?? '').trim();
}

/**
 * Zichtbare naam voor chat, kaarten, ranglijsten, enz.
 * Volgorde: voorkeur → username → genormaliseerde volledige naam → {@link PUBLIC_DISPLAY_FALLBACK}
 */
export function getDisplayName(user: User | null | undefined): string {
  if (!user) return PUBLIC_DISPLAY_FALLBACK;

  const username = trimStr(user.username) || null;
  const fullName = normalizePersonNameDisplay(user.name);

  // Legacy: geen echte naam tonen — alleen @-naam of fallback
  if (user.displayFullName === false) {
    return username || PUBLIC_DISPLAY_FALLBACK;
  }

  const opt = (user.displayNameOption || 'full').toLowerCase();

  if (opt === 'none') {
    return PUBLIC_DISPLAY_FALLBACK;
  }

  if (opt === 'username' && username) {
    return username;
  }

  if (opt === 'first' && fullName) {
    const first = fullName.split(/\s+/).filter(Boolean)[0];
    if (first) return first;
  }

  if (opt === 'last' && fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }

  if (fullName) return fullName;
  if (username) return username;
  return PUBLIC_DISPLAY_FALLBACK;
}

/** Alias: zelfde logica als {@link getDisplayName} (publieke context). */
export function getPublicDisplayName(user: User | null | undefined): string {
  return getDisplayName(user);
}

/**
 * Mag de naam als link naar het profiel? (Verborgen / geen naam-optie → niet klikbaar als persoon.)
 */
export function isNameClickable(user: User | null | undefined): boolean {
  if (!user) return false;

  if (user.displayFullName === false) return false;
  if ((user.displayNameOption || '').toLowerCase() === 'none') return false;

  return true;
}
