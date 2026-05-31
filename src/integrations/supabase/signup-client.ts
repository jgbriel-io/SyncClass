import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

// Map-backed memory storage to avoid conflicts with localStorage from main client
const memoryStorageMap = new Map<string, string>();
const memoryStorage = {
  getItem: (key: string) => memoryStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStorageMap.set(key, value);
  },
  removeItem: (key: string) => {
    memoryStorageMap.delete(key);
  },
};

// Cliente separado para signUp sem afetar a sessão principal
export const supabaseSignupClient = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: memoryStorage,
      storageKey: "sb-signup-client-token",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
