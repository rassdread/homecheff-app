import type { AffiliateMediaVisibility } from '@prisma/client';
import { requiresReuseConsent } from '@/lib/affiliate-media/access';
import {
  AFFILIATE_MEDIA_CAPTION_MAX,
  AFFILIATE_MEDIA_CTA_MAX,
  AFFILIATE_MEDIA_TITLE_MAX,
} from '@/lib/affiliate-media/constants';

export type UploadVisibilityInput = 'PRIVATE' | 'AFFILIATE_COMMUNITY' | 'OFFICIAL';

export function parseAffiliateVisibility(raw: string | null | undefined): AffiliateMediaVisibility | null {
  const v = String(raw || '').trim().toUpperCase();
  if (v === 'PRIVATE' || v === 'AFFILIATE_COMMUNITY' || v === 'OFFICIAL') return v;
  return null;
}

export function validateCommunityConsent(input: {
  visibility: AffiliateMediaVisibility;
  reuseConsent: boolean;
}): { ok: true } | { ok: false; error: string } {
  if (!requiresReuseConsent(input.visibility)) return { ok: true };
  if (!input.reuseConsent) return { ok: false, error: 'reuse_consent_required' };
  return { ok: true };
}

export function clipText(value: string | null | undefined, max: number): string | null {
  const t = String(value || '').trim();
  if (!t) return null;
  return t.slice(0, max);
}

export function normalizeAssetCopy(input: {
  title?: string | null;
  caption?: string | null;
  ctaText?: string | null;
}): { title: string | null; caption: string | null; ctaText: string | null } {
  return {
    title: clipText(input.title, AFFILIATE_MEDIA_TITLE_MAX),
    caption: clipText(input.caption, AFFILIATE_MEDIA_CAPTION_MAX),
    ctaText: clipText(input.ctaText, AFFILIATE_MEDIA_CTA_MAX),
  };
}
