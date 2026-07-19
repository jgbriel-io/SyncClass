import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";
import { common } from "@/content";

interface AuthRedirectProps {
  children: React.ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{common.labels.loading}</p>
        </div>
      </div>
    );
  }

  // If user is logged in, redirect based on role
  if (user && role) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "student") return <Navigate to="/student" replace />;
    if (role === "teacher") return <Navigate to="/teacher" replace />;
  }

  return <>{children}</>;
}
