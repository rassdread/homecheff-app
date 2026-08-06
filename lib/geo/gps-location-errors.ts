/**
 * User-facing GPS / geolocation error mapping for HomeCheff nearby discovery.
 * No PII — codes only.
 */

export type GpsFailureCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNSUPPORTED'
  | 'UNKNOWN';

export type GpsUserMessage = {
  code: GpsFailureCode;
  /** Short status for UI */
  titleNl: string;
  titleEn: string;
  /** Guidance + retry / settings hint */
  bodyNl: string;
  bodyEn: string;
  /** Suggest opening manual place entry immediately */
  offerManualFallback: boolean;
};

const MESSAGES: Record<GpsFailureCode, GpsUserMessage> = {
  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    titleNl: 'Locatietoegang geweigerd',
    titleEn: 'Location access denied',
    bodyNl:
      'Sta locatie toe via het slotje in de adresbalk of via je apparaatinstellingen. Of typ hieronder een plaats of postcode.',
    bodyEn:
      'Allow location via the lock icon in the address bar or your device settings. Or type a city or postcode below.',
    offerManualFallback: true,
  },
  POSITION_UNAVAILABLE: {
    code: 'POSITION_UNAVAILABLE',
    titleNl: 'Locatie niet beschikbaar',
    titleEn: 'Location unavailable',
    bodyNl:
      'Zet locatieservices aan op je apparaat en probeer opnieuw, of typ een plaats of postcode.',
    bodyEn:
      'Turn on location services on your device and try again, or type a city or postcode.',
    offerManualFallback: true,
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    titleNl: 'Locatie duurde te lang',
    titleEn: 'Location timed out',
    bodyNl:
      'Probeer opnieuw, of typ een plaats of postcode als sneller alternatief.',
    bodyEn:
      'Try again, or type a city or postcode as a faster alternative.',
    offerManualFallback: true,
  },
  UNSUPPORTED: {
    code: 'UNSUPPORTED',
    titleNl: 'Locatie niet ondersteund',
    titleEn: 'Location not supported',
    bodyNl:
      'Je browser of apparaat ondersteunt geen locatie. Typ een plaats of postcode.',
    bodyEn:
      'Your browser or device does not support location. Type a city or postcode.',
    offerManualFallback: true,
  },
  UNKNOWN: {
    code: 'UNKNOWN',
    titleNl: 'Locatie kon niet worden bepaald',
    titleEn: 'Could not determine location',
    bodyNl: 'Probeer opnieuw of typ een plaats of postcode.',
    bodyEn: 'Try again or type a city or postcode.',
    offerManualFallback: true,
  },
};

export function mapGeolocationPositionErrorCode(
  code: number | null | undefined,
): GpsFailureCode {
  // GeolocationPositionError: 1 PERMISSION_DENIED, 2 POSITION_UNAVAILABLE, 3 TIMEOUT
  if (code === 1) return 'PERMISSION_DENIED';
  if (code === 2) return 'POSITION_UNAVAILABLE';
  if (code === 3) return 'TIMEOUT';
  return 'UNKNOWN';
}

export function mapGpsFailureString(
  raw: string | null | undefined,
): GpsFailureCode {
  const c = (raw || '').toUpperCase();
  if (
    c === 'DENIED' ||
    c === 'PERMISSION_DENIED' ||
    c === 'GPS_DENIED' ||
    c.includes('DENIED') ||
    c.includes('GEWEIGERD')
  ) {
    return 'PERMISSION_DENIED';
  }
  if (c === 'TIMEOUT' || c === 'GPS_TIMEOUT' || c.includes('TIMEOUT') || c.includes('VERLOPEN')) {
    return 'TIMEOUT';
  }
  if (
    c === 'UNSUPPORTED' ||
    c === 'NOT_SUPPORTED' ||
    c.includes('NOT SUPPORTED') ||
    c.includes('NIET ONDERSTEUND')
  ) {
    return 'UNSUPPORTED';
  }
  if (
    c === 'UNAVAILABLE' ||
    c === 'POSITION_UNAVAILABLE' ||
    c === 'NOT_NATIVE' ||
    c === 'GPS_UNAVAILABLE' ||
    c.includes('UNAVAILABLE')
  ) {
    return 'POSITION_UNAVAILABLE';
  }
  return 'UNKNOWN';
}

export function gpsUserMessageFor(
  code: GpsFailureCode,
  locale: 'nl' | 'en' = 'nl',
): { title: string; body: string; offerManualFallback: boolean; code: GpsFailureCode } {
  const m = MESSAGES[code] ?? MESSAGES.UNKNOWN;
  return {
    code: m.code,
    title: locale === 'en' ? m.titleEn : m.titleNl,
    body: locale === 'en' ? m.bodyEn : m.bodyNl,
    offerManualFallback: m.offerManualFallback,
  };
}

/** Combined single-line message for compact UI slots. */
export function gpsCompactMessage(
  code: GpsFailureCode,
  locale: 'nl' | 'en' = 'nl',
): string {
  const m = gpsUserMessageFor(code, locale);
  return `${m.title}. ${m.body}`;
}
