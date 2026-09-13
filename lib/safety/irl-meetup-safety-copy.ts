/**
 * Contextual IRL / meetup safety copy for barter, CONTACT, and proposals.
 * Soft guidance only — not age verification and not a global popup.
 */

export type IrlMeetupSafetyLocale = 'nl' | 'en';

export function irlMeetupSafetyCopy(locale: IrlMeetupSafetyLocale = 'nl'): {
  title: string;
  body: string;
} {
  if (locale === 'en') {
    return {
      title: 'Meet safely',
      body: 'Prefer a safe, public place when meeting. If you are a minor, make sure a parent or guardian knows about the meetup.',
    };
  }
  return {
    title: 'Spreek veilig af',
    body: 'Spreek bij voorkeur af op een veilige, openbare plek. Ben je minderjarig? Zorg dat een ouder of verzorger weet van de afspraak.',
  };
}
