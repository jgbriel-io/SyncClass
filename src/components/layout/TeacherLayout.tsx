import type { QueryClient } from "@tanstack/react-query";
import {
  SquaresFour as LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  ClipboardText as ClipboardList,
  Gear as Settings,
  FileText,
} from "@phosphor-icons/react";
import {
  RoleLayout,
  type RoleLayoutConfig,
} from "@/components/layout/RoleLayout";
import { layout, common } from "@/content";

interface TeacherLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/teacher", icon: LayoutDashboard, exact: true },
  { name: "Visão Geral", href: "/teacher/overview", icon: ClipboardList },
  { name: "Alunos", href: "/teacher/students", icon: Users },
  { name: "Aulas", href: "/teacher/classes", icon: BookOpen },
  { name: "Atividades", href: "/teacher/activities", icon: FileText },
  { name: "Financeiro", href: "/teacher/financial", icon: CreditCard },
  { name: layout.settings.title, href: "/teacher/settings", icon: Settings },
];

function onRouteChange(path: string, queryClient: QueryClient) {
  if (path === "/teacher" || path === "/teacher/") {
    queryClient.invalidateQueries({ queryKey: ["teacher-dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
    queryClient.invalidateQueries({
      queryKey: ["teacher-upcoming-payments"],
    });
    queryClient.invalidateQueries({ queryKey: ["teacher-birthdays"] });
    queryClient.invalidateQueries({
      queryKey: ["teacher-new-students-and-classes-by-month"],
    });
    queryClient.invalidateQueries({ queryKey: ["today_classes"] });
  } else if (
    path.startsWith("/teacher/overview") ||
    path.startsWith("/teacher/students") ||
    path.startsWith("/admin/overview") ||
    path.startsWith("/admin/students")
  ) {
    queryClient.invalidateQueries({ queryKey: ["students"] });
    queryClient.invalidateQueries({ queryKey: ["students_with_stats"] });
    queryClient.invalidateQueries({
      queryKey: ["class_logs_by_student_ids"],
    });
  } else if (path.startsWith("/teacher/classes")) {
    queryClient.invalidateQueries({ queryKey: ["class_logs"] });
    queryClient.invalidateQueries({ queryKey: ["class_logs_summary"] });
  } else if (path.startsWith("/teacher/activities")) {
    queryClient.invalidateQueries({ queryKey: ["activities"] });
  } else if (path.startsWith("/teacher/financial")) {
    queryClient.invalidateQueries({ queryKey: ["financial_records"] });
    queryClient.invalidateQueries({ queryKey: ["financial_summary"] });
  }
}

const config: RoleLayoutConfig = {
  role: "teacher",
  basePath: "/teacher",
  navigation,
  userInitialFallback: "P",
  userNameFallback: common.tooltips.teacher,
  scopeNotificationsToTeacher: true,
  onRouteChange,
};

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  return <RoleLayout config={config}>{children}</RoleLayout>;
}
