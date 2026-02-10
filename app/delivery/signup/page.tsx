'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Bike, MapPin, Clock, Users, CheckCircle, ArrowRight, User, Mail, Lock, Eye, EyeOff, FileText, X, Zap, Car } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import DynamicAddressFields, { AddressData } from '@/components/ui/DynamicAddressFields';

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
  parentalConsent: boolean;
}

interface ValidationState {
  isValid: boolean | null;
  message: string;
  isChecking: boolean;
}

export default function DeliverySignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
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
    age: 15,
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
    parentalConsent: false
  });

  const transportationOptions = [
    { id: 'BIKE', label: t('deliverySignup.transportation.bike'), icon: <Bike className="w-5 h-5" />, maxRange: 5 },
    { id: 'EBIKE', label: t('deliverySignup.transportation.ebike'), icon: <Zap className="w-5 h-5" />, maxRange: 10 },
    { id: 'SCOOTER', label: t('deliverySignup.transportation.scooter'), icon: <Bike className="w-5 h-5" />, maxRange: 15 },
    { id: 'CAR', label: t('deliverySignup.transportation.car'), icon: <Car className="w-5 h-5" />, maxRange: 25 }
  ];

  const dayOptions = [
    t('deliverySignup.days.monday'),
    t('deliverySignup.days.tuesday'),
    t('deliverySignup.days.wednesday'),
    t('deliverySignup.days.thursday'),
    t('deliverySignup.days.friday'),
    t('deliverySignup.days.saturday'),
    t('deliverySignup.days.sunday')
  ];

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
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      setEmailValidation({
        isValid: data.valid,
        message: data.valid ? data.message : data.error,
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


  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // For existing users, only create delivery profile (no account creation)
      const requestBody = isExistingUser ? {
        // Only send delivery profile data for existing users
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
        homeAddress: formData.addressData.address 
          ? (formData.addressData.country === 'NL' && formData.addressData.postalCode && formData.addressData.houseNumber
              ? `${formData.addressData.address || ''} ${formData.addressData.houseNumber}, ${formData.addressData.postalCode} ${formData.addressData.city || ''}`.trim()
              : [formData.addressData.address, formData.addressData.houseNumber, formData.addressData.postalCode, formData.addressData.city].filter(Boolean).join(', '))
          : null,
        acceptDeliveryAgreement: formData.acceptDeliveryAgreement,
        parentalConsent: formData.parentalConsent
      } : {
        // Full registration for new users
        name: formData.name,
        email: formData.email,
        password: formData.password,
        username: formData.username,
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
        homeAddress: formData.addressData.address 
          ? (formData.addressData.country === 'NL' && formData.addressData.postalCode && formData.addressData.houseNumber
              ? `${formData.addressData.address || ''} ${formData.addressData.houseNumber}, ${formData.addressData.postalCode} ${formData.addressData.city || ''}`.trim()
              : [formData.addressData.address, formData.addressData.houseNumber, formData.addressData.postalCode, formData.addressData.city].filter(Boolean).join(', '))
          : null,
        acceptDeliveryAgreement: formData.acceptDeliveryAgreement,
        parentalConsent: formData.parentalConsent
      };

      const response = await fetch('/api/delivery/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration API error:', errorData);
        throw new Error(errorData.error || t('deliverySignup.validation.accountCreationFailed'));
      }

      // For existing users, just redirect (already logged in)
      if (isExistingUser) {
        router.push('/delivery/dashboard?welcome=true&newSignup=true');
        return;
      }

      // Auto-login after successful registration for new users
      try {
        const loginResponse = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        });

        if (loginResponse?.ok) {
          // Successfully logged in, redirect to delivery dashboard
          router.push('/delivery/dashboard?welcome=true&newSignup=true');
        } else {
          // Login failed, but registration was successful
          router.push(`/login?message=${encodeURIComponent(t('deliverySignup.registrationSuccess'))}`);
        }
      } catch (loginError) {
        // Registration was successful, but login failed
        router.push('/login?message=Registratie succesvol! Log nu in met je nieuwe account.');
      }

    } catch (error: any) {
      console.error('Error:', error);
      alert(`Er is een fout opgetreden: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll naar boven bij stapwissel
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

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
            addressData: {
              address: user.address || prev.addressData.address,
              postalCode: user.postalCode || prev.addressData.postalCode,
              houseNumber: '',
              city: user.city || user.place || prev.addressData.city,
              country: user.country || prev.addressData.country || 'NL',
              lat: user.lat ?? prev.addressData.lat ?? null,
              lng: user.lng ?? prev.addressData.lng ?? null,
            },
            // Bio if available
            bio: user.bio || prev.bio,
            // Skip account creation step if already logged in
          }));
          
          // Skip to delivery profile step (step 2)
          if (currentStep === 1) {
            setCurrentStep(2);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (status === 'authenticated') {
      loadExistingUserData();
    }
  }, [session?.user?.email, status, currentStep]);

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

  const nextStep = () => {
    if (currentStep < 9) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() && formData.email.trim() && formData.email.includes('@') && emailValidation.isValid === true;
      case 2: return formData.password.length >= 6 && formData.username.trim().length >= 3;
      case 3: return formData.age >= 15 && formData.age <= 23;
      case 4: return formData.transportation.length > 0;
      case 5: return formData.availableDays.length > 0;
      case 6: return formData.availableTimeSlots.length > 0;
      case 7: return formData.maxDistance > 0 && formData.deliveryMode;
      case 8: return true; // Bio is optional
      case 9: {
        
        // If user is 18 or older, only delivery agreement is needed
        if (formData.age >= 18) {
          return formData.acceptDeliveryAgreement;
        }
        
        // If user is under 18, both delivery agreement and parental consent are required
        return formData.acceptDeliveryAgreement && formData.parentalConsent;
      }
      default: return false;
    }
  };

  // State for showing legal agreement modal
  const [showLegalModal, setShowLegalModal] = useState(false);

  // Debug function to show validation details
  const getValidationDetails = () => {
    if (currentStep !== 8) return '';
    
    const is18OrOlder = formData.age >= 18;
    const hasAgreement = formData.acceptDeliveryAgreement;
    const hasParentalConsent = formData.parentalConsent;
    
    if (is18OrOlder) {
      return hasAgreement ? '✅ Geldig (18+ met overeenkomst)' : '❌ Mis: Overeenkomst niet geaccepteerd';
    } else {
      if (hasAgreement && hasParentalConsent) {
        return '✅ Geldig (onder 18 met overeenkomst en toestemming)';
      } else if (!hasAgreement) {
        return '❌ Mis: Overeenkomst niet geaccepteerd';
      } else if (!hasParentalConsent) {
        return `❌ ${t('deliverySignup.importantInfo')}: ${t('deliverySignup.parentalConsentStatus')} ${t('deliverySignup.notGiven')}`;
      }
    }
    return '❌ Onbekende fout';
  };

  // Show loading while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Sessie wordt geladen...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-primary-brand text-white p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Users className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('deliverySignup.title')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('deliverySignup.subtitle')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary-brand text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 9 && (
                  <div className={`w-12 h-1 mx-1 ${
                    step < currentStep ? 'bg-primary-brand' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-500">
            {t('deliverySignup.step')} {currentStep} {t('deliverySignup.of')} 9
          </div>
        </div>

        {/* Form Steps */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
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
                <div className="bg-green-100 text-green-800 p-4 rounded-xl mb-6">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">{t('deliverySignup.ageVerification')}</h3>
                  <p className="text-sm">{t('deliverySignup.ageVerificationText')}</p>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('deliverySignup.howOld')}
                  </label>
                  <select
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                  >
                    {Array.from({ length: 9 }, (_, i) => i + 15).map(age => (
                      <option key={age} value={age}>{age} {t('deliverySignup.yearsOld')}</option>
                    ))}
                  </select>
                  
                  {formData.age < 15 && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl">
                      <p className="text-sm">
                        {t('deliverySignup.ageRequired')}
                      </p>
                    </div>
                  )}
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
                      key={day}
                      onClick={() => handleDayChange(day)}
                      className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        formData.availableDays.includes(day)
                          ? 'border-primary-brand bg-primary-50 text-primary-brand'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
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
                    
                    <DynamicAddressFields
                      value={formData.addressData}
                      onChange={(data) => {
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
                      <li>• {t('deliverySignup.available')}: {formData.availableDays.join(', ')}</li>
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

                    {/* Parental Consent (only for under 18) */}
                    {formData.age < 18 && (
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="parentalConsent"
                          checked={formData.parentalConsent}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev, 
                            parentalConsent: e.target.checked
                          }));
                        }}
                          className="mt-1 w-5 h-5 text-primary-brand border-gray-300 rounded focus:ring-primary-brand"
                        />
                        <label htmlFor="parentalConsent" className="text-sm text-gray-700 cursor-pointer">
                          <span className="font-semibold">{t('deliverySignup.parentalConsent')}</span> {t('deliverySignup.parentalConsentText')}
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Status info */}
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-900 mb-2">{t('deliverySignup.status')}</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>{t('deliverySignup.age')}</strong> {formData.age} {t('deliverySignup.yearsOld')}</p>
                      <p><strong>{t('deliverySignup.deliveryAgreementStatus')}</strong> {formData.acceptDeliveryAgreement ? t('deliverySignup.accepted') : t('deliverySignup.notAccepted')}</p>
                      {formData.age < 18 && <p><strong>{t('deliverySignup.parentalConsentStatus')}</strong> {formData.parentalConsent ? t('deliverySignup.given') : t('deliverySignup.notGiven')}</p>}
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
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                {t('deliverySignup.previous')}
              </Button>
              
              {currentStep < 9 ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="flex items-center gap-2"
                >
                  {t('deliverySignup.next')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !isStepValid()}
                  className="flex items-center gap-2"
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

      {/* Legal Agreement Modal */}
      {showLegalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{t('deliverySignup.legalModalTitle')}</h2>
              <button
                onClick={() => setShowLegalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6 text-sm text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.generalTerms')}</h3>
                  <p className="mb-3">
                    {t('deliverySignup.generalTermsText')} <a href="/terms" target="_blank" className="text-primary-brand hover:underline">/terms</a>.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.privacyPolicy')}</h3>
                  <p className="mb-3">
                    {t('deliverySignup.privacyPolicyText')} <a href="/privacy" target="_blank" className="text-primary-brand hover:underline">/privacy</a>.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.liability')}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>{t('deliverySignup.liability1')}</li>
                    <li>{t('deliverySignup.liability2')}</li>
                    <li>{t('deliverySignup.liability3')}</li>
                    <li>{t('deliverySignup.liability4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.insurance')}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>{t('deliverySignup.insurance1')}</li>
                    <li>{t('deliverySignup.insurance2')}</li>
                    <li>{t('deliverySignup.insurance3')}</li>
                    <li>{t('deliverySignup.insurance4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.taxes')}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>{t('deliverySignup.taxes1')}</li>
                    <li>{t('deliverySignup.taxes2')}</li>
                    <li>{t('deliverySignup.taxes3')}</li>
                    <li>{t('deliverySignup.taxes4')}</li>
                    <li>{t('deliverySignup.taxes5')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{t('deliverySignup.platformRules')}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>{t('deliverySignup.platformRules1')}</li>
                    <li>{t('deliverySignup.platformRules2')}</li>
                    <li>{t('deliverySignup.platformRules3')}</li>
                    <li>{t('deliverySignup.platformRules4')}</li>
                    <li>{t('deliverySignup.platformRules5')}</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">{t('deliverySignup.importantNote')}</h4>
                  <p className="text-yellow-800">
                    {t('deliverySignup.importantNoteText')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t">
              <Button onClick={() => setShowLegalModal(false)}>
                {t('deliverySignup.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
