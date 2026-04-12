import ProgrammaticSeoLandingPage from '@/components/seo/ProgrammaticSeoLandingPage';
import { buildProgrammaticLandingMetadata } from '@/lib/seo/buildProgrammaticLandingMetadata';

const PATH = '/geld-verdienen-met-koken';

export async function generateMetadata() {
  return buildProgrammaticLandingMetadata(PATH, 'cookingEarningPage');
}

export default function GeldVerdienenMetKokenLandingPage() {
  return <ProgrammaticSeoLandingPage namespace="cookingEarningPage" />;
}
