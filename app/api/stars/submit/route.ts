import { NextRequest, NextResponse } from 'next/server';
import { submitStar, canUserSubmit, supabase } from '@/lib/supabase';
import { generateRandomPosition } from '@/lib/utils';

// Content moderation function using OpenAI
async function moderateContent(text: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    console.log('🔍 Moderating content:', text.substring(0, 50));
    
    // Remove spaces and special chars for checking obfuscated words
    const normalizedText = text.toLowerCase().replace(/[\s\-_\.]/g, '');
    console.log('Normalized text:', normalizedText.substring(0, 50));
    
    // FIRST: Basic profanity filter (backup if OpenAI fails)
    const profanityWords = [
      'fuck', 'shit', 'bitch', 'damn', 'crap', 'hell', 'bastard', 
      'dick', 'pussy', 'whore', 'slut', 'cock', 'piss', 'cunt',
      'fck', 'fuk', 'fuc', 'sht', 'btch', 'dck', 'pss',
      // Arabic
      'كس', 'زب', 'عرص', 'خرا', 'شرموط', 'كسمك', 'عرص',
    ];

    // Check normalized text (catches "f u c k", "f.u.c.k", etc.)
    for (const word of profanityWords) {
      if (normalizedText.includes(word)) {
        console.log('❌ Profanity detected (normalized):', word);
        return {
          allowed: false,
          reason: 'Your message contains inappropriate or offensive language'
        };
      }
    }
    
    // Also check with regex patterns for variations
    const profanityPatterns = [
      /f[\s\-_\.]*u[\s\-_\.]*c[\s\-_\.]*k/gi,
      /s[\s\-_\.]*h[\s\-_\.]*i[\s\-_\.]*t/gi,
      /b[\s\-_\.]*i[\s\-_\.]*t[\s\-_\.]*c[\s\-_\.]*h/gi,
      /d[\s\-_\.]*i[\s\-_\.]*c[\s\-_\.]*k/gi,
      /a[\s\-_\.]*s[\s\-_\.]*s/gi,
      /p[\s\-_\.]*u[\s\-_\.]*s[\s\-_\.]*s[\s\-_\.]*y/gi,
      /f+u+c+k+/gi, /s+h+i+t+/gi, /b+i+t+c+h+/gi,
      /f[\*@u]ck/gi, /sh[\*!1i]t/gi, /b[\*!1i]tch/gi,
    ];

    for (const pattern of profanityPatterns) {
      if (pattern.test(text)) {
        console.log('❌ Profanity detected by pattern:', pattern);
        return {
          allowed: false,
          reason: 'Your message contains inappropriate or offensive language'
        };
      }
    }
    
    // SECOND: Try Perspective API (Google's toxicity detection)
    if (process.env.PERSPECTIVE_API_KEY) {
      console.log('🔍 Checking with Perspective API...');
      try {
        const response = await fetch(
          `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              comment: { text },
              languages: ['en', 'ar'],
              requestedAttributes: {
                TOXICITY: {},
                SEVERE_TOXICITY: {},
                IDENTITY_ATTACK: {},
                INSULT: {},
                PROFANITY: {},
                THREAT: {},
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Perspective API error:', response.status, errorText);
          // Continue with other checks
        } else {
          const data = await response.json();
          console.log('Perspective API result:', data);

          // Check toxicity scores (threshold: 0.7 = 70% toxic)
          const toxicityScore = data.attributeScores?.TOXICITY?.summaryScore?.value || 0;
          const severeToxicityScore = data.attributeScores?.SEVERE_TOXICITY?.summaryScore?.value || 0;
          const profanityScore = data.attributeScores?.PROFANITY?.summaryScore?.value || 0;
          const insultScore = data.attributeScores?.INSULT?.summaryScore?.value || 0;

          console.log('Toxicity scores:', {
            toxicity: toxicityScore,
            severeToxicity: severeToxicityScore,
            profanity: profanityScore,
            insult: insultScore,
          });

          if (toxicityScore > 0.7 || severeToxicityScore > 0.5 || profanityScore > 0.7 || insultScore > 0.7) {
            console.log('❌ Perspective API flagged content');
            return {
              allowed: false,
              reason: 'Your message contains toxic or offensive content detected by AI'
            };
          }
          console.log('✅ Perspective API passed');
        }
      } catch (perspectiveError) {
        console.error('❌ Perspective API fetch error:', perspectiveError);
        // Continue with other checks
      }
    } else {
      console.warn('⚠️ Perspective API key not configured');
    }
    
    // THIRD: Try OpenAI Moderation API
    if (process.env.OPENAI_API_KEY) {
      console.log('🤖 Checking with OpenAI...');
      try {
        const response = await fetch('https://api.openai.com/v1/moderations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({ input: text }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenAI API error:', response.status, errorText);
          // Continue with other checks
        } else {
          const data = await response.json();
          const result = data.results[0];
          console.log('OpenAI result:', result);

          if (result.flagged) {
            const flaggedCategories = Object.entries(result.categories)
              .filter(([_, flagged]) => flagged)
              .map(([category]) => category);
            
            console.log('❌ OpenAI flagged:', flaggedCategories);
            return {
              allowed: false,
              reason: `Your message contains inappropriate content: ${flaggedCategories.join(', ')}`
            };
          }
          console.log('✅ OpenAI passed');
        }
      } catch (openaiError) {
        console.error('❌ OpenAI fetch error:', openaiError);
        // Continue with other checks
      }
    } else {
      console.warn('⚠️ OpenAI API key not configured');
    }

    // THIRD: Detect encoding/obfuscation attempts
    const suspiciousPatterns = [
      /[a-z0-9]{25,}/gi, // Long strings without spaces (possible encoding)
      /[\u200B-\u200D\uFEFF]/g, // Zero-width characters
      /[^\x00-\x7F]{20,}/g, // Too many non-ASCII characters
      /(.)\1{10,}/g, // Repeated characters (aaaaaaaa)
      /[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF.,!?'\"-]{8,}/gi, // Too many special symbols
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        console.log('❌ Suspicious pattern detected');
        return {
          allowed: false,
          reason: 'Messages cannot contain encoded text, excessive symbols, or obfuscated content'
        };
      }
    }

    // FOURTH: Check for social media patterns (emails, phone numbers, social handles)
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
        console.log('❌ Social media pattern detected');
        return {
          allowed: false,
          reason: 'Messages cannot contain contact information, social media handles, usernames, or URLs'
        };
      }
    }

    console.log('✅ All moderation checks passed');
    return { allowed: true };
  } catch (error) {
    console.error('❌ Content moderation error:', error);
    // IMPORTANT: Reject on error to be safe
    return { 
      allowed: false,
      reason: 'Unable to verify content safety. Please try again.'
    };
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
