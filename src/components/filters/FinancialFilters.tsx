import { useState } from "react";
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type FinancialPeriodPreset = "all" | "today" | "this_week" | "this_month";
export type FinancialStatusFilter = "all" | "pendente" | "pago" | "atrasado";
export type FinancialSortBy = "due_desc" | "due_asc" | "amount_desc" | "amount_asc" | "created_desc" | "created_asc";

export interface FinancialFiltersState {
  search: string;
  periodPreset: FinancialPeriodPreset;
  dateFrom: string;
  dateTo: string;
  status: FinancialStatusFilter;
  studentId: string;
  sortBy: FinancialSortBy;
}

interface Student {
  id: string;
  name: string | null;
}

interface FinancialFiltersProps {
  filters: FinancialFiltersState;
  onChange: (f: FinancialFiltersState) => void;
  onReset?: () => void;
  students?: Student[];
}

export function FinancialFilters({ filters, onChange, onReset, students = [] }: FinancialFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.periodPreset !== "all" ||
    filters.status !== "all" ||
    filters.studentId !== "all" ||
    filters.sortBy !== "created_desc";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      {/* Linha 1: Busca + Filtros Básicos + Botão Mais Filtros */}
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        {/* Busca */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
          <span className="text-xs font-medium text-muted-foreground">Busca</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por aluno..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {/* Filtros Básicos + Botões */}
        <div className="flex flex-wrap items-end gap-2">
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <Select
              value={filters.status}
              onValueChange={(v) => onChange({ ...filters, status: v as FinancialStatusFilter })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Período</span>
            <Select
              value={filters.periodPreset}
              onValueChange={(v) => {
                const preset = v as FinancialPeriodPreset;
                const now = new Date();
                let dateFrom = "";
                let dateTo = "";
                if (preset === "today") {
                  dateFrom = dateTo = now.toISOString().split("T")[0];
                } else if (preset === "this_week") {
                  const start = new Date(now);
                  start.setDate(start.getDate() - start.getDay());
                  const end = new Date(start);
                  end.setDate(end.getDate() + 6);
                  dateFrom = start.toISOString().split("T")[0];
                  dateTo = end.toISOString().split("T")[0];
                } else if (preset === "this_month") {
                  dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
                  dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
                }
                onChange({ ...filters, periodPreset: preset, dateFrom, dateTo });
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="this_week">Esta semana</SelectItem>
                <SelectItem value="this_month">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botão Mais Filtros */}
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-2">
              <Filter className="h-4 w-4" />
              Mais Filtros
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Botão Limpar */}
          {hasActiveFilters && onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-10">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Linha 2: Filtros Avançados (expansível) */}
      <CollapsibleContent>
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-wrap gap-4">
            {/* Aluno */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Aluno</span>
              <Select
                value={filters.studentId}
                onValueChange={(v) => onChange({ ...filters, studentId: v })}
              >
                <SelectTrigger className="w-[200px] pl-3 text-left">
                  <SelectValue placeholder="Aluno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="pl-6">
                    Todos os alunos
                  </SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="pl-6">
                      {s.name || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Ordenar</span>
              <Select
                value={filters.sortBy}
                onValueChange={(v) => onChange({ ...filters, sortBy: v as FinancialSortBy })}
              >
                <SelectTrigger className="w-[220px] pl-3 text-left">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_asc">Vencimento (mais próximo)</SelectItem>
                  <SelectItem value="due_desc">Vencimento (mais distante)</SelectItem>
                  <SelectItem value="amount_desc">Valor (maior)</SelectItem>
                  <SelectItem value="amount_asc">Valor (menor)</SelectItem>
                  <SelectItem value="created_desc">Criação (mais recente)</SelectItem>
                  <SelectItem value="created_asc">Criação (mais antiga)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
