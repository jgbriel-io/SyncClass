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
import { Loader2 } from "lucide-react";
import { useUpdateStudent, useHardDeleteStudent, type Student } from "@/hooks/useStudents";

// ─── Archive / Reactivate Dialog ─────────────────────────────────────────────

interface StudentArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onClose: () => void;
}

export function StudentArchiveDialog({
  open,
  onOpenChange,
  student,
  onClose,
}: StudentArchiveDialogProps) {
  const updateStudent = useUpdateStudent();
  const isActive = student?.status === "ativo";

  const handleConfirm = () => {
    if (!student) return;
    updateStudent.mutate(
      { id: student.id, status: isActive ? "inativo" : "ativo" },
      { onSuccess: onClose }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? "Confirmar arquivamento" : "Confirmar reativação"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive ? (
              <>
                Tem certeza que deseja arquivar o aluno{" "}
                <strong>{student?.name}</strong>?
                <br />
                <br />
                <strong>Importante:</strong> O histórico de aulas e cobranças será{" "}
                <strong>preservado</strong>. O aluno apenas não aparecerá mais nas listagens
                ativas.
              </>
            ) : (
              <>
                Tem certeza que deseja reativar o aluno{" "}
                <strong>{student?.name}</strong>? Ele voltará para a lista de ativos e terá o
                acesso reativado.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateStudent.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={updateStudent.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {updateStudent.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isActive ? "Arquivando..." : "Reativando..."}
              </>
            ) : isActive ? (
              "Arquivar"
            ) : (
              "Reativar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Hard Delete Dialog ───────────────────────────────────────────────────────

interface StudentHardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onClose: () => void;
}

export function StudentHardDeleteDialog({
  open,
  onOpenChange,
  student,
  onClose,
}: StudentHardDeleteDialogProps) {
  const hardDeleteStudent = useHardDeleteStudent();

  const handleConfirm = () => {
    if (!student) return;
    hardDeleteStudent.mutate(student.id, { onSuccess: onClose });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir definitivamente?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir definitivamente o aluno{" "}
            <strong>{student?.name}</strong>?
            <br />
            <br />
            <strong className="text-destructive">Atenção:</strong> Todo o histórico de aulas e
            cobranças deste aluno será <strong>permanentemente removido</strong>. Esta ação não
            pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={hardDeleteStudent.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={hardDeleteStudent.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {hardDeleteStudent.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir definitivamente"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
