'use client';

import SeoLandingTemplate from '@/components/seo/SeoLandingTemplate';
import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';

type Props = {
  ns: string;
  blocks: SeoLandingBlock[];
  path: string;
  breadcrumbTrail?: Array<{ labelKey: string; path: string; ns?: string }>;
  foodContextVariant?: 0 | 1 | 2;
};

export default function AuthorityLandingPage({
  ns,
  blocks,
  path,
  breadcrumbTrail,
  foodContextVariant,
}: Props) {
  return (
    <SeoLandingTemplate
      ns={ns}
      blocks={blocks}
      pagePath={path}
      foodContextVariant={foodContextVariant}
      breadcrumbItems={
        breadcrumbTrail?.map((item) => ({
          nameKey: item.labelKey,
          path: item.path,
        }))
      }
    />
  );
}
