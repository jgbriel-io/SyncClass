import { Search, Filter, X } from "lucide-react";
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
  const hasActiveFilters =
    filters.status !== primaryStatus ||
    filters.specialization !== "all" ||
    filters.sortBy !== "name_asc";

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3 flex-wrap">
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
        <div className="flex flex-wrap items-end gap-2">
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
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          </div>
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
          {specializations.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Especialidade</span>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-[180px] justify-start">
                    <Filter className="h-4 w-4 mr-2" />
                    Especialidade
                  </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 p-3 rounded-lg border bg-muted/30">
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
              </CollapsibleContent>
            </Collapsible>
            </div>
          )}
          {hasActiveFilters && onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-9 self-end">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
