import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import { financial as financialContent } from "@/content";

interface ForecastData {
  totalForecast: number;
  receivedThisMonth: number;
  pendingThisMonth: number;
  receivedPercentage: number;
  paidCount: number;
  totalCount: number;
}

interface FinancialForecastCardProps {
  forecastedBilling: ForecastData | null | undefined;
}

export function FinancialForecastCard({
  forecastedBilling,
}: FinancialForecastCardProps) {
  if (!forecastedBilling) return null;

  return (
    <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-card mb-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs desktop:text-sm font-medium text-muted-foreground">
              {financialContent.view.forecastTitle}
            </p>
          </div>
          <p className="text-2xl laptop:text-xl desktop:text-2xl font-bold tracking-tight text-primary">
            {formatCurrency(forecastedBilling.totalForecast)}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="text-success font-medium">
              {formatCurrency(forecastedBilling.receivedThisMonth)} recebido
            </span>
            <span>•</span>
            <span className="font-medium">
              {formatCurrency(forecastedBilling.pendingThisMonth)} pendente
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(forecastedBilling.receivedPercentage, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {forecastedBilling.receivedPercentage}% recebido (
            {forecastedBilling.paidCount}/{forecastedBilling.totalCount}{" "}
            cobranças)
          </p>
        </div>
      </div>
    </div>
  );
}
