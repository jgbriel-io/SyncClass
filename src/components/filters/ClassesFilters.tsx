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

export type ClassStatusFilter = "all" | "em_aberto" | "agendada" | "avaliacao_pendente" | "concluida";
export type ClassPeriodFilter = "all" | "week" | "month" | "3months";
export type ClassTypeFilter = "all" | "pacote" | "individual";

export interface ClassesFiltersState {
  search: string;
  period: ClassPeriodFilter;
  teacherId: string;
  studentId: string;
  classType: ClassTypeFilter;
  status: ClassStatusFilter;
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
          <span className="text-xs font-medium text-muted-foreground">Busca</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou aluno..."
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
              onValueChange={(v) => onChange({ ...filters, status: v as ClassStatusFilter })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em_aberto">Em aberto</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="avaliacao_pendente">Avaliação pendente</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
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
            {/* Professor */}
            {showTeacherFilter && (
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

            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Tipo</span>
              <Select
                value={filters.classType}
                onValueChange={(v) => onChange({ ...filters, classType: v as ClassTypeFilter })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pacote">Pacote</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Período</span>
              <Select
                value={filters.period}
                onValueChange={(v) => onChange({ ...filters, period: v as ClassPeriodFilter })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="3months">3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
