import { DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import type { ForecastedBilling } from "@/hooks/useForecastedBilling";
import type { FinancialSummary } from "./DashboardView";

interface DashboardFinancialCardsProps {
  financialSummary?: FinancialSummary;
  forecastedBilling?: ForecastedBilling;
}

export function DashboardFinancialCards({ financialSummary, forecastedBilling }: DashboardFinancialCardsProps) {
  if (financialSummary == null && forecastedBilling == null) return null;

  return (
    <div className="grid gap-4 grid-cols-1 laptop:grid-cols-5">
      {forecastedBilling != null && (
        <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">Previsão Mensal</p>
              <p className="text-2xl mobile:text-xl tablet:text-xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-primary">
                {formatCurrency(forecastedBilling.totalForecast)}
              </p>
              <p className="text-xs text-muted-foreground">
                {forecastedBilling.receivedPercentage}% recebido
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      )}
      {financialSummary != null && (
        <>
          <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">Total recebido</p>
                <p className="text-2xl mobile:text-xl tablet:text-xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-success">
                  {formatCurrency(financialSummary.totalPaid)}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">Total a receber</p>
                <p className="text-2xl mobile:text-xl tablet:text-xl laptop:text-xl desktop:text-2xl font-bold tracking-tight">
                  {formatCurrency(financialSummary.totalReceivable)}
                </p>
                <p className="text-xs text-muted-foreground">Pendentes + Em atraso</p>
              </div>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-warning/10">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">Pendente</p>
                <p className="text-2xl mobile:text-xl tablet:text-xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {formatCurrency(financialSummary.totalPending)}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-blue-500/10">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">Em atraso</p>
                <p className="text-2xl mobile:text-xl tablet:text-xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-destructive">
                  {formatCurrency(financialSummary.totalOverdue)}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-destructive/10">
                <DollarSign className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
