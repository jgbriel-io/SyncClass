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

export type UserRoleFilter = "all" | "admin" | "teacher" | "student";
export type UserStatusFilter = "all" | "active" | "inactive";
export type UserSortBy = "created_desc" | "created_asc" | "name_asc" | "name_desc";

export interface UsersFiltersState {
  search: string;
  role: UserRoleFilter;
  status: UserStatusFilter;
  sortBy: UserSortBy;
}

interface UsersFiltersProps {
  filters: UsersFiltersState;
  onChange: (f: UsersFiltersState) => void;
  onReset?: () => void;
  /** Status principal - quando ativos, não mostra botão Limpar */
  primaryStatus?: "active";
}

export function UsersFilters({ filters, onChange, onReset, primaryStatus = "active" }: UsersFiltersProps) {
  const hasActiveFilters =
    filters.role !== "all" ||
    filters.status !== primaryStatus ||
    filters.sortBy !== "created_desc";

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.role}
            onValueChange={(v) => onChange({ ...filters, role: v as UserRoleFilter })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Privilégio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teacher">Professor</SelectItem>
              <SelectItem value="student">Aluno</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(v) => onChange({ ...filters, status: v as UserStatusFilter })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortBy}
            onValueChange={(v) => onChange({ ...filters, sortBy: v as UserSortBy })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Cadastro (mais recente)</SelectItem>
              <SelectItem value="created_asc">Cadastro (mais antigo)</SelectItem>
              <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
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
