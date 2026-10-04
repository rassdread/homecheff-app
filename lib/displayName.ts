/**
 * Publieke weergavenaam op basis van gebruikersvoorkeur (profielinstellingen).
 * Één centrale helper voor UI + server payloads — geen losse first+last combinaties.
 *
 * Ontbrekende gegevens vallen terug naar minder herleidbare identiteit, nooit naar meer.
 */

import { normalizePersonNameDisplay } from '@/lib/person-name';
import { usernameContainsTempPlaceholder } from '@/lib/username-placeholder';

/** Laatste fallback als er geen veilige publieke identiteit is. */
export const PUBLIC_DISPLAY_FALLBACK = 'HomeCheff gebruiker';
export const PUBLIC_DISPLAY_FALLBACK_EN = 'HomeCheff user';

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

export function publicDisplayFallback(language?: string | null): string {
  return language === 'en' ? PUBLIC_DISPLAY_FALLBACK_EN : PUBLIC_DISPLAY_FALLBACK;
}

function isFallbackLabel(value: string): boolean {
  return value === PUBLIC_DISPLAY_FALLBACK || value === PUBLIC_DISPLAY_FALLBACK_EN;
}

/** A placeholder such as temp_… is not a public username. */
export function definitivePublicUsername(username: string | null | undefined): string | null {
  const value = trimStr(username);
  if (!value || usernameContainsTempPlaceholder(value)) return null;
  return value;
}

function firstName(fullName: string): string | null {
  const first = fullName.split(/\s+/).filter(Boolean)[0];
  return first || null;
}

function lastName(fullName: string): string | null {
  const parts = fullName.split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1]! : null;
}

/**
 * Zichtbare naam voor kaarten, detail en community.
 * username | first | full. Legacy none toont alleen een username, nooit de echte naam.
 */
export function getDisplayName(user: User | null | undefined, language?: string | null): string {
  const fallback = publicDisplayFallback(language);
  if (!user) return fallback;

  const username = definitivePublicUsername(user.username);
  const fullName = normalizePersonNameDisplay(user.name);
  const opt = (user.displayNameOption || 'full').toLowerCase();

  if (user.displayFullName === false || opt === 'none' || opt === 'username') {
    return username || fallback;
  }

  if (opt === 'first') {
    return (fullName ? firstName(fullName) : null) || username || fallback;
  }

  if (opt === 'last') {
    return (fullName ? lastName(fullName) : null) || username || fallback;
  }

  if (fullName) return fullName;
  return username || fallback;
}

/** Alias: zelfde logica als {@link getDisplayName} (publieke context). */
export function getPublicDisplayName(user: User | null | undefined, language?: string | null): string {
  return getDisplayName(user, language);
}

/** Store a public option. `none` is no longer produced; it becomes username. */
export function normalizeStoredDisplayNameOption(raw: unknown): 'username' | 'first' | 'full' | 'last' {
  const value = String(raw ?? '').trim().toLowerCase();
  if (value === 'first' || value === 'full' || value === 'last' || value === 'username') {
    return value;
  }
  return 'username';
}

/**
 * Mag de naam als link naar het profiel?
 * Alleen wanneer er een herkenbare publieke identiteit is, geen neutrale fallback.
 */
export function isNameClickable(user: User | null | undefined): boolean {
  if (!user) return false;
  return !isFallbackLabel(getDisplayName(user));
}
