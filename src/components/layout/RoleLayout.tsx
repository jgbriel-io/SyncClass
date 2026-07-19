import { useState, useEffect, type ComponentType } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  X,
  SignOut as LogOut,
  CircleNotch as Loader2,
  CaretLeft as ChevronLeft,
  MagnifyingGlass as Search,
  Bell,
  Gear as Settings,
  List as Menu,
} from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingEvaluationClassLogs } from "@/hooks/useClassLogs";
import { useCurrentUserProfile } from "@/hooks/useUsers";
import { useActiveUserCheck } from "@/hooks/useActiveUserCheck";
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
import { Footer } from "@/components/layout/Footer";
import { layout, common } from "@/content";

export interface RoleNavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
}

export interface RoleLayoutConfig {
  role: "admin" | "teacher";
  basePath: "/admin" | "/teacher";
  navigation: RoleNavItem[];
  userInitialFallback: string;
  userNameFallback: string;
  /** Escopa notificações ao professor logado (teacher) ou global (admin). */
  scopeNotificationsToTeacher: boolean;
  onRouteChange: (path: string, queryClient: QueryClient) => void;
}

interface RoleLayoutProps {
  config: RoleLayoutConfig;
  children: React.ReactNode;
}

export function RoleLayout({ config, children }: RoleLayoutProps) {
  const {
    role,
    basePath,
    navigation,
    userInitialFallback,
    userNameFallback,
    scopeNotificationsToTeacher,
    onRouteChange,
  } = config;

  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signOut, user } = useAuth();

  // Verificar se usuário está ativo (logout automático se desativado)
  useActiveUserCheck();

  useEffect(() => {
    if (location.pathname.startsWith(`${basePath}/students`)) {
      setSearchQuery(searchParams.get("search") ?? "");
    }
  }, [location.pathname, searchParams, basePath]);

  const { data: profile } = useCurrentUserProfile(user?.id);
  const teacherId = profile?.teacher_id;
  const { data: pendingClasses = [], isLoading: loadingNotifications } =
    usePendingEvaluationClassLogs(
      scopeNotificationsToTeacher ? teacherId : undefined
    );

  useEffect(() => {
    onRouteChange(location.pathname, queryClient);
  }, [location.pathname, queryClient, onRouteChange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`${basePath}/students?search=${encodeURIComponent(q)}`);
    else navigate(`${basePath}/students`);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
  };

  const userInitial =
    user?.email?.charAt(0).toUpperCase() || userInitialFallback;
  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    userNameFallback;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm laptop:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-[72px]" : "w-64",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full laptop:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border",
            sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <Link to={basePath} className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-md">
              <span className="text-sidebar-primary-foreground font-bold text-base">
                {layout.logo.initial}
              </span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-semibold text-sidebar-foreground tracking-tight">
                {common.app.name}
              </span>
            )}
          </Link>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="laptop:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className={cn("space-y-1", sidebarCollapsed ? "px-2" : "px-3")}>
            {navigation.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    "group flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    sidebarCollapsed && "justify-center px-2",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive && "drop-shadow-sm"
                    )}
                  />
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
              "hidden laptop:flex w-full items-center gap-4 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                sidebarCollapsed && "rotate-180"
              )}
            />
            {!sidebarCollapsed && <span>{layout.sidebar.collapse}</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "flex w-full items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5 shrink-0" />
            )}
            {!sidebarCollapsed && (
              <span>
                {isLoggingOut
                  ? layout.sidebar.loggingOut
                  : layout.sidebar.logout}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "laptop:pl-[72px]" : "laptop:pl-64"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 tablet:px-5 laptop:px-6 desktop:px-8">
          {/* Left: menu + search */}
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="laptop:hidden shrink-0 text-muted-foreground hover:text-foreground"
              type="button"
              aria-label={layout.sidebar.openMenu}
            >
              <Menu className="h-6 w-6" />
            </button>
            <form
              onSubmit={handleSearchSubmit}
              className="hidden tablet:block w-full max-w-sm"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder={layout.topbar.searchPlaceholder}
                  className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={layout.topbar.searchAriaLabel}
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
                  aria-label={layout.topbar.notifications}
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {pendingClasses.length > 0 && (
                    <span
                      className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"
                      aria-hidden
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  {layout.topbar.notifications}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[320px] overflow-y-auto py-2">
                  {loadingNotifications ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : pendingClasses.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                      {layout.topbar.noNotifications}
                    </p>
                  ) : (
                    <ul className="space-y-0.5">
                      {pendingClasses.map((log) => (
                        <li key={log.id}>
                          <Link
                            to={`${basePath}/classes?status=avaliacao_pendente`}
                            className="block rounded-md px-2 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                          >
                            <span className="font-medium text-foreground">
                              {layout.topbar.notificationPending}
                            </span>
                            <p className="mt-0.5 truncate text-muted-foreground">
                              {(log.students as { name?: string } | null)
                                ?.name ?? "Aluno"}{" "}
                              ·{" "}
                              {log.class_date &&
                                format(
                                  new Date(log.class_date + "T12:00:00"),
                                  "dd/MM/yyyy",
                                  { locale: ptBR }
                                )}
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
                    <AvatarImage
                      src={profile?.avatar_url ?? undefined}
                      alt=""
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{layout.topbar.myAccount}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => navigate(`${basePath}/settings`)}
                >
                  <Settings className="h-4 w-4" />
                  {layout.topbar.settings}
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
                  {isLoggingOut
                    ? layout.sidebar.loggingOut
                    : layout.sidebar.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content - flex-1 faz crescer para empurrar o footer para baixo */}
        <main
          data-role={role}
          className="flex-1 p-4 tablet:p-5 laptop:p-6 desktop:p-8 animate-fade-in"
        >
          {children}
        </main>

        {/* Footer - sempre no bottom */}
        <Footer />
      </div>
    </div>
  );
}
