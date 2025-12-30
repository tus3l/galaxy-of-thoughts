import { NextRequest, NextResponse } from 'next/server';
import { canUserSubmit } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { fingerprintId } = await request.json();

    if (!fingerprintId) {
      return NextResponse.json(
        { error: 'Fingerprint ID is required' },
        { status: 400 }
      );
    }

    const result = await canUserSubmit(fingerprintId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking submission eligibility:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
