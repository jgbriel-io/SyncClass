import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const hasActiveFilters =
    filters.status !== primaryStatus ||
    filters.period !== "all" ||
    (showTeacherFilter && filters.teacherId !== "all") ||
    filters.studentId !== "all" ||
    filters.sortBy !== "recent";

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3 flex-wrap">
        <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
          <span className="text-xs font-medium text-muted-foreground">Busca</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="Buscar por nome..."
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
            onValueChange={(v) => onChange({ ...filters, status: v })}
          >
            <SelectTrigger className="w-[130px] pl-3 text-left">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="pl-6">Todos</SelectItem>
              <SelectItem value="ativo" className="pl-6">Ativos</SelectItem>
              <SelectItem value="inativo" className="pl-6">Inativos</SelectItem>
            </SelectContent>
          </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Período</span>
            <Select
              value={filters.period}
            onValueChange={(v) => onChange({ ...filters, period: v as OverviewPeriodFilter })}
          >
            <SelectTrigger className="w-[150px] pl-3 text-left">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="pl-6">Todos</SelectItem>
              <SelectItem value="7" className="pl-6">Últimos 7 dias</SelectItem>
              <SelectItem value="30" className="pl-6">Últimos 30 dias</SelectItem>
              <SelectItem value="90" className="pl-6">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          </div>
          {showTeacherFilter && teachers.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Professores</span>
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
          {students.length > 0 && (
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
          )}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Ordenar</span>
            <Select
              value={filters.sortBy}
              onValueChange={(v) => onChange({ ...filters, sortBy: v as OverviewSortBy })}
            >
              <SelectTrigger className="w-[240px] pl-3 text-left">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent" className="pl-6">Crescimento (mais recentes)</SelectItem>
              <SelectItem value="oldest" className="pl-6">Antigos primeiro</SelectItem>
              <SelectItem value="name_asc" className="pl-6">Nome (A-Z)</SelectItem>
              <SelectItem value="name_desc" className="pl-6">Nome (Z-A)</SelectItem>
            </SelectContent>
          </Select>
          </div>
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
