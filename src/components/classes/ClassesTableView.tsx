import { EmptyState } from "@/components/ui/empty-state";
import { EmptyClassesState } from "@/components/ui/contextual-empty-states";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { classes as classesContent } from "@/content";
import { ClassesTableSkeleton } from "@/components/ui/table-skeleton";
import { Table, TableHeader, TableHead, TableBody, TableRow } from "@/components/ui/table";
import { ClassesTableRow } from "@/components/classes/ClassesTableRow";
import { COL as CL_COL, TABLE_MIN_W as CL_TABLE_MIN_W } from "@/components/classes/ClassesTableRow.constants";
import { cn } from "@/lib/utils";
import {
  tableThLarge,
  tableThSmall,
} from "@/lib/utils/tableColumns";
import { getClassStatusBadge } from "./classesViewHelpers";
import { isClassEvaluationBlocked } from "@/lib/utils/classTime";
import type { ClassLogWithStudent } from "@/hooks/useClassLogs";

interface ClassesTableViewProps {
  logs: ClassLogWithStudent[];
  filteredLogs: ClassLogWithStudent[];
  isLoading: boolean;
  showTeacherColumn: boolean;
  teacherMap: Map<string, string>;
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

export function ClassesTableView({
  logs,
  filteredLogs,
  isLoading,
  showTeacherColumn,
  teacherMap,
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
}: ClassesTableViewProps) {
  return (
    <div className="rounded-lg border bg-card shadow-card overflow-hidden" ref={listTopRef}>
      <div className="overflow-x-auto">
        <Table style={{ minWidth: CL_TABLE_MIN_W }}>
          <TableHeader>
            <TableRow className="border-b bg-muted/50">
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: "1%" }}>{classesContent.table.colStatus}</TableHead>
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap sticky left-0 z-30 bg-muted" style={{ width: CL_COL.ALUNO, minWidth: CL_COL.ALUNO, boxShadow: "2px 0 5px -2px rgba(0,0,0,0.1)" }}>{classesContent.table.colStudent}</TableHead>
              <TableHead className={cn(tableThLarge, "hidden sm:table-cell")} style={{ width: CL_COL.INFORMACOES, minWidth: CL_COL.INFORMACOES }}>
                {showTeacherColumn ? classesContent.table.colInfo : classesContent.table.colTitle}
              </TableHead>
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: CL_COL.DATA, minWidth: CL_COL.DATA }}>{classesContent.table.colDate}</TableHead>
              <TableHead className={cn(tableThSmall, "hidden sm:table-cell")} style={{ width: CL_COL.DURACAO, minWidth: CL_COL.DURACAO }}>{classesContent.table.colDuration}</TableHead>
              <TableHead className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2 align-middle whitespace-nowrap" style={{ width: CL_COL.NOTA, minWidth: CL_COL.NOTA }}>{classesContent.table.colGrade}</TableHead>
              <TableHead className={cn(tableThSmall, "hidden xl:table-cell")} style={{ width: CL_COL.FINANCEIRO, minWidth: CL_COL.FINANCEIRO }}>{classesContent.table.colFinancial}</TableHead>
              <TableHead className={cn(tableThSmall, "hidden xl:table-cell")} style={{ width: CL_COL.AVALIAR, minWidth: CL_COL.AVALIAR }} aria-label="Avaliar" />
              <TableHead className={tableThSmall} style={{ width: CL_COL.ACOES, minWidth: CL_COL.ACOES }}>{classesContent.table.colActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <ClassesTableSkeleton rows={8} />
            ) : (
              filteredLogs.map((log) => {
                const teacherName =
                  log.teachers?.name ??
                  (log.teacher_id ? teacherMap.get(log.teacher_id) : null) ??
                  (log.students?.teacher_id ? teacherMap.get(log.students.teacher_id) : null) ??
                  "Sem professor";
                return (
                  <ClassesTableRow
                    key={log.id}
                    log={log}
                    showTeacherColumn={showTeacherColumn}
                    teacherName={teacherName}
                    statusBadge={getClassStatusBadge(log)}
                    onViewDetail={onViewDetail}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onEvaluate={onEvaluate}
                    isEvaluationBlocked={isClassEvaluationBlocked(log)}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="border-t">
          {logs.length === 0 ? (
            <EmptyClassesState onAction={onCreateNew} actionLabel="Registrar primeira aula" />
          ) : (
            <EmptyState icon={Search} title={classesContent.table.noResults} message={classesContent.table.noResultsHint} />
          )}
        </div>
      )}

      {(totalCount > 0 || page > 0) && (
        <div className="border-t px-6 py-3 mobile:px-3 mobile:py-2 tablet:px-3 tablet:py-2 laptop:px-3 laptop:py-2 flex items-center justify-between gap-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {totalCount > 0 ? `${page * 10 + 1}-${Math.min((page + 1) * 10, totalCount)} de ${totalCount}` : "0 registros"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0 || isFetching} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {classesContent.table.prev}
            </Button>
            <Button variant="outline" size="sm" disabled={!hasMore || isFetching} onClick={() => setPage((p) => p + 1)}>
              {classesContent.table.next}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
