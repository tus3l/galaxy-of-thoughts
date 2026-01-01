import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if user can submit a new star (30 minutes cooldown)
 * Also checks for suspicious activity (too many attempts)
 */
export async function canUserSubmit(fingerprintId: string): Promise<{ canSubmit: boolean; remainingTime?: number }> {
  // Validate fingerprint format
  if (!fingerprintId || typeof fingerprintId !== 'string' || fingerprintId.length > 200) {
    throw new Error('Invalid fingerprint ID');
  }

  // Check last 10 submissions to detect abuse
  const { data: recentSubmissions, error: countError } = await supabase
    .from('stars')
    .select('created_at')
    .eq('fingerprint_id', fingerprintId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (countError) {
    console.error('Error checking submission history:', countError);
  }

  // If user has 10+ stars, they're potentially abusing the system
  if (recentSubmissions && recentSubmissions.length >= 10) {
    const oldestOfTen = new Date(recentSubmissions[9].created_at);
    const now = new Date();
    const hoursSinceOldest = (now.getTime() - oldestOfTen.getTime()) / (1000 * 60 * 60);
    
    // If 10 submissions in less than 5 hours, block
    if (hoursSinceOldest < 5) {
      return { canSubmit: false, remainingTime: 30 };
    }
  }

  const { data, error } = await supabase
    .from('stars')
    .select('created_at')
    .eq('fingerprint_id', fingerprintId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // No previous submission found - user can submit
    return { canSubmit: true };
  }

  const lastSubmission = new Date(data.created_at);
  const now = new Date();
  const minutesSinceLastSubmission = (now.getTime() - lastSubmission.getTime()) / (1000 * 60);

  if (minutesSinceLastSubmission >= 30) {
    return { canSubmit: true };
  }

  const remainingTime = Math.ceil(30 - minutesSinceLastSubmission); // in minutes
  return { canSubmit: false, remainingTime };
}

/**
 * Submit a new star message
 */
export async function submitStar(
  fingerprintId: string,
  message: string,
  position: [number, number, number],
  color: string
) {
  const { data, error } = await supabase
    .from('stars')
    .insert([
      {
        fingerprint_id: fingerprintId,
        message,
        position_x: position[0],
        position_y: position[1],
        position_z: position[2],
        color,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
