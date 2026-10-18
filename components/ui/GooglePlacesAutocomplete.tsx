'use client';
import * as React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  placeDetailsToAddress,
  placesPredictionStatusUnavailable,
  placesSearchShouldRecover,
} from '@/lib/delivery/places-autocomplete-fallback';

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
    gm_authFailure?: () => void;
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
  const [placesUnavailable, setPlacesUnavailable] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Array<{ placeId: string; description: string }>>([]);
  const autocompleteRef = React.useRef<HTMLInputElement>(null);
  const isUserTypingRef = React.useRef(false);
  const lastValueRef = React.useRef(value);
  const onChangeRef = React.useRef(onChange);
  const requestIdRef = React.useRef(0);
  const searchTimerRef = React.useRef<number | null>(null);
  onChangeRef.current = onChange;

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
    
    if (!apiKey || apiKey.trim() === '') {
      console.error('[GooglePlacesAutocomplete] Maps key is not set');
      setPlacesUnavailable(true);
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
        console.error('[GooglePlacesAutocomplete] Places library did not load');
        setPlacesUnavailable(true);
        setIsLoading(false);
      }
    };
    script.onerror = (error) => {
      console.error('[GooglePlacesAutocomplete] Maps script failed to load');
      setPlacesUnavailable(true);
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: don't remove script as other components might use it
    };
  }, []);

  const applyPlace = React.useCallback((place: any) => {
    const mapped = placeDetailsToAddress(place, country);
    if (!mapped) {
      setPlacesUnavailable(true);
      return;
    }
    isUserTypingRef.current = false;
    if (autocompleteRef.current) {
      autocompleteRef.current.value = mapped.formattedAddress;
      lastValueRef.current = mapped.formattedAddress;
    }
    setSuggestions([]);
    setPlacesUnavailable(false);
    onChangeRef.current(mapped.formattedAddress, mapped);
  }, [country]);

  const requestPredictions = React.useCallback((query: string) => {
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    const trimmed = query.trim();
    if (!isLoaded || trimmed.length < 3 || !window.google?.maps?.places?.AutocompleteService) {
      setSuggestions([]);
      return;
    }
    searchTimerRef.current = window.setTimeout(() => {
      const requestId = ++requestIdRef.current;
      const service = new window.google.maps.places.AutocompleteService();
      const options: Record<string, unknown> = {
        input: trimmed,
        types: ['address'],
      };
      if (country && country.length === 2) {
        options.componentRestrictions = { country: country.toLowerCase() };
      }
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled || requestIdRef.current !== requestId) return;
        settled = true;
        setSuggestions([]);
        setPlacesUnavailable(true);
      }, 8000);
      service.getPlacePredictions(options, (predictions: any[] | null, status: string) => {
        if (requestIdRef.current !== requestId) return;
        settled = true;
        window.clearTimeout(timeout);
        if (status === 'OK' && predictions && predictions.length > 0) {
          setPlacesUnavailable(false);
          setSuggestions(
            predictions.slice(0, 5).map((item) => ({
              placeId: String(item.place_id || ''),
              description: String(item.description || ''),
            })).filter((item) => item.placeId && item.description),
          );
          return;
        }
        setSuggestions([]);
        if (placesPredictionStatusUnavailable(status)) setPlacesUnavailable(true);
      });
    }, 250);
  }, [country, isLoaded]);

  const selectSuggestion = React.useCallback((placeId: string, description: string) => {
    setSuggestions([]);
    if (!window.google?.maps?.places?.PlacesService) {
      setPlacesUnavailable(true);
      return;
    }
    if (autocompleteRef.current) {
      autocompleteRef.current.value = description;
      lastValueRef.current = description;
    }
    const places = new window.google.maps.places.PlacesService(document.createElement('div'));
    places.getDetails(
      { placeId, fields: ['address_components', 'geometry', 'formatted_address'] },
      (place: any, status: string) => {
        if (status !== 'OK' || !place) {
          setPlacesUnavailable(true);
          return;
        }
        applyPlace(place);
      },
    );
  }, [applyPlace]);

  React.useEffect(() => {
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, []);

  const defaultPlaceholder = placeholder || t('addressFields.searchAddressPlaceholder') || t('addressFields.searchAddress') || 'Zoek adres...';
  const fallbackMessage =
    t('addressFields.placesUnavailable') ||
    'Adreszoeken is nu niet beschikbaar. Vul straat, huisnummer, postcode en plaats hieronder in. Je kunt gewoon verder.';

  React.useEffect(() => {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      setPlacesUnavailable(true);
      if (typeof previous === 'function') previous();
    };
    return () => {
      window.gm_authFailure = previous;
    };
  }, []);

  React.useEffect(() => {
    const input = autocompleteRef.current;
    if (!input) return;
    const recover = () => {
      if (
        !placesSearchShouldRecover({
          disabled: input.disabled,
          placeholder: input.placeholder,
          value: input.value,
        })
      ) {
        return;
      }
      input.disabled = false;
      input.readOnly = false;
      if (
        placesSearchShouldRecover({
          disabled: false,
          placeholder: input.placeholder,
          value: input.value,
        })
      ) {
        if (input.value && placesSearchShouldRecover({ disabled: false, value: input.value })) {
          input.value = '';
        }
        input.placeholder = defaultPlaceholder;
      }
      setPlacesUnavailable(true);
    };
    const observer = new MutationObserver(recover);
    observer.observe(input, {
      attributes: true,
      attributeFilter: ['disabled', 'placeholder', 'readonly'],
    });
    const timers = [400, 1200, 2500].map((ms) => window.setTimeout(recover, ms));
    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [defaultPlaceholder, isLoaded, placesUnavailable]);

  // Use uncontrolled input for better Google Autocomplete compatibility
  // Google Autocomplete works better with uncontrolled inputs
  const [inputKey] = React.useState(0);

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
          isUserTypingRef.current = true;
          const next = e.target.value;
          onChange(next);
          requestPredictions(next);
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
        placeholder={
          isLoading && !placesUnavailable
            ? t('addressFields.loading') || 'Laden...'
            : defaultPlaceholder
        }
        disabled={disabled || (isLoading && !placesUnavailable)}
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
      {isLoaded && !isLoading && !placesUnavailable && (
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
      {suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId} role="option">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectSuggestion(suggestion.placeId, suggestion.description);
                }}
              >
                {suggestion.description}
              </button>
            </li>
          ))}
        </ul>
      )}
      {placesUnavailable && (
        <p className="mt-1 text-xs text-amber-800" role="status">
          {fallbackMessage}
        </p>
      )}
    </div>
  );
}

