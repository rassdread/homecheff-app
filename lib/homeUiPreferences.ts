/** Server payload voor homepage UI-voorkeuren (ingelogd) */
export type InitialHomeUiFromServer = {
  hideHomeHero: boolean;
  hideHowItWorks: boolean;
} | null;

/** localStorage keys voor homepage UI (uitgelogd + sync vóór server-write) */
export const LS_HIDE_HOME_HERO = "homecheff.ui.hideHomeHero";
export const LS_HIDE_HOW_IT_WORKS = "homecheff.ui.hideHowItWorks";

/** Voorkeur: inklapbare hero / info (vervangt hard sluiten; legacy keys blijven leesbaar voor migratie) */
export const LS_HERO_COLLAPSED = "homecheff.heroCollapsed";
export const LS_INFO_COLLAPSED = "homecheff.infoCollapsed";

/** true = compacte balk / samenvatting; leest nieuwe key, anders legacy “hide”-flags. */
export function readHeroCollapsedFromStorage(): boolean {
  if (readLsBool(LS_HERO_COLLAPSED)) return true;
  return readLsBool(LS_HIDE_HOME_HERO);
}

export function readInfoCollapsedFromStorage(): boolean {
  if (readLsBool(LS_INFO_COLLAPSED)) return true;
  return readLsBool(LS_HIDE_HOW_IT_WORKS);
}

export function writeHeroCollapsed(collapsed: boolean): void {
  writeLsBool(LS_HERO_COLLAPSED, collapsed);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LS_HIDE_HOME_HERO);
  } catch {
    /* ignore */
  }
}

export function writeInfoCollapsed(collapsed: boolean): void {
  writeLsBool(LS_INFO_COLLAPSED, collapsed);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LS_HIDE_HOW_IT_WORKS);
  } catch {
    /* ignore */
  }
}

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
