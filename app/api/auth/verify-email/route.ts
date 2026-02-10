import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json({ error: "Verificatie token is vereist" }, { status: 400 });
    }

    // Find user with this verification token OR code
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { emailVerificationToken: token },
          { emailVerificationCode: token }
        ],
        emailVerificationExpires: {
          gt: new Date() // Token/code must not be expired
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: "Ongeldige of verlopen verificatie token" 
      }, { status: 400 });
    }

    // Update user to mark email as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationCode: null,
        emailVerificationExpires: null
      }
    });

    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: user.email,
        name: user.name || user.username || 'Gebruiker'
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if email sending fails
    }
    return NextResponse.json({ 
      success: true, 
      message: "E-mailadres succesvol geverifieerd!",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        emailVerified: updatedUser.emailVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ 
      error: "Er is een fout opgetreden bij het verifiëren van je e-mailadres" 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: "Verificatie token is vereist" }, { status: 400 });
    }

    // Find user with this verification token OR code
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { emailVerificationToken: token },
          { emailVerificationCode: token }
        ],
        emailVerificationExpires: {
          gt: new Date() // Token/code must not be expired
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: "Ongeldige of verlopen verificatie token" 
      }, { status: 400 });
    }

    // Update user to mark email as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationCode: null,
        emailVerificationExpires: null
      }
    });

    // Send welcome email
    try {
      await sendWelcomeEmail({
        email: user.email,
        name: user.name || user.username || 'Gebruiker'
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if email sending fails
    }
    return NextResponse.json({ 
      success: true, 
      message: "E-mailadres succesvol geverifieerd!",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        emailVerified: updatedUser.emailVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ 
      error: "Er is een fout opgetreden bij het verifiëren van je e-mailadres" 
    }, { status: 500 });
  }
}


