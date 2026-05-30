import { useState } from "react";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { common, filters as filtersContent } from "@/content";
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
          <span className="text-xs font-medium text-muted-foreground">
            {filtersContent.teachers.labels.search}
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={common.placeholders.searchByNameOrEmail}
              className="pl-9"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {/* Filtros Básicos + Botões */}
        <div className="flex flex-col gap-2 tablet:flex-row tablet:flex-wrap tablet:items-end">
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {filtersContent.teachers.labels.status}
            </span>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                onChange({ ...filters, status: v as TeacherStatusFilter })
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder={common.placeholders.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {filtersContent.teachers.status.all}
                </SelectItem>
                <SelectItem value="ativo">
                  {filtersContent.teachers.status.active}
                </SelectItem>
                <SelectItem value="inativo">
                  {filtersContent.teachers.status.inactive}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botão Mais Filtros */}
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-2">
              <Filter className="h-4 w-4" />
              {filtersContent.buttons.moreFilters}
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Botão Limpar */}
          {hasActiveFilters && onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-10"
            >
              <X className="h-4 w-4 mr-1" />
              {filtersContent.buttons.clear}
            </Button>
          )}
        </div>
      </div>

      {/* Linha 2: Filtros Avançados (expansível) */}
      <CollapsibleContent>
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-col gap-3 tablet:flex-row tablet:flex-wrap">
            {/* Ordenar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {filtersContent.teachers.labels.sort}
              </span>
              <Select
                value={filters.sortBy}
                onValueChange={(v) =>
                  onChange({ ...filters, sortBy: v as TeacherSortBy })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={common.placeholders.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">
                    {filtersContent.teachers.sort.nameAsc}
                  </SelectItem>
                  <SelectItem value="name_desc">
                    {filtersContent.teachers.sort.nameDesc}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Especialidade */}
            {specializations.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {filtersContent.teachers.labels.specialization}
                </span>
                <Select
                  value={filters.specialization}
                  onValueChange={(v) =>
                    onChange({ ...filters, specialization: v })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={common.placeholders.specialty} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {filtersContent.teachers.options.allSpecializations}
                    </SelectItem>
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
