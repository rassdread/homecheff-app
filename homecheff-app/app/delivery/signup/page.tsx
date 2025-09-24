'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Bike, MapPin, Clock, Users, CheckCircle, ArrowRight, User, Mail, Lock, Eye, EyeOff, FileText, X } from 'lucide-react';

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
  
  // Legal agreements
  acceptDeliveryAgreement: boolean;
  parentalConsent: boolean;
}

export default function DeliverySignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    
    // Legal agreements
    acceptDeliveryAgreement: false,
    parentalConsent: false
  });

  const transportationOptions = [
    { id: 'BIKE', label: 'Fiets', icon: <Bike className="w-5 h-5" />, maxRange: 5 },
    { id: 'EBIKE', label: 'Elektrische Fiets', icon: <Bike className="w-5 h-5" />, maxRange: 10 },
    { id: 'SCOOTER', label: 'Scooter', icon: <Bike className="w-5 h-5" />, maxRange: 15 },
    { id: 'CAR', label: 'Auto', icon: <Bike className="w-5 h-5" />, maxRange: 25 }
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

      console.log('Registration successful, attempting auto-login...');

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
          console.log('Auto-login failed, but registration successful. Redirecting to login page.');
          router.push('/login?message=Registratie succesvol! Log nu in met je nieuwe account.');
        }
      } catch (loginError) {
        console.log('Auto-login error:', loginError);
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

  const nextStep = () => {
    if (currentStep < 8) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() && formData.email.trim() && formData.email.includes('@');
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
            Word Jongeren Bezorger!
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Verdien geld door bestellingen te bezorgen in je buurt. 
            Wettelijk toegestaan vanaf 15 jaar tot 23 jaar en perfect voor jongerenwerk.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary-brand text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 8 && (
                  <div className={`w-12 h-1 mx-1 ${
                    step < currentStep ? 'bg-primary-brand' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-500">
            Stap {currentStep} van 8
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                      />
                    </div>
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
                        Je moet minimaal 15 jaar oud zijn om bezorger te worden volgens Nederlandse wetgeving.
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
                  Wanneer ben je beschikbaar?
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
                  Jouw Werkgebied
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
                      Als bezorger ben je een zelfstandige ondernemer. Je bent zelf verantwoordelijk voor 
                      belastingen, verzekeringen en alle risico's tijdens bezorging. HomeCheff is geen werkgever.
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
                      <li>• Je bent zelfstandige ondernemer, geen werknemer</li>
                      <li>• Zorg voor adequate verzekeringen</li>
                      <li>• Houd je administratie bij voor belastingen</li>
                      <li>• Volg alle verkeersregels en veiligheidsvoorschriften</li>
                      <li>• Neem contact op met een belastingadviseur voor specifieke vragen</li>
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
                   'Aanmelden als Bezorger'}
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
              <h2 className="text-xl font-bold text-gray-900">Bezorger Overeenkomst</h2>
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
                    Door je aan te melden als bezorger bij HomeCheff, accepteer je de Algemene Voorwaarden. 
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
