import { resolveAcceptedBadges } from '@/lib/marketplace/taxonomy-badges';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles/types';
import { PREVIEW_ACCEPTED_MAX } from './types';
import type { PreviewAcceptedValue } from './types';

export function buildPreviewAcceptedValues(
  model: MarketplaceTileModel,
  t: TranslateFn,
): { values: PreviewAcceptedValue[]; overflow: number } {
  const badges = resolveAcceptedBadges(model.acceptedSpecializations);
  const mapped = badges.map((b) => ({
    id: b.id,
    label: b.displayLabel ?? t(b.labelKey),
    icon: b.icon,
  }));
  return {
    values: mapped.slice(0, PREVIEW_ACCEPTED_MAX),
    overflow: Math.max(0, mapped.length - PREVIEW_ACCEPTED_MAX),
  };
}
