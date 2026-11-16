export type AccountLanguage = 'nl' | 'en';

type LanguageResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

type LanguageFetch = (input: string, init?: RequestInit) => Promise<LanguageResponse>;

let cachedKey: string | null = null;
let cached: Promise<AccountLanguage | null> | null = null;

export function resetSharedAccountLanguage(): void {
  cachedKey = null;
  cached = null;
}

export function rememberSharedAccountLanguage(
  userKey: string,
  language: AccountLanguage,
): void {
  cachedKey = userKey;
  cached = Promise.resolve(language);
}

function parseAccountLanguage(data: unknown): AccountLanguage | null {
  if (!data || typeof data !== 'object') return null;
  const language = (data as { language?: unknown }).language;
  return language === 'nl' || language === 'en' ? language : null;
}

/**
 * One in-flight GET for every useTranslation() mount on the page.
 * A resolved preference stays cached for that account until reload or an
 * explicit language change. A failed request is dropped so a later mount
 * can retry, without letting the failed call fan out.
 */
export function loadSharedAccountLanguage(
  userKey: string,
  fetchImpl: LanguageFetch = fetch as LanguageFetch,
): Promise<AccountLanguage | null> {
  if (!userKey) return Promise.resolve(null);
  if (cachedKey === userKey && cached) return cached;

  const promise = fetchImpl('/api/user/language', {
    cache: 'no-store',
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('account language unavailable');
      }
      return parseAccountLanguage(await response.json());
    })
    .catch(() => {
      if (cached === promise) {
        cachedKey = null;
        cached = null;
      }
      return null;
    });

  cachedKey = userKey;
  cached = promise;
  return promise;
}
