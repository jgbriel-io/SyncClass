import { useRef, useState } from "react";
import { Eye, EyeSlash as EyeOff, Copy, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface GeneratedPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  source: "create" | "reset" | null;
}

export function GeneratedPasswordDialog({
  open,
  onOpenChange,
  password,
  source,
}: GeneratedPasswordDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (!password) return;
    const onSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    const tryInputCopy = () => {
      const input = inputRef.current;
      if (input) {
        input.focus();
        input.select();
        input.setSelectionRange(0, password.length);
        if (document.execCommand("copy")) onSuccess();
        else toast.error("Não foi possível copiar. Copie a senha manualmente.");
      } else {
        toast.error("Não foi possível copiar. Copie a senha manualmente.");
      }
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(password)
        .then(onSuccess)
        .catch(tryInputCopy);
    } else {
      tryInputCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {source === "reset"
              ? "Senha redefinida"
              : "Senha criada para o usuário"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Guarde esta senha com segurança. Ela não será exibida novamente.
          </p>
          <div className="space-y-2">
            <Label>Senha temporária</Label>
            <div className="relative">
              <Input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                readOnly
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-between gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar senha
                </>
              )}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
