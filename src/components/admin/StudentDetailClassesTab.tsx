import { ScrollArea } from "@/components/ui/scroll-area";
import { ClassHistoryList } from "@/components/classes/ClassHistoryList";
import { common } from "@/content";
import type { StudentDetails } from "@/hooks/useStudentDetails";

interface StudentDetailClassesTabProps {
  student: StudentDetails;
}

export function StudentDetailClassesTab({
  student,
}: StudentDetailClassesTabProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold">{student.stats.totalClasses}</p>
            <p className="text-xs text-muted-foreground">
              {common.labels.total}
            </p>
          </div>
          <div className="rounded-lg bg-success/10 p-3 text-center">
            <p className="text-lg font-bold text-success">
              {student.stats.presentClasses}
            </p>
            <p className="text-xs text-muted-foreground">
              {common.labels.present}
            </p>
          </div>
          <div className="rounded-lg bg-rose-500/10 p-3 text-center">
            <p className="text-lg font-bold text-rose-600">
              {student.stats.totalClasses - student.stats.presentClasses}
            </p>
            <p className="text-xs text-muted-foreground">
              {common.labels.absence}
            </p>
          </div>
        </div>

        {/* Class List */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {common.labels.classHistory}
          </h3>
          <ClassHistoryList
            classLogs={student.classLogs.map((log) => ({
              id: log.id,
              class_date: log.class_date,
              start_at: log.start_at,
              end_at: log.end_at,
              duration_minutes: log.duration_minutes,
              attendance: log.attendance,
              grade: log.grade ?? null,
              title: log.title ?? null,
              feedback: log.feedback ?? null,
              teacher_name:
                log.teacher_name || student.teacher_name || undefined,
              amount:
                typeof log.billed_amount === "number"
                  ? log.billed_amount
                  : null,
            }))}
            emptyMessage={common.labels.noClassesMessage}
            groupByMonth={true}
          />
        </div>
      </div>
    </ScrollArea>
  );
}
