import { MAIN_DOMAIN } from '@/lib/seo/constants';
import { opportunityOgImageUrl } from '@/lib/share/homecheff-share-payload';

export const OFFICIAL_VERDIENCHECK_PROMO_ID = 'official-verdiencheck';

export type OfficialVerdienCheckPromoAsset = {
  id: string;
  kind: 'IMAGE';
  mediaUrl: string;
  posterUrl: string | null;
  title: string;
  caption: string;
  ctaText: string;
  visibility: 'OFFICIAL';
  moderationStatus: 'ACTIVE';
  shareSlug: string;
  destinationPath: '/verdiencheck';
  createdAt: string;
  durationMs: null;
  shareCount: number;
  isOwner: false;
  creatorCredit: 'HomeCheff';
  builtin: true;
};

export function officialVerdienCheckPromoAsset(
  origin = MAIN_DOMAIN,
): OfficialVerdienCheckPromoAsset {
  return {
    id: OFFICIAL_VERDIENCHECK_PROMO_ID,
    kind: 'IMAGE',
    mediaUrl: opportunityOgImageUrl('verdiencheck', origin),
    posterUrl: null,
    title: 'VerdienCheck',
    caption:
      'Laat mensen zelf ontdekken wat extra verdienen na kosten, belasting en toeslagen ongeveer oplevert.',
    ctaText: 'Deel VerdienCheck',
    visibility: 'OFFICIAL',
    moderationStatus: 'ACTIVE',
    shareSlug: 'vcheck01',
    destinationPath: '/verdiencheck',
    createdAt: '2026-01-01T00:00:00.000Z',
    durationMs: null,
    shareCount: 0,
    isOwner: false,
    creatorCredit: 'HomeCheff',
    builtin: true,
  };
}

export function libraryCoversVerdienCheck(
  assets: readonly { destinationPath?: string | null }[],
): boolean {
  return assets.some((asset) => asset.destinationPath === '/verdiencheck');
}

export function mergeOfficialVerdienCheckPromo<T extends { destinationPath?: string | null }>(
  assets: T[],
): Array<T | OfficialVerdienCheckPromoAsset> {
  if (libraryCoversVerdienCheck(assets)) return assets;
  return [officialVerdienCheckPromoAsset(), ...assets];
}
