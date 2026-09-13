import { getCurrentLanguage } from '@/lib/seo/metadata';
import { getPlatformDefinition, type PlatformLang } from '@/lib/seo/platform-definition';
import { ENTITY_HOMEPAGE_DEFINITION } from '@/lib/seo/entity-philosophy';

/** Server-rendered homepage identity — parent ecosystem + Marketplace SELL layer. */
export type HomepageSsrIdentity = {
  lang: PlatformLang;
  identity: string;
  h1: string;
  definition: string;
};

const COPY: Record<PlatformLang, Omit<HomepageSsrIdentity, 'lang'>> = {
  nl: {
    identity: 'HomeCheff-ecosysteem · Marketplace',
    h1: 'Ontdek wat mensen bij jou in de buurt koken, groeien, maken en doen',
    definition: ENTITY_HOMEPAGE_DEFINITION.nl,
  },
  en: {
    identity: 'HomeCheff ecosystem · Marketplace',
    h1: 'Discover what people nearby cook, grow, make and do',
    definition: ENTITY_HOMEPAGE_DEFINITION.en,
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
    definition: base.definition || platform.entityDefinition,
  };
}
