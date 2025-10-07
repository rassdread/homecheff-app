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

    // Use PDOK API with correct query format
    // Format: "postcode huisnummer" (with space between)
    const query = `${cleanPostcode} ${cleanHuisnummer}`;
    
    const response = await fetch(
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?q=${encodeURIComponent(query)}&fq=type:adres&fl=weergavenaam,straatnaam,woonplaatsnaam,postcode,huisnummer,huisletter,huisnummertoevoeging,adresseerbaarobject_id,centroide_ll&rows=1`,
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
    
    // Extract coordinates from centroide_ll (format: "POINT(lng lat)")
    const pointMatch = result.centroide_ll?.match(/POINT\(([^)]+)\)/);
    if (!pointMatch) {
      return {
        error: true,
        message: 'Coördinaten niet beschikbaar voor dit adres.'
      };
    }
    
    const coordinates = pointMatch[1].split(' ');
    const lng = parseFloat(coordinates[0]);
    const lat = parseFloat(coordinates[1]);

    if (isNaN(lat) || isNaN(lng)) {
      return {
        error: true,
        message: 'Coördinaten niet beschikbaar voor dit adres.'
      };
    }

    // Format postcode with space
    const formattedPostcode = cleanPostcode.replace(/(\d{4})([A-Z]{2})/, '$1 $2');
    
    // Build formatted address
    const formattedAddress = `${result.straatnaam} ${result.huisnummer}, ${formattedPostcode} ${result.woonplaatsnaam}`;

    return {
      postcode: formattedPostcode,
      huisnummer: result.huisnummer,
      straatnaam: result.straatnaam,
      plaats: result.woonplaatsnaam,
      provincie: 'Nederland', // PDOK doesn't provide province in this response
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
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=nl&limit=1&addressdetails=1&extratags=1`,
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
    const address = result.address || {};
    
    // Format postcode with space
    const formattedPostcode = cleanPostcode.replace(/(\d{4})([A-Z]{2})/, '$1 $2');
    
    // Build formatted address
    const straatnaam = address.road || address.street || 'Onbekend';
    const plaats = address.city || address.town || address.village || 'Onbekend';
    const formattedAddress = `${straatnaam} ${cleanHuisnummer}, ${formattedPostcode} ${plaats}`;
    
    return {
      postcode: formattedPostcode,
      huisnummer: cleanHuisnummer,
      straatnaam: straatnaam,
      plaats: plaats,
      provincie: address.state || 'Onbekend',
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: formattedAddress
    };

  } catch (error) {
    console.error('Fallback geocoding error:', error);
    return {
      error: true,
      message: 'Adres lookup mislukt'
    };
  }
}

// Main function that uses OpenStreetMap Nominatim for Dutch addresses
export async function geocodeDutchAddressWithFallback(
  postcode: string,
  huisnummer: string
): Promise<DutchAddress | DutchGeocodingError> {
  // Use OpenStreetMap Nominatim for Dutch addresses (more reliable than PDOK)
  return await geocodeDutchAddress(postcode, huisnummer);
}
