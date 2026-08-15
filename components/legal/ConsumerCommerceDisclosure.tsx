'use client';

/**
 * LEGAL-3 — compact consumer information / withdrawal disclosure.
 * LEGAL-1 — optional first-time inline commerce declaration (seller only).
 */

import { useId, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ConsumerCommerceContext } from '@/lib/legal/consumer-commerce-context';
import type { CommerceDeclarationChoice } from '@/components/legal/CommerceDeclarationModal';
import { cn } from '@/lib/utils';

type Props = {
  context: ConsumerCommerceContext;
  variant?: 'listing' | 'checkout' | 'proposal';
  className?: string;
  /** When service-start ack is needed */
  serviceStartAckChecked?: boolean;
  onServiceStartAckChange?: (next: boolean) => void;
  /**
   * Seller viewing own undeclared profile — show one-time LEGAL-1 choices.
   * Must be false for buyers / third parties.
   */
  allowInlineDeclaration?: boolean;
  /** Called after successful PUT /api/seller/commerce-declaration */
  onCommerceDeclared?: (declaration: CommerceDeclarationChoice) => void;
};

export default function ConsumerCommerceDisclosure({
  context,
  variant = 'listing',
  className,
  serviceStartAckChecked,
  onServiceStartAckChange,
  allowInlineDeclaration = false,
  onCommerceDeclared,
}: Props) {
  const { t } = useTranslation();
  const panelId = useId();
  const showInline =
    allowInlineDeclaration && context.isUndeclaredPath;
  const [open, setOpen] = useState(
    variant !== 'listing' && (showInline || context.isUndeclaredPath),
  );
  const [busy, setBusy] = useState<CommerceDeclarationChoice | null>(null);
  const [declareError, setDeclareError] = useState<string | null>(null);

  if (!context.showConsumerDisclosure) return null;

  const sellerStatusKey =
    context.publicLabel === 'geverifieerd_bedrijf'
      ? 'legal3.seller.verifiedBusiness'
      : context.publicLabel === 'zakelijke_aanbieder'
        ? 'legal3.seller.professional'
        : context.publicLabel === 'particulier'
          ? 'legal3.seller.private'
          : 'legal3.seller.undeclared';

  const withdrawalKey = `legal3.withdrawal.${context.withdrawalRule}`;
  const summaryKey = `legal3.summary.${context.withdrawalRule}`;

  const persistDeclaration = async (declaration: CommerceDeclarationChoice) => {
    const confirmKey =
      declaration === 'PRIVATE_OCCASIONAL'
        ? 'legal3.inlineDeclaration.confirmPrivate'
        : 'legal3.inlineDeclaration.confirmProfessional';
    if (typeof window !== 'undefined' && !window.confirm(t(confirmKey))) {
      return;
    }
    setDeclareError(null);
    setBusy(declaration);
    try {
      const res = await fetch('/api/seller/commerce-declaration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declaration }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeclareError(
          typeof data.error === 'string'
            ? data.error
            : t('legal3.inlineDeclaration.error'),
        );
        return;
      }
      onCommerceDeclared?.(declaration);
    } catch {
      setDeclareError(t('legal3.inlineDeclaration.error'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      data-hc-legal3-disclosure={variant}
      data-hc-withdrawal-rule={context.withdrawalRule}
      data-hc-inline-declaration={showInline ? 'true' : 'false'}
      className={cn(
        'rounded-xl border border-gray-200 bg-gray-50/90 px-3 py-3 sm:px-4 space-y-2',
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('legal3.sectionTitle')}
        </h3>
        {context.publicLabel ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {t('legal3.sellerDeclared')}
          </span>
        ) : null}
      </div>

      <dl className="grid gap-1.5 text-sm text-gray-800">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-gray-500">{t('legal3.sellerLabel')}</dt>
          <dd className="font-medium">{t(sellerStatusKey)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-gray-500">{t('legal3.withdrawalLabel')}</dt>
          <dd className="font-medium">{t(withdrawalKey)}</dd>
        </div>
      </dl>

      {showInline ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 space-y-2"
          data-hc-inline-commerce-declaration=""
        >
          <p className="text-xs font-semibold text-amber-950">
            {t('legal3.inlineDeclaration.heading')}
          </p>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            {t('legal3.inlineDeclaration.hint')}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void persistDeclaration('PRIVATE_OCCASIONAL')}
              className="flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-50"
              data-hc-declare-private=""
            >
              {busy === 'PRIVATE_OCCASIONAL' ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                t('legal3.inlineDeclaration.private')
              )}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                void persistDeclaration('SELF_DECLARED_PROFESSIONAL')
              }
              className="flex-1 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-50 disabled:opacity-50"
              data-hc-declare-professional=""
            >
              {busy === 'SELF_DECLARED_PROFESSIONAL' ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                t('legal3.inlineDeclaration.professional')
              )}
            </button>
          </div>
          {declareError ? (
            <p className="text-[11px] text-red-600" role="alert">
              {declareError}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-gray-600 leading-relaxed">{t(summaryKey)}</p>
      )}

      <button
        type="button"
        className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline touch-manipulation"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? t('legal3.lessInfo') : t('legal3.moreInfo')}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="space-y-2 text-xs text-gray-600 leading-relaxed border-t border-gray-200 pt-2"
      >
        <p>{t('legal3.platformRole')}</p>
        <p>{t(`legal3.detail.${context.withdrawalRule}`)}</p>
        {context.isProfessionalSellerPath ? (
          <p>{t('legal3.professionalNote')}</p>
        ) : null}
        {context.isPrivateSellerPath ? (
          <p>{t('legal3.privateNote')}</p>
        ) : null}
        {context.isUndeclaredPath ? (
          <p>{t('legal3.undeclaredNote')}</p>
        ) : null}
        <p>
          <Link href="/terms" className="text-emerald-800 underline">
            {t('legal3.termsLink')}
          </Link>
        </p>
        {showInline ? (
          <p>
            <Link href="/settings" className="text-emerald-800 underline">
              {t('legal3.inlineDeclaration.settingsLink')}
            </Link>
          </p>
        ) : null}
      </div>

      {context.serviceStartAckRequired && onServiceStartAckChange ? (
        <label className="flex items-start gap-2 text-xs text-gray-800 pt-1">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={Boolean(serviceStartAckChecked)}
            onChange={(e) => onServiceStartAckChange(e.target.checked)}
            data-hc-legal3-service-start-ack=""
          />
          <span>{t('legal3.serviceStartAck')}</span>
        </label>
      ) : null}
    </section>
  );
}
