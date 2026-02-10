import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateRoleAddition, ROLE_REQUIREMENTS } from '@/lib/role-requirements';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { roles, agreements, age } = body;

    // Validate input
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ error: 'Geen rollen geselecteerd' }, { status: 400 });
    }

    if (!age || typeof age !== 'number') {
      return NextResponse.json({ error: 'Leeftijd is vereist' }, { status: 400 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        sellerRoles: true,
        privacyPolicyAccepted: true,
        termsAccepted: true,
        taxResponsibilityAccepted: true,
        marketingAccepted: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Validate each new role
    const newRoles = roles.filter((role: string) => !user.sellerRoles.includes(role));
    const validationErrors: string[] = [];

    for (const roleId of newRoles) {
      const validation = validateRoleAddition(age, roleId, {
        privacyPolicy: agreements.privacyPolicy,
        terms: agreements.terms,
        taxResponsibility: agreements.taxResponsibility,
        parentalConsent: agreements.parentalConsent
      });

      if (!validation.valid) {
        validationErrors.push(`${ROLE_REQUIREMENTS[roleId]?.name}: ${validation.errors.join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validatie mislukt', 
        details: validationErrors 
      }, { status: 400 });
    }

    // Update user with new roles and agreements
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        sellerRoles: {
          set: [...new Set([...user.sellerRoles, ...newRoles])] // Unique roles
        },
        // Update agreements (only if not already accepted)
        privacyPolicyAccepted: user.privacyPolicyAccepted || agreements.privacyPolicy || false,
        privacyPolicyAcceptedAt: user.privacyPolicyAccepted ? undefined : (agreements.privacyPolicy ? new Date() : undefined),
        
        termsAccepted: user.termsAccepted || agreements.terms || false,
        termsAcceptedAt: user.termsAccepted ? undefined : (agreements.terms ? new Date() : undefined),
        
        taxResponsibilityAccepted: user.taxResponsibilityAccepted || agreements.taxResponsibility || false,
        taxResponsibilityAcceptedAt: user.taxResponsibilityAccepted ? undefined : (agreements.taxResponsibility ? new Date() : undefined),
        
        marketingAccepted: agreements.marketing || user.marketingAccepted || false,
        marketingAcceptedAt: agreements.marketing && !user.marketingAccepted ? new Date() : undefined
      }
    });

    // Create SellerProfile if needed and user doesn't have one yet
    const existingSellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id }
    });

    if (!existingSellerProfile && newRoles.length > 0) {
      const id = crypto.randomUUID();
      await prisma.sellerProfile.create({
        data: {
          id,
          userId: user.id,
          bio: `HomeCheff ${newRoles.map(r => ROLE_REQUIREMENTS[r]?.name).join(' & ')}`
        }
      });
    }

    return NextResponse.json({
      success: true,
      addedRoles: newRoles,
      totalRoles: updatedUser.sellerRoles,
      message: `Succesvol ${newRoles.length} rol${newRoles.length > 1 ? 'len' : ''} toegevoegd!`
    });

  } catch (error) {
    console.error('Error adding seller roles:', error);
    return NextResponse.json(
      { error: 'Failed to add seller roles', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

