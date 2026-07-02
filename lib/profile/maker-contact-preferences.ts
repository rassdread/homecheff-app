/**
 * Maker contact preferences — opslag, validatie en publieke zichtbaarheid.
 * Fase 2A: opt-in only. Fase 3A/3B: premium-gating via evaluateContactFeature().
 *
 * Contactveld-waarheid: docs/HOMECHEFF_REGISTRATION_AND_CONTACT.md
 * Privé: User.phoneNumber | Publiek: public* + enabled flags | Legacy: DynamicSeller.contact*
 */

import {
  CONTACT_PREMIUM_GATING_OFF,
  isExternalContactPremiumLocked,
  type ContactPremiumAvailability,
} from '@/lib/profile/contact-premium-availability';

export type MakerContactFieldKey =
  | 'phone'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'website'
  | 'telegram';

export type MakerContactDbFields = {
  publicPhoneEnabled: boolean;
  publicPhoneNumber: string | null;
  publicWhatsappEnabled: boolean;
  publicWhatsappNumber: string | null;
  publicInstagramEnabled: boolean;
  instagramUrl: string | null;
  publicFacebookEnabled: boolean;
  facebookUrl: string | null;
  publicTikTokEnabled: boolean;
  tiktokUrl: string | null;
  publicWebsiteEnabled: boolean;
  websiteUrl: string | null;
  publicTelegramEnabled: boolean;
  telegramUrl: string | null;
};

export type MakerContactSettingsDraft = {
  publicPhoneEnabled: boolean;
  publicPhoneNumber: string;
  publicWhatsappEnabled: boolean;
  publicWhatsappNumber: string;
  publicInstagramEnabled: boolean;
  instagramUrl: string;
  publicFacebookEnabled: boolean;
  facebookUrl: string;
  publicTikTokEnabled: boolean;
  tiktokUrl: string;
  publicWebsiteEnabled: boolean;
  websiteUrl: string;
  publicTelegramEnabled: boolean;
  telegramUrl: string;
};

export const EMPTY_MAKER_CONTACT_SETTINGS: MakerContactSettingsDraft = {
  publicPhoneEnabled: false,
  publicPhoneNumber: '',
  publicWhatsappEnabled: false,
  publicWhatsappNumber: '',
  publicInstagramEnabled: false,
  instagramUrl: '',
  publicFacebookEnabled: false,
  facebookUrl: '',
  publicTikTokEnabled: false,
  tiktokUrl: '',
  publicWebsiteEnabled: false,
  websiteUrl: '',
  publicTelegramEnabled: false,
  telegramUrl: '',
};

export type ContactFeatureState = {
  configured: boolean;
  enabled: boolean;
  visible: boolean;
  /** True wanneer gating betrouwbaar + actief is en maker geen premium heeft. */
  premiumLocked: boolean;
};

export type ContactFeatureOptions = {
  premium?: ContactPremiumAvailability;
};

export type PublicContactChannelId =
  | 'chat'
  | 'phone'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'website'
  | 'telegram';

export type PublicContactChannel = {
  id: PublicContactChannelId;
  href: string;
  /** Weergave voor telefoon (optioneel) */
  display?: string;
};

const BLOCKED_URL_PROTOCOLS = /^(javascript|data|vbscript):/i;

/** Strip en normaliseer telefoon voor opslag (E.164-achtig, behoud leading +). */
export function normalizePhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return hasPlus ? `+${digits}` : digits;
}

/** WhatsApp wa.me — alleen cijfers, geen leading + in pad. */
export function whatsappWaMeUrl(normalizedPhone: string): string {
  const digits = normalizedPhone.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}`;
}

function ensureHttpsUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (BLOCKED_URL_PROTOCOLS.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

/** Normaliseer social/website URLs veilig. */
export function normalizeSocialUrl(
  field: Exclude<MakerContactFieldKey, 'phone' | 'whatsapp'>,
  raw: string,
): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (BLOCKED_URL_PROTOCOLS.test(trimmed)) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const handle = trimmed.replace(/^@/, '').replace(/\s/g, '');

  switch (field) {
    case 'instagram':
      if (trimmed.includes('instagram.com')) return ensureHttpsUrl(trimmed);
      return `https://instagram.com/${handle}`;
    case 'facebook':
      if (trimmed.includes('facebook.com') || trimmed.includes('fb.com')) {
        return ensureHttpsUrl(trimmed);
      }
      return `https://facebook.com/${handle}`;
    case 'tiktok':
      if (trimmed.includes('tiktok.com')) return ensureHttpsUrl(trimmed);
      return `https://tiktok.com/@${handle.replace(/^@/, '')}`;
    case 'telegram':
      if (trimmed.includes('t.me') || trimmed.includes('telegram.')) {
        return ensureHttpsUrl(trimmed);
      }
      return `https://t.me/${handle}`;
    case 'website':
      return ensureHttpsUrl(trimmed);
    default:
      return ensureHttpsUrl(trimmed);
  }
}

export type ContactValidationErrorKey =
  | 'phoneInvalid'
  | 'whatsappInvalid'
  | 'instagramInvalid'
  | 'facebookInvalid'
  | 'tiktokInvalid'
  | 'websiteInvalid'
  | 'telegramInvalid'
  | 'enabledWithoutValue';

export type ContactValidationResult =
  | { ok: true; data: MakerContactDbFields }
  | { ok: false; errors: Partial<Record<MakerContactFieldKey | 'general', ContactValidationErrorKey>> };

function isValidPhone(normalized: string): boolean {
  const digits = normalized.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

function isValidHttpUrl(url: string): boolean {
  if (!url || BLOCKED_URL_PROTOCOLS.test(url)) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function draftFromDb(user: Partial<MakerContactDbFields>): MakerContactSettingsDraft {
  return {
    publicPhoneEnabled: user.publicPhoneEnabled ?? false,
    publicPhoneNumber: user.publicPhoneNumber ?? '',
    publicWhatsappEnabled: user.publicWhatsappEnabled ?? false,
    publicWhatsappNumber: user.publicWhatsappNumber ?? '',
    publicInstagramEnabled: user.publicInstagramEnabled ?? false,
    instagramUrl: user.instagramUrl ?? '',
    publicFacebookEnabled: user.publicFacebookEnabled ?? false,
    facebookUrl: user.facebookUrl ?? '',
    publicTikTokEnabled: user.publicTikTokEnabled ?? false,
    tiktokUrl: user.tiktokUrl ?? '',
    publicWebsiteEnabled: user.publicWebsiteEnabled ?? false,
    websiteUrl: user.websiteUrl ?? '',
    publicTelegramEnabled: user.publicTelegramEnabled ?? false,
    telegramUrl: user.telegramUrl ?? '',
  };
}

export function validateContactSettings(input: MakerContactSettingsDraft): ContactValidationResult {
  const errors: Partial<Record<MakerContactFieldKey | 'general', ContactValidationErrorKey>> = {};

  const phone = normalizePhoneNumber(input.publicPhoneNumber);
  if (input.publicPhoneEnabled) {
    if (!phone || !isValidPhone(phone)) errors.phone = 'phoneInvalid';
  }

  const whatsapp = normalizePhoneNumber(input.publicWhatsappNumber);
  if (input.publicWhatsappEnabled) {
    if (!whatsapp || !isValidPhone(whatsapp)) errors.whatsapp = 'whatsappInvalid';
  }

  const instagram = input.publicInstagramEnabled
    ? normalizeSocialUrl('instagram', input.instagramUrl)
    : '';
  if (input.publicInstagramEnabled && !isValidHttpUrl(instagram)) {
    errors.instagram = 'instagramInvalid';
  }

  const facebook = input.publicFacebookEnabled
    ? normalizeSocialUrl('facebook', input.facebookUrl)
    : '';
  if (input.publicFacebookEnabled && !isValidHttpUrl(facebook)) {
    errors.facebook = 'facebookInvalid';
  }

  const tiktok = input.publicTikTokEnabled
    ? normalizeSocialUrl('tiktok', input.tiktokUrl)
    : '';
  if (input.publicTikTokEnabled && !isValidHttpUrl(tiktok)) {
    errors.tiktok = 'tiktokInvalid';
  }

  const website = input.publicWebsiteEnabled
    ? normalizeSocialUrl('website', input.websiteUrl)
    : '';
  if (input.publicWebsiteEnabled && !isValidHttpUrl(website)) {
    errors.website = 'websiteInvalid';
  }

  const telegram = input.publicTelegramEnabled
    ? normalizeSocialUrl('telegram', input.telegramUrl)
    : '';
  if (input.publicTelegramEnabled && !isValidHttpUrl(telegram)) {
    errors.telegram = 'telegramInvalid';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      publicPhoneEnabled: input.publicPhoneEnabled && !!phone,
      publicPhoneNumber: input.publicPhoneEnabled && phone ? phone : null,
      publicWhatsappEnabled: input.publicWhatsappEnabled && !!whatsapp,
      publicWhatsappNumber: input.publicWhatsappEnabled && whatsapp ? whatsapp : null,
      publicInstagramEnabled: input.publicInstagramEnabled && !!instagram,
      instagramUrl: input.publicInstagramEnabled && instagram ? instagram : null,
      publicFacebookEnabled: input.publicFacebookEnabled && !!facebook,
      facebookUrl: input.publicFacebookEnabled && facebook ? facebook : null,
      publicTikTokEnabled: input.publicTikTokEnabled && !!tiktok,
      tiktokUrl: input.publicTikTokEnabled && tiktok ? tiktok : null,
      publicWebsiteEnabled: input.publicWebsiteEnabled && !!website,
      websiteUrl: input.publicWebsiteEnabled && website ? website : null,
      publicTelegramEnabled: input.publicTelegramEnabled && !!telegram,
      telegramUrl: input.publicTelegramEnabled && telegram ? telegram : null,
    },
  };
}

/** HomeCheff chat — altijd gratis en zichtbaar. */
export function evaluateChatContactFeature(): ContactFeatureState {
  return {
    configured: true,
    enabled: true,
    visible: true,
    premiumLocked: false,
  };
}

/** Premium + opt-in + waarde — centrale zichtbaarheidslogica per extern kanaal. */
export function evaluateContactFeature(
  field: MakerContactFieldKey,
  db: Partial<MakerContactDbFields>,
  options?: ContactFeatureOptions,
): ContactFeatureState {
  const premium = options?.premium ?? CONTACT_PREMIUM_GATING_OFF;

  const valueMap: Record<MakerContactFieldKey, { enabled: boolean; value: string | null | undefined }> = {
    phone: { enabled: !!db.publicPhoneEnabled, value: db.publicPhoneNumber },
    whatsapp: { enabled: !!db.publicWhatsappEnabled, value: db.publicWhatsappNumber },
    instagram: { enabled: !!db.publicInstagramEnabled, value: db.instagramUrl },
    facebook: { enabled: !!db.publicFacebookEnabled, value: db.facebookUrl },
    tiktok: { enabled: !!db.publicTikTokEnabled, value: db.tiktokUrl },
    website: { enabled: !!db.publicWebsiteEnabled, value: db.websiteUrl },
    telegram: { enabled: !!db.publicTelegramEnabled, value: db.telegramUrl },
  };
  const { enabled, value } = valueMap[field];
  const configured = Boolean(value?.trim());
  const premiumLocked = isExternalContactPremiumLocked(premium);
  const visible = enabled && configured && !premiumLocked;
  return { configured, enabled, visible, premiumLocked };
}

/** Alle externe kanalen — o.a. voor settings-preview (eigen profiel). */
export function evaluateAllContactFeatures(
  db: Partial<MakerContactDbFields>,
  options?: ContactFeatureOptions,
): Record<MakerContactFieldKey, ContactFeatureState> {
  return MAKER_CONTACT_FIELD_KEYS.reduce(
    (acc, field) => {
      acc[field] = evaluateContactFeature(field, db, options);
      return acc;
    },
    {} as Record<MakerContactFieldKey, ContactFeatureState>,
  );
}

/** Publieke zichtbaarheid — enige poort voor client-facing kanalen. */
export function isContactChannelPubliclyVisible(
  field: MakerContactFieldKey | 'chat',
  db: Partial<MakerContactDbFields>,
  options?: ContactFeatureOptions,
): boolean {
  if (field === 'chat') return evaluateChatContactFeature().visible;
  return evaluateContactFeature(field, db, options).visible;
}

function publicHrefForField(
  field: MakerContactFieldKey,
  db: Partial<MakerContactDbFields>,
): { id: PublicContactChannelId; href: string; display?: string } | null {
  switch (field) {
    case 'phone':
      if (!db.publicPhoneNumber?.trim()) return null;
      return {
        id: 'phone',
        href: `tel:${db.publicPhoneNumber}`,
        display: db.publicPhoneNumber,
      };
    case 'whatsapp': {
      if (!db.publicWhatsappNumber?.trim()) return null;
      const wa = whatsappWaMeUrl(db.publicWhatsappNumber);
      return wa ? { id: 'whatsapp', href: wa } : null;
    }
    case 'instagram':
      if (!db.instagramUrl?.trim()) return null;
      return { id: 'instagram', href: db.instagramUrl };
    case 'facebook':
      if (!db.facebookUrl?.trim()) return null;
      return { id: 'facebook', href: db.facebookUrl };
    case 'tiktok':
      if (!db.tiktokUrl?.trim()) return null;
      return { id: 'tiktok', href: db.tiktokUrl };
    case 'website':
      if (!db.websiteUrl?.trim()) return null;
      return { id: 'website', href: db.websiteUrl };
    case 'telegram':
      if (!db.telegramUrl?.trim()) return null;
      return { id: 'telegram', href: db.telegramUrl };
    default:
      return null;
  }
}

/** Publieke kanalen — gefilterd; geen disabled/locked/waarde-lek naar client. */
export function buildPublicContactChannels(
  db: Partial<MakerContactDbFields>,
  options?: ContactFeatureOptions,
): PublicContactChannel[] {
  const channels: PublicContactChannel[] = [];

  if (isContactChannelPubliclyVisible('chat', db, options)) {
    channels.push({ id: 'chat', href: '' });
  }

  for (const field of MAKER_CONTACT_FIELD_KEYS) {
    if (!isContactChannelPubliclyVisible(field, db, options)) continue;
    const link = publicHrefForField(field, db);
    if (!link) continue;
    channels.push({
      id: link.id,
      href: link.href,
      ...(link.display ? { display: link.display } : {}),
    });
  }

  return channels;
}

export const MAKER_CONTACT_FIELD_KEYS: MakerContactFieldKey[] = [
  'phone',
  'whatsapp',
  'instagram',
  'facebook',
  'tiktok',
  'website',
  'telegram',
];

/** Prisma select voor publieke profielpagina — geen private phoneNumber. */
export const publicMakerContactSelect = {
  publicPhoneEnabled: true,
  publicPhoneNumber: true,
  publicWhatsappEnabled: true,
  publicWhatsappNumber: true,
  publicInstagramEnabled: true,
  instagramUrl: true,
  publicFacebookEnabled: true,
  facebookUrl: true,
  publicTikTokEnabled: true,
  tiktokUrl: true,
  publicWebsiteEnabled: true,
  websiteUrl: true,
  publicTelegramEnabled: true,
  telegramUrl: true,
} as const;
