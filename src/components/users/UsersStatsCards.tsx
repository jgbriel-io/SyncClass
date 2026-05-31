import { StatCard } from "@/components/ui/stat-card";
import { UserCheck, UserX, TrendingUp, Users } from "lucide-react";

interface Props {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

export function UsersStatsCards({
  total,
  active,
  inactive,
  newThisMonth,
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
        title="Novos este mês"
        value={newThisMonth}
        icon={TrendingUp}
        variant="primaryHighlight"
      />
    </div>
  );
}
