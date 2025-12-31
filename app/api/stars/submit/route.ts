import { NextRequest, NextResponse } from 'next/server';
import { submitStar, canUserSubmit, supabase } from '@/lib/supabase';
import { generateRandomPosition } from '@/lib/utils';

// Content moderation function using OpenAI
async function moderateContent(text: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // 1. Use OpenAI Moderation API first for profanity/inappropriate content
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
          reason: `Your message contains inappropriate content detected by AI: ${flaggedCategories.join(', ')}`
        };
      }
    } else {
      console.warn('OpenAI API key not configured - AI moderation disabled');
    }

    // 2. Detect encoding/obfuscation attempts
    const suspiciousPatterns = [
      /[a-z0-9]{25,}/gi, // Long strings without spaces (possible encoding)
      /[\u200B-\u200D\uFEFF]/g, // Zero-width characters
      /[^\x00-\x7F]{20,}/g, // Too many non-ASCII characters
      /(.)\1{10,}/g, // Repeated characters (aaaaaaaa)
      /[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF.,!?'\"-]{8,}/gi, // Too many special symbols
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        return {
          allowed: false,
          reason: 'Messages cannot contain encoded text, excessive symbols, or obfuscated content'
        };
      }
    }

    // 3. Check for social media patterns (emails, phone numbers, social handles)
    const socialMediaPatterns = [
      /\b[\w\.-]+@[\w\.-]+\.\w+\b/gi, // Email
      /\b[\w\.-]+\s*@\s*[\w\.-]+\s*\.\s*\w+\b/gi, // Email with spaces
      /\b\d{10,}\b/g, // Phone numbers
      /\b\d[\s\.-]*\d[\s\.-]*\d[\s\.-]*\d[\s\.-]*\d[\s\.-]*\d[\s\.-]*\d[\s\.-]*\d[\s\.-]*\d[\s\.-]*\d/g, // Phone with separators
      /(@|#)\w+/g, // @username or #hashtag
      /\b(twitter|instagram|facebook|snapchat|tiktok|telegram|whatsapp|discord|youtube|linkedin)[\s:@\/]?\w*/gi,
      /\b(fb|ig|snap|tt|yt|twt)[\s:@\/]?\w+/gi,
      /\b(call|text|dm|message|contact|reach|whatsapp|snap)\s*(me|at)?/gi,
      /\b(add\s+me|follow\s+me|dm\s+me)/gi,
      /\b(www\.|http|\.com|\.net|\.org|\.io)/gi, // URLs
    ];

    for (const pattern of socialMediaPatterns) {
      if (pattern.test(text)) {
        return {
          allowed: false,
          reason: 'Messages cannot contain contact information, social media handles, usernames, or URLs'
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

    // Generate random position with collision detection
    let position: [number, number, number];
    let attempts = 0;
    const maxAttempts = 10;
    const minDistance = 15; // Minimum distance between stars

    // Get all existing star positions
    const { data: existingStars } = await supabase
      .from('stars')
      .select('position_x, position_y, position_z');

    const existingPositions = existingStars?.map(s => [s.position_x, s.position_y, s.position_z]) || [];

    // Try to find a position that doesn't collide
    do {
      position = generateRandomPosition(200);
      attempts++;
      
      // Check if position is far enough from all existing stars
      const isTooClose = existingPositions.some(existing => {
        const dx = position[0] - existing[0];
        const dy = position[1] - existing[1];
        const dz = position[2] - existing[2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return distance < minDistance;
      });

      if (!isTooClose) break;
    } while (attempts < maxAttempts);

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
