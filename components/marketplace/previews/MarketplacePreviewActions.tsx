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
  const isRequest =
    model.listingKind === 'REQUEST' || model.listingIntent === 'REQUEST';

  const viewKey = isRequest
    ? 'marketplace.request.actions.view'
    : 'marketplace.preview.actions.view';

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
      <Link
        href={model.href}
        prefetch
        onClick={onNavigate}
        className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl bg-primary-brand px-3 text-sm font-semibold text-white hover:bg-primary-brand/90"
      >
        {t(viewKey)}
      </Link>
      {sellerId && isRequest ? (
        <StartChatButton
          productId={model.id}
          sellerId={sellerId}
          sellerName={model.person?.name ?? model.person?.username ?? ''}
          skipModal
          openProposalAfterStart
          label={t('marketplace.request.actions.proposal')}
          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-xl bg-indigo-700 px-3 text-sm font-semibold text-white shadow-none hover:bg-indigo-800"
        />
      ) : sellerId ? (
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
