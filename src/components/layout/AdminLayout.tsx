import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  Link2,
  Menu,
  X,
  LogOut,
  ClipboardList,
  Loader2,
  ChevronLeft,
  Search,
  Bell,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Visão Geral", href: "/admin/students/overview", icon: ClipboardList },
  { name: "Alunos", href: "/admin/students", icon: Users },
  { name: "Aulas", href: "/admin/classes", icon: BookOpen },
  { name: "Financeiro", href: "/admin/financial", icon: CreditCard },
  { name: "Professores", href: "/admin/teachers", icon: Users },
  { name: "Usuários", href: "/admin/users", icon: Link2 },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "A";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          <Link to="/admin" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 flex items-center justify-center shadow-lg">
              <span className="text-sidebar-primary-foreground font-bold text-base">E</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold text-sidebar-foreground tracking-tight">
                EduCore
              </span>
            )}
          </Link>
          
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className={cn("space-y-1", sidebarCollapsed ? "px-2" : "px-3")}>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    sidebarCollapsed && "justify-center px-2",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-sm")} />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {/* Collapse toggle - desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300", sidebarCollapsed && "rotate-180")} />
            {!sidebarCollapsed && <span>Recolher</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            {!sidebarCollapsed && (isLoggingOut ? "Saindo..." : "Sair")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alunos, aulas..."
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-foreground">
                      {userInitial}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {isLoggingOut ? "Saindo..." : "Sair"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
