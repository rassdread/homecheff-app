/**
 * Types voor HomeCheff SEO-landingspagina's (NL + EN routes).
 */

export type SeoLocaleBlock = {
  title: string;
  description: string;
  h1: string;
  intro: string[];
  howItWorks: { title: string; paragraphs: string[] };
  audience: { title: string; paragraphs: string[] };
  whyLocal: { title: string; paragraphs: string[] };
  discover: { title: string; paragraphs: string[] };
  cta: {
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
};

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
