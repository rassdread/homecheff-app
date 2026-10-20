'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Shared courier agreement. Private and business insurance duties are separate sections.
 * Closing it does not accept the agreement.
 */
export default function DeliveryAgreementModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{t('deliverySignup.legalModalTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
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

        <div className="flex justify-end p-6 border-t">
          <Button type="button" onClick={onClose}>
            {t('deliverySignup.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
