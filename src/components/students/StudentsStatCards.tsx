import {
  Users,
  UserCheck,
  UserMinus as UserX,
  TrendUp as TrendingUp,
} from "@phosphor-icons/react";
import { students as studentsContent } from "@/content";
import { type PeriodFilter } from "@/lib/utils/periodFilter";

interface StudentsStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newStudentsThisMonth: number;
}

interface StudentsStatCardsProps {
  stats: StudentsStats;
  period?: PeriodFilter;
}

function newStudentsLabel(period: PeriodFilter): string {
  if (period === "semester") return studentsContent.view.statNewSemester;
  if (period === "year") return studentsContent.view.statNewYear;
  return studentsContent.view.statNew;
}

export function StudentsStatCards({
  stats,
  period = "month",
}: StudentsStatCardsProps) {
  const cards = [
    {
      label: studentsContent.view.statTotal,
      value: stats.totalStudents,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: studentsContent.view.statActive,
      value: stats.activeStudents,
      icon: UserCheck,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: studentsContent.view.statInactive,
      value: stats.inactiveStudents,
      icon: UserX,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
    {
      label: newStudentsLabel(period),
      value: stats.newStudentsThisMonth,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 laptop:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 tablet:space-y-2 min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground leading-tight">
                {label}
              </p>
              <p
                className={`text-xl tablet:text-2xl font-bold tracking-tight ${color}`}
              >
                {value}
              </p>
            </div>
            <div
              className={`h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0 ${bg}`}
            >
              <Icon className={`h-4 w-4 tablet:h-5 tablet:w-5 ${color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
