import AuthorityLandingPage from '@/components/seo/AuthorityLandingPage';
import { buildAuthorityPageMetadata } from '@/lib/seo/buildAuthorityLandingMetadata';
import { COMPARISON_HUB_LINKS } from '@/lib/seo/comparison-pages';

const PATH = '/vergelijken';

export async function generateMetadata() {
  return buildAuthorityPageMetadata(PATH, 'comparisonHubPage');
}

export default function VergelijkenHubPage() {
  return (
    <AuthorityLandingPage
      ns="comparisonHubPage"
      blocks={COMPARISON_HUB_LINKS}
      path={PATH}
    />
  );
}
