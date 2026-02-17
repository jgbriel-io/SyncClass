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
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.role !== "all" ||
    filters.status !== primaryStatus ||
    filters.sortBy !== "created_desc";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      {/* Linha 1: Busca + Filtros Básicos + Botão Mais Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        {/* Busca */}
        <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
          <span className="text-xs font-medium text-muted-foreground">Busca</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {/* Filtros Básicos + Botões */}
        <div className="flex flex-wrap items-end gap-2">
          {/* Privilégio */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Privilégio</span>
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
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
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
                <SelectItem value="inactive">Arquivados</SelectItem>
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
            {/* Ordenar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Ordenar</span>
              <Select
                value={filters.sortBy}
                onValueChange={(v) => onChange({ ...filters, sortBy: v as UserSortBy })}
              >
                <SelectTrigger className="w-[220px] pl-3 text-left">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">Cadastro (mais recente)</SelectItem>
                  <SelectItem value="created_asc">Cadastro (mais antigo)</SelectItem>
                  <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
