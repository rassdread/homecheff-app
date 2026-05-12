/**
 * Server-side guards: never allow the public username/handle to equal a password field.
 * Used by email registration and social onboarding routes.
 */

function norm(s: unknown): string {
  return typeof s === 'string' ? s.trim() : '';
}

/**
 * @returns Dutch error message for API responses, or null if OK.
 */
export function registrationUsernamePasswordConflictMessage(
  username: unknown,
  password: unknown,
  confirmPassword?: unknown
): string | null {
  const u = norm(username);
  const p = norm(password);
  const c = norm(confirmPassword);
  if (!u) return null;
  if (p && u === p) {
    return 'Gebruikersnaam mag niet gelijk zijn aan je wachtwoord. Kies een andere @naam of een ander wachtwoord.';
  }
  if (c && u === c) {
    return 'Gebruikersnaam mag niet gelijk zijn aan je bevestigde wachtwoord.';
  }
  return null;
}
