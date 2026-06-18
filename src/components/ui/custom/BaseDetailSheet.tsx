import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarCircle } from "@/components/ui/avatar-circle";
import {
  SHEET_SIZE_MAP,
  type SheetSize,
} from "@/lib/design-tokens/modal-sizes";

interface BaseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  size?: SheetSize;
  avatarUrl?: string | null;
  /** Se true, não usa ScrollArea (útil quando o conteúdo já tem scroll próprio) */
  noScroll?: boolean;
}

/**
 * Componente base para todos os Detail Sheets (modais laterais)
 *
 * Centraliza a estrutura do Sheet do shadcn/ui e garante
 * consistência visual entre todos os modais de visualização.
 *
 * Tamanhos disponíveis:
 * - DEFAULT (512px): Visualização padrão
 * - LG (640px): Visualização média
 * - XL (672px): Visualização completa
 * - FULL (100%): Largura total
 */
export function BaseDetailSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  size = "DEFAULT",
  avatarUrl,
  noScroll = false,
}: BaseDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={`w-full ${SHEET_SIZE_MAP[size]} p-0 flex flex-col overflow-hidden`}
      >
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-xl font-semibold text-left">
            <div className="flex items-center gap-3">
              {avatarUrl !== undefined && (
                <AvatarCircle name={title} avatarUrl={avatarUrl} size="LG" />
              )}
              <div className="space-y-1 min-w-0">
                <p className="font-semibold truncate">{title}</p>
                {subtitle && (
                  <div className="text-sm font-normal">{subtitle}</div>
                )}
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {noScroll ? (
          <div className="flex-1 overflow-auto">{children}</div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">{children}</div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
