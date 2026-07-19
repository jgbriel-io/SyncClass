import { StatCard } from "@/components/ui/stat-card";
import {
  UserCheck,
  UserMinus as UserX,
  TrendUp as TrendingUp,
  Users,
} from "@phosphor-icons/react";
import { teachers as teachersContent } from "@/content";
import { type PeriodFilter } from "@/lib/utils/periodFilter";

interface Props {
  total: number;
  ativos: number;
  inativos: number;
  novos: number;
  period?: PeriodFilter;
}

const NOVOS_LABEL: Record<PeriodFilter, string> = {
  month: teachersContent.view.statNew,
  semester: teachersContent.view.statNewSemester,
  year: teachersContent.view.statNewYear,
};

export function TeachersStatsCards({
  total,
  ativos,
  inativos,
  novos,
  period = "month",
}: Props) {
  return (
    <div className="grid gap-4 grid-cols-2 laptop:grid-cols-4">
      <StatCard
        title={teachersContent.view.statTotal}
        value={total}
        icon={Users}
        variant="primary"
      />
      <StatCard
        title={teachersContent.view.statActive}
        value={ativos}
        icon={UserCheck}
        variant="success"
      />
      <StatCard
        title={teachersContent.view.statInactive}
        value={inativos}
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
