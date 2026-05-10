import { NextResponse } from 'next/server';
import {
  buildAppVersionResponseFromEnv,
  type AppVersionApiResponse,
} from '@/lib/app-version-config';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<AppVersionApiResponse>> {
  try {
    const body = buildAppVersionResponseFromEnv();
    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch {
    return NextResponse.json(
      {
        latestWebVersion: '0.0.0',
        latestApkVersion: '0.0.0',
        minRequiredApkVersion: '0.0.0',
        apkUrl: '',
        updateTitle: 'HomeCheff',
        updateMessage: '',
        updateTitleForced: 'Update required',
        updateMessageForced: '',
        changelog: [],
        forceUpdate: false,
        enabled: false,
      },
      { status: 200 }
    );
  }
}
