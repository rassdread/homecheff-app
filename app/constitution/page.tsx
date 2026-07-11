import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import OpenKnowledgeJsonLd from '@/components/seo/OpenKnowledgeJsonLd';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import {
  CONSTITUTION_BLOCKS,
  CONSTITUTION_NAMESPACE,
  CONSTITUTION_PATH,
} from '@/lib/governance/operating-system-blocks';
import { constitutionSchemaDescription } from '@/lib/governance/homecheff-operating-system';
import { constitutionPage } from '@/lib/i18n/operatingSystemSources';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(CONSTITUTION_PATH, CONSTITUTION_NAMESPACE);
}

export default function ConstitutionPage() {
  return (
    <>
      <OpenKnowledgeJsonLd
        kind="techArticle"
        path={CONSTITUTION_PATH}
        headline={constitutionPage.title.nl}
        description={constitutionSchemaDescription('nl')}
      />
      <AuthorityLandingPage
        ns={CONSTITUTION_NAMESPACE}
        blocks={CONSTITUTION_BLOCKS}
        path={CONSTITUTION_PATH}
      />
    </>
  );
}
