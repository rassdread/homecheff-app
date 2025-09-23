import { NextRequest, NextResponse } from 'next/server';
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

    // Get user's delivery profile
    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId: (session.user as any).id }
    });

    if (!profile) {
      return NextResponse.json({ 
        error: 'Geen bezorger profiel gevonden' 
      }, { status: 404 });
    }

    // Check current photo count
    const currentPhotos = await prisma.vehiclePhoto.count({
      where: { deliveryProfileId: profile.id }
    });

    const formData = await req.formData();
    const photos = formData.getAll('photos') as File[];

    if (photos.length === 0) {
      return NextResponse.json({ 
        error: 'Geen foto\'s geüpload' 
      }, { status: 400 });
    }

    if (currentPhotos + photos.length > 5) {
      return NextResponse.json({ 
        error: 'Maximaal 5 foto\'s toegestaan' 
      }, { status: 400 });
    }

    const uploadedPhotos = [];

    for (const photo of photos) {
      // Validate file type
      if (!photo.type.startsWith('image/')) {
        return NextResponse.json({ 
          error: 'Alleen afbeeldingen zijn toegestaan' 
        }, { status: 400 });
      }

      // Validate file size (max 5MB)
      if (photo.size > 5 * 1024 * 1024) {
        return NextResponse.json({ 
          error: 'Foto\'s mogen maximaal 5MB zijn' 
        }, { status: 400 });
      }

      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = photo.name.split('.').pop() || 'jpg';
      const filename = `vehicle-${timestamp}-${randomString}.${extension}`;
      
      // Save file to public/uploads directory
      const path = join(process.cwd(), 'public', 'uploads', 'vehicles', filename);
      await writeFile(path, buffer);

      // Save photo record to database
      const savedPhoto = await prisma.vehiclePhoto.create({
        data: {
          deliveryProfileId: profile.id,
          fileUrl: `/uploads/vehicles/${filename}`,
          sortOrder: currentPhotos + uploadedPhotos.length + 1
        }
      });

      uploadedPhotos.push(savedPhoto);
    }

    return NextResponse.json({ 
      success: true, 
      photos: uploadedPhotos,
      message: `${uploadedPhotos.length} foto(s) succesvol geüpload`
    });

  } catch (error) {
    console.error('Vehicle photo upload error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het uploaden van de foto\'s' 
    }, { status: 500 });
  }
}
