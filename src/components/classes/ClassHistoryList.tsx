import { useMemo } from "react";
import { StudentClassCard } from "@/components/student/StudentClassCard";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "@phosphor-icons/react";
import { classes as classesContent, common } from "@/content";

interface ClassLog {
  id: string;
  class_date: string;
  start_at?: string | null;
  end_at?: string | null;
  duration_minutes?: number | null;
  attendance: boolean | null;
  grade?: number | null;
  title?: string | null;
  feedback?: string | null;
  teacher_name?: string;
  student_name?: string;
  amount?: number | null;
}

interface ClassHistoryListProps {
  classLogs: ClassLog[];
  showStudentName?: boolean;
  emptyMessage?: string;
  groupByMonth?: boolean;
}

function formatMonthYear(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function groupClassesByMonth(logs: ClassLog[]): Map<string, ClassLog[]> {
  const groups = new Map<string, ClassLog[]>();
  for (const log of logs) {
    const key = log.class_date.slice(0, 7); // YYYY-MM
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(log);
  }
  return groups;
}

export function ClassHistoryList({
  classLogs,
  showStudentName = false,
  emptyMessage = classesContent.historyList.emptyMessage,
  groupByMonth = false,
}: ClassHistoryListProps) {
  const sortedLogs = useMemo(
    () =>
      [...classLogs].sort((a, b) => b.class_date.localeCompare(a.class_date)),
    [classLogs]
  );

  const grouped = useMemo(() => {
    if (!groupByMonth) return null;
    const groups = groupClassesByMonth(sortedLogs);
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => ({
        key,
        label: formatMonthYear(items[0].class_date),
        items,
      }));
  }, [sortedLogs, groupByMonth]);

  if (classLogs.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState icon={BookOpen} message={emptyMessage} />
      </div>
    );
  }

  if (groupByMonth && grouped) {
    return (
      <div className="space-y-6">
        {grouped.map(({ key, label, items }) => (
          <section key={key}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {label}
            </h3>
            <div className="space-y-3">
              {items.map((log) => (
                <StudentClassCard
                  key={log.id}
                  classLog={{
                    ...log,
                    title:
                      showStudentName && log.student_name
                        ? `${log.title || common.labels.date} - ${log.student_name}`
                        : log.title || common.labels.date,
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedLogs.map((log) => (
        <StudentClassCard
          key={log.id}
          classLog={{
            ...log,
            title:
              showStudentName && log.student_name
                ? `${log.title || common.labels.date} - ${log.student_name}`
                : log.title || common.labels.date,
          }}
        />
      ))}
    </div>
  );
}
