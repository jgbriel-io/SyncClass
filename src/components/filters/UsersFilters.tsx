import { useState } from "react";
import {
  MagnifyingGlass as Search,
  X,
  FunnelSimple as Filter,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
} from "@phosphor-icons/react";
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

export type UserRoleFilter = "all" | "admin" | "teacher" | "student";
export type UserStatusFilter = "all" | "active" | "inactive";
export type UserSortBy =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc";

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

export function UsersFilters({
  filters,
  onChange,
  onReset,
  primaryStatus = "active",
}: UsersFiltersProps) {
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
          <span className="text-xs font-medium text-muted-foreground">
            {filtersContent.users.labels.search}
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
          {/* Privilégio */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {filtersContent.users.labels.privilege}
            </span>
            <Select
              value={filters.role}
              onValueChange={(v) =>
                onChange({ ...filters, role: v as UserRoleFilter })
              }
            >
              <SelectTrigger className="w-full tablet:w-[140px]">
                <SelectValue placeholder={common.placeholders.privilege} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {filtersContent.users.privilege.all}
                </SelectItem>
                <SelectItem value="admin">
                  {filtersContent.users.privilege.admin}
                </SelectItem>
                <SelectItem value="teacher">
                  {filtersContent.users.privilege.teacher}
                </SelectItem>
                <SelectItem value="student">
                  {filtersContent.users.privilege.student}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {filtersContent.users.labels.status}
            </span>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                onChange({ ...filters, status: v as UserStatusFilter })
              }
            >
              <SelectTrigger className="w-full tablet:w-[130px]">
                <SelectValue placeholder={common.placeholders.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {filtersContent.users.status.all}
                </SelectItem>
                <SelectItem value="active">
                  {filtersContent.users.status.active}
                </SelectItem>
                <SelectItem value="inactive">
                  {filtersContent.users.status.inactive}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            {/* Ordenar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {filtersContent.users.labels.sort}
              </span>
              <Select
                value={filters.sortBy}
                onValueChange={(v) =>
                  onChange({ ...filters, sortBy: v as UserSortBy })
                }
              >
                <SelectTrigger className="w-full tablet:w-[220px] pl-3 text-left">
                  <SelectValue placeholder={common.placeholders.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_desc">
                    {filtersContent.users.sort.createdDesc}
                  </SelectItem>
                  <SelectItem value="created_asc">
                    {filtersContent.users.sort.createdAsc}
                  </SelectItem>
                  <SelectItem value="name_asc">
                    {filtersContent.users.sort.nameAsc}
                  </SelectItem>
                  <SelectItem value="name_desc">
                    {filtersContent.users.sort.nameDesc}
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
