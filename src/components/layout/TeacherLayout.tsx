import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePendingEvaluationClassLogs } from "@/hooks/useClassLogs";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { SettingsModal } from "@/components/layout/SettingsModal";

interface TeacherLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { name: "Visão Geral", href: "/teacher/overview", icon: ClipboardList },
  { name: "Alunos", href: "/teacher/students", icon: Users },
  { name: "Aulas", href: "/teacher/classes", icon: BookOpen },
  { name: "Financeiro", href: "/teacher/financial", icon: CreditCard },
];

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signOut, user } = useAuth();

  useEffect(() => {
    if (location.pathname.startsWith("/teacher/students")) {
      setSearchQuery(searchParams.get("search") ?? "");
    }
  }, [location.pathname, searchParams]);
  const { data: profile } = useCurrentUserProfile(user?.id);
  const { data: teacherProfile } = useQuery({
    queryKey: ["teacher-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("teacher_id")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
  const teacherId = teacherProfile?.teacher_id;
  const { data: pendingClasses = [], isLoading: loadingNotifications } = usePendingEvaluationClassLogs(teacherId);

  useEffect(() => {
    const path = location.pathname;
    if (path === "/teacher" || path === "/teacher/") {
      queryClient.invalidateQueries({ queryKey: ["teacher-dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-upcoming-payments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-birthdays"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-new-students-and-classes-by-month"] });
      queryClient.invalidateQueries({ queryKey: ["today_classes"] });
    } else if (path.startsWith("/teacher/overview") || path.startsWith("/teacher/students")) {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students_with_stats"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_by_student_ids"] });
    } else if (path.startsWith("/teacher/classes")) {
      queryClient.invalidateQueries({ queryKey: ["class_logs"] });
      queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
    } else if (path.startsWith("/teacher/financial")) {
      queryClient.invalidateQueries({ queryKey: ["financial_records"] });
      queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
    }
  }, [location.pathname, queryClient]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/teacher/students?search=${encodeURIComponent(q)}`);
    else navigate("/teacher/students");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "P";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Professor";

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
          <Link to="/teacher" className="flex items-center gap-3">
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
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5 shrink-0" />
            )}
            {!sidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
      )}>
        {/* Top bar - alinhado ao AdminLayout */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          {/* Left: menu + search */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden shrink-0 text-muted-foreground hover:text-foreground"
              type="button"
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <form onSubmit={handleSearchSubmit} className="hidden md:block w-full max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Buscar aluno (nome, e-mail...)"
                  className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar aluno por nome ou e-mail"
                />
              </div>
            </form>
          </div>

          {/* Right: notifications + user */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label="Notificações"
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {pendingClasses.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" aria-hidden />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notificações
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[320px] overflow-y-auto py-2">
                  {loadingNotifications ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : pendingClasses.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                      Nenhuma notificação no momento
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {pendingClasses.map((log) => (
                        <li key={log.id}>
                          <Link
                            to="/teacher/classes?status=avaliacao_pendente"
                            className="block rounded-md px-2 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                          >
                            <span className="font-medium text-foreground">Avaliação pendente</span>
                            <p className="mt-0.5 truncate text-muted-foreground">
                              {(log.students as { name?: string } | null)?.name ?? "Aluno"} · {log.class_date && format(new Date(log.class_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-medium">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onClick={() => setSettingsOpen(true)}>
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
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
