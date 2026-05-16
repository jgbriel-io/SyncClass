import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { common } from "@/content";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "student" | "teacher")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (role === "student") {
      return <Navigate to="/student" replace />;
    } else if (role === "teacher") {
      return <Navigate to="/teacher" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
