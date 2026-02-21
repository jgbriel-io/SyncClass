import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/sentry";

type UserRole = "admin" | "student" | "teacher" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  isLoading: boolean;
  mustChangePassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  onPasswordChanged: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!roleError && roleData?.role) return roleData.role as UserRole;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role, teacher_id, must_change_password")
        .eq("user_id", userId)
        .maybeSingle();

      if (!profileError && profileData) {
        // Atualizar flag de troca de senha
        setMustChangePassword(profileData.must_change_password === true);
        
        const r = profileData.role as string;
        if (r === "admin" || r === "student" || r === "teacher") return r as UserRole;
        if (profileData.teacher_id) return "teacher";
      }
      return null;
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), { userId, context: "fetchUserRole" });
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Handle invalid refresh token errors with robust cleanup
    const handleInvalidRefreshToken = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      logger.warn("Invalid refresh token detected, clearing session", {
        userId: currentUser?.id,
      });
      
      // Clear user context in Sentry
      logger.clearUser();
      
      // Use signOut from the client for complete cleanup
      await supabase.auth.signOut();
      
      // Additional cleanup: remove all sb-* keys from localStorage
      Object.keys(localStorage)
        .filter(key => key.startsWith('sb-'))
        .forEach(key => localStorage.removeItem(key));
      
      setUser(null);
      setSession(null);
      setRole(null);
      setIsLoading(false);
      
      window.location.href = "/login";
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        // Detect token refresh errors
        if (event === "TOKEN_REFRESHED" && !session) {
          await handleInvalidRefreshToken();
          return;
        }

        if (event === "SIGNED_OUT") {
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
              
              // Set user context in Sentry for better error tracking
              logger.setUser({
                id: session.user.id,
                email: session.user.email,
                role: userRole || undefined,
              });
              
              logger.addBreadcrumb(
                "User authenticated",
                "auth",
                { role: userRole || "unknown" }
              );
            }
          }, 0);
        } else {
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    // Fallback: Listen for unhandled promise rejections (refresh token errors)
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const errorMessage = error?.message || error?.toString() || "";
      
      if (
        errorMessage.includes("Invalid Refresh Token") ||
        errorMessage.includes("Refresh Token Not Found") ||
        errorMessage.includes("refresh_token_not_found")
      ) {
        event.preventDefault();
        await handleInvalidRefreshToken();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id).then((userRole) => {
          if (isMounted) {
            setRole(userRole);
            setIsLoading(false);
            
            // Set user context in Sentry
            logger.setUser({
              id: session.user.id,
              email: session.user.email,
              role: userRole || undefined,
            });
          }
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error as Error };

    const authenticatedUser = data?.user ?? data?.session?.user ?? null;
    if (authenticatedUser) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("active")
        .eq("user_id", authenticatedUser.id)
        .single();

      if (!profileError && profile && profile.active === false) {
        await supabase.auth.signOut();
        return { error: new Error("Sua conta está inativa. Entre em contato com a secretaria.") };
      }

      const userRole = await fetchUserRole(authenticatedUser.id);
      setRole(userRole);
      setIsLoading(false);
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
    logger.addBreadcrumb("User signed out", "auth", { userId: user?.id });
    logger.clearUser();
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setMustChangePassword(false);
  };

  const onPasswordChanged = () => {
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        mustChangePassword,
        signIn,
        signUp,
        signOut,
        onPasswordChanged,
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
