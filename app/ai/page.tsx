import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import OpenKnowledgeJsonLd from '@/components/seo/OpenKnowledgeJsonLd';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import { openKnowledgeAiPublic } from '@/lib/i18n/openKnowledgeSources';
import { OPEN_KNOWLEDGE_STANDALONE_PATHS } from '@/lib/open-knowledge/docs-registry';
import {
  AI_PUBLIC_PAGE_BLOCKS,
  OPEN_KNOWLEDGE_AI_PUBLIC_NAMESPACE,
} from '@/lib/open-knowledge/open-knowledge-blocks';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(
    OPEN_KNOWLEDGE_STANDALONE_PATHS.ai,
    OPEN_KNOWLEDGE_AI_PUBLIC_NAMESPACE,
  );
}

export default function AiPublicPage() {
  return (
    <>
      <OpenKnowledgeJsonLd
        kind="techArticle"
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.ai}
        headline={openKnowledgeAiPublic.title.nl}
        description={openKnowledgeAiPublic.metaDescription.nl}
      />
      <AuthorityLandingPage
        ns={OPEN_KNOWLEDGE_AI_PUBLIC_NAMESPACE}
        blocks={AI_PUBLIC_PAGE_BLOCKS}
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.ai}
      />
    </>
  );
}
