import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyClassesState } from "@/components/ui/contextual-empty-states";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  Receipt,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";
import { isClassEvaluationBlocked } from "@/lib/utils/classTime";
import {
  formatClassDateAndTime,
  getPaymentStatusVariant,
  getPaymentStatusLabel,
  getClassStatusBadge,
  formatDuration,
} from "./classesViewHelpers";
import type { ClassLogWithStudent } from "@/hooks/useClassLogs";
import { classes as classesContent, common } from "@/content";

interface ClassesCardViewProps {
  logs: ClassLogWithStudent[];
  filteredLogs: ClassLogWithStudent[];
  page: number;
  setPage: (fn: (p: number) => number) => void;
  hasMore: boolean;
  totalCount: number;
  isFetching: boolean;
  listTopRef: React.RefObject<HTMLDivElement>;
  onViewDetail: (log: ClassLogWithStudent) => void;
  onEdit: (log: ClassLogWithStudent) => void;
  onDelete: (log: ClassLogWithStudent) => void;
  onEvaluate: (log: ClassLogWithStudent) => void;
  onCreateNew: () => void;
}

export function ClassesCardView({
  logs,
  filteredLogs,
  page,
  setPage,
  hasMore,
  totalCount,
  isFetching,
  listTopRef,
  onViewDetail,
  onEdit,
  onDelete,
  onEvaluate,
  onCreateNew,
}: ClassesCardViewProps) {
  return (
    <div className="space-y-4" ref={listTopRef}>
      {filteredLogs.map((log, index) => (
        <div
          key={log.id}
          className="relative rounded-lg border bg-card p-6 shadow-card animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <span className="text-base font-medium text-accent-foreground">
                  {log.students?.name?.charAt(0) || "?"}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    {log.students?.name || common.errors.studentNotFound}
                  </h3>
                  <StatusBadge variant={getClassStatusBadge(log).variant}>
                    {getClassStatusBadge(log).label}
                  </StatusBadge>
                  {log.financial_records && log.financial_records.length > 0 ? (
                    <StatusBadge
                      variant={getPaymentStatusVariant(
                        getFinancialActualStatus({
                          status: log.financial_records[0].status,
                          due_date: log.financial_records[0].due_date,
                        })
                      )}
                      className="flex items-center gap-1"
                    >
                      <Receipt className="h-3 w-3" />
                      {getPaymentStatusLabel(
                        getFinancialActualStatus({
                          status: log.financial_records[0].status,
                          due_date: log.financial_records[0].due_date,
                        })
                      )}
                    </StatusBadge>
                  ) : (
                    <StatusBadge variant="default">
                      {classesContent.cardView.noCharge}
                    </StatusBadge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {(() => {
                    const { date, timeRange } = formatClassDateAndTime(log);
                    return (
                      <span className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {date}
                        </span>
                        {timeRange && (
                          <span className="text-xs pl-6">{timeRange}</span>
                        )}
                      </span>
                    );
                  })()}
                  {log.duration_minutes != null && (
                    <span className="flex items-center gap-1.5">
                      {formatDuration(log.duration_minutes)}
                    </span>
                  )}
                  {log.financial_records ? (
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Receipt className="h-3.5 w-3.5" />
                      {formatCurrency(log.financial_records.amount)}
                    </span>
                  ) : (
                    <span className="text-foreground">
                      {classesContent.cardView.noCharge}
                    </span>
                  )}
                </div>
                {log.feedback && (
                  <p className="text-sm text-muted-foreground max-w-xl">
                    {log.feedback}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {log.attendance != null && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {classesContent.cardView.grade}
                  </p>
                  {log.grade != null ? (
                    <p
                      className={`text-3xl font-bold ${Number(log.grade) >= 7 ? "text-success" : Number(log.grade) >= 5 ? "text-warning" : "text-destructive"}`}
                    >
                      {Number(log.grade).toFixed(1)}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-destructive">
                      {classesContent.cardView.noAttendance}
                    </p>
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onViewDetail(log)}
                title={classesContent.cardView.viewDetails}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(log)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    {classesContent.cardView.edit}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(log)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {classesContent.cardView.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                className={`h-8 w-[7rem] shrink-0 border-none ${
                  isClassEvaluationBlocked(log) && log.attendance == null
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : log.attendance != null
                      ? "bg-warning text-white font-semibold hover:bg-warning/90 shadow"
                      : "bg-success-action text-white hover:bg-success-action/90"
                }`}
                disabled={
                  isClassEvaluationBlocked(log) && log.attendance == null
                }
                onClick={() => {
                  if (isClassEvaluationBlocked(log)) return;
                  onEvaluate(log);
                }}
              >
                {log.attendance != null
                  ? classesContent.cardView.update
                  : classesContent.cardView.evaluate}
              </Button>
            </div>
          </div>
        </div>
      ))}

      {filteredLogs.length === 0 && (
        <div className="rounded-lg border bg-card">
          {logs.length === 0 ? (
            <EmptyClassesState
              onAction={onCreateNew}
              actionLabel="Registrar primeira aula"
            />
          ) : (
            <EmptyState
              icon={BookOpen}
              title={classesContent.cardView.noResults}
              message={classesContent.cardView.noResultsHint}
            />
          )}
        </div>
      )}

      {(totalCount > 0 || page > 0) && (
        <div className="rounded-lg border bg-card px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 flex items-center justify-between gap-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {totalCount > 0
              ? `${page * 10 + 1}-${Math.min((page + 1) * 10, totalCount)} de ${totalCount}`
              : "0 registros"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || isFetching}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {classesContent.cardView.prev}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              {classesContent.cardView.next}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
