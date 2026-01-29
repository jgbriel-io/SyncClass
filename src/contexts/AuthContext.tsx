import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "student" | "teacher" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching role:", error);
        return null;
      }
      return data?.role as UserRole;
    } catch (error) {
      console.error("Error fetching role:", error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Handle invalid refresh token errors by forcing logout
    const handleInvalidRefreshToken = async () => {
      console.warn("Invalid refresh token detected - forcing logout");
      try {
        await supabase.auth.signOut();
        // Clear all auth-related items from localStorage
        const keysToRemove = Object.keys(localStorage).filter(
          key => key.startsWith('supabase') || key.includes('auth')
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.error("Error during forced logout:", error);
      }
      
      setUser(null);
      setSession(null);
      setRole(null);
      setIsLoading(false);
      
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        // Handle sign out or session expired
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setSession(null);
          setUser(null);
          setRole(null);
          setIsLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        // Defer role fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            if (!isMounted) return;
            const userRole = await fetchUserRole(session.user.id);
            if (isMounted) {
              setRole(userRole);
              setIsLoading(false);
            }
          }, 0);
        } else {
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      
      // Handle invalid refresh token error
      if (error) {
        console.error("Error getting session:", error);
        if (
          error.message?.includes("Invalid Refresh Token") ||
          error.message?.includes("Refresh Token Not Found") ||
          error.message?.includes("refresh_token")
        ) {
          handleInvalidRefreshToken();
          return;
        }
      }
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id).then((userRole) => {
          if (isMounted) {
            setRole(userRole);
            setIsLoading(false);
          }
        });
      } else {
        setIsLoading(false);
      }
    }).catch((error) => {
      console.error("Unexpected error in getSession:", error);
      if (isMounted) {
        handleInvalidRefreshToken();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error as Error };
    }

    const authenticatedUser = data?.user ?? data?.session?.user ?? null;

    if (authenticatedUser) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("active")
        .eq("user_id", authenticatedUser.id)
        .single();

      if (!profileError && profile && profile.active === false) {
        await supabase.auth.signOut();
        return {
          error: new Error(
            "Sua conta está inativa. Entre em contato com a secretaria."
          ),
        };
      }
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error: error as Error };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
