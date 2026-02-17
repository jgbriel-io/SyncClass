import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DIALOG_SIZE_MAP, type DialogSize } from "@/lib/design-tokens/modal-sizes";

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: DialogSize;
  /** Se true, adiciona max-height e overflow para dialogs com muito conteúdo */
  scrollable?: boolean;
}

/**
 * Componente base para todos os Dialogs (modais centrais)
 * 
 * Centraliza a estrutura do Dialog do shadcn/ui e garante
 * consistência visual entre todos os modais de formulário/ação.
 * 
 * Tamanhos disponíveis:
 * - SM (448px): Formulários simples
 * - MD (512px): Formulários médios
 * - LG (672px): Formulários complexos
 */
export function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "SM",
  scrollable = false,
}: BaseDialogProps) {
  const scrollClass = scrollable ? "max-h-[90vh] overflow-y-auto" : "";
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${DIALOG_SIZE_MAP[size]} ${scrollClass}`}
        aria-describedby={description ? undefined : undefined}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
