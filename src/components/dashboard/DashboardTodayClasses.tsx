import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import type { TodayClassesData } from "@/hooks/useTodayClasses";
import { getTodayClassStatus } from "@/hooks/useTodayClasses";
import { common, dashboard } from "@/content";

interface DashboardTodayClassesProps {
  todayClasses: TodayClassesData | undefined;
  basePath: "/admin" | "/teacher";
}

export function DashboardTodayClasses({
  todayClasses,
  basePath,
}: DashboardTodayClassesProps) {
  return (
    <div className="rounded-xl border bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div>
            <h2 className="text-lg mobile:text-base tablet:text-base laptop:text-base desktop:text-lg font-semibold">
              {dashboard.todayClasses.title}
            </h2>
            <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        {todayClasses?.classes.length ? (
          <StatusBadge variant="warning">
            {todayClasses.classes.length}
          </StatusBadge>
        ) : null}
      </div>
      <div>
        {!todayClasses?.classes.length ? (
          <div className="py-12 px-6 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{dashboard.todayClasses.noClasses}</p>
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
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium">
                        {item.studentName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm mobile:text-xs tablet:text-xs laptop:text-xs">
                        {item.timeLabel} — {item.studentName}
                      </p>
                      <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground">
                        {item.title?.trim() || common.labels.class}
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
          <div className="border-t px-2 py-2 flex items-center">
            <Link
              to={`${basePath}/classes`}
              className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              {dashboard.todayClasses.viewAll}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
