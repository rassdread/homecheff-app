import SeoLandingTemplate from "@/components/seo/SeoLandingTemplate";
import {
  pickFoodContextVariant,
  shouldShowFoodCategoryContextForProgrammaticNs,
} from "@/lib/seo/food-context";
import {
  SEO_LANDING_BLOCKS,
  type SeoLandingNs,
} from "@/lib/seo/seoLandingBlocks";

export default function ProgrammaticSeoLandingPage({
  namespace,
  interpolation,
  pagePath,
  contentLanguage,
}: {
  namespace: SeoLandingNs;
  /** Vervangt `{{city}}` enz. in vertalingen (stad-pagina’s). */
  interpolation?: Record<string, string>;
  pagePath?: string;
  contentLanguage?: 'nl' | 'en';
}) {
  const blocks = SEO_LANDING_BLOCKS[namespace];
  const foodContextVariant = shouldShowFoodCategoryContextForProgrammaticNs(namespace)
    ? pickFoodContextVariant(namespace)
    : undefined;

  return (
    <SeoLandingTemplate
      ns={namespace}
      blocks={blocks}
      interpolation={interpolation}
      pagePath={pagePath}
      contentLanguage={contentLanguage}
      foodContextVariant={foodContextVariant}
    />
  );
}
