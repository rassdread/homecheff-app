'use client';
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/Button";
import { Lightbulb, Home, Users, X, Store, Sprout, Palette, CheckCircle2 } from "lucide-react";
import type { Language } from "@/hooks/useTranslation";
import Logo from "@/components/Logo";
import StructuredData from "@/components/seo/StructuredData";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";
import GeoFeed from "@/components/feed/GeoFeed";

const SPLASH_STORAGE_KEY = 'homecheff_splash_dismissed';

type Props = {
  initialInspiratieItems?: InspirationItem[];
};

export default function HomePageClient({ initialInspiratieItems = [] }: Props) {
  const { t, language, changeLanguage, isReady } = useTranslation();
  const { data: session } = useSession();
  const [splashDismissed, setSplashDismissed] = useState(false);
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
    try {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem(SPLASH_STORAGE_KEY) : null;
      setSplashDismissed(stored === '1');
    } catch {
      setSplashDismissed(false);
    }
  }, []);

  const dismissSplash = () => {
    setSplashDismissed(true);
    try {
      sessionStorage.setItem(SPLASH_STORAGE_KEY, '1');
    } catch {}
  };
  
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
  
  const affiliateTextDefault = 'Affiliate 12-12';
  const affiliateTemporaryTextDefault = language === 'nl' 
    ? '⚠️ Tijdelijk! We nemen affiliates aan' 
    : '⚠️ Temporary! We are accepting affiliates';
  const affiliateTranslation = t('splash.affiliate');
  const affiliateTemporaryTranslation = t('splash.affiliateTemporary');
  const affiliateText = (affiliateTranslation && typeof affiliateTranslation === 'string' && affiliateTranslation.trim().length > 0 && affiliateTranslation !== 'splash.affiliate' && affiliateTranslation.length > 5)
    ? affiliateTranslation : affiliateTextDefault;
  const affiliateTemporaryText = (affiliateTemporaryTranslation && typeof affiliateTemporaryTranslation === 'string' && affiliateTemporaryTranslation.trim().length > 0 && affiliateTemporaryTranslation !== 'splash.affiliateTemporary' && affiliateTemporaryTranslation.length > 10)
    ? affiliateTemporaryTranslation : affiliateTemporaryTextDefault;
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HomeCheff',
    alternateName: ['homecheff', 'home cheff', 'home-cheff', 'homechef', 'home chef', 'HomeCheff platform', 'HomeCheff marktplaats', 'HomeCheff marketplace', 'HomeCheff app', 'HomeCheff website', 'HomeCheff Netherlands', 'HomeCheff Europe'],
    url: currentDomain,
    logo: { '@type': 'ImageObject', url: `${currentDomain}/logo.png` },
    description: language === 'nl' 
      ? 'HomeCheff is een lokaal platform waar particulieren hun handgemaakte producten kunnen verkopen.'
      : 'HomeCheff is a local platform where individuals can sell their handmade products.',
    contactPoint: { '@type': 'ContactPoint', contactType: 'Customer Service', email: 'support@homecheff.eu', availableLanguage: ['Dutch', 'English'] },
    areaServed: { '@type': 'Country', name: 'Netherlands' },
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${currentDomain}/dorpsplein?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
  };
  
  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HomeCheff',
    alternateName: ['homecheff', 'home cheff', 'home-cheff', 'homechef', 'home chef', 'HomeCheff platform', 'HomeCheff marketplace'],
    url: currentDomain,
    description: language === 'nl'
      ? 'HomeCheff - Ontdek digitale ateliers, tuinen en keukens in jouw buurt.'
      : 'HomeCheff - Discover digital studios, gardens and kitchens in your neighborhood.',
    publisher: { '@type': 'Organization', name: 'HomeCheff' },
    inLanguage: language === 'nl' ? 'nl-NL' : 'en-US',
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${currentDomain}/dorpsplein?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
  };
  
  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={websiteStructuredData} />
      <main className="min-h-[60vh] bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <section className="relative bg-gradient-to-br from-primary-brand via-emerald-600 to-secondary-600 py-10 sm:py-14 px-4 sm:px-6 shadow-lg">
          <button type="button" onClick={dismissSplash} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors" aria-label={language === 'nl' ? 'Welkomstblok sluiten' : 'Close welcome block'}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="max-w-5xl mx-auto text-center text-white">
            <div className="flex justify-center mb-5">
              <Logo size="lg" showText={true} className="pointer-events-none" />
            </div>
            <div className="flex justify-center gap-2 sm:gap-3 mb-5">
              <button onClick={() => handleLanguageChange('nl')} className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-semibold text-sm transition-all ${language === 'nl' ? 'bg-white text-primary-brand shadow-lg' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30'}`}>🇳🇱 NL</button>
              <button onClick={() => handleLanguageChange('en')} className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-semibold text-sm transition-all ${language === 'en' ? 'bg-white text-primary-brand shadow-lg' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30'}`}>🇬🇧 EN</button>
            </div>
            <p className="uppercase tracking-wide text-xs sm:text-sm text-white/80 mb-2">Verdien geld met wat je al kunt — gewoon in jouw buurt.</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">Verdien geld met wat je al kunt</h1>
            <p className="text-base sm:text-lg text-emerald-100 mb-7 max-w-3xl mx-auto">Kook, maak of verkoop — en vind direct klanten in jouw buurt.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/sell/new"><Button variant="primary" className="text-sm sm:text-base py-3 px-6">Start met verkopen</Button></Link>
              <a href="#homecheff-feed" className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-medium border border-white/30 bg-white/10 text-white hover:bg-white/20">Ontdek aanbod</a>
              {(!isSubAffiliate || !affiliateCheckComplete) && (
                <Link href="/affiliate"><Button className="flex items-center gap-2 text-sm sm:text-base py-3 px-6 !bg-orange-500/90 !border-orange-300 !text-white hover:!bg-orange-600"><Users className="w-4 h-4" />{affiliateText}</Button></Link>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-6">Hoe het werkt</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'Plaats wat je maakt', icon: CheckCircle2 },
              { title: 'Mensen uit jouw buurt zien het', icon: Home },
              { title: 'Jij verdient', icon: Store },
            ].map((step, i) => (
              <div key={step.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <step.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="font-semibold text-gray-900">{step.title}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-6">Verdienen in jouw buurt</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2"><Lightbulb className="w-5 h-5 text-amber-500" /><h3 className="font-semibold text-gray-900">Thuiskoks (eten)</h3></div>
              <p className="text-sm text-gray-600">Maak je eten? Verkoop je gerechten lokaal.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2"><Sprout className="w-5 h-5 text-green-600" /><h3 className="font-semibold text-gray-900">Tuin / producten</h3></div>
              <p className="text-sm text-gray-600">Heb je producten? Bied ze aan in jouw buurt.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2"><Palette className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-gray-900">Creatief / design</h3></div>
              <p className="text-sm text-gray-600">Maak je iets creatiefs? Vind direct klanten.</p>
            </div>
          </div>
        </section>

        <section id="homecheff-feed" className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 scroll-mt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 text-center sm:text-left">
            HomeCheff feed
          </h2>
          <GeoFeed initialInspiratieItems={initialInspiratieItems} />
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-14">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-7 text-white text-center shadow-lg">
            <h3 className="text-2xl font-bold mb-2">Start met verkopen</h3>
            <p className="text-emerald-100 mb-5">Laat mensen in jouw buurt ontdekken wat jij maakt.</p>
            <Link href="/sell/new"><Button variant="primary" className="py-3 px-6">Start met verkopen</Button></Link>
          </div>
        </section>
      </main>
    </>
  );
}
