import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import OpenKnowledgeJsonLd from '@/components/seo/OpenKnowledgeJsonLd';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import { openKnowledgeRoadmap } from '@/lib/i18n/openKnowledgeSources';
import { OPEN_KNOWLEDGE_STANDALONE_PATHS } from '@/lib/open-knowledge/docs-registry';
import {
  OPEN_KNOWLEDGE_ROADMAP_NAMESPACE,
  ROADMAP_PAGE_BLOCKS,
} from '@/lib/open-knowledge/open-knowledge-blocks';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(
    OPEN_KNOWLEDGE_STANDALONE_PATHS.roadmap,
    OPEN_KNOWLEDGE_ROADMAP_NAMESPACE,
  );
}

export default function RoadmapPage() {
  return (
    <>
      <OpenKnowledgeJsonLd
        kind="techArticle"
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.roadmap}
        headline={openKnowledgeRoadmap.title.nl}
        description={openKnowledgeRoadmap.metaDescription.nl}
      />
      <AuthorityLandingPage
        ns={OPEN_KNOWLEDGE_ROADMAP_NAMESPACE}
        blocks={ROADMAP_PAGE_BLOCKS}
        path={OPEN_KNOWLEDGE_STANDALONE_PATHS.roadmap}
      />
    </>
  );
}
