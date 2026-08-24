import { EcosystemParticipationLanding } from '@/components/seo/EcosystemParticipationLanding';
import {
  buildEcosystemParticipationMetadata,
  resolvePublicLandingLang,
} from '@/lib/seo/buildEcosystemParticipationMetadata';

export async function generateMetadata() {
  return buildEcosystemParticipationMetadata(
    '/ecosystem',
    'ecosystemParticipationPage',
  );
}

export default async function EcosystemPage() {
  const lang = await resolvePublicLandingLang();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/90 via-white to-slate-50">
      <EcosystemParticipationLanding variant="ecosystem" lang={lang} />
    </div>
  );
}
