import { useState } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRateLimitDashboard } from "@/hooks/useRateLimitDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { QK } from "@/hooks/queryKeys";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const WINDOW_OPTIONS = [
  { label: "Última hora", value: 1 },
  { label: "Últimas 6h", value: 6 },
  { label: "Último dia", value: 24 },
];

export default function RateLimitDashboardPage() {
  const [windowHours, setWindowHours] = useState(1);
  const {
    data = [],
    isLoading,
    isFetching,
  } = useRateLimitDashboard(windowHours);
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [QK.RATE_LIMIT_DASHBOARD] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mobile:text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Rate Limits
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento de requisições por operação
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {WINDOW_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={windowHours === opt.value ? "default" : "outline"}
              onClick={() => setWindowHours(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/50">
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
                  Operação
                </TableHead>
                <TableHead className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
                  Total de Requisições
                </TableHead>
                <TableHead className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
                  Usuários Únicos
                </TableHead>
                <TableHead className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
                  Máx por Usuário
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2">
                  Início da Janela
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/40">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-12"
                  >
                    Nenhuma requisição registrada no período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow
                    key={row.operation}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="px-4 py-3 font-mono text-sm font-medium">
                      {row.operation}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center tabular-nums">
                      {row.total_requests.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center tabular-nums">
                      {row.unique_users.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center tabular-nums">
                      <span
                        className={
                          row.max_per_user >= 8
                            ? "text-destructive font-semibold"
                            : row.max_per_user >= 5
                              ? "text-amber-600 dark:text-amber-400 font-medium"
                              : ""
                        }
                      >
                        {row.max_per_user}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(row.window_start), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Atualização automática a cada 30 segundos.
      </p>
    </div>
  );
}
