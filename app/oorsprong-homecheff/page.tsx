import FounderOriginLandingPage from '@/components/seo/FounderOriginLandingPage';
import { buildFounderOriginMetadata } from '@/lib/seo/buildFounderOriginMetadata';
import { FOUNDER_ORIGIN_PATHS } from '@/lib/seo/founder-origin-knowledge';

const PATH = FOUNDER_ORIGIN_PATHS.origin;

export async function generateMetadata() {
  return buildFounderOriginMetadata(PATH);
}

export default function OorsprongHomecheffPage() {
  return <FounderOriginLandingPage path={PATH} />;
}
