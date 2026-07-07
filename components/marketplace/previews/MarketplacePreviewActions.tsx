'use client';

import Link from 'next/link';
import StartChatButton from '@/components/chat/StartChatButton';
import TileFavoriteAction from '@/components/marketplace/tiles/primitives/TileFavoriteAction';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles/types';

const PROPOSAL_PREVIEW_KINDS: ListingKind[] = [
  'REQUEST',
  'SERVICE',
  'TASK',
  'COACHING',
];

function previewSupportsProposal(model: MarketplaceTileModel): boolean {
  if (model.mode === 'inspiration') return false;
  if (model.listingIntent === 'REQUEST' || model.listingKind === 'REQUEST') {
    return true;
  }
  return PROPOSAL_PREVIEW_KINDS.includes(model.listingKind);
}

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
  const showProposal = previewSupportsProposal(model);

  const viewKey = isRequest
    ? 'marketplace.request.actions.view'
    : 'marketplace.preview.actions.view';

  const proposalLabelKey = isRequest
    ? 'marketplace.request.actions.proposal'
    : 'marketplace.detail.actions.requestProposal';

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
      {sellerId && showProposal ? (
        <StartChatButton
          productId={model.id}
          sellerId={sellerId}
          sellerName={model.person?.name ?? model.person?.username ?? ''}
          skipModal
          openProposalAfterStart
          label={t(proposalLabelKey)}
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
