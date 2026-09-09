/**
 * Web/PWA social share capability matrix (HomeCheff).
 * Buttons must never imply a direct publish when the platform cannot do that from the browser.
 */

export type SharePlatformId =
  | 'whatsapp'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'x'
  | 'email'
  | 'web_share';

export type PlatformCapability = {
  platform: SharePlatformId;
  directWebShareSupported: boolean;
  urlSupported: boolean;
  prefilledTextSupported: boolean;
  imageSupported: boolean;
  nativeShareRequired: boolean;
  fallbackStrategy: string;
};

/**
 * Documented capabilities as of 2026 — browser/PWA context only.
 */
export const SOCIAL_SHARE_PLATFORM_MATRIX: readonly PlatformCapability[] = [
  {
    platform: 'whatsapp',
    directWebShareSupported: true,
    urlSupported: true,
    prefilledTextSupported: true,
    imageSupported: false,
    nativeShareRequired: false,
    fallbackStrategy: 'Open wa.me/?text= with conversational copy + attributed URL',
  },
  {
    platform: 'linkedin',
    directWebShareSupported: true,
    urlSupported: true,
    prefilledTextSupported: false,
    imageSupported: false,
    nativeShareRequired: false,
    fallbackStrategy:
      'Open LinkedIn share-offsite with URL; preview from OG; optional copy of professional text',
  },
  {
    platform: 'facebook',
    directWebShareSupported: true,
    urlSupported: true,
    prefilledTextSupported: false,
    imageSupported: false,
    nativeShareRequired: false,
    fallbackStrategy:
      'Open Facebook sharer with URL; preview from OG; caption is user-composed on Facebook',
  },
  {
    platform: 'instagram',
    directWebShareSupported: false,
    urlSupported: false,
    prefilledTextSupported: false,
    imageSupported: false,
    nativeShareRequired: true,
    fallbackStrategy:
      'Copy caption + offer OG image; invoke Web Share API when available; never claim a direct post',
  },
  {
    platform: 'tiktok',
    directWebShareSupported: false,
    urlSupported: false,
    prefilledTextSupported: false,
    imageSupported: false,
    nativeShareRequired: true,
    fallbackStrategy:
      'Copy caption + offer OG image; invoke Web Share API when available; never claim a direct post',
  },
  {
    platform: 'x',
    directWebShareSupported: true,
    urlSupported: true,
    prefilledTextSupported: true,
    imageSupported: false,
    nativeShareRequired: false,
    fallbackStrategy: 'Open twitter.com/intent/tweet with short text + URL',
  },
  {
    platform: 'email',
    directWebShareSupported: true,
    urlSupported: true,
    prefilledTextSupported: true,
    imageSupported: false,
    nativeShareRequired: false,
    fallbackStrategy: 'mailto: with subject + body including attributed URL',
  },
  {
    platform: 'web_share',
    directWebShareSupported: true,
    urlSupported: true,
    prefilledTextSupported: true,
    imageSupported: true,
    nativeShareRequired: false,
    fallbackStrategy:
      'navigator.share({ title, text, url [, files] }) on capable mobile; else visible panel',
  },
] as const;

export function getPlatformCapability(
  platform: SharePlatformId,
): PlatformCapability {
  const row = SOCIAL_SHARE_PLATFORM_MATRIX.find((p) => p.platform === platform);
  if (!row) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return row;
}
