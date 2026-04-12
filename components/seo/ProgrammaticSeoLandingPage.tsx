import SeoLandingTemplate from "@/components/seo/SeoLandingTemplate";
import {
  SEO_LANDING_BLOCKS,
  type SeoLandingNs,
} from "@/lib/seo/seoLandingBlocks";

export default function ProgrammaticSeoLandingPage({
  namespace,
  interpolation,
}: {
  namespace: SeoLandingNs;
  /** Vervangt `{{city}}` enz. in vertalingen (stad-pagina’s). */
  interpolation?: Record<string, string>;
}) {
  const blocks = SEO_LANDING_BLOCKS[namespace];
  return (
    <SeoLandingTemplate
      ns={namespace}
      blocks={blocks}
      interpolation={interpolation}
    />
  );
}
