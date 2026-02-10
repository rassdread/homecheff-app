"use client";
import React, { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession, useSession } from "next-auth/react";
import { isSafari, isIOS, getSafariCookieDelay, safeSessionStorageGetItem, safeSessionStorageSetItem, safeSessionStorageRemoveItem } from "@/lib/browser-utils";
import { Button } from "@/components/ui/Button";
import { clearAllUserData } from "@/lib/session-cleanup";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle, User, MapPin, Heart } from "lucide-react";
import Link from "next/link";
import CountrySelector from "@/components/ui/CountrySelector";
import InfoIcon from "@/components/onboarding/InfoIcon";
import { getHintsForPage } from "@/lib/onboarding/hints";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTranslation } from "@/hooks/useTranslation";
import DynamicAddressFields, { AddressData } from "@/components/ui/DynamicAddressFields";
import { trackRegistration } from "@/components/GoogleAnalytics";
import EmailVerificationModal from "@/components/auth/EmailVerificationModal";

// User types will be loaded dynamically based on language
const getUserTypes = (t: (key: string) => string) => [
  {
    id: "chef",
    title: t("register.userTypes.chef.title"),
    description: t("register.userTypes.chef.description"),
    icon: "👨��",
    features: [
      t("register.userTypes.chef.features.0"),
      t("register.userTypes.chef.features.1"),
      t("register.userTypes.chef.features.2"),
      t("register.userTypes.chef.features.3")
    ]
  },
  {
    id: "garden",
    title: t("register.userTypes.garden.title"),
    description: t("register.userTypes.garden.description"),
    icon: "🌱",
    features: [
      t("register.userTypes.garden.features.0"),
      t("register.userTypes.garden.features.1"),
      t("register.userTypes.garden.features.2"),
      t("register.userTypes.garden.features.3")
    ]
  },
  {
    id: "designer",
    title: t("register.userTypes.designer.title"),
    description: t("register.userTypes.designer.description"),
    icon: "🎨",
    features: [
      t("register.userTypes.designer.features.0"),
      t("register.userTypes.designer.features.1"),
      t("register.userTypes.designer.features.2"),
      t("register.userTypes.designer.features.3")
    ]
  },
];

const getBuyerTypes = (t: (key: string) => string) => [
  {
    id: "ontdekker",
    title: t("register.buyerTypes.ontdekker.title"),
    description: t("register.buyerTypes.ontdekker.description"),
    icon: "�"
  },
  {
    id: "verzamelaar",
    title: t("register.buyerTypes.verzamelaar.title"),
    description: t("register.buyerTypes.verzamelaar.description"),
    icon: "📦"
  },
  {
    id: "liefhebber",
    title: t("register.buyerTypes.liefhebber.title"),
    description: t("register.buyerTypes.liefhebber.description"),
    icon: "��"
  },
  {
    id: "avonturier",
    title: t("register.buyerTypes.avonturier.title"),
    description: t("register.buyerTypes.avonturier.description"),
    icon: "🗺�"
  },
  {
    id: "fijnproever",
    title: t("register.buyerTypes.fijnproever.title"),
    description: t("register.buyerTypes.fijnproever.description"),
    icon: "👅"
  },
  {
    id: "connaisseur",
    title: t("register.buyerTypes.connaisseur.title"),
    description: t("register.buyerTypes.connaisseur.description"),
    icon: "🎭"
  },
  {
    id: "genieter",
    title: t("register.buyerTypes.genieter.title"),
    description: t("register.buyerTypes.genieter.description"),
    icon: "✨"
  }
];

const REGISTER_DRAFT_STORAGE_KEY = "homecheff_register_draft_v1";
const REGISTER_DRAFT_TTL = 48 * 60 * 60 * 1000;

type RegisterState = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  gender: string;
  birthMonth: string;
  birthYear: string;
  userTypes: string[];
  selectedBuyerType: string;
  interests: string[];
  location: string;
  street: string;
  houseNumber: string;
  lat: number | null;
  lng: number | null;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  addressLookup: {
    isLookingUp: boolean;
    error: string | null;
    success: boolean;
    foundAddress: any | null;
  };
  bio: string;
  isBusiness: boolean;
  kvk: string;
  btw: string;
  company: string;
  subscription: string;
  // Uitbetaalgegevens - nu via Stripe
  error: string | null;
  success: boolean;
  currentStep: number;
  showPassword: boolean;
  // Privacy en voorwaarden
  acceptPrivacyPolicy: boolean;
  acceptTerms: boolean;
  acceptMarketing: boolean;
  // Belastingverantwoordelijkheid
  acceptTaxResponsibility: boolean;
  // Gebruikersnaam validatie
  usernameValidation: {
    isValid: boolean | null;
    message: string;
    isChecking: boolean;
  };
  // Email validatie
  emailValidation: {
    isValid: boolean | null;
    message: string;
    isChecking: boolean;
  };
  // Email verificatie
  showVerificationModal: boolean;
  verificationCode?: string;
  verificationEmail?: string;
  registrationPassword?: string;
  registrationRedirectUrl?: string;
};

const REGISTER_INITIAL_STATE: RegisterState = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  gender: "",
  birthMonth: "",
  birthYear: "",
  userTypes: [],
  selectedBuyerType: "",
  interests: [],
  location: "",
  street: "",
  houseNumber: "",
  lat: null,
  lng: null,
  address: "",
  city: "",
  postalCode: "",
  country: "NL",
  phoneNumber: "",
  addressLookup: {
    isLookingUp: false,
    error: null,
    success: false,
    foundAddress: null,
  },
  bio: "",
  isBusiness: false,
  kvk: "",
  btw: "",
  company: "",
  subscription: "",
  // Uitbetaalgegevens - nu via Stripe
  error: null,
  success: false,
  currentStep: 1,
  showPassword: false,
  // Privacy en voorwaarden
  acceptPrivacyPolicy: false,
  acceptTerms: false,
  acceptMarketing: false,
  // Belastingverantwoordelijkheid
  acceptTaxResponsibility: false,
  // Gebruikersnaam validatie
  usernameValidation: {
    isValid: null,
    message: "",
    isChecking: false,
  },
  // Email validatie
  emailValidation: {
    isValid: null,
    message: "",
    isChecking: false,
  },
  // Email verificatie
  showVerificationModal: false,
  verificationCode: undefined,
  verificationEmail: undefined,
  registrationPassword: undefined,
  registrationRedirectUrl: undefined,
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update: updateSession } = useSession();
  const { t } = useTranslation();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  
  // Get inviteToken from URL (for sub-affiliate signup)
  const inviteToken = searchParams?.get('inviteToken');
  
  // Get translated user types and buyer types
  const userTypes = getUserTypes(t);
  const buyerTypes = getBuyerTypes(t);
  
  // Handle Stripe payment success/cancel redirects
  useEffect(() => {
    const paymentStatus = searchParams?.get('payment');
    const userId = searchParams?.get('userId');
    
    if (paymentStatus === 'success' && userId) {
      // Haal opgeslagen login gegevens op
      const pendingReg = sessionStorage.getItem('pendingRegistration');
      if (pendingReg) {
        const processPaymentSuccess = async () => {
          try {
            const { email, password, redirectUrl, isBusiness } = JSON.parse(pendingReg);
            
            // Verwijder pending registration
            sessionStorage.removeItem('pendingRegistration');
            
            // Redirect direct naar opgeslagen url (fallback inspiratie)
            window.location.href = redirectUrl || "/inspiratie";
          } catch (error: any) {
            if (error?.message?.includes('NEXT_REDIRECT')) {
              throw error;
            }
            console.error("Auto sign-in after payment failed:", error);
            router.push(`/login?message=${encodeURIComponent(t('register.paymentSuccess'))}`);
          }
        };
        
        processPaymentSuccess();
      } else {
        // Geen pending registration, gewoon redirect naar login
        router.push(`/login?message=${encodeURIComponent(t('register.validation.paymentSuccessMessage'))}`);
      }
    } else if (paymentStatus === 'canceled') {
      // Betaling geannuleerd - gebruiker kan later betalen via /sell
      sessionStorage.removeItem('pendingRegistration');
      router.push(`/login?message=${encodeURIComponent(t('register.paymentCanceled'))}`);
    }
  }, [searchParams, router]);
  const isSocialLogin = searchParams?.get('social') === 'true';
  
  // Load hints for this page
  const pageHints = getHintsForPage('register');
  
  // CRITICAL: Check if user already completed onboarding and redirect immediately
  // This prevents the register page from flashing when user is already logged in
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Wait for session to load
      if (status === 'loading') {
        return;
      }

      // Only check if user is authenticated
      if (status !== 'authenticated' || !session?.user) {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        // Check database directly via API for reliable onboarding status
        const response = await fetch('/api/auth/check-onboarding');
        if (response.ok) {
          const data = await response.json();
          const hasTempUsername = data.hasTempUsername || false;
          const onboardingCompleted = data.onboardingCompleted || false;
          
          // If user has completed onboarding, redirect immediately
          if (!hasTempUsername && onboardingCompleted === true) {
            console.log('🔍 [REGISTER] User already completed onboarding, redirecting to inspiratie');
            window.location.replace('/inspiratie');
            return;
          }
        } else {
          // Fallback to session data
          const username = (session.user as any)?.username || '';
          const hasTempUsername = username?.startsWith('temp_') || false;
          const onboardingCompleted = (session.user as any)?.socialOnboardingCompleted || false;
          
          // If user has completed onboarding, redirect immediately
          if (!hasTempUsername && onboardingCompleted === true) {
            console.log('🔍 [REGISTER] User already completed onboarding (session check), redirecting to inspiratie');
            window.location.replace('/inspiratie');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Don't block registration if check fails
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [session, status]);
  
  // Load social login data if coming from social login
  useEffect(() => {
    const loadSocialData = async (retryCount = 0) => {
      if (isSocialLogin) {
        try {
          // Wait a bit for session to be available (especially on first load)
          if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          const session = await getSession();
          
          // Double check onboarding status before loading form data
          const response = await fetch('/api/auth/check-onboarding');
          if (response.ok) {
            const data = await response.json();
            const hasTempUsername = data.hasTempUsername || false;
            const onboardingCompleted = data.onboardingCompleted || false;
            
            // If onboarding is complete, don't load form data, just redirect
            if (!hasTempUsername && onboardingCompleted === true) {
              console.log('🔍 [REGISTER] Onboarding complete, redirecting before loading form');
              window.location.replace('/inspiratie');
              return;
            }
          }

          let socialEmail = '';
          let socialName = '';
          let socialFirstName = '';
          let socialLastName = '';
          
          // Try to get email from session first
          if (session?.user?.email) {
            socialEmail = session.user.email;
            socialName = (session.user as any).socialName || session.user.name || '';
            // Get firstName and lastName directly from session if available (from provider)
            socialFirstName = (session.user as any).socialFirstName || '';
            socialLastName = (session.user as any).socialLastName || '';
          } else if (session?.user) {
            // If session exists but email is missing, try to get from API as fallback
            try {
              const userResponse = await fetch('/api/user/me');
              if (userResponse.ok) {
                const userData = await userResponse.json();
                socialEmail = userData.email || '';
                socialName = userData.name || '';
              }
            } catch (apiError) {
              console.error('Error fetching user from API:', apiError);
            }
          }
          
          // If still no email after retry, try one more time with delay
          if (!socialEmail && retryCount < 2) {
            console.log(`🔍 [REGISTER] Email not found in session, retrying (attempt ${retryCount + 1}/2)...`);
            return loadSocialData(retryCount + 1);
          }
          
          // If we have email, pre-fill the form
          if (socialEmail && session?.user) {
            // Use firstName/lastName from session if available (direct from provider)
            // Otherwise fallback to parsing the full name
            let firstName = socialFirstName;
            let lastName = socialLastName;
            
            // If firstName/lastName not available from provider, parse from full name
            if (!firstName && !lastName && socialName) {
              const nameParts = socialName.split(' ');
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }
            
            // Generate username from email or name
            const emailUsername = socialEmail.split('@')[0] || '';
            const nameUsername = firstName.toLowerCase() + (lastName ? lastName.toLowerCase() : '');
            const suggestedUsername = nameUsername || emailUsername;
            
            // Pre-fill the form with social data
            console.log('🔍 [REGISTER] Pre-filling form with social data:', {
              firstName,
              lastName,
              email: socialEmail,
              username: suggestedUsername,
              hasSession: !!session
            });
            
            setState(prev => ({
              ...prev,
              firstName,
              lastName,
              email: socialEmail,
              username: suggestedUsername,
              emailValidation: {
                isValid: true,
                message: t('register.emailConfirmed'),
                isChecking: false,
              },
              // Start at step 1 for social login users
              currentStep: 1
            }));
            
            // Trigger username validation immediately for social login users
            // This ensures the validation is done before user tries to go to next step
            if (suggestedUsername) {
              // Use a longer delay to ensure state is updated first
              setTimeout(() => {
                console.log('🔍 [REGISTER] Triggering username validation for:', suggestedUsername);
                validateUsername(suggestedUsername);
              }, 300);
            }
          } else if (!socialEmail) {
            // If we still don't have email after retries, log error but don't block
            console.error('❌ [REGISTER] Could not load email from session or API after retries');
          }
        } catch (error) {
          console.error('Error loading social data:', error);
          // Retry once more on error
          if (retryCount < 2) {
            console.log(`🔍 [REGISTER] Error occurred, retrying (attempt ${retryCount + 1}/2)...`);
            return loadSocialData(retryCount + 1);
          }
        }
      }
    };
    
    loadSocialData();
  }, [isSocialLogin, t]);
  
  // Clear any existing user data to prevent privacy leaks (only for non-social login)
  useEffect(() => {
    if (!isSocialLogin) {
      // Only clear on initial mount, not on every render
      // Safari-compatibele versie: gebruik safe helpers
      const hasCleared = safeSessionStorageGetItem('register_cleared');
      
      if (!hasCleared) {
        clearAllUserData();
        safeSessionStorageSetItem('register_cleared', 'true');
        
        // Also clear browser autofill data by resetting form fields
        const resetFormFields = () => {
          const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
          const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
          
          if (emailInput) {
            emailInput.value = '';
            emailInput.setAttribute('autocomplete', 'off');
          }
          if (passwordInput) {
            passwordInput.value = '';
            passwordInput.setAttribute('autocomplete', 'new-password');
          }
        };
        
        // Reset form fields after a short delay to ensure DOM is ready
        setTimeout(resetFormFields, 100);
      }
    }
  }, [isSocialLogin]);

  const [state, setState, { reset: resetRegistrationDraft, isHydrated: isRegistrationHydrated }] =
    usePersistentState<RegisterState>(REGISTER_DRAFT_STORAGE_KEY, REGISTER_INITIAL_STATE, {
      storage: "session",
      ttl: REGISTER_DRAFT_TTL,
    });

  const hasDraft = React.useMemo(() => {
    if (!isRegistrationHydrated) {
      return false;
    }

    return Boolean(
      state.firstName ||
      state.lastName ||
      state.email ||
      state.username ||
      state.userTypes.length ||
      state.interests.length ||
      state.bio ||
      state.currentStep > 1
    );
  }, [isRegistrationHydrated, state]);

  const handleDraftReset = React.useCallback(() => {
    resetRegistrationDraft();
    if (typeof window !== "undefined") {
      // Safari-compatibele versie: gebruik safe helpers
      safeSessionStorageRemoveItem("pendingRegistration");
      safeSessionStorageRemoveItem("register_cleared");
    }
  }, [resetRegistrationDraft]);

  const steps = [
    { id: 1, title: t("register.steps.welcome.title"), description: t("register.steps.welcome.description") },
    { id: 2, title: t("register.steps.role.title"), description: t("register.steps.role.description") },
    { id: 3, title: t("register.steps.account.title"), description: t("register.steps.account.description") },
    { id: 4, title: t("register.steps.profile.title"), description: t("register.steps.profile.description") },
    { id: 5, title: t("register.steps.payout.title"), description: t("register.steps.payout.description") },
    { id: 6, title: t("register.steps.terms.title"), description: t("register.steps.terms.description") }
  ];

  function handleBusinessToggle() {
    setState((prev) => ({
      ...prev,
      isBusiness: !prev.isBusiness,
      kvk: "",
      btw: "",
      company: "",
      subscription: "",
    }));
  }

  // Scroll naar boven bij stapwissel
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.currentStep]);

  function nextStep() {
    if (state.currentStep < steps.length) {
      let nextStepNum = state.currentStep + 1;
      
      // Skip stap 5 (Uitbetaling) als gebruiker geen verkoper is
      if (nextStepNum === 5 && state.userTypes.length === 0) {
        nextStepNum = 6;
      }
      
      setState(prev => ({ ...prev, currentStep: nextStepNum, error: null }));
    }
  }

  function prevStep() {
    if (state.currentStep > 1) {
      let prevStepNum = state.currentStep - 1;
      
      // Skip stap 5 (Uitbetaling) als gebruiker geen verkoper is
      if (prevStepNum === 5 && state.userTypes.length === 0) {
        prevStepNum = 4;
      }
      
      setState(prev => ({ ...prev, currentStep: prevStepNum, error: null }));
    }
  }

  function handleUserTypeToggle(userType: string) {
    setState(prev => ({
      ...prev,
      userTypes: prev.userTypes.includes(userType)
        ? prev.userTypes.filter(t => t !== userType)
        : [...prev.userTypes, userType]
    }));
  }

  function handleBuyerTypeSelect(buyerType: string) {
    setState(prev => ({
      ...prev,
      selectedBuyerType: buyerType
    }));
  }

  function handleInterestToggle(interest: string) {
    setState(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  }

  // Nederlandse postcode lookup functie
  async function lookupDutchAddress() {
    if (!state.postalCode || !state.houseNumber) {
      setState(prev => ({
        ...prev,
        addressLookup: {
          isLookingUp: false,
          error: t('register.validation.enterPostcodeHouseNumber'),
          success: false,
          foundAddress: null
        },
        lat: null,
        lng: null,
      }));
      return;
    }

    const cleanedHouseNumber = state.houseNumber.trim();
    if (!cleanedHouseNumber) {
      setState(prev => ({
        ...prev,
        addressLookup: {
          isLookingUp: false,
          error: t('register.validation.houseNumberInvalid'),
          success: false,
          foundAddress: null
        },
        lat: null,
        lng: null,
      }));
      return;
    }

    const postcode = state.postalCode.replace(/\s/g, '').toUpperCase();

    setState(prev => ({
      ...prev,
      addressLookup: {
        isLookingUp: true,
        error: null,
        success: false,
        foundAddress: null
      }
    }));

    try {
      // Use Google Maps geocoding for all countries (including Netherlands)
      const addressQuery = `${postcode} ${cleanedHouseNumber}`.trim();
      const response = await fetch('/api/geocoding/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: addressQuery,
          city: '',
          countryCode: 'NL'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('register.validation.addressLookupFailed'));
      }

      const addressData = await response.json();

      const latValueRaw = addressData.lat ?? addressData.latitude ?? addressData.geometry?.lat;
      const lngValueRaw = addressData.lng ?? addressData.lon ?? addressData.longitude ?? addressData.geometry?.lng ?? addressData.geometry?.lon;
      const parsedLat = typeof latValueRaw === 'number' ? latValueRaw : latValueRaw ? parseFloat(String(latValueRaw)) : NaN;
      const parsedLng = typeof lngValueRaw === 'number' ? lngValueRaw : lngValueRaw ? parseFloat(String(lngValueRaw)) : NaN;

      // Extract address components from Google Maps response
      const formattedAddress = addressData.formatted_address || '';
      const addressParts = formattedAddress.split(',');
      const streetPart = addressParts[0]?.trim() || '';
      
      // Try to extract street and house number from formatted address
      const streetMatch = streetPart.match(/^(.+?)\s+(\d+[a-zA-Z0-9\-]*)$/);
      const street = streetMatch ? streetMatch[1] : (addressData.address || streetPart);
      const houseNumber = streetMatch ? streetMatch[2] : cleanedHouseNumber;
      
      const structuredAddress = {
        street: street || '',
        houseNumber: houseNumber || cleanedHouseNumber,
        city: addressData.city || addressParts[1]?.trim() || '',
        postalCode: addressData.postalCode || postcode,
        lat: Number.isFinite(parsedLat) ? parsedLat : null,
        lng: Number.isFinite(parsedLng) ? parsedLng : null,
      };

      setState(prev => ({
        ...prev,
        street: structuredAddress.street || prev.street,
        houseNumber: structuredAddress.houseNumber || prev.houseNumber,
        city: structuredAddress.city || prev.city,
        postalCode: structuredAddress.postalCode || prev.postalCode,
        address: [structuredAddress.street, structuredAddress.houseNumber].filter(Boolean).join(' ').trim() || prev.address,
        lat: structuredAddress.lat !== null ? structuredAddress.lat : prev.lat,
        lng: structuredAddress.lng !== null ? structuredAddress.lng : prev.lng,
        location: structuredAddress.city || prev.location,
        addressLookup: {
          isLookingUp: false,
          error: null,
          success: true,
          foundAddress: structuredAddress
        }
      }));

    } catch (error) {
      console.error('Address lookup error:', error);
      setState(prev => ({
        ...prev,
        addressLookup: {
          isLookingUp: false,
          error: error instanceof Error ? error.message : t('register.addressLookupFailed'),
          success: false,
          foundAddress: null
        },
        lat: null,
        lng: null,
      }));
    }
  }

  // Globale adres lookup functie voor alle landen
  async function lookupGlobalAddress() {
    if (!state.address || !state.city) {
      setState(prev => ({
        ...prev,
        addressLookup: {
          isLookingUp: false,
          error: t('register.validation.enterStreetCity'),
          success: false,
          foundAddress: null
        },
        lat: null,
        lng: null,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      addressLookup: {
        isLookingUp: true,
        error: null,
        success: false,
        foundAddress: null
      }
    }));

    try {
      const response = await fetch('/api/geocoding/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: state.address,
          city: state.city,
          country: state.country
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('register.validation.addressLookupFailed'));
      }

      const addressData = await response.json();

      if (addressData.error) {
        throw new Error(addressData.message || t('register.validation.addressNotFound'));
      }

      const latValueRaw = addressData.lat ?? addressData.latitude ?? addressData.geometry?.location?.lat ?? addressData.geometry?.lat;
      const lngValueRaw = addressData.lng ?? addressData.lon ?? addressData.longitude ?? addressData.geometry?.location?.lng ?? addressData.geometry?.lng ?? addressData.geometry?.lon;
      const parsedLat = typeof latValueRaw === 'number' ? latValueRaw : latValueRaw ? parseFloat(String(latValueRaw)) : NaN;
      const parsedLng = typeof lngValueRaw === 'number' ? lngValueRaw : lngValueRaw ? parseFloat(String(lngValueRaw)) : NaN;

      const structuredAddress = {
        street: addressData.street || addressData.address?.road || state.address || '',
        houseNumber: addressData.houseNumber || addressData.address?.house_number || state.houseNumber || '',
        city: addressData.city || addressData.address?.city || addressData.address?.town || addressData.address?.village || state.city || '',
        postalCode: addressData.postalCode || addressData.address?.postcode || state.postalCode || '',
        lat: Number.isFinite(parsedLat) ? parsedLat : null,
        lng: Number.isFinite(parsedLng) ? parsedLng : null,
        formatted_address: addressData.formatted_address || addressData.display_name || [addressData.street, addressData.houseNumber, addressData.city].filter(Boolean).join(', ')
      };

      setState(prev => ({
        ...prev,
        street: structuredAddress.street || prev.street,
        houseNumber: structuredAddress.houseNumber || prev.houseNumber,
        city: structuredAddress.city || prev.city,
        postalCode: structuredAddress.postalCode || prev.postalCode,
        address: structuredAddress.formatted_address || [structuredAddress.street, structuredAddress.houseNumber].filter(Boolean).join(' ').trim() || prev.address,
        lat: structuredAddress.lat !== null ? structuredAddress.lat : prev.lat,
        lng: structuredAddress.lng !== null ? structuredAddress.lng : prev.lng,
        location: structuredAddress.city || prev.location,
        addressLookup: {
          isLookingUp: false,
          error: null,
          success: true,
          foundAddress: structuredAddress
        }
      }));

    } catch (error) {
      console.error('Global address lookup error:', error);
      setState(prev => ({
        ...prev,
        addressLookup: {
          isLookingUp: false,
          error: error instanceof Error ? error.message : t('register.addressLookupFailed'),
          success: false,
          foundAddress: null
        },
        lat: null,
        lng: null,
      }));
    }
  }

  // Bepaal welke lookup functie te gebruiken op basis van land
  const getAddressLookupFunction = () => {
    return state.country === 'NL' ? lookupDutchAddress : lookupGlobalAddress;
  };

  // Bepaal of we Nederlandse postcode+huisnummer velden moeten tonen
  const isDutchAddressFormat = state.country === 'NL';

  // Removed auto-update useEffect - it was causing conflicts with user input
  // Address is now managed directly through DynamicAddressFields onChange handler

  // Dynamische placeholders op basis van land (152 landen ondersteund!)
  const getPlaceholders = () => {
    const example = t('register.example');
    const placeholders = {
      // Nederland - PDOK format
      NL: {
        address: t('register.autoFilled'),
        postalCode: `${example} 1012 AB`,
        city: `${example} Amsterdam`
      },
      
      // Noord-Amerika
      US: {
        address: `${example} Main Street 123`,
        city: `${example} New York`,
        postalCode: `${example} 10001`
      },
      CA: {
        address: `${example} Main Street 123`,
        city: `${example} Toronto`,
        postalCode: `${example} M5V 3A8`
      },
      
      // Europa - Premium landen
      GB: {
        address: `${example} Oxford Street 123`,
        city: `${example} London`,
        postalCode: `${example} SW1A 1AA`
      },
      DE: {
        address: `${example} Hauptstraße 123`,
        city: `${example} Berlin`,
        postalCode: `${example} 10115`
      },
      FR: {
        address: `${example} Rue de la Paix 123`,
        city: `${example} Paris`,
        postalCode: `${example} 75001`
      },
      ES: {
        address: `${example} Calle Mayor 123`,
        city: `${example} Madrid`,
        postalCode: `${example} 28001`
      },
      IT: {
        address: `${example} Via Roma 123`,
        city: `${example} Rome`,
        postalCode: `${example} 00100`
      },
      
      // Europa - Andere landen
      BE: {
        address: `${example} Rue de la Paix 123`,
        city: `${example} Brussels`,
        postalCode: `${example} 1000`
      },
      CH: {
        address: `${example} Bahnhofstrasse 123`,
        city: `${example} Zürich`,
        postalCode: `${example} 8001`
      },
      AT: {
        address: `${example} Kärntner Straße 123`,
        city: `${example} Vienna`,
        postalCode: `${example} 1010`
      },
      SE: {
        address: `${example} Drottninggatan 123`,
        city: `${example} Stockholm`,
        postalCode: `${example} 111 51`
      },
      NO: {
        address: `${example} Karl Johans gate 123`,
        city: `${example} Oslo`,
        postalCode: `${example} 0154`
      },
      DK: {
        address: `${example} Strøget 123`,
        city: `${example} Copenhagen`,
        postalCode: `${example} 1169`
      },
      FI: {
        address: `${example} Mannerheimintie 123`,
        city: `${example} Helsinki`,
        postalCode: `${example} 00100`
      },
      PL: {
        address: `${example} Krakowskie Przedmieście 123`,
        city: `${example} Warsaw`,
        postalCode: `${example} 00-071`
      },
      CZ: {
        address: `${example} Václavské náměstí 123`,
        city: `${example} Prague`,
        postalCode: `${example} 110 00`
      },
      HU: {
        address: `${example} Váci utca 123`,
        city: `${example} Budapest`,
        postalCode: `${example} 1052`
      },
      RO: {
        address: `${example} Calea Victoriei 123`,
        city: `${example} Bucharest`,
        postalCode: `${example} 010061`
      },
      BG: {
        address: `${example} Vitosha Boulevard 123`,
        city: `${example} Sofia`,
        postalCode: `${example} 1000`
      },
      HR: {
        address: `${example} Ilica 123`,
        city: `${example} Zagreb`,
        postalCode: `${example} 10000`
      },
      SI: {
        address: `${example} Prešernova cesta 123`,
        city: `${example} Ljubljana`,
        postalCode: `${example} 1000`
      },
      SK: {
        address: `${example} Hlavná 123`,
        city: `${example} Bratislava`,
        postalCode: `${example} 811 01`
      },
      LT: {
        address: `${example} Gedimino prospektas 123`,
        city: `${example} Vilnius`,
        postalCode: `${example} LT-01103`
      },
      LV: {
        address: `${example} Brīvības iela 123`,
        city: `${example} Riga`,
        postalCode: `${example} LV-1010`
      },
      EE: {
        address: `${example} Pikk 123`,
        city: `${example} Tallinn`,
        postalCode: `${example} 10130`
      },
      IE: {
        address: `${example} O'Connell Street 123`,
        city: `${example} Dublin`,
        postalCode: `${example} D01 F5P2`
      },
      PT: {
        address: `${example} Rua Augusta 123`,
        city: `${example} Lisbon`,
        postalCode: `${example} 1100-053`
      },
      GR: {
        address: `${example} Ermou Street 123`,
        city: `${example} Athens`,
        postalCode: `${example} 105 63`
      },
      CY: {
        address: `${example} Makarios Avenue 123`,
        city: `${example} Nicosia`,
        postalCode: `${example} 1065`
      },
      MT: {
        address: `${example} Republic Street 123`,
        city: `${example} Valletta`,
        postalCode: `${example} VLT 1117`
      },
      LU: {
        address: `${example} Grand-Rue 123`,
        city: `${example} Luxembourg`,
        postalCode: `${example} L-1660`
      },
      
      // Caribische landen
      CW: {
        address: `${example} Kaya Grandi 123`,
        city: `${example} Willemstad`,
        postalCode: `${example} 12345`
      },
      AW: {
        address: `${example} L.G. Smith Boulevard 123`,
        city: `${example} Oranjestad`,
        postalCode: `${example} 12345`
      },
      SX: {
        address: `${example} Front Street 123`,
        city: `${example} Philipsburg`,
        postalCode: `${example} 12345`
      },
      SR: {
        address: `${example} Waterkant 123`,
        city: `${example} Paramaribo`,
        postalCode: `${example} 12345`
      },
      JM: {
        address: `${example} King Street 123`,
        city: `${example} Kingston`,
        postalCode: `${example} 12345`
      },
      TT: {
        address: `${example} Independence Square 123`,
        city: `${example} Port of Spain`,
        postalCode: `${example} 12345`
      },
      BB: {
        address: `${example} Broad Street 123`,
        city: `${example} Bridgetown`,
        postalCode: `${example} 12345`
      },
      BS: {
        address: `${example} Bay Street 123`,
        city: `${example} Nassau`,
        postalCode: `${example} 12345`
      },
      CU: {
        address: `${example} Obispo Street 123`,
        city: `${example} Havana`,
        postalCode: `${example} 12345`
      },
      DO: {
        address: `${example} El Conde 123`,
        city: `${example} Santo Domingo`,
        postalCode: `${example} 12345`
      },
      HT: {
        address: `${example} Champs de Mars 123`,
        city: `${example} Port-au-Prince`,
        postalCode: `${example} 12345`
      },
      PR: {
        address: `${example} Calle Fortaleza 123`,
        city: `${example} San Juan`,
        postalCode: `${example} 00901`
      },
      
      // Azië - Premium landen
      JP: {
        address: `${example} Shibuya 1-2-3`,
        city: `${example} Tokyo`,
        postalCode: `${example} 150-0002`
      },
      KR: {
        address: `${example} Gangnam-daero 123`,
        city: `${example} Seoul`,
        postalCode: `${example} 06292`
      },
      SG: {
        address: `${example} Orchard Road 123`,
        city: `${example} Singapore`,
        postalCode: `${example} 238863`
      },
      HK: {
        address: `${example} Nathan Road 123`,
        city: `${example} Hong Kong`,
        postalCode: `${example} 12345`
      },
      TH: {
        address: `${example} Sukhumvit Road 123`,
        city: `${example} Bangkok`,
        postalCode: `${example} 10110`
      },
      MY: {
        address: `${example} Jalan Bukit Bintang 123`,
        city: `${example} Kuala Lumpur`,
        postalCode: `${example} 50200`
      },
      ID: {
        address: `${example} Jalan Thamrin 123`,
        city: `${example} Jakarta`,
        postalCode: `${example} 10310`
      },
      PH: {
        address: `${example} Ayala Avenue 123`,
        city: `${example} Manila`,
        postalCode: `${example} 1226`
      },
      VN: {
        address: `${example} Nguyễn Huệ 123`,
        city: `${example} Ho Chi Minh City`,
        postalCode: `${example} 12345`
      },
      IN: {
        address: `${example} Connaught Place 123`,
        city: `${example} New Delhi`,
        postalCode: `${example} 110001`
      },
      CN: {
        address: `${example} Wangfujing Street 123`,
        city: `${example} Beijing`,
        postalCode: `${example} 100006`
      },
      
      // Oceanië
      AU: {
        address: `${example} Collins Street 123`,
        city: `${example} Melbourne`,
        postalCode: `${example} 3000`
      },
      NZ: {
        address: `${example} Queen Street 123`,
        city: `${example} Auckland`,
        postalCode: `${example} 1010`
      },
      
      // Afrika
      ZA: {
        address: `${example} Long Street 123`,
        city: `${example} Cape Town`,
        postalCode: `${example} 8001`
      },
      NG: {
        address: `${example} Broad Street 123`,
        city: `${example} Lagos`,
        postalCode: `${example} 12345`
      },
      KE: {
        address: `${example} Kenyatta Avenue 123`,
        city: `${example} Nairobi`,
        postalCode: `${example} 00100`
      },
      EG: {
        address: `${example} Tahrir Square 123`,
        city: `${example} Cairo`,
        postalCode: `${example} 12345`
      },
      MA: {
        address: `${example} Mohammed V Avenue 123`,
        city: `${example} Casablanca`,
        postalCode: `${example} 20000`
      },
      
      // Zuid-Amerika
      BR: {
        address: `${example} Avenida Paulista 123`,
        city: `${example} São Paulo`,
        postalCode: `${example} 01310-100`
      },
      AR: {
        address: `${example} Avenida Corrientes 123`,
        city: `${example} Buenos Aires`,
        postalCode: `${example} C1043`
      },
      CL: {
        address: `${example} Alameda 123`,
        city: `${example} Santiago`,
        postalCode: `${example} 8320000`
      },
      CO: {
        address: `${example} Carrera Séptima 123`,
        city: `${example} Bogotá`,
        postalCode: `${example} 110221`
      },
      PE: {
        address: `${example} Jirón de la Unión 123`,
        city: `${example} Lima`,
        postalCode: `${example} 15001`
      },
      
      // Noord-Amerika (extra)
      MX: {
        address: `${example} Avenida Reforma 123`,
        city: `${example} Mexico City`,
        postalCode: `${example} 06600`
      },
      
      // Default fallback
      default: {
        address: `${example} Main Street 123`,
        city: `${example} City`,
        postalCode: `${example} 12345`
      }
    };
    
    return placeholders[state.country as keyof typeof placeholders] || placeholders.default;
  };

  const placeholders = getPlaceholders();

  // Automatische adres lookup wanneer adresgegevens zijn ingevoerd
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        state.addressLookup.isLookingUp ||
        state.addressLookup.error ||
        (state.lat !== null && state.lng !== null)
      ) {
        return;
      }

      if (isDutchAddressFormat) {
        const cleanPostcode = state.postalCode?.replace(/\s/g, '').toUpperCase() ?? '';
        if (
          cleanPostcode &&
          /^\d{4}[A-Z]{2}$/.test(cleanPostcode) &&
          state.houseNumber
        ) {
          lookupDutchAddress();
        }
      } else {
        if (
          state.address &&
          state.address.length > 3 &&
          state.city &&
          state.city.length > 2
        ) {
          lookupGlobalAddress();
        }
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    state.addressLookup.isLookingUp,
    state.addressLookup.error,
    state.address,
    state.city,
    state.houseNumber,
    state.postalCode,
    state.lat,
    state.lng,
    isDutchAddressFormat,
  ]);

  // Gebruikersnaam validatie functie
  const validateUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setState(prev => ({
        ...prev,
        usernameValidation: {
          isValid: false,
          message: t('register.validation.usernameMinLength'),
          isChecking: false,
        }
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      usernameValidation: {
        isValid: null,
        message: "Controleren...",
        isChecking: true,
      }
    }));

    try {
      const response = await fetch('/api/auth/validate-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      setState(prev => ({
        ...prev,
        usernameValidation: {
          isValid: data.valid,
          message: data.valid ? data.message : data.error,
          isChecking: false,
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        usernameValidation: {
          isValid: false,
          message: t('register.validation.usernameCheckError'),
          isChecking: false,
        }
      }));
    }
  };

  // Email validatie functie
  const validateEmail = async (email: string) => {
    if (!email) {
      setState(prev => ({
        ...prev,
        emailValidation: {
          isValid: null,
          message: "",
          isChecking: false,
        }
      }));
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setState(prev => ({
        ...prev,
        emailValidation: {
          isValid: false,
          message: t('register.validation.emailInvalid'),
          isChecking: false,
        }
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      emailValidation: {
        isValid: null,
        message: "Controleren...",
        isChecking: true,
      }
    }));

    try {
      const response = await fetch('/api/auth/validate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      setState(prev => ({
        ...prev,
        emailValidation: {
          isValid: data.valid,
          message: data.valid ? data.message : data.error,
          isChecking: false,
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        emailValidation: {
          isValid: false,
          message: t('register.validation.emailCheckError'),
          isChecking: false,
        }
      }));
    }
  };

  // Debounced gebruikersnaam validatie
  useEffect(() => {
    if (!state.username) {
      setState(prev => ({
        ...prev,
        usernameValidation: {
          isValid: null,
          message: "",
          isChecking: false,
        }
      }));
      return;
    }

    // For social login, validate immediately if username is already filled (from social data)
    const delay = isSocialLogin ? 100 : 500;
    
    const timeoutId = setTimeout(() => {
      console.log('🔍 [REGISTER] Username validation triggered:', state.username);
      validateUsername(state.username);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [state.username, isSocialLogin]);

  // Debounced email validatie
  useEffect(() => {
    if (isSocialLogin) {
      return;
    }

    if (!state.email) {
      setState(prev => ({
        ...prev,
        emailValidation: {
          isValid: null,
          message: "",
          isChecking: false,
        }
      }));
      return;
    }

    const timeoutId = setTimeout(() => {
      validateEmail(state.email);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [state.email, isSocialLogin]);


  async function handleSocialLogin(provider: string) {
    try {
      // For social login, redirect to registration page to complete profile
      // Note: This will go through social-login-success which checks onboarding status
      await signIn(provider, { 
        callbackUrl: '/register?social=true',
        redirect: true 
      });
    } catch (error) {
      console.error("Social login error:", error);
      setState(prev => ({
        ...prev,
        error: t('register.errors.socialLoginError', { provider }) || `Er is een fout opgetreden bij het inloggen met ${provider}.`
      }));
    }
  }

  async function handleRegister() {
    setState(prev => ({ ...prev, error: null, success: false }));
    
    // Validatie voor privacy en voorwaarden
    if (!state.acceptPrivacyPolicy || !state.acceptTerms) {
      setState(prev => ({ 
        ...prev, 
        error: t('register.mustAcceptPrivacyTerms') 
      }));
      return;
    }

    // Validatie voor gebruikersnaam
    if (!state.username || state.username.trim().length === 0) {
      setState(prev => ({ 
        ...prev, 
        error: t('register.validation.usernameRequiredError') 
      }));
      return;
    }

    if (state.usernameValidation.isValid !== true) {
      setState(prev => ({ 
        ...prev, 
        error: t('register.validation.usernameRequired') 
      }));
      return;
    }
    
    try {
      if (isSocialLogin) {
        const isSeller = state.userTypes.length > 0;
        const isBuyer = !!state.selectedBuyerType;

        if (
          !state.phoneNumber ||
          !state.address ||
          !state.city ||
          !state.postalCode ||
          !state.country ||
          !state.street ||
          !state.houseNumber ||
          state.lat === null ||
          state.lng === null
        ) {
          setState(prev => ({
            ...prev,
            error: t('register.validation.fillContactDetails')
          }));
          return;
        }

        const response = await fetch("/api/auth/complete-social-onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: state.username,
            role: isSeller ? "SELLER" : "BUYER",
            isBuyer,
            isSeller,
            userTypes: state.userTypes,
            selectedBuyerType: state.selectedBuyerType,
            phoneNumber: state.phoneNumber,
            address: state.address,
            street: state.street,
            houseNumber: state.houseNumber,
            city: state.city,
            postalCode: state.postalCode,
            country: state.country,
            lat: state.lat,
            lng: state.lng,
            acceptedTerms: state.acceptTerms,
            acceptedPrivacy: state.acceptPrivacyPolicy,
            password: state.password || undefined, // Optional password for social login users
          })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setState(prev => ({
            ...prev,
            error: data?.message || t('register.validation.socialOnboardingError'),
            success: false
          }));
          return;
        }

        // Forceer directe session refresh zodat needsOnboarding verdwijnt
        if (typeof updateSession === "function") {
          try {
            await updateSession({});
            // Wacht even zodat session update kan verwerken
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (sessionError) {
            console.error("Session update failed after social onboarding:", sessionError);
          }
        }

        // Gebruik window.location.replace voor clean redirect (geen back button issues)
        window.location.replace("/inspiratie?welcome=true&onboarding=completed");
        return;
      }

      if (
        !state.address ||
        !state.city ||
        !state.country ||
        state.lat === null ||
        state.lng === null ||
        (state.country === 'NL' &&
          (!state.postalCode || !state.street || !state.houseNumber))
      ) {
        setState(prev => ({
          ...prev,
          error: t('register.validation.validateAddress')
        }));
        return;
      }

      const normalizedPostalCode = state.postalCode ? state.postalCode.replace(/\s/g, '').toUpperCase() : "";
      const formattedAddress =
        state.country === 'NL'
          ? [state.street, state.houseNumber].filter(Boolean).join(' ').trim() ||
            state.address
          : state.address;

      const requestBody = {
        firstName: state.firstName,
        lastName: state.lastName,
        username: state.username,
        email: state.email,
        password: state.password,
        gender: state.gender,
        birthMonth: state.birthMonth,
        birthYear: state.birthYear,
        userTypes: state.userTypes,
        selectedBuyerType: state.selectedBuyerType,
        interests: state.interests,
        location: state.location,
        country: state.country,
        address: formattedAddress,
        street: state.street,
        houseNumber: state.houseNumber,
        city: state.city,
        postalCode: normalizedPostalCode,
        lat: state.lat,
        lng: state.lng,
        bio: state.bio,
        isBusiness: state.isBusiness,
        kvk: state.kvk,
        btw: state.btw,
        company: state.company,
        subscription: state.subscription || null,
        // Uitbetaalgegevens - nu via Stripe
        // Privacy en marketing
        acceptPrivacyPolicy: state.acceptPrivacyPolicy,
        acceptTerms: state.acceptTerms,
        acceptMarketing: state.acceptMarketing,
        // Belastingverantwoordelijkheid
        acceptTaxResponsibility: state.acceptTaxResponsibility,
        // Sub-affiliate invite token (from URL)
        subAffiliateInviteToken: inviteToken || null
      };
      
      console.log('🔵 [FRONTEND] Sending registration request:', {
        isBusiness: requestBody.isBusiness,
        subscription: requestBody.subscription,
        userTypes: requestBody.userTypes,
        hasUserTypes: requestBody.userTypes?.length > 0
      });
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Vertaal error codes naar gebruiksvriendelijke berichten
        let errorMessage = data.error || t('register.validation.registrationError');
        
        // Map API error codes naar vertalingen
        const errorCodeMap: Record<string, string> = {
          'COMPANY_NAME_REQUIRED': t('register.validation.companyNameRequiredError'),
          'BUSINESS_REGISTRATION_REQUIRED': t('register.validation.businessRegistrationRequiredError'),
          'KVK_INVALID_FORMAT': t('register.validation.kvkInvalidFormatError'),
          'VAT_INVALID_FORMAT': t('register.validation.vatInvalidFormatError'),
          'BUSINESS_REGISTRATION_INVALID_FORMAT': t('register.validation.businessRegistrationInvalidFormatError')
        };
        
        if (errorCodeMap[data.error]) {
          errorMessage = errorCodeMap[data.error];
        }
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          success: false 
        }));
        return;
      }
      
      // Als bedrijf met abonnement: redirect naar Stripe Checkout voor betaling
      console.log('🔵 [FRONTEND] Registration response:', { 
        requiresPayment: data?.requiresPayment, 
        checkoutUrl: data?.checkoutUrl ? 'SET' : 'NULL',
        isBusiness: state.isBusiness,
        subscription: state.subscription
      });
      
      if (data?.requiresPayment && data?.checkoutUrl) {
        console.log('✅ [FRONTEND] Redirect naar Stripe Checkout:', data.checkoutUrl);
        
        // Sla gebruiker gegevens op voor na betaling
        // Safari-compatibele versie: gebruik safe helper
        safeSessionStorageSetItem('pendingRegistration', JSON.stringify({
          email: state.email,
          password: state.password,
          redirectUrl: data.redirectUrl,
          isBusiness: state.isBusiness
        }));
        
        // Redirect naar Stripe Checkout - gebruik window.location.replace voor zekerheid
        window.location.replace(data.checkoutUrl);
        return;
      } else if (state.isBusiness && state.subscription) {
        // Als we hier komen terwijl we wel een bedrijf zijn met abonnement, is er iets mis
        console.error('� [FRONTEND] Bedrijf met abonnement maar geen checkoutUrl!', {
          requiresPayment: data?.requiresPayment,
          checkoutUrl: data?.checkoutUrl,
          isBusiness: state.isBusiness,
          subscription: state.subscription
        });
        
        setState(prev => ({ 
          ...prev, 
          error: t('register.validation.paymentSessionError') 
        }));
        return;
      }
      
      // Registratie succesvol (geen betaling nodig)
      resetRegistrationDraft();
      
      // Track registration in Google Analytics
      try {
        trackRegistration({
          method: 'email',
          userRole: data?.role || (state.isBusiness ? 'SELLER' : (state.userTypes?.length ? 'SELLER' : 'BUYER')),
          buyerRoles: state.selectedBuyerType ? [state.selectedBuyerType] : state.userTypes?.filter((t: string) => !['chef', 'grower', 'designer'].includes(t)) || [],
          sellerRoles: state.userTypes?.filter((t: string) => ['chef', 'grower', 'designer'].includes(t)) || [],
          hasDelivery: false,
          isBusiness: state.isBusiness || false,
        });
      } catch (gaError) {
        console.error('Failed to track registration in GA:', gaError);
        // Don't fail registration if GA tracking fails
      }
      
      // Clear the 'register cleared' flag before auto-login
      // Safari-compatibele versie: gebruik safe helpers
      safeSessionStorageRemoveItem('register_cleared');
      
      if (typeof window !== "undefined") {
        safeSessionStorageRemoveItem('pendingRegistration');
      }
      
      // Check if email verification is needed
      if (data?.needsVerification) {
        // Show verification modal instead of auto-login
        const returnUrl = searchParams?.get('returnUrl');
        const redirectUrl = returnUrl || data?.redirectUrl || (state.isBusiness ? "/sell" : "/inspiratie");
        
        setState(prev => ({
          ...prev,
          showVerificationModal: true,
          verificationCode: data?.verificationCode,
          verificationEmail: state.email,
          registrationPassword: state.password, // Store password for auto-login after verification
          registrationRedirectUrl: redirectUrl
        }));
        return;
      }
      
      // No verification needed - proceed with auto-login
      setState(() => ({
        ...REGISTER_INITIAL_STATE,
        success: true,
      }));
      
      // Bepaal redirect URL op basis van returnUrl parameter, response of default - focus op inspiratie
      const returnUrl = searchParams?.get('returnUrl');
      const redirectUrl = returnUrl || data?.redirectUrl || (state.isBusiness ? "/sell" : "/inspiratie");
      
      // Probeer automatisch in te loggen - Safari-compatibele versie
      // Gebruik redirect: false eerst om te controleren of login werkt
      try {
        const loginResult = await signIn("credentials", {
          emailOrUsername: state.email,
          password: state.password,
          redirect: false, // Gebruik false om handmatig te controleren
        });
        
        // Check of login succesvol was
        if (loginResult?.error) {
          console.error("Auto sign-in failed:", loginResult.error);
          // Redirect naar login pagina met succesmelding en instructies
          router.push(`/login?message=${encodeURIComponent(t('register.paymentSuccess') || 'Account aangemaakt! Log in met je email en wachtwoord.')}&email=${encodeURIComponent(state.email)}`);
          return;
        }
        
        // iOS Safari needs significantly more time for cookies to be set
        const isIOSDevice = isIOS();
        const isSafariOnIOS = isSafari() && isIOS();
        const initialDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : getSafariCookieDelay();
        
        console.log('🔍 [REGISTER] Device detection:', {
          isIOS: isIOSDevice,
          isSafariOnIOS: isSafariOnIOS,
          initialDelay
        });
        
        // Initial wait for cookies to be set (especially important for iOS Safari)
        await new Promise(resolve => setTimeout(resolve, initialDelay));
        
        // Verifieer dat session is gezet door session te refreshen
        if (typeof updateSession === "function") {
          try {
            await updateSession({});
            // Wait longer for session to update (iOS Safari needs more time)
            const updateDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 1000;
            await new Promise(resolve => setTimeout(resolve, updateDelay));
          } catch (sessionError) {
            console.warn("Session update warning (non-critical):", sessionError);
          }
        }
        
        // iOS Safari: Retry multiple times with longer delays
        let currentSession = await getSession();
        const maxRetries = isSafariOnIOS ? 3 : isIOSDevice ? 2 : 1;
        const retryDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 1000;
        
        for (let attempt = 0; attempt < maxRetries && !currentSession?.user?.email; attempt++) {
          console.log(`🔍 [REGISTER] No session after login, retry attempt ${attempt + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          currentSession = await getSession();
          
          if (currentSession?.user?.email) {
            console.log('✅ [REGISTER] Session found after retry!');
            break;
          }
        }
        
        // If still no session after all retries, try one more time with API call
        if (!currentSession?.user?.email) {
          console.log('🔍 [REGISTER] Trying API session check as last resort...');
          try {
            const apiResponse = await fetch('/api/auth/session');
            if (apiResponse.ok) {
              const apiSession = await apiResponse.json();
              if (apiSession?.user?.email) {
                console.log('✅ [REGISTER] Session found via API!');
                currentSession = apiSession;
              }
            }
          } catch (apiError) {
            console.error('❌ [REGISTER] API session check failed:', apiError);
          }
        }
        
        // Final check - if still no session, try one more approach for iOS Safari
        if (!currentSession?.user?.email) {
          // On iOS Safari, cookies might be set but not immediately readable
          // Try a hard refresh approach: redirect to redirectUrl with a refresh parameter
          // The destination page will check session again after page load
          if (isSafariOnIOS || isIOSDevice) {
            console.warn('⚠️ [REGISTER] No session found after retries on iOS, using refresh redirect');
            const finalRedirectUrl = redirectUrl + (redirectUrl.includes('?') ? '&' : '?') + 'welcome=true&registered=true&_refresh=1';
            
            // Use window.location.replace to avoid back button issues
            window.location.replace(finalRedirectUrl);
            return;
          }
          
          // For other browsers, redirect to login with message
          console.warn('⚠️ [REGISTER] No session found after all retries, redirecting to login');
          router.push(`/login?message=${encodeURIComponent(t('register.paymentSuccess') || 'Account aangemaakt! Log in met je email en wachtwoord.')}&email=${encodeURIComponent(state.email)}`);
          return;
        }
        
        // iOS Safari: Wait a bit more before redirect to ensure cookies are fully set
        const redirectDelay = isSafariOnIOS ? 500 : isIOSDevice ? 400 : 200;
        await new Promise(resolve => setTimeout(resolve, redirectDelay));
        
        // Gebruik window.location.replace voor betere Safari-compatibiliteit op iOS
        // Dit zorgt ervoor dat cookies correct worden meegenomen en voorkomt back button issues
        const finalRedirectUrl = redirectUrl + (redirectUrl.includes('?') ? '&' : '?') + 'welcome=true&registered=true';
        
        if (isSafariOnIOS || isIOSDevice) {
          window.location.replace(finalRedirectUrl);
        } else {
          window.location.href = finalRedirectUrl;
        }
        
      } catch (error: any) {
        // Als signIn een redirect doet, kan het een error gooien die we moeten negeren
        // Dit is normaal gedrag voor NextAuth redirects
        if (error?.message?.includes('NEXT_REDIRECT')) {
          // Dit is een Next.js redirect, gewoon doorlaten
          throw error;
        }
        
        console.error("Auto sign-in failed:", error);
        // Redirect naar login pagina met succesmelding
        router.push(`/login?message=${encodeURIComponent(t('register.paymentSuccess') || 'Account aangemaakt! Log in met je email en wachtwoord.')}&email=${encodeURIComponent(state.email)}`);
      }
      
    } catch (error) {
      console.error("Registration error:", error);
      setState(prev => ({ 
        ...prev, 
        error: t('register.validation.networkError'), 
        success: false 
      }));
    }
  }

  // Show loading state while checking onboarding status
  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Render success state or main registration form
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">H</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t('register.title')}</h1>
                <p className="text-emerald-100 text-sm">{t('register.subtitle')}</p>
              </div>
            </div>
            <div className="text-sm text-white/80 bg-white/10 px-3 py-1 rounded-full">
              Stap {state.currentStep} van {steps.length}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  state.currentStep >= step.id 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.id}
                </div>
                <div className="ml-2 hidden sm:block">
                  <div className={`text-sm font-medium transition-colors ${
                    state.currentStep >= step.id ? 'text-emerald-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 transition-colors ${
                    state.currentStep > step.id ? 'bg-emerald-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {isRegistrationHydrated && hasDraft && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-emerald-800">
              <strong>{t('register.validation.draftSaved')}</strong> {t('register.validation.draftRestored')}
            </div>
            <Button variant="outline" onClick={handleDraftReset} className="sm:w-auto w-full">
              {t('register.validation.clearDraft')}
            </Button>
          </div>
        )}

        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
          </div>
        )}

        {state.success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('register.welcome')}</h2>
            <p className="text-gray-600 mb-6">{t('register.accountCreatedRedirect')}</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Step 1: Welkom */}
            {state.currentStep === 1 && (
              <div className="text-center">
                <div className="mb-8">
                  {isSocialLogin ? (
                    <>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('register.welcome')} 🎉</h2>
                      <p className="text-lg text-gray-600 mb-8">{t('register.welcomeSocial')}</p>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                        <p className="text-emerald-800 font-medium">{t('register.welcomeSocialGoogle')}</p>
                        <p className="text-emerald-700 text-sm mt-1">{t('register.welcomeSocialGoogleSubtitle')}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                          {t('register.welcome')} 
                          {pageHints?.hints.welcome && (
                            <InfoIcon hint={pageHints.hints.welcome} pageId="register" size="md" />
                          )}
                        </h2>
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6 mb-8 shadow-sm">
                          <p className="text-lg text-gray-800 font-medium mb-4 text-center">
                            🎭 {t('register.welcomeMessage')}
                          </p>
                          <div className="grid md:grid-cols-3 gap-4 text-center">
                            <div className="bg-white rounded-xl p-4 border border-emerald-100">
                              <div className="text-3xl mb-2">👨��</div>
                              <h3 className="font-semibold text-gray-900 mb-2">{t('register.userTypes.chef.title')}</h3>
                              <p className="text-sm text-gray-600">{t('register.welcomeChef')}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-emerald-100">
                              <div className="text-3xl mb-2">🌱</div>
                              <h3 className="font-semibold text-gray-900 mb-2">{t('register.userTypes.garden.title')}</h3>
                              <p className="text-sm text-gray-600">{t('register.welcomeGarden')}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-emerald-100">
                              <div className="text-3xl mb-2">🎨</div>
                              <h3 className="font-semibold text-gray-900 mb-2">{t('register.userTypes.designer.title')}</h3>
                              <p className="text-sm text-gray-600">{t('register.welcomeDesigner')}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-4 text-center">
                            {t('register.welcomeTip')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Social Login Options - only show for non-social login */}
                {!isSocialLogin && (
                  <div className="space-y-4 mb-8">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSocialLogin("google");
                      }}
                      className="w-full max-w-sm mx-auto inline-flex justify-center items-center px-6 py-4 border border-gray-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md"
                    >
                      <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {t('register.continueWithGoogle')}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSocialLogin("facebook");
                      }}
                      className="w-full max-w-sm mx-auto inline-flex justify-center items-center px-6 py-4 border border-gray-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md"
                    >
                      <svg className="w-6 h-6 mr-3" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      {t('register.continueWithFacebook')}
                    </button>
                  </div>
                )}

                {/* Divider */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">{t('register.or')}</span>
                  </div>
                </div>

                {/* Email Option */}
                <button
                  onClick={() => setState(prev => ({ ...prev, currentStep: 2 }))}
                  className="w-full max-w-sm mx-auto inline-flex justify-center items-center px-6 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md font-medium text-base"
                >
                  <Mail className="w-6 h-6 mr-3" />
                  {t('register.signUpWithEmail')}
                </button>

                <div className="mt-6 text-sm text-gray-500">
                  <p>{t('register.alreadyHaveAccount')} <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">{t('register.login')}</Link></p>
                </div>
              </div>
            )}

            {/* Step 2: Role Selection */}
            {state.currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('register.chooseRoles')}</h2>
                <p className="text-gray-600 mb-8">{t('register.chooseRolesSubtitle')}</p>
                
                <div className="grid gap-4">
                  {userTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all relative ${
                        state.userTypes.includes(type.id)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                      onClick={() => handleUserTypeToggle(type.id)}
                    >
                      {/* Info icon */}
                      {pageHints?.hints[type.id as 'chef' | 'garden' | 'designer'] && (
                        <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
                          <InfoIcon hint={pageHints.hints[type.id as 'chef' | 'garden' | 'designer']} pageId="register" size="sm" />
                        </div>
                      )}
                      <div className="flex items-start space-x-4 pr-8">
                        <div className="text-3xl">{type.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{type.title}</h3>
                          <p className="text-gray-600 mb-3">{type.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {type.features.map((feature, index) => (
                              <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          state.userTypes.includes(type.id)
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300'
                        }`}>
                          {state.userTypes.includes(type.id) && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {state.userTypes.length > 0 && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-700">
                      <strong>{t('register.selected')}</strong> {state.userTypes.map(id => userTypes.find(t => t.id === id)?.title).join(', ')}
                    </p>
                  </div>
                )}

                {state.selectedBuyerType !== "" && state.userTypes.length === 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>{t('register.buyerTypeSelected')}</strong> {buyerTypes.find(t => t.id === state.selectedBuyerType)?.title}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">{t('register.buyerOnlyNote')}</p>
                  </div>
                )}

                {/* Wat voor koper ben je? Sectie */}
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{t('register.whatBuyerAreYou')}</h3>
                    {pageHints?.hints.buyer && (
                      <InfoIcon hint={pageHints.hints.buyer} pageId="register" size="sm" />
                    )}
                  </div>
                  <p className="text-gray-600 mb-6">{t('register.whatBuyerSubtitle')}</p>
                  
                  <div className="grid gap-3">
                    {buyerTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          state.selectedBuyerType === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => handleBuyerTypeSelect(type.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{type.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{type.title}</h4>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            state.selectedBuyerType === type.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {state.selectedBuyerType === type.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Account Login */}
            {state.currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('register.yourAccount')}</h2>
                {isSocialLogin ? (
                  <div className="mb-8">
                    <p className="text-gray-600 mb-4">{t('register.socialLoginInfo')}</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-blue-800 font-medium">{t('register.socialLoginPrefilled')}</p>
                      <p className="text-blue-700 text-sm mt-1">{t('register.socialLoginCheck')}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-8">{t('register.fillBasicInfo')}</p>
                )}
                
                <div className="space-y-6">
                  {/* Business Checkbox - Prominent bovenaan */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="isBusiness"
                        checked={state.isBusiness}
                        onChange={handleBusinessToggle}
                        className="w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                      <label htmlFor="isBusiness" className="text-base font-semibold text-gray-900 cursor-pointer flex-1 flex items-center gap-2">
                        <span className="text-2xl">�</span>
                        <span>{t('register.registerAsBusiness')}</span>
                      </label>
                      {pageHints?.hints.business && (
                        <InfoIcon hint={pageHints.hints.business} pageId="register" size="sm" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-9">
                      {t('register.businessInfo')}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.firstName')} *</label>
                      <input
                        type="text"
                        value={state.firstName}
                        onChange={e => setState(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder={t('register.firstNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.lastName')} *</label>
                      <input
                        type="text"
                        value={state.lastName}
                        onChange={e => setState(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder={t('register.lastNamePlaceholder')}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">{t('register.username')} *</label>
                      {pageHints?.hints.username && (
                        <InfoIcon hint={pageHints.hints.username} pageId="register" size="sm" />
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={state.username}
                        onChange={e => setState(prev => ({ ...prev, username: e.target.value }))}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:border-transparent transition-colors ${
                          state.usernameValidation.isValid === true
                            ? 'border-green-500 bg-green-50 focus:ring-green-500'
                            : state.usernameValidation.isValid === false
                            ? 'border-red-500 bg-red-50 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                        }`}
                        placeholder={t('register.usernamePlaceholder')}
                      />
                      {state.usernameValidation.isChecking && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                        </div>
                      )}
                      {state.usernameValidation.isValid === true && !state.usernameValidation.isChecking && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                      {state.usernameValidation.isValid === false && !state.usernameValidation.isChecking && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Validatie feedback */}
                    {state.usernameValidation.message && (
                      <div className={`mt-2 text-sm ${
                        state.usernameValidation.isValid === true
                          ? 'text-green-600'
                          : state.usernameValidation.isValid === false
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {state.usernameValidation.message}
                      </div>
                    )}
                    
                    {/* Gebruikersnaam regels */}
                    <div className="mt-2 text-xs text-gray-500">
                      <p>{t('register.usernameRules')}</p>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>{t('register.usernameRule1')}</li>
                        <li>{t('register.usernameRule2')}</li>
                        <li>{t('register.usernameRule3')}</li>
                        <li>{t('register.usernameRule4')}</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">{t('register.email')} *</label>
                      {pageHints?.hints.email && (
                        <InfoIcon hint={pageHints.hints.email} pageId="register" size="sm" />
                      )}
                    </div>
                    <input
                      type="email"
                      value={state.email}
                      onChange={e => setState(prev => ({ ...prev, email: e.target.value }))}
                      readOnly={isSocialLogin}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        state.emailValidation.isValid === true 
                          ? 'border-green-300 bg-green-50' 
                          : state.emailValidation.isValid === false 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      placeholder={t('register.emailPlaceholder')}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    {isSocialLogin && (
                      <p className="mt-2 text-sm text-emerald-700">
                        {t('register.emailSocialNote')}
                      </p>
                    )}
                    {state.emailValidation.message && (
                      <p className={`mt-2 text-sm ${
                        state.emailValidation.isValid === true 
                          ? 'text-green-600' 
                          : state.emailValidation.isValid === false 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                      }`}>
                        {state.emailValidation.isChecking && (
                          <span className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </span>
                        )}
                        {state.emailValidation.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Wachtwoord veld - alleen voor niet-social login */}
                  {!isSocialLogin && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">{t('register.password')} *</label>
                        {pageHints?.hints.password && (
                          <InfoIcon hint={pageHints.hints.password} pageId="register" size="sm" />
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={state.showPassword ? "text" : "password"}
                          value={state.password}
                          onChange={e => setState(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder={t('register.passwordPlaceholder')}
                          autoComplete="new-password"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck="false"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        >
                          {state.showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {state.password && (
                        <p className={`text-sm mt-2 ${
                          state.password.length >= 8 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {state.password.length >= 8 
                            ? t('register.passwordStrong')
                            : t('register.passwordWeak')
                          }
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Wachtwoord veld - optioneel voor social login gebruikers */}
                  {isSocialLogin && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">{t('register.password')} ({t('register.optional')})</label>
                        {pageHints?.hints.password && (
                          <InfoIcon hint={pageHints.hints.password} pageId="register" size="sm" />
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={state.showPassword ? "text" : "password"}
                          value={state.password}
                          onChange={e => setState(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder={t('register.passwordPlaceholder')}
                          autoComplete="new-password"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck="false"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        >
                          {state.showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {state.password && (
                        <p className={`text-sm mt-2 ${
                          state.password.length >= 8 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {state.password.length >= 8 
                            ? t('register.passwordStrong')
                            : t('register.passwordWeak')
                          }
                        </p>
                      )}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2">
                        <p className="text-blue-800 text-sm">
                          💡 {t('register.passwordSocialHint') || 'Stel een wachtwoord in om later ook met email/wachtwoord in te kunnen loggen op andere apparaten.'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.gender')}</label>
                    <select
                      value={state.gender}
                      onChange={e => setState(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">{t('register.genderSelect')}</option>
                      <option value="man">{t('register.genderMale')}</option>
                      <option value="vrouw">{t('register.genderFemale')}</option>
                    </select>
                  </div>

                  {/* Geboortedatum - Maand en Jaar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('register.birthDate') || 'Geboortedatum'} ({t('register.optional') || 'Optioneel'})
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t('register.birthMonth') || 'Maand'}</label>
                        <select
                          value={state.birthMonth}
                          onChange={e => setState(prev => ({ ...prev, birthMonth: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="">--</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={String(month).padStart(2, '0')}>
                              {new Date(2000, month - 1).toLocaleString('nl-NL', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">{t('register.birthYear') || 'Jaar'}</label>
                        <select
                          value={state.birthYear}
                          onChange={e => setState(prev => ({ ...prev, birthYear: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="">--</option>
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={String(year)}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('register.birthDateHint') || 'Gebruikt voor leeftijdscategorieën in analytics'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('register.phoneNumber')}
                    </label>
                    <input
                      type="tel"
                      value={state.phoneNumber}
                      onChange={e => setState(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={t('register.phonePlaceholder')}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('register.phoneOptional')}
                    </p>
                  </div>
                </div>
                
                {/* Business Fields - Collapsible section when business is selected */}
                {state.isBusiness && (
                  <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl transition-all duration-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">�</span>
                      {t('register.businessDetails')}
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Company Information */}
                      <div>
                        <h4 className="text-md font-medium text-gray-800 mb-3">{t('register.companyInfo')}</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.companyName')} *</label>
                            <input
                              type="text"
                              value={state.company}
                              onChange={e => setState(prev => ({ ...prev, company: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={t('register.companyNamePlaceholder')}
                            />
                          </div>
                          
                          {/* Business registration fields based on country */}
                          {(() => {
                            const country = state.country || 'NL';
                            const isNetherlands = country === 'NL';
                            const isEU = ['BE', 'DE', 'FR', 'IT', 'ES', 'AT', 'PT', 'GR', 'IE', 'FI', 'SE', 'DK', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU'].includes(country);
                            
                            if (isNetherlands) {
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.kvkNumber')} *</label>
                                    <input
                                      type="text"
                                      value={state.kvk}
                                      onChange={e => setState(prev => ({ ...prev, kvk: e.target.value }))}
                                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder={t('register.kvkPlaceholder')}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.btwNumber')}</label>
                                    <input
                                      type="text"
                                      value={state.btw}
                                      onChange={e => setState(prev => ({ ...prev, btw: e.target.value }))}
                                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder={t('register.btwPlaceholder')}
                                    />
                                  </div>
                                </div>
                              );
                            } else if (isEU) {
                              return (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.vatNumber')} *</label>
                                  <input
                                    type="text"
                                    value={state.kvk}
                                    onChange={e => setState(prev => ({ ...prev, kvk: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={t('register.vatPlaceholder')}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">{t('register.vatNumberHint')}</p>
                                </div>
                              );
                            } else {
                              return (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.businessRegistrationNumber')} *</label>
                                  <input
                                    type="text"
                                    value={state.kvk}
                                    onChange={e => setState(prev => ({ ...prev, kvk: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={t('register.businessRegistrationPlaceholder')}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">{t('register.businessRegistrationHint')}</p>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Profile Setup */}
            {state.currentStep === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('register.profileSetup')}</h2>
                <p className="text-gray-600 mb-8">{t('register.profileSetupSubtitle')}</p>
                
                <div className="space-y-6">
                  {/* Locatie wordt automatisch ingevuld via geolocatie in de adres sectie hieronder */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('register.country')}
                    </label>
                    <CountrySelector
                      value={state.country}
                      onChange={(countryCode) =>
                        setState(prev => ({
                          ...prev,
                          country: countryCode,
                          street: '',
                          houseNumber: '',
                          address: '',
                          city: '',
                          postalCode: '',
                          location: '',
                          lat: null,
                          lng: null,
                          addressLookup: {
                            ...prev.addressLookup,
                            isLookingUp: false,
                            error: null,
                            success: false,
                            foundAddress: null,
                          },
                        }))
                      }
                      placeholder={t('register.countryPlaceholder')}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('register.countryNote')}
                    </p>
                  </div>

                  {/* Address Details (Private) */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {t('register.addressDetails')}
                      </h3>
                      {pageHints?.hints.location && (
                        <InfoIcon hint={pageHints.hints.location} pageId="register" size="sm" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      {t('register.addressPrivate')}
                    </p>
                    
                    {/* Dynamic Address Fields - Compact Google Places Autocomplete for international, NL format for Netherlands */}
                    <DynamicAddressFields
                      value={{
                        // Use address field directly - don't combine street + houseNumber to avoid duplicates
                        // If address is empty but we have street + houseNumber, combine them
                        address: state.address || (state.street && state.houseNumber 
                          ? `${state.street} ${state.houseNumber}`.trim()
                          : state.street || ''),
                        postalCode: state.postalCode,
                        houseNumber: state.houseNumber,
                        city: state.city,
                        country: state.country || 'NL',
                        lat: state.lat,
                        lng: state.lng,
                      }}
                      onChange={(addressData: AddressData) => {
                        // Determine if this is from Google Places selection (has coordinates) or manual typing
                        const isFromGooglePlaces = !!(addressData.lat && addressData.lng);
                        
                        setState(prev => {
                          let finalStreet = prev.street;
                          let finalHouseNumber = prev.houseNumber;
                          let finalAddress = addressData.address || prev.address;
                          let finalPostalCode = addressData.postalCode || prev.postalCode;
                          let finalCity = addressData.city || prev.city;
                          let finalCountry = addressData.country || prev.country || 'NL';
                          
                          // Only parse address if it's from Google Places (not manual typing)
                          if (isFromGooglePlaces && addressData.address) {
                            // Google Places provides structured data - extract street and houseNumber
                            const houseNumberMatch = addressData.address.match(/^(.+?)\s+(\d+[a-zA-Z0-9\-]*)$/);
                            
                            if (houseNumberMatch) {
                              // Address contains house number: "Streetname 123"
                              finalStreet = houseNumberMatch[1].trim();
                              finalHouseNumber = houseNumberMatch[2].trim();
                              finalAddress = addressData.address; // Keep full address
                            } else {
                              // Address does NOT contain house number: just "Streetname"
                              finalStreet = addressData.address.trim();
                              finalAddress = addressData.address;
                              
                              // If separate houseNumber was provided, use it
                              if (addressData.houseNumber) {
                                finalHouseNumber = addressData.houseNumber;
                                finalAddress = `${finalStreet} ${finalHouseNumber}`.trim();
                              }
                            }
                            
                            // Override with provided values if available
                            if (addressData.houseNumber) {
                              finalHouseNumber = addressData.houseNumber;
                            }
                          } else if (addressData.address && !isFromGooglePlaces) {
                            // Manual typing - just update address, don't parse street/houseNumber
                            // This prevents breaking user input while typing
                            finalAddress = addressData.address;
                            
                            // Only update other fields if explicitly provided (shouldn't happen during manual typing)
                            if (addressData.postalCode) finalPostalCode = addressData.postalCode;
                            if (addressData.city) finalCity = addressData.city;
                            if (addressData.country) finalCountry = addressData.country;
                          }
                          
                          // Prevent duplicate house numbers in address
                          if (finalAddress && finalHouseNumber) {
                            // Check if house number is already at the end of address
                            const houseNumberEscaped = finalHouseNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const houseNumberPattern = new RegExp(`\\s+${houseNumberEscaped}$`);
                            
                            if (houseNumberPattern.test(finalAddress)) {
                              // House number already in address - remove it from street if present
                              // Keep address as-is
                            } else if (isFromGooglePlaces && finalHouseNumber) {
                              // Only append house number if from Google Places and not already present
                              // Don't append during manual typing to avoid breaking user input
                              if (!finalAddress.endsWith(finalHouseNumber)) {
                                finalAddress = `${finalAddress.replace(/\s+$/, '')} ${finalHouseNumber}`.trim();
                              }
                            }
                          }
                          
                          return {
                            ...prev,
                            street: finalStreet,
                            houseNumber: finalHouseNumber,
                            address: finalAddress,
                            postalCode: finalPostalCode,
                            city: finalCity,
                            location: finalCity || prev.location,
                            country: finalCountry,
                            lat: addressData.lat ?? prev.lat,
                            lng: addressData.lng ?? prev.lng,
                            addressLookup: {
                              isLookingUp: false,
                              error: null,
                              success: isFromGooglePlaces,
                              foundAddress: isFromGooglePlaces ? {
                                street: finalStreet,
                                houseNumber: finalHouseNumber,
                                city: finalCity,
                                postalCode: finalPostalCode,
                              } : null,
                            },
                          };
                        });
                      }}
                      onGeocode={(addressData: AddressData) => {
                        if (addressData.lat && addressData.lng) {
                          setState(prev => ({
                            ...prev,
                            lat: addressData.lat ?? null,
                            lng: addressData.lng ?? null,
                            addressLookup: {
                              ...prev.addressLookup,
                              success: true,
                            },
                          }));
                        }
                      }}
                      required={true}
                      showValidation={true}
                      geocodingEnabled={true}
                      showCountrySelector={false}
                      error={state.addressLookup.error || undefined}
                    />
                    
                    {/* Legacy address lookup code - removed, using DynamicAddressFields instead */}
                    {false && isDutchAddressFormat ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('register.postalCode')}
                            </label>
                            <input
                              type="text"
                              value={state.postalCode}
                              onChange={e =>
                                setState(prev => ({
                                  ...prev,
                                  postalCode: e.target.value.toUpperCase(),
                                  lat: null,
                                  lng: null,
                                  addressLookup: {
                                    ...prev.addressLookup,
                                    error: null,
                                    success: false,
                                    foundAddress: null,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 uppercase"
                              placeholder={placeholders.postalCode}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('register.houseNumber')}
                            </label>
                            <input
                              type="text"
                              value={state.houseNumber}
                              onChange={e =>
                                setState(prev => ({
                                  ...prev,
                                  houseNumber: e.target.value,
                                  lat: null,
                                  lng: null,
                                  addressLookup: {
                                    ...prev.addressLookup,
                                    error: null,
                                    success: false,
                                    foundAddress: null,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder={t('register.houseNumberPlaceholder')}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('register.streetName')}
                            </label>
                            <input
                              type="text"
                              value={state.street}
                              onChange={e =>
                                setState(prev => ({
                                  ...prev,
                                  street: e.target.value,
                                  lat: null,
                                  lng: null,
                                  addressLookup: {
                                    ...prev.addressLookup,
                                    error: null,
                                    success: false,
                                    foundAddress: null,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder={t('register.autoFilled')}
                              readOnly
                              tabIndex={-1}
                              aria-readonly="true"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('register.city')}
                            </label>
                            <input
                              type="text"
                              value={state.city}
                              onChange={e =>
                                setState(prev => ({
                                  ...prev,
                                  city: e.target.value,
                                location: e.target.value,
                                  lat: null,
                                  lng: null,
                                  addressLookup: {
                                    ...prev.addressLookup,
                                    error: null,
                                    success: false,
                                    foundAddress: null,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder={placeholders.city}
                              readOnly
                              tabIndex={-1}
                              aria-readonly="true"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t('register.fullAddress')}
                            </label>
                            <input
                              type="text"
                              value={[state.street, state.houseNumber].filter(Boolean).join(' ').trim()}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                              placeholder={t('register.autoFilled')}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={getAddressLookupFunction()}
                            disabled={
                              state.addressLookup.isLookingUp ||
                              !state.postalCode ||
                              !state.houseNumber
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {state.addressLookup.isLookingUp ? (
                              <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('register.searching')}
                              </div>
                            ) : (
                              t('register.validation.searchAddress')
                            )}
                          </button>
                          <p className="text-xs text-gray-500">
                            ✨ {t('register.validation.enterPostcodeHouseNumberHint')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Internationale straat + stad format
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('register.streetName')} {t('register.and')} {t('register.houseNumber')}
                          </label>
                          <input
                            type="text"
                            value={state.address}
                            onChange={e =>
                              setState(prev => ({
                                ...prev,
                                address: e.target.value,
                                lat: null,
                                lng: null,
                                addressLookup: {
                                  ...prev.addressLookup,
                                  error: null,
                                  success: false,
                                  foundAddress: null,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder={placeholders.address}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('register.city')}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={state.city}
                              onChange={e =>
                                setState(prev => ({
                                  ...prev,
                                  city: e.target.value,
                                  location: e.target.value,
                                  lat: null,
                                  lng: null,
                                  addressLookup: {
                                    ...prev.addressLookup,
                                    error: null,
                                    success: false,
                                    foundAddress: null,
                                  },
                                }))
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              placeholder={placeholders.city}
                            />
                            <button
                              type="button"
                              onClick={getAddressLookupFunction()}
                              disabled={state.addressLookup.isLookingUp || !state.address || !state.city}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              {state.addressLookup.isLookingUp ? (
                                <div className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  {t('register.searching')}
                                </div>
                              ) : (
                                t('register.search')
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {state.addressLookup.error && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-red-700">{state.addressLookup.error}</span>
                        </div>
                      </div>
                    )}

                    {!isDutchAddressFormat && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('register.postalCodeOptional')}
                        </label>
                        <input
                          type="text"
                          value={state.postalCode}
                          onChange={e =>
                            setState(prev => ({
                              ...prev,
                              postalCode: e.target.value,
                              lat: null,
                              lng: null,
                              addressLookup: {
                                ...prev.addressLookup,
                                error: null,
                                success: false,
                                foundAddress: null,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder={t('register.postalCodePlaceholder')}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {t('register.postalCodeNote')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">Bio</label>
                      {pageHints?.hints.bio && (
                        <InfoIcon hint={pageHints.hints.bio} pageId="register" size="sm" />
                      )}
                    </div>
                    <textarea
                      value={state.bio}
                      onChange={e => setState(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={t('register.bioPlaceholder')}
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interesses</label>
                    <div className="flex flex-wrap gap-2">
                      {["Koken", "Tuinieren", "Handwerk", "Design", "Lokaal", "Duurzaam", "Creatief", "Community"].map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestToggle(interest)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            state.interests.includes(interest)
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Uitbetaling (alleen voor verkopers) */}
            {state.currentStep === 5 && state.userTypes.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('register.validation.payoutDetails')}</h2>
                <p className="text-gray-600 mb-8">{t('register.validation.fillBankDetails')}</p>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">{t('register.validation.payoutsViaStripe')}</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {t('register.validation.payoutsViaStripeText')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Belastingverantwoordelijkheid checkbox */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="acceptTaxResponsibility"
                        checked={state.acceptTaxResponsibility}
                        onChange={e => setState(prev => ({ ...prev, acceptTaxResponsibility: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                        required
                      />
                      <div>
                        <label htmlFor="acceptTaxResponsibility" className="text-sm font-medium text-blue-900 cursor-pointer">
                          {t('register.taxResponsibilityCheckbox')}
                        </label>
                        <div className="mt-2 text-sm text-blue-800 space-y-2">
                          <p>
                            <strong>{t('register.taxYourResponsibility')}</strong> {t('register.taxYourResponsibilityText')}
                          </p>
                          <p>
                            <strong>{t('register.taxOurObligation')}</strong> {t('register.taxOurObligationText')}
                          </p>
                          <p className="text-xs text-blue-600">
                            {t('register.taxAdviceNote')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Privacy en Voorwaarden */}
            {state.currentStep === 6 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{t('register.privacyAndTerms')}</h2>
                  {pageHints?.hints.privacy && (
                    <InfoIcon hint={pageHints.hints.privacy} pageId="register" size="md" />
                  )}
                </div>
                <p className="text-gray-600 mb-8">{t('register.privacyAndTermsSubtitle')}</p>

                {state.isBusiness && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-sm text-emerald-800">
                    <p className="font-semibold">🧾 {t('register.subscriptionNote')}</p>
                    <p className="mt-1">
                      {t('register.subscriptionNoteText')}
                    </p>
                  </div>
                )}
                
                <div className="space-y-6">
                  {/* Privacy Policy */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🔒</span>
                      {t('register.privacyPolicy')}
                    </h3>
                    <div className="max-h-64 overflow-y-auto text-sm text-gray-700 space-y-3">
                      <p>
                        <strong>{t('register.privacyIntro')}</strong>
                      </p>
                      <p>
                        <strong>{t('register.privacyWhatData')}</strong><br/>
                        • {t('register.privacyDataIdentification')}<br/>
                        • {t('register.privacyDataAccount')}<br/>
                        • {t('register.privacyDataSales')}<br/>
                        • {t('register.privacyDataCommunication')}
                      </p>
                      <p>
                        <strong>{t('register.privacyHowUse')}</strong><br/>
                        • {t('register.privacyUseContract')}<br/>
                        • {t('register.privacyUsePayments')}<br/>
                        • {t('register.privacyUseSupport')}<br/>
                        • {t('register.privacyUseImprovement')}
                      </p>
                      <p>
                        <strong>{t('register.privacyYourRights')}</strong><br/>
                        {t('register.privacyYourRightsText')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('register.privacyFullStatement')} <a href="/privacy" className="text-emerald-600 hover:text-emerald-700 underline">{t('register.privacyStatementLink')}</a>
                      </p>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📋</span>
                      {t('register.termsAndConditions')}
                    </h3>
                    <div className="max-h-64 overflow-y-auto text-sm text-gray-700 space-y-3">
                      <p>
                        <strong>{t('register.termsPlatformUse')}</strong><br/>
                        • {t('register.termsUseAccuracy')}<br/>
                        • {t('register.termsUseIllegal')}<br/>
                        • {t('register.termsUseRights')}
                      </p>
                      <p>
                        <strong>{t('register.termsSales')}</strong><br/>
                        • {t('register.termsSalesTax')}<br/>
                        • {t('register.termsSalesLegislation')}<br/>
                        • {t('register.termsSalesPlatform')}
                      </p>
                      <p>
                        <strong>{t('register.termsPayments')}</strong><br/>
                        • {t('register.termsPaymentsStripe')}<br/>
                        • {t('register.termsPaymentsFees')}<br/>
                        • {t('register.termsPaymentsPayout')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('register.termsFullTerms')} <a href="/terms" className="text-emerald-600 hover:text-emerald-700 underline">{t('register.termsLink')}</a>
                      </p>
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="acceptPrivacyPolicy"
                        checked={state.acceptPrivacyPolicy}
                        onChange={e => setState(prev => ({ ...prev, acceptPrivacyPolicy: e.target.checked }))}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 mt-1"
                      />
                      <label htmlFor="acceptPrivacyPolicy" className="text-sm text-gray-700 cursor-pointer">
                        <span className="font-medium">{t('register.acceptPrivacy')}</span><br/>
                        <span className="text-gray-500">{t('register.acceptPrivacySubtext')}</span>
                      </label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={state.acceptTerms}
                        onChange={e => setState(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 mt-1"
                      />
                      <label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
                        <span className="font-medium">{t('register.acceptTerms')}</span><br/>
                        <span className="text-gray-500">{t('register.acceptTermsSubtext')}</span>
                      </label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="acceptMarketing"
                        checked={state.acceptMarketing}
                        onChange={e => setState(prev => ({ ...prev, acceptMarketing: e.target.checked }))}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 mt-1"
                      />
                      <label htmlFor="acceptMarketing" className="text-sm text-gray-700 cursor-pointer">
                        <span className="font-medium">{t('register.acceptMarketing')}</span><br/>
                        <span className="text-gray-500">{t('register.acceptMarketingSubtext')}</span>
                      </label>
                    </div>
                  </div>

                  {/* Belastingverantwoordelijkheid waarschuwing */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-600 text-xl">⚠�</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800 mb-1">{t('register.taxResponsibility')}</h4>
                        <p className="text-sm text-yellow-700">
                          {t('register.taxResponsibilityText')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <Button
                onClick={prevStep}
                disabled={state.currentStep === 1}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('register.previous')}
              </Button>
              
              {state.currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={(() => {
                    if (state.currentStep === 2) {
                      return state.userTypes.length === 0 && state.selectedBuyerType === "";
                    }
                    if (state.currentStep === 3) {
                      const step3Disabled = !state.firstName || 
                        !state.lastName || 
                        !state.username || 
                        !state.email || 
                        (!isSocialLogin && !state.password) || 
                        state.usernameValidation.isChecking || // Disable while checking
                        state.usernameValidation.isValid === false; // Disable if invalid
                      
                      // Debug logging for step 3
                      if (step3Disabled) {
                        console.log('🔍 [REGISTER] Step 3 disabled - reasons:', {
                          noFirstName: !state.firstName,
                          noLastName: !state.lastName,
                          noUsername: !state.username,
                          noEmail: !state.email,
                          noPassword: (!isSocialLogin && !state.password),
                          isChecking: state.usernameValidation.isChecking,
                          isValid: state.usernameValidation.isValid,
                          isSocialLogin
                        });
                      }
                      return step3Disabled;
                    }
                    if (state.currentStep === 5) {
                      return state.userTypes.length > 0 && (!state.acceptTaxResponsibility);
                    }
                    return false;
                  })()}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('register.next')}
                </Button>
              ) : (
                <Button
                  onClick={handleRegister}
                  disabled={!state.acceptPrivacyPolicy || !state.acceptTerms}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('register.createAccount')}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={state.showVerificationModal}
        email={state.verificationEmail || state.email}
        verificationCode={state.verificationCode}
        onVerified={async () => {
          // Auto-login after verification
          if (state.registrationPassword && state.verificationEmail) {
            try {
              const redirectUrl = state.registrationRedirectUrl || "/inspiratie";
              
              // iOS Safari needs more time for cookies
              const isIOSDevice = isIOS();
              const isSafariOnIOS = isSafari() && isIOS();
              
              // Use redirect: false first to check if login works
              const loginResult = await signIn("credentials", {
                emailOrUsername: state.verificationEmail,
                password: state.registrationPassword,
                redirect: false,
              });
              
              if (loginResult?.error) {
                console.error("Auto sign-in after verification failed:", loginResult.error);
                router.push('/login?verified=true');
                return;
              }
              
              // Wait for cookies to be set (especially important for iOS Safari)
              const initialDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : getSafariCookieDelay();
              await new Promise(resolve => setTimeout(resolve, initialDelay));
              
              // Update session
              if (typeof updateSession === "function") {
                try {
                  await updateSession({});
                  const updateDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 1000;
                  await new Promise(resolve => setTimeout(resolve, updateDelay));
                } catch (sessionError) {
                  console.warn("Session update warning:", sessionError);
                }
              }
              
              // Retry session check for iOS Safari
              let currentSession = await getSession();
              const maxRetries = isSafariOnIOS ? 3 : isIOSDevice ? 2 : 1;
              const retryDelay = isSafariOnIOS ? 1500 : isIOSDevice ? 1200 : 1000;
              
              for (let attempt = 0; attempt < maxRetries && !currentSession?.user?.email; attempt++) {
                console.log(`🔍 [REGISTER-VERIFY] Retry attempt ${attempt + 1}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                currentSession = await getSession();
                if (currentSession?.user?.email) break;
              }
              
              // Final redirect with delay for iOS Safari
              const redirectDelay = isSafariOnIOS ? 500 : isIOSDevice ? 400 : 200;
              await new Promise(resolve => setTimeout(resolve, redirectDelay));
              
              // Use window.location.href for better iOS Safari compatibility
              window.location.href = redirectUrl + (redirectUrl.includes('?') ? '&' : '?') + 'welcome=true&verified=true';
            } catch (error: any) {
              if (error?.message?.includes('NEXT_REDIRECT')) {
                throw error;
              }
              console.error("Auto sign-in after verification failed:", error);
              // Redirect to login page
              router.push('/login?verified=true');
            }
          } else {
            // Just redirect to login
            router.push('/login?verified=true');
          }
        }}
      />
    </main>
  );
}

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}