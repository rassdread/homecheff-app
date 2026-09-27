/**
 * Guardian-facing parental consent copy.
 *
 * The first email goes to a guardian whose language is unknown. It is one
 * bilingual message. A later message follows an explicit NL or EN choice.
 * The minor's language, name, email domain and country are not used.
 *
 * This is HomeCheff consent, not a Stripe identity check.
 */

export type GuardianLanguage = 'nl' | 'en';

/** Bump only when the substance of the guardian's authorisation changes. */
export const PARENTAL_CONSENT_VERSION = 'nl-minor-seller-2026-09-27-v2';
export const PARENTAL_CONSENT_TEXT_VERSION = PARENTAL_CONSENT_VERSION;

export type GuardianRelationship = 'mother' | 'father' | 'guardian' | 'other';

export const PARENTAL_CONSENT_SUBJECT = 'Toestemming voor HomeCheff / Consent for HomeCheff';

export const LEGAL_AUTHORITY_DECLARATION_NL =
  'Ik verklaar dat ik de ouder, voogd of andere wettelijk bevoegde vertegenwoordiger van deze minderjarige ben en bevoegd ben om deze toestemming te geven.';

export const LEGAL_AUTHORITY_DECLARATION_EN =
  'I declare that I am the parent, legal guardian, or other legally authorised representative of this minor and that I am authorised to provide this consent.';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function accountLabel(username: string | null | undefined, en: boolean): string {
  const handle = username?.trim();
  if (handle) return `@${handle.replace(/^@/, '')}`;
  return en ? 'a HomeCheff account' : 'een HomeCheff-account';
}

export function parentalConsentInviteCopy(params: {
  username?: string | null;
  link: string;
}): { subject: string; text: string; html: string } {
  const nlWho = accountLabel(params.username, false);
  const enWho = accountLabel(params.username, true);
  const link = params.link;
  const safeLink = escapeHtml(link);
  const text = [
    'Nederlands',
    '',
    `${nlWho} wil HomeCheff gebruiken als verkoper of aanbieder. HomeCheff vraagt daarvoor toestemming van een ouder of wettelijk vertegenwoordiger.`,
    '',
    'Open de beveiligde link. Je ziet daar eerst waarvoor je toestemming geeft. De link zelf zet betalingen nog niet aan.',
    '',
    'Ken je dit verzoek niet, dan kun je deze e-mail negeren. De link verloopt na 7 dagen.',
    '',
    'HomeCheff en de betaaldienst vragen nooit om een identiteitsbewijs door op deze e-mail te antwoorden.',
    '',
    link,
    '',
    'English',
    '',
    `${enWho} wants to use HomeCheff as a seller or provider. HomeCheff needs permission from a parent or legal representative for that.`,
    '',
    'Open the secure link. You will first see what you are being asked to approve. The link itself does not turn payments on.',
    '',
    'If you did not expect this request, you can ignore this email. The link expires after 7 days.',
    '',
    'HomeCheff and the payment provider will never ask you to send an identity document by replying to this email.',
    '',
    link,
  ].join('\n');

  const html = `
    <h2>Nederlands</h2>
    <p><strong>${escapeHtml(nlWho)}</strong> wil HomeCheff gebruiken als verkoper of aanbieder. HomeCheff vraagt daarvoor toestemming van een ouder of wettelijk vertegenwoordiger.</p>
    <p>Open de beveiligde link. Je ziet daar eerst waarvoor je toestemming geeft. De link zelf zet betalingen nog niet aan.</p>
    <p><a href="${safeLink}">Toestemming bekijken</a></p>
    <p>Ken je dit verzoek niet, dan kun je deze e-mail negeren. De link verloopt na 7 dagen.</p>
    <p>HomeCheff en de betaaldienst vragen nooit om een identiteitsbewijs door op deze e-mail te antwoorden.</p>
    <h2>English</h2>
    <p><strong>${escapeHtml(enWho)}</strong> wants to use HomeCheff as a seller or provider. HomeCheff needs permission from a parent or legal representative for that.</p>
    <p>Open the secure link. You will first see what you are being asked to approve. The link itself does not turn payments on.</p>
    <p><a href="${safeLink}">Review consent</a></p>
    <p>If you did not expect this request, you can ignore this email. The link expires after 7 days.</p>
    <p>HomeCheff and the payment provider will never ask you to send an identity document by replying to this email.</p>
  `.trim();

  return { subject: PARENTAL_CONSENT_SUBJECT, text, html };
}

function section(language: GuardianLanguage | 'both', nl: string, en: string): string {
  if (language === 'nl') return nl;
  if (language === 'en') return en;
  return `Nederlands\n\n${nl}\n\nEnglish\n\n${en}`;
}

export function parentalConsentAcceptedCopy(params: {
  language: GuardianLanguage | 'both';
  username?: string | null;
  revokeLink: string;
}): { subject: string; text: string; html: string } {
  const nlWho = accountLabel(params.username, false);
  const enWho = accountLabel(params.username, true);
  const nl = `Je toestemming voor ${nlWho} is vastgelegd. Bestaande bestellingen blijven staan. Nieuwe verkopen kun je later stoppen via: ${params.revokeLink}`;
  const en = `Your consent for ${enWho} is recorded. Existing orders stay in place. You can later stop new selling here: ${params.revokeLink}`;
  const text = section(params.language, nl, en);
  const subject =
    params.language === 'en'
      ? 'Consent recorded — HomeCheff'
      : params.language === 'nl'
        ? 'Toestemming vastgelegd — HomeCheff'
        : 'Toestemming vastgelegd / Consent recorded — HomeCheff';
  const safe = escapeHtml(params.revokeLink);
  const html =
    params.language === 'en'
      ? `<p>${escapeHtml(en).replace(escapeHtml(params.revokeLink), `<a href="${safe}">Withdraw consent</a>`)}</p>`
      : params.language === 'nl'
        ? `<p>${escapeHtml(nl).replace(escapeHtml(params.revokeLink), `<a href="${safe}">Toestemming intrekken</a>`)}</p>`
        : `<h2>Nederlands</h2><p>${escapeHtml(nl).replace(escapeHtml(params.revokeLink), `<a href="${safe}">Toestemming intrekken</a>`)}</p><h2>English</h2><p>${escapeHtml(en).replace(escapeHtml(params.revokeLink), `<a href="${safe}">Withdraw consent</a>`)}</p>`;
  return { subject, text, html };
}

export function parentalConsentRevokedCopy(params: {
  language: GuardianLanguage | 'both';
  username?: string | null;
}): { subject: string; text: string; html: string } {
  const nlWho = accountLabel(params.username, false);
  const enWho = accountLabel(params.username, true);
  const nl = `De toestemming voor ${nlWho} is ingetrokken. Nieuwe verkopen waarvoor deze toestemming nodig is, zijn gepauzeerd. Bestaande bestellingen en eerdere toestemmingsgegevens blijven bewaard.`;
  const en = `Consent for ${enWho} has been withdrawn. New selling that needs this consent is paused. Existing orders and earlier consent records stay in place.`;
  const subject =
    params.language === 'en'
      ? 'Consent withdrawn — HomeCheff'
      : params.language === 'nl'
        ? 'Toestemming ingetrokken — HomeCheff'
        : 'Toestemming ingetrokken / Consent withdrawn — HomeCheff';
  const text = section(params.language, nl, en);
  const html =
    params.language === 'both'
      ? `<h2>Nederlands</h2><p>${escapeHtml(nl)}</p><h2>English</h2><p>${escapeHtml(en)}</p>`
      : `<p>${escapeHtml(params.language === 'en' ? en : nl)}</p>`;
  return { subject, text, html };
}

export type ConsentPageCopy = {
  title: string;
  revokeTitle: string;
  homeCheff: string;
  wants: string;
  coversIntro: string;
  points: string[];
  stripeTitle: string;
  stripeBody: string;
  notClaims: string;
  delivery: string;
  withdraw: string;
  nameLabel: string;
  relationshipLabel: string;
  relationships: { value: 'mother' | 'father' | 'guardian' | 'other'; label: string }[];
  otherLabel: string;
  declaration: string;
  informed: string;
  submit: string;
  decline: string;
  declineDone: string;
  revokeBody: string;
  revokeSubmit: string;
  revokeConfirm: string;
  terms: string;
  privacy: string;
  versions: (terms: string, privacy: string, consent: string) => string;
};

const POINTS_NL = [
  'een HomeCheff-verkopersprofiel maken en gebruiken;',
  'producten en diensten aanbieden die HomeCheff voor die leeftijd toestaat;',
  'marktplaatstransacties via HomeCheff aangaan;',
  'betalingen ontvangen via de HomeCheff-betaalarchitectuur en een Stripe-account, alleen als Stripe dat account apart goedkeurt;',
  'dat HomeCheff de persoonsgegevens verwerkt die nodig zijn voor het account, de marktplaats, betalingen, veiligheid en naleving;',
  'berichten die nodig zijn voor bestellingen en het account;',
  'dat HomeCheff leeftijdsbeperkingen toepast en niet elke categorie of functie beschikbaar is;',
  'dat HomeCheff Bezorgen vanaf 18 jaar blijft;',
  'dat je deze toestemming later kunt intrekken.',
];

const POINTS_EN = [
  'creating and using a HomeCheff seller profile;',
  'offering products and services that HomeCheff permits for that age;',
  'entering into marketplace transactions through HomeCheff;',
  'receiving payments through the HomeCheff payment architecture and a Stripe account, only if Stripe separately approves that account;',
  'HomeCheff processing the personal information needed to operate the account, marketplace, payments, safety and compliance;',
  'messages needed for orders and the account;',
  'HomeCheff applying age restrictions, so not every category or feature is available;',
  'HomeCheff Delivery remaining available from age 18;',
  'being able to withdraw this consent later.',
];

export function parentalConsentPageCopy(language: GuardianLanguage): ConsentPageCopy {
  if (language === 'en') {
    return {
      title: 'Consent for HomeCheff',
      revokeTitle: 'Withdraw consent',
      homeCheff:
        'HomeCheff is a marketplace where people offer products and services from home.',
      wants:
        'This minor wants to take part as a seller or provider, only in the parts of HomeCheff that are allowed for their age.',
      coversIntro: 'You are being asked to consent to the following:',
      points: POINTS_EN,
      stripeTitle: 'HomeCheff consent and payment checks are separate',
      stripeBody:
        'Your consent authorises eligible participation in HomeCheff. Stripe separately decides whether the payment account meets its own checks. This consent does not replace that check.',
      notClaims:
        'This does not guarantee earnings, approval of the payment account, or payouts. It does not mean every commercial activity is automatically permitted.',
      delivery: 'HomeCheff Delivery stays available from age 18, including when this consent is in place.',
      withdraw: 'You can withdraw this consent later. Existing orders stay in place.',
      nameLabel: 'Your full name',
      relationshipLabel: 'Your relationship to this minor',
      relationships: [
        { value: 'mother', label: 'Mother' },
        { value: 'father', label: 'Father' },
        { value: 'guardian', label: 'Legal guardian' },
        { value: 'other', label: 'Other legal representative' },
      ],
      otherLabel: 'Describe the legal authority that allows you to give this consent.',
      declaration: LEGAL_AUTHORITY_DECLARATION_EN,
      informed: 'I have read what this consent covers and I give this consent.',
      submit: 'Give consent',
      decline: 'Do not give consent',
      declineDone: 'Nothing has been recorded. You can close this page.',
      revokeBody:
        'This pauses new selling that needs this consent. Existing orders stay in place. Earlier consent records are kept.',
      revokeSubmit: 'Withdraw consent',
      revokeConfirm: 'I want to withdraw this consent.',
      terms: 'Terms',
      privacy: 'Privacy policy',
      versions: (terms, privacy, consent) =>
        `This records consent text ${consent}, terms ${terms} and privacy policy ${privacy}.`,
    };
  }
  return {
    title: 'Toestemming voor HomeCheff',
    revokeTitle: 'Toestemming intrekken',
    homeCheff:
      'HomeCheff is een marktplaats waar mensen vanuit huis producten en diensten aanbieden.',
    wants:
      'Deze minderjarige wil meedoen als verkoper of aanbieder, alleen in de delen van HomeCheff die voor die leeftijd zijn toegestaan.',
    coversIntro: 'Je wordt gevraagd toestemming te geven voor het volgende:',
    points: POINTS_NL,
    stripeTitle: 'Toestemming voor HomeCheff en de betaalcontrole staan los van elkaar',
      stripeBody:
      'Met deze toestemming geef je toestemming voor toegestane deelname aan HomeCheff. Stripe beoordeelt apart of het betaalaccount aan de eigen controles voldoet. Deze toestemming vervangt die controle niet.',
    notClaims:
      'Dit garandeert geen inkomsten, geen goedkeuring van het betaalaccount en geen uitbetalingen. Het betekent ook niet dat elke commerciële activiteit automatisch is toegestaan.',
    delivery: 'HomeCheff Bezorgen blijft beschikbaar vanaf 18 jaar, ook als deze toestemming geldt.',
    withdraw: 'Je kunt deze toestemming later intrekken. Bestaande bestellingen blijven staan.',
    nameLabel: 'Je volledige naam',
    relationshipLabel: 'Je relatie tot deze minderjarige',
    relationships: [
      { value: 'mother', label: 'Moeder' },
      { value: 'father', label: 'Vader' },
      { value: 'guardian', label: 'Wettelijk voogd' },
      { value: 'other', label: 'Andere wettelijk bevoegde vertegenwoordiger' },
    ],
    otherLabel: 'Beschrijf waardoor je wettelijk bevoegd bent om deze toestemming te geven.',
    declaration: LEGAL_AUTHORITY_DECLARATION_NL,
    informed: 'Ik heb gelezen waar deze toestemming over gaat en ik geef deze toestemming.',
    submit: 'Toestemming geven',
    decline: 'Geen toestemming geven',
    declineDone: 'Er is niets vastgelegd. Je kunt deze pagina sluiten.',
    revokeBody:
      'Hiermee pauzeer je nieuwe verkopen waarvoor deze toestemming nodig is. Bestaande bestellingen blijven staan. Eerdere toestemmingsgegevens blijven bewaard.',
    revokeSubmit: 'Toestemming intrekken',
    revokeConfirm: 'Ik wil deze toestemming intrekken.',
    terms: 'Voorwaarden',
    privacy: 'Privacyverklaring',
    versions: (terms, privacy, consent) =>
      `Hierbij worden toestemmingstekst ${consent}, voorwaarden ${terms} en privacyverklaring ${privacy} vastgelegd.`,
  };
}
