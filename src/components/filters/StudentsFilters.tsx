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

export type StudentStatusFilter = "all" | "ativo" | "inativo";
export type StudentSortBy = "name_asc" | "name_desc" | "last_payment_desc" | "last_payment_asc";
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
  primaryStatus = "ativo",
}: StudentsFiltersProps) {
  const hasActiveFilters =
    filters.filterPreset !== "all" ||
    filters.status !== primaryStatus ||
    (showTeacherFilter && filters.teacherId !== "all") ||
    filters.sortBy !== "name_asc";

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.filterPreset}
            onValueChange={(v) => onChange({ ...filters, filterPreset: v as StudentFilterPreset })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Ver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="aniversariantes">Aniversariantes do mês</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(v) => onChange({ ...filters, status: v as StudentStatusFilter })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
          {showTeacherFilter && !autoTeacherId && (
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
          )}
          <Select
            value={filters.sortBy}
            onValueChange={(v) => onChange({ ...filters, sortBy: v as StudentSortBy })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
              <SelectItem value="last_payment_desc">Último pagamento (mais recente)</SelectItem>
              <SelectItem value="last_payment_asc">Último pagamento (mais antigo)</SelectItem>
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
