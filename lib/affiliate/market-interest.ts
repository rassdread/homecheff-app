/**
 * New-country affiliate interest.
 * The database row is written first. Email is only a notification after that.
 */
import { decideAffiliateMarket, normalizeCountryCode } from '@/lib/affiliate/affiliate-markets';

export const AFFILIATE_MARKET_INTEREST_MAILBOX = 'partners@homecheff.eu';

export const OPEN_INTEREST_STATUSES = [
  'NEW',
  'CONTACTED',
  'REVIEWING',
  'PREPARING',
  'APPROVED',
  'ACTIVE',
] as const;

export type MarketInterestDraft = {
  name: string;
  email: string;
  countryCode: string;
  countryName: string;
  region: string | null;
  phone: string | null;
  languages: string | null;
  profileUrl: string | null;
  salesExperience: string | null;
  networkReach: string | null;
  wantsOwnCustomers: boolean | null;
  wantsNetwork: boolean | null;
  motivation: string | null;
  locale: 'nl' | 'en';
};

export type StoredMarketInterest = {
  id: string;
  email: string;
  countryCode: string;
  status: string;
};

export type MarketInterestStore = {
  findOpen(email: string, countryCode: string): Promise<StoredMarketInterest | null>;
  create(draft: MarketInterestDraft): Promise<StoredMarketInterest>;
};

export type MarketInterestMail = {
  to: string;
  subject: string;
  text: string;
};

export type MarketInterestMailer = {
  send(mail: MarketInterestMail): Promise<void>;
};

export type MarketInterestResult =
  | { ok: false; error: 'INVALID' }
  | { ok: false; error: 'SUPPORTED_COUNTRY' }
  | {
      ok: true;
      duplicate: boolean;
      id: string;
      persistedBeforeEmail: true;
      internalEmailAttempted: boolean;
      applicantEmailAttempted: boolean;
    };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clip(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function yesNo(value: boolean | null, locale: 'nl' | 'en'): string {
  if (value === null) return locale === 'en' ? 'not provided' : 'niet ingevuld';
  if (locale === 'en') return value ? 'yes' : 'no';
  return value ? 'ja' : 'nee';
}

export function parseMarketInterestBody(
  body: Record<string, unknown>,
  locale: 'nl' | 'en',
  countryName: string,
): MarketInterestDraft | null {
  const name = clip(body.name, 120);
  const emailRaw = clip(body.email, 180);
  const countryCode = normalizeCountryCode(
    typeof body.countryCode === 'string' ? body.countryCode : null,
  );
  if (!name || !emailRaw || !countryCode) return null;
  const email = emailRaw.toLowerCase();
  if (!EMAIL_RE.test(email)) return null;
  const wantsOwn =
    typeof body.wantsOwnCustomers === 'boolean' ? body.wantsOwnCustomers : null;
  const wantsNetwork = typeof body.wantsNetwork === 'boolean' ? body.wantsNetwork : null;
  return {
    name,
    email,
    countryCode,
    countryName,
    region: clip(body.region, 120),
    phone: clip(body.phone, 40),
    languages: clip(body.languages, 120),
    profileUrl: clip(body.profileUrl, 300),
    salesExperience: clip(body.salesExperience, 500),
    networkReach: clip(body.networkReach, 500),
    wantsOwnCustomers: wantsOwn,
    wantsNetwork,
    motivation: clip(body.motivation, 2000),
    locale,
  };
}

export function internalInterestEmail(draft: MarketInterestDraft, id: string): MarketInterestMail {
  const line = (label: string, value: string | null) => `${label}: ${value?.trim() || '—'}`;
  const text = [
    line('Naam', draft.name),
    line('E-mail', draft.email),
    line('Land', `${draft.countryName} (${draft.countryCode})`),
    line('Regio', draft.region),
    line('Telefoon', draft.phone),
    line('Talen', draft.languages),
    line('Profiel', draft.profileUrl),
    line('Saleservaring', draft.salesExperience),
    line('Netwerk/bereik', draft.networkReach),
    line('Zelf klanten werven', yesNo(draft.wantsOwnCustomers, 'nl')),
    line('Affiliate-netwerk bouwen', yesNo(draft.wantsNetwork, 'nl')),
    line('Motivatie', draft.motivation),
    '',
    `Aanvraag-id: ${id}`,
    'De aanvraag staat in de database. Dit bericht is alleen een melding.',
  ].join('\n');
  return {
    to: AFFILIATE_MARKET_INTEREST_MAILBOX,
    subject: `Nieuwe affiliate wil HomeCheff opbouwen in ${draft.countryName}`,
    text,
  };
}

export function applicantInterestEmail(draft: MarketInterestDraft): MarketInterestMail {
  if (draft.locale === 'en') {
    return {
      to: draft.email,
      subject: `Your request for HomeCheff in ${draft.countryName}`,
      text: [
        `Thanks for your interest in building HomeCheff in ${draft.countryName}.`,
        '',
        'HomeCheff is not fully active there yet. We will look at what is needed to support this market and contact you about the possibilities.',
        '',
        'Your request does not mean the country has already been activated.',
      ].join('\n'),
    };
  }
  return {
    to: draft.email,
    subject: `Je aanvraag voor HomeCheff in ${draft.countryName}`,
    text: [
      `Bedankt voor je interesse om HomeCheff in ${draft.countryName} op te bouwen.`,
      '',
      'HomeCheff is daar nog niet volledig actief. We bekijken welke onderdelen nodig zijn om deze markt te ondersteunen en nemen contact met je op over de mogelijkheden.',
      '',
      'Je aanvraag betekent nog niet dat het land al is geactiveerd.',
    ].join('\n'),
  };
}

export async function submitMarketInterest(input: {
  draft: MarketInterestDraft | null;
  store: MarketInterestStore;
  mailer: MarketInterestMailer;
}): Promise<MarketInterestResult> {
  const draft = input.draft;
  if (!draft) return { ok: false, error: 'INVALID' };
  if (decideAffiliateMarket(draft.countryCode) === 'SUPPORTED') {
    return { ok: false, error: 'SUPPORTED_COUNTRY' };
  }

  const existing = await input.store.findOpen(draft.email, draft.countryCode);
  if (existing) {
    return {
      ok: true,
      duplicate: true,
      id: existing.id,
      persistedBeforeEmail: true,
      internalEmailAttempted: false,
      applicantEmailAttempted: false,
    };
  }

  const created = await input.store.create(draft);
  let internalEmailAttempted = false;
  let applicantEmailAttempted = false;
  try {
    internalEmailAttempted = true;
    await input.mailer.send(internalInterestEmail(draft, created.id));
  } catch {
    internalEmailAttempted = true;
  }
  try {
    applicantEmailAttempted = true;
    await input.mailer.send(applicantInterestEmail(draft));
  } catch {
    applicantEmailAttempted = true;
  }
  return {
    ok: true,
    duplicate: false,
    id: created.id,
    persistedBeforeEmail: true,
    internalEmailAttempted,
    applicantEmailAttempted,
  };
}
