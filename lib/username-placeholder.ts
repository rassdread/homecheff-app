/**
 * Tijdelijke Google/social-gebruikersnamen (o.a. temp_…) mogen eenmalig naar een definitieve naam.
 */
export function usernameContainsTempPlaceholder(
  username: string | null | undefined
): boolean {
  if (!username) return false;
  return username.toLowerCase().includes("temp");
}

/** Definitieve naam na hernoemen mag het woord "temp" niet bevatten (éénmalige overstap). */
export function isDisallowedFinalUsername(username: string): boolean {
  const t = username.trim();
  if (t.toLowerCase().includes("temp")) return true;
  if (/^user_\d+$/i.test(t)) return true;
  return false;
}
