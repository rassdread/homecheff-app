import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ 
        valid: false, 
        error: "E-mailadres is verplicht" 
      }, { status: 400 });
    }

    // E-mail validatie regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        valid: false, 
        error: "Voer een geldig e-mailadres in" 
      }, { status: 400 });
    }

    // Controleer of e-mail al bestaat
    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });

    if (existingUser) {
      return NextResponse.json({ 
        valid: false, 
        error: "Dit e-mailadres is al in gebruik. Kies een ander e-mailadres." 
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
