'use client';

import { useState, useEffect } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { User, MapPin, Calendar, Edit3, Save, X } from 'lucide-react';
import HelpSettings from '@/components/onboarding/HelpSettings';

const sellerTypes = [
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

interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio?: string;
  quote?: string;
  place?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  gender?: string;
  interests?: string[];
  image?: string;
  sellerRoles?: string[];
  buyerRoles?: string[];
  displayFullName?: boolean;
  displayNameOption?: 'full' | 'first' | 'last' | 'username' | 'none';
  showFansList?: boolean;
  encryptionEnabled?: boolean;
  messageGuidelinesAccepted?: boolean;
  messageGuidelinesAcceptedAt?: Date | null;
  // Bank details now handled via Stripe
}

interface ProfileSettingsProps {
  user: UserProfile;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
}

export default function ProfileSettings({ user, onSave }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  interface AddressLookupState {
    isLookingUp: boolean;
    error: string | null;
    success: boolean;
    foundAddress: {
      straatnaam?: string;
      huisnummer?: string;
      postcode?: string;
      plaats?: string;
      formatted_address?: string;
      city?: string;
      lat?: number;
      lng?: number;
    } | null;
  }

  const [addressLookup, setAddressLookup] = useState<AddressLookupState>({
    isLookingUp: false,
    error: null,
    success: false,
    foundAddress: null,
  });
  const [formData, setFormData] = useState({
    name: user?.name || user?.username || '',
    username: user?.username || user?.name || '',
    bio: user?.bio || '',
    quote: user?.quote || '',
    place: user?.place || '',
    address: user?.address || '',
    city: user?.city || '',
    postalCode: user?.postalCode || '',
    country: user?.country || 'NL',
    gender: user?.gender || '',
    interests: user?.interests || [],
    sellerRoles: user?.sellerRoles || [],
    buyerRoles: user?.buyerRoles || [],
    displayFullName: user?.displayFullName !== undefined ? user.displayFullName : true,
    displayNameOption: user?.displayNameOption || 'full',
    showFansList: user?.showFansList !== undefined ? user.showFansList : true,
    encryptionEnabled: user?.encryptionEnabled || false,
    messageGuidelinesAccepted: user?.messageGuidelinesAccepted || false,
    // Bank details now handled via Stripe
  });
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Include username with current value (can't be changed but API expects it)
      const dataToSave = {
        ...formData,
        username: user?.username || user?.name || formData.username // Use current username
      };
      await onSave(dataToSave);
      setSuccess('Profiel succesvol bijgewerkt!');
      setIsEditing(false);
    } catch (error: any) {
      setError(error.message || 'Er is een fout opgetreden bij het opslaan');
    } finally {
      setIsLoading(false);
    }
  };

  const lookupDutchAddress = async () => {
    if (!formData.postalCode || !formData.address) {
      setAddressLookup({
        isLookingUp: false,
        error: 'Voer postcode en huisnummer in',
        success: false,
        foundAddress: null
      });
      return;
    }

    const huisnummerMatch = formData.address.match(/(\d+)/);
    if (!huisnummerMatch) {
      setAddressLookup({
        isLookingUp: false,
        error: 'Voer een geldig huisnummer in (bijv. 123)',
        success: false,
        foundAddress: null
      });
      return;
    }

    const huisnummer = huisnummerMatch[1];
    const postcode = formData.postalCode.replace(/\s/g, '').toUpperCase();

    setAddressLookup({
      isLookingUp: true,
      error: null,
      success: false,
      foundAddress: null
    });

    try {
      const response = await fetch(
        `/api/geocoding/dutch?postcode=${encodeURIComponent(postcode)}&huisnummer=${encodeURIComponent(huisnummer)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Adres lookup mislukt');
      }

      const addressData = await response.json();

      setAddressLookup({
        isLookingUp: false,
        error: null,
        success: true,
        foundAddress: addressData
      });

    } catch (error) {
      console.error('Address lookup error:', error);
      setAddressLookup({
        isLookingUp: false,
        error: error instanceof Error ? error.message : 'Adres lookup mislukt',
        success: false,
        foundAddress: null
      });
    }
  };

  const lookupGlobalAddress = async () => {
    if (!formData.address || !formData.city) {
      setAddressLookup({
        isLookingUp: false,
        error: 'Voer straatnaam en stad in',
        success: false,
        foundAddress: null
      });
      return;
    }

    setAddressLookup({
      isLookingUp: true,
      error: null,
      success: false,
      foundAddress: null
    });

    try {
      const response = await fetch('/api/geocoding/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: formData.address,
          city: formData.city,
          country: formData.country
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

      setAddressLookup({
        isLookingUp: false,
        error: null,
        success: true,
        foundAddress: addressData
      });

    } catch (error) {
      console.error('Global address lookup error:', error);
      setAddressLookup({
        isLookingUp: false,
        error: error instanceof Error ? error.message : 'Adres lookup mislukt',
        success: false,
        foundAddress: null
      });
    }
  };

  const getAddressLookupFunction = () => {
    return formData.country === 'NL' ? lookupDutchAddress : lookupGlobalAddress;
  };

  const isDutchAddressFormat = formData.country === 'NL';

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!addressLookup.isLookingUp && !addressLookup.success && isEditing) {
        if (isDutchAddressFormat) {
          if (formData.postalCode && formData.address) {
            const cleanPostcode = formData.postalCode.replace(/\s/g, '').toUpperCase();
            if (/^\d{4}[A-Z]{2}$/.test(cleanPostcode)) {
              const huisnummerMatch = formData.address.match(/^(\d+)$/);
              if (huisnummerMatch) {
                lookupDutchAddress();
              }
            }
          }
        } else {
          if (formData.address && formData.city && formData.address.length > 3 && formData.city.length > 2) {
            lookupGlobalAddress();
          }
        }
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [formData.postalCode, formData.address, formData.city, formData.country, isEditing]);

  const handleCancel = () => {
    setFormData({
      name: user?.name || user?.username || '',
      username: user?.username || user?.name || '',
      bio: user?.bio || '',
      quote: user?.quote || '',
      place: user?.place || '',
      address: user?.address || '',
      city: user?.city || '',
      postalCode: user?.postalCode || '',
      country: user?.country || 'NL',
      gender: user?.gender || '',
      interests: user?.interests || [],
      sellerRoles: user?.sellerRoles || [],
      buyerRoles: user?.buyerRoles || [],
      displayFullName: user?.displayFullName !== undefined ? user.displayFullName : true,
      displayNameOption: user?.displayNameOption || 'full',
      showFansList: user?.showFansList !== undefined ? user.showFansList : true,
      encryptionEnabled: user?.encryptionEnabled || false,
      messageGuidelinesAccepted: user?.messageGuidelinesAccepted || false,
      // Bank details now handled via Stripe
    });
    setIsEditing(false);
  };

  const handleEncryptionToggle = () => {
    if (!formData.messageGuidelinesAccepted) {
      setShowEncryptionModal(true);
    } else {
      setFormData(prev => ({ ...prev, encryptionEnabled: !prev.encryptionEnabled }));
    }
  };

  const handleAcceptGuidelines = () => {
    setFormData(prev => ({ 
      ...prev, 
      messageGuidelinesAccepted: true,
      encryptionEnabled: true
    }));
    setShowEncryptionModal(false);
  };

  const addInterest = (interest: string) => {
    if (interest.trim() && !formData.interests.includes(interest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest.trim()]
      }));
    }
  };

  const removeInterest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const handleSellerRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      sellerRoles: prev.sellerRoles.includes(roleId)
        ? prev.sellerRoles.filter(r => r !== roleId)
        : [...prev.sellerRoles, roleId]
    }));
  };

  const handleBuyerRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      buyerRoles: prev.buyerRoles.includes(roleId) ? [] : [roleId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Help & Uitleg - BOVENAAN */}
      <HelpSettings />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Profielinstellingen</h2>
            <p className="text-xs sm:text-sm text-gray-500">Beheer je persoonlijke informatie</p>
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto"
          >
            <Edit3 className="w-4 h-4" />
            <span>Bewerken</span>
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={handleCancel}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto"
            >
              <X className="w-4 h-4" />
              <span>Annuleren</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Opslaan...' : 'Opslaan'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volledige naam
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gebruikersnaam
            </label>
            <input
              type="text"
              value={formData.username}
              disabled={true}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Gebruikersnaam kan niet worden gewijzigd na aanmaak</p>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            disabled={!isEditing}
            rows={3}
            placeholder="Vertel iets over jezelf..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {/* Quote/Motto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Levensmotto / Quote
          </label>
          <textarea
            value={formData.quote}
            onChange={(e) => setFormData(prev => ({ ...prev, quote: e.target.value }))}
            disabled={!isEditing}
            rows={2}
            placeholder="Je levensmotto of favoriete quote..."
            maxLength={150}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              💭 Een korte, inspirerende boodschap die anderen kunnen zien op je profiel
            </p>
            <span className="text-xs text-gray-400">
              {formData.quote.length}/150
            </span>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Locatie (zichtbaar voor anderen)
          </label>
          <input
            type="text"
            value={formData.place}
            onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
            disabled={!isEditing}
            placeholder="Bijv. Amsterdam, Nederland"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            🌍 Deze locatie is zichtbaar voor andere gebruikers
          </p>
        </div>

        {/* Address Details (Private) */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Adresgegevens (privé - voor afstand berekening)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            🔒 Deze gegevens zijn privé en worden alleen gebruikt voor het berekenen van afstanden tot producten
          </p>
          
          {isDutchAddressFormat ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Huisnummer
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Bijv. 123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Bijv. 1012 AB"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={getAddressLookupFunction()}
                    disabled={!isEditing || addressLookup.isLookingUp || !formData.postalCode || !formData.address}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {addressLookup.isLookingUp ? (
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Straatnaam en huisnummer
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Bijv. Main Street 123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stad
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Bijv. Amsterdam"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={getAddressLookupFunction()}
                    disabled={!isEditing || addressLookup.isLookingUp || !formData.address || !formData.city}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {addressLookup.isLookingUp ? (
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
          
          {addressLookup.error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">{addressLookup.error}</span>
              </div>
            </div>
          )}

          {addressLookup.success && addressLookup.foundAddress && (
            <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Adres gevonden!</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      {isDutchAddressFormat ? (
                        <>
                          <div className="font-medium">{addressLookup.foundAddress.straatnaam} {addressLookup.foundAddress.huisnummer}</div>
                          <div>{addressLookup.foundAddress.postcode} {addressLookup.foundAddress.plaats}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium">{addressLookup.foundAddress.formatted_address}</div>
                          <div className="text-xs text-green-600">
                            Coördinaten: {addressLookup.foundAddress.lat?.toFixed(6)}, {addressLookup.foundAddress.lng?.toFixed(6)}
                          </div>
                        </>
                      )}
                    <div className="text-xs text-green-600 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isDutchAddressFormat && addressLookup.foundAddress) {
                            setFormData(prev => ({
                              ...prev,
                              address: `${addressLookup.foundAddress!.straatnaam} ${addressLookup.foundAddress!.huisnummer}`,
                              city: addressLookup.foundAddress!.plaats || '',
                              place: addressLookup.foundAddress!.plaats || '',
                            }));
                          } else if (addressLookup.foundAddress) {
                            setFormData(prev => ({
                              ...prev,
                              address: addressLookup.foundAddress!.formatted_address || '',
                              city: addressLookup.foundAddress!.city || '',
                              place: addressLookup.foundAddress!.city || '',
                            }));
                          }
                          setAddressLookup(prev => ({ ...prev, success: false, foundAddress: null }));
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

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Geslacht
          </label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">Maak een keuze</option>
            <option value="man">Man</option>
            <option value="vrouw">Vrouw</option>
          </select>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interesses
          </label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                >
                  {interest}
                  {isEditing && (
                    <button
                      onClick={() => removeInterest(index)}
                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  placeholder="Voeg interesse toe..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addInterest(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addInterest(input.value);
                    input.value = '';
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto"
                >
                  Toevoegen
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Seller Roles Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Verkopersrollen</h3>
          <p className="text-sm text-gray-600 mb-4">
            Kies welke verkopersrollen je wilt gebruiken op het platform
          </p>
          
          <div className="grid gap-3 sm:gap-4">
            {sellerTypes.map((type) => (
              <div
                key={type.id}
                className={`p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.sellerRoles.includes(type.id)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={() => isEditing && handleSellerRoleToggle(type.id)}
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="text-2xl sm:text-3xl">{type.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">{type.title}</h4>
                    <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">{type.description}</p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {type.features.map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    formData.sellerRoles.includes(type.id)
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300'
                  }`}>
                    {formData.sellerRoles.includes(type.id) && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {formData.sellerRoles.length > 0 && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">
                <strong>Geselecteerd:</strong> {formData.sellerRoles.map(id => sellerTypes.find(t => t.id === id)?.title).join(', ')}
              </p>
            </div>
          )}

          {/* Stripe Connect - Only show when seller roles are selected */}
          {formData.sellerRoles.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Uitbetalingen via Stripe</h4>
                  <p className="text-sm text-blue-700">
                    Uitbetalingen worden veilig afgehandeld via Stripe. 
                    <a href="/seller/stripe/refresh" className="font-medium underline hover:text-blue-800 ml-1">
                      Connect met Stripe
                    </a> om je bankgegevens toe te voegen.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buyer Roles Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Koperrol</h3>
          <p className="text-sm text-gray-600 mb-4">
            Kies 1 koperrol die het beste bij je past
          </p>
          
          <div className="grid gap-2 sm:gap-3">
            {buyerTypes.map((type) => (
              <label
                key={type.id}
                className={`p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.buyerRoles.includes(type.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                } ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl sm:text-2xl">{type.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">{type.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">{type.description}</p>
                  </div>
                  <input
                    type="radio"
                    name="buyerRole"
                    checked={formData.buyerRoles.includes(type.id)}
                    onChange={() => isEditing && handleBuyerRoleToggle(type.id)}
                    disabled={!isEditing}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 disabled:opacity-50 flex-shrink-0"
                  />
                </div>
              </label>
            ))}
          </div>
          
          {formData.buyerRoles.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Geselecteerd:</strong> {formData.buyerRoles.map(id => buyerTypes.find(t => t.id === id)?.title).join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Encryption Settings */}
        <div className="border-t border-gray-200 pt-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg border-2 border-blue-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                🔒
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                  End-to-End Versleutelde Berichten
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  Schakel automatische berichtversleuteling in voor maximale privacy. Niemand, zelfs niet HomeCheff admins, kan je berichten lezen.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">
                  {formData.encryptionEnabled ? '🔐 Versleuteling Actief' : '🔓 Geen Versleuteling'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formData.encryptionEnabled 
                    ? 'Al je berichten worden automatisch versleuteld'
                    : 'Je berichten worden onversleuteld opgeslagen'
                  }
                </div>
              </div>
              <button
                type="button"
                onClick={handleEncryptionToggle}
                disabled={!isEditing}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  formData.encryptionEnabled ? 'bg-blue-600' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    formData.encryptionEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.messageGuidelinesAccepted && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-green-800">
                  <span>✅</span>
                  <span>
                    Je hebt akkoord gegaan met de HomeCheff berichtrichtlijnen op{' '}
                    {user?.messageGuidelinesAcceptedAt 
                      ? new Date(user.messageGuidelinesAcceptedAt).toLocaleDateString('nl-NL')
                      : 'recent'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Display Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Naam weergave</h3>
          <p className="text-sm text-gray-600 mb-4">
            Kies welke naam zichtbaar is op je profiel voor andere gebruikers
          </p>
          
          <div className="space-y-2 sm:space-y-3">
            <label className="flex items-center space-x-3 p-3 sm:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="displayName"
                checked={formData.displayNameOption === 'full'}
                onChange={() => setFormData(prev => ({ ...prev, displayNameOption: 'full' }))}
                disabled={!isEditing}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 focus:ring-emerald-500 disabled:opacity-50 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-medium text-gray-900">Volledige naam</div>
                <div className="text-xs sm:text-sm text-gray-600">Toon je volledige naam op je profiel (bijv. "Jan de Vries")</div>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-3 sm:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="displayName"
                checked={formData.displayNameOption === 'first'}
                onChange={() => setFormData(prev => ({ ...prev, displayNameOption: 'first' }))}
                disabled={!isEditing}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 focus:ring-emerald-500 disabled:opacity-50 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-medium text-gray-900">Alleen voornaam</div>
                <div className="text-xs sm:text-sm text-gray-600">Toon alleen je voornaam op je profiel (bijv. "Jan")</div>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-3 sm:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="displayName"
                checked={formData.displayNameOption === 'last'}
                onChange={() => setFormData(prev => ({ ...prev, displayNameOption: 'last' }))}
                disabled={!isEditing}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 focus:ring-emerald-500 disabled:opacity-50 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-medium text-gray-900">Alleen achternaam</div>
                <div className="text-xs sm:text-sm text-gray-600">Toon alleen je achternaam op je profiel (bijv. "de Vries")</div>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-3 sm:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="displayName"
                checked={formData.displayNameOption === 'username'}
                onChange={() => setFormData(prev => ({ ...prev, displayNameOption: 'username' }))}
                disabled={!isEditing}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 focus:ring-emerald-500 disabled:opacity-50 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-medium text-gray-900">Gebruikersnaam</div>
                <div className="text-xs sm:text-sm text-gray-600">Toon alleen je gebruikersnaam op je profiel (bijv. "@jandevries")</div>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-3 sm:p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="displayName"
                checked={formData.displayNameOption === 'none'}
                onChange={() => setFormData(prev => ({ ...prev, displayNameOption: 'none' }))}
                disabled={!isEditing}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 focus:ring-emerald-500 disabled:opacity-50 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-medium text-gray-900">Geen naam</div>
                <div className="text-xs sm:text-sm text-gray-600">Toon geen naam op je profiel, alleen gebruikersnaam</div>
              </div>
            </label>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy instellingen</h3>
          <p className="text-sm text-gray-600 mb-4">
            Bepaal welke informatie zichtbaar is op je publieke profiel
          </p>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.showFansList}
                onChange={(e) => setFormData(prev => ({ ...prev, showFansList: e.target.checked }))}
                disabled={!isEditing}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">Fan lijst tonen</div>
                <div className="text-xs text-gray-600">
                  Toon je fan lijst en wie je volgt op je publieke profiel
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Encryption Guidelines Modal */}
      {showEncryptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Versleutelde Berichten Activeren
                  </h2>
                  <p className="text-sm text-gray-600">
                    Lees en accepteer de richtlijnen
                  </p>
                </div>
              </div>

              {/* Guidelines Content */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span>🛡️</span>
                  HomeCheff Berichtrichtlijnen
                </h3>
                
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="font-medium">Door versleutelde berichten te activeren, ga je akkoord met:</p>
                  
                  <div className="space-y-2 pl-4">
                    <div className="flex gap-2">
                      <span className="text-green-600 flex-shrink-0">✓</span>
                      <p><strong>Respectvol communiceren:</strong> Behandel anderen met respect en waardigheid</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="text-green-600 flex-shrink-0">✓</span>
                      <p><strong>Geen intimidatie of pesten:</strong> Geen dreigingen, intimidatie of pestgedrag</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="text-green-600 flex-shrink-0">✓</span>
                      <p><strong>Geen illegale activiteiten:</strong> Geen gebruik voor illegale doeleinden</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="text-green-600 flex-shrink-0">✓</span>
                      <p><strong>Privacy respecteren:</strong> Geen persoonlijke info delen zonder toestemming</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="text-green-600 flex-shrink-0">✓</span>
                      <p><strong>Geen spam of misbruik:</strong> Geen ongewenste berichten of systeem misbruik</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  Belangrijk: Privacy & Verantwoordelijkheid
                </h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Versleutelde berichten zijn <strong>volledig privé</strong> - zelfs admins kunnen ze niet lezen</li>
                  <li>Bij misbruik kan je account worden <strong>geblokkeerd</strong></li>
                  <li>Metadata (wie, wanneer) blijft zichtbaar voor moderatie</li>
                  <li>Je bent verantwoordelijk voor je eigen communicatie</li>
                </ul>
              </div>

              {/* Acceptance Checkbox */}
              <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.messageGuidelinesAccepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, messageGuidelinesAccepted: e.target.checked }))}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      Ik ga akkoord met de HomeCheff berichtrichtlijnen en verplicht me tot respectvolle, ethische communicatie
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Je accepteert hiermee de gedragscode en begrijpt dat misbruik kan leiden tot account sancties
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEncryptionModal(false);
                    setFormData(prev => ({ ...prev, messageGuidelinesAccepted: false }));
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAcceptGuidelines}
                  disabled={!formData.messageGuidelinesAccepted}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Accepteren & Activeren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

