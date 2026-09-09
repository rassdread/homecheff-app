import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { tryNormalizeEmail } from "@/lib/auth/normalize-email";
import { findUserByCanonicalEmail } from "@/lib/auth/find-user-by-email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ 
        valid: false, 
        error: "E-mailadres is verplicht" 
      }, { status: 400 });
    }

    const normalized = tryNormalizeEmail(email);
    if (!normalized) {
      return NextResponse.json({ 
        valid: false, 
        error: "Voer een geldig e-mailadres in" 
      }, { status: 400 });
    }

    const existingUser = await findUserByCanonicalEmail(prisma, normalized, {
      select: {
        id: true,
        DeliveryProfile: { select: { id: true } },
      },
    });

    if (existingUser) {
      if (!existingUser.DeliveryProfile) {
        return NextResponse.json({
          valid: false,
          incompleteDeliveryOnboarding: true,
          error:
            "Je account bestaat al, maar je bezorgerprofiel is nog niet afgerond. Log in en rond je aanmelding af.",
          resumeHint: "login_and_resume",
        }, { status: 409 });
      }

      return NextResponse.json({ 
        valid: false, 
        error: "Dit e-mailadres is al in gebruik. Log in of gebruik wachtwoord vergeten." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      valid: true, 
      message: "E-mailadres is beschikbaar!" 
    });

  } catch (error) {
    console.error('Email validation error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: "Er is een fout opgetreden bij het valideren van het e-mailadres" 
    }, { status: 500 });
  }
}
