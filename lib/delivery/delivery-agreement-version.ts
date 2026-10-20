import { createHash } from 'node:crypto';
import { DELIVERY_AGREEMENT_DOCUMENT_ID } from '@/lib/delivery/delivery-agreement';

/** Snapshot of the existing signup modal. Not a new legal text and not legal approval. */
export const DELIVERY_AGREEMENT_VERSION = 'delivery-agreement-2026-10-18';

const MODAL_KEYS = [
  'legalModalTitle',
  'generalTerms',
  'generalTermsText',
  'privacyPolicy',
  'privacyPolicyText',
  'liability',
  'liability1',
  'liability2',
  'liability3',
  'liability4',
  'insurance',
  'insurance1',
  'insurance2',
  'insurance3',
  'insurance4',
  'taxes',
  'taxes1',
  'taxes2',
  'taxes3',
  'taxes4',
  'taxes5',
  'platformRules',
  'platformRules1',
  'platformRules2',
  'platformRules3',
  'platformRules4',
  'platformRules5',
  'importantNote',
  'importantNoteText',
] as const;

const NL: Record<(typeof MODAL_KEYS)[number], string> = {
  legalModalTitle: 'Bezorgaanbieder-overeenkomst',
  generalTerms: '1. Algemene Voorwaarden',
  generalTermsText: 'Door je aan te melden als zelfstandige bezorgaanbieder via HomeCheff, accepteer je de Algemene Voorwaarden. Deze zijn beschikbaar op',
  privacyPolicy: '2. Privacy Policy',
  privacyPolicyText: 'Je gegevens worden verwerkt volgens onze Privacy Policy. Deze is beschikbaar op',
  liability: '3. Aansprakelijkheid',
  liability1: 'Je bent zelf verantwoordelijk voor alle schade tijdens bezorging',
  liability2: 'HomeCheff is niet aansprakelijk voor schade aan jouw eigendommen of personen',
  liability3: 'Je bent verantwoordelijk voor het volgen van alle verkeersregels',
  liability4: 'Je bent verantwoordelijk voor de veiligheid van de bestellingen',
  insurance: '4. Verzekeringen',
  insurance1: 'Je moet een aansprakelijkheidsverzekering hebben (minimaal €1.000.000 dekking)',
  insurance2: 'Je moet een ongevallenverzekering hebben',
  insurance3: 'Je moet je vervoermiddel verzekerd hebben',
  insurance4: 'Je bent zelf verantwoordelijk voor het controleren van je verzekeringsdekking',
  taxes: '5. Belastingen',
  taxes1: 'Je bent zelfstandige ondernemer, geen werknemer van HomeCheff',
  taxes2: 'Je bent zelf verantwoordelijk voor het opgeven van je inkomsten bij de Belastingdienst',
  taxes3: 'Je moet je eigen administratie bijhouden',
  taxes4: 'Je bent zelf verantwoordelijk voor het betalen van belastingen',
  taxes5: 'Raadpleeg een belastingadviseur voor specifieke vragen',
  platformRules: '6. Platform Regels',
  platformRules1: 'Je moet je houden aan alle platform regels en richtlijnen',
  platformRules2: 'Je moet professioneel gedrag vertonen naar klanten',
  platformRules3: 'Je moet bestellingen op tijd en veilig bezorgen',
  platformRules4: 'Je mag geen misbruik maken van het platform',
  platformRules5: 'HomeCheff behoudt zich het recht voor om je account te deactiveren bij overtredingen',
  importantNote: '⚠️ Belangrijke Opmerking',
  importantNoteText: 'Als bezorger ben je een zelfstandige ondernemer. HomeCheff is geen werkgever en biedt geen werknemersbescherming. Zorg ervoor dat je alle juridische en praktische aspecten van zelfstandig ondernemerschap begrijpt voordat je begint.',
};

const EN: Record<(typeof MODAL_KEYS)[number], string> = {
  legalModalTitle: 'Delivery Ambassador Agreement',
  generalTerms: '1. General Terms',
  generalTermsText: 'By signing up as an independent delivery provider via HomeCheff, you accept the General Terms. These are available at',
  privacyPolicy: '2. Privacy Policy',
  privacyPolicyText: 'Your data is processed according to our Privacy Policy. This is available at',
  liability: '3. Liability',
  liability1: 'You are responsible for all damage during delivery',
  liability2: 'HomeCheff is not liable for damage to your property or persons',
  liability3: 'You are responsible for following all traffic rules',
  liability4: 'You are responsible for the safety or orders',
  insurance: '4. Insurance',
  insurance1: 'You must have liability insurance (minimum €1,000,000 caboutage)',
  insurance2: 'You must have accident insurance',
  insurance3: 'You must have your vehicle insured',
  insurance4: 'You are responsible for checking your insurance caboutage',
  taxes: '5. Taxes',
  taxes1: 'You are a self-employed entrepreneur, not an employee or HomeCheff',
  taxes2: 'You are responsible for reporting your income to the tax authorities',
  taxes3: 'You must maintain your own administration',
  taxes4: 'You are responsible for paying taxes',
  taxes5: 'Consult a tax advisor for specific questions',
  platformRules: '6. Platform Rules',
  platformRules1: 'You must comply with all platform rules and guidelines',
  platformRules2: 'You must behave professionally towards customers',
  platformRules3: 'You must deliver orders on time and safely',
  platformRules4: 'You may not abuse the platform',
  platformRules5: 'HomeCheff reserves the right to deactivate your account for violations',
  importantNote: '⚠️ Important Note',
  importantNoteText: 'As a deliverer, you are a self-employed entrepreneur. HomeCheff is not an employer and does not provide employee protection. Make sure you understand all legal and practical aspects or self-employment before you start.',
};

export type AgreementLanguage = 'nl' | 'en';

export function agreementSnapshot(language: AgreementLanguage) {
  return language === 'en' ? EN : NL;
}

export function agreementContentHash(language: AgreementLanguage) {
  return createHash('sha256').update(JSON.stringify(agreementSnapshot(language))).digest('hex');
}

export function agreementAcceptanceRow(input: {
  deliveryProfileId: string;
  userId: string;
  language?: AgreementLanguage;
  acceptedAt?: Date;
}) {
  const language = input.language ?? 'nl';
  return {
    deliveryProfileId: input.deliveryProfileId,
    userId: input.userId,
    version: DELIVERY_AGREEMENT_VERSION,
    contentHash: agreementContentHash(language),
    language,
    documentId: DELIVERY_AGREEMENT_DOCUMENT_ID,
    acceptedAt: input.acceptedAt ?? new Date(),
  };
}

export function acceptanceMatchesCurrent(row: { version: string; contentHash: string; language: string } | null) {
  if (!row) return false;
  const language: AgreementLanguage = row.language === 'en' ? 'en' : 'nl';
  return row.version === DELIVERY_AGREEMENT_VERSION && row.contentHash === agreementContentHash(language);
}

/**
 * A profile timestamp is not a versioned acceptance.
 * A matching version row is not written again.
 * An explicit accept may add the missing version row without moving an existing timestamp.
 */
export function decideDashboardAgreementWrite(input: {
  profileAcceptedAt: Date | null;
  existing: { version: string; contentHash: string; language: string } | null;
}) {
  const versionMatches = acceptanceMatchesCurrent(input.existing);
  return {
    writeProfileTimestamp: input.profileAcceptedAt == null,
    writeVersionRow: !versionMatches,
    unchanged: input.profileAcceptedAt != null && versionMatches,
  };
}
