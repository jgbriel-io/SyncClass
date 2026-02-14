import { useState, useEffect } from "react";
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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

export type StudentStatusFilter = "all" | "ativo" | "inativo";
export type StudentSortBy = "name_asc" | "name_desc" | "last_payment_desc" | "last_payment_asc";
export type StudentFilterPreset = "all" | "aniversariantes";

export interface StudentsFiltersState {
  search: string;
  status: StudentStatusFilter;
  teacherId: string;
  sortBy: StudentSortBy;
  filterPreset: StudentFilterPreset;
}

interface Teacher {
  id: string;
  name: string | null;
}

interface StudentsFiltersProps {
  filters: StudentsFiltersState;
  onChange: (f: StudentsFiltersState) => void;
  onReset?: () => void;
  teachers: Teacher[];
  showTeacherFilter?: boolean;
  autoTeacherId?: string | null;
  /** Status principal - quando ativo, não mostra botão Limpar */
  primaryStatus?: "ativo";
}

export function StudentsFilters({
  filters,
  onChange,
  onReset,
  teachers,
  showTeacherFilter = true,
  autoTeacherId = null,
  primaryStatus = "ativo",
}: StudentsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);
  
  // Debounce de 300ms para evitar queries excessivas
  const debouncedSearch = useDebouncedValue(localSearch, 300);

  // Atualizar filtros quando o debounced search mudar
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ ...filters, search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Sincronizar local search quando filters.search mudar externamente (ex: reset)
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const hasActiveFilters =
    filters.filterPreset !== "all" ||
    filters.status !== primaryStatus ||
    (showTeacherFilter && filters.teacherId !== "all") ||
    filters.sortBy !== "name_asc";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      {/* Linha 1: Busca + Filtros Básicos + Botão Mais Filtros */}
      <div className="flex flex-col md:flex-row gap-3 flex-wrap">
        {/* Busca */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
          <span className="text-xs font-medium text-muted-foreground">Busca</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              className="pl-9"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
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
              onValueChange={(v) => onChange({ ...filters, status: v as StudentStatusFilter })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Arquivados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros adicionais */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Filtros adicionais</span>
            <Select
              value={filters.filterPreset}
              onValueChange={(v) => onChange({ ...filters, filterPreset: v as StudentFilterPreset })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtros adicionais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="aniversariantes">Aniversariantes do mês</SelectItem>
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
          <div className="flex flex-wrap gap-3">
            {/* Professor */}
            {showTeacherFilter && !autoTeacherId && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Professor</span>
                <Select
                  value={filters.teacherId}
                  onValueChange={(v) => onChange({ ...filters, teacherId: v })}
                >
                  <SelectTrigger className="w-[200px] pl-3 text-left">
                    <SelectValue placeholder="Professor responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="pl-6">
                      Todos os professores
                    </SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="pl-6">
                        {t.name || "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Ordenar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Ordenar</span>
              <Select
                value={filters.sortBy}
                onValueChange={(v) => onChange({ ...filters, sortBy: v as StudentSortBy })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="last_payment_desc">Último pagamento (mais recente)</SelectItem>
                  <SelectItem value="last_payment_asc">Último pagamento (mais antigo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
