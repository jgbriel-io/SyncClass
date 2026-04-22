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
import { Teacher } from "@/hooks/useTeachers";
import { toast } from "sonner";

interface TeacherHardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
  isPending: boolean;
  onConfirm: (force: boolean) => void;
}

export function TeacherHardDeleteDialog({
  open,
  onOpenChange,
  teacher,
  isPending,
  onConfirm,
}: TeacherHardDeleteDialogProps) {
  const handleConfirm = () => {
    onConfirm(false);
  };

  // Chamado pelo Teachers.tsx quando o mutate retorna erro de aulas agendadas
  // Exposto via onConfirm(false) — o parent trata o erro e chama onConfirm(true) se necessário

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">⚠️ EXCLUSÃO PERMANENTE</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir definitivamente o professor{" "}
            <strong>{teacher?.name}</strong>?
            <br /><br />
            <strong className="text-destructive">Atenção:</strong> Todo o histórico de aulas
            deste professor será <strong>permanentemente removido</strong>. Esta ação não
            pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</>
            ) : "Excluir definitivamente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
