import { useState, type ReactNode } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { common } from "@/content";

interface ConfirmHardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  titleClassName?: string;
  description: ReactNode;
  confirmLabel: string;
  loadingLabel: string;
  isPending: boolean;
  onConfirm: () => void;
  warningLabel?: string;
  warning?: string;
  checkboxLabel?: string;
}

export function ConfirmHardDeleteDialog({
  open,
  onOpenChange,
  title = "Excluir definitivamente?",
  titleClassName = "text-destructive",
  description,
  confirmLabel,
  loadingLabel,
  isPending,
  onConfirm,
  warningLabel,
  warning,
  checkboxLabel,
}: ConfirmHardDeleteDialogProps) {
  const [checked, setChecked] = useState(false);

  const handleOpenChange = (v: boolean) => {
    if (!v) setChecked(false);
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={titleClassName}>
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
        {checkboxLabel && (
          <div className="flex items-center gap-2 py-1">
            <Checkbox
              id="hard-delete-confirm"
              checked={checked}
              onCheckedChange={(v) => setChecked(!!v)}
            />
            <Label
              htmlFor="hard-delete-confirm"
              className="text-sm font-medium cursor-pointer"
            >
              {checkboxLabel}
            </Label>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {common.actions.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending || (checkboxLabel != null && !checked)}
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
