'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { CheckCircle, User, Mail, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

// User types (verkoper rollen) - consistent met register form
const userTypes = [
  {
    id: "chef",
    title: "Chef",
    description: "Verkoop je culinaire creaties",
    icon: "👨‍🍳",
    features: ["Gerechten verkopen", "Bezorging & ophalen", "Reviews ontvangen", "Fans verzamelen"]
  },
  {
    id: "garden",
    title: "Garden",
    description: "Deel je groenten en kruiden",
    icon: "🌱",
    features: ["Groenten verkopen", "Seizoensproducten", "Lokale community", "Duurzaamheid"]
  },
  {
    id: "designer",
    title: "Designer",
    description: "Verkoop je handgemaakte items",
    icon: "🎨",
    features: ["Handwerk verkopen", "Custom orders", "Portfolio opbouwen", "Kunstenaarsnetwerk"]
  },
];

// Buyer types - consistent met register form
const buyerTypes = [
  {
    id: "ontdekker",
    title: "Ontdekker",
    description: "Ik ontdek graag lokale parels en verborgen talenten",
    icon: "🔍"
  },
  {
    id: "verzamelaar",
    title: "Verzamelaar",
    description: "Ik verzamel unieke en bijzondere items",
    icon: "📦"
  },
  {
    id: "liefhebber",
    title: "Liefhebber",
    description: "Ik waardeer kwaliteit en vakmanschap",
    icon: "❤️"
  },
  {
    id: "avonturier",
    title: "Avonturier",
    description: "Ik zoek nieuwe ervaringen en uitdagingen",
    icon: "🗺️"
  },
  {
    id: "fijnproever",
    title: "Fijnproever",
    description: "Ik geniet van subtiele smaken en details",
    icon: "👅"
  },
  {
    id: "connaisseur",
    title: "Connaisseur",
    description: "Ik heb kennis van kwaliteit en authenticiteit",
    icon: "🎭"
  },
  {
    id: "genieter",
    title: "Genieter",
    description: "Ik waardeer het goede leven en mooie dingen",
    icon: "✨"
  }
];

export default function SocialLoginOnboarding() {
  const router = useRouter();
  const [socialData, setSocialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<'username' | 'role' | 'terms'>('username');
  
  // Step 1: Username
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  // Step 2: Role
  const [isBuyer, setIsBuyer] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]); // Voor verkoper (meerdere)
  const [selectedBuyerType, setSelectedBuyerType] = useState<string>(''); // Voor koper (één)
  const [roleError, setRoleError] = useState('');
  
  // Step 3: Terms
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [termsError, setTermsError] = useState('');

  useEffect(() => {
    const fetchSocialData = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          console.log('📋 Onboarding session data:', session);
          
          // Check if user needs onboarding
          const needsOnboarding = session.user?.needsOnboarding;
          const hasTempUsername = session.user?.username?.startsWith('temp_');
          
          console.log('🔍 Onboarding check:', { 
            needsOnboarding, 
            hasTempUsername,
            username: session.user?.username,
            fullUser: session.user
          });
          
          // If onboarding is already completed, redirect to home immediately
          if (!needsOnboarding && !hasTempUsername && session.user?.username && !session.user.username.startsWith('temp_')) {
            console.log('✅ Onboarding already completed, redirecting to home');
            // Use window.location for hard redirect to ensure session refresh
            window.location.href = '/';
            return;
          }
          
          setSocialData({
            email: session.user.email,
            name: session.user.socialName || session.user.name,
            image: session.user.socialImage || session.user.image,
            provider: session.user.socialProvider
          });
        } else {
          console.error('Failed to fetch session');
          // No session, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSocialData();
  }, [router]);

  const handleUsernameSubmit = async () => {
    if (!username.trim()) {
      setUsernameError('Gebruikersnaam is verplicht');
      return;
    }

    if (username.length < 3) {
      setUsernameError('Gebruikersnaam moet minimaal 3 karakters zijn');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setUsernameError('Alleen letters, cijfers, - . en _ zijn toegestaan');
      return;
    }

    setIsSaving(true);
    setUsernameError('');

    try {
      // Check if username is available
      const checkResponse = await fetch(`/api/auth/validate-username?username=${encodeURIComponent(username)}`);
      
      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        setUsernameError(errorData.message || 'Er ging iets mis bij het controleren van de gebruikersnaam');
        return;
      }
      
      const checkData = await checkResponse.json();
      console.log('✅ Username validation response:', checkData);

      // Check both 'available' and 'valid' for compatibility
      const isAvailable = checkData.available || checkData.valid;
      
      if (!isAvailable) {
        setUsernameError(checkData.message || checkData.error || 'Deze gebruikersnaam is niet beschikbaar');
        return;
      }

      // Username is valid, go to next step
      console.log('✅ Username is valid, moving to role selection');
      setStep('role');
    } catch (error) {
      console.error('❌ Username validation error:', error);
      setUsernameError('Er ging iets mis bij het controleren');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleSubmit = () => {
    // Validate: minimaal 1 rol gekozen
    if (!isBuyer && !isSeller) {
      setRoleError('Selecteer minimaal één rol (Koper en/of Verkoper)');
      return;
    }

    // Als verkoper: minimaal 1 verkoper type
    if (isSeller && selectedUserTypes.length === 0) {
      setRoleError('Selecteer wat je wilt verkopen (Chef, Garden, Designer)');
      return;
    }

    // Als koper: buyer type kiezen
    if (isBuyer && !selectedBuyerType) {
      setRoleError('Selecteer welk type koper je bent');
      return;
    }

    // Alles goed, ga naar volgende stap
    setRoleError('');
    setStep('terms');
  };

  const handleTermsSubmit = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      setTermsError('Je moet akkoord gaan met de voorwaarden en het privacybeleid');
      return;
    }

    setIsSaving(true);
    setTermsError('');

    try {
      // Determine main role (SELLER if they sell, otherwise BUYER)
      const mainRole = isSeller ? 'SELLER' : 'BUYER';
      
      // Create the complete user account in database
      const response = await fetch('/api/auth/complete-social-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          role: mainRole,
          isBuyer,
          isSeller,
          userTypes: selectedUserTypes,
          selectedBuyerType,
          acceptedTerms,
          acceptedPrivacy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setTermsError(errorData.message || 'Er ging iets mis bij het aanmaken van je account');
        return;
      }

      const result = await response.json();
      console.log('✅ Social onboarding completed:', result);

      // Redirect to homepage with full page reload to refresh session
      window.location.href = '/?welcome=true&onboarding=completed';
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      setTermsError('Er ging iets mis bij het aanmaken van je account');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserType = (typeId: string) => {
    setSelectedUserTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
    setRoleError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Je profiel wordt geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100 p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 space-x-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step === 'username' ? 'bg-emerald-600 text-white scale-110' : 'bg-emerald-100 text-emerald-600'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 transition-all ${step !== 'username' ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step === 'role' ? 'bg-emerald-600 text-white scale-110' : step === 'terms' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
          <div className={`w-16 h-1 transition-all ${step === 'terms' ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step === 'terms' ? 'bg-emerald-600 text-white scale-110' : 'bg-gray-200 text-gray-500'
          }`}>
            3
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 'username' && 'Welkom bij HomeCheff! 🎉'}
            {step === 'role' && 'Kies je rol 👤'}
            {step === 'terms' && 'Laatste stap! 📋'}
          </h1>
          <p className="text-gray-600">
            {step === 'username' && 'Kies een unieke gebruikersnaam'}
            {step === 'role' && 'Ben je koper of verkoper?'}
            {step === 'terms' && 'Accepteer de voorwaarden'}
          </p>
        </div>

        {/* Profile Preview */}
        {socialData && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-4">
              {socialData.image && (
                <img 
                  src={socialData.image} 
                  alt="Profielfoto" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-gray-700 font-medium">
                  <User className="w-5 h-5 text-emerald-600" />
                  <span>{socialData.name}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 text-sm mt-1">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>{socialData.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Username */}
        {step === 'username' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gebruikersnaam *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="bijv. john_doe"
                autoFocus
              />
              {usernameError && (
                <p className="text-sm text-red-600 mt-2">{usernameError}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Alleen letters, cijfers, - . en _ (minimaal 3 karakters)
              </p>
            </div>

            <button
              onClick={handleUsernameSubmit}
              disabled={isSaving || !username.trim()}
              className="w-full px-6 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Bezig met opslaan...</span>
                </>
              ) : (
                <>
                  <span>Volgende stap</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Role Selection */}
        {step === 'role' && (
          <div className="space-y-6">
            {/* Hoofdkeuze: Koper en/of Verkoper (meerdere mogelijk) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Wat ga je doen op HomeCheff? (meerdere mogelijk) *
              </label>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => {
                    setIsBuyer(!isBuyer);
                    if (isBuyer) {
                      setSelectedBuyerType(''); // Reset buyer type if unchecking
                    }
                    setRoleError('');
                  }}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    isBuyer
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="text-4xl mb-2">🛒</div>
                  <div className="font-semibold text-gray-900">Koper</div>
                  <div className="text-sm text-gray-600 mt-1">Ontdek en koop producten</div>
                  {isBuyer && <div className="text-emerald-600 text-sm font-medium mt-2">✓ Geselecteerd</div>}
                </button>
                
                <button
                  onClick={() => {
                    setIsSeller(!isSeller);
                    if (isSeller) {
                      setSelectedUserTypes([]); // Reset seller types if unchecking
                    }
                    setRoleError('');
                  }}
                  className={`p-6 border-2 rounded-xl transition-all ${
                    isSeller
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="text-4xl mb-2">🏪</div>
                  <div className="font-semibold text-gray-900">Verkoper</div>
                  <div className="text-sm text-gray-600 mt-1">Verkoop je producten</div>
                  {isSeller && <div className="text-emerald-600 text-sm font-medium mt-2">✓ Geselecteerd</div>}
                </button>
              </div>
            </div>

            {/* Als VERKOPER: Kies wat je verkoopt (meerdere mogelijk) */}
            {isSeller && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Wat ga je verkopen? (meerdere keuzes mogelijk) *
                </label>
                <div className="space-y-3">
                  {userTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => toggleUserType(type.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedUserTypes.includes(type.id)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">{type.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{type.title}</h3>
                          <p className="text-sm text-gray-600">{type.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {type.features.map((feature, idx) => (
                              <span key={idx} className="text-xs bg-white px-2 py-1 rounded-full text-gray-600 border border-gray-200">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Als KOPER: Kies je type (één keuze) */}
            {isBuyer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Welk type koper ben jij? *
                </label>
                <div className="space-y-3">
                  {buyerTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => {
                        setSelectedBuyerType(type.id);
                        setRoleError('');
                      }}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedBuyerType === type.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{type.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{type.title}</h3>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roleError && (
              <p className="text-sm text-red-600">{roleError}</p>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('username')}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-all flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Terug</span>
              </button>
              
              <button
                onClick={handleRoleSubmit}
                disabled={isSaving || (!isBuyer && !isSeller)}
                className="flex-1 px-6 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Bezig met opslaan...</span>
                  </>
                ) : (
                  <>
                    <span>Volgende stap</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Terms & Privacy */}
        {step === 'terms' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-left">
                ⚠️ Akkoord verklaring
              </h3>
              
              <div className="space-y-4 text-left">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      setTermsError('');
                    }}
                    className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    Ik ga akkoord met de{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 underline font-medium"
                    >
                      Algemene Voorwaarden
                    </a>
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => {
                      setAcceptedPrivacy(e.target.checked);
                      setTermsError('');
                    }}
                    className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    Ik ga akkoord met het{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 underline font-medium"
                    >
                      Privacybeleid
                    </a>
                  </span>
                </label>

                {termsError && (
                  <p className="text-sm text-red-600 font-medium">{termsError}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep('role')}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-all flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Terug</span>
              </button>
              
              <button
                onClick={handleTermsSubmit}
                disabled={!acceptedTerms || !acceptedPrivacy}
                className="flex-1 px-6 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                <span>Start met HomeCheff!</span>
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

