'use client';

/**
 * LEGAL-3 — compact consumer information / withdrawal disclosure.
 * LEGAL-1 — optional first-time inline commerce declaration (seller only).
 *
 * Critical control labels use tOr() so stale i18n cache can never render empty buttons.
 */

import { useId, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, User } from 'lucide-react';
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

const LABELS = {
  heading: {
    key: 'legal3.inlineDeclaration.heading',
    en: 'How do you offer on HomeCheff?',
    nl: 'Hoe bied je aan op HomeCheff?',
  },
  hint: {
    key: 'legal3.inlineDeclaration.hint',
    en: "We'll save this choice to your profile. You can change it later.",
    nl: 'We bewaren deze keuze in je profiel. Je kunt dit later wijzigen.',
  },
  private: {
    key: 'legal3.inlineDeclaration.private',
    en: 'As a private individual',
    nl: 'Als particulier',
  },
  professional: {
    key: 'legal3.inlineDeclaration.professional',
    en: 'As a professional / business',
    nl: 'Als professioneel / bedrijf',
  },
  youSelected: {
    key: 'legal3.inlineDeclaration.youSelected',
    en: 'You selected:',
    nl: 'Je kiest:',
  },
  confirm: {
    key: 'legal3.inlineDeclaration.confirm',
    en: 'Confirm',
    nl: 'Bevestigen',
  },
  cancel: {
    key: 'legal3.inlineDeclaration.cancel',
    en: 'Cancel',
    nl: 'Annuleren',
  },
  saving: {
    key: 'legal3.inlineDeclaration.saving',
    en: 'Saving…',
    nl: 'Opslaan…',
  },
  error: {
    key: 'legal3.inlineDeclaration.error',
    en: 'Your choice could not be saved. Please try again.',
    nl: 'Je keuze kon niet worden opgeslagen. Probeer opnieuw.',
  },
  settingsLink: {
    key: 'legal3.inlineDeclaration.settingsLink',
    en: 'Change later in settings',
    nl: 'Later wijzigen in instellingen',
  },
} as const;

export default function ConsumerCommerceDisclosure({
  context,
  variant = 'listing',
  className,
  serviceStartAckChecked,
  onServiceStartAckChange,
  allowInlineDeclaration = false,
  onCommerceDeclared,
}: Props) {
  const { t, tOr } = useTranslation();
  const panelId = useId();
  const showInline =
    allowInlineDeclaration && context.isUndeclaredPath;
  const [open, setOpen] = useState(
    variant !== 'listing' && (showInline || context.isUndeclaredPath),
  );
  const [pendingChoice, setPendingChoice] =
    useState<CommerceDeclarationChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [declareError, setDeclareError] = useState<string | null>(null);

  if (!context.showConsumerDisclosure) return null;

  const label = (entry: (typeof LABELS)[keyof typeof LABELS]) =>
    tOr(entry.key, entry.en, entry.nl);

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

  const choiceLabel = (declaration: CommerceDeclarationChoice) =>
    declaration === 'PRIVATE_OCCASIONAL'
      ? label(LABELS.private)
      : label(LABELS.professional);

  const persistDeclaration = async (declaration: CommerceDeclarationChoice) => {
    setDeclareError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/seller/commerce-declaration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ declaration }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeclareError(
          typeof data.error === 'string' ? data.error : label(LABELS.error),
        );
        return;
      }
      setPendingChoice(null);
      setOpen(false);
      onCommerceDeclared?.(declaration);
    } catch {
      setDeclareError(label(LABELS.error));
    } finally {
      setBusy(false);
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
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2.5"
          data-hc-inline-commerce-declaration=""
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">
              {label(LABELS.heading)}
            </p>
            <p className="text-xs text-gray-700 leading-relaxed">
              {label(LABELS.hint)}
            </p>
          </div>

          {pendingChoice ? (
            <div
              className="rounded-lg border border-gray-200 bg-white p-3 space-y-3"
              data-hc-inline-commerce-confirm=""
            >
              <p className="text-sm text-gray-900">
                <span className="font-medium">{label(LABELS.youSelected)}</span>{' '}
                <span className="font-semibold">{choiceLabel(pendingChoice)}</span>
              </p>
              {busy ? (
                <p
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  data-hc-inline-commerce-saving=""
                >
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  {label(LABELS.saving)}
                </p>
              ) : (
                <div className="flex flex-col xs:flex-row sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void persistDeclaration(pendingChoice)}
                    className="flex-1 min-h-[44px] rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                    data-hc-declare-confirm=""
                  >
                    {label(LABELS.confirm)}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setPendingChoice(null);
                      setDeclareError(null);
                    }}
                    className="flex-1 min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                    data-hc-declare-cancel=""
                  >
                    {label(LABELS.cancel)}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setDeclareError(null);
                  setPendingChoice('PRIVATE_OCCASIONAL');
                }}
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                data-hc-declare-private=""
              >
                <User className="h-4 w-4 shrink-0 text-gray-700" aria-hidden />
                <span>{label(LABELS.private)}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setDeclareError(null);
                  setPendingChoice('SELF_DECLARED_PROFESSIONAL');
                }}
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                data-hc-declare-professional=""
              >
                <Building2
                  className="h-4 w-4 shrink-0 text-gray-700"
                  aria-hidden
                />
                <span>{label(LABELS.professional)}</span>
              </button>
            </div>
          )}

          {declareError ? (
            <p className="text-xs font-medium text-red-700" role="alert">
              {declareError}
            </p>
          ) : null}

          <p className="text-[11px] text-gray-600">
            <Link href="/settings" className="text-emerald-800 underline">
              {label(LABELS.settingsLink)}
            </Link>
          </p>
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
