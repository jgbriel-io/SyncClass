import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StudentPixPaymentBoxProps {
  pixKey: string;
  className?: string;
}

/** Caixa de pagamento PIX: chave copia e cola. Sem integração automática; professor confirma na plataforma. */
export function StudentPixPaymentBox({ pixKey, className }: StudentPixPaymentBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      toast.success("Chave PIX copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <Card className={cn("p-4 border-primary/30 bg-primary/5", className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Pagar com PIX</h3>
          <p className="text-xs text-muted-foreground">
            Use a chave abaixo no app do seu banco. Após pagar, envie o comprovante ao professor para que o status seja atualizado.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Chave PIX (copia e cola)</label>
        <div className="flex gap-2">
          <Input
            readOnly
            value={pixKey}
            className="font-mono text-sm bg-muted/50"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
            aria-label="Copiar chave PIX"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
        O pagamento não é confirmado automaticamente. Após realizar o PIX, envie o comprovante ao seu professor para que ele confirme na plataforma.
      </p>
    </Card>
  );
}
