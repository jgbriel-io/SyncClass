import { StatCard } from "@/components/ui/stat-card";
import { UserCheck, UserX, TrendingUp, Users } from "lucide-react";

interface Props {
  total: number;
  ativos: number;
  inativos: number;
  novos: number;
}

export function TeachersStatsCards({ total, ativos, inativos, novos }: Props) {
  return (
    <div className="grid gap-4 grid-cols-2 laptop:grid-cols-4">
      <StatCard
        title="Total de professores"
        value={total}
        icon={Users}
        variant="primary"
      />
      <StatCard
        title="Professores ativos"
        value={ativos}
        icon={UserCheck}
        variant="success"
      />
      <StatCard
        title="Professores inativos"
        value={inativos}
        icon={UserX}
        variant="muted"
      />
      <StatCard
        title="Novos este mês"
        value={novos}
        icon={TrendingUp}
        variant="primaryHighlight"
      />
    </div>
  );
}
