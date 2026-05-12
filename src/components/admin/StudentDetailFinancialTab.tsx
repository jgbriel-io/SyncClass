import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils/formatters";
import { StudentStatementTab } from "@/components/student/StudentStatementTab";
import type { StudentDetails } from "@/hooks/useStudentDetails";

interface StudentDetailFinancialTabProps {
  student: StudentDetails;
}

export function StudentDetailFinancialTab({ student }: StudentDetailFinancialTabProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-success/10 p-3 text-center">
            <p className="text-sm font-bold text-success">{formatCurrency(student.stats.totalPaid)}</p>
            <p className="text-xs text-muted-foreground">Pago</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-3 text-center">
            <p className="text-sm font-bold text-amber-600">{formatCurrency(student.stats.totalPending)}</p>
            <p className="text-xs text-muted-foreground">Pendente</p>
          </div>
          <div className="rounded-lg bg-rose-500/10 p-3 text-center">
            <p className="text-sm font-bold text-rose-600">{formatCurrency(student.stats.totalOverdue)}</p>
            <p className="text-xs text-muted-foreground">Atrasado</p>
          </div>
        </div>

        <StudentStatementTab
          studentId={student.id}
          studentName={student.name}
          embedded={true}
          totalAmount={student.stats.totalPaid + student.stats.totalPending + student.stats.totalOverdue}
        />
      </div>
    </ScrollArea>
  );
}
