"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";

interface LocationInputProps {
  onLocationSelect: (coords: { lat: number; lng: number }, address: string) => void;
  onGeocodeError: (error: string) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationInput({ 
  onLocationSelect, 
  onGeocodeError, 
  placeholder = "Typ plaats of postcode (bv. Amsterdam of 1012AB)",
  className = ""
}: LocationInputProps) {
  const [input, setInput] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{address: string, lat: number, lng: number}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced geocoding
  useEffect(() => {
    if (!input.trim() || input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await geocodeInput(input.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [input]);

  const geocodeInput = async (query: string) => {
    setIsGeocoding(true);
    setSuggestions([]);

    try {
      // Try multiple geocoding strategies
      const results = await Promise.allSettled([
        // Strategy 1: Dutch postal code (1234AB format)
        geocodePostalCode(query),
        // Strategy 2: City/place name
        geocodePlace(query),
        // Strategy 3: Full address
        geocodeAddress(query)
      ]);

      const allResults: Array<{address: string, lat: number, lng: number}> = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allResults.push(result.value);
        }
      });

      // Remove duplicates based on coordinates
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => 
          Math.abs(r.lat - result.lat) < 0.001 && 
          Math.abs(r.lng - result.lng) < 0.001
        )
      );

      setSuggestions(uniqueResults.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(uniqueResults.length > 0);
    } catch (error) {
      console.error('Geocoding error:', error);
      onGeocodeError('Locatie niet gevonden. Probeer een andere plaats of postcode.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const geocodePostalCode = async (postalCode: string): Promise<{address: string, lat: number, lng: number} | null> => {
    // Check if it looks like a Dutch postal code (1234AB format)
    const dutchPostalRegex = /^\d{4}\s?[A-Za-z]{2}$/;
    if (!dutchPostalRegex.test(postalCode)) {
      return null;
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postalCode)}&countrycodes=nl&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HomeCheff-App/1.0'
        }
      }
    );

    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    return {
      address: `${result.address?.postcode || postalCode} ${result.address?.city || result.address?.town || 'Nederland'}`,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
  };

  const geocodePlace = async (place: string): Promise<{address: string, lat: number, lng: number} | null> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&countrycodes=nl&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HomeCheff-App/1.0'
        }
      }
    );

    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    return {
      address: result.display_name.split(',').slice(0, 2).join(',').trim(),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
  };

  const geocodeAddress = async (address: string): Promise<{address: string, lat: number, lng: number} | null> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Nederland')}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HomeCheff-App/1.0'
        }
      }
    );

    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    return {
      address: result.display_name.split(',').slice(0, 3).join(',').trim(),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
  };

  const handleSuggestionClick = (suggestion: {address: string, lat: number, lng: number}) => {
    setInput(suggestion.address);
    setShowSuggestions(false);
    onLocationSelect({ lat: suggestion.lat, lng: suggestion.lng }, suggestion.address);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-lg placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {isGeocoding && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
        {!isGeocoding && input && (
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">{suggestion.address}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
