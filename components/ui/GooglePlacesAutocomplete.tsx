'use client';
import * as React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (address: string, placeData?: {
    address: string;
    houseNumber?: string;
    city: string;
    postalCode: string;
    country: string;
    lat: number;
    lng: number;
    formattedAddress: string;
  }) => void;
  country?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  country = 'NL',
  placeholder,
  className = '',
  disabled = false,
  required = false,
}: GooglePlacesAutocompleteProps) {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const autocompleteRef = React.useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef = React.useRef<any>(null);

  // Load Google Maps JavaScript API
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.google?.maps?.places) {
      console.log('[GooglePlacesAutocomplete] Google Maps already loaded');
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('[GooglePlacesAutocomplete] Script already exists, waiting for load...');
      // Wait for it to load
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.maps?.places) {
          console.log('[GooglePlacesAutocomplete] Google Maps loaded from existing script');
          setIsLoaded(true);
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          console.error('[GooglePlacesAutocomplete] Timeout waiting for existing script to load');
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Load Google Maps JavaScript API
    // In Next.js, NEXT_PUBLIC_ variables are available at runtime (embedded during build)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    console.log('[GooglePlacesAutocomplete] API Key check:', apiKey ? `Found (${apiKey.substring(0, 10)}...)` : 'NOT FOUND');
    console.log('[GooglePlacesAutocomplete] process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'exists' : 'undefined');
    
    if (!apiKey || apiKey.trim() === '') {
      const errorMsg = 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set';
      console.error('[GooglePlacesAutocomplete] ❌', errorMsg);
      console.error('[GooglePlacesAutocomplete] Make sure:');
      console.error('  1. Key is set in .env.local (for local dev)');
      console.error('  2. Key is set in Vercel environment variables (for production)');
      console.error('  3. Dev server is restarted after adding .env.local');
      console.error('  4. Production is redeployed after adding Vercel env vars');
      setError(errorMsg);
      return;
    }

    console.log('[GooglePlacesAutocomplete] Loading Google Maps script...');
    setIsLoading(true);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=nl`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('[GooglePlacesAutocomplete] Google Maps script loaded successfully');
      if (window.google?.maps?.places) {
        console.log('[GooglePlacesAutocomplete] Places API is available');
        setIsLoaded(true);
        setIsLoading(false);
      } else {
        const errorMsg = 'Script loaded but Places API not available. Check if Places API is enabled in Google Cloud Console';
        console.error('[GooglePlacesAutocomplete]', errorMsg);
        setError(errorMsg);
        setIsLoading(false);
      }
    };
    script.onerror = (error) => {
      const errorMsg = 'Failed to load Google Maps API. Check: 1) API key is valid, 2) Places API is enabled, 3) HTTP referrers are set correctly';
      console.error('[GooglePlacesAutocomplete]', errorMsg, error);
      setError(errorMsg);
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: don't remove script as other components might use it
    };
  }, []);

  // Initialize Autocomplete when loaded
  React.useEffect(() => {
    if (!isLoaded) {
      console.log('[GooglePlacesAutocomplete] Not loaded yet, waiting...');
      return;
    }
    
    // Wait a bit to ensure the input is in the DOM
    const initTimeout = setTimeout(() => {
      if (!autocompleteRef.current) {
        console.error('[GooglePlacesAutocomplete] Input ref is not available after timeout');
        return;
      }
      
      if (!window.google?.maps?.places) {
        console.error('[GooglePlacesAutocomplete] Google Maps Places API is not available');
        return;
      }

      console.log('[GooglePlacesAutocomplete] Initializing Autocomplete...');

      // Destroy existing instance if any
      if (autocompleteInstanceRef.current) {
        console.log('[GooglePlacesAutocomplete] Destroying existing autocomplete instance');
        window.google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current);
        autocompleteInstanceRef.current = null;
      }

      // Create new Autocomplete instance
      // Optimized for better Google autocomplete results (desktop + mobile)
      const autocompleteOptions: any = {
        fields: ['address_components', 'geometry', 'formatted_address'],
        types: ['address'], // Only show addresses, not businesses
      };
      
      // Apply country restriction for better autocomplete suggestions
      // This helps Google prioritize results from the selected country
      if (country && country.length === 2) {
        autocompleteOptions.componentRestrictions = { country: country.toLowerCase() };
        console.log('[GooglePlacesAutocomplete] Country restriction:', country.toLowerCase());
      }

      // Mobile-specific optimizations
      // Ensure autocomplete works well on touch devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        console.log('[GooglePlacesAutocomplete] Mobile device detected, applying mobile optimizations');
        // Don't restrict too much on mobile - let Google handle it
        // The types: ['address'] already limits to addresses
      }
      
      let autocomplete;
      try {
        autocomplete = new window.google.maps.places.Autocomplete(
          autocompleteRef.current,
          autocompleteOptions
        );

        autocompleteInstanceRef.current = autocomplete;
        console.log('[GooglePlacesAutocomplete] Autocomplete instance created successfully');

        // Mobile-specific: Ensure autocomplete dropdown is clickable/tappable
        // Google's autocomplete should handle this, but we ensure proper setup
        if (autocompleteRef.current) {
          // Ensure input is not readonly (Google Autocomplete needs this)
          autocompleteRef.current.readOnly = false;
          
          // Add mobile-specific event listeners for better UX
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
            // On mobile, ensure we can tap suggestions properly
            autocompleteRef.current.addEventListener('focus', () => {
              console.log('[GooglePlacesAutocomplete] Input focused on mobile');
              // Small delay to ensure Google's dropdown is ready
              setTimeout(() => {
                if (autocompleteRef.current) {
                  // Scroll into view on mobile keyboards
                  autocompleteRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 300);
            });
          }
        }
      } catch (error) {
        console.error('[GooglePlacesAutocomplete] Error creating Autocomplete instance:', error);
        return;
      }

      if (!autocomplete) {
        console.error('[GooglePlacesAutocomplete] Autocomplete instance is null');
        return;
      }

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        console.log('[GooglePlacesAutocomplete] Place changed event triggered');
        const place = autocomplete.getPlace();
        console.log('[GooglePlacesAutocomplete] Selected place:', place);
        
        if (!place.geometry || !place.geometry.location) {
          console.warn('[GooglePlacesAutocomplete] Place has no geometry');
          return;
        }

        // Extract address components
        const addressComponents = place.address_components || [];
        let street = '';
        let streetNumber = '';
        let houseNumber = '';
        let city = '';
        let postalCode = '';
        let countryCode = country;

        addressComponents.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
            houseNumber = component.long_name; // For Netherlands format
          } else if (types.includes('route')) {
            street = component.long_name;
          } else if (types.includes('locality') || types.includes('postal_town')) {
            city = component.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          } else if (types.includes('country')) {
            countryCode = component.short_name;
          }
        });

        const fullAddress = street + (streetNumber ? ' ' + streetNumber : '');
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Mark that we're setting a place (not user typing)
        isUserTypingRef.current = false;
        
        // Update input value to show formatted address
        if (autocompleteRef.current) {
          autocompleteRef.current.value = place.formatted_address;
          lastValueRef.current = place.formatted_address;
        }
        
        onChange(place.formatted_address, {
          address: fullAddress.trim(),
          houseNumber: houseNumber, // Include houseNumber for Netherlands format
          city: city,
          postalCode: postalCode,
          country: countryCode,
          lat: lat,
          lng: lng,
          formattedAddress: place.formatted_address,
        });
      });
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(initTimeout);
      if (autocompleteInstanceRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current);
      }
    };
  }, [isLoaded, country]); // Removed onChange from dependencies to avoid re-initialization

  const defaultPlaceholder = placeholder || t('addressFields.searchAddress') || 'Zoek adres...';

  // Use uncontrolled input for better Google Autocomplete compatibility
  // Google Autocomplete works better with uncontrolled inputs
  const [inputKey, setInputKey] = React.useState(0);
  const isUserTypingRef = React.useRef(false);
  const lastValueRef = React.useRef(value);

  // Update input when value prop changes (from parent) - but only if user is not actively typing
  React.useEffect(() => {
    // Only update if value changed from outside (not from user typing) and user is not currently typing
    if (value && autocompleteRef.current && value !== lastValueRef.current && !isUserTypingRef.current) {
      // Small delay to ensure Google's autocomplete has processed
      const timeoutId = setTimeout(() => {
        if (autocompleteRef.current && !isUserTypingRef.current) {
          autocompleteRef.current.value = value;
          lastValueRef.current = value;
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
    lastValueRef.current = value;
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <input
        key={`autocomplete-input-${inputKey}`}
        ref={autocompleteRef}
        type="text"
        defaultValue={value}
        onChange={(e) => {
          // Allow manual typing - notify parent
          isUserTypingRef.current = true;
          onChange(e.target.value);
          // Reset typing flag after a short delay
          setTimeout(() => {
            isUserTypingRef.current = false;
          }, 500);
        }}
        onInput={(e) => {
          // Also handle input events for better compatibility
          isUserTypingRef.current = true;
          onChange((e.target as HTMLInputElement).value);
          // Reset typing flag after a short delay
          setTimeout(() => {
            isUserTypingRef.current = false;
          }, 500);
        }}
        onTouchStart={(e) => {
          // Ensure autocomplete works on mobile touch
          if (autocompleteRef.current && !disabled && !isLoading) {
            // Force focus on mobile for better UX
            setTimeout(() => {
              if (autocompleteRef.current) {
                autocompleteRef.current.focus();
              }
            }, 100);
          }
        }}
        className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand disabled:bg-gray-50 disabled:text-gray-500 text-base sm:text-sm touch-manipulation"
        placeholder={isLoading ? (t('addressFields.loading') || 'Laden...') : defaultPlaceholder}
        disabled={disabled || isLoading}
        required={required}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck="false"
        inputMode="text"
        id={`google-places-autocomplete-${Date.now()}`}
        style={{
          // Ensure Google's autocomplete dropdown appears correctly on mobile
          WebkitAppearance: 'none',
          appearance: 'none',
          fontSize: '16px', // Prevent zoom on iOS
        }}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-brand"></div>
        </div>
      )}
      {isLoaded && !isLoading && !error && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      )}
      {error && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      )}
      {error && (
        <div className="mt-1 text-xs text-red-600">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

