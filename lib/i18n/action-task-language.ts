export type ActionTaskLanguage = 'nl' | 'en';

export function actionTaskLanguage(
  value: string | null | undefined,
): ActionTaskLanguage {
  return value === 'en' ? 'en' : 'nl';
}

/** Task sentences follow the resolved UI language. Dutch stays the default. */
export function taskText(
  language: ActionTaskLanguage | null | undefined,
  nl: string,
  en: string,
): string {
  return language === 'en' ? en : nl;
}
