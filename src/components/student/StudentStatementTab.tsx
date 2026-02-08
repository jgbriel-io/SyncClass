import { memo, useMemo } from "react";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { formatDate } from "@/lib/utils/formatters";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils/formatters";
import { useStudentStatement } from "@/hooks/useStudentStatement";
import { UnifiedStatementCard } from "./UnifiedStatementCard";
import type { StudentStatementEntry } from "@/hooks/useStudentStatement";

interface StudentStatementTabProps {
  studentId: string | null;
  studentName: string;
  embedded?: boolean;
  totalAmount?: number;
}

function groupByMonthYear(entries: StudentStatementEntry[]) {
  const groups = new Map<string, StudentStatementEntry[]>();
  for (const entry of entries) {
    const d = new Date(entry.class_date + "T12:00:00");
    const key = format(d, "yyyy-MM");
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({
      key,
      label: format(new Date(items[0]!.class_date + "T12:00:00"), "MMMM 'de' yyyy", {
        locale: ptBR,
      }),
      items,
    }));
}

export const StudentStatementTab = memo(function StudentStatementTab({
  studentId,
  studentName,
  embedded = false,
  totalAmount,
}: StudentStatementTabProps) {
  const { data: entries = [], isLoading } = useStudentStatement(studentId);

  const grouped = useMemo(() => groupByMonthYear(entries), [entries]);

  const totalClasses = entries.length;
  const totalBilled = useMemo(
    () =>
      entries.reduce((sum, e) => {
        if (e.financial_record_id != null && e.billed_amount != null) {
          return sum + Number(e.billed_amount);
        }
        return sum;
      }, 0),
    [entries]
  );
  const openBilling = entries.filter(
    (e) =>
      e.billing_status_consolidated === "pending" ||
      e.billing_status_consolidated === "overdue"
  ).length;

  const content = (
    <div className={embedded ? "space-y-4" : "p-6 space-y-4"}>
      {/* Header informativo */}
      <div className="rounded-lg border bg-card p-3 flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{totalAmount != null ? "Total" : "Histórico de Movimentações"}</p>
        {(totalAmount != null ? totalAmount : totalBilled) > 0 && (
          <p className="text-base font-semibold tabular-nums">
            {formatCurrency(totalAmount != null ? totalAmount : totalBilled)}
          </p>
        )}
      </div>

      {/* Timeline agrupada por mês/ano */}
      {grouped.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum registro encontrado</p>
          <p className="text-sm mt-1">
            O histórico aparecerá aqui quando houver aulas
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ key, label, items }) => (
            <section key={key}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 sticky top-0 bg-background/95 py-1 z-10">
                {label}
              </h3>
              <div className="space-y-0">
                {items.map((entry, idx) => (
                  <UnifiedStatementCard
                    key={entry.class_log_id}
                    entry={entry}
                    isLast={idx === items.length - 1}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t text-xs text-muted-foreground text-center">
        <p>Extrato de {studentName}</p>
        <p className="mt-1">
          {totalClasses} aula{totalClasses !== 1 ? "s" : ""}
          {openBilling > 0 &&
            ` • ${openBilling} cobrança${openBilling !== 1 ? "s" : ""} em aberto`}
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return embedded ? (
      <div className="space-y-4">
        <div className="h-20 rounded-lg bg-muted/50 animate-pulse" />
        <div className="h-32 rounded-lg bg-muted/50 animate-pulse" />
        <div className="h-32 rounded-lg bg-muted/50 animate-pulse" />
      </div>
    ) : (
      <ScrollArea className="h-full">
        <div className="p-6 space-y-4">
          <div className="h-20 rounded-lg bg-muted/50 animate-pulse" />
          <div className="h-32 rounded-lg bg-muted/50 animate-pulse" />
          <div className="h-32 rounded-lg bg-muted/50 animate-pulse" />
        </div>
      </ScrollArea>
    );
  }

  return embedded ? content : <ScrollArea className="h-full">{content}</ScrollArea>;
});
