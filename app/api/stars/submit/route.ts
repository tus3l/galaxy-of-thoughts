import { NextRequest, NextResponse } from 'next/server';
import { submitStar, canUserSubmit } from '@/lib/supabase';
import { generateRandomPosition } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { fingerprintId, message } = await request.json();

    // Validation
    if (!fingerprintId || !message) {
      return NextResponse.json(
        { error: 'Fingerprint ID and message are required' },
        { status: 400 }
      );
    }

    if (message.length < 10 || message.length > 280) {
      return NextResponse.json(
        { error: 'Message must be between 10 and 280 characters' },
        { status: 400 }
      );
    }

    // Check 24-hour limit
    const eligibility = await canUserSubmit(fingerprintId);
    
    if (!eligibility.canSubmit) {
      return NextResponse.json(
        {
          error: 'يمكنك إضافة نجمة واحدة فقط كل 24 ساعة ✨',
          remainingTime: eligibility.remainingTime,
        },
        { status: 429 }
      );
    }

    // Generate random position for the star
    const position = generateRandomPosition(150);
    const color = '#ffffff'; // All stars are white

    // Submit to database
    const star = await submitStar(fingerprintId, message, position, color);

    return NextResponse.json({
      success: true,
      star,
      message: 'تم إضافة نجمتك إلى المجرة! ✨',
    });
  } catch (error: any) {
    console.error('Error submitting star:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
