import { useState, useEffect } from "react";
import {
  MagnifyingGlass as Search,
  X,
  FunnelSimple as Filter,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
import { students as studentsContent } from "@/content";

export type StudentStatusFilter = "all" | "ativo" | "inativo" | "anonimizados";
export type StudentSortBy =
  | "name_asc"
  | "name_desc"
  | "last_payment_desc"
  | "last_payment_asc";
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
  showAnonymizedFilter?: boolean;
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
  showAnonymizedFilter = false,
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
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        {/* Busca */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
          <span className="text-xs font-medium text-muted-foreground">
            {filtersContent.students.labels.search}
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={common.placeholders.searchByNameOrEmail}
              className="pl-9"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filtros Básicos + Botões */}
        <div className="grid grid-cols-2 gap-2 tablet:flex tablet:flex-row tablet:flex-wrap tablet:items-end">
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {filtersContent.students.labels.status}
            </span>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                onChange({ ...filters, status: v as StudentStatusFilter })
              }
            >
              <SelectTrigger className="w-full tablet:w-[140px]">
                <SelectValue placeholder={common.placeholders.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {filtersContent.students.status.all}
                </SelectItem>
                <SelectItem value="ativo">
                  {filtersContent.students.status.active}
                </SelectItem>
                <SelectItem value="inativo">
                  {filtersContent.students.status.inactive}
                </SelectItem>
                {showAnonymizedFilter && (
                  <SelectItem value="anonimizados">
                    {studentsContent.table.filterAnonymized}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Professor (admin only) */}
          {showTeacherFilter && !autoTeacherId && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {filtersContent.students.labels.teacher}
              </span>
              <Select
                value={filters.teacherId}
                onValueChange={(v) => onChange({ ...filters, teacherId: v })}
              >
                <SelectTrigger className="w-full tablet:w-[200px] pl-3 text-left">
                  <SelectValue
                    placeholder={common.placeholders.teacherResponsible}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {filtersContent.students.options.allTeachers}
                  </SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="col-span-2 flex gap-2 tablet:contents">
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
      </div>

      {/* Linha 2: Filtros Avançados (expansível) */}
      <CollapsibleContent>
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-2 tablet:flex tablet:flex-row tablet:flex-wrap">
            {/* Filtros adicionais */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {filtersContent.students.labels.additionalFilters}
              </span>
              <Select
                value={filters.filterPreset}
                onValueChange={(v) =>
                  onChange({
                    ...filters,
                    filterPreset: v as StudentFilterPreset,
                  })
                }
              >
                <SelectTrigger className="w-full tablet:w-[200px]">
                  <SelectValue
                    placeholder={common.placeholders.additionalFilters}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {filtersContent.students.additionalFilters.all}
                  </SelectItem>
                  <SelectItem value="aniversariantes">
                    {filtersContent.students.additionalFilters.birthdays}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {filtersContent.students.labels.sort}
              </span>
              <Select
                value={filters.sortBy}
                onValueChange={(v) =>
                  onChange({ ...filters, sortBy: v as StudentSortBy })
                }
              >
                <SelectTrigger className="w-full tablet:w-[180px]">
                  <SelectValue placeholder={common.placeholders.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">
                    {filtersContent.students.sort.nameAsc}
                  </SelectItem>
                  <SelectItem value="name_desc">
                    {filtersContent.students.sort.nameDesc}
                  </SelectItem>
                  <SelectItem value="last_payment_desc">
                    {filtersContent.students.sort.lastPaymentDesc}
                  </SelectItem>
                  <SelectItem value="last_payment_asc">
                    {filtersContent.students.sort.lastPaymentAsc}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
