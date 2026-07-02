"use client";
import React, { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession, useSession } from "next-auth/react";
import { isSafari, isIOS, safeSessionStorageGetItem, safeSessionStorageSetItem, safeSessionStorageRemoveItem } from "@/lib/browser-utils";
import { Button } from "@/components/ui/Button";
import { clearStorageForCredentialLoginStart } from "@/lib/session-cleanup";
import { Eye, EyeOff, Lock, ArrowRight, AlertCircle, CheckCircle, User } from "lucide-react";
import Link from "next/link";
import InfoIcon from "@/components/onboarding/InfoIcon";
import { getHintsForPage } from "@/lib/onboarding/hints";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTranslation } from "@/hooks/useTranslation";
import { trackRegistration } from "@/components/GoogleAnalytics";
import EmailVerificationModal from "@/components/auth/EmailVerificationModal";
import { NativeGoogleSignInButton } from "@/components/auth/NativeGoogleSignInButton";
import {
  isAndroidWebViewBridgePresent,
  isNativeAndroid,
  isNativeApp,
} from "@/lib/native/capacitor";
import {
  getPostCredentialsSessionTiming,
  shouldUseLocationReplaceAfterAuth,
  shouldUseNativeRouterRedirectAfterAuth,
  waitForSessionAfterCredentialsSignIn,
} from "@/lib/auth/post-credentials-session-client";
import { useIsNativeAppMounted } from "@/lib/native/useIsNativeAppMounted";
import { useAndroidBridgePresent } from "@/lib/native/useAndroidBridgePresent";
import { useGoogleLoginUiMode } from "@/lib/native/useGoogleLoginUiMode";
import { useGoogleLoginUiResolved } from "@/lib/native/useGoogleLoginUiResolved";
import { logGoogleLoginDiag } from "@/lib/auth/google-login-diagnostics";
import {
  REGISTER_DRAFT_STORAGE_KEY,
  clearRegisterDraftStorage,
  fetchOnboardingFlags,
  onboardingFlagsFromSessionUser,
  resolvePathAfterSocialAuth,
  sanitizePostAuthRelativeUrl,
} from "@/lib/auth/post-auth-redirect";
import { consumeAndResolvePostAuthUrl } from "@/lib/onboarding/pending-intent";
import { HC_PENDING_EMAIL_VERIFICATION_STORAGE_KEY } from "@/lib/email-verification-prompt-storage";
import { PolicyAgreementTermsLabel } from "@/components/legal/PolicyAgreementTermsLabel";
import RegisterSocialRedirect from "@/components/auth/RegisterSocialRedirect";
import { PRIVACY_URL } from "@/lib/legal/policy-urls";

// User types will be loaded dynamically based on language
const REGISTER_DRAFT_TTL = 48 * 60 * 60 * 1000;

type RegisterState = {
  firstName: string;
  middleName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
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
  /** Server duplicate hint for provider-aware copy + links */
  duplicateAccountKind: 'google_only' | 'password_only' | 'both' | null;
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
};

const REGISTER_INITIAL_STATE: RegisterState = {
  firstName: "",
  middleName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
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
  duplicateAccountKind: null,
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
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update: updateSession } = useSession();
  const { t, language } = useTranslation();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [googleAuthChecked, setGoogleAuthChecked] = useState(false);
  const nativeMounted = useIsNativeAppMounted();
  const googleLoginMode = useGoogleLoginUiMode();
  const androidBridgePresent = useAndroidBridgePresent();
  const googleUi = useGoogleLoginUiResolved();

  // Get inviteToken from URL (for sub-affiliate signup)
  const inviteToken = searchParams?.get('inviteToken');

  const resolveEmailSignupFallbackUrl = React.useCallback(
    (dataRedirect: unknown) => {
      const raw =
        searchParams?.get('callbackUrl') || searchParams?.get('returnUrl');
      return (
        sanitizePostAuthRelativeUrl(raw) ||
        sanitizePostAuthRelativeUrl(
          typeof dataRedirect === 'string' ? dataRedirect : null,
        ) ||
        '/'
      );
    },
    [searchParams],
  );
  
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
            
            // Redirect direct naar opgeslagen url (fallback home)
            window.location.href = redirectUrl || "/";
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

  useEffect(() => {
    let cancelled = false;
    const checkGoogleProvider = async () => {
      try {
        const res = await fetch('/api/auth/providers', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!res.ok) {
          if (!cancelled) {
            setGoogleAuthEnabled(false);
            setGoogleAuthChecked(true);
          }
          return;
        }
        const providers = (await res.json()) as Record<string, unknown>;
        if (!cancelled) {
          setGoogleAuthEnabled(Boolean(providers?.google));
          setGoogleAuthChecked(true);
        }
      } catch {
        if (!cancelled) {
          setGoogleAuthEnabled(false);
          setGoogleAuthChecked(true);
        }
      }
    };

    void checkGoogleProvider();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!googleAuthChecked || typeof window === "undefined") return;
    const bridge = isAndroidWebViewBridgePresent();
    console.info(
      "[HomeCheff register google-diag]",
      JSON.stringify({
        androidBridge: bridge,
        nativeAndroid: isNativeAndroid(),
        googleLoginMode,
      }),
    );
  }, [googleAuthChecked, googleLoginMode]);

  // Load hints for this page
  const pageHints = getHintsForPage('register');
  
  // Clear any existing user data to prevent privacy leaks
  useEffect(() => {
    const hasCleared = safeSessionStorageGetItem('register_cleared');

    if (!hasCleared) {
      clearStorageForCredentialLoginStart();
      safeSessionStorageSetItem('register_cleared', 'true');

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

      setTimeout(resetFormFields, 100);
    }
  }, []);

  const [state, setState, { reset: resetRegistrationDraft, isHydrated: isRegistrationHydrated }] =
    usePersistentState<RegisterState>(REGISTER_DRAFT_STORAGE_KEY, REGISTER_INITIAL_STATE, {
      storage: "session",
      ttl: REGISTER_DRAFT_TTL,
      version: 4,
      omitKeysBeforePersist: [
        "password",
        "confirmPassword",
      ],
    });

  const hasDraft = React.useMemo(() => {
    if (!isRegistrationHydrated) {
      return false;
    }

    return Boolean(
      state.firstName ||
      state.middleName ||
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
    clearRegisterDraftStorage();
    if (typeof window !== "undefined") {
      // Safari-compatibele versie: gebruik safe helpers
      safeSessionStorageRemoveItem("pendingRegistration");
      safeSessionStorageRemoveItem("register_cleared");
    }
  }, [resetRegistrationDraft]);

  // Authenticated users: never stay on the signup page; align with social onboarding routing.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (status === "loading") {
        return;
      }

      if (status !== "authenticated" || !session?.user) {
        setIsCheckingOnboarding(false);
        return;
      }

      let flags = await fetchOnboardingFlags();
      if (!flags && typeof updateSession === "function") {
        try {
          await updateSession({});
        } catch {
          /* ignore */
        }
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled) return;
        flags = await fetchOnboardingFlags();
      }
      if (!flags) {
        await new Promise((r) => setTimeout(r, 400));
        if (cancelled) return;
        flags = await fetchOnboardingFlags();
      }

      if (cancelled) return;

      const resolved =
        flags ?? onboardingFlagsFromSessionUser(session.user as any);
      const target = resolvePathAfterSocialAuth(resolved);

      resetRegistrationDraft();
      clearRegisterDraftStorage();
      safeSessionStorageRemoveItem("pendingRegistration");
      safeSessionStorageRemoveItem("register_cleared");

      if (typeof window !== "undefined") {
        window.location.replace(target);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    session,
    status,
    resetRegistrationDraft,
    updateSession,
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

    const delay = 500;

    const timeoutId = setTimeout(() => {
      validateUsername(state.username);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [state.username]);

  // Debounced email validatie
  useEffect(() => {
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
  }, [state.email]);


  async function handleSocialLogin(provider: string) {
    if (provider === "google") {
      logGoogleLoginDiag("google_login_tap", { surface: "register_web_button" });
      if (isNativeAndroid()) {
        setState((prev) => ({
          ...prev,
          error:
            "Google in de app verloopt via de native knop — tik op de knop hierboven.",
        }));
        return;
      }
    }
    if (provider === "google" && !googleAuthEnabled) {
      setState(prev => ({
        ...prev,
        error:
          t('register.errors.socialLoginError', { provider }) ||
          'Google login is momenteel niet beschikbaar.',
      }));
      return;
    }
    try {
      if (provider === "google") {
        logGoogleLoginDiag("google_login_web_start", { surface: "register" });
      }
      await signIn(provider, {
        callbackUrl: '/auth/social-success',
        redirect: true,
      });
    } catch (error) {
      if (provider === "google") {
        logGoogleLoginDiag("google_login_web_failed", { surface: "register" });
      }
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
      if (!state.firstName?.trim()) {
        setState((prev) => ({
          ...prev,
          error: t('register.validation.firstNameRequired'),
        }));
        return;
      }

      if (!state.lastName?.trim()) {
        setState((prev) => ({
          ...prev,
          error: t('register.validation.lastNameRequired'),
        }));
        return;
      }

      if (!state.email?.trim()) {
        setState((prev) => ({
          ...prev,
          error: t('register.validation.emailRequired'),
        }));
        return;
      }

      if (state.emailValidation.isValid !== true) {
        setState((prev) => ({
          ...prev,
          error: t('register.validation.emailInvalid'),
        }));
        return;
      }

      if (!state.password || state.password.length < 6) {
        setState((prev) => ({
          ...prev,
          error: t('register.validation.passwordMinLength'),
        }));
        return;
      }

      if (state.password && state.username.trim() === state.password.trim()) {
        setState((prev) => ({
          ...prev,
          error: t('register.validation.usernameEqualsPassword'),
        }));
        return;
      }

      if (state.password !== state.confirmPassword) {
        setState((prev) => ({
          ...prev,
          error: t('register.validation.passwordMismatch'),
        }));
        return;
      }

      const requestBody = {
        firstName: state.firstName.trim(),
        middleName: (state.middleName || '').trim(),
        lastName: (state.lastName || '').trim(),
        username: state.username.trim(),
        email: state.email.trim(),
        password: state.password,
        confirmPassword: state.confirmPassword,
        gender: '',
        birthMonth: '',
        birthYear: '',
        userTypes: [] as string[],
        selectedBuyerType: '',
        interests: [] as string[],
        location: '',
        country: 'NL',
        address: '',
        street: '',
        houseNumber: '',
        city: '',
        postalCode: '',
        lat: null as number | null,
        lng: null as number | null,
        bio: '',
        isBusiness: false,
        kvk: '',
        btw: '',
        company: '',
        subscription: null as string | null,
        // Uitbetaalgegevens - nu via Stripe
        // Privacy en marketing
        acceptPrivacyPolicy: state.acceptPrivacyPolicy,
        acceptTerms: state.acceptTerms,
        acceptMarketing: state.acceptMarketing,
        // Belastingverantwoordelijkheid
        acceptTaxResponsibility: state.acceptTaxResponsibility,
        // Sub-affiliate invite token (from URL)
        subAffiliateInviteToken: inviteToken || null,
        locale: language === 'en' ? 'en' : 'nl',
      };
      
      console.log('🔵 [FRONTEND] Sending registration request:', {
        isBusiness: requestBody.isBusiness,
        subscription: requestBody.subscription,
        userTypes: requestBody.userTypes,
        hasUserTypes: requestBody.userTypes?.length > 0
      });
      
      setState((prev) => ({ ...prev, error: null, duplicateAccountKind: null }));

      const response = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Vertaal error codes naar gebruiksvriendelijke berichten
        let errorMessage = data.error || t('register.validation.registrationError');
        const duplicateKind = data.duplicateKind as
          | 'google_only'
          | 'password_only'
          | 'both'
          | undefined;

        if (data.error === 'ALREADY_REGISTERED' && duplicateKind) {
          if (duplicateKind === 'google_only') {
            errorMessage = t('register.errors.accountExistsGoogleOnly');
          } else if (duplicateKind === 'both') {
            errorMessage = t('register.errors.accountExistsBoth');
          } else {
            errorMessage = t('register.errors.accountExistsPassword');
          }
        }

        // Map API error codes naar vertalingen
        const errorCodeMap: Record<string, string> = {
          'COMPANY_NAME_REQUIRED': t('register.validation.companyNameRequiredError'),
          'BUSINESS_REGISTRATION_REQUIRED': t('register.validation.businessRegistrationRequiredError'),
          'KVK_INVALID_FORMAT': t('register.validation.kvkInvalidFormatError'),
          'VAT_INVALID_FORMAT': t('register.validation.vatInvalidFormatError'),
          'BUSINESS_REGISTRATION_INVALID_FORMAT': t('register.validation.businessRegistrationInvalidFormatError'),
          'ACCOUNT_CREATION_ERROR': t('register.validation.registrationError'),
        };
        
        if (errorCodeMap[data.error]) {
          errorMessage = errorCodeMap[data.error];
        }
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          duplicateAccountKind: duplicateKind ?? null,
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
        console.error('❌ [FRONTEND] Bedrijf met abonnement maar geen checkoutUrl!', {
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
          userRole: data?.user?.role || 'BUYER',
          buyerRoles: [],
          sellerRoles: [],
          hasDelivery: false,
          isBusiness: false,
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
      
      const redirectUrl = resolveEmailSignupFallbackUrl(data?.redirectUrl);

      if (data?.needsVerification && typeof window !== 'undefined') {
        safeSessionStorageSetItem(
          HC_PENDING_EMAIL_VERIFICATION_STORAGE_KEY,
          JSON.stringify({
            v: 1,
            email: state.email.trim(),
            initialSendOk: data?.verificationEmailSent === true,
            providerUnavailable:
              data?.verificationEmailSkippedReason === 'EMAIL_UNAVAILABLE' ||
              data?.verificationEmailSkippedReason === 'EMAIL_NOT_CONFIGURED',
          }),
        );
      }

      setState(() => ({
        ...REGISTER_INITIAL_STATE,
        success: true,
      }));

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
        
        const sessionTiming = getPostCredentialsSessionTiming();
        const isIOSDevice = isIOS();
        const isSafariOnIOS = isSafari() && isIOSDevice;

        console.log('🔍 [REGISTER] Device detection:', {
          isIOS: isIOSDevice,
          isSafariOnIOS,
          nativeApp: isNativeApp(),
          initialDelay: sessionTiming.initialDelayMs,
        });

        if (typeof updateSession === "function") {
          try {
            await updateSession({});
            await new Promise((resolve) =>
              setTimeout(resolve, sessionTiming.updateDelayMs),
            );
          } catch (sessionError) {
            console.warn("Session update warning (non-critical):", sessionError);
          }
        }

        let currentSession = await waitForSessionAfterCredentialsSignIn(
          getSession,
          sessionTiming,
        );

        if (!currentSession?.user?.email) {
          if (sessionTiming.useIosRefreshRedirectIfNoSession) {
            console.warn('⚠️ [REGISTER] No session found after retries on iOS, using refresh redirect');
            const u0 = currentSession?.user as
              | { username?: string | null; socialOnboardingCompleted?: boolean | null }
              | undefined;
            const pathAfterSession0 =
              (u0 && consumeAndResolvePostAuthUrl(u0)) || redirectUrl;
            const finalRedirectUrl =
              pathAfterSession0 +
              (pathAfterSession0.includes('?') ? '&' : '?') +
              'welcome=true&registered=true&_refresh=1';

            // Use window.location.replace to avoid back button issues
            window.location.replace(finalRedirectUrl);
            return;
          }

          // For other browsers, redirect to login with message
          console.warn('⚠️ [REGISTER] No session found after all retries, redirecting to login');
          router.push(`/login?message=${encodeURIComponent(t('register.paymentSuccess') || 'Account aangemaakt! Log in met je email en wachtwoord.')}&email=${encodeURIComponent(state.email)}`);
          return;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, sessionTiming.redirectDelayMs),
        );

        const u = currentSession.user as
          | { username?: string | null; socialOnboardingCompleted?: boolean | null }
          | undefined;
        const pathAfterSession = (u && consumeAndResolvePostAuthUrl(u)) || redirectUrl;
        const finalRedirectUrl =
          pathAfterSession +
          (pathAfterSession.includes('?') ? '&' : '?') +
          'welcome=true&registered=true';

        if (shouldUseNativeRouterRedirectAfterAuth()) {
          try {
            sessionStorage.setItem('hc_npush_gate', '1');
          } catch {
            /* ignore */
          }
          try {
            router.refresh();
          } catch {
            /* ignore */
          }
          router.replace(finalRedirectUrl);
          return;
        }
        if (shouldUseLocationReplaceAfterAuth()) {
          if (isNativeApp()) {
            try {
              sessionStorage.setItem('hc_npush_gate', '1');
            } catch {
              /* ignore */
            }
          }
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

  if (isSocialLogin) {
    return <RegisterSocialRedirect />;
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
              {t('register.lightStepBadge')}
            </div>
          </div>
        </div>
      </header>


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
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 shrink-0" />
              <div className="text-sm text-red-800 space-y-2">
                <p>{state.error}</p>
                {state.duplicateAccountKind ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-red-900 font-medium">
                    <Link href="/login" className="underline hover:text-red-950">
                      {t('register.errors.loginInstead')}
                    </Link>
                    {(state.duplicateAccountKind === 'password_only' ||
                      state.duplicateAccountKind === 'both') && (
                      <Link href="/forgot-password" className="underline hover:text-red-950">
                        {t('register.errors.forgotPasswordSuggestion')}
                      </Link>
                    )}
                  </div>
                ) : null}
              </div>
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
            <div className="text-center">
                <div className="mb-8">
                    <div className="space-y-3 mb-6 text-center">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {t('register.lightTitle')}
                      </h2>
                      <p className="text-base text-gray-600">{t('register.lightSubtitle')}</p>
                      <p className="text-sm font-semibold text-emerald-800">{t('register.lightTagline')}</p>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">{t('register.lightHint')}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8 relative z-10">
                    {googleAuthEnabled && (!googleAuthChecked || googleUi.showSkeleton) ? (
                      <div
                        className="h-14 max-w-sm mx-auto w-full rounded-xl bg-gray-100 animate-pulse"
                        aria-hidden
                      />
                    ) : null}
                    {googleAuthEnabled && googleAuthChecked && googleUi.showNativeButton ? (
                      <NativeGoogleSignInButton
                        rememberMe
                        disabled={!googleAuthEnabled}
                        buttonLabel={t('register.continueWithGoogle')}
                        variant="register"
                        analyticsContext="register"
                      />
                    ) : null}
                    {googleAuthEnabled && googleAuthChecked && googleUi.showWebButton ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSocialLogin("google");
                        }}
                        disabled={!googleAuthEnabled}
                        className="w-full max-w-sm mx-auto inline-flex justify-center items-center px-6 py-4 border border-gray-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {t('register.continueWithGoogle')}
                      </button>
                    ) : null}
                    {!googleAuthEnabled && googleAuthChecked && (
                      <p className="text-xs text-center text-gray-500">
                        Google login is tijdelijk niet beschikbaar door ontbrekende configuratie.
                      </p>
                    )}
                  </div>

                {/* Divider */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">{t('register.or')}</span>
                  </div>
                </div>

                {/* E-mail registratie (licht) */}
                <div className="max-w-lg mx-auto space-y-5 text-left">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="hc-register-light-first">
                        {t('register.firstName')} *
                      </label>
                      <input
                        id="hc-register-light-first"
                        name="given-name"
                        type="text"
                        value={state.firstName}
                        onChange={(e) => setState((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        placeholder={t('register.firstNamePlaceholder')}
                        autoComplete="given-name"
                        autoCapitalize="words"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="hc-register-light-middle">
                        {t('register.middleName')}
                      </label>
                      <input
                        id="hc-register-light-middle"
                        name="additional-name"
                        type="text"
                        value={state.middleName}
                        onChange={(e) => setState((prev) => ({ ...prev, middleName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        placeholder={t('register.middleNamePlaceholder')}
                        autoComplete="additional-name"
                        autoCapitalize="words"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="hc-register-light-last">
                        {t('register.lastName')} *
                      </label>
                      <input
                        id="hc-register-light-last"
                        name="family-name"
                        type="text"
                        value={state.lastName}
                        onChange={(e) => setState((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        placeholder={t('register.lastNamePlaceholder')}
                        autoComplete="family-name"
                        autoCapitalize="words"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="hc-register-light-email">
                        {t('register.email')} *
                      </label>
                      {pageHints?.hints.email && (
                        <InfoIcon hint={pageHints.hints.email} pageId="register" size="sm" />
                      )}
                    </div>
                    <input
                      id="hc-register-light-email"
                      name="email"
                      type="email"
                      value={state.email}
                      onChange={(e) => setState((prev) => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        state.emailValidation.isValid === true
                          ? 'border-green-300 bg-green-50'
                          : state.emailValidation.isValid === false
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                      }`}
                      placeholder={t('register.emailPlaceholder')}
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    {state.emailValidation.message ? (
                      <p
                        className={`mt-2 text-sm ${
                          state.emailValidation.isValid === true
                            ? 'text-green-600'
                            : state.emailValidation.isValid === false
                              ? 'text-red-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {state.emailValidation.isChecking ? '… ' : null}
                        {state.emailValidation.message}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="hc-register-light-username">
                        {t('register.username')} *
                      </label>
                      {pageHints?.hints.username && (
                        <InfoIcon hint={pageHints.hints.username} pageId="register" size="sm" />
                      )}
                    </div>
                    <p className="mb-2 text-xs text-gray-600">{t('register.usernamePublicHandleHint')}</p>
                    <p className="mb-2 text-xs text-gray-500">{t('register.legalNameProfileHint')}</p>
                    <div className="relative">
                      <input
                        id="hc-register-light-username"
                        name="username"
                        type="text"
                        value={state.username}
                        onChange={(e) => setState((prev) => ({ ...prev, username: e.target.value }))}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 focus:border-transparent transition-colors ${
                          state.usernameValidation.isValid === true
                            ? 'border-green-500 bg-green-50 focus:ring-green-500'
                            : state.usernameValidation.isValid === false
                              ? 'border-red-500 bg-red-50 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                        }`}
                        placeholder={t('register.usernamePlaceholder')}
                        autoComplete="username"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                      />
                      {state.usernameValidation.isChecking ? (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600" />
                        </div>
                      ) : null}
                      {state.usernameValidation.isValid === true && !state.usernameValidation.isChecking ? (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      ) : null}
                      {state.usernameValidation.isValid === false && !state.usernameValidation.isChecking ? (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                      ) : null}
                    </div>
                    {state.usernameValidation.message ? (
                      <div
                        className={`mt-2 text-sm ${
                          state.usernameValidation.isValid === true
                            ? 'text-green-600'
                            : state.usernameValidation.isValid === false
                              ? 'text-red-600'
                              : 'text-gray-500'
                        }`}
                      >
                        {state.usernameValidation.message}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700" htmlFor="hc-register-light-password">
                        {t('register.password')} *
                      </label>
                      {pageHints?.hints.password && (
                        <InfoIcon hint={pageHints.hints.password} pageId="register" size="sm" />
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="hc-register-light-password"
                        name="new-password"
                        type={state.showPassword ? 'text' : 'password'}
                        value={state.password}
                        onChange={(e) => setState((prev) => ({ ...prev, password: e.target.value }))}
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
                        onClick={() => setState((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                      >
                        {state.showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {state.password ? (
                      <p
                        className={`text-sm mt-2 ${
                          state.password.length >= 6 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {state.password.length >= 6 ? t('register.passwordStrong') : t('register.passwordWeak')}
                      </p>
                    ) : null}
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="hc-register-light-confirm">
                        {t('register.confirmPassword')} *
                      </label>
                      <input
                        id="hc-register-light-confirm"
                        type="password"
                        value={state.confirmPassword}
                        onChange={(e) => setState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        placeholder={t('register.confirmPasswordPlaceholder')}
                        autoComplete="new-password"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        id="acceptPrivacyPolicy-light"
                        checked={state.acceptPrivacyPolicy}
                        onChange={(e) =>
                          setState((prev) => ({ ...prev, acceptPrivacyPolicy: e.target.checked }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>
                        <span className="font-medium">{t('register.acceptPrivacy')}</span>
                        <span className="block text-xs text-gray-500">
                          {t('register.acceptPrivacySubtext')}{' '}
                          <Link href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                            {t('legalPolicies.privacy')}
                          </Link>
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2 text-sm text-gray-700" htmlFor="acceptTerms-light">
                      <input
                        type="checkbox"
                        id="acceptTerms-light"
                        checked={state.acceptTerms}
                        onChange={(e) => setState((prev) => ({ ...prev, acceptTerms: e.target.checked }))}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <PolicyAgreementTermsLabel />
                    </label>
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        id="acceptMarketing-light"
                        checked={state.acceptMarketing}
                        onChange={(e) =>
                          setState((prev) => ({ ...prev, acceptMarketing: e.target.checked }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>
                        <span className="font-medium">{t('register.acceptMarketing')}</span>
                        <span className="block text-xs text-gray-500">{t('register.acceptMarketingSubtext')}</span>
                      </span>
                    </label>
                  </div>

                  <Button
                    type="button"
                    onClick={handleRegister}
                    disabled={
                      !state.firstName?.trim() ||
                      !state.lastName?.trim() ||
                      !state.email?.trim() ||
                      !state.username?.trim() ||
                      !state.password ||
                      state.password.length < 6 ||
                      state.password !== state.confirmPassword ||
                      !state.acceptPrivacyPolicy ||
                      !state.acceptTerms ||
                      state.usernameValidation.isChecking ||
                      state.usernameValidation.isValid !== true ||
                      state.emailValidation.isChecking ||
                      state.emailValidation.isValid !== true
                    }
                    className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('register.createAccount')}
                  </Button>
                </div>

                <div className="mt-6 text-sm text-gray-500 text-center">
                  <p>{t('register.alreadyHaveAccount')} <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">{t('register.login')}</Link></p>
                </div>
              </div>
          </>
        )}
      </div>
    </main>
  );
}

function LoadingFallback() {
  const { t, language } = useTranslation();
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