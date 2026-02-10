import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { photoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const photoId = params.photoId;

    // Get the photo with delivery profile info
    const photo = await prisma.vehiclePhoto.findUnique({
      where: { id: photoId },
      include: {
        deliveryProfile: {
          select: { userId: true }
        }
      }
    });

    if (!photo) {
      return NextResponse.json({ 
        error: 'Foto niet gevonden' 
      }, { status: 404 });
    }

    // Check if user owns this photo
    if (photo.deliveryProfile.userId !== (session.user as any).id) {
      return NextResponse.json({ 
        error: 'Geen toegang tot deze foto' 
      }, { status: 403 });
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', photo.fileUrl);
      await unlink(filePath);
    } catch (fileError) {
      console.warn('Could not delete file from filesystem:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete photo record from database
    await prisma.vehiclePhoto.delete({
      where: { id: photoId }
    });

    // Update sort orders for remaining photos
    const remainingPhotos = await prisma.vehiclePhoto.findMany({
      where: { deliveryProfileId: photo.deliveryProfileId },
      orderBy: { sortOrder: 'asc' }
    });

    for (let i = 0; i < remainingPhotos.length; i++) {
      await prisma.vehiclePhoto.update({
        where: { id: remainingPhotos[i].id },
        data: { sortOrder: i + 1 }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Foto succesvol verwijderd'
    });

  } catch (error) {
    console.error('Vehicle photo delete error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het verwijderen van de foto' 
    }, { status: 500 });
  }
}
