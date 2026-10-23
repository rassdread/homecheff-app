'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Bike, MapPin, Clock, Users, CheckCircle, ArrowRight, User, Mail, Lock, Eye, EyeOff, FileText, X, Zap, Car } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import DynamicAddressFields, { AddressData } from '@/components/ui/DynamicAddressFields';
import DeliveryAgreementModal from '@/components/delivery/DeliveryAgreementModal';
import DeliveryRegistrationNotice from '@/components/delivery/DeliveryRegistrationNotice';
import { CANONICAL_DELIVERY_DAYS } from '@/lib/delivery/delivery-profile-canonical';
import {
  prefillDeliveryAddress,
  validateDeliveryAddressParts,
} from '@/lib/delivery/delivery-registration-address';
import {
  clearDeliverySignupDraft,
  newDeliveryFlowId,
  readDeliverySignupDraft,
  writeDeliverySignupDraft,
} from '@/lib/delivery/delivery-signup-draft';
import { trackDeliverySignupFunnel } from '@/lib/delivery/delivery-signup-funnel';
import {
  consumeSameTabCredentialNavigation,
  markSameTabCredentialNavigation,
} from '@/lib/auth/session-identity-channel';

interface DeliverySignupData {
  // Account creation
  name: string;
  email: string;
  password: string;
  username: string;
  
  // Delivery profile
  age: number;
  transportation: string[];
  maxDistance: number;
  availableDays: string[];
  availableTimeSlots: string[];
  bio: string;
  
  // Work area settings
  deliveryMode: 'FIXED' | 'DYNAMIC';
  homeLat?: number;
  homeLng?: number;
  homeAddress?: string;
  preferredRadius: number;
  
  // Address details (for delivery home location)
  addressData: AddressData;
  
  // Legal agreements
  acceptDeliveryAgreement: boolean;

  // Business (optional — used by /delivery/company/signup)
  providerType: 'INDEPENDENT' | 'DELIVERY_BUSINESS';
  companyName: string;
  kvkNumber: string;
  vatNumber: string;
  contactPhone: string;
}

interface ValidationState {
  isValid: boolean | null;
  message: string;
  isChecking: boolean;
}

export default function DeliverySignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useTranslation();
  const flowIdRef = useRef('');
  const draftReady = useRef(false);
  const skipDraftWrite = useRef(true);
  const [passwordReentry, setPasswordReentry] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [stepNotice, setStepNotice] = useState<string | null>(null);
  const [addressErrors, setAddressErrors] = useState<
    Partial<Record<'address' | 'houseNumber' | 'postalCode' | 'city', string>>
  >({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resumeLoginHint, setResumeLoginHint] = useState(false);
  const [submitLock, setSubmitLock] = useState(false);
  const [emailValidation, setEmailValidation] = useState<ValidationState>({
    isValid: null,
    message: "",
    isChecking: false,
  });
  const [formData, setFormData] = useState<DeliverySignupData>({
    // Account creation
    name: '',
    email: '',
    password: '',
    username: '',
    
    // Delivery profile
    age: 18,
    transportation: [],
    maxDistance: 3,
    availableDays: [],
    availableTimeSlots: [],
    bio: '',
    
    // Work area settings
    deliveryMode: 'FIXED',
    preferredRadius: 5,
    
    // Address details (for delivery home location)
    addressData: {
      address: '',
      postalCode: '',
      houseNumber: '',
      city: '',
      country: 'NL',
      lat: null,
      lng: null,
    },
    
    // Legal agreements
    acceptDeliveryAgreement: false,

    providerType: 'INDEPENDENT',
    companyName: '',
    kvkNumber: '',
    vatNumber: '',
    contactPhone: '',
  });

  const transportationOptions = [
    { id: 'BIKE', label: t('deliverySignup.transportation.bike'), icon: <Bike className="w-5 h-5" />, maxRange: 5 },
    { id: 'EBIKE', label: t('deliverySignup.transportation.ebike'), icon: <Zap className="w-5 h-5" />, maxRange: 10 },
    { id: 'SCOOTER', label: t('deliverySignup.transportation.scooter'), icon: <Bike className="w-5 h-5" />, maxRange: 15 },
    { id: 'CAR', label: t('deliverySignup.transportation.car'), icon: <Car className="w-5 h-5" />, maxRange: 25 }
  ];

  const dayOptions = CANONICAL_DELIVERY_DAYS.map((id, index) => ({
    id,
    label: t(
      [
        'deliverySignup.days.monday',
        'deliverySignup.days.tuesday',
        'deliverySignup.days.wednesday',
        'deliverySignup.days.thursday',
        'deliverySignup.days.friday',
        'deliverySignup.days.saturday',
        'deliverySignup.days.sunday',
      ][index]
    ),
  }));

  const timeSlotOptions = [
    { id: 'morning', label: t('deliverySignup.timeSlots.morning') },
    { id: 'afternoon', label: t('deliverySignup.timeSlots.afternoon') },
    { id: 'evening', label: t('deliverySignup.timeSlots.evening') }
  ];

  const handleTransportationChange = (transport: string) => {
    setFormData(prev => ({
      ...prev,
      transportation: prev.transportation.includes(transport)
        ? prev.transportation.filter(t => t !== transport)
        : [...prev.transportation, transport]
    }));
  };

  const handleDayChange = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const handleTimeSlotChange = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      availableTimeSlots: prev.availableTimeSlots.includes(slot)
        ? prev.availableTimeSlots.filter(s => s !== slot)
        : [...prev.availableTimeSlots, slot]
    }));
  };

  // Email validatie functie
  const validateEmail = async (email: string) => {
    if (!email) {
      setEmailValidation({
        isValid: null,
        message: "",
        isChecking: false,
      });
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailValidation({
        isValid: false,
        message: t('deliverySignup.validation.validEmail'),
        isChecking: false,
      });
      return;
    }

    setEmailValidation({
      isValid: null,
      message: t('common.loading'),
      isChecking: true,
    });

    try {
      const response = await fetch('/api/auth/validate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, context: 'delivery' }),
      });

      const data = await response.json();

      const incomplete = Boolean(data.incompleteDeliveryOnboarding);
      setResumeLoginHint(incomplete || data.resumeHint === 'login_and_resume');
      setEmailValidation({
        isValid: data.valid === true,
        message: data.valid
          ? data.message
          : (typeof data.error === 'string' && data.error !== 'ALREADY_REGISTERED'
              ? data.error
              : (data.message || 'Dit e-mailadres is al in gebruik. Log in om verder te gaan.')),
        isChecking: false,
      });
    } catch (error) {
      setEmailValidation({
        isValid: false,
        message: t('deliverySignup.validation.emailCheckError'),
        isChecking: false,
      });
    }
  };

  const campaignMeta = () => {
    const params = new URLSearchParams(window.location.search);
    const meta: Record<string, string | number> = {
      registrationType: isExistingUser ? 'existing_user' : 'new_user',
      language,
      flowId: flowIdRef.current,
    };
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const) {
      const value = params.get(key);
      if (value) meta[key] = value;
    }
    return meta;
  };

  const collectAddressErrors = () => {
    const parts = formData.addressData;
    const codes = validateDeliveryAddressParts(parts);
    const next: Partial<Record<'address' | 'houseNumber' | 'postalCode' | 'city', string>> = {};
    if (codes.includes('street')) next.address = t('deliverySignup.validation.enterStreet');
    if (codes.includes('houseNumber')) {
      next.houseNumber = t('deliverySignup.validation.enterHouseNumber');
    }
    if (codes.includes('postalCode')) {
      next.postalCode = parts.postalCode?.trim()
        ? t('deliverySignup.validation.invalidPostalCode')
        : t('deliverySignup.validation.enterPostalCode');
    }
    if (codes.includes('city')) next.city = t('deliverySignup.validation.enterCity');
    return next;
  };

  const buildHomeAddress = () => {
    if (!formData.addressData.address) return null;
    if (
      formData.addressData.country === 'NL' &&
      formData.addressData.postalCode &&
      formData.addressData.houseNumber
    ) {
      return `${formData.addressData.address || ''} ${formData.addressData.houseNumber}, ${formData.addressData.postalCode} ${formData.addressData.city || ''}`.trim();
    }
    return [
      formData.addressData.address,
      formData.addressData.houseNumber,
      formData.addressData.postalCode,
      formData.addressData.city,
    ]
      .filter(Boolean)
      .join(', ');
  };

  const handleSubmit = async () => {
    if (submitLock || isLoading) return;
    if (formData.age < 18) {
      setSubmitError(
        'Commerciële bezorging via HomeCheff is beschikbaar vanaf 18 jaar.'
      );
      return;
    }
    setSubmitLock(true);
    setIsLoading(true);
    setSubmitError(null);
    setResumeLoginHint(false);
    trackDeliverySignupFunnel('delivery_signup_submitted', {
      ...campaignMeta(),
      step: 9,
    });
    try {
      const homeAddress = buildHomeAddress();
      const sharedProfile = {
        age: formData.age,
        transportation: formData.transportation,
        maxDistance: formData.maxDistance,
        availableDays: formData.availableDays,
        availableTimeSlots: formData.availableTimeSlots,
        bio: formData.bio,
        deliveryMode: formData.deliveryMode,
        preferredRadius: formData.preferredRadius,
        homeLat: formData.addressData.lat ?? null,
        homeLng: formData.addressData.lng ?? null,
        homeAddress,
        addressCountry: formData.addressData.country || 'NL',
        street: formData.addressData.address,
        houseNumber: formData.addressData.houseNumber,
        postalCode: formData.addressData.postalCode,
        city: formData.addressData.city,
        acceptDeliveryAgreement: formData.acceptDeliveryAgreement,
        deliveryRegion: formData.addressData.city,
        providerType: formData.providerType,
        companyName: formData.companyName || undefined,
        kvkNumber: formData.kvkNumber || undefined,
        vatNumber: formData.vatNumber || undefined,
        contactPhone: formData.contactPhone || undefined,
      };

      const requestBody = isExistingUser
        ? sharedProfile
        : {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            username: formData.username,
            ...sharedProfile,
          };

      const response = await fetch('/api/delivery/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const friendly =
          (typeof result?.error === 'string' &&
            result.error !== 'ALREADY_REGISTERED' &&
            result.error !== 'INTERNAL_SERVER_ERROR' &&
            result.error) ||
          (typeof result?.message === 'string' && result.message) ||
          'Controleer de gemarkeerde gegevens en probeer opnieuw.';
        setSubmitError(friendly);
        setResumeLoginHint(
          result?.resumeHint === 'login_and_resume' ||
            result?.code === 'RESUME_REQUIRED' ||
            result?.incompleteDeliveryOnboarding === true
        );
        trackDeliverySignupFunnel('delivery_signup_validation_failed', {
          ...campaignMeta(),
          step: 9,
          reason: 'submit_rejected',
        });
        return;
      }

      clearDeliverySignupDraft();
      trackDeliverySignupFunnel('delivery_signup_completed', {
        ...campaignMeta(),
        step: 9,
      });

      if (isExistingUser) {
        try { window.sessionStorage.removeItem('homecheff_pending_intent_v1'); } catch { /* ignore */ }
        window.location.assign('/delivery/dashboard?welcome=true&newSignup=true');
        return;
      }

      try {
        try { window.sessionStorage.removeItem('homecheff_pending_intent_v1'); } catch { /* ignore */ }
        markSameTabCredentialNavigation();
        const loginResponse = await signIn('credentials', {
          emailOrUsername: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (loginResponse?.ok) {
          try { window.sessionStorage.removeItem('homecheff_pending_intent_v1'); } catch { /* ignore */ }
          window.location.assign('/delivery/dashboard?welcome=true&newSignup=true');
          return;
        } else {
          consumeSameTabCredentialNavigation();
          router.push(
            `/login?message=${encodeURIComponent(
              t('deliverySignup.registrationSuccess')
            )}&callbackUrl=${encodeURIComponent('/delivery/dashboard')}`
          );
        }
      } catch {
        consumeSameTabCredentialNavigation();
        router.push(
          '/login?message=Registratie%20succesvol!%20Log%20nu%20in%20met%20je%20nieuwe%20account.&callbackUrl=%2Fdelivery%2Fdashboard'
        );
      }
    } catch (error: unknown) {
      console.error('Delivery signup submit error:', error);
      setSubmitError(
        'Er ging iets mis bij het afronden van je bezorgeraanmelding. Je gegevens zijn bewaard. Probeer het opnieuw.'
      );
    } finally {
      setIsLoading(false);
      setSubmitLock(false);
    }
  };

  useEffect(() => {
    const draft = readDeliverySignupDraft();
    if (draft) {
      flowIdRef.current = draft.flowId;
      setFormData((prev) => ({
        ...prev,
        name: draft.name || prev.name,
        email: draft.email || prev.email,
        username: draft.username || prev.username,
        age: draft.age || prev.age,
        transportation: draft.transportation.length ? draft.transportation : prev.transportation,
        availableDays: draft.availableDays,
        availableTimeSlots: draft.availableTimeSlots,
        bio: draft.bio,
        deliveryMode: draft.deliveryMode,
        preferredRadius: draft.preferredRadius,
        maxDistance: draft.maxDistance,
        acceptDeliveryAgreement: draft.acceptDeliveryAgreement,
        addressData: {
          address: draft.address.address || '',
          houseNumber: draft.address.houseNumber || '',
          postalCode: draft.address.postalCode || '',
          city: draft.address.city || '',
          country: draft.address.country || 'NL',
          lat: draft.address.lat ?? null,
          lng: draft.address.lng ?? null,
        },
      }));
      setCurrentStep(draft.currentStep);
      setPasswordReentry(draft.currentStep > 2);
    } else {
      flowIdRef.current = newDeliveryFlowId();
    }
    draftReady.current = true;
    skipDraftWrite.current = true;
    setDraftLoaded(true);
    trackDeliverySignupFunnel('delivery_signup_started', {
      registrationType: 'new_user',
      language,
      flowId: flowIdRef.current,
      step: draft?.currentStep || 1,
    });
    // Hydrate once. Language changes must not reload the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftReady.current || skipDraftWrite.current) {
      skipDraftWrite.current = false;
      return;
    }
    writeDeliverySignupDraft({
      currentStep,
      flowId: flowIdRef.current || newDeliveryFlowId(),
      name: formData.name,
      email: formData.email,
      username: formData.username,
      age: formData.age,
      transportation: formData.transportation,
      availableDays: formData.availableDays,
      availableTimeSlots: formData.availableTimeSlots,
      bio: formData.bio,
      deliveryMode: formData.deliveryMode,
      preferredRadius: formData.preferredRadius,
      maxDistance: formData.maxDistance,
      acceptDeliveryAgreement: formData.acceptDeliveryAgreement,
      address: formData.addressData,
    });
  }, [currentStep, formData]);

  useEffect(() => {
    if (!draftLoaded || !flowIdRef.current) return;
    trackDeliverySignupFunnel('delivery_signup_step_viewed', {
      ...campaignMeta(),
      step: currentStep,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [draftLoaded, currentStep, language, isExistingUser]);

  // Pre-fill existing user data if logged in
  useEffect(() => {
    const loadExistingUserData = async () => {
      if (!session?.user?.email) return;
      
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const userData = await response.json();
          const user = userData.user || userData;
          
          setIsExistingUser(true);
          setFormData(prev => ({
            ...prev,
            // Account info (pre-filled but not editable)
            name: user.name || prev.name,
            email: user.email || prev.email,
            username: user.username || prev.username,
            // Address info
            addressData: (() => {
              const prefilled = prefillDeliveryAddress({
                address: user.address,
                postalCode: user.postalCode,
                city: user.city,
                place: user.place,
                country: user.country,
                lat: user.lat,
                lng: user.lng,
                houseNumber: prev.addressData.houseNumber,
              });
              return {
                address: prev.addressData.address || prefilled.address || '',
                postalCode: prev.addressData.postalCode || prefilled.postalCode || '',
                houseNumber: prev.addressData.houseNumber || prefilled.houseNumber || '',
                city: prev.addressData.city || prefilled.city || '',
                country: prev.addressData.country || prefilled.country || 'NL',
                lat: prev.addressData.lat ?? prefilled.lat ?? null,
                lng: prev.addressData.lng ?? prefilled.lng ?? null,
              };
            })(),
            // Bio if available
            bio: user.bio || prev.bio,
          }));
          
          // Skip account steps (1 name/email, 2 password/username) → start at age
          setCurrentStep((step) => (step < 3 ? 3 : step));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (status === 'authenticated') {
      loadExistingUserData();
    }
  }, [session?.user?.email, status]);

  useEffect(() => {
    if (isExistingUser) setPasswordReentry(false);
  }, [isExistingUser]);

  // Debounced email validatie (alleen als nieuwe gebruiker)
  useEffect(() => {
    if (isExistingUser) return; // Skip validation for existing users
    
    if (!formData.email) {
      setEmailValidation({
        isValid: null,
        message: "",
        isChecking: false,
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      validateEmail(formData.email);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [formData.email, isExistingUser]);

  const firstStep = isExistingUser ? 3 : 1;

  const nextStep = () => {
    if (currentStep === 7) {
      const errors = collectAddressErrors();
      setAddressErrors(errors);
      if (Object.keys(errors).length > 0) {
        setStepNotice(t('deliverySignup.validation.completeStep'));
        trackDeliverySignupFunnel('delivery_signup_validation_failed', {
          ...campaignMeta(),
          step: 7,
          reason: Object.keys(errors).join('_'),
        });
        return;
      }
    }
    if (!isStepValid()) {
      setStepNotice(t('deliverySignup.validation.completeStep'));
      trackDeliverySignupFunnel('delivery_signup_validation_failed', {
        ...campaignMeta(),
        step: currentStep,
        reason: 'step_incomplete',
      });
      return;
    }
    setStepNotice(null);
    setAddressErrors({});
    trackDeliverySignupFunnel('delivery_signup_step_completed', {
      ...campaignMeta(),
      step: currentStep,
    });
    if (currentStep < 9) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > firstStep) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return Boolean(
          formData.name.trim() &&
            formData.email.trim() &&
            formData.email.includes('@') &&
            emailValidation.isValid === true
        );
      case 2:
        if (isExistingUser) return true;
        return (
          formData.password.length >= 6 &&
          /^[a-zA-Z0-9_]{3,20}$/.test(formData.username.trim())
        );
      case 3:
        return formData.age >= 18;
      case 4:
        return formData.transportation.length > 0;
      case 5:
        return formData.availableDays.length > 0;
      case 6:
        return formData.availableTimeSlots.length > 0;
      case 7:
        return (
          formData.preferredRadius > 0 &&
          Boolean(formData.deliveryMode) &&
          validateDeliveryAddressParts(formData.addressData).length === 0
        );
      case 8:
        return true; // Bio is optional
      case 9: {
        // Commercial delivery is 18+ only; parental consent is not an exception path.
        return formData.acceptDeliveryAgreement && formData.age >= 18;
      }
      default:
        return false;
    }
  };

  // State for showing legal agreement modal
  const [showLegalModal, setShowLegalModal] = useState(false);

  // Debug function to show validation details
  const getValidationDetails = () => {
    if (currentStep !== 8) return '';
    
    const hasAgreement = formData.acceptDeliveryAgreement;
    if (formData.age < 18) {
      return `❌ ${t('deliverySignup.ageRequired')}`;
    }
    return hasAgreement
      ? '✅ Geldig (18+ met overeenkomst)'
      : '❌ Mis: Overeenkomst niet geaccepteerd';
  };

  // Show loading while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-brand mx-auto mb-4"></div>
          <p className="text-gray-600">{t('deliverySignup.sessionLoading')}</p>
        </div>
      </div>
    );
  }

  // If user is already logged in and has delivery profile, redirect to dashboard
  if (session?.user && status === 'authenticated') {
    // Check if user already has delivery profile
    // This will be handled by the dashboard page itself
  }

  return (
    <div className="w-screen max-w-[100vw] overflow-x-clip min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 pb-[calc(8rem+var(--hc-cookie-banner-offset,0px)+env(safe-area-inset-bottom,0px))]">
      <div className="container mx-auto px-4 pt-2 pb-6 sm:py-8">
        {/* Header */}
        <div className="mb-2 text-center sm:mb-8">
          <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary-brand p-2 text-white sm:mb-4 sm:h-20 sm:w-20 sm:p-4">
            <Users className="h-5 w-5 sm:h-10 sm:w-10" />
          </div>
          <h1 className="mb-2 max-w-full whitespace-normal break-words text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('deliverySignup.title')}
          </h1>
          <div className={currentStep === 3 ? 'hidden sm:block' : undefined}>
            <p className="mx-auto max-w-full break-words text-sm text-gray-600 sm:text-base">
              {t('deliverySignup.subtitle')}
            </p>
            <DeliveryRegistrationNotice />
          </div>
        </div>

        {/* Progress — 9 columns so every step stays inside a 390px screen */}
        <div className="mx-auto mb-4 w-full min-w-0 max-w-2xl sm:mb-6">
          <div className="relative mb-2 sm:mb-4">
            <div className="absolute left-[8%] right-[8%] top-2.5 h-0.5 bg-gray-200 sm:top-3" aria-hidden>
              <div
                className="h-full bg-primary-brand"
                style={{ width: `${((currentStep - 1) / 8) * 100}%` }}
              />
            </div>
            <ol className="relative m-0 grid w-full min-w-0 list-none grid-cols-9 p-0">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
                <li key={step} className="flex min-w-0 justify-center">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium sm:h-8 sm:w-8 sm:text-sm ${
                    step <= currentStep
                      ? 'bg-primary-brand text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step < currentStep ? <CheckCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5" /> : step}
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="text-center text-sm text-gray-500">
            {t('deliverySignup.step')} {currentStep} {t('deliverySignup.of')} 9
          </div>
        </div>

        {/* Form Steps */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
            
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div>
                <h3 className="mb-3 text-center text-lg font-semibold text-gray-900 sm:mb-6 sm:text-xl">
                  {t('deliverySignup.personalInfo')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('deliverySignup.fullName')}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={t('deliverySignup.fullNamePlaceholder')}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('deliverySignup.emailAddress')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder={t('deliverySignup.emailPlaceholder')}
                        className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-colors ${
                          emailValidation.isValid === true
                            ? 'border-green-500 bg-green-50 focus:ring-green-500'
                            : emailValidation.isValid === false
                            ? 'border-red-500 bg-red-50 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-primary-brand focus:border-primary-brand'
                        }`}
                      />
                      {emailValidation.isChecking && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-brand"></div>
                        </div>
                      )}
                      {emailValidation.isValid === true && !emailValidation.isChecking && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                      {emailValidation.isValid === false && !emailValidation.isChecking && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <X className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                    </div>
                    
                    {/* Validation feedback */}
                    {emailValidation.message && (
                      <div className={`mt-2 text-sm ${
                        emailValidation.isValid === true
                          ? 'text-green-600'
                          : emailValidation.isValid === false
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {emailValidation.message}
                        {resumeLoginHint && (
                          <div className="mt-2">
                            <a
                              href={`/login?callbackUrl=${encodeURIComponent('/delivery/signup')}`}
                              className="font-semibold underline"
                            >
                              {t('deliverySignup.loginToFinishProfile')}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Account Security */}
            {currentStep === 2 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {t('deliverySignup.accountSecurity')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('deliverySignup.username')}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                        placeholder={t('deliverySignup.usernamePlaceholder')}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('deliverySignup.usernameHint')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('deliverySignup.password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder={t('deliverySignup.passwordPlaceholder')}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Age Verification */}
            {currentStep === 3 && (
              <div className="text-center">
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                  <h3 className="text-lg font-semibold">{t('deliverySignup.ageVerification')}</h3>
                  <p className="mt-1 text-sm">{t('deliverySignup.minimumAge')}</p>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="delivery-age">
                    {t('deliverySignup.howOld')}
                  </label>
                  <select
                    id="delivery-age"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                  >
                    {Array.from({ length: 82 }, (_, i) => i + 18).map(age => (
                      <option key={age} value={age}>{age} {t('deliverySignup.yearsOld')}</option>
                    ))}
                  </select>
                  <p className="text-sm font-medium text-gray-800">
                    {t('deliverySignup.currentAge').replace('{age}', String(formData.age))}
                  </p>
                  
                  {formData.age < 18 && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl">
                      <p className="text-sm">
                        {t('deliverySignup.ageRequired')}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={nextStep}
                    className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 text-base"
                  >
                    {t('deliverySignup.next')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Transportation */}
            {currentStep === 4 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {t('deliverySignup.howDeliver')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {transportationOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleTransportationChange(option.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.transportation.includes(option.id)
                          ? 'border-primary-brand bg-primary-50 text-primary-brand'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {option.icon}
                        <span className="text-sm font-medium">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Available Days */}
            {currentStep === 5 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {t('deliverySignup.whichDays')}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {dayOptions.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleDayChange(day.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        formData.availableDays.includes(day.id)
                          ? 'border-primary-brand bg-primary-50 text-primary-brand'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {day.label.charAt(0).toUpperCase() + day.label.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Time Slots */}
            {currentStep === 6 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {t('deliverySignup.whichTimeSlots')}
                </h3>
                <div className="space-y-3">
                  {timeSlotOptions.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleTimeSlotChange(slot.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        formData.availableTimeSlots.includes(slot.id)
                          ? 'border-primary-brand bg-primary-50 text-primary-brand'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">{slot.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Work Area */}
            {currentStep === 7 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {t('deliverySignup.workAreaTitle')}
                </h3>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-2">{t('deliverySignup.safetyTitle')}</h4>
                    <p className="text-sm text-blue-800">
                      {t('deliverySignup.safetyText')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('deliverySignup.deliveryMode')}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, deliveryMode: 'FIXED' }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.deliveryMode === 'FIXED'
                            ? 'border-primary-brand bg-primary-50 text-primary-brand'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          <span className="text-sm font-medium">{t('deliverySignup.fixedArea')}</span>
                          <span className="text-xs text-gray-600">{t('deliverySignup.aroundHouse')}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, deliveryMode: 'DYNAMIC' }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.deliveryMode === 'DYNAMIC'
                            ? 'border-primary-brand bg-primary-50 text-primary-brand'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-5 h-5" />
                          <span className="text-sm font-medium">{t('deliverySignup.flexible')}</span>
                          <span className="text-xs text-gray-600">{t('deliverySignup.multipleAreas')}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('deliverySignup.maxDistance')}
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      value={formData.preferredRadius}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredRadius: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>2 km</span>
                      <span className="font-medium text-primary-brand">{formData.preferredRadius} km</span>
                      <span>15 km</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t('deliverySignup.maxDistanceHint').replace('{distance}', formData.preferredRadius.toString())}
                    </p>
                  </div>

                  {/* Address Details (Private) */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {t('deliverySignup.addressDetails')}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      {t('deliverySignup.addressDetailsText')}
                    </p>
                    <p className="mb-3 text-sm text-gray-700">
                      {t('deliverySignup.manualAddressHint')}
                    </p>
                    
                    <DynamicAddressFields
                      value={formData.addressData}
                      showStructuredFields
                      fieldErrors={addressErrors}
                      onChange={(data) => {
                        setAddressErrors({});
                        setFormData(prev => ({
                          ...prev,
                          addressData: data,
                        }));
                      }}
                      onGeocode={(data) => {
                        setFormData(prev => ({
                          ...prev,
                          addressData: {
                            ...prev.addressData,
                            lat: data.lat,
                            lng: data.lng,
                          },
                        }));
                      }}
                      required={true}
                      showValidation={true}
                      geocodingEnabled={true}
                      showCountrySelector={true}
                    />
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-900 mb-2">{t('deliverySignup.safetyBenefits')}</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• {t('deliverySignup.safetyBenefit1')}</li>
                      <li>• {t('deliverySignup.safetyBenefit2')}</li>
                      <li>• {t('deliverySignup.safetyBenefit3')}</li>
                      <li>• {t('deliverySignup.safetyBenefit4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Bio */}
            {currentStep === 8 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {t('deliverySignup.tellAboutYourself')}
                </h3>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('deliverySignup.shortDescription')}
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder={t('deliverySignup.bioPlaceholder')}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                  />
                  
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-2">{t('deliverySignup.yourProfile')}:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• {formData.age} {t('deliverySignup.yearsOld')}</li>
                      <li>• {t('deliverySignup.transportation')}: {formData.transportation.map(transport => 
                        transportationOptions.find(opt => opt.id === transport)?.label
                      ).join(', ')}</li>
                      <li>• {t('deliverySignup.workArea')}: {formData.deliveryMode === 'FIXED' ? t('deliverySignup.fixedArea') : t('deliverySignup.flexible')} ({formData.preferredRadius}km)</li>
                      <li>• {t('deliverySignup.available')}: {formData.availableDays.map((id) => dayOptions.find((day) => day.id === id)?.label || id).join(', ')}</li>
                      <li>• {t('deliverySignup.timeSlots')}: {formData.availableTimeSlots.length} {t('deliverySignup.selected')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Legal Agreements */}
            {currentStep === 9 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {t('deliverySignup.legalAgreements')}
                </h3>
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-red-900 mb-2">{t('deliverySignup.importantInfo')}</h4>
                    <p className="text-sm text-red-800">
                      {t('deliverySignup.importantInfoText')}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Main Agreement */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="acceptDeliveryAgreement"
                        checked={formData.acceptDeliveryAgreement}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev, 
                            acceptDeliveryAgreement: e.target.checked
                          }));
                        }}
                        className="mt-1 w-5 h-5 text-primary-brand border-gray-300 rounded focus:ring-primary-brand"
                      />
                      <div className="flex-1">
                        <label htmlFor="acceptDeliveryAgreement" className="text-sm text-gray-700 cursor-pointer">
                          <span className="font-semibold">{t('deliverySignup.deliveryAgreement')}</span> {t('deliverySignup.deliveryAgreementText')}{' '}
                          <button 
                            type="button"
                            onClick={() => setShowLegalModal(true)}
                            className="text-primary-brand hover:underline ml-1 font-medium"
                          >
                            {t('deliverySignup.fullDeliveryAgreement')}
                          </button>
                          {' '}{t('deliverySignup.deliveryAgreementText2')}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Status info */}
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-900 mb-2">{t('deliverySignup.status')}</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>{t('deliverySignup.age')}</strong> {formData.age} {t('deliverySignup.yearsOld')}</p>
                      <p><strong>{t('deliverySignup.deliveryAgreementStatus')}</strong> {formData.acceptDeliveryAgreement ? t('deliverySignup.accepted') : t('deliverySignup.notAccepted')}</p>
                      <p><strong>{t('deliverySignup.stepValid')}</strong> {isStepValid() ? t('deliverySignup.yesContinue') : t('deliverySignup.noAccept')}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-yellow-900 mb-2">{t('deliverySignup.importantReminder')}</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• {t('deliverySignup.reminder1')}</li>
                      <li>• {t('deliverySignup.reminder2')}</li>
                      <li>• {t('deliverySignup.reminder3')}</li>
                      <li>• {t('deliverySignup.reminder4')}</li>
                      <li>• {t('deliverySignup.reminder5')}</li>
                      <li>• {t('deliverySignup.reminder6')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {passwordReentry && !isExistingUser && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">
                {t('deliverySignup.resumeDraft')}
              </div>
            )}

            {stepNotice && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
                {stepNotice}
              </div>
            )}

            {submitError && (
              <div
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                role="alert"
              >
                <p>{submitError}</p>
                {resumeLoginHint && (
                  <p className="mt-2">
                    <a
                      href={`/login?callbackUrl=${encodeURIComponent('/delivery/signup')}`}
                      className="font-semibold text-primary-brand underline"
                    >
                      {t('deliverySignup.loginToFinish')}
                    </a>
                  </p>
                )}
              </div>
            )}

            <div
              className="sticky z-[70] mt-4 flex justify-between gap-3 bg-white py-2"
              style={{
                bottom: 'calc(var(--hc-cookie-banner-offset, 0px) + 0.75rem)',
                scrollMarginBottom: 'calc(var(--hc-cookie-banner-offset, 0px) + 1rem)',
              }}
            >
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === firstStep}
              >
                {t('deliverySignup.previous')}
              </Button>
              
              {currentStep < 9 ? (
                <Button
                  onClick={nextStep}
                  className="flex min-h-12 items-center gap-2"
                >
                  {t('deliverySignup.next')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (!isStepValid()) {
                      setStepNotice(t('deliverySignup.acceptToContinue'));
                      trackDeliverySignupFunnel('delivery_signup_validation_failed', {
                        ...campaignMeta(),
                        step: 9,
                        reason: 'agreement',
                      });
                      return;
                    }
                    void handleSubmit();
                  }}
                  disabled={isLoading || submitLock}
                  className="flex min-h-12 items-center gap-2"
                >
                  {isLoading ? t('deliverySignup.loading') : 
                   !isStepValid() ? t('deliverySignup.acceptToContinue') : 
                   t('deliverySignup.signupAsAmbassador')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <DeliveryAgreementModal open={showLegalModal} onClose={() => setShowLegalModal(false)} />
    </div>
  );
}
