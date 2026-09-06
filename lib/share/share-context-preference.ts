/**
 * Active share context preference for dual personal/company affiliates.
 * Reuses workspace selection — not a second permanent secret preference store.
 */

export type AffiliateShareMode = "personal" | "company";

const MODE_KEY = "hc_aff_share_mode";
const ORG_KEY = "hc_aff_share_org_id";

export type ShareContextPreference = {
  mode: AffiliateShareMode;
  organizationId: string | null;
};

export function readShareContextPreference(): ShareContextPreference | null {
  if (typeof window === "undefined") return null;
  try {
    const mode = window.localStorage.getItem(MODE_KEY);
    if (mode !== "personal" && mode !== "company") return null;
    const organizationId = window.localStorage.getItem(ORG_KEY);
    return {
      mode,
      organizationId: organizationId?.trim() || null,
    };
  } catch {
    return null;
  }
}

export function writeShareContextPreference(
  preference: ShareContextPreference,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MODE_KEY, preference.mode);
    if (preference.mode === "company" && preference.organizationId) {
      window.localStorage.setItem(ORG_KEY, preference.organizationId);
    } else {
      window.localStorage.removeItem(ORG_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearShareContextPreference(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(MODE_KEY);
    window.localStorage.removeItem(ORG_KEY);
  } catch {
    /* ignore */
  }
}
