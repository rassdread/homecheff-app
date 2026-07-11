import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import {
  MANIFEST_BLOCKS,
  MANIFEST_NAMESPACE,
  MANIFEST_PATH,
} from '@/lib/seo/manifest-blocks';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(MANIFEST_PATH, MANIFEST_NAMESPACE);
}

export default function ManifestPage() {
  return (
    <AuthorityLandingPage
      ns={MANIFEST_NAMESPACE}
      blocks={MANIFEST_BLOCKS}
      path={MANIFEST_PATH}
    />
  );
}
