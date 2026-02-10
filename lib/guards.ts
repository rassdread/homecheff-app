import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';

export async function requireAuth(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return session;
}

export async function requireAdmin(request: NextRequest) {
  const session = await requireAuth(request);
  
  if (session instanceof NextResponse) {
    return session; // Return the error response
  }
  
  // Check if user is admin
  if ((session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return session;
}

export async function requireSeller(request: NextRequest) {
  const session = await requireAuth(request);
  
  if (session instanceof NextResponse) {
    return session; // Return the error response
  }
  
  const user = session.user as any;
  
  // Check if user is seller or admin
  // Admin can access seller features if they have seller roles
  const isSeller = user.role === 'SELLER';
  const isAdmin = user.role === 'ADMIN';
  const hasSellerRoles = user.sellerRoles && user.sellerRoles.length > 0;
  
  // Allow if SELLER role, or ADMIN with seller roles
  if (!isSeller && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // If admin, check if they have seller roles
  if (isAdmin && !hasSellerRoles && !isSeller) {
    return NextResponse.json({ error: 'Admin access requires seller roles' }, { status: 403 });
  }
  
  return session;
}

export async function requireBuyer(request: NextRequest) {
  const session = await requireAuth(request);
  
  if (session instanceof NextResponse) {
    return session; // Return the error response
  }
  
  // Check if user is buyer
  if ((session.user as any).role !== 'BUYER' && (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return session;
}
