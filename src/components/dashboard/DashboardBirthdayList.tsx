import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Calendar, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Birthday } from "./DashboardView";

function formatBirthday(dateString: string): string {
  return format(new Date(dateString + "T00:00:00"), "dd/MM", { locale: ptBR });
}

interface DashboardBirthdayListProps {
  birthdays: Birthday[];
  basePath: "/admin" | "/teacher";
}

export function DashboardBirthdayList({ birthdays, basePath }: DashboardBirthdayListProps) {
  return (
    <div className="rounded-xl border bg-card shadow-card flex flex-col min-h-0">
      <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-lg">🎂</span>
          </div>
          <div>
            <h2 className="text-lg mobile:text-base tablet:text-base laptop:text-base desktop:text-lg font-semibold">Aniversariantes</h2>
            <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground">Este mês</p>
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
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {birthday.name.charAt(0)}
                  </span>
                </div>
                <p className="font-medium text-sm mobile:text-xs tablet:text-xs laptop:text-xs">{birthday.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
                  {formatBirthday(birthday.birthDate)}
                </span>
                <span className="text-lg">🎉</span>
              </div>
            </div>
          ))
        )}
      </div>
      {birthdays.length > 0 && (
        <div className="border-t px-2 py-2 shrink-0 flex justify-end">
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
  );
}
