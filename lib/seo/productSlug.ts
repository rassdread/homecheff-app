/**
 * SEO-vriendelijke product-URL's zonder DB-wijziging: slug + vaste marker + UUID.
 * Voorbeeld: /product/lasagne-rotterdam-hcid-550e8400-e29b-41d4-a716-446655440000
 */

export const PRODUCT_SLUG_ID_MARKER = "-hcid-";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function slugifySegment(s: string): string {
  const out = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return out || "item";
}

/** Pad-segment voor /product/[...] (zonder leading slash). */
export function buildProductSlugPath(
  title: string,
  place: string | null | undefined,
  id: string
): string {
  const t = slugifySegment(title || "product");
  const rawPlace = place?.split(",")[0]?.trim() || "";
  const p = rawPlace ? slugifySegment(rawPlace) : "lokaal";
  return `${t}-${p}${PRODUCT_SLUG_ID_MARKER}${id}`;
}

/** Canonical public listing path `/product/{slug}`. */
export function buildProductDetailPath(
  title: string,
  place: string | null | undefined,
  id: string,
): string {
  return `/product/${buildProductSlugPath(title, place, id)}`;
}

/**
 * Canonical listing edit path `/product/{slug}/edit`.
 * Prefer this over bare `/product/{uuid}/edit` — the product layout SEO redirect
 * must never strip `/edit` when normalizing UUIDs to slugs.
 */
export function buildProductEditPath(
  title: string,
  place: string | null | undefined,
  id: string,
): string {
  return `${buildProductDetailPath(title, place, id)}/edit`;
}

/** True when a request pathname is the listing edit route (not public detail). */
export function isProductEditPathname(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split('?')[0]?.replace(/\/+$/, '') || '';
  return /\/product\/[^/]+\/edit$/i.test(path);
}

/** Haalt het product-UUID uit route-param (plain UUID of slug met marker). */
export function resolveProductIdFromParam(param: string): string {
  let dec = decodeURIComponent(param).trim();
  if (dec.length > 1 && dec.endsWith('/')) dec = dec.slice(0, -1);
  if (UUID_REGEX.test(dec)) return dec;
  const idx = dec.indexOf(PRODUCT_SLUG_ID_MARKER);
  if (idx !== -1) {
    const id = dec.slice(idx + PRODUCT_SLUG_ID_MARKER.length);
    if (UUID_REGEX.test(id)) return id;
  }
  return dec;
}

export function isBareProductUuidParam(param: string): boolean {
  return UUID_REGEX.test(decodeURIComponent(param).trim());
}

/** Eerste deel van place voor titels (bijv. stad). */
export function formatCityLabel(place: string | null | undefined): string {
  if (!place?.trim()) return "";
  return place.split(",")[0].trim();
}

/** Pad voor lokale landingspagina's, of null als er geen plaats is. */
export function maaltijdenPathFromPlace(
  place: string | null | undefined
): string | null {
  const c = formatCityLabel(place);
  if (!c) return null;
  return `/maaltijden/${slugifySegment(c)}`;
}
