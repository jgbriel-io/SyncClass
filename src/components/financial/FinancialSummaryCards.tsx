import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { financial as financialContent } from "@/content";
import type { FinancialRecordWithRelations } from "@/hooks/useFinancialRecords";
import { getFinancialActualStatus } from "@/lib/utils/financialStatus";

interface FinancialSummaryCardsProps {
  records: FinancialRecordWithRelations[];
}

export function FinancialSummaryCards({ records }: FinancialSummaryCardsProps) {
  const recordsWithActualStatus = records.map((record) => ({
    ...record,
    actualStatus: getFinancialActualStatus(record),
  }));

  const actualSummary = {
    totalPending: 0,
    totalPaid: 0,
    totalOverdue: 0,
  };

  recordsWithActualStatus.forEach((record) => {
    const amount = Number(record.amount) || 0;
    if (record.actualStatus === "pago") {
      actualSummary.totalPaid += amount;
    } else if (record.actualStatus === "atrasado") {
      actualSummary.totalOverdue += amount;
    } else {
      actualSummary.totalPending += amount;
    }
  });

  return (
    <div className="grid gap-4 grid-cols-2 laptop:grid-cols-4">
      <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="space-y-1 tablet:space-y-2 min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground leading-tight">
              {financialContent.view.totalReceived}
            </p>
            <p className="text-xl tablet:text-2xl font-bold tracking-tight text-success">
              {formatCurrency(actualSummary.totalPaid)}
            </p>
          </div>
          <div className="h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0 bg-success/10">
            <DollarSign className="h-4 w-4 tablet:h-5 tablet:w-5 text-success" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="space-y-1 tablet:space-y-2 min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground leading-tight">
              {financialContent.view.totalToReceive}
            </p>
            <p className="text-xl tablet:text-2xl font-bold tracking-tight">
              {formatCurrency(
                actualSummary.totalPending + actualSummary.totalOverdue
              )}
            </p>
          </div>
          <div className="h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0 bg-warning/10">
            <DollarSign className="h-4 w-4 tablet:h-5 tablet:w-5 text-warning" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="space-y-1 tablet:space-y-2 min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground leading-tight">
              {financialContent.view.pendingLabel}
            </p>
            <p className="text-xl tablet:text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {formatCurrency(actualSummary.totalPending)}
            </p>
          </div>
          <div className="h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
            <DollarSign className="h-4 w-4 tablet:h-5 tablet:w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="space-y-1 tablet:space-y-2 min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground leading-tight">
              {financialContent.view.overdueLabel}
            </p>
            <p className="text-xl tablet:text-2xl font-bold tracking-tight text-destructive">
              {formatCurrency(actualSummary.totalOverdue)}
            </p>
          </div>
          <div className="h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0 bg-destructive/10">
            <DollarSign className="h-4 w-4 tablet:h-5 tablet:w-5 text-destructive" />
          </div>
        </div>
      </div>
    </div>
  );
}
