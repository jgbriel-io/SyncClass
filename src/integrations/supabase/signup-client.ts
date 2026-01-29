import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// In-memory storage adapter to completely isolate this client from the main auth session
// This prevents "Multiple GoTrueClient instances" warnings and refresh token conflicts
class MemoryStorage {
  private storage: Record<string, string> = {};

  async getItem(key: string): Promise<string | null> {
    return this.storage[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage[key] = value;
  }

  async removeItem(key: string): Promise<void> {
    delete this.storage[key];
  }
}

// Separate client used ONLY for creating users via signUp (admin operation)
// Uses in-memory storage to completely isolate from the main auth session
// This prevents conflicts with the logged-in admin's session
export const supabaseSignupClient = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: new MemoryStorage(),
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'supabase-signup-isolated', // Different key to avoid conflicts
    },
  }
);
