'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Bike, MapPin, Clock, Users, CheckCircle, ArrowRight, User, Mail, Lock, Eye, EyeOff, FileText, X, Zap, Car } from 'lucide-react';

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
  
  // Address details
  postalCode: string;
  address: string;
  city: string;
  country: string;
  
  // Address lookup
  addressLookup: {
    isLookingUp: boolean;
    error: string | null;
    success: boolean;
    foundAddress: any | null;
  };
  
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
    
    // Address details
    postalCode: '',
    address: '',
    city: '',
    country: 'NL',
    
    // Address lookup
    addressLookup: {
      isLookingUp: false,
      error: null,
      success: false,
      foundAddress: null,
    },
    
    // Legal agreements
    acceptDeliveryAgreement: false,
    parentalConsent: false
  });

  const transportationOptions = [
    { id: 'BIKE', label: 'Fiets', icon: <Bike className="w-5 h-5" />, maxRange: 5 },
    { id: 'EBIKE', label: 'Elektrische Fiets', icon: <Zap className="w-5 h-5" />, maxRange: 10 },
    { id: 'SCOOTER', label: 'Scooter', icon: <Bike className="w-5 h-5" />, maxRange: 15 },
    { id: 'CAR', label: 'Auto', icon: <Car className="w-5 h-5" />, maxRange: 25 }
  ];

  const dayOptions = [
    'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'
  ];

  const timeSlotOptions = [
    { id: 'morning', label: 'Ochtend (8:00-12:00)' },
    { id: 'afternoon', label: 'Middag (12:00-17:00)' },
    { id: 'evening', label: 'Avond (17:00-21:00)' }
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
        message: "Voer een geldig e-mailadres in",
        isChecking: false,
      });
      return;
    }

    setEmailValidation({
      isValid: null,
      message: "Controleren...",
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
        message: "Er is een fout opgetreden bij het controleren van het e-mailadres",
        isChecking: false,
      });
    }
  };

  // Nederlandse postcode lookup functie
  const lookupDutchAddress = async () => {
    if (!formData.postalCode || !formData.address) {
      setFormData(prev => ({
        ...prev,
        addressLookup: {
          isLookingUp: false,
          error: 'Voer postcode en huisnummer in',
          success: false,
          foundAddress: null
        }
      }));
      return;
    }

    // Extract huisnummer from address (nu alleen het nummer, geen straatnaam)
    const huisnummerMatch = formData.address.match(/(\d+)/);
    if (!huisnummerMatch) {
      setFormData(prev => ({
        ...prev,
        addressLookup: {
          isLookingUp: false,
          error: 'Voer een geldig huisnummer in (bijv. 123)',
          success: false,
          foundAddress: null
        }
      }));
      return;
    }

    const huisnummer = huisnummerMatch[1];
    const postcode = formData.postalCode.replace(/\s/g, '').toUpperCase();

    setFormData(prev => ({
      ...prev,
      addressLookup: {
        isLookingUp: true,
        error: null,
        success: false,
        foundAddress: null
      }
    }));

    try {
      const response = await fetch(
        `/api/geocoding/dutch?postcode=${encodeURIComponent(postcode)}&huisnummer=${encodeURIComponent(huisnummer)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Adres lookup mislukt');
      }

      const addressData = await response.json();

      // Store the found address for display
      setFormData(prev => ({
        ...prev,
        addressLookup: {
          isLookingUp: false,
          error: null,
          success: true,
          foundAddress: addressData
        }
      }));

    } catch (error) {
      console.error('Address lookup error:', error);
      setFormData(prev => ({
        ...prev,
        addressLookup: {
          isLookingUp: false,
          error: error instanceof Error ? error.message : 'Adres lookup mislukt',
          success: false,
          foundAddress: null
        }
      }));
    }
  };

  // Automatische adres lookup wanneer postcode en huisnummer zijn ingevoerd
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.postalCode && formData.address && !formData.addressLookup.isLookingUp && !formData.addressLookup.success) {
        // Check if postcode format is valid (1234AB)
        const cleanPostcode = formData.postalCode.replace(/\s/g, '').toUpperCase();
        if (/^\d{4}[A-Z]{2}$/.test(cleanPostcode)) {
          // Check if address contains only a number (huisnummer)
          const huisnummerMatch = formData.address.match(/^(\d+)$/);
          if (huisnummerMatch) {

            lookupDutchAddress();
          }
        }
      }
    }, 1000); // 1 second delay after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.postalCode, formData.address]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Create account and delivery profile in one request
      const response = await fetch('/api/delivery/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          acceptDeliveryAgreement: formData.acceptDeliveryAgreement,
          parentalConsent: formData.parentalConsent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration API error:', errorData);
        throw new Error(errorData.error || 'Account aanmaken mislukt');
      }

      // Auto-login after successful registration
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

          router.push('/login?message=Registratie succesvol! Log nu in met je nieuwe account.');
        }
      } catch (loginError) {

        // Registration was successful, but login failed
        router.push('/login?message=Registratie succesvol! Log nu in met je nieuwe account.');
      }

    } catch (error) {
      console.error('Error:', error);
      alert(`Er is een fout opgetreden: ${error.message}`);
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
          setIsExistingUser(true);
          setFormData(prev => ({
            ...prev,
            name: userData.name || prev.name,
            email: userData.email || prev.email,
            username: userData.username || prev.username,
            postalCode: userData.postalCode || prev.postalCode,
            address: userData.address || prev.address,
            city: userData.city || prev.city,
            country: userData.country || prev.country,
            // Skip account creation step if already logged in
          }));
          
          // Skip to delivery profile step
          if (currentStep === 1) {
            setCurrentStep(2);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadExistingUserData();
  }, [session?.user?.email]);

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
        return '❌ Mis: Ouderlijke toestemming niet gegeven';
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
            Word Ambassadeur van HomeCheff!
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Vertegenwoordig ons merk als zelfstandig ondernemer en bezorg bestellingen in je buurt. 
            Een unieke kans voor jongeren van 15 tot 23 jaar.
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
            Stap {currentStep} van 9
          </div>
        </div>

        {/* Form Steps */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Persoonlijke Informatie
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volledige naam
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Je volledige naam"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mailadres
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="je@email.nl"
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
                    
                    {/* Validatie feedback */}
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
                  Account Beveiliging
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gebruikersnaam (uniek en niet wijzigbaar)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                        placeholder="jouw_gebruikersnaam"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimaal 3 karakters, alleen letters, cijfers en underscores
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wachtwoord
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Minimaal 6 karakters"
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
                  <h3 className="text-lg font-semibold">Leeftijdsverificatie</h3>
                  <p className="text-sm">Volgens Nederlandse wetgeving mogen jongeren vanaf 15 jaar bezorgen</p>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Hoe oud ben je?
                  </label>
                  <select
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                  >
                    {Array.from({ length: 9 }, (_, i) => i + 15).map(age => (
                      <option key={age} value={age}>{age} jaar</option>
                    ))}
                  </select>
                  
                  {formData.age < 15 && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl">
                      <p className="text-sm">
                        Je moet minimaal 15 jaar oud zijn om bezorgambassadeur te worden volgens Nederlandse wetgeving.
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
                  Hoe ga je bezorgen?
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
                  Op welke dagen wil je bezorgingen aannemen?
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
                  Welke tijdsloten werk je?
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
                  Jouw Bezorggebied
                </h3>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-2">🏠 Veiligheid & Nabijheid</h4>
                    <p className="text-sm text-blue-800">
                      Door je werkgebied in te stellen waarborgen we je veiligheid. Je krijgt alleen bestellingen 
                      uit jouw buurt, zodat je altijd dicht bij huis blijft en je ouders kunnen meevolgen waar je bent.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Bezorgmodus
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
                          <span className="text-sm font-medium">Vast Gebied</span>
                          <span className="text-xs text-gray-600">Rondom je huis</span>
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
                          <span className="text-sm font-medium">Flexibel</span>
                          <span className="text-xs text-gray-600">Meerdere gebieden</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Maximale afstand van je huis (km)
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
                      Je krijgt alleen bestellingen binnen {formData.preferredRadius} km van je huis
                    </p>
                  </div>

                  {/* Address Details (Private) */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Adresgegevens (privé - voor afstand berekening)
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      🔒 Deze gegevens zijn privé en worden alleen gebruikt voor het berekenen van afstanden tot bestellingen
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postcode
                        </label>
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="Bijv. 1012AB"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Huisnummer
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Bijv. 123"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={lookupDutchAddress}
                        disabled={formData.addressLookup.isLookingUp || !formData.postalCode || !formData.address}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {formData.addressLookup.isLookingUp ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Zoeken...
                          </div>
                        ) : (
                          'Adres opzoeken'
                        )}
                      </button>
                    </div>

                    {/* Address Lookup Status */}
                    {formData.addressLookup.error && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-red-700">{formData.addressLookup.error}</span>
                        </div>
                      </div>
                    )}

                    {formData.addressLookup.success && formData.addressLookup.foundAddress && (
                      <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-green-800 mb-2">Adres gevonden!</h4>
                            <div className="text-sm text-green-700 space-y-1">
                              <div className="font-medium">{formData.addressLookup.foundAddress.straatnaam} {formData.addressLookup.foundAddress.huisnummer}</div>
                              <div>{formData.addressLookup.foundAddress.postcode} {formData.addressLookup.foundAddress.plaats}</div>
                              <div className="text-xs text-green-600 mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      address: formData.addressLookup.foundAddress.straatnaam + ' ' + formData.addressLookup.foundAddress.huisnummer,
                                      city: formData.addressLookup.foundAddress.plaats,
                                      homeAddress: formData.addressLookup.foundAddress.straatnaam + ' ' + formData.addressLookup.foundAddress.huisnummer + ', ' + formData.addressLookup.foundAddress.postcode + ' ' + formData.addressLookup.foundAddress.plaats,
                                      homeLat: formData.addressLookup.foundAddress.lat,
                                      homeLng: formData.addressLookup.foundAddress.lng,
                                      addressLookup: {
                                        ...prev.addressLookup,
                                        success: false,
                                        foundAddress: null
                                      }
                                    }));
                                  }}
                                  className="text-green-600 hover:text-green-800 underline"
                                >
                                  Dit adres gebruiken
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Veiligheidsvoordelen</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Altijd dicht bij huis en bekende omgeving</li>
                      <li>• Ouders kunnen je route volgen via de app</li>
                      <li>• Snelle hulp mogelijk bij problemen</li>
                      <li>• Korte reistijden = minder risico</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Bio */}
            {currentStep === 8 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Vertel iets over jezelf
                </h3>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Korte beschrijving (optioneel)
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Bijv: 'Ik ben een betrouwbare 16-jarige die graag helpt in de buurt...'"
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                  />
                  
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-900 mb-2">Je profiel:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• {formData.age} jaar oud</li>
                      <li>• Vervoer: {formData.transportation.map(t => 
                        transportationOptions.find(opt => opt.id === t)?.label
                      ).join(', ')}</li>
                      <li>• Werkgebied: {formData.deliveryMode === 'FIXED' ? 'Vast gebied' : 'Flexibel'} ({formData.preferredRadius}km)</li>
                      <li>• Beschikbaar: {formData.availableDays.join(', ')}</li>
                      <li>• Tijdsloten: {formData.availableTimeSlots.length} geselecteerd</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Legal Agreements */}
            {currentStep === 9 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Juridische Overeenkomsten
                </h3>
                <div className="space-y-6">
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-red-900 mb-2">⚠️ Belangrijke Informatie</h4>
                    <p className="text-sm text-red-800">
                      Als bezorgpartner ben je een volledig zelfstandig ondernemer. Je bent zelf verantwoordelijk voor 
                      belastingen, verzekeringen, en alle aspecten van je onderneming. HomeCheff is uitsluitend een platform 
                      dat vraag en aanbod samenbrengt en is op geen enkele wijze een werkgever.
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
                          <span className="font-semibold">Bezorger Overeenkomst:</span> Ik accepteer de 
                          <button 
                            type="button"
                            onClick={() => setShowLegalModal(true)}
                            className="text-primary-brand hover:underline ml-1 font-medium"
                          >
                            volledige Bezorger Overeenkomst
                          </button>
                          {' '}inclusief alle voorwaarden, aansprakelijkheden, verzekeringen en belastingverplichtingen.
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
                          <span className="font-semibold">Ouderlijke Toestemming:</span> Ik bevestig dat mijn ouders/voogd 
                          toestemming hebben gegeven voor mijn deelname als bezorger.
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Status info */}
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Status</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>Leeftijd:</strong> {formData.age} jaar</p>
                      <p><strong>Bezorger Overeenkomst:</strong> {formData.acceptDeliveryAgreement ? '✅ Geaccepteerd' : '❌ Nog niet geaccepteerd'}</p>
                      {formData.age < 18 && <p><strong>Ouderlijke Toestemming:</strong> {formData.parentalConsent ? '✅ Gegeven' : '❌ Nog niet gegeven'}</p>}
                      <p><strong>Stap geldig:</strong> {isStepValid() ? '✅ Ja, je kunt doorgaan' : '❌ Nee, accepteer alle voorwaarden'}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-yellow-900 mb-2">📋 Belangrijke Herinnering</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Je opereert als volledig zelfstandig ondernemer</li>
                      <li>• Je bent zelf verantwoordelijk voor je verzekeringen</li>
                      <li>• Je voert een eigen administratie en belastingaangifte</li>
                      <li>• Je zorgt voor naleving van alle regelgeving</li>
                      <li>• Je kunt een adviseur raadplegen voor juridisch/fiscaal advies</li>
                      <li>• HomeCheff is alleen een matchingplatform, geen werkgever</li>
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
                Vorige
              </Button>
              
              {currentStep < 9 ? (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="flex items-center gap-2"
                >
                  Volgende
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !isStepValid()}
                  className="flex items-center gap-2"
                >
                  {isLoading ? 'Bezig...' : 
                   !isStepValid() ? 'Accepteer de Bezorger Overeenkomst om door te gaan' : 
                   'Aanmelden als Bezorgambassadeur'}
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
              <h2 className="text-xl font-bold text-gray-900">Bezorgambassadeur Overeenkomst</h2>
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
                  <h3 className="font-semibold text-gray-900 mb-3">1. Algemene Voorwaarden</h3>
                  <p className="mb-3">
                    Door je aan te melden als bezorgambassadeur bij HomeCheff, accepteer je de Algemene Voorwaarden. 
                    Deze zijn beschikbaar op <a href="/terms" target="_blank" className="text-primary-brand hover:underline">/terms</a>.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">2. Privacy Policy</h3>
                  <p className="mb-3">
                    Je gegevens worden verwerkt volgens onze Privacy Policy. 
                    Deze is beschikbaar op <a href="/privacy" target="_blank" className="text-primary-brand hover:underline">/privacy</a>.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">3. Aansprakelijkheid</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Je bent zelf verantwoordelijk voor alle schade tijdens bezorging</li>
                    <li>HomeCheff is niet aansprakelijk voor schade aan jouw eigendommen of personen</li>
                    <li>Je bent verantwoordelijk voor het volgen van alle verkeersregels</li>
                    <li>Je bent verantwoordelijk voor de veiligheid van de bestellingen</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">4. Verzekeringen</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Je moet een aansprakelijkheidsverzekering hebben (minimaal €1.000.000 dekking)</li>
                    <li>Je moet een ongevallenverzekering hebben</li>
                    <li>Je moet je vervoermiddel verzekerd hebben</li>
                    <li>Je bent zelf verantwoordelijk voor het controleren van je verzekeringsdekking</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">5. Belastingen</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Je bent zelfstandige ondernemer, geen werknemer van HomeCheff</li>
                    <li>Je bent zelf verantwoordelijk voor het opgeven van je inkomsten bij de Belastingdienst</li>
                    <li>Je moet je eigen administratie bijhouden</li>
                    <li>Je bent zelf verantwoordelijk voor het betalen van belastingen</li>
                    <li>Raadpleeg een belastingadviseur voor specifieke vragen</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">6. Platform Regels</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Je moet je houden aan alle platform regels en richtlijnen</li>
                    <li>Je moet professioneel gedrag vertonen naar klanten</li>
                    <li>Je moet bestellingen op tijd en veilig bezorgen</li>
                    <li>Je mag geen misbruik maken van het platform</li>
                    <li>HomeCheff behoudt zich het recht voor om je account te deactiveren bij overtredingen</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Belangrijke Opmerking</h4>
                  <p className="text-yellow-800">
                    Als bezorger ben je een zelfstandige ondernemer. HomeCheff is geen werkgever en 
                    biedt geen werknemersbescherming. Zorg ervoor dat je alle juridische en praktische 
                    aspecten van zelfstandig ondernemerschap begrijpt voordat je begint.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t">
              <Button onClick={() => setShowLegalModal(false)}>
                Sluiten
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
