import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useState } from "react";
import {
  Users,
  AlertCircle,
  Calendar,
  TrendingUp,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  GraduationCap,
  Clock,
  ChevronRight,
  Bell,
  Link2,
  UserPlus,
  Zap,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { TodayClassesData } from "@/hooks/useTodayClasses";
import { getTodayClassStatus } from "@/hooks/useTodayClasses";

function formatBirthday(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM", { locale: ptBR });
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
}

function MetricCard({ title, value, change, changeLabel, icon: Icon, iconColor = "text-primary", iconBg = "bg-primary/10" }: MetricCardProps) {
  const isPositive = change && change >= 0;
  
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
              <span className={cn("text-xs font-medium", isPositive ? "text-success" : "text-destructive")}>
                {isPositive ? "+" : ""}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}

interface DashboardStats {
  activeStudents: number;
  overdueCount: number;
  newStudentsThisMonth: number;
  classesThisMonth: number;
}

interface UpcomingPayment {
  id: string;
  studentName: string;
  dueDate: string;
  amount: number;
}

interface Birthday {
  id: string;
  name: string;
  birthDate: string;
}

interface ChartDataPoint {
  month: string;
  count: number;
  classesCount?: number;
  teachersCount?: number;
  usersCount?: number;
}

export type ChartMonthsFilter = 1 | 3 | 6 | 12;

export type ChartLineFilterAdmin = {
  alunos: boolean;
  professores: boolean;
  aulas: boolean;
  usuarios: boolean;
};

export type ChartLineFilterTeacher = {
  alunos: boolean;
  aulas: boolean;
};

interface FinancialSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

interface DashboardViewProps {
  title?: string;
  subtitle?: string;
  stats: DashboardStats | undefined;
  financialSummary?: FinancialSummary | undefined;
  upcomingPayments: UpcomingPayment[];
  birthdays: Birthday[];
  chartData: ChartDataPoint[];
  todayClasses: TodayClassesData | undefined;
  isLoading: boolean;
  chartLoading?: boolean;
  basePath: "/admin" | "/teacher";
  chartMonths?: ChartMonthsFilter;
  onChartMonthsChange?: (v: ChartMonthsFilter) => void;
  chartLines?: ChartLineFilterAdmin | ChartLineFilterTeacher;
  onChartLinesChange?: (v: ChartLineFilterAdmin | ChartLineFilterTeacher) => void;
}

const DEFAULT_CHART_LINES_ADMIN: ChartLineFilterAdmin = { alunos: true, professores: true, aulas: true, usuarios: true };
const DEFAULT_CHART_LINES_TEACHER: ChartLineFilterTeacher = { alunos: true, aulas: true };

export function DashboardView({
  title = "Dashboard",
  subtitle,
  stats,
  financialSummary,
  upcomingPayments,
  birthdays,
  chartData,
  todayClasses,
  isLoading,
  chartLoading = false,
  basePath,
  chartMonths = 3,
  onChartMonthsChange,
  chartLines,
  onChartLinesChange,
}: DashboardViewProps) {
  const [internalChartLines, setInternalChartLines] = useState<ChartLineFilterAdmin | ChartLineFilterTeacher>(
    basePath === "/admin" ? DEFAULT_CHART_LINES_ADMIN : DEFAULT_CHART_LINES_TEACHER
  );
  const lines = chartLines ?? internalChartLines;
  const setLines = onChartLinesChange ?? setInternalChartLines;

  const overduePercentage = stats && stats.activeStudents > 0
    ? ((stats.overdueCount / stats.activeStudents) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
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
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm font-medium">
                {basePath === "/teacher" ? "Sua próxima aula" : "Próxima aula do dia"}{" "}
                é com o(a) aluno(a){" "}
                <span className="font-semibold text-primary">{todayClasses.nextClass.studentName}</span>
                {todayClasses.nextClass.timeLabel !== "Horário não definido" && (
                  <span className="font-normal">
                    {" "}das {todayClasses.nextClass.timeLabel}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Estatísticas */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Alunos Ativos"
              value={stats?.activeStudents || 0}
              change={stats?.newStudentsThisMonth ? Math.round((stats.newStudentsThisMonth / Math.max(stats.activeStudents - stats.newStudentsThisMonth, 1)) * 100) : undefined}
              changeLabel="este mês"
              icon={Users}
              iconColor="text-primary"
              iconBg="bg-primary/10"
            />
            <MetricCard
              title="Inadimplentes"
              value={stats?.overdueCount || 0}
              changeLabel={`${overduePercentage}% do total`}
              icon={AlertCircle}
              iconColor="text-destructive"
              iconBg="bg-destructive/10"
            />
            <MetricCard
              title="Novos este Mês"
              value={stats?.newStudentsThisMonth || 0}
              icon={TrendingUp}
              iconColor="text-success"
              iconBg="bg-success/10"
            />
            <MetricCard
              title="Aulas este Mês"
              value={stats?.classesThisMonth || 0}
              icon={GraduationCap}
              iconColor="text-accent-foreground"
              iconBg="bg-accent"
            />
          </div>

          {/* Financeiro */}
          {financialSummary != null && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total recebido</p>
                    <p className="text-2xl font-bold tracking-tight text-success">
                      {formatCurrency(financialSummary.totalPaid)}
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-success/10">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">A receber</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {formatCurrency(financialSummary.totalPending)}
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-warning/10">
                    <DollarSign className="h-5 w-5 text-warning" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Em atraso</p>
                    <p className="text-2xl font-bold tracking-tight text-destructive">
                      {formatCurrency(financialSummary.totalOverdue)}
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-destructive/10">
                    <DollarSign className="h-5 w-5 text-destructive" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aulas de Hoje - altura relativa à quantidade de aulas */}
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <h2 className="font-semibold">Aulas de Hoje</h2>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
              {todayClasses?.classes.length ? (
                <StatusBadge variant="warning">{todayClasses.classes.length}</StatusBadge>
              ) : null}
            </div>
            <div>
                {!todayClasses?.classes.length ? (
                  <div className="py-12 px-6 text-center text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma aula agendada para hoje</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {todayClasses.classes.map((item) => {
                      const status = getTodayClassStatus(item);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <span className="text-sm font-medium">
                                {item.studentName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {item.timeLabel} — {item.studentName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.title?.trim() || "Aula"}
                              </p>
                            </div>
                          </div>
                          <StatusBadge variant={status.variant}>
                            {status.label}
                          </StatusBadge>
                        </div>
                      );
                    })}
                  </div>
                )}
              {todayClasses?.classes.length ? (
                <div className="border-t px-6 py-3 flex items-center">
                  <Link
                    to={`${basePath}/classes`}
                    className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Ver todas
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>

          {/* Terceira linha: Próximos Vencimentos 40% + Aniversariantes 40% + Ações Rápidas 20% */}
          <div className="grid gap-6 lg:grid-cols-[2fr_2fr_1fr]">
            {/* Upcoming Payments */}
            <div className="rounded-xl border bg-card shadow-card">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Próximos Vencimentos</h2>
                    <p className="text-xs text-muted-foreground">Pagamentos pendentes desta semana</p>
                  </div>
                </div>
                <StatusBadge variant="warning">{upcomingPayments.length}</StatusBadge>
              </div>
              <div className="divide-y max-h-[320px] overflow-y-auto">
                {upcomingPayments.length === 0 ? (
                  <EmptyState
                    icon={DollarSign}
                    message="Nenhum vencimento próximo"
                    size="default"
                  />
                ) : (
                  upcomingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {payment.studentName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{payment.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence em {formatDate(payment.dueDate)}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-sm">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {upcomingPayments.length > 0 && (
                <div className="border-t px-6 py-3">
                  <Link
                    to={`${basePath}/financial`}
                    className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Ver todos
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Birthdays */}
            <div className="rounded-xl border bg-card shadow-card flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                    <span className="text-lg">🎂</span>
                  </div>
                  <div>
                    <h2 className="font-semibold">Aniversariantes</h2>
                    <p className="text-xs text-muted-foreground">Este mês</p>
                  </div>
                </div>
                <StatusBadge variant="warning">{birthdays.length}</StatusBadge>
              </div>
              <div className="divide-y flex-1 min-h-0 overflow-y-auto">
                {birthdays.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    message="Nenhum aniversariante este mês"
                    size="default"
                  />
                ) : (
                  birthdays.map((birthday) => (
                    <div
                      key={birthday.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {birthday.name.charAt(0)}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{birthday.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatBirthday(birthday.birthDate)}
                        </span>
                        <span className="text-lg">🎉</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {birthdays.length > 0 && (
                <div className="border-t px-6 py-3 shrink-0 flex justify-end">
                  <Link
                    to={`${basePath}/students?filter=aniversariantes`}
                    className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Ver todos
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            <div className="rounded-xl border bg-card shadow-card flex flex-col">
              <div className="border-b px-6 py-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-semibold">Ações Rápidas</h2>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                <div className="grid grid-cols-3 gap-x-4 gap-y-5 w-full max-w-[280px]">
                <Link
                  to={`${basePath}/students`}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-muted transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-center text-xs leading-tight">Cadastrar Aluno</p>
                </Link>
                <Link
                  to={`${basePath}/classes`}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-muted transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-center text-xs leading-tight">Registrar Aula</p>
                </Link>
                <Link
                  to={`${basePath}/financial`}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-muted transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-warning" />
                  </div>
                  <p className="text-center text-xs leading-tight">Visualizar cobranças</p>
                </Link>
                <Link
                  to={basePath === "/admin" ? "/admin/students/overview" : "/teacher/overview"}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-muted transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <p className="text-center text-xs leading-tight">Visão Geral</p>
                </Link>
                {basePath === "/admin" && (
                  <>
                    <Link
                      to="/admin/teachers"
                      className="flex flex-col items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-muted transition-colors group"
                    >
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-center text-xs leading-tight">Cadastrar professor</p>
                    </Link>
                    <Link
                      to="/admin/users"
                      className="flex flex-col items-center justify-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-muted transition-colors group"
                    >
                      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                        <Link2 className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <p className="text-center text-xs leading-tight">Cadastrar usuário</p>
                    </Link>
                  </>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de crescimento - ao final da página */}
          <div className="rounded-xl border bg-card shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <div>
                  <h2 className="font-semibold">
                    {basePath === "/admin" ? "Crescimento da plataforma" : "Crescimento de Alunos e Aulas"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {chartMonths === 1 ? "Mês atual (por dia)" : `Últimos ${chartMonths} meses`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {onChartMonthsChange && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={String(chartMonths)}
                      onValueChange={(v) => onChartMonthsChange(Number(v) as ChartMonthsFilter)}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 mês</SelectItem>
                        <SelectItem value="3">3 meses</SelectItem>
                        <SelectItem value="6">6 meses</SelectItem>
                        <SelectItem value="12">1 ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {basePath === "/admin" && (
                  <div className="flex flex-wrap gap-2">
                    {(["alunos", "professores", "aulas", "usuarios"] as const).map((key) => {
                      const adminLines = lines as ChartLineFilterAdmin;
                      const label = { alunos: "Alunos", professores: "Professores", aulas: "Aulas", usuarios: "Usuários" }[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setLines({ ...adminLines, [key]: !adminLines[key] })}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                            adminLines[key]
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {basePath === "/teacher" && (
                  <div className="flex flex-wrap gap-2">
                    {(["alunos", "aulas"] as const).map((key) => {
                      const teacherLines = lines as ChartLineFilterTeacher;
                      const label = { alunos: "Alunos", aulas: "Aulas" }[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setLines({ ...teacherLines, [key]: !teacherLines[key] })}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                            teacherLines[key]
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {chartLoading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : chartData.every((d) =>
                d.count === 0 &&
                (d.classesCount ?? 0) === 0 &&
                (d.teachersCount ?? 0) === 0 &&
                (d.usersCount ?? 0) === 0
              ) ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum dado disponível ainda</p>
                  </div>
                </div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorClasses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(24 95% 53%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(24 95% 53%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                          boxShadow: "var(--shadow-md)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                        formatter={(value: number, name: string) => [
                          value,
                          name === "count" ? "Alunos" : name === "classesCount" ? "Aulas" : name === "teachersCount" ? "Professores" : name === "usersCount" ? "Usuários" : name,
                        ]}
                      />
                      <Legend
                        formatter={(value) =>
                          value === "count" ? "Alunos" : value === "classesCount" ? "Aulas" : value === "teachersCount" ? "Professores" : value === "usersCount" ? "Usuários" : value
                        }
                        wrapperStyle={{ paddingTop: 16 }}
                      />
                      {(basePath === "/teacher" ? (lines as ChartLineFilterTeacher).alunos : (lines as ChartLineFilterAdmin).alunos) && (
                        <Area
                          type="monotone"
                          dataKey="count"
                          name="count"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorStudents)"
                        />
                      )}
                      {basePath === "/admin" && (lines as ChartLineFilterAdmin).professores && (
                        <Area
                          type="monotone"
                          dataKey="teachersCount"
                          name="teachersCount"
                          stroke="hsl(24 95% 53%)"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorTeachers)"
                        />
                      )}
                      {(basePath === "/teacher" ? (lines as ChartLineFilterTeacher).aulas : (lines as ChartLineFilterAdmin).aulas) && (
                        <Area
                          type="monotone"
                          dataKey="classesCount"
                          name="classesCount"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorClasses)"
                        />
                      )}
                      {basePath === "/admin" && (lines as ChartLineFilterAdmin).usuarios && (
                        <Area
                          type="monotone"
                          dataKey="usersCount"
                          name="usersCount"
                          stroke="hsl(262 83% 58%)"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorUsers)"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
