import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/stars/search?id=123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const starId = searchParams.get('id');

    if (!starId) {
      return NextResponse.json(
        { error: 'Star ID is required' },
        { status: 400 }
      );
    }

    const id = parseInt(starId);
    
    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        { error: 'Invalid star ID' },
        { status: 400 }
      );
    }

    // البحث عن النجمة
    const { data: star, error } = await supabase
      .from('stars')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !star) {
      return NextResponse.json(
        { error: `Star #${id} not found in the galaxy 🌌` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      star: {
        id: star.id,
        message: star.message,
        position: [star.position_x, star.position_y, star.position_z],
        color: star.color,
        created_at: star.created_at,
      },
    });
  } catch (error) {
    console.error('Error searching for star:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching' },
      { status: 500 }
    );
  }
}
