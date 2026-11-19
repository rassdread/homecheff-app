import { interpolateTranslation } from '@/lib/i18n/interpolate';
import { messageCenterUi } from '@/lib/admin/notification-ui-messages';

export type UiLanguage = 'nl' | 'en';

const TABLES: Record<UiLanguage, unknown> = {
  nl: { admin: { notificationCenter: { ui: messageCenterUi.nl } } },
  en: { admin: { notificationCenter: { ui: messageCenterUi.en } } },
};

export function uiLanguage(value: unknown): UiLanguage {
  return value === 'en' ? 'en' : 'nl';
}

export function uiLanguageFromHeader(value: string | null | undefined): UiLanguage | null {
  const text = value?.trim().toLowerCase();
  if (text === 'en' || text === 'nl') return text;
  return null;
}

/** Reads the admin's interface language. The composed message itself is never translated. */
export function uiLanguageFromRequest(request: { headers: { get(name: string): string | null }; cookies?: { get(name: string): { value: string } | undefined } }): UiLanguage {
  return (
    uiLanguageFromHeader(request.headers.get('x-homecheff-language')) ??
    uiLanguage(request.cookies?.get('hc_locale')?.value) 
  );
}

function lookup(table: unknown, key: string): string | null {
  let node: unknown = table;
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object' || !(part in (node as Record<string, unknown>))) return null;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : null;
}

/**
 * One lookup in the existing nl.json / en.json files.
 * A missing English sentence falls back to Dutch. The raw key is never shown.
 */
export function uiCopy(
  lang: UiLanguage,
  key: string,
  params?: Record<string, string | number> | null,
): string {
  const text = lookup(TABLES[lang], key) ?? lookup(TABLES.nl, key) ?? '';
  return interpolateTranslation(text, params);
}

const KNOWN_SYSTEM_KEYS = [
  'admin.notificationCenter.ui.audienceLongApplicable',
  'admin.notificationCenter.ui.audienceLongAll',
  'admin.notificationCenter.ui.audienceLongBuyers',
  'admin.notificationCenter.ui.audienceLongSellers',
  'admin.notificationCenter.ui.audienceLongDelivery',
  'admin.notificationCenter.ui.chosenAudience',
  'admin.notificationCenter.ui.notRecorded',
  'admin.notificationCenter.ui.missingSubject',
  'admin.notificationCenter.ui.historyIncomplete',
  'admin.notificationCenter.ui.pushAlsoInApp',
];

let knownSystemText: Map<string, string> | null = null;

function knownSystemMap(): Map<string, string> {
  if (knownSystemText) return knownSystemText;
  knownSystemText = new Map();
  for (const key of KNOWN_SYSTEM_KEYS) {
    for (const language of ['nl', 'en'] as const) {
      const text = lookup(TABLES[language], key);
      if (text) knownSystemText.set(text, key);
    }
  }
  return knownSystemText;
}

/** Translates a stored system phrase. A composed message or subject that is not a known phrase stays as written. */
export function uiKnown(lang: UiLanguage, text: string): string {
  const key = knownSystemMap().get(text);
  return key ? uiCopy(lang, key) : text;
}
