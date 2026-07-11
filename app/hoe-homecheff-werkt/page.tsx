import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import {
  ECOSYSTEM_MAP_BLOCKS,
  ECOSYSTEM_MAP_NAMESPACE,
  ECOSYSTEM_MAP_PATH,
} from '@/lib/seo/ecosystem-map-blocks';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(ECOSYSTEM_MAP_PATH, ECOSYSTEM_MAP_NAMESPACE);
}

export default function HoeHomeCheffWerktPage() {
  return (
    <AuthorityLandingPage
      ns={ECOSYSTEM_MAP_NAMESPACE}
      blocks={ECOSYSTEM_MAP_BLOCKS}
      path={ECOSYSTEM_MAP_PATH}
    />
  );
}
