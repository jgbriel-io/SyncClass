import { DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import type { ForecastedBilling } from "@/hooks/useForecastedBilling";
import type { FinancialSummary } from "./DashboardView";
import { dashboard } from "@/content";
import { type PeriodFilter } from "@/lib/utils/periodFilter";

interface DashboardFinancialCardsProps {
  financialSummary?: FinancialSummary;
  forecastedBilling?: ForecastedBilling;
  periodFilter?: PeriodFilter;
}

const FORECAST_LABELS: Record<PeriodFilter, string> = {
  month: dashboard.financial.forecastedMonthly,
  semester: dashboard.financial.forecastedSemester,
  year: dashboard.financial.forecastedYear,
};

export function DashboardFinancialCards({
  financialSummary,
  forecastedBilling,
  periodFilter = "month",
}: DashboardFinancialCardsProps) {
  const forecastLabel = FORECAST_LABELS[periodFilter];
  if (financialSummary == null && forecastedBilling == null) return null;

  return (
    <div className="grid gap-4 grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-5">
      {forecastedBilling != null && (
        <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs tablet:text-sm font-medium text-muted-foreground">
                {forecastLabel}
              </p>
              <p className="text-xl tablet:text-2xl font-bold tracking-tight text-primary">
                {formatCurrency(forecastedBilling.totalForecast)}
              </p>
              <p className="text-xs text-muted-foreground">
                {dashboard.financial.receivedPercentage(
                  forecastedBilling.receivedPercentage
                )}
              </p>
            </div>
            <div className="h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
              <TrendingUp className="h-4 w-4 tablet:h-5 tablet:w-5 text-primary" />
            </div>
          </div>
        </div>
      )}
      {financialSummary != null && (
        <>
          <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs tablet:text-sm font-medium text-muted-foreground">
                  {dashboard.financial.totalReceived}
                </p>
                <p className="text-xl tablet:text-2xl font-bold tracking-tight text-success">
                  {formatCurrency(financialSummary.totalPaid)}
                </p>
              </div>
              <div className="h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0 bg-success/10">
                <DollarSign className="h-4 w-4 tablet:h-5 tablet:w-5 text-success" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs tablet:text-sm font-medium text-muted-foreground">
                  {dashboard.financial.totalReceivableLabel}
                </p>
                <p className="text-xl tablet:text-2xl font-bold tracking-tight">
                  {formatCurrency(financialSummary.totalReceivable)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboard.financial.pendingPlusOverdue}
                </p>
              </div>
              <div className="h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0 bg-warning/10">
                <DollarSign className="h-4 w-4 tablet:h-5 tablet:w-5 text-warning" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs tablet:text-sm font-medium text-muted-foreground">
                  {dashboard.financial.pending}
                </p>
                <p className="text-xl tablet:text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {formatCurrency(financialSummary.totalPending)}
                </p>
              </div>
              <div className="h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
                <DollarSign className="h-4 w-4 tablet:h-5 tablet:w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-3 tablet:p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs tablet:text-sm font-medium text-muted-foreground">
                  {dashboard.financial.overdue}
                </p>
                <p className="text-xl tablet:text-2xl font-bold tracking-tight text-destructive">
                  {formatCurrency(financialSummary.totalOverdue)}
                </p>
              </div>
              <div className="h-8 w-8 tablet:h-11 tablet:w-11 rounded-lg tablet:rounded-xl flex items-center justify-center shrink-0 bg-destructive/10">
                <DollarSign className="h-4 w-4 tablet:h-5 tablet:w-5 text-destructive" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
