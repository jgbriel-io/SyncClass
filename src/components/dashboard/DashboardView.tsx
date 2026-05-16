import { useState } from "react";
import {
  Users,
  AlertCircle,
  TrendingUp,
  GraduationCap,
  Loader2,
  Bell,
  ChevronRight,
  ChevronDown,
  DollarSign,
  UserPlus,
  Link2,
  Zap,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MetricCard } from "./MetricCard";
import { DashboardFinancialCards } from "./DashboardFinancialCards";
import { DashboardTodayClasses } from "./DashboardTodayClasses";
import { DashboardUpcomingPayments } from "./DashboardUpcomingPayments";
import { DashboardBirthdayList } from "./DashboardBirthdayList";
import { DashboardGrowthChart } from "./DashboardGrowthChart";
import type { TodayClassesData } from "@/hooks/useTodayClasses";
import type { ForecastedBilling } from "@/hooks/useForecastedBilling";
import { dashboard } from "@/content";

import type { ChartMonthsFilter, ChartLineFilterAdmin, ChartLineFilterTeacher, ChartDataPoint } from "./DashboardGrowthChart";

export interface DashboardStats {
  activeStudents: number;
  overdueCount: number;
  newStudentsThisMonth: number;
  classesThisMonth: number;
}

export interface UpcomingPayment {
  id: string;
  studentName: string;
  dueDate: string;
  amount: number;
}

export interface Birthday {
  id: string;
  name: string;
  birthDate: string;
}

export interface FinancialSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalReceivable: number;
}

interface DashboardViewProps {
  title?: string;
  subtitle?: string;
  stats: DashboardStats | undefined;
  financialSummary?: FinancialSummary | undefined;
  forecastedBilling?: ForecastedBilling | undefined;
  upcomingPayments: UpcomingPayment[];
  birthdays: Birthday[];
  chartData: ChartDataPoint[];
  todayClasses: TodayClassesData | undefined;
  /** Número de aulas pendentes de feedback (avaliação). Exibido no topo do dashboard. */
  pendingFeedbackCount?: number;
  isLoading: boolean;
  chartLoading?: boolean;
  basePath: "/admin" | "/teacher";
  chartMonths?: ChartMonthsFilter;
  onChartMonthsChange?: (v: ChartMonthsFilter) => void;
  chartLines?: ChartLineFilterAdmin | ChartLineFilterTeacher;
  onChartLinesChange?: (v: ChartLineFilterAdmin | ChartLineFilterTeacher) => void;
}

export function DashboardView({
  title = "Dashboard",
  subtitle,
  stats,
  financialSummary,
  forecastedBilling,
  upcomingPayments,
  birthdays,
  chartData,
  todayClasses,
  pendingFeedbackCount = 0,
  isLoading,
  chartLoading = false,
  basePath,
  chartMonths = 3,
  onChartMonthsChange,
  chartLines,
  onChartLinesChange,
}: DashboardViewProps) {
  const [isQuickActionsExpanded, setIsQuickActionsExpanded] = useState(true);

  const overduePercentage = stats && stats.activeStudents > 0
    ? ((stats.overdueCount / stats.activeStudents) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl mobile:text-2xl tablet:text-2xl laptop:text-2xl desktop:text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* Aviso: aulas pendentes de feedback */}
      {pendingFeedbackCount > 0 && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-medium">
              <span className="font-semibold">{pendingFeedbackCount}</span>{" "}
              {pendingFeedbackCount === 1 ? dashboard.pendingFeedback.singular : dashboard.pendingFeedback.plural}
            </p>
          </div>
          <Link
            to={`${basePath}/classes?status=avaliacao_pendente`}
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary shrink-0 transition-colors"
          >
            {dashboard.pendingFeedback.viewLink}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Ações Rápidas */}
      <div className="rounded-xl border bg-card shadow-card">
        <button
          onClick={() => setIsQuickActionsExpanded(!isQuickActionsExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg mobile:text-base tablet:text-base laptop:text-base desktop:text-lg font-semibold">{dashboard.view.quickActionsTitle}</h2>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              isQuickActionsExpanded && "rotate-180"
            )}
          />
        </button>
        {isQuickActionsExpanded && (
          <div className="p-6 border-t">
            <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
              <Link to={`${basePath}/students`} className="flex items-center gap-2 text-sm font-medium hover:scale-105 transition-transform">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm">{dashboard.view.quickActions.registerStudent}</p>
              </Link>
              <Link to={`${basePath}/classes`} className="flex items-center gap-2 text-sm font-medium hover:scale-105 transition-transform">
                <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-4 w-4 text-success" />
                </div>
                <p className="text-sm">{dashboard.view.quickActions.registerClass}</p>
              </Link>
              <Link to={`${basePath}/financial`} className="flex items-center gap-2 text-sm font-medium hover:scale-105 transition-transform">
                <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-4 w-4 text-warning" />
                </div>
                <p className="text-sm">{dashboard.view.quickActions.viewCharges}</p>
              </Link>
              <Link to={basePath === "/admin" ? "/admin/overview" : "/teacher/overview"} className="flex items-center gap-2 text-sm font-medium hover:scale-105 transition-transform">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-accent-foreground" />
                </div>
                <p className="text-sm">{dashboard.view.quickActions.overview}</p>
              </Link>
              {basePath === "/admin" && (
                <>
                  <Link to="/admin/teachers" className="flex items-center gap-2 text-sm font-medium hover:scale-105 transition-transform">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm">{dashboard.view.quickActions.registerTeacher}</p>
                  </Link>
                  <Link to="/admin/users" className="flex items-center gap-2 text-sm font-medium hover:scale-105 transition-transform">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Link2 className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <p className="text-sm">{dashboard.view.quickActions.registerUser}</p>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Alerta Próxima Aula */}
          {todayClasses?.nextClass && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-4">
              <Bell className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm font-medium">
                {basePath === "/teacher" ? dashboard.nextClass.teacher : dashboard.nextClass.admin}{" "}
                {dashboard.nextClass.withStudent}{" "}
                <span className="font-semibold text-primary">{todayClasses.nextClass.studentName}</span>
                {todayClasses.nextClass.timeLabel !== dashboard.nextClass.timeUndefined && (
                  <span className="font-normal"> das {todayClasses.nextClass.timeLabel}</span>
                )}
              </p>
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid gap-4 grid-cols-1 laptop:grid-cols-4">
            <MetricCard
              title={dashboard.metrics.activeStudents}
              value={stats?.activeStudents || 0}
              change={stats?.newStudentsThisMonth ? Math.round((stats.newStudentsThisMonth / Math.max(stats.activeStudents - stats.newStudentsThisMonth, 1)) * 100) : undefined}
              changeLabel={dashboard.metrics.activeStudentsChange}
              icon={Users}
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
            <MetricCard
              title={dashboard.metrics.overdue}
              value={stats?.overdueCount || 0}
              changeLabel={dashboard.metrics.overdueChange(overduePercentage)}
              icon={AlertCircle}
              iconColor="text-destructive"
              iconBg="bg-destructive/10"
            />
            <MetricCard
              title={dashboard.metrics.newThisMonth}
              value={stats?.newStudentsThisMonth || 0}
              icon={TrendingUp}
              iconColor="text-success"
              iconBg="bg-success/10"
            />
            <MetricCard
              title={dashboard.metrics.classesThisMonth}
              value={stats?.classesThisMonth || 0}
              icon={GraduationCap}
              iconColor="text-accent-foreground"
              iconBg="bg-accent"
            />
          </div>

          <DashboardFinancialCards financialSummary={financialSummary} forecastedBilling={forecastedBilling} />

          <DashboardTodayClasses todayClasses={todayClasses} basePath={basePath} />

          <div className="grid gap-6 grid-cols-1 laptop:grid-cols-2">
            <DashboardUpcomingPayments upcomingPayments={upcomingPayments} basePath={basePath} />
            <DashboardBirthdayList birthdays={birthdays} basePath={basePath} />
          </div>

          <DashboardGrowthChart
            chartData={chartData}
            chartLoading={chartLoading}
            basePath={basePath}
            chartMonths={chartMonths}
            onChartMonthsChange={onChartMonthsChange}
            chartLines={chartLines}
            onChartLinesChange={onChartLinesChange}
          />
        </>
      )}
    </div>
  );
}
