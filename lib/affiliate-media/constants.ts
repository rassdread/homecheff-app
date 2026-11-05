/**
 * Production-safe LIMITED_VIDEO_V1 + image limits for affiliate promo media.
 *
 * Video bytes go straight to Vercel Blob (client upload token). They must not
 * pass through the Next.js function body, which Vercel caps at about 4.5 MB.
 * 80 MiB covers the 55 MB promo videos with margin and stays far under Blob's
 * client-upload ceiling (5 TB). The metadata route then checks type, size and
 * duration with ranged reads, not a full download.
 */
export const AFFILIATE_MEDIA_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const AFFILIATE_MEDIA_VIDEO_MAX_BYTES = 80 * 1024 * 1024;
export const AFFILIATE_MEDIA_INLINE_MAX_BYTES = 4 * 1024 * 1024;
export const AFFILIATE_MEDIA_POSTER_MAX_BYTES = 2 * 1024 * 1024;
export const AFFILIATE_MEDIA_VIDEO_MAX_DURATION_MS = 60_000;
export const AFFILIATE_MEDIA_VIDEO_DURATION_TOLERANCE_MS = 1_500;
export const AFFILIATE_MEDIA_IMAGE_MAX_EDGE = 4096;
export const AFFILIATE_MEDIA_VIDEO_MAX_EDGE = 1920;
export const AFFILIATE_MEDIA_UPLOADS_PER_HOUR = 12;
export const AFFILIATE_MEDIA_TITLE_MAX = 120;
export const AFFILIATE_MEDIA_CAPTION_MAX = 500;
export const AFFILIATE_MEDIA_CTA_MAX = 80;

export const AFFILIATE_MEDIA_DESTINATION_PATHS = [
  '/',
  '/werken-bij',
  '/affiliate',
  '/onboarding/seller',
  '/delivery/signup',
  '/verdiencheck',
] as const;

export type AffiliateMediaDestinationPath =
  (typeof AFFILIATE_MEDIA_DESTINATION_PATHS)[number];

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/mpeg4'] as const;
