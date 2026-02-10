'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Home, Briefcase, Plus, MessageCircle, User, Upload } from 'lucide-react';
import PromoModal from '@/components/promo/PromoModal';
import { compressDataUrl } from '@/lib/imageOptimization';
import { useTranslation } from '@/hooks/useTranslation';

type QuickAddStep = 'platform' | 'photoSource' | 'category' | 'location';
type Platform = 'dorpsplein' | 'inspiratie';
type Category = 'CHEFF' | 'GARDEN' | 'DESIGNER';
type Location = 'keuken' | 'tuin' | 'atelier' | 'recepten' | 'kweken' | 'designs';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();
  
  // Hide on certain pages (admin, delivery dashboard, verkoper, login, register, etc.)
  const hideOnPaths = ['/admin', '/delivery', '/verkoper', '/login', '/register', '/auth', '/signin'];
  const shouldHide = hideOnPaths.some(path => pathname?.startsWith(path));
  
  // Quick Add State
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [quickAddStep, setQuickAddStep] = useState<QuickAddStep>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userRolesLoaded, setUserRolesLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Device detection
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

  // Fetch user roles
  useEffect(() => {
    if (session?.user) {
      const fetchUserRoles = async () => {
        try {
          const response = await fetch('/api/profile/me');
          if (response.ok) {
            const data = await response.json();
            setUserRoles(data.user?.sellerRoles || []);
            setUserRolesLoaded(true);
          }
        } catch (error) {
          console.error('Error fetching user roles:', error);
          setUserRoles((session?.user as any)?.sellerRoles || []);
          setUserRolesLoaded(true);
        }
      };
      fetchUserRoles();
    } else {
      setUserRoles([]);
      setUserRolesLoaded(true);
    }
  }, [session]);

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


  // Promo modals state
  const [activePromoModal, setActivePromoModal] = useState<'dashboard' | 'add' | 'messages' | 'profile' | 'dorpsplein-product' | 'inspiratie-item' | null>(null);

  // Home button config
  const getHomeButtonConfig = () => {
    if (pathname === '/inspiratie') {
      return {
        href: '/dorpsplein',
        label: t('bottomNav.dorpsplein'),
        icon: '🏪',
        onClick: () => {
          router.prefetch('/dorpsplein');
          router.push('/dorpsplein');
        }
      };
    } else if (pathname === '/' || pathname === '/dorpsplein') {
      return {
        href: '/inspiratie',
        label: t('bottomNav.inspiratie'),
        icon: '✨',
        onClick: () => {
          router.prefetch('/inspiratie');
          router.push('/inspiratie');
        }
      };
    } else {
      return {
        href: '/inspiratie',
        label: t('bottomNav.inspiratie'),
        icon: '✨',
        onClick: () => {
          router.prefetch('/inspiratie');
          router.push('/inspiratie');
        }
      };
    }
  };

  const homeConfig = useMemo(getHomeButtonConfig, [pathname, router, t]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleQuickAddClick = () => {
    if (!session?.user) {
      setActivePromoModal('add');
      return;
    }
    setShowQuickAddMenu(true);
    setQuickAddStep('platform');
    sessionStorage.setItem('quickAddStep', 'platform');
    setSelectedPlatform(null);
    setCapturedPhoto(null);
    // Clean up any leftover flags from previous sessions
    sessionStorage.removeItem('quickAddShouldGoToCategory');
    sessionStorage.removeItem('quickAddShouldGoToLocation');
  };

  // Prefetch routes on hover for faster navigation
  useEffect(() => {
    if (!session?.user) return;
    
    // Prefetch common routes when component mounts
    const routesToPrefetch = [
      '/messages', 
      '/profile', 
      '/verkoper', 
      '/verkoper/dashboard',
      '/admin',
      '/dorpsplein', 
      '/inspiratie'
    ];
    routesToPrefetch.forEach(route => {
      if (pathname !== route && !pathname?.startsWith(route)) {
        router.prefetch(route);
      }
    });
  }, [session, router, pathname]);

  const handleDashboardClick = () => {
    if (!session?.user) {
      setActivePromoModal('dashboard');
      return;
    }
    // Prefetch before navigation for instant feel
    router.prefetch('/verkoper');
    router.prefetch('/verkoper/dashboard');
    router.push('/verkoper');
  };

  const handleMessagesClick = () => {
    if (!session?.user) {
      setActivePromoModal('messages');
      return;
    }
    // Prefetch before navigation for instant feel
    router.prefetch('/messages');
    router.push('/messages');
  };

  const handleProfileClick = () => {
    if (!session?.user) {
      setActivePromoModal('profile');
      return;
    }
    // Prefetch before navigation for instant feel
    router.prefetch('/profile');
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
  
  const handlePhotoSourceSelect = (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      // For camera, set capture attribute and open file picker directly
      // This will show camera option in the file picker on mobile
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
        // Remove capture after click so gallery works normally next time
        setTimeout(() => {
          if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('capture');
          }
        }, 100);
      }
    } else {
      // Gallery selected - open file picker without capture
      if (fileInputRef.current) {
        fileInputRef.current.removeAttribute('capture');
        fileInputRef.current.click();
      }
    }
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
      closeQuickAddMenu();
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
      
    } catch (error) {
      console.error('Error saving photo:', error);
      // Check if it's a quota exceeded error
      if (error instanceof Error && error.message.includes('quota')) {
        console.error('Storage quota exceeded! Photo is too large even after compression.');
        alert(t('errors.photoTooLarge'));
        closeQuickAddMenu();
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
    const file = event.target.files?.[0];
    if (!file) {
      // User cancelled, close menu
      closeQuickAddMenu();
      return;
    }

    console.log('=== File selected ===');
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    console.log('Selected platform:', selectedPlatform);

    // Ensure we have a platform selected - check both state and storage
    const platformToUse = selectedPlatform || sessionStorage.getItem('quickAddPlatform') as Platform | null;
    if (!platformToUse) {
      console.error('No platform selected');
      closeQuickAddMenu();
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
      alert('Alleen foto\'s en video\'s zijn toegestaan');
      closeQuickAddMenu();
      return;
    }
    
    console.log('Reading file with FileReader...');
    console.log('File type:', file.type);
    console.log('Is video:', isVideo);
    console.log('Is image:', isImage);
    
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
            processPhotoAndNavigate(mediaUrl, isVideo);
          } else {
            console.error('Cannot proceed without platform');
            closeQuickAddMenu();
          }
        } else {
          // Use helper function to process media and navigate (async)
          processPhotoAndNavigate(mediaUrl, isVideo).catch((error) => {
            console.error('Error in processPhotoAndNavigate:', error);
            closeQuickAddMenu();
          });
        }
      } else {
        console.error('Failed to load media - FileReader result is empty');
      }
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      console.error('FileReader error details:', reader.error);
    };
    reader.onabort = () => {
      console.error('FileReader aborted');
    };
    
    // Read file as data URL
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      closeQuickAddMenu();
    }
    
    // Reset input AFTER starting read (not before)
    // This allows the file to be read even if input is reset
    setTimeout(() => {
      if (event.target) {
        event.target.value = '';
      }
    }, 100);
  };

  const handleCategorySelect = async (category: Category) => {
    console.log('=== handleCategorySelect called ===', category);
    console.log('capturedPhoto state:', capturedPhoto ? `Yes (${capturedPhoto.length} chars)` : 'No');
    console.log('sessionStorage keys:', Object.keys(sessionStorage));
    
    // Read photo from storage - try ALL possible locations
    // Priority: sessionStorage > localStorage > state
    let photoUrl = sessionStorage.getItem('quickAddPhoto') || 
                   sessionStorage.getItem('productPhoto') ||
                   localStorage.getItem('pendingProductPhoto') ||
                   capturedPhoto;
    
    // If we have photo in state but not in storage, save it now
    if (capturedPhoto && !photoUrl) {
      console.log('Using capturedPhoto from state and saving to storage...');
      photoUrl = capturedPhoto;
    }
    
    console.log('Final photoUrl:', photoUrl ? `Yes (${photoUrl.length} chars)` : 'No');
    
    // CRITICAL: Compress photo before storing to avoid storage quota errors
    let compressedPhotoUrl = photoUrl;
    if (photoUrl) {
      try {
        console.log('Compressing photo for storage...');
        compressedPhotoUrl = await compressDataUrl(photoUrl, 1920, 1080, 0.7, 500);
        const originalSizeKB = ((photoUrl.length * 3) / 4 / 1024).toFixed(1);
        const compressedSizeKB = ((compressedPhotoUrl.length * 3) / 4 / 1024).toFixed(1);
        console.log(`Photo compressed: ${originalSizeKB}KB -> ${compressedSizeKB}KB`);
      } catch (error) {
        console.error('Error compressing photo, using original:', error);
        // Continue with original if compression fails
      }
    }
    
    // Check if photo is actually a video
    const isVideo = compressedPhotoUrl?.startsWith('data:video/') || false;
    
    // CRITICAL: Save everything to storage BEFORE navigation
    // This ensures data is available when the new page loads
    if (compressedPhotoUrl) {
      try {
        // Save to all storage locations for redundancy
        sessionStorage.setItem('productPhoto', compressedPhotoUrl);
        sessionStorage.setItem('quickAddPhoto', compressedPhotoUrl);
        sessionStorage.setItem('productIsVideo', isVideo ? 'true' : 'false'); // Store if it's a video
        localStorage.setItem('pendingProductPhoto', compressedPhotoUrl);
        localStorage.setItem('pendingProductCategory', category);
        
        // Verify storage was successful
        const verifyPhoto = sessionStorage.getItem('productPhoto');
        const verifyQuickAdd = sessionStorage.getItem('quickAddPhoto');
        console.log('Verification - productPhoto stored:', verifyPhoto ? `Yes (${verifyPhoto.length} chars)` : 'No');
        console.log('Verification - quickAddPhoto stored:', verifyQuickAdd ? `Yes (${verifyQuickAdd.length} chars)` : 'No');
        console.log('Verification - isVideo:', sessionStorage.getItem('productIsVideo'));
      } catch (error) {
        console.error(`Error storing ${isVideo ? 'video' : 'photo'}:`, error);
        if (error instanceof Error && error.message.includes('quota')) {
          alert(isVideo ? 'Video is te groot voor opslag. Probeer een kortere video.' : t('errors.photoTooLarge'));
          return;
        }
        throw error;
      }
    }
    
    sessionStorage.setItem('productCategory', category);
    
    // Navigate immediately - use photo=true only if we have a photo
    const targetUrl = compressedPhotoUrl 
      ? `/sell/new?category=${category}&photo=true`
      : `/sell/new?category=${category}`;
    
    console.log('Navigating to:', targetUrl);
    console.log('Photo available:', compressedPhotoUrl ? 'Yes' : 'No');
    
    // Close menu FIRST
    setShowQuickAddMenu(false);
    setQuickAddStep('platform');
    setSelectedPlatform(null);
    
    // Force a final write to ensure data is persisted (already done above, but verify)
    if (compressedPhotoUrl) {
      try {
        sessionStorage.setItem('productPhoto', compressedPhotoUrl);
        sessionStorage.setItem('quickAddPhoto', compressedPhotoUrl);
      } catch (error) {
        console.error('Error in final storage write:', error);
        if (error instanceof Error && error.message.includes('quota')) {
          alert(t('errors.photoTooLarge'));
          return;
        }
      }
    }
    
    // Navigate - use window.location for reliable navigation on mobile
    // Small delay to ensure sessionStorage is written
    setTimeout(() => {
      console.log('Executing navigation to:', targetUrl);
      console.log('Final photo check before navigation:', sessionStorage.getItem('productPhoto') ? 'Yes' : 'No');
      window.location.href = targetUrl;
    }, 50);
  };

  const handleLocationSelect = React.useCallback(async (location: Location) => {
    console.log('=== handleLocationSelect called ===', location);
    console.log('All sessionStorage keys BEFORE:', Object.keys(sessionStorage));
    
    // Get photo from ALL possible sources - prioritize sessionStorage
    let photoUrl = sessionStorage.getItem('quickAddPhoto') || 
                   sessionStorage.getItem('productPhoto') ||
                   localStorage.getItem('pendingProductPhoto') ||
                   capturedPhoto;
    
    console.log('Photo URL found:', photoUrl ? `Yes (${photoUrl.length} chars)` : 'No');
    console.log('quickAddPhoto in storage:', sessionStorage.getItem('quickAddPhoto') ? `Yes (${sessionStorage.getItem('quickAddPhoto')?.length} chars)` : 'No');
    console.log('productPhoto in storage:', sessionStorage.getItem('productPhoto') ? `Yes (${sessionStorage.getItem('productPhoto')?.length} chars)` : 'No');
    console.log('capturedPhoto in state:', capturedPhoto ? `Yes (${capturedPhoto.length} chars)` : 'No');
    
    // If we have capturedPhoto but not in storage, save it now
    if (capturedPhoto && !photoUrl) {
      console.log('Using capturedPhoto from state and saving to storage...');
      photoUrl = capturedPhoto;
    } else if (capturedPhoto && photoUrl !== capturedPhoto) {
      // Update with latest photo from state
      console.log('Updating with capturedPhoto from state...');
      photoUrl = capturedPhoto;
    }
    
    // CRITICAL: Compress photo before storing to avoid storage quota errors
    let compressedPhotoUrl = photoUrl;
    if (photoUrl) {
      try {
        console.log('Compressing photo for storage...');
        compressedPhotoUrl = await compressDataUrl(photoUrl, 1920, 1080, 0.7, 500);
        const originalSizeKB = ((photoUrl.length * 3) / 4 / 1024).toFixed(1);
        const compressedSizeKB = ((compressedPhotoUrl.length * 3) / 4 / 1024).toFixed(1);
        console.log(`Photo compressed: ${originalSizeKB}KB -> ${compressedSizeKB}KB`);
      } catch (error) {
        console.error('Error compressing photo, using original:', error);
        // Continue with original if compression fails
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
    
    // Always set location and photo in sessionStorage BEFORE navigation
    // This ensures data is available when the new page loads
    sessionStorage.setItem('inspiratieLocation', internalLocation);
    
    // Use compressed photo URL (or original video URL)
    const finalPhotoUrl = compressedPhotoUrl;
    const isVideo = finalPhotoUrl?.startsWith('data:video/') || false;
    
    if (finalPhotoUrl) {
      try {
        sessionStorage.setItem('inspiratiePhoto', finalPhotoUrl);
        sessionStorage.setItem('inspiratieIsVideo', isVideo ? 'true' : 'false'); // Store if it's a video
        // Also keep quickAddPhoto as backup
        if (!sessionStorage.getItem('quickAddPhoto')) {
          sessionStorage.setItem('quickAddPhoto', finalPhotoUrl);
        }
        console.log(`Stored ${isVideo ? 'video' : 'photo'} in sessionStorage, length:`, finalPhotoUrl.length);
      } catch (error) {
        console.error(`Error storing ${isVideo ? 'video' : 'photo'} in sessionStorage:`, error);
        if (error instanceof Error && error.message.includes('quota')) {
          alert(isVideo ? 'Video is te groot voor opslag. Probeer een kortere video.' : t('errors.photoTooLarge'));
          return;
        }
        throw error;
      }
    } else {
      console.warn('No photo/video URL to store in sessionStorage');
    }
    console.log('Stored inspiratieLocation:', internalLocation);
    
    // Verify storage was successful
    const storedPhoto = sessionStorage.getItem('inspiratiePhoto');
    const storedLocation = sessionStorage.getItem('inspiratieLocation');
    const storedQuickAdd = sessionStorage.getItem('quickAddPhoto');
    console.log('Verification - stored photo:', storedPhoto ? `Yes (${storedPhoto.length} chars)` : 'No');
    console.log('Verification - stored location:', storedLocation || 'No');
    console.log('Verification - stored quickAddPhoto:', storedQuickAdd ? `Yes (${storedQuickAdd.length} chars)` : 'No');
    console.log('All sessionStorage keys AFTER:', Object.keys(sessionStorage));
    
    // Close menu immediately
    setShowQuickAddMenu(false);
    setQuickAddStep('platform');
    setSelectedPlatform(null);
    
    // Store photo in localStorage as backup (persists across page reloads)
    if (finalPhotoUrl) {
      localStorage.setItem('pendingInspiratiePhoto', finalPhotoUrl);
      localStorage.setItem('pendingInspiratieLocation', internalLocation);
      console.log('Photo also stored in localStorage as backup');
    }
    
    // Use window.location for reliable navigation
    // Add openForm=true to directly open the form without tab navigation delay
    const targetUrl = finalPhotoUrl
      ? `/profile?tab=${tab}&addInspiratie=true&openForm=true`
      : `/profile?tab=${tab}&openForm=true`;
    
    console.log('Navigating to:', targetUrl);
    console.log('Final photo URL before navigation:', finalPhotoUrl ? `Yes (${finalPhotoUrl.length} chars)` : 'No');
    
    // Final verification before navigation
    const finalCheck = sessionStorage.getItem('inspiratiePhoto') || sessionStorage.getItem('quickAddPhoto');
    console.log('Final check - photo in storage before navigation:', finalCheck ? `Yes (${finalCheck.length} chars)` : 'No');
    
    // Force synchronous write to sessionStorage (already done above, but verify)
    if (finalPhotoUrl) {
      try {
        sessionStorage.setItem('inspiratiePhoto', finalPhotoUrl);
        sessionStorage.setItem('quickAddPhoto', finalPhotoUrl);
        // Force a read to ensure it's written
        const verify = sessionStorage.getItem('inspiratiePhoto');
        console.log('Verification after force write:', verify ? `Yes (${verify.length} chars)` : 'No');
      } catch (error) {
        console.error('Error in final storage write:', error);
        if (error instanceof Error && error.message.includes('quota')) {
          alert(t('errors.photoTooLarge'));
          return;
        }
      }
    }
    
    // Navigate immediately - sessionStorage should be written
    window.location.href = targetUrl;
  }, [capturedPhoto]);

  const closeQuickAddMenu = () => {
    setShowQuickAddMenu(false);
    setQuickAddStep('platform');
    setSelectedPlatform(null);
    setCapturedPhoto(null);
    // Clean up sessionStorage flags (but keep photo data for form navigation)
    sessionStorage.removeItem('quickAddShouldGoToCategory');
    sessionStorage.removeItem('quickAddShouldGoToLocation');
    sessionStorage.removeItem('quickAddStep');
    // Note: We don't remove quickAddPhoto here as it might be needed for form navigation
  };

  const goBackInQuickAdd = () => {
    if (quickAddStep === 'category' || quickAddStep === 'location') {
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

  // Hide navigation on certain pages
  if (shouldHide) return null;

  return (
    <>
      {/* Hidden file input - without capture so file picker shows both gallery and camera options */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
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
            if (e.target === e.currentTarget) {
              closeQuickAddMenu();
            }
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
                  <h3 className="text-xl font-bold text-gray-900">Wat wil je toevoegen?</h3>
                  <button
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
                    onClick={() => handlePlatformSelect('dorpsplein')}
                    className="w-full p-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                  >
                    <div className="text-2xl mb-1">🏪</div>
                    <div className="text-lg font-bold">{t('bottomNav.dorpsplein')}</div>
                    <div className="text-sm opacity-90">{t('bottomNav.sellProducts')}</div>
                  </button>
                  
                  <button
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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Foto toevoegen</h3>
                    <p className="text-sm text-gray-600">Kies een foto uit je galerij of maak een nieuwe</p>
                  </div>
                  <button
                    onClick={() => {
                      setQuickAddStep('platform');
                      setSelectedPlatform(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label={t('buttons.back')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handlePhotoSourceSelect('gallery')}
                    className="w-full p-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                  >
                    <div className="text-2xl mb-1">📷</div>
                    <div className="text-lg font-bold">Galerij</div>
                    <div className="text-sm opacity-90">Kies een foto of video uit je galerij</div>
                  </button>
                  
                  <button
                    onClick={() => handlePhotoSourceSelect('camera')}
                    className="w-full p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                  >
                    <div className="text-2xl mb-1">📸</div>
                    <div className="text-lg font-bold">Camera</div>
                    <div className="text-sm opacity-90">Maak een nieuwe foto of video</div>
                  </button>
                </div>
              </div>
            )}

            {/* Category Selection (Dorpsplein) - ONLY show when step is category */}
            {quickAddStep === 'category' && (
              <div className="p-6" key="category-step">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Kies je rol</h3>
                    <p className="text-sm text-gray-600">Welk type product is dit?</p>
                  </div>
                  <button
                    onClick={closeQuickAddMenu}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label={t('buttons.close')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                {capturedPhoto && (
                  <div className="mb-6" style={{ pointerEvents: 'none' }}>
                    <img
                      src={capturedPhoto}
                      alt={t('camera.selectedPhoto')}
                      className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                      style={{ pointerEvents: 'none' }}
                    />
                  </div>
                )}
                
                <div className="space-y-3" style={{ position: 'relative', zIndex: 10 }}>
                  {userRoles.includes('chef') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        try {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('=== CHEFF button clicked ===');
                          console.log('Event:', e);
                          console.log('Calling handleCategorySelect...');
                          handleCategorySelect('CHEFF').catch((error) => {
                            console.error('Error in handleCategorySelect:', error);
                            alert(t('errors.categoryClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                          });
                          console.log('handleCategorySelect called successfully');
                        } catch (error) {
                          console.error('Error in CHEFF button onClick:', error);
                          alert(t('errors.categoryClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        }
                      }}
                      className="w-full p-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 20,
                        pointerEvents: 'auto'
                      }}
                    >
                      <div className="text-2xl mb-1">🍳</div>
                      <div className="text-lg font-bold">Chef</div>
                      <div className="text-sm opacity-90">Gerechten & ingrediënten</div>
                    </button>
                  )}
                  
                  {userRoles.includes('garden') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        try {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('=== GARDEN button clicked ===');
                          handleCategorySelect('GARDEN').catch((error) => {
                            console.error('Error in handleCategorySelect:', error);
                            alert(t('errors.categoryClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                          });
                          console.log('handleCategorySelect called successfully');
                        } catch (error) {
                          console.error('Error in GARDEN button onClick:', error);
                          alert(t('errors.categoryClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        }
                      }}
                      className="w-full p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 20,
                        pointerEvents: 'auto'
                      }}
                    >
                      <div className="text-2xl mb-1">🌱</div>
                      <div className="text-lg font-bold">Garden</div>
                      <div className="text-sm opacity-90">Groenten & planten</div>
                    </button>
                  )}
                  
                  {userRoles.includes('designer') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        try {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('=== DESIGNER button clicked ===');
                          handleCategorySelect('DESIGNER').catch((error) => {
                            console.error('Error in handleCategorySelect:', error);
                            alert(t('errors.categoryClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                          });
                          console.log('handleCategorySelect called successfully');
                        } catch (error) {
                          console.error('Error in DESIGNER button onClick:', error);
                          alert(t('errors.categoryClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        }
                      }}
                      className="w-full p-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 20,
                        pointerEvents: 'auto'
                      }}
                    >
                      <div className="text-2xl mb-1">🎨</div>
                      <div className="text-lg font-bold">Designer</div>
                      <div className="text-sm opacity-90">Handgemaakte items</div>
                    </button>
                  )}
                  
                  {userRolesLoaded && userRoles.length === 0 && session?.user && (
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
                  {!userRolesLoaded && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">Laden...</p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={goBackInQuickAdd}
                  className="w-full mt-4 p-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all active:scale-95"
                >
                  ← Terug
                </button>
              </div>
            )}

            {/* Location Selection (Inspiratie) - ONLY show when step is location */}
            {quickAddStep === 'location' && (
              <div className="p-6" key="location-step">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Kies inspiratie type</h3>
                    <p className="text-sm text-gray-600">Welke inspiratie wil je delen?</p>
                  </div>
                  <button
                    onClick={closeQuickAddMenu}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label={t('buttons.close')}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
                
                {capturedPhoto && (
                  <div className="mb-6" style={{ pointerEvents: 'none' }}>
                    <img
                      src={capturedPhoto}
                      alt={t('camera.selectedPhoto')}
                      className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                      style={{ pointerEvents: 'none' }}
                    />
                  </div>
                )}
                
                <div className="space-y-3" style={{ position: 'relative', zIndex: 10 }}>
                  {userRoles.includes('chef') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Recepten button clicked');
                        handleLocationSelect('recepten').catch((error) => {
                          console.error('Error in handleLocationSelect:', error);
                          alert(t('errors.locationClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        });
                      }}
                      className="w-full p-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 20,
                        pointerEvents: 'auto'
                      }}
                    >
                      <div className="text-2xl mb-1">📝</div>
                      <div className="text-lg font-bold">Recepten</div>
                      <div className="text-sm opacity-90">Deel je recepten en kooktips</div>
                    </button>
                  )}
                  
                  {userRoles.includes('garden') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        try {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('=== KWEKEN button clicked ===');
                          handleLocationSelect('kweken').catch((error) => {
                            console.error('Error in handleLocationSelect:', error);
                            alert(t('errors.locationClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                          });
                          console.log('handleLocationSelect called successfully');
                        } catch (error) {
                          console.error('Error in KWEKEN button onClick:', error);
                          alert(t('errors.locationClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        }
                      }}
                      className="w-full p-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 20,
                        pointerEvents: 'auto'
                      }}
                    >
                      <div className="text-2xl mb-1">🌱</div>
                      <div className="text-lg font-bold">Kweken</div>
                      <div className="text-sm opacity-90">Deel je kweekprojecten</div>
                    </button>
                  )}
                  
                  {userRoles.includes('designer') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        try {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('=== DESIGNS button clicked ===');
                          handleLocationSelect('designs').catch((error) => {
                            console.error('Error in handleLocationSelect:', error);
                            alert(t('errors.locationClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                          });
                          console.log('handleLocationSelect called successfully');
                        } catch (error) {
                          console.error('Error in DESIGNS button onClick:', error);
                          alert(t('errors.locationClickError') + ': ' + (error instanceof Error ? error.message : t('errors.unknownError')));
                        }
                      }}
                      className="w-full p-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 text-left"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 20,
                        pointerEvents: 'auto'
                      }}
                    >
                      <div className="text-2xl mb-1">🎨</div>
                      <div className="text-lg font-bold">Designs</div>
                      <div className="text-sm opacity-90">Deel je creatieve werken</div>
                    </button>
                  )}
                  
                  {userRolesLoaded && userRoles.length === 0 && session?.user && (
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
                  {!userRolesLoaded && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">Laden...</p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={goBackInQuickAdd}
                  className="w-full mt-4 p-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all active:scale-95"
                >
                  ← Terug
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40 shadow-lg">
        <div className="flex items-center justify-around max-w-4xl mx-auto">
          {/* Home Button */}
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
          <div className="relative group">
            <button
              onClick={handleDashboardClick}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive('/verkoper') ? 'text-primary-brand' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="text-2xl mb-1">💰</div>
              <span className="text-xs font-medium">{session?.user ? t('bottomNav.dashboard') : t('bottomNav.earn')}</span>
            </button>
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

          {/* ADD Button (FAB) */}
          <div className="relative group">
            <button
              onClick={handleQuickAddClick}
              className="relative -top-4 bg-gradient-to-r from-primary-brand to-primary-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 active:scale-95"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="relative group">
            <button
              onClick={handleMessagesClick}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive('/messages') ? 'text-primary-brand' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="text-2xl mb-1">💬</div>
              <span className="text-xs font-medium">{t('bottomNav.messages')}</span>
            </button>
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

          {/* Profiel */}
          <div className="relative group">
            <button
              onClick={handleProfileClick}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive('/profile') ? 'text-primary-brand' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="text-2xl mb-1">👤</div>
              <span className="text-xs font-medium">{session?.user ? t('bottomNav.myHC') : t('bottomNav.profile')}</span>
            </button>
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

      {/* Bottom padding */}
      <div className="h-20" />

      {/* Promo Modals */}
      <PromoModal
        isOpen={activePromoModal === 'dashboard'}
        onClose={() => setActivePromoModal(null)}
        title={t('bottomNav.earnMoney')}
        subtitle={t('bottomNav.earnMoneySubtitle')}
        description={t('bottomNav.earnMoneyDesc')}
        icon="💰"
        gradient="bg-gradient-to-r from-green-500 to-emerald-600"
        features={[
          t('bottomNav.features.placeProducts'),
          t('bottomNav.features.autoPayment'),
          t('bottomNav.features.directPayout'),
          t('bottomNav.features.noMonthlyCosts'),
          t('bottomNav.features.reachLocal')
        ]}
        modalType="dashboard"
      />

      <PromoModal
        isOpen={activePromoModal === 'add'}
        onClose={() => setActivePromoModal(null)}
        title={t('bottomNav.addFirstProduct')}
        subtitle={t('bottomNav.addFirstProductSubtitle')}
        description={t('bottomNav.addFirstProductDesc')}
        icon="🚀"
        gradient="bg-gradient-to-r from-orange-500 to-red-600"
        features={[
          t('bottomNav.features.galleryUpload'),
          t('bottomNav.features.autoCategory'),
          t('bottomNav.features.smartPricing'),
          t('bottomNav.features.directVisibility'),
          t('bottomNav.features.noUpfrontCosts')
        ]}
        modalType="add"
      />

      <PromoModal
        isOpen={activePromoModal === 'messages'}
        onClose={() => setActivePromoModal(null)}
        title={t('bottomNav.connectCommunity')}
        subtitle={t('bottomNav.connectCommunitySubtitle')}
        description={t('bottomNav.connectCommunityDesc')}
        icon="💬"
        gradient="bg-gradient-to-r from-blue-500 to-purple-600"
        features={[
          t('bottomNav.features.directMessages'),
          t('bottomNav.features.shareInspirations'),
          t('bottomNav.features.getTips'),
          t('bottomNav.features.buildNetwork'),
          t('bottomNav.features.collaborate')
        ]}
        modalType="messages"
      />

      <PromoModal
        isOpen={activePromoModal === 'profile'}
        onClose={() => setActivePromoModal(null)}
        title={t('bottomNav.manageWorkspaces')}
        subtitle={t('bottomNav.manageWorkspacesSubtitle')}
        description={t('bottomNav.manageWorkspacesDesc')}
        icon="🏡"
        gradient="bg-gradient-to-r from-purple-500 to-pink-600"
        features={[
          t('bottomNav.features.professionalProfile'),
          t('bottomNav.features.manageProducts'),
          t('bottomNav.features.reviewsRatings'),
          t('bottomNav.features.statistics'),
          t('bottomNav.features.personalWorkspace')
        ]}
        modalType="profile"
      />

      <PromoModal
        isOpen={activePromoModal === 'dorpsplein-product'}
        onClose={() => setActivePromoModal(null)}
        title={t('bottomNav.buyLocal')}
        subtitle={t('bottomNav.buyLocalSubtitle')}
        description={t('bottomNav.buyLocalDesc')}
        icon="🏪"
        gradient="bg-gradient-to-r from-orange-500 to-red-600"
        features={[
          t('bottomNav.features.contactSellers'),
          t('bottomNav.features.securePayments'),
          t('bottomNav.features.pickupDelivery'),
          t('bottomNav.features.realReviews'),
          t('bottomNav.features.supportLocal')
        ]}
        ctaText={t('bottomNav.signUpBuyLocal')}
        modalType="dorpsplein-product"
      />

      <PromoModal
        isOpen={activePromoModal === 'inspiratie-item'}
        onClose={() => setActivePromoModal(null)}
        title={t('bottomNav.shareInspiration')}
        subtitle={t('bottomNav.shareInspirationSubtitle')}
        description={t('bottomNav.shareInspirationDesc')}
        icon="✨"
        gradient="bg-gradient-to-r from-purple-500 to-pink-600"
        features={[
          t('bottomNav.features.shareIdeas'),
          t('bottomNav.features.exchangeIdeas'),
          t('bottomNav.features.createTogether'),
          t('bottomNav.features.inspire'),
          t('bottomNav.features.buildReputation')
        ]}
        ctaText={t('bottomNav.shareInspirationSubtitle')}
        modalType="inspiratie-item"
      />
    </>
  );
}
