/**
 * Fit rules for inspiration detail media — avoid aggressive cropping on steps/print.
 */

export type InspirationMediaContext =
  | 'hero'
  | 'step'
  | 'extra'
  | 'thumbnail'
  | 'lightbox'
  | 'print-hero'
  | 'print-step'
  | 'card'
  | 'preview'
  | 'product-story-step';

/** Portrait / tall / square → contain; moderate landscape may cover in hero only. */
const HERO_CONTAIN_MAX_RATIO = 1.45;

/** Card / feed / profile preview smart fit thresholds. */
const CARD_PORTRAIT_CONTAIN_BELOW = 0.85;
const CARD_LANDSCAPE_CONTAIN_ABOVE = 1.6;

export function getCardMediaFitMode(
  aspectRatio: number | null | undefined,
): 'cover' | 'contain' {
  if (aspectRatio == null || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return 'contain';
  }
  if (aspectRatio < CARD_PORTRAIT_CONTAIN_BELOW) {
    return 'contain';
  }
  if (aspectRatio > CARD_LANDSCAPE_CONTAIN_ABOVE) {
    return 'contain';
  }
  return 'cover';
}

export function getMediaFitMode(
  aspectRatio: number | null | undefined,
  context: InspirationMediaContext,
): 'cover' | 'contain' {
  if (
    context === 'step' ||
    context === 'extra' ||
    context === 'lightbox' ||
    context === 'print-hero' ||
    context === 'print-step' ||
    context === 'product-story-step'
  ) {
    return 'contain';
  }

  if (context === 'thumbnail') {
    return 'cover';
  }

  if (context === 'card' || context === 'preview') {
    return getCardMediaFitMode(aspectRatio);
  }

  // hero
  if (aspectRatio == null || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return 'contain';
  }

  return aspectRatio <= HERO_CONTAIN_MAX_RATIO ? 'contain' : 'cover';
}

export const INSPIRATION_MEDIA_CLASS = {
  contain: 'hc-inspiration-media-contain',
  cover: 'hc-inspiration-media-cover',
  smart: 'hc-inspiration-media-smart',
  stepWrap: 'hc-instruction-step-media',
  extraWrap: 'hc-inspiration-extra-media',
  printStepWrap: 'hc-print-step-media',
  printHeroWrap: 'hc-print-hero-media',
  productStoryStepWrap: 'hc-product-story-step-media',
  profilePreviewWrap: 'hc-profile-inspiration-preview-media',
} as const;

export function inspirationMediaClass(
  fit: 'cover' | 'contain',
): string {
  return fit === 'contain' ? INSPIRATION_MEDIA_CLASS.contain : INSPIRATION_MEDIA_CLASS.cover;
}

/**
 * Load natural aspect ratio for a remote image URL (client only).
 */
export function loadImageAspectRatio(url: string): Promise<number | null> {
  if (typeof window === 'undefined' || !url) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img.naturalWidth / img.naturalHeight);
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
