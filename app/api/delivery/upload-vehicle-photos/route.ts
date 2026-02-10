import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const uploadedPhotos: any[] = [];

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

    // Try Vercel Blob first
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

    for (const photo of photos) {
      // Validate file type
      if (!photo.type.startsWith('image/')) {
        return NextResponse.json({ 
          error: 'Alleen afbeeldingen zijn toegestaan' 
        }, { status: 400 });
      }

      // Validate file size (max 50MB - client compresses before upload)
      if (photo.size > 50 * 1024 * 1024) {
        return NextResponse.json({ 
          error: 'Foto is te groot. Probeer een kleinere foto.' 
        }, { status: 400 });
      }

      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let publicUrl: string | null = null;

      if (token) {
        try {
          const { put } = await import("@vercel/blob");
          const key = `delivery-vehicle-photos/${crypto.randomUUID()}-${photo.name}`;
          const blob = await put(key, buffer, {
            access: "public",
            token: token,
            addRandomSuffix: true,
          });
          publicUrl = blob.url;

        } catch (error) {
          console.error("Delivery vehicle photo upload failed:", error);
        }
      }

      // Fallback: use base64 data URL for development
      if (!publicUrl) {
        try {
          const base64 = buffer.toString('base64');
          const mimeType = photo.type || 'image/jpeg';
          publicUrl = `data:${mimeType};base64,${base64}`;

        } catch (e: any) {
          console.error("Base64 conversion failed:", e);
          return NextResponse.json({ error: "File processing failed" }, { status: 500 });
        }
      }

      if (!publicUrl) {
        return NextResponse.json({ error: "Upload mislukt" }, { status: 500 });
      }

      // Save photo record to database
      const savedPhoto = await prisma.vehiclePhoto.create({
        data: {
          deliveryProfileId: profile.id,
          fileUrl: publicUrl,
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
