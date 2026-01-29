import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
}

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
}

interface DashboardViewProps {
  title?: string;
  subtitle?: string;
  stats: DashboardStats | undefined;
  upcomingPayments: UpcomingPayment[];
  birthdays: Birthday[];
  chartData: ChartDataPoint[];
  isLoading: boolean;
  basePath: "/admin" | "/teacher";
}

export function DashboardView({
  title = "Dashboard",
  subtitle,
  stats,
  upcomingPayments,
  birthdays,
  chartData,
  isLoading,
  basePath,
}: DashboardViewProps) {
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
          {/* Metrics Grid */}
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

          {/* Chart + Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chart */}
            <div className="lg:col-span-2 rounded-xl border bg-card shadow-card">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="font-semibold">Crescimento de Alunos</h2>
                  <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
                </div>
              </div>
              <div className="p-6">
                {chartData.every((d) => d.count === 0) ? (
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
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                          formatter={(value: number) => [value, "Novos alunos"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorCount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border bg-card shadow-card">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold">Ações Rápidas</h2>
              </div>
              <div className="p-4 space-y-2">
                <Link
                  to={`${basePath}/students`}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p>Cadastrar Aluno</p>
                    <p className="text-xs text-muted-foreground">Adicione um novo aluno</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                
                <Link
                  to={`${basePath}/classes`}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <p>Registrar Aula</p>
                    <p className="text-xs text-muted-foreground">Lance presença e notas</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                
                <Link
                  to={`${basePath}/financial`}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p>Lançar Cobrança</p>
                    <p className="text-xs text-muted-foreground">Crie uma nova cobrança</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>
            </div>
          </div>

          {/* Lists Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming Payments */}
            <div className="rounded-xl border bg-card shadow-card">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Próximos Vencimentos</h2>
                    <p className="text-xs text-muted-foreground">Esta semana</p>
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
            <div className="rounded-xl border bg-card shadow-card">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                    <span className="text-lg">🎂</span>
                  </div>
                  <div>
                    <h2 className="font-semibold">Aniversariantes</h2>
                    <p className="text-xs text-muted-foreground">Este mês</p>
                  </div>
                </div>
                <StatusBadge variant="default">{birthdays.length}</StatusBadge>
              </div>
              <div className="divide-y max-h-[320px] overflow-y-auto">
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
                <div className="border-t px-6 py-3">
                  <Link
                    to={`${basePath}/students`}
                    className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Ver todos
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
