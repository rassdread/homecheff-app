import { isSafeRestorablePath, toTrailingSlashPath } from "@/lib/native/safeRoute";

/** Alleen het apex-domein uit de bestaande berichtmails. www en .nl blijven in de browser. */
const APP_LINK_HOST = "homecheff.eu";

/**
 * Alleen de bestaande bericht- en adminmeldingpaden.
 * /api/auth, /checkout en Stripe-retouren vallen hierbuiten.
 */
const APP_LINK_PREFIXES = ["/messages/", "/notifications/admin/"] as const;

let coldStartHandled = false;

function isClaimedMessagePath(pathname: string): boolean {
  const withSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return APP_LINK_PREFIXES.some(
    (prefix) => withSlash === prefix || withSlash.startsWith(prefix),
  );
}

/**
 * Zet een binnenkomende https-link om naar een bestaand veilig pad.
 * Absolute URL's van andere hosts, http, OAuth en Stripe leveren null.
 */
export function pathFromAppLink(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.hostname.toLowerCase() !== APP_LINK_HOST) return null;
  if (!isClaimedMessagePath(url.pathname)) return null;
  if (!isSafeRestorablePath(url.pathname)) return null;
  return toTrailingSlashPath(url.pathname);
}

/** Cold start levert getLaunchUrl bij elke mount opnieuw. Eén keer verwerken. */
export function pathFromColdStartAppLink(
  raw: string | null | undefined,
): string | null {
  if (coldStartHandled) return null;
  coldStartHandled = true;
  return pathFromAppLink(raw);
}

export function resetColdStartAppLinkForTests(): void {
  coldStartHandled = false;
}
