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
import { formatDate } from "@/lib/utils/formatters";
import { useDeleteClassLog, type ClassLogWithStudent } from "@/hooks/useClassLogs";

interface ClassDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classLog: ClassLogWithStudent | null;
  onClose: () => void;
}

export function ClassDeleteDialog({
  open,
  onOpenChange,
  classLog,
  onClose,
}: ClassDeleteDialogProps) {
  const deleteLog = useDeleteClassLog();

  const handleConfirm = () => {
    if (!classLog) return;
    deleteLog.mutate(classLog.id, { onSuccess: onClose });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Tem certeza que deseja excluir o registro de aula de{" "}
                <strong>{classLog?.students?.name}</strong> do dia{" "}
                <strong>{classLog ? formatDate(classLog.class_date) : ""}</strong>?
              </p>
              {classLog?.financial_records?.status === "pago" ? (
                <p className="text-destructive font-medium">
                  Esta aula possui uma cobrança já paga. A exclusão da aula também exclui a
                  cobrança. Deseja excluir mesmo assim?
                </p>
              ) : classLog?.financial_records ? (
                <span className="block text-warning">
                  ⚠️ Esta aula possui uma cobrança vinculada que também será afetada.
                </span>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteLog.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteLog.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteLog.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
