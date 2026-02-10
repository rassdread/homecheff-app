// Global geocoding system for worldwide address lookup
import { calculateDistance } from './geocoding';

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  country: string;
  city: string;
  state?: string;
  error?: string;
  source: 'PDOK' | 'GoogleMaps' | 'Manual';
}

export interface CountryConfig {
  code: string;
  name: string;
  region: string;
  geocodingService: 'PDOK' | 'GoogleMaps' | 'Manual';
  postcodePattern?: RegExp;
  addressFormat: 'postcode_house' | 'street_city' | 'full_address';
  priority: number; // 1 = highest priority
}

// Country configurations with optimal geocoding services
export const COUNTRY_CONFIGS: CountryConfig[] = [
  // Tier 1: Official APIs (most accurate)
  { code: 'NL', name: 'Nederland / Netherlands', region: 'Europe', geocodingService: 'PDOK', postcodePattern: /^\d{4}[A-Z]{2}$/, addressFormat: 'postcode_house', priority: 1 },
  
  // Tier 2: Caribbean/Suriname (free, good quality)
  { code: 'CW', name: 'Curaçao', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'AW', name: 'Aruba', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'SX', name: 'Sint Maarten', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'SR', name: 'Suriname', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  
  // Tier 3: Major countries (paid, best quality)
  { code: 'US', name: 'Verenigde Staten / United States', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'CA', name: 'Canada', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'GB', name: 'Verenigd Koninkrijk / United Kingdom', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'DE', name: 'Duitsland / Germany', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'FR', name: 'Frankrijk / France', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'ES', name: 'Spanje / Spain', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'IT', name: 'Italië / Italy', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'AU', name: 'Australië / Australia', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'NZ', name: 'Nieuw-Zeeland / New Zealand', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'FJ', name: 'Fiji', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'PG', name: 'Papoea-Nieuw-Guinea / Papua New Guinea', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SB', name: 'Salomonseilanden / Solomon Islands', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'TO', name: 'Tonga', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'WS', name: 'Samoa', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'VU', name: 'Vanuatu', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'KI', name: 'Kiribati', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'NR', name: 'Nauru', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'PW', name: 'Palau', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'FM', name: 'Micronesië / Micronesia', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'MH', name: 'Marshalleilanden / Marshall Islands', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'NC', name: 'Nieuw-Caledonië / New Caledonia', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'PF', name: 'Frans-Polynesië / French Polynesia', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  
  // Tier 4: English-speaking and popular Asian countries
  { code: 'SG', name: 'Singapore', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'HK', name: 'Hong Kong', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'MY', name: 'Maleisië / Malaysia', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'PH', name: 'Filipijnen / Philippines', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'TH', name: 'Thailand', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'ID', name: 'Indonesië / Indonesia', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'IN', name: 'India', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'PK', name: 'Pakistan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BD', name: 'Bangladesh', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'LK', name: 'Sri Lanka', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BN', name: 'Brunei', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'VN', name: 'Vietnam', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 4 },
  { code: 'TW', name: 'Taiwan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 4 },
  { code: 'JP', name: 'Japan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'KR', name: 'Zuid-Korea / South Korea', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'CN', name: 'China', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'AF', name: 'Afghanistan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'AM', name: 'Armenië / Armenia', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'AZ', name: 'Azerbeidzjan / Azerbaijan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BT', name: 'Bhutan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'KH', name: 'Cambodja / Cambodia', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GE', name: 'Georgië / Georgia', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'KZ', name: 'Kazachstan / Kazakhstan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'KG', name: 'Kirgizië / Kyrgyzstan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'LA', name: 'Laos', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'MN', name: 'Mongolië / Mongolia', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'MM', name: 'Myanmar', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'NP', name: 'Nepal', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'KP', name: 'Noord-Korea / North Korea', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'UZ', name: 'Oezbekistan / Uzbekistan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'TJ', name: 'Tadzjikistan / Tajikistan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'TM', name: 'Turkmenistan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  
  // Middle East / West Asia (complete list)
  { code: 'AE', name: 'Verenigde Arabische Emiraten / United Arab Emirates', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 3 },
  { code: 'SA', name: 'Saudi-Arabië / Saudi Arabia', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'QA', name: 'Qatar', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'KW', name: 'Koeweit / Kuwait', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BH', name: 'Bahrein / Bahrain', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'OM', name: 'Oman', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'IL', name: 'Israël / Israel', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'JO', name: 'Jordanië / Jordan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'LB', name: 'Libanon / Lebanon', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'TR', name: 'Turkije / Turkey', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'IR', name: 'Iran', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'IQ', name: 'Irak / Iraq', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'YE', name: 'Jemen / Yemen', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'PS', name: 'Palestina / Palestine', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SY', name: 'Syrië / Syria', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  
  // Tier 5: Other countries (Google Maps)
  { code: 'BE', name: 'België', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CH', name: 'Zwitserland', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'AT', name: 'Oostenrijk', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SE', name: 'Zweden', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'NO', name: 'Noorwegen', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'DK', name: 'Denemarken', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'FI', name: 'Finland', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'PL', name: 'Polen', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CZ', name: 'Tsjechië', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'HU', name: 'Hongarije', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'RO', name: 'Roemenië', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BG', name: 'Bulgarije', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'HR', name: 'Kroatië', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SI', name: 'Slovenië', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SK', name: 'Slowakije', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'LT', name: 'Litouwen', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'LV', name: 'Letland', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'EE', name: 'Estland', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'IE', name: 'Ierland', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'PT', name: 'Portugal', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GR', name: 'Griekenland', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CY', name: 'Cyprus', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'MT', name: 'Malta', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'LU', name: 'Luxemburg', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  
  // African countries (complete list)
  { code: 'ZA', name: 'Zuid-Afrika / South Africa', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'NG', name: 'Nigeria', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'KE', name: 'Kenia / Kenya', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'EG', name: 'Egypte / Egypt', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'MA', name: 'Marokko / Morocco', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'TN', name: 'Tunesië / Tunisia', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'DZ', name: 'Algerije / Algeria', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GH', name: 'Ghana', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'ET', name: 'Ethiopië / Ethiopia', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'UG', name: 'Oeganda / Uganda', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'TZ', name: 'Tanzania', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'RW', name: 'Rwanda', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BW', name: 'Botswana', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'NA', name: 'Namibië / Namibia', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'ZM', name: 'Zambia', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'ZW', name: 'Zimbabwe', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'MW', name: 'Malawi', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'MZ', name: 'Mozambique', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'MG', name: 'Madagaskar / Madagascar', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'MU', name: 'Mauritius', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SC', name: 'Seychellen / Seychelles', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'RE', name: 'Réunion', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'YT', name: 'Mayotte', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SN', name: 'Senegal', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CI', name: 'Ivoorkust / Ivory Coast', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CM', name: 'Kameroen / Cameroon', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'AO', name: 'Angola', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CD', name: 'Congo-Kinshasa / DR Congo', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SD', name: 'Soedan / Sudan', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'LY', name: 'Libië / Libya', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'TD', name: 'Tsjaad / Chad', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'NE', name: 'Niger', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'ML', name: 'Mali', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BF', name: 'Burkina Faso', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GN', name: 'Guinee / Guinea', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SL', name: 'Sierra Leone', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'LR', name: 'Liberia', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'TG', name: 'Togo', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BJ', name: 'Benin', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GA', name: 'Gabon', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GQ', name: 'Equatoriaal-Guinea / Equatorial Guinea', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CF', name: 'Centraal-Afrikaanse Republiek / Central African Republic', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CG', name: 'Congo-Brazzaville / Republic of the Congo', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BI', name: 'Burundi', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'DJ', name: 'Djibouti', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'ER', name: 'Eritrea', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SO', name: 'Somalië / Somalia', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SS', name: 'Zuid-Soedan / South Sudan', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'MR', name: 'Mauritanië / Mauritania', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GM', name: 'Gambia', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GW', name: 'Guinee-Bissau / Guinea-Bissau', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CV', name: 'Kaapverdië / Cape Verde', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'KM', name: 'Comoren / Comoros', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'ST', name: 'São Tomé en Príncipe', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'LS', name: 'Lesotho', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SZ', name: 'Eswatini / Swaziland', region: 'Africa', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  
  // South American countries (complete)
  { code: 'BR', name: 'Brazilië', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'AR', name: 'Argentinië', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CL', name: 'Chili', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CO', name: 'Colombia', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'PE', name: 'Peru', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'VE', name: 'Venezuela', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'EC', name: 'Ecuador', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BO', name: 'Bolivia', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'PY', name: 'Paraguay', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'UY', name: 'Uruguay', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GY', name: 'Guyana', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GF', name: 'Frans-Guyana', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'FK', name: 'Falklandeilanden', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GS', name: 'Zuid-Georgia en de Zuidelijke Sandwicheilanden', region: 'South America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  
  // Central American countries
  { code: 'MX', name: 'Mexico', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'GT', name: 'Guatemala', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BZ', name: 'Belize', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'SV', name: 'El Salvador', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'HN', name: 'Honduras', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'NI', name: 'Nicaragua', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'CR', name: 'Costa Rica', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'PA', name: 'Panama', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  
  // Caribbean countries (complete list)
  { code: 'JM', name: 'Jamaica', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'TT', name: 'Trinidad en Tobago', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'BB', name: 'Barbados', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'BS', name: 'Bahamas', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'CU', name: 'Cuba', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'DO', name: 'Dominicaanse Republiek', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'HT', name: 'Haïti', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'PR', name: 'Puerto Rico', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'VI', name: 'Amerikaanse Maagdeneilanden', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'VG', name: 'Britse Maagdeneilanden', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'AG', name: 'Antigua en Barbuda', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'DM', name: 'Dominica', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'GD', name: 'Grenada', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'KN', name: 'Saint Kitts en Nevis', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'LC', name: 'Saint Lucia', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'VC', name: 'Saint Vincent en de Grenadines', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'BQ', name: 'Bonaire, Sint Eustatius en Saba', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'AI', name: 'Anguilla', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'TC', name: 'Turks en Caicoseilanden', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'KY', name: 'Caymaneilanden', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'MS', name: 'Montserrat', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'MF', name: 'Saint-Martin', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'GP', name: 'Guadeloupe', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'MQ', name: 'Martinique', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  { code: 'BL', name: 'Saint-Barthélemy', region: 'Caribbean', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 2 },
  
  // Additional North American countries/territories
  { code: 'GL', name: 'Groenland', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'PM', name: 'Saint-Pierre en Miquelon', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
  { code: 'BM', name: 'Bermuda', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'street_city', priority: 4 },
];

export function getCountryConfig(countryCode: string): CountryConfig | undefined {
  return COUNTRY_CONFIGS.find(country => country.code === countryCode);
}

export function getCountriesByRegion() {
  const regions = COUNTRY_CONFIGS.reduce((acc, country) => {
    if (!acc[country.region]) {
      acc[country.region] = [];
    }
    acc[country.region].push(country);
    return acc;
  }, {} as Record<string, CountryConfig[]>);

  return regions;
}

export function isCaribbeanCountry(countryCode: string): boolean {
  const country = getCountryConfig(countryCode);
  return country?.region === 'Caribbean' || country?.region === 'South America';
}

export function hasFreeGeocoding(countryCode: string): boolean {
  const country = getCountryConfig(countryCode);
  return country?.geocodingService === 'PDOK';
}

// Google Maps Geocoding API
export async function geocodeWithGoogleMaps(
  address: string,
  city: string,
  countryCode: string,
  apiKey: string
): Promise<GeocodeResult> {
  try {
    // Build query: address, city, country
    // Google Maps Geocoding API can handle various address formats
    const query = `${address}, ${city}, ${countryCode}`.trim();
    
    // Use region biasing for better results (e.g., 'nl' for Netherlands)
    const region = countryCode.toLowerCase();
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=${region}&key=${apiKey}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Log Google API response for debugging
    if (data.status !== 'OK') {
      console.error('Google Maps API response:', {
        status: data.status,
        error_message: data.error_message,
        url: url.replace(apiKey, 'HIDDEN')
      });
    }
    
    // Handle different response statuses
    if (data.status === 'ZERO_RESULTS') {
      return {
        lat: 0,
        lng: 0,
        formatted_address: '',
        country: countryCode,
        city: city,
        source: 'GoogleMaps',
        error: 'Adres niet gevonden op Google Maps. Controleer of het adres correct is ingevoerd.'
      };
    }
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      // Extract the exact error message from Google
      const errorMsg = data.error_message || data.status || 'Adres niet gevonden';
      
      // Log full error details
      console.error('Google Maps Geocoding API error:', {
        status: data.status,
        error_message: data.error_message,
        errors: data.errors
      });
      
      return {
        lat: 0,
        lng: 0,
        formatted_address: '',
        country: countryCode,
        city: city,
        source: 'GoogleMaps',
        error: errorMsg
      };
    }

    // Use the first (most relevant) result
    const result = data.results[0];
    const location = result.geometry.location;
    const addressComponents = result.address_components || [];
    
    // Extract address components
    const countryComponent = addressComponents.find((comp: any) => comp.types.includes('country'));
    const cityComponent = addressComponents.find((comp: any) => 
      comp.types.includes('locality') || 
      comp.types.includes('postal_town') ||
      comp.types.includes('administrative_area_level_2')
    );
    const stateComponent = addressComponents.find((comp: any) => 
      comp.types.includes('administrative_area_level_1')
    );
    const streetComponent = addressComponents.find((comp: any) => 
      comp.types.includes('route') || comp.types.includes('street_address')
    );
    const streetNumberComponent = addressComponents.find((comp: any) => 
      comp.types.includes('street_number')
    );

    // Build formatted address if not provided
    let formattedAddress = result.formatted_address;
    if (!formattedAddress && streetComponent) {
      formattedAddress = `${streetComponent.long_name}${streetNumberComponent ? ' ' + streetNumberComponent.long_name : ''}, ${cityComponent?.long_name || city}`;
    }

    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: formattedAddress || `${address}, ${city}`,
      country: countryComponent?.short_name || countryCode,
      city: cityComponent?.long_name || city,
      state: stateComponent?.long_name,
      source: 'GoogleMaps'
    };

  } catch (error) {
    console.error('Google Maps geocoding error:', error);
    return {
      lat: 0,
      lng: 0,
      formatted_address: '',
      country: countryCode,
      city: city,
      source: 'GoogleMaps',
      error: error instanceof Error ? error.message : 'Google Maps geocoding mislukt'
    };
  }
}

// Main geocoding function
export async function geocodeAddress(
  address: string,
  city: string,
  countryCode: string,
  googleMapsApiKey?: string
): Promise<GeocodeResult> {
  const country = getCountryConfig(countryCode);
  
  // Use Google Maps API for all countries (including Netherlands)
  // This ensures worldwide coverage via Google Maps for all countries
  const apiKey = googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return {
      lat: 0,
      lng: 0,
      formatted_address: '',
      country: countryCode,
      city: city,
      source: 'Manual',
      error: 'Google Maps API key is required for geocoding. Please configure GOOGLE_MAPS_API_KEY.'
    };
  }

  // Use Google Maps for all addresses (worldwide coverage including Netherlands)
  const googleResult = await geocodeWithGoogleMaps(address, city, countryCode, apiKey);
  return googleResult;
}

// Calculate distance between two addresses
export function calculateDistanceBetweenAddresses(
  address1: { lat: number; lng: number },
  address2: { lat: number; lng: number }
): number {
  if (!address1.lat || !address1.lng || !address2.lat || !address2.lng) {
    return 0;
  }

  return calculateDistance(address1.lat, address1.lng, address2.lat, address2.lng);
}

// Get address format for UI
export function getAddressFormat(countryCode: string): 'postcode_house' | 'street_city' | 'full_address' {
  const country = getCountryConfig(countryCode);
  return country?.addressFormat || 'street_city';
}

// Check if postcode is valid for country
export function isValidPostcode(postcode: string, countryCode: string): boolean {
  const country = getCountryConfig(countryCode);
  if (!country?.postcodePattern) return true; // No validation if no pattern
  
  return country.postcodePattern.test(postcode);
}

