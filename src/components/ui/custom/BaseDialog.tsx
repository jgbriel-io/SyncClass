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
 * 
 * O modal automaticamente adiciona scroll quando o conteúdo
 * excede 90vh (90% da altura da viewport). O header fica fixo
 * e apenas o conteúdo interno tem scroll.
 */
export function BaseDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "SM",
}: BaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={DIALOG_SIZE_MAP[size]}
        aria-describedby={description ? undefined : undefined}
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-4">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="overflow-y-auto flex-1 min-h-0 px-4 pb-4 custom-scrollbar">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
