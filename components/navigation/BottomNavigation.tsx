'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, Download } from 'lucide-react';
import { openSoftAuthGate } from '@/lib/onboarding/open-soft-auth-gate';
import { sanitizePostAuthRelativeUrl } from '@/lib/auth/post-auth-redirect';
import { compressDataUrl } from '@/lib/imageOptimization';
import { useTranslation } from '@/hooks/useTranslation';
import { QUICK_ADD_OPEN_EVENT } from '@/lib/quickAddOpen';
import {
  buildSellNewSearchFromIntent,
  consumeCreateFlowIntent,
  mapVerticalToInspiratieLocation,
  type CreateFlowVertical,
} from '@/lib/createFlowIntent';
import { createFlowDebug } from '@/lib/create-flow-debug';
import { resetCreateFlowUiState } from '@/lib/reset-create-flow-ui';
import { pushAndroidBackHandler } from '@/lib/native/androidCreateFlowBack';
import { isBottomNavigationHidden } from '@/lib/bottomNavRoutes';
import { useUserBootstrap } from '@/components/user/UserBootstrapProvider';
import { cn } from '@/lib/utils';
import { useIsNativeAppMounted } from '@/lib/native/useIsNativeAppMounted';
import { navDebug } from '@/lib/nav-debug';
import { useAppUpdateStatus } from '@/components/app/AppUpdateStatusProvider';

type QuickAddStep = 'platform' | 'photoSource' | 'category' | 'location';
type Platform = 'dorpsplein' | 'inspiratie';
type Category = 'CHEFF' | 'GARDEN' | 'DESIGNER';
type Location = 'keuken' | 'tuin' | 'atelier' | 'recepten' | 'kweken' | 'designs';

/** Sessie/API gebruikt soms varianten (grower, CHEFF); quick-add verwacht chef | garden | designer. */
function normalizeSellerRolesForQuickAdd(raw: unknown): string[] {
  const arr = Array.isArray(raw) ? raw : [];
  const out = new Set<string>();
  for (const x of arr) {
    const r = String(x).toLowerCase().trim();
    if (r === 'chef' || r === 'cheff') out.add('chef');
    else if (r === 'garden' || r === 'grower' || r === 'grown') out.add('garden');
    else if (r === 'designer' || r === 'design') out.add('designer');
  }
  return [...out];
}

/** Bottom tabs: soft pill active state, calm hover — aligns with HomeCheff emerald/teal. */
function navTabClasses(active: boolean, isNativeShell: boolean) {
  return cn(
    'flex flex-col items-center justify-center w-full max-w-[5rem] mx-auto rounded-2xl transition-all duration-200 ease-out',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    active
      ? 'text-primary-brand bg-gradient-to-b from-emerald-500/[0.18] to-teal-600/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] ring-1 ring-emerald-400/35'
      : 'text-gray-600 hover:text-gray-900 hover:bg-slate-50/95 active:bg-slate-100/85',
    isNativeShell
      ? 'min-h-[52px] min-w-[48px] px-1 py-2 touch-manipulation select-none active:scale-[0.97]'
      : 'min-h-[48px] px-1 py-1.5 sm:py-2 touch-manipulation select-none'
  );
}

function QuickAddMediaPreview({ media, alt }: { media: string; alt: string }) {
  const isVideo = media.startsWith('data:video/');
  if (isVideo) {
    return (
      <video
        src={media}
        className="w-full max-h-48 object-contain rounded-xl border-2 border-gray-200 bg-black"
        controls
        playsInline
        muted
        preload="metadata"
      />
    );
  }
  return (
    <img
      src={media}
      alt={alt}
      className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
    />
  );
}

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const { t } = useTranslation();
  const { profile: bootstrapProfile, ensureProfile } = useUserBootstrap();

  const isNativeShell = useIsNativeAppMounted();
  const appUpdateStatus = useAppUpdateStatus();
  const shouldHide = isBottomNavigationHidden(pathname);
  /** Geen flow-spacer onder berichten: layout reserveert zelf (voorkomt dubbele “witte band”). */
  const suppressFlowSpacer = Boolean(pathname?.startsWith('/messages')) && !shouldHide;

  // Quick Add State
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [quickAddStep, setQuickAddStep] = useState<QuickAddStep>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userRolesLoaded, setUserRolesLoaded] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const cameraPhotoInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement>(null);
  const pendingAutoCategoryRef = useRef<Category | null>(null);
  const pendingAutoLocationRef = useRef<Location | null>(null);
  /** Na consumeCreateFlowIntent: beperk categorie-/locatieknoppen (profiel / tab-intents). */
  const intentAllowedVerticalsRef = useRef<CreateFlowVertical[] | null>(null);
  /**
   * Guard tegen Safari/mobile "phantom" click of focus events vlak na het sluiten van de
   * native file picker. Sommige iOS-builds vuren een synthetische tap af op de coördinaten
   * van de oorspronkelijke tap zodra de picker sluit; als die op de modal-overlay valt,
   * sluit de quick-add modal ongewenst en valt de gebruiker terug op het homescreen.
   * Wordt gezet vlak vóór file-input `.click()` en verlengd tijdens FileReader/compression.
   */
  const filePickerGuardUntilRef = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  const isQuickAddDebug =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_DEBUG_QUICK_ADD === 'true';
  const quickAddDebug = useCallback(
    (...args: unknown[]) => {
      if (isQuickAddDebug && typeof console !== 'undefined') {
        console.debug('[quick-add]', ...args);
      }
    },
    [isQuickAddDebug]
  );

  const armFilePickerGuard = useCallback(
    (durationMs: number) => {
      const next = Date.now() + durationMs;
      if (next > filePickerGuardUntilRef.current) {
        filePickerGuardUntilRef.current = next;
      }
      quickAddDebug('armed file picker guard', { durationMs, until: filePickerGuardUntilRef.current });
    },
    [quickAddDebug]
  );

  const isFilePickerGuardActive = useCallback(() => {
    return Date.now() < filePickerGuardUntilRef.current;
  }, []);

  // Device detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkDevice = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice && isSmallScreen);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Start met sessie-rollen; extra fetch alleen op demand wanneer quick-add geopend wordt.
  useEffect(() => {
    if (session?.user) {
      const sessionRoles = (session.user as any)?.sellerRoles || [];
      const bootstrapRoles = Array.isArray(bootstrapProfile?.sellerRoles) ? bootstrapProfile.sellerRoles : [];
      const merged = sessionRoles.length > 0 ? sessionRoles : bootstrapRoles;
      setUserRoles(normalizeSellerRolesForQuickAdd(merged));
      setUserRolesLoaded(true);
    } else {
      setUserRoles([]);
      setUserRolesLoaded(true);
    }
  }, [session?.user, bootstrapProfile?.sellerRoles]);

  const loadUserRolesIfNeeded = useCallback(async () => {
    if (!session?.user || userRoles.length > 0) return;
    try {
      const profile = await ensureProfile();
      const roles = profile?.sellerRoles || [];
      if (Array.isArray(roles)) {
        setUserRoles(normalizeSellerRolesForQuickAdd(roles));
      }
    } catch {
      // fallback blijft sessie-data
    }
  }, [session?.user, userRoles.length, ensureProfile]);

  // Restore selectedPlatform from sessionStorage when component mounts or menu opens
  useEffect(() => {
    if (showQuickAddMenu && !selectedPlatform) {
      const storedPlatform = sessionStorage.getItem('quickAddPlatform') as Platform | null;
      if (storedPlatform && (storedPlatform === 'dorpsplein' || storedPlatform === 'inspiratie')) {
        console.log('Restoring platform from sessionStorage:', storedPlatform);
        setSelectedPlatform(storedPlatform);
      }
    }
  }, [showQuickAddMenu, selectedPlatform]);

  // Restore capturedPhoto and selectedPlatform from sessionStorage when going to category/location step
  // This ensures state is preserved when file picker closes
  useEffect(() => {
    if (showQuickAddMenu) {
      const storedPhoto = sessionStorage.getItem('quickAddPhoto');
      const storedPlatform = sessionStorage.getItem('quickAddPlatform') as Platform | null;
      const storedStep = sessionStorage.getItem('quickAddStep') as QuickAddStep | null;
      
      // CRITICAL: If we have a stored step in sessionStorage, restore it first
      if (storedStep && (storedStep === 'category' || storedStep === 'location') && storedPhoto && storedPlatform) {
        console.log('useEffect: Restoring step from sessionStorage:', storedStep);
        if (quickAddStep !== storedStep) {
          console.log('Step mismatch detected - current:', quickAddStep, 'stored:', storedStep, '- correcting!');
          setQuickAddStep(storedStep);
          setSelectedPlatform(storedPlatform);
          setCapturedPhoto(storedPhoto);
          return;
        }
      }
      
      // CRITICAL: Check for flags that indicate we should go to category/location
      const shouldGoToCategory = sessionStorage.getItem('quickAddShouldGoToCategory') === 'true';
      const shouldGoToLocation = sessionStorage.getItem('quickAddShouldGoToLocation') === 'true';
      
      if ((shouldGoToCategory || shouldGoToLocation) && storedPhoto && storedPlatform) {
        console.log('useEffect: Detected flags to go to category/location - executing!');
        if (shouldGoToCategory && storedPlatform === 'dorpsplein') {
          console.log('Going to category step');
          sessionStorage.removeItem('quickAddShouldGoToCategory');
          sessionStorage.removeItem('quickAddShouldGoToLocation');
          sessionStorage.setItem('quickAddStep', 'category');
          setQuickAddStep('category');
          setSelectedPlatform(storedPlatform);
          setCapturedPhoto(storedPhoto);
          return;
        } else if (shouldGoToLocation && storedPlatform === 'inspiratie') {
          console.log('Going to location step');
          sessionStorage.removeItem('quickAddShouldGoToCategory');
          sessionStorage.removeItem('quickAddShouldGoToLocation');
          sessionStorage.setItem('quickAddStep', 'location');
          setQuickAddStep('location');
          setSelectedPlatform(storedPlatform);
          setCapturedPhoto(storedPhoto);
          return;
        }
      }
      
      // CRITICAL: If we have a photo and platform in storage but step is 'platform' or 'photoSource', fix it!
      if (storedPhoto && storedPlatform && (quickAddStep === 'platform' || quickAddStep === 'photoSource')) {
        console.log('useEffect: Detected photo and platform in storage but step is', quickAddStep, '- fixing!');
        const correctStep: QuickAddStep = storedPlatform === 'dorpsplein' ? 'category' : 'location';
        console.log('Correcting step to', correctStep);
        sessionStorage.setItem('quickAddStep', correctStep);
        setQuickAddStep(correctStep);
        setSelectedPlatform(storedPlatform);
        setCapturedPhoto(storedPhoto);
        return;
      }
      
      // Normal restoration when step is already category/location
      if (quickAddStep === 'category' || quickAddStep === 'location') {
        console.log('useEffect: Checking restoration, step:', quickAddStep);
        console.log('useEffect: Photo in state:', capturedPhoto ? `Yes (${capturedPhoto.length} chars)` : 'No');
        console.log('useEffect: Photo in storage:', storedPhoto ? `Yes (${storedPhoto.length} chars)` : 'No');
        console.log('useEffect: Platform in state:', selectedPlatform || 'No');
        console.log('useEffect: Platform in storage:', storedPlatform || 'No');
        
        // CRITICAL: Restore platform if it's missing (can happen when file picker closes)
        if (!selectedPlatform && storedPlatform && (storedPlatform === 'dorpsplein' || storedPlatform === 'inspiratie')) {
          console.log('Restoring platform from sessionStorage:', storedPlatform);
          setSelectedPlatform(storedPlatform);
        }
        
        // Restore photo if it's missing
        if (storedPhoto) {
          // Always restore from storage, even if state exists, to ensure it's fresh
          if (!capturedPhoto || capturedPhoto !== storedPhoto) {
            console.log('Restoring photo from sessionStorage for category/location step');
            setCapturedPhoto(storedPhoto);
          }
        } else if (capturedPhoto) {
          // If we have state but no storage, save it
          console.log('Saving capturedPhoto to sessionStorage in useEffect...');
          sessionStorage.setItem('quickAddPhoto', capturedPhoto);
        }
      }
    }
  }, [showQuickAddMenu, quickAddStep, capturedPhoto, selectedPlatform]);


  /** Eén navigatiemechanisme: client Link naar feed-hash (geen prefetch+push dubbel). */
  const discoverLabel = t('bottomNav.discoverTab');
  const discoverIcon = '🧭';

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isFeedDiscoverActive = pathname === '/';
  const isHcpRouteActive = pathname === '/mijn-hcp';

  /** Alleen echte `<Link>` als er een user is — tijdens `loading` geen links naar /verkoper e.d. (voorkomt verkeerde eerste tap voor gast). */
  const useDirectTabLinks = Boolean(session?.user);

  /** Berichten + profiel: tijdens session `loading` wél `<Link>` zodat eerste tap direct navigeert (geen “dode” knop). */
  const messagesTabUseLink = sessionStatus !== 'unauthenticated';
  const profileTabUseLink = sessionStatus !== 'unauthenticated';

  /** Zelfde flow als +-knop; op verborgen-bottom-nav routes naar /sell/new (wizard blijft beschikbaar). */
  const verticalAllowedByIntent = useCallback((v: CreateFlowVertical) => {
    const allowed = intentAllowedVerticalsRef.current;
    if (!allowed || allowed.length === 0) return true;
    return allowed.includes(v);
  }, []);

  const openQuickAddFlow = useCallback(() => {
    const intent = consumeCreateFlowIntent();
    pendingAutoCategoryRef.current = null;
    pendingAutoLocationRef.current = null;
    intentAllowedVerticalsRef.current =
      intent?.allowedVerticals && intent.allowedVerticals.length > 0
        ? [...intent.allowedVerticals]
        : null;

    if (intent?.vertical) {
      if (intent.mode === 'dorpsplein') {
        pendingAutoCategoryRef.current = intent.vertical;
      } else {
        pendingAutoLocationRef.current = mapVerticalToInspiratieLocation(intent.vertical);
      }
    } else if (intent?.allowedVerticals?.length === 1) {
      const only = intent.allowedVerticals[0];
      if (intent.mode === 'dorpsplein') {
        pendingAutoCategoryRef.current = only;
      } else {
        pendingAutoLocationRef.current = mapVerticalToInspiratieLocation(only);
      }
    }

    createFlowDebug('intent-received', {
      mode: intent?.mode,
      vertical: intent?.vertical,
      allowedVerticals: intent?.allowedVerticals,
      autoCategory: pendingAutoCategoryRef.current,
      autoLocation: pendingAutoLocationRef.current,
    });
    if (intent?.mode === 'inspiratie') {
      createFlowDebug('inspiration-intent-received', {
        vertical: intent.vertical,
        allowedVerticals: intent.allowedVerticals,
        autoLocation: pendingAutoLocationRef.current,
      });
    }

    const sellNewSuffix = buildSellNewSearchFromIntent(intent);
    const sellNewPath = `/sell/new${sellNewSuffix}`;
    const safeSellNew = sanitizePostAuthRelativeUrl(sellNewPath) || sellNewPath;

    const openSoftAuthForCreate = () => {
      openSoftAuthGate({
        copyKey: 'create',
        intent: {
          type: 'create_item',
          mode: intent?.mode === 'inspiratie' ? 'inspiratie' : 'dorpsplein',
          vertical: intent?.vertical,
          returnPath: safeSellNew,
        },
      });
    };

    const bootstrapQuickAddUiFromIntent = () => {
      setShowQuickAddMenu(true);
      if (intent) {
        const platform: Platform = intent.mode === 'dorpsplein' ? 'dorpsplein' : 'inspiratie';
        setSelectedPlatform(platform);
        sessionStorage.setItem('quickAddPlatform', platform);
        setQuickAddStep('photoSource');
        sessionStorage.setItem('quickAddStep', 'photoSource');
        setCapturedPhoto(null);
        try {
          sessionStorage.removeItem('quickAddPhoto');
          sessionStorage.removeItem('quickAddShouldGoToCategory');
          sessionStorage.removeItem('quickAddShouldGoToLocation');
        } catch {
          /* ignore */
        }
      } else {
        setQuickAddStep('platform');
        sessionStorage.setItem('quickAddStep', 'platform');
        setSelectedPlatform(null);
        setCapturedPhoto(null);
        sessionStorage.removeItem('quickAddShouldGoToCategory');
        sessionStorage.removeItem('quickAddShouldGoToLocation');
      }
    };

    if (shouldHide) {
      if (!session?.user) {
        if (sessionStatus === 'loading') {
          router.push(sellNewPath);
          return;
        }
        openSoftAuthForCreate();
        return;
      }
      router.push(sellNewPath);
      return;
    }
    if (!session?.user) {
      if (sessionStatus === 'loading') {
        bootstrapQuickAddUiFromIntent();
        return;
      }
      openSoftAuthForCreate();
      return;
    }
    bootstrapQuickAddUiFromIntent();
  }, [session?.user, sessionStatus, shouldHide, router]);

  const handleQuickAddClick = () => {
    if (!session?.user && sessionStatus === 'unauthenticated') {
      const p = sanitizePostAuthRelativeUrl('/sell/new') || '/sell/new';
      openSoftAuthGate({
        copyKey: 'create',
        intent: { type: 'create_item', mode: 'dorpsplein', returnPath: p },
      });
      return;
    }
    void loadUserRolesIfNeeded();
    openQuickAddFlow();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOpenQuickAdd = () => {
      openQuickAddFlow();
    };
    window.addEventListener(QUICK_ADD_OPEN_EVENT, onOpenQuickAdd);
    return () => window.removeEventListener(QUICK_ADD_OPEN_EVENT, onOpenQuickAdd);
  }, [openQuickAddFlow]);

  // Lichte prefetch na idle; geen zware/private dashboardroutes op eerste paint.
  useEffect(() => {
    if (!session?.user || !pathname) return;

    const runPrefetch = () => {
      const routesToPrefetch = ['/messages', '/profile', '/mijn-hcp', '/'];
      routesToPrefetch.forEach((route) => {
        if (pathname === route || pathname.startsWith(route)) return;
        router.prefetch(route);
      });
    };

    let timer: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;
    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(runPrefetch, { timeout: 8000 });
    } else {
      timer = setTimeout(runPrefetch, 3000);
    }

    return () => {
      if (idleId !== null && typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleId);
      }
      if (timer) clearTimeout(timer);
    };
  }, [session?.user, router, pathname]);

  const handleDashboardClick = () => {
    if (!session?.user && sessionStatus === 'unauthenticated') {
      openSoftAuthGate({
        copyKey: 'generic',
        intent: {
          type: 'complete_profile',
          returnPath: sanitizePostAuthRelativeUrl('/verkoper/dashboard') || '/verkoper/dashboard',
        },
      });
      return;
    }
    router.push('/verkoper/dashboard');
  };

  const handleMessagesClick = () => {
    if (!session?.user && sessionStatus === 'unauthenticated') {
      openSoftAuthGate({
        copyKey: 'message',
        intent: {
          type: 'complete_profile',
          returnPath: sanitizePostAuthRelativeUrl('/messages') || '/messages',
        },
      });
      return;
    }
    router.push('/messages');
  };

  const handleProfileClick = () => {
    if (!session?.user && sessionStatus === 'unauthenticated') {
      openSoftAuthGate({
        copyKey: 'generic',
        intent: {
          type: 'complete_profile',
          returnPath: sanitizePostAuthRelativeUrl('/profile') || '/profile',
        },
      });
      return;
    }
    router.push('/profile');
  };

  // Quick Add Handlers
  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    sessionStorage.setItem('quickAddPlatform', platform);
    // Go to photo source selection (camera or gallery) - consistent for all browsers
    setQuickAddStep('photoSource');
    sessionStorage.setItem('quickAddStep', 'photoSource');
  };
  
  const handlePhotoSourceSelect = (
    source: 'gallery' | 'cameraPhoto' | 'cameraVideo'
  ) => {
    // Arm guard vóór het openen van de native picker. Safari/mobile vuurt soms na het
    // sluiten van de picker een synthetische click af; die mag de modal niet sluiten.
    armFilePickerGuard(1500);
    quickAddDebug('handlePhotoSourceSelect', { source });
    const ref =
      source === 'gallery'
        ? galleryFileInputRef
        : source === 'cameraPhoto'
          ? cameraPhotoInputRef
          : cameraVideoInputRef;
    ref.current?.click();
  };


  // Helper function to process photo and navigate to category/location selection
  const processPhotoAndNavigate = async (mediaUrl: string, isVideo: boolean = false) => {
    if (!mediaUrl) {
      console.error('processPhotoAndNavigate: No media URL provided');
      return;
    }

    // Get platform from state or storage
    const platformToUse = selectedPlatform || sessionStorage.getItem('quickAddPlatform') as Platform | null;
    
    if (!platformToUse) {
      console.error('No platform available! Cannot proceed.');
      alert(t('bottomNav.quickAdd.missingPlatform'));
      return;
    }

    // Determine the target step
    const targetStep: QuickAddStep = platformToUse === 'dorpsplein' ? 'category' : 'location';
    
    console.log('=== processPhotoAndNavigate ===');
    console.log('Media type:', isVideo ? 'Video' : 'Photo');
    console.log('Media URL length:', mediaUrl.length);
    console.log('Media size (approx):', ((mediaUrl.length * 3) / 4 / 1024).toFixed(1), 'KB');
    console.log('Platform:', platformToUse);
    console.log('Target step:', targetStep);

    // CRITICAL: Compress photo before storing to avoid storage quota errors
    // BUT: Don't compress videos - they're already compressed and compression doesn't work for videos
    let processedMediaUrl = mediaUrl;
    if (!isVideo) {
      try {
        console.log('Compressing photo for storage...');
        processedMediaUrl = await compressDataUrl(mediaUrl, 1920, 1080, 0.7, 500);
        const originalSizeKB = ((mediaUrl.length * 3) / 4 / 1024).toFixed(1);
        const compressedSizeKB = ((processedMediaUrl.length * 3) / 4 / 1024).toFixed(1);
        console.log(`Photo compressed: ${originalSizeKB}KB -> ${compressedSizeKB}KB`);
      } catch (error) {
        console.error('Error compressing photo, using original:', error);
        // Continue with original if compression fails
      }
    } else {
      console.log('Video detected - skipping compression (videos are already compressed)');
      // For videos, check size and warn if too large
      const videoSizeMB = ((mediaUrl.length * 3) / 4 / 1024 / 1024).toFixed(1);
      if (parseFloat(videoSizeMB) > 10) {
        console.warn(`Video is large (${videoSizeMB}MB) - may cause storage issues`);
      }
    }

    // CRITICAL: Store media (photo or video), platform, AND step in sessionStorage FIRST
    // This ensures data persists even if component re-renders when file picker closes
    try {
      // Store media in multiple locations for redundancy
      sessionStorage.setItem('quickAddPhoto', processedMediaUrl);
      sessionStorage.setItem('quickAddPlatform', platformToUse);
      sessionStorage.setItem('productPhoto', processedMediaUrl);
      sessionStorage.setItem('quickAddStep', targetStep); // Store step in sessionStorage
      sessionStorage.setItem('quickAddIsVideo', isVideo ? 'true' : 'false'); // Store if it's a video
      localStorage.setItem('pendingProductPhoto', processedMediaUrl);
      
      // Set flags as backup
      sessionStorage.setItem('quickAddShouldGoToCategory', platformToUse === 'dorpsplein' ? 'true' : 'false');
      sessionStorage.setItem('quickAddShouldGoToLocation', platformToUse === 'inspiratie' ? 'true' : 'false');
      
      console.log(`${isVideo ? 'Video' : 'Photo'} and step stored in sessionStorage`);
      
      // Update state AFTER storage is complete (use processed version)
      setCapturedPhoto(processedMediaUrl);
      
      // Ensure platform is in state
      if (platformToUse !== selectedPlatform) {
        console.log('Restoring platform from storage:', platformToUse);
        setSelectedPlatform(platformToUse);
      }
      
      // Update step state
      console.log('Setting step to:', targetStep);
      setQuickAddStep(targetStep);
      
      // Force a synchronous read to verify storage
      const verifyPhoto = sessionStorage.getItem('quickAddPhoto');
      const verifyStep = sessionStorage.getItem('quickAddStep');
      console.log('Verification - Photo stored:', verifyPhoto ? `Yes (${verifyPhoto.length} chars)` : 'No');
      console.log('Verification - Step stored:', verifyStep || 'No');

      createFlowDebug('photo-selected', {
        targetStep,
        platform: platformToUse,
        isVideo,
        pendingAutoCategory: pendingAutoCategoryRef.current,
        pendingAutoLocation: pendingAutoLocationRef.current,
        allowedVerticals: intentAllowedVerticalsRef.current,
      });
      
    } catch (error) {
      console.error('Error saving photo:', error);
      // Check if it's a quota exceeded error
      if (error instanceof Error && error.message.includes('quota')) {
        console.error('Storage quota exceeded! Photo is too large even after compression.');
        alert(t('errors.photoTooLarge'));
        return;
      }
      // Fallback: save to state and proceed anyway
      setCapturedPhoto(processedMediaUrl);
      setQuickAddStep(targetStep);
      // Try to save step to storage even in error case
      try {
        sessionStorage.setItem('quickAddStep', targetStep);
      } catch (e) {
        console.error('Error saving step to storage:', e);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Geen bestand: picker geannuleerd OF tweede change na programmatic .value='' — nooit menu sluiten.
    // We verlengen de guard kort, want sommige browsers vuren de phantom click net na
    // de cancel-change event af.
    if (!file) {
      armFilePickerGuard(800);
      quickAddDebug('handleFileSelect: no file (cancel) — keeping menu open');
      return;
    }
    // Verleng guard tijdens FileReader/compression zodat een late phantom-click niet
    // halverwege de async processing de modal sluit.
    armFilePickerGuard(2500);

    console.log('=== File selected ===');
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    console.log('Selected platform:', selectedPlatform);

    // Ensure we have a platform selected - check both state and storage
    const platformToUse = selectedPlatform || sessionStorage.getItem('quickAddPlatform') as Platform | null;
    if (!platformToUse) {
      console.error('No platform selected');
      alert(t('bottomNav.quickAdd.missingPlatform'));
      return;
    }

    // Ensure platform is in state before proceeding
    if (platformToUse !== selectedPlatform) {
      console.log('Restoring platform before file processing:', platformToUse);
      setSelectedPlatform(platformToUse);
      sessionStorage.setItem('quickAddPlatform', platformToUse);
    }

    // Check if file is video or image
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      console.error('File is neither image nor video:', file.type);
      alert(t('bottomNav.quickAdd.invalidMediaType'));
      try {
        input.value = "";
      } catch {
        /* ignore */
      }
      return;
    }
    
    console.log('Reading file with FileReader...');
    console.log('File type:', file.type);
    console.log('Is video:', isVideo);
    console.log('Is image:', isImage);
    
    const clearFileInput = () => {
      try {
        input.value = "";
      } catch {
        /* ignore */
      }
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const mediaUrl = e.target?.result as string;
      if (mediaUrl) {
        console.log('=== FileReader: Media loaded ===');
        console.log('Media type:', isVideo ? 'Video' : 'Photo');
        console.log('Media loaded, length:', mediaUrl.length);
        console.log('Media starts with data:', mediaUrl.startsWith('data:'));
        console.log('Media type:', mediaUrl.substring(5, mediaUrl.indexOf(';')));
        console.log('Selected platform:', platformToUse);
        
        // CRITICAL: Ensure platform is still available when FileReader completes
        // FileReader is async, so state might have changed
        const currentPlatform = selectedPlatform || sessionStorage.getItem('quickAddPlatform') as Platform | null;
        if (!currentPlatform) {
          console.error('Platform lost during FileReader processing!');
          // Try to restore from storage
          const storedPlatform = sessionStorage.getItem('quickAddPlatform') as Platform | null;
          if (storedPlatform) {
            console.log('Restoring platform from storage:', storedPlatform);
            setSelectedPlatform(storedPlatform);
            void processPhotoAndNavigate(mediaUrl, isVideo)
              .catch((err) => {
                console.error('Error in processPhotoAndNavigate:', err);
                alert(t('bottomNav.quickAdd.processMediaError'));
              })
              .finally(clearFileInput);
          } else {
            console.error('Cannot proceed without platform');
            alert(t('bottomNav.quickAdd.missingPlatform'));
            clearFileInput();
          }
        } else {
          void processPhotoAndNavigate(mediaUrl, isVideo)
            .catch((error) => {
              console.error('Error in processPhotoAndNavigate:', error);
              alert(t('bottomNav.quickAdd.processMediaError'));
            })
            .finally(clearFileInput);
        }
      } else {
        console.error('Failed to load media - FileReader result is empty');
        clearFileInput();
      }
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      console.error('FileReader error details:', reader.error);
      alert(t('bottomNav.quickAdd.readFileError'));
      clearFileInput();
    };
    reader.onabort = () => {
      console.error('FileReader aborted');
      clearFileInput();
    };
    
    // Read file as data URL
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      alert(t('bottomNav.quickAdd.readFileError'));
      clearFileInput();
    }
  };

  const handleCategorySelect = async (category: Category) => {
    // Volledige diagnose-snapshot: dit is exact het moment waarop we tot voor kort
    // de quick-add modal sloten en met `window.location.href` een hard reload deden.
    // Bij die hard reload gingen we soms terug naar `/` doordat de SessionProvider
    // tijdens het opnieuw mounten kort 'unauthenticated' rapporteerde en SessionGuard
    // dan sessionStorage volledig wiste — incl. de net-opgeslagen foto.
    quickAddDebug('handleCategorySelect entry', {
      category,
      selectedPlatform,
      hasCapturedPhoto: !!capturedPhoto,
      capturedPhotoLength: capturedPhoto?.length ?? 0,
      sessionStorageKeys: Object.keys(sessionStorage),
      hasSessionPhoto: !!sessionStorage.getItem('quickAddPhoto'),
      hasProductPhoto: !!sessionStorage.getItem('productPhoto'),
      hasLocalPendingPhoto: !!localStorage.getItem('pendingProductPhoto'),
    });

    // Read photo from storage - try ALL possible locations
    // Priority: sessionStorage > localStorage > state
    let photoUrl = sessionStorage.getItem('quickAddPhoto') || 
                   sessionStorage.getItem('productPhoto') ||
                   localStorage.getItem('pendingProductPhoto') ||
                   capturedPhoto;
    
    // If we have photo in state but not in storage, save it now
    if (capturedPhoto && !photoUrl) {
      photoUrl = capturedPhoto;
    }

    quickAddDebug('handleCategorySelect resolved photo', {
      hasPhoto: !!photoUrl,
      photoLength: photoUrl?.length ?? 0,
    });
    
    // Compress alleen foto's — video's niet door canvas/compressDataUrl halen
    const srcIsVideo = !!photoUrl && photoUrl.startsWith('data:video/');
    let compressedPhotoUrl = photoUrl;
    if (photoUrl && !srcIsVideo) {
      try {
        compressedPhotoUrl = await compressDataUrl(photoUrl, 1920, 1080, 0.7, 500);
      } catch (error) {
        console.error('[quick-add] Error compressing photo, using original:', error);
      }
    }

    const isVideo = srcIsVideo || compressedPhotoUrl?.startsWith('data:video/') || false;

    // CRITICAL: Save everything to storage BEFORE navigation
    // This ensures data is available when the new page loads
    if (compressedPhotoUrl) {
      try {
        sessionStorage.setItem('productPhoto', compressedPhotoUrl);
        sessionStorage.setItem('quickAddPhoto', compressedPhotoUrl);
        sessionStorage.setItem('productIsVideo', isVideo ? 'true' : 'false');
        localStorage.setItem('pendingProductPhoto', compressedPhotoUrl);
        localStorage.setItem('pendingProductCategory', category);
      } catch (error) {
        console.error(`[quick-add] Error storing ${isVideo ? 'video' : 'photo'}:`, error);
        if (error instanceof Error && error.message.includes('quota')) {
          alert(isVideo ? t('bottomNav.quickAdd.videoTooLargeStorage') : t('errors.photoTooLarge'));
          return;
        }
        throw error;
      }
    }

    sessionStorage.setItem('productCategory', category);

    const targetUrl = compressedPhotoUrl
      ? `/sell/new?category=${category}&photo=true`
      : `/sell/new?category=${category}`;

    quickAddDebug('handleCategorySelect navigating', {
      targetUrl,
      category,
      selectedPlatform,
      hasPhoto: !!compressedPhotoUrl,
      isVideo,
      sessionStorageKeysBefore: Object.keys(sessionStorage),
    });
    createFlowDebug('form-open-dorpsplein', {
      category,
      targetUrl,
      hasPhoto: !!compressedPhotoUrl,
    });

    // Sluit de quick-add modal eerst (state-only). Bewust GEEN
    // `closeQuickAddMenu()` aanroepen: die wist `quickAddPhoto` niet maar zou wel
    // andere quick-add flags resetten — die zijn voor de overgang naar /sell/new
    // niet meer relevant.
    setShowQuickAddMenu(false);
    setQuickAddStep('platform');
    setSelectedPlatform(null);

    // Soft client-side navigatie i.p.v. `window.location.href`. Dit voorkomt:
    //   1) een hard reload waarbij SessionProvider kort 'unauthenticated' kan
    //      rapporteren → SessionGuard → `clearAllUserData()` → sessionStorage.clear()
    //      → `productPhoto`/`quickAddPhoto` zijn weg → /sell/new laadt zonder foto;
    //   2) dat `useUserValidation` na hard reload opnieuw een /api/profile/me roept
    //      die op een lokale dev-DB 404 kan geven en zo signOut → / triggert;
    //   3) dat de i18n bundel opnieuw geladen moet worden (was zichtbaar als
    //      "Loaded user language preference: nl" spam).
    // Met `router.push` blijft de NextAuth-sessie en sessionStorage intact.
    router.push(targetUrl);
  };

  const handleLocationSelect = React.useCallback(async (location: Location) => {
    quickAddDebug('handleLocationSelect entry', {
      location,
      hasCapturedPhoto: !!capturedPhoto,
      sessionStorageKeys: Object.keys(sessionStorage),
    });

    // Get photo from ALL possible sources - prioritize sessionStorage
    let photoUrl = sessionStorage.getItem('quickAddPhoto') ||
                   sessionStorage.getItem('productPhoto') ||
                   localStorage.getItem('pendingProductPhoto') ||
                   capturedPhoto;

    if (capturedPhoto && !photoUrl) {
      photoUrl = capturedPhoto;
    } else if (capturedPhoto && photoUrl !== capturedPhoto) {
      photoUrl = capturedPhoto;
    }
    
    const srcIsVideoInsp = !!photoUrl && photoUrl.startsWith('data:video/');
    let compressedPhotoUrl = photoUrl;
    if (photoUrl && !srcIsVideoInsp) {
      try {
        compressedPhotoUrl = await compressDataUrl(photoUrl, 1920, 1080, 0.7, 500);
      } catch (error) {
        console.error('[quick-add] Error compressing photo, using original:', error);
      }
    }

    // Map inspiratie locations to internal location names
    let internalLocation = location;
    let tab = 'dishes-chef';

    if (location === 'recepten') {
      internalLocation = 'keuken';
      tab = 'dishes-chef';
    } else if (location === 'kweken') {
      internalLocation = 'tuin';
      tab = 'dishes-garden';
    } else if (location === 'designs') {
      internalLocation = 'atelier';
      tab = 'dishes-designer';
    } else if (location === 'tuin') {
      tab = 'dishes-garden';
    } else if (location === 'atelier') {
      tab = 'dishes-designer';
    }

    sessionStorage.setItem('inspiratieLocation', internalLocation);

    const finalPhotoUrl = compressedPhotoUrl;
    const isVideo = finalPhotoUrl?.startsWith('data:video/') || false;

    if (finalPhotoUrl) {
      try {
        sessionStorage.setItem('inspiratiePhoto', finalPhotoUrl);
        sessionStorage.setItem('inspiratieIsVideo', isVideo ? 'true' : 'false');
        if (!sessionStorage.getItem('quickAddPhoto')) {
          sessionStorage.setItem('quickAddPhoto', finalPhotoUrl);
        }
      } catch (error) {
        console.error(`[quick-add] Error storing ${isVideo ? 'video' : 'photo'} in sessionStorage:`, error);
        if (error instanceof Error && error.message.includes('quota')) {
          alert(isVideo ? t('bottomNav.quickAdd.videoTooLargeStorage') : t('errors.photoTooLarge'));
          return;
        }
        throw error;
      }
    }

    if (finalPhotoUrl) {
      localStorage.setItem('pendingInspiratiePhoto', finalPhotoUrl);
      localStorage.setItem('pendingInspiratieLocation', internalLocation);
    }

    const targetUrl = finalPhotoUrl
      ? `/profile?tab=${tab}&addInspiratie=true&openForm=true`
      : `/profile?tab=${tab}&openForm=true`;

    quickAddDebug('handleLocationSelect navigating', {
      targetUrl,
      location,
      internalLocation,
      hasPhoto: !!finalPhotoUrl,
      isVideo,
    });
    createFlowDebug('form-open-inspiratie', {
      location,
      internalLocation,
      targetUrl,
      hasPhoto: !!finalPhotoUrl,
    });

    setShowQuickAddMenu(false);
    setQuickAddStep('platform');
    setSelectedPlatform(null);

    // Soft client-side navigation; zelfde reden als bij handleCategorySelect:
    // hard reload kan SessionGuard triggeren die sessionStorage wist en de
    // gebruiker (na 404 op /api/profile/me in dev) onbedoeld op de homepage
    // achterlaat.
    router.push(targetUrl);
    createFlowDebug('inspiration-form-opened', {
      targetUrl,
      internalLocation,
      tab,
      location,
      hasPhoto: !!finalPhotoUrl,
    });
  }, [capturedPhoto, t, quickAddDebug, router]);

  /** Intent: na foto automatisch door naar /sell/new of profiel als de rol klopt. */
  useEffect(() => {
    if (!showQuickAddMenu || !userRolesLoaded) return;
    const photo =
      capturedPhoto ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('quickAddPhoto') : null);
    if (!photo) return;

    const roleForCategory = (c: Category) =>
      c === 'CHEFF' ? 'chef' : c === 'GARDEN' ? 'garden' : 'designer';
    const roleForLocation = (loc: Location) =>
      loc === 'recepten' ? 'chef' : loc === 'kweken' ? 'garden' : 'designer';

    if (quickAddStep === 'category') {
      const cat = pendingAutoCategoryRef.current;
      if (!cat) return;
      if (session?.user && userRoles.length === 0) {
        createFlowDebug('auto-category-wait-roles', { cat });
        createFlowDebug('waiting-for-userRoles', { step: 'category', cat });
        return;
      }
      const allowedCat = intentAllowedVerticalsRef.current;
      if (allowedCat && allowedCat.length > 0 && !allowedCat.includes(cat)) {
        pendingAutoCategoryRef.current = null;
        createFlowDebug('auto-category-blocked', {
          cat,
          blockedReason: 'not-in-allowed-verticals',
          allowedVerticals: allowedCat,
        });
        return;
      }
      const neededRole = roleForCategory(cat);
      if (!userRoles.includes(neededRole)) {
        pendingAutoCategoryRef.current = null;
        createFlowDebug('auto-category-blocked', {
          cat,
          neededRole,
          userRoles,
          blockedReason: 'role-mismatch',
        });
        return;
      }
      pendingAutoCategoryRef.current = null;
      createFlowDebug('auto-category-fire', { cat });
      void handleCategorySelect(cat);
      return;
    }

    if (quickAddStep === 'location') {
      const loc = pendingAutoLocationRef.current;
      if (!loc) return;
      if (loc !== 'recepten' && loc !== 'kweken' && loc !== 'designs') return;
      if (session?.user && userRoles.length === 0) {
        createFlowDebug('auto-location-wait-roles', { loc });
        createFlowDebug('waiting-for-userRoles', { step: 'location', loc });
        return;
      }
      const vertForLoc: CreateFlowVertical =
        loc === 'recepten' ? 'CHEFF' : loc === 'kweken' ? 'GARDEN' : 'DESIGNER';
      const allowedLoc = intentAllowedVerticalsRef.current;
      if (allowedLoc && allowedLoc.length > 0 && !allowedLoc.includes(vertForLoc)) {
        pendingAutoLocationRef.current = null;
        createFlowDebug('auto-location-blocked', {
          loc,
          blockedReason: 'not-in-allowed-verticals',
          allowedVerticals: allowedLoc,
          vertForLoc,
        });
        return;
      }
      const neededRole = roleForLocation(loc);
      if (!userRoles.includes(neededRole)) {
        pendingAutoLocationRef.current = null;
        createFlowDebug('auto-location-blocked', {
          loc,
          neededRole,
          userRoles,
          blockedReason: 'role-mismatch',
        });
        return;
      }
      pendingAutoLocationRef.current = null;
      createFlowDebug('auto-location-fire', { loc });
      void handleLocationSelect(loc);
    }
  }, [
    showQuickAddMenu,
    quickAddStep,
    userRolesLoaded,
    userRoles,
    capturedPhoto,
    session?.user,
    handleCategorySelect,
    handleLocationSelect,
  ]);

  /** Alleen sheet sluiten; bewaart quick-add state + sessionStorage (concept/foto) voor hervatten. */
  const softDismissQuickAddMenu = useCallback(() => {
    setShowQuickAddMenu(false);
    resetCreateFlowUiState({ keepDraft: true });
  }, []);

  const closeQuickAddMenu = () => {
    pendingAutoCategoryRef.current = null;
    pendingAutoLocationRef.current = null;
    intentAllowedVerticalsRef.current = null;
    setShowQuickAddMenu(false);
    setQuickAddStep('platform');
    setSelectedPlatform(null);
    setCapturedPhoto(null);
    // Clean up sessionStorage flags (but keep photo data for form navigation)
    sessionStorage.removeItem('quickAddShouldGoToCategory');
    sessionStorage.removeItem('quickAddShouldGoToLocation');
    sessionStorage.removeItem('quickAddStep');
    // Note: We don't remove quickAddPhoto here as it might be needed for form navigation
    resetCreateFlowUiState({ keepDraft: true });
  };

  const goBackInQuickAdd = () => {
    if (quickAddStep === 'category' || quickAddStep === 'location') {
      pendingAutoCategoryRef.current = null;
      pendingAutoLocationRef.current = null;
      // Go back to photo source selection
      setQuickAddStep('photoSource');
      sessionStorage.setItem('quickAddStep', 'photoSource');
      setCapturedPhoto(null);
      sessionStorage.removeItem('quickAddPhoto');
      sessionStorage.removeItem('quickAddShouldGoToCategory');
      sessionStorage.removeItem('quickAddShouldGoToLocation');
    } else if (quickAddStep === 'photoSource') {
      // Go back to platform selection
      setQuickAddStep('platform');
      sessionStorage.setItem('quickAddStep', 'platform');
      setSelectedPlatform(null);
      sessionStorage.removeItem('quickAddPlatform');
    } else if (quickAddStep === 'platform') {
      closeQuickAddMenu();
    }
  };

  useEffect(() => {
    if (!showQuickAddMenu) return;
    return pushAndroidBackHandler(() => {
      if (quickAddStep === "category" || quickAddStep === "location") {
        pendingAutoCategoryRef.current = null;
        pendingAutoLocationRef.current = null;
        setQuickAddStep("photoSource");
        sessionStorage.setItem("quickAddStep", "photoSource");
        setCapturedPhoto(null);
        sessionStorage.removeItem("quickAddPhoto");
        sessionStorage.removeItem("quickAddShouldGoToCategory");
        sessionStorage.removeItem("quickAddShouldGoToLocation");
        return true;
      }
      if (quickAddStep === "photoSource") {
        setQuickAddStep("platform");
        sessionStorage.setItem("quickAddStep", "platform");
        setSelectedPlatform(null);
        sessionStorage.removeItem("quickAddPlatform");
        return true;
      }
      if (quickAddStep === "platform") {
        closeQuickAddMenu();
        return true;
      }
      return true;
    });
  }, [showQuickAddMenu, quickAddStep]);

  // Hide navigation on certain pages
  if (shouldHide) return null;

  return (
    <>
      {/* Aparte inputs: gecombineerd accept + capture laat Android vaak in videomodus starten */}
      <input
        ref={galleryFileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraPhotoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraVideoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Quick Camera - Not used anymore, file picker with capture attribute is used instead */}

      {/* Quick Add Menu Overlay */}
      {showQuickAddMenu && (
        <div 
          className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-end md:items-center justify-center p-4 md:p-0"
          onClick={(e) => {
            // Only close if clicking directly on overlay background
            if (e.target !== e.currentTarget) return;
            // Negeer phantom click die Safari/mobile soms vuurt vlak na het sluiten van
            // de native file picker — dit voorkomt dat de modal terugvalt naar homepage.
            if (isFilePickerGuardActive()) {
              quickAddDebug('overlay click ignored — file picker guard active');
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            softDismissQuickAddMenu();
          }}
        >
          <div 
            className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-md md:max-w-sm shadow-2xl animate-in slide-in-from-bottom md:animate-none relative z-[101]"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Platform Selection - ONLY show when step is platform */}
            {quickAddStep === 'platform' && (
              <div className="p-6" key="platform-step">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">{t('bottomNav.quickAdd.platformTitle')}</h3>
                  <button
                    type="button"
                    onClick={closeQuickAddMenu}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label={t('buttons.close')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handlePlatformSelect('dorpsplein')}
                    className="w-full p-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                  >
                    <div className="text-2xl mb-1">🏪</div>
                    <div className="text-lg font-bold">{t('bottomNav.dorpsplein')}</div>
                    <div className="text-sm opacity-90">{t('bottomNav.sellProducts')}</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handlePlatformSelect('inspiratie')}
                    className="w-full p-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                  >
                    <div className="text-2xl mb-1">✨</div>
                    <div className="text-lg font-bold">{t('bottomNav.inspiratie')}</div>
                    <div className="text-sm opacity-90">{t('bottomNav.shareIdeas')}</div>
                  </button>
                </div>
              </div>
            )}

            {/* Photo Source Selection - Camera or Gallery */}
            {quickAddStep === 'photoSource' && (
              <div className="p-6" key="photoSource-step">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={goBackInQuickAdd}
                      className="shrink-0 px-3 py-2 text-sm font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors min-h-[44px]"
                    >
                      Terug
                    </button>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-gray-900">{t('bottomNav.quickAdd.photoTitle')}</h3>
                      <p className="text-sm text-gray-600">{t('bottomNav.quickAdd.photoSubtitle')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={softDismissQuickAddMenu}
                    className="shrink-0 px-3 py-2 text-sm font-medium text-gray-800 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors min-h-[44px]"
                  >
                    Sluiten
                  </button>
                </div>
                
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handlePhotoSourceSelect('gallery')}
                    className="w-full p-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                  >
                    <div className="text-2xl mb-1">📷</div>
                    <div className="text-lg font-bold">{t('bottomNav.quickAdd.galleryTitle')}</div>
                    <div className="text-sm opacity-90">{t('bottomNav.quickAdd.gallerySubtitle')}</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handlePhotoSourceSelect('cameraPhoto')}
                    className="w-full p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                  >
                    <div className="text-2xl mb-1">📸</div>
                    <div className="text-lg font-bold">{t('bottomNav.quickAdd.takePhotoTitle')}</div>
                    <div className="text-sm opacity-90">{t('bottomNav.quickAdd.takePhotoSubtitle')}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePhotoSourceSelect('cameraVideo')}
                    className="w-full p-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                  >
                    <div className="text-2xl mb-1">🎬</div>
                    <div className="text-lg font-bold">{t('bottomNav.quickAdd.takeVideoTitle')}</div>
                    <div className="text-sm opacity-90">{t('bottomNav.quickAdd.takeVideoSubtitle')}</div>
                  </button>
                </div>
              </div>
            )}

            {/* Category Selection (Dorpsplein) - ONLY show when step is category */}
            {quickAddStep === 'category' && (
              <div className="p-6" key="category-step">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900">{t('bottomNav.quickAdd.categoryTitle')}</h3>
                    <p className="text-sm text-gray-600">{t('bottomNav.quickAdd.categorySubtitle')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={softDismissQuickAddMenu}
                    className="shrink-0 px-3 py-2 text-sm font-medium text-gray-800 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors min-h-[44px]"
                  >
                    Sluiten
                  </button>
                </div>
                
                {capturedPhoto && (
                  <div className="mb-6" style={{ pointerEvents: 'none' }}>
                    <QuickAddMediaPreview
                      media={capturedPhoto}
                      alt={t('camera.selectedPhoto')}
                    />
                  </div>
                )}
                
                <div className="space-y-3" style={{ position: 'relative', zIndex: 10 }}>
                  {userRoles.includes('chef') && verticalAllowedByIntent('CHEFF') && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleCategorySelect('CHEFF').catch((error) => {
                          console.error('Error in handleCategorySelect:', error);
                          alert(t('errors.categoryClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        });
                      }}
                      className="w-full min-h-[44px] p-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left touch-manipulation"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        position: 'relative',
                        zIndex: 20,
                      }}
                    >
                      <div className="text-2xl mb-1">🍳</div>
                      <div className="text-lg font-bold">{t('bottomNav.quickAdd.roleChefTitle')}</div>
                      <div className="text-sm opacity-90">{t('bottomNav.quickAdd.roleChefSubtitle')}</div>
                    </button>
                  )}
                  
                  {userRoles.includes('garden') && verticalAllowedByIntent('GARDEN') && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleCategorySelect('GARDEN').catch((error) => {
                          console.error('Error in handleCategorySelect:', error);
                          alert(t('errors.categoryClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        });
                      }}
                      className="w-full min-h-[44px] p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left touch-manipulation"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        position: 'relative',
                        zIndex: 20,
                      }}
                    >
                      <div className="text-2xl mb-1">🌱</div>
                      <div className="text-lg font-bold">{t('bottomNav.quickAdd.roleGardenTitle')}</div>
                      <div className="text-sm opacity-90">{t('bottomNav.quickAdd.roleGardenSubtitle')}</div>
                    </button>
                  )}
                  
                  {userRoles.includes('designer') && verticalAllowedByIntent('DESIGNER') && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleCategorySelect('DESIGNER').catch((error) => {
                          console.error('Error in handleCategorySelect:', error);
                          alert(t('errors.categoryClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        });
                      }}
                      className="w-full min-h-[44px] p-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left touch-manipulation"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        position: 'relative',
                        zIndex: 20,
                      }}
                    >
                      <div className="text-2xl mb-1">🎨</div>
                      <div className="text-lg font-bold">{t('bottomNav.quickAdd.roleDesignerTitle')}</div>
                      <div className="text-sm opacity-90">{t('bottomNav.quickAdd.roleDesignerSubtitle')}</div>
                    </button>
                  )}
                  
                  {userRolesLoaded && userRoles.length === 0 && session?.user && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">{t('bottomNav.quickAdd.noSellerRoles')}</p>
                      <Link
                        href="/profile?tab=overview"
                        className="inline-block bg-primary-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                        onClick={closeQuickAddMenu}
                      >
                        {t('bottomNav.setupHomeCheff')}
                      </Link>
                    </div>
                  )}
                  {!userRolesLoaded && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">{t('common.loadingDots')}</p>
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={goBackInQuickAdd}
                  className="w-full mt-4 p-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all active:scale-95"
                >
                  {t('messages.back')}
                </button>
              </div>
            )}

            {/* Location Selection (Inspiratie) - ONLY show when step is location */}
            {quickAddStep === 'location' && (
              <div className="p-6" key="location-step">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900">{t('bottomNav.quickAdd.locationTitle')}</h3>
                    <p className="text-sm text-gray-600">{t('bottomNav.quickAdd.locationSubtitle')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={softDismissQuickAddMenu}
                    className="shrink-0 px-3 py-2 text-sm font-medium text-gray-800 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors min-h-[44px]"
                  >
                    Sluiten
                  </button>
                </div>
                
                {capturedPhoto && (
                  <div className="mb-6" style={{ pointerEvents: 'none' }}>
                    <QuickAddMediaPreview
                      media={capturedPhoto}
                      alt={t('camera.selectedPhoto')}
                    />
                  </div>
                )}
                
                <div className="space-y-3" style={{ position: 'relative', zIndex: 10 }}>
                  {userRoles.includes('chef') && verticalAllowedByIntent('CHEFF') && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleLocationSelect('recepten').catch((error) => {
                          console.error('Error in handleLocationSelect:', error);
                          alert(t('errors.locationClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        });
                      }}
                      className="w-full min-h-[44px] p-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left touch-manipulation"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        position: 'relative',
                        zIndex: 20,
                      }}
                    >
                      <div className="text-2xl mb-1">📝</div>
                      <div className="text-lg font-bold">{t('bottomNav.quickAdd.inspRecipesTitle')}</div>
                      <div className="text-sm opacity-90">{t('bottomNav.quickAdd.inspRecipesSubtitle')}</div>
                    </button>
                  )}
                  
                  {userRoles.includes('garden') && verticalAllowedByIntent('GARDEN') && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleLocationSelect('kweken').catch((error) => {
                          console.error('Error in handleLocationSelect:', error);
                          alert(t('errors.locationClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        });
                      }}
                      className="w-full min-h-[44px] p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left touch-manipulation"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        position: 'relative',
                        zIndex: 20,
                      }}
                    >
                      <div className="text-2xl mb-1">🌱</div>
                      <div className="text-lg font-bold">{t('bottomNav.quickAdd.inspGardenTitle')}</div>
                      <div className="text-sm opacity-90">{t('bottomNav.quickAdd.inspGardenSubtitle')}</div>
                    </button>
                  )}
                  
                  {userRoles.includes('designer') && verticalAllowedByIntent('DESIGNER') && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleLocationSelect('designs').catch((error) => {
                          console.error('Error in handleLocationSelect:', error);
                          alert(t('errors.locationClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        });
                      }}
                      className="w-full min-h-[44px] p-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left touch-manipulation"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        position: 'relative',
                        zIndex: 20,
                      }}
                    >
                      <div className="text-2xl mb-1">🎨</div>
                      <div className="text-lg font-bold">{t('bottomNav.quickAdd.inspDesignTitle')}</div>
                      <div className="text-sm opacity-90">{t('bottomNav.quickAdd.inspDesignSubtitle')}</div>
                    </button>
                  )}
                  
                  {userRolesLoaded && userRoles.length === 0 && session?.user && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">{t('bottomNav.quickAdd.noSellerRoles')}</p>
                      <Link
                        href="/profile?tab=overview"
                        className="inline-block bg-primary-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                        onClick={closeQuickAddMenu}
                      >
                        {t('bottomNav.setupHomeCheff')}
                      </Link>
                    </div>
                  )}
                  {!userRolesLoaded && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">{t('common.loadingDots')}</p>
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={goBackInQuickAdd}
                  className="w-full mt-4 p-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all active:scale-95"
                >
                  {t('messages.back')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div
        data-hc-bottom-nav
        className={cn(
          /* Geen pointer-events-none hier: op Android WebView kan dat scroll-gesture routing breken. */
          /* z-[58]: boven o.a. cookie-banner (z-30) en gelijk met/onder promo-modals (z-[70]). */
          'fixed bottom-0 left-0 right-0 max-w-[100vw] overflow-x-hidden z-[58] transition-[box-shadow,padding,border-color,background-color] duration-200 ease-out',
          'bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/88 border-t border-emerald-100/70',
          'shadow-[0_-12px_44px_-14px_rgba(13,148,136,0.14),0_-4px_18px_-8px_rgba(0,0,0,0.06)]',
          isNativeShell
            ? 'py-3 pt-[0.625rem] pb-[max(0.75rem,calc(env(safe-area-inset-bottom,0px)+10px))] px-2 sm:px-3'
            : 'py-2.5 px-2 sm:px-4'
        )}
      >
        {appUpdateStatus.showOptionalReminder ? (
          <div className="max-w-4xl mx-auto w-full px-1 pb-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => void appUpdateStatus.triggerApkDownload()}
              className="flex w-full touch-pan-y items-center justify-center gap-2 rounded-lg border border-emerald-200/90 bg-emerald-50/95 py-1.5 text-xs font-semibold text-emerald-950 active:bg-emerald-100/90"
            >
              <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{t('appUpdateGate.updateAvailableShort')}</span>
              <span className="text-emerald-800/80">·</span>
              <span className="line-clamp-2 text-left">{t('appUpdateGate.reminderFinishInstall')}</span>
            </button>
          </div>
        ) : null}
        <div
          className={cn(
            'flex items-center max-w-4xl mx-auto min-w-0',
            'gap-x-1 sm:gap-x-2 md:gap-x-3'
          )}
        >
          {/* Ontdekken — één Link (geen router.push + prefetch dubbel) */}
          <div className="flex-1 min-w-0 flex justify-center">
            <Link
              href="/#homecheff-feed"
              prefetch={false}
              scroll={false}
              className={navTabClasses(isFeedDiscoverActive, isNativeShell)}
              onClick={() =>
                navDebug('bottom-nav:tap', { tab: 'discover', href: '/#homecheff-feed', path: pathname })
              }
            >
              <div className="text-[1.35rem] sm:text-2xl leading-none mb-1">{discoverIcon}</div>
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate w-full text-center leading-tight px-0.5">
                {discoverLabel}
              </span>
            </Link>
          </div>

          {/* Dashboard */}
          <div className="relative group flex-1 min-w-0 flex justify-center">
            {useDirectTabLinks ? (
              <Link
                href="/verkoper/dashboard"
                prefetch={false}
                className={navTabClasses(Boolean(pathname?.startsWith('/verkoper')), isNativeShell)}
                onClick={() =>
                  navDebug('bottom-nav:tap', { tab: 'dashboard', href: '/verkoper/dashboard', path: pathname })
                }
              >
                <div className="text-[1.35rem] sm:text-2xl leading-none mb-1">💰</div>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate w-full text-center leading-tight px-0.5">
                  {session?.user ? t('bottomNav.dashboard') : t('bottomNav.earn')}
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleDashboardClick}
                className={navTabClasses(Boolean(pathname?.startsWith('/verkoper')), isNativeShell)}
              >
                <div className="text-[1.35rem] sm:text-2xl leading-none mb-1">💰</div>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate w-full text-center leading-tight px-0.5">
                  {t('bottomNav.earn')}
                </span>
              </button>
            )}
            {!session?.user && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                  <div className="font-semibold mb-1">💰 {t('bottomNav.earn')}</div>
                  <div className="text-gray-300">{t('bottomNav.earnDesc')}</div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ADD Button (FAB) — blijft dominant met zachte emerald-glow */}
          <div className="relative group flex-shrink-0 flex justify-center px-0.5 sm:px-1.5">
            <button
              type="button"
              onClick={handleQuickAddClick}
              className={cn(
                'relative rounded-full text-white transition-all duration-200 ease-out touch-manipulation select-none active:scale-95',
                'bg-gradient-to-br from-primary-brand via-emerald-600 to-teal-600',
                'shadow-[0_8px_26px_-6px_rgba(16,185,129,0.55),0_4px_14px_-4px_rgba(14,116,144,0.35)]',
                'hover:shadow-[0_10px_32px_-6px_rgba(16,185,129,0.6)] hover:scale-[1.06]',
                'ring-[3px] ring-white/95 ring-offset-2 ring-offset-transparent',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/45 focus-visible:ring-offset-2',
                /* Native: geen negatieve top — anders reikt de hit-box van z-40-laag ver de feed in (Android WebView blokkeert scroll). */
                isNativeShell
                  ? 'top-0 p-[0.9375rem] sm:p-[1.0625rem]'
                  : '-top-3 sm:-top-4 p-3 sm:p-[1.05rem]'
              )}
              aria-label={t('bottomNav.addItems')}
            >
              <svg
                className={cn(isNativeShell ? 'w-9 h-9' : 'w-8 h-8 sm:w-9 sm:h-9')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
            {!session?.user && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                  <div className="font-semibold mb-1">{t('bottomNav.addItems')}</div>
                  <div className="text-gray-300">{t('bottomNav.addItemsDesc')}</div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Berichten */}
          <div className="relative group flex-1 min-w-0 flex justify-center">
            {messagesTabUseLink ? (
              <Link
                href="/messages"
                prefetch={false}
                className={navTabClasses(isActive('/messages'), isNativeShell)}
                onClick={() =>
                  navDebug('bottom-nav:tap', { tab: 'messages', href: '/messages', path: pathname })
                }
              >
                <div className="text-[1.35rem] sm:text-2xl leading-none mb-1">💬</div>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate w-full text-center leading-tight px-0.5">
                  {t('bottomNav.messages')}
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleMessagesClick}
                className={navTabClasses(isActive('/messages'), isNativeShell)}
              >
                <div className="text-[1.35rem] sm:text-2xl leading-none mb-1">💬</div>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate w-full text-center leading-tight px-0.5">
                  {t('bottomNav.messages')}
                </span>
              </button>
            )}
            {!session?.user && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                  <div className="font-semibold mb-1">💬 {t('bottomNav.messages')}</div>
                  <div className="text-gray-300">{t('bottomNav.messagesDesc')}</div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* HomeCheff Points — eigen capsule tussen Berichten en Mijn HC (zelfde design-taal als de balk) */}
          {session?.user ? (
            <div className="flex-shrink-0 flex items-center justify-center px-0.5 sm:px-1 md:px-1.5">
              <Link
                href="/mijn-hcp"
                prefetch={false}
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl touch-pan-y transition-all duration-200 ease-out',
                  'min-h-[52px] min-w-[3.25rem] sm:min-w-[3.5rem] px-2 py-1.5',
                  'bg-gradient-to-b from-emerald-50/98 via-teal-50/92 to-cyan-50/75',
                  'border border-emerald-200/60 shadow-[0_3px_16px_-6px_rgba(13,148,136,0.28),inset_0_1px_0_rgba(255,255,255,0.85)]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                  isHcpRouteActive
                    ? 'ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-white scale-[1.02]'
                    : 'hover:border-teal-300/85 hover:shadow-[0_5px_20px_-6px_rgba(13,148,136,0.38)] active:scale-[0.97]'
                )}
                aria-label={t('bottomNav.hcpCapsuleAria')}
                onClick={() =>
                  navDebug('bottom-nav:tap', { tab: 'hcp', href: '/mijn-hcp', path: pathname })
                }
              >
                <span className="text-[0.7rem] leading-none sm:text-sm" aria-hidden>
                  ⭐
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-teal-800 leading-tight mt-1">
                  HCP
                </span>
              </Link>
            </div>
          ) : null}

          {/* Profiel */}
          <div className="relative group flex-1 min-w-0 flex justify-center">
            {profileTabUseLink ? (
              <Link
                href="/profile"
                prefetch={false}
                className={navTabClasses(isActive('/profile'), isNativeShell)}
                onClick={() =>
                  navDebug('bottom-nav:tap', { tab: 'profile', href: '/profile', path: pathname })
                }
              >
                <div className="text-[1.35rem] sm:text-2xl leading-none mb-1">👤</div>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate w-full text-center leading-tight px-0.5">
                  {session?.user ? t('bottomNav.myHC') : t('bottomNav.profile')}
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleProfileClick}
                className={navTabClasses(isActive('/profile'), isNativeShell)}
              >
                <div className="text-[1.35rem] sm:text-2xl leading-none mb-1">👤</div>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate w-full text-center leading-tight px-0.5">
                  {t('bottomNav.profile')}
                </span>
              </button>
            )}
            {!session?.user && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
                  <div className="font-semibold mb-1">{t('bottomNav.myHomeCheff')}</div>
                  <div className="text-gray-300">{t('bottomNav.myHomeCheffDesc')}</div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flow-spacer: meestal onder AppPageChrome-pb; op /messages uit (eigen inset). */}
      <div
        className={cn(
          'pointer-events-none shrink-0',
          suppressFlowSpacer ? 'h-0' : isNativeShell ? 'h-[6.5rem]' : 'h-20'
        )}
        aria-hidden
      />

    </>
  );
}
