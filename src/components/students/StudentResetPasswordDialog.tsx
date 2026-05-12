import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useResetPassword } from "@/hooks/useUsers";
import type { Student } from "@/hooks/useStudents";
import { generateRandomPassword } from "@/hooks/inviteUserService";

interface StudentResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  /** Chamado com a nova senha após sucesso, para exibir no PasswordDisplayDialog */
  onSuccess: (password: string) => void;
}

export function StudentResetPasswordDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: StudentResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const resetPassword = useResetPassword();

  const handleClose = () => {
    onOpenChange(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const isPasswordValid =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /[0-9]/.test(newPassword) &&
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

  const handleSubmit = () => {
    if (newPassword.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error("A senha deve conter pelo menos uma letra maiúscula.");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error("A senha deve conter pelo menos uma letra minúscula.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error("A senha deve conter pelo menos um número.");
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      toast.error("A senha deve conter pelo menos um caractere especial.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    if (!student) return;
    const passwordToShow = newPassword;

    resetPassword.mutate(
      { studentId: student.id, password: newPassword },
      {
        onSuccess: () => {
          handleClose();
          onSuccess(passwordToShow);
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir senha do aluno</DialogTitle>
          {student && (
            <DialogDescription>
              Nova senha para <strong>{student.name}</strong>.
            </DialogDescription>
          )}
        </DialogHeader>

        {student && (
          <>
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2 mb-4">
              <p className="text-xs font-medium text-muted-foreground">Requisitos da senha:</p>
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
                onClick={() => {
                  // Usa generateRandomPassword do service para consistência
                  const p = generateRandomPassword(12);
                  setNewPassword(p);
                  setConfirmPassword(p);
                }}
              >
                Gerar senha
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                disabled={
                  resetPassword.isPending ||
                  !isPasswordValid ||
                  newPassword !== confirmPassword
                }
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
