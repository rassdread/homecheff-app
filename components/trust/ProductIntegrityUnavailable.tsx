'use client';

/**
 * TRUST-1 / TRUST-1.1 — listing temporarily hidden / removed.
 * Owners can submit clarification; they cannot self-restore visibility.
 */

import { useState } from 'react';
import SellerContributionSelector from '@/components/trust/SellerContributionSelector';
import {
  parseSellerContributionTypes,
  type SellerContributionType,
} from '@/lib/trust/seller-contribution';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  status: string;
  isOwner?: boolean;
  productId?: string;
  initialTypes?: string[] | null;
  initialNote?: string | null;
};

export default function ProductIntegrityUnavailable({
  status,
  isOwner,
  productId,
  initialTypes,
  initialNote,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SellerContributionType[]>(() =>
    parseSellerContributionTypes(initialTypes),
  );
  const [contribNote, setContribNote] = useState(initialNote?.trim() || '');
  const [clarification, setClarification] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canClarify =
    isOwner &&
    productId &&
    (status === 'REVIEW_REQUIRED' ||
      status === 'TEMPORARILY_HIDDEN' ||
      status === 'UNDER_REVIEW');

  const submitClarification = async () => {
    if (!productId || !clarification.trim()) {
      setMessage(t('trust.contribution.clarifyNoteRequired'));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/products/${productId}/integrity-clarify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: clarification.trim(),
          sellerContributionTypes: selected,
          sellerContributionNote: contribNote.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Versturen mislukt',
        );
      }
      setSubmitted(true);
      setOpen(false);
      setMessage(t('trust.contribution.clarifySubmitted'));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Fout');
    } finally {
      setBusy(false);
    }
  };

  if (isOwner) {
    return (
      <div
        data-hc-integrity-owner-banner=""
        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 space-y-3"
      >
        <div>
          <p className="font-medium">
            {t('trust.contribution.ownerHiddenTitle')}
          </p>
          <p className="mt-1">
            {t('trust.contribution.ownerHiddenBody')}
          </p>
        </div>
        {message ? (
          <p className="text-xs text-amber-900" role="status">
            {message}
          </p>
        ) : null}
        {canClarify && !submitted ? (
          <div className="space-y-2">
            {!open ? (
              <button
                type="button"
                data-hc-integrity-clarify-open=""
                onClick={() => setOpen(true)}
                className="rounded-lg bg-amber-800 px-3 py-2 text-xs font-semibold text-white touch-manipulation"
              >
                {t('trust.contribution.clarifyCta')}
              </button>
            ) : (
              <div
                data-hc-integrity-clarify-form=""
                className="space-y-3 rounded-lg border border-amber-200 bg-white/80 p-3"
              >
                <p className="text-xs text-amber-950 leading-relaxed">
                  {t('trust.contribution.clarifyPrompt')}
                </p>
                <SellerContributionSelector
                  selected={selected}
                  note={contribNote}
                  onChangeSelected={setSelected}
                  onChangeNote={setContribNote}
                  required
                  disabled={busy}
                />
                <div>
                  <label className="block text-xs font-medium text-amber-950 mb-1">
                    {t('trust.contribution.clarifyLabel')}
                  </label>
                  <textarea
                    data-hc-integrity-clarify-note=""
                    value={clarification}
                    disabled={busy}
                    rows={3}
                    maxLength={500}
                    onChange={(e) => setClarification(e.target.value)}
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm"
                    placeholder={t('trust.contribution.clarifyPlaceholder')}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-hc-integrity-clarify-submit=""
                    disabled={busy}
                    onClick={() => void submitClarification()}
                    className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 touch-manipulation"
                  >
                    {busy
                      ? t('trust.contribution.clarifySending')
                      : t('trust.contribution.clarifySubmit')}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-medium text-amber-900 disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
                <p className="text-[10px] text-amber-800">
                  {t('trust.contribution.noSelfRestore')}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  const removed = status === 'REMOVED';
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
      <p className="font-medium">
        {removed
          ? 'Dit aanbod is niet beschikbaar'
          : 'Dit aanbod is tijdelijk niet beschikbaar'}
      </p>
      <p className="mt-1 text-gray-600">
        Het staat momenteel niet in de marketplace terwijl HomeCheff het bekijkt.
      </p>
    </div>
  );
}
