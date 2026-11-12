import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canReadCargoPhoto, validateCargoPhoto } from '@/lib/delivery/transport-job';
import { deleteCargoObject, isCargoObjectKey, newCargoObjectKey, putCargoObject, readCargoObject } from '@/lib/delivery/cargo-photo-store';

export const dynamic = 'force-dynamic';

async function viewer() {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id || null;
}

export async function POST(req: NextRequest) {
  const userId = await viewer();
  if (!userId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Kies een foto.', code: 'FILE_REQUIRED' }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const checked = validateCargoPhoto({ mimeType: file.type, sizeBytes: bytes.length });
  if (!checked.ok) {
    return NextResponse.json({ error: 'Alleen jpeg, png of webp tot 8 MB.', code: checked.code }, { status: 400 });
  }
  const objectKey = newCargoObjectKey();
  try {
    await putCargoObject({ objectKey, body: bytes, contentType: file.type });
  } catch {
    return NextResponse.json({ error: 'Privéopslag is niet beschikbaar.', code: 'PRIVATE_STORAGE_UNAVAILABLE' }, { status: 503 });
  }
  const photo = await prisma.deliveryCargoPhoto.create({
    data: {
      id: randomUUID(),
      ownerUserId: userId,
      objectKey,
      mimeType: file.type,
      sizeBytes: bytes.length,
    },
  });
  return NextResponse.json({ photoId: photo.id });
}

export async function GET(req: NextRequest) {
  const userId = await viewer();
  const photoId = req.nextUrl.searchParams.get('id');
  if (!photoId) return NextResponse.json({ error: 'Foto ontbreekt' }, { status: 400 });
  const photo = await prisma.deliveryCargoPhoto.findUnique({
    where: { id: photoId },
    include: { request: { select: { paymentStatus: true, deliveryProfileId: true } } },
  });
  if (!photo || photo.deletedAt || !isCargoObjectKey(photo.objectKey)) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }
  const courier = photo.request
    ? await prisma.deliveryProfile.findUnique({
        where: { id: photo.request.deliveryProfileId },
        select: { userId: true },
      })
    : null;
  const allowed = canReadCargoPhoto({
    ownerUserId: photo.ownerUserId,
    viewerUserId: userId,
    courierUserId: courier?.userId ?? null,
    paid: photo.request?.paymentStatus === 'PAID',
  });
  if (!allowed) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  const stored = await readCargoObject(photo.objectKey);
  if (!stored) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  return new NextResponse(stored.stream, {
    headers: {
      'Content-Type': stored.contentType,
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'inline',
    },
  });
}

export async function DELETE(req: NextRequest) {
  const userId = await viewer();
  if (!userId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  const photoId = req.nextUrl.searchParams.get('id');
  if (!photoId) return NextResponse.json({ error: 'Foto ontbreekt' }, { status: 400 });
  const photo = await prisma.deliveryCargoPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.ownerUserId !== userId) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  if (photo.requestId) {
    const request = await prisma.standaloneDeliveryRequest.findUnique({
      where: { id: photo.requestId },
      select: { paymentStatus: true },
    });
    if (request?.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Een betaalde opdracht houdt de foto.', code: 'PHOTO_LOCKED' }, { status: 409 });
    }
  }
  if (!photo.deletedAt) {
    await deleteCargoObject(photo.objectKey);
    await prisma.deliveryCargoPhoto.update({
      where: { id: photo.id },
      data: { deletedAt: new Date(), requestId: null },
    });
  }
  return NextResponse.json({ success: true });
}
