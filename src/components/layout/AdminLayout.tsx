import type { QueryClient } from "@tanstack/react-query";
import {
  SquaresFour as LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  Link as Link2,
  ClipboardText as ClipboardList,
  Gear as Settings,
  FileText,
} from "@phosphor-icons/react";
import {
  RoleLayout,
  type RoleLayoutConfig,
} from "@/components/layout/RoleLayout";
import { layout } from "@/content";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Visão Geral", href: "/admin/overview", icon: ClipboardList },
  { name: "Alunos", href: "/admin/students", icon: Users },
  { name: "Aulas", href: "/admin/classes", icon: BookOpen },
  { name: "Atividades", href: "/admin/activities", icon: FileText },
  { name: "Financeiro", href: "/admin/financial", icon: CreditCard },
  { name: "Professores", href: "/admin/teachers", icon: Users },
  { name: "Usuários", href: "/admin/users", icon: Link2 },
  { name: layout.settings.title, href: "/admin/settings", icon: Settings },
];

function onRouteChange(path: string, queryClient: QueryClient) {
  if (path === "/admin" || path === "/admin/") {
    queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
    queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
    queryClient.invalidateQueries({ queryKey: ["upcoming_payments"] });
    queryClient.invalidateQueries({ queryKey: ["birthdays_this_month"] });
    queryClient.invalidateQueries({
      queryKey: ["new_students_and_classes_by_month"],
    });
    queryClient.invalidateQueries({ queryKey: ["today_classes"] });
  } else if (path.startsWith("/admin/students")) {
    queryClient.invalidateQueries({ queryKey: ["students"] });
    queryClient.invalidateQueries({ queryKey: ["students_with_stats"] });
    queryClient.invalidateQueries({
      queryKey: ["class_logs_by_student_ids"],
    });
  } else if (path.startsWith("/admin/classes")) {
    queryClient.invalidateQueries({ queryKey: ["class_logs"] });
    queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
  } else if (path.startsWith("/admin/financial")) {
    queryClient.invalidateQueries({ queryKey: ["financial_records"] });
    queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
  } else if (path.startsWith("/admin/teachers")) {
    queryClient.invalidateQueries({ queryKey: ["teachers"] });
  } else if (path.startsWith("/admin/activities")) {
    queryClient.invalidateQueries({ queryKey: ["activities"] });
  } else if (path.startsWith("/admin/users")) {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  }
}

const config: RoleLayoutConfig = {
  role: "admin",
  basePath: "/admin",
  navigation,
  userInitialFallback: "A",
  userNameFallback: "Admin",
  scopeNotificationsToTeacher: false,
  onRouteChange,
};

export function AdminLayout({ children }: AdminLayoutProps) {
  return <RoleLayout config={config}>{children}</RoleLayout>;
}
