import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Clock, DollarSign, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import type { UpcomingPayment } from "./DashboardView";
import { dashboard } from "@/content";

interface DashboardUpcomingPaymentsProps {
  upcomingPayments: UpcomingPayment[];
  basePath: "/admin" | "/teacher";
}

export function DashboardUpcomingPayments({ upcomingPayments, basePath }: DashboardUpcomingPaymentsProps) {
  return (
    <div className="rounded-xl border bg-card shadow-card">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div>
            <h2 className="text-lg mobile:text-base tablet:text-base laptop:text-base desktop:text-lg font-semibold">{dashboard.upcomingPayments.title}</h2>
            <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground">{dashboard.upcomingPayments.subtitle}</p>
          </div>
        </div>
        <StatusBadge variant="warning">{upcomingPayments.length}</StatusBadge>
      </div>
      <div className="divide-y max-h-[320px] overflow-y-auto">
        {upcomingPayments.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            message={dashboard.upcomingPayments.noPayments}
            size="default"
          />
        ) : (
          upcomingPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {payment.studentName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm mobile:text-xs tablet:text-xs laptop:text-xs">{payment.studentName}</p>
                  <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground">
                    {dashboard.upcomingPayments.dueIn(formatDate(payment.dueDate))}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-sm mobile:text-xs tablet:text-xs laptop:text-xs">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          ))
        )}
      </div>
      {upcomingPayments.length > 0 && (
        <div className="border-t px-2 py-2">
          <Link
            to={`${basePath}/financial`}
            className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            {dashboard.upcomingPayments.viewAll}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
