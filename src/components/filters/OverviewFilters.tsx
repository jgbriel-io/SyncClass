import { useState } from "react";
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
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

export type OverviewPeriodFilter = "all" | "7" | "30" | "90";
export type OverviewSortBy = "name_asc" | "name_desc" | "recent" | "oldest";

export interface OverviewFiltersState {
  search: string;
  status: string;
  period: OverviewPeriodFilter;
  teacherId: string;
  studentId: string;
  sortBy: OverviewSortBy;
}

interface Teacher {
  id: string;
  name: string | null;
}

interface Student {
  id: string;
  name: string | null;
}

interface OverviewFiltersProps {
  filters: OverviewFiltersState;
  onChange: (f: OverviewFiltersState) => void;
  onReset?: () => void;
  teachers?: Teacher[];
  students?: Student[];
  showTeacherFilter?: boolean;
  /** Status principal - quando all, não mostra botão Limpar; use ativo para priorizar ativos */
  primaryStatus?: "ativo" | "all";
}

export function OverviewFilters({
  filters,
  onChange,
  onReset,
  teachers = [],
  students = [],
  showTeacherFilter = false,
  primaryStatus = "all",
}: OverviewFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.status !== primaryStatus ||
    filters.period !== "all" ||
    (showTeacherFilter && filters.teacherId !== "all") ||
    filters.studentId !== "all" ||
    filters.sortBy !== "recent";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      {/* Linha 1: Busca + Filtros Básicos + Botão Mais Filtros */}
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        {/* Busca */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
          <span className="text-xs font-medium text-muted-foreground">
            {filtersContent.overview.labels.search}
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={common.placeholders.searchByName}
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
              {filtersContent.overview.labels.status}
            </span>
            <Select
              value={filters.status}
              onValueChange={(v) => onChange({ ...filters, status: v })}
            >
              <SelectTrigger className="w-[130px] pl-3 text-left">
                <SelectValue placeholder={common.placeholders.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="pl-6">
                  {filtersContent.overview.status.all}
                </SelectItem>
                <SelectItem value="ativo" className="pl-6">
                  {filtersContent.overview.status.active}
                </SelectItem>
                <SelectItem value="inativo" className="pl-6">
                  {filtersContent.overview.status.inactive}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {filtersContent.overview.labels.period}
            </span>
            <Select
              value={filters.period}
              onValueChange={(v) =>
                onChange({ ...filters, period: v as OverviewPeriodFilter })
              }
            >
              <SelectTrigger className="w-[150px] pl-3 text-left">
                <SelectValue placeholder={common.placeholders.period} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="pl-6">
                  {filtersContent.overview.period.all}
                </SelectItem>
                <SelectItem value="7" className="pl-6">
                  {filtersContent.overview.period.last7Days}
                </SelectItem>
                <SelectItem value="30" className="pl-6">
                  {filtersContent.overview.period.last30Days}
                </SelectItem>
                <SelectItem value="90" className="pl-6">
                  {filtersContent.overview.period.last90Days}
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
            {/* Professor */}
            {showTeacherFilter && teachers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {filtersContent.overview.labels.teacher}
                </span>
                <Select
                  value={filters.teacherId}
                  onValueChange={(v) => onChange({ ...filters, teacherId: v })}
                >
                  <SelectTrigger className="w-[200px] pl-3 text-left">
                    <SelectValue
                      placeholder={common.placeholders.teacherResponsible}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="pl-6">
                      {filtersContent.overview.options.allTeachers}
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

            {/* Aluno */}
            {students.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {filtersContent.overview.labels.student}
                </span>
                <Select
                  value={filters.studentId}
                  onValueChange={(v) => onChange({ ...filters, studentId: v })}
                >
                  <SelectTrigger className="w-[200px] pl-3 text-left">
                    <SelectValue placeholder={common.placeholders.student} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="pl-6">
                      {filtersContent.overview.options.allStudents}
                    </SelectItem>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="pl-6">
                        {s.name || "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Ordenar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {filtersContent.overview.labels.sort}
              </span>
              <Select
                value={filters.sortBy}
                onValueChange={(v) =>
                  onChange({ ...filters, sortBy: v as OverviewSortBy })
                }
              >
                <SelectTrigger className="w-[240px] pl-3 text-left">
                  <SelectValue placeholder={common.placeholders.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent" className="pl-6">
                    {filtersContent.overview.sort.recent}
                  </SelectItem>
                  <SelectItem value="oldest" className="pl-6">
                    {filtersContent.overview.sort.oldest}
                  </SelectItem>
                  <SelectItem value="name_asc" className="pl-6">
                    {filtersContent.overview.sort.nameAsc}
                  </SelectItem>
                  <SelectItem value="name_desc" className="pl-6">
                    {filtersContent.overview.sort.nameDesc}
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
