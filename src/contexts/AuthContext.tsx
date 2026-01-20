import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "student" | "professor" | null;

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
        .single();

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

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
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
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
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

    // Create profile and assign student role after signup
    if (data.user) {
      try {
        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          full_name: fullName,
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }

        // Assign student role by default
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: "student",
        });

        if (roleError) {
          console.error("Error assigning role:", roleError);
        }

        // Fetch the role immediately after creation to update state
        const userRole = await fetchUserRole(data.user.id);
        setRole(userRole);
        setIsLoading(false);
      } catch (err) {
        console.error("Error in post-signup setup:", err);
        setIsLoading(false);
      }
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
