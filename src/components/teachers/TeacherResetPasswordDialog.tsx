import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Teacher } from "@/hooks/useTeachers";

interface TeacherResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
  isPending: boolean;
  onConfirm: (password: string) => void;
}

export function TeacherResetPasswordDialog({
  open,
  onOpenChange,
  teacher,
  isPending,
  onConfirm,
}: TeacherResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setNewPassword("");
      setConfirm("");
    }
  };

  const isValid = !isPending && newPassword.length >= 6 && newPassword === confirm;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir senha do professor</DialogTitle>
          {teacher && (
            <DialogDescription>
              Nova senha para <strong>{teacher.name}</strong>. Mínimo 6 caracteres.
            </DialogDescription>
          )}
        </DialogHeader>
        {teacher && (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="reset-pw-teacher-new">Nova senha</Label>
                <Input
                  id="reset-pw-teacher-new"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-pw-teacher-confirm">Confirmar senha</Label>
                <Input
                  id="reset-pw-teacher-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={6}
                  disabled={isPending}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
                  let p = "";
                  for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
                  setNewPassword(p);
                  setConfirm(p);
                }}
              >
                Gerar senha
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button disabled={!isValid} onClick={() => onConfirm(newPassword)}>
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redefinindo...</>
                ) : "Redefinir senha"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
