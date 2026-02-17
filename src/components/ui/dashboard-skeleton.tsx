import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface CardSkeletonProps {
  /**
   * Número de cards
   * @default 3
   */
  count?: number;
}

/**
 * Skeleton para cards
 * Útil para dashboards e páginas com cards de estatísticas
 */
export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={`card-skeleton-${i}`} className="p-6">
          <div className="space-y-4">
            {/* Icon + Label */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}

interface DashboardSkeletonProps {
  /**
   * Número de cards de estatísticas
   * @default 4
   */
  metricCards?: number;
  /**
   * Mostrar skeleton de tabela
   * @default true
   */
  showTable?: boolean;
}

/**
 * Skeleton para dashboard completo
 * Cards de estatísticas + tabela
 */
export function DashboardSkeleton({ 
  metricCards = 4,
  showTable = true 
}: DashboardSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 laptop:grid-cols-4 gap-4">
        <CardSkeleton count={metricCards} />
      </div>
      
      {/* Table Section */}
      {showTable && (
        <Card className="p-6">
          <div className="space-y-4">
            {/* Table Header */}
            <Skeleton className="h-8 w-48" />
            
            {/* Table Rows */}
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`table-row-${i}`} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
