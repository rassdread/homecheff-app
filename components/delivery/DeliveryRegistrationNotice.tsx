'use client';

import { DELIVERY_DELIVERER_PERCENT, DELIVERY_PLATFORM_FEE_PERCENT } from '@/lib/fees';
import { useTranslation } from '@/hooks/useTranslation';

/** Free signup and the existing 88/12 delivery split. Does not change settlement. */
export default function DeliveryRegistrationNotice() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto mt-2 w-full min-w-0 max-w-full space-y-1 px-1 text-center text-sm text-gray-700">
      <p className="font-semibold text-gray-900">
        {t('deliverySignup.freeSignup', {
          defaultValue: 'Aanmelden als bezorgpartner is gratis.',
        })}
      </p>
      <p className="break-words">
        {t('deliverySignup.commissionDisclosure', {
          deliverer: DELIVERY_DELIVERER_PERCENT,
          platform: DELIVERY_PLATFORM_FEE_PERCENT,
          defaultValue:
            'Van elke bezorgvergoeding gaat {deliverer}% naar de bezorger en {platform}% naar HomeCheff.',
        })}
      </p>
    </div>
  );
}
