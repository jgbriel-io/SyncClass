import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableRow, TableCell } from "@/components/ui/table";
import { MoreHorizontal, Pencil, Trash2, Check, KeyRound } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Teacher {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface TeachersTableRowProps {
  teacher: Teacher;
  onEdit: (teacher: Teacher) => void;
  onResetPassword: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onHardDelete?: (teacher: Teacher) => void;
}

export function TeachersTableRow({
  teacher,
  onEdit,
  onResetPassword,
  onDelete,
  onHardDelete,
}: TeachersTableRowProps) {
  const status = teacher.status ?? "ativo";
  const lastUpdatedAt = teacher.updated_at;

  return (
    <TableRow>
      {/* Nome */}
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-xs">
            {teacher.name}
          </span>
          {lastUpdatedAt && (
            <span className="text-xs text-muted-foreground mt-0.5">
              {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
            </span>
          )}
        </div>
      </TableCell>

      {/* Email */}
      <TableCell>
        <span className="text-xs">{teacher.email || "—"}</span>
      </TableCell>

      {/* Telefone */}
      <TableCell>
        <span className="text-xs">{teacher.phone || "—"}</span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <StatusBadge
          variant={
            status === "inativo" ? "default" : "success"
          }
        >
          {status === "inativo" ? "Inativo" : "Ativo"}
        </StatusBadge>
      </TableCell>

      {/* Ações */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(teacher)}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onResetPassword(teacher)}>
              <KeyRound className="h-4 w-4 mr-2" />
              Redefinir senha
            </DropdownMenuItem>
            <DropdownMenuItem
              className={
                status === "ativo"
                  ? "text-destructive focus:text-destructive"
                  : "focus:text-primary"
              }
              onClick={() => onDelete(teacher)}
            >
              {status === "ativo" && (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {status === "ativo" ? "Arquivar" : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Reativar professor
                </>
              )}
            </DropdownMenuItem>
            {status === "inativo" && onHardDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onHardDelete(teacher)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir definitivamente
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
