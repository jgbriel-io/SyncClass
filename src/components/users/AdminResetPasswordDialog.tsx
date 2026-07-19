import { useState } from "react";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { passwordRequirements } from "@/content/auth";
import { UserWithProfile } from "@/hooks/useUsers";

interface AdminResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithProfile | null;
  isPending: boolean;
  onConfirm: (userId: string, password: string) => void;
}

function generateStrongPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%^&*";
  let p = "";
  p += upper.charAt(Math.floor(Math.random() * upper.length));
  p += lower.charAt(Math.floor(Math.random() * lower.length));
  p += numbers.charAt(Math.floor(Math.random() * numbers.length));
  p += special.charAt(Math.floor(Math.random() * special.length));
  const allChars = upper + lower + numbers + special;
  for (let i = 4; i < 12; i++) {
    p += allChars.charAt(Math.floor(Math.random() * allChars.length));
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

export function AdminResetPasswordDialog({
  open,
  onOpenChange,
  user,
  isPending,
  onConfirm,
}: AdminResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setNewPassword("");
      setConfirm("");
    }
  };

  const handleSubmit = () => {
    if (!user) return;
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
    if (newPassword !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    onConfirm(user.id, newPassword);
  };

  const isValid =
    !isPending &&
    newPassword.length >= 8 &&
    newPassword === confirm &&
    PASSWORD_REGEX.upper.test(newPassword) &&
    PASSWORD_REGEX.lower.test(newPassword) &&
    PASSWORD_REGEX.number.test(newPassword) &&
    PASSWORD_REGEX.special.test(newPassword);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
                {passwordRequirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
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
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-password-confirm">Confirmar senha</Label>
                <Input
                  id="reset-password-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  disabled={isPending}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const p = generateStrongPassword();
                  setNewPassword(p);
                  setConfirm(p);
                }}
              >
                Gerar senha
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button disabled={!isValid} onClick={handleSubmit}>
                {isPending ? (
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
