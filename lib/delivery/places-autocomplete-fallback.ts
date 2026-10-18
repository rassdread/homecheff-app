/**
 * Google's Places widget replaces the search box with its own error state
 * when the API rejects the request. That must not disable the rest of the form.
 */
const FAILURE_TEXT = [
  /oeps/i,
  /misgegaan/i,
  /oops/i,
  /something went wrong/i,
  /er is iets mis/i,
];

export function isPlacesWidgetFailureText(value: string | null | undefined): boolean {
  if (!value) return false;
  const text = value.trim();
  if (!text) return false;
  return FAILURE_TEXT.some((pattern) => pattern.test(text));
}

export function placesSearchShouldRecover(input: {
  disabled: boolean;
  placeholder?: string | null;
  value?: string | null;
}): boolean {
  return (
    input.disabled ||
    isPlacesWidgetFailureText(input.placeholder) ||
    isPlacesWidgetFailureText(input.value)
  );
}

/** Legacy AutocompleteService statuses that should keep the form usable. */
export function placesPredictionStatusUnavailable(status: string | null | undefined): boolean {
  return status !== 'OK' && status !== 'ZERO_RESULTS';
}

type PlaceComponent = {
  long_name?: string;
  short_name?: string;
  types?: string[];
};

function componentName(
  components: PlaceComponent[],
  type: string,
  short = false,
): string {
  const match = components.find((component) => component.types?.includes(type));
  if (!match) return '';
  return (short ? match.short_name : match.long_name) || '';
}

function readCoordinate(value: number | (() => number) | undefined): number | null {
  const numeric = typeof value === 'function' ? value() : value;
  return typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : null;
}

/**
 * Maps a legacy Places Details result onto the address fields the form already stores.
 * Returns null when the result has no usable coordinates.
 */
export function placeDetailsToAddress(
  place: {
    address_components?: PlaceComponent[];
    formatted_address?: string;
    geometry?: {
      location?: { lat: number | (() => number); lng: number | (() => number) };
    };
  },
  fallbackCountry: string,
): {
  address: string;
  houseNumber: string;
  city: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
  formattedAddress: string;
} | null {
  const lat = readCoordinate(place.geometry?.location?.lat);
  const lng = readCoordinate(place.geometry?.location?.lng);
  if (lat === null || lng === null) return null;

  const components = place.address_components || [];
  const streetNumber = componentName(components, 'street_number');
  const street = componentName(components, 'route');
  const city =
    componentName(components, 'locality') || componentName(components, 'postal_town');
  const postalCode = componentName(components, 'postal_code');
  const country = componentName(components, 'country', true) || fallbackCountry;
  const formattedAddress = place.formatted_address || [street, streetNumber].filter(Boolean).join(' ');

  return {
    address: [street, streetNumber].filter(Boolean).join(' '),
    houseNumber: streetNumber,
    city,
    postalCode,
    country,
    lat,
    lng,
    formattedAddress,
  };
}
