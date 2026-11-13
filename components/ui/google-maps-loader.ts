/**
 * Official Maps JavaScript bootstrap.
 * A script tag inserted by hand makes Google report NotLoadingAPIFromGoogleMapsError
 * and the Places library never starts. Both address fields share this one load.
 */
let placesLibrary: Promise<GooglePlacesLibrary> | null = null;

type PlacePrediction = {
  text?: { text?: string } | string;
  placeId?: string;
  toPlace: () => GooglePlace;
};

type GooglePlace = {
  id?: string;
  formattedAddress?: string;
  location?: { lat: () => number; lng: () => number };
  addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
  fetchFields: (request: { fields: string[] }) => Promise<void>;
};

export type GooglePlacesLibrary = {
  AutocompleteSuggestion?: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      includedRegionCodes?: string[];
      includedPrimaryTypes?: string[];
    }) => Promise<{ suggestions: Array<{ placePrediction?: PlacePrediction | null }> }>;
  };
};

declare global {
  interface Window {
    google?: {
      maps?: {
        importLibrary?: (name: string) => Promise<GooglePlacesLibrary>;
      };
    };
  }
}

function installBootstrap(apiKey: string) {
  if (window.google?.maps?.importLibrary) return;
  const options: Record<string, string> = { key: apiKey, v: 'weekly', language: 'nl' };
  ((g: Record<string, string>) => {
    const googleName = 'google';
    const importName = 'importLibrary';
    const callbackName = '__ib__';
    const root = window as unknown as Record<string, Record<string, unknown>>;
    const googleNamespace = (root[googleName] ||= {});
    const maps = (googleNamespace.maps ||= {}) as Record<string, unknown> & {
      importLibrary?: (name: string) => Promise<GooglePlacesLibrary>;
    };
    if (typeof maps.importLibrary === 'function') return;
    const requested = new Set<string>();
    const params = new URLSearchParams();
    let loading: Promise<void> | null = null;
    const load = () => loading ||= new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      params.set('libraries', [...requested].join(','));
      for (const name of Object.keys(g)) {
        params.set(name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), g[name]);
      }
      params.set('callback', `${googleName}.maps.${callbackName}`);
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      (maps as Record<string, unknown>)[callbackName] = resolve;
      script.onerror = () => {
        loading = null;
        reject(new Error('Google Maps kon niet worden geladen.'));
      };
      document.head.appendChild(script);
    });
    maps.importLibrary = (library: string) => {
      requested.add(library);
      return load().then(() => (maps.importLibrary as (name: string) => Promise<GooglePlacesLibrary>)(library));
    };
  })(options);
}

export function loadGooglePlaces(apiKey: string): Promise<GooglePlacesLibrary> {
  if (!placesLibrary) {
    placesLibrary = (async () => {
      installBootstrap(apiKey);
      const imported = await window.google?.maps?.importLibrary?.('places');
      if (!imported?.AutocompleteSuggestion) {
        throw new Error('Google Maps kon dit adres niet bevestigen.');
      }
      return imported;
    })().catch((error) => {
      placesLibrary = null;
      throw error;
    });
  }
  return placesLibrary;
}

export async function fetchAddressPredictions(
  library: GooglePlacesLibrary,
  input: string,
  country: string,
) {
  const request = {
    input,
    includedRegionCodes: country ? [country.toLowerCase()] : undefined,
    includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
  };
  const result = await library.AutocompleteSuggestion?.fetchAutocompleteSuggestions(request);
  return (result?.suggestions || [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is PlacePrediction => Boolean(prediction?.toPlace))
    .slice(0, 5)
    .map((prediction) => ({
      placeId: String(prediction.placeId || ''),
      description: typeof prediction.text === 'string' ? prediction.text : String(prediction.text?.text || ''),
      toPlace: () => prediction.toPlace(),
    }))
    .filter((item) => item.placeId && item.description);
}

export async function placePredictionToLegacy(prediction: { toPlace: () => GooglePlace }) {
  const place = prediction.toPlace();
  await place.fetchFields({ fields: ['id', 'formattedAddress', 'location', 'addressComponents'] });
  const lat = place.location?.lat();
  const lng = place.location?.lng();
  return {
    place_id: place.id,
    formatted_address: place.formattedAddress,
    geometry: { location: { lat, lng } },
    address_components: (place.addressComponents || []).map((component) => ({
      long_name: component.longText,
      short_name: component.shortText,
      types: component.types,
    })),
  };
}
