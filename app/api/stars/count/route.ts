import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { count, error } = await supabase
      .from('stars')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching stars count:', error);
      return NextResponse.json({ count: 0 }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
