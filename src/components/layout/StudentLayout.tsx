import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, BookOpen, CreditCard, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StudentLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Início", href: "/student", icon: Home },
  { name: "Histórico", href: "/student/history", icon: BookOpen },
  { name: "Financeiro", href: "/student/financial", icon: CreditCard },
];

export function StudentLayout({ children }: StudentLayoutProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/student" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">E</span>
            </div>
            <span className="text-base font-semibold">EduCore</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-muted-foreground hover:text-foreground p-2 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="px-4 py-6 animate-fade-in">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-around py-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
