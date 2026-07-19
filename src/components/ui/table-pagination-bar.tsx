import { Button } from "@/components/ui/button";
import {
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
} from "@phosphor-icons/react";
import { common } from "@/content";

interface TablePaginationBarProps {
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
  isFetching: boolean;
  onPageChange: (page: number | ((prev: number) => number)) => void;
  className?: string;
}

export function TablePaginationBar({
  page,
  pageSize,
  totalCount,
  hasMore,
  isFetching,
  onPageChange,
  className = "",
}: TablePaginationBarProps) {
  if (totalCount === 0 && page === 0) return null;

  const from = totalCount > 0 ? page * pageSize + 1 : 0;
  const to = Math.min((page + 1) * pageSize, totalCount);

  return (
    <div
      className={`border-t px-2 py-2 mobile:px-2 mobile:py-2 tablet:px-2 tablet:py-2 laptop:px-2 laptop:py-2 flex items-center justify-between gap-4 bg-muted/30 ${className}`}
      role="navigation"
      aria-label={common.aria.tablePagination}
    >
      <p className="text-sm mobile:text-xs tablet:text-xs laptop:text-xs text-muted-foreground">
        {totalCount > 0 ? `${from}-${to} de ${totalCount}` : "0 registros"}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0 || isFetching}
          onClick={() => onPageChange((p) => Math.max(0, p - 1))}
          aria-label={common.aria.previousPage}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {common.table.previous}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore || isFetching}
          onClick={() => onPageChange((p) => p + 1)}
          aria-label={common.aria.nextPage}
        >
          {common.table.next}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
