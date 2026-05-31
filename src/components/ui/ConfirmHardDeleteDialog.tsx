import type { ReactNode } from "react";
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
import { common } from "@/content";

interface ConfirmHardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: ReactNode;
  confirmLabel: string;
  loadingLabel: string;
  isPending: boolean;
  onConfirm: () => void;
  warningLabel?: string;
  warning?: string;
}

export function ConfirmHardDeleteDialog({
  open,
  onOpenChange,
  title = "Excluir definitivamente?",
  description,
  confirmLabel,
  loadingLabel,
  isPending,
  onConfirm,
  warningLabel,
  warning,
}: ConfirmHardDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {description}
              {warning && (
                <>
                  <br />
                  <br />
                  {warningLabel && (
                    <strong className="text-destructive">
                      {warningLabel}{" "}
                    </strong>
                  )}
                  {warning}
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {common.actions.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
