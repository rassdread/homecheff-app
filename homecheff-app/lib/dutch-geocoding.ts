// Dutch geocoding service using PDOK (Publieke Dienstverlening Op de Kaart)
// This is the official Dutch government service for address lookups

export interface DutchAddress {
  postcode: string;
  huisnummer: string;
  straatnaam: string;
  plaats: string;
  provincie: string;
  lat: number;
  lng: number;
  formatted_address: string;
}

export interface DutchGeocodingError {
  error: true;
  message: string;
}

export async function geocodeDutchAddress(
  postcode: string,
  huisnummer: string
): Promise<DutchAddress | DutchGeocodingError> {
  try {
    // Clean postcode (remove spaces, convert to uppercase)
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
    
    // Validate Dutch postcode format (1234AB)
    if (!/^\d{4}[A-Z]{2}$/.test(cleanPostcode)) {
      return {
        error: true,
        message: 'Ongeldige postcode. Gebruik formaat: 1234AB'
      };
    }

    // Validate huisnummer
    const cleanHuisnummer = huisnummer.trim();
    if (!cleanHuisnummer || isNaN(Number(cleanHuisnummer))) {
      return {
        error: true,
        message: 'Ongeldig huisnummer. Voer een nummer in.'
      };
    }

    console.log(`Geocoding Dutch address: ${cleanPostcode} ${cleanHuisnummer}`);

    // Use PDOK API for Dutch addresses
    const response = await fetch(
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?fq=postcode:${cleanPostcode}&fq=huisnummer:${cleanHuisnummer}&fl=*&rows=1`,
      {
        headers: {
          'User-Agent': 'HomeCheff-App/1.0'
        }
      }
    );

    if (!response.ok) {
      console.error(`PDOK API error: ${response.status} ${response.statusText}`);
      return {
        error: true,
        message: `Adres lookup mislukt: ${response.statusText}`
      };
    }

    const data = await response.json();

    if (!data.response || data.response.numFound === 0) {
      return {
        error: true,
        message: 'Adres niet gevonden. Controleer postcode en huisnummer.'
      };
    }

    const result = data.response.docs[0];
    
    // Extract coordinates
    const coordinates = result.centroide_ll?.split(' ') || [];
    const lat = parseFloat(coordinates[1]);
    const lng = parseFloat(coordinates[0]);

    if (isNaN(lat) || isNaN(lng)) {
      return {
        error: true,
        message: 'Coördinaten niet beschikbaar voor dit adres.'
      };
    }

    // Build formatted address
    const formattedAddress = `${result.straatnaam} ${result.huisnummer}, ${result.postcode} ${result.woonplaats}`;

    return {
      postcode: result.postcode,
      huisnummer: result.huisnummer,
      straatnaam: result.straatnaam,
      plaats: result.woonplaats,
      provincie: result.provincie,
      lat: lat,
      lng: lng,
      formatted_address: formattedAddress
    };

  } catch (error) {
    console.error('Dutch geocoding error:', error);
    return {
      error: true,
      message: 'Er is een fout opgetreden bij het opzoeken van het adres.'
    };
  }
}

// Alternative using OpenStreetMap Nominatim (fallback)
export async function geocodeDutchAddressFallback(
  postcode: string,
  huisnummer: string
): Promise<DutchAddress | DutchGeocodingError> {
  try {
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
    const cleanHuisnummer = huisnummer.trim();
    
    const query = `${cleanHuisnummer}, ${cleanPostcode}, Nederland`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=nl&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HomeCheff-App/1.0'
        }
      }
    );

    if (!response.ok) {
      return {
        error: true,
        message: 'Adres lookup mislukt'
      };
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return {
        error: true,
        message: 'Adres niet gevonden'
      };
    }

    const result = data[0];
    
    return {
      postcode: cleanPostcode,
      huisnummer: cleanHuisnummer,
      straatnaam: result.address?.road || 'Onbekend',
      plaats: result.address?.city || result.address?.town || 'Onbekend',
      provincie: result.address?.state || 'Onbekend',
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: result.display_name
    };

  } catch (error) {
    console.error('Fallback geocoding error:', error);
    return {
      error: true,
      message: 'Adres lookup mislukt'
    };
  }
}

// Main function that tries PDOK first, then fallback
export async function geocodeDutchAddressWithFallback(
  postcode: string,
  huisnummer: string
): Promise<DutchAddress | DutchGeocodingError> {
  // Try PDOK first (most accurate for Dutch addresses)
  const pdokResult = await geocodeDutchAddress(postcode, huisnummer);
  
  if (!('error' in pdokResult)) {
    return pdokResult;
  }

  console.log('PDOK failed, trying fallback...');
  
  // Try OpenStreetMap as fallback
  return await geocodeDutchAddressFallback(postcode, huisnummer);
}
