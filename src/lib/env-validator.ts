/**
 * Environment variables validator
 * Ensures all required Supabase credentials are properly configured
 */

export function validateEnvironment() {
  const errors: string[] = [];
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not defined');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must start with https://');
  }
  
  if (!supabaseKey) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY is not defined');
  } else if (supabaseKey.length < 20) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY appears to be invalid (too short)');
  }
  
  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.join('; ')}`);
  }
}
