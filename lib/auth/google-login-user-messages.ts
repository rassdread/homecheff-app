/**
 * User-facing Google login copy. Production never mentions env var names.
 */

export function googleNativeConfigBlockedUserMessage(locale: 'nl' | 'en' = 'nl'): string {
  if (locale === 'en') {
    return 'Google sign-in is temporarily unavailable on this device. Use email or open HomeCheff in your browser.';
  }
  return 'Google-inloggen is op dit apparaat tijdelijk niet beschikbaar. Gebruik e-mail of open HomeCheff in je browser.';
}

export function googleNativeConfigBlockedDevHint(): string {
  return (
    '[dev] Native Capgo webClientId missing: set NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID ' +
    '(Firebase web/serverClientId audience) or legacy NEXT_PUBLIC_GOOGLE_CLIENT_ID. ' +
    'Do not use the NextAuth web OAuth client (GOOGLE_CLIENT_ID).'
  );
}

export function shouldShowGoogleNativeDevHint(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function mapNativeGoogleApiErrorForUser(
  code: string,
  locale: 'nl' | 'en' = 'nl',
): string {
  switch (code) {
    case 'missing_id_token':
      return locale === 'en'
        ? 'No Google token received.'
        : 'Geen Google token ontvangen.';
    case 'invalid_token':
    case 'token_audience_mismatch':
      return locale === 'en'
        ? 'Google token verification failed.'
        : 'Google token verificatie mislukt.';
    case 'google_not_configured':
    case 'google_native_not_configured':
    case 'google_client_id_mismatch':
    case 'auth_not_configured':
      return googleNativeConfigBlockedUserMessage(locale);
    case 'email_not_verified':
      return locale === 'en'
        ? 'Your Google email is not verified.'
        : 'Je Google-e-mail is niet geverifieerd.';
    case 'user_create_failed':
    case 'sync_failed':
      return locale === 'en'
        ? 'Account could not be updated. Try again or use email and password.'
        : 'Account kon niet worden bijgewerkt. Probeer opnieuw of gebruik e-mail en wachtwoord.';
    case 'encode_failed':
      return locale === 'en'
        ? 'Could not start session. Please try again.'
        : 'Sessie starten mislukt. Probeer opnieuw.';
    default:
      return locale === 'en'
        ? 'Google token verification failed.'
        : 'Google token verificatie mislukt.';
  }
}
