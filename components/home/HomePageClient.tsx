'use client';
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/Button";
import {
  Lightbulb,
  Home,
  Users,
  Store,
  Sprout,
  Palette,
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus,
} from "lucide-react";
import type { Language } from "@/hooks/useTranslation";
import Logo from "@/components/Logo";
import StructuredData from "@/components/seo/StructuredData";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";
import GeoFeed from "@/components/feed/GeoFeed";
import { useCreateFlow } from "@/components/create/CreateFlowContext";
import type { InitialHomeUiFromServer } from "@/lib/homeUiPreferences";
import {
  devHomeUiLog,
  readHeroCollapsedFromStorage,
  readInfoCollapsedFromStorage,
  writeHeroCollapsed,
  writeInfoCollapsed,
} from "@/lib/homeUiPreferences";

type Props = {
  initialInspiratieItems?: InspirationItem[];
  initialHomeUiFromServer?: InitialHomeUiFromServer;
  initialFeedChip?: "all" | "sale" | "inspiration";
};

export default function HomePageClient({
  initialInspiratieItems = [],
  initialHomeUiFromServer = null,
  initialFeedChip,
}: Props) {
  const { t, language, changeLanguage } = useTranslation();
  const { data: session } = useSession();
  const { openCreateFlow } = useCreateFlow();

  const [heroCollapsed, setHeroCollapsed] = useState(
    () => !!initialHomeUiFromServer?.hideHomeHero
  );
  const [infoCollapsed, setInfoCollapsed] = useState(
    () => !!initialHomeUiFromServer?.hideHowItWorks
  );

  const pendingHomeUiPatch = useRef<{
    hideHomeHero: boolean;
    hideHowItWorks: boolean;
  } | null>(null);
  useLayoutEffect(() => {
    const localH = readHeroCollapsedFromStorage();
    const localW = readInfoCollapsedFromStorage();

    if (initialHomeUiFromServer) {
      const dbH = initialHomeUiFromServer.hideHomeHero;
      const dbW = initialHomeUiFromServer.hideHowItWorks;
      const mergedH = dbH || localH;
      const mergedW = dbW || localW;
      setHeroCollapsed(mergedH);
      setInfoCollapsed(mergedW);
      writeHeroCollapsed(mergedH);
      writeInfoCollapsed(mergedW);

      if (mergedH !== dbH || mergedW !== dbW) {
        pendingHomeUiPatch.current = {
          hideHomeHero: mergedH,
          hideHowItWorks: mergedW,
        };
        devHomeUiLog("layout merge: verschil local vs server → PATCH wacht op session", {
          mergedH,
          mergedW,
          dbH,
          dbW,
          localH,
          localW,
        });
      } else {
        pendingHomeUiPatch.current = null;
        devHomeUiLog("layout merge: server + local gelijk", {
          dbH,
          dbW,
          localH,
          localW,
        });
      }
    } else {
      setHeroCollapsed(localH);
      setInfoCollapsed(localW);
      pendingHomeUiPatch.current = null;
      devHomeUiLog("layout: alleen localStorage (geen SSR user-prefs)", {
        localH,
        localW,
      });
    }
  }, [
    initialHomeUiFromServer?.hideHomeHero,
    initialHomeUiFromServer?.hideHowItWorks,
  ]);

  useEffect(() => {
    const uid = (session?.user as { id?: string })?.id;
    if (!uid) return;

    if (initialHomeUiFromServer !== null) {
      if (pendingHomeUiPatch.current) {
        const body = pendingHomeUiPatch.current;
        pendingHomeUiPatch.current = null;
        devHomeUiLog("sync: PATCH merge (bron: localStorage + user DB)", body);
        void fetch("/api/user/home-ui", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      return;
    }

    let cancelled = false;
    (async () => {
      devHomeUiLog("sync: GET /api/user/home-ui (ingelogd zonder SSR prefs)", {});
      const r = await fetch("/api/user/home-ui");
      if (cancelled || !r.ok) return;
      const j = (await r.json()) as {
        hideHomeHero?: boolean;
        hideHowItWorks?: boolean;
      };
      const dbH = !!j.hideHomeHero;
      const dbW = !!j.hideHowItWorks;
      const localH = readHeroCollapsedFromStorage();
      const localW = readInfoCollapsedFromStorage();
      const mergedH = dbH || localH;
      const mergedW = dbW || localW;
      setHeroCollapsed(mergedH);
      setInfoCollapsed(mergedW);
      writeHeroCollapsed(mergedH);
      writeInfoCollapsed(mergedW);

      if (mergedH !== dbH || mergedW !== dbW) {
        devHomeUiLog("sync: PATCH na login/client fetch merge", {
          mergedH,
          mergedW,
          dbH,
          dbW,
        });
        await fetch("/api/user/home-ui", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hideHomeHero: mergedH,
            hideHowItWorks: mergedW,
          }),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, initialHomeUiFromServer]);

  const persistHeroCollapsed = useCallback(async (collapsed: boolean) => {
    setHeroCollapsed(collapsed);
    writeHeroCollapsed(collapsed);
    const uid = (session?.user as { id?: string })?.id;
    if (uid) {
      devHomeUiLog("hero collapsed → PATCH user", { hideHomeHero: collapsed });
      await fetch("/api/user/home-ui", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hideHomeHero: collapsed }),
      });
    } else {
      devHomeUiLog("hero collapsed → localStorage only", { collapsed });
    }
  }, [session?.user]);

  const persistInfoCollapsed = useCallback(async (collapsed: boolean) => {
    setInfoCollapsed(collapsed);
    writeInfoCollapsed(collapsed);
    const uid = (session?.user as { id?: string })?.id;
    if (uid) {
      devHomeUiLog('"hoe het werkt" collapsed → PATCH user', {
        hideHowItWorks: collapsed,
      });
      await fetch("/api/user/home-ui", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hideHowItWorks: collapsed }),
      });
    } else {
      devHomeUiLog('"hoe het werkt" collapsed → localStorage only', {
        collapsed,
      });
    }
  }, [session?.user]);

  const [currentDomain, setCurrentDomain] = useState(() => {
    if (typeof document !== 'undefined') {
      const fromHtml = document.documentElement.getAttribute('data-domain');
      if (fromHtml) return fromHtml;
      return window.location.origin;
    }
    return typeof window !== 'undefined' ? window.location.origin : 'https://homecheff.eu';
  });
  const [isSubAffiliate, setIsSubAffiliate] = useState(false);
  const [affiliateCheckComplete, setAffiliateCheckComplete] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fromHtml = document.documentElement.getAttribute('data-domain');
      setCurrentDomain(fromHtml || window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (session?.user) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setAffiliateCheckComplete(true);
      }, 3000);
      fetch('/api/profile/me', { signal: controller.signal })
        .then(res => {
          clearTimeout(timeoutId);
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data?.user?.affiliate?.parentAffiliateId) setIsSubAffiliate(true);
          setAffiliateCheckComplete(true);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          setAffiliateCheckComplete(true);
        });
    } else {
      setAffiliateCheckComplete(true);
    }
  }, [session]);
  
  const handleLanguageChange = async (newLanguage: Language) => {
    if (language !== newLanguage) await changeLanguage(newLanguage);
  };
  
  const affiliateTranslation = t("splash.affiliate");
  const affiliateText =
    affiliateTranslation &&
    typeof affiliateTranslation === "string" &&
    affiliateTranslation.trim().length > 0 &&
    affiliateTranslation !== "splash.affiliate" &&
    affiliateTranslation.length > 5
      ? affiliateTranslation
      : t("home.affiliateButtonFallback");

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "HomeCheff",
      alternateName: [
        "homecheff",
        "home cheff",
        "home-cheff",
        "homechef",
        "home chef",
        "HomeCheff platform",
        "HomeCheff marktplaats",
        "HomeCheff marketplace",
        "HomeCheff app",
        "HomeCheff website",
        "HomeCheff Netherlands",
        "HomeCheff Europe",
      ],
      url: currentDomain,
      logo: { "@type": "ImageObject", url: `${currentDomain}/icon-192.png` },
      description: t("home.schemaOrganizationDescription"),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: t("home.schemaContactCustomerService"),
        email: "support@homecheff.eu",
        availableLanguage: [
          t("home.schemaAvailableLang1"),
          t("home.schemaAvailableLang2"),
        ],
      },
      areaServed: {
        "@type": "Country",
        name: t("home.schemaAreaServedCountry"),
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${currentDomain}/dorpsplein?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    }),
    [currentDomain, language, t]
  );

  const websiteStructuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "HomeCheff",
      alternateName: [
        "homecheff",
        "home cheff",
        "home-cheff",
        "homechef",
        "home chef",
        "HomeCheff platform",
        "HomeCheff marketplace",
      ],
      url: currentDomain,
      description: t("home.schemaWebsiteDescription"),
      publisher: { "@type": "Organization", name: "HomeCheff" },
      inLanguage: language === "nl" ? "nl-NL" : "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${currentDomain}/dorpsplein?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    }),
    [currentDomain, language, t]
  );

  const howItWorksSteps = useMemo(
    () =>
      [
        { title: t("home.howItWorksStep1Title"), icon: CheckCircle2 },
        { title: t("home.howItWorksStep2Title"), icon: Home },
        { title: t("home.howItWorksStep3Title"), icon: Store },
      ] as const,
    [language, t]
  );

  const earnCategories = useMemo(
    () => [
      {
        icon: Lightbulb,
        title: t("home.categoryCheffTitle"),
        description: t("home.categoryCheffDescription"),
      },
      {
        icon: Sprout,
        title: t("home.categoryGardenTitle"),
        description: t("home.categoryGardenDescription"),
      },
      {
        icon: Palette,
        title: t("home.categoryDesignTitle"),
        description: t("home.categoryDesignDescription"),
      },
    ],
    [language, t]
  );

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={websiteStructuredData} />
      <main className="min-h-[60vh] bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <section
          className="shadow-lg transition-[box-shadow] duration-300 ease-out"
          aria-label={t("home.heroAriaLabel")}
        >
          {heroCollapsed ? (
            <button
              type="button"
              onClick={() => void persistHeroCollapsed(false)}
              className="flex min-h-12 w-full items-center justify-center gap-2 border-b border-emerald-900/15 bg-gradient-to-r from-primary-brand via-emerald-600 to-secondary-600 px-4 py-3.5 text-center text-sm font-semibold text-white transition hover:brightness-[1.03] active:brightness-95 sm:min-h-14 sm:text-base"
              aria-expanded={false}
              aria-controls="home-hero-expanded"
              aria-label={t("home.heroExpandAria")}
            >
              <span>{t("home.heroCollapsedLabel")}</span>
              <ChevronDown
                className="h-5 w-5 shrink-0 opacity-90"
                strokeWidth={2.25}
                aria-hidden
              />
            </button>
          ) : (
            <div
              id="home-hero-expanded"
              className="relative bg-gradient-to-br from-primary-brand via-emerald-600 to-secondary-600 py-10 sm:py-14 px-4 sm:px-6 transition-opacity duration-300 ease-out"
            >
              <button
                type="button"
                onClick={() => void persistHeroCollapsed(true)}
                className="absolute right-3 top-3 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700 sm:right-4 sm:top-4 sm:min-h-12 sm:min-w-12"
                aria-expanded
                aria-controls="home-hero-expanded"
                aria-label={t("home.heroCollapseAria")}
              >
                <Minus className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} aria-hidden />
              </button>
              <div className="mx-auto max-w-5xl text-center text-white">
                <div className="mb-5 flex justify-center">
                  <Logo size="lg" showText={true} className="pointer-events-none" />
                </div>
                <div className="mb-5 flex justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("nl")}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all sm:px-5 sm:py-2.5 ${
                      language === "nl"
                        ? "bg-white text-primary-brand shadow-lg"
                        : "border border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                    }`}
                  >
                    {t("home.heroLangNl")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("en")}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all sm:px-5 sm:py-2.5 ${
                      language === "en"
                        ? "bg-white text-primary-brand shadow-lg"
                        : "border border-white/30 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                    }`}
                  >
                    {t("home.heroLangEn")}
                  </button>
                </div>
                <p className="mb-2 text-xs uppercase tracking-wide text-white/80 sm:text-sm">
                  {t("home.heroEyebrow")}
                </p>
                <h1 className="mb-3 text-3xl font-bold sm:text-4xl md:text-5xl">
                  {t("home.heroTitle")}
                </h1>
                <p className="mx-auto mb-7 max-w-3xl text-base text-emerald-100 sm:text-lg">
                  {t("home.heroSubtitle")}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    className="px-6 py-3 text-sm sm:text-base"
                    onClick={openCreateFlow}
                  >
                    {t("feed.tileCtaSell")}
                  </Button>
                  <a
                    href="#homecheff-feed"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-base font-medium text-white hover:bg-white/20"
                  >
                    {t("home.heroCtaSecondary")}
                  </a>
                  {(!isSubAffiliate || !affiliateCheckComplete) && (
                    <Link href="/affiliate">
                      <Button className="flex items-center gap-2 px-6 py-3 text-sm sm:text-base !border-orange-300 !bg-orange-500/90 !text-white hover:!bg-orange-600">
                        <Users className="h-4 w-4" />
                        {affiliateText}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section
          className="mx-auto max-w-6xl px-4 sm:px-6"
          aria-labelledby="home-how-it-works-heading"
        >
          {infoCollapsed ? (
            <button
              type="button"
              onClick={() => void persistInfoCollapsed(false)}
              className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:bg-gray-50/80 active:bg-gray-50 sm:min-h-14 sm:px-5"
              aria-expanded={false}
              aria-controls="home-how-it-works-panel"
              aria-label={t("home.infoExpandAria")}
            >
              <span
                id="home-how-it-works-heading"
                className="min-w-0 flex-1 text-sm font-medium leading-snug text-gray-800 sm:text-base"
              >
                {t("home.howItWorksCollapsedSummary")}
              </span>
              <Plus
                className="h-5 w-5 shrink-0 text-emerald-700"
                strokeWidth={2.25}
                aria-hidden
              />
            </button>
          ) : (
            <div
              id="home-how-it-works-panel"
              className="relative rounded-xl border border-transparent py-6 transition-opacity duration-300 ease-out sm:py-8"
            >
              <button
                type="button"
                onClick={() => void persistInfoCollapsed(true)}
                className="absolute right-0 top-0 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:right-1 sm:top-1"
                aria-expanded
                aria-controls="home-how-it-works-panel"
                aria-label={t("home.infoCollapseAria")}
              >
                <Minus className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} aria-hidden />
              </button>
              <h2
                id="home-how-it-works-heading"
                className="mb-6 pr-14 text-center text-2xl font-bold text-gray-900 sm:text-3xl"
              >
                {t("home.howItWorksTitle")}
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {howItWorksSteps.map((step, i) => (
                  <div
                    key={`how-step-${i}`}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        {i + 1}
                      </span>
                      <step.icon className="h-5 w-5 text-emerald-600" aria-hidden />
                    </div>
                    <p className="font-semibold text-gray-900">{step.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            {t("home.earnSectionTitle")}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {earnCategories.map((cat, i) => (
              <div
                key={`earn-cat-${i}`}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <cat.icon
                    className={`h-5 w-5 shrink-0 ${
                      i === 0
                        ? "text-amber-500"
                        : i === 1
                          ? "text-green-600"
                          : "text-purple-600"
                    }`}
                    aria-hidden
                  />
                  <h3 className="font-semibold text-gray-900">{cat.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{cat.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="max-w-6xl mx-auto px-4 sm:px-6 pb-6"
          aria-labelledby="home-feed-sell-banner-heading"
        >
          <div className="flex min-h-[5.5rem] flex-col gap-4 rounded-xl border border-stone-200/90 bg-white/95 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h2
                id="home-feed-sell-banner-heading"
                className="text-sm font-semibold text-stone-800"
              >
                {t("feed.primarySellBannerTitle")}
              </h2>
              <p className="mt-1 text-sm text-stone-600 leading-snug">
                {t("feed.primarySellBannerBody")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full shrink-0 border-emerald-700/40 text-emerald-800 hover:bg-emerald-50/80 sm:w-auto"
              onClick={openCreateFlow}
            >
              {t("feed.primarySellBannerCta")}
            </Button>
          </div>
        </section>

        <section
          id="homecheff-feed"
          className="mx-auto max-w-7xl scroll-mt-6 px-4 pb-10 sm:px-6"
        >
          <h2 className="mb-3 text-center text-xl font-bold text-gray-900 sm:text-left sm:text-2xl">
            {t("home.feedSectionTitle")}
          </h2>
          <p className="text-sm text-gray-600 mb-4 text-center sm:text-left">
            <Link
              href="/seo-hub"
              className="font-medium text-emerald-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              {t('home.seoHubLink')}
            </Link>
          </p>
          <GeoFeed
            initialInspiratieItems={initialInspiratieItems}
            initialFeedChip={initialFeedChip}
          />
        </section>
      </main>
    </>
  );
}
