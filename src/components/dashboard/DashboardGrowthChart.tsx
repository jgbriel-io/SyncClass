import { useState } from "react";
import { TrendingUp, Filter, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { common, dashboard } from "@/content";

export interface ChartDataPoint {
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

const DEFAULT_CHART_LINES_ADMIN: ChartLineFilterAdmin = { alunos: true, professores: true, aulas: true, usuarios: true };
const DEFAULT_CHART_LINES_TEACHER: ChartLineFilterTeacher = { alunos: true, aulas: true };

interface DashboardGrowthChartProps {
  chartData: ChartDataPoint[];
  chartLoading: boolean;
  basePath: "/admin" | "/teacher";
  chartMonths: ChartMonthsFilter;
  onChartMonthsChange?: (v: ChartMonthsFilter) => void;
  chartLines?: ChartLineFilterAdmin | ChartLineFilterTeacher;
  onChartLinesChange?: (v: ChartLineFilterAdmin | ChartLineFilterTeacher) => void;
}

export function DashboardGrowthChart({
  chartData,
  chartLoading,
  basePath,
  chartMonths,
  onChartMonthsChange,
  chartLines,
  onChartLinesChange,
}: DashboardGrowthChartProps) {
  const [internalChartLines, setInternalChartLines] = useState<ChartLineFilterAdmin | ChartLineFilterTeacher>(
    basePath === "/admin" ? DEFAULT_CHART_LINES_ADMIN : DEFAULT_CHART_LINES_TEACHER
  );
  const lines = chartLines ?? internalChartLines;
  const setLines = onChartLinesChange ?? setInternalChartLines;

  const isEmpty = chartData.every(
    (d) =>
      d.count === 0 &&
      (d.classesCount ?? 0) === 0 &&
      (d.teachersCount ?? 0) === 0 &&
      (d.usersCount ?? 0) === 0
  );

  return (
    <div className="rounded-xl border bg-card shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div>
            <h2 className="text-lg mobile:text-base tablet:text-base laptop:text-base desktop:text-lg font-semibold">
              {basePath === "/admin" ? dashboard.chart.titleAdmin : dashboard.chart.titleTeacher}
            </h2>
            <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm text-muted-foreground">
              {chartMonths === 1 ? dashboard.chart.currentMonth : dashboard.chart.lastMonths(chartMonths)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {onChartMonthsChange && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={String(chartMonths)}
                onValueChange={(v) => onChartMonthsChange(Number(v) as ChartMonthsFilter)}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder={common.placeholders.period} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{dashboard.chart.months1}</SelectItem>
                  <SelectItem value="3">{dashboard.chart.months3}</SelectItem>
                  <SelectItem value="6">{dashboard.chart.months6}</SelectItem>
                  <SelectItem value="12">{dashboard.chart.months12}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {basePath === "/admin" && (
            <div className="flex flex-wrap gap-2">
              {(["alunos", "professores", "aulas", "usuarios"] as const).map((key) => {
                const adminLines = lines as ChartLineFilterAdmin;
                const label = {
                  alunos: dashboard.chart.students,
                  professores: dashboard.chart.teachers,
                  aulas: dashboard.chart.classes,
                  usuarios: dashboard.chart.users,
                }[key];
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
                const label = { alunos: dashboard.chart.students, aulas: dashboard.chart.classes }[key];
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
        ) : isEmpty ? (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{dashboard.chart.noData}</p>
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
                    name === "count" ? dashboard.chart.students : name === "classesCount" ? dashboard.chart.classes : name === "teachersCount" ? dashboard.chart.teachers : name === "usersCount" ? dashboard.chart.users : name,
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === "count" ? dashboard.chart.students : value === "classesCount" ? dashboard.chart.classes : value === "teachersCount" ? dashboard.chart.teachers : value === "usersCount" ? dashboard.chart.users : value
                  }
                  wrapperStyle={{ paddingTop: 16 }}
                />
                {(basePath === "/teacher" ? (lines as ChartLineFilterTeacher).alunos : (lines as ChartLineFilterAdmin).alunos) && (
                  <Area type="monotone" dataKey="count" name="count" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" />
                )}
                {basePath === "/admin" && (lines as ChartLineFilterAdmin).professores && (
                  <Area type="monotone" dataKey="teachersCount" name="teachersCount" stroke="hsl(24 95% 53%)" strokeWidth={2} fillOpacity={1} fill="url(#colorTeachers)" />
                )}
                {(basePath === "/teacher" ? (lines as ChartLineFilterTeacher).aulas : (lines as ChartLineFilterAdmin).aulas) && (
                  <Area type="monotone" dataKey="classesCount" name="classesCount" stroke="hsl(var(--success))" strokeWidth={2} fillOpacity={1} fill="url(#colorClasses)" />
                )}
                {basePath === "/admin" && (lines as ChartLineFilterAdmin).usuarios && (
                  <Area type="monotone" dataKey="usersCount" name="usersCount" stroke="hsl(262 83% 58%)" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
