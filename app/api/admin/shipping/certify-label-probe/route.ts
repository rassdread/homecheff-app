import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-guard';
import {
  ECTAROSHIP_PARTNER_BASE_URL,
  createPartnerLabel,
} from '@/lib/ectaroship/partner-client';

export const dynamic = 'force-dynamic';

type DestIn = {
  fullname?: string;
  street?: string;
  houseNumber?: string | number;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  email?: string;
  phone?: string;
};

/**
 * Admin-only live label address probe.
 * Supports schema variants to diagnose Partner STRICT address validation.
 * Never returns API key. Does not echo full private street lines on success.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const mode = String(body.mode || 'account_shipfrom');
  const schema = String(body.schema || 'canonical');
  const shippingMethodId = String(body.shippingMethodId || '15366');
  const productId = body.productId != null ? String(body.productId) : '1';
  const dryRaw = body.dryRaw === true;

  if (mode === 'list_labels') {
    const { listShippingLabels } = await import('@/lib/ectaroship/partner-client');
    const listed = await listShippingLabels({
      updatedSince: body.updatedSince ? String(body.updatedSince) : undefined,
      page: body.page ? Number(body.page) : 1,
      pageSize: body.pageSize ? Number(body.pageSize) : 20,
    });
    if (!listed.ok) {
      return NextResponse.json({
        ok: false,
        mode,
        status: listed.status,
        code: listed.code,
        error: listed.error,
      });
    }
    return NextResponse.json({
      ok: true,
      mode,
      count: listed.labels.length,
      sample: listed.labels.slice(0, 5).map((l) => ({
        statusRaw: l.statusRaw,
        carrier: l.carrier,
        trackingSet: Boolean(l.trackingCode),
        totalPrice: l.totalPrice ?? null,
        currency: l.currency,
        rawKeys: Object.keys(l.raw).slice(0, 25),
        fromAddressId:
          l.raw.fromAddressId != null ? String(l.raw.fromAddressId).slice(0, 12) + '…' : null,
      })),
      rawTopKeys:
        listed.raw && typeof listed.raw === 'object'
          ? Object.keys(listed.raw as object).slice(0, 20)
          : [],
    });
  }

  if (mode === 'check_remote') {
    const { checkRemoteArea } = await import('@/lib/ectaroship/partner-client');
    const checked = await checkRemoteArea({
      carrier: String(body.carrier || 'PostNL'),
      country: String(body.country || 'NL'),
      postalCode: String(body.postalCode || ''),
    });
    if (!checked.ok) {
      return NextResponse.json({
        ok: false,
        mode,
        status: checked.status,
        code: checked.code,
        error: checked.error,
      });
    }
    return NextResponse.json({
      ok: true,
      mode,
      isRemote: checked.isRemote,
      rawKeys:
        checked.raw && typeof checked.raw === 'object'
          ? Object.keys(checked.raw as object).slice(0, 20)
          : [],
    });
  }

  const dest = body.destination as DestIn | undefined;

  if (
    !dest?.street ||
    dest?.houseNumber == null ||
    !dest?.postalCode ||
    !dest?.city ||
    !dest?.countryCode
  ) {
    return NextResponse.json(
      { error: 'destination street/houseNumber/postalCode/city/countryCode required' },
      { status: 400 },
    );
  }

  const includeContact = body.includeContact !== false;
  const address = {
    fullname: dest.fullname || 'HomeCheff Cert',
    countryCode: String(dest.countryCode).toUpperCase(),
    city: String(dest.city),
    postalCode: String(dest.postalCode),
    street: String(dest.street),
    houseNumber: String(dest.houseNumber),
    email: includeContact ? dest.email : undefined,
    phone: includeContact ? dest.phone : undefined,
  };

  const from =
    mode === 'explicit_from' && body.from
      ? {
          fullname: String(body.from.fullname || 'HomeCheff Seller'),
          countryCode: String(body.from.countryCode || 'NL').toUpperCase(),
          city: String(body.from.city),
          postalCode: String(body.from.postalCode),
          street: String(body.from.street),
          houseNumber: String(body.from.houseNumber),
          email: includeContact ? body.from.email : undefined,
          phone: includeContact ? body.from.phone : undefined,
        }
      : undefined;

  // Optional raw schema override (bypasses serializePartnerAddress) for diagnosis only.
  if (dryRaw || schema !== 'canonical') {
    const key = process.env.ECTAROSHIP_API_KEY?.trim();
    if (!key) {
      return NextResponse.json({ ok: false, error: 'not configured' }, { status: 503 });
    }

    const pc = String(dest.postalCode).replace(/\s+/g, '').toUpperCase();
    const hnStr = String(dest.houseNumber).trim();
    const hnNum = Number(hnStr.replace(/[^\d].*$/, ''));
    let addrObj: Record<string, unknown>;
    switch (schema) {
      case 'hn_number':
        addrObj = {
          fullname: address.fullname,
          countryCode: address.countryCode,
          city: address.city,
          postalCode: pc,
          street: address.street,
          houseNumber: Number.isFinite(hnNum) ? hnNum : hnStr,
        };
        break;
      case 'name_not_fullname':
        addrObj = {
          name: address.fullname,
          countryCode: address.countryCode,
          city: address.city,
          postalCode: pc,
          street: address.street,
          houseNumber: hnStr,
        };
        break;
      case 'country_not_code':
        addrObj = {
          fullname: address.fullname,
          country: address.countryCode,
          city: address.city,
          postalCode: pc,
          street: address.street,
          houseNumber: hnStr,
        };
        break;
      case 'address_line':
        addrObj = {
          fullname: address.fullname,
          countryCode: address.countryCode,
          city: address.city,
          postalCode: pc,
          addressLine1: `${address.street} ${hnStr}`,
          street: address.street,
          houseNumber: hnStr,
        };
        break;
      case 'spaced_pc':
        addrObj = {
          fullname: address.fullname,
          countryCode: address.countryCode,
          city: address.city,
          postalCode:
            address.countryCode === 'NL' && /^\d{4}[A-Z]{2}$/.test(pc)
              ? `${pc.slice(0, 4)} ${pc.slice(4)}`
              : pc,
          street: address.street,
          houseNumber: hnStr,
        };
        break;
      case 'with_phone':
        addrObj = {
          fullname: address.fullname,
          countryCode: address.countryCode,
          city: address.city,
          postalCode: pc,
          street: address.street,
          houseNumber: Number.isFinite(hnNum) ? hnNum : hnStr,
          phone: dest.phone || '+31612345678',
          email: dest.email || 'cert@homecheff.eu',
        };
        break;
      case 'snake_case':
        addrObj = {
          fullname: address.fullname,
          country_code: address.countryCode,
          countryCode: address.countryCode,
          city: address.city,
          postal_code: pc,
          postalCode: pc,
          street: address.street,
          street_name: address.street,
          house_number: Number.isFinite(hnNum) ? hnNum : hnStr,
          houseNumber: Number.isFinite(hnNum) ? hnNum : hnStr,
          phone: dest.phone || '+31612345678',
        };
        break;
      case 'street_name':
        addrObj = {
          fullname: address.fullname,
          countryCode: address.countryCode,
          city: address.city,
          postalCode: pc,
          streetName: address.street,
          street: address.street,
          houseNumber: Number.isFinite(hnNum) ? hnNum : hnStr,
          phone: dest.phone || '+31612345678',
        };
        break;
      case 'numeric_ids':
        addrObj = {
          fullname: address.fullname,
          countryCode: address.countryCode,
          city: address.city,
          postalCode: pc,
          street: address.street,
          houseNumber: Number.isFinite(hnNum) ? hnNum : hnStr,
          phone: dest.phone || '+31612345678',
        };
        break;
      default:
        addrObj = {
          fullname: address.fullname,
          countryCode: address.countryCode,
          city: address.city,
          postalCode: pc,
          street: address.street,
          houseNumber: hnStr,
        };
    }

    const methodIdPayload =
      schema === 'numeric_ids' && /^\d+$/.test(shippingMethodId)
        ? Number(shippingMethodId)
        : shippingMethodId;
    const productIdPayload =
      schema === 'numeric_ids' && /^\d+$/.test(productId)
        ? Number(productId)
        : productId;

    const payload: Record<string, unknown> = {
      shippingMethodId: methodIdPayload,
      labelQuantity: 1,
      weight: Math.round(Number(body.weightGrams || 850)),
      marketplaceOrderId: `HC-PROBE-${Date.now().toString(36).toUpperCase()}`,
      address: addrObj,
      isReturn: false,
      productId: productIdPayload,
      carrier: body.carrier ? String(body.carrier) : 'PostNL',
      note: `HomeCheff probe schema=${schema}`,
    };
    if (mode === 'explicit_from' && from) {
      payload.fromAddress = {
        fullname: from.fullname,
        countryCode: from.countryCode,
        city: from.city,
        postalCode: String(from.postalCode).replace(/\s+/g, '').toUpperCase(),
        street: from.street,
        houseNumber: String(from.houseNumber),
        phone: from.phone,
        email: from.email,
      };
    }
    if (body.fromAddressId) payload.fromAddressId = body.fromAddressId;
    if (body.lengthCm) payload.length = Number(body.lengthCm);
    if (body.widthCm) payload.width = Number(body.widthCm);
    if (body.heightCm) payload.height = Number(body.heightCm);

    // Alternate destination key names for diagnosis
    if (schema === 'to_address') {
      payload.toAddress = payload.address;
      delete payload.address;
    }
    if (schema === 'first_last') {
      const parts = String(address.fullname || 'Jan Vries').trim().split(/\s+/);
      const firstName = parts[0] || 'Jan';
      const lastName = parts.slice(1).join(' ') || 'Vries';
      const base = {
        firstName,
        lastName,
        fullname: `${firstName} ${lastName}`,
        countryCode: address.countryCode,
        city: address.city,
        postalCode: pc,
        street: address.street,
        houseNumber: Number.isFinite(hnNum) ? hnNum : hnStr,
        phone: dest.phone || '+31612345678',
        email: dest.email || 'cert@homecheff.eu',
      };
      if (payload.address) payload.address = base;
      if (payload.toAddress) payload.toAddress = base;
    }
    if (schema === 'zip_houseNo') {
      const base = {
        fullname: address.fullname,
        countryCode: address.countryCode,
        city: address.city,
        zipCode: pc,
        postalCode: pc,
        street: address.street,
        houseNo: Number.isFinite(hnNum) ? hnNum : hnStr,
        houseNumber: Number.isFinite(hnNum) ? hnNum : hnStr,
        phone: dest.phone || '+31612345678',
      };
      if (payload.address) payload.address = base;
      if (payload.toAddress) payload.toAddress = base;
    }
    if (schema === 'address_array') {
      payload.address = [payload.address];
    }
    if (schema === 'nl_phone_local') {
      const base = {
        ...(payload.address as Record<string, unknown>),
        phone: '0612345678',
      };
      payload.address = base;
    }
    
    if (schema === 'weight_kg') {
      payload.weight = 0.85;
    }
    if (schema === 'weight_string') {
      payload.weight = '850';
    }
    if (schema === 'no_product') {
      delete payload.productId;
    }
    if (schema === 'no_carrier') {
      delete payload.carrier;
    }
    if (schema === 'method_only') {
      delete payload.productId;
      delete payload.carrier;
    }

    if (schema === 'addition_empty') {
      const base = {
        ...(payload.address as Record<string, unknown>),
        houseNumberAddition: '',
        addition: '',
      };
      payload.address = base;
    }

    const useStrict = body.strict !== false;
    const res = await fetch(`${ECTAROSHIP_PARTNER_BASE_URL}/api/v1/shipping/label`, {
      method: 'POST',
      headers: {
        'Api-Key': key,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(useStrict ? { 'X-Api-Behavior': 'STRICT' } : {}),
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text.slice(0, 400) };
    }
    const obj =
      parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    const result =
      obj.result && typeof obj.result === 'object'
        ? (obj.result as Record<string, unknown>)
        : obj;
    const fromAddressId =
      obj.fromAddressId != null && String(obj.fromAddressId).trim() !== ''
        ? String(obj.fromAddressId).slice(0, 40)
        : null;
    const destObj =
      (payload.address as Record<string, unknown> | undefined) ||
      (payload.toAddress as Record<string, unknown> | undefined) ||
      {};

    // Sanitize nested validation payloads (keys + messages only; no street values).
    function summarizeValidation(v: unknown, depth = 0): unknown {
      if (depth > 3) return typeof v;
      if (v == null) return v;
      if (typeof v === 'string') return v.slice(0, 160);
      if (typeof v === 'number' || typeof v === 'boolean') return v;
      if (Array.isArray(v)) return v.slice(0, 8).map((x) => summarizeValidation(x, depth + 1));
      if (typeof v === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 20)) {
          if (/street|postal|phone|email|addressline|city|name/i.test(k) && typeof val === 'string') {
            out[k] = `[str:${val.length}]`;
          } else {
            out[k] = summarizeValidation(val, depth + 1);
          }
        }
        return out;
      }
      return typeof v;
    }

    return NextResponse.json({
      ok: res.ok && result.success === true,
      mode,
      schema,
      http: res.status,
      requestKeys: Object.keys(payload),
      hasFromAddress: Boolean(payload.fromAddress),
      addrKeys: Object.keys(destObj),
      providerKeys: Object.keys(obj).slice(0, 20),
      resultKeys: Object.keys(result).slice(0, 30),
      fromAddressIdPresent: Boolean(fromAddressId),
      fromAddressIdMasked: fromAddressId
        ? `${fromAddressId.slice(0, 4)}…${fromAddressId.slice(-4)}`
        : null,
      fromAddressIdRawType: obj.fromAddressId === null ? 'null' : typeof obj.fromAddressId,
      message:
        typeof result.message === 'string'
          ? result.message.slice(0, 200)
          : typeof obj.message === 'string'
            ? obj.message.slice(0, 200)
            : null,
      error:
        typeof result.error === 'string'
          ? result.error.slice(0, 200)
          : typeof obj.error === 'string'
            ? obj.error.slice(0, 200)
            : null,
      code: result.code ?? obj.code ?? null,
      errorCode: result.errorCode ?? obj.errorCode ?? null,
      bulk: result.bulk ?? null,
      success: result.success ?? null,
      validationAddress: summarizeValidation(obj.address ?? result.address),
      validationErrors: summarizeValidation(
        result.errors ?? result.validationErrors ?? obj.errors ?? obj.validationErrors,
      ),
      trackingSet: Boolean(result.trackingCode || result.trackingNumber),
      totalPrice: result.totalPrice ?? null,
    });
  }

  // account_shipfrom: omit fromAddress so Partner uses dashboard standard shipFrom
  const result = await createPartnerLabel({
    shippingMethodId,
    productId,
    carrier: body.carrier ? String(body.carrier) : 'PostNL',
    weightGrams: Number(body.weightGrams || 850),
    marketplaceOrderId: `HC-PROBE-${Date.now().toString(36).toUpperCase()}`,
    note: 'HomeCheff address probe',
    address,
    fromAddress: mode === 'explicit_from' ? from : undefined,
    fromAddressId: body.fromAddressId,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        mode,
        schema: 'canonical_client',
        status: result.status,
        code: result.code,
        error: result.error,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    mode,
    schema: 'canonical_client',
    providerOrderIdMasked: result.label.providerOrderId
      ? `${result.label.providerOrderId.slice(0, 6)}…`
      : null,
    trackingSet: Boolean(result.label.trackingCode),
    totalPrice: result.label.totalPrice ?? null,
    currency: result.label.currency,
    hasLabelsExport: Boolean(result.label.labelsExport),
  });
}
