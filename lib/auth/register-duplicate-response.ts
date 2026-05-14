import { NextResponse } from "next/server";
import type { DuplicateSignupKind } from "@/lib/auth/signup-duplicate";

const FALLBACK_NL: Record<DuplicateSignupKind, string> = {
  google_only:
    "Er bestaat al een account met dit e-mailadres via Google. Log in met Google. Daarna kun je in je accountinstellingen een wachtwoord instellen voor de volgende keer.",
  password_only:
    "Er bestaat al een account met dit e-mailadres. Log in of gebruik wachtwoord vergeten.",
  both:
    "Er bestaat al een account met dit e-mailadres. Je kunt inloggen met Google of met je wachtwoord.",
};

export function jsonRegisterDuplicate(kind: DuplicateSignupKind) {
  return NextResponse.json(
    {
      error: "ALREADY_REGISTERED",
      duplicateKind: kind,
      message: FALLBACK_NL[kind],
    },
    { status: 409 },
  );
}
