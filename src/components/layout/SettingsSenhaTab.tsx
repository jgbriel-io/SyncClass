import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useResetOwnPassword } from "@/hooks/useUsers";

export function SettingsSenhaTab() {
  const resetOwnPassword = useResetOwnPassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = () => {
    resetOwnPassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      }
    );
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Ao alterar sua senha, sua sessão será encerrada e você precisará fazer login novamente com a nova senha.
        </p>
      </div>

      {[
        { id: "current-password", label: "Senha atual", value: currentPassword, setter: setCurrentPassword, show: showCurrent, toggleShow: () => setShowCurrent(v => !v), placeholder: "Digite sua senha atual" },
        { id: "new-password", label: "Nova senha", value: newPassword, setter: setNewPassword, show: showNew, toggleShow: () => setShowNew(v => !v), placeholder: "Mínimo 6 caracteres" },
        { id: "confirm-password", label: "Confirmar nova senha", value: confirmPassword, setter: setConfirmPassword, show: showConfirm, toggleShow: () => setShowConfirm(v => !v), placeholder: "Repita a nova senha" },
      ].map(({ id, label, value, setter, show, toggleShow, placeholder }) => (
        <div key={id} className="space-y-2">
          <Label htmlFor={id}>{label}</Label>
          <div className="relative">
            <Input
              id={id}
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={placeholder}
              className="pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={toggleShow}
              aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ))}

      {newPassword && confirmPassword && newPassword !== confirmPassword && (
        <p className="text-sm text-destructive">As senhas não coincidem.</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={
          resetOwnPassword.isPending ||
          !currentPassword ||
          !newPassword ||
          newPassword.length < 6 ||
          newPassword !== confirmPassword
        }
        className="w-full"
      >
        {resetOwnPassword.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Alterando...</>
        ) : (
          "Alterar senha"
        )}
      </Button>
    </div>
  );
}
