import { useRef, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Trash2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAvatarLetter } from "@/lib/utils/patterns";
import { AVATAR_MAX_SIZE_BYTES, AVATAR_MAX_PX } from "@/lib/utils/avatarUpload";
import { useUploadAvatar, useUpdateMyProfile } from "@/hooks/useUsers";

const MAX_MB = AVATAR_MAX_SIZE_BYTES / (1024 * 1024);

interface SettingsPerfilTabProps {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  teacherId?: string | null;
  isTeacher: boolean;
}

export function SettingsPerfilTab({ userId, displayName, email, avatarUrl, teacherId, isTeacher }: SettingsPerfilTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();
  const updateAvatar = useUpdateMyProfile();

  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [newEmail, setNewEmail] = useState(email);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [editingPixKey, setEditingPixKey] = useState(false);
  const [isUpdatingPixKey, setIsUpdatingPixKey] = useState(false);

  useEffect(() => {
    if (!teacherId || !isTeacher) return;
    supabase.from("teachers").select("pix_key").eq("id", teacherId).maybeSingle().then(({ data, error }) => {
      if (!error && data?.pix_key) setPixKey(data.pix_key);
    });
  }, [teacherId, isTeacher]);

  const isPending = uploadAvatar.isPending || updateAvatar.isPending || isUpdatingProfile || isUpdatingPixKey;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar.mutate({ userId, file });
    e.target.value = "";
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setIsUpdatingProfile(true);
    try {
      await supabase.auth.updateUser({ data: { full_name: newName.trim() } });
      await supabase.from("profiles").update({ full_name: newName.trim() }).eq("user_id", userId);
      toast.success("Nome atualizado com sucesso!");
      setEditingName(false);
    } catch {
      toast.error("Erro ao atualizar nome. Tente novamente.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) return;
    const normalized = newEmail.trim().toLowerCase();
    if (normalized === email) { setEditingEmail(false); return; }
    setIsUpdatingProfile(true);
    try {
      await supabase.auth.updateUser({ email: normalized });
      toast.success("Email de confirmação enviado! Verifique sua caixa de entrada.");
      setEditingEmail(false);
    } catch {
      toast.error("Erro ao atualizar email. Tente novamente.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePixKey = async () => {
    if (!teacherId) return;
    setIsUpdatingPixKey(true);
    try {
      const { error } = await supabase.from("teachers").update({ pix_key: pixKey.trim() || null }).eq("id", teacherId);
      if (error) throw error;
      toast.success("Chave PIX atualizada com sucesso!");
      setEditingPixKey(false);
    } catch {
      toast.error("Erro ao atualizar chave PIX. Tente novamente.");
    } finally {
      setIsUpdatingPixKey(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl || undefined} alt="" />
          <AvatarFallback className="text-xl">{getAvatarLetter(displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 w-full sm:w-auto">
          <Label>Foto de perfil</Label>
          <p className="text-xs text-muted-foreground">Máx. {MAX_MB} MB, até {AVATAR_MAX_PX}×{AVATAR_MAX_PX} px. JPEG, PNG ou WebP.</p>
          <div className="flex flex-wrap gap-2">
            <Input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
              {uploadAvatar.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</> : <><Upload className="h-4 w-4" />Enviar foto</>}
            </Button>
            {avatarUrl && (
              <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => updateAvatar.mutate({ userId, avatar_url: null })} disabled={isPending}>
                <Trash2 className="h-4 w-4" />Remover foto
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="settings-name">Nome</Label>
        <div className="flex gap-2">
          <Input id="settings-name" value={editingName ? newName : displayName} onChange={(e) => setNewName(e.target.value)} readOnly={!editingName} className={editingName ? "" : "bg-muted/50"} />
          {editingName ? (
            <>
              <Button size="sm" onClick={handleUpdateName} disabled={isPending || !newName.trim()}>{isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingName(false); setNewName(displayName); }} disabled={isPending}>Cancelar</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditingName(true)}>Editar</Button>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="settings-email">Email</Label>
        <div className="flex gap-2">
          <Input id="settings-email" type="email" value={editingEmail ? newEmail : email} onChange={(e) => setNewEmail(e.target.value)} readOnly={!editingEmail} className={editingEmail ? "" : "bg-muted/50"} />
          {editingEmail ? (
            <>
              <Button size="sm" onClick={handleUpdateEmail} disabled={isPending || !newEmail.trim()}>{isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingEmail(false); setNewEmail(email); }} disabled={isPending}>Cancelar</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditingEmail(true)}>Editar</Button>
          )}
        </div>
        {editingEmail && <p className="text-xs text-amber-600 dark:text-amber-400">Você receberá um email de confirmação no novo endereço.</p>}
      </div>

      {/* PIX */}
      {isTeacher && (
        <div className="space-y-2">
          <Label htmlFor="settings-pix-key" className="flex items-center gap-2"><Wallet className="h-4 w-4" />Chave PIX</Label>
          <div className="flex gap-2">
            <Input id="settings-pix-key" value={pixKey} onChange={(e) => setPixKey(e.target.value)} readOnly={!editingPixKey} placeholder="CPF, email, telefone ou chave aleatória" className={editingPixKey ? "" : "bg-muted/50"} />
            {editingPixKey ? (
              <>
                <Button size="sm" onClick={handleUpdatePixKey} disabled={isPending}>{isUpdatingPixKey ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingPixKey(false)} disabled={isPending}>Cancelar</Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditingPixKey(true)}>Editar</Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Esta chave será exibida para seus alunos na tela de pagamento.</p>
        </div>
      )}
    </div>
  );
}
