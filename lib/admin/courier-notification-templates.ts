import type { CourierTemplateId } from '@/lib/admin/courier-notification-segments';
import { SAFETY_SUPPORT_EMAIL } from '@/lib/legal/policy-urls';

export type CourierEmailTemplate = {
  id: CourierTemplateId;
  subject: string;
  message: string;
  promotional: boolean;
};

const SETTINGS_URL = 'https://homecheff.eu/delivery/settings';
const DASHBOARD_URL = 'https://homecheff.eu/delivery/dashboard';

export const COURIER_EMAIL_TEMPLATES: readonly CourierEmailTemplate[] = [
  {
    id: 'COURIER_AGREEMENT_REMINDER',
    promotional: false,
    subject: 'Accepteer de bezorgerovereenkomst',
    message: [
      'HomeCheff Delivery wordt voorbereid. Bezorgingen zijn nog niet openbaar beschikbaar.',
      'Dit bericht kent geen ritten toe en belooft geen inkomsten.',
      '',
      'Log in en open je bezorgdashboard. Lees daar de huidige bezorgerovereenkomst en accepteer die alleen als je akkoord bent. Zonder die acceptatie kun je geen bezorgopdrachten ontvangen.',
      '',
      `Dashboard: ${DASHBOARD_URL}`,
      `Profiel en beschikbaarheid: ${SETTINGS_URL}`,
    ].join('\n'),
  },
  {
    id: 'COURIER_STRIPE_ONBOARDING',
    promotional: false,
    subject: 'Rond Stripe Connect af voor bezorgvergoedingen',
    message: [
      'Om een vergoeding voor een HomeCheff-bezorging te kunnen ontvangen, moet Stripe Connect afgerond zijn. HomeCheff bewaart geen identiteitsdocument.',
      '',
      'Log in en open de bestaande Stripe-stappen in je bezorginstellingen. HomeCheff Delivery is nog niet openbaar beschikbaar, en dit bericht betekent niet dat er al opdrachten klaarstaan.',
      '',
      `Bezorginstellingen: ${SETTINGS_URL}`,
    ].join('\n'),
  },
  {
    id: 'COURIER_PROFILE_COMPLETION',
    promotional: false,
    subject: 'Maak je bezorgprofiel af',
    message: [
      'Je HomeCheff-bezorgprofiel mist nog gegevens die nodig zijn voordat je opdrachten kunt ontvangen.',
      '',
      'Log in en controleer je leeftijd, vervoermiddel, werkgebied en beschikbaarheid. HomeCheff Delivery is nog niet openbaar beschikbaar, en dit bericht kent geen ritten toe.',
      '',
      `Bezorginstellingen: ${SETTINGS_URL}`,
    ].join('\n'),
  },
  {
    id: 'COURIER_PILOT_INVITATION',
    promotional: false,
    subject: 'Uitnodiging voor een gecontroleerde bezorgtest',
    message: [
      'HomeCheff bereidt een gecontroleerde test van Delivery voor. Delivery is nog niet openbaar beschikbaar. Dit is geen toezegging van ritten of inkomsten.',
      '',
      'Log in en controleer je overeenkomst, Stripe Connect en je bezorgprofiel. Alleen dan kun je worden meegenomen in een latere test, als de eigenaar die apart goedkeurt.',
      '',
      `Dashboard: ${DASHBOARD_URL}`,
    ].join('\n'),
  },
  {
    id: 'COURIER_REACTIVATION',
    promotional: true,
    subject: 'Je bezorgprofiel staat nog inactief',
    message: [
      'Je HomeCheff-bezorgprofiel staat inactief. Als je weer beschikbaar wilt zijn, log dan in en zet je profiel aan nadat je overeenkomst, Stripe Connect en beschikbaarheid kloppen.',
      '',
      'HomeCheff Delivery is nog niet openbaar beschikbaar. Dit bericht kent geen ritten of inkomsten toe.',
      '',
      `Bezorginstellingen: ${SETTINGS_URL}`,
      '',
      `Je ontvangt dit omdat je marketingberichten van HomeCheff hebt geaccepteerd. Wil je ze niet meer, mail dan ${SAFETY_SUPPORT_EMAIL} met het onderwerp Uitschrijven.`,
    ].join('\n'),
  },
];

export function getCourierEmailTemplate(id: CourierTemplateId): CourierEmailTemplate {
  const found = COURIER_EMAIL_TEMPLATES.find((template) => template.id === id);
  if (!found) throw new Error('Unknown courier template');
  return found;
}

export function courierTemplateIsPromotional(id: CourierTemplateId | null): boolean {
  if (!id) return false;
  return getCourierEmailTemplate(id).promotional;
}
