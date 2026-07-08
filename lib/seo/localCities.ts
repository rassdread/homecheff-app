/**
 * Vaste steden voor lokale SEO (sitemap + statische params + ecosystem hubs).
 * Coördinaten zijn publieke stadscentra (ca.), geen gebruikerslocaties.
 */
export type LocalSeoCity = {
  slug: string;
  label: string;
  /** Breedtegraad stadscentrum (WGS84) */
  lat: number;
  /** Lengtegraad stadscentrum (WGS84) */
  lng: number;
};

export const LOCAL_SEO_CITIES: ReadonlyArray<LocalSeoCity> = [
  { slug: 'vlaardingen', label: 'Vlaardingen', lat: 51.912, lng: 4.3417 },
  { slug: 'rotterdam', label: 'Rotterdam', lat: 51.9244, lng: 4.4777 },
  { slug: 'amsterdam', label: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { slug: 'den-haag', label: 'Den Haag', lat: 52.0705, lng: 4.3007 },
  { slug: 'utrecht', label: 'Utrecht', lat: 52.0907, lng: 5.1214 },
  { slug: 'eindhoven', label: 'Eindhoven', lat: 51.4416, lng: 5.4697 },
  { slug: 'groningen', label: 'Groningen', lat: 53.2194, lng: 6.5665 },
  { slug: 'tilburg', label: 'Tilburg', lat: 51.5555, lng: 5.0913 },
  { slug: 'almere', label: 'Almere', lat: 52.3508, lng: 5.2647 },
  { slug: 'breda', label: 'Breda', lat: 51.5719, lng: 4.7683 },
  { slug: 'nijmegen', label: 'Nijmegen', lat: 51.8426, lng: 5.8549 },
  { slug: 'apeldoorn', label: 'Apeldoorn', lat: 52.2112, lng: 5.9699 },
  { slug: 'haarlem', label: 'Haarlem', lat: 52.3874, lng: 4.6464 },
  { slug: 'arnhem', label: 'Arnhem', lat: 51.9851, lng: 5.8987 },
  { slug: 'enschede', label: 'Enschede', lat: 52.2215, lng: 6.8937 },
  { slug: 'amersfoort', label: 'Amersfoort', lat: 52.1561, lng: 5.3878 },
];
