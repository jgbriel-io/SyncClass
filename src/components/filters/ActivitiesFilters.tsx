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

export type ActivityStatusFilter = "all" | "enviada" | "vencida" | "entregue" | "corrigida";
export type ActivityPeriodFilter = "all" | "week" | "month" | "3months";
export type ActivitySortBy = "due_asc" | "due_desc" | "created_desc" | "created_asc" | "student_asc" | "student_desc";

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
  primaryStatus = "all",
}: ActivitiesFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.status !== primaryStatus ||
    filters.studentId !== "all" ||
    (showTeacherFilter && filters.teacherId !== "all") ||
    filters.period !== "all" ||
    filters.sortBy !== "due_asc";

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
              placeholder="Buscar por aluno, título ou descrição..."
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
              onValueChange={(v) => onChange({ ...filters, status: v as ActivityStatusFilter })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enviada">Enviada</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
                <SelectItem value="corrigida">Corrigida</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            {/* Professor (se admin) */}
            {showTeacherFilter && teachers.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Professor</span>
                <Select
                  value={filters.teacherId}
                  onValueChange={(v) => onChange({ ...filters, teacherId: v })}
                >
                  <SelectTrigger className="w-[200px] pl-3 text-left">
                    <SelectValue placeholder="Professor" />
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

            {/* Período */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Período</span>
              <Select
                value={filters.period}
                onValueChange={(v) => onChange({ ...filters, period: v as ActivityPeriodFilter })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Ordenar</span>
              <Select
                value={filters.sortBy}
                onValueChange={(v) => onChange({ ...filters, sortBy: v as ActivitySortBy })}
              >
                <SelectTrigger className="w-[220px] pl-3 text-left">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_asc">Prazo (mais próximo)</SelectItem>
                  <SelectItem value="due_desc">Prazo (mais distante)</SelectItem>
                  <SelectItem value="created_desc">Enviada (mais recente)</SelectItem>
                  <SelectItem value="created_asc">Enviada (mais antiga)</SelectItem>
                  <SelectItem value="student_asc">Aluno (A-Z)</SelectItem>
                  <SelectItem value="student_desc">Aluno (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
