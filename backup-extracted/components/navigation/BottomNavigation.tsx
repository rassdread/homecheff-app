'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Home, Briefcase, Plus, MessageCircle, User, Upload, Camera } from 'lucide-react';
import QuickAddHandler from '@/components/products/QuickAddHandler';
import QuickCamera from '@/components/camera/QuickCamera';
import PromoModal from '@/components/promo/PromoModal';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'dorpsplein' | 'inspiratie' | null>(null);
  
  // Device detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice && isSmallScreen);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  const [quickAddConfig, setQuickAddConfig] = useState<{
    platform: 'dorpsplein' | 'inspiratie';
    category?: string;
    location?: string;
    photo?: string;
  } | null>(null);
  
  const [quickAddStep, setQuickAddStep] = useState<'platform' | 'camera' | 'file-upload' | 'category'>('platform');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  // Promo modals state
  const [activePromoModal, setActivePromoModal] = useState<'dashboard' | 'add' | 'messages' | 'profile' | 'dorpsplein-product' | 'inspiratie-item' | null>(null);

  // Dynamische home button logica
  const getHomeButtonConfig = () => {
    if (pathname === '/inspiratie') {
      return {
        href: '/dorpsplein',
        label: 'Dorpsplein',
        icon: '🏪',
        onClick: () => {
          console.log('Navigating to Dorpsplein (/dorpsplein)');
          router.push('/dorpsplein');
        }
      };
      } else if (pathname === '/' || pathname === '/dorpsplein') {
      return {
        href: '/inspiratie',
        label: 'Inspiratie',
        icon: '✨',
        onClick: () => {
          console.log('Navigating to Inspiratie (/inspiratie)');
          router.push('/inspiratie');
        }
      };
    } else {
      return {
        href: '/inspiratie',
        label: 'Inspiratie',
        icon: '✨',
        onClick: () => {
          console.log('Navigating to Inspiratie (/inspiratie)');
          router.push('/inspiratie');
        }
      };
    }
  };

  // Recalculate config on every render to ensure it's always up to date
  const homeConfig = useMemo(() => getHomeButtonConfig(), [pathname]);

  // Don't show on auth pages (login, register, etc.)
  if (pathname?.includes('/auth') || pathname?.includes('/login') || pathname?.includes('/register') || pathname?.includes('/signin')) {
    return null;
  }

  // Navigation is now always visible for promotional purposes

  // Don't show on certain pages
  if (pathname?.includes('/admin') || pathname?.includes('/checkout')) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  const handleQuickAddClick = () => {
    if (!session?.user) {
      setActivePromoModal('add');
      return;
    }
    setShowQuickAddMenu(true);
  };

  const handleDashboardClick = () => {
    if (!session?.user) {
      setActivePromoModal('dashboard');
      return;
    }
    router.push('/verkoper/dashboard');
  };

  const handleMessagesClick = () => {
    if (!session?.user) {
      setActivePromoModal('messages');
      return;
    }
    router.push('/messages');
  };

  const handleProfileClick = () => {
    if (!session?.user) {
      setActivePromoModal('profile');
      return;
    }
    router.push('/profile');
  };

  const handlePlatformSelect = (platform: 'dorpsplein' | 'inspiratie') => {
    setSelectedPlatform(platform);
    
    if (isMobile) {
      // Mobile: Direct naar camera
      setQuickAddStep('camera');
    } else {
      // Desktop: Direct naar file upload
      setQuickAddStep('file-upload');
    }
  };

  const handlePhotoCapture = (photoUrl: string) => {
    setCapturedPhoto(photoUrl);
    setQuickAddStep('category');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Convert file to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const photoUrl = e.target?.result as string;
      setCapturedPhoto(photoUrl);
      setQuickAddStep('category');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (selectedPlatform && capturedPhoto) {
      setQuickAddConfig({
        platform: selectedPlatform,
        category: selectedPlatform === 'dorpsplein' ? category : undefined,
        location: selectedPlatform === 'inspiratie' ? category : undefined,
        photo: capturedPhoto
      });
      setShowQuickAddMenu(false);
      setSelectedPlatform(null);
      setQuickAddStep('platform');
      setCapturedPhoto(null);
    }
  };

  const closeQuickAddMenu = () => {
    setShowQuickAddMenu(false);
    setSelectedPlatform(null);
    setQuickAddStep('platform');
    setCapturedPhoto(null);
  };

  const closeQuickAdd = () => {
    setQuickAddConfig(null);
  };

  const goBackInQuickAdd = () => {
    if (quickAddStep === 'category') {
      setQuickAddStep(isMobile ? 'camera' : 'file-upload');
    } else if (quickAddStep === 'camera' || quickAddStep === 'file-upload') {
      setQuickAddStep('platform');
      setSelectedPlatform(null);
    }
  };

  // Mock user roles for now - in real app, this would come from a user profile API call
  // For now, assume users have all roles to test functionality
  const userRoles = ['chef', 'garden', 'designer'];

  return (
    <>
      {/* Quick Add Handler */}
      {quickAddConfig && (
        <QuickAddHandler
          platform={quickAddConfig.platform}
          category={quickAddConfig.category}
          location={quickAddConfig.location}
          photo={quickAddConfig.photo}
          onClose={closeQuickAdd}
        />
      )}

      {/* Quick Add Camera */}
      {showQuickAddMenu && quickAddStep === 'camera' && selectedPlatform && (
        <QuickCamera
          onCapture={handlePhotoCapture}
          onClose={closeQuickAddMenu}
          onBack={goBackInQuickAdd}
        />
      )}

      {/* Quick Add File Upload (Desktop) */}
      {showQuickAddMenu && quickAddStep === 'file-upload' && selectedPlatform && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isMobile ? '📱 Camera' : '💻 Bestand uploaden'}
                </h3>
                <p className="text-gray-600">
                  {selectedPlatform === 'dorpsplein' 
                    ? 'Upload een foto van je product'
                    : 'Upload een inspiratie foto'}
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Klik om bestand te selecteren</p>
                    <p className="text-sm text-gray-500 mt-2">Of sleep een bestand hierheen</p>
                  </div>
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={goBackInQuickAdd}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Terug
                  </button>
                  <button
                    onClick={closeQuickAddMenu}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Overlay */}
      {showQuickAddMenu && quickAddStep !== 'camera' && quickAddStep !== 'file-upload' && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            {quickAddStep === 'platform' ? (
              // Platform keuze
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Wat wil je toevoegen?</h3>
                  <button
                    onClick={closeQuickAddMenu}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handlePlatformSelect('dorpsplein')}
                    className="w-full p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    🏪 Dorpsplein
                    <div className="text-sm opacity-90 mt-1">Producten verkopen</div>
                  </button>
                  
                  <button
                    onClick={() => handlePlatformSelect('inspiratie')}
                    className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    ✨ Inspiratie
                    <div className="text-sm opacity-90 mt-1">Ideeën delen</div>
                  </button>
                </div>
              </div>
            ) : quickAddStep === 'category' && selectedPlatform && capturedPhoto ? (
              // Categorie keuze na foto
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedPlatform === 'dorpsplein' ? 'Kies je rol' : 'Kies locatie'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedPlatform === 'dorpsplein' 
                        ? 'Welk type product is dit?' 
                        : 'Waar hoort deze inspiratie thuis?'}
                    </p>
                  </div>
                  <button
                    onClick={closeQuickAddMenu}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>

                {/* Foto preview */}
                <div className="mb-6">
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="w-full h-32 object-cover rounded-xl"
                  />
                </div>
                
                <div className="space-y-3">
                  {selectedPlatform === 'dorpsplein' ? (
                    // Dorpsplein rollen
                    <>
                      {userRoles.includes('chef') && (
                        <button
                          onClick={() => handleCategorySelect('CHEFF')}
                          className="w-full p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                          🍳 Chef
                          <div className="text-sm opacity-90 mt-1">Gerechten & ingrediënten</div>
                        </button>
                      )}
                      
                      {userRoles.includes('garden') && (
                        <button
                          onClick={() => handleCategorySelect('GARDEN')}
                          className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                          🌱 Garden
                          <div className="text-sm opacity-90 mt-1">Groenten & planten</div>
                        </button>
                      )}
                      
                      {userRoles.includes('designer') && (
                        <button
                          onClick={() => handleCategorySelect('DESIGNER')}
                          className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                          🎨 Designer
                          <div className="text-sm opacity-90 mt-1">Handgemaakte items</div>
                        </button>
                      )}
                    </>
                  ) : (
                    // Inspiratie locaties
                    <>
                      <button
                        onClick={() => handleCategorySelect('keuken')}
                        className="w-full p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        🍳 Keuken
                        <div className="text-sm opacity-90 mt-1">Kook inspiratie</div>
                      </button>
                      
                      <button
                        onClick={() => handleCategorySelect('tuin')}
                        className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        🌱 Tuin
                        <div className="text-sm opacity-90 mt-1">Tuin inspiratie</div>
                      </button>
                      
                      <button
                        onClick={() => handleCategorySelect('atelier')}
                        className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        🎨 Atelier
                        <div className="text-sm opacity-90 mt-1">Creatieve inspiratie</div>
                      </button>
                    </>
                  )}
                  
                  {selectedPlatform === 'dorpsplein' && userRoles.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">Je hebt nog geen verkoper rollen.</p>
                      <Link
                        href="/profile?tab=overview"
                        className="inline-block bg-primary-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                        onClick={closeQuickAddMenu}
                      >
                        Mijn HomeCheff instellen
                      </Link>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={goBackInQuickAdd}
                  className="w-full mt-4 p-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  ← Terug naar foto
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Dynamische Home Button */}
          <button
            onClick={homeConfig.onClick}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive(homeConfig.href) ? 'text-primary-brand' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="text-2xl mb-1">{homeConfig.icon}</div>
            <span className="text-xs font-medium">{homeConfig.label}</span>
          </button>

          {/* Dashboard */}
          <button
            onClick={handleDashboardClick}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive('/verkoper') ? 'text-primary-brand' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="text-2xl mb-1">💰</div>
            <span className="text-xs font-medium">{session?.user ? 'Dashboard' : 'Verdienen'}</span>
          </button>

          {/* ADD Button (FAB) */}
          <button
            onClick={handleQuickAddClick}
            className="relative -top-4 bg-gradient-to-r from-primary-brand to-primary-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 active:scale-95"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>

          {/* Berichten */}
          <button
            onClick={handleMessagesClick}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive('/messages') ? 'text-primary-brand' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="text-2xl mb-1">💬</div>
            <span className="text-xs font-medium">Berichten</span>
          </button>

          {/* Profiel */}
          <button
            onClick={handleProfileClick}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive('/profile') ? 'text-primary-brand' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="text-2xl mb-1">👤</div>
            <span className="text-xs font-medium">{session?.user ? 'Mijn HC' : 'Profiel'}</span>
          </button>
        </div>
      </div>

      {/* Bottom padding to prevent content from being hidden behind nav */}
      <div className="h-20" />

      {/* Promo Modals */}
      <PromoModal
        isOpen={activePromoModal === 'dashboard'}
        onClose={() => setActivePromoModal(null)}
        title="Snel Geld Verdienen!"
        subtitle="Start vandaag nog met verkopen"
        description="Plaats je producten binnen enkele stappen en begin direct met verdienen. Van keuken tot tuin, van atelier tot marktplaats - HomeCheff helpt je om van je passie je inkomen te maken."
        icon="💰"
        gradient="bg-gradient-to-r from-green-500 to-emerald-600"
        features={[
          "Plaats producten in minder dan 2 minuten",
          "Automatische betalingsverwerking",
          "Directe uitbetaling naar je rekening",
          "Geen maandelijkse kosten voor particulieren",
          "Bereik lokale klanten in je buurt"
        ]}
        modalType="dashboard"
      />

      <PromoModal
        isOpen={activePromoModal === 'add'}
        onClose={() => setActivePromoModal(null)}
        title="Voeg Je Eerste Product Toe!"
        subtitle="En begin direct met verdienen"
        description="Meld je aan en voeg direct je eerste product toe! Verdien geld met je keuken creaties, tuin producten of atelier designs. HomeCheff maakt het makkelijk om van je hobby je bijverdienste te maken."
        icon="🚀"
        gradient="bg-gradient-to-r from-orange-500 to-red-600"
        features={[
          "Camera functie voor snelle foto's",
          "Automatische categorie herkenning",
          "Slimme prijssuggesties",
          "Directe online zichtbaarheid",
          "Geen vooraf kosten"
        ]}
        modalType="add"
      />

      <PromoModal
        isOpen={activePromoModal === 'messages'}
        onClose={() => setActivePromoModal(null)}
        title="Verbind Met De Community!"
        subtitle="Deel inspiraties en bouw relaties"
        description="Meld je aan om berichten te versturen naar community leden, inspiraties te delen en samen te werken. HomeCheff is meer dan een marktplaats - het is een community van makers en creators."
        icon="💬"
        gradient="bg-gradient-to-r from-blue-500 to-purple-600"
        features={[
          "Direct berichten naar verkopers",
          "Deel je inspiraties en ideeën",
          "Krijg tips van ervaren makers",
          "Bouw je netwerk van lokale creators",
          "Samenwerken aan projecten"
        ]}
        modalType="messages"
      />

      <PromoModal
        isOpen={activePromoModal === 'profile'}
        onClose={() => setActivePromoModal(null)}
        title="Beheer Je Werkruimtes!"
        subtitle="Professioneel profiel opbouwen"
        description="Houd je producten en werkruimtes bij! Pas je openbare profiel aan, bouw je HomeCheff reputatie op en laat zien waar je goed in bent. Van hobbyist tot professional."
        icon="🏡"
        gradient="bg-gradient-to-r from-purple-500 to-pink-600"
        features={[
          "Professioneel profiel met portfolio",
          "Beheer al je producten op één plek",
          "Reviews en ratings van klanten",
          "Statistieken en verkoop analytics",
          "Persoonlijke werkruimte indeling"
        ]}
        modalType="profile"
      />

      <PromoModal
        isOpen={activePromoModal === 'dorpsplein-product'}
        onClose={() => setActivePromoModal(null)}
        title="Koop Lokaal, Steun Je Buurt!"
        subtitle="Ontdek unieke producten van lokale makers"
        description="Meld je aan om direct contact te maken met lokale verkopers, producten te kopen en deel uit te maken van de HomeCheff community. Steun lokale ondernemers en ontdek verborgen talenten in je buurt."
        icon="🏪"
        gradient="bg-gradient-to-r from-orange-500 to-red-600"
        features={[
          "Direct contact met lokale verkopers",
          "Veilige betalingen via HomeCheff",
          "Ophalen of bezorging in je buurt",
          "Reviews van echte klanten",
          "Steun lokale ondernemers"
        ]}
        ctaText="Meld je aan en koop lokaal"
        modalType="dorpsplein-product"
      />

      <PromoModal
        isOpen={activePromoModal === 'inspiratie-item'}
        onClose={() => setActivePromoModal(null)}
        title="Deel Je Inspiratie!"
        subtitle="Word onderdeel van de creatieve community"
        description="Meld je aan om inspiraties te delen, ideeën uit te wisselen en samen te creëren met andere makers. HomeCheff is jouw platform om te inspireren en geïnspireerd te worden."
        icon="✨"
        gradient="bg-gradient-to-r from-purple-500 to-pink-600"
        features={[
          "Deel je eigen inspiraties en ideeën",
          "Reageer op posts van andere makers",
          "Krijg feedback van de community",
          "Ontdek nieuwe technieken en trends",
          "Bouw je creatieve netwerk uit"
        ]}
        ctaText="Meld je aan en deel inspiratie"
        modalType="inspiratie-item"
      />
    </>
  );
}
