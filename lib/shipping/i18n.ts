/**
 * Shipping copy — consumes EcosystemLanguage from the site-wide resolver.
 * Do not invent a parallel country→language map; use resolveEcosystemLanguage /
 * languageFromCountryCode from lib/ecosystem-locale.ts.
 */

import type { EcosystemLanguage } from '@/lib/ecosystem-locale';
import type { InternalShipmentStatus } from '@/lib/shipping/status-map';

export type ShippingLocale = EcosystemLanguage;

const STATUS_NL: Record<InternalShipmentStatus, string> = {
  PENDING: 'Verzending wordt voorbereid',
  CREATED: 'Verzendlabel aangemaakt',
  PRINTED: 'Label afgedrukt',
  SCANNED: 'Pakket ontvangen door vervoerder',
  IN_TRANSIT: 'Onderweg',
  PICKUP_POINT: 'Klaar bij afhaalpunt',
  DELIVERED: 'Bezorgd',
  ACTION_REQUIRED: 'Actie nodig',
  CANCELED: 'Verzending geannuleerd',
  ERROR: 'Probleem met verzending',
  UNKNOWN: 'Status wordt bijgewerkt',
};

const STATUS_EN: Record<InternalShipmentStatus, string> = {
  PENDING: 'Preparing shipment',
  CREATED: 'Shipping label created',
  PRINTED: 'Label printed',
  SCANNED: 'Parcel received by carrier',
  IN_TRANSIT: 'In transit',
  PICKUP_POINT: 'Ready for pickup',
  DELIVERED: 'Delivered',
  ACTION_REQUIRED: 'Action required',
  CANCELED: 'Shipment cancelled',
  ERROR: 'Shipping problem',
  UNKNOWN: 'Updating shipment status',
};

export function shippingStatusLabel(
  internal: InternalShipmentStatus,
  locale: ShippingLocale,
): string {
  return (locale === 'en' ? STATUS_EN : STATUS_NL)[internal];
}

export type ShippingUiCopy = {
  title: string;
  autoCalc: string;
  noPriceToSet: string;
  sizeQuestion: string;
  sizeHint: string;
  selected: string;
  priceAtCheckout: string;
  exactSize: string;
  domestic: string;
  international: string;
  internationalSoon: string;
  internationalHelp: string;
  packageFormat: string;
  presets: {
    BRIEVENBUS: string;
    KLEIN: string;
    MIDDEL: string;
    GROOT: string;
    CUSTOM: string;
  };
  examples: {
    BRIEVENBUS: string;
    KLEIN: string;
    MIDDEL: string;
    GROOT: string;
    CUSTOM: string;
  };
  weightLabel: string;
  weightHelp: string;
  length: string;
  width: string;
  height: string;
  gram: string;
  presetDisclaimer: string;
  checkoutCalcForAddress: string;
  shippingFee: string;
  chooseMethod: string;
  quoteLoading: string;
  quoteError: string;
  packingThanks: string;
  packingDiscover: string;
  packingCarrierNote: string;
};

const NL: ShippingUiCopy = {
  title: 'Verzenden met EctaroShip',
  autoCalc:
    'De koper betaalt de verzendkosten bij afrekenen. HomeCheff berekent de prijs live op basis van bestemming, pakketformaat en gewicht.',
  noPriceToSet:
    'Je hoeft zelf geen verzendprijs in te stellen. Kies het kleinste formaat waar je product inclusief verpakking in past.',
  sizeQuestion: 'Hoe groot wordt het pakket?',
  sizeHint: 'Kies het kleinste formaat waar je product inclusief verpakking in past.',
  selected: 'Geselecteerd',
  priceAtCheckout: 'Prijs wordt bij afrekenen berekend',
  exactSize: 'Exacte pakketmaat',
  domestic: 'Verzenden binnen Nederland',
  international: 'Internationaal verzenden',
  internationalSoon: 'Internationaal verzenden — binnenkort beschikbaar',
  internationalHelp:
    'Internationale verzending wordt alleen aangeboden als er voor het adres van de koper een beschikbare verzendmethode is.',
  packageFormat: 'Pakketformaat',
  presets: {
    BRIEVENBUS: 'Brievenbuspakket',
    KLEIN: 'Klein pakket',
    MIDDEL: 'Standaard pakket',
    GROOT: 'Groot pakket',
    CUSTOM: 'Eigen formaat',
  },
  examples: {
    BRIEVENBUS: 'Kaarten, platte accessoires, dunne items',
    KLEIN: 'Kleine creaties, accessoires, doosje',
    MIDDEL: 'Kleding, cadeaus, middelgrote producten',
    GROOT: 'Grotere creaties en dozen',
    CUSTOM: 'Zelf maten invullen',
  },
  weightLabel: 'Pakketgewicht',
  weightHelp: 'Weeg het product inclusief verpakking zo nauwkeurig mogelijk.',
  length: 'Lengte (cm)',
  width: 'Breedte (cm)',
  height: 'Hoogte (cm)',
  gram: 'gram',
  presetDisclaimer:
    'Indicatieafmetingen helpen bij de keuze — beschikbare vervoerders en prijzen worden live berekend bij checkout.',
  checkoutCalcForAddress: 'Verzendkosten worden berekend voor jouw adres.',
  shippingFee: 'Verzending',
  chooseMethod: 'Kies een verzendmethode',
  quoteLoading: 'Verzendprijs berekenen…',
  quoteError: 'Kon verzendopties niet ophalen. Probeer het opnieuw.',
  packingThanks: 'Bedankt dat je lokaal koopt.',
  packingDiscover: 'Ontdek wat er bij jou in de buurt wordt gemaakt.',
  packingCarrierNote:
    'Dit is een HomeCheff-pakbon. De officiële vervoerderslabel (barcode) blijft ongewijzigd en apart.',
};

const EN: ShippingUiCopy = {
  title: 'Ship with EctaroShip',
  autoCalc:
    'The buyer pays shipping at checkout. HomeCheff calculates the price live from destination, package size and weight.',
  noPriceToSet:
    'You do not set a shipping price. Pick the smallest size your product including packaging fits in.',
  sizeQuestion: 'How large is the package?',
  sizeHint: 'Choose the smallest size your product including packaging fits in.',
  selected: 'Selected',
  priceAtCheckout: 'Price calculated at checkout',
  exactSize: 'Exact package size',
  domestic: 'Ship within the Netherlands',
  international: 'International shipping',
  internationalSoon: 'International shipping — coming soon',
  internationalHelp:
    "International shipping is only offered when a shipping method is available for the buyer's destination.",
  packageFormat: 'Package size',
  presets: {
    BRIEVENBUS: 'Mailbox parcel',
    KLEIN: 'Small parcel',
    MIDDEL: 'Standard parcel',
    GROOT: 'Large parcel',
    CUSTOM: 'Custom size',
  },
  examples: {
    BRIEVENBUS: 'Cards, flat accessories, thin items',
    KLEIN: 'Small creations, accessories, small box',
    MIDDEL: 'Clothing, gifts, medium-sized products',
    GROOT: 'Larger creations and boxes',
    CUSTOM: 'Enter your own dimensions',
  },
  weightLabel: 'Parcel weight',
  weightHelp: 'Weigh the product including packaging as accurately as possible.',
  length: 'Length (cm)',
  width: 'Width (cm)',
  height: 'Height (cm)',
  gram: 'grams',
  presetDisclaimer:
    'Indicative sizes help you choose — available carriers and prices are calculated live at checkout.',
  checkoutCalcForAddress: 'Shipping costs are calculated for your address.',
  shippingFee: 'Shipping',
  chooseMethod: 'Choose a shipping method',
  quoteLoading: 'Calculating shipping…',
  quoteError: 'Could not load shipping options. Please try again.',
  packingThanks: 'Thank you for supporting local creators.',
  packingDiscover: 'Discover what people near you are making.',
  packingCarrierNote:
    'This is a HomeCheff packing slip. The official carrier label (barcode) remains unmodified and separate.',
};

export function getShippingUiCopy(locale: ShippingLocale): ShippingUiCopy {
  return locale === 'en' ? EN : NL;
}
