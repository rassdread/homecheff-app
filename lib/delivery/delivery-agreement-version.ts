import { createHash } from 'node:crypto';
import { DELIVERY_AGREEMENT_DOCUMENT_ID } from '@/lib/delivery/delivery-agreement';

/**
 * Snapshot of the signup modal. Dutch is the source text.
 * This version splits occasional private insurance from business insurance.
 * It is not a legal opinion.
 */
export const DELIVERY_AGREEMENT_VERSION = 'delivery-agreement-2026-10-20';

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
  insurance: '4. Verantwoordelijkheid en verzekering',
  insurance1: 'Als particuliere bezorger bepaal je zelf wanneer en hoe vaak je een bezorgopdracht uitvoert. Je bent zelf verantwoordelijk voor een zorgvuldige en veilige uitvoering van de opdrachten die je accepteert.',
  insurance2: 'Voor incidentele particuliere bezorgingen stelt HomeCheff geen algemene verplichting om een zakelijke aansprakelijkheidsverzekering met €1.000.000 dekking of een afzonderlijke ongevallenverzekering te hebben. Je blijft verantwoordelijk voor het naleven van de wet- en regelgeving die op jouw activiteiten en vervoermiddel van toepassing is. Controleer zelf of eventuele verzekeringen dekking bieden voor de werkzaamheden die je uitvoert. Een particuliere verzekering dekt niet automatisch betaalde bezorgingen. Wanneer je regelmatig of beroepsmatig tegen betaling gaat bezorgen, kunnen aanvullende verplichtingen gelden, waaronder registratie- en verzekeringseisen. Je bent zelf verantwoordelijk voor het tijdig controleren en naleven van die verplichtingen.',
  insurance3: 'Als zakelijke of beroepsmatige bezorger ben je zelf verantwoordelijk voor een passende verzekering voor de bezorgactiviteiten die je uitvoert. Je moet een aansprakelijkheidsverzekering hebben met minimaal €1.000.000 dekking, een ongevallenverzekering, en een verzekering voor je vervoermiddel die past bij dat vervoermiddel en bij zakelijk gebruik. De dekking moet gelden voor de daadwerkelijke bezorgactiviteiten. Je moet de wet- en regelgeving volgen die op die activiteiten van toepassing is. Een KvK-nummer bewijst niet dat deze verzekeringen bestaan.',
  insurance4: 'HomeCheff vraagt bij aanmelding geen verzekeringsdocumenten en controleert die niet. Dat neemt je eigen verantwoordelijkheid niet weg.',
  taxes: '5. Belastingen',
  taxes1: 'Je bent geen werknemer van HomeCheff. Een incidentele particuliere bezorger is niet automatisch een zelfstandige ondernemer. Je blijft zelf verantwoordelijk voor de fiscale gevolgen van je activiteiten.',
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
  importantNoteText: 'HomeCheff is geen werkgever en biedt geen werknemersbescherming. Een particuliere bezorger is niet automatisch een zelfstandige ondernemer of een zakelijke bezorger. Wanneer je regelmatig of beroepsmatig bezorgt, kunnen aanvullende verplichtingen gelden.',
};

const EN: Record<(typeof MODAL_KEYS)[number], string> = {
  legalModalTitle: 'Delivery provider agreement',
  generalTerms: '1. General Terms',
  generalTermsText: 'By signing up as an independent delivery provider via HomeCheff, you accept the General Terms. These are available at',
  privacyPolicy: '2. Privacy Policy',
  privacyPolicyText: 'Your data is processed according to our Privacy Policy. This is available at',
  liability: '3. Liability',
  liability1: 'You are responsible for all damage during delivery',
  liability2: 'HomeCheff is not liable for damage to your property or persons',
  liability3: 'You are responsible for following all traffic rules',
  liability4: 'You are responsible for the safety or orders',
  insurance: '4. Responsibility and insurance',
  insurance1: 'As a private courier, you decide when and how often you carry out a delivery assignment. You are responsible for carrying out the assignments you accept carefully and safely.',
  insurance2: 'For occasional private deliveries, HomeCheff does not set a general requirement to hold business liability insurance with €1,000,000 cover or a separate accident policy. You remain responsible for following the laws and rules that apply to your activities and your vehicle. Check yourself whether any insurance covers the work you do. Private insurance does not automatically cover paid deliveries. If you start delivering regularly or professionally for payment, additional obligations may apply, including registration and insurance requirements. You are responsible for checking and meeting those obligations in time.',
  insurance3: 'As a business or professional courier, you are responsible for suitable insurance for the delivery activities you carry out. You must have liability insurance with at least €1,000,000 cover, accident insurance, and insurance for your vehicle that fits that vehicle and commercial use. The cover must apply to the actual delivery activities. You must follow the laws and rules that apply to those activities. A Chamber of Commerce number does not prove that this insurance exists.',
  insurance4: 'HomeCheff does not ask for insurance documents at registration and does not check them. That does not remove your own responsibility.',
  taxes: '5. Taxes',
  taxes1: 'You are not an employee of HomeCheff. An occasional private courier is not automatically a self-employed entrepreneur. You remain responsible for the tax consequences of your activities.',
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
  importantNoteText: 'HomeCheff is not an employer and does not provide employee protection. A private courier is not automatically a self-employed entrepreneur or a business courier. If you deliver regularly or professionally, additional obligations may apply.',
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
