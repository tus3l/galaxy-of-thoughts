import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if user can submit a new star (24 hour cooldown)
 */
export async function canUserSubmit(fingerprintId: string): Promise<{ canSubmit: boolean; remainingTime?: number }> {
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
  const hoursSinceLastSubmission = (now.getTime() - lastSubmission.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastSubmission >= 24) {
    return { canSubmit: true };
  }

  const remainingTime = Math.ceil((24 - hoursSinceLastSubmission) * 60); // في دقائق
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
