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
  return username.toLowerCase().includes("temp");
}
