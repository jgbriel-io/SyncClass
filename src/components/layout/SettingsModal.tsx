import { useRef, useState, useEffect } from "react";
import { BaseDialog } from "@/components/ui/custom/BaseDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile, useUploadAvatar, useUpdateMyProfile, useResetOwnPassword } from "@/hooks/useUsers";
import { getAvatarLetter } from "@/lib/utils/patterns";
import { AVATAR_MAX_SIZE_BYTES, AVATAR_MAX_PX } from "@/lib/utils/avatarUpload";
import { User, Palette, Loader2, Upload, Trash2, Lock, Eye, EyeOff, Wallet, Download, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isPWAInstalled, isPWAInstallPromptAvailable, showPWAInstallPrompt } from "@/lib/pwa";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_MB = AVATAR_MAX_SIZE_BYTES / (1024 * 1024);

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { data: profile } = useCurrentUserProfile(user?.id);
  const uploadAvatar = useUploadAvatar();
  const updateAvatar = useUpdateMyProfile();
  const resetOwnPassword = useResetOwnPassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const displayName = user?.user_metadata?.full_name ?? profile?.full_name ?? user?.email?.split("@")[0] ?? "";
  const email = user?.email ?? profile?.email ?? "";
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newName, setNewName] = useState(displayName);
  const [newEmail, setNewEmail] = useState(email);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const avatarUrl = profile?.avatar_url ?? "";
  const [pixKey, setPixKey] = useState("");
  const [editingPixKey, setEditingPixKey] = useState(false);
  const [isUpdatingPixKey, setIsUpdatingPixKey] = useState(false);
  const isTeacher = profile?.role === "teacher";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    uploadAvatar.mutate({ userId: user.id, file });
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    if (!user?.id) return;
    updateAvatar.mutate({ userId: user.id, avatar_url: null });
  };

  // Buscar chave PIX do professor
  useEffect(() => {
    if (!profile?.teacher_id || !isTeacher) return;
    
    const fetchPixKey = async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("pix_key")
        .eq("id", profile.teacher_id)
        .maybeSingle();
      
      if (!error && data?.pix_key) {
        setPixKey(data.pix_key);
      }
    };
    
    fetchPixKey();
  }, [profile?.teacher_id, isTeacher]);

  const handleUpdateName = async () => {
    if (!user?.id || !newName.trim()) return;
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName.trim() }
      });
      if (error) throw error;
      
      // Atualiza também no profile
      await supabase
        .from("profiles")
        .update({ full_name: newName.trim() })
        .eq("user_id", user.id);
      
      toast.success("Nome atualizado com sucesso!");
      setEditingName(false);
    } catch (error) {
      toast.error("Erro ao atualizar nome. Tente novamente.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!user?.id || !newEmail.trim()) return;
    const normalizedEmail = newEmail.trim().toLowerCase();
    if (normalizedEmail === email) {
      setEditingEmail(false);
      return;
    }
    
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: normalizedEmail
      });
      if (error) throw error;
      
      toast.success("Email de confirmação enviado! Verifique sua caixa de entrada.");
      setEditingEmail(false);
    } catch (error) {
      toast.error("Erro ao atualizar email. Tente novamente.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePixKey = async () => {
    if (!profile?.teacher_id) return;
    
    setIsUpdatingPixKey(true);
    try {
      const { error } = await supabase
        .from("teachers")
        .update({ pix_key: pixKey.trim() || null })
        .eq("id", profile.teacher_id);
      
      if (error) throw error;
      
      toast.success("Chave PIX atualizada com sucesso!");
      setEditingPixKey(false);
    } catch (error) {
      toast.error("Erro ao atualizar chave PIX. Tente novamente.");
    } finally {
      setIsUpdatingPixKey(false);
    }
  };

  const isPending = uploadAvatar.isPending || updateAvatar.isPending || isUpdatingProfile || isUpdatingPixKey;

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Configurações"
      size="SM"
    >
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="perfil" className="gap-1.5 sm:gap-2">
              <User className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="senha" className="gap-1.5 sm:gap-2">
              <Lock className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Senha</span>
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="gap-1.5 sm:gap-2">
              <Palette className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Preferências</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="perfil" className="space-y-4 pt-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} alt="" />
                <AvatarFallback className="text-xl">{getAvatarLetter(displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2 w-full sm:w-auto">
                <Label>Foto de perfil</Label>
                <p className="text-xs text-muted-foreground">
                  Máx. {MAX_MB} MB, até {AVATAR_MAX_PX}×{AVATAR_MAX_PX} px. JPEG, PNG ou WebP.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                  >
                    {uploadAvatar.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Enviar foto
                      </>
                    )}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={handleRemovePhoto}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover foto
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-name">Nome</Label>
              <div className="flex gap-2">
                <Input
                  id="settings-name"
                  value={editingName ? newName : displayName}
                  onChange={(e) => setNewName(e.target.value)}
                  readOnly={!editingName}
                  className={editingName ? "" : "bg-muted/50"}
                />
                {editingName ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleUpdateName}
                      disabled={isPending || !newName.trim()}
                    >
                      {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingName(false);
                        setNewName(displayName);
                      }}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingName(true)}
                  >
                    Editar
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email</Label>
              <div className="flex gap-2">
                <Input
                  id="settings-email"
                  type="email"
                  value={editingEmail ? newEmail : email}
                  onChange={(e) => setNewEmail(e.target.value)}
                  readOnly={!editingEmail}
                  className={editingEmail ? "" : "bg-muted/50"}
                />
                {editingEmail ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleUpdateEmail}
                      disabled={isPending || !newEmail.trim()}
                    >
                      {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingEmail(false);
                        setNewEmail(email);
                      }}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingEmail(true)}
                  >
                    Editar
                  </Button>
                )}
              </div>
              {editingEmail && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Você receberá um email de confirmação no novo endereço.
                </p>
              )}
            </div>
            {isTeacher && (
              <div className="space-y-2">
                <Label htmlFor="settings-pix-key" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Chave PIX
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="settings-pix-key"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    readOnly={!editingPixKey}
                    placeholder="CPF, email, telefone ou chave aleatória"
                    className={editingPixKey ? "" : "bg-muted/50"}
                  />
                  {editingPixKey ? (
                    <>
                      <Button
                        size="sm"
                        onClick={handleUpdatePixKey}
                        disabled={isPending}
                      >
                        {isUpdatingPixKey ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingPixKey(false);
                          // Restaurar valor original se cancelar
                        }}
                        disabled={isPending}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPixKey(true)}
                    >
                      Editar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta chave será exibida para seus alunos na tela de pagamento.
                </p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="senha" className="space-y-4 pt-4">
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Ao alterar sua senha, sua sessão será encerrada e você precisará fazer login novamente com a nova senha.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha atual</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPassword(v => !v)}
                  aria-label={showCurrentPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(v => !v)}
                  aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-destructive">As senhas não coincidem.</p>
            )}
            <Button
              onClick={() => {
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
              }}
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
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Alterando...
                </>
              ) : (
                "Alterar senha"
              )}
            </Button>
          </TabsContent>
          <TabsContent value="preferencias" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Opções de tema, idioma e notificações em breve.
            </p>
            
            {/* Botão de instalação PWA */}
            {!isPWAInstalled() && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Instalar App
                </Label>
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-sm text-muted-foreground mb-3">
                    Instale o app na sua tela inicial para acesso mais rápido e funcionamento offline.
                  </p>
                  <Button
                    onClick={async () => {
                      if (isPWAInstallPromptAvailable()) {
                        const accepted = await showPWAInstallPrompt();
                        if (accepted) {
                          toast.success("App instalado com sucesso!");
                        }
                      } else {
                        toast.info("Use o menu do navegador para instalar o app");
                      }
                    }}
                    className="w-full"
                    disabled={!isPWAInstallPromptAvailable()}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Instalar App
                  </Button>
                </div>
              </div>
            )}
            
            {isPWAInstalled() && (
              <div className="rounded-lg border bg-success/10 border-success/20 p-3">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">App instalado!</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
    </BaseDialog>
  );
}
