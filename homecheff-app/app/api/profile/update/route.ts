import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      username, 
      bio, 
      place, 
      gender, 
      interests, 
      sellerRoles, 
      buyerRoles, 
      displayFullName,
      bankName,
      iban,
      accountHolderName
    } = body;

    // Validate required fields
    if (!name || !username) {
      return NextResponse.json({ 
        error: 'Naam en gebruikersnaam zijn verplicht' 
      }, { status: 400 });
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: { 
        username,
        NOT: { email: session.user.email }
      }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Gebruikersnaam is al in gebruik' 
      }, { status: 400 });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        username,
        bio: bio || null,
        place: place || null,
        gender: gender || null,
        interests: interests || [],
        sellerRoles: sellerRoles || [],
        buyerRoles: buyerRoles || [],
        displayFullName: displayFullName !== undefined ? displayFullName : true,
        bankName: bankName || null,
        iban: iban || null,
        accountHolderName: accountHolderName || null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        place: true,
        gender: true,
        interests: true,
        sellerRoles: true,
        buyerRoles: true,
        displayFullName: true,
        profileImage: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profiel succesvol bijgewerkt'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het bijwerken van het profiel' 
    }, { status: 500 });
  }
}
