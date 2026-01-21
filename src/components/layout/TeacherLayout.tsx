import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  BookOpen,
  CreditCard,
  BarChart2,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TeacherLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: "/teacher", icon: <Home className="h-4 w-4" />, label: "Início" },
    { to: "/teacher/students", icon: <Users className="h-4 w-4" />, label: "Alunos" },
    { to: "/teacher/classes", icon: <BookOpen className="h-4 w-4" />, label: "Aulas" },
    { to: "/teacher/financial", icon: <CreditCard className="h-4 w-4" />, label: "Cobranças" },
    { to: "/teacher/overview", icon: <BarChart2 className="h-4 w-4" />, label: "Visão Geral" },
  ];

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <span className="">Edu-Core</span>
            </NavLink>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                      isActive && "text-primary bg-muted"
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <NavLink
                  to="/"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  Edu-Core
                </NavLink>
                {navItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Pode adicionar uma barra de pesquisa aqui se desejar */}
          </div>
          <Button variant="secondary" size="icon" className="rounded-full" onClick={logout}>
            <Avatar>
              <AvatarImage src={user?.user_metadata.avatar_url} />
              <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
