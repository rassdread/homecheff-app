import { NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import PitchPDFDocument from '@/components/pitch/PitchPDFDocument';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FILENAME = 'Investor pitch HomeCheff.pdf';

export async function GET() {
  try {
    const element = React.createElement(PitchPDFDocument);
    const buffer = await renderToBuffer(element);
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${FILENAME}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[pitch-pdf]', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
