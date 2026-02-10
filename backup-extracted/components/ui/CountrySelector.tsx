'use client';

import { useState } from 'react';
import { ChevronDown, Globe, MapPin } from 'lucide-react';
import { getCountriesByRegion, COUNTRY_CONFIGS } from '@/lib/global-geocoding';

interface CountrySelectorProps {
  value: string;
  onChange: (countryCode: string) => void;
  placeholder?: string;
  className?: string;
  showRegion?: boolean;
}

export default function CountrySelector({
  value,
  onChange,
  placeholder = "Selecteer land",
  className = "",
  showRegion = true
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const countriesByRegion = getCountriesByRegion();
  const countriesFlat = COUNTRY_CONFIGS;
  
  // Get current country info
  const currentCountry = countriesFlat.find(c => c.code === value);
  
  // Filter countries based on search
  const filteredCountries = countriesFlat.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (countryCode: string) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-gray-400" />
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {currentCountry ? currentCountry.name : placeholder}
            </div>
            {currentCountry && showRegion && (
              <div className="text-sm text-gray-500">
                {currentCountry.region}
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Zoek land..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Countries List */}
          <div className="max-h-60 overflow-y-auto">
            {searchTerm ? (
              // Show filtered results
              <div className="py-1">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      value === country.code ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{country.name}</div>
                        <div className="text-sm text-gray-500">
                          {country.addressFormat} • {country.region}
                        </div>
                    </div>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    Geen landen gevonden
                  </div>
                )}
              </div>
            ) : (
              // Show grouped results
              Object.entries(countriesByRegion).map(([region, countries]) => (
                <div key={region} className="py-1">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                    {region}
                  </div>
                  {countries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        value === country.code ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{country.name}</div>
                        <div className="text-sm text-gray-500">
                          {country.addressFormat}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
