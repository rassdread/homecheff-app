import { getCurrentLanguage } from '@/lib/seo/metadata';
import { getPlatformDefinition, type PlatformLang } from '@/lib/seo/platform-definition';

/** Server-rendered homepage identity — matches launch orientation copy (i18n SSOT). */
export type HomepageSsrIdentity = {
  lang: PlatformLang;
  identity: string;
  h1: string;
  definition: string;
};

const COPY: Record<
  PlatformLang,
  Omit<HomepageSsrIdentity, 'lang'>
> = {
  nl: {
    identity: 'Digitale buurtmarkt',
    h1: 'dichtbij koken, groeien, maken en helpen',
    definition:
      'HomeCheff is de digitale buurtmarkt: thuisgekookte maaltijden, eigen oogst, handwerk en buurthulp. Zoeken, aanbieden, vragen, kopen, verkopen of ruilen — eerst dichtbij.',
  },
  en: {
    identity: 'Digital neighbourhood marketplace',
    h1: 'nearby cook, grow, make and help',
    definition:
      'HomeCheff is your digital neighbourhood marketplace: homemade meals, self-grown harvests, handmade work and neighbourly help. Search, offer, ask, buy, sell or trade — nearby first.',
  },
};

export function getHomepageSsrIdentity(lang: PlatformLang): HomepageSsrIdentity {
  return { lang, ...COPY[lang] };
}

export async function resolveHomepageSsrIdentity(): Promise<HomepageSsrIdentity> {
  const langRaw = await getCurrentLanguage();
  const lang: PlatformLang = langRaw === 'en' ? 'en' : 'nl';
  const platform = getPlatformDefinition(lang);
  const base = getHomepageSsrIdentity(lang);
  return {
    ...base,
    // Keep definition aligned with platform SSOT entity line when present
    definition: base.definition || platform.entityDefinition,
  };
}
