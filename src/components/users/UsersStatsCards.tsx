import { StatCard } from "@/components/ui/stat-card";
import { UserCheck, UserX, TrendingUp, Users } from "lucide-react";
import { users as usersContent } from "@/content";
import { type PeriodFilter } from "@/lib/utils/periodFilter";

interface Props {
  total: number;
  active: number;
  inactive: number;
  novos: number;
  period?: PeriodFilter;
}

const NOVOS_LABEL: Record<PeriodFilter, string> = {
  month: usersContent.view.statNew,
  semester: usersContent.view.statNewSemester,
  year: usersContent.view.statNewYear,
};

export function UsersStatsCards({
  total,
  active,
  inactive,
  novos,
  period = "month",
}: Props) {
  return (
    <div className="grid gap-4 grid-cols-2 laptop:grid-cols-4">
      <StatCard
        title="Total de usuários"
        value={total}
        icon={Users}
        variant="primary"
      />
      <StatCard
        title="Usuários ativos"
        value={active}
        icon={UserCheck}
        variant="success"
      />
      <StatCard
        title="Usuários inativos"
        value={inactive}
        icon={UserX}
        variant="muted"
      />
      <StatCard
        title={NOVOS_LABEL[period]}
        value={novos}
        icon={TrendingUp}
        variant="primaryHighlight"
      />
    </div>
  );
}
