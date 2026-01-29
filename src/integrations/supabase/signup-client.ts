import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Map-backed memory storage to avoid conflicts with localStorage from main client
// Provides predictable behavior for testing and reentrancy
const memoryStorageMap = new Map<string, string>();

const memoryStorage = {
  getItem: (key: string): string | null => {
    return memoryStorageMap.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    memoryStorageMap.set(key, value);
  },
  removeItem: (key: string): void => {
    memoryStorageMap.delete(key);
  },
};

// Separate client used only for creating users via signUp, without
// touching the main auth session used by the app (no persisted session).
export const supabaseSignupClient = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: memoryStorage,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
