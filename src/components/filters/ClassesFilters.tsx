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
import { common, classes as classesContent } from "@/content";

export type ClassStatusFilter =
  | "all"
  | "em_aberto"
  | "agendada"
  | "avaliacao_pendente"
  | "concluida";
export type ClassPeriodFilter = "all" | "week" | "month" | "3months";
export type ClassTypeFilter = "all" | "pacote" | "individual";
export type ClassSortFilter = "recent" | "oldest";

export interface ClassesFiltersState {
  search: string;
  period: ClassPeriodFilter;
  teacherId: string;
  studentId: string;
  classType: ClassTypeFilter;
  status: ClassStatusFilter;
  sort: ClassSortFilter;
}

interface Teacher {
  id: string;
  name: string | null;
}

interface Student {
  id: string;
  name: string | null;
}

interface ClassesFiltersProps {
  filters: ClassesFiltersState;
  onChange: (f: ClassesFiltersState) => void;
  onReset?: () => void;
  teachers: Teacher[];
  students: Student[];
  showTeacherFilter?: boolean;
}

export function ClassesFilters({
  filters,
  onChange,
  onReset,
  teachers,
  students,
  showTeacherFilter = true,
}: ClassesFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.period !== "all" ||
    (showTeacherFilter && filters.teacherId !== "all") ||
    filters.studentId !== "all" ||
    filters.classType !== "all" ||
    filters.status !== "em_aberto";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      {/* Linha 1: Busca + Filtros Básicos + Botão Mais Filtros */}
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        {/* Busca */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
          <span className="text-xs font-medium text-muted-foreground">
            {classesContent.filters.searchLabel}
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={classesContent.filters.searchPlaceholder}
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
              {classesContent.filters.statusLabel}
            </span>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                onChange({ ...filters, status: v as ClassStatusFilter })
              }
            >
              <SelectTrigger className="w-full tablet:w-[160px]">
                <SelectValue placeholder={common.placeholders.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em_aberto">
                  {classesContent.filters.statusOpen}
                </SelectItem>
                <SelectItem value="all">
                  {classesContent.filters.statusAll}
                </SelectItem>
                <SelectItem value="agendada">
                  {classesContent.filters.statusScheduled}
                </SelectItem>
                <SelectItem value="avaliacao_pendente">
                  {classesContent.filters.statusPending}
                </SelectItem>
                <SelectItem value="concluida">
                  {classesContent.filters.statusDone}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aluno */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {classesContent.filters.studentLabel}
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
                  {classesContent.filters.studentAll}
                </SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name || "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ordenação */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {classesContent.filters.sortLabel}
            </span>
            <Select
              value={filters.sort}
              onValueChange={(v) =>
                onChange({ ...filters, sort: v as ClassSortFilter })
              }
            >
              <SelectTrigger className="w-full tablet:w-[160px]">
                <SelectValue placeholder={common.placeholders.sorting} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  {classesContent.filters.sortRecent}
                </SelectItem>
                <SelectItem value="oldest">
                  {classesContent.filters.sortOldest}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 flex gap-2 tablet:contents">
            {/* Botão Mais Filtros */}
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2">
                <Filter className="h-4 w-4" />
                {classesContent.filters.moreFilters}
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
                {classesContent.filters.clear}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Linha 2: Filtros Avançados (expansível) */}
      <CollapsibleContent>
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid grid-cols-2 gap-2 tablet:flex tablet:flex-row tablet:flex-wrap">
            {/* Professor */}
            {showTeacherFilter && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {classesContent.filters.teacherLabel}
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
                      {classesContent.filters.teacherAll}
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

            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {classesContent.filters.typeLabel}
              </span>
              <Select
                value={filters.classType}
                onValueChange={(v) =>
                  onChange({ ...filters, classType: v as ClassTypeFilter })
                }
              >
                <SelectTrigger className="w-full tablet:w-[140px]">
                  <SelectValue placeholder={common.placeholders.type} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {classesContent.filters.typeAll}
                  </SelectItem>
                  <SelectItem value="pacote">
                    {classesContent.filters.typePackage}
                  </SelectItem>
                  <SelectItem value="individual">
                    {classesContent.filters.typeIndividual}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {classesContent.filters.periodLabel}
              </span>
              <Select
                value={filters.period}
                onValueChange={(v) =>
                  onChange({ ...filters, period: v as ClassPeriodFilter })
                }
              >
                <SelectTrigger className="w-full tablet:w-[140px]">
                  <SelectValue placeholder={common.placeholders.period} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {classesContent.filters.periodAll}
                  </SelectItem>
                  <SelectItem value="week">
                    {classesContent.filters.periodWeek}
                  </SelectItem>
                  <SelectItem value="month">
                    {classesContent.filters.periodMonth}
                  </SelectItem>
                  <SelectItem value="3months">
                    {classesContent.filters.period3Months}
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
