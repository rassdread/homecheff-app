'use client';

import { Info } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useMarketplacePreviewShell } from './MarketplacePreviewShellContext';

export type MarketplacePreviewInfoButtonProps = {
  className?: string;
};

/**
 * Explicit preview trigger — top-right on tile media.
 * Click toggles preview; keyboard Enter/Space supported.
 */
export default function MarketplacePreviewInfoButton({
  className = '',
}: MarketplacePreviewInfoButtonProps) {
  const ctx = useMarketplacePreviewShell();
  const { t } = useTranslation();

  if (!ctx) return null;

  const label = ctx.open
    ? t('marketplace.preview.infoClose')
    : t('marketplace.preview.infoOpen');

  return (
    <button
      type="button"
      data-preview-ignore
      aria-label={label}
      aria-expanded={ctx.open}
      aria-controls={`marketplace-preview-${ctx.listingId}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        ctx.togglePreview();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          ctx.togglePreview();
        }
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1 ${className}`}
    >
      <Info className="h-4 w-4" aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  );
}
