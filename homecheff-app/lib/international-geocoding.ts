// International geocoding service using OpenStreetMap Nominatim API
// Supports worldwide address lookup and geocoding

export interface InternationalGeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export interface InternationalGeocodingError {
  error: string;
  message: string;
}

// Country-specific address formats and validation
export const COUNTRY_CONFIGS = {
  // Europa
  'NL': {
    name: 'Nederland',
    postcodePattern: /^\d{4}[A-Z]{2}$/,
    postcodeExample: '1234AB',
    addressFormat: 'Straatnaam Huisnummer, Postcode Plaats',
    region: 'Europa'
  },
  'BE': {
    name: 'België',
    postcodePattern: /^\d{4}$/,
    postcodeExample: '1000',
    addressFormat: 'Straatnaam Huisnummer, Postcode Plaats',
    region: 'Europa'
  },
  'DE': {
    name: 'Duitsland',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '10115',
    addressFormat: 'Straße Hausnummer, PLZ Ort',
    region: 'Europa'
  },
  'FR': {
    name: 'Frankrijk',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '75001',
    addressFormat: 'Rue Numéro, Code postal Ville',
    region: 'Europa'
  },
  'GB': {
    name: 'Verenigd Koninkrijk',
    postcodePattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    postcodeExample: 'SW1A 1AA',
    addressFormat: 'Street Number, Postcode City',
    region: 'Europa'
  },
  'ES': {
    name: 'Spanje',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '28001',
    addressFormat: 'Calle Número, Código postal Ciudad',
    region: 'Europa'
  },
  'IT': {
    name: 'Italië',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '00100',
    addressFormat: 'Via Numero, CAP Città',
    region: 'Europa'
  },
  
  // Noord-Amerika
  'US': {
    name: 'Verenigde Staten',
    postcodePattern: /^\d{5}(-\d{4})?$/,
    postcodeExample: '10001',
    addressFormat: 'Street Number, City State ZIP',
    region: 'Noord-Amerika'
  },
  'CA': {
    name: 'Canada',
    postcodePattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
    postcodeExample: 'K1A 0A6',
    addressFormat: 'Street Number, City Province Postal Code',
    region: 'Noord-Amerika'
  },
  'MX': {
    name: 'Mexico',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '01000',
    addressFormat: 'Calle Número, Código postal Ciudad',
    region: 'Noord-Amerika'
  },
  
  // Azië
  'JP': {
    name: 'Japan',
    postcodePattern: /^\d{3}-\d{4}$/,
    postcodeExample: '100-0001',
    addressFormat: '住所番地, 郵便番号 市区町村',
    region: 'Azië'
  },
  'KR': {
    name: 'Zuid-Korea',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '03142',
    addressFormat: '도로명 주소, 우편번호',
    region: 'Azië'
  },
  'CN': {
    name: 'China',
    postcodePattern: /^\d{6}$/,
    postcodeExample: '100000',
    addressFormat: '街道门牌号, 邮政编码 城市',
    region: 'Azië'
  },
  'IN': {
    name: 'India',
    postcodePattern: /^\d{6}$/,
    postcodeExample: '110001',
    addressFormat: 'Street Number, PIN City State',
    region: 'Azië'
  },
  'SG': {
    name: 'Singapore',
    postcodePattern: /^\d{6}$/,
    postcodeExample: '018956',
    addressFormat: 'Street Number, Postal Code',
    region: 'Azië'
  },
  'TH': {
    name: 'Thailand',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '10110',
    addressFormat: 'เลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์',
    region: 'Azië'
  },
  'AU': {
    name: 'Australië',
    postcodePattern: /^\d{4}$/,
    postcodeExample: '2000',
    addressFormat: 'Street Number, Suburb State Postcode',
    region: 'Azië'
  },
  
  // Zuid-Amerika
  'BR': {
    name: 'Brazilië',
    postcodePattern: /^\d{5}-?\d{3}$/,
    postcodeExample: '01310-100',
    addressFormat: 'Rua Número, CEP Cidade Estado',
    region: 'Zuid-Amerika'
  },
  'AR': {
    name: 'Argentinië',
    postcodePattern: /^[A-Z]?\d{4}[A-Z]{3}?$/i,
    postcodeExample: 'C1425',
    addressFormat: 'Calle Número, Código postal Ciudad',
    region: 'Zuid-Amerika'
  },
  'CL': {
    name: 'Chili',
    postcodePattern: /^\d{7}$/,
    postcodeExample: '8320000',
    addressFormat: 'Calle Número, Código postal Ciudad',
    region: 'Zuid-Amerika'
  },
  'CO': {
    name: 'Colombia',
    postcodePattern: /^\d{6}$/,
    postcodeExample: '110111',
    addressFormat: 'Calle Número, Código postal Ciudad',
    region: 'Zuid-Amerika'
  },
  'PE': {
    name: 'Peru',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '15001',
    addressFormat: 'Calle Número, Código postal Ciudad',
    region: 'Zuid-Amerika'
  },
  'SR': {
    name: 'Suriname',
    postcodePattern: /^\d{6}$/,
    postcodeExample: '100001',
    addressFormat: 'Straatnaam Nummer, Postcode Paramaribo',
    region: 'Zuid-Amerika'
  },
  
  // Caribisch Gebied
  'CW': {
    name: 'Curaçao',
    postcodePattern: /^\d{4}$/,
    postcodeExample: '1234',
    addressFormat: 'Straatnaam Nummer, Postcode Willemstad',
    region: 'Caribisch Gebied'
  },
  'AW': {
    name: 'Aruba',
    postcodePattern: /^\d{4}$/,
    postcodeExample: '1234',
    addressFormat: 'Straatnaam Nummer, Postcode Oranjestad',
    region: 'Caribisch Gebied'
  },
  'SX': {
    name: 'Sint Maarten',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Street Number, Postal Code Philipsburg',
    region: 'Caribisch Gebied'
  },
  'BQ': {
    name: 'Caribisch Nederland',
    postcodePattern: /^\d{4}$/,
    postcodeExample: '1234',
    addressFormat: 'Straatnaam Nummer, Postcode',
    region: 'Caribisch Gebied'
  },
  'JM': {
    name: 'Jamaica',
    postcodePattern: /^\d{2}$/,
    postcodeExample: '12',
    addressFormat: 'Street Number, Parish Kingston',
    region: 'Caribisch Gebied'
  },
  'TT': {
    name: 'Trinidad en Tobago',
    postcodePattern: /^\d{6}$/,
    postcodeExample: '123456',
    addressFormat: 'Street Number, Postal Code Port of Spain',
    region: 'Caribisch Gebied'
  },
  'BB': {
    name: 'Barbados',
    postcodePattern: /^BB\d{5}$/i,
    postcodeExample: 'BB12345',
    addressFormat: 'Street Number, Postal Code Bridgetown',
    region: 'Caribisch Gebied'
  },
  'BS': {
    name: 'Bahama\'s',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Street Number, Postal Code Nassau',
    region: 'Caribisch Gebied'
  },
  'CU': {
    name: 'Cuba',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Calle Número, Código postal Ciudad',
    region: 'Caribisch Gebied'
  },
  'DO': {
    name: 'Dominicaanse Republiek',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Calle Número, Código postal Santo Domingo',
    region: 'Caribisch Gebied'
  },
  'HT': {
    name: 'Haïti',
    postcodePattern: /^\d{4}$/,
    postcodeExample: '1234',
    addressFormat: 'Rue Numéro, Code postal Port-au-Prince',
    region: 'Caribisch Gebied'
  },
  'PR': {
    name: 'Puerto Rico',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Street Number, ZIP Code San Juan',
    region: 'Caribisch Gebied'
  },
  'VI': {
    name: 'Amerikaanse Maagdeneilanden',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Street Number, ZIP Code Charlotte Amalie',
    region: 'Caribisch Gebied'
  },
  'VG': {
    name: 'Britse Maagdeneilanden',
    postcodePattern: /^VG\d{4}$/i,
    postcodeExample: 'VG1234',
    addressFormat: 'Street Number, Postal Code Road Town',
    region: 'Caribisch Gebied'
  },
  'AG': {
    name: 'Antigua en Barbuda',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Street Number, Postal Code St. John\'s',
    region: 'Caribisch Gebied'
  },
  'DM': {
    name: 'Dominica',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Street Number, Postal Code Roseau',
    region: 'Caribisch Gebied'
  },
  'GD': {
    name: 'Grenada',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Street Number, Postal Code St. George\'s',
    region: 'Caribisch Gebied'
  },
  'KN': {
    name: 'Saint Kitts en Nevis',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Street Number, Postal Code Basseterre',
    region: 'Caribisch Gebied'
  },
  'LC': {
    name: 'Saint Lucia',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Street Number, Postal Code Castries',
    region: 'Caribisch Gebied'
  },
  'VC': {
    name: 'Saint Vincent en de Grenadines',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '12345',
    addressFormat: 'Street Number, Postal Code Kingstown',
    region: 'Caribisch Gebied'
  },
  
  // Afrika
  'ZA': {
    name: 'Zuid-Afrika',
    postcodePattern: /^\d{4}$/,
    postcodeExample: '8001',
    addressFormat: 'Street Number, Suburb City Postal Code',
    region: 'Afrika'
  },
  'NG': {
    name: 'Nigeria',
    postcodePattern: /^\d{6}$/,
    postcodeExample: '100001',
    addressFormat: 'Street Number, Area City State',
    region: 'Afrika'
  },
  'EG': {
    name: 'Egypte',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '11511',
    addressFormat: 'Street Number, Postal Code City',
    region: 'Afrika'
  },
  'KE': {
    name: 'Kenia',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '00100',
    addressFormat: 'Street Number, Postal Code City',
    region: 'Afrika'
  },
  'MA': {
    name: 'Marokko',
    postcodePattern: /^\d{5}$/,
    postcodeExample: '10000',
    addressFormat: 'Rue Numéro, Code postal Ville',
    region: 'Afrika'
  },
  'GH': {
    name: 'Ghana',
    postcodePattern: /^[A-Z]{2}-\d{4}-[A-Z]$/i,
    postcodeExample: 'GA-123-4567',
    addressFormat: 'Street Number, Postal Code City Region',
    region: 'Afrika'
  }
};

export async function geocodeInternationalAddress(
  address: string,
  city: string,
  postalCode: string,
  country: string = 'NL'
): Promise<InternationalGeocodingResult | InternationalGeocodingError> {
  try {
    // Construct the full address based on country
    let fullAddress: string;
    
    if (country === 'NL') {
      // Use Dutch format
      fullAddress = `${address}, ${postalCode} ${city}, Nederland`;
    } else {
      // Use international format
      const countryName = COUNTRY_CONFIGS[country as keyof typeof COUNTRY_CONFIGS]?.name || country;
      fullAddress = `${address}, ${city}, ${postalCode}, ${countryName}`;
    }
    
    console.log('International geocoding address:', fullAddress);
    
    // Use OpenStreetMap Nominatim API with country restriction
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&countrycodes=${country.toLowerCase()}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HomeCheff-App/1.0',
          'Accept-Language': 'nl,en'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return {
        error: 'NO_RESULTS',
        message: `Geen resultaten gevonden voor dit adres in ${COUNTRY_CONFIGS[country as keyof typeof COUNTRY_CONFIGS]?.name || country}`
      };
    }

    const result = data[0];
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address
    };
  } catch (error) {
    console.error('International geocoding error:', error);
    return {
      error: 'GEOCODING_ERROR',
      message: error instanceof Error ? error.message : 'Onbekende fout bij geocoding'
    };
  }
}

export async function reverseGeocodeInternational(
  lat: number,
  lng: number
): Promise<InternationalGeocodingResult | InternationalGeocodingError> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HomeCheff-App/1.0',
          'Accept-Language': 'nl,en'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.lat || !data.lon) {
      return {
        error: 'NO_RESULTS',
        message: 'Geen resultaten gevonden voor deze coördinaten'
      };
    }

    return {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      display_name: data.display_name,
      address: data.address
    };
  } catch (error) {
    console.error('International reverse geocoding error:', error);
    return {
      error: 'REVERSE_GEOCODING_ERROR',
      message: error instanceof Error ? error.message : 'Onbekende fout bij reverse geocoding'
    };
  }
}

// Validate postal code format for different countries
export function validatePostalCode(postalCode: string, country: string): boolean {
  const config = COUNTRY_CONFIGS[country as keyof typeof COUNTRY_CONFIGS];
  if (!config) return true; // Allow if country not configured
  
  return config.postcodePattern.test(postalCode);
}

// Get country list for dropdown grouped by region
export function getCountryList() {
  const countriesByRegion = Object.entries(COUNTRY_CONFIGS).reduce((acc, [code, config]) => {
    const region = config.region;
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push({
      code,
      name: config.name,
      postcodeExample: config.postcodeExample,
      addressFormat: config.addressFormat
    });
    return acc;
  }, {} as Record<string, any[]>);

  return countriesByRegion;
}

// Get countries as flat list for simple dropdowns
export function getCountryListFlat() {
  return Object.entries(COUNTRY_CONFIGS).map(([code, config]) => ({
    code,
    name: config.name,
    postcodeExample: config.postcodeExample,
    addressFormat: config.addressFormat,
    region: config.region
  }));
}
