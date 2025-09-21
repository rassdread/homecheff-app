'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Bike, MapPin, Clock, Users, CheckCircle, ArrowRight, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

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
    bio: ''
  });

  const transportationOptions = [
    { id: 'BIKE', label: 'Fiets', icon: <Bike className="w-5 h-5" /> },
    { id: 'SCOOTER', label: 'Scooter', icon: <Bike className="w-5 h-5" /> },
    { id: 'WALKING', label: 'Lopen', icon: <Bike className="w-5 h-5" /> },
    { id: 'PUBLIC_TRANSPORT', label: 'Openbaar Vervoer', icon: <Bike className="w-5 h-5" /> }
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
          bio: formData.bio
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Account aanmaken mislukt');
      }

      // Auto-login after successful registration
      const loginResponse = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (!loginResponse?.ok) {
        throw new Error('Automatisch inloggen mislukt. Je kunt nu handmatig inloggen.');
      }

      // Redirect to dashboard with welcome message
      router.push('/delivery/dashboard?welcome=true');

    } catch (error) {
      console.error('Error:', error);
      alert(`Er is een fout opgetreden: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 7) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() && formData.email.trim() && formData.email.includes('@');
      case 2: return formData.password.length >= 6 && formData.username.trim().length >= 3;
      case 3: return formData.age >= 15 && formData.age <= 25;
      case 4: return formData.transportation.length > 0;
      case 5: return formData.availableDays.length > 0;
      case 6: return formData.availableTimeSlots.length > 0;
      case 7: return true;
      default: return false;
    }
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
            Wettelijk toegestaan vanaf 15 jaar en perfect voor jongerenwerk.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary-brand text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 7 && (
                  <div className={`w-12 h-1 mx-1 ${
                    step < currentStep ? 'bg-primary-brand' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-500">
            Stap {currentStep} van 7
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
                    {Array.from({ length: 11 }, (_, i) => i + 15).map(age => (
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

            {/* Step 7: Bio */}
            {currentStep === 7 && (
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
                      <li>• Maximaal {formData.maxDistance}km afstand</li>
                      <li>• Beschikbaar: {formData.availableDays.join(', ')}</li>
                      <li>• Tijdsloten: {formData.availableTimeSlots.length} geselecteerd</li>
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
              
              {currentStep < 7 ? (
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
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? 'Bezig...' : 'Aanmelden als Bezorger'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
