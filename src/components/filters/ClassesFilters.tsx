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

export type ClassStatusFilter = "all" | "em_aberto" | "agendada" | "avaliacao_pendente" | "concluida";
export type ClassPeriodFilter = "all" | "week" | "month" | "3months";

export interface ClassesFiltersState {
  search: string;
  period: ClassPeriodFilter;
  teacherId: string;
  status: ClassStatusFilter;
}

interface Teacher {
  id: string;
  name: string | null;
}

interface ClassesFiltersProps {
  filters: ClassesFiltersState;
  onChange: (f: ClassesFiltersState) => void;
  onReset?: () => void;
  teachers: Teacher[];
  showTeacherFilter?: boolean;
}

export function ClassesFilters({
  filters,
  onChange,
  onReset,
  teachers,
  showTeacherFilter = true,
}: ClassesFiltersProps) {
  const hasActiveFilters =
    filters.period !== "all" ||
    (showTeacherFilter && filters.teacherId !== "all") ||
    filters.status !== "em_aberto";

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3 flex-wrap">
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
        <div className="flex flex-wrap items-end gap-2">
          {showTeacherFilter && (
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
