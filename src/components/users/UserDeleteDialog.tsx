import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface UserDeleteDialogInfo {
  displayName: string;
  isArchivedProfile: boolean;
  isHardDelete: boolean;
  userIsInactive: boolean;
  linkedStudent: { id: string } | null | undefined;
  linkedTeacher: { id: string } | null | undefined;
  isStudentActive: boolean;
  isTeacherActive: boolean;
}

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  info: UserDeleteDialogInfo;
  isPending: boolean;
  forceHardDelete: boolean;
  onConfirm: () => void;
}

export function UserDeleteDialog({
  open,
  onOpenChange,
  info,
  isPending,
  forceHardDelete,
  onConfirm,
}: UserDeleteDialogProps) {
  const { displayName, isArchivedProfile, isHardDelete, userIsInactive, linkedStudent, linkedTeacher, isStudentActive, isTeacherActive } = info;

  const title = isArchivedProfile
    ? "Excluir arquivo morto?"
    : isHardDelete
    ? "Excluir definitivamente?"
    : userIsInactive && !forceHardDelete
    ? "Confirmar reativação"
    : "Confirmar arquivamento";

  const description = isArchivedProfile ? (
    <>
      Tem certeza que deseja excluir o arquivo morto do usuário <strong>{displayName}</strong>?
      <br /><br />
      A conta será removida do sistema. O email ficará disponível para reutilização. Esta ação não pode ser desfeita.
    </>
  ) : isHardDelete ? (
    <>
      A conta do usuário <strong>{displayName}</strong> será removida do sistema (Supabase Auth, perfil e vínculos). Esta ação não pode ser desfeita.
    </>
  ) : userIsInactive && !forceHardDelete ? (
    <>
      Tem certeza que deseja reativar o usuário <strong>{displayName}</strong>? Ele voltará a aparecer na lista de usuários ativos.
    </>
  ) : linkedStudent && isStudentActive ? (
    <>
      Tem certeza que deseja arquivar o usuário <strong>{displayName}</strong>? Ele será removido da lista de ativos e aparecerá como aluno inativo.
    </>
  ) : linkedTeacher && isTeacherActive ? (
    <>
      Tem certeza que deseja arquivar o usuário <strong>{displayName}</strong>? Ele será removido da lista de ativos e aparecerá como professor inativo.
    </>
  ) : (
    <>
      Tem certeza que deseja arquivar o usuário <strong>{displayName}</strong>? Esta ação não remove a conta do Supabase Auth, apenas arquiva o usuário no painel.
    </>
  );

  const actionLabel = isArchivedProfile
    ? "Excluir arquivo morto"
    : isHardDelete
    ? "Excluir definitivamente"
    : userIsInactive && !forceHardDelete
    ? "Reativar"
    : "Arquivar";

  const pendingLabel = isHardDelete
    ? "Excluindo..."
    : userIsInactive && !forceHardDelete
    ? "Reativando..."
    : "Arquivando...";

  const isReactivation = userIsInactive && !forceHardDelete;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className={isReactivation ? "" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{pendingLabel}</>
            ) : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
