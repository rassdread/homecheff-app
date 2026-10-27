import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { tryNormalizeEmail } from '@/lib/auth/normalize-email';
import { findUserByCanonicalEmail } from '@/lib/auth/find-user-by-email';
import {
  anonymizedUserWhere,
  classifyUserPopulation,
  DEFAULT_ADMIN_USER_LIST_VIEW,
  demonstrableTestUserWhere,
  realUserWhere,
  userPopulationWhere,
  type AdminUserListView,
} from '@/lib/admin/user-population';
import {
  capabilityLabels,
  capabilityWhere,
  parseUserCapabilityFilters,
  SUBSCRIPTION_STATUSES_COUNTED_AS_CURRENT,
} from '@/lib/admin/user-capabilities';
// import { UserRole } from '@prisma/client';

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'NOT_LOGGED_IN' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'NO_ADMIN_RIGHTS' }, { status: 403 });
    }

    const viewParam = request.nextUrl.searchParams.get('view');
    const view: AdminUserListView =
      viewParam === 'real' ||
      viewParam === 'test' ||
      viewParam === 'deleted' ||
      viewParam === 'all' ||
      viewParam === 'current'
        ? viewParam
        : DEFAULT_ADMIN_USER_LIST_VIEW;

    const parsedCapabilities = parseUserCapabilityFilters(
      (request.nextUrl.searchParams.get('capability') || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
    if (!parsedCapabilities.ok) {
      return NextResponse.json({ error: parsedCapabilities.error }, { status: 400 });
    }
    const search = (request.nextUrl.searchParams.get('q') || '').trim();
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || '1') || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(request.nextUrl.searchParams.get('pageSize') || '50') || 50),
    );
    const needsSubscriptions = parsedCapabilities.filters.some((filter) =>
      ['subscribed_businesses', 'unsubscribed_businesses', 'business_accounts'].includes(filter),
    );
    const subscribedUserIds = needsSubscriptions
      ? (
          await prisma.businessSubscription.findMany({
            where: { status: { in: [...SUBSCRIPTION_STATUSES_COUNTED_AS_CURRENT] } },
            select: { businessUserId: true },
          })
        ).map((row) => row.businessUserId)
      : [];
    const where = {
      AND: [
        userPopulationWhere(view),
        capabilityWhere(parsedCapabilities.filters, { now: new Date(), subscribedUserIds }),
        search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' as const } },
                { username: { contains: search, mode: 'insensitive' as const } },
                { name: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {},
      ],
    };

    const [users, total, realCount, testCount, deletedCount] = await Promise.all([
      prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        image: true,
        profileImage: true,
        bio: true,
        accountDeletedAt: true,
        emailVerified: true,
        place: true,
        gender: true,
        interests: true,
        phoneNumber: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        lat: true,
        lng: true,
        suspendedAt: true,
        suspendReason: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
        SellerProfile: {
          select: {
            companyName: true,
            kvk: true,
            btw: true,
            commerceDeclaration: true,
          }
        },
        DeliveryProfile: {
          select: {
            isVerified: true,
            isActive: true,
            isBlocked: true,
            isOnline: true,
            maxDistance: true,
            transportation: true,
            deliveryAgreementAcceptedAt: true,
          }
        },
        affiliate: {
          select: { status: true, populationClass: true },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' }
    }),
      prisma.user.count({ where }),
      prisma.user.count({ where: realUserWhere() }),
      prisma.user.count({ where: demonstrableTestUserWhere() }),
      prisma.user.count({ where: anonymizedUserWhere() }),
    ]);

    return NextResponse.json({
      users: users.map(({ bio, accountDeletedAt, emailVerified, stripeConnectAccountId, ...user }) => {
        const businessSeller = Boolean(
          user.SellerProfile &&
            (user.SellerProfile.commerceDeclaration === 'SELF_DECLARED_PROFESSIONAL' ||
              (user.SellerProfile.kvk && user.SellerProfile.kvk.trim())),
        );
        const connectReady = Boolean(
          stripeConnectAccountId && user.stripeConnectOnboardingCompleted,
        );
        return {
          ...user,
          accountDeletedAt,
          emailVerified: Boolean(emailVerified),
          connectReady,
          populationClass: classifyUserPopulation({
            email: user.email,
            username: user.username,
            bio,
            accountDeletedAt,
          }),
          capabilities: capabilityLabels({
            orderCount: user._count.orders,
            hasSellerProfile: Boolean(user.SellerProfile),
            businessSeller,
            hasDeliveryProfile: Boolean(user.DeliveryProfile),
            commercialAffiliate: user.affiliate?.populationClass === 'COMMERCIAL',
            role: user.role,
            connectReady,
          }),
        };
      }),
      populationCounts: {
        real: realCount,
        test: testCount,
        deleted: deletedCount,
        all: realCount + testCount + deletedCount,
      },
      view,
      page,
      pageSize,
      total,
      capability: parsedCapabilities.filters,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
        error: 'ERROR_FETCHING_USERS'
    }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'NOT_LOGGED_IN' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN' && adminUser?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'NO_ADMIN_RIGHTS' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, username, password, role, kvk, btw } = body;

    // Validate required fields
    if (!email || !name || !username || !password || !role) {
      return NextResponse.json({ 
        error: 'ALL_FIELDS_REQUIRED' 
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['USER', 'ADMIN', 'SELLER', 'BUYER', 'DELIVERY'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Ongeldige rol' 
      }, { status: 400 });
    }

    const normalizedEmail = tryNormalizeEmail(email);
    if (!normalizedEmail) {
      return NextResponse.json({ 
        error: 'Ongeldig email adres' 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await findUserByCanonicalEmail(prisma, normalizedEmail, {
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Gebruiker met dit email adres bestaat al' 
      }, { status: 400 });
    }

    const usernameTrim = typeof username === 'string' ? username.trim() : '';
    if (!usernameTrim) {
      return NextResponse.json({ error: 'Gebruikersnaam vereist' }, { status: 400 });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findFirst({
      where: { username: { equals: usernameTrim, mode: 'insensitive' } },
      select: { id: true },
    });

    if (existingUsername) {
      return NextResponse.json({ 
        error: 'Gebruikersnaam is al in gebruik' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with proper profile data based on role
    const userData: any = {
      email: normalizedEmail,
      name,
      username: usernameTrim,
      passwordHash: hashedPassword,
      role: role as any,
      emailVerified: new Date(), // Auto-verify admin created users
      bio: `Account aangemaakt door admin op ${new Date().toLocaleDateString('nl-NL')}`,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
      taxResponsibilityAccepted: true,
      taxResponsibilityAcceptedAt: new Date(),
      marketingAccepted: false,
      displayFullName: false,
      displayNameOption: 'username',
      interests: role === 'ADMIN' ? ['Beheer', 'Moderatie', 'Ondersteuning'] : []
    };

    // Add role-specific profile creation
    if (role === 'SELLER') {
      // Validate business registration numbers if provided (optional for admin-created users, internationaal)
      const kvk = body.kvk || null; // Business registration number
      const btw = body.btw || null; // VAT number
      const userCountry = body.country || 'NL'; // Land van de gebruiker
      const isNetherlands = userCountry === 'NL';
      const isEU = ['BE', 'DE', 'FR', 'IT', 'ES', 'AT', 'PT', 'GR', 'IE', 'FI', 'SE', 'DK', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU'].includes(userCountry);
      
      // International validation for business registration number
      if (kvk && kvk.trim().length > 0) {
        const businessRegNumber = kvk.replace(/\s/g, '');
        if (isNetherlands) {
          // KVK: 8 digits for Netherlands
          if (!/^\d{8}$/.test(businessRegNumber)) {
            return NextResponse.json({ 
              error: 'KVK_INVALID_FORMAT' 
            }, { status: 400 });
          }
        } else if (isEU) {
          // VAT for EU: minimum 3 characters
          if (businessRegNumber.length < 3) {
            return NextResponse.json({ 
              error: 'VAT_INVALID_FORMAT' 
            }, { status: 400 });
          }
        } else {
          // Other countries: minimum 3 characters
          if (businessRegNumber.length < 3) {
            return NextResponse.json({ 
              error: 'BUSINESS_REGISTRATION_INVALID_FORMAT' 
            }, { status: 400 });
          }
        }
      }
      
      // International validation for VAT/BTW number
      if (btw && btw.trim().length > 0) {
        const vatClean = btw.replace(/\s/g, '').toUpperCase();
        if (isNetherlands) {
          // NL VAT: NL + 9 digits + B + 2 digits
          if (!/^NL\d{9}B\d{2}$/.test(vatClean)) {
            return NextResponse.json({ 
              error: 'VAT_INVALID_FORMAT' 
            }, { status: 400 });
          }
        } else if (isEU) {
          // EU VAT: Country code + 2-12 characters
          if (vatClean.length < 4 || vatClean.length > 14) {
            return NextResponse.json({ 
              error: 'VAT_INVALID_FORMAT' 
            }, { status: 400 });
          }
        } else {
          // Non-EU: basic validation
          if (vatClean.length < 3) {
            return NextResponse.json({ 
              error: 'VAT_INVALID_FORMAT' 
            }, { status: 400 });
          }
        }
      }

      userData.SellerProfile = {
        create: {
          id: require('crypto').randomUUID(),
          displayName: usernameTrim,
          companyName: name,
          bio: `Seller account created by admin on ${new Date().toISOString().split('T')[0]}. Note: Business registration numbers are placeholder values and should be updated by the user.`,
          // Add required fields for SellerProfile
          kvk: kvk,
          btw: btw,
          deliveryMode: 'FIXED',
          deliveryRadius: 5.0,
          deliveryRegions: []
        }
      };
    } else if (role === 'DELIVERY') {
      userData.DeliveryProfile = {
        create: {
          age: 25, // Default age, should be updated by user
          bio: `Bezorger account aangemaakt door admin`,
          transportation: ['BIKE'], // Default to bike
          maxDistance: 5.0,
        }
      };
    }

    const newUser = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
        emailVerified: true,
      }
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'USER_CREATED_SUCCESS'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
        error: 'ERROR_CREATING_USER'
    }, { status: 500 });
  }
}