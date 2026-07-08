'use client';

import { useMemo, type ReactNode } from 'react';
import { ShieldCheck, Banknote, Handshake, ArrowLeftRight } from 'lucide-react';
import { buildMarketplacePreviewContent } from '@/lib/marketplace/previews';
import type { MarketplacePreviewContent } from '@/lib/marketplace/previews/types';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles/types';
import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';
import { PreviewFulfillmentIcon } from './preview-fulfillment-icons';
import MarketplacePreviewActions from './MarketplacePreviewActions';

/** Phase 7C.7 — plain-language settlement explanation for the preview. */
function PreviewSettlement({
  model,
  t,
}: {
  model: MarketplaceTileModel;
  t: TranslateFn;
}) {
  if (model.mode === 'inspiration') return null;

  const options = resolveSettlementOptions({
    acceptHomeCheffPayment:
      typeof model.acceptsHomeCheffCheckout === 'boolean' ? model.acceptsHomeCheffCheckout : undefined,
    acceptDirectContact:
      typeof model.acceptsDirectContact === 'boolean' ? model.acceptsDirectContact : undefined,
    orderMethod: model.orderMethod,
    barterOpenness: model.barterOpenness,
    acceptedSpecializations: model.acceptedSpecializations,
    acceptedValueSubcategories: model.acceptedValueSubcategories,
    priceCents: model.priceCents,
    priceModel: model.priceModel,
    listingIntent: model.listingIntent,
    stripeConnectReady: model.homeCheffCheckoutConfigured === false ? false : undefined,
  });

  const rows: { key: string; icon: ReactNode; label: string }[] = [];
  if (options.canCheckoutNow) {
    rows.push({ key: 'homecheff', icon: <ShieldCheck className="h-3.5 w-3.5 text-primary-brand" aria-hidden />, label: t('marketplace.preview.settlement.homeCheffCheckout') });
  }
  if (options.acceptsDirectContact) {
    rows.push({ key: 'direct', icon: <Banknote className="h-3.5 w-3.5 text-gray-600" aria-hidden />, label: t('marketplace.preview.settlement.directContact') });
  }
  if (options.allowsBarter) {
    rows.push({ key: 'barter', icon: <Handshake className="h-3.5 w-3.5 text-amber-600" aria-hidden />, label: t('marketplace.preview.settlement.barter') });
  }
  if (options.hasAcceptedValues) {
    rows.push({ key: 'value', icon: <ArrowLeftRight className="h-3.5 w-3.5 text-secondary-brand" aria-hidden />, label: t('marketplace.preview.settlement.acceptedValues') });
  }

  if (rows.length === 0) return null;

  const isRequest = String(model.listingIntent ?? '').toUpperCase() === 'REQUEST';
  const heading = isRequest
    ? t('marketplace.preview.settlement.requestHeading')
    : t('marketplace.preview.settlement.heading');

  return (
    <PreviewSection title={heading}>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2 text-sm text-gray-700">
            {row.icon}
            <span>{row.label}</span>
          </li>
        ))}
      </ul>
    </PreviewSection>
  );
}

function PreviewMetaRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <p className="text-sm text-gray-600">
      <span className="font-medium text-gray-700">{label}: </span>
      {value}
    </p>
  );
}

function PreviewSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  if (!children) return null;
  return (
    <section className="space-y-1.5">
      {title ? (
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h4>
      ) : null}
      {children}
    </section>
  );
}

function PreviewBody({
  content,
  t,
}: {
  content: MarketplacePreviewContent;
  t: TranslateFn;
}) {
  const kind = content.listingKind;

  if (kind === 'INSPIRATION') {
    return (
      <div className="space-y-2">
        <PreviewMetaRow
          label={t('marketplace.preview.inspiration.creator')}
          value={content.creatorName}
        />
        {content.description ? (
          <p className="text-sm leading-relaxed text-gray-700 line-clamp-4">
            {content.description}
          </p>
        ) : null}
        <PreviewMetaRow
          label={t('marketplace.preview.inspiration.category')}
          value={content.inspirationCategory}
        />
      </div>
    );
  }

  if (kind === 'REQUEST') {
    return (
      <div className="space-y-2">
        {content.requestSummary ? (
          <p className="text-sm leading-relaxed text-gray-700 line-clamp-4">
            {content.requestSummary}
          </p>
        ) : null}
        <PreviewMetaRow
          label={t('marketplace.preview.request.neededBy')}
          value={content.neededBy}
        />
        <PreviewMetaRow
          label={t('marketplace.preview.request.compensation')}
          value={content.compensationNote}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {content.description ? (
        <p className="text-sm leading-relaxed text-gray-700 line-clamp-4">
          {content.description}
        </p>
      ) : null}
      {kind === 'SERVICE' ? (
        <>
          <PreviewMetaRow
            label={t('marketplace.preview.service.availability')}
            value={content.availabilityNote}
          />
          <PreviewMetaRow
            label={t('marketplace.preview.service.response')}
            value={content.responseExpectation}
          />
        </>
      ) : null}
      {kind === 'WORKSHOP' ? (
        <>
          <PreviewMetaRow
            label={t('marketplace.preview.workshop.date')}
            value={content.workshopDate}
          />
          <PreviewMetaRow
            label={t('marketplace.preview.workshop.location')}
            value={content.workshopLocation}
          />
          {content.capacityRemaining != null ? (
            <PreviewMetaRow
              label={t('marketplace.preview.workshop.capacity')}
              value={String(content.capacityRemaining)}
            />
          ) : null}
        </>
      ) : null}
      {kind === 'COACHING' ? (
        <PreviewMetaRow
          label={t('marketplace.preview.coaching.mode')}
          value={content.onlineOffline}
        />
      ) : null}
    </div>
  );
}

export default function MarketplacePreviewCard({
  model,
  t,
  locale = 'nl-NL',
  onClose,
  showActions = true,
  className = '',
}: {
  model: MarketplaceTileModel;
  t: TranslateFn;
  locale?: string;
  onClose?: () => void;
  showActions?: boolean;
  className?: string;
}) {
  const content = useMemo(
    () => buildMarketplacePreviewContent(model, t, locale),
    [model, t, locale],
  );

  return (
    <div
      className={`flex max-h-[min(80vh,560px)] flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xl ${className}`}
      data-marketplace-preview-card
    >
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <h3 className="text-base font-bold leading-snug text-gray-900 line-clamp-2">
          {content.title}
        </h3>

        <PreviewBody content={content} t={t} />

        {content.payment ? (
          <PreviewSection title={t('marketplace.preview.sections.payment')}>
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-sm font-semibold text-gray-900">
                {content.payment.primary}
              </p>
              {content.payment.secondary ? (
                <p className="text-xs text-gray-600">{content.payment.secondary}</p>
              ) : null}
            </div>
          </PreviewSection>
        ) : null}

        <PreviewSettlement model={model} t={t} />

        {content.fulfillment.length > 0 ? (
          <PreviewSection title={t('marketplace.preview.sections.fulfillment')}>
            <ul className="flex flex-wrap gap-2" aria-label={t('marketplace.preview.sections.fulfillment')}>
              {content.fulfillment.map((item) => (
                <li
                  key={item.key}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700"
                  title={t(item.labelKey)}
                >
                  <PreviewFulfillmentIcon item={item} />
                  <span>{t(item.labelKey)}</span>
                </li>
              ))}
            </ul>
          </PreviewSection>
        ) : null}

        {content.acceptedValues.length > 0 ? (
          <PreviewSection title={t('marketplace.preview.sections.acceptedValues')}>
            <ul className="flex flex-wrap gap-1.5">
              {content.acceptedValues.map((v) => (
                <li
                  key={v.id}
                  className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                >
                  {v.label}
                </li>
              ))}
              {content.acceptedOverflow > 0 ? (
                <li className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  +{content.acceptedOverflow}
                </li>
              ) : null}
            </ul>
          </PreviewSection>
        ) : null}

        {content.showTrust &&
        (content.trustLines.length > 0 || content.trustBadges.length > 0) ? (
          <PreviewSection title={t('marketplace.preview.sections.trust')}>
            <ul className="space-y-1">
              {content.trustLines.map((line) => (
                <li key={line.id} className="text-xs text-gray-600">
                  {line.text}
                </li>
              ))}
            </ul>
            {content.trustBadges.length > 0 ? (
              <ul className="mt-1.5 flex flex-wrap gap-1">
                {content.trustBadges.map((badge) => (
                  <li
                    key={badge.key}
                    className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900"
                  >
                    {badge.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </PreviewSection>
        ) : null}
      </div>

      {showActions ? (
        <div className="shrink-0 border-t border-gray-100 bg-white p-3">
          <MarketplacePreviewActions
            model={model}
            t={t}
            onNavigate={onClose}
          />
        </div>
      ) : null}
    </div>
  );
}
