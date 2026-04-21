import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, BookOpen, CreditCard, LogOut, Loader2, Settings, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SettingsModal } from "@/components/layout/SettingsModal";
import { InstallPWABanner } from "@/components/pwa/InstallPWABanner";

interface StudentLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Início", href: "/student", icon: Home },
  { name: "Histórico", href: "/student/history", icon: BookOpen },
  { name: "Atividades", href: "/student/activities", icon: FileText },
  { name: "Financeiro", href: "/student/financial", icon: CreditCard },
];

export function StudentLayout({ children }: StudentLayoutProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ⚡ P0-2: Skip link para acessibilidade WCAG A */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Pular para conteúdo principal
      </a>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to="/student" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">E</span>
            </div>
            <span className="text-sm font-semibold">English School</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Configurações"
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label={isLoggingOut ? "Saindo..." : "Sair da conta"}
              className="text-muted-foreground hover:text-foreground p-2 disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main id="main-content" className="pt-6 pb-6 px-4 animate-fade-in">{children}</main>

      {/* PWA Install Banner */}
      <InstallPWABanner />

      {/* Bottom navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        aria-label="Navegação principal"
      >
        <div className="flex items-center justify-around py-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                aria-label={item.name}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
