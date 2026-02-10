import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, kvkNumber, vatNumber, country = "NL" } = await req.json();
    const KVK_KEY = process.env.KVK_API_KEY;
    const USE_VIES = process.env.VIES_ENABLED === "true";

    let kvkValid: boolean | null = null;
    let vatValid: boolean | null = null;

    const isNetherlands = country === "NL";
    const isEU = ['BE', 'DE', 'FR', 'IT', 'ES', 'AT', 'PT', 'GR', 'IE', 'FI', 'SE', 'DK', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU'].includes(country);

    if (kvkNumber && KVK_KEY) {
      // International business registration validation
      if (isNetherlands) {
        // KVK: 8 digits for Netherlands
        if (/^\d{8}$/.test(kvkNumber.replace(/\s/g, ''))) {
          // In production, you would call the KVK API here
          // Example: const response = await fetch(`https://api.kvk.nl/api/v1/zoeken?kvkNummer=${kvkNumber}`, {
          //   headers: { 'apikey': KVK_KEY }
          // });
          kvkValid = true; // For now, accept valid format
        } else {
          kvkValid = false;
        }
      } else {
        // For other countries: accept if it has at least 3 characters (basic validation)
        // In production, you would call country-specific business registration APIs
        kvkValid = kvkNumber.replace(/\s/g, '').length >= 3;
      }
    }
    
    if (vatNumber && USE_VIES) {
      // International VAT validation
      if (isNetherlands) {
        // NL VAT: NL + 9 digits + B + 2 digits
        if (/^NL\d{9}B\d{2}$/.test(vatNumber.replace(/\s/g, '').toUpperCase())) {
          vatValid = true; // For now, accept valid format
        } else {
          vatValid = false;
        }
      } else if (isEU) {
        // EU VAT: Country code + 2-12 characters
        // Basic validation - in production, call VIES API
        const vatClean = vatNumber.replace(/\s/g, '').toUpperCase();
        if (vatClean.length >= 4 && vatClean.length <= 14) {
          vatValid = true; // Basic format check
        } else {
          vatValid = false;
        }
      } else {
        // Non-EU: basic validation (at least 3 characters)
        vatValid = vatNumber.replace(/\s/g, '').length >= 3;
      }
    }

    const verified = (kvkValid === true || vatValid === true);

    return NextResponse.json({
      verified,
      kvkValid,
      vatValid,
      message: verified ? "COMPANY_VERIFIED" : "COMPANY_VERIFICATION_FAILED"
    });
  } catch (e) {
    return NextResponse.json({ error: "VERIFICATION_ERROR" }, { status: 500 });
  }
}
