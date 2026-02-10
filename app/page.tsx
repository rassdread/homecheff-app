'use client';
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/Button";
import { Lightbulb, Home, Users } from "lucide-react";
import type { Language } from "@/hooks/useTranslation";
import Logo from "@/components/Logo";
import StructuredData from "@/components/seo/StructuredData";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { t, language, changeLanguage, isReady } = useTranslation();
  const { data: session } = useSession();
  const [currentDomain, setCurrentDomain] = useState('https://homecheff.nl');
  const [isSubAffiliate, setIsSubAffiliate] = useState(false);
  const [affiliateCheckComplete, setAffiliateCheckComplete] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.origin);
    }
  }, []);

  // Check if user is a sub-affiliate
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (session?.user) {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setAffiliateCheckComplete(true);
      }, 3000); // 3 second timeout
      
      fetch('/api/profile/me', { signal: controller.signal })
        .then(res => {
          clearTimeout(timeoutId);
          if (!res.ok) {
            setAffiliateCheckComplete(true);
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data?.user?.affiliate?.parentAffiliateId) {
            setIsSubAffiliate(true);
          }
          setAffiliateCheckComplete(true);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          // Silently fail - show button by default
          setAffiliateCheckComplete(true);
        });
    } else {
      // No session - show button by default
      setAffiliateCheckComplete(true);
    }
  }, [session]);
  
  const handleLanguageChange = async (newLanguage: Language) => {
    if (language !== newLanguage) {
      await changeLanguage(newLanguage);
    }
  };
  
  // Fallback texts in case translations aren't loaded yet
  // Use fallback if not ready OR if translation is empty (mobile loading issue)
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
  
  // Affiliate text - ALWAYS use hardcoded values for maximum browser compatibility
  // Don't rely on translations - use direct values that ALWAYS work on ALL browsers
  // This ensures text is ALWAYS visible, especially on mobile (Chrome, Firefox, Safari, Edge)
  const affiliateTextDefault = 'Affiliate 12-12';
  const affiliateTemporaryTextDefault = language === 'nl' 
    ? '⚠️ Tijdelijk! We nemen affiliates aan' 
    : '⚠️ Temporary! We are accepting affiliates';
  
  // Try to get translations, but ALWAYS fallback to hardcoded defaults
  const affiliateTranslation = t('splash.affiliate');
  const affiliateTemporaryTranslation = t('splash.affiliateTemporary');
  
  // Only use translation if it's clearly valid (string, not empty, not the key itself)
  // Otherwise ALWAYS use hardcoded default to ensure visibility on all browsers
  const affiliateText = (affiliateTranslation && 
                          typeof affiliateTranslation === 'string' &&
                          affiliateTranslation.trim().length > 0 && 
                          affiliateTranslation !== 'splash.affiliate' &&
                          affiliateTranslation.length > 5) // Must be longer than just "splash.affiliate"
    ? affiliateTranslation 
    : affiliateTextDefault;
    
  const affiliateTemporaryText = (affiliateTemporaryTranslation && 
                                   typeof affiliateTemporaryTranslation === 'string' &&
                                   affiliateTemporaryTranslation.trim().length > 0 && 
                                   affiliateTemporaryTranslation !== 'splash.affiliateTemporary' &&
                                   affiliateTemporaryTranslation.length > 10) // Must be longer than just the key
    ? affiliateTemporaryTranslation 
    : affiliateTemporaryTextDefault;
  
  // Organization structured data for SEO - optimized for brand search
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HomeCheff',
    alternateName: [
      'homecheff', 
      'home cheff', 
      'home-cheff', 
      'homechef', 
      'home chef',
      'home-chef',
      'HomeCheff platform',
      'HomeCheff marktplaats',
      'HomeCheff marketplace',
      'HomeCheff app',
      'HomeCheff website',
      'HomeCheff Netherlands',
      'HomeCheff Europe',
    ],
    url: currentDomain,
    logo: {
      '@type': 'ImageObject',
      url: `${currentDomain}/logo.png`,
    },
    description: language === 'nl' 
      ? 'HomeCheff is een lokaal platform waar particulieren hun handgemaakte producten kunnen verkopen. We richten ons op thuisgemaakte gerechten, verse producten uit eigen tuin en handgemaakte creaties. Ontdek digitale ateliers, tuinen en keukens in jouw buurt.'
      : 'HomeCheff is a local platform where individuals can sell their handmade products. We focus on homemade dishes, fresh products from your own garden and handmade creations. Discover digital studios, gardens and kitchens in your neighborhood.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@homecheff.nl',
      availableLanguage: ['Dutch', 'English'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'Netherlands',
    },
    sameAs: [
      // Add social media links when available
    ],
    knowsAbout: language === 'nl' ? [
      'HomeCheff',
      'Thuisgemaakte gerechten',
      'Verse oogst',
      'Handgemaakte creaties',
      'Lokaal koken',
      'Lokaal tuinieren',
      'Handgemaakt design',
      'Lokale marktplaats',
      'Community marketplace',
      'Digitale ateliers',
      'Digitale tuinen',
      'Digitale keukens',
    ] : [
      'HomeCheff',
      'Homemade meals',
      'Fresh harvest',
      'Handmade creations',
      'Local cooking',
      'Local gardening',
      'Handmade design',
      'Local marketplace',
      'Community marketplace',
      'Digital studios',
      'Digital gardens',
      'Digital kitchens',
    ],
    // Add WebSite schema for better brand recognition
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${currentDomain}/dorpsplein?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  
  // Add WebSite schema separately for better SEO
  const websiteStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HomeCheff',
    alternateName: [
      'homecheff', 
      'home cheff', 
      'home-cheff',
      'homechef',
      'home chef',
      'HomeCheff platform',
      'HomeCheff marketplace',
    ],
    url: currentDomain,
    description: language === 'nl'
      ? 'HomeCheff - Ontdek digitale ateliers, tuinen en keukens in jouw buurt. Verkoop gratis wat je maakt, verdien direct, zonder maandelijkse kosten.'
      : 'HomeCheff - Discover digital studios, gardens and kitchens in your neighborhood. Sell what you make for free, earn directly, with no monthly costs.',
    publisher: {
      '@type': 'Organization',
      name: 'HomeCheff',
    },
    inLanguage: language === 'nl' ? 'nl-NL' : 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${currentDomain}/dorpsplein?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  
  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={websiteStructuredData} />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-brand via-emerald-600 to-secondary-600 py-8 sm:py-12">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-8 pointer-events-none">
          <div className="[&_span]:!text-white [&_span]:!drop-shadow-lg [&_svg_path]:drop-shadow-md [&_svg_circle]:drop-shadow-md [&_svg_rect]:drop-shadow-md">
            <Logo 
              size="lg" 
              showText={true} 
              className="pointer-events-none" 
            />
          </div>
        </div>
        
        {/* Language Selector */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-8">
          <button
            onClick={() => handleLanguageChange('nl')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-lg transition-all duration-300 ${
              language === 'nl'
                ? 'bg-white text-primary-brand shadow-2xl scale-105 ring-4 ring-white/50'
                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-2 border-white/30'
            }`}
          >
            🇳🇱 Nederlands
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-lg transition-all duration-300 ${
              language === 'en'
                ? 'bg-white text-primary-brand shadow-2xl scale-105 ring-4 ring-white/50'
                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border-2 border-white/30'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
        
        {/* Splash Text */}
        <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 animate-fade-in leading-tight px-2">
          {splashTitle}
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-primary-100 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
          {splashSubtitle}
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6 sm:mt-10 px-4">
          <Link href="/inspiratie" className="w-full sm:w-auto">
            <Button 
              variant="primary" 
              className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 text-base sm:text-lg py-3 sm:py-4"
            >
              <Lightbulb className="w-5 h-5" />
              {inspiratieText}
            </Button>
          </Link>
          <Link href="/dorpsplein" className="w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 text-base sm:text-lg py-3 sm:py-4 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              <Home className="w-5 h-5" />
              {dorpspleinText}
            </Button>
          </Link>
          {(!isSubAffiliate || !affiliateCheckComplete) && (
            <Link href="/affiliate" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="!flex !flex-col !items-center !justify-center gap-1 w-full sm:w-auto min-w-[200px] text-base sm:text-lg py-3 sm:py-4 !bg-orange-500/90 backdrop-blur-sm !border-2 !border-orange-300 !text-white hover:!bg-orange-600 shadow-lg hover:shadow-xl relative font-semibold"
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 text-white" />
                  <span className="text-white whitespace-nowrap font-semibold">{affiliateText}</span>
                </div>
                <span className="text-white text-xs font-normal opacity-95 text-center whitespace-normal px-1">
                  {affiliateTemporaryText}
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
