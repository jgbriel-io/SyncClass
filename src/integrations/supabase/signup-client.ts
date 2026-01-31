import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Map-backed memory storage to avoid conflicts with localStorage from main client
const memoryStorageMap = new Map<string, string>();
const memoryStorage = {
  getItem: (key: string) => memoryStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => { memoryStorageMap.set(key, value); },
  removeItem: (key: string) => { memoryStorageMap.delete(key); },
};

// Cliente separado para signUp sem afetar a sessão principal
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
