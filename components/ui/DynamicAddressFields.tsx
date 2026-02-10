'use client';
import * as React from 'react';
import CountrySelector from './CountrySelector';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';
import { getAddressFormat, getCountryConfig, isValidPostcode } from '@/lib/global-geocoding';
import { useTranslation } from '@/hooks/useTranslation';

export interface AddressData {
  address?: string;
  postalCode?: string;
  houseNumber?: string;
  city?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface DynamicAddressFieldsProps {
  value: AddressData;
  onChange: (data: AddressData) => void;
  onGeocode?: (data: AddressData & { lat: number; lng: number }) => void;
  required?: boolean;
  showValidation?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string | null;
  showCountrySelector?: boolean;
  geocodingEnabled?: boolean;
}

export default function DynamicAddressFields({
  value,
  onChange,
  onGeocode,
  required = false,
  showValidation = false,
  disabled = false,
  className = '',
  error,
  showCountrySelector = true,
  geocodingEnabled = true,
}: DynamicAddressFieldsProps) {
  const { t } = useTranslation();
  
  const [isGeocoding, setIsGeocoding] = React.useState(false);
  const [geocodingError, setGeocodingError] = React.useState<string | null>(null);
  
  const country = value.country || 'NL';
  const addressFormat = getAddressFormat(country);
  const countryConfig = getCountryConfig(country);
  const isNetherlands = country === 'NL';
  const isPostcodeHouseFormat = addressFormat === 'postcode_house';
  
  const handleFieldChange = (field: keyof AddressData, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue,
      // Reset coordinates when address changes
      lat: null,
      lng: null,
    });
    setGeocodingError(null);
  };
  
  const handleCountryChange = (countryCode: string) => {
    onChange({
      ...value,
      country: countryCode,
      address: '',
      postalCode: '',
      houseNumber: '',
      city: '',
      lat: null,
      lng: null,
    });
    setGeocodingError(null);
  };
  
  const handleGeocode = async () => {
    if (!geocodingEnabled) return;
    
    // Validate required fields - consistent for all countries
    if (!value.address || !value.city) {
      setGeocodingError(t('addressFields.validation.fillStreetCity') || 'Vul adres en plaats in');
      return;
    }
    
    setIsGeocoding(true);
    setGeocodingError(null);
    
    try {
      // Use Google Maps geocoding for all countries (fully consistent)
      // Build complete address from address field (which includes street + house number)
      const fullAddress = value.houseNumber 
        ? `${value.address || ''} ${value.houseNumber}`.trim()
        : value.address || '';
      
      const response = await fetch('/api/geocoding/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: fullAddress,
          city: value.city || '',
          countryCode: country
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          setGeocodingError(data.error || t('addressFields.validation.addressNotFound') || 'Adres niet gevonden');
        } else if (data.lat && data.lng) {
          const updatedData: AddressData = {
            ...value,
            lat: data.lat,
            lng: data.lng,
          };
          if (data.formatted_address) {
            const addressParts = data.formatted_address.split(',');
            if (addressParts.length > 0) {
              updatedData.address = addressParts[0].trim();
            }
          }
          // Update city if provided by Google Maps
          if (data.city && !updatedData.city) {
            updatedData.city = data.city;
          }
          // Update postal code if provided by Google Maps
          if (data.postalCode && !updatedData.postalCode) {
            updatedData.postalCode = data.postalCode;
          }
          
          onChange(updatedData);
          if (onGeocode) {
            onGeocode({
              ...updatedData,
              lat: data.lat,
              lng: data.lng,
            });
          }
          setGeocodingError(null);
        } else {
          setGeocodingError(t('addressFields.validation.addressNotFound') || 'Adres niet gevonden. Controleer het adres en de plaats.');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Onbekende fout' }));
        setGeocodingError(errorData.error || t('addressFields.validation.addressNotFound') || 'Adres niet gevonden');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingError(t('addressFields.validation.geocodingError') || 'Er is een fout opgetreden bij het valideren van het adres');
    } finally {
      setIsGeocoding(false);
    }
  };
  
  const displayError = error || geocodingError;
  const isGeocoded = value.lat !== null && value.lng !== null;
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Country selector */}
      {showCountrySelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('addressFields.country') || 'Land'} {required && '*'}
          </label>
          <CountrySelector
            value={country}
            onChange={handleCountryChange}
            className="w-full"
            showRegion={true}
          />
        </div>
      )}
      
      {/* Address fields - Google Places Autocomplete for all countries (including Netherlands) */}
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
        // Google Places Autocomplete - COMPACT VERSION (works for all countries including NL)
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('addressFields.searchAddress') || 'Zoek adres'} {required && '*'}
            </label>
            <GooglePlacesAutocomplete
              value={value.address || ''}
              onChange={(formattedAddress, placeData) => {
                if (placeData) {
                  // Auto-fill all fields from Google Places for ALL countries (fully consistent)
                  // Google Places provides: address (street + house number), city, postalCode, country, lat, lng, houseNumber
                  const addressData: AddressData = {
                    address: placeData.address, // Full address including street and house number
                    city: placeData.city,
                    postalCode: placeData.postalCode,
                    country: placeData.country || country,
                    lat: placeData.lat,
                    lng: placeData.lng,
                  };
                  
                  // Extract houseNumber if available (works for all countries, not just NL)
                  if (placeData.houseNumber) {
                    addressData.houseNumber = placeData.houseNumber;
                  }
                  
                  onChange(addressData);
                  
                  if (onGeocode) {
                    onGeocode({
                      ...addressData,
                      lat: placeData.lat,
                      lng: placeData.lng,
                    });
                  }
                  setGeocodingError(null);
                } else {
                  // Just update the address field if typing manually
                  handleFieldChange('address', formattedAddress);
                }
              }}
              country={country}
              placeholder={t('addressFields.searchAddressPlaceholder') || 'Begin met typen om adres te zoeken...'}
              className="w-full"
              disabled={disabled}
              required={required}
            />
            <p className="text-xs sm:text-xs text-gray-500 mt-1">
              {t('addressFields.placesAutocompleteHelp') || 'Begin met typen om automatisch adres te vinden - alle velden worden automatisch ingevuld'}
            </p>
            
            {/* Auto-filled fields (read-only, compact display) */}
            {(value.address || value.city || value.postalCode) && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-2 font-medium">
                  {t('addressFields.autoFilledAddress') || 'Automatisch ingevuld adres:'}
                </div>
                <div className="space-y-1 text-sm text-gray-700">
                  {value.address && (
                    <div><span className="font-medium">{t('addressFields.address') || 'Adres'}:</span> {value.address}</div>
                  )}
                  {value.city && (
                    <div><span className="font-medium">{t('addressFields.city') || 'Plaats'}:</span> {value.city}</div>
                  )}
                  {value.postalCode && (
                    <div><span className="font-medium">{t('addressFields.postalCode') || 'Postcode'}:</span> {value.postalCode}</div>
                  )}
                  {value.houseNumber && (
                    <div><span className="font-medium">{t('addressFields.houseNumber') || 'Huisnummer'}:</span> {value.houseNumber}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        // Fallback: Manual input fields if Google Maps API key is not available
        // Keep it internationally consistent: 1 address field + city (+ optional postal code)
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('addressFields.address') || 'Adres'} {required && '*'}
            </label>
            <input
              type="text"
              value={value.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand disabled:bg-gray-50 disabled:text-gray-500"
              placeholder={t('addressFields.addressPlaceholder') || 'Straatnaam 10'}
              required={required}
              disabled={disabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('addressFields.manualAddressHelp') || 'Geen Google suggesties beschikbaar. Vul je adres in en valideer hieronder.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('addressFields.postalCode') || 'Postcode'}
              </label>
              <input
                type="text"
                value={value.postalCode || ''}
                onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand disabled:bg-gray-50 disabled:text-gray-500"
                placeholder={t('addressFields.postalCodePlaceholder') || 'Postcode'}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('addressFields.city') || 'Plaats'} {required && '*'}
              </label>
              <input
                type="text"
                value={value.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand disabled:bg-gray-50 disabled:text-gray-500"
                placeholder={t('addressFields.cityPlaceholder') || 'Plaats'}
                required={required}
                disabled={disabled}
              />
            </div>
          </div>
        </>
      )}
      
      {/* Error display */}
      {displayError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          ⚠️ {displayError}
        </div>
      )}
      
      {/* Geocoding button - Only show if Google Places Autocomplete is not available OR if address was manually entered without autocomplete */}
      {geocodingEnabled && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <button
          type="button"
          onClick={handleGeocode}
          disabled={
            isGeocoding || 
            disabled ||
            (!value.address || !value.city)
          }
          className="w-full px-4 py-3 min-h-[44px] bg-primary-brand text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-base"
        >
          {isGeocoding 
            ? (t('addressFields.validating') || '⏳ Valideren...') 
            : (t('addressFields.validateAddress') || '📍 Adres valideren')
          }
        </button>
      )}
      
      {/* Success indicator */}
      {showValidation && isGeocoded && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0">✅</span>
            <div className="flex-1">
              <div>{t('addressFields.addressValidated') || 'Adres gevalideerd'}</div>
              <div className="text-xs text-gray-600 mt-1">
                {value.lat!.toFixed(6)}, {value.lng!.toFixed(6)}
                {countryConfig && (
                  <span className="ml-2">
                    ({countryConfig.name} - {countryConfig.geocodingService === 'GoogleMaps' ? 'Google Maps' : countryConfig.geocodingService === 'PDOK' ? 'PDOK' : countryConfig.geocodingService})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
