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

export type ClassStatusFilter = "all" | "agendada" | "avaliacao_pendente" | "concluida";
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
    filters.status !== "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou aluno..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {showTeacherFilter && (
            <Select
              value={filters.teacherId}
              onValueChange={(v) => onChange({ ...filters, teacherId: v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os professores</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name || "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={filters.status}
            onValueChange={(v) => onChange({ ...filters, status: v as ClassStatusFilter })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="agendada">Agendada</SelectItem>
              <SelectItem value="avaliacao_pendente">Avaliação pendente</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
            </SelectContent>
          </Select>
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
          {hasActiveFilters && onReset && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-9">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
