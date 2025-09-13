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
  
  // Check if user is seller
  if ((session.user as any).role !== 'SELLER' && (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
