'use client';

import Link from 'next/link';
import StartChatButton from '@/components/chat/StartChatButton';
import TileFavoriteAction from '@/components/marketplace/tiles/primitives/TileFavoriteAction';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles/types';

export default function MarketplacePreviewActions({
  model,
  t,
  onNavigate,
}: {
  model: MarketplaceTileModel;
  t: TranslateFn;
  onNavigate?: () => void;
}) {
  const title = model.title || t('common.dish');
  const sellerId = model.person?.userId;
  const isInspiration = model.mode === 'inspiration';

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
      <Link
        href={model.href}
        prefetch
        onClick={onNavigate}
        className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl bg-primary-brand px-3 text-sm font-semibold text-white hover:bg-primary-brand/90"
      >
        {t('marketplace.preview.actions.view')}
      </Link>
      {sellerId ? (
        <StartChatButton
          {...(isInspiration ? {} : { productId: model.id })}
          sellerId={sellerId}
          sellerName={model.person?.name ?? model.person?.username ?? ''}
          label={t('marketplace.preview.actions.message')}
          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 shadow-none hover:bg-gray-50"
        />
      ) : null}
      <div data-preview-ignore>
        <TileFavoriteAction
          id={model.id}
          title={title}
          mode={model.mode}
          className="shrink-0"
        />
      </div>
    </div>
  );
}
