import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";

interface StudentsStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  newStudentsThisMonth: number;
}

interface StudentsStatCardsProps {
  stats: StudentsStats;
}

export function StudentsStatCards({ stats }: StudentsStatCardsProps) {
  const cards = [
    { label: "Total de Alunos", value: stats.totalStudents, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Alunos Ativos", value: stats.activeStudents, icon: UserCheck, color: "text-success", bg: "bg-success/10" },
    { label: "Alunos Inativos", value: stats.inactiveStudents, icon: UserX, color: "text-muted-foreground", bg: "bg-muted" },
    { label: "Novos este Mês", value: stats.newStudentsThisMonth, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 laptop:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className={`text-2xl mobile:text-xl tablet:text-xl laptop:text-xl desktop:text-2xl font-bold tracking-tight ${color}`}>
                {value}
              </p>
            </div>
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
