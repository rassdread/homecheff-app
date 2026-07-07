'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { allowedSettlementModesForBarterOpenness } from '@/lib/marketplace/commerce/barter-commerce-alignment';
import {
  PROPOSAL_I18N,
  PROPOSAL_POLISH_I18N,
} from '@/lib/proposals/proposal-i18n-keys';
import { resolveProposalPrefill } from '@/lib/proposals/proposal-prefill';
import {
  formValuesToApiPayload,
  validateProposalReadiness,
} from '@/lib/proposals/proposal-readiness';
import {
  PROPOSAL_FLOW_EVENTS,
  trackProposalFlowEvent,
} from '@/lib/proposals/proposal-analytics';
import type { ProposalDTO } from '@/lib/proposals/proposal-types';
import ProposalFieldsSection from './ProposalFieldsSection';
import ProposalSummaryPreview from './ProposalSummaryPreview';

type Props = {
  proposal: ProposalDTO;
  onCancel: () => void;
  onCountered: (proposal: ProposalDTO) => void;
};

export default function CounterProposalForm({
  proposal,
  onCancel,
  onCountered,
}: Props) {
  const { t } = useTranslation();
  const prefill = useMemo(
    () =>
      resolveProposalPrefill({
        source: 'counter',
        parentProposal: proposal,
      }),
    [proposal],
  );
  const [form, setForm] = useState(prefill.form);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedSettlementModes = useMemo(() => {
    return allowedSettlementModesForBarterOpenness(null);
  }, []);

  const showPaymentPath =
    (form.settlementMode === 'MONEY' ||
      form.settlementMode === 'MONEY_AND_VALUE') &&
    Boolean(proposal.productId);

  const handleSubmit = async () => {
    setError(null);
    const readiness = validateProposalReadiness({
      form,
      isAuthenticated: true,
    });
    if (!readiness.ok) {
      setError(t(readiness.errorKey));
      return;
    }

    const payload = formValuesToApiPayload(form, {
      productId: proposal.productId,
      showPaymentPath,
    });

    setBusy(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const errKey =
          typeof data.error === 'string' && data.error.startsWith('proposal.')
            ? data.error
            : null;
        setError(errKey ? t(errKey) : data.error || t('common.error'));
        return;
      }
      trackProposalFlowEvent(PROPOSAL_FLOW_EVENTS.countered, {
        source: 'counter',
        listingId: proposal.productId,
        settlementType: form.settlementMode,
        proposalId: data.proposal?.id,
        surface: 'chat',
      });
      if (data.proposal) onCountered(data.proposal);
    } catch {
      setError(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-900">
        {t(PROPOSAL_POLISH_I18N.counter.heading)}
      </p>

      <ProposalFieldsSection
        form={form}
        onChange={setForm}
        allowedSettlementModes={allowedSettlementModes}
        idPrefix="counter-proposal"
      />

      <ProposalSummaryPreview form={form} offerLabel={form.title} showPaymentPath={showPaymentPath} />

      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSubmit()}
          className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            t(PROPOSAL_I18N.actions.sendCounter)
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
