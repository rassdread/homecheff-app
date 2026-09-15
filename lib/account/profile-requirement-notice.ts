/**
 * Human-facing copy for HomeCheff profile / account requirements.
 *
 * Source of truth for WHAT is missing, WHY, WHAT to do, and WHERE.
 * UI must not invent generic “Maak je profiel af” copy when this catalog
 * already knows the missing field.
 *
 * Blocking vs recommended is defined here and must match
 * `getAccountRequirements` / delivery completion — this module does not
 * invent new gates.
 */

/**
 * Human-facing copy for HomeCheff profile / account requirements.
 *
 * Source of truth for WHAT is missing, WHY, WHAT to do, and WHERE.
 * UI must not invent generic “Maak je profiel af” copy when this catalog
 * already knows the missing field.
 *
 * Blocking vs recommended is defined here and must match
 * `getAccountRequirements` / delivery completion — this module does not
 * invent new gates.
 */

import type { MissingRequirement, MissingRequirementKey } from '@/lib/account-requirements';
import { DELIVERY_AGE_STEP_HREF, DELIVERY_SETTINGS_HREF } from '@/lib/delivery/delivery-profile-completion';

export type RequirementSeverity = 'BLOCKING' | 'RECOMMENDED' | 'INFORMATIONAL';

export type ProfileRequirementCode =
  | MissingRequirementKey
  | 'displayName'
  | 'profilePhoto'
  | 'location'
  | 'sellerCity'
  | 'sellerCountry'
  | 'sellerPostalCode'
  | 'deliveryServiceArea'
  | 'deliveryAvailability'
  | 'deliveryPricing'
  | 'deliveryCompanyName'
  | 'deliveryDateOfBirth'
  | 'deliveryUnder18';

export type ProfileRequirementNotice = {
  code: ProfileRequirementCode;
  severity: RequirementSeverity;
  shortLabelNl: string;
  titleNl: string;
  bodyNl: string;
  ctaLabelNl: string;
  targetRoute: string;
};

export type AggregatedRequirementNotice = {
  titleNl: string;
  bodyNl: string;
  ctaLabelNl: string;
  targetRoute: string;
  items: ProfileRequirementNotice[];
};

const ACCOUNT_CATALOG: Record<MissingRequirementKey, ProfileRequirementNotice> = {
  emailVerified: {
    code: 'emailVerified',
    severity: 'BLOCKING',
    shortLabelNl: 'E-mailverificatie',
    titleNl: 'Bevestig je e-mailadres om verder te gaan.',
    bodyNl:
      'Zonder geverifieerd e-mailadres kun je geen berichten sturen of aanbod plaatsen.',
    ctaLabelNl: 'E-mail verifiëren',
    targetRoute: '/verify-email',
  },
  username: {
    code: 'username',
    severity: 'BLOCKING',
    shortLabelNl: 'Gebruikersnaam',
    titleNl: 'Kies een definitieve gebruikersnaam.',
    bodyNl:
      'Een tijdelijke of ontbrekende gebruikersnaam is niet genoeg om actief deel te nemen op HomeCheff.',
    ctaLabelNl: 'Gebruikersnaam kiezen',
    targetRoute: '/profile',
  },
  termsAccepted: {
    code: 'termsAccepted',
    severity: 'BLOCKING',
    shortLabelNl: 'Voorwaarden',
    titleNl: 'Accepteer de algemene voorwaarden.',
    bodyNl: 'Je moet de voorwaarden accepteren voordat je iets kunt aanbieden.',
    ctaLabelNl: 'Voorwaarden accepteren',
    targetRoute: '/profile',
  },
  stripeOnboarding: {
    code: 'stripeOnboarding',
    severity: 'BLOCKING',
    shortLabelNl: 'Uitbetalingsrekening',
    titleNl: 'Rond je uitbetalingsrekening af.',
    bodyNl:
      'Koppel je uitbetalingsrekening om betaalde verkopen via HomeCheff te kunnen ontvangen. Plaatsen zonder HomeCheff-betaling blijft mogelijk.',
    ctaLabelNl: 'Uitbetalingsrekening afronden',
    targetRoute: '/settings?tab=payments',
  },
};

const PROFILE_RECOMMENDED: Record<
  'displayName' | 'profilePhoto' | 'location',
  ProfileRequirementNotice
> = {
  displayName: {
    code: 'displayName',
    severity: 'RECOMMENDED',
    shortLabelNl: 'Naam',
    titleNl: 'Vul je naam in.',
    bodyNl: 'Met je naam herkennen anderen je sneller in de community.',
    ctaLabelNl: 'Naam invullen',
    targetRoute: '/profile',
  },
  profilePhoto: {
    code: 'profilePhoto',
    severity: 'RECOMMENDED',
    shortLabelNl: 'Profielfoto',
    titleNl: 'Voeg een profielfoto toe om je profiel compleet te maken.',
    bodyNl: 'Een foto helpt anderen je te herkennen. Je kunt zonder foto wel verder.',
    ctaLabelNl: 'Foto toevoegen',
    targetRoute: '/profile',
  },
  location: {
    code: 'location',
    severity: 'RECOMMENDED',
    shortLabelNl: 'Woonplaats',
    titleNl: 'Voeg je woonplaats toe om items in jouw buurt te kunnen aanbieden.',
    bodyNl:
      'Met een woonplaats zien kopers wat er bij hen in de buurt is. Aanbieden blijft mogelijk.',
    ctaLabelNl: 'Woonplaats toevoegen',
    targetRoute: '/profile',
  },
};

const SELLER_LOCATION: Record<
  'sellerCity' | 'sellerCountry' | 'sellerPostalCode',
  ProfileRequirementNotice
> = {
  sellerCity: {
    code: 'sellerCity',
    severity: 'RECOMMENDED',
    shortLabelNl: 'Woonplaats',
    titleNl: 'Voeg je woonplaats toe om items in jouw buurt te kunnen aanbieden.',
    bodyNl:
      'Stad helpt kopers in de buurt. Dit is geen blokkade — je mag eerst plaatsen.',
    ctaLabelNl: 'Woonplaats toevoegen',
    targetRoute: '/profile',
  },
  sellerCountry: {
    code: 'sellerCountry',
    severity: 'RECOMMENDED',
    shortLabelNl: 'Land',
    titleNl: 'Voeg je land toe.',
    bodyNl: 'Land helpt bij lokale zichtbaarheid. Aanbieden blijft mogelijk.',
    ctaLabelNl: 'Land toevoegen',
    targetRoute: '/profile',
  },
  sellerPostalCode: {
    code: 'sellerPostalCode',
    severity: 'RECOMMENDED',
    shortLabelNl: 'Postcode',
    titleNl: 'Voeg je postcode toe.',
    bodyNl: 'In Nederland helpt een postcode kopers in jouw buurt. Aanbieden blijft mogelijk.',
    ctaLabelNl: 'Postcode toevoegen',
    targetRoute: '/profile',
  },
};

const DELIVERY_CATALOG: Record<string, ProfileRequirementNotice> = {
  dateOfBirth: {
    code: 'deliveryDateOfBirth',
    severity: 'BLOCKING',
    shortLabelNl: 'Leeftijd',
    titleNl: 'Bevestig je leeftijd om te kunnen bezorgen.',
    bodyNl: 'Om via HomeCheff te bezorgen moet je minimaal 18 jaar zijn.',
    ctaLabelNl: 'Leeftijd bevestigen',
    targetRoute: DELIVERY_AGE_STEP_HREF,
  },
  under18: {
    code: 'deliveryUnder18',
    severity: 'BLOCKING',
    shortLabelNl: '18+',
    titleNl: 'Bezorging via HomeCheff is beschikbaar vanaf 18 jaar.',
    bodyNl:
      'Je account en andere HomeCheff-mogelijkheden blijven beschikbaar. Bezorgen kan zodra je 18 bent.',
    ctaLabelNl: 'Bekijk bezorginstellingen',
    targetRoute: DELIVERY_AGE_STEP_HREF,
  },
  serviceArea: {
    code: 'deliveryServiceArea',
    severity: 'BLOCKING',
    shortLabelNl: 'Werkgebied',
    titleNl: 'Stel je werkgebied in.',
    bodyNl:
      'Zonder startlocatie en bezorgstraal kunnen we je niet matchen op opdrachten in jouw buurt.',
    ctaLabelNl: 'Werkgebied instellen',
    targetRoute: DELIVERY_SETTINGS_HREF,
  },
  availability: {
    code: 'deliveryAvailability',
    severity: 'BLOCKING',
    shortLabelNl: 'Bezorgtijden',
    titleNl: 'Stel je bezorgtijden in om als bezorger beschikbaar te worden.',
    bodyNl: 'Kies minstens één beschikbare dag en een tijdvak of werktijden.',
    ctaLabelNl: 'Bezorgtijden instellen',
    targetRoute: DELIVERY_SETTINGS_HREF,
  },
  pricing: {
    code: 'deliveryPricing',
    severity: 'BLOCKING',
    shortLabelNl: 'Bezorgtarief',
    titleNl: 'Vul je bezorgtarief in voordat je bezorgopdrachten kunt aannemen.',
    bodyNl: 'Basisprijs, prijs per km en minimumprijs zijn verplicht voor matching.',
    ctaLabelNl: 'Bezorgtarief instellen',
    targetRoute: DELIVERY_SETTINGS_HREF,
  },
  companyDisplayName: {
    code: 'deliveryCompanyName',
    severity: 'BLOCKING',
    shortLabelNl: 'Bedrijfsnaam',
    titleNl: 'Vul een bedrijfsnaam in voor je bezorgprofiel.',
    bodyNl: 'Een bezorgbedrijf heeft een herkenbare naam nodig voordat klanten je kunnen kiezen.',
    ctaLabelNl: 'Bedrijfsnaam invullen',
    targetRoute: DELIVERY_SETTINGS_HREF,
  },
};

const GENERIC_FAIL_TITLES = [
  'Maak je profiel af',
  'Maak je profiel completer.',
  'Maak je profiel completer',
  'Maak je profiel compleet',
  'Voltooi je bezorgprofiel',
  'Je profiel is nog niet compleet.',
  'Je profiel is nog niet compleet',
  'Je account is nog niet compleet.',
  'Je account is nog niet compleet',
  'Profiel bijwerken',
  'Profiel aanvullen',
  'Rond je bezorgprofiel af',
  'Bezorgprofiel afronden',
];

export function isGenericProfileWarning(text: string | null | undefined): boolean {
  if (!text) return false;
  const n = text.trim();
  return GENERIC_FAIL_TITLES.some((g) => g.toLowerCase() === n.toLowerCase());
}

export function noticeForAccountRequirement(
  key: MissingRequirementKey,
): ProfileRequirementNotice {
  return ACCOUNT_CATALOG[key];
}

export function enrichMissingRequirement(
  item: MissingRequirement,
): MissingRequirement {
  const notice = ACCOUNT_CATALOG[item.key];
  if (!notice) return item;
  return {
    ...item,
    label: notice.titleNl,
    actionHref: notice.targetRoute,
    titleNl: notice.titleNl,
    bodyNl: notice.bodyNl,
    ctaLabelNl: notice.ctaLabelNl,
    severity: notice.severity,
  };
}

export function noticesForAccountMissing(
  missing: MissingRequirement[],
): ProfileRequirementNotice[] {
  return missing.map((m) => ACCOUNT_CATALOG[m.key]).filter(Boolean);
}

export function recommendedProfileNotices(input: {
  name?: string | null;
  image?: string | null;
  place?: string | null;
  lat?: number | null;
  lng?: number | null;
}): ProfileRequirementNotice[] {
  const items: ProfileRequirementNotice[] = [];
  if (!input.name?.trim()) items.push(PROFILE_RECOMMENDED.displayName);
  if (!input.image?.trim()) items.push(PROFILE_RECOMMENDED.profilePhoto);
  const hasPlace =
    Boolean(input.place?.trim()) ||
    (input.lat != null &&
      input.lng != null &&
      Number.isFinite(Number(input.lat)) &&
      Number.isFinite(Number(input.lng)));
  if (!hasPlace) items.push(PROFILE_RECOMMENDED.location);
  return items;
}

export function recommendedSellerLocationNotices(input: {
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
}): ProfileRequirementNotice[] {
  const items: ProfileRequirementNotice[] = [];
  const country = (input.country || '').trim();
  const city = (input.city || '').trim();
  const postal = (input.postalCode || '').trim();
  if (!country) items.push(SELLER_LOCATION.sellerCountry);
  if (!city) items.push(SELLER_LOCATION.sellerCity);
  if (country === 'NL' && !postal) items.push(SELLER_LOCATION.sellerPostalCode);
  return items;
}

export function noticesForDeliveryMissing(missing: string[]): ProfileRequirementNotice[] {
  return missing.map((code) => DELIVERY_CATALOG[code]).filter(Boolean);
}

/** Copy when going online is blocked by incomplete delivery profile. */
export function noticesForOnlineGate(missing: string[]): ProfileRequirementNotice[] {
  return noticesForDeliveryMissing(missing).map((notice) => {
    if (notice.code === 'deliveryDateOfBirth') {
      return {
        ...notice,
        titleNl: 'Bevestig eerst je leeftijd om online te kunnen gaan als bezorger.',
        ctaLabelNl: 'Leeftijd bevestigen',
      };
    }
    if (notice.code === 'deliveryUnder18') {
      return {
        ...notice,
        titleNl: 'Bezorging via HomeCheff is beschikbaar vanaf 18 jaar.',
      };
    }
    if (notice.code === 'deliveryPricing') {
      return {
        ...notice,
        titleNl: 'Vul eerst je bezorgtarieven in voordat je online kunt gaan.',
        ctaLabelNl: 'Bezorgtarieven instellen',
      };
    }
    if (notice.code === 'deliveryServiceArea') {
      return {
        ...notice,
        titleNl: 'Stel eerst je werkgebied in voordat je online kunt gaan.',
      };
    }
    if (notice.code === 'deliveryAvailability') {
      return {
        ...notice,
        titleNl: 'Stel eerst je bezorgtijden in voordat je online kunt gaan.',
      };
    }
    return notice;
  });
}

export function aggregateRequirementNotice(
  items: ProfileRequirementNotice[],
  options?: { completeCtaNl?: string },
): AggregatedRequirementNotice | null {
  if (items.length === 0) return null;
  if (items.length === 1) {
    const only = items[0];
    return {
      titleNl: only.titleNl,
      bodyNl: only.bodyNl,
      ctaLabelNl: only.ctaLabelNl,
      targetRoute: only.targetRoute,
      items,
    };
  }
  const bullets = items.map((i) => `• ${i.shortLabelNl}`).join('\n');
  return {
    titleNl: `Je profiel mist nog ${items.length} onderdelen:`,
    bodyNl: `${bullets}\n\n${items.map((i) => i.bodyNl).join(' ')}`,
    ctaLabelNl: options?.completeCtaNl || items[0].ctaLabelNl,
    targetRoute: items[0].targetRoute,
    items,
  };
}

export function assertNoticeIsActionable(notice: AggregatedRequirementNotice): void {
  if (isGenericProfileWarning(notice.titleNl) || isGenericProfileWarning(notice.ctaLabelNl)) {
    throw new Error(`Generic profile warning is not allowed: ${notice.titleNl}`);
  }
}

export function serializeRequirementNotice(notice: AggregatedRequirementNotice | null) {
  if (!notice) return null;
  return {
    titleNl: notice.titleNl,
    bodyNl: notice.bodyNl,
    ctaLabelNl: notice.ctaLabelNl,
    targetRoute: notice.targetRoute,
    missingCodes: notice.items.map((i) => i.code),
  };
}
