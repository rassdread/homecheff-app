/**
 * Types voor HomeCheff SEO-landingspagina's (NL + EN routes).
 */

export type SeoSection = { title: string; paragraphs: string[] };

type SeoLocaleBase = {
  title: string;
  description: string;
  h1: string;
  intro: string[];
  cta: {
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
};

/** Shared four-block template (legacy pages). */
type SeoTemplateBody = {
  howItWorks: SeoSection;
  audience: SeoSection;
  whyLocal: SeoSection;
  discover: SeoSection;
};

/** Page-specific structure for pages whose search intent needs its own outline. */
type SeoCustomBody = { sections: SeoSection[] };

export type SeoTemplateLocaleBlock = SeoLocaleBase & SeoTemplateBody;

export type SeoLocaleBlock = SeoTemplateLocaleBlock | (SeoLocaleBase & SeoCustomBody);

export type SeoPageDefinition = {
  id: string;
  nlSlug: string;
  enSlug: string;
  nl: SeoLocaleBlock;
  en: SeoLocaleBlock;
  /** IDs van gerelateerde pagina's (volgorde bepaalt voorkeur). */
  relatedIds: string[];
};

export type SeoHubSection = {
  id: string;
  titleNl: string;
  titleEn: string;
  pageIds: string[];
};
