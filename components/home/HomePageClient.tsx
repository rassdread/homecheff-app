'use client';
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";
import { Users, Briefcase } from "lucide-react";
import type { Language } from "@/hooks/useTranslation";
import StructuredData from "@/components/seo/StructuredData";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";
import { useUserBootstrap } from "@/components/user/UserBootstrapProvider";
import { MAIN_DOMAIN } from "@/lib/seo/constants";
import HcpActivationCard from "@/components/gamification/HcpActivationCard";
import AndroidBetaHomeCta from "@/components/home/AndroidBetaHomeCta";
import AndroidBetaOptionalUpdateReminder from "@/components/app/AndroidBetaOptionalUpdateReminder";
import PostAuthPersonaBanner from "@/components/onboarding/PostAuthPersonaBanner";
import CommunityPulseBar from "@/components/home/CommunityPulseBar";
import CreatorMomentumCard from "@/components/home/CreatorMomentumCard";
import HomeProfileProgressCard from "@/components/home/HomeProfileProgressCard";
import ReturnBelongingStrip from "@/components/home/ReturnBelongingStrip";
import HomeHeroSection from "@/components/home/HomeHeroSection";

type HomeFeedChip = 'all' | 'sale' | 'inspiration';

/** Lazy chunk: voorkomt webpack/module-boundary issues bij statische bundeling met de tour. */
const OnboardingTour = dynamic(
  () => import("@/components/onboarding/OnboardingTour"),
  { ssr: false }
);

const GeoFeed = dynamic(
  () => import("@/components/feed/GeoFeed"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="h-48 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
        <div className="h-32 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
      </div>
    ),
  }
);

function pickFirstName(
  user: { name?: string | null; email?: string | null } | undefined
): string | null {
  if (!user) return null;
  const raw = user.name?.trim();
  if (raw) {
    const first = raw.split(/\s+/)[0];
    return first || null;
  }
  const local = user.email?.split("@")[0]?.trim();
  if (!local) return null;
  return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
}

type Props = {
  initialInspiratieItems?: InspirationItem[];
  initialFeedChip?: HomeFeedChip;
  initialFeedCategory?: string;
  initialFeedPlace?: string;
};

export default function HomePageClient({
  initialInspiratieItems = [],
  initialFeedChip,
  initialFeedCategory,
  initialFeedPlace,
}: Props) {
  const { t, tOr, language, changeLanguage } = useTranslation();
  const { data: session } = useSession();
  const { profile: bootstrapProfile } = useUserBootstrap();
  const [currentDomain, setCurrentDomain] = useState(MAIN_DOMAIN);
  const [isSubAffiliate, setIsSubAffiliate] = useState(false);
  const [affiliateCheckComplete, setAffiliateCheckComplete] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fromHtml = document.documentElement.getAttribute('data-domain');
      setCurrentDomain(fromHtml || window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setIsSubAffiliate(false);
      setAffiliateCheckComplete(true);
      return;
    }
    if (!bootstrapProfile) {
      setAffiliateCheckComplete(false);
      return;
    }
    setIsSubAffiliate(!!bootstrapProfile.affiliate?.parentAffiliateId);
    setAffiliateCheckComplete(true);
  }, [session?.user, bootstrapProfile]);

  const firstName = pickFirstName(session?.user);
  const welcomeFromT = firstName
    ? t('home.welcomeFirstName', { name: firstName }).trim()
    : '';
  const welcomeLine =
    firstName &&
    (welcomeFromT ||
      (language === 'en' ? `Welcome, ${firstName}!` : `Welkom, ${firstName}!`));

  const affiliateText = tOr(
    'splash.affiliate',
    'Affiliate 12-12',
    'Affiliate 12-12'
  );
  const affiliateTemporaryText = tOr(
    'splash.affiliateTemporary',
    '⚠️ Temporary! We are accepting affiliates',
    '⚠️ Tijdelijk! We nemen affiliates aan'
  );

  const schemaOrgDescription = tOr(
    'home.schemaOrganizationDescription',
    'HomeCheff is a local platform where individuals can sell their handmade products.',
    'HomeCheff is een lokaal platform waar particulieren hun handgemaakte producten kunnen verkopen.'
  );
  const schemaWebsiteDescription = tOr(
    'homePhase1.schemaWebsiteDescription',
    'HomeCheff — the digital village square to discover and share local food, harvest and crafts.',
    'HomeCheff — het digitale dorpsplein om lokaal eten, oogst en creaties te ontdekken en te delen.'
  );
  const schemaContactType = tOr(
    'home.schemaContactCustomerService',
    'Customer service',
    'Klantenservice'
  );
  const schemaAreaCountry = tOr(
    'home.schemaAreaServedCountry',
    'Netherlands',
    'Nederland'
  );
  const schemaLang1 = tOr('home.schemaAvailableLang1', 'Dutch', 'Nederlands');
  const schemaLang2 = tOr('home.schemaAvailableLang2', 'English', 'Engels');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HomeCheff',
    alternateName: ['homecheff', 'home cheff', 'home-cheff', 'homechef', 'home chef', 'HomeCheff platform', 'HomeCheff marktplaats', 'HomeCheff marketplace', 'HomeCheff app', 'HomeCheff website', 'HomeCheff Netherlands', 'HomeCheff Europe'],
    url: currentDomain,
    logo: { '@type': 'ImageObject', url: `${currentDomain}/logo.png` },
    description: schemaOrgDescription,
    contactPoint: { '@type': 'ContactPoint', contactType: schemaContactType, email: 'support@homecheff.eu', availableLanguage: [schemaLang1, schemaLang2] },
    areaServed: { '@type': 'Country', name: schemaAreaCountry },
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${currentDomain}/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
  };

  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HomeCheff',
    alternateName: ['homecheff', 'home cheff', 'home-cheff', 'homechef', 'home chef', 'HomeCheff platform', 'HomeCheff marketplace'],
    url: currentDomain,
    description: schemaWebsiteDescription,
    publisher: { '@type': 'Organization', name: 'HomeCheff' },
    inLanguage: language === 'nl' ? 'nl-NL' : 'en-US',
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${currentDomain}/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={websiteStructuredData} />
      <PostAuthPersonaBanner />
      <main className="min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <HomeHeroSection />

          {session?.user && welcomeLine && (
            <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 text-center sm:text-left">
              {welcomeLine}
            </p>
          )}

          {session?.user ? (
            <>
              <HcpActivationCard className="mb-4 sm:mb-5" />
              <CreatorMomentumCard />
              <ReturnBelongingStrip />
              <HomeProfileProgressCard />
            </>
          ) : null}

          <CommunityPulseBar />

          <GeoFeed
            initialInspiratieItems={initialInspiratieItems}
            initialFeedChip={initialFeedChip}
            initialFeedCategory={initialFeedCategory}
            initialFeedPlace={initialFeedPlace}
          />

          <AndroidBetaHomeCta className="mt-6 mb-4 sm:mb-5" />
          <AndroidBetaOptionalUpdateReminder className="mb-4 sm:mb-5" />
        </div>

        <section className="max-w-7xl mx-auto px-3 sm:px-4 pb-10 pt-2 border-t border-gray-200/80">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {tOr('home.moreSectionHeading', 'More', 'Meer')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(!isSubAffiliate || !affiliateCheckComplete) && (
              <Link
                href="/affiliate"
                className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50/80 p-4 hover:border-orange-300 transition-colors"
              >
                <Users className="w-8 h-8 shrink-0 text-orange-600" aria-hidden />
                <span>
                  <span className="block font-semibold text-gray-900">{affiliateText}</span>
                  <span className="text-sm text-gray-600 mt-0.5 block">{affiliateTemporaryText}</span>
                </span>
              </Link>
            )}
            <Link
              href="/werken-bij"
              className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 hover:border-emerald-300 transition-colors"
            >
              <Briefcase className="w-8 h-8 shrink-0 text-emerald-700" aria-hidden />
              <span>
                <span className="block font-semibold text-gray-900">{t('werkenBij.title')}</span>
                <span className="text-sm text-gray-600 mt-0.5 block line-clamp-2">{t('werkenBij.subtitle')}</span>
              </span>
            </Link>
          </div>
        </section>
      </main>
      <OnboardingTour pageId="home" autoStart={false} />
      <OnboardingTour pageId="inspiratie" autoStart={false} />
    </>
  );
}
