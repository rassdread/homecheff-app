'use client';
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/Button";
import { Lightbulb, Home, Users, X } from "lucide-react";
import type { Language } from "@/hooks/useTranslation";
import Logo from "@/components/Logo";
import StructuredData from "@/components/seo/StructuredData";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import InspiratieContent from "@/components/inspiratie/InspiratieContent";
import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";

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
  
  const titleTranslation = t('splash.title');
  const subtitleTranslation = t('splash.subtitle');
  const inspiratieTranslation = t('navbar.inspiratie');
  const dorpspleinTranslation = t('navbar.dorpsplein');
  
  const splashTitle = (isReady && titleTranslation) ? titleTranslation : (language === 'nl' 
    ? 'Ontdek digitale ateliers, tuinen en keukens in jouw buurt — of deel de jouwe en verdien extra.'
    : 'Discover digital studios, gardens and kitchens in your neighborhood — or share yours and earn extra.');
  
  const splashSubtitle = (isReady && subtitleTranslation) ? subtitleTranslation : (language === 'nl'
    ? 'Verzamel inspiratie, verkoop gratis wat je maakt, met directe uitbetalingen. Jouw buurt wordt jouw dorpsplein.'
    : 'Collect inspiration, sell what you make for free, with direct payouts. Your neighborhood becomes your village square.');
  
  const inspiratieText = (isReady && inspiratieTranslation) ? inspiratieTranslation : (language === 'nl' ? 'Inspiratie' : 'Inspiration');
  const dorpspleinText = (isReady && dorpspleinTranslation) ? dorpspleinTranslation : (language === 'nl' ? 'Dorpsplein' : 'Village Square');
  
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
      {!splashDismissed && (
        <section className="relative bg-gradient-to-br from-primary-brand via-emerald-600 to-secondary-600 py-6 sm:py-8 px-4 sm:px-6 shadow-lg">
          <button type="button" onClick={dismissSplash} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors" aria-label={language === 'nl' ? 'Welkomstblok sluiten' : 'Close welcome block'}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-3 sm:mb-4 pointer-events-none">
              <div className="[&_span]:!text-white [&_span]:!drop-shadow-lg [&_svg_path]:drop-shadow-md [&_svg_circle]:drop-shadow-md [&_svg_rect]:drop-shadow-md">
                <Logo size="lg" showText={true} className="pointer-events-none" />
              </div>
            </div>
            <div className="flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <button onClick={() => handleLanguageChange('nl')} className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-semibold text-sm transition-all ${language === 'nl' ? 'bg-white text-primary-brand shadow-lg' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30'}`}>🇳🇱 NL</button>
              <button onClick={() => handleLanguageChange('en')} className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-semibold text-sm transition-all ${language === 'en' ? 'bg-white text-primary-brand shadow-lg' : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30'}`}>🇬🇧 EN</button>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 leading-tight px-2">{splashTitle}</h1>
            <p className="text-sm sm:text-base text-primary-100 mb-2 max-w-2xl mx-auto px-2">{splashSubtitle}</p>
            <p className="text-xs sm:text-sm text-white/90 mb-4 sm:mb-5 max-w-xl mx-auto px-2">{t('hero.valueProposition')}</p>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              <Link href="/inspiratie"><Button variant="primary" className="flex items-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"><Lightbulb className="w-4 h-4" />{inspiratieText}</Button></Link>
              <Link href="/dorpsplein"><Button variant="outline" className="flex items-center gap-2 text-sm sm:text-base py-2.5 sm:py-3 bg-white/10 border-white/30 text-white hover:bg-white/20"><Home className="w-4 h-4" />{dorpspleinText}</Button></Link>
              {(!isSubAffiliate || !affiliateCheckComplete) && (
                <Link href="/affiliate"><Button className="flex items-center gap-2 text-sm sm:text-base py-2.5 sm:py-3 !bg-orange-500/90 !border-orange-300 !text-white hover:!bg-orange-600"><Users className="w-4 h-4" />{affiliateText}</Button></Link>
              )}
            </div>
            <p className="text-xs text-white/80 mt-4">
              <Link href="/dorpsplein" className="underline hover:text-white">{dorpspleinText}</Link>
              {' · '}<Link href="/inspiratie" className="underline hover:text-white">{inspiratieText}</Link>
              {' · '}<Link href="/faq" className="underline hover:text-white">{t('siteFooter.faq')}</Link>
            </p>
          </div>
        </section>
      )}
      <main className="min-h-[60vh]">
        <InspiratieContent initialItems={initialInspiratieItems} />
      </main>
    </>
  );
}
