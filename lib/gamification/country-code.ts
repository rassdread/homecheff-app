/**
 * Normaliseert land naar ISO 3166-1 alpha-2 (uppercase) voor vergelijking in DB-queries en filters.
 * Geen gevaarlijke prefix-gok op volledige landnamen (bv. "Netherlands" → nooit "NE").
 */
export function normalizeCountryCode(input: string | null | undefined): string | null {
  if (input == null || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase().replace(/\s+/g, ' ');

  if (/^[A-Z]{2}$/.test(upper)) return upper;

  /** Bekende schrijfwijzen → ISO (PostgreSQL vergelijkt uppercase trimmed). */
  const ALIAS: Record<string, string> = {
    NETHERLANDS: 'NL',
    'THE NETHERLANDS': 'NL',
    NEDERLAND: 'NL',
    HOLLAND: 'NL',
    BELGIUM: 'BE',
    BELGIË: 'BE',
    BELGIE: 'BE',
    BELGIEN: 'BE',
    DEUTSCHLAND: 'DE',
    GERMANY: 'DE',
    FRANCE: 'FR',
    FRANKRIJK: 'FR',
    SPAIN: 'ES',
    SPANJE: 'ES',
    ESPAÑA: 'ES',
    ITALY: 'IT',
    ITALIA: 'IT',
    ITALIË: 'IT',
    UNITEDKINGDOM: 'GB',
    'UNITED KINGDOM': 'GB',
    UK: 'GB',
    ENGLAND: 'GB',
    GREATBRITAIN: 'GB',
    'GREAT BRITAIN': 'GB',
    SCOTLAND: 'GB',
    WALES: 'GB',
    IRELAND: 'IE',
    IERLAND: 'IE',
    PORTUGAL: 'PT',
    POLAND: 'PL',
    POOLEN: 'PL',
    POLSKA: 'PL',
    AUSTRIA: 'AT',
    OOSTENRIJK: 'AT',
    ÖSTERREICH: 'AT',
    SWITZERLAND: 'CH',
    ZWITSERLAND: 'CH',
    SCHWEIZ: 'CH',
    SUISSE: 'CH',
    SWEDEN: 'SE',
    ZWEDEN: 'SE',
    NORWAY: 'NO',
    NOORWEGEN: 'NO',
    DENMARK: 'DK',
    DENEMARKEN: 'DK',
    FINLAND: 'FI',
    GREECE: 'GR',
    GRIEKENLAND: 'GR',
    CROATIA: 'HR',
    KROATIË: 'HR',
    ROMANIA: 'RO',
    ROEMENIË: 'RO',
    HUNGARY: 'HU',
    HONGARIJE: 'HU',
    CZECHIA: 'CZ',
    'CZECH REPUBLIC': 'CZ',
    SLOVAKIA: 'SK',
    SLOVENIA: 'SI',
    LUXEMBOURG: 'LU',
    USA: 'US',
    'UNITED STATES': 'US',
    'UNITED STATES OF AMERICA': 'US',
    CANADA: 'CA',
    AUSTRALIA: 'AU',
    'NEW ZEALAND': 'NZ',
    CURACAO: 'CW',
    CURAÇAO: 'CW',
    ARUBA: 'AW',
    BONAIRE: 'BQ',
    'SINT MAARTEN': 'SX',
    'SINT EUSTATIUS': 'BQ',
    SABA: 'BQ',
  };

  const mapped = ALIAS[upper];
  if (mapped) return mapped;

  /** BCP47: taal-REGIO (bv. nl-NL → NL) */
  const parts = upper.split(/[-_]/);
  const maybeRegion = parts[parts.length - 1];
  if (maybeRegion && /^[A-Z]{2}$/.test(maybeRegion)) return maybeRegion;

  return null;
}

/**
 * Waarden die in `User.country` kunnen staan naast de ISO-code; voor `IN (...)` in SQL.
 */
export function countryMatchVariants(iso: string): string[] {
  const cc = normalizeCountryCode(iso);
  if (!cc) return [];
  const BY_ISO: Record<string, string[]> = {
    NL: ['NL', 'NEDERLAND', 'NETHERLANDS', 'THE NETHERLANDS', 'HOLLAND'],
    BE: ['BE', 'BELGIUM', 'BELGIË', 'BELGIE', 'BELGIEN'],
    DE: ['DE', 'DEUTSCHLAND', 'GERMANY'],
    FR: ['FR', 'FRANCE', 'FRANKRIJK'],
    GB: ['GB', 'UK', 'UNITED KINGDOM', 'ENGLAND', 'GREAT BRITAIN'],
    US: ['US', 'USA', 'UNITED STATES'],
  };
  return [...new Set(BY_ISO[cc] ?? [cc])].map((s) => s.toUpperCase());
}
