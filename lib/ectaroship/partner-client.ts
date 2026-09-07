/**
 * Official EctaroShip Partner API client.
 * Spec source of truth — do not invent undocumented endpoints.
 *
 * Base: https://partnerapi.ectaro.com/
 * Auth: Api-Key header (server-only)
 * Label create: X-Api-Behavior: STRICT (mandatory)
 */

export const ECTAROSHIP_PARTNER_BASE_URL =
  (process.env.ECTAROSHIP_API_BASE_URL || 'https://partnerapi.ectaro.com').replace(
    /\/$/,
    '',
  );

export const HOMECHEFF_SHIPPING_MARKUP_PERCENT = 0;

export type PartnerApiError = {
  ok: false;
  status: number;
  code: string;
  error: string;
  retryAfterMs?: number;
};

function getApiKey(): string | null {
  const key = process.env.ECTAROSHIP_API_KEY?.trim();
  return key || null;
}

export function isEctaroShipConfigured(): boolean {
  return Boolean(getApiKey());
}

function partnerHeaders(opts?: { strict?: boolean }): HeadersInit {
  const key = getApiKey();
  if (!key) {
    throw new Error('ECTAROSHIP_API_KEY not configured');
  }
  const headers: Record<string, string> = {
    'Api-Key': key,
    Accept: 'application/json',
  };
  if (opts?.strict) {
    headers['X-Api-Behavior'] = 'STRICT';
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 500) };
  }
}

function asError(
  status: number,
  body: unknown,
  fallback: string,
): PartnerApiError {
  const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const result =
    obj.result && typeof obj.result === 'object'
      ? (obj.result as Record<string, unknown>)
      : null;
  const detailBits: string[] = [];
  for (const src of [obj, result]) {
    if (!src) continue;
    for (const key of ['message', 'error', 'code', 'errorCode', 'error_code']) {
      const v = src[key];
      if (typeof v === 'string' && v.trim() && !detailBits.includes(v.trim())) {
        detailBits.push(v.trim().slice(0, 200));
      }
    }
    const errs = src.errors ?? src.validationErrors ?? src.details;
    if (Array.isArray(errs)) {
      for (const e of errs.slice(0, 5)) {
        if (typeof e === 'string') detailBits.push(e.slice(0, 120));
        else if (e && typeof e === 'object') {
          const eo = e as Record<string, unknown>;
          const part = [eo.field, eo.path, eo.message, eo.error]
            .filter((x) => typeof x === 'string')
            .join(': ');
          if (part) detailBits.push(part.slice(0, 160));
        }
      }
    }
  }
  const msg =
    detailBits.join(' | ') ||
    (typeof obj.message === 'string' && obj.message) ||
    (typeof obj.error === 'string' && obj.error) ||
    fallback;
  const retryAfterMs = status === 429 ? 6_000 : undefined;
  return {
    ok: false,
    status,
    code:
      status === 401
        ? 'ECTAROSHIP_UNAUTHORIZED'
        : status === 402
          ? 'ECTAROSHIP_ACCOUNT_PAYMENT_REQUIRED'
          : status === 400
            ? 'ECTAROSHIP_BAD_REQUEST'
            : status === 429
              ? 'ECTAROSHIP_RATE_LIMITED'
              : 'ECTAROSHIP_HTTP_ERROR',
    error:
      status === 402
        ? 'EctaroShip account requires payment/balance before labels can be created.'
        : msg.slice(0, 500),
    retryAfterMs,
  };
}

export type ShippingProduct = {
  shippingMethodId: string;
  carrier: string;
  name: string;
  fromCountry?: string;
  toCountry?: string;
  maxWeight?: number;
  productId?: string;
  price: number; // major currency units from provider
  priceCents: number;
  currency: string;
  labelType?: string;
  hasReturn?: boolean;
  returnPrice?: number;
  raw: Record<string, unknown>;
};

function normalizeProduct(raw: Record<string, unknown>): ShippingProduct | null {
  const shippingMethodId = String(
    raw.shippingMethodId ?? raw.shipping_method_id ?? raw.id ?? '',
  ).trim();
  const priceRaw = raw.price ?? raw.totalPrice ?? raw.cost ?? raw.amount;
  const price =
    typeof priceRaw === 'number'
      ? priceRaw
      : typeof priceRaw === 'string'
        ? Number(priceRaw)
        : NaN;
  if (!shippingMethodId || !Number.isFinite(price) || price < 0) return null;
  const priceCents = Math.round(price * 100);
  return {
    shippingMethodId,
    carrier: String(raw.carrier ?? raw.Carrier ?? 'Carrier'),
    name: String(raw.name ?? raw.productName ?? raw.title ?? raw.carrier ?? 'Verzending'),
    fromCountry: raw.fromCountry ? String(raw.fromCountry) : undefined,
    toCountry: raw.toCountry ? String(raw.toCountry) : undefined,
    maxWeight:
      typeof raw.maxWeight === 'number'
        ? raw.maxWeight
        : typeof raw.maxWeight === 'string'
          ? Number(raw.maxWeight)
          : undefined,
    productId:
      raw.productId != null
        ? String(raw.productId)
        : raw.product_id != null
          ? String(raw.product_id)
          : undefined,
    price,
    priceCents,
    currency: String(raw.currency ?? 'EUR').toUpperCase(),
    labelType: raw.labelType ? String(raw.labelType) : undefined,
    hasReturn: Boolean(raw.hasReturn),
    returnPrice:
      typeof raw.returnPrice === 'number' ? raw.returnPrice : undefined,
    raw,
  };
}

function extractProductList(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) return body as Record<string, unknown>[];
  if (!body || typeof body !== 'object') return [];
  const o = body as Record<string, unknown>;
  for (const key of ['products', 'data', 'items', 'result']) {
    const v = o[key];
    if (Array.isArray(v)) return v as Record<string, unknown>[];
    if (v && typeof v === 'object') {
      const nested = v as Record<string, unknown>;
      if (Array.isArray(nested.products)) return nested.products as Record<string, unknown>[];
      if (Array.isArray(nested.data)) return nested.data as Record<string, unknown>[];
    }
  }
  return [];
}

export type GetProductsParams = {
  originCountry: string;
  destinationCountry: string;
  /** Weight in GRAMS */
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

/**
 * GET /api/v1/shipping/products
 */
export async function getShippingProducts(
  params: GetProductsParams,
): Promise<{ ok: true; products: ShippingProduct[] } | PartnerApiError> {
  if (!getApiKey()) {
    return {
      ok: false,
      status: 503,
      code: 'SHIPPING_PROVIDER_NOT_CONFIGURED',
      error: 'Verzending is tijdelijk niet beschikbaar.',
    };
  }

  const qs = new URLSearchParams({
    originCountry: params.originCountry.toUpperCase(),
    destinationCountry: params.destinationCountry.toUpperCase(),
    weight: String(Math.round(params.weightGrams)),
    length: String(params.lengthCm),
    width: String(params.widthCm),
    height: String(params.heightCm),
  });

  try {
    const res = await fetch(
      `${ECTAROSHIP_PARTNER_BASE_URL}/api/v1/shipping/products?${qs}`,
      { method: 'GET', headers: partnerHeaders(), cache: 'no-store' },
    );
    const body = await parseJson(res);
    if (!res.ok) {
      return asError(res.status, body, `HTTP ${res.status}`);
    }
    const products = extractProductList(body)
      .map((p) => normalizeProduct(p))
      .filter((p): p is ShippingProduct => p != null);
    return { ok: true, products };
  } catch (e) {
    return {
      ok: false,
      status: 502,
      code: 'ECTAROSHIP_NETWORK_ERROR',
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export type PartnerAddress = {
  fullname?: string;
  companyName?: string;
  /** ISO-3166 alpha-2 — Partner API field name is countryCode */
  countryCode: string;
  city: string;
  postalCode: string;
  street: string;
  houseNumber: string;
  address2?: string;
  email?: string;
  phone?: string;
};

function serializePartnerAddress(addr: PartnerAddress): Record<string, unknown> {
  const countryCode = addr.countryCode.toUpperCase();
  let postalCode = addr.postalCode.replace(/\s+/g, '').toUpperCase();
  if (countryCode === 'NL' && /^\d{4}[A-Z]{2}$/.test(postalCode)) {
    postalCode = `${postalCode.slice(0, 4)} ${postalCode.slice(4)}`;
  }
  const hnRaw = String(addr.houseNumber).trim();
  const hnNum = Number(hnRaw.replace(/[^\d].*$/, ''));
  const out: Record<string, unknown> = {
    countryCode,
    country: countryCode,
    city: addr.city,
    postalCode,
    zipCode: postalCode,
    street: addr.street,
    houseNumber: Number.isFinite(hnNum) && hnNum > 0 ? hnNum : hnRaw,
  };
  if (addr.fullname) {
    out.fullname = addr.fullname;
    out.name = addr.fullname;
  }
  if (addr.companyName) out.companyName = addr.companyName;
  if (addr.address2) out.address2 = addr.address2;
  if (addr.email) out.email = addr.email;
  if (addr.phone) out.phone = addr.phone;
  return out;
}

export type CreateLabelParams = {
  shippingMethodId: string;
  productId?: string;
  carrier?: string;
  /** Weight in GRAMS */
  weightGrams: number;
  marketplaceOrderId: string;
  note?: string;
  address: PartnerAddress;
  fromAddress?: PartnerAddress;
  /** Use account-configured shipFrom when Partner dashboard shipFrom is set */
  fromAddressId?: string | number;
  orderItems?: Array<{
    title: string;
    quantity: number;
    unitPrice: number;
    currency?: string;
    hsCode?: string;
    originCountry?: string;
  }>;
  isReturn?: boolean;
  labelQuantity?: number;
};

export type CreatedLabel = {
  providerOrderId: string;
  trackingCode: string;
  trackingUrl?: string;
  carrier?: string;
  shippingMethodId?: string;
  labelsExport?: unknown;
  totalPrice?: number;
  currency?: string;
  raw: Record<string, unknown>;
};

function pickLabelSuccess(body: unknown): CreatedLabel | null {
  if (!body || typeof body !== 'object') return null;
  const root = body as Record<string, unknown>;
  const result =
    root.result && typeof root.result === 'object'
      ? (root.result as Record<string, unknown>)
      : root;

  const successFlag = result.success ?? root.success;
  if (successFlag === false) return null;

  const labelsRaw = result.labels ?? root.labels;
  const firstLabel =
    Array.isArray(labelsRaw) && labelsRaw[0] && typeof labelsRaw[0] === 'object'
      ? (labelsRaw[0] as Record<string, unknown>)
      : result;

  const trackingCode = String(
    firstLabel.trackingCode ??
      firstLabel.tracking_code ??
      firstLabel.trackingNumber ??
      result.trackingCode ??
      result.trackingNumber ??
      '',
  ).trim();

  const providerOrderId = String(
    firstLabel.orderId ??
      firstLabel.order_id ??
      result.orderId ??
      result.id ??
      root.orderId ??
      '',
  ).trim();

  // STRICT mode: require explicit success when present, plus tracking or provider id
  if (successFlag !== true && successFlag !== undefined) return null;
  if (!trackingCode && !providerOrderId) return null;
  // If success field exists, require true
  if ('success' in result || 'success' in root) {
    if (successFlag !== true) return null;
  }

  const trackingUrl = String(
    firstLabel.trackingUrl ??
      firstLabel.tracking_url ??
      result.trackingUrl ??
      '',
  ).trim();

  const totalPriceRaw =
    firstLabel.totalPrice ?? result.totalPrice ?? root.totalPrice;
  const totalPrice =
    typeof totalPriceRaw === 'number'
      ? totalPriceRaw
      : typeof totalPriceRaw === 'string'
        ? Number(totalPriceRaw)
        : undefined;

  return {
    providerOrderId: providerOrderId || trackingCode,
    trackingCode: trackingCode || providerOrderId,
    trackingUrl: trackingUrl || undefined,
    carrier: firstLabel.carrier
      ? String(firstLabel.carrier)
      : result.carrier
        ? String(result.carrier)
        : undefined,
    shippingMethodId: firstLabel.shippingMethodId
      ? String(firstLabel.shippingMethodId)
      : undefined,
    labelsExport: firstLabel.labelsExport ?? result.labelsExport,
    totalPrice: Number.isFinite(totalPrice) ? totalPrice : undefined,
    currency: String(firstLabel.currency ?? result.currency ?? 'EUR'),
    raw: root,
  };
}

/**
 * POST /api/v1/shipping/label
 * Always sends X-Api-Behavior: STRICT
 */
export async function createPartnerLabel(
  params: CreateLabelParams,
): Promise<{ ok: true; label: CreatedLabel } | PartnerApiError> {
  if (!getApiKey()) {
    return {
      ok: false,
      status: 503,
      code: 'SHIPPING_PROVIDER_NOT_CONFIGURED',
      error: 'Verzending is tijdelijk niet beschikbaar.',
    };
  }

  const payload: Record<string, unknown> = {
    shippingMethodId: params.shippingMethodId,
    labelQuantity: params.labelQuantity ?? 1,
    weight: Math.round(params.weightGrams),
    marketplaceOrderId: params.marketplaceOrderId,
    address: serializePartnerAddress(params.address),
    isReturn: params.isReturn === true,
  };
  // Prefer account-configured shipFrom when requested; otherwise send explicit fromAddress.
  if (params.fromAddressId) {
    payload.fromAddressId = params.fromAddressId;
  } else if (params.fromAddress) {
    payload.fromAddress = serializePartnerAddress(params.fromAddress);
  }
  if (params.productId) payload.productId = params.productId;
  if (params.carrier) payload.carrier = params.carrier;
  if (params.note) payload.note = params.note;
  if (params.orderItems?.length) payload.orderItems = params.orderItems;

  try {
    const res = await fetch(
      `${ECTAROSHIP_PARTNER_BASE_URL}/api/v1/shipping/label`,
      {
        method: 'POST',
        headers: partnerHeaders({ strict: true }),
        body: JSON.stringify(payload),
      },
    );
    const body = await parseJson(res);
    if (!res.ok) {
      return asError(res.status, body, `HTTP ${res.status}`);
    }
    const label = pickLabelSuccess(body);
    if (!label) {
      return {
        ok: false,
        status: 502,
        code: 'ECTAROSHIP_LABEL_MALFORMED',
        error:
          'Provider gaf geen geldig labelresultaat (STRICT). Probeer later opnieuw.',
      };
    }
    return { ok: true, label };
  } catch (e) {
    return {
      ok: false,
      status: 502,
      code: 'ECTAROSHIP_NETWORK_ERROR',
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

/**
 * PUT /api/v1/shipping/label/cancel
 */
export async function cancelPartnerLabel(input: {
  orderId?: string;
  trackingCode?: string;
}): Promise<{ ok: true; raw: unknown } | PartnerApiError> {
  if (!getApiKey()) {
    return {
      ok: false,
      status: 503,
      code: 'SHIPPING_PROVIDER_NOT_CONFIGURED',
      error: 'Not configured',
    };
  }
  try {
    const res = await fetch(
      `${ECTAROSHIP_PARTNER_BASE_URL}/api/v1/shipping/label/cancel`,
      {
        method: 'PUT',
        headers: partnerHeaders({ strict: true }),
        body: JSON.stringify(input),
      },
    );
    const body = await parseJson(res);
    if (!res.ok) return asError(res.status, body, `HTTP ${res.status}`);
    return { ok: true, raw: body };
  } catch (e) {
    return {
      ok: false,
      status: 502,
      code: 'ECTAROSHIP_NETWORK_ERROR',
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

/**
 * POST /api/v1/shipping/check-remote-area
 */
export async function checkRemoteArea(input: {
  carrier: string;
  country: string;
  postalCode: string;
}): Promise<{ ok: true; isRemote: boolean; raw: unknown } | PartnerApiError> {
  if (!getApiKey()) {
    return {
      ok: false,
      status: 503,
      code: 'SHIPPING_PROVIDER_NOT_CONFIGURED',
      error: 'Not configured',
    };
  }
  try {
    const res = await fetch(
      `${ECTAROSHIP_PARTNER_BASE_URL}/api/v1/shipping/check-remote-area`,
      {
        method: 'POST',
        headers: partnerHeaders({ strict: true }),
        body: JSON.stringify(input),
      },
    );
    const body = await parseJson(res);
    if (!res.ok) return asError(res.status, body, `HTTP ${res.status}`);
    const o = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const isRemote = Boolean(
      o.isRemote ?? o.remote ?? o.is_remote ?? (o.result as any)?.isRemote,
    );
    return { ok: true, isRemote, raw: body };
  } catch (e) {
    return {
      ok: false,
      status: 502,
      code: 'ECTAROSHIP_NETWORK_ERROR',
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

export type SyncedLabelRow = {
  providerOrderId?: string;
  trackingCode?: string;
  trackingUrl?: string;
  statusRaw: string;
  totalPrice?: number;
  currency?: string;
  pricingBreakdown?: unknown;
  carrier?: string;
  updatedAt?: string;
  raw: Record<string, unknown>;
};

/**
 * GET /api/v1/shipping/labels?updatedSince=yyyy-MM-dd HH:mm:ss
 * Respect 10 req/min — caller must throttle.
 */
export async function listShippingLabels(params?: {
  updatedSince?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ ok: true; labels: SyncedLabelRow[]; raw: unknown } | PartnerApiError> {
  if (!getApiKey()) {
    return {
      ok: false,
      status: 503,
      code: 'SHIPPING_PROVIDER_NOT_CONFIGURED',
      error: 'Not configured',
    };
  }
  const qs = new URLSearchParams();
  if (params?.updatedSince) qs.set('updatedSince', params.updatedSince);
  if (params?.page != null) qs.set('page', String(params.page));
  if (params?.pageSize != null) qs.set('pageSize', String(params.pageSize));

  try {
    const res = await fetch(
      `${ECTAROSHIP_PARTNER_BASE_URL}/api/v1/shipping/labels?${qs}`,
      { method: 'GET', headers: partnerHeaders(), cache: 'no-store' },
    );
    const body = await parseJson(res);
    if (!res.ok) return asError(res.status, body, `HTTP ${res.status}`);

    const list = extractProductList(body); // same array extraction heuristics
    // Prefer labels key if present
    let rows: Record<string, unknown>[] = list;
    if (body && typeof body === 'object') {
      const o = body as Record<string, unknown>;
      if (Array.isArray(o.labels)) rows = o.labels as Record<string, unknown>[];
    }

    const labels: SyncedLabelRow[] = rows.map((r) => {
      const statusRaw = String(
        r.status ?? r.shipmentStatus ?? r.state ?? 'UNKNOWN',
      );
      const totalPriceRaw = r.totalPrice ?? r.price ?? r.cost;
      const totalPrice =
        typeof totalPriceRaw === 'number'
          ? totalPriceRaw
          : typeof totalPriceRaw === 'string'
            ? Number(totalPriceRaw)
            : undefined;
      return {
        providerOrderId: r.orderId
          ? String(r.orderId)
          : r.id
            ? String(r.id)
            : undefined,
        trackingCode: r.trackingCode
          ? String(r.trackingCode)
          : r.trackingNumber
            ? String(r.trackingNumber)
            : undefined,
        trackingUrl: r.trackingUrl ? String(r.trackingUrl) : undefined,
        statusRaw,
        totalPrice: Number.isFinite(totalPrice) ? totalPrice : undefined,
        currency: r.currency ? String(r.currency) : 'EUR',
        pricingBreakdown: r.pricingBreakdown,
        carrier: r.carrier ? String(r.carrier) : undefined,
        updatedAt: r.updatedAt ? String(r.updatedAt) : undefined,
        raw: r,
      };
    });

    return { ok: true, labels, raw: body };
  } catch (e) {
    return {
      ok: false,
      status: 502,
      code: 'ECTAROSHIP_NETWORK_ERROR',
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

/**
 * GET /api/v1/ping/
 */
export async function pingPartnerApi(): Promise<
  { ok: true; status: number; body: unknown } | PartnerApiError
> {
  if (!getApiKey()) {
    return {
      ok: false,
      status: 503,
      code: 'SHIPPING_PROVIDER_NOT_CONFIGURED',
      error: 'Not configured',
    };
  }
  try {
    const res = await fetch(`${ECTAROSHIP_PARTNER_BASE_URL}/api/v1/ping/`, {
      method: 'GET',
      headers: partnerHeaders(),
      cache: 'no-store',
    });
    const body = await parseJson(res);
    if (!res.ok) return asError(res.status, body, `HTTP ${res.status}`);
    return { ok: true, status: res.status, body };
  } catch (e) {
    return {
      ok: false,
      status: 502,
      code: 'ECTAROSHIP_NETWORK_ERROR',
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}

/** Allowlist for provider document/tracking hosts (no open proxy). */
export function isAllowedEctaroDocumentUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    const allow = [
      'partnerapi.ectaro.com',
      'ectaro.com',
      'ectaroship.nl',
      'postnl.nl',
      'dpd.com',
      'dhl.com',
      'fedex.com',
      'homecheff.eu',
    ];
    return allow.some((a) => host === a || host.endsWith('.' + a));
  } catch {
    return false;
  }
}
