import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  /**
   * Número de linhas do skeleton
   * @default 5
   */
  rows?: number;
  /**
   * Número de colunas do skeleton
   * @default 4
   */
  columns?: number;
  /**
   * Mostrar cabeçalho
   * @default true
   */
  showHeader?: boolean;
}

/**
 * Skeleton para tabelas
 * Mantém o layout estável durante carregamento, evitando Cumulative Layout Shift
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-10 flex-1" />
          ))}
        </div>
      )}
      
      {/* Rows */}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`row-${i}`} className="flex items-center gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={`cell-${i}-${j}`} className="h-16 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
