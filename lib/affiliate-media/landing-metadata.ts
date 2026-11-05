import type { Metadata } from 'next';
import { isPublicLandingEligible, isSafeForOpenGraphMedia, type MediaAccessAsset } from '@/lib/affiliate-media/access';

export type PromoLandingAsset = MediaAccessAsset & {
  kind: string;
  mediaUrl: string;
  posterUrl: string | null;
  title: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
};

const FALLBACK_DESCRIPTION = 'Ontdek HomeCheff — lokaal kopen, verkopen, bezorgen en verdienen.';

function hiddenMetadata(canonical: string): Metadata {
  return {
    title: 'HomeCheff',
    robots: { index: false, follow: false, noarchive: true },
    alternates: { canonical },
    openGraph: {
      title: 'HomeCheff',
      url: canonical,
      siteName: 'HomeCheff',
      type: 'website',
    },
  };
}

/**
 * Link-preview tags for one promo page.
 * Video pages advertise that MP4 and its own poster. They do not use the
 * site logo. Private files stay out of the tags.
 */
export function promoLandingMetadata(asset: PromoLandingAsset | null, canonical: string): Metadata {
  if (!asset || !isPublicLandingEligible(asset) || !isSafeForOpenGraphMedia(asset)) {
    return hiddenMetadata(canonical);
  }

  const title = asset.title?.trim() || 'HomeCheff';
  const description = asset.caption?.trim() || FALLBACK_DESCRIPTION;
  const poster = asset.kind === 'VIDEO' ? asset.posterUrl : asset.mediaUrl;
  const images = poster
    ? [{ url: poster, width: asset.width || 1200, height: asset.height || 630, alt: title }]
    : [];
  const robots =
    asset.visibility === 'PRIVATE'
      ? { index: false, follow: true, noarchive: true }
      : { index: true, follow: true };

  if (asset.kind === 'VIDEO') {
    return {
      title: `${title} | HomeCheff`,
      description,
      robots,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'HomeCheff',
        type: 'video.other',
        videos: [
          {
            url: asset.mediaUrl,
            secureUrl: asset.mediaUrl,
            type: 'video/mp4',
            width: asset.width || undefined,
            height: asset.height || undefined,
          },
        ],
        images,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images,
      },
    };
  }

  return {
    title: `${title} | HomeCheff`,
    description,
    robots,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'HomeCheff',
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}
