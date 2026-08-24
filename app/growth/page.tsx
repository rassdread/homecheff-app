import { EcosystemParticipationLanding } from '@/components/seo/EcosystemParticipationLanding';
import {
  buildEcosystemParticipationMetadata,
  resolvePublicLandingLang,
} from '@/lib/seo/buildEcosystemParticipationMetadata';

export async function generateMetadata() {
  return buildEcosystemParticipationMetadata('/growth', 'growthLandingPage');
}

export default async function GrowthLandingPage() {
  const lang = await resolvePublicLandingLang();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/90 via-white to-slate-50">
      <EcosystemParticipationLanding variant="growth" lang={lang} />
    </div>
  );
}
