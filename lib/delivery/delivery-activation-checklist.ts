/**
 * Post-registration steps that use the existing activation gate.
 * Only missing steps are returned. Going online is shown after the gate
 * passes and the courier is still offline. Stripe is not part of this list.
 */
import { DELIVERY_AGE_STEP_HREF, DELIVERY_SETTINGS_HREF } from '@/lib/delivery/delivery-profile-completion';

export type DeliveryActivationChecklistId =
  | 'dateOfBirth'
  | 'pricing'
  | 'serviceArea'
  | 'availability'
  | 'companyDisplayName'
  | 'goOnline';

export type DeliveryActivationChecklistItem = {
  id: DeliveryActivationChecklistId;
  labelNl: string;
  labelEn: string;
  href: string;
};

const ORDER: DeliveryActivationChecklistId[] = [
  'dateOfBirth',
  'pricing',
  'serviceArea',
  'availability',
  'companyDisplayName',
  'goOnline',
];

export function buildDeliveryActivationChecklist(input: {
  missing: string[];
  eligible: boolean;
  isOnline: boolean;
}): DeliveryActivationChecklistItem[] {
  const missing = new Set(input.missing);
  const items: DeliveryActivationChecklistItem[] = [];

  if (missing.has('under18')) {
    items.push({
      id: 'dateOfBirth',
      labelNl: 'Bezorging via HomeCheff is beschikbaar vanaf 18 jaar',
      labelEn: 'Delivery via HomeCheff is available from age 18',
      href: DELIVERY_AGE_STEP_HREF,
    });
  } else if (missing.has('dateOfBirth')) {
    items.push({
      id: 'dateOfBirth',
      labelNl: 'Bevestig je geboortedatum',
      labelEn: 'Confirm your date of birth',
      href: DELIVERY_AGE_STEP_HREF,
    });
  }

  if (missing.has('pricing')) {
    items.push({
      id: 'pricing',
      labelNl: 'Stel je bezorgtarief in',
      labelEn: 'Configure your delivery pricing',
      href: `${DELIVERY_SETTINGS_HREF}#bezorgtarief`,
    });
  }

  if (missing.has('serviceArea')) {
    items.push({
      id: 'serviceArea',
      labelNl: 'Bevestig je bezorggebied',
      labelEn: 'Confirm your delivery area',
      href: `${DELIVERY_SETTINGS_HREF}#werkgebied`,
    });
  }

  if (missing.has('availability')) {
    items.push({
      id: 'availability',
      labelNl: 'Stel je beschikbaarheid in',
      labelEn: 'Set your availability',
      href: `${DELIVERY_SETTINGS_HREF}#beschikbaarheid`,
    });
  }

  if (missing.has('companyDisplayName')) {
    items.push({
      id: 'companyDisplayName',
      labelNl: 'Vul een bedrijfsnaam in',
      labelEn: 'Enter the company name',
      href: DELIVERY_SETTINGS_HREF,
    });
  }

  if (input.eligible && !input.isOnline && items.length === 0) {
    items.push({
      id: 'goOnline',
      labelNl: 'Ga online wanneer je opdrachten wilt ontvangen',
      labelEn: 'Go online when you want to receive assignments',
      href: '/delivery/dashboard?goOnline=1',
    });
  }

  return items.sort(
    (a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id),
  );
}
