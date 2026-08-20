import { NextResponse } from 'next/server';
import { getBuildRevision } from '../../../lib/server-build-revision';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export function GET() {
  return NextResponse.json(
    { revision: getBuildRevision() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  );
}
