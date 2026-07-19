import { CurrencyDollar as DollarSign } from "@phosphor-icons/react";
import { formatCurrency } from "@/lib/utils/formatters";
import { financial as financialContent } from "@/content";

interface FinancialSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalReceivable: number;
}

interface FinancialSummaryCardsProps {
  summary: FinancialSummary | undefined;
}

export function FinancialSummaryCards({ summary }: FinancialSummaryCardsProps) {
  const totalPaid = summary?.totalPaid ?? 0;
  const totalPending = summary?.totalPending ?? 0;
  const totalOverdue = summary?.totalOverdue ?? 0;

  return (
    <div className="grid gap-4 grid-cols-2 laptop:grid-cols-4">
      <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="space-y-1 tablet:space-y-2 min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground leading-tight">
              {financialContent.view.totalReceived}
            </p>
            <p className="text-xl tablet:text-2xl font-bold tracking-tight text-success">
              {formatCurrency(totalPaid)}
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
              {formatCurrency(totalPending + totalOverdue)}
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
              {formatCurrency(totalPending)}
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
              {formatCurrency(totalOverdue)}
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
