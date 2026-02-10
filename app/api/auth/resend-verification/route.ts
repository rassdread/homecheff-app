import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { generateVerificationToken, generateVerificationCode, getVerificationExpires } from "@/lib/verification";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "E-mailadres is vereist" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ 
        error: "Geen account gevonden met dit e-mailadres" 
      }, { status: 404 });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json({ 
        error: "Dit e-mailadres is al geverifieerd" 
      }, { status: 400 });
    }

    // Generate new verification token and code
    const verificationToken = generateVerificationToken();
    const verificationCode = generateVerificationCode();
    const verificationExpires = getVerificationExpires();

    // Update user with new verification token and code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name || user.username || 'Gebruiker',
        verificationToken,
        verificationCode
      });
      return NextResponse.json({ 
        success: true, 
        message: "Verificatie-e-mail is opnieuw verzonden. Controleer je inbox (en spam folder)."
      });

    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json({ 
        error: "Er is een fout opgetreden bij het verzenden van de verificatie-e-mail. Probeer het later opnieuw." 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ 
      error: "Er is een fout opgetreden bij het opnieuw verzenden van de verificatie-e-mail" 
    }, { status: 500 });
  }
}


