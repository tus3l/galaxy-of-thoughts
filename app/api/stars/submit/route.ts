import { NextRequest, NextResponse } from 'next/server';
import { submitStar, canUserSubmit } from '@/lib/supabase';
import { generateRandomPosition } from '@/lib/utils';

// Content moderation function using OpenAI
async function moderateContent(text: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Check for social media patterns (emails, phone numbers, social handles)
    const socialMediaPatterns = [
      /\b[\w\.-]+@[\w\.-]+\.\w+\b/gi, // Email
      /\b\d{10,}\b/g, // Phone numbers
      /(@|#)\w+/g, // @username or #hashtag
      /\b(twitter|instagram|facebook|snapchat|tiktok|telegram|whatsapp|discord)[\s:@\/]?\w*/gi,
      /\b(fb|ig|snap|tt)[\s:@\/]?\w+/gi,
      /\b(call|text|dm|message)\s*(me|at)?/gi,
    ];

    for (const pattern of socialMediaPatterns) {
      if (pattern.test(text)) {
        return {
          allowed: false,
          reason: 'Messages cannot contain contact information, social media handles, or usernames'
        };
      }
    }

    // Use OpenAI Moderation API if key is available
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: text }),
      });

      if (!response.ok) {
        console.error('OpenAI Moderation API error:', response.status);
        // Continue without OpenAI if API fails
        return { allowed: true };
      }

      const data = await response.json();
      const result = data.results[0];

      if (result.flagged) {
        const flaggedCategories = Object.entries(result.categories)
          .filter(([_, flagged]) => flagged)
          .map(([category]) => category);
        
        return {
          allowed: false,
          reason: `Your message contains inappropriate content: ${flaggedCategories.join(', ')}`
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Content moderation error:', error);
    // Allow message if moderation fails
    return { allowed: true };
  }
}

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

    // Content moderation check
    const moderation = await moderateContent(message);
    if (!moderation.allowed) {
      return NextResponse.json(
        { 
          error: `Your star was not published due to: ${moderation.reason}`,
          category: 'content_violation'
        },
        { status: 400 }
      );
    }

    // Check 24-hour limit
    const eligibility = await canUserSubmit(fingerprintId);
    
    if (!eligibility.canSubmit) {
      return NextResponse.json(
        {
          error: `You can only add one star every minute. Please wait ${eligibility.remainingTime} second(s) ✨`,
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
      star: {
        ...star,
        position, // Include position for camera animation
      },
      message: 'Your star has been added to the galaxy! ✨',
    });
  } catch (error: any) {
    console.error('Error submitting star:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
