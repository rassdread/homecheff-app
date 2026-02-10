/**
 * Storage utilities voor onboarding voorkeuren
 * Slaat gebruikersvoorkeuren op in localStorage
 */

export interface OnboardingPreferences {
  tourCompleted: boolean;
  dismissedHints: string[]; // Array van hint IDs die niet meer getoond moeten worden
  tourCompletedPages: string[]; // Pagina's waar de tour al is voltooid
  disableAllHints: boolean; // Optie om alle hints uit te schakelen
}

const STORAGE_KEY = 'homecheff_onboarding_preferences';

/**
 * Laad onboarding voorkeuren uit localStorage
 */
export function loadOnboardingPreferences(): OnboardingPreferences {
  if (typeof window === 'undefined') {
    return getDefaultPreferences();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading onboarding preferences:', error);
  }

  return getDefaultPreferences();
}

/**
 * Sla onboarding voorkeuren op in localStorage
 */
export function saveOnboardingPreferences(prefs: OnboardingPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Error saving onboarding preferences:', error);
  }
}

/**
 * Controleer of een specifieke hint is weggeklikt
 */
export function isHintDismissed(hintId: string): boolean {
  const prefs = loadOnboardingPreferences();
  return prefs.dismissedHints.includes(hintId) || prefs.disableAllHints;
}

/**
 * Dismiss een specifieke hint (niet meer tonen)
 */
export function dismissHint(hintId: string): void {
  const prefs = loadOnboardingPreferences();
  if (!prefs.dismissedHints.includes(hintId)) {
    prefs.dismissedHints.push(hintId);
    saveOnboardingPreferences(prefs);
  }
}

/**
 * Markeer dat de tour voor een pagina is voltooid
 */
export function markTourCompletedForPage(pageId: string): void {
  const prefs = loadOnboardingPreferences();
  if (!prefs.tourCompletedPages.includes(pageId)) {
    prefs.tourCompletedPages.push(pageId);
    saveOnboardingPreferences(prefs);
  }
}

/**
 * Controleer of de tour voor een pagina al is voltooid
 */
export function isTourCompletedForPage(pageId: string): boolean {
  const prefs = loadOnboardingPreferences();
  return prefs.tourCompletedPages.includes(pageId);
}

/**
 * Schakel alle hints uit
 */
export function disableAllHints(): void {
  const prefs = loadOnboardingPreferences();
  prefs.disableAllHints = true;
  saveOnboardingPreferences(prefs);
}

/**
 * Schakel alle hints weer in
 */
export function enableAllHints(): void {
  const prefs = loadOnboardingPreferences();
  prefs.disableAllHints = false;
  saveOnboardingPreferences(prefs);
}

/**
 * Reset alle voorkeuren (voor testing of als gebruiker dit wil)
 */
export function resetOnboardingPreferences(): void {
  const prefs = getDefaultPreferences();
  saveOnboardingPreferences(prefs);
}

/**
 * Standaard voorkeuren
 */
function getDefaultPreferences(): OnboardingPreferences {
  return {
    tourCompleted: false,
    dismissedHints: [],
    tourCompletedPages: [],
    disableAllHints: false,
  };
}

