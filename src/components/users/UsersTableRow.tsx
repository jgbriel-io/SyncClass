import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  KeyRound,
  Shield,
  User,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAvatarLetter } from "@/lib/utils/patterns";
import type { UserWithProfile } from "@/hooks/useUsers";
import {
  CELL_BASE,
  STICKY_CELL,
  STICKY_SHADOW,
  getXLColumnClasses,
} from "@/lib/design-tokens/table-columns";
import { COL } from "./UsersTableRow.constants";

interface Student {
  id: string;
  name: string;
  status: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface UsersTableRowProps {
  user: UserWithProfile;
  students: Student[];
  teachers: Teacher[];
  onViewDetail: (userId: string) => void;
  onEdit: (user: UserWithProfile) => void;
  onResetPassword: (user: UserWithProfile) => void;
  onReactivateStudent: (studentId: string) => void;
  onReactivateTeacher: (teacherId: string) => void;
  onDelete: (user: UserWithProfile) => void;
  onHardDelete: (user: UserWithProfile) => void;
  getRoleLabel: (role: string | null) => string;
  getRoleVariant: (role: string | null) => "default" | "success" | "warning" | "destructive" | "info";
}

export function UsersTableRow({
  user,
  students,
  teachers,
  onViewDetail,
  onEdit,
  onResetPassword,
  onReactivateStudent,
  onReactivateTeacher,
  onDelete,
  onHardDelete,
  getRoleLabel,
  getRoleVariant,
}: UsersTableRowProps) {
  const linkedStudent = user.profile?.student_id
    ? students.find((s) => s.id === user.profile?.student_id)
    : null;
  const linkedTeacher = user.profile?.teacher_id
    ? teachers.find((t) => t.id === user.profile.teacher_id)
    : null;

  const storedRole = (user.role?.role ?? user.profile?.role) as string | null ?? null;
  const role = storedRole === "admin"
    ? "admin"
    : storedRole === "teacher"
    ? "teacher"
    : storedRole === "student"
    ? "student"
    : linkedTeacher
    ? "teacher"
    : linkedStudent
    ? "student"
    : storedRole;

  const displayName = (user.profile?.full_name || "").trim() || "(sem nome)";
  const avatarLetter = getAvatarLetter(displayName);
  const subtitle = user.email || getRoleLabel(role);
  const isActive = user.profile?.active ?? true;
  const lastUpdatedAt = user.profile?.updated_at;

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      {/* Status Badge */}
      <td className="px-2 py-2 align-middle whitespace-nowrap" style={{ width: '1%' }}>
        <StatusBadge variant={isActive ? "success" : "default"}>
          {isActive ? "Ativo" : "Inativo"}
        </StatusBadge>
      </td>

      {/* Usuário — sticky XL */}
      <td
        className={`${CELL_BASE} ${STICKY_CELL} ${getXLColumnClasses()}`}
        style={STICKY_SHADOW}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          {user.profile?.avatar_url ? (
            <img
              src={user.profile.avatar_url}
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-accent-foreground">
                {avatarLetter}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" title={displayName}>
              {displayName}
            </p>
            {subtitle && (
              <p className="text-xs mobile:text-[11px] tablet:text-[11px] laptop:text-[11px] text-muted-foreground mt-0.5 truncate" title={subtitle}>
                {subtitle}
              </p>
            )}
            {!isActive && (
              <p className="text-xs text-amber-600">
                Conta arquivada
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Privilégio */}
      <td className={CELL_BASE} style={{ width: COL.PRIVILEGIO, minWidth: COL.PRIVILEGIO }}>
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge variant={getRoleVariant(role)} className="justify-start">
            {getRoleLabel(role)}
          </StatusBadge>
          {!isActive && (
            <span className="text-xs text-muted-foreground">
              Arquivado
            </span>
          )}
        </div>
      </td>

      {/* Vínculo */}
      <td className={`${CELL_BASE} hidden lg:table-cell`} style={{ width: COL.VINCULO, minWidth: COL.VINCULO }}>
        {linkedStudent || linkedTeacher || role === "admin" ? (
          <div className="flex flex-col gap-1">
            {linkedStudent && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs truncate" title={`Aluno: ${linkedStudent.name}`}>Aluno: {linkedStudent.name}</span>
              </div>
            )}
            {linkedTeacher && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs truncate" title={`Professor: ${linkedTeacher.name}`}>Professor: {linkedTeacher.name}</span>
              </div>
            )}
            {role === "admin" && !linkedStudent && !linkedTeacher && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs truncate" title={`Admin: ${displayName}`}>Admin: {displayName}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Cadastro */}
      <td className={`${CELL_BASE} hidden md:table-cell`} style={{ width: COL.CADASTRO, minWidth: COL.CADASTRO }}>
        <div className="flex flex-col text-xs text-muted-foreground">
          <span className="truncate">
            {user.created_at
              ? `Criado em ${format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}`
              : "—"}
          </span>
          {lastUpdatedAt && (
            <span className="mt-0.5 truncate">
              {`Editado em ${format(new Date(lastUpdatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
            </span>
          )}
        </div>
      </td>

      {/* Placeholder - S (coluna vazia) */}
      <td className={CELL_BASE} style={{ width: COL.PLACEHOLDER, minWidth: COL.PLACEHOLDER }}>
        {/* Espaço reservado */}
      </td>

      {/* Ações */}
      <td className={CELL_BASE} style={{ width: COL.ACOES, minWidth: COL.ACOES }}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetail(user.id)} title="Ver detalhes">
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                <KeyRound className="h-4 w-4 mr-2" />
                Redefinir senha
              </DropdownMenuItem>
              <DropdownMenuItem
                className={
                  isActive
                    ? "text-destructive focus:text-destructive"
                    : "focus:text-primary"
                }
                onClick={() => onDelete(user)}
              >
                {isActive ? (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Arquivar usuário
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Reativar usuário
                  </>
                )}
              </DropdownMenuItem>
              {!isActive && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onHardDelete(user)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {!user.profile?.student_id && !user.profile?.teacher_id 
                    ? "Excluir arquivo morto" 
                    : "Excluir definitivamente"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
