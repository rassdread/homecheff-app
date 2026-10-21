'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Shared courier agreement. Private and business insurance duties are separate sections.
 * Closing it does not accept the agreement.
 *
 * Signup pages use overflow-x-clip, which traps a nested z-index below the sticky
 * header (z-[100]). Portaling to document.body uses the same layer as other
 * Marketplace dialogs that must clear that header.
 */
export default function DeliveryAgreementModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-x-0 top-0 z-[110] flex items-center justify-center bg-black bg-opacity-50 p-3 sm:p-4"
      style={{ bottom: 'var(--hc-cookie-banner-offset, 0px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-agreement-title"
    >
      <div className="flex max-h-full min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="delivery-agreement-title" className="text-lg font-bold text-gray-900 sm:text-xl">
            {t('deliverySignup.legalModalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 text-gray-400 hover:text-gray-600"
            aria-label={t('deliverySignup.close')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-6 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.generalTerms')}</h3>
              <p className="mb-3">
                {t('deliverySignup.generalTermsText')} <a href="/terms" target="_blank" className="text-primary-brand hover:underline">/terms</a>.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.privacyPolicy')}</h3>
              <p className="mb-3">
                {t('deliverySignup.privacyPolicyText')} <a href="/privacy" target="_blank" className="text-primary-brand hover:underline">/privacy</a>.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.liability')}</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('deliverySignup.liability1')}</li>
                <li>{t('deliverySignup.liability2')}</li>
                <li>{t('deliverySignup.liability3')}</li>
                <li>{t('deliverySignup.liability4')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.insurance')}</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('deliverySignup.insurance1')}</li>
                <li>{t('deliverySignup.insurance2')}</li>
                <li>{t('deliverySignup.insurance3')}</li>
                <li>{t('deliverySignup.insurance4')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.taxes')}</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('deliverySignup.taxes1')}</li>
                <li>{t('deliverySignup.taxes2')}</li>
                <li>{t('deliverySignup.taxes3')}</li>
                <li>{t('deliverySignup.taxes4')}</li>
                <li>{t('deliverySignup.taxes5')}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.platformRules')}</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('deliverySignup.platformRules1')}</li>
                <li>{t('deliverySignup.platformRules2')}</li>
                <li>{t('deliverySignup.platformRules3')}</li>
                <li>{t('deliverySignup.platformRules4')}</li>
                <li>{t('deliverySignup.platformRules5')}</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">{t('deliverySignup.importantNote')}</h4>
              <p className="text-yellow-800">
                {t('deliverySignup.importantNoteText')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t px-4 py-3 sm:px-6 sm:py-4">
          <Button type="button" onClick={onClose}>
            {t('deliverySignup.close')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
