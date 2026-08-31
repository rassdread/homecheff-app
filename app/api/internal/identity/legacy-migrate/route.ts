import { NextRequest, NextResponse } from "next/server";
import {
  migrateLegacyProductIdentity,
  type LegacySourceProduct,
} from "@/lib/identity/legacy-product-migrate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(req: NextRequest): boolean {
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  const expected =
    process.env.GROWTH_SSO_CLIENT_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();
  if (!expected || !secret) return false;
  return secret === expected;
}

/**
 * POST /api/internal/identity/legacy-migrate
 * Growth/Studio server → create/link canonical User after legacy credential proof.
 */
export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  let body: {
    sourceProduct?: string;
    sourceUserId?: string;
    email?: string;
    passwordHashBcrypt?: string | null;
    passwordPlaintext?: string | null;
    displayName?: string | null;
    returnProduct?: string;
    returnTo?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body", code: "INVALID_BODY" }, { status: 400 });
  }

  const sourceProduct = body.sourceProduct as LegacySourceProduct;
  const returnProduct = (body.returnProduct || body.sourceProduct) as LegacySourceProduct;
  if (sourceProduct !== "growth" && sourceProduct !== "studio") {
    return NextResponse.json({ error: "Invalid product", code: "INVALID_PRODUCT" }, { status: 400 });
  }
  if (!body.sourceUserId || !body.email) {
    return NextResponse.json({ error: "Missing fields", code: "MISSING_FIELDS" }, { status: 400 });
  }

  // Never accept client-chosen centralUserId
  const result = await migrateLegacyProductIdentity({
    sourceProduct,
    sourceUserId: String(body.sourceUserId),
    email: String(body.email),
    passwordHashBcrypt: body.passwordHashBcrypt ?? null,
    passwordPlaintext: body.passwordPlaintext ?? null,
    displayName: body.displayName ?? null,
    returnProduct,
    returnTo: typeof body.returnTo === "string" ? body.returnTo : "/growth",
  });

  if (!result.ok) {
    const status =
      result.code === "AMBIGUOUS" || result.code === "EMAIL_CONFLICT" ? 409 : 400;
    return NextResponse.json(
      { ok: false, code: result.code, error: result.message },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    outcome: result.outcome,
    centralUserId: result.centralUserId,
    redeemTicket: result.redeemTicket,
  });
}
