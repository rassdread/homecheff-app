"use client";
import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { clearAllUserData } from "@/lib/session-cleanup";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, CheckCircle, User, MapPin, Heart } from "lucide-react";
import Link from "next/link";
import CountrySelector from "@/components/ui/CountrySelector";
import InfoIcon from "@/components/onboarding/InfoIcon";
import { getHintsForPage } from "@/lib/onboarding/hints";
import { usePersistentState } from "@/hooks/usePersistentState";

const userTypes = [
  {
    id: "chef",
    title: "Chef",
    description: "Deel je culinaire passie met de buurt",
    icon: "👨‍🍳",
        features: ["Deel je gerechten op het dorpsplein", "Bezorging & ophalen", "Reviews ontvangen", "Fans verzamelen"]
  },
  {
    id: "garden",
    title: "Garden",
    description: "Deel je groenten en kruiden met je community",
    icon: "🌱",
        features: ["Deel verse oogst op het dorpsplein", "Seizoensproducten", "Lokale community", "Duurzaamheid"]
  },
  {
    id: "designer",
    title: "Designer",
    description: "Laat je vakmanschap zien op het dorpsplein",
    icon: "🎨",
        features: ["Deel je handwerk op het dorpsplein", "Custom orders", "Portfolio opbouwen", "Kunstenaarsnetwerk"]
  },
];

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

const REGISTER_DRAFT_STORAGE_KEY = "homecheff_register_draft_v1";
const REGISTER_DRAFT_TTL = 48 * 60 * 60 * 1000;

type RegisterState = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  gender: string;
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
};

const REGISTER_INITIAL_STATE: RegisterState = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  gender: "",
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
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  
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
            router.push("/login?message=Betaling succesvol! Log in om verder te gaan.");
          }
        };
        
        processPaymentSuccess();
      } else {
        // Geen pending registration, gewoon redirect naar login
        router.push("/login?message=Betaling succesvol! Log in om verder te gaan.");
      }
    } else if (paymentStatus === 'canceled') {
      // Betaling geannuleerd - gebruiker kan later betalen via /sell
      sessionStorage.removeItem('pendingRegistration');
      router.push("/login?message=Betaling geannuleerd. Je kunt later je abonnement kiezen via je profiel.");
    }
  }, [searchParams, router]);
  const isSocialLogin = searchParams?.get('social') === 'true';
  
  // Load hints for this page
  const pageHints = getHintsForPage('register');
  
  // Load social login data if coming from social login
  useEffect(() => {
    const loadSocialData = async () => {
      if (isSocialLogin) {
        try {
          const session = await getSession();
          if (session?.user) {
            const socialName = (session.user as any).socialName || session.user.name || '';
            const socialEmail = session.user.email || '';
            
            // Parse name into first and last name
            const nameParts = socialName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Generate username from email or name
            const emailUsername = socialEmail.split('@')[0] || '';
            const nameUsername = firstName.toLowerCase() + (lastName ? lastName.toLowerCase() : '');
            const suggestedUsername = nameUsername || emailUsername;
            
            // Pre-fill the form with social data
            setState(prev => ({
              ...prev,
              firstName,
              lastName,
              email: socialEmail,
              username: suggestedUsername,
            emailValidation: {
              isValid: true,
              message: "E-mailadres bevestigd via social login",
              isChecking: false,
            },
              // Start at step 1 for social login users
              currentStep: 1
            }));

          }
        } catch (error) {
          console.error('Error loading social data:', error);
        }
      }
    };
    
    loadSocialData();
  }, [isSocialLogin]);
  
  // Clear any existing user data to prevent privacy leaks (only for non-social login)
  useEffect(() => {
    if (!isSocialLogin) {
      // Only clear on initial mount, not on every render
      const hasCleared = sessionStorage.getItem('register_cleared');
      
      if (!hasCleared) {
        clearAllUserData();
        sessionStorage.setItem('register_cleared', 'true');
        
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
      sessionStorage.removeItem("pendingRegistration");
      sessionStorage.removeItem("register_cleared");
    }
  }, [resetRegistrationDraft]);

  const steps = [
    { id: 1, title: "Welkom", description: "Hoe wil je je aanmelden?" },
    { id: 2, title: "Je rol", description: "Wat ga je doen?" },
    { id: 3, title: "Account", description: "Je gegevens" },
    { id: 4, title: "Profiel", description: "Vertel over jezelf" },
  { id: 5, title: "Uitbetaling", description: "Bankgegevens (verkopers)" },
  { id: 6, title: "Voorwaarden", description: "Privacy & voorwaarden" }
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
          error: 'Voer postcode en huisnummer in',
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
          error: 'Voer een geldig huisnummer in (bijv. 123 of 123A)',
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
      const response = await fetch(
        `/api/geocoding/dutch?postcode=${encodeURIComponent(postcode)}&huisnummer=${encodeURIComponent(cleanedHouseNumber)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Adres lookup mislukt');
      }

      const addressData = await response.json();

      const latValueRaw = addressData.lat ?? addressData.latitude ?? addressData.geometry?.lat;
      const lngValueRaw = addressData.lng ?? addressData.lon ?? addressData.longitude ?? addressData.geometry?.lng ?? addressData.geometry?.lon;
      const parsedLat = typeof latValueRaw === 'number' ? latValueRaw : latValueRaw ? parseFloat(String(latValueRaw)) : NaN;
      const parsedLng = typeof lngValueRaw === 'number' ? lngValueRaw : lngValueRaw ? parseFloat(String(lngValueRaw)) : NaN;

      const structuredAddress = {
        street: addressData.street || addressData.straatnaam || '',
        houseNumber: addressData.houseNumber || addressData.huisnummer || cleanedHouseNumber,
        city: addressData.city || addressData.plaats || '',
        postalCode: addressData.postalCode || addressData.postcode || postcode,
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
          error: error instanceof Error ? error.message : 'Adres lookup mislukt',
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
          error: 'Voer straatnaam en stad in',
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
        throw new Error(errorData.error || 'Adres lookup mislukt');
      }

      const addressData = await response.json();

      if (addressData.error) {
        throw new Error(addressData.message || 'Adres niet gevonden');
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
          error: error instanceof Error ? error.message : 'Adres lookup mislukt',
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

  useEffect(() => {
    if (state.country === 'NL') {
      const combined = [state.street, state.houseNumber].filter(Boolean).join(' ').trim();
      if (combined !== state.address) {
        setState(prev => ({
          ...prev,
          address: combined,
        }));
      }
    }
  }, [state.country, state.street, state.houseNumber, state.address, setState]);

  // Dynamische placeholders op basis van land (152 landen ondersteund!)
  const getPlaceholders = () => {
    const placeholders = {
      // Nederland - PDOK format
      NL: {
        address: 'Wordt automatisch ingevuld',
        postalCode: 'Bijv. 1012 AB',
        city: 'Bijv. Amsterdam'
      },
      
      // Noord-Amerika
      US: {
        address: 'Bijv. Main Street 123',
        city: 'Bijv. New York',
        postalCode: 'Bijv. 10001'
      },
      CA: {
        address: 'Bijv. Main Street 123',
        city: 'Bijv. Toronto',
        postalCode: 'Bijv. M5V 3A8'
      },
      
      // Europa - Premium landen
      GB: {
        address: 'Bijv. Oxford Street 123',
        city: 'Bijv. London',
        postalCode: 'Bijv. SW1A 1AA'
      },
      DE: {
        address: 'Bijv. Hauptstraße 123',
        city: 'Bijv. Berlin',
        postalCode: 'Bijv. 10115'
      },
      FR: {
        address: 'Bijv. Rue de la Paix 123',
        city: 'Bijv. Paris',
        postalCode: 'Bijv. 75001'
      },
      ES: {
        address: 'Bijv. Calle Mayor 123',
        city: 'Bijv. Madrid',
        postalCode: 'Bijv. 28001'
      },
      IT: {
        address: 'Bijv. Via Roma 123',
        city: 'Bijv. Rome',
        postalCode: 'Bijv. 00100'
      },
      
      // Europa - Andere landen
      BE: {
        address: 'Bijv. Rue de la Paix 123',
        city: 'Bijv. Brussels',
        postalCode: 'Bijv. 1000'
      },
      CH: {
        address: 'Bijv. Bahnhofstrasse 123',
        city: 'Bijv. Zürich',
        postalCode: 'Bijv. 8001'
      },
      AT: {
        address: 'Bijv. Kärntner Straße 123',
        city: 'Bijv. Vienna',
        postalCode: 'Bijv. 1010'
      },
      SE: {
        address: 'Bijv. Drottninggatan 123',
        city: 'Bijv. Stockholm',
        postalCode: 'Bijv. 111 51'
      },
      NO: {
        address: 'Bijv. Karl Johans gate 123',
        city: 'Bijv. Oslo',
        postalCode: 'Bijv. 0154'
      },
      DK: {
        address: 'Bijv. Strøget 123',
        city: 'Bijv. Copenhagen',
        postalCode: 'Bijv. 1169'
      },
      FI: {
        address: 'Bijv. Mannerheimintie 123',
        city: 'Bijv. Helsinki',
        postalCode: 'Bijv. 00100'
      },
      PL: {
        address: 'Bijv. Krakowskie Przedmieście 123',
        city: 'Bijv. Warsaw',
        postalCode: 'Bijv. 00-071'
      },
      CZ: {
        address: 'Bijv. Václavské náměstí 123',
        city: 'Bijv. Prague',
        postalCode: 'Bijv. 110 00'
      },
      HU: {
        address: 'Bijv. Váci utca 123',
        city: 'Bijv. Budapest',
        postalCode: 'Bijv. 1052'
      },
      RO: {
        address: 'Bijv. Calea Victoriei 123',
        city: 'Bijv. Bucharest',
        postalCode: 'Bijv. 010061'
      },
      BG: {
        address: 'Bijv. Vitosha Boulevard 123',
        city: 'Bijv. Sofia',
        postalCode: 'Bijv. 1000'
      },
      HR: {
        address: 'Bijv. Ilica 123',
        city: 'Bijv. Zagreb',
        postalCode: 'Bijv. 10000'
      },
      SI: {
        address: 'Bijv. Prešernova cesta 123',
        city: 'Bijv. Ljubljana',
        postalCode: 'Bijv. 1000'
      },
      SK: {
        address: 'Bijv. Hlavná 123',
        city: 'Bijv. Bratislava',
        postalCode: 'Bijv. 811 01'
      },
      LT: {
        address: 'Bijv. Gedimino prospektas 123',
        city: 'Bijv. Vilnius',
        postalCode: 'Bijv. LT-01103'
      },
      LV: {
        address: 'Bijv. Brīvības iela 123',
        city: 'Bijv. Riga',
        postalCode: 'Bijv. LV-1010'
      },
      EE: {
        address: 'Bijv. Pikk 123',
        city: 'Bijv. Tallinn',
        postalCode: 'Bijv. 10130'
      },
      IE: {
        address: 'Bijv. O\'Connell Street 123',
        city: 'Bijv. Dublin',
        postalCode: 'Bijv. D01 F5P2'
      },
      PT: {
        address: 'Bijv. Rua Augusta 123',
        city: 'Bijv. Lisbon',
        postalCode: 'Bijv. 1100-053'
      },
      GR: {
        address: 'Bijv. Ermou Street 123',
        city: 'Bijv. Athens',
        postalCode: 'Bijv. 105 63'
      },
      CY: {
        address: 'Bijv. Makarios Avenue 123',
        city: 'Bijv. Nicosia',
        postalCode: 'Bijv. 1065'
      },
      MT: {
        address: 'Bijv. Republic Street 123',
        city: 'Bijv. Valletta',
        postalCode: 'Bijv. VLT 1117'
      },
      LU: {
        address: 'Bijv. Grand-Rue 123',
        city: 'Bijv. Luxembourg',
        postalCode: 'Bijv. L-1660'
      },
      
      // Caribische landen
      CW: {
        address: 'Bijv. Kaya Grandi 123',
        city: 'Bijv. Willemstad',
        postalCode: 'Bijv. 12345'
      },
      AW: {
        address: 'Bijv. L.G. Smith Boulevard 123',
        city: 'Bijv. Oranjestad',
        postalCode: 'Bijv. 12345'
      },
      SX: {
        address: 'Bijv. Front Street 123',
        city: 'Bijv. Philipsburg',
        postalCode: 'Bijv. 12345'
      },
      SR: {
        address: 'Bijv. Waterkant 123',
        city: 'Bijv. Paramaribo',
        postalCode: 'Bijv. 12345'
      },
      JM: {
        address: 'Bijv. King Street 123',
        city: 'Bijv. Kingston',
        postalCode: 'Bijv. 12345'
      },
      TT: {
        address: 'Bijv. Independence Square 123',
        city: 'Bijv. Port of Spain',
        postalCode: 'Bijv. 12345'
      },
      BB: {
        address: 'Bijv. Broad Street 123',
        city: 'Bijv. Bridgetown',
        postalCode: 'Bijv. 12345'
      },
      BS: {
        address: 'Bijv. Bay Street 123',
        city: 'Bijv. Nassau',
        postalCode: 'Bijv. 12345'
      },
      CU: {
        address: 'Bijv. Obispo Street 123',
        city: 'Bijv. Havana',
        postalCode: 'Bijv. 12345'
      },
      DO: {
        address: 'Bijv. El Conde 123',
        city: 'Bijv. Santo Domingo',
        postalCode: 'Bijv. 12345'
      },
      HT: {
        address: 'Bijv. Champs de Mars 123',
        city: 'Bijv. Port-au-Prince',
        postalCode: 'Bijv. 12345'
      },
      PR: {
        address: 'Bijv. Calle Fortaleza 123',
        city: 'Bijv. San Juan',
        postalCode: 'Bijv. 00901'
      },
      
      // Azië - Premium landen
      JP: {
        address: 'Bijv. Shibuya 1-2-3',
        city: 'Bijv. Tokyo',
        postalCode: 'Bijv. 150-0002'
      },
      KR: {
        address: 'Bijv. Gangnam-daero 123',
        city: 'Bijv. Seoul',
        postalCode: 'Bijv. 06292'
      },
      SG: {
        address: 'Bijv. Orchard Road 123',
        city: 'Bijv. Singapore',
        postalCode: 'Bijv. 238863'
      },
      HK: {
        address: 'Bijv. Nathan Road 123',
        city: 'Bijv. Hong Kong',
        postalCode: 'Bijv. 12345'
      },
      TH: {
        address: 'Bijv. Sukhumvit Road 123',
        city: 'Bijv. Bangkok',
        postalCode: 'Bijv. 10110'
      },
      MY: {
        address: 'Bijv. Jalan Bukit Bintang 123',
        city: 'Bijv. Kuala Lumpur',
        postalCode: 'Bijv. 50200'
      },
      ID: {
        address: 'Bijv. Jalan Thamrin 123',
        city: 'Bijv. Jakarta',
        postalCode: 'Bijv. 10310'
      },
      PH: {
        address: 'Bijv. Ayala Avenue 123',
        city: 'Bijv. Manila',
        postalCode: 'Bijv. 1226'
      },
      VN: {
        address: 'Bijv. Nguyễn Huệ 123',
        city: 'Bijv. Ho Chi Minh City',
        postalCode: 'Bijv. 12345'
      },
      IN: {
        address: 'Bijv. Connaught Place 123',
        city: 'Bijv. New Delhi',
        postalCode: 'Bijv. 110001'
      },
      CN: {
        address: 'Bijv. Wangfujing Street 123',
        city: 'Bijv. Beijing',
        postalCode: 'Bijv. 100006'
      },
      
      // Oceanië
      AU: {
        address: 'Bijv. Collins Street 123',
        city: 'Bijv. Melbourne',
        postalCode: 'Bijv. 3000'
      },
      NZ: {
        address: 'Bijv. Queen Street 123',
        city: 'Bijv. Auckland',
        postalCode: 'Bijv. 1010'
      },
      
      // Afrika
      ZA: {
        address: 'Bijv. Long Street 123',
        city: 'Bijv. Cape Town',
        postalCode: 'Bijv. 8001'
      },
      NG: {
        address: 'Bijv. Broad Street 123',
        city: 'Bijv. Lagos',
        postalCode: 'Bijv. 12345'
      },
      KE: {
        address: 'Bijv. Kenyatta Avenue 123',
        city: 'Bijv. Nairobi',
        postalCode: 'Bijv. 00100'
      },
      EG: {
        address: 'Bijv. Tahrir Square 123',
        city: 'Bijv. Cairo',
        postalCode: 'Bijv. 12345'
      },
      MA: {
        address: 'Bijv. Mohammed V Avenue 123',
        city: 'Bijv. Casablanca',
        postalCode: 'Bijv. 20000'
      },
      
      // Zuid-Amerika
      BR: {
        address: 'Bijv. Avenida Paulista 123',
        city: 'Bijv. São Paulo',
        postalCode: 'Bijv. 01310-100'
      },
      AR: {
        address: 'Bijv. Avenida Corrientes 123',
        city: 'Bijv. Buenos Aires',
        postalCode: 'Bijv. C1043'
      },
      CL: {
        address: 'Bijv. Alameda 123',
        city: 'Bijv. Santiago',
        postalCode: 'Bijv. 8320000'
      },
      CO: {
        address: 'Bijv. Carrera Séptima 123',
        city: 'Bijv. Bogotá',
        postalCode: 'Bijv. 110221'
      },
      PE: {
        address: 'Bijv. Jirón de la Unión 123',
        city: 'Bijv. Lima',
        postalCode: 'Bijv. 15001'
      },
      
      // Noord-Amerika (extra)
      MX: {
        address: 'Bijv. Avenida Reforma 123',
        city: 'Bijv. Mexico City',
        postalCode: 'Bijv. 06600'
      },
      
      // Default fallback
      default: {
        address: 'Bijv. Main Street 123',
        city: 'Bijv. City',
        postalCode: 'Bijv. 12345'
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
          message: "Gebruikersnaam moet minimaal 3 karakters lang zijn",
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
          message: "Er is een fout opgetreden bij het controleren van de gebruikersnaam",
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
          message: "Voer een geldig e-mailadres in",
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
          message: "Er is een fout opgetreden bij het controleren van het e-mailadres",
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

    const timeoutId = setTimeout(() => {
      validateUsername(state.username);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [state.username]);

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
      const result = await signIn(provider, { 
        callbackUrl: "/inspiratie",
        redirect: true 
      });
    } catch (error) {
      console.error("Social login error:", error);
    }
  }

  async function handleRegister() {
    setState(prev => ({ ...prev, error: null, success: false }));
    
    // Validatie voor privacy en voorwaarden
    if (!state.acceptPrivacyPolicy || !state.acceptTerms) {
      setState(prev => ({ 
        ...prev, 
        error: "Je moet de privacyverklaring en algemene voorwaarden accepteren om door te gaan." 
      }));
      return;
    }

    // Validatie voor gebruikersnaam
    if (!state.username || state.username.trim().length === 0) {
      setState(prev => ({ 
        ...prev, 
        error: "Gebruikersnaam is verplicht." 
      }));
      return;
    }

    if (state.usernameValidation.isValid !== true) {
      setState(prev => ({ 
        ...prev, 
        error: "Voer een geldige gebruikersnaam in voordat je doorgaat." 
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
            error: "Vul al je contactgegevens in (telefoon, adres, stad, postcode en land) en valideer het adres om door te gaan."
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
          })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setState(prev => ({
            ...prev,
            error: data?.message || "Er ging iets mis bij het afronden van je registratie. Probeer het opnieuw.",
            success: false
          }));
          return;
        }

        // Forceer directe session refresh zodat needsOnboarding verdwijnt
        if (typeof updateSession === "function") {
          try {
            await updateSession({});
          } catch (sessionError) {
            console.error("Session update failed after social onboarding:", sessionError);
          }
        }

        window.location.href = "/inspiratie?welcome=true&onboarding=completed";
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
          error: "Valideer je adres via de adreszoeker voordat je je account aanmaakt."
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
        acceptTaxResponsibility: state.acceptTaxResponsibility
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
        // Toon specifieke foutmelding van de server
        setState(prev => ({ 
          ...prev, 
          error: data.error || "Er is een fout opgetreden bij de registratie. Probeer het opnieuw.", 
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
        sessionStorage.setItem('pendingRegistration', JSON.stringify({
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
          error: "Er kon geen betalingssessie worden aangemaakt. Probeer het opnieuw of kies je abonnement later via je profiel." 
        }));
        return;
      }
      
      // Registratie succesvol (geen betaling nodig)
      resetRegistrationDraft();
      setState(() => ({
        ...REGISTER_INITIAL_STATE,
        success: true,
      }));
      if (typeof window !== "undefined") {
        sessionStorage.removeItem('pendingRegistration');
      }
      
      // Clear the 'register cleared' flag before auto-login
      sessionStorage.removeItem('register_cleared');
      
      // Bepaal redirect URL op basis van response of default - focus op inspiratie
      const redirectUrl = data?.redirectUrl || (state.isBusiness ? "/sell" : "/inspiratie");
      
      // Probeer automatisch in te loggen met redirect
      // NextAuth zal de session cookie zetten en dan redirecten naar callbackUrl
      try {
        await signIn("credentials", {
          emailOrUsername: state.email,
          password: state.password,
          redirect: true,
          callbackUrl: redirectUrl,
        });
        
        // Als signIn met redirect: true wordt gebruikt, zal NextAuth automatisch redirecten
        // Deze code wordt alleen bereikt als er geen redirect gebeurt
      } catch (error: any) {
        // Als signIn een redirect doet, kan het een error gooien die we moeten negeren
        // Dit is normaal gedrag voor NextAuth redirects
        if (error?.message?.includes('NEXT_REDIRECT')) {
          // Dit is een Next.js redirect, gewoon doorlaten
          throw error;
        }
        
        console.error("Auto sign-in failed:", error);
        // Redirect naar login pagina met succesmelding
        router.push("/login?message=Registratie succesvol! Log in om verder te gaan.");
      }
      
    } catch (error) {
      console.error("Registration error:", error);
      setState(prev => ({ 
        ...prev, 
        error: "Er is een netwerkfout opgetreden. Controleer je internetverbinding en probeer het opnieuw.", 
        success: false 
      }));
    }
  }

  if (state.success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-cyan-50">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-emerald-200">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">🎉 Welkom bij HomeCheff!</h2>
            
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
              <p className="text-lg text-gray-800 font-medium mb-4 text-center">
                Je account is succesvol aangemaakt! Hier kun je aan de slag:
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 text-left">
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <div className="text-2xl mb-2">👨‍🍳</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Recepten & Gerechten</h3>
                  <p className="text-sm text-gray-600">Vertel je verhaal, deel je recepten en laat anderen genieten van wat jij maakt — op jouw manier</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <div className="text-2xl mb-2">🌱</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Kweken & Oogsten</h3>
                  <p className="text-sm text-gray-600">Deel wat je kweekt en verbind je met andere tuiniers in je buurt — van verse oogst tot stekjes</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-100">
                  <div className="text-2xl mb-2">🎨</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Designs & Handwerk</h3>
                  <p className="text-sm text-gray-600">Laat je vakmanschap zien en deel je unieke creaties — van sieraden tot meubels, alles kan op het dorpsplein</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Wist je?</strong> Je kunt op elk moment starten met delen. Begin klein of ga groot — het dorpsplein is er voor iedereen die iets te delen heeft
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6 text-center">Je wordt nu doorgestuurd naar je profiel pagina...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }

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
                <h1 className="text-2xl font-bold text-white">Registreren</h1>
                <p className="text-emerald-100 text-sm">Word onderdeel van de community</p>
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
              <strong>Concept opgeslagen.</strong> Je ingevulde gegevens worden automatisch hersteld.
            </div>
            <Button variant="outline" onClick={handleDraftReset} className="sm:w-auto w-full">
              Concept wissen
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welkom bij HomeCheff!</h2>
            <p className="text-gray-600 mb-6">Je account is succesvol aangemaakt. Je wordt doorgestuurd naar je profiel.</p>
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
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">Welkom bij HomeCheff! 🎉</h2>
                      <p className="text-lg text-gray-600 mb-8">Je bent succesvol ingelogd! Nu gaan we je profiel compleet maken.</p>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                        <p className="text-emerald-800 font-medium">✅ Je bent ingelogd met Google</p>
                        <p className="text-emerald-700 text-sm mt-1">Je gegevens worden automatisch ingevuld in de volgende stappen</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                          Welkom bij HomeCheff! 
                          {pageHints?.hints.welcome && (
                            <InfoIcon hint={pageHints.hints.welcome} pageId="register" size="md" />
                          )}
                        </h2>
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6 mb-8 shadow-sm">
                          <p className="text-lg text-gray-800 font-medium mb-4 text-center">
                            🎭 Geef je creaties een podium!
                          </p>
                          <div className="grid md:grid-cols-3 gap-4 text-center">
                            <div className="bg-white rounded-xl p-4 border border-emerald-100">
                              <div className="text-3xl mb-2">👨‍🍳</div>
                              <h3 className="font-semibold text-gray-900 mb-2">Chef</h3>
                              <p className="text-sm text-gray-600">Deel je culinaire passie met de buurt — vertel je verhaal en laat anderen genieten van wat jij maakt</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-emerald-100">
                              <div className="text-3xl mb-2">🌱</div>
                              <h3 className="font-semibold text-gray-900 mb-2">Garden</h3>
                              <p className="text-sm text-gray-600">Deel wat je kweekt en verbind je met andere tuiniers — verse oogst, kruiden en stekjes vinden hun weg naar je buurt</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-emerald-100">
                              <div className="text-3xl mb-2">🎨</div>
                              <h3 className="font-semibold text-gray-900 mb-2">Designer</h3>
                              <p className="text-sm text-gray-600">Laat je vakmanschap zien en deel je unieke creaties — van sieraden tot meubels, alles kan op het dorpsplein</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-4 text-center">
                            💡 <strong>Wist je?</strong> Veel mensen combineren rollen om hun verschillende passies te delen. En iedereen kan ook koper zijn om lokale parels te ontdekken!
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
                      onClick={() => handleSocialLogin("google")}
                      className="w-full max-w-sm mx-auto inline-flex justify-center items-center px-6 py-4 border border-gray-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md"
                    >
                      <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Doorgaan met Google
                    </button>

                    <button
                      onClick={() => handleSocialLogin("facebook")}
                      className="w-full max-w-sm mx-auto inline-flex justify-center items-center px-6 py-4 border border-gray-300 rounded-xl shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md"
                    >
                      <svg className="w-6 h-6 mr-3" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Doorgaan met Facebook
                    </button>
                  </div>
                )}

                {/* Divider */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">of</span>
                  </div>
                </div>

                {/* Email Option */}
                <button
                  onClick={() => setState(prev => ({ ...prev, currentStep: 2 }))}
                  className="w-full max-w-sm mx-auto inline-flex justify-center items-center px-6 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all hover:shadow-md font-medium text-base"
                >
                  <Mail className="w-6 h-6 mr-3" />
                  Aanmelden met email
                </button>

                <div className="mt-6 text-sm text-gray-500">
                  <p>Al een account? <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">Inloggen</Link></p>
                </div>
              </div>
            )}

            {/* Step 2: Role Selection */}
            {state.currentStep === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Kies je rollen</h2>
                <p className="text-gray-600 mb-8">Kies wat bij jou past — veel mensen combineren rollen om hun passie te delen</p>
                
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
                      <strong>Geselecteerd:</strong> {state.userTypes.map(id => userTypes.find(t => t.id === id)?.title).join(', ')}
                    </p>
                  </div>
                )}

                {state.selectedBuyerType !== "" && state.userTypes.length === 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Koper type geselecteerd:</strong> {buyerTypes.find(t => t.id === state.selectedBuyerType)?.title}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Je kunt alleen producten kopen, niet op het plein zetten</p>
                  </div>
                )}

                {/* Wat voor koper ben je? Sectie */}
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Wat voor koper ben je?</h3>
                    {pageHints?.hints.buyer && (
                      <InfoIcon hint={pageHints.hints.buyer} pageId="register" size="sm" />
                    )}
                  </div>
                  <p className="text-gray-600 mb-6">Definieer jezelf - kies 1 rol die het beste bij je past</p>
                  
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Je account</h2>
                {isSocialLogin ? (
                  <div className="mb-8">
                    <p className="text-gray-600 mb-4">Je gegevens van Google zijn hieronder ingevuld. Je kunt ze aanpassen indien nodig.</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-blue-800 font-medium">📝 Gegevens vooringevuld van Google</p>
                      <p className="text-blue-700 text-sm mt-1">Controleer en pas aan waar nodig</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-8">Vul je basis gegevens in om je account aan te maken</p>
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
                        <span className="text-2xl">🏢</span>
                        <span>Ik registreer me als bedrijf (KVK)</span>
                      </label>
                      {pageHints?.hints.business && (
                        <InfoIcon hint={pageHints.hints.business} pageId="register" size="sm" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-9">
                      Vul je KVK, BTW en bedrijfsnaam in. In stap 5 kun je je abonnement kiezen.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam *</label>
                      <input
                        type="text"
                        value={state.firstName}
                        onChange={e => setState(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Je voornaam"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Achternaam *</label>
                      <input
                        type="text"
                        value={state.lastName}
                        onChange={e => setState(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Je achternaam"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">Gebruikersnaam *</label>
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
                        placeholder="Unieke gebruikersnaam (3-20 karakters)"
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
                      <p>Gebruikersnaam regels:</p>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>3-20 karakters lang</li>
                        <li>Alleen letters, cijfers en underscores</li>
                        <li>Moet uniek zijn</li>
                        <li>Kan niet worden gewijzigd na registratie</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">E-mailadres *</label>
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
                      placeholder="je@email.com"
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                    {isSocialLogin && (
                      <p className="mt-2 text-sm text-emerald-700">
                        Dit e-mailadres is overgenomen van je social login en is al geverifieerd.
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
                        <label className="block text-sm font-medium text-gray-700">Wachtwoord *</label>
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
                          placeholder="Minimaal 8 karakters"
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
                            ? '✅ Wachtwoord is sterk genoeg' 
                            : '❌ Wachtwoord moet minimaal 8 karakters bevatten'
                          }
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Social login info */}
                  {isSocialLogin && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-medium">🔐 Wachtwoord niet nodig</p>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        Je gebruikt Google om in te loggen, dus je hoeft geen wachtwoord in te voeren.
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Geslacht</label>
                    <select
                      value={state.gender}
                      onChange={e => setState(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Maak een keuze</option>
                      <option value="man">Man</option>
                      <option value="vrouw">Vrouw</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefoonnummer
                    </label>
                    <input
                      type="tel"
                      value={state.phoneNumber}
                      onChange={e => setState(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Bijv. +31 6 12345678"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      📞 Optioneel - voor contact bij bestellingen
                    </p>
                  </div>
                </div>
                
                {/* Business Fields - Collapsible section when business is selected */}
                {state.isBusiness && (
                  <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl transition-all duration-300">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🏢</span>
                      Bedrijfsgegevens
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Company Information */}
                      <div>
                        <h4 className="text-md font-medium text-gray-800 mb-3">Bedrijfsinformatie</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bedrijfsnaam *</label>
                            <input
                              type="text"
                              value={state.company}
                              onChange={e => setState(prev => ({ ...prev, company: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Je bedrijfsnaam"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">KVK nummer *</label>
                              <input
                                type="text"
                                value={state.kvk}
                                onChange={e => setState(prev => ({ ...prev, kvk: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="12345678"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">BTW nummer</label>
                              <input
                                type="text"
                                value={state.btw}
                                onChange={e => setState(prev => ({ ...prev, btw: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="NL123456789B01"
                              />
                            </div>
                          </div>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Profiel setup</h2>
                <p className="text-gray-600 mb-8">Help anderen je te vinden en fan te worden</p>
                
                <div className="space-y-6">
                  {/* Locatie wordt automatisch ingevuld via geolocatie in de adres sectie hieronder */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Land
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
                      placeholder="Selecteer je land"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      🌍 Voor internationale producten en afstandsberekening
                    </p>
                  </div>

                  {/* Address Details (Private) */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Adresgegevens (privé - voor afstand berekening)
                      </h3>
                      {pageHints?.hints.location && (
                        <InfoIcon hint={pageHints.hints.location} pageId="register" size="sm" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      🔒 Deze gegevens zijn privé en worden alleen gebruikt voor het berekenen van afstanden tot producten
                    </p>
                    
                    {/* Dynamische adres velden op basis van land */}
                    {isDutchAddressFormat ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Postcode
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
                              Huisnummer
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
                              placeholder="Bijv. 123 of 123A"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Straatnaam
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
                              placeholder="Wordt automatisch ingevuld"
                              readOnly
                              tabIndex={-1}
                              aria-readonly="true"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Woonplaats
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
                              Volledig adres
                            </label>
                            <input
                              type="text"
                              value={[state.street, state.houseNumber].filter(Boolean).join(' ').trim()}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed focus:ring-0 focus:border-gray-200"
                              placeholder="Wordt automatisch ingevuld"
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
                                Zoeken...
                              </div>
                            ) : (
                              'Zoek adres'
                            )}
                          </button>
                          <p className="text-xs text-gray-500">
                            ✨ Vul postcode en huisnummer in en klik op "Zoek adres"
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Internationale straat + stad format
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Straatnaam en huisnummer
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
                            Stad
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
                                  Zoeken...
                                </div>
                              ) : (
                                'Zoek'
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
                          Postcode (optioneel)
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
                          placeholder="Bijv. 12345"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          📮 Niet alle landen gebruiken postcodes
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
                      placeholder="Vertel iets over jezelf..."
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Uitbetaalgegevens</h2>
                <p className="text-gray-600 mb-8">Vul je bankgegevens in om uitbetalingen te ontvangen</p>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Uitbetalingen via Stripe</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Uitbetalingen worden veilig afgehandeld via Stripe. Je kunt later je bankgegevens toevoegen in je verkoper instellingen.
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
                          Ik begrijp mijn belastingverantwoordelijkheid als verkoper
                        </label>
                        <div className="mt-2 text-sm text-blue-800 space-y-2">
                          <p>
                            <strong>Jouw verantwoordelijkheid:</strong> Je bent zelf verantwoordelijk voor het opgeven van alle inkomsten bij de Belastingdienst. 
                            Er is geen minimumbedrag - alle inkomsten moeten worden opgegeven.
                          </p>
                          <p>
                            <strong>Onze verplichting:</strong> HomeCheff is wettelijk verplicht om je gegevens door te geven aan de Belastingdienst 
                            als je meer dan <strong>30 transacties per jaar</strong> uitvoert of meer dan <strong>€2.000 omzet</strong> behaalt.
                          </p>
                          <p className="text-xs text-blue-600">
                            Consulteer een accountant voor specifieke belastingadvies. HomeCheff biedt geen belastingadvies.
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
                  <h2 className="text-2xl font-bold text-gray-900">Privacy & Voorwaarden</h2>
                  {pageHints?.hints.privacy && (
                    <InfoIcon hint={pageHints.hints.privacy} pageId="register" size="md" />
                  )}
                </div>
                <p className="text-gray-600 mb-8">Lees en accepteer onze privacyverklaring en algemene voorwaarden</p>

                {state.isBusiness && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-sm text-emerald-800">
                    <p className="font-semibold">🧾 Abonnement kiezen doe je na je registratie</p>
                    <p className="mt-1">
                      Zodra je account klaar is ga je via <span className="font-semibold">/sell</span> naar de abonnementskeuze.
                      Je kunt alvast inspiratie-items delen; verkopen start zodra je een plan activeert.
                    </p>
                  </div>
                )}
                
                <div className="space-y-6">
                  {/* Privacy Policy */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🔒</span>
                      Privacyverklaring
                    </h3>
                    <div className="max-h-64 overflow-y-auto text-sm text-gray-700 space-y-3">
                      <p>
                        <strong>HomeCheff B.V.</strong> respecteert uw privacy en is verantwoordelijk voor de verwerking van uw persoonsgegevens 
                        in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG) en de Nederlandse privacywetgeving.
                      </p>
                      <p>
                        <strong>Welke gegevens verzamelen wij?</strong><br/>
                        • Identificatiegegevens: Naam, e-mailadres, telefoonnummer<br/>
                        • Accountgegevens: Profielfoto, biografie, locatie<br/>
                        • Verkoopgegevens: Productinformatie, prijzen, transacties<br/>
                        • Communicatiegegevens: Berichten, reviews, klachten
                      </p>
                      <p>
                        <strong>Hoe gebruiken wij uw gegevens?</strong><br/>
                        • Uitvoering van de overeenkomst en platformfunctionaliteiten<br/>
                        • Verwerking van betalingen en uitbetalingen<br/>
                        • Klantenservice en ondersteuning<br/>
                        • Platformverbetering en gebruikerservaring
                      </p>
                      <p>
                        <strong>Uw rechten:</strong><br/>
                        U heeft het recht op toegang, rectificatie, verwijdering, beperking van verwerking, 
                        gegevensoverdraagbaarheid en bezwaar tegen verwerking van uw persoonsgegevens.
                      </p>
                      <p className="text-xs text-gray-500">
                        Voor de volledige privacyverklaring, zie: <a href="/privacy" className="text-emerald-600 hover:text-emerald-700 underline">Privacy Statement</a>
                      </p>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📋</span>
                      Algemene Voorwaarden
                    </h3>
                    <div className="max-h-64 overflow-y-auto text-sm text-gray-700 space-y-3">
                      <p>
                        <strong>Gebruik van het platform:</strong><br/>
                        • U bent verantwoordelijk voor de juistheid van uw gegevens<br/>
                        • U mag geen illegale of schadelijke content plaatsen<br/>
                        • U respecteert de rechten van andere gebruikers
                      </p>
                      <p>
                        <strong>Verkoop en transacties:</strong><br/>
                        • Verkopers zijn zelf verantwoordelijk voor belastingaangifte<br/>
                        • Producten moeten voldoen aan Nederlandse wetgeving<br/>
                        • HomeCheff is een platform, geen partij in transacties
                      </p>
                      <p>
                        <strong>Betalingen:</strong><br/>
                        • Betalingen worden verwerkt via Stripe<br/>
                        • Platformkosten worden in rekening gebracht<br/>
                        • Uitbetalingen vinden plaats volgens de afgesproken voorwaarden
                      </p>
                      <p className="text-xs text-gray-500">
                        Voor de volledige voorwaarden, zie: <a href="/terms" className="text-emerald-600 hover:text-emerald-700 underline">Algemene Voorwaarden</a>
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
                        <span className="font-medium">Ik accepteer de privacyverklaring *</span><br/>
                        <span className="text-gray-500">Ik begrijp hoe HomeCheff mijn persoonsgegevens verwerkt en beschermt.</span>
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
                        <span className="font-medium">Ik accepteer de algemene voorwaarden *</span><br/>
                        <span className="text-gray-500">Ik ga akkoord met de regels en voorwaarden voor het gebruik van HomeCheff.</span>
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
                        <span className="font-medium">Ik wil marketingcommunicatie ontvangen (optioneel)</span><br/>
                        <span className="text-gray-500">Ontvang updates over nieuwe features, tips en aanbiedingen via e-mail.</span>
                      </label>
                    </div>
                  </div>

                  {/* Belastingverantwoordelijkheid waarschuwing */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-yellow-600 text-xl">⚠️</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800 mb-1">Belastingverantwoordelijkheid</h4>
                        <p className="text-sm text-yellow-700">
                          Als verkoper ben je zelf verantwoordelijk voor het aangeven van je inkomsten bij de belastingdienst. 
                          HomeCheff biedt geen belastingadvies. Consulteer een accountant voor specifieke vragen.
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
                Vorige
              </Button>
              
              {state.currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (state.currentStep === 2 && state.userTypes.length === 0 && state.selectedBuyerType === "") ||
                    (state.currentStep === 3 && (!state.firstName || !state.lastName || !state.username || !state.email || (!isSocialLogin && !state.password) || state.usernameValidation.isValid !== true)) ||
                    (state.currentStep === 5 && state.userTypes.length > 0 && (!state.acceptTaxResponsibility))
                  }
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volgende
                </Button>
              ) : (
                <Button
                  onClick={handleRegister}
                  disabled={!state.acceptPrivacyPolicy || !state.acceptTerms}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Account Aanmaken
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}