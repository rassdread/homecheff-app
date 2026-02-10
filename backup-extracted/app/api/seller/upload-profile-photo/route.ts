import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const formData = await req.formData();
    const photo = formData.get('photo') as File;

    if (!photo) {
      return NextResponse.json({ 
        error: 'Geen foto geüpload' 
      }, { status: 400 });
    }

    // Validate file type
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Alleen afbeeldingen zijn toegestaan' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'Foto mag maximaal 5MB zijn' 
      }, { status: 400 });
    }

    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = photo.name.split('.').pop() || 'jpg';
    const filename = `profile-${timestamp}-${randomString}.${extension}`;
    
    // Save file to public/uploads directory
    const path = join(process.cwd(), 'public', 'uploads', 'profile', filename);
    await writeFile(path, buffer);

    // Update user profile photo
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        image: `/uploads/profile/${filename}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      imageUrl: `/uploads/profile/${filename}`,
      message: 'Profielfoto succesvol geüpload'
    });

  } catch (error) {
    console.error('Profile photo upload error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het uploaden van de profielfoto' 
    }, { status: 500 });
  }
}
