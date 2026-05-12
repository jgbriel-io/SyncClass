import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useResetPassword } from "@/hooks/useUsers";
import type { UserWithProfile } from "@/hooks/useUsers";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithProfile | null;
  /** Chamado com a senha definida após sucesso, para exibir o PasswordDisplayDialog. */
  onSuccess: (password: string) => void;
}

function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%^&*";
  const all = upper + lower + numbers + special;

  let p = "";
  p += upper.charAt(Math.floor(Math.random() * upper.length));
  p += lower.charAt(Math.floor(Math.random() * lower.length));
  p += numbers.charAt(Math.floor(Math.random() * numbers.length));
  p += special.charAt(Math.floor(Math.random() * special.length));
  for (let i = 4; i < 12; i++) {
    p += all.charAt(Math.floor(Math.random() * all.length));
  }
  return p
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

const PASSWORD_REGEX = {
  upper: /[A-Z]/,
  lower: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
};

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const resetPassword = useResetPassword();

  const handleClose = () => {
    onOpenChange(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleGenerate = () => {
    const p = generateStrongPassword();
    setNewPassword(p);
    setConfirmPassword(p);
  };

  const isValid =
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    PASSWORD_REGEX.upper.test(newPassword) &&
    PASSWORD_REGEX.lower.test(newPassword) &&
    PASSWORD_REGEX.number.test(newPassword) &&
    PASSWORD_REGEX.special.test(newPassword);

  const handleSubmit = () => {
    if (newPassword.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (!PASSWORD_REGEX.upper.test(newPassword)) {
      toast.error("A senha deve conter pelo menos uma letra maiúscula.");
      return;
    }
    if (!PASSWORD_REGEX.lower.test(newPassword)) {
      toast.error("A senha deve conter pelo menos uma letra minúscula.");
      return;
    }
    if (!PASSWORD_REGEX.number.test(newPassword)) {
      toast.error("A senha deve conter pelo menos um número.");
      return;
    }
    if (!PASSWORD_REGEX.special.test(newPassword)) {
      toast.error("A senha deve conter pelo menos um caractere especial.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    resetPassword.mutate(
      { userId: user!.id, password: newPassword },
      {
        onSuccess: () => {
          const passwordToShow = newPassword;
          handleClose();
          onSuccess(passwordToShow);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          {user && (
            <DialogDescription>
              Nova senha para{" "}
              <strong>{user.profile?.full_name ?? user.email}</strong>.
            </DialogDescription>
          )}
        </DialogHeader>
        {user && (
          <>
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2 mb-4">
              <p className="text-xs font-medium text-muted-foreground">
                Requisitos da senha:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Mínimo de 8 caracteres</li>
                <li>Pelo menos uma letra maiúscula (A-Z)</li>
                <li>Pelo menos uma letra minúscula (a-z)</li>
                <li>Pelo menos um número (0-9)</li>
                <li>Pelo menos um caractere especial (!@#$%^&*)</li>
              </ul>
            </div>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reset-password-new">Nova senha</Label>
                <Input
                  id="reset-password-new"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  disabled={resetPassword.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-password-confirm">Confirmar senha</Label>
                <Input
                  id="reset-password-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  disabled={resetPassword.isPending}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerate}
              >
                Gerar senha
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                disabled={resetPassword.isPending || !isValid}
                onClick={handleSubmit}
              >
                {resetPassword.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
