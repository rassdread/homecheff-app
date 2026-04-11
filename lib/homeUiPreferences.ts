/** Server payload voor homepage UI-voorkeuren (ingelogd) */
export type InitialHomeUiFromServer = {
  hideHomeHero: boolean;
  hideHowItWorks: boolean;
} | null;

/** localStorage keys voor homepage UI (uitgelogd + sync vóór server-write) */
export const LS_HIDE_HOME_HERO = "homecheff.ui.hideHomeHero";
export const LS_HIDE_HOW_IT_WORKS = "homecheff.ui.hideHowItWorks";

export function readLsBool(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function writeLsBool(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(key, "true");
    else window.localStorage.removeItem(key);
  } catch {
    /* ignore quota / private mode */
  }
}

export function devHomeUiLog(message: string, payload?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") return;
  console.log(`[home-ui] ${message}`, payload ?? "");
}
