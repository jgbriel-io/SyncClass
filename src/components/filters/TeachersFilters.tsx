import { useState } from "react";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
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

export type TeacherStatusFilter = "all" | "ativo" | "inativo";
export type TeacherSortBy = "name_asc" | "name_desc";

export interface TeachersFiltersState {
  search: string;
  status: TeacherStatusFilter;
  specialization: string;
  sortBy: TeacherSortBy;
}

interface TeachersFiltersProps {
  filters: TeachersFiltersState;
  onChange: (f: TeachersFiltersState) => void;
  onReset?: () => void;
  specializations: string[];
  /** Status principal - quando ativo, não mostra botão Limpar */
  primaryStatus?: "ativo";
}

export function TeachersFilters({
  filters,
  onChange,
  onReset,
  specializations,
  primaryStatus = "ativo",
}: TeachersFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.status !== primaryStatus ||
    filters.specialization !== "all" ||
    filters.sortBy !== "name_asc";

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
              placeholder="Buscar por nome ou email..."
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
              onValueChange={(v) => onChange({ ...filters, status: v as TeacherStatusFilter })}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Arquivados</SelectItem>
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
            {/* Ordenar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Ordenar</span>
              <Select
                value={filters.sortBy}
                onValueChange={(v) => onChange({ ...filters, sortBy: v as TeacherSortBy })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Especialidade */}
            {specializations.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Especialidade</span>
                <Select
                  value={filters.specialization}
                  onValueChange={(v) => onChange({ ...filters, specialization: v })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {specializations.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
