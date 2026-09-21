/**
 * Canonical HomeCheff inventory: Product.stock is remaining sellable units.
 * Pending StockReservation rows overlay availability until expiry or payment.
 */

const WORKSHOP_TAXONOMY_IDS = new Set([
  'knowledge.workshop',
  'knowledge.cookingclass',
  'knowledge.musicclass',
  'knowledge.course',
  'knowledge.training',
]);

export const STOCK_RESERVATION_TTL_MS = 15 * 60 * 1000;

export type StockPatchResult =
  | { kind: 'omit' }
  | { kind: 'set'; value: number }
  | { kind: 'reject'; code: 'STOCK_NEGATIVE' | 'STOCK_INVALID' };

export type ListingInventoryInput = {
  priceModel?: string | null;
  marketplaceCategory?: string | null;
  /** Product.category fallback for pre-taxonomy listings (CHEFF / GROWN / DESIGNER). */
  productCategory?: string | null;
  fulfillmentOptions?: {
    digital?: boolean | null;
    pickup?: boolean | null;
    delivery?: boolean | null;
    shipping?: boolean | null;
    onSiteClient?: boolean | null;
    onSiteProvider?: boolean | null;
  } | null;
  specializations?: string[] | null;
  listingIntent?: string | null;
};

const NON_INVENTORY_PRICE_MODELS = new Set([
  'ON_REQUEST',
  'VOLUNTARY',
  'HOURLY',
  'DAILY',
]);

const SERVICE_CATEGORIES = new Set([
  'ARTISTIC_SERVICE',
  'PRACTICAL_SERVICE',
]);

function isDigitalOnlyFulfillment(
  fo: ListingInventoryInput['fulfillmentOptions'],
): boolean {
  if (!fo || fo.digital !== true) return false;
  return (
    !fo.pickup &&
    !fo.delivery &&
    !fo.shipping &&
    !fo.onSiteClient &&
    !fo.onSiteProvider
  );
}

function normalizeCategory(value?: string | null): string {
  const raw = String(value ?? '').trim().toUpperCase();
  if (raw === 'GROWN' || raw === 'GARDEN') return 'GROW';
  if (raw === 'CHEFF' || raw === 'CHEF') return 'CREATE';
  if (raw === 'DESIGNER') return 'DESIGN';
  return raw;
}

/** Product.stock = remaining units after paid decrement. 0 is sold out, not empty. */
export function remainingStock(stock: number | null | undefined): number {
  if (typeof stock !== 'number' || !Number.isFinite(stock)) return 0;
  return Math.max(0, Math.floor(stock));
}

/** Available to buy = remaining stock minus unexpired PENDING reservations. */
export function availableToBuy(
  stock: number | null | undefined,
  reservedQuantity: number | null | undefined,
): number {
  const reserved = typeof reservedQuantity === 'number' && Number.isFinite(reservedQuantity)
    ? Math.max(0, reservedQuantity)
    : 0;
  return Math.max(0, remainingStock(stock) - reserved);
}

export function stockHoldSessionId(holdId: string, productId: string): string {
  return `hold:${holdId}:${productId}`;
}

/**
 * Parse PATCH/POST stock.
 * omitted / null / '' → do not change (omit)
 * 0 → set 0 (sold out)
 * positive integer → set
 * negative / decimal / NaN → reject
 */
export function parseStockPatchInput(value: unknown): StockPatchResult {
  if (value === undefined || value === null) return { kind: 'omit' };
  if (typeof value === 'boolean') return { kind: 'reject', code: 'STOCK_INVALID' };

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return { kind: 'reject', code: 'STOCK_INVALID' };
    if (value < 0) return { kind: 'reject', code: 'STOCK_NEGATIVE' };
    if (!Number.isInteger(value)) return { kind: 'reject', code: 'STOCK_INVALID' };
    return { kind: 'set', value };
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return { kind: 'omit' };
    if (/^-/.test(trimmed)) return { kind: 'reject', code: 'STOCK_NEGATIVE' };
    if (!/^\d+$/.test(trimmed)) return { kind: 'reject', code: 'STOCK_INVALID' };
    const n = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(n)) return { kind: 'reject', code: 'STOCK_INVALID' };
    return { kind: 'set', value: n };
  }

  return { kind: 'reject', code: 'STOCK_INVALID' };
}

/**
 * Physical / seat inventory applies to CREATE, GROW, DESIGN and workshops.
 * Services, on-request, digital-only and request-listings do not use Product.stock.
 */
export function listingUsesPhysicalInventory(input: ListingInventoryInput): boolean {
  const intent = String(input.listingIntent ?? '').trim().toUpperCase();
  if (intent === 'REQUEST') return false;

  if (isDigitalOnlyFulfillment(input.fulfillmentOptions)) return false;

  const model = String(input.priceModel ?? '').trim().toUpperCase();
  if (NON_INVENTORY_PRICE_MODELS.has(model)) return false;

  const category =
    normalizeCategory(input.marketplaceCategory) ||
    normalizeCategory(input.productCategory);
  if (!category) {
    return !NON_INVENTORY_PRICE_MODELS.has(model);
  }

  if (SERVICE_CATEGORIES.has(category)) return false;

  if (category === 'KNOWLEDGE') {
    const specs = Array.isArray(input.specializations) ? input.specializations : [];
    return specs.some((id) => WORKSHOP_TAXONOMY_IDS.has(id));
  }

  return (
    category === 'CREATE' ||
    category === 'GROW' ||
    category === 'DESIGN'
  );
}

export function stockErrorMessage(code: 'STOCK_NEGATIVE' | 'STOCK_INVALID'): string {
  if (code === 'STOCK_NEGATIVE') return 'Voorraad mag niet negatief zijn.';
  return 'Voorraad moet een heel getal van 0 of hoger zijn.';
}
