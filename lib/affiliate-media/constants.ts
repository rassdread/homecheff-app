/** Production-safe LIMITED_VIDEO_V1 + image limits for affiliate promo media. */

export const AFFILIATE_MEDIA_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const AFFILIATE_MEDIA_VIDEO_MAX_BYTES = 20 * 1024 * 1024;
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
