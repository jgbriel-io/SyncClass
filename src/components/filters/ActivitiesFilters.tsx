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

export type ActivityStatusFilter =
  | "all"
  | "enviada"
  | "vencida"
  | "entregue"
  | "corrigida";
export type ActivityPeriodFilter = "all" | "week" | "month" | "3months";
export type ActivitySortBy =
  | "due_asc"
  | "due_desc"
  | "created_desc"
  | "created_asc"
  | "student_asc"
  | "student_desc";

export interface ActivitiesFiltersState {
  search: string;
  status: ActivityStatusFilter;
  studentId: string;
  teacherId: string;
  period: ActivityPeriodFilter;
  sortBy: ActivitySortBy;
}

interface Student {
  id: string;
  name: string | null;
}

interface Teacher {
  id: string;
  name: string | null;
}

interface ActivitiesFiltersProps {
  filters: ActivitiesFiltersState;
  onChange: (f: ActivitiesFiltersState) => void;
  onReset?: () => void;
  students: Student[];
  teachers?: Teacher[];
  showTeacherFilter?: boolean;
  showStudentFilter?: boolean;
  /** Status principal - quando all, não mostra botão Limpar */
  primaryStatus?: "all";
}

export function ActivitiesFilters({
  filters,
  onChange,
  onReset,
  students,
  teachers = [],
  showTeacherFilter = false,
  showStudentFilter = true,
  primaryStatus = "all",
}: ActivitiesFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.status !== primaryStatus ||
    (showStudentFilter && filters.studentId !== "all") ||
    (showTeacherFilter && filters.teacherId !== "all") ||
    filters.period !== "all" ||
    filters.sortBy !== "due_asc";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      {/* Linha 1: Busca + Filtros Básicos + Botão Mais Filtros */}
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        {/* Busca */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
          <span className="text-xs font-medium text-muted-foreground">
            {filtersContent.activities.labels.search}
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
        <div className="grid grid-cols-2 gap-2 tablet:flex tablet:flex-row tablet:flex-wrap tablet:items-end">
          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {filtersContent.activities.labels.status}
            </span>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                onChange({ ...filters, status: v as ActivityStatusFilter })
              }
            >
              <SelectTrigger className="w-full tablet:w-[140px]">
                <SelectValue placeholder={common.placeholders.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {filtersContent.activities.status.all}
                </SelectItem>
                <SelectItem value="enviada">
                  {filtersContent.activities.status.sent}
                </SelectItem>
                <SelectItem value="vencida">
                  {filtersContent.activities.status.overdue}
                </SelectItem>
                <SelectItem value="entregue">
                  {filtersContent.activities.status.delivered}
                </SelectItem>
                <SelectItem value="corrigida">
                  {filtersContent.activities.status.corrected}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aluno */}
          {showStudentFilter && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {filtersContent.activities.labels.student}
              </span>
              <Select
                value={filters.studentId}
                onValueChange={(v) => onChange({ ...filters, studentId: v })}
              >
                <SelectTrigger className="w-full tablet:w-[200px] pl-3 text-left">
                  <SelectValue placeholder={common.placeholders.student} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {filtersContent.activities.options.allStudents}
                  </SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name || "—"}
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
            {/* Professor (se admin) */}
            {showTeacherFilter && teachers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {filtersContent.activities.labels.teacher}
                </span>
                <Select
                  value={filters.teacherId}
                  onValueChange={(v) => onChange({ ...filters, teacherId: v })}
                >
                  <SelectTrigger className="w-full tablet:w-[200px] pl-3 text-left">
                    <SelectValue placeholder={common.placeholders.teacher} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {filtersContent.activities.options.allTeachers}
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

            {/* Período */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {filtersContent.activities.labels.period}
              </span>
              <Select
                value={filters.period}
                onValueChange={(v) =>
                  onChange({ ...filters, period: v as ActivityPeriodFilter })
                }
              >
                <SelectTrigger className="w-full tablet:w-[140px]">
                  <SelectValue placeholder={common.placeholders.period} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {filtersContent.activities.period.all}
                  </SelectItem>
                  <SelectItem value="week">
                    {filtersContent.activities.period.week}
                  </SelectItem>
                  <SelectItem value="month">
                    {filtersContent.activities.period.month}
                  </SelectItem>
                  <SelectItem value="3months">
                    {filtersContent.activities.period.threeMonths}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {filtersContent.activities.labels.sort}
              </span>
              <Select
                value={filters.sortBy}
                onValueChange={(v) =>
                  onChange({ ...filters, sortBy: v as ActivitySortBy })
                }
              >
                <SelectTrigger className="w-full tablet:w-[220px] pl-3 text-left">
                  <SelectValue placeholder={common.placeholders.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_asc">
                    {filtersContent.activities.sort.dueAsc}
                  </SelectItem>
                  <SelectItem value="due_desc">
                    {filtersContent.activities.sort.dueDesc}
                  </SelectItem>
                  <SelectItem value="created_desc">
                    {filtersContent.activities.sort.createdDesc}
                  </SelectItem>
                  <SelectItem value="created_asc">
                    {filtersContent.activities.sort.createdAsc}
                  </SelectItem>
                  <SelectItem value="student_asc">
                    {filtersContent.activities.sort.studentAsc}
                  </SelectItem>
                  <SelectItem value="student_desc">
                    {filtersContent.activities.sort.studentDesc}
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
