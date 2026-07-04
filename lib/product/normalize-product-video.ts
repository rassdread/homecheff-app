/** ProductVideo is a singular Prisma relation — API may return object or legacy array. */

export type ProductVideoRecord = {
  id: string;
  url: string;
  thumbnail?: string | null;
  duration?: number | null;
};

export function normalizeProductVideo(
  raw: ProductVideoRecord | ProductVideoRecord[] | null | undefined,
): ProductVideoRecord | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const first = raw.find((v) => v?.url);
    return first ?? null;
  }
  if (typeof raw === 'object' && typeof raw.url === 'string' && raw.url.trim()) {
    return raw;
  }
  return null;
}

/** Product video first, linked Dish video as fallback. */
export function resolveProductDetailVideo(
  productVideo: ProductVideoRecord | ProductVideoRecord[] | null | undefined,
  dishVideo: ProductVideoRecord | ProductVideoRecord[] | null | undefined,
): ProductVideoRecord | null {
  return normalizeProductVideo(productVideo) ?? normalizeProductVideo(dishVideo);
}
